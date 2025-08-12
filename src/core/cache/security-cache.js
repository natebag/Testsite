/**
 * Security Considerations for Cached Assets
 * Implements Subresource Integrity (SRI), Content Security Policy (CSP),
 * and other security measures for cached assets
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

/**
 * Security policies for different asset types
 */
export const SECURITY_POLICIES = {
  // Subresource Integrity configuration
  SRI: {
    enabled: true,
    algorithms: ['sha384', 'sha256'], // Preferred order
    enforceForCritical: true,
    enforceForExternal: true,
    fallbackOnFailure: false
  },
  
  // Content Security Policy configuration
  CSP: {
    enabled: true,
    enforceMode: true, // false for report-only
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for inline scripts (minimize usage)
        "'unsafe-eval'", // Required for some crypto libraries
        'https://unpkg.com',
        'https://cdn.jsdelivr.net',
        'https://api.mainnet-beta.solana.com',
        'https://api.devnet.solana.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://unpkg.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:'
      ],
      'connect-src': [
        "'self'",
        'https://api.mainnet-beta.solana.com',
        'https://api.devnet.solana.com',
        'wss://api.mainnet-beta.solana.com',
        'wss://api.devnet.solana.com'
      ],
      'worker-src': ["'self'", 'blob:'],
      'manifest-src': ["'self'"],
      'media-src': ["'self'", 'data:', 'blob:']
    }
  },
  
  // Cache security settings
  CACHE_SECURITY: {
    enableSecureHeaders: true,
    enableCachePoison: false,
    enableReferrerPolicy: true,
    enableXContentTypeOptions: true,
    enableXFrameOptions: true,
    validateCacheIntegrity: true
  }
};

/**
 * Critical assets requiring SRI
 */
export const CRITICAL_ASSETS_SRI = [
  '/src/main.js',
  '/src/styles/main.css',
  '/src/js/mlg-api-client-consolidated.js',
  '/src/js/mlg-wallet-init-consolidated.js',
  '/src/shared/components/ui/index.js'
];

/**
 * External resource patterns requiring SRI
 */
export const EXTERNAL_SRI_PATTERNS = [
  /^https:\/\/unpkg\.com\//,
  /^https:\/\/cdn\.jsdelivr\.net\//,
  /^https:\/\/fonts\.googleapis\.com\//,
  /^https:\/\/api\.(mainnet-beta|devnet)\.solana\.com\//
];

/**
 * Cache Security Manager
 * Handles security aspects of cached assets including SRI and CSP
 */
export class CacheSecurityManager {
  constructor(options = {}) {
    this.options = {
      ...SECURITY_POLICIES,
      enableSRIGeneration: true,
      enableCSPGeneration: true,
      enableSecurityHeaders: true,
      enableIntegrityValidation: true,
      enableCacheSecurity: true,
      sriCacheFile: 'sri-hashes.json',
      cspReportEndpoint: '/api/csp-report',
      ...options
    };
    
    this.sriHashes = new Map();
    this.cspViolations = [];
    this.securityMetrics = {
      sriValidations: 0,
      sriFailures: 0,
      cspViolations: 0,
      integrityChecks: 0
    };
    
    this.init();
  }

  /**
   * Initialize security manager
   */
  async init() {
    try {
      // Load existing SRI hashes
      await this.loadSRIHashes();
      
      // Set up CSP reporting
      if (this.options.CSP.enabled) {
        this.setupCSPReporting();
      }
      
      // Set up integrity validation
      if (this.options.enableIntegrityValidation) {
        this.setupIntegrityValidation();
      }
      
      console.log('[CacheSecurity] Security manager initialized');
    } catch (error) {
      console.error('[CacheSecurity] Initialization failed:', error);
    }
  }

  /**
   * Generate SRI hash for asset
   */
  async generateSRIHash(content, algorithm = 'sha384') {
    try {
      let buffer;
      
      if (typeof content === 'string') {
        buffer = Buffer.from(content, 'utf8');
      } else if (Buffer.isBuffer(content)) {
        buffer = content;
      } else {
        buffer = Buffer.from(JSON.stringify(content), 'utf8');
      }
      
      const hash = crypto.createHash(algorithm);
      hash.update(buffer);
      const digest = hash.digest('base64');
      
      return `${algorithm}-${digest}`;
    } catch (error) {
      console.error('[CacheSecurity] SRI hash generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate SRI hashes for file
   */
  async generateSRIForFile(filePath) {
    try {
      const content = await fs.readFile(filePath);
      const hashes = {};
      
      for (const algorithm of this.options.SRI.algorithms) {
        hashes[algorithm] = await this.generateSRIHash(content, algorithm);
      }
      
      return hashes;
    } catch (error) {
      console.error(`[CacheSecurity] Failed to generate SRI for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Generate SRI hashes for multiple assets
   */
  async generateSRIForAssets(assetPaths) {
    const results = new Map();
    
    for (const assetPath of assetPaths) {
      try {
        const hashes = await this.generateSRIForFile(assetPath);
        if (hashes) {
          results.set(assetPath, hashes);
          this.sriHashes.set(assetPath, hashes);
        }
      } catch (error) {
        console.warn(`[CacheSecurity] Skipped SRI generation for ${assetPath}:`, error.message);
      }
    }
    
    return results;
  }

  /**
   * Get SRI hash for asset
   */
  getSRIHash(assetPath, algorithm = 'sha384') {
    const hashes = this.sriHashes.get(assetPath);
    return hashes ? hashes[algorithm] : null;
  }

  /**
   * Generate integrity attribute for HTML
   */
  generateIntegrityAttribute(assetPath, algorithms = null) {
    algorithms = algorithms || this.options.SRI.algorithms;
    const hashes = this.sriHashes.get(assetPath);
    
    if (!hashes) return '';
    
    const integrityHashes = algorithms
      .map(alg => hashes[alg])
      .filter(hash => hash)
      .join(' ');
    
    return integrityHashes ? `integrity="${integrityHashes}"` : '';
  }

  /**
   * Validate asset integrity
   */
  async validateAssetIntegrity(assetPath, content) {
    const storedHashes = this.sriHashes.get(assetPath);
    
    if (!storedHashes) {
      console.warn(`[CacheSecurity] No stored hash for ${assetPath}`);
      return false;
    }
    
    try {
      for (const algorithm of this.options.SRI.algorithms) {
        const storedHash = storedHashes[algorithm];
        if (storedHash) {
          const computedHash = await this.generateSRIHash(content, algorithm);
          
          if (storedHash === computedHash) {
            this.securityMetrics.integrityChecks++;
            return true;
          }
        }
      }
      
      console.error(`[CacheSecurity] Integrity validation failed for ${assetPath}`);
      this.securityMetrics.sriFailures++;
      return false;
    } catch (error) {
      console.error(`[CacheSecurity] Integrity validation error for ${assetPath}:`, error);
      return false;
    }
  }

  /**
   * Generate Content Security Policy header
   */
  generateCSPHeader() {
    const directives = [];
    
    for (const [directive, values] of Object.entries(this.options.CSP.directives)) {
      if (Array.isArray(values) && values.length > 0) {
        directives.push(`${directive} ${values.join(' ')}`);
      } else if (typeof values === 'string') {
        directives.push(`${directive} ${values}`);
      }
    }
    
    // Add report endpoint if configured
    if (this.options.cspReportEndpoint) {
      directives.push(`report-uri ${this.options.cspReportEndpoint}`);
    }
    
    const headerName = this.options.CSP.enforceMode 
      ? 'Content-Security-Policy' 
      : 'Content-Security-Policy-Report-Only';
    
    return {
      name: headerName,
      value: directives.join('; ')
    };
  }

  /**
   * Generate security headers for cached assets
   */
  generateSecurityHeaders(assetPath, assetType = 'static') {
    const headers = {};
    
    // Content-Type options
    if (this.options.CACHE_SECURITY.enableXContentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }
    
    // Frame options
    if (this.options.CACHE_SECURITY.enableXFrameOptions) {
      headers['X-Frame-Options'] = assetType === 'html' ? 'SAMEORIGIN' : 'DENY';
    }
    
    // Referrer policy
    if (this.options.CACHE_SECURITY.enableReferrerPolicy) {
      headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    }
    
    // SRI for critical assets
    if (this.shouldEnforceSRI(assetPath)) {
      const integrity = this.generateIntegrityAttribute(assetPath);
      if (integrity) {
        headers['X-Content-Integrity'] = integrity.replace('integrity="', '').replace('"', '');
      }
    }
    
    // CORS headers for fonts and cross-origin resources
    if (this.isCrossOriginAsset(assetType)) {
      headers['Access-Control-Allow-Origin'] = '*';
      headers['Access-Control-Allow-Methods'] = 'GET';
      headers['Cross-Origin-Resource-Policy'] = 'cross-origin';
    }
    
    // CSP for HTML documents
    if (assetType === 'html' && this.options.CSP.enabled) {
      const csp = this.generateCSPHeader();
      headers[csp.name] = csp.value;
    }
    
    return headers;
  }

  /**
   * Check if asset should enforce SRI
   */
  shouldEnforceSRI(assetPath) {
    // Critical assets always require SRI
    if (this.options.SRI.enforceForCritical && CRITICAL_ASSETS_SRI.includes(assetPath)) {
      return true;
    }
    
    // External resources require SRI
    if (this.options.SRI.enforceForExternal) {
      return EXTERNAL_SRI_PATTERNS.some(pattern => pattern.test(assetPath));
    }
    
    // Check if asset has stored SRI hash
    return this.sriHashes.has(assetPath);
  }

  /**
   * Check if asset is cross-origin
   */
  isCrossOriginAsset(assetType) {
    return ['font', 'image', 'media'].includes(assetType);
  }

  /**
   * Express middleware for cache security
   */
  middleware() {
    return (req, res, next) => {
      const originalSendFile = res.sendFile;
      const originalSend = res.send;
      
      // Override sendFile to add security headers
      res.sendFile = function(filePath, options, callback) {
        const assetType = getAssetType(filePath);
        const securityHeaders = this.generateSecurityHeaders(filePath, assetType);
        
        // Apply security headers
        Object.entries(securityHeaders).forEach(([name, value]) => {
          res.set(name, value);
        });
        
        return originalSendFile.call(res, filePath, options, callback);
      }.bind(this);
      
      // Override send for dynamic content
      res.send = function(content) {
        if (this.options.enableSecurityHeaders) {
          const securityHeaders = this.generateSecurityHeaders(req.path, 'dynamic');
          Object.entries(securityHeaders).forEach(([name, value]) => {
            res.set(name, value);
          });
        }
        
        return originalSend.call(res, content);
      }.bind(this);
      
      next();
    };
  }

  /**
   * Set up CSP reporting
   */
  setupCSPReporting() {
    if (typeof window !== 'undefined') {
      // Listen for CSP violation events
      document.addEventListener('securitypolicyviolation', (event) => {
        this.handleCSPViolation(event);
      });
    }
  }

  /**
   * Handle CSP violation
   */
  handleCSPViolation(event) {
    const violation = {
      documentURI: event.documentURI,
      referrer: event.referrer,
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      effectiveDirective: event.effectiveDirective,
      disposition: event.disposition,
      timestamp: new Date().toISOString()
    };
    
    this.cspViolations.push(violation);
    this.securityMetrics.cspViolations++;
    
    console.warn('[CacheSecurity] CSP Violation:', violation);
    
    // Send violation report to server
    if (this.options.cspReportEndpoint) {
      fetch(this.options.cspReportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(violation)
      }).catch(error => {
        console.error('[CacheSecurity] Failed to send CSP violation report:', error);
      });
    }
    
    // Keep only last 100 violations
    if (this.cspViolations.length > 100) {
      this.cspViolations = this.cspViolations.slice(-100);
    }
  }

  /**
   * Set up integrity validation for runtime assets
   */
  setupIntegrityValidation() {
    if (typeof window !== 'undefined') {
      // Override fetch to validate integrity
      const originalFetch = window.fetch;
      
      window.fetch = async (resource, options = {}) => {
        const response = await originalFetch(resource, options);
        
        if (response.ok && this.shouldValidateIntegrity(resource)) {
          const content = await response.clone().text();
          const isValid = await this.validateAssetIntegrity(resource, content);
          
          if (!isValid && this.options.SRI.fallbackOnFailure) {
            throw new Error(`Integrity validation failed for ${resource}`);
          }
        }
        
        return response;
      };
      
      // Monitor script loading
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === 'SCRIPT' || node.tagName === 'LINK') {
                this.validateElementIntegrity(node);
              }
            }
          });
        });
      });
      
      observer.observe(document, {
        childList: true,
        subtree: true
      });
    }
  }

  /**
   * Check if resource should be validated
   */
  shouldValidateIntegrity(resource) {
    const url = typeof resource === 'string' ? resource : resource.url;
    return this.shouldEnforceSRI(url);
  }

  /**
   * Validate element integrity
   */
  async validateElementIntegrity(element) {
    const src = element.src || element.href;
    
    if (src && this.shouldEnforceSRI(src)) {
      const storedHash = this.getSRIHash(src);
      
      if (storedHash && !element.integrity) {
        console.warn(`[CacheSecurity] Missing integrity attribute for ${src}`);
        element.integrity = storedHash;
      }
      
      // Listen for load/error events
      element.addEventListener('load', () => {
        this.securityMetrics.sriValidations++;
      });
      
      element.addEventListener('error', () => {
        console.error(`[CacheSecurity] Failed to load resource with integrity: ${src}`);
        this.securityMetrics.sriFailures++;
      });
    }
  }

  /**
   * Load SRI hashes from file
   */
  async loadSRIHashes() {
    try {
      const hashFile = path.join(process.cwd(), this.options.sriCacheFile);
      const content = await fs.readFile(hashFile, 'utf8');
      const hashes = JSON.parse(content);
      
      this.sriHashes.clear();
      Object.entries(hashes).forEach(([assetPath, hashData]) => {
        this.sriHashes.set(assetPath, hashData);
      });
      
      console.log(`[CacheSecurity] Loaded ${this.sriHashes.size} SRI hashes`);
    } catch (error) {
      console.warn('[CacheSecurity] Failed to load SRI hashes:', error.message);
    }
  }

  /**
   * Save SRI hashes to file
   */
  async saveSRIHashes() {
    try {
      const hashFile = path.join(process.cwd(), this.options.sriCacheFile);
      const hashData = Object.fromEntries(this.sriHashes);
      
      await fs.writeFile(hashFile, JSON.stringify(hashData, null, 2));
      console.log(`[CacheSecurity] Saved ${this.sriHashes.size} SRI hashes`);
    } catch (error) {
      console.error('[CacheSecurity] Failed to save SRI hashes:', error);
    }
  }

  /**
   * Generate security report
   */
  generateSecurityReport() {
    return {
      sriHashes: this.sriHashes.size,
      cspViolations: this.cspViolations.length,
      metrics: this.securityMetrics,
      recentViolations: this.cspViolations.slice(-10),
      criticalAssets: CRITICAL_ASSETS_SRI.length,
      securityLevel: this.calculateSecurityLevel()
    };
  }

  /**
   * Calculate overall security level
   */
  calculateSecurityLevel() {
    let score = 0;
    
    // SRI coverage
    if (this.sriHashes.size >= CRITICAL_ASSETS_SRI.length) score += 30;
    
    // CSP enabled
    if (this.options.CSP.enabled) score += 25;
    
    // Security headers enabled
    if (this.options.enableSecurityHeaders) score += 20;
    
    // Low violation rate
    const violationRate = this.securityMetrics.cspViolations / Math.max(this.securityMetrics.integrityChecks, 1);
    if (violationRate < 0.1) score += 25;
    
    if (score >= 90) return 'High';
    if (score >= 70) return 'Medium';
    if (score >= 50) return 'Low';
    return 'Critical';
  }

  /**
   * Build-time security optimization
   */
  async optimizeSecurityForBuild(sourceDir, outputDir) {
    console.log('[CacheSecurity] Optimizing security for build...');
    
    const results = {
      sriGenerated: 0,
      errors: []
    };
    
    try {
      // Generate SRI for critical assets
      const assetPaths = await this.findCriticalAssets(sourceDir);
      const sriResults = await this.generateSRIForAssets(assetPaths);
      
      results.sriGenerated = sriResults.size;
      
      // Save SRI hashes
      await this.saveSRIHashes();
      
      // Generate security-optimized HTML
      await this.optimizeHTMLSecurity(sourceDir, outputDir);
      
      console.log(`[CacheSecurity] Security optimization complete: ${results.sriGenerated} assets processed`);
    } catch (error) {
      console.error('[CacheSecurity] Security optimization failed:', error);
      results.errors.push(error.message);
    }
    
    return results;
  }

  /**
   * Find critical assets in source directory
   */
  async findCriticalAssets(sourceDir) {
    const assetPaths = [];
    
    // Add predefined critical assets
    assetPaths.push(...CRITICAL_ASSETS_SRI);
    
    // Scan for additional assets
    try {
      const files = await this.getAllFiles(sourceDir);
      
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        const relativePath = path.relative(process.cwd(), file).replace(/\\/g, '/');
        
        if (['.js', '.css'].includes(ext) && !assetPaths.includes('/' + relativePath)) {
          assetPaths.push('/' + relativePath);
        }
      }
    } catch (error) {
      console.warn('[CacheSecurity] Failed to scan for assets:', error);
    }
    
    return assetPaths;
  }

  /**
   * Get all files recursively
   */
  async getAllFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
        const subFiles = await this.getAllFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Check if directory should be skipped
   */
  shouldSkipDirectory(dirname) {
    return ['node_modules', '.git', 'coverage', 'temp', 'dist'].includes(dirname);
  }

  /**
   * Optimize HTML files for security
   */
  async optimizeHTMLSecurity(sourceDir, outputDir) {
    const htmlFiles = await this.findHTMLFiles(sourceDir);
    
    for (const htmlFile of htmlFiles) {
      try {
        await this.processHTMLFile(htmlFile, outputDir);
      } catch (error) {
        console.error(`[CacheSecurity] Failed to process HTML file ${htmlFile}:`, error);
      }
    }
  }

  /**
   * Find HTML files
   */
  async findHTMLFiles(dir) {
    const files = await this.getAllFiles(dir);
    return files.filter(file => path.extname(file).toLowerCase() === '.html');
  }

  /**
   * Process HTML file for security optimization
   */
  async processHTMLFile(htmlFile, outputDir) {
    let content = await fs.readFile(htmlFile, 'utf8');
    let modified = false;
    
    // Add integrity attributes to script tags
    content = content.replace(/<script\s+src="([^"]+)"(?![^>]*integrity)/g, (match, src) => {
      const integrity = this.generateIntegrityAttribute(src);
      if (integrity) {
        modified = true;
        return `<script src="${src}" ${integrity} crossorigin="anonymous"`;
      }
      return match;
    });
    
    // Add integrity attributes to link tags
    content = content.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)"(?![^>]*integrity)/g, (match, href) => {
      const integrity = this.generateIntegrityAttribute(href);
      if (integrity) {
        modified = true;
        return `<link rel="stylesheet" href="${href}" ${integrity} crossorigin="anonymous"`;
      }
      return match;
    });
    
    // Add CSP meta tag if not present
    if (this.options.CSP.enabled && !content.includes('Content-Security-Policy')) {
      const csp = this.generateCSPHeader();
      const metaTag = `<meta http-equiv="${csp.name}" content="${csp.value}">`;
      content = content.replace('<head>', `<head>\n    ${metaTag}`);
      modified = true;
    }
    
    // Write optimized HTML
    if (modified) {
      const outputPath = outputDir 
        ? path.join(outputDir, path.relative(process.cwd(), htmlFile))
        : htmlFile;
      
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, content);
      console.log(`[CacheSecurity] Optimized HTML: ${outputPath}`);
    }
  }

  /**
   * Get security metrics
   */
  getMetrics() {
    return {
      ...this.securityMetrics,
      sriHashCount: this.sriHashes.size,
      cspViolationCount: this.cspViolations.length,
      securityLevel: this.calculateSecurityLevel()
    };
  }
}

/**
 * Utility function to get asset type
 */
function getAssetType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  const typeMap = {
    '.js': 'script',
    '.mjs': 'script',
    '.css': 'style',
    '.html': 'html',
    '.png': 'image',
    '.jpg': 'image',
    '.jpeg': 'image',
    '.gif': 'image',
    '.svg': 'image',
    '.woff': 'font',
    '.woff2': 'font',
    '.ttf': 'font',
    '.mp4': 'media',
    '.webm': 'media'
  };
  
  return typeMap[ext] || 'static';
}

/**
 * Factory function to create cache security manager
 */
export function createCacheSecurityManager(options) {
  return new CacheSecurityManager(options);
}

/**
 * Generate SRI hash for content
 */
export async function generateSRI(content, algorithm = 'sha384') {
  const manager = new CacheSecurityManager();
  return await manager.generateSRIHash(content, algorithm);
}

/**
 * Validate content integrity
 */
export async function validateIntegrity(content, expectedHash) {
  const manager = new CacheSecurityManager();
  const [algorithm] = expectedHash.split('-');
  const computedHash = await manager.generateSRIHash(content, algorithm);
  return computedHash === expectedHash;
}

export default CacheSecurityManager;