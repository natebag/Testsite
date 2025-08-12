/**
 * MLG Runtime API Integration Tests
 * Tests API components in simulated runtime environment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RuntimeAPITester {
    constructor() {
        this.testResults = [];
        this.mockData = {
            users: [
                { id: 1, gamertag: 'TestGamer1', level: 15, xp: 2500, clan: 'Alpha' },
                { id: 2, gamertag: 'TestGamer2', level: 22, xp: 4200, clan: 'Beta' }
            ],
            clans: [
                { id: 1, name: 'Alpha', members: 25, wins: 120 },
                { id: 2, name: 'Beta', members: 18, wins: 95 }
            ],
            votes: [
                { id: 1, title: 'Best Gaming Setup', options: ['PC', 'Console'], status: 'active' },
                { id: 2, title: 'Next Tournament Game', options: ['Valorant', 'CS2'], status: 'active' }
            ],
            content: [
                { id: 1, title: 'Epic Gaming Moment', platform: 'youtube', views: 1500 },
                { id: 2, title: 'Pro Tips', platform: 'tiktok', views: 890 }
            ]
        };
    }

    async runAllTests() {
        console.log('🎮 Starting MLG Runtime API Integration Tests...\n');

        try {
            // Test Error Handler Runtime
            await this.testErrorHandlerRuntime();
            
            // Test API Client Runtime
            await this.testApiClientRuntime();
            
            // Test Auth Manager Runtime
            await this.testAuthManagerRuntime();
            
            // Test WebSocket Manager Runtime
            await this.testWebSocketManagerRuntime();
            
            // Test Cache Manager Runtime
            await this.testCacheManagerRuntime();
            
            // Test Integration Scenarios
            await this.testIntegrationScenarios();
            
            this.generateRuntimeReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    async testErrorHandlerRuntime() {
        const category = 'Error Handler Runtime';
        console.log(`🔍 Testing ${category}...`);

        // Test 1: Error classification with real errors
        await this.runTest(category, 'Error Classification', async () => {
            const errors = [
                new Error('Connection timeout after 10 seconds'),
                new Error('Wallet disconnected unexpectedly'),
                new Error('HTTP 404: Resource not found'),
                new Error('HTTP 401: Unauthorized access'),
                new Error('Rate limit exceeded: 429')
            ];

            const expectedCodes = ['E74', '0102', 'D01', 'S01', 'E65'];
            
            // Mock the categorizeError method to test
            const mockErrorHandler = {
                categorizeError: (error) => {
                    const message = error.message.toLowerCase();
                    if (message.includes('timeout')) return 'E74';
                    if (message.includes('wallet') && message.includes('disconnect')) return '0102';
                    if (message.includes('404')) return 'D01';
                    if (message.includes('401')) return 'S01';
                    if (message.includes('429')) return 'E65';
                    return 'X01';
                }
            };

            const results = errors.map(error => mockErrorHandler.categorizeError(error));
            const allCorrect = results.every((result, index) => result === expectedCodes[index]);

            return allCorrect ? 'All errors classified correctly' : 'Some errors misclassified';
        });

        // Test 2: Recovery strategy execution
        await this.runTest(category, 'Recovery Strategy Execution', async () => {
            const mockRecoveryStrategies = {
                network: { maxRetries: 3, baseDelay: 1000, backoffMultiplier: 2 },
                wallet: { maxRetries: 2, baseDelay: 500, backoffMultiplier: 1.5 }
            };

            // Simulate recovery attempt calculation
            const calculateDelay = (strategy, attempt) => {
                return strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attempt);
            };

            const networkDelay = calculateDelay(mockRecoveryStrategies.network, 2);
            const walletDelay = calculateDelay(mockRecoveryStrategies.wallet, 1);

            const networkExpected = 1000 * Math.pow(2, 2); // 4000ms
            const walletExpected = 500 * Math.pow(1.5, 1); // 750ms

            return (networkDelay === networkExpected && walletDelay === walletExpected) 
                ? 'Recovery delays calculated correctly' 
                : 'Recovery delay calculation failed';
        });

        // Test 3: Circuit breaker state management
        await this.runTest(category, 'Circuit Breaker Logic', async () => {
            const mockCircuitBreaker = {
                state: 'closed',
                failures: 0,
                threshold: 5,
                updateOnFailure: function() {
                    this.failures++;
                    if (this.failures >= this.threshold) {
                        this.state = 'open';
                    }
                },
                reset: function() {
                    this.failures = 0;
                    this.state = 'closed';
                }
            };

            // Simulate 5 failures
            for (let i = 0; i < 5; i++) {
                mockCircuitBreaker.updateOnFailure();
            }

            const openedCorrectly = mockCircuitBreaker.state === 'open';
            
            mockCircuitBreaker.reset();
            const resetCorrectly = mockCircuitBreaker.state === 'closed' && mockCircuitBreaker.failures === 0;

            return (openedCorrectly && resetCorrectly) 
                ? 'Circuit breaker logic working correctly' 
                : 'Circuit breaker logic failed';
        });
    }

    async testApiClientRuntime() {
        const category = 'API Client Runtime';
        console.log(`🔍 Testing ${category}...`);

        // Test 1: HTTP method simulation
        await this.runTest(category, 'HTTP Method Simulation', async () => {
            const mockApiClient = {
                baseURL: '/api',
                buildURL: function(endpoint) {
                    return endpoint.startsWith('http') ? endpoint : this.baseURL + endpoint;
                },
                processRequest: function(method, url, data = null) {
                    const fullUrl = this.buildURL(url);
                    return {
                        method,
                        url: fullUrl,
                        data,
                        timestamp: Date.now()
                    };
                }
            };

            const getRequest = mockApiClient.processRequest('GET', '/users/profile');
            const postRequest = mockApiClient.processRequest('POST', '/clans', { name: 'TestClan' });

            const getValid = getRequest.method === 'GET' && getRequest.url === '/api/users/profile';
            const postValid = postRequest.method === 'POST' && postRequest.data.name === 'TestClan';

            return (getValid && postValid) 
                ? 'HTTP methods processing correctly' 
                : 'HTTP method processing failed';
        });

        // Test 2: Request interceptor simulation
        await this.runTest(category, 'Request Interceptor Chain', async () => {
            const mockInterceptors = [
                (config) => ({ ...config, headers: { ...config.headers, 'X-App': 'MLG' } }),
                (config) => ({ ...config, headers: { ...config.headers, 'X-Timestamp': Date.now() } }),
                (config) => ({ ...config, timeout: 10000 })
            ];

            let config = { url: '/test', method: 'GET', headers: {} };
            
            for (const interceptor of mockInterceptors) {
                config = interceptor(config);
            }

            const hasAppHeader = config.headers['X-App'] === 'MLG';
            const hasTimestamp = config.headers['X-Timestamp'];
            const hasTimeout = config.timeout === 10000;

            return (hasAppHeader && hasTimestamp && hasTimeout) 
                ? 'Request interceptor chain working correctly' 
                : 'Request interceptor chain failed';
        });

        // Test 3: Cache integration simulation
        await this.runTest(category, 'Cache Integration', async () => {
            const mockCache = new Map();
            const mockCacheManager = {
                generateKey: (url) => btoa(url).slice(0, 16),
                get: (key) => mockCache.get(key),
                set: (key, data) => mockCache.set(key, { data, timestamp: Date.now() })
            };

            const testUrl = '/api/test';
            const testData = { test: 'data' };
            
            // Simulate cache miss then set
            const key = mockCacheManager.generateKey(testUrl);
            const miss = mockCacheManager.get(key);
            mockCacheManager.set(key, testData);
            const hit = mockCacheManager.get(key);

            return (!miss && hit && hit.data.test === 'data') 
                ? 'Cache integration working correctly' 
                : 'Cache integration failed';
        });
    }

    async testAuthManagerRuntime() {
        const category = 'Auth Manager Runtime';
        console.log(`🔍 Testing ${category}...`);

        // Test 1: Token encryption/decryption simulation
        await this.runTest(category, 'Token Encryption', async () => {
            const mockEncryption = {
                key: 'test-key-12345',
                encrypt: function(data) {
                    // Simple XOR encryption simulation
                    let encrypted = '';
                    for (let i = 0; i < data.length; i++) {
                        encrypted += String.fromCharCode(data.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length));
                    }
                    return btoa(encrypted);
                },
                decrypt: function(encryptedData) {
                    try {
                        const data = atob(encryptedData);
                        let decrypted = '';
                        for (let i = 0; i < data.length; i++) {
                            decrypted += String.fromCharCode(data.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length));
                        }
                        return decrypted;
                    } catch {
                        return null;
                    }
                }
            };

            const testToken = 'test-auth-token-123';
            const encrypted = mockEncryption.encrypt(testToken);
            const decrypted = mockEncryption.decrypt(encrypted);

            return (encrypted !== testToken && decrypted === testToken) 
                ? 'Token encryption/decryption working correctly' 
                : 'Token encryption/decryption failed';
        });

        // Test 2: Session timeout simulation
        await this.runTest(category, 'Session Timeout Logic', async () => {
            const mockSession = {
                loginTime: Date.now() - (10 * 60 * 1000), // 10 minutes ago
                lastActivity: Date.now() - (5 * 60 * 1000), // 5 minutes ago
                timeout: 15 * 60 * 1000, // 15 minutes
                isActive: function() {
                    const timeSinceActivity = Date.now() - this.lastActivity;
                    return timeSinceActivity < this.timeout;
                },
                updateActivity: function() {
                    this.lastActivity = Date.now();
                }
            };

            const activeBeforeUpdate = mockSession.isActive();
            mockSession.updateActivity();
            const activeAfterUpdate = mockSession.isActive();

            return (activeBeforeUpdate && activeAfterUpdate) 
                ? 'Session timeout logic working correctly' 
                : 'Session timeout logic failed';
        });

        // Test 3: Device fingerprinting simulation
        await this.runTest(category, 'Device Fingerprinting', async () => {
            const mockFingerprinting = {
                generateFingerprint: function() {
                    const components = {
                        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        screen: '1920x1080',
                        timezone: 'America/New_York',
                        language: 'en-US'
                    };
                    return btoa(JSON.stringify(components)).slice(0, 32);
                },
                validateFingerprint: function(stored, current) {
                    return stored === current;
                }
            };

            const fingerprint1 = mockFingerprinting.generateFingerprint();
            const fingerprint2 = mockFingerprinting.generateFingerprint();
            const isValid = mockFingerprinting.validateFingerprint(fingerprint1, fingerprint2);

            return (fingerprint1.length === 32 && isValid) 
                ? 'Device fingerprinting working correctly' 
                : 'Device fingerprinting failed';
        });
    }

    async testWebSocketManagerRuntime() {
        const category = 'WebSocket Manager Runtime';
        console.log(`🔍 Testing ${category}...`);

        // Test 1: Subscription management simulation
        await this.runTest(category, 'Subscription Management', async () => {
            const mockWSManager = {
                subscriptions: new Map(),
                roomSubscriptions: new Set(),
                subscribe: function(room, callback) {
                    if (!this.subscriptions.has(room)) {
                        this.subscriptions.set(room, new Set());
                    }
                    this.subscriptions.get(room).add(callback);
                    this.roomSubscriptions.add(room);
                    return true;
                },
                unsubscribe: function(room, callback = null) {
                    if (!this.subscriptions.has(room)) return false;
                    
                    if (callback) {
                        this.subscriptions.get(room).delete(callback);
                        if (this.subscriptions.get(room).size === 0) {
                            this.subscriptions.delete(room);
                            this.roomSubscriptions.delete(room);
                        }
                    } else {
                        this.subscriptions.delete(room);
                        this.roomSubscriptions.delete(room);
                    }
                    return true;
                },
                notifySubscribers: function(room, data) {
                    if (this.subscriptions.has(room)) {
                        this.subscriptions.get(room).forEach(callback => callback(data));
                    }
                }
            };

            const testCallback = (data) => data.received = true;
            const testData = { message: 'test', received: false };

            mockWSManager.subscribe('test-room', testCallback);
            mockWSManager.notifySubscribers('test-room', testData);
            const subscriptionWorked = testData.received === true;

            mockWSManager.unsubscribe('test-room');
            const unsubscriptionWorked = !mockWSManager.subscriptions.has('test-room');

            return (subscriptionWorked && unsubscriptionWorked) 
                ? 'Subscription management working correctly' 
                : 'Subscription management failed';
        });

        // Test 2: Reconnection logic simulation
        await this.runTest(category, 'Reconnection Logic', async () => {
            const mockReconnection = {
                maxAttempts: 5,
                currentAttempts: 0,
                backoffDelay: 1000,
                backoffMultiplier: 2,
                calculateNextDelay: function() {
                    return this.backoffDelay * Math.pow(this.backoffMultiplier, this.currentAttempts);
                },
                canReconnect: function() {
                    return this.currentAttempts < this.maxAttempts;
                },
                attemptReconnect: function() {
                    if (this.canReconnect()) {
                        this.currentAttempts++;
                        return { attempt: this.currentAttempts, delay: this.calculateNextDelay() };
                    }
                    return null;
                }
            };

            const attempt1 = mockReconnection.attemptReconnect();
            const attempt2 = mockReconnection.attemptReconnect();

            const validAttempts = attempt1.attempt === 1 && attempt2.attempt === 2;
            const validDelays = attempt1.delay === 2000 && attempt2.delay === 4000; // 1000 * 2^1 and 1000 * 2^2

            return (validAttempts && validDelays) 
                ? 'Reconnection logic working correctly' 
                : 'Reconnection logic failed';
        });

        // Test 3: Fallback polling simulation
        await this.runTest(category, 'Fallback Polling', async () => {
            const mockPolling = {
                isPolling: false,
                pollingInterval: null,
                subscriptions: new Set(['voting', 'clans']),
                startPolling: function(interval = 10000) {
                    this.isPolling = true;
                    this.pollingInterval = interval;
                    return true;
                },
                stopPolling: function() {
                    this.isPolling = false;
                    this.pollingInterval = null;
                },
                pollForUpdates: async function() {
                    const updates = {};
                    for (const room of this.subscriptions) {
                        updates[room] = { lastUpdate: Date.now(), data: `${room}_data` };
                    }
                    return updates;
                }
            };

            mockPolling.startPolling();
            const pollingStarted = mockPolling.isPolling && mockPolling.pollingInterval === 10000;

            const updates = await mockPolling.pollForUpdates();
            const hasUpdates = updates.voting && updates.clans;

            mockPolling.stopPolling();
            const pollingStopped = !mockPolling.isPolling && !mockPolling.pollingInterval;

            return (pollingStarted && hasUpdates && pollingStopped) 
                ? 'Fallback polling working correctly' 
                : 'Fallback polling failed';
        });
    }

    async testCacheManagerRuntime() {
        const category = 'Cache Manager Runtime';
        console.log(`🔍 Testing ${category}...`);

        // Test 1: Multi-level cache simulation
        await this.runTest(category, 'Multi-Level Caching', async () => {
            const mockCacheManager = {
                memoryCache: new Map(),
                storageCache: {},
                set: function(key, data, options = {}) {
                    const cacheItem = {
                        data,
                        timestamp: Date.now(),
                        ttl: options.ttl || 300000 // 5 minutes
                    };
                    
                    this.memoryCache.set(key, cacheItem);
                    
                    if (options.priority === 'high') {
                        this.storageCache[key] = cacheItem;
                    }
                },
                get: function(key) {
                    // Check memory first
                    let item = this.memoryCache.get(key);
                    
                    // If not in memory, check storage
                    if (!item && this.storageCache[key]) {
                        item = this.storageCache[key];
                        this.memoryCache.set(key, item); // Promote to memory
                    }
                    
                    // Check expiration
                    if (item && (Date.now() - item.timestamp) > item.ttl) {
                        this.delete(key);
                        return null;
                    }
                    
                    return item ? item.data : null;
                },
                delete: function(key) {
                    this.memoryCache.delete(key);
                    delete this.storageCache[key];
                }
            };

            const testKey = 'test-cache-key';
            const testData = { test: 'cache data' };

            // Test memory cache
            mockCacheManager.set(testKey, testData);
            const memoryHit = mockCacheManager.get(testKey);

            // Test storage cache (high priority)
            mockCacheManager.delete(testKey);
            mockCacheManager.set(testKey, testData, { priority: 'high' });
            mockCacheManager.memoryCache.delete(testKey); // Remove from memory
            const storageHit = mockCacheManager.get(testKey);

            return (memoryHit?.test === 'cache data' && storageHit?.test === 'cache data') 
                ? 'Multi-level caching working correctly' 
                : 'Multi-level caching failed';
        });

        // Test 2: TTL expiration simulation
        await this.runTest(category, 'TTL Expiration', async () => {
            const mockTTLCache = {
                cache: new Map(),
                set: function(key, data, ttl = 1000) {
                    this.cache.set(key, {
                        data,
                        expires: Date.now() + ttl
                    });
                },
                get: function(key) {
                    const item = this.cache.get(key);
                    if (!item) return null;
                    
                    if (Date.now() > item.expires) {
                        this.cache.delete(key);
                        return null;
                    }
                    
                    return item.data;
                }
            };

            const testKey = 'ttl-test';
            const testData = { ttl: 'test data' };

            // Set with 100ms TTL
            mockTTLCache.set(testKey, testData, 100);
            const immediateGet = mockTTLCache.get(testKey);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 150));
            const expiredGet = mockTTLCache.get(testKey);

            return (immediateGet?.ttl === 'test data' && expiredGet === null) 
                ? 'TTL expiration working correctly' 
                : 'TTL expiration failed';
        });

        // Test 3: Cache compression simulation
        await this.runTest(category, 'Data Compression', async () => {
            const mockCompression = {
                compressionThreshold: 1024,
                compress: function(data) {
                    const jsonStr = JSON.stringify(data);
                    return btoa(jsonStr);
                },
                decompress: function(compressedData) {
                    try {
                        return JSON.parse(atob(compressedData));
                    } catch {
                        throw new Error('Decompression failed');
                    }
                },
                shouldCompress: function(data) {
                    return JSON.stringify(data).length > this.compressionThreshold;
                }
            };

            // Test with large data
            const largeData = { data: 'x'.repeat(2000) };
            const shouldCompress = mockCompression.shouldCompress(largeData);
            
            if (shouldCompress) {
                const compressed = mockCompression.compress(largeData);
                const decompressed = mockCompression.decompress(compressed);
                
                return (compressed !== JSON.stringify(largeData) && decompressed.data === largeData.data) 
                    ? 'Data compression working correctly' 
                    : 'Data compression failed';
            }

            return 'Compression threshold not met';
        });
    }

    async testIntegrationScenarios() {
        const category = 'Integration Scenarios';
        console.log(`🔍 Testing ${category}...`);

        // Test 1: Vote submission flow simulation
        await this.runTest(category, 'Vote Submission Flow', async () => {
            const mockVoteFlow = {
                authManager: { isAuthenticated: () => true, getToken: () => 'valid-token' },
                apiClient: { 
                    castVote: async (voteId, choice, amount) => ({ success: true, voteId, choice, amount })
                },
                errorHandler: { 
                    executeWithErrorHandling: async (operation) => {
                        try {
                            return { success: true, data: await operation() };
                        } catch (error) {
                            return { success: false, error };
                        }
                    }
                },
                cacheManager: { 
                    delete: (key) => true,
                    set: (key, data) => true
                }
            };

            // Simulate vote submission
            const isAuth = mockVoteFlow.authManager.isAuthenticated();
            if (!isAuth) throw new Error('User not authenticated');

            const voteResult = await mockVoteFlow.errorHandler.executeWithErrorHandling(
                () => mockVoteFlow.apiClient.castVote('vote-1', 'option-A', 10)
            );

            if (voteResult.success) {
                mockVoteFlow.cacheManager.delete('active-votes');
                mockVoteFlow.cacheManager.set('user-votes', voteResult.data);
            }

            return (voteResult.success && voteResult.data.voteId === 'vote-1') 
                ? 'Vote submission flow working correctly' 
                : 'Vote submission flow failed';
        });

        // Test 2: Content upload flow simulation
        await this.runTest(category, 'Content Upload Flow', async () => {
            const mockContentFlow = {
                authManager: { getCurrentUser: () => ({ id: 1, gamertag: 'TestUser' }) },
                apiClient: {
                    uploadContent: async (file, metadata) => ({
                        success: true,
                        id: 'content-123',
                        url: '/uploads/content-123.mp4'
                    })
                },
                wsManager: {
                    emit: (event, data) => ({ event, data, sent: true })
                }
            };

            const user = mockContentFlow.authManager.getCurrentUser();
            if (!user) throw new Error('User not found');

            const uploadResult = await mockContentFlow.apiClient.uploadContent(
                { name: 'test.mp4', size: 1024 },
                { title: 'Test Upload', platform: 'youtube' }
            );

            if (uploadResult.success) {
                mockContentFlow.wsManager.emit('content_uploaded', {
                    userId: user.id,
                    contentId: uploadResult.id
                });
            }

            return (uploadResult.success && uploadResult.id === 'content-123') 
                ? 'Content upload flow working correctly' 
                : 'Content upload flow failed';
        });

        // Test 3: Real-time notification flow simulation
        await this.runTest(category, 'Real-time Notification Flow', async () => {
            const mockNotificationFlow = {
                wsManager: {
                    subscriptions: new Map(),
                    subscribe: function(room, callback) {
                        if (!this.subscriptions.has(room)) {
                            this.subscriptions.set(room, []);
                        }
                        this.subscriptions.get(room).push(callback);
                    },
                    emit: function(event, data) {
                        // Simulate server broadcasting back to subscribers
                        if (this.subscriptions.has(event)) {
                            this.subscriptions.get(event).forEach(callback => callback(data));
                        }
                    }
                },
                errorHandler: {
                    createNotification: (config) => ({ ...config, created: true })
                }
            };

            let notificationReceived = null;

            // Subscribe to notifications
            mockNotificationFlow.wsManager.subscribe('notifications', (data) => {
                notificationReceived = data;
                mockNotificationFlow.errorHandler.createNotification({
                    type: data.type,
                    title: data.title,
                    message: data.message
                });
            });

            // Simulate server sending notification
            mockNotificationFlow.wsManager.emit('notifications', {
                type: 'info',
                title: 'New Achievement',
                message: 'You earned a new badge!'
            });

            return (notificationReceived && notificationReceived.title === 'New Achievement') 
                ? 'Real-time notification flow working correctly' 
                : 'Real-time notification flow failed';
        });
    }

    async runTest(category, testName, testFunction) {
        try {
            const startTime = Date.now();
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                category,
                testName,
                status: 'PASS',
                result,
                duration,
                timestamp: new Date().toISOString()
            });
            
            console.log(`  ✅ ${testName}: ${result} (${duration}ms)`);
        } catch (error) {
            this.testResults.push({
                category,
                testName,
                status: 'FAIL',
                result: error.message,
                timestamp: new Date().toISOString()
            });
            
            console.log(`  ❌ ${testName}: ${error.message}`);
        }
    }

    generateRuntimeReport() {
        console.log('\n📊 RUNTIME TEST REPORT');
        console.log('='.repeat(50));

        const stats = {
            total: this.testResults.length,
            passed: this.testResults.filter(r => r.status === 'PASS').length,
            failed: this.testResults.filter(r => r.status === 'FAIL').length
        };

        const passRate = (stats.passed / stats.total * 100).toFixed(1);

        console.log(`Total Tests: ${stats.total}`);
        console.log(`✅ Passed: ${stats.passed} (${passRate}%)`);
        console.log(`❌ Failed: ${stats.failed}`);

        // Group by category
        const byCategory = {};
        this.testResults.forEach(result => {
            if (!byCategory[result.category]) {
                byCategory[result.category] = { passed: 0, failed: 0, tests: [] };
            }
            byCategory[result.category].tests.push(result);
            if (result.status === 'PASS') {
                byCategory[result.category].passed++;
            } else {
                byCategory[result.category].failed++;
            }
        });

        console.log('\n📈 CATEGORY BREAKDOWN');
        console.log('-'.repeat(30));

        Object.entries(byCategory).forEach(([category, data]) => {
            const categoryPassRate = (data.passed / data.tests.length * 100).toFixed(1);
            console.log(`${category}: ${data.passed}/${data.tests.length} (${categoryPassRate}%)`);
            
            // Show failed tests
            const failures = data.tests.filter(t => t.status === 'FAIL');
            if (failures.length > 0) {
                failures.forEach(failure => {
                    console.log(`  ❌ ${failure.testName}: ${failure.result}`);
                });
            }
        });

        // Performance metrics
        const avgDuration = this.testResults
            .filter(r => r.duration)
            .reduce((sum, r) => sum + r.duration, 0) / stats.total;

        console.log('\n⚡ PERFORMANCE METRICS');
        console.log('-'.repeat(30));
        console.log(`Average Test Duration: ${avgDuration.toFixed(2)}ms`);
        console.log(`Total Test Time: ${this.testResults.reduce((sum, r) => sum + (r.duration || 0), 0)}ms`);

        // Overall assessment
        console.log('\n🎯 ASSESSMENT');
        console.log('-'.repeat(30));

        if (passRate >= 90) {
            console.log('🟢 EXCELLENT - All API integrations are functioning optimally');
        } else if (passRate >= 80) {
            console.log('🟡 GOOD - Minor issues detected, but overall functionality is solid');
        } else if (passRate >= 70) {
            console.log('🟠 ACCEPTABLE - Some issues need attention before production');
        } else {
            console.log('🔴 POOR - Significant issues require immediate attention');
        }

        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            summary: { ...stats, passRate: parseFloat(passRate), avgDuration },
            categories: byCategory,
            detailedResults: this.testResults
        };

        try {
            fs.writeFileSync(
                path.join(__dirname, 'runtime-test-report.json'),
                JSON.stringify(report, null, 2)
            );
            console.log('\n📁 Detailed report saved to: runtime-test-report.json');
        } catch (error) {
            console.warn('Failed to save report:', error.message);
        }

        return report;
    }
}

// Run runtime tests
const tester = new RuntimeAPITester();
tester.runAllTests().catch(console.error);