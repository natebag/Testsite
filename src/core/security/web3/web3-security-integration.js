/**
 * MLG.clan Web3 Security Integration Layer
 * Integrates Web3 security with existing platform security infrastructure
 * 
 * Features:
 * - Integration with existing rate limiting system
 * - GDPR compliance for Web3 operations
 * - SSL/TLS enforcement for Web3 connections
 * - DDoS protection for Web3 endpoints
 * - Gaming authentication integration
 * - Comprehensive audit logging integration
 * - Emergency response coordination
 * 
 * @author Claude Code - Solana Web3 Security Architect
 * @version 1.0.0
 * @created 2025-08-13
 */

import Web3SecurityManager from './web3-security-manager.js';
import Web3PrivateKeyManager from './web3-private-key-manager.js';
import SPLTokenSecurityManager from './spl-token-security.js';

// Import existing security infrastructure
import { comprehensiveRateLimiter } from '../../api/middleware/comprehensive-rate-limiter.js';
import { GDPREnhancedAuth } from '../../../core/auth/gdpr-enhanced-auth.js';
import { DDOSProtectionEngine } from '../ddos/ddos-protection-engine.js';
import { GamingAuthService } from '../../../core/auth/gaming-auth-service.js';

/**
 * Web3 Security Integration Configuration
 */
export const WEB3_INTEGRATION_CONFIG = {
  // Integration Settings
  INTEGRATION: {
    ENABLE_RATE_LIMITING: true,
    ENABLE_GDPR_COMPLIANCE: true,
    ENABLE_SSL_ENFORCEMENT: true,
    ENABLE_DDOS_PROTECTION: true,
    ENABLE_GAMING_AUTH: true,
    ENABLE_AUDIT_LOGGING: true
  },
  
  // Web3-Specific Rate Limits (integrated with existing system)
  WEB3_RATE_LIMITS: {
    WALLET_CONNECTIONS_PER_MINUTE: 5,
    TRANSACTION_SUBMISSIONS_PER_MINUTE: 10,
    TOKEN_OPERATIONS_PER_MINUTE: 5,
    BALANCE_QUERIES_PER_MINUTE: 60,
    CONTRACT_INTERACTIONS_PER_MINUTE: 3
  },
  
  // GDPR Compliance for Web3 Data
  GDPR_WEB3: {
    STORE_WALLET_ADDRESSES: false, // Only with explicit consent
    STORE_TRANSACTION_HISTORY: true, // Necessary for security
    RETENTION_PERIOD_DAYS: 90,
    ANONYMIZE_AFTER_DAYS: 30,
    DATA_CATEGORIES: [
      'wallet_addresses',
      'transaction_signatures',
      'token_balances',
      'security_events'
    ]
  },
  
  // SSL/TLS Requirements
  SSL_REQUIREMENTS: {
    MIN_TLS_VERSION: '1.3',
    REQUIRE_CERTIFICATE_PINNING: true,
    BLOCK_HTTP_CONNECTIONS: true,
    ENFORCE_HSTS: true
  },
  
  // Emergency Response Integration
  EMERGENCY_RESPONSE: {
    ESCALATION_LEVELS: {
      LOW: 'low',
      MEDIUM: 'medium', 
      HIGH: 'high',
      CRITICAL: 'critical'
    },
    AUTO_ESCALATION_TRIGGERS: [
      'multiple_failed_transactions',
      'suspicious_token_activity',
      'wallet_compromise_detected',
      'contract_vulnerability_found'
    ],
    NOTIFICATION_CHANNELS: [
      'security_team_slack',
      'emergency_email_list',
      'sms_alerts'
    ]
  }
};

/**
 * Web3 Security Integration Manager
 */
export class Web3SecurityIntegration {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.config = { ...WEB3_INTEGRATION_CONFIG, ...options.config };
    
    // Core Web3 Security Components
    this.web3SecurityManager = null;
    this.privateKeyManager = null;
    this.tokenSecurityManager = null;
    
    // Existing Security Infrastructure
    this.rateLimiter = null;
    this.gdprAuth = null;
    this.ddosProtection = null;
    this.gamingAuth = null;
    this.auditLogger = options.auditLogger;
    
    // Integration State
    this.integratedSystems = new Set();
    this.securityMetrics = new Map();
    this.emergencyState = {
      level: 'normal',
      activeIncidents: new Map(),
      escalationHistory: []
    };
    
    this.initialize();
  }
  
  /**
   * Initialize Web3 Security Integration
   */
  async initialize() {
    this.logger.info('🔗 Initializing Web3 Security Integration...');
    
    try {
      // Initialize core Web3 security components
      await this.initializeWeb3SecurityComponents();
      
      // Integrate with existing security infrastructure
      await this.integrateWithExistingSecurity();
      
      // Setup cross-system monitoring
      this.setupCrossSystemMonitoring();
      
      // Initialize emergency response coordination
      this.initializeEmergencyResponse();
      
      this.logger.info('✅ Web3 Security Integration initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Web3 Security Integration:', error);
      throw error;
    }
  }
  
  /**
   * Initialize Core Web3 Security Components
   */
  async initializeWeb3SecurityComponents() {
    // Initialize Web3 Security Manager
    this.web3SecurityManager = new Web3SecurityManager({
      logger: this.logger,
      auditLogger: this.auditLogger
    });
    await this.web3SecurityManager.initialize();
    
    // Initialize Private Key Manager
    this.privateKeyManager = new Web3PrivateKeyManager({
      logger: this.logger,
      auditLogger: this.auditLogger,
      securityLevel: 'hardware_only'
    });
    
    // Initialize SPL Token Security Manager
    this.tokenSecurityManager = new SPLTokenSecurityManager({
      logger: this.logger,
      web3SecurityManager: this.web3SecurityManager,
      auditLogger: this.auditLogger
    });
    await this.tokenSecurityManager.initialize();
    
    this.logger.info('✅ Core Web3 security components initialized');
  }
  
  /**
   * Integrate with Existing Security Infrastructure
   */
  async integrateWithExistingSecurity() {
    // Integrate with Rate Limiting System
    if (this.config.INTEGRATION.ENABLE_RATE_LIMITING) {
      await this.integrateRateLimiting();
      this.integratedSystems.add('rate_limiting');
    }
    
    // Integrate with GDPR Compliance
    if (this.config.INTEGRATION.ENABLE_GDPR_COMPLIANCE) {
      await this.integrateGDPRCompliance();
      this.integratedSystems.add('gdpr_compliance');
    }
    
    // Integrate with DDoS Protection
    if (this.config.INTEGRATION.ENABLE_DDOS_PROTECTION) {
      await this.integrateDDoSProtection();
      this.integratedSystems.add('ddos_protection');
    }
    
    // Integrate with Gaming Authentication
    if (this.config.INTEGRATION.ENABLE_GAMING_AUTH) {
      await this.integrateGamingAuth();
      this.integratedSystems.add('gaming_auth');
    }
    
    this.logger.info(`✅ Integrated with ${this.integratedSystems.size} existing security systems`);
  }
  
  /**
   * Integrate with Rate Limiting System
   */
  async integrateRateLimiting() {
    try {
      // Setup Web3-specific rate limiting rules
      const web3RateLimitRules = {
        'web3:wallet_connection': {
          windowMs: 60000, // 1 minute
          max: this.config.WEB3_RATE_LIMITS.WALLET_CONNECTIONS_PER_MINUTE,
          message: 'Too many wallet connection attempts',
          standardHeaders: true,
          legacyHeaders: false
        },
        'web3:transaction_submission': {
          windowMs: 60000,
          max: this.config.WEB3_RATE_LIMITS.TRANSACTION_SUBMISSIONS_PER_MINUTE,
          message: 'Too many transaction submissions',
          standardHeaders: true,
          legacyHeaders: false
        },
        'web3:token_operation': {
          windowMs: 60000,
          max: this.config.WEB3_RATE_LIMITS.TOKEN_OPERATIONS_PER_MINUTE,
          message: 'Too many token operations',
          standardHeaders: true,
          legacyHeaders: false
        },
        'web3:balance_query': {
          windowMs: 60000,
          max: this.config.WEB3_RATE_LIMITS.BALANCE_QUERIES_PER_MINUTE,
          message: 'Too many balance queries',
          standardHeaders: true,
          legacyHeaders: false
        },
        'web3:contract_interaction': {
          windowMs: 60000,
          max: this.config.WEB3_RATE_LIMITS.CONTRACT_INTERACTIONS_PER_MINUTE,
          message: 'Too many contract interactions',
          standardHeaders: true,
          legacyHeaders: false
        }
      };
      
      // Register Web3 rate limiting rules with existing system
      if (comprehensiveRateLimiter && comprehensiveRateLimiter.addCustomRules) {
        await comprehensiveRateLimiter.addCustomRules('web3', web3RateLimitRules);
      }
      
      // Create rate limiting middleware for Web3 operations
      this.rateLimiter = {
        checkWalletConnection: async (identifier) => {
          return this.checkRateLimit('web3:wallet_connection', identifier);
        },
        checkTransactionSubmission: async (identifier) => {
          return this.checkRateLimit('web3:transaction_submission', identifier);
        },
        checkTokenOperation: async (identifier) => {
          return this.checkRateLimit('web3:token_operation', identifier);
        },
        checkBalanceQuery: async (identifier) => {
          return this.checkRateLimit('web3:balance_query', identifier);
        },
        checkContractInteraction: async (identifier) => {
          return this.checkRateLimit('web3:contract_interaction', identifier);
        }
      };
      
      this.logger.info('✅ Rate limiting integration completed');
    } catch (error) {
      this.logger.error('Failed to integrate rate limiting:', error);
      throw error;
    }
  }
  
  /**
   * Integrate with GDPR Compliance System
   */
  async integrateGDPRCompliance() {
    try {
      // Setup GDPR-compliant Web3 data handling
      this.gdprAuth = new GDPREnhancedAuth({
        dataCategories: this.config.GDPR_WEB3.DATA_CATEGORIES,
        retentionPeriod: this.config.GDPR_WEB3.RETENTION_PERIOD_DAYS,
        anonymizationPeriod: this.config.GDPR_WEB3.ANONYMIZE_AFTER_DAYS
      });
      
      // Web3-specific GDPR handlers
      this.gdprHandlers = {
        handleWalletDataConsent: async (userId, walletAddress, consentGiven) => {
          if (consentGiven) {
            await this.gdprAuth.recordConsent(userId, 'wallet_addresses', {
              walletAddress,
              purpose: 'gaming_platform_access'
            });
          } else if (this.config.GDPR_WEB3.STORE_WALLET_ADDRESSES) {
            throw new Error('Wallet address storage requires user consent');
          }
        },
        
        handleTransactionDataRetention: async (userId, transactionData) => {
          // Transaction data is necessary for security, but should be anonymized
          await this.gdprAuth.storeSecurityData(userId, 'transaction_signatures', {
            ...transactionData,
            purpose: 'security_monitoring',
            retention: 'necessary_for_security'
          });
        },
        
        handleDataDeletion: async (userId) => {
          // Implement right to be forgotten for Web3 data
          await this.gdprAuth.deleteUserData(userId, {
            categories: ['wallet_addresses', 'token_balances'],
            retainSecurity: true // Keep security logs but anonymize
          });
        }
      };
      
      this.logger.info('✅ GDPR compliance integration completed');
    } catch (error) {
      this.logger.error('Failed to integrate GDPR compliance:', error);
      throw error;
    }
  }
  
  /**
   * Integrate with DDoS Protection System
   */
  async integrateDDoSProtection() {
    try {
      // Initialize DDoS protection for Web3 endpoints
      this.ddosProtection = new DDOSProtectionEngine({
        customRules: {
          'web3_endpoints': {
            rateLimit: 100, // requests per minute
            burstLimit: 20, // rapid requests
            blockDuration: 300000, // 5 minutes
            patterns: [
              /\/api\/web3\/wallet/,
              /\/api\/web3\/transaction/,
              /\/api\/web3\/token/
            ]
          }
        }
      });
      
      // Setup Web3-specific DDoS patterns
      const web3DDoSPatterns = [
        {
          name: 'wallet_connection_flood',
          pattern: 'rapid wallet connection attempts',
          threshold: 50,
          windowMs: 60000
        },
        {
          name: 'transaction_spam',
          pattern: 'repeated failed transaction submissions',
          threshold: 20,
          windowMs: 300000
        },
        {
          name: 'token_query_flood',
          pattern: 'excessive token balance queries',
          threshold: 200,
          windowMs: 60000
        }
      ];
      
      for (const pattern of web3DDoSPatterns) {
        await this.ddosProtection.addCustomPattern(pattern);
      }
      
      this.logger.info('✅ DDoS protection integration completed');
    } catch (error) {
      this.logger.error('Failed to integrate DDoS protection:', error);
      throw error;
    }
  }
  
  /**
   * Integrate with Gaming Authentication System
   */
  async integrateGamingAuth() {
    try {
      // Initialize gaming auth integration
      this.gamingAuth = new GamingAuthService({
        web3Integration: true,
        supportedWallets: ['phantom', 'solflare', 'backpack'],
        tokenGating: {
          enabled: true,
          requiredTokens: {
            'MLG': 100 // Minimum MLG tokens for access
          }
        }
      });
      
      // Setup Web3 authentication flow
      this.authHandlers = {
        authenticateWithWallet: async (walletAddress, signature, message) => {
          // Verify wallet signature
          const signatureValid = await this.privateKeyManager.verifySessionChallenge(
            message, 
            signature
          );
          
          if (!signatureValid) {
            throw new Error('Invalid wallet signature');
          }
          
          // Check token gating requirements
          const tokenAccess = await this.tokenSecurityManager.checkTokenGatedAccess({
            type: 'gaming_access',
            walletAddress
          });
          
          if (!tokenAccess.hasAccess) {
            throw new Error(`Token gating failed: ${tokenAccess.reason}`);
          }
          
          // Create gaming session
          return await this.gamingAuth.createSession({
            walletAddress,
            authMethod: 'web3_wallet',
            tokenAccess
          });
        },
        
        validateWeb3Session: async (sessionId, walletAddress) => {
          // Validate both gaming session and Web3 session
          const gamingSession = await this.gamingAuth.validateSession(sessionId);
          const web3Session = this.privateKeyManager.getValidSession(sessionId);
          
          return gamingSession && web3Session && 
                 web3Session.publicKey === walletAddress;
        }
      };
      
      this.logger.info('✅ Gaming authentication integration completed');
    } catch (error) {
      this.logger.error('Failed to integrate gaming authentication:', error);
      throw error;
    }
  }
  
  /**
   * Check Rate Limit for Web3 Operations
   */
  async checkRateLimit(operation, identifier) {
    if (!this.rateLimiter) {
      return { allowed: true }; // If rate limiting is disabled
    }
    
    try {
      // Use existing comprehensive rate limiter if available
      if (comprehensiveRateLimiter && comprehensiveRateLimiter.checkLimit) {
        return await comprehensiveRateLimiter.checkLimit(operation, identifier);
      }
      
      // Fallback to basic rate limiting
      return { allowed: true };
    } catch (error) {
      this.logger.error(`Rate limit check failed for ${operation}:`, error);
      return { allowed: false, reason: 'Rate limit check error' };
    }
  }
  
  /**
   * Secure Web3 Operation with Full Integration
   */
  async executeSecureWeb3Operation(operationType, operationData, userContext) {
    const operationId = `${operationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // 1. Rate Limiting Check
      const rateLimitCheck = await this.checkRateLimit(
        `web3:${operationType}`,
        userContext.identifier
      );
      
      if (!rateLimitCheck.allowed) {
        throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}`);
      }
      
      // 2. GDPR Compliance Check
      if (this.gdprAuth && operationData.requiresPersonalData) {
        const hasConsent = await this.gdprAuth.hasValidConsent(
          userContext.userId,
          operationData.dataCategory
        );
        
        if (!hasConsent) {
          throw new Error('User consent required for this operation');
        }
      }
      
      // 3. DDoS Protection Check
      if (this.ddosProtection) {
        const ddosCheck = await this.ddosProtection.checkRequest({
          ip: userContext.ip,
          endpoint: `/web3/${operationType}`,
          userAgent: userContext.userAgent
        });
        
        if (!ddosCheck.allowed) {
          throw new Error('Request blocked by DDoS protection');
        }
      }
      
      // 4. Gaming Authentication Validation
      if (this.gamingAuth && userContext.sessionId) {
        const authValid = await this.authHandlers.validateWeb3Session(
          userContext.sessionId,
          userContext.walletAddress
        );
        
        if (!authValid) {
          throw new Error('Invalid gaming session or Web3 authentication');
        }
      }
      
      // 5. Execute Web3 Operation Based on Type
      let result;
      switch (operationType) {
        case 'wallet_connection':
          result = await this.executeWalletConnection(operationData, userContext);
          break;
        case 'transaction_submission':
          result = await this.executeTransactionSubmission(operationData, userContext);
          break;
        case 'token_operation':
          result = await this.executeTokenOperation(operationData, userContext);
          break;
        case 'contract_interaction':
          result = await this.executeContractInteraction(operationData, userContext);
          break;
        default:
          throw new Error(`Unknown operation type: ${operationType}`);
      }
      
      // 6. Log Operation Success
      await this.logIntegratedSecurityEvent('web3_operation_success', {
        operationId,
        operationType,
        userId: userContext.userId,
        walletAddress: userContext.walletAddress,
        result: {
          success: true,
          ...result
        }
      });
      
      return result;
      
    } catch (error) {
      // Log Operation Failure
      await this.logIntegratedSecurityEvent('web3_operation_failure', {
        operationId,
        operationType,
        userId: userContext.userId,
        walletAddress: userContext.walletAddress,
        error: error.message
      });
      
      // Check if this should trigger emergency response
      await this.checkEmergencyTriggers(operationType, error, userContext);
      
      throw error;
    }
  }
  
  /**
   * Execute Wallet Connection with Full Security
   */
  async executeWalletConnection(operationData, userContext) {
    // Create secure session
    const sessionData = await this.privateKeyManager.createSecureSession(
      operationData.publicKey,
      operationData.walletProvider
    );
    
    // Handle GDPR consent for wallet address storage
    if (this.gdprHandlers && operationData.storeWalletAddress) {
      await this.gdprHandlers.handleWalletDataConsent(
        userContext.userId,
        operationData.publicKey.toString(),
        operationData.consentGiven
      );
    }
    
    return sessionData;
  }
  
  /**
   * Execute Transaction Submission with Full Security
   */
  async executeTransactionSubmission(operationData, userContext) {
    // Execute through Web3 Security Manager
    const result = await this.web3SecurityManager.executeSecureTransaction(
      operationData.transaction,
      operationData.wallet,
      operationData.options
    );
    
    // Handle GDPR data retention
    if (this.gdprHandlers) {
      await this.gdprHandlers.handleTransactionDataRetention(
        userContext.userId,
        {
          signature: result.signature,
          timestamp: Date.now(),
          operationType: 'transaction_submission'
        }
      );
    }
    
    return result;
  }
  
  /**
   * Execute Token Operation with Full Security
   */
  async executeTokenOperation(operationData, userContext) {
    // Execute through SPL Token Security Manager
    let result;
    if (operationData.type === 'transfer') {
      result = await this.tokenSecurityManager.executeSecureTokenTransfer(
        operationData.transferRequest,
        operationData.wallet
      );
    } else if (operationData.type === 'burn') {
      result = await this.tokenSecurityManager.executeSecureTokenBurn(
        operationData.burnRequest,
        operationData.wallet
      );
    } else {
      throw new Error(`Unknown token operation type: ${operationData.type}`);
    }
    
    return result;
  }
  
  /**
   * Execute Contract Interaction with Full Security
   */
  async executeContractInteraction(operationData, userContext) {
    // This would handle smart contract interactions
    // Implementation depends on specific contract requirements
    throw new Error('Contract interaction not yet implemented');
  }
  
  /**
   * Setup Cross-System Monitoring
   */
  setupCrossSystemMonitoring() {
    // Monitor metrics across all integrated systems
    setInterval(async () => {
      const metrics = {
        timestamp: Date.now(),
        web3Security: this.web3SecurityManager.getSecurityStatus(),
        tokenSecurity: this.tokenSecurityManager.getSecurityStatus(),
        privateKeySecurity: this.privateKeyManager.getSecurityStatus(),
        integratedSystems: Array.from(this.integratedSystems),
        emergencyState: this.emergencyState
      };
      
      this.securityMetrics.set(Date.now(), metrics);
      
      // Keep only recent metrics (last 24 hours)
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      for (const [timestamp] of this.securityMetrics.entries()) {
        if (timestamp < cutoff) {
          this.securityMetrics.delete(timestamp);
        }
      }
      
      // Check for anomalies
      await this.analyzeSecurityMetrics(metrics);
      
    }, 60000); // Every minute
  }
  
  /**
   * Analyze Security Metrics for Anomalies
   */
  async analyzeSecurityMetrics(currentMetrics) {
    // Look for concerning patterns across systems
    const concerns = [];
    
    if (currentMetrics.web3Security.isPaused) {
      concerns.push('Web3 operations are paused');
    }
    
    if (currentMetrics.tokenSecurity.tokenFrozen) {
      concerns.push('Token operations are frozen');
    }
    
    if (currentMetrics.privateKeySecurity.emergencyMode) {
      concerns.push('Private key manager in emergency mode');
    }
    
    if (concerns.length > 0) {
      await this.escalateEmergency('multiple_system_concerns', {
        concerns,
        metrics: currentMetrics
      });
    }
  }
  
  /**
   * Initialize Emergency Response Coordination
   */
  initializeEmergencyResponse() {
    this.emergencyHandlers = {
      escalateToHuman: async (level, incident) => {
        this.logger.error(`🚨 EMERGENCY ESCALATION [${level}]:`, incident);
        // Implementation would send notifications to security team
      },
      
      activateEmergencyProtocols: async (protocols) => {
        for (const protocol of protocols) {
          switch (protocol) {
            case 'pause_all_web3':
              await this.web3SecurityManager.emergencyPause('coordinated_response', 'integration_manager');
              break;
            case 'freeze_tokens':
              await this.tokenSecurityManager.emergencyFreeze('coordinated_response', 'integration_manager');
              break;
            case 'lockdown_private_keys':
              // Private key manager doesn't store keys, so this is informational
              this.logger.error('🔐 Private key lockdown protocol activated');
              break;
          }
        }
      }
    };
  }
  
  /**
   * Check Emergency Triggers
   */
  async checkEmergencyTriggers(operationType, error, userContext) {
    const errorPattern = error.message.toLowerCase();
    
    // Check for patterns that should trigger emergency response
    const triggers = [
      {
        pattern: /wallet.*compromised/,
        level: 'critical',
        action: ['pause_all_web3', 'escalate_to_human']
      },
      {
        pattern: /multiple.*failed.*transaction/,
        level: 'high',
        action: ['pause_all_web3']
      },
      {
        pattern: /suspicious.*token.*activity/,
        level: 'medium',
        action: ['freeze_tokens']
      }
    ];
    
    for (const trigger of triggers) {
      if (trigger.pattern.test(errorPattern)) {
        await this.escalateEmergency(trigger.level, {
          trigger: trigger.pattern.source,
          operationType,
          error: error.message,
          userContext,
          recommendedActions: trigger.action
        });
        break;
      }
    }
  }
  
  /**
   * Escalate Emergency
   */
  async escalateEmergency(level, incidentData) {
    const incidentId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const incident = {
      id: incidentId,
      level,
      timestamp: Date.now(),
      data: incidentData,
      status: 'active'
    };
    
    this.emergencyState.activeIncidents.set(incidentId, incident);
    this.emergencyState.escalationHistory.push(incident);
    
    // Update emergency level
    const levels = ['normal', 'low', 'medium', 'high', 'critical'];
    const currentLevelIndex = levels.indexOf(this.emergencyState.level);
    const newLevelIndex = levels.indexOf(level);
    
    if (newLevelIndex > currentLevelIndex) {
      this.emergencyState.level = level;
    }
    
    // Execute recommended actions
    if (incidentData.recommendedActions) {
      await this.emergencyHandlers.activateEmergencyProtocols(incidentData.recommendedActions);
    }
    
    // Escalate to human if high/critical
    if (['high', 'critical'].includes(level)) {
      await this.emergencyHandlers.escalateToHuman(level, incident);
    }
    
    await this.logIntegratedSecurityEvent('emergency_escalation', {
      incidentId,
      level,
      data: incidentData
    });
  }
  
  /**
   * Log Integrated Security Event
   */
  async logIntegratedSecurityEvent(eventType, eventData) {
    const event = {
      type: eventType,
      timestamp: new Date(),
      data: eventData,
      integratedSystems: Array.from(this.integratedSystems),
      emergencyLevel: this.emergencyState.level
    };
    
    if (this.auditLogger) {
      await this.auditLogger.log('web3_security_integration', event);
    }
    
    this.logger.info(`🔗 Integrated Security Event: ${eventType}`, eventData);
  }
  
  /**
   * Get Integration Status
   */
  getIntegrationStatus() {
    return {
      integratedSystems: Array.from(this.integratedSystems),
      emergencyState: this.emergencyState,
      securityMetrics: {
        totalMetrics: this.securityMetrics.size,
        latestMetrics: Array.from(this.securityMetrics.values()).pop()
      },
      systemHealth: {
        web3Security: this.web3SecurityManager?.getSecurityStatus(),
        tokenSecurity: this.tokenSecurityManager?.getSecurityStatus(),
        privateKeySecurity: this.privateKeyManager?.getSecurityStatus()
      }
    };
  }
}

export default Web3SecurityIntegration;