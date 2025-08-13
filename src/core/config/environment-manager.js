/**
 * Production Environment Configuration Manager
 * Manages all environment variables and configuration for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnvironmentManager {
  constructor() {
    this.config = {};
    this.loadEnvironmentConfig();
    this.validateRequiredConfig();
  }

  /**
   * Load environment configuration from .env file and process.env
   */
  loadEnvironmentConfig() {
    // Load .env file if it exists
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      this.parseEnvFile(envContent);
    }

    // Override with process.env values
    this.config = {
      // Server Configuration
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: parseInt(process.env.PORT) || 443,
      HOST: process.env.HOST || '0.0.0.0',
      SERVER_NAME: process.env.SERVER_NAME || 'mlg.clan',

      // SSL Configuration
      ssl: {
        enabled: process.env.SSL_ENABLED === 'true',
        certPath: process.env.SSL_CERT_PATH,
        keyPath: process.env.SSL_KEY_PATH,
        caPath: process.env.SSL_CA_PATH,
        forceHttps: process.env.FORCE_HTTPS === 'true'
      },

      // Database Configuration
      database: {
        url: process.env.DATABASE_URL,
        poolMin: parseInt(process.env.DATABASE_POOL_MIN) || 10,
        poolMax: parseInt(process.env.DATABASE_POOL_MAX) || 50,
        sslMode: process.env.DATABASE_SSL_MODE || 'require',
        connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT) || 30000,
        statementTimeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT) || 60000
      },

      // Redis Configuration
      redis: {
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD,
        clusterMode: process.env.REDIS_CLUSTER_MODE === 'true',
        maxConnections: parseInt(process.env.REDIS_MAX_CONNECTIONS) || 100
      },

      // Solana Configuration
      solana: {
        network: process.env.SOLANA_NETWORK || 'mainnet-beta',
        rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
        wsUrl: process.env.SOLANA_WS_URL || 'wss://api.mainnet-beta.solana.com',
        tokenMint: process.env.MLG_TOKEN_MINT,
        commitmentLevel: process.env.SOLANA_COMMITMENT_LEVEL || 'confirmed',
        programs: {
          voting: process.env.VOTING_PROGRAM_ID,
          clan: process.env.CLAN_PROGRAM_ID
        }
      },

      // Authentication Configuration
      auth: {
        jwtSecret: process.env.JWT_SECRET,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
        jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 14,
        passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 12,
        sessionSecret: process.env.SESSION_SECRET,
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000,
        secureCookies: process.env.SECURE_COOKIES === 'true',
        mfa: {
          issuer: process.env.MFA_ISSUER || 'MLG.clan',
          window: parseInt(process.env.MFA_WINDOW) || 2
        }
      },

      // Rate Limiting Configuration
      rateLimiting: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        burstMultiplier: parseInt(process.env.RATE_LIMIT_BURST_MULTIPLIER) || 2,
        gaming: {
          voting: parseInt(process.env.VOTING_RATE_LIMIT) || 10,
          clanActions: parseInt(process.env.CLAN_ACTION_RATE_LIMIT) || 20,
          contentUpload: parseInt(process.env.CONTENT_UPLOAD_RATE_LIMIT) || 5
        }
      },

      // Monitoring Configuration
      monitoring: {
        sentry: {
          dsn: process.env.SENTRY_DSN,
          environment: process.env.SENTRY_ENVIRONMENT || 'production',
          tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
          profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE) || 0.1
        },
        logRocket: {
          appId: process.env.LOGROCKET_APP_ID,
          enabled: process.env.LOGROCKET_ENABLED === 'true'
        },
        logging: {
          level: process.env.LOG_LEVEL || 'info',
          filePath: process.env.LOG_FILE_PATH || '/var/log/mlg-clan/application.log',
          errorFilePath: process.env.LOG_ERROR_FILE_PATH || '/var/log/mlg-clan/error.log',
          maxSize: parseInt(process.env.LOG_MAX_SIZE) || 20971520,
          maxFiles: parseInt(process.env.LOG_MAX_FILES) || 10
        }
      },

      // CDN Configuration
      cdn: {
        url: process.env.CDN_URL,
        staticAssetsUrl: process.env.STATIC_ASSETS_URL,
        imageUploadBucket: process.env.IMAGE_UPLOAD_BUCKET,
        videoUploadBucket: process.env.VIDEO_UPLOAD_BUCKET
      },

      // AWS Configuration
      aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
        s3Bucket: process.env.AWS_S3_BUCKET
      },

      // Email Configuration
      email: {
        smtpHost: process.env.SMTP_HOST,
        smtpPort: parseInt(process.env.SMTP_PORT) || 587,
        smtpUser: process.env.SMTP_USER,
        smtpPass: process.env.SMTP_PASS,
        fromAddress: process.env.EMAIL_FROM
      },

      // Security Configuration
      security: {
        csp: {
          enabled: process.env.CSP_ENABLED === 'true',
          reportUri: process.env.CSP_REPORT_URI,
          reportOnly: process.env.CSP_REPORT_ONLY === 'true'
        },
        hsts: {
          maxAge: parseInt(process.env.HSTS_MAX_AGE) || 31536000,
          includeSubdomains: process.env.HSTS_INCLUDE_SUBDOMAINS === 'true',
          preload: process.env.HSTS_PRELOAD === 'true'
        }
      },

      // Performance Configuration
      performance: {
        cache: {
          defaultTtl: parseInt(process.env.CACHE_TTL_DEFAULT) || 3600,
          staticTtl: parseInt(process.env.CACHE_TTL_STATIC) || 86400,
          apiTtl: parseInt(process.env.CACHE_TTL_API) || 300
        },
        compression: {
          enabled: process.env.COMPRESSION_ENABLED === 'true',
          threshold: parseInt(process.env.COMPRESSION_THRESHOLD) || 1024
        }
      },

      // Load Balancing Configuration
      loadBalancing: {
        clusterMode: process.env.CLUSTER_MODE === 'true',
        workers: process.env.CLUSTER_WORKERS || 'auto',
        loadBalancerIp: process.env.LOAD_BALANCER_IP,
        healthCheckPath: process.env.HEALTH_CHECK_PATH || '/health',
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30
      },

      // Backup Configuration
      backup: {
        enabled: process.env.BACKUP_ENABLED === 'true',
        schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
        retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
        s3Bucket: process.env.BACKUP_S3_BUCKET
      },

      // Analytics Configuration
      analytics: {
        enabled: process.env.ANALYTICS_ENABLED === 'true',
        metricsInterval: parseInt(process.env.METRICS_COLLECTION_INTERVAL) || 60,
        performanceMonitoring: process.env.PERFORMANCE_MONITORING === 'true',
        gaTrackingId: process.env.GA_TRACKING_ID,
        apiKey: process.env.ANALYTICS_API_KEY
      },

      // GDPR Configuration
      gdpr: {
        enabled: process.env.GDPR_ENABLED === 'true',
        privacyPolicyUrl: process.env.PRIVACY_POLICY_URL,
        termsOfServiceUrl: process.env.TERMS_OF_SERVICE_URL,
        cookieConsentRequired: process.env.COOKIE_CONSENT_REQUIRED === 'true'
      },

      // Gaming Configuration
      gaming: {
        tournamentCreationEnabled: process.env.TOURNAMENT_CREATION_ENABLED === 'true',
        maxClanSize: parseInt(process.env.MAX_CLAN_SIZE) || 50,
        maxVotingPower: parseInt(process.env.MAX_VOTING_POWER) || 1000,
        autoModerationEnabled: process.env.AUTO_MODERATION_ENABLED === 'true',
        contentReviewRequired: process.env.CONTENT_REVIEW_REQUIRED === 'true',
        nsfwDetectionEnabled: process.env.NSFW_DETECTION_ENABLED === 'true'
      },

      // Feature Flags
      features: {
        clanTournaments: process.env.FEATURE_CLAN_TOURNAMENTS === 'true',
        advancedVoting: process.env.FEATURE_ADVANCED_VOTING === 'true',
        contentCreatorRewards: process.env.FEATURE_CONTENT_CREATOR_REWARDS === 'true',
        mobileAppIntegration: process.env.FEATURE_MOBILE_APP_INTEGRATION === 'true',
        web3WalletConnect: process.env.FEATURE_WEB3_WALLET_CONNECT === 'true'
      },

      // Emergency Controls
      emergency: {
        emergencyMode: process.env.EMERGENCY_MODE === 'true',
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
        rateLimitEmergencyMultiplier: parseInt(process.env.RATE_LIMIT_EMERGENCY_MULTIPLIER) || 10
      }
    };
  }

  /**
   * Parse .env file content
   */
  parseEnvFile(content) {
    const lines = content.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    });
  }

  /**
   * Validate required configuration values
   */
  validateRequiredConfig() {
    const requiredConfigs = [
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET',
      'SESSION_SECRET',
      'SOLANA_RPC_URL',
      'MLG_TOKEN_MINT'
    ];

    const missing = requiredConfigs.filter(config => !process.env[config]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate critical security configurations
    if (process.env.NODE_ENV === 'production') {
      this.validateProductionSecurity();
    }
  }

  /**
   * Validate production-specific security requirements
   */
  validateProductionSecurity() {
    const securityChecks = [
      {
        check: () => process.env.SSL_ENABLED === 'true',
        message: 'SSL must be enabled in production'
      },
      {
        check: () => process.env.SECURE_COOKIES === 'true',
        message: 'Secure cookies must be enabled in production'
      },
      {
        check: () => process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32,
        message: 'JWT secret must be at least 32 characters in production'
      },
      {
        check: () => process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 64,
        message: 'Session secret must be at least 64 characters in production'
      },
      {
        check: () => process.env.BCRYPT_ROUNDS && parseInt(process.env.BCRYPT_ROUNDS) >= 12,
        message: 'BCrypt rounds must be at least 12 in production'
      }
    ];

    const failures = securityChecks.filter(check => !check.check());
    
    if (failures.length > 0) {
      const messages = failures.map(f => f.message).join('\n');
      throw new Error(`Production security validation failed:\n${messages}`);
    }
  }

  /**
   * Get configuration value by path
   */
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature) {
    return this.get(`features.${feature}`) === true;
  }

  /**
   * Check if we're in production
   */
  isProduction() {
    return this.config.NODE_ENV === 'production';
  }

  /**
   * Check if we're in emergency mode
   */
  isEmergencyMode() {
    return this.config.emergency.emergencyMode;
  }

  /**
   * Check if we're in maintenance mode
   */
  isMaintenanceMode() {
    return this.config.emergency.maintenanceMode;
  }

  /**
   * Get all configuration (sanitized for logging)
   */
  getSanitizedConfig() {
    const sanitized = { ...this.config };
    
    // Remove sensitive information
    delete sanitized.auth.jwtSecret;
    delete sanitized.auth.jwtRefreshSecret;
    delete sanitized.auth.sessionSecret;
    delete sanitized.database.url;
    delete sanitized.redis.password;
    delete sanitized.aws.accessKeyId;
    delete sanitized.aws.secretAccessKey;
    delete sanitized.email.smtpPass;
    
    return sanitized;
  }
}

// Create singleton instance
const environmentManager = new EnvironmentManager();

export default environmentManager;
export { EnvironmentManager };

/**
 * Export commonly used configurations
 */
export const config = environmentManager.config;
export const isProduction = environmentManager.isProduction();
export const isEmergencyMode = environmentManager.isEmergencyMode();
export const isMaintenanceMode = environmentManager.isMaintenanceMode();