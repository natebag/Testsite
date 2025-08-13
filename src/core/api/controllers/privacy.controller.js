/**
 * Privacy Controller for MLG.clan GDPR Compliance
 * 
 * Handles GDPR compliance endpoints including:
 * - User consent management
 * - Data export requests (Right to Data Portability)
 * - Data deletion requests (Right to be Forgotten)
 * - Privacy settings management
 * - Cookie consent tracking
 * 
 * @author Claude Code - Security & Privacy Architect
 * @version 1.0.0
 * @created 2025-08-13
 */

import { asyncHandler } from '../middleware/error.middleware.js';
import { APIErrors } from '../middleware/error.middleware.js';

/**
 * Privacy Controller Class
 */
export class PrivacyController {
  /**
   * Get user's GDPR compliance dashboard
   * GET /api/privacy/dashboard
   */
  static getDashboard = asyncHandler(async (req, res) => {
    const gdprService = req.services.gdprService;
    if (!gdprService) {
      throw APIErrors.INTERNAL_ERROR('GDPR service unavailable');
    }

    try {
      const dashboard = await gdprService.getComplianceDashboard(req.user.id);
      
      res.status(200).json({
        success: true,
        data: dashboard,
        message: 'Privacy dashboard retrieved successfully'
      });
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(`Failed to get privacy dashboard: ${error.message}`);
    }
  });

  /**
   * Record user consent for specific purpose
   * POST /api/privacy/consent
   */
  static recordConsent = asyncHandler(async (req, res) => {
    const { purpose, consentGiven, metadata = {} } = req.body;
    
    if (!purpose || typeof consentGiven !== 'boolean') {
      throw APIErrors.VALIDATION_FAILED([
        { field: 'purpose', message: 'Purpose is required' },
        { field: 'consentGiven', message: 'Consent status is required' }
      ]);
    }

    const gdprService = req.services.gdprService;
    if (!gdprService) {
      throw APIErrors.INTERNAL_ERROR('GDPR service unavailable');
    }

    try {
      const consent = await gdprService.recordConsent(
        req.user.id,
        purpose,
        consentGiven,
        {
          ...metadata,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );

      res.status(201).json({
        success: true,
        data: { consent },
        message: 'Consent recorded successfully'
      });
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(`Failed to record consent: ${error.message}`);
    }
  });

  /**
   * Record multiple consents at once
   * POST /api/privacy/consent/bulk
   */
  static recordBulkConsent = asyncHandler(async (req, res) => {
    const { consents, cookieConsents, metadata = {} } = req.body;
    
    if (!consents || typeof consents !== 'object') {
      throw APIErrors.VALIDATION_FAILED([
        { field: 'consents', message: 'Consents object is required' }
      ]);
    }

    const gdprService = req.services.gdprService;
    if (!gdprService) {
      throw APIErrors.INTERNAL_ERROR('GDPR service unavailable');
    }

    try {
      const results = [];
      
      // Process purpose consents
      for (const [purpose, consentGiven] of Object.entries(consents)) {
        const consent = await gdprService.recordConsent(
          req.user.id,
          purpose,
          consentGiven,
          {
            ...metadata,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            bulkUpdate: true
          }
        );
        results.push(consent);
      }

      // Process cookie consents if provided
      if (cookieConsents) {
        await gdprService.recordCookieConsent(
          req.user.id,
          cookieConsents,
          {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID
          }
        );
      }

      res.status(201).json({
        success: true,
        data: { consents: results },
        message: 'Bulk consent recorded successfully'
      });
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(`Failed to record bulk consent: ${error.message}`);
    }
  });

  /**
   * Check user consent for specific purpose
   * GET /api/privacy/consent/:purpose
   */
  static checkConsent = asyncHandler(async (req, res) => {
    const { purpose } = req.params;
    
    const gdprService = req.services.gdprService;
    if (!gdprService) {
      throw APIErrors.INTERNAL_ERROR('GDPR service unavailable');
    }

    try {
      const consentStatus = await gdprService.checkConsent(req.user.id, purpose);
      
      res.status(200).json({
        success: true,
        data: { consentStatus },
        message: 'Consent status retrieved successfully'
      });
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(`Failed to check consent: ${error.message}`);
    }
  });

  /**
   * Request data export
   * POST /api/privacy/export
   */
  static requestDataExport = asyncHandler(async (req, res) => {
    const { 
      format = 'json', 
      categories = [], 
      includeHistory = true 
    } = req.body;

    const gdprService = req.services.gdprService;
    if (!gdprService) {
      throw APIErrors.INTERNAL_ERROR('GDPR service unavailable');
    }

    try {
      const exportRequest = await gdprService.exportUserData(
        req.user.id,
        {
          format,
          categories,
          includeHistory,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );

      res.status(202).json({
        success: true,
        data: { exportRequest },
        message: 'Data export request created successfully. You will receive an email when ready.'
      });
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(`Failed to request data export: ${error.message}`);
    }
  });

  /**
   * Get export request status
   * GET /api/privacy/export/:requestId
   */
  static getExportStatus = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    
    const gdprService = req.services.gdprService;
    if (!gdprService) {
      throw APIErrors.INTERNAL_ERROR('GDPR service unavailable');
    }

    try {
      // Get export request from database
      const query = `
        SELECT * FROM data_export_requests 
        WHERE id = $1 AND user_id = $2
      `;
      
      const result = await gdprService.db.query(query, [requestId, req.user.id]);
      
      if (result.rows.length === 0) {
        throw APIErrors.RESOURCE_NOT_FOUND('Export request', requestId);
      }

      const exportRequest = result.rows[0];

      res.status(200).json({
        success: true,
        data: { exportRequest },
        message: 'Export status retrieved successfully'
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        throw error;
      }
      throw APIErrors.INTERNAL_ERROR(`Failed to get export status: ${error.message}`);
    }
  });

  /**
   * Download exported data
   * GET /api/privacy/export/:requestId/download
   */
  static downloadExport = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    
    const gdprService = req.services.gdprService;
    if (!gdprService) {
      throw APIErrors.INTERNAL_ERROR('GDPR service unavailable');
    }

    try {
      // Verify export request belongs to user and is completed
      const query = `
        SELECT * FROM data_export_requests 
        WHERE id = $1 AND user_id = $2 AND status = 'completed'
      `;
      
      const result = await gdprService.db.query(query, [requestId, req.user.id]);
      
      if (result.rows.length === 0) {
        throw APIErrors.RESOURCE_NOT_FOUND('Export request', requestId);
      }

      const exportRequest = result.rows[0];

      // Check if export has expired
      if (exportRequest.expiry_date && new Date(exportRequest.expiry_date) < new Date()) {
        throw APIErrors.VALIDATION_FAILED([
          { field: 'export', message: 'Export has expired. Please request a new export.' }
        ]);
      }

      // Get export data from Redis (in production, this would be from secure file storage)
      if (gdprService.redis) {
        const exportData = await gdprService.redis.get(`gdpr:export:${requestId}`);
        
        if (!exportData) {
          throw APIErrors.RESOURCE_NOT_FOUND('Export data', requestId);
        }

        // Update download count
        await gdprService.db.query(
          'UPDATE data_export_requests SET download_count = download_count + 1, last_downloaded = NOW() WHERE id = $1',
          [requestId]
        );

        // Log download event
        await gdprService.logGDPREvent(req.user.id, 'DATA_EXPORT_DOWNLOADED', {
          requestId,
          downloadCount: exportRequest.download_count + 1
        }, req.ip, req.get('User-Agent'));

        // Set appropriate headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="mlg-clan-data-export-${requestId}.json"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.status(200).send(exportData);
      } else {
        throw APIErrors.INTERNAL_ERROR('Export data storage unavailable');
      }
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('expired')) {
        throw error;
      }
      throw APIErrors.INTERNAL_ERROR(`Failed to download export: ${error.message}`);
    }
  });

  /**
   * Request data deletion
   * POST /api/privacy/deletion
   */
  static requestDataDeletion = asyncHandler(async (req, res) => {
    const { 
      deletionType = 'full', 
      categories = [], 
      reason = '' 
    } = req.body;

    const gdprService = req.services.gdprService;
    if (!gdprService) {
      throw APIErrors.INTERNAL_ERROR('GDPR service unavailable');
    }

    try {
      const deletionRequest = await gdprService.requestDataDeletion(
        req.user.id,
        {
          deletionType,
          categories,
          reason,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );

      res.status(202).json({
        success: true,
        data: { deletionRequest },
        message: 'Data deletion request created successfully. Check your email for verification instructions.'
      });
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(`Failed to request data deletion: ${error.message}`);
    }
  });

  /**
   * Verify and process data deletion
   * POST /api/privacy/deletion/:requestId/verify
   */
  static verifyDeletion = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { verificationToken } = req.body;
    
    if (!verificationToken) {
      throw APIErrors.VALIDATION_FAILED([
        { field: 'verificationToken', message: 'Verification token is required' }
      ]);
    }

    const gdprService = req.services.gdprService;
    if (!gdprService) {
      throw APIErrors.INTERNAL_ERROR('GDPR service unavailable');
    }

    try {
      const deletionResult = await gdprService.verifyAndProcessDeletion(
        requestId,
        verificationToken
      );

      res.status(200).json({
        success: true,
        data: { deletionResult },
        message: 'Data deletion completed successfully'
      });
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(`Failed to verify deletion: ${error.message}`);
    }
  });

  /**
   * Get deletion request status
   * GET /api/privacy/deletion/:requestId
   */
  static getDeletionStatus = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    
    const gdprService = req.services.gdprService;
    if (!gdprService) {
      throw APIErrors.INTERNAL_ERROR('GDPR service unavailable');
    }

    try {
      const query = `
        SELECT id, user_id, request_date, status, deletion_type, 
               data_categories, scheduled_deletion, completed_at
        FROM data_deletion_requests 
        WHERE id = $1 AND user_id = $2
      `;
      
      const result = await gdprService.db.query(query, [requestId, req.user.id]);
      
      if (result.rows.length === 0) {
        throw APIErrors.RESOURCE_NOT_FOUND('Deletion request', requestId);
      }

      const deletionRequest = result.rows[0];

      res.status(200).json({
        success: true,
        data: { deletionRequest },
        message: 'Deletion status retrieved successfully'
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        throw error;
      }
      throw APIErrors.INTERNAL_ERROR(`Failed to get deletion status: ${error.message}`);
    }
  });

  /**
   * Record cookie consent
   * POST /api/privacy/cookies
   */
  static recordCookieConsent = asyncHandler(async (req, res) => {
    const { cookieCategories, consentString } = req.body;
    
    if (!cookieCategories || typeof cookieCategories !== 'object') {
      throw APIErrors.VALIDATION_FAILED([
        { field: 'cookieCategories', message: 'Cookie categories are required' }
      ]);
    }

    const gdprService = req.services.gdprService;
    if (!gdprService) {
      throw APIErrors.INTERNAL_ERROR('GDPR service unavailable');
    }

    try {
      // Store cookie consent in database
      const query = `
        INSERT INTO cookie_consents (
          user_id, session_id, cookie_categories, consent_string,
          ip_address, user_agent, expiry_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const expiryDate = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)); // 1 year
      
      const result = await gdprService.db.query(query, [
        req.user?.id || null,
        req.sessionID,
        JSON.stringify(cookieCategories),
        consentString || null,
        req.ip,
        req.get('User-Agent'),
        expiryDate
      ]);

      const cookieConsent = result.rows[0];

      // Log cookie consent event
      await gdprService.logGDPREvent(
        req.user?.id,
        'COOKIE_CONSENT_RECORDED',
        {
          cookieCategories,
          sessionId: req.sessionID,
          consentString
        },
        req.ip,
        req.get('User-Agent')
      );

      res.status(201).json({
        success: true,
        data: { cookieConsent },
        message: 'Cookie consent recorded successfully'
      });
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(`Failed to record cookie consent: ${error.message}`);
    }
  });

  /**
   * Get user's privacy settings
   * GET /api/privacy/settings
   */
  static getPrivacySettings = asyncHandler(async (req, res) => {
    const gdprService = req.services.gdprService;
    if (!gdprService) {
      throw APIErrors.INTERNAL_ERROR('GDPR service unavailable');
    }

    try {
      const settings = await gdprService.getUserPrivacySettings(req.user.id);
      
      res.status(200).json({
        success: true,
        data: { settings },
        message: 'Privacy settings retrieved successfully'
      });
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(`Failed to get privacy settings: ${error.message}`);
    }
  });

  /**
   * Update user's privacy settings
   * PUT /api/privacy/settings
   */
  static updatePrivacySettings = asyncHandler(async (req, res) => {
    const { 
      profileVisibility,
      emailNotifications,
      dataSharing,
      marketingConsent,
      analyticsConsent
    } = req.body;

    const userRepository = req.services.userRepository;
    const gdprService = req.services.gdprService;
    
    if (!userRepository || !gdprService) {
      throw APIErrors.INTERNAL_ERROR('Required services unavailable');
    }

    try {
      // Update user settings
      const updatedUser = await userRepository.updateUserProfile(
        req.user.id,
        {
          profile_visibility: profileVisibility,
          email_notifications: emailNotifications,
          data_sharing_consent: dataSharing,
          marketing_consent: marketingConsent,
          analytics_consent: analyticsConsent
        }
      );

      // Record consent changes if applicable
      if (typeof marketingConsent === 'boolean') {
        await gdprService.recordConsent(
          req.user.id,
          'MARKETING',
          marketingConsent,
          {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            source: 'privacy_settings'
          }
        );
      }

      if (typeof analyticsConsent === 'boolean') {
        await gdprService.recordConsent(
          req.user.id,
          'ANALYTICS',
          analyticsConsent,
          {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            source: 'privacy_settings'
          }
        );
      }

      res.status(200).json({
        success: true,
        data: { user: updatedUser },
        message: 'Privacy settings updated successfully'
      });
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(`Failed to update privacy settings: ${error.message}`);
    }
  });

  /**
   * Get GDPR audit log for user
   * GET /api/privacy/audit
   */
  static getAuditLog = asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0, eventType } = req.query;
    
    const gdprService = req.services.gdprService;
    if (!gdprService) {
      throw APIErrors.INTERNAL_ERROR('GDPR service unavailable');
    }

    try {
      let query = `
        SELECT event_type, event_data, timestamp, ip_address
        FROM gdpr_audit_log 
        WHERE user_id = $1
      `;
      const params = [req.user.id];

      if (eventType) {
        query += ` AND event_type = $${params.length + 1}`;
        params.push(eventType);
      }

      query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await gdprService.db.query(query, params);

      res.status(200).json({
        success: true,
        data: {
          auditLog: result.rows,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: result.rows.length
          }
        },
        message: 'Audit log retrieved successfully'
      });
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(`Failed to get audit log: ${error.message}`);
    }
  });

  /**
   * Get data processing transparency report
   * GET /api/privacy/transparency
   */
  static getTransparencyReport = asyncHandler(async (req, res) => {
    const gdprService = req.services.gdprService;
    if (!gdprService) {
      throw APIErrors.INTERNAL_ERROR('GDPR service unavailable');
    }

    try {
      const [consents, processingActivities, dataCategories] = await Promise.all([
        gdprService.getUserConsentHistory(req.user.id),
        gdprService.getUserProcessingActivities(req.user.id),
        Promise.resolve(Object.keys(gdprService.constructor.DATA_CATEGORIES || {}))
      ]);

      const transparencyReport = {
        dataProcessingPurposes: Object.keys(gdprService.constructor.GDPR_PURPOSES || {}),
        dataCategories,
        currentConsents: consents.filter(c => 
          gdprService.validateConsent(c).hasValidConsent
        ),
        legalBases: [...new Set(consents.map(c => c.legal_basis))],
        retentionPeriods: consents.map(c => ({
          purpose: c.purpose,
          retention: c.metadata?.retention_period || 'Not specified'
        })),
        thirdPartySharing: processingActivities
          .filter(p => p.third_parties && p.third_parties.length > 0)
          .map(p => ({
            purpose: p.purpose,
            thirdParties: p.third_parties
          })),
        automaticDecisionMaking: processingActivities
          .filter(p => p.automated_processing)
          .map(p => ({
            purpose: p.purpose,
            type: p.activity_type
          }))
      };

      res.status(200).json({
        success: true,
        data: { transparencyReport },
        message: 'Transparency report generated successfully'
      });
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(`Failed to generate transparency report: ${error.message}`);
    }
  });
}

export default PrivacyController;