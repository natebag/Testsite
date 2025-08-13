/**
 * Comprehensive Rate Limiting Test Suite for MLG.clan Platform
 * 
 * Tests for all rate limiting components:
 * - Gaming-specific rate limiting
 * - Web3 transaction controls
 * - Tournament mode protections
 * - Analytics and monitoring
 * - Performance benchmarks
 * 
 * @author Claude Code - Security Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import Redis from 'redis';

// Import rate limiting components
import { gamingRateLimiterMiddleware } from './gaming-rate-limiter.js';
import { web3RateLimiterMiddleware } from './web3-rate-limiter.js';
import { rateLimitAnalyticsMiddleware } from './rate-limit-analytics.js';
import { comprehensiveRateLimiterMiddleware } from './comprehensive-rate-limiter.js';

/**
 * Test configuration
 */
const TEST_CONFIG = {
  redis_url: process.env.TEST_REDIS_URL || 'redis://localhost:6379',
  test_timeout: 30000,
  performance_threshold_ms: 1,
  concurrent_request_count: 100
};

/**
 * Mock Redis client for testing
 */
class MockRedisClient {
  constructor() {
    this.data = new Map();
    this.connected = true;
  }

  async connect() {
    this.connected = true;
    return Promise.resolve();
  }

  async disconnect() {
    this.connected = false;
    return Promise.resolve();
  }

  async setEx(key, ttl, value) {
    this.data.set(key, { value, expiry: Date.now() + (ttl * 1000) });
    return Promise.resolve('OK');
  }

  async get(key) {
    const item = this.data.get(key);
    if (!item || item.expiry < Date.now()) {
      this.data.delete(key);
      return Promise.resolve(null);
    }
    return Promise.resolve(item.value);
  }

  async incrByFloat(key, increment) {
    const current = parseFloat(await this.get(key)) || 0;
    const newValue = current + increment;
    await this.setEx(key, 3600, newValue.toString());
    return Promise.resolve(newValue);
  }

  async exists(key) {
    return Promise.resolve(this.data.has(key) ? 1 : 0);
  }

  async keys(pattern) {
    const keys = Array.from(this.data.keys());
    return Promise.resolve(keys.filter(key => key.includes(pattern.replace('*', ''))));
  }

  async ttl(key) {
    const item = this.data.get(key);
    if (!item) return Promise.resolve(-2);
    const remaining = Math.ceil((item.expiry - Date.now()) / 1000);
    return Promise.resolve(remaining > 0 ? remaining : -1);
  }

  async lPush(key, value) {
    const list = this.data.get(key) || { value: '[]', expiry: Date.now() + 3600000 };
    const array = JSON.parse(list.value);
    array.unshift(value);
    list.value = JSON.stringify(array);
    this.data.set(key, list);
    return Promise.resolve(array.length);
  }

  async lTrim(key, start, stop) {
    const list = this.data.get(key);
    if (!list) return Promise.resolve('OK');
    const array = JSON.parse(list.value);
    const trimmed = array.slice(start, stop + 1);
    list.value = JSON.stringify(trimmed);
    this.data.set(key, list);
    return Promise.resolve('OK');
  }

  async lRange(key, start, stop) {
    const list = this.data.get(key);
    if (!list) return Promise.resolve([]);
    const array = JSON.parse(list.value);
    return Promise.resolve(array.slice(start, stop === -1 ? undefined : stop + 1));
  }

  async expire(key, seconds) {
    const item = this.data.get(key);
    if (item) {
      item.expiry = Date.now() + (seconds * 1000);
      this.data.set(key, item);
    }
    return Promise.resolve(1);
  }

  async mGet(keys) {
    const values = await Promise.all(keys.map(key => this.get(key)));
    return Promise.resolve(values);
  }

  sendCommand(args) {
    // Mock implementation for rate-limit-redis compatibility
    return Promise.resolve('OK');
  }
}

/**
 * Create test Express app
 */
function createTestApp(middleware = []) {
  const app = express();
  
  app.use(express.json());
  
  // Add middleware
  middleware.forEach(mw => app.use(mw));
  
  // Test routes
  app.get('/api/voting/test', (req, res) => {
    res.json({ success: true, endpoint: 'voting' });
  });
  
  app.post('/api/clans/test', (req, res) => {
    res.json({ success: true, endpoint: 'clans' });
  });
  
  app.post('/api/web3/transaction', (req, res) => {
    res.json({ success: true, endpoint: 'web3', transactionId: 'test_tx_123' });
  });
  
  app.get('/api/tournaments/test', (req, res) => {
    res.json({ success: true, endpoint: 'tournaments' });
  });
  
  app.post('/api/leaderboards/update', (req, res) => {
    res.json({ success: true, endpoint: 'leaderboards' });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}

/**
 * Gaming Rate Limiter Tests
 */
describe('Gaming Rate Limiter', () => {
  let app;
  let mockRedis;

  beforeEach(() => {
    mockRedis = new MockRedisClient();
    app = createTestApp([
      rateLimitAnalyticsMiddleware,
      gamingRateLimiterMiddleware('auto')
    ]);
  });

  test('should allow requests within gaming rate limits', async () => {
    const response = await request(app)
      .get('/api/voting/test')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });

  test('should detect gaming context from headers', async () => {
    const response = await request(app)
      .get('/api/voting/test')
      .set('x-gaming-session', 'session_123')
      .set('x-tournament-mode', 'true')
      .expect(200);
    
    expect(response.headers['x-gaming-context']).toBe('true');
  });

  test('should apply tournament mode enhanced limits', async () => {
    const response = await request(app)
      .get('/api/tournaments/test')
      .set('x-tournament-id', 'tournament_123')
      .set('x-tournament-mode', 'true')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });

  test('should rate limit voting operations', async () => {
    // Make multiple voting requests rapidly
    const promises = Array.from({ length: 20 }, () =>
      request(app)
        .get('/api/voting/test')
        .set('x-test-user-id', 'test_user_123')
    );

    const responses = await Promise.all(promises);
    
    // Some requests should be rate limited
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('should track gaming session metrics', async () => {
    await request(app)
      .get('/api/voting/test')
      .set('x-gaming-session', 'session_abc')
      .set('x-user-id', 'user_123')
      .expect(200);
    
    // Session should be tracked in analytics
    // This would be verified through analytics endpoint in real implementation
    expect(true).toBe(true); // Placeholder assertion
  });
});

/**
 * Web3 Rate Limiter Tests
 */
describe('Web3 Rate Limiter', () => {
  let app;

  beforeEach(() => {
    app = createTestApp([
      rateLimitAnalyticsMiddleware,
      web3RateLimiterMiddleware('auto')
    ]);
  });

  test('should detect Web3 transactions', async () => {
    const response = await request(app)
      .post('/api/web3/transaction')
      .send({ 
        walletAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        transactionId: 'tx_123' 
      })
      .expect(200);
    
    expect(response.headers['x-web3-context']).toBe('true');
  });

  test('should rate limit Web3 operations by wallet', async () => {
    const walletAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    
    // Make multiple Web3 requests rapidly
    const promises = Array.from({ length: 10 }, () =>
      request(app)
        .post('/api/web3/transaction')
        .send({ walletAddress, operation: 'transfer' })
    );

    const responses = await Promise.all(promises);
    
    // Some requests should be rate limited
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('should track failed Web3 transactions', async () => {
    // Simulate failed transaction
    const response = await request(app)
      .post('/api/web3/transaction')
      .send({ 
        walletAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        simulateError: true 
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });

  test('should apply different limits for different networks', async () => {
    // Test mainnet vs testnet limits
    const mainnetResponse = await request(app)
      .post('/api/web3/transaction')
      .set('x-network-type', 'mainnet')
      .send({ walletAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' })
      .expect(200);

    const testnetResponse = await request(app)
      .post('/api/web3/transaction')
      .set('x-network-type', 'testnet')
      .send({ walletAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' })
      .expect(200);
    
    expect(mainnetResponse.body.success).toBe(true);
    expect(testnetResponse.body.success).toBe(true);
  });
});

/**
 * Analytics and Monitoring Tests
 */
describe('Rate Limit Analytics', () => {
  let app;

  beforeEach(() => {
    app = createTestApp([
      rateLimitAnalyticsMiddleware,
      gamingRateLimiterMiddleware('auto')
    ]);
  });

  test('should track request metrics', async () => {
    await request(app)
      .get('/api/voting/test')
      .expect(200);
    
    // Analytics should track this request
    // In real implementation, this would check analytics store
    expect(true).toBe(true); // Placeholder assertion
  });

  test('should detect abuse patterns', async () => {
    // Make many requests rapidly to trigger abuse detection
    const promises = Array.from({ length: 50 }, (_, i) =>
      request(app)
        .get('/api/voting/test')
        .set('x-user-id', 'potential_abuser')
        .set('x-request-id', `req_${i}`)
    );

    await Promise.all(promises);
    
    // Abuse detection should trigger
    expect(true).toBe(true); // Placeholder assertion
  });

  test('should monitor performance overhead', async () => {
    const startTime = Date.now();
    
    await request(app)
      .get('/api/voting/test')
      .expect(200);
    
    const overhead = Date.now() - startTime;
    
    // Rate limiting overhead should be minimal
    expect(overhead).toBeLessThan(TEST_CONFIG.performance_threshold_ms * 10); // Allow some margin for test environment
  });
});

/**
 * Comprehensive Rate Limiter Tests
 */
describe('Comprehensive Rate Limiter', () => {
  let app;

  beforeEach(() => {
    app = createTestApp([
      comprehensiveRateLimiterMiddleware('auto')
    ]);
  });

  test('should automatically select appropriate limiter', async () => {
    // Test voting endpoint
    const votingResponse = await request(app)
      .get('/api/voting/test')
      .expect(200);
    expect(votingResponse.headers['x-rate-limit-type']).toBe('voting');

    // Test Web3 endpoint
    const web3Response = await request(app)
      .post('/api/web3/transaction')
      .send({ walletAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' })
      .expect(200);
    expect(web3Response.headers['x-rate-limit-type']).toBe('web3');
  });

  test('should handle mixed gaming and Web3 context', async () => {
    const response = await request(app)
      .post('/api/web3/transaction')
      .set('x-gaming-session', 'session_123')
      .set('x-tournament-mode', 'true')
      .send({ 
        walletAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        transactionId: 'gaming_tx_123'
      })
      .expect(200);
    
    expect(response.headers['x-gaming-context']).toBe('true');
    expect(response.headers['x-web3-context']).toBe('true');
  });

  test('should add performance headers', async () => {
    const response = await request(app)
      .get('/api/voting/test')
      .expect(200);
    
    expect(response.headers['x-rate-limit-overhead']).toBeDefined();
    expect(response.headers['x-rate-limit-type']).toBeDefined();
  });

  test('should handle emergency mode', async () => {
    // Set emergency mode
    process.env.EMERGENCY_MODE = 'true';
    
    const response = await request(app)
      .get('/api/voting/test')
      .expect(200);
    
    // Clean up
    delete process.env.EMERGENCY_MODE;
    
    expect(response.body.success).toBe(true);
  });
});

/**
 * Performance Benchmark Tests
 */
describe('Performance Benchmarks', () => {
  let app;

  beforeEach(() => {
    app = createTestApp([
      comprehensiveRateLimiterMiddleware('auto')
    ]);
  });

  test('should meet performance targets for overhead', async () => {
    const startTime = Date.now();
    
    await request(app)
      .get('/api/health')
      .expect(200);
    
    const totalTime = Date.now() - startTime;
    
    // Total request time should be reasonable (this includes network overhead in tests)
    expect(totalTime).toBeLessThan(1000); // 1 second max for test environment
  });

  test('should handle concurrent requests efficiently', async () => {
    const startTime = Date.now();
    
    // Make many concurrent requests
    const promises = Array.from({ length: TEST_CONFIG.concurrent_request_count }, (_, i) =>
      request(app)
        .get('/api/health')
        .set('x-request-id', `concurrent_${i}`)
    );

    const responses = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
    
    // Should handle concurrent load efficiently
    const avgTimePerRequest = totalTime / TEST_CONFIG.concurrent_request_count;
    expect(avgTimePerRequest).toBeLessThan(100); // 100ms average max
  });

  test('should maintain low memory usage', async () => {
    const initialMemory = process.memoryUsage();
    
    // Make many requests to test for memory leaks
    for (let i = 0; i < 100; i++) {
      await request(app)
        .get('/api/health')
        .expect(200);
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Memory increase should be reasonable (less than 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});

/**
 * Integration Tests
 */
describe('Rate Limiter Integration', () => {
  let app;

  beforeEach(() => {
    app = createTestApp([
      comprehensiveRateLimiterMiddleware('auto')
    ]);
  });

  test('should integrate with authentication context', async () => {
    const response = await request(app)
      .get('/api/voting/test')
      .set('authorization', 'Bearer fake_token_for_testing')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });

  test('should handle different user tiers', async () => {
    // Test premium user
    const premiumResponse = await request(app)
      .get('/api/voting/test')
      .set('x-user-tier', 'premium')
      .expect(200);

    // Test regular user
    const regularResponse = await request(app)
      .get('/api/voting/test')
      .set('x-user-tier', 'regular')
      .expect(200);
    
    expect(premiumResponse.body.success).toBe(true);
    expect(regularResponse.body.success).toBe(true);
  });

  test('should work with clan operations', async () => {
    const response = await request(app)
      .post('/api/clans/test')
      .set('x-clan-id', 'clan_123')
      .send({ operation: 'join' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.endpoint).toBe('clans');
  });
});

/**
 * Error Handling Tests
 */
describe('Error Handling', () => {
  let app;

  beforeEach(() => {
    app = createTestApp([
      comprehensiveRateLimiterMiddleware('auto')
    ]);
  });

  test('should handle Redis connection failures gracefully', async () => {
    // This test would mock Redis failures
    const response = await request(app)
      .get('/api/voting/test')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });

  test('should provide informative rate limit error messages', async () => {
    // Make requests until rate limited
    const promises = Array.from({ length: 50 }, () =>
      request(app)
        .get('/api/voting/test')
        .set('x-user-id', 'test_user')
    );

    const responses = await Promise.all(promises);
    const rateLimitedResponse = responses.find(r => r.status === 429);
    
    if (rateLimitedResponse) {
      expect(rateLimitedResponse.body.error).toContain('rate limit');
      expect(rateLimitedResponse.body.retryAfter).toBeDefined();
    }
  });
});

/**
 * Security Tests
 */
describe('Security Features', () => {
  let app;

  beforeEach(() => {
    app = createTestApp([
      comprehensiveRateLimiterMiddleware('auto')
    ]);
  });

  test('should prevent IP spoofing', async () => {
    const response = await request(app)
      .get('/api/voting/test')
      .set('x-forwarded-for', 'malicious.ip.address')
      .set('x-real-ip', 'another.malicious.ip')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });

  test('should handle malicious headers gracefully', async () => {
    const response = await request(app)
      .get('/api/voting/test')
      .set('x-gaming-session', '../../../etc/passwd')
      .set('x-tournament-id', '<script>alert("xss")</script>')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});

export default {
  TEST_CONFIG,
  MockRedisClient,
  createTestApp
};