/**
 * Cache Busting and Asset Versioning System
 * Implements comprehensive versioning strategy for static assets
 * with build system integration and automatic hash generation
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Asset versioning configuration
 */
export const VERSIONING_CONFIG = {
  // Hash algorithm for content-based versioning
  hashAlgorithm: 'sha256',
  hashLength: 16,
  
  // File patterns for different versioning strategies
  patterns: {
    // Content-based hashing for static assets
    contentHash: [
      '**/*.js',
      '**/*.css',
      '**/*.woff2',
      '**/*.woff',
      '**/*.ttf',
      '**/*.png',
      '**/*.jpg',
      '**/*.jpeg',
      '**/*.gif',
      '**/*.svg',
      '**/*.webp'
    ],
    
    // Timestamp-based for HTML and dynamic content
    timestamp: [
      '**/*.html',
      '**/manifest.json',
      '**/sw.js'
    ],
    
    // Version-based for API endpoints
    version: [
      '/api/**/*'
    ]
  },
  
  // Cache busting query parameter
  queryParam: 'v',
  
  // File extensions to process
  processExtensions: ['.js', '.css', '.html', '.json'],
  
  // Directories to process
  sourceDirs: [
    'src',
    'public',
    'dist'
  ],
  
  // Output manifest file
  manifestFile: 'asset-manifest.json'
};

/**
 * Asset Version Manager
 * Handles creation and management of asset versions for cache busting
 */
export class AssetVersionManager {
  constructor(options = {}) {
    this.config = { ...VERSIONING_CONFIG, ...options };
    this.assetManifest = new Map();
    this.buildTime = Date.now();
    this.buildVersion = this.generateBuildVersion();
  }

  /**
   * Generate build version identifier
   */
  generateBuildVersion() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hash = crypto.randomBytes(4).toString('hex');
    return `${timestamp}-${hash}`;
  }

  /**
   * Generate content hash for file
   */
  async generateContentHash(filePath) {
    try {
      const content = await fs.readFile(filePath);
      const hash = crypto.createHash(this.config.hashAlgorithm);
      hash.update(content);
      return hash.digest('hex').substring(0, this.config.hashLength);
    } catch (error) {
      console.warn(`[Versioning] Failed to hash file ${filePath}:`, error.message);
      return this.generateFallbackHash(filePath);
    }
  }

  /**
   * Generate fallback hash based on file stats
   */
  generateFallbackHash(filePath) {
    const hash = crypto.createHash('md5');
    hash.update(filePath + this.buildTime);
    return hash.digest('hex').substring(0, this.config.hashLength);
  }

  /**
   * Generate version for asset based on strategy
   */
  async generateAssetVersion(filePath, strategy = 'contentHash') {
    switch (strategy) {
      case 'contentHash':
        return await this.generateContentHash(filePath);
      
      case 'timestamp':
        return this.buildTime.toString();
      
      case 'version':
        return this.buildVersion;
      
      case 'hybrid':
        const contentHash = await this.generateContentHash(filePath);
        return `${contentHash}-${this.buildTime}`;
      
      default:
        return await this.generateContentHash(filePath);
    }
  }

  /**
   * Determine versioning strategy for file
   */
  getVersioningStrategy(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Check content hash patterns
    if (this.matchesPatterns(relativePath, this.config.patterns.contentHash)) {
      return 'contentHash';
    }
    
    // Check timestamp patterns
    if (this.matchesPatterns(relativePath, this.config.patterns.timestamp)) {
      return 'timestamp';
    }
    
    // Check version patterns
    if (this.matchesPatterns(relativePath, this.config.patterns.version)) {
      return 'version';
    }
    
    // Default to content hash
    return 'contentHash';
  }

  /**
   * Check if file matches any of the given patterns
   */
  matchesPatterns(filePath, patterns) {
    return patterns.some(pattern => {
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\./g, '\\.');
      return new RegExp(`^${regexPattern}$`).test(filePath);
    });
  }

  /**
   * Process single file for versioning
   */
  async processFile(filePath, outputDir = null) {
    const strategy = this.getVersioningStrategy(filePath);
    const version = await this.generateAssetVersion(filePath, strategy);
    const ext = path.extname(filePath);
    const basename = path.basename(filePath, ext);
    const dirname = path.dirname(filePath);
    
    // Generate versioned filename
    const versionedFilename = `${basename}-${version}${ext}`;
    const versionedPath = outputDir 
      ? path.join(outputDir, path.relative(process.cwd(), dirname), versionedFilename)
      : path.join(dirname, versionedFilename);
    
    // Store in manifest
    const originalPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    const versionedRelativePath = path.relative(process.cwd(), versionedPath).replace(/\\/g, '/');
    
    this.assetManifest.set(originalPath, {
      versioned: versionedRelativePath,
      version: version,
      strategy: strategy,
      hash: version,
      timestamp: this.buildTime,
      size: 0 // Will be set during file copy
    });

    return {
      original: filePath,
      versioned: versionedPath,
      version: version,
      strategy: strategy
    };
  }

  /**
   * Process directory recursively
   */
  async processDirectory(sourceDir, outputDir = null) {
    const results = [];
    
    try {
      const entries = await fs.readdir(sourceDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(sourceDir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and other excluded directories
          if (!this.shouldSkipDirectory(entry.name)) {
            const subResults = await this.processDirectory(fullPath, outputDir);
            results.push(...subResults);
          }
        } else if (entry.isFile()) {
          // Process file if it matches our criteria
          if (this.shouldProcessFile(fullPath)) {
            const result = await this.processFile(fullPath, outputDir);
            results.push(result);
          }
        }
      }
    } catch (error) {
      console.warn(`[Versioning] Failed to process directory ${sourceDir}:`, error.message);
    }
    
    return results;
  }

  /**
   * Check if directory should be skipped
   */
  shouldSkipDirectory(dirname) {
    const skipDirs = [
      'node_modules',
      '.git',
      '.vscode',
      'coverage',
      'temp',
      'build',
      'dist'
    ];
    return skipDirs.includes(dirname) || dirname.startsWith('.');
  }

  /**
   * Check if file should be processed
   */
  shouldProcessFile(filePath) {
    const ext = path.extname(filePath);
    return this.config.processExtensions.includes(ext);
  }

  /**
   * Copy file with versioning
   */
  async copyVersionedFile(original, versioned) {
    try {
      // Ensure output directory exists
      await fs.mkdir(path.dirname(versioned), { recursive: true });
      
      // Copy file
      await fs.copyFile(original, versioned);
      
      // Get file size for manifest
      const stats = await fs.stat(versioned);
      const originalPath = path.relative(process.cwd(), original).replace(/\\/g, '/');
      const manifestEntry = this.assetManifest.get(originalPath);
      if (manifestEntry) {
        manifestEntry.size = stats.size;
      }
      
      return true;
    } catch (error) {
      console.error(`[Versioning] Failed to copy ${original} to ${versioned}:`, error.message);
      return false;
    }
  }

  /**
   * Generate asset manifest JSON
   */
  generateManifest() {
    const manifest = {
      buildTime: this.buildTime,
      buildVersion: this.buildVersion,
      assets: Object.fromEntries(this.assetManifest),
      metadata: {
        totalAssets: this.assetManifest.size,
        hashAlgorithm: this.config.hashAlgorithm,
        hashLength: this.config.hashLength,
        strategies: this.getStrategyStats()
      }
    };
    
    return manifest;
  }

  /**
   * Get statistics about versioning strategies used
   */
  getStrategyStats() {
    const stats = {};
    for (const [, asset] of this.assetManifest) {
      stats[asset.strategy] = (stats[asset.strategy] || 0) + 1;
    }
    return stats;
  }

  /**
   * Save manifest to file
   */
  async saveManifest(outputPath = null) {
    const manifestPath = outputPath || path.join(process.cwd(), this.config.manifestFile);
    const manifest = this.generateManifest();
    
    try {
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`[Versioning] Asset manifest saved to ${manifestPath}`);
      return manifestPath;
    } catch (error) {
      console.error(`[Versioning] Failed to save manifest:`, error.message);
      throw error;
    }
  }

  /**
   * Load existing manifest
   */
  async loadManifest(manifestPath = null) {
    const path_to_manifest = manifestPath || path.join(process.cwd(), this.config.manifestFile);
    
    try {
      const content = await fs.readFile(path_to_manifest, 'utf8');
      const manifest = JSON.parse(content);
      
      // Restore asset manifest
      this.assetManifest.clear();
      for (const [original, asset] of Object.entries(manifest.assets)) {
        this.assetManifest.set(original, asset);
      }
      
      this.buildTime = manifest.buildTime;
      this.buildVersion = manifest.buildVersion;
      
      console.log(`[Versioning] Loaded manifest with ${Object.keys(manifest.assets).length} assets`);
      return manifest;
    } catch (error) {
      console.warn(`[Versioning] Failed to load manifest:`, error.message);
      return null;
    }
  }

  /**
   * Get versioned URL for asset
   */
  getVersionedURL(originalPath, baseURL = '') {
    const asset = this.assetManifest.get(originalPath);
    if (asset) {
      return baseURL + '/' + asset.versioned;
    }
    
    // Fallback: add query parameter
    const separator = originalPath.includes('?') ? '&' : '?';
    return baseURL + originalPath + separator + this.config.queryParam + '=' + this.buildTime;
  }

  /**
   * Update HTML file with versioned asset URLs
   */
  async updateHTMLFile(htmlPath, outputPath = null) {
    try {
      let content = await fs.readFile(htmlPath, 'utf8');
      const output = outputPath || htmlPath;
      
      // Replace asset URLs with versioned ones
      for (const [original, asset] of this.assetManifest) {
        const originalUrl = '/' + original;
        const versionedUrl = '/' + asset.versioned;
        
        // Replace in script src attributes
        content = content.replace(
          new RegExp(`src=["']${originalUrl}["']`, 'g'),
          `src="${versionedUrl}"`
        );
        
        // Replace in link href attributes
        content = content.replace(
          new RegExp(`href=["']${originalUrl}["']`, 'g'),
          `href="${versionedUrl}"`
        );
        
        // Replace in CSS url() functions
        content = content.replace(
          new RegExp(`url\\(["']?${originalUrl}["']?\\)`, 'g'),
          `url("${versionedUrl}")`
        );
      }
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(output), { recursive: true });
      
      // Write updated HTML
      await fs.writeFile(output, content);
      console.log(`[Versioning] Updated HTML file: ${output}`);
      return true;
    } catch (error) {
      console.error(`[Versioning] Failed to update HTML file ${htmlPath}:`, error.message);
      return false;
    }
  }

  /**
   * Build versioned assets for production
   */
  async buildVersionedAssets(sourceDir, outputDir) {
    console.log('[Versioning] Starting asset versioning process...');
    
    const results = await this.processDirectory(sourceDir, outputDir);
    console.log(`[Versioning] Processed ${results.length} files`);
    
    // Copy versioned files
    let successCount = 0;
    for (const result of results) {
      const success = await this.copyVersionedFile(result.original, result.versioned);
      if (success) successCount++;
    }
    
    console.log(`[Versioning] Successfully copied ${successCount}/${results.length} files`);
    
    // Save manifest
    await this.saveManifest(path.join(outputDir, this.config.manifestFile));
    
    return {
      processed: results.length,
      successful: successCount,
      manifest: this.generateManifest()
    };
  }
}

/**
 * Cache busting utilities for runtime use
 */
export class CacheBustingUtils {
  constructor(manifest = null) {
    this.manifest = manifest;
    this.queryParamFallback = true;
  }

  /**
   * Load asset manifest
   */
  async loadManifest(manifestPath) {
    try {
      const content = await fs.readFile(manifestPath, 'utf8');
      this.manifest = JSON.parse(content);
      return this.manifest;
    } catch (error) {
      console.warn('[CacheBusting] Failed to load manifest:', error.message);
      return null;
    }
  }

  /**
   * Get versioned URL for asset
   */
  getVersionedURL(assetPath, baseURL = '') {
    if (this.manifest && this.manifest.assets[assetPath]) {
      const asset = this.manifest.assets[assetPath];
      return baseURL + '/' + asset.versioned;
    }
    
    // Fallback: add timestamp query parameter
    if (this.queryParamFallback) {
      const separator = assetPath.includes('?') ? '&' : '?';
      const timestamp = this.manifest ? this.manifest.buildTime : Date.now();
      return baseURL + assetPath + separator + 'v=' + timestamp;
    }
    
    return baseURL + assetPath;
  }

  /**
   * Inject versioning script into HTML
   */
  getVersioningScript() {
    if (!this.manifest) return '';
    
    return `
    <script>
      window.MLG_ASSET_MANIFEST = ${JSON.stringify(this.manifest.assets)};
      window.MLG_BUILD_VERSION = "${this.manifest.buildVersion}";
      
      // Utility function to get versioned URL
      window.getVersionedURL = function(assetPath, baseURL = '') {
        const asset = window.MLG_ASSET_MANIFEST[assetPath];
        if (asset) {
          return baseURL + '/' + asset.versioned;
        }
        const separator = assetPath.includes('?') ? '&' : '?';
        return baseURL + assetPath + separator + 'v=' + ${this.manifest.buildTime};
      };
    </script>
    `;
  }
}

/**
 * Express middleware for cache busting
 */
export function cacheBustingMiddleware(manifestPath) {
  let manifest = null;
  let lastLoad = 0;
  const CACHE_TTL = 60000; // 1 minute
  
  return async (req, res, next) => {
    // Reload manifest periodically
    if (!manifest || Date.now() - lastLoad > CACHE_TTL) {
      try {
        const utils = new CacheBustingUtils();
        manifest = await utils.loadManifest(manifestPath);
        lastLoad = Date.now();
      } catch (error) {
        console.warn('[CacheBusting] Failed to load manifest for middleware:', error.message);
      }
    }
    
    // Add versioning utilities to request
    req.getVersionedURL = (assetPath, baseURL = '') => {
      const utils = new CacheBustingUtils(manifest);
      return utils.getVersionedURL(assetPath, baseURL);
    };
    
    // Add manifest to response locals
    res.locals.assetManifest = manifest;
    res.locals.getVersionedURL = req.getVersionedURL;
    
    next();
  };
}

export default AssetVersionManager;