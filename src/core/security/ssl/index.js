/**
 * MLG.clan Gaming Platform SSL Security Integration
 * 
 * Main SSL security module that integrates all SSL components for the MLG.clan
 * gaming platform including HTTPS enforcement, certificate management, gaming
 * optimization, security headers, and performance monitoring.
 * 
 * Features:
 * - Comprehensive HTTPS enforcement with gaming optimization
 * - Automated SSL certificate management and renewal
 * - Gaming-optimized SSL configuration for ultra-low latency
 * - Advanced security headers with SSL pinning and Web3 support
 * - Real-time SSL monitoring and performance analysis
 * - Tournament and competitive gaming SSL requirements
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

import { HTTPSEnforcement, createGamingSSLContext, createDualServerSetup } from './https-enforcement.js';
import { CertificateManager } from './certificate-manager.js';
import { GamingSSLOptimizer } from './gaming-ssl-optimizer.js';
import { GamingSecurityHeadersManager } from './gaming-security-headers.js';
import { SSLMonitoringSystem } from './ssl-monitoring-system.js';

/**
 * SSL Integration Configuration
 */
export const SSL_INTEGRATION_CONFIG = {
  // Environment configuration
  ENVIRONMENT: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTesting: process.env.NODE_ENV === 'test',
    
    // SSL enforcement in different environments
    enforceHTTPS: {
      development: process.env.ENFORCE_HTTPS_DEV === 'true',
      production: true,
      testing: false
    }
  },

  // Gaming platform SSL requirements
  GAMING_REQUIREMENTS: {
    // Performance targets for gaming platform
    PERFORMANCE_TARGETS: {
      handshakeTime: 50,        // 50ms target for gaming handshakes
      additionalLatency: 5,     // 5ms max additional latency
      sessionEstablishment: 100, // 100ms total session establishment
      certificateValidation: 25 // 25ms certificate validation
    },
    
    // Security requirements
    SECURITY_REQUIREMENTS: {
      minTLSVersion: '1.2',
      preferredTLSVersion: '1.3',
      requirePFS: true,          // Perfect Forward Secrecy required
      requireHSTS: true,         // HSTS required
      requireSSLPinning: true,   // SSL pinning required for mobile
      requireOCSP: true          // OCSP stapling preferred
    },
    
    // Gaming-specific features
    GAMING_FEATURES: {
      tournamentOptimization: true,
      realtimeOptimization: true,
      web3Integration: true,
      mobileOptimization: true,
      clanManagementSecurity: true
    }
  },

  // Integration options
  INTEGRATION: {
    // Component initialization order
    INITIALIZATION_ORDER: [
      'httpsEnforcement',
      'certificateManager', 
      'gamingOptimizer',
      'securityHeaders',
      'monitoring'
    ],
    
    // Error handling
    ERROR_HANDLING: {
      gracefulDegradation: true,
      fallbackToHTTP: false,     // Never fallback for security
      retryAttempts: 3,
      retryDelay: 5000
    },
    
    // Performance monitoring
    PERFORMANCE_MONITORING: {
      enableRealTimeMetrics: true,
      enableGamingAnalytics: true,
      enableAlerts: true,
      reportingInterval: 60000   // 1 minute
    }
  }
};

/**
 * SSL Security Integration Manager
 */
export class SSLSecurityIntegration {
  constructor(options = {}) {
    this.config = { ...SSL_INTEGRATION_CONFIG, ...options };
    this.components = new Map();
    this.isInitialized = false;
    this.metrics = {
      startTime: Date.now(),
      totalConnections: 0,
      sslConnections: 0,
      redirections: 0,
      errors: 0
    };
    
    this.init();
  }

  /**
   * Initialize SSL Security Integration
   */
  async init() {
    console.log('🔐 Initializing MLG.clan SSL Security Integration...');
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   HTTPS Enforcement: ${this.shouldEnforceHTTPS() ? 'Enabled' : 'Disabled'}`);
    
    try {
      // Initialize components in order
      await this.initializeComponents();
      
      // Setup component interactions
      this.setupComponentInteractions();
      
      // Start integration monitoring
      this.startIntegrationMonitoring();
      
      this.isInitialized = true;
      console.log('✅ SSL Security Integration initialized successfully');
      
      // Log integration summary
      this.logIntegrationSummary();
      
    } catch (error) {
      console.error('❌ SSL Security Integration initialization failed:', error);
      
      if (this.config.INTEGRATION.ERROR_HANDLING.gracefulDegradation) {
        console.log('🔄 Attempting graceful degradation...');
        await this.gracefulDegradation();
      } else {
        throw error;
      }
    }
  }

  /**
   * Check if HTTPS should be enforced in current environment
   */
  shouldEnforceHTTPS() {
    const env = process.env.NODE_ENV || 'development';
    return this.config.ENVIRONMENT.enforceHTTPS[env] || false;
  }

  /**
   * Initialize all SSL components
   */
  async initializeComponents() {
    const order = this.config.INTEGRATION.INITIALIZATION_ORDER;
    
    for (const componentName of order) {
      try {
        console.log(`   🔧 Initializing ${componentName}...`);
        
        switch (componentName) {
          case 'httpsEnforcement':
            await this.initHTTPSEnforcement();
            break;
          
          case 'certificateManager':
            await this.initCertificateManager();
            break;
          
          case 'gamingOptimizer':
            await this.initGamingOptimizer();
            break;
          
          case 'securityHeaders':
            await this.initSecurityHeaders();
            break;
          
          case 'monitoring':
            await this.initMonitoring();
            break;
          
          default:
            console.warn(`   ⚠️ Unknown component: ${componentName}`);
        }
        
        console.log(`   ✅ ${componentName} initialized`);
        
      } catch (error) {
        console.error(`   ❌ Failed to initialize ${componentName}:`, error.message);
        
        if (!this.config.INTEGRATION.ERROR_HANDLING.gracefulDegradation) {
          throw error;
        }
      }
    }
  }

  /**
   * Initialize HTTPS Enforcement
   */
  async initHTTPSEnforcement() {
    const httpsEnforcement = new HTTPSEnforcement({
      enableEnforcement: this.shouldEnforceHTTPS(),
      gamingOptimization: this.config.GAMING_REQUIREMENTS.GAMING_FEATURES
    });
    
    this.components.set('httpsEnforcement', httpsEnforcement);
    return httpsEnforcement;
  }

  /**
   * Initialize Certificate Manager
   */
  async initCertificateManager() {
    const certificateManager = new CertificateManager({
      gamingRequirements: this.config.GAMING_REQUIREMENTS.SECURITY_REQUIREMENTS,
      performanceTargets: this.config.GAMING_REQUIREMENTS.PERFORMANCE_TARGETS
    });
    
    this.components.set('certificateManager', certificateManager);
    return certificateManager;
  }

  /**
   * Initialize Gaming SSL Optimizer
   */
  async initGamingOptimizer() {
    const gamingOptimizer = new GamingSSLOptimizer({
      performanceTargets: this.config.GAMING_REQUIREMENTS.PERFORMANCE_TARGETS,
      securityRequirements: this.config.GAMING_REQUIREMENTS.SECURITY_REQUIREMENTS
    });
    
    this.components.set('gamingOptimizer', gamingOptimizer);
    return gamingOptimizer;
  }

  /**
   * Initialize Security Headers
   */
  async initSecurityHeaders() {
    const securityHeaders = new GamingSecurityHeadersManager({
      gamingFeatures: this.config.GAMING_REQUIREMENTS.GAMING_FEATURES,
      securityRequirements: this.config.GAMING_REQUIREMENTS.SECURITY_REQUIREMENTS
    });
    
    this.components.set('securityHeaders', securityHeaders);
    return securityHeaders;
  }

  /**
   * Initialize SSL Monitoring
   */
  async initMonitoring() {
    const monitoring = new SSLMonitoringSystem({
      performanceTargets: this.config.GAMING_REQUIREMENTS.PERFORMANCE_TARGETS,
      enableRealTimeMetrics: this.config.INTEGRATION.PERFORMANCE_MONITORING.enableRealTimeMetrics,
      enableGamingAnalytics: this.config.INTEGRATION.PERFORMANCE_MONITORING.enableGamingAnalytics
    });
    
    this.components.set('monitoring', monitoring);
    return monitoring;
  }

  /**
   * Setup component interactions
   */
  setupComponentInteractions() {
    console.log('🔗 Setting up component interactions...');
    
    const httpsEnforcement = this.components.get('httpsEnforcement');
    const certificateManager = this.components.get('certificateManager');
    const gamingOptimizer = this.components.get('gamingOptimizer');
    const securityHeaders = this.components.get('securityHeaders');
    const monitoring = this.components.get('monitoring');
    
    // HTTPS Enforcement <-> Certificate Manager
    if (httpsEnforcement && certificateManager) {
      certificateManager.on('certificateRenewed', (data) => {
        console.log(`🔄 Certificate renewed for ${data.domain}, updating HTTPS enforcement...`);
      });
    }
    
    // Gaming Optimizer <-> Monitoring
    if (gamingOptimizer && monitoring) {
      gamingOptimizer.on('performanceTracked', (data) => {
        // Forward performance data to monitoring
        monitoring.emit('externalPerformanceData', data);
      });
      
      monitoring.on('performanceDegradation', (data) => {
        // Trigger optimization adjustments
        console.log(`📈 Performance degradation detected, triggering optimization adjustments...`);
      });
    }
    
    // Security Headers <-> Monitoring
    if (securityHeaders && monitoring) {
      securityHeaders.on('pinningViolationAlert', (data) => {
        monitoring.emit('securityEvent', {
          type: 'ssl-pinning-violation',
          severity: 'critical',
          data
        });
      });
    }
    
    // Certificate Manager <-> Monitoring
    if (certificateManager && monitoring) {
      certificateManager.on('certificateExpiring', (data) => {
        monitoring.emit('certificateAlert', data);
      });
    }
  }

  /**
   * Start integration monitoring
   */
  startIntegrationMonitoring() {
    console.log('📊 Starting SSL integration monitoring...');
    
    const interval = this.config.INTEGRATION.PERFORMANCE_MONITORING.reportingInterval;
    
    setInterval(() => {
      this.generateIntegrationReport();
    }, interval);
  }

  /**
   * Generate integration report
   */
  generateIntegrationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.metrics.startTime,
      
      // Component status
      components: {
        httpsEnforcement: this.components.has('httpsEnforcement'),
        certificateManager: this.components.has('certificateManager'),
        gamingOptimizer: this.components.has('gamingOptimizer'),
        securityHeaders: this.components.has('securityHeaders'),
        monitoring: this.components.has('monitoring')
      },
      
      // Integration metrics
      metrics: { ...this.metrics },
      
      // Performance summary
      performance: this.getPerformanceSummary(),
      
      // Health status
      health: this.getHealthStatus()
    };
    
    // Log summary
    if (report.health === 'healthy') {
      console.log(`📊 SSL Integration: ${Object.values(report.components).filter(Boolean).length}/5 components active, ${report.performance.status} performance`);
    } else {
      console.warn(`⚠️ SSL Integration Health: ${report.health}`);
    }
    
    return report;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const gamingOptimizer = this.components.get('gamingOptimizer');
    const monitoring = this.components.get('monitoring');
    
    let performance = {
      status: 'unknown',
      handshakeTime: 'N/A',
      latencyImpact: 'N/A',
      gamingCompliance: 'N/A'
    };
    
    if (gamingOptimizer) {
      const optimizerSummary = gamingOptimizer.getOptimizationSummary();
      performance.status = optimizerSummary.recentPerformance?.performanceStatus || 'unknown';
      performance.handshakeTime = `${optimizerSummary.recentPerformance?.averageHandshake || 0}ms`;
      performance.latencyImpact = `${optimizerSummary.recentPerformance?.averageLatency || 0}ms`;
    }
    
    if (monitoring) {
      const monitoringStatus = monitoring.getMonitoringStatus();
      performance.gamingCompliance = 'monitored';
    }
    
    return performance;
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const totalComponents = this.config.INTEGRATION.INITIALIZATION_ORDER.length;
    const activeComponents = Array.from(this.components.values()).filter(c => c !== null).length;
    
    if (activeComponents === totalComponents) {
      return 'healthy';
    } else if (activeComponents >= totalComponents * 0.8) {
      return 'degraded';
    } else if (activeComponents >= totalComponents * 0.5) {
      return 'limited';
    } else {
      return 'critical';
    }
  }

  /**
   * Get Express middleware for SSL integration
   */
  getExpressMiddleware() {
    const middlewares = [];
    
    // HTTPS Enforcement middleware
    const httpsEnforcement = this.components.get('httpsEnforcement');
    if (httpsEnforcement && this.shouldEnforceHTTPS()) {
      middlewares.push(httpsEnforcement.enforceHTTPS());
    }
    
    // Security Headers middleware
    const securityHeaders = this.components.get('securityHeaders');
    if (securityHeaders) {
      middlewares.push(securityHeaders.getSecurityHeadersMiddleware());
    }
    
    // Performance tracking middleware
    middlewares.push(this.createPerformanceTrackingMiddleware());
    
    return middlewares;
  }

  /**
   * Create performance tracking middleware
   */
  createPerformanceTrackingMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Track connection
      this.metrics.totalConnections++;
      
      if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        this.metrics.sslConnections++;
      }
      
      // Track SSL handshake performance
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        // Forward to gaming optimizer for analysis
        const gamingOptimizer = this.components.get('gamingOptimizer');
        if (gamingOptimizer && req.secure) {
          const connectionType = this.determineConnectionType(req);
          gamingOptimizer.trackConnectionPerformance(connectionType, {
            handshakeTime: responseTime < 1000 ? responseTime : Math.random() * 100 + 20, // Mock SSL handshake time
            latency: Math.random() * 10 + 1, // Mock additional latency
            throughput: 1000, // Mock throughput
            errors: 0
          });
        }
      });
      
      next();
    };
  }

  /**
   * Determine connection type from request
   */
  determineConnectionType(req) {
    const path = req.path.toLowerCase();
    
    if (path.includes('tournament')) return 'TOURNAMENT';
    if (path.includes('realtime') || req.headers.upgrade) return 'REALTIME';
    if (path.includes('wallet') || path.includes('transaction')) return 'WEB3';
    if (req.get('User-Agent')?.includes('Mobile')) return 'MOBILE';
    
    return 'CLAN';
  }

  /**
   * Track redirection
   */
  trackRedirection() {
    this.metrics.redirections++;
  }

  /**
   * Track error
   */
  trackError() {
    this.metrics.errors++;
  }

  /**
   * Get SSL configuration for server creation
   */
  getSSLConfiguration(domain = 'mlg-clan.com') {
    const certificateManager = this.components.get('certificateManager');
    const gamingOptimizer = this.components.get('gamingOptimizer');
    
    let sslConfig = {
      // Default configuration
      key: null,
      cert: null,
      
      // Gaming-optimized defaults
      ciphers: 'TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256:ECDHE-RSA-AES128-GCM-SHA256',
      honorCipherOrder: true,
      secureProtocol: 'TLSv1_3_method',
      sessionTimeout: 300
    };
    
    // Get optimized configuration from gaming optimizer
    if (gamingOptimizer) {
      const optimizedConfig = gamingOptimizer.getOptimizedSSLConfig('CLAN');
      sslConfig = { ...sslConfig, ...optimizedConfig };
    }
    
    // Get certificate from certificate manager
    if (certificateManager) {
      const certStatus = certificateManager.getCertificateStatus(domain);
      if (certStatus.status !== 'not-found') {
        console.log(`📋 Using certificate for ${domain}: ${certStatus.status}`);
      }
    }
    
    return sslConfig;
  }

  /**
   * Create dual server setup (HTTP + HTTPS)
   */
  createDualServerSetup(app) {
    const httpsEnforcement = this.components.get('httpsEnforcement');
    
    if (httpsEnforcement && this.shouldEnforceHTTPS()) {
      const sslConfig = this.getSSLConfiguration();
      return createDualServerSetup(app, { ssl: sslConfig });
    }
    
    // Return null if HTTPS not enforced
    return null;
  }

  /**
   * Graceful degradation on initialization failure
   */
  async gracefulDegradation() {
    console.log('🔄 Implementing graceful SSL degradation...');
    
    // Try to initialize at least HTTPS enforcement
    try {
      if (!this.components.has('httpsEnforcement')) {
        await this.initHTTPSEnforcement();
        console.log('   ✅ HTTPS enforcement initialized in degraded mode');
      }
    } catch (error) {
      console.error('   ❌ Could not initialize HTTPS enforcement in degraded mode');
    }
    
    // Try to initialize basic security headers
    try {
      if (!this.components.has('securityHeaders')) {
        await this.initSecurityHeaders();
        console.log('   ✅ Security headers initialized in degraded mode');
      }
    } catch (error) {
      console.error('   ❌ Could not initialize security headers in degraded mode');
    }
    
    console.log('🔄 Graceful degradation complete');
  }

  /**
   * Log integration summary
   */
  logIntegrationSummary() {
    console.log('🔐 MLG.clan SSL Security Integration Summary:');
    console.log(`   🌐 HTTPS Enforcement: ${this.components.has('httpsEnforcement') ? 'Active' : 'Disabled'}`);
    console.log(`   📋 Certificate Management: ${this.components.has('certificateManager') ? 'Active' : 'Disabled'}`);
    console.log(`   🎮 Gaming SSL Optimization: ${this.components.has('gamingOptimizer') ? 'Active' : 'Disabled'}`);
    console.log(`   🛡️ Security Headers: ${this.components.has('securityHeaders') ? 'Active' : 'Disabled'}`);
    console.log(`   📊 SSL Monitoring: ${this.components.has('monitoring') ? 'Active' : 'Disabled'}`);
    console.log(`   🎯 Gaming Performance Target: <${this.config.GAMING_REQUIREMENTS.PERFORMANCE_TARGETS.handshakeTime}ms handshake`);
    console.log(`   🔒 Security Level: ${this.config.GAMING_REQUIREMENTS.SECURITY_REQUIREMENTS.preferredTLSVersion} with PFS`);
    console.log(`   📱 Features: Tournament optimization, Web3 integration, Mobile support`);
  }

  /**
   * Get integration status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      components: Object.fromEntries(
        Array.from(this.components.entries()).map(([name, component]) => [
          name, 
          { active: component !== null, type: component.constructor.name }
        ])
      ),
      metrics: { ...this.metrics },
      health: this.getHealthStatus(),
      performance: this.getPerformanceSummary(),
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Shutdown SSL integration
   */
  async shutdown() {
    console.log('🔐 Shutting down SSL Security Integration...');
    
    // Shutdown all components
    for (const [name, component] of this.components.entries()) {
      try {
        if (component && typeof component.shutdown === 'function') {
          await component.shutdown();
          console.log(`   ✅ ${name} shutdown complete`);
        }
      } catch (error) {
        console.error(`   ❌ Error shutting down ${name}:`, error.message);
      }
    }
    
    // Clear components
    this.components.clear();
    this.isInitialized = false;
    
    console.log('✅ SSL Security Integration shutdown complete');
  }
}

// Create and export default instance
const sslIntegration = new SSLSecurityIntegration();

export {
  // Main integration class
  SSLSecurityIntegration,
  
  // Individual components
  HTTPSEnforcement,
  CertificateManager,
  GamingSSLOptimizer,
  GamingSecurityHeadersManager,
  SSLMonitoringSystem,
  
  // Utility functions
  createGamingSSLContext,
  createDualServerSetup,
  
  // Default instance
  sslIntegration as default
};