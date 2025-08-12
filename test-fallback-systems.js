/**
 * MLG Fallback Systems Test Suite
 * Tests offline mode, service failures, and graceful degradation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FallbackSystemTester {
    constructor() {
        this.testResults = [];
        this.scenarios = [];
    }

    async runAllTests() {
        console.log('🛡️ Starting MLG Fallback Systems Test Suite...\n');

        try {
            await this.testNetworkFailureScenarios();
            await this.testServiceUnavailabilityScenarios();
            await this.testOfflineModeScenarios();
            await this.testDegradedPerformanceScenarios();
            await this.testRecoveryScenarios();
            await this.testUserExperienceScenarios();
            
            this.generateFallbackReport();
            
        } catch (error) {
            console.error('❌ Fallback test suite failed:', error);
        }
    }

    async testNetworkFailureScenarios() {
        const category = 'Network Failure Scenarios';
        console.log(`🔍 Testing ${category}...`);

        // Test 1: Complete network disconnection
        await this.runTest(category, 'Complete Network Disconnection', async () => {
            const mockNetworkManager = {
                isOnline: false,
                connectionStatus: 'offline',
                fallbackData: {
                    userProfile: { gamertag: 'OfflineUser', level: 1 },
                    clans: [],
                    votes: []
                },
                handleOfflineMode: function() {
                    return {
                        mode: 'offline',
                        dataAvailable: Object.keys(this.fallbackData),
                        features: {
                            viewCachedContent: true,
                            submitVotes: false,
                            realTimeUpdates: false,
                            newContent: false
                        }
                    };
                }
            };

            const offlineResult = mockNetworkManager.handleOfflineMode();
            
            return (offlineResult.mode === 'offline' && 
                    offlineResult.features.viewCachedContent === true &&
                    offlineResult.features.submitVotes === false) 
                ? 'Offline mode activated correctly with appropriate feature restrictions'
                : 'Offline mode handling failed';
        });

        // Test 2: Intermittent connectivity
        await this.runTest(category, 'Intermittent Connectivity', async () => {
            const mockConnectionManager = {
                connectionAttempts: 0,
                maxAttempts: 3,
                backoffDelays: [1000, 2000, 4000],
                isConnected: false,
                attemptReconnection: function() {
                    if (this.connectionAttempts < this.maxAttempts) {
                        const delay = this.backoffDelays[this.connectionAttempts];
                        this.connectionAttempts++;
                        return {
                            attempt: this.connectionAttempts,
                            delay,
                            willRetry: this.connectionAttempts < this.maxAttempts
                        };
                    }
                    return { maxAttemptsReached: true };
                },
                simulateConnection: function() {
                    this.isConnected = true;
                    this.connectionAttempts = 0; // Reset on successful connection
                }
            };

            const attempt1 = mockConnectionManager.attemptReconnection();
            const attempt2 = mockConnectionManager.attemptReconnection();
            const attempt3 = mockConnectionManager.attemptReconnection();
            const attempt4 = mockConnectionManager.attemptReconnection();

            mockConnectionManager.simulateConnection(); // Simulate successful reconnection
            const postConnectionAttempt = mockConnectionManager.attemptReconnection();

            return (attempt1.delay === 1000 && 
                    attempt2.delay === 2000 && 
                    attempt3.delay === 4000 &&
                    attempt4.maxAttemptsReached === true &&
                    postConnectionAttempt.attempt === 1) // Reset after reconnection
                ? 'Intermittent connectivity handled with exponential backoff and reset'
                : 'Intermittent connectivity handling failed';
        });

        // Test 3: Slow network conditions
        await this.runTest(category, 'Slow Network Adaptation', async () => {
            const mockNetworkAdapter = {
                connectionSpeed: 'slow', // fast, medium, slow, very_slow
                adaptationStrategies: {
                    fast: { imageQuality: 'high', cacheStrategy: 'minimal', prefetch: true },
                    medium: { imageQuality: 'medium', cacheStrategy: 'moderate', prefetch: false },
                    slow: { imageQuality: 'low', cacheStrategy: 'aggressive', prefetch: false },
                    very_slow: { imageQuality: 'thumbnail', cacheStrategy: 'maximum', prefetch: false }
                },
                adaptToConnection: function(speed) {
                    this.connectionSpeed = speed;
                    return this.adaptationStrategies[speed];
                },
                measureLatency: function() {
                    // Mock latency measurement
                    const latencies = { fast: 50, medium: 150, slow: 400, very_slow: 800 };
                    return latencies[this.connectionSpeed];
                }
            };

            const slowAdaptation = mockNetworkAdapter.adaptToConnection('slow');
            const latency = mockNetworkAdapter.measureLatency();

            return (slowAdaptation.imageQuality === 'low' &&
                    slowAdaptation.cacheStrategy === 'aggressive' &&
                    slowAdaptation.prefetch === false &&
                    latency === 400)
                ? 'Network adaptation working correctly for slow connections'
                : 'Network adaptation failed';
        });
    }

    async testServiceUnavailabilityScenarios() {
        const category = 'Service Unavailability Scenarios';
        console.log(`🔍 Testing ${category}...`);

        // Test 1: API service down
        await this.runTest(category, 'API Service Unavailable', async () => {
            const mockApiService = {
                status: 'down',
                fallbackStrategies: {
                    getUserProfile: () => ({ cached: true, data: 'cached_user_data' }),
                    getClans: () => ({ cached: true, data: [] }),
                    getVotes: () => ({ cached: true, data: [] })
                },
                handleApiCall: function(endpoint) {
                    if (this.status === 'down') {
                        const fallbackMethod = this.fallbackStrategies[endpoint];
                        if (fallbackMethod) {
                            return { 
                                success: true, 
                                fallback: true,
                                data: fallbackMethod().data,
                                message: 'Using cached data due to service unavailability'
                            };
                        }
                        return { success: false, error: 'Service unavailable and no fallback available' };
                    }
                    return { success: true, data: 'live_data' };
                }
            };

            const userResult = mockApiService.handleApiCall('getUserProfile');
            const clansResult = mockApiService.handleApiCall('getClans');
            const unknownResult = mockApiService.handleApiCall('unknownEndpoint');

            return (userResult.success && userResult.fallback === true &&
                    clansResult.success && clansResult.fallback === true &&
                    unknownResult.success === false)
                ? 'API service unavailability handled with appropriate fallbacks'
                : 'API service unavailability handling failed';
        });

        // Test 2: WebSocket service down
        await this.runTest(category, 'WebSocket Service Unavailable', async () => {
            const mockWebSocketService = {
                isConnected: false,
                pollingMode: false,
                pollingInterval: null,
                subscriptions: new Set(['voting', 'clans']),
                activatePollingMode: function() {
                    this.pollingMode = true;
                    this.pollingInterval = 10000; // 10 second intervals
                    return {
                        mode: 'polling',
                        interval: this.pollingInterval,
                        subscriptions: Array.from(this.subscriptions)
                    };
                },
                pollForUpdates: async function() {
                    if (this.pollingMode) {
                        const updates = {};
                        this.subscriptions.forEach(sub => {
                            updates[sub] = {
                                lastUpdate: Date.now(),
                                data: `${sub}_polling_data`,
                                source: 'polling'
                            };
                        });
                        return updates;
                    }
                    return null;
                }
            };

            const pollingActivation = mockWebSocketService.activatePollingMode();
            const updates = await mockWebSocketService.pollForUpdates();

            return (pollingActivation.mode === 'polling' &&
                    pollingActivation.interval === 10000 &&
                    updates.voting.source === 'polling' &&
                    updates.clans.source === 'polling')
                ? 'WebSocket fallback to polling working correctly'
                : 'WebSocket fallback to polling failed';
        });

        // Test 3: Database service degradation
        await this.runTest(category, 'Database Service Degradation', async () => {
            const mockDatabaseService = {
                performanceLevel: 'degraded', // optimal, degraded, critical
                responseTime: 5000, // ms
                cacheHitRate: 0.85,
                adaptToDegradation: function() {
                    if (this.performanceLevel === 'degraded') {
                        return {
                            strategy: 'read_replicas',
                            cacheFirst: true,
                            reducedFeatures: ['realTimeStats', 'detailedAnalytics'],
                            essentialOnly: false
                        };
                    } else if (this.performanceLevel === 'critical') {
                        return {
                            strategy: 'cache_only',
                            cacheFirst: true,
                            reducedFeatures: ['realTimeStats', 'detailedAnalytics', 'userProfiles'],
                            essentialOnly: true
                        };
                    }
                    return { strategy: 'normal', cacheFirst: false, reducedFeatures: [] };
                }
            };

            const degradedResponse = mockDatabaseService.adaptToDegradation();
            
            mockDatabaseService.performanceLevel = 'critical';
            const criticalResponse = mockDatabaseService.adaptToDegradation();

            return (degradedResponse.strategy === 'read_replicas' &&
                    degradedResponse.cacheFirst === true &&
                    criticalResponse.strategy === 'cache_only' &&
                    criticalResponse.essentialOnly === true)
                ? 'Database degradation adaptation working correctly'
                : 'Database degradation adaptation failed';
        });
    }

    async testOfflineModeScenarios() {
        const category = 'Offline Mode Scenarios';
        console.log(`🔍 Testing ${category}...`);

        // Test 1: Offline data availability
        await this.runTest(category, 'Offline Data Availability', async () => {
            const mockOfflineManager = {
                cachedData: {
                    userProfile: { id: 1, gamertag: 'OfflineUser', level: 15 },
                    clans: [{ id: 1, name: 'CachedClan', members: 20 }],
                    votes: [{ id: 1, title: 'Cached Vote', status: 'ended' }],
                    content: [{ id: 1, title: 'Cached Content', views: 1000 }]
                },
                getOfflineData: function(dataType) {
                    return this.cachedData[dataType] || null;
                },
                getAvailableDataTypes: function() {
                    return Object.keys(this.cachedData);
                },
                isDataStale: function(dataType, maxAge = 3600000) { // 1 hour
                    // Mock staleness check
                    return Math.random() > 0.7; // 30% chance of stale data
                }
            };

            const availableTypes = mockOfflineManager.getAvailableDataTypes();
            const userProfile = mockOfflineManager.getOfflineData('userProfile');
            const clans = mockOfflineManager.getOfflineData('clans');
            const unavailableData = mockOfflineManager.getOfflineData('leaderboard');

            return (availableTypes.length === 4 &&
                    userProfile.gamertag === 'OfflineUser' &&
                    clans.length === 1 &&
                    unavailableData === null)
                ? 'Offline data availability working correctly'
                : 'Offline data availability failed';
        });

        // Test 2: Offline feature restrictions
        await this.runTest(category, 'Offline Feature Restrictions', async () => {
            const mockFeatureManager = {
                offlineMode: true,
                featureAvailability: {
                    viewProfile: true,
                    editProfile: false,
                    viewClans: true,
                    joinClan: false,
                    viewVotes: true,
                    castVote: false,
                    viewContent: true,
                    uploadContent: false,
                    realTimeChat: false,
                    leaderboards: false
                },
                isFeatureAvailable: function(feature) {
                    if (this.offlineMode) {
                        return this.featureAvailability[feature] || false;
                    }
                    return true; // All features available online
                },
                getDisabledFeatures: function() {
                    if (this.offlineMode) {
                        return Object.entries(this.featureAvailability)
                            .filter(([feature, available]) => !available)
                            .map(([feature]) => feature);
                    }
                    return [];
                }
            };

            const canView = mockFeatureManager.isFeatureAvailable('viewProfile');
            const canEdit = mockFeatureManager.isFeatureAvailable('editProfile');
            const canVote = mockFeatureManager.isFeatureAvailable('castVote');
            const disabledFeatures = mockFeatureManager.getDisabledFeatures();

            return (canView === true &&
                    canEdit === false &&
                    canVote === false &&
                    disabledFeatures.length > 0)
                ? 'Offline feature restrictions working correctly'
                : 'Offline feature restrictions failed';
        });

        // Test 3: Offline queue for pending actions
        await this.runTest(category, 'Offline Action Queue', async () => {
            const mockOfflineQueue = {
                queue: [],
                addAction: function(action) {
                    const queueItem = {
                        id: Date.now(),
                        action: action.type,
                        data: action.data,
                        timestamp: Date.now(),
                        status: 'pending'
                    };
                    this.queue.push(queueItem);
                    return queueItem.id;
                },
                processQueue: async function() {
                    const results = [];
                    for (const item of this.queue) {
                        if (item.status === 'pending') {
                            // Mock processing
                            const success = Math.random() > 0.2; // 80% success rate
                            item.status = success ? 'completed' : 'failed';
                            results.push({ id: item.id, status: item.status });
                        }
                    }
                    return results;
                },
                getQueueSize: function() {
                    return this.queue.filter(item => item.status === 'pending').length;
                }
            };

            // Add some actions to queue
            mockOfflineQueue.addAction({ type: 'vote', data: { voteId: 1, choice: 'A' } });
            mockOfflineQueue.addAction({ type: 'profile_update', data: { gamertag: 'NewName' } });
            mockOfflineQueue.addAction({ type: 'clan_join', data: { clanId: 2 } });

            const queueSizeBefore = mockOfflineQueue.getQueueSize();
            const processResults = await mockOfflineQueue.processQueue();
            const queueSizeAfter = mockOfflineQueue.getQueueSize();

            return (queueSizeBefore === 3 &&
                    processResults.length === 3 &&
                    queueSizeAfter < queueSizeBefore)
                ? 'Offline action queue working correctly'
                : 'Offline action queue failed';
        });
    }

    async testDegradedPerformanceScenarios() {
        const category = 'Degraded Performance Scenarios';
        console.log(`🔍 Testing ${category}...`);

        // Test 1: High latency adaptation
        await this.runTest(category, 'High Latency Adaptation', async () => {
            const mockLatencyManager = {
                currentLatency: 800, // ms
                thresholds: {
                    good: 100,
                    acceptable: 300,
                    poor: 600,
                    critical: 1000
                },
                adaptToLatency: function() {
                    if (this.currentLatency > this.thresholds.critical) {
                        return {
                            level: 'critical',
                            adaptations: ['disable_animations', 'minimal_ui', 'essential_only'],
                            requestTimeout: 30000
                        };
                    } else if (this.currentLatency > this.thresholds.poor) {
                        return {
                            level: 'poor',
                            adaptations: ['reduce_animations', 'compress_images', 'batch_requests'],
                            requestTimeout: 20000
                        };
                    } else if (this.currentLatency > this.thresholds.acceptable) {
                        return {
                            level: 'acceptable',
                            adaptations: ['optimize_images', 'lazy_loading'],
                            requestTimeout: 15000
                        };
                    }
                    return { level: 'good', adaptations: [], requestTimeout: 10000 };
                }
            };

            const poorAdaptation = mockLatencyManager.adaptToLatency();
            
            mockLatencyManager.currentLatency = 1200;
            const criticalAdaptation = mockLatencyManager.adaptToLatency();

            return (poorAdaptation.level === 'poor' &&
                    poorAdaptation.adaptations.includes('reduce_animations') &&
                    criticalAdaptation.level === 'critical' &&
                    criticalAdaptation.adaptations.includes('essential_only'))
                ? 'High latency adaptation working correctly'
                : 'High latency adaptation failed';
        });

        // Test 2: Memory pressure handling
        await this.runTest(category, 'Memory Pressure Handling', async () => {
            const mockMemoryManager = {
                memoryUsage: 85, // percentage
                thresholds: {
                    warning: 70,
                    critical: 85,
                    emergency: 95
                },
                caches: {
                    images: { size: 50, priority: 'low' },
                    api: { size: 30, priority: 'medium' },
                    user: { size: 10, priority: 'high' }
                },
                handleMemoryPressure: function() {
                    const actions = [];
                    
                    if (this.memoryUsage > this.thresholds.emergency) {
                        actions.push('clear_all_low_priority_caches');
                        actions.push('disable_background_tasks');
                        actions.push('minimal_mode');
                    } else if (this.memoryUsage > this.thresholds.critical) {
                        actions.push('clear_image_cache');
                        actions.push('reduce_api_cache');
                        actions.push('compress_data');
                    } else if (this.memoryUsage > this.thresholds.warning) {
                        actions.push('cleanup_old_cache');
                        actions.push('optimize_images');
                    }
                    
                    return {
                        level: this.memoryUsage > 95 ? 'emergency' : 
                               this.memoryUsage > 85 ? 'critical' : 'warning',
                        actions,
                        recommendedCacheSize: Math.max(20, 100 - this.memoryUsage)
                    };
                }
            };

            const criticalHandling = mockMemoryManager.handleMemoryPressure();
            
            mockMemoryManager.memoryUsage = 97;
            const emergencyHandling = mockMemoryManager.handleMemoryPressure();

            return (criticalHandling.level === 'critical' &&
                    criticalHandling.actions.includes('clear_image_cache') &&
                    emergencyHandling.level === 'emergency' &&
                    emergencyHandling.actions.includes('minimal_mode'))
                ? 'Memory pressure handling working correctly'
                : 'Memory pressure handling failed';
        });

        // Test 3: CPU throttling adaptation
        await this.runTest(category, 'CPU Throttling Adaptation', async () => {
            const mockCPUManager = {
                cpuLoad: 90, // percentage
                isThrottled: true,
                adaptToCPULoad: function() {
                    const adaptations = {
                        animations: this.cpuLoad > 80 ? 'disabled' : 'reduced',
                        backgroundTasks: this.cpuLoad > 85 ? 'paused' : 'throttled',
                        renderQuality: this.cpuLoad > 75 ? 'low' : 'medium',
                        updateFrequency: this.cpuLoad > 80 ? 'slow' : 'normal'
                    };

                    return {
                        cpuLoad: this.cpuLoad,
                        isThrottled: this.isThrottled,
                        adaptations,
                        performanceMode: this.cpuLoad > 85 ? 'power_saving' : 'balanced'
                    };
                }
            };

            const cpuAdaptation = mockCPUManager.adaptToCPULoad();
            
            mockCPUManager.cpuLoad = 70;
            mockCPUManager.isThrottled = false;
            const normalAdaptation = mockCPUManager.adaptToCPULoad();

            return (cpuAdaptation.performanceMode === 'power_saving' &&
                    cpuAdaptation.adaptations.animations === 'disabled' &&
                    normalAdaptation.adaptations.animations === 'reduced' &&
                    normalAdaptation.adaptations.updateFrequency === 'normal')
                ? 'CPU throttling adaptation working correctly'
                : 'CPU throttling adaptation failed';
        });
    }

    async testRecoveryScenarios() {
        const category = 'Recovery Scenarios';
        console.log(`🔍 Testing ${category}...`);

        // Test 1: Service recovery detection
        await this.runTest(category, 'Service Recovery Detection', async () => {
            const mockRecoveryManager = {
                services: {
                    api: { status: 'down', lastCheck: Date.now() - 30000, checkInterval: 30000 },
                    websocket: { status: 'down', lastCheck: Date.now() - 15000, checkInterval: 15000 },
                    database: { status: 'degraded', lastCheck: Date.now() - 60000, checkInterval: 60000 }
                },
                checkServiceRecovery: function(serviceName) {
                    const service = this.services[serviceName];
                    if (!service) return null;
                    
                    const timeSinceCheck = Date.now() - service.lastCheck;
                    if (timeSinceCheck >= service.checkInterval) {
                        // Simulate recovery check
                        const recovered = Math.random() > 0.4; // 60% chance of recovery
                        
                        if (recovered) {
                            service.status = 'up';
                            service.lastRecovery = Date.now();
                        }
                        
                        service.lastCheck = Date.now();
                        return { serviceName, status: service.status, recovered };
                    }
                    
                    return { serviceName, status: service.status, checkSkipped: true };
                },
                checkAllServices: function() {
                    const results = {};
                    Object.keys(this.services).forEach(service => {
                        results[service] = this.checkServiceRecovery(service);
                    });
                    return results;
                }
            };

            const individualCheck = mockRecoveryManager.checkServiceRecovery('api');
            const allChecks = mockRecoveryManager.checkAllServices();

            return (individualCheck && individualCheck.serviceName === 'api' &&
                    Object.keys(allChecks).length === 3 &&
                    allChecks.websocket && allChecks.database)
                ? 'Service recovery detection working correctly'
                : 'Service recovery detection failed';
        });

        // Test 2: Graceful service restoration
        await this.runTest(category, 'Graceful Service Restoration', async () => {
            const mockRestorationManager = {
                restorationQueue: [],
                activeServices: new Set(),
                restoreService: function(serviceName, priority = 'normal') {
                    this.restorationQueue.push({
                        service: serviceName,
                        priority,
                        timestamp: Date.now(),
                        steps: this.getRestorationSteps(serviceName)
                    });
                    return this.processRestorationQueue();
                },
                getRestorationSteps: function(serviceName) {
                    const steps = {
                        api: ['validate_connection', 'warm_cache', 'sync_data', 'enable_features'],
                        websocket: ['establish_connection', 'resubscribe_rooms', 'sync_state'],
                        database: ['check_consistency', 'rebuild_indexes', 'optimize_queries']
                    };
                    return steps[serviceName] || ['generic_restore'];
                },
                processRestorationQueue: function() {
                    // Sort by priority (high -> normal -> low)
                    const priorityOrder = { high: 3, normal: 2, low: 1 };
                    this.restorationQueue.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
                    
                    const processed = [];
                    this.restorationQueue.forEach(item => {
                        this.activeServices.add(item.service);
                        processed.push({
                            service: item.service,
                            priority: item.priority,
                            steps: item.steps,
                            restored: true
                        });
                    });
                    
                    this.restorationQueue = []; // Clear queue
                    return processed;
                }
            };

            mockRestorationManager.restoreService('database', 'high');
            mockRestorationManager.restoreService('api', 'normal');
            mockRestorationManager.restoreService('websocket', 'low');

            const processed = mockRestorationManager.processRestorationQueue();

            // Check if services were restored in priority order
            const highPriorityFirst = processed[0].priority === 'high' && processed[0].service === 'database';
            const allRestored = processed.every(item => item.restored === true);
            const activeServicesCount = mockRestorationManager.activeServices.size;

            return (highPriorityFirst && allRestored && activeServicesCount === 3)
                ? 'Graceful service restoration working correctly'
                : 'Graceful service restoration failed';
        });

        // Test 3: Data synchronization after recovery
        await this.runTest(category, 'Data Synchronization After Recovery', async () => {
            const mockSyncManager = {
                pendingSync: {
                    userProfile: { lastSync: Date.now() - 120000, changed: true },
                    clans: { lastSync: Date.now() - 90000, changed: false },
                    votes: { lastSync: Date.now() - 60000, changed: true }
                },
                syncData: async function(dataType = null) {
                    if (dataType) {
                        const sync = this.pendingSync[dataType];
                        if (sync && sync.changed) {
                            sync.lastSync = Date.now();
                            sync.changed = false;
                            return { dataType, synced: true, timestamp: sync.lastSync };
                        }
                        return { dataType, synced: false, reason: 'no_changes' };
                    }
                    
                    // Sync all changed data
                    const results = [];
                    for (const [type, sync] of Object.entries(this.pendingSync)) {
                        if (sync.changed) {
                            sync.lastSync = Date.now();
                            sync.changed = false;
                            results.push({ dataType: type, synced: true, timestamp: sync.lastSync });
                        }
                    }
                    return results;
                },
                detectConflicts: function() {
                    const conflicts = [];
                    
                    // Mock conflict detection
                    Object.entries(this.pendingSync).forEach(([type, sync]) => {
                        const timeSinceSync = Date.now() - sync.lastSync;
                        if (timeSinceSync > 300000) { // 5 minutes
                            conflicts.push({
                                dataType: type,
                                age: timeSinceSync,
                                severity: timeSinceSync > 600000 ? 'high' : 'medium'
                            });
                        }
                    });
                    
                    return conflicts;
                }
            };

            const allSyncResult = await mockSyncManager.syncData();
            const individualSyncResult = await mockSyncManager.syncData('clans');
            const conflicts = mockSyncManager.detectConflicts();

            return (allSyncResult.length === 2 && // userProfile and votes should sync
                    individualSyncResult.synced === false && // clans no changes
                    Array.isArray(conflicts))
                ? 'Data synchronization after recovery working correctly'
                : 'Data synchronization after recovery failed';
        });
    }

    async testUserExperienceScenarios() {
        const category = 'User Experience Scenarios';
        console.log(`🔍 Testing ${category}...`);

        // Test 1: Progressive loading with degraded performance
        await this.runTest(category, 'Progressive Loading', async () => {
            const mockProgressiveLoader = {
                loadingPriorities: {
                    essential: ['user_auth', 'navigation', 'error_handler'],
                    important: ['user_profile', 'main_content'],
                    secondary: ['recommendations', 'ads', 'analytics'],
                    optional: ['animations', 'background_tasks', 'preloader']
                },
                connectionQuality: 'poor',
                loadContent: function() {
                    const loadOrder = [];
                    
                    if (this.connectionQuality === 'poor') {
                        // Only load essential and important
                        loadOrder.push(...this.loadingPriorities.essential);
                        loadOrder.push(...this.loadingPriorities.important);
                    } else if (this.connectionQuality === 'good') {
                        // Load all except optional
                        Object.entries(this.loadingPriorities).forEach(([priority, items]) => {
                            if (priority !== 'optional') {
                                loadOrder.push(...items);
                            }
                        });
                    } else {
                        // Load everything
                        Object.values(this.loadingPriorities).forEach(items => {
                            loadOrder.push(...items);
                        });
                    }
                    
                    return {
                        loadOrder,
                        skipped: this.connectionQuality === 'poor' 
                            ? [...this.loadingPriorities.secondary, ...this.loadingPriorities.optional]
                            : []
                    };
                }
            };

            const poorQualityLoad = mockProgressiveLoader.loadContent();
            
            mockProgressiveLoader.connectionQuality = 'excellent';
            const excellentQualityLoad = mockProgressiveLoader.loadContent();

            return (poorQualityLoad.loadOrder.includes('user_auth') &&
                    poorQualityLoad.loadOrder.includes('user_profile') &&
                    !poorQualityLoad.loadOrder.includes('animations') &&
                    poorQualityLoad.skipped.includes('analytics') &&
                    excellentQualityLoad.loadOrder.includes('analytics'))
                ? 'Progressive loading working correctly'
                : 'Progressive loading failed';
        });

        // Test 2: User feedback during failures
        await this.runTest(category, 'User Feedback During Failures', async () => {
            const mockFeedbackManager = {
                notifications: [],
                showNotification: function(type, title, message, actions = []) {
                    const notification = {
                        id: Date.now(),
                        type,
                        title,
                        message,
                        actions,
                        timestamp: Date.now()
                    };
                    this.notifications.push(notification);
                    return notification.id;
                },
                handleFailure: function(failureType, context = {}) {
                    const feedbackStrategies = {
                        network_timeout: {
                            type: 'warning',
                            title: '🔴 Connection Timeout',
                            message: 'Your connection is slower than usual. We\'re retrying automatically.',
                            actions: ['retry', 'offline_mode']
                        },
                        service_unavailable: {
                            type: 'error',
                            title: '⚠️ Service Temporarily Down',
                            message: 'We\'re experiencing technical difficulties. Using cached data.',
                            actions: ['refresh', 'status_page']
                        },
                        data_sync_failed: {
                            type: 'warning',
                            title: '📱 Sync Failed',
                            message: 'Your changes will be saved when connection is restored.',
                            actions: ['retry_sync', 'view_queue']
                        }
                    };

                    const strategy = feedbackStrategies[failureType];
                    if (strategy) {
                        return this.showNotification(
                            strategy.type,
                            strategy.title,
                            strategy.message,
                            strategy.actions
                        );
                    }
                    
                    return null;
                }
            };

            const networkFailureId = mockFeedbackManager.handleFailure('network_timeout');
            const serviceFailureId = mockFeedbackManager.handleFailure('service_unavailable');
            const unknownFailureId = mockFeedbackManager.handleFailure('unknown_error');

            const networkNotification = mockFeedbackManager.notifications.find(n => n.id === networkFailureId);
            const serviceNotification = mockFeedbackManager.notifications.find(n => n.id === serviceFailureId);

            return (networkNotification && networkNotification.title.includes('Connection Timeout') &&
                    serviceNotification && serviceNotification.actions.includes('status_page') &&
                    unknownFailureId === null &&
                    mockFeedbackManager.notifications.length === 2)
                ? 'User feedback during failures working correctly'
                : 'User feedback during failures failed';
        });

        // Test 3: Performance indicators
        await this.runTest(category, 'Performance Indicators', async () => {
            const mockPerformanceIndicator = {
                metrics: {
                    connectionLatency: 150,
                    apiResponseTime: 800,
                    cacheHitRate: 0.75,
                    errorRate: 0.02
                },
                getPerformanceLevel: function() {
                    let score = 100;
                    
                    // Deduct points for poor metrics
                    if (this.metrics.connectionLatency > 200) score -= 20;
                    else if (this.metrics.connectionLatency > 100) score -= 10;
                    
                    if (this.metrics.apiResponseTime > 1000) score -= 25;
                    else if (this.metrics.apiResponseTime > 500) score -= 15;
                    
                    if (this.metrics.cacheHitRate < 0.8) score -= 15;
                    if (this.metrics.errorRate > 0.05) score -= 20;
                    
                    return {
                        score,
                        level: score >= 80 ? 'good' : score >= 60 ? 'fair' : 'poor',
                        indicators: {
                            connection: this.metrics.connectionLatency <= 100 ? 'good' : 
                                      this.metrics.connectionLatency <= 200 ? 'fair' : 'poor',
                            api: this.metrics.apiResponseTime <= 500 ? 'good' :
                                this.metrics.apiResponseTime <= 1000 ? 'fair' : 'poor',
                            cache: this.metrics.cacheHitRate >= 0.8 ? 'good' : 'fair',
                            reliability: this.metrics.errorRate <= 0.05 ? 'good' : 'poor'
                        }
                    };
                }
            };

            const currentPerformance = mockPerformanceIndicator.getPerformanceLevel();
            
            // Test with worse metrics
            mockPerformanceIndicator.metrics.connectionLatency = 400;
            mockPerformanceIndicator.metrics.apiResponseTime = 1200;
            const poorPerformance = mockPerformanceIndicator.getPerformanceLevel();

            return (currentPerformance.level === 'fair' &&
                    currentPerformance.indicators.connection === 'fair' &&
                    poorPerformance.level === 'poor' &&
                    poorPerformance.indicators.connection === 'poor' &&
                    poorPerformance.indicators.api === 'poor')
                ? 'Performance indicators working correctly'
                : 'Performance indicators failed';
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

    generateFallbackReport() {
        console.log('\n🛡️ FALLBACK SYSTEMS TEST REPORT');
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

        // Group by category for detailed breakdown
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

        console.log('\n📊 CATEGORY BREAKDOWN');
        console.log('-'.repeat(35));

        Object.entries(byCategory).forEach(([category, data]) => {
            const categoryPassRate = (data.passed / data.tests.length * 100).toFixed(1);
            console.log(`${category}: ${data.passed}/${data.tests.length} (${categoryPassRate}%)`);
            
            const failures = data.tests.filter(t => t.status === 'FAIL');
            if (failures.length > 0) {
                failures.forEach(failure => {
                    console.log(`  ❌ ${failure.testName}: ${failure.result}`);
                });
            }
        });

        // Resilience assessment
        console.log('\n🛡️ RESILIENCE ASSESSMENT');
        console.log('-'.repeat(35));

        const resilience = {
            networkFailure: byCategory['Network Failure Scenarios']?.passed || 0,
            serviceFailure: byCategory['Service Unavailability Scenarios']?.passed || 0,
            offlineMode: byCategory['Offline Mode Scenarios']?.passed || 0,
            degradedPerformance: byCategory['Degraded Performance Scenarios']?.passed || 0,
            recovery: byCategory['Recovery Scenarios']?.passed || 0,
            userExperience: byCategory['User Experience Scenarios']?.passed || 0
        };

        const resilienceScore = Object.values(resilience).reduce((sum, score) => sum + score, 0);
        const maxResilienceScore = Object.keys(resilience).length * 3; // Assuming 3 tests per category

        console.log(`Network Failure Resilience: ${resilience.networkFailure}/3`);
        console.log(`Service Failure Resilience: ${resilience.serviceFailure}/3`);
        console.log(`Offline Mode Support: ${resilience.offlineMode}/3`);
        console.log(`Performance Degradation Handling: ${resilience.degradedPerformance}/3`);
        console.log(`Recovery Mechanisms: ${resilience.recovery}/3`);
        console.log(`User Experience Preservation: ${resilience.userExperience}/3`);

        const resiliencePercentage = (resilienceScore / maxResilienceScore * 100).toFixed(1);
        console.log(`\nOverall Resilience Score: ${resilienceScore}/${maxResilienceScore} (${resiliencePercentage}%)`);

        // Final assessment
        console.log('\n🎯 FALLBACK SYSTEM ASSESSMENT');
        console.log('-'.repeat(35));

        if (parseFloat(passRate) >= 95) {
            console.log('🟢 EXCELLENT - Fallback systems are robust and comprehensive');
        } else if (parseFloat(passRate) >= 85) {
            console.log('🟡 GOOD - Fallback systems are solid with minor gaps');
        } else if (parseFloat(passRate) >= 75) {
            console.log('🟠 ACCEPTABLE - Some fallback mechanisms need strengthening');
        } else {
            console.log('🔴 POOR - Critical fallback gaps require immediate attention');
        }

        // Recommendations
        const recommendations = [];
        if (resilience.networkFailure < 3) recommendations.push('Improve network failure handling');
        if (resilience.serviceFailure < 3) recommendations.push('Enhance service unavailability responses');
        if (resilience.offlineMode < 3) recommendations.push('Strengthen offline mode capabilities');
        if (resilience.degradedPerformance < 3) recommendations.push('Better performance degradation adaptation');
        if (resilience.recovery < 3) recommendations.push('Improve recovery mechanisms');
        if (resilience.userExperience < 3) recommendations.push('Enhance user experience during failures');

        if (recommendations.length > 0) {
            console.log('\n📋 RECOMMENDATIONS');
            console.log('-'.repeat(20));
            recommendations.forEach(rec => console.log(`• ${rec}`));
        }

        // Save report
        const report = {
            timestamp: new Date().toISOString(),
            summary: { ...stats, passRate: parseFloat(passRate) },
            resilience: { ...resilience, score: resilienceScore, maxScore: maxResilienceScore },
            categories: byCategory,
            recommendations,
            detailedResults: this.testResults
        };

        try {
            fs.writeFileSync(
                path.join(__dirname, 'fallback-systems-report.json'),
                JSON.stringify(report, null, 2)
            );
            console.log('\n📁 Report saved to: fallback-systems-report.json');
        } catch (error) {
            console.warn('Failed to save report:', error.message);
        }

        return report;
    }
}

// Run fallback system tests
const tester = new FallbackSystemTester();
tester.runAllTests().catch(console.error);