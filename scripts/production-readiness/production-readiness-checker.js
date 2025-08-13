/**
 * Production Readiness Checker
 * Comprehensive production deployment validation and testing suite
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import environmentManager from '../../src/core/config/environment-manager.js';
import productionLogger from '../../src/core/logging/production-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProductionReadinessChecker {
  constructor() {
    this.logger = productionLogger.createChildLogger({
      feature: 'production-readiness',
      component: 'readiness-checker'
    });
    
    this.testResults = new Map();
    this.overallScore = 0;
    this.maxScore = 0;
    this.criticalFailures = [];
    this.warnings = [];
    this.recommendations = [];
    
    this.checklist = new Map([
      // Infrastructure Readiness (25 points)
      ['environment_configuration', { weight: 5, critical: true, description: 'Environment variables and configuration' }],
      ['ssl_certificates', { weight: 4, critical: true, description: 'SSL/TLS certificates and HTTPS setup' }],
      ['database_setup', { weight: 4, critical: true, description: 'Database connectivity and schema' }],
      ['redis_setup', { weight: 3, critical: true, description: 'Redis cache connectivity' }],
      ['solana_connectivity', { weight: 4, critical: true, description: 'Solana blockchain connectivity' }],
      ['load_balancer_config', { weight: 3, critical: false, description: 'Load balancer configuration' }],
      ['auto_scaling_setup', { weight: 2, critical: false, description: 'Auto-scaling configuration' }],
      
      // Security Readiness (30 points)
      ['security_headers', { weight: 5, critical: true, description: 'Security headers implementation' }],
      ['rate_limiting', { weight: 5, critical: true, description: 'Rate limiting configuration' }],
      ['input_sanitization', { weight: 4, critical: true, description: 'Input validation and sanitization' }],
      ['authentication_system', { weight: 4, critical: true, description: 'Authentication and authorization' }],
      ['csp_implementation', { weight: 3, critical: true, description: 'Content Security Policy' }],
      ['ddos_protection', { weight: 3, critical: false, description: 'DDoS protection measures' }],
      ['audit_logging', { weight: 3, critical: true, description: 'Security audit logging' }],
      ['gdpr_compliance', { weight: 3, critical: true, description: 'GDPR compliance features' }],
      
      // Application Readiness (20 points)
      ['gaming_features', { weight: 5, critical: true, description: 'Core gaming features functionality' }],
      ['web3_integration', { weight: 4, critical: true, description: 'Web3 wallet and blockchain integration' }],
      ['voting_system', { weight: 4, critical: true, description: 'Token voting system' }],
      ['clan_system', { weight: 3, critical: true, description: 'Clan management system' }],
      ['content_system', { weight: 2, critical: false, description: 'Content management system' }],
      ['mobile_responsiveness', { weight: 2, critical: false, description: 'Mobile responsiveness and PWA' }],
      
      // Performance Readiness (15 points)
      ['performance_optimization', { weight: 4, critical: false, description: 'Performance optimization measures' }],
      ['caching_strategy', { weight: 3, critical: false, description: 'Caching implementation' }],
      ['cdn_setup', { weight: 3, critical: false, description: 'CDN configuration' }],
      ['lazy_loading', { weight: 2, critical: false, description: 'Lazy loading implementation' }],
      ['bundle_optimization', { weight: 3, critical: false, description: 'JavaScript bundle optimization' }],
      
      // Monitoring & Maintenance Readiness (10 points)
      ['health_monitoring', { weight: 3, critical: true, description: 'Health checks and monitoring' }],
      ['error_tracking', { weight: 2, critical: true, description: 'Error tracking and alerting' }],
      ['logging_system', { weight: 2, critical: true, description: 'Production logging system' }],
      ['backup_system', { weight: 2, critical: true, description: 'Backup and disaster recovery' }],
      ['deployment_automation', { weight: 1, critical: false, description: 'CI/CD pipeline setup' }]
    ]);
    
    this.calculateMaxScore();
  }

  /**
   * Calculate maximum possible score
   */
  calculateMaxScore() {
    this.maxScore = Array.from(this.checklist.values())
      .reduce((sum, item) => sum + item.weight, 0);
  }

  /**
   * Run complete production readiness check
   */
  async runProductionReadinessCheck() {
    this.logger.logInfo('Starting comprehensive production readiness check');
    const startTime = Date.now();

    try {
      // Reset results
      this.testResults.clear();
      this.overallScore = 0;
      this.criticalFailures = [];
      this.warnings = [];
      this.recommendations = [];

      // Run all checks
      await this.runInfrastructureChecks();
      await this.runSecurityChecks();
      await this.runApplicationChecks();
      await this.runPerformanceChecks();
      await this.runMonitoringChecks();

      // Calculate final results
      this.calculateResults();

      const duration = Date.now() - startTime;
      
      this.logger.logInfo('Production readiness check completed', {
        overall_score: this.overallScore,
        max_score: this.maxScore,
        percentage: Math.round((this.overallScore / this.maxScore) * 100),
        duration_ms: duration,
        critical_failures: this.criticalFailures.length,
        warnings: this.warnings.length
      });

      return this.generateReport();

    } catch (error) {
      this.logger.logError(error, {
        action: 'production_readiness_check'
      });
      throw error;
    }
  }

  /**
   * Run infrastructure readiness checks
   */
  async runInfrastructureChecks() {
    this.logger.logInfo('Running infrastructure readiness checks');

    // Environment configuration check
    await this.checkEnvironmentConfiguration();
    
    // SSL certificates check
    await this.checkSSLCertificates();
    
    // Database setup check
    await this.checkDatabaseSetup();
    
    // Redis setup check
    await this.checkRedisSetup();
    
    // Solana connectivity check
    await this.checkSolanaConnectivity();
    
    // Load balancer configuration check
    await this.checkLoadBalancerConfig();
    
    // Auto-scaling setup check
    await this.checkAutoScalingSetup();
  }

  /**
   * Run security readiness checks
   */
  async runSecurityChecks() {
    this.logger.logInfo('Running security readiness checks');

    await this.checkSecurityHeaders();
    await this.checkRateLimiting();
    await this.checkInputSanitization();
    await this.checkAuthenticationSystem();
    await this.checkCSPImplementation();
    await this.checkDDoSProtection();
    await this.checkAuditLogging();
    await this.checkGDPRCompliance();
  }

  /**
   * Run application readiness checks
   */
  async runApplicationChecks() {
    this.logger.logInfo('Running application readiness checks');

    await this.checkGamingFeatures();
    await this.checkWeb3Integration();
    await this.checkVotingSystem();
    await this.checkClanSystem();
    await this.checkContentSystem();
    await this.checkMobileResponsiveness();
  }

  /**
   * Run performance readiness checks
   */
  async runPerformanceChecks() {
    this.logger.logInfo('Running performance readiness checks');

    await this.checkPerformanceOptimization();
    await this.checkCachingStrategy();
    await this.checkCDNSetup();
    await this.checkLazyLoading();
    await this.checkBundleOptimization();
  }

  /**
   * Run monitoring and maintenance readiness checks
   */
  async runMonitoringChecks() {
    this.logger.logInfo('Running monitoring readiness checks');

    await this.checkHealthMonitoring();
    await this.checkErrorTracking();
    await this.checkLoggingSystem();
    await this.checkBackupSystem();
    await this.checkDeploymentAutomation();
  }

  /**
   * Individual check implementations
   */
  
  async checkEnvironmentConfiguration() {
    const checkName = 'environment_configuration';
    try {
      const requiredVars = [
        'DATABASE_URL',
        'REDIS_URL',
        'JWT_SECRET',
        'SESSION_SECRET',
        'SOLANA_RPC_URL',
        'MLG_TOKEN_MINT'
      ];

      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }

      // Check if in production mode
      if (environmentManager.get('NODE_ENV') !== 'production') {
        this.warnings.push('NODE_ENV is not set to production');
      }

      this.recordTestResult(checkName, true, 'All required environment variables configured');
    } catch (error) {
      this.recordTestResult(checkName, false, error.message);
    }
  }

  async checkSSLCertificates() {
    const checkName = 'ssl_certificates';
    try {
      // Check if SSL files exist
      const certPath = '/etc/ssl/certs/mlg-clan.crt';
      const keyPath = '/etc/ssl/private/mlg-clan.key';
      
      try {
        await fs.access(certPath);
        await fs.access(keyPath);
        this.recordTestResult(checkName, true, 'SSL certificates found and accessible');
      } catch (error) {
        throw new Error('SSL certificate files not found or not accessible');
      }
    } catch (error) {
      this.recordTestResult(checkName, false, error.message);
    }
  }

  async checkDatabaseSetup() {
    const checkName = 'database_setup';
    try {
      // Test database connectivity
      const result = await this.testDatabaseConnection();
      if (result) {
        this.recordTestResult(checkName, true, 'Database connectivity verified');
      } else {
        throw new Error('Database connection test failed');
      }
    } catch (error) {
      this.recordTestResult(checkName, false, error.message);
    }
  }

  async checkRedisSetup() {
    const checkName = 'redis_setup';
    try {
      const result = await this.testRedisConnection();
      if (result) {
        this.recordTestResult(checkName, true, 'Redis connectivity verified');
      } else {
        throw new Error('Redis connection test failed');
      }
    } catch (error) {
      this.recordTestResult(checkName, false, error.message);
    }
  }

  async checkSolanaConnectivity() {
    const checkName = 'solana_connectivity';
    try {
      const rpcUrl = environmentManager.get('solana.rpcUrl');
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth'
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        this.recordTestResult(checkName, true, 'Solana network connectivity verified');
      } else {
        throw new Error(`Solana RPC returned ${response.status}`);
      }
    } catch (error) {
      this.recordTestResult(checkName, false, error.message);
    }
  }

  async checkLoadBalancerConfig() {
    const checkName = 'load_balancer_config';
    try {
      // Check if Nginx load balancer config exists
      const configPath = '/etc/nginx/sites-available/mlg-clan';
      await fs.access(configPath);
      
      const config = await fs.readFile(configPath, 'utf8');
      if (config.includes('upstream mlg_clan_backend')) {
        this.recordTestResult(checkName, true, 'Load balancer configuration found');
      } else {
        throw new Error('Load balancer upstream configuration not found');
      }
    } catch (error) {
      this.recordTestResult(checkName, false, error.message);
    }
  }

  async checkAutoScalingSetup() {
    const checkName = 'auto_scaling_setup';
    try {
      // Check if cluster manager exists
      const clusterManagerPath = path.join(process.cwd(), 'scripts', 'auto-scaling', 'cluster-manager.js');
      await fs.access(clusterManagerPath);
      
      this.recordTestResult(checkName, true, 'Auto-scaling cluster manager found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Auto-scaling setup not found');
    }
  }

  async checkSecurityHeaders() {
    const checkName = 'security_headers';
    try {
      // Check if security headers middleware exists
      const headersPath = path.join(process.cwd(), 'src', 'core', 'security', 'middleware', 'securityHeaders.js');
      await fs.access(headersPath);
      
      this.recordTestResult(checkName, true, 'Security headers middleware found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Security headers middleware not found');
    }
  }

  async checkRateLimiting() {
    const checkName = 'rate_limiting';
    try {
      const rateLimiterPath = path.join(process.cwd(), 'src', 'core', 'api', 'middleware', 'comprehensive-rate-limiter.js');
      await fs.access(rateLimiterPath);
      
      this.recordTestResult(checkName, true, 'Rate limiting implementation found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Rate limiting implementation not found');
    }
  }

  async checkInputSanitization() {
    const checkName = 'input_sanitization';
    try {
      const sanitizationPath = path.join(process.cwd(), 'src', 'core', 'security', 'input-sanitization');
      await fs.access(sanitizationPath);
      
      this.recordTestResult(checkName, true, 'Input sanitization system found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Input sanitization system not found');
    }
  }

  async checkAuthenticationSystem() {
    const checkName = 'authentication_system';
    try {
      const authPath = path.join(process.cwd(), 'src', 'core', 'auth', 'gaming-auth-service.js');
      await fs.access(authPath);
      
      this.recordTestResult(checkName, true, 'Gaming authentication system found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Gaming authentication system not found');
    }
  }

  async checkCSPImplementation() {
    const checkName = 'csp_implementation';
    try {
      const cspPath = path.join(process.cwd(), 'src', 'core', 'security', 'csp');
      await fs.access(cspPath);
      
      this.recordTestResult(checkName, true, 'Content Security Policy implementation found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'CSP implementation not found');
    }
  }

  async checkDDoSProtection() {
    const checkName = 'ddos_protection';
    try {
      const ddosPath = path.join(process.cwd(), 'src', 'core', 'security', 'ddos');
      await fs.access(ddosPath);
      
      this.recordTestResult(checkName, true, 'DDoS protection system found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'DDoS protection system not found');
    }
  }

  async checkAuditLogging() {
    const checkName = 'audit_logging';
    try {
      const auditPath = path.join(process.cwd(), 'src', 'core', 'audit');
      await fs.access(auditPath);
      
      this.recordTestResult(checkName, true, 'Audit logging system found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Audit logging system not found');
    }
  }

  async checkGDPRCompliance() {
    const checkName = 'gdpr_compliance';
    try {
      const gdprPath = path.join(process.cwd(), 'src', 'core', 'privacy');
      await fs.access(gdprPath);
      
      this.recordTestResult(checkName, true, 'GDPR compliance system found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'GDPR compliance system not found');
    }
  }

  async checkGamingFeatures() {
    const checkName = 'gaming_features';
    try {
      const featuresPath = path.join(process.cwd(), 'src', 'features');
      const features = await fs.readdir(featuresPath);
      
      const requiredFeatures = ['voting', 'clans', 'content', 'tokens', 'wallet'];
      const foundFeatures = requiredFeatures.filter(feature => features.includes(feature));
      
      if (foundFeatures.length === requiredFeatures.length) {
        this.recordTestResult(checkName, true, 'All core gaming features found');
      } else {
        const missing = requiredFeatures.filter(f => !foundFeatures.includes(f));
        throw new Error(`Missing gaming features: ${missing.join(', ')}`);
      }
    } catch (error) {
      this.recordTestResult(checkName, false, error.message);
    }
  }

  async checkWeb3Integration() {
    const checkName = 'web3_integration';
    try {
      const walletPath = path.join(process.cwd(), 'src', 'features', 'wallet', 'phantom-wallet.js');
      await fs.access(walletPath);
      
      this.recordTestResult(checkName, true, 'Web3 wallet integration found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Web3 wallet integration not found');
    }
  }

  async checkVotingSystem() {
    const checkName = 'voting_system';
    try {
      const votingPath = path.join(process.cwd(), 'src', 'features', 'voting', 'solana-voting-system.js');
      await fs.access(votingPath);
      
      this.recordTestResult(checkName, true, 'Solana voting system found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Solana voting system not found');
    }
  }

  async checkClanSystem() {
    const checkName = 'clan_system';
    try {
      const clanPath = path.join(process.cwd(), 'src', 'features', 'clans');
      await fs.access(clanPath);
      
      this.recordTestResult(checkName, true, 'Clan management system found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Clan management system not found');
    }
  }

  async checkContentSystem() {
    const checkName = 'content_system';
    try {
      const contentPath = path.join(process.cwd(), 'src', 'features', 'content');
      await fs.access(contentPath);
      
      this.recordTestResult(checkName, true, 'Content management system found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Content management system not found');
    }
  }

  async checkMobileResponsiveness() {
    const checkName = 'mobile_responsiveness';
    try {
      const mobileDir = path.join(process.cwd(), 'mobile');
      await fs.access(mobileDir);
      
      const pwaManifest = path.join(process.cwd(), 'public', 'manifest.json');
      await fs.access(pwaManifest);
      
      this.recordTestResult(checkName, true, 'Mobile app and PWA configuration found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Mobile responsiveness setup incomplete');
    }
  }

  async checkPerformanceOptimization() {
    const checkName = 'performance_optimization';
    try {
      const perfPath = path.join(process.cwd(), 'src', 'shared', 'performance');
      await fs.access(perfPath);
      
      this.recordTestResult(checkName, true, 'Performance optimization modules found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Performance optimization modules not found');
    }
  }

  async checkCachingStrategy() {
    const checkName = 'caching_strategy';
    try {
      const cachePath = path.join(process.cwd(), 'src', 'core', 'cache');
      await fs.access(cachePath);
      
      this.recordTestResult(checkName, true, 'Caching system found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Caching system not found');
    }
  }

  async checkCDNSetup() {
    const checkName = 'cdn_setup';
    try {
      const cdnPath = path.join(process.cwd(), 'src', 'core', 'cdn');
      await fs.access(cdnPath);
      
      this.recordTestResult(checkName, true, 'CDN configuration found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'CDN configuration not found');
    }
  }

  async checkLazyLoading() {
    const checkName = 'lazy_loading';
    try {
      const lazyPath = path.join(process.cwd(), 'src', 'shared', 'utils', 'lazy-loading');
      await fs.access(lazyPath);
      
      this.recordTestResult(checkName, true, 'Lazy loading implementation found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Lazy loading implementation not found');
    }
  }

  async checkBundleOptimization() {
    const checkName = 'bundle_optimization';
    try {
      const buildPath = path.join(process.cwd(), 'build');
      await fs.access(buildPath);
      
      this.recordTestResult(checkName, true, 'Optimized build found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Optimized build not found - run npm run build');
    }
  }

  async checkHealthMonitoring() {
    const checkName = 'health_monitoring';
    try {
      const healthPath = path.join(process.cwd(), 'src', 'core', 'monitoring', 'health-monitor.js');
      await fs.access(healthPath);
      
      this.recordTestResult(checkName, true, 'Health monitoring system found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Health monitoring system not found');
    }
  }

  async checkErrorTracking() {
    const checkName = 'error_tracking';
    try {
      const sentryPath = path.join(process.cwd(), 'src', 'core', 'monitoring', 'sentry-manager.js');
      await fs.access(sentryPath);
      
      this.recordTestResult(checkName, true, 'Error tracking system found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Error tracking system not found');
    }
  }

  async checkLoggingSystem() {
    const checkName = 'logging_system';
    try {
      const loggingPath = path.join(process.cwd(), 'src', 'core', 'logging', 'production-logger.js');
      await fs.access(loggingPath);
      
      this.recordTestResult(checkName, true, 'Production logging system found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Production logging system not found');
    }
  }

  async checkBackupSystem() {
    const checkName = 'backup_system';
    try {
      const backupPath = path.join(process.cwd(), 'scripts', 'backup', 'production-backup-manager.js');
      await fs.access(backupPath);
      
      this.recordTestResult(checkName, true, 'Backup system found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'Backup system not found');
    }
  }

  async checkDeploymentAutomation() {
    const checkName = 'deployment_automation';
    try {
      const ciPath = path.join(process.cwd(), '.github', 'workflows', 'production-deploy.yml');
      await fs.access(ciPath);
      
      this.recordTestResult(checkName, true, 'CI/CD pipeline configuration found');
    } catch (error) {
      this.recordTestResult(checkName, false, 'CI/CD pipeline configuration not found');
    }
  }

  /**
   * Helper methods
   */
  
  async testDatabaseConnection() {
    return new Promise((resolve) => {
      const psql = spawn('psql', [
        environmentManager.get('database.url'),
        '-c', 'SELECT 1;'
      ]);

      psql.on('close', (code) => resolve(code === 0));
      psql.on('error', () => resolve(false));
    });
  }

  async testRedisConnection() {
    return new Promise((resolve) => {
      const redisCli = spawn('redis-cli', ['ping']);

      redisCli.on('close', (code) => resolve(code === 0));
      redisCli.on('error', () => resolve(false));
    });
  }

  recordTestResult(testName, passed, message, details = {}) {
    const checkConfig = this.checklist.get(testName);
    if (!checkConfig) {
      this.logger.logWarning('Unknown test name', { test_name: testName });
      return;
    }

    const result = {
      passed,
      message,
      details,
      weight: checkConfig.weight,
      critical: checkConfig.critical,
      description: checkConfig.description,
      timestamp: new Date().toISOString()
    };

    this.testResults.set(testName, result);

    if (passed) {
      this.overallScore += checkConfig.weight;
    } else if (checkConfig.critical) {
      this.criticalFailures.push({
        test: testName,
        message,
        description: checkConfig.description
      });
    } else {
      this.warnings.push({
        test: testName,
        message,
        description: checkConfig.description
      });
    }
  }

  calculateResults() {
    const percentage = Math.round((this.overallScore / this.maxScore) * 100);
    
    // Generate recommendations based on failures
    if (this.criticalFailures.length > 0) {
      this.recommendations.push('❌ Critical failures must be resolved before production deployment');
    }
    
    if (percentage < 70) {
      this.recommendations.push('🔴 Overall readiness score is too low for production');
    } else if (percentage < 85) {
      this.recommendations.push('🟡 Consider addressing warnings before deployment');
    } else if (percentage < 95) {
      this.recommendations.push('🟢 Good readiness score - review warnings if possible');
    } else {
      this.recommendations.push('🎉 Excellent production readiness score!');
    }

    if (this.warnings.length > 5) {
      this.recommendations.push('📝 Consider addressing multiple warnings for optimal deployment');
    }
  }

  generateReport() {
    const percentage = Math.round((this.overallScore / this.maxScore) * 100);
    const readinessLevel = percentage >= 95 ? 'EXCELLENT' :
                          percentage >= 85 ? 'GOOD' :
                          percentage >= 70 ? 'ACCEPTABLE' :
                          percentage >= 50 ? 'POOR' : 'CRITICAL';

    return {
      summary: {
        overall_score: this.overallScore,
        max_score: this.maxScore,
        percentage,
        readiness_level: readinessLevel,
        production_ready: this.criticalFailures.length === 0 && percentage >= 70,
        timestamp: new Date().toISOString()
      },
      results: {
        total_checks: this.checklist.size,
        passed_checks: Array.from(this.testResults.values()).filter(r => r.passed).length,
        failed_checks: Array.from(this.testResults.values()).filter(r => !r.passed).length,
        critical_failures: this.criticalFailures.length,
        warnings: this.warnings.length
      },
      critical_failures: this.criticalFailures,
      warnings: this.warnings,
      recommendations: this.recommendations,
      detailed_results: Object.fromEntries(this.testResults),
      checklist_categories: {
        infrastructure: this.getCategoryResults(['environment_configuration', 'ssl_certificates', 'database_setup', 'redis_setup', 'solana_connectivity', 'load_balancer_config', 'auto_scaling_setup']),
        security: this.getCategoryResults(['security_headers', 'rate_limiting', 'input_sanitization', 'authentication_system', 'csp_implementation', 'ddos_protection', 'audit_logging', 'gdpr_compliance']),
        application: this.getCategoryResults(['gaming_features', 'web3_integration', 'voting_system', 'clan_system', 'content_system', 'mobile_responsiveness']),
        performance: this.getCategoryResults(['performance_optimization', 'caching_strategy', 'cdn_setup', 'lazy_loading', 'bundle_optimization']),
        monitoring: this.getCategoryResults(['health_monitoring', 'error_tracking', 'logging_system', 'backup_system', 'deployment_automation'])
      }
    };
  }

  getCategoryResults(testNames) {
    const categoryResults = testNames.map(name => this.testResults.get(name)).filter(Boolean);
    const passed = categoryResults.filter(r => r.passed).length;
    const total = categoryResults.length;
    const score = categoryResults.reduce((sum, r) => sum + (r.passed ? r.weight : 0), 0);
    const maxScore = categoryResults.reduce((sum, r) => sum + r.weight, 0);
    
    return {
      passed,
      total,
      score,
      max_score: maxScore,
      percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    };
  }

  /**
   * Export report to file
   */
  async exportReport(report, filePath) {
    const reportContent = JSON.stringify(report, null, 2);
    await fs.writeFile(filePath, reportContent, 'utf8');
    
    this.logger.logInfo('Production readiness report exported', {
      file_path: filePath,
      overall_score: report.summary.percentage,
      production_ready: report.summary.production_ready
    });
  }
}

// Export both the class and a convenience function
export default ProductionReadinessChecker;

export async function runProductionReadinessCheck() {
  const checker = new ProductionReadinessChecker();
  return await checker.runProductionReadinessCheck();
}