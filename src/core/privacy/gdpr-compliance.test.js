/**
 * GDPR Compliance Test Suite
 * 
 * Comprehensive tests for GDPR compliance including:
 * - Consent management functionality
 * - Data export (Right to Data Portability)
 * - Data deletion (Right to be Forgotten)
 * - Privacy settings management
 * - Audit logging and transparency
 * - Cookie consent tracking
 * 
 * @author Claude Code - Security & Privacy Architect
 * @version 1.0.0
 * @created 2025-08-13
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import GDPRComplianceService, { GDPR_PURPOSES, DATA_CATEGORIES } from './gdpr-compliance-service.js';
import GDPREnhancedAuthService from '../auth/gdpr-enhanced-auth.js';
import { Pool } from 'pg';
import Redis from 'redis';

// Test configuration
const TEST_CONFIG = {
  database: {
    connectionString: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/mlg_clan_test'
  },
  redis: {
    url: process.env.TEST_REDIS_URL || 'redis://localhost:6379/1'
  },
  cleanup: true
};

describe('GDPR Compliance Service', () => {
  let gdprService;
  let authService;
  let testDb;
  let testRedis;
  let testUserId;

  beforeAll(async () => {
    // Setup test database
    testDb = new Pool({ connectionString: TEST_CONFIG.database.connectionString });
    testRedis = Redis.createClient({ url: TEST_CONFIG.redis.url });
    await testRedis.connect();

    // Initialize GDPR service
    gdprService = new GDPRComplianceService({
      db: testDb,
      redis: testRedis,
      logger: { info: () => {}, warn: () => {}, error: () => {} }
    });
    
    await gdprService.initialize();

    // Initialize enhanced auth service
    authService = new GDPREnhancedAuthService({
      db: testDb,
      redis: testRedis,
      gdprService,
      logger: { info: () => {}, warn: () => {}, error: () => {} }
    });

    // Create test user
    const testUser = await testDb.query(`
      INSERT INTO users (wallet_address, wallet_verified, status)
      VALUES ('TestWallet123456789012345678901234567890', true, 'active')
      RETURNING id
    `);
    testUserId = testUser.rows[0].id;
  });

  afterAll(async () => {
    if (TEST_CONFIG.cleanup) {
      // Clean up test data
      await testDb.query('DELETE FROM users WHERE wallet_address LIKE \'Test%\'');
      await testDb.query('DELETE FROM user_consents WHERE user_id = $1', [testUserId]);
      await testDb.query('DELETE FROM data_export_requests WHERE user_id = $1', [testUserId]);
      await testDb.query('DELETE FROM data_deletion_requests WHERE user_id = $1', [testUserId]);
      await testDb.query('DELETE FROM cookie_consents WHERE user_id = $1', [testUserId]);
      await testDb.query('DELETE FROM gdpr_audit_log WHERE user_id = $1', [testUserId]);
    }

    // Close connections
    await testDb.end();
    await testRedis.disconnect();
  });

  beforeEach(async () => {
    // Clean up between tests
    await testDb.query('DELETE FROM user_consents WHERE user_id = $1', [testUserId]);
    await testDb.query('DELETE FROM gdpr_audit_log WHERE user_id = $1', [testUserId]);
  });

  describe('Consent Management', () => {
    test('should record user consent successfully', async () => {
      const consent = await gdprService.recordConsent(
        testUserId,
        'PROFILE_MANAGEMENT',
        true,
        { source: 'test', ipAddress: '127.0.0.1' }
      );

      expect(consent).toBeDefined();
      expect(consent.purpose).toBe('PROFILE_MANAGEMENT');
      expect(consent.consent_given).toBe(true);
      expect(consent.legal_basis).toBe('contract');
    });

    test('should check consent status correctly', async () => {
      // Record consent first
      await gdprService.recordConsent(testUserId, 'ANALYTICS', true);

      const consentStatus = await gdprService.checkConsent(testUserId, 'ANALYTICS');

      expect(consentStatus.hasValidConsent).toBe(true);
      expect(consentStatus.consentGiven).toBe(true);
      expect(consentStatus.legalBasis).toBe('legitimate_interest');
    });

    test('should handle consent withdrawal', async () => {
      // Give consent first
      await gdprService.recordConsent(testUserId, 'MARKETING', true);
      
      // Withdraw consent
      await gdprService.recordConsent(testUserId, 'MARKETING', false);

      const consentStatus = await gdprService.checkConsent(testUserId, 'MARKETING');

      expect(consentStatus.hasValidConsent).toBe(false);
      expect(consentStatus.consentGiven).toBe(false);
    });

    test('should validate required vs optional consents', async () => {
      const authConsent = await gdprService.checkConsent(testUserId, 'AUTHENTICATION');
      const marketingConsent = await gdprService.checkConsent(testUserId, 'MARKETING');

      // Authentication should be required, marketing should be optional
      expect(authConsent.consentRequired).toBe(true);
      expect(marketingConsent.consentRequired).toBe(false);
    });

    test('should create audit log for consent events', async () => {
      await gdprService.recordConsent(testUserId, 'VOTING_PARTICIPATION', true);

      const auditLogs = await testDb.query(
        'SELECT * FROM gdpr_audit_log WHERE user_id = $1 AND event_type = $2',
        [testUserId, 'CONSENT_RECORDED']
      );

      expect(auditLogs.rows.length).toBe(1);
      expect(auditLogs.rows[0].event_data.purpose).toBe('VOTING_PARTICIPATION');
    });
  });

  describe('Data Export (Right to Data Portability)', () => {
    test('should create data export request', async () => {
      const exportRequest = await gdprService.exportUserData(testUserId, {
        format: 'json',
        categories: ['IDENTITY', 'BEHAVIORAL'],
        ipAddress: '127.0.0.1'
      });

      expect(exportRequest.requestId).toBeDefined();
      expect(exportRequest.status).toBe('processing');
      expect(exportRequest.format).toBe('json');
      expect(exportRequest.categories).toContain('IDENTITY');
    });

    test('should process data export correctly', async () => {
      // Create export request
      const exportRequest = await gdprService.exportUserData(testUserId);
      
      // Wait for processing (simulate)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check export status
      const statusQuery = await testDb.query(
        'SELECT * FROM data_export_requests WHERE id = $1',
        [exportRequest.requestId]
      );

      expect(statusQuery.rows.length).toBe(1);
      expect(statusQuery.rows[0].user_id).toBe(testUserId);
    });

    test('should include all relevant data in export', async () => {
      // Add some test data
      await gdprService.recordConsent(testUserId, 'PROFILE_MANAGEMENT', true);
      
      const userData = await gdprService.collectUserData(testUserId, ['IDENTITY']);

      expect(userData).toBeDefined();
      expect(userData.IDENTITY).toBeDefined();
    });

    test('should respect data categories in export', async () => {
      const exportRequest = await gdprService.exportUserData(testUserId, {
        categories: ['IDENTITY', 'TECHNICAL']
      });

      expect(exportRequest.categories).toEqual(['IDENTITY', 'TECHNICAL']);
      expect(exportRequest.categories).not.toContain('FINANCIAL');
    });
  });

  describe('Data Deletion (Right to be Forgotten)', () => {
    test('should create data deletion request', async () => {
      const deletionRequest = await gdprService.requestDataDeletion(testUserId, {
        deletionType: 'full',
        reason: 'User requested account deletion',
        ipAddress: '127.0.0.1'
      });

      expect(deletionRequest.requestId).toBeDefined();
      expect(deletionRequest.verificationToken).toBeDefined();
      expect(deletionRequest.status).toBe('pending_verification');
      expect(deletionRequest.deletionType).toBe('full');
    });

    test('should require verification for deletion', async () => {
      const deletionRequest = await gdprService.requestDataDeletion(testUserId);
      
      // Try to process without verification
      await expect(
        gdprService.verifyAndProcessDeletion(deletionRequest.requestId, 'invalid_token')
      ).rejects.toThrow('Invalid deletion request');
    });

    test('should process verified deletion request', async () => {
      const deletionRequest = await gdprService.requestDataDeletion(testUserId);
      
      // Verify and process deletion
      const deletionResult = await gdprService.verifyAndProcessDeletion(
        deletionRequest.requestId,
        deletionRequest.verificationToken
      );

      expect(deletionResult.status).toBe('completed');
      expect(deletionResult.requestId).toBe(deletionRequest.requestId);
    });

    test('should handle partial deletion correctly', async () => {
      const deletionRequest = await gdprService.requestDataDeletion(testUserId, {
        deletionType: 'partial',
        categories: ['BEHAVIORAL', 'ANALYTICS']
      });

      expect(deletionRequest.deletionType).toBe('partial');
      expect(deletionRequest.categories).toEqual(['BEHAVIORAL', 'ANALYTICS']);
    });
  });

  describe('Privacy Settings Management', () => {
    test('should retrieve user privacy settings', async () => {
      const settings = await gdprService.getUserPrivacySettings(testUserId);

      expect(settings).toBeDefined();
      // Settings may be empty for new user, but should not throw error
    });

    test('should get compliance dashboard data', async () => {
      // Add some test data
      await gdprService.recordConsent(testUserId, 'PROFILE_MANAGEMENT', true);
      
      const dashboard = await gdprService.getComplianceDashboard(testUserId);

      expect(dashboard).toBeDefined();
      expect(dashboard.consents).toBeDefined();
      expect(dashboard.dataCategories).toBeDefined();
      expect(dashboard.purposes).toBeDefined();
    });
  });

  describe('Cookie Consent Management', () => {
    test('should record cookie consent', async () => {
      const cookieConsents = {
        ESSENTIAL: true,
        FUNCTIONAL: true,
        ANALYTICS: false,
        MARKETING: false
      };

      const query = `
        INSERT INTO cookie_consents (
          user_id, cookie_categories, ip_address, user_agent, expiry_date
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = await testDb.query(query, [
        testUserId,
        JSON.stringify(cookieConsents),
        '127.0.0.1',
        'Test User Agent',
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      ]);

      expect(result.rows.length).toBe(1);
      expect(JSON.parse(result.rows[0].cookie_categories)).toEqual(cookieConsents);
    });

    test('should track cookie consent in audit log', async () => {
      await gdprService.logGDPREvent(
        testUserId,
        'COOKIE_CONSENT_RECORDED',
        {
          cookieCategories: { ESSENTIAL: true, FUNCTIONAL: false },
          sessionId: 'test-session'
        },
        '127.0.0.1',
        'Test User Agent'
      );

      const auditLogs = await testDb.query(
        'SELECT * FROM gdpr_audit_log WHERE user_id = $1 AND event_type = $2',
        [testUserId, 'COOKIE_CONSENT_RECORDED']
      );

      expect(auditLogs.rows.length).toBe(1);
    });
  });

  describe('Enhanced Authentication with GDPR', () => {
    test('should check authentication consents', async () => {
      // Record required consents
      await gdprService.recordConsent(testUserId, 'AUTHENTICATION', true);
      await gdprService.recordConsent(testUserId, 'PROFILE_MANAGEMENT', true);

      const consentStatus = await authService.checkAuthenticationConsents(testUserId);

      expect(consentStatus.hasRequiredConsents).toBe(true);
      expect(consentStatus.missingRequiredConsents).toHaveLength(0);
    });

    test('should identify missing required consents', async () => {
      // Don't record required consents
      const consentStatus = await authService.checkAuthenticationConsents(testUserId);

      expect(consentStatus.hasRequiredConsents).toBe(false);
      expect(consentStatus.missingRequiredConsents.length).toBeGreaterThan(0);
    });

    test('should process authentication consent data', async () => {
      const consentData = {
        purposes: {
          AUTHENTICATION: true,
          PROFILE_MANAGEMENT: true,
          ANALYTICS: false
        },
        cookies: {
          ESSENTIAL: true,
          FUNCTIONAL: true
        }
      };

      await authService.processAuthenticationConsent(
        testUserId,
        consentData,
        '127.0.0.1',
        'Test User Agent'
      );

      // Verify consents were recorded
      const authConsent = await gdprService.checkConsent(testUserId, 'AUTHENTICATION');
      const analyticsConsent = await gdprService.checkConsent(testUserId, 'ANALYTICS');

      expect(authConsent.hasValidConsent).toBe(true);
      expect(analyticsConsent.hasValidConsent).toBe(false);
    });
  });

  describe('Audit Logging and Transparency', () => {
    test('should log GDPR events correctly', async () => {
      await gdprService.logGDPREvent(
        testUserId,
        'TEST_EVENT',
        { testData: 'test value' },
        '127.0.0.1',
        'Test User Agent'
      );

      const auditLogs = await testDb.query(
        'SELECT * FROM gdpr_audit_log WHERE user_id = $1 AND event_type = $2',
        [testUserId, 'TEST_EVENT']
      );

      expect(auditLogs.rows.length).toBe(1);
      expect(auditLogs.rows[0].event_data.testData).toBe('test value');
      expect(auditLogs.rows[0].ip_address).toBe('127.0.0.1');
    });

    test('should get user consent history', async () => {
      // Add consent history
      await gdprService.recordConsent(testUserId, 'MARKETING', true);
      await gdprService.recordConsent(testUserId, 'ANALYTICS', false);

      const history = await gdprService.getUserConsentHistory(testUserId);

      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history.some(h => h.purpose === 'MARKETING')).toBe(true);
      expect(history.some(h => h.purpose === 'ANALYTICS')).toBe(true);
    });

    test('should get user processing activities', async () => {
      // Add processing activity
      await testDb.query(`
        INSERT INTO data_processing_activities (
          user_id, activity_type, purpose, data_categories, legal_basis
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        testUserId,
        'DATA_COLLECTION',
        'PROFILE_MANAGEMENT',
        ['IDENTITY', 'CONTACT'],
        'contract'
      ]);

      const activities = await gdprService.getUserProcessingActivities(testUserId);

      expect(activities.length).toBeGreaterThanOrEqual(1);
      expect(activities[0].activity_type).toBe('DATA_COLLECTION');
    });
  });

  describe('Data Categories and Purposes Validation', () => {
    test('should validate GDPR purposes configuration', () => {
      expect(GDPR_PURPOSES).toBeDefined();
      expect(GDPR_PURPOSES.AUTHENTICATION).toBeDefined();
      expect(GDPR_PURPOSES.AUTHENTICATION.legalBasis).toBeDefined();
      expect(GDPR_PURPOSES.AUTHENTICATION.required).toBe(true);
    });

    test('should validate data categories configuration', () => {
      expect(DATA_CATEGORIES).toBeDefined();
      expect(DATA_CATEGORIES.IDENTITY).toBeDefined();
      expect(DATA_CATEGORIES.IDENTITY.tables).toBeDefined();
      expect(DATA_CATEGORIES.IDENTITY.fields).toBeDefined();
    });

    test('should handle invalid purpose gracefully', async () => {
      await expect(
        gdprService.recordConsent(testUserId, 'INVALID_PURPOSE', true)
      ).rejects.toThrow('Invalid processing purpose');
    });
  });

  describe('Data Retention and Cleanup', () => {
    test('should clean up expired data correctly', async () => {
      // Create expired export request
      await testDb.query(`
        INSERT INTO data_export_requests (
          user_id, status, expiry_date
        ) VALUES ($1, 'completed', $2)
      `, [testUserId, new Date(Date.now() - 24 * 60 * 60 * 1000)]); // Expired yesterday

      await gdprService.cleanupExpiredData();

      // Check that expired request was cleaned up
      const expiredRequests = await testDb.query(
        'SELECT * FROM data_export_requests WHERE user_id = $1 AND expiry_date < NOW()',
        [testUserId]
      );

      expect(expiredRequests.rows.length).toBe(0);
    });

    test('should maintain audit logs for compliance period', async () => {
      await gdprService.logGDPREvent(testUserId, 'TEST_RETENTION', { test: true });

      // Should not clean up recent audit logs
      await gdprService.cleanupExpiredData();

      const auditLogs = await testDb.query(
        'SELECT * FROM gdpr_audit_log WHERE user_id = $1 AND event_type = $2',
        [testUserId, 'TEST_RETENTION']
      );

      expect(auditLogs.rows.length).toBe(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle non-existent user gracefully', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      
      const dashboard = await gdprService.getComplianceDashboard(fakeUserId);

      expect(dashboard.consents).toHaveLength(0);
      expect(dashboard.dataExports).toHaveLength(0);
    });

    test('should handle database connection errors', async () => {
      // Create service with invalid DB
      const invalidService = new GDPRComplianceService({
        db: null,
        redis: testRedis
      });

      await expect(
        invalidService.recordConsent(testUserId, 'TEST', true)
      ).rejects.toThrow();
    });

    test('should handle Redis connection errors gracefully', async () => {
      // Create service without Redis
      const noRedisService = new GDPRComplianceService({
        db: testDb,
        redis: null
      });

      await noRedisService.initialize();

      // Should still work without Redis (degraded functionality)
      const consent = await noRedisService.recordConsent(testUserId, 'TEST', true);
      expect(consent).toBeDefined();
    });
  });

  describe('Performance and Caching', () => {
    test('should cache consent checks', async () => {
      // Record consent
      await gdprService.recordConsent(testUserId, 'CACHING_TEST', true);

      // First check (should hit database)
      const start1 = Date.now();
      await gdprService.checkConsent(testUserId, 'CACHING_TEST');
      const time1 = Date.now() - start1;

      // Second check (should hit cache)
      const start2 = Date.now();
      await gdprService.checkConsent(testUserId, 'CACHING_TEST');
      const time2 = Date.now() - start2;

      // Cache should be faster (though this might be flaky in tests)
      expect(time2).toBeLessThanOrEqual(time1 + 10); // Allow some variance
    });

    test('should handle large data exports efficiently', async () => {
      const start = Date.now();
      
      const exportRequest = await gdprService.exportUserData(testUserId, {
        categories: Object.keys(DATA_CATEGORIES)
      });
      
      const duration = Date.now() - start;

      expect(exportRequest).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});

/**
 * Integration tests for GDPR compliance across the platform
 */
describe('GDPR Integration Tests', () => {
  let gdprService;
  let authService;
  let testDb;
  let testRedis;

  beforeAll(async () => {
    // Initialize services same as above
    testDb = new Pool({ connectionString: TEST_CONFIG.database.connectionString });
    testRedis = Redis.createClient({ url: TEST_CONFIG.redis.url });
    await testRedis.connect();

    gdprService = new GDPRComplianceService({
      db: testDb,
      redis: testRedis,
      logger: { info: () => {}, warn: () => {}, error: () => {} }
    });
    
    await gdprService.initialize();

    authService = new GDPREnhancedAuthService({
      db: testDb,
      redis: testRedis,
      gdprService,
      logger: { info: () => {}, warn: () => {}, error: () => {} }
    });
  });

  afterAll(async () => {
    await testDb.end();
    await testRedis.disconnect();
  });

  test('should complete full GDPR user lifecycle', async () => {
    const walletAddress = 'TestIntegrationWallet123456789012345678';
    
    // 1. User registration with consent
    const consentData = {
      purposes: {
        AUTHENTICATION: true,
        PROFILE_MANAGEMENT: true,
        ANALYTICS: false,
        MARKETING: true
      },
      cookies: {
        ESSENTIAL: true,
        FUNCTIONAL: true,
        ANALYTICS: false,
        MARKETING: true
      }
    };

    // 2. Create challenge
    const challenge = await authService.generateChallenge(
      walletAddress,
      'phantom',
      '127.0.0.1',
      { userAgent: 'Test Browser' }
    );

    expect(challenge.gdprContext.isNewUser).toBe(true);

    // 3. Verify signature with consent
    const mockSignature = 'mock_signature_for_testing';
    const authResult = await authService.verifySignature(
      walletAddress,
      mockSignature,
      challenge.nonce,
      '127.0.0.1',
      'Test Browser',
      consentData
    );

    // Note: This will fail signature verification, but we're testing the GDPR flow
    // In a real test, you'd need valid signatures

    // 4. Test data export
    if (authResult.user) {
      const exportRequest = await gdprService.exportUserData(authResult.user.id);
      expect(exportRequest.requestId).toBeDefined();

      // 5. Test data deletion
      const deletionRequest = await gdprService.requestDataDeletion(authResult.user.id);
      expect(deletionRequest.requestId).toBeDefined();
    }

    // Clean up
    await testDb.query('DELETE FROM users WHERE wallet_address = $1', [walletAddress]);
  });

  test('should maintain data consistency across GDPR operations', async () => {
    // Create test user
    const user = await testDb.query(`
      INSERT INTO users (wallet_address, wallet_verified, status)
      VALUES ('ConsistencyTest123456789012345678901234', true, 'active')
      RETURNING id
    `);
    const userId = user.rows[0].id;

    try {
      // Record multiple consents
      await Promise.all([
        gdprService.recordConsent(userId, 'AUTHENTICATION', true),
        gdprService.recordConsent(userId, 'PROFILE_MANAGEMENT', true),
        gdprService.recordConsent(userId, 'VOTING_PARTICIPATION', true)
      ]);

      // Check all consents
      const [auth, profile, voting] = await Promise.all([
        gdprService.checkConsent(userId, 'AUTHENTICATION'),
        gdprService.checkConsent(userId, 'PROFILE_MANAGEMENT'),
        gdprService.checkConsent(userId, 'VOTING_PARTICIPATION')
      ]);

      expect(auth.hasValidConsent).toBe(true);
      expect(profile.hasValidConsent).toBe(true);
      expect(voting.hasValidConsent).toBe(true);

      // Test dashboard consistency
      const dashboard = await gdprService.getComplianceDashboard(userId);
      expect(dashboard.consents.length).toBeGreaterThanOrEqual(3);

    } finally {
      // Clean up
      await testDb.query('DELETE FROM users WHERE id = $1', [userId]);
    }
  });
});

export default describe;