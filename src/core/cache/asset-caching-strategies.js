/**
 * Asset-Specific Caching Strategies
 * Implements optimized caching strategies for different asset types
 * (JS, CSS, images, fonts) with tailored cache policies
 */

import { HTTPCacheManager } from './http-cache-headers.js';
import { AssetVersionManager } from './cache-busting.js';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

/**
 * Asset-specific caching configurations
 */
export const ASSET_CACHING_STRATEGIES = {
  // JavaScript files
  JAVASCRIPT: {
    name: 'JavaScript Assets',
    patterns: [/\.js$/i, /\.mjs$/i, /\.jsx$/i],
    policy: {
      maxAge: 31536000, // 1 year
      public: true,
      immutable: true,
      sMaxAge: 31536000,
      staleWhileRevalidate: 86400 // 1 day
    },
    compression: true,
    versioning: 'contentHash',
    preload: true,
    critical: false,
    sri: true,
    minify: true,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    }
  },

  // CSS Stylesheets
  CSS: {
    name: 'CSS Stylesheets',
    patterns: [/\.css$/i, /\.scss$/i, /\.sass$/i],
    policy: {
      maxAge: 31536000, // 1 year
      public: true,
      immutable: true,
      sMaxAge: 31536000,
      staleWhileRevalidate: 86400
    },
    compression: true,
    versioning: 'contentHash',
    preload: true,
    critical: true,
    sri: true,
    minify: true,
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    }
  },

  // Images
  IMAGES: {
    name: 'Image Assets',
    patterns: [/\.(png|jpe?g|gif|svg|webp|avif|ico)$/i],
    policy: {
      maxAge: 2592000, // 30 days
      public: true,
      sMaxAge: 7776000, // 90 days for CDN
      staleWhileRevalidate: 86400
    },
    compression: false, // Images are already compressed
    versioning: 'contentHash',
    preload: false,
    critical: false,
    sri: false,
    minify: false,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    },
    optimization: {
      webp: true,
      avif: true,
      responsive: true,
      lazyLoad: true
    }
  },

  // Fonts
  FONTS: {
    name: 'Font Assets',
    patterns: [/\.(woff2?|ttf|eot|otf)$/i],
    policy: {
      maxAge: 31536000, // 1 year
      public: true,
      immutable: true,
      sMaxAge: 31536000
    },
    compression: false, // WOFF2 is already compressed
    versioning: 'contentHash',
    preload: true,
    critical: true,
    sri: false,
    minify: false,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'X-Content-Type-Options': 'nosniff'
    }
  },

  // HTML Documents
  HTML: {
    name: 'HTML Documents',
    patterns: [/\.html$/i],
    policy: {
      maxAge: 300, // 5 minutes
      public: true,
      mustRevalidate: true,
      sMaxAge: 3600 // 1 hour for CDN
    },
    compression: true,
    versioning: 'timestamp',
    preload: false,
    critical: true,
    sri: false,
    minify: true,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN'
    }
  },

  // JSON Data
  JSON: {
    name: 'JSON Data',
    patterns: [/\.json$/i],
    policy: {
      maxAge: 3600, // 1 hour
      public: true,
      mustRevalidate: true,
      staleWhileRevalidate: 1800
    },
    compression: true,
    versioning: 'contentHash',
    preload: false,
    critical: false,
    sri: false,
    minify: true,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    }
  },

  // Service Workers
  SERVICE_WORKER: {
    name: 'Service Workers',
    patterns: [/sw\.js$/i, /service-worker\.js$/i],
    policy: {
      maxAge: 0,
      noCache: true,
      mustRevalidate: true
    },
    compression: true,
    versioning: 'none',
    preload: false,
    critical: true,
    sri: false,
    minify: true,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Service-Worker-Allowed': '/'
    }
  },

  // Media Files
  MEDIA: {
    name: 'Media Files',
    patterns: [/\.(mp4|webm|ogg|mp3|wav|m4a)$/i],
    policy: {
      maxAge: 2592000, // 30 days
      public: true,
      sMaxAge: 7776000 // 90 days for CDN
    },
    compression: false,
    versioning: 'contentHash',
    preload: false,
    critical: false,
    sri: false,
    minify: false,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'bytes'
    }
  }
};

/**
 * Asset Caching Strategy Manager
 * Manages different caching strategies based on asset types
 */
export class AssetCachingStrategyManager {
  constructor(options = {}) {
    this.options = {
      enableCompression: true,
      enableSRI: true,
      enablePreloading: true,
      enableVersioning: true,
      ...options
    };
    
    this.httpCacheManager = new HTTPCacheManager(this.options);
    this.versionManager = new AssetVersionManager();
    this.preloadLinks = new Set();
    this.criticalAssets = new Set();
  }

  /**
   * Detect asset type based on file path
   */
  detectAssetType(filePath) {
    const filename = path.basename(filePath).toLowerCase();
    
    for (const [type, config] of Object.entries(ASSET_CACHING_STRATEGIES)) {
      if (config.patterns.some(pattern => pattern.test(filename))) {
        return type;
      }
    }
    
    return 'UNKNOWN';
  }

  /**
   * Get caching strategy for asset type
   */
  getStrategy(assetType) {
    return ASSET_CACHING_STRATEGIES[assetType] || ASSET_CACHING_STRATEGIES.HTML;
  }

  /**
   * Apply caching strategy to Express response
   */
  applyCachingStrategy(req, res, filePath) {
    const assetType = this.detectAssetType(filePath);
    const strategy = this.getStrategy(assetType);
    
    // Apply HTTP cache headers
    this.applyHTTPCacheHeaders(res, strategy);
    
    // Apply asset-specific headers
    this.applyAssetHeaders(res, strategy);
    
    // Handle preloading
    if (this.options.enablePreloading && strategy.preload) {
      this.handlePreload(req, res, filePath, assetType);
    }
    
    // Handle SRI
    if (this.options.enableSRI && strategy.sri) {
      this.handleSRI(res, filePath);
    }
    
    return strategy;
  }

  /**
   * Apply HTTP cache headers based on strategy
   */
  applyHTTPCacheHeaders(res, strategy) {
    const directives = [];
    const policy = strategy.policy;
    
    if (policy.public) {
      directives.push('public');
    } else if (policy.public === false) {
      directives.push('private');
    }
    
    if (policy.noCache) {
      directives.push('no-cache');
    }
    
    if (policy.maxAge !== undefined) {
      directives.push(`max-age=${policy.maxAge}`);
    }
    
    if (policy.sMaxAge) {
      directives.push(`s-maxage=${policy.sMaxAge}`);
    }
    
    if (policy.mustRevalidate) {
      directives.push('must-revalidate');
    }
    
    if (policy.immutable) {
      directives.push('immutable');
    }
    
    if (policy.staleWhileRevalidate) {
      directives.push(`stale-while-revalidate=${policy.staleWhileRevalidate}`);
    }
    
    if (directives.length > 0) {
      res.set('Cache-Control', directives.join(', '));
    }
  }

  /**
   * Apply asset-specific headers
   */
  applyAssetHeaders(res, strategy) {
    if (strategy.headers) {
      for (const [name, value] of Object.entries(strategy.headers)) {
        res.set(name, value);
      }
    }
    
    // Apply compression hints
    if (strategy.compression && this.options.enableCompression) {
      res.set('Vary', 'Accept-Encoding');
    }
  }

  /**
   * Handle preload links
   */
  handlePreload(req, res, filePath, assetType) {
    const asName = this.getPreloadAsType(assetType);
    const relativePath = path.relative(process.cwd(), filePath);
    
    this.preloadLinks.add(`</${relativePath}>; rel=preload; as=${asName}`);
    
    // Add to Link header if not too many links
    if (this.preloadLinks.size <= 10) {
      const linkHeader = Array.from(this.preloadLinks).join(', ');
      res.set('Link', linkHeader);
    }
  }

  /**
   * Get preload 'as' attribute for asset type
   */
  getPreloadAsType(assetType) {
    const mapping = {
      'JAVASCRIPT': 'script',
      'CSS': 'style',
      'FONTS': 'font',
      'IMAGES': 'image',
      'MEDIA': 'video'
    };
    
    return mapping[assetType] || 'fetch';
  }

  /**
   * Handle Subresource Integrity
   */
  async handleSRI(res, filePath) {
    try {
      const content = await fs.readFile(filePath);
      const hash = crypto.createHash('sha384').update(content).digest('base64');
      const integrity = `sha384-${hash}`;
      res.set('X-Content-Integrity', integrity);
    } catch (error) {
      console.warn('[AssetCaching] Failed to generate SRI hash:', error.message);
    }
  }

  /**
   * Generate resource hints for critical assets
   */
  generateResourceHints() {
    const hints = [];
    
    // DNS prefetch for external domains
    hints.push('<link rel="dns-prefetch" href="//api.mainnet-beta.solana.com">');
    hints.push('<link rel="dns-prefetch" href="//fonts.googleapis.com">');
    hints.push('<link rel="dns-prefetch" href="//fonts.gstatic.com">');
    
    // Preconnect for critical external resources
    hints.push('<link rel="preconnect" href="//api.mainnet-beta.solana.com" crossorigin>');
    hints.push('<link rel="preconnect" href="//fonts.gstatic.com" crossorigin>');
    
    // Preload critical assets
    for (const asset of this.criticalAssets) {
      hints.push(asset);
    }
    
    return hints.join('\n');
  }

  /**
   * Optimize images with modern formats
   */
  async optimizeImage(imagePath, options = {}) {
    const strategy = this.getStrategy('IMAGES');
    const optimization = strategy.optimization;
    
    if (!optimization) return imagePath;
    
    const ext = path.extname(imagePath).toLowerCase();
    const basename = path.basename(imagePath, ext);
    const dirname = path.dirname(imagePath);
    
    const optimizedFormats = [];
    
    // Generate WebP version
    if (optimization.webp && ext !== '.webp') {
      const webpPath = path.join(dirname, `${basename}.webp`);
      optimizedFormats.push({
        format: 'webp',
        path: webpPath,
        type: 'image/webp'
      });
    }
    
    // Generate AVIF version
    if (optimization.avif && ext !== '.avif') {
      const avifPath = path.join(dirname, `${basename}.avif`);
      optimizedFormats.push({
        format: 'avif',
        path: avifPath,
        type: 'image/avif'
      });
    }
    
    return {
      original: imagePath,
      optimized: optimizedFormats
    };
  }

  /**
   * Generate critical CSS extraction
   */
  async extractCriticalCSS(htmlPath, cssPath) {
    // This would typically use tools like Critical or PurgeCSS
    // For now, return a placeholder implementation
    
    try {
      const htmlContent = await fs.readFile(htmlPath, 'utf8');
      const cssContent = await fs.readFile(cssPath, 'utf8');
      
      // Simple extraction - would be more sophisticated in production
      const aboveFoldSelectors = [
        'body', 'html', 'head',
        '.header', '.nav', '.main',
        '.loading', '.critical'
      ];
      
      const criticalCSS = cssContent
        .split('\n')
        .filter(line => {
          return aboveFoldSelectors.some(selector => 
            line.includes(selector) || line.includes('@media')
          );
        })
        .join('\n');
      
      return criticalCSS;
    } catch (error) {
      console.warn('[AssetCaching] Failed to extract critical CSS:', error.message);
      return '';
    }
  }

  /**
   * Express middleware factory
   */
  middleware() {
    return (req, res, next) => {
      const originalSendFile = res.sendFile;
      
      res.sendFile = (filePath, options, callback) => {
        // Apply caching strategy
        const strategy = this.applyCachingStrategy(req, res, filePath);
        
        // Add strategy info to response locals
        res.locals.cachingStrategy = strategy;
        res.locals.assetType = this.detectAssetType(filePath);
        
        return originalSendFile.call(res, filePath, options, callback);
      };
      
      next();
    };
  }

  /**
   * Build-time optimization
   */
  async optimizeAssets(sourceDir, outputDir) {
    console.log('[AssetCaching] Starting asset optimization...');
    
    const results = {
      processed: 0,
      optimized: 0,
      errors: []
    };
    
    try {
      const files = await this.getAllFiles(sourceDir);
      
      for (const filePath of files) {
        try {
          const assetType = this.detectAssetType(filePath);
          const strategy = this.getStrategy(assetType);
          
          if (strategy.minify && this.shouldMinify(filePath)) {
            await this.minifyAsset(filePath, outputDir);
            results.optimized++;
          }
          
          if (assetType === 'IMAGES') {
            await this.optimizeImage(filePath);
          }
          
          results.processed++;
        } catch (error) {
          results.errors.push({ file: filePath, error: error.message });
        }
      }
    } catch (error) {
      console.error('[AssetCaching] Asset optimization failed:', error.message);
    }
    
    console.log(`[AssetCaching] Optimization complete: ${results.optimized}/${results.processed} assets optimized`);
    return results;
  }

  /**
   * Get all files in directory recursively
   */
  async getAllFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!this.shouldSkipDirectory(entry.name)) {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        }
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Check if directory should be skipped
   */
  shouldSkipDirectory(dirname) {
    return ['node_modules', '.git', 'coverage', 'temp'].includes(dirname);
  }

  /**
   * Check if file should be minified
   */
  shouldMinify(filePath) {
    const ext = path.extname(filePath);
    return ['.js', '.css', '.html', '.json'].includes(ext);
  }

  /**
   * Minify asset (placeholder implementation)
   */
  async minifyAsset(filePath, outputDir) {
    // Would use tools like Terser, cssnano, html-minifier
    console.log(`[AssetCaching] Would minify: ${filePath}`);
  }
}

/**
 * Factory function to create strategy manager
 */
export function createAssetCachingStrategy(options) {
  return new AssetCachingStrategyManager(options);
}

export default AssetCachingStrategyManager;