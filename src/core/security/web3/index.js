/**
 * MLG.clan Web3 Security System - Main Export
 * Complete security solution for Solana Web3 interactions
 * 
 * @author Claude Code - Solana Web3 Security Architect
 * @version 1.0.0
 * @created 2025-08-13
 */

// Core Security Components
export { default as Web3SecurityManager, WEB3_SECURITY_CONFIG } from './web3-security-manager.js';
export { default as Web3PrivateKeyManager, PRIVATE_KEY_SECURITY_CONFIG } from './web3-private-key-manager.js';
export { default as SPLTokenSecurityManager, SPL_TOKEN_SECURITY_CONFIG } from './spl-token-security.js';
export { default as Web3SecurityIntegration, WEB3_INTEGRATION_CONFIG } from './web3-security-integration.js';

/**
 * Web3 Security System Factory
 * Creates a fully configured and integrated Web3 security system
 */
export class Web3SecuritySystem {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.auditLogger = options.auditLogger;
    this.config = { ...options.config };
    
    // Core components
    this.securityManager = null;
    this.privateKeyManager = null;
    this.tokenSecurityManager = null;
    this.integrationLayer = null;
    
    // System state
    this.initialized = false;
    this.healthStatus = {
      overall: 'unknown',
      components: {},
      lastCheck: null
    };
  }
  
  /**
   * Initialize the complete Web3 security system
   */
  async initialize() {
    this.logger.info('🛡️ Initializing Complete Web3 Security System...');
    
    try {
      // Initialize integration layer (which initializes all components)
      const { default: Web3SecurityIntegration } = await import('./web3-security-integration.js');
      
      this.integrationLayer = new Web3SecurityIntegration({
        logger: this.logger,
        auditLogger: this.auditLogger,
        config: this.config
      });
      
      await this.integrationLayer.initialize();
      
      // Get references to core components
      this.securityManager = this.integrationLayer.web3SecurityManager;
      this.privateKeyManager = this.integrationLayer.privateKeyManager;
      this.tokenSecurityManager = this.integrationLayer.tokenSecurityManager;
      
      this.initialized = true;
      
      // Perform initial health check
      await this.performHealthCheck();
      
      this.logger.info('✅ Web3 Security System fully initialized and operational');
      
      return {
        success: true,
        components: {
          securityManager: !!this.securityManager,
          privateKeyManager: !!this.privateKeyManager,
          tokenSecurityManager: !!this.tokenSecurityManager,
          integrationLayer: !!this.integrationLayer
        },
        healthStatus: this.healthStatus
      };
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize Web3 Security System:', error);
      throw error;
    }
  }
  
  /**
   * Execute secure Web3 operation through the integrated system
   */
  async executeSecureOperation(operationType, operationData, userContext) {
    if (!this.initialized) {
      throw new Error('Web3 Security System not initialized');
    }
    
    return await this.integrationLayer.executeSecureWeb3Operation(
      operationType,
      operationData,
      userContext
    );
  }
  
  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    if (!this.initialized) {
      return {
        initialized: false,
        status: 'not_initialized'
      };
    }
    
    return {
      initialized: true,
      healthStatus: this.healthStatus,
      integration: this.integrationLayer.getIntegrationStatus(),
      security: {
        web3: this.securityManager.getSecurityStatus(),
        tokens: this.tokenSecurityManager.getSecurityStatus(),
        privateKeys: this.privateKeyManager.getSecurityStatus()
      }
    };
  }
  
  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const healthCheck = {
      overall: 'healthy',
      components: {},
      lastCheck: new Date(),
      issues: []
    };
    
    try {
      // Check Web3 Security Manager
      if (this.securityManager) {
        const web3Status = this.securityManager.getSecurityStatus();
        healthCheck.components.web3Security = {
          status: web3Status.isPaused ? 'paused' : 'healthy',
          details: web3Status
        };
        
        if (web3Status.isPaused) {
          healthCheck.issues.push('Web3 operations are paused');
          healthCheck.overall = 'degraded';
        }
      }
      
      // Check Token Security Manager
      if (this.tokenSecurityManager) {
        const tokenStatus = this.tokenSecurityManager.getSecurityStatus();
        healthCheck.components.tokenSecurity = {
          status: tokenStatus.tokenFrozen ? 'frozen' : 'healthy',
          details: tokenStatus
        };
        
        if (tokenStatus.tokenFrozen) {
          healthCheck.issues.push('Token operations are frozen');
          healthCheck.overall = 'degraded';
        }
      }
      
      // Check Private Key Manager
      if (this.privateKeyManager) {
        const keyStatus = this.privateKeyManager.getSecurityStatus();
        healthCheck.components.privateKeySecurity = {
          status: keyStatus.emergencyMode ? 'emergency' : 'healthy',
          details: keyStatus
        };
        
        if (keyStatus.emergencyMode) {
          healthCheck.issues.push('Private key manager in emergency mode');
          healthCheck.overall = 'critical';
        }
      }
      
      // Check Integration Layer
      if (this.integrationLayer) {
        const integrationStatus = this.integrationLayer.getIntegrationStatus();
        healthCheck.components.integration = {
          status: integrationStatus.emergencyState.level === 'normal' ? 'healthy' : 'emergency',
          details: integrationStatus
        };
        
        if (integrationStatus.emergencyState.level !== 'normal') {
          healthCheck.issues.push(`Emergency level: ${integrationStatus.emergencyState.level}`);
          healthCheck.overall = 'critical';
        }
      }
      
      this.healthStatus = healthCheck;
      
    } catch (error) {
      this.logger.error('Health check failed:', error);
      healthCheck.overall = 'unhealthy';
      healthCheck.issues.push(`Health check error: ${error.message}`);
      this.healthStatus = healthCheck;
    }
    
    return this.healthStatus;
  }
  
  /**
   * Emergency shutdown of all Web3 operations
   */
  async emergencyShutdown(reason, authorizedBy) {
    this.logger.error(`🚨 EMERGENCY SHUTDOWN INITIATED: ${reason} (by: ${authorizedBy})`);
    
    const shutdownResults = {
      timestamp: new Date(),
      reason,
      authorizedBy,
      results: {}
    };
    
    try {
      // Pause Web3 operations
      if (this.securityManager) {
        await this.securityManager.emergencyPause(reason, authorizedBy);
        shutdownResults.results.web3Paused = true;
      }
      
      // Freeze token operations
      if (this.tokenSecurityManager) {
        await this.tokenSecurityManager.emergencyFreeze(reason, authorizedBy);
        shutdownResults.results.tokensFrozen = true;
      }
      
      // Escalate through integration layer
      if (this.integrationLayer) {
        await this.integrationLayer.escalateEmergency('critical', {
          trigger: 'emergency_shutdown',
          reason,
          authorizedBy
        });
        shutdownResults.results.emergencyEscalated = true;
      }
      
      shutdownResults.success = true;
      this.logger.error('🚨 Emergency shutdown completed successfully');
      
    } catch (error) {
      shutdownResults.success = false;
      shutdownResults.error = error.message;
      this.logger.error('❌ Emergency shutdown failed:', error);
    }
    
    return shutdownResults;
  }
  
  /**
   * Cleanup and destroy the security system
   */
  async destroy() {
    this.logger.info('🔒 Destroying Web3 Security System...');
    
    try {
      if (this.privateKeyManager) {
        this.privateKeyManager.destroy();
      }
      
      if (this.integrationLayer) {
        // Integration layer cleanup would go here
      }
      
      this.initialized = false;
      this.securityManager = null;
      this.privateKeyManager = null;
      this.tokenSecurityManager = null;
      this.integrationLayer = null;
      
      this.logger.info('✅ Web3 Security System destroyed safely');
      
    } catch (error) {
      this.logger.error('❌ Error during security system destruction:', error);
      throw error;
    }
  }
}

/**
 * Create and initialize a Web3 Security System
 */
export async function createWeb3SecuritySystem(options = {}) {
  const system = new Web3SecuritySystem(options);
  await system.initialize();
  return system;
}

/**
 * Security utilities and helpers
 */
export const Web3SecurityUtils = {
  /**
   * Validate Web3 configuration
   */
  validateConfig(config) {
    const errors = [];
    
    if (config.TRANSACTION?.MAX_ACCOUNTS_PER_TX > 32) {
      errors.push('MAX_ACCOUNTS_PER_TX cannot exceed Solana limit of 32');
    }
    
    if (config.TRANSACTION?.MAX_TX_SIZE_BYTES > 1232) {
      errors.push('MAX_TX_SIZE_BYTES cannot exceed Solana packet limit of 1232');
    }
    
    if (config.RPC?.TIMEOUT_MS <= 0) {
      errors.push('RPC timeout must be positive');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  /**
   * Generate secure session challenge
   */
  generateSecureChallenge() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  },
  
  /**
   * Security event severity levels
   */
  SEVERITY_LEVELS: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
  },
  
  /**
   * Common security patterns
   */
  SECURITY_PATTERNS: {
    PRIVATE_KEY_REGEX: /[1-9A-HJ-NP-Za-km-z]{32,}/,
    SOLANA_ADDRESS_REGEX: /[1-9A-HJ-NP-Za-km-z]{32,44}/,
    TRANSACTION_SIGNATURE_REGEX: /[1-9A-HJ-NP-Za-km-z]{87,88}/
  }
};

// Export default as the main security system
export default Web3SecuritySystem;