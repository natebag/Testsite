/**
 * Privacy Routes for MLG.clan GDPR Compliance
 * 
 * Routes for GDPR compliance including consent management,
 * data export, data deletion, and privacy settings.
 * 
 * @author Claude Code - Security & Privacy Architect
 * @version 1.0.0
 * @created 2025-08-13
 */

import express from 'express';
import { PrivacyController } from '../controllers/privacy.controller.js';
import { validate, schemas } from '../middleware/validation.middleware.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { rateLimiterMiddleware } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

/**
 * Privacy schema validations
 */
const privacySchemas = {
  consent: {
    body: {
      type: 'object',
      properties: {
        purpose: { type: 'string', minLength: 1 },
        consentGiven: { type: 'boolean' },
        metadata: { type: 'object' }
      },
      required: ['purpose', 'consentGiven'],
      additionalProperties: false
    }
  },
  
  bulkConsent: {
    body: {
      type: 'object',
      properties: {
        consents: { 
          type: 'object',
          patternProperties: {
            '^[A-Z_]+$': { type: 'boolean' }
          }
        },
        cookieConsents: {
          type: 'object',
          patternProperties: {
            '^[A-Z_]+$': { type: 'boolean' }
          }
        },
        metadata: { type: 'object' }
      },
      required: ['consents'],
      additionalProperties: false
    }
  },

  dataExport: {
    body: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['json', 'csv', 'xml'] },
        categories: { type: 'array', items: { type: 'string' } },
        includeHistory: { type: 'boolean' }
      },
      additionalProperties: false
    }
  },

  dataDeletion: {
    body: {
      type: 'object',
      properties: {
        deletionType: { type: 'string', enum: ['full', 'partial'] },
        categories: { type: 'array', items: { type: 'string' } },
        reason: { type: 'string', maxLength: 500 }
      },
      additionalProperties: false
    }
  },

  deletionVerification: {
    body: {
      type: 'object',
      properties: {
        verificationToken: { type: 'string', minLength: 1 }
      },
      required: ['verificationToken'],
      additionalProperties: false
    }
  },

  cookieConsent: {
    body: {
      type: 'object',
      properties: {
        cookieCategories: {
          type: 'object',
          patternProperties: {
            '^[A-Z_]+$': { type: 'boolean' }
          }
        },
        consentString: { type: 'string' }
      },
      required: ['cookieCategories'],
      additionalProperties: false
    }
  },

  privacySettings: {
    body: {
      type: 'object',
      properties: {
        profileVisibility: { type: 'string', enum: ['public', 'friends', 'private'] },
        emailNotifications: { type: 'boolean' },
        dataSharing: { type: 'boolean' },
        marketingConsent: { type: 'boolean' },
        analyticsConsent: { type: 'boolean' }
      },
      additionalProperties: false
    }
  }
};

/**
 * Privacy Dashboard Routes
 */

/**
 * GET /api/privacy/dashboard
 * Get user's privacy compliance dashboard
 * 
 * @header {string} Authorization - Bearer access token
 * @returns {object} Privacy dashboard with consents, exports, deletions, and audit data
 */
router.get('/dashboard',
  authMiddleware,
  rateLimiterMiddleware('privacy', { max: 20, windowMs: 15 * 60 * 1000 }), // 20 requests per 15 minutes
  PrivacyController.getDashboard
);

/**
 * Consent Management Routes
 */

/**
 * POST /api/privacy/consent
 * Record user consent for specific purpose
 * 
 * @header {string} Authorization - Bearer access token
 * @body {string} purpose - Data processing purpose
 * @body {boolean} consentGiven - Whether consent is given
 * @body {object} [metadata] - Additional consent metadata
 * @returns {object} Consent record confirmation
 */
router.post('/consent',
  authMiddleware,
  rateLimiterMiddleware('privacy', { max: 30, windowMs: 15 * 60 * 1000 }),
  validate(privacySchemas.consent),
  PrivacyController.recordConsent
);

/**
 * POST /api/privacy/consent/bulk
 * Record multiple consents at once
 * 
 * @header {string} Authorization - Bearer access token
 * @body {object} consents - Purpose/consent pairs
 * @body {object} [cookieConsents] - Cookie category consents
 * @body {object} [metadata] - Additional metadata
 * @returns {object} Bulk consent confirmation
 */
router.post('/consent/bulk',
  authMiddleware,
  rateLimiterMiddleware('privacy', { max: 10, windowMs: 15 * 60 * 1000 }),
  validate(privacySchemas.bulkConsent),
  PrivacyController.recordBulkConsent
);

/**
 * GET /api/privacy/consent/:purpose
 * Check user consent for specific purpose
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} purpose - Data processing purpose
 * @returns {object} Consent status and details
 */
router.get('/consent/:purpose',
  authMiddleware,
  rateLimiterMiddleware('privacy'),
  PrivacyController.checkConsent
);

/**
 * Data Export Routes (Right to Data Portability)
 */

/**
 * POST /api/privacy/export
 * Request data export
 * 
 * @header {string} Authorization - Bearer access token
 * @body {string} [format=json] - Export format (json, csv, xml)
 * @body {array} [categories] - Data categories to include
 * @body {boolean} [includeHistory=true] - Include historical data
 * @returns {object} Export request details
 */
router.post('/export',
  authMiddleware,
  rateLimiterMiddleware('privacy', { max: 5, windowMs: 60 * 60 * 1000 }), // 5 requests per hour
  validate(privacySchemas.dataExport),
  PrivacyController.requestDataExport
);

/**
 * GET /api/privacy/export/:requestId
 * Get export request status
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} requestId - Export request ID
 * @returns {object} Export request status and details
 */
router.get('/export/:requestId',
  authMiddleware,
  rateLimiterMiddleware('privacy'),
  PrivacyController.getExportStatus
);

/**
 * GET /api/privacy/export/:requestId/download
 * Download exported data
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} requestId - Export request ID
 * @returns {file} Exported data file
 */
router.get('/export/:requestId/download',
  authMiddleware,
  rateLimiterMiddleware('privacy', { max: 10, windowMs: 60 * 60 * 1000 }), // 10 downloads per hour
  PrivacyController.downloadExport
);

/**
 * Data Deletion Routes (Right to be Forgotten)
 */

/**
 * POST /api/privacy/deletion
 * Request data deletion
 * 
 * @header {string} Authorization - Bearer access token
 * @body {string} [deletionType=full] - Deletion type (full, partial)
 * @body {array} [categories] - Data categories to delete (for partial deletion)
 * @body {string} [reason] - Reason for deletion
 * @returns {object} Deletion request details with verification instructions
 */
router.post('/deletion',
  authMiddleware,
  rateLimiterMiddleware('privacy', { max: 3, windowMs: 24 * 60 * 60 * 1000 }), // 3 requests per day
  validate(privacySchemas.dataDeletion),
  PrivacyController.requestDataDeletion
);

/**
 * POST /api/privacy/deletion/:requestId/verify
 * Verify and process data deletion
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} requestId - Deletion request ID
 * @body {string} verificationToken - Verification token from email
 * @returns {object} Deletion completion confirmation
 */
router.post('/deletion/:requestId/verify',
  authMiddleware,
  rateLimiterMiddleware('privacy', { max: 5, windowMs: 60 * 60 * 1000 }),
  validate(privacySchemas.deletionVerification),
  PrivacyController.verifyDeletion
);

/**
 * GET /api/privacy/deletion/:requestId
 * Get deletion request status
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} requestId - Deletion request ID
 * @returns {object} Deletion request status and details
 */
router.get('/deletion/:requestId',
  authMiddleware,
  rateLimiterMiddleware('privacy'),
  PrivacyController.getDeletionStatus
);

/**
 * Cookie Consent Routes
 */

/**
 * POST /api/privacy/cookies
 * Record cookie consent
 * 
 * @body {object} cookieCategories - Cookie category consents
 * @body {string} [consentString] - Consent string for compliance
 * @returns {object} Cookie consent confirmation
 */
router.post('/cookies',
  optionalAuthMiddleware, // Can be used by anonymous users
  rateLimiterMiddleware('privacy'),
  validate(privacySchemas.cookieConsent),
  PrivacyController.recordCookieConsent
);

/**
 * Privacy Settings Routes
 */

/**
 * GET /api/privacy/settings
 * Get user's privacy settings
 * 
 * @header {string} Authorization - Bearer access token
 * @returns {object} Current privacy settings
 */
router.get('/settings',
  authMiddleware,
  rateLimiterMiddleware('privacy'),
  PrivacyController.getPrivacySettings
);

/**
 * PUT /api/privacy/settings
 * Update user's privacy settings
 * 
 * @header {string} Authorization - Bearer access token
 * @body {string} [profileVisibility] - Profile visibility setting
 * @body {boolean} [emailNotifications] - Email notification preference
 * @body {boolean} [dataSharing] - Data sharing consent
 * @body {boolean} [marketingConsent] - Marketing communications consent
 * @body {boolean} [analyticsConsent] - Analytics data consent
 * @returns {object} Updated privacy settings
 */
router.put('/settings',
  authMiddleware,
  rateLimiterMiddleware('privacy'),
  validate(privacySchemas.privacySettings),
  PrivacyController.updatePrivacySettings
);

/**
 * Audit and Transparency Routes
 */

/**
 * GET /api/privacy/audit
 * Get user's GDPR audit log
 * 
 * @header {string} Authorization - Bearer access token
 * @query {number} [limit=50] - Number of entries to return
 * @query {number} [offset=0] - Offset for pagination
 * @query {string} [eventType] - Filter by event type
 * @returns {object} Audit log entries with pagination
 */
router.get('/audit',
  authMiddleware,
  rateLimiterMiddleware('privacy'),
  PrivacyController.getAuditLog
);

/**
 * GET /api/privacy/transparency
 * Get data processing transparency report
 * 
 * @header {string} Authorization - Bearer access token
 * @returns {object} Comprehensive transparency report
 */
router.get('/transparency',
  authMiddleware,
  rateLimiterMiddleware('privacy'),
  PrivacyController.getTransparencyReport
);

/**
 * Health check endpoint for privacy services
 * GET /api/privacy/health
 */
router.get('/health',
  rateLimiterMiddleware('privacy'),
  async (req, res) => {
    try {
      const gdprService = req.services?.gdprService;
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          gdprService: gdprService ? 'available' : 'unavailable',
          database: gdprService?.db ? 'connected' : 'disconnected',
          redis: gdprService?.redis ? 'connected' : 'disconnected'
        }
      };

      res.status(200).json({
        success: true,
        data: health,
        message: 'Privacy service health check completed'
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: 'Privacy service health check failed',
        message: error.message
      });
    }
  }
);

export default router;