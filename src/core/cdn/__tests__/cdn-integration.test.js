/**
 * @fileoverview Comprehensive CDN Integration Tests
 * Tests all aspects of the CDN system including performance, security, and functionality
 */

import { jest } from '@jest/globals';

// Mock external dependencies
jest.mock('crypto', () => ({
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue({
      digest: jest.fn().mockReturnValue('mocked-signature')
    })
  }),
  randomBytes: jest.fn().mockReturnValue(Buffer.from('mocked-random'))
}));

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn().mockResolvedValue(Buffer.from('mock-file-data')),
    writeFile: jest.fn().mockResolvedValue(),
    access: jest.fn().mockResolvedValue()
  }
}));

// Import CDN components
import { CDNIntegration, initializeCDN } from '../index.js';
import { cdnManager } from '../cdn-manager.js';
import { cdnFailoverManager } from '../cdn-failover.js';
import { mediaOptimizer } from '../media-optimizer.js';
import { geoDistributionManager } from '../geo-distribution.js';
import { cacheInvalidationManager } from '../cache-invalidation.js';
import { cdnSecurityManager } from '../cdn-security.js';
import { cdnMonitoringManager } from '../cdn-monitoring.js';
import { intelligentRoutingManager } from '../intelligent-routing.js';
import { gamingMediaHandler } from '../gaming-media-handler.js';

describe('CDN Integration System', () => {
  let cdnIntegration;

  beforeAll(async () => {
    // Initialize CDN system for testing
    cdnIntegration = new CDNIntegration({
      environment: 'test',
      enableFailover: true,
      enableSecurity: true,
      enableMonitoring: true,
      enableIntelligentRouting: true,
      enableGamingMedia: true
    });

    await cdnIntegration.initialize();
  });

  afterAll(async () => {
    if (cdnIntegration) {
      await cdnIntegration.shutdown();
    }
  });

  describe('System Initialization', () => {
    test('should initialize all components successfully', () => {
      expect(cdnIntegration.isInitialized).toBe(true);
      expect(cdnIntegration.managers.cdn).toBeDefined();
      expect(cdnIntegration.managers.failover).toBeDefined();
      expect(cdnIntegration.managers.security).toBeDefined();
      expect(cdnIntegration.managers.monitoring).toBeDefined();
    });

    test('should create middleware stack', () => {
      const middleware = cdnIntegration.getExpressMiddleware();
      expect(Array.isArray(middleware)).toBe(true);
      expect(middleware.length).toBeGreaterThan(0);
    });

    test('should pass health check', () => {
      const health = cdnIntegration.healthCheck();
      expect(health.status).toBe('healthy');
      expect(health.components).toBeDefined();
    });
  });

  describe('CDN URL Generation', () => {
    test('should generate basic CDN URL', () => {
      const url = cdnIntegration.getCDNUrl('/assets/image.jpg');
      expect(url).toContain('/assets/image.jpg');
      expect(typeof url).toBe('string');
    });

    test('should handle URL options', () => {
      const url = cdnIntegration.getCDNUrl('/assets/image.jpg', {
        width: 800,
        height: 600,
        format: 'webp',
        quality: 85
      });
      
      expect(url).toContain('w=800');
      expect(url).toContain('h=600');
      expect(url).toContain('f=webp');
      expect(url).toContain('q=85');
    });

    test('should handle versioning', () => {
      const url = cdnIntegration.getCDNUrl('/assets/app.js', {
        version: '1.2.3'
      });
      
      expect(url).toContain('v=1.2.3');
    });

    test('should handle cache busting', () => {
      const url = cdnIntegration.getCDNUrl('/assets/style.css', {
        cacheBust: true
      });
      
      expect(url).toContain('cb=');
    });
  });

  describe('Media Optimization', () => {
    test('should optimize image', async () => {
      const mockImage = Buffer.from('mock-image-data');
      
      const result = await cdnIntegration.optimizeMedia(mockImage, {
        type: 'image',
        format: 'webp',
        quality: 85,
        width: 800,
        height: 600
      });

      expect(result).toBeDefined();
      expect(result.optimized).toBeDefined();
      expect(result.optimized.format).toBe('webp');
    });

    test('should handle batch processing', async () => {
      const files = [
        { path: '/test/image1.jpg', type: 'image' },
        { path: '/test/image2.png', type: 'image' }
      ];

      const results = await mediaOptimizer.batchProcess(files, {
        concurrency: 2,
        image: { format: 'webp', quality: 80 }
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
    });

    test('should create responsive image set', async () => {
      const responsiveSet = await mediaOptimizer.createResponsiveImageSet(
        '/test/hero.jpg',
        {
          sizes: ['small', 'medium', 'large'],
          formats: ['webp', 'jpeg'],
          qualities: [80, 90]
        }
      );

      expect(responsiveSet.srcset).toBeDefined();
      expect(responsiveSet.fallback).toBeDefined();
      expect(Object.keys(responsiveSet.srcset).length).toBeGreaterThan(0);
    });
  });

  describe('Gaming Media Handling', () => {
    test('should handle texture assets', async () => {
      const result = await gamingMediaHandler.handleAssetRequest({
        assetPath: '/game/textures/character.png',
        assetType: 'textures',
        platform: 'web',
        quality: 'high',
        userContext: {
          deviceType: 'desktop',
          connectionSpeed: 25.5,
          deviceMemory: 8
        }
      });

      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.optimization).toBeDefined();
    });

    test('should handle 3D model assets', async () => {
      const result = await gamingMediaHandler.handleAssetRequest({
        assetPath: '/game/models/environment.gltf',
        assetType: 'models',
        platform: 'web',
        quality: 'medium'
      });

      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    test('should handle streaming assets', async () => {
      const result = await gamingMediaHandler.handleAssetRequest({
        assetPath: '/game/models/large-environment.gltf',
        assetType: 'models',
        streaming: true,
        priority: 'high'
      });

      expect(result.streaming).toBe(true);
      expect(result.streamId).toBeDefined();
      expect(result.streamUrl).toBeDefined();
    });

    test('should detect asset types correctly', () => {
      expect(gamingMediaHandler.detectAssetType('/game/texture.png')).toBe('textures');
      expect(gamingMediaHandler.detectAssetType('/game/model.gltf')).toBe('models');
      expect(gamingMediaHandler.detectAssetType('/game/audio.ogg')).toBe('audio');
      expect(gamingMediaHandler.detectAssetType('/game/video.mp4')).toBe('video');
    });

    test('should cache gaming assets', async () => {
      // First request
      const result1 = await gamingMediaHandler.handleAssetRequest({
        assetPath: '/game/textures/test.png',
        assetType: 'textures',
        platform: 'web',
        quality: 'medium'
      });

      // Second request (should hit cache)
      const result2 = await gamingMediaHandler.handleAssetRequest({
        assetPath: '/game/textures/test.png',
        assetType: 'textures',
        platform: 'web',
        quality: 'medium'
      });

      expect(result1.fromCache).toBe(false);
      expect(result2.fromCache).toBe(true);
    });
  });

  describe('Cache Invalidation', () => {
    beforeEach(() => {
      // Register mock CDN providers
      cacheInvalidationManager.registerProvider('test-provider', {
        type: 'custom',
        endpoints: {
          invalidate: 'https://test-cdn.com/invalidate'
        }
      });
    });

    test('should invalidate specific paths', async () => {
      const result = await cdnIntegration.invalidateCache([
        '/assets/css/main.css',
        '/assets/js/app.js'
      ], {
        priority: 'high'
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBeDefined();
    });

    test('should invalidate by tags', async () => {
      const result = await cdnIntegration.invalidateCacheByTags(['user-content'], {
        recursive: true
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    test('should handle batch invalidation', async () => {
      const paths = Array.from({ length: 150 }, (_, i) => `/path/${i}.jpg`);
      
      const result = await cacheInvalidationManager.invalidatePaths(paths, {
        priority: 'normal'
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('queued');
    });

    test('should track invalidation history', () => {
      const history = cacheInvalidationManager.getInvalidationHistory({
        since: Date.now() - 3600000 // Last hour
      });

      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Security Features', () => {
    test('should generate signed URLs', () => {
      const signedUrl = cdnSecurityManager.generateSignedUrl(
        'https://cdn.test.com/premium/content.zip',
        {
          expires: Math.floor(Date.now() / 1000) + 3600,
          apiKey: 'test-api-key'
        }
      );

      expect(signedUrl).toContain('expires=');
      expect(signedUrl).toContain('signature=');
      expect(signedUrl).toContain('key=');
    });

    test('should verify signed URLs', () => {
      const originalUrl = 'https://cdn.test.com/premium/content.zip';
      const signedUrl = cdnSecurityManager.generateSignedUrl(originalUrl, {
        expires: Math.floor(Date.now() / 1000) + 3600
      });

      const verification = cdnSecurityManager.verifySignedUrl(signedUrl, {
        userAgent: 'test-agent'
      });

      expect(verification.valid).toBe(true);
    });

    test('should handle rate limiting', () => {
      const ip = '192.168.1.100';
      
      // First request should be allowed
      const result1 = cdnSecurityManager.checkRateLimit(ip);
      expect(result1.allowed).toBe(true);

      // Simulate many requests
      for (let i = 0; i < 1000; i++) {
        cdnSecurityManager.checkRateLimit(ip);
      }

      // Should now be rate limited
      const result2 = cdnSecurityManager.checkRateLimit(ip);
      expect(result2.allowed).toBe(false);
    });

    test('should detect bot patterns', () => {
      const botContext = {
        userAgent: 'Python/3.9 requests/2.25.1',
        ipAddress: '1.2.3.4'
      };

      const result = cdnSecurityManager.checkBotProtection(botContext);
      expect(result.botScore).toBeGreaterThan(0.5);
    });

    test('should validate API keys', () => {
      // This test would need actual API keys configured
      const validation = cdnSecurityManager.validateApiKey('invalid-key');
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBeDefined();
    });

    test('should handle CORS requests', () => {
      const corsResult = cdnSecurityManager.verifyCORS({
        origin: 'https://mlg.clan',
        method: 'GET'
      });

      expect(corsResult.allowed).toBe(true);
      expect(corsResult.headers).toBeDefined();
    });
  });

  describe('Intelligent Routing', () => {
    test('should route requests optimally', () => {
      const userContext = {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        country: 'US'
      };

      const routing = intelligentRoutingManager.routeRequest({
        userContext,
        contentInfo: { type: 'image' }
      });

      expect(routing.endpoint).toBeDefined();
      expect(routing.reason).toBeDefined();
      expect(routing.confidence).toBeGreaterThan(0);
    });

    test('should detect device types', () => {
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      
      expect(intelligentRoutingManager.detectDeviceType(mobileUA)).toBe('mobile');
      expect(intelligentRoutingManager.detectDeviceType(desktopUA)).toBe('desktop');
    });

    test('should estimate connection quality', () => {
      const context = {
        connectionSpeed: 25.5,
        deviceMemory: 8,
        hardwareConcurrency: 8,
        deviceType: 'desktop'
      };

      const quality = intelligentRoutingManager.estimateConnectionQuality(context);
      expect(quality.quality).toBe('high');
      expect(quality.estimatedBandwidth).toBeGreaterThan(0);
    });

    test('should get routing statistics', () => {
      const stats = intelligentRoutingManager.getRoutingStatistics();
      expect(stats.endpoints).toBeDefined();
      expect(stats.routing).toBeDefined();
      expect(stats.learning).toBeDefined();
    });
  });

  describe('Failover System', () => {
    beforeEach(() => {
      // Register test providers
      cdnFailoverManager.registerProvider('primary-test', {
        baseUrl: 'https://primary.test.com',
        priority: 1,
        capacity: 1000
      });

      cdnFailoverManager.registerProvider('fallback-test', {
        baseUrl: 'https://fallback.test.com',
        priority: 2,
        capacity: 800
      });
    });

    test('should register CDN providers', () => {
      const statusReport = cdnFailoverManager.getStatusReport();
      expect(statusReport.summary.totalProviders).toBeGreaterThan(0);
    });

    test('should handle provider failover', () => {
      // Simulate primary provider failure
      const primaryProvider = 'primary-test';
      
      // Mark provider as unhealthy
      cdnFailoverManager.recordFailedHealthCheck(primaryProvider, new Error('Connection timeout'));
      cdnFailoverManager.recordFailedHealthCheck(primaryProvider, new Error('Connection timeout'));
      cdnFailoverManager.recordFailedHealthCheck(primaryProvider, new Error('Connection timeout'));

      const statusReport = cdnFailoverManager.getStatusReport();
      expect(statusReport.isFailoverActive).toBe(true);
    });

    test('should track performance metrics', () => {
      const statusReport = cdnFailoverManager.getStatusReport();
      expect(statusReport.performanceMetrics).toBeDefined();
      expect(statusReport.providers).toBeDefined();
    });

    test('should handle recovery', async () => {
      // Simulate provider recovery
      const provider = 'primary-test';
      
      cdnFailoverManager.recordSuccessfulHealthCheck(provider, 150);
      cdnFailoverManager.recordSuccessfulHealthCheck(provider, 145);

      const statusReport = cdnFailoverManager.getStatusReport();
      const providerStatus = statusReport.providers[provider];
      expect(providerStatus.health.isHealthy).toBe(true);
    });
  });

  describe('Geographic Distribution', () => {
    test('should select optimal edge server', () => {
      const userContext = {
        ip: '8.8.8.8',
        country: 'US'
      };

      const contentInfo = {
        type: 'image',
        size: 1024000
      };

      const server = geoDistributionManager.selectOptimalEdgeServer(userContext, contentInfo);
      expect(server.endpoint).toBeDefined();
      expect(server.region).toBeDefined();
      expect(server.latency).toBeGreaterThan(0);
    });

    test('should determine user region', () => {
      const userContext = {
        ip: '8.8.8.8',
        country: 'US'
      };

      const region = geoDistributionManager.getUserRegion(userContext);
      expect(typeof region).toBe('string');
      expect(region.length).toBeGreaterThan(0);
    });

    test('should calculate distance', () => {
      const distance = geoDistributionManager.calculateDistance(
        40.7128, -74.0060, // New York
        34.0522, -118.2437  // Los Angeles
      );

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(5000); // Should be reasonable
    });

    test('should get distribution statistics', () => {
      const stats = geoDistributionManager.getDistributionStats();
      expect(stats.regions).toBeDefined();
      expect(stats.global).toBeDefined();
    });
  });

  describe('Performance Monitoring', () => {
    test('should record request metrics', () => {
      cdnMonitoringManager.recordRequest({
        provider: 'test-provider',
        region: 'us-east',
        path: '/test/asset.jpg',
        method: 'GET',
        status: 200,
        responseTime: 150,
        bytes: 1024,
        cacheStatus: 'HIT'
      });

      const metrics = cdnMonitoringManager.getRealTimeMetrics();
      expect(metrics).toBeDefined();
    });

    test('should generate performance reports', () => {
      const report = cdnMonitoringManager.getPerformanceSummary({
        startTime: Date.now() - 3600000,
        endTime: Date.now()
      });

      expect(report).toBeDefined();
      expect(report.timeRange).toBeDefined();
    });

    test('should track costs', () => {
      const costBreakdown = cdnMonitoringManager.getCostBreakdown();
      expect(costBreakdown.total).toBeDefined();
      expect(costBreakdown.byProvider).toBeDefined();
      expect(costBreakdown.byRegion).toBeDefined();
    });

    test('should export metrics', () => {
      const exportData = cdnMonitoringManager.exportMetrics({
        format: 'json',
        includeRealTime: true,
        includeHistorical: true
      });

      expect(exportData.exportedAt).toBeDefined();
      expect(exportData.realTimeMetrics).toBeDefined();
    });
  });

  describe('System Integration', () => {
    test('should get comprehensive system status', () => {
      const status = cdnIntegration.getSystemStatus();
      expect(status.initialized).toBe(true);
      expect(status.environment).toBe('test');
      expect(status.managers).toBeDefined();
    });

    test('should generate performance reports', () => {
      const report = cdnIntegration.getPerformanceReport({
        startTime: Date.now() - 3600000,
        endTime: Date.now()
      });

      expect(report.summary).toBeDefined();
      expect(report.realTime).toBeDefined();
    });

    test('should analyze costs', () => {
      const analysis = cdnIntegration.getCostAnalysis({
        provider: 'test-provider'
      });

      expect(analysis).toBeDefined();
    });

    test('should handle graceful shutdown', async () => {
      const testIntegration = new CDNIntegration({ environment: 'test' });
      await testIntegration.initialize();
      
      expect(testIntegration.isInitialized).toBe(true);
      
      await testIntegration.shutdown();
      expect(testIntegration.isInitialized).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid CDN URLs gracefully', () => {
      const url = cdnIntegration.getCDNUrl('');
      expect(typeof url).toBe('string');
    });

    test('should handle media optimization errors', async () => {
      try {
        await cdnIntegration.optimizeMedia(null, {
          type: 'unknown'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle invalidation errors gracefully', async () => {
      try {
        await cdnIntegration.invalidateCache([], {
          providers: ['nonexistent']
        });
        // Should not throw, but may return error status
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle security validation errors', () => {
      const result = cdnSecurityManager.verifySignedUrl('invalid-url');
      expect(result.valid).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should handle high-volume URL generation', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        cdnIntegration.getCDNUrl(`/assets/image-${i}.jpg`);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    test('should handle concurrent asset requests', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          gamingMediaHandler.handleAssetRequest({
            assetPath: `/game/texture-${i}.png`,
            assetType: 'textures',
            platform: 'web'
          })
        );
      }
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    test('should maintain cache efficiency', () => {
      const stats = gamingMediaHandler.getStatistics();
      
      if (stats.cache.size > 0) {
        expect(stats.cache.hitRate).toBeGreaterThanOrEqual(0);
        expect(stats.cache.hitRate).toBeLessThanOrEqual(1);
      }
    });
  });
});

describe('CDN Helper Functions', () => {
  test('should initialize CDN with helper function', async () => {
    const integration = await initializeCDN({
      environment: 'test',
      enableFailover: false,
      enableSecurity: false
    });

    expect(integration).toBeInstanceOf(CDNIntegration);
    expect(integration.isInitialized).toBe(true);

    await integration.shutdown();
  });
});

describe('Edge Cases', () => {
  test('should handle empty asset paths', () => {
    const url = cdnIntegration.getCDNUrl('');
    expect(typeof url).toBe('string');
  });

  test('should handle malformed URLs', () => {
    const url = cdnIntegration.getCDNUrl('not-a-url');
    expect(typeof url).toBe('string');
  });

  test('should handle null/undefined inputs', () => {
    const url1 = cdnIntegration.getCDNUrl(null);
    const url2 = cdnIntegration.getCDNUrl(undefined);
    
    expect(typeof url1).toBe('string');
    expect(typeof url2).toBe('string');
  });

  test('should handle extreme optimization parameters', () => {
    const url = cdnIntegration.getCDNUrl('/test.jpg', {
      width: 999999,
      height: 999999,
      quality: 150 // Beyond valid range
    });
    
    expect(typeof url).toBe('string');
  });
});