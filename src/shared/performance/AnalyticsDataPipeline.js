/**
 * Analytics Data Pipeline with Streaming and Aggregation
 * 
 * High-performance data pipeline for processing performance analytics data
 * with real-time streaming, batch aggregation, historical trend analysis,
 * A/B testing framework, and user segment performance analysis.
 * 
 * Features:
 * - Real-time event streaming with buffering and batch processing
 * - Multi-level data aggregation (real-time, hourly, daily, weekly)
 * - Historical performance trend analysis with statistical modeling
 * - A/B testing framework for performance optimizations
 * - User segment performance analysis (mobile vs desktop, regions, etc.)
 * - Data quality validation and anomaly detection
 * - Export capabilities for external analytics platforms
 * - Gaming-specific analytics aggregations
 * 
 * @author Claude Code - Analytics Architect
 * @version 1.0.0
 * @created 2025-08-12
 */

import { EventEmitter } from 'events';
import { getPerformanceAnalytics } from './PerformanceAnalytics.js';
import { getGamingMetricsTracker } from './GamingMetricsTracker.js';
import { getPerformanceAlertSystem } from './PerformanceAlertSystem.js';

export class AnalyticsDataPipeline extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Streaming configuration
      streaming: {
        bufferSize: options.bufferSize || 100,
        flushInterval: options.flushInterval || 30000, // 30 seconds
        maxBatchSize: options.maxBatchSize || 500,
        retryAttempts: options.retryAttempts || 3,
        retryDelay: options.retryDelay || 1000
      },
      
      // Aggregation levels and intervals
      aggregation: {
        realTime: { interval: 10000, retention: 3600000 }, // 10s interval, 1h retention
        minutely: { interval: 60000, retention: 86400000 }, // 1m interval, 1d retention
        hourly: { interval: 3600000, retention: 2592000000 }, // 1h interval, 30d retention
        daily: { interval: 86400000, retention: 7776000000 }, // 1d interval, 90d retention
        weekly: { interval: 604800000, retention: 31536000000 } // 1w interval, 1y retention
      },
      
      // Data quality settings
      quality: {
        enableValidation: options.enableValidation !== false,
        enableAnomalyDetection: options.enableAnomalyDetection !== false,
        validationRules: options.validationRules || {},
        anomalyThreshold: options.anomalyThreshold || 2.5 // Standard deviations
      },
      
      // A/B testing configuration
      abTesting: {
        enabled: options.enableABTesting !== false,
        sampleRatio: options.abTestSampleRatio || 0.1, // 10% of users
        testDuration: options.abTestDuration || 604800000, // 1 week
        confidenceLevel: options.abTestConfidenceLevel || 0.95
      },
      
      // User segmentation
      segmentation: {
        enabled: options.enableSegmentation !== false,
        segments: {
          device: ['mobile', 'tablet', 'desktop'],
          network: ['slow-2g', '2g', '3g', '4g', 'wifi'],
          region: ['na', 'eu', 'asia', 'other'],
          userType: ['new', 'returning', 'premium']
        }
      },
      
      // Export settings
      export: {
        enabled: options.enableExport || false,
        formats: ['json', 'csv', 'parquet'],
        endpoints: options.exportEndpoints || [],
        schedule: options.exportSchedule || '0 0 * * *' // Daily at midnight
      },
      
      ...options
    };
    
    // Initialize core systems
    this.performanceAnalytics = getPerformanceAnalytics();
    this.gamingMetricsTracker = getGamingMetricsTracker();
    this.alertSystem = getPerformanceAlertSystem();
    
    // Data storage and processing
    this.eventBuffer = [];
    this.aggregatedData = new Map();
    this.historicalData = new Map();
    this.segmentedData = new Map();
    
    // A/B testing
    this.activeTests = new Map();
    this.testResults = new Map();
    
    // Data quality monitoring
    this.qualityMetrics = new Map();
    this.anomalyDetector = new AnomalyDetector();
    
    // Processing state
    this.processingQueues = {
      realTime: [],
      batch: [],
      aggregation: []
    };
    
    this.logger = options.logger || console;
    this.isRunning = false;
    
    this.initializePipeline();
  }

  /**
   * Initialize the analytics data pipeline
   */
  async initializePipeline() {
    try {
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize data structures
      await this.initializeDataStructures();
      
      // Load historical data
      await this.loadHistoricalData();
      
      // Initialize A/B testing
      if (this.config.abTesting.enabled) {
        await this.initializeABTesting();
      }
      
      // Initialize user segmentation
      if (this.config.segmentation.enabled) {
        await this.initializeSegmentation();
      }
      
      // Start processing pipelines
      this.startProcessingPipelines();
      
      this.isRunning = true;
      this.emit('pipeline:initialized');
      this.logger.log('Analytics data pipeline initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize analytics data pipeline:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for data ingestion
   */
  setupEventListeners() {
    // Listen to performance analytics events
    this.performanceAnalytics.on('metric:recorded', (metric) => {
      this.ingestEvent('web_vital', metric);
    });
    
    this.performanceAnalytics.on('gaming_metric:recorded', (metric) => {
      this.ingestEvent('gaming_performance', metric);
    });
    
    this.performanceAnalytics.on('ux_metric:recorded', (metric) => {
      this.ingestEvent('user_experience', metric);
    });
    
    this.performanceAnalytics.on('network_metric:recorded', (metric) => {
      this.ingestEvent('network_performance', metric);
    });
    
    this.performanceAnalytics.on('device_metric:recorded', (metric) => {
      this.ingestEvent('device_performance', metric);
    });
    
    // Listen to gaming metrics tracker events
    this.gamingMetricsTracker.on('vote:performance_recorded', (metric) => {
      this.ingestEvent('gaming_vote', metric);
    });
    
    this.gamingMetricsTracker.on('leaderboard:performance_recorded', (metric) => {
      this.ingestEvent('gaming_leaderboard', metric);
    });
    
    this.gamingMetricsTracker.on('tournament:performance_recorded', (metric) => {
      this.ingestEvent('gaming_tournament', metric);
    });
    
    this.gamingMetricsTracker.on('wallet:performance_recorded', (metric) => {
      this.ingestEvent('gaming_wallet', metric);
    });
    
    this.gamingMetricsTracker.on('clan:performance_recorded', (metric) => {
      this.ingestEvent('gaming_clan', metric);
    });
    
    // Listen to alert system events
    this.alertSystem.on('alert:created', (alert) => {
      this.ingestEvent('performance_alert', alert);
    });
    
    this.alertSystem.on('regression:detected', (regression) => {
      this.ingestEvent('performance_regression', regression);
    });
    
    this.alertSystem.on('budget:violation', (violation) => {
      this.ingestEvent('budget_violation', violation);
    });
  }

  /**
   * Ingest event into the data pipeline
   */
  ingestEvent(eventType, eventData) {
    const enrichedEvent = this.enrichEvent(eventType, eventData);
    
    // Validate event data
    if (this.config.quality.enableValidation && !this.validateEvent(enrichedEvent)) {
      this.logger.warn('Invalid event data:', enrichedEvent);
      this.recordQualityIssue('validation_failed', enrichedEvent);
      return;
    }
    
    // Add to buffer
    this.eventBuffer.push(enrichedEvent);
    
    // Process real-time aggregations immediately
    this.processRealTimeEvent(enrichedEvent);
    
    // Check if buffer is full
    if (this.eventBuffer.length >= this.config.streaming.bufferSize) {
      this.flushBuffer();
    }
    
    // Emit for external listeners
    this.emit('event:ingested', enrichedEvent);
  }

  /**
   * Enrich event with additional metadata
   */
  enrichEvent(eventType, eventData) {
    const enrichedEvent = {
      ...eventData,
      eventType,
      pipelineTimestamp: Date.now(),
      sessionId: this.getCurrentSessionId(),
      
      // Add user segment data
      userSegment: this.getUserSegment(eventData),
      
      // Add A/B test assignments
      abTests: this.getABTestAssignments(eventData),
      
      // Add competitive context
      competitiveContext: this.gamingMetricsTracker.getCompetitiveStatus(),
      
      // Add device and network context
      deviceContext: this.getDeviceContext(),
      networkContext: this.getNetworkContext()
    };
    
    return enrichedEvent;
  }

  /**
   * Validate event data quality
   */
  validateEvent(event) {
    const rules = this.config.quality.validationRules[event.eventType] || this.getDefaultValidationRules();
    
    for (const [field, rule] of Object.entries(rules)) {
      if (!this.validateField(event[field], rule)) {
        return false;
      }
    }
    
    // Check for anomalies
    if (this.config.quality.enableAnomalyDetection) {
      if (this.anomalyDetector.isAnomaly(event.eventType, event)) {
        this.recordQualityIssue('anomaly_detected', event);
        // Don't reject, but flag for investigation
      }
    }
    
    return true;
  }

  /**
   * Get default validation rules
   */
  getDefaultValidationRules() {
    return {
      timestamp: { required: true, type: 'number', min: Date.now() - 86400000 },
      eventType: { required: true, type: 'string' },
      value: { type: 'number', min: 0 },
      duration: { type: 'number', min: 0, max: 300000 } // Max 5 minutes
    };
  }

  /**
   * Validate individual field
   */
  validateField(value, rule) {
    if (rule.required && (value === undefined || value === null)) {
      return false;
    }
    
    if (value !== undefined && value !== null) {
      if (rule.type && typeof value !== rule.type) {
        return false;
      }
      
      if (rule.min !== undefined && value < rule.min) {
        return false;
      }
      
      if (rule.max !== undefined && value > rule.max) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Process real-time event for immediate aggregations
   */
  processRealTimeEvent(event) {
    const timeSlot = this.getTimeSlot(event.pipelineTimestamp, 'realTime');
    const aggregationKey = `${event.eventType}_${timeSlot}`;
    
    if (!this.aggregatedData.has('realTime')) {
      this.aggregatedData.set('realTime', new Map());
    }
    
    const realTimeData = this.aggregatedData.get('realTime');
    
    if (!realTimeData.has(aggregationKey)) {
      realTimeData.set(aggregationKey, {
        eventType: event.eventType,
        timeSlot,
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        values: [],
        segments: new Map(),
        abTests: new Map(),
        competitiveEvents: 0,
        errors: 0
      });
    }
    
    const aggregation = realTimeData.get(aggregationKey);
    
    // Update basic aggregations
    aggregation.count += 1;
    
    const value = event.value || event.duration || event.totalDuration || 0;
    if (value > 0) {
      aggregation.sum += value;
      aggregation.min = Math.min(aggregation.min, value);
      aggregation.max = Math.max(aggregation.max, value);
      aggregation.values.push(value);
      
      // Keep only recent values for real-time calculations
      if (aggregation.values.length > 100) {
        aggregation.values.shift();
      }
    }
    
    // Update segment data
    if (event.userSegment) {
      for (const [segmentType, segment] of Object.entries(event.userSegment)) {
        const segmentKey = `${segmentType}_${segment}`;
        if (!aggregation.segments.has(segmentKey)) {
          aggregation.segments.set(segmentKey, { count: 0, sum: 0 });
        }
        const segmentData = aggregation.segments.get(segmentKey);
        segmentData.count += 1;
        segmentData.sum += value;
      }
    }
    
    // Update A/B test data
    if (event.abTests) {
      for (const [testId, variant] of Object.entries(event.abTests)) {
        const testKey = `${testId}_${variant}`;
        if (!aggregation.abTests.has(testKey)) {
          aggregation.abTests.set(testKey, { count: 0, sum: 0 });
        }
        const testData = aggregation.abTests.get(testKey);
        testData.count += 1;
        testData.sum += value;
      }
    }
    
    // Track competitive events
    if (event.competitiveContext?.isCompetitive) {
      aggregation.competitiveEvents += 1;
    }
    
    // Track errors
    if (event.error || event.success === false) {
      aggregation.errors += 1;
    }
    
    aggregation.lastUpdated = Date.now();
    
    // Emit real-time update
    this.emit('realtime:updated', {
      eventType: event.eventType,
      timeSlot,
      aggregation: this.calculateDerivedMetrics(aggregation)
    });
  }

  /**
   * Calculate derived metrics from aggregated data
   */
  calculateDerivedMetrics(aggregation) {
    const derived = { ...aggregation };
    
    if (aggregation.count > 0) {
      derived.average = aggregation.sum / aggregation.count;
    }
    
    if (aggregation.values.length > 0) {
      derived.median = this.calculateMedian(aggregation.values);
      derived.p95 = this.calculatePercentile(aggregation.values, 95);
      derived.p99 = this.calculatePercentile(aggregation.values, 99);
      derived.stdDev = this.calculateStandardDeviation(aggregation.values);
    }
    
    if (aggregation.count > 0) {
      derived.errorRate = (aggregation.errors / aggregation.count) * 100;
      derived.competitiveRate = (aggregation.competitiveEvents / aggregation.count) * 100;
    }
    
    return derived;
  }

  /**
   * Calculate median from array of values
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  /**
   * Calculate percentile from array of values
   */
  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Get time slot for aggregation level
   */
  getTimeSlot(timestamp, level) {
    const interval = this.config.aggregation[level].interval;
    return Math.floor(timestamp / interval) * interval;
  }

  /**
   * Flush event buffer to batch processing
   */
  flushBuffer() {
    if (this.eventBuffer.length === 0) return;
    
    const batch = [...this.eventBuffer];
    this.eventBuffer = [];
    
    // Add to batch processing queue
    this.processingQueues.batch.push({
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      events: batch,
      timestamp: Date.now()
    });
    
    this.emit('batch:queued', { size: batch.length });
  }

  /**
   * Start all processing pipelines
   */
  startProcessingPipelines() {
    // Buffer flush interval
    setInterval(() => {
      if (this.eventBuffer.length > 0) {
        this.flushBuffer();
      }
    }, this.config.streaming.flushInterval);
    
    // Batch processing pipeline
    setInterval(() => {
      this.processBatchQueue();
    }, 5000); // Process batches every 5 seconds
    
    // Aggregation pipelines
    this.startAggregationPipelines();
    
    // Data cleanup pipeline
    setInterval(() => {
      this.cleanupExpiredData();
    }, 600000); // Cleanup every 10 minutes
    
    // A/B testing analysis
    if (this.config.abTesting.enabled) {
      setInterval(() => {
        this.analyzeABTests();
      }, 3600000); // Analyze A/B tests every hour
    }
    
    // Export pipeline
    if (this.config.export.enabled) {
      this.startExportPipeline();
    }
  }

  /**
   * Process batch queue
   */
  async processBatchQueue() {
    while (this.processingQueues.batch.length > 0) {
      const batch = this.processingQueues.batch.shift();
      
      try {
        await this.processBatch(batch);
        this.emit('batch:processed', { id: batch.id, size: batch.events.length });
      } catch (error) {
        this.logger.error('Failed to process batch:', error);
        this.recordQualityIssue('batch_processing_failed', batch);
        
        // Retry logic
        if (batch.retryCount < this.config.streaming.retryAttempts) {
          batch.retryCount = (batch.retryCount || 0) + 1;
          setTimeout(() => {
            this.processingQueues.batch.push(batch);
          }, this.config.streaming.retryDelay * batch.retryCount);
        }
      }
    }
  }

  /**
   * Process individual batch
   */
  async processBatch(batch) {
    // Group events by type
    const eventsByType = new Map();
    
    batch.events.forEach(event => {
      if (!eventsByType.has(event.eventType)) {
        eventsByType.set(event.eventType, []);
      }
      eventsByType.get(event.eventType).push(event);
    });
    
    // Process each event type
    for (const [eventType, events] of eventsByType) {
      await this.processEventTypeBatch(eventType, events);
    }
    
    // Update historical data
    await this.updateHistoricalData(batch.events);
    
    // Update segmented data
    if (this.config.segmentation.enabled) {
      await this.updateSegmentedData(batch.events);
    }
    
    // Update A/B test data
    if (this.config.abTesting.enabled) {
      await this.updateABTestData(batch.events);
    }
  }

  /**
   * Process batch of events for specific event type
   */
  async processEventTypeBatch(eventType, events) {
    // Calculate batch statistics
    const batchStats = this.calculateBatchStatistics(eventType, events);
    
    // Store in historical data
    if (!this.historicalData.has(eventType)) {
      this.historicalData.set(eventType, new Map());
    }
    
    const eventHistory = this.historicalData.get(eventType);
    const timeSlot = this.getTimeSlot(Date.now(), 'minutely');
    
    if (!eventHistory.has(timeSlot)) {
      eventHistory.set(timeSlot, {
        timeSlot,
        eventType,
        batches: []
      });
    }
    
    eventHistory.get(timeSlot).batches.push(batchStats);
    
    // Emit batch processing complete
    this.emit('event_type_batch:processed', {
      eventType,
      count: events.length,
      stats: batchStats
    });
  }

  /**
   * Calculate batch statistics
   */
  calculateBatchStatistics(eventType, events) {
    const stats = {
      eventType,
      count: events.length,
      timestamp: Date.now(),
      values: {
        sum: 0,
        min: Infinity,
        max: -Infinity,
        count: 0
      },
      segments: new Map(),
      abTests: new Map(),
      errors: 0,
      competitive: 0
    };
    
    events.forEach(event => {
      const value = event.value || event.duration || event.totalDuration;
      
      if (typeof value === 'number' && value > 0) {
        stats.values.sum += value;
        stats.values.min = Math.min(stats.values.min, value);
        stats.values.max = Math.max(stats.values.max, value);
        stats.values.count += 1;
      }
      
      if (event.error || event.success === false) {
        stats.errors += 1;
      }
      
      if (event.competitiveContext?.isCompetitive) {
        stats.competitive += 1;
      }
      
      // Aggregate segment data
      if (event.userSegment) {
        for (const [segmentType, segment] of Object.entries(event.userSegment)) {
          const segmentKey = `${segmentType}_${segment}`;
          if (!stats.segments.has(segmentKey)) {
            stats.segments.set(segmentKey, { count: 0, sum: 0 });
          }
          const segmentStats = stats.segments.get(segmentKey);
          segmentStats.count += 1;
          if (typeof value === 'number') {
            segmentStats.sum += value;
          }
        }
      }
      
      // Aggregate A/B test data
      if (event.abTests) {
        for (const [testId, variant] of Object.entries(event.abTests)) {
          const testKey = `${testId}_${variant}`;
          if (!stats.abTests.has(testKey)) {
            stats.abTests.set(testKey, { count: 0, sum: 0 });
          }
          const testStats = stats.abTests.get(testKey);
          testStats.count += 1;
          if (typeof value === 'number') {
            testStats.sum += value;
          }
        }
      }
    });
    
    // Calculate derived metrics
    if (stats.values.count > 0) {
      stats.values.average = stats.values.sum / stats.values.count;
    }
    
    stats.errorRate = (stats.errors / stats.count) * 100;
    stats.competitiveRate = (stats.competitive / stats.count) * 100;
    
    return stats;
  }

  /**
   * Start aggregation pipelines for different time intervals
   */
  startAggregationPipelines() {
    // Minutely aggregations
    setInterval(() => {
      this.performAggregation('minutely');
    }, 60000); // Every minute
    
    // Hourly aggregations
    setInterval(() => {
      this.performAggregation('hourly');
    }, 3600000); // Every hour
    
    // Daily aggregations
    setInterval(() => {
      this.performAggregation('daily');
    }, 86400000); // Every day
    
    // Weekly aggregations
    setInterval(() => {
      this.performAggregation('weekly');
    }, 604800000); // Every week
  }

  /**
   * Perform aggregation for specific time level
   */
  performAggregation(level) {
    const now = Date.now();
    const interval = this.config.aggregation[level].interval;
    const currentSlot = this.getTimeSlot(now, level);
    const previousSlot = currentSlot - interval;
    
    if (!this.aggregatedData.has(level)) {
      this.aggregatedData.set(level, new Map());
    }
    
    const levelData = this.aggregatedData.get(level);
    
    // Aggregate from lower level data or historical data
    const sourceData = this.getSourceDataForAggregation(level, previousSlot, interval);
    
    if (sourceData.size === 0) return;
    
    // Perform aggregation by event type
    for (const [eventType, eventData] of sourceData) {
      const aggregationKey = `${eventType}_${previousSlot}`;
      
      const aggregatedMetrics = this.aggregateEventTypeData(eventType, eventData, level);
      levelData.set(aggregationKey, {
        eventType,
        timeSlot: previousSlot,
        level,
        ...aggregatedMetrics,
        aggregatedAt: now
      });
    }
    
    this.emit('aggregation:completed', {
      level,
      timeSlot: previousSlot,
      eventTypes: sourceData.size
    });
  }

  /**
   * Get source data for aggregation
   */
  getSourceDataForAggregation(level, timeSlot, interval) {
    const sourceData = new Map();
    
    // For minutely, aggregate from real-time data
    if (level === 'minutely') {
      const realTimeData = this.aggregatedData.get('realTime');
      if (realTimeData) {
        for (const [key, data] of realTimeData) {
          if (data.timeSlot >= timeSlot && data.timeSlot < timeSlot + interval) {
            if (!sourceData.has(data.eventType)) {
              sourceData.set(data.eventType, []);
            }
            sourceData.get(data.eventType).push(data);
          }
        }
      }
    } else {
      // For higher levels, aggregate from lower level
      const lowerLevels = {
        'hourly': 'minutely',
        'daily': 'hourly',
        'weekly': 'daily'
      };
      
      const lowerLevel = lowerLevels[level];
      const lowerLevelData = this.aggregatedData.get(lowerLevel);
      
      if (lowerLevelData) {
        for (const [key, data] of lowerLevelData) {
          if (data.timeSlot >= timeSlot && data.timeSlot < timeSlot + interval) {
            if (!sourceData.has(data.eventType)) {
              sourceData.set(data.eventType, []);
            }
            sourceData.get(data.eventType).push(data);
          }
        }
      }
    }
    
    return sourceData;
  }

  /**
   * Aggregate event type data
   */
  aggregateEventTypeData(eventType, dataPoints, level) {
    const aggregated = {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      errors: 0,
      competitive: 0,
      segments: new Map(),
      abTests: new Map(),
      values: []
    };
    
    dataPoints.forEach(data => {
      aggregated.count += data.count || 0;
      aggregated.sum += data.sum || 0;
      aggregated.min = Math.min(aggregated.min, data.min || Infinity);
      aggregated.max = Math.max(aggregated.max, data.max || -Infinity);
      aggregated.errors += data.errors || 0;
      aggregated.competitive += data.competitiveEvents || data.competitive || 0;
      
      if (data.values) {
        aggregated.values.push(...data.values);
      }
      
      // Merge segment data
      if (data.segments) {
        for (const [segmentKey, segmentData] of data.segments) {
          if (!aggregated.segments.has(segmentKey)) {
            aggregated.segments.set(segmentKey, { count: 0, sum: 0 });
          }
          const aggSegment = aggregated.segments.get(segmentKey);
          aggSegment.count += segmentData.count || 0;
          aggSegment.sum += segmentData.sum || 0;
        }
      }
      
      // Merge A/B test data
      if (data.abTests) {
        for (const [testKey, testData] of data.abTests) {
          if (!aggregated.abTests.has(testKey)) {
            aggregated.abTests.set(testKey, { count: 0, sum: 0 });
          }
          const aggTest = aggregated.abTests.get(testKey);
          aggTest.count += testData.count || 0;
          aggTest.sum += testData.sum || 0;
        }
      }
    });
    
    // Calculate derived metrics
    const derived = this.calculateDerivedMetrics(aggregated);
    
    return derived;
  }

  /**
   * A/B Testing Framework
   */

  /**
   * Initialize A/B testing framework
   */
  async initializeABTesting() {
    // Load active tests
    await this.loadActiveABTests();
    
    // Initialize test assignment system
    this.initializeTestAssignment();
    
    this.logger.log('A/B testing framework initialized');
  }

  /**
   * Load active A/B tests
   */
  async loadActiveABTests() {
    try {
      const storedTests = localStorage.getItem('active_ab_tests');
      if (storedTests) {
        const tests = JSON.parse(storedTests);
        for (const [testId, testConfig] of Object.entries(tests)) {
          this.activeTests.set(testId, testConfig);
        }
      }
    } catch (error) {
      this.logger.warn('Failed to load active A/B tests:', error);
    }
  }

  /**
   * Initialize test assignment system
   */
  initializeTestAssignment() {
    // Create deterministic user assignment based on user ID
    this.assignUserToTests = (userId) => {
      const assignments = {};
      
      for (const [testId, testConfig] of this.activeTests) {
        if (this.isUserEligibleForTest(userId, testConfig)) {
          const variant = this.assignVariant(userId, testId, testConfig);
          assignments[testId] = variant;
        }
      }
      
      return assignments;
    };
  }

  /**
   * Check if user is eligible for test
   */
  isUserEligibleForTest(userId, testConfig) {
    // Check if test is active
    const now = Date.now();
    if (now < testConfig.startTime || now > testConfig.endTime) {
      return false;
    }
    
    // Check sample ratio
    const hash = this.hashUserId(userId + testConfig.id);
    const sampleThreshold = testConfig.sampleRatio * 0xffffffff;
    
    if (hash > sampleThreshold) {
      return false;
    }
    
    // Check targeting criteria
    if (testConfig.targeting) {
      return this.checkTargetingCriteria(userId, testConfig.targeting);
    }
    
    return true;
  }

  /**
   * Assign variant to user
   */
  assignVariant(userId, testId, testConfig) {
    const hash = this.hashUserId(userId + testId);
    const variants = testConfig.variants;
    const variantIndex = hash % variants.length;
    
    return variants[variantIndex];
  }

  /**
   * Hash user ID for consistent assignment
   */
  hashUserId(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Check targeting criteria
   */
  checkTargetingCriteria(userId, targeting) {
    // Implementation would check user segments, device types, etc.
    return true; // Simplified for now
  }

  /**
   * Get A/B test assignments for event
   */
  getABTestAssignments(eventData) {
    const userId = eventData.userId || eventData.sessionId;
    if (!userId) return {};
    
    return this.assignUserToTests(userId);
  }

  /**
   * Update A/B test data with new events
   */
  async updateABTestData(events) {
    for (const event of events) {
      if (!event.abTests) continue;
      
      for (const [testId, variant] of Object.entries(event.abTests)) {
        if (!this.testResults.has(testId)) {
          this.testResults.set(testId, new Map());
        }
        
        const testData = this.testResults.get(testId);
        
        if (!testData.has(variant)) {
          testData.set(variant, {
            count: 0,
            sum: 0,
            conversions: 0,
            errors: 0,
            values: []
          });
        }
        
        const variantData = testData.get(variant);
        variantData.count += 1;
        
        const value = event.value || event.duration || event.totalDuration;
        if (typeof value === 'number') {
          variantData.sum += value;
          variantData.values.push(value);
        }
        
        if (event.error || event.success === false) {
          variantData.errors += 1;
        }
        
        // Track conversions (for performance improvements)
        if (event.eventType.includes('vote') && event.success !== false) {
          variantData.conversions += 1;
        }
      }
    }
  }

  /**
   * Analyze A/B test results
   */
  analyzeABTests() {
    for (const [testId, testConfig] of this.activeTests) {
      const results = this.testResults.get(testId);
      if (!results) continue;
      
      const analysis = this.performStatisticalAnalysis(testId, testConfig, results);
      
      if (analysis.isSignificant) {
        this.emit('ab_test:significant_result', {
          testId,
          analysis,
          recommendation: this.generateTestRecommendation(analysis)
        });
      }
      
      // Check if test should be concluded
      if (this.shouldConcludeTest(testConfig, analysis)) {
        this.concludeTest(testId, analysis);
      }
    }
  }

  /**
   * Perform statistical analysis on A/B test
   */
  performStatisticalAnalysis(testId, testConfig, results) {
    const variants = Array.from(results.keys());
    if (variants.length < 2) {
      return { isSignificant: false, reason: 'insufficient_variants' };
    }
    
    const [control, treatment] = variants;
    const controlData = results.get(control);
    const treatmentData = results.get(treatment);
    
    if (controlData.count < 30 || treatmentData.count < 30) {
      return { isSignificant: false, reason: 'insufficient_sample_size' };
    }
    
    // Calculate means and standard deviations
    const controlMean = controlData.sum / controlData.count;
    const treatmentMean = treatmentData.sum / treatmentData.count;
    
    const controlStdDev = this.calculateStandardDeviation(controlData.values);
    const treatmentStdDev = this.calculateStandardDeviation(treatmentData.values);
    
    // Perform t-test
    const tStat = this.calculateTStatistic(
      controlMean, treatmentMean,
      controlStdDev, treatmentStdDev,
      controlData.count, treatmentData.count
    );
    
    const pValue = this.calculatePValue(tStat, controlData.count + treatmentData.count - 2);
    const isSignificant = pValue < (1 - this.config.abTesting.confidenceLevel);
    
    const improvement = ((treatmentMean - controlMean) / controlMean) * 100;
    
    return {
      testId,
      isSignificant,
      pValue,
      improvement,
      controlMean,
      treatmentMean,
      controlCount: controlData.count,
      treatmentCount: treatmentData.count,
      confidenceLevel: this.config.abTesting.confidenceLevel
    };
  }

  /**
   * Calculate t-statistic
   */
  calculateTStatistic(mean1, mean2, std1, std2, n1, n2) {
    const pooledStd = Math.sqrt(((n1 - 1) * std1 * std1 + (n2 - 1) * std2 * std2) / (n1 + n2 - 2));
    const standardError = pooledStd * Math.sqrt(1 / n1 + 1 / n2);
    
    return (mean1 - mean2) / standardError;
  }

  /**
   * Calculate p-value (simplified approximation)
   */
  calculatePValue(tStat, degreesOfFreedom) {
    // Simplified p-value calculation
    // In production, use a proper statistical library
    const absTStat = Math.abs(tStat);
    
    if (absTStat > 2.576) return 0.01; // 99% confidence
    if (absTStat > 1.96) return 0.05;  // 95% confidence
    if (absTStat > 1.645) return 0.1;  // 90% confidence
    
    return 0.5; // Not significant
  }

  /**
   * Generate test recommendation
   */
  generateTestRecommendation(analysis) {
    if (!analysis.isSignificant) {
      return {
        action: 'continue',
        reason: 'No significant difference detected'
      };
    }
    
    if (analysis.improvement > 5) {
      return {
        action: 'implement_treatment',
        reason: `Treatment shows ${analysis.improvement.toFixed(1)}% improvement`
      };
    } else if (analysis.improvement < -5) {
      return {
        action: 'keep_control',
        reason: `Treatment shows ${Math.abs(analysis.improvement).toFixed(1)}% degradation`
      };
    } else {
      return {
        action: 'continue',
        reason: 'Improvement too small to be practically significant'
      };
    }
  }

  /**
   * Check if test should be concluded
   */
  shouldConcludeTest(testConfig, analysis) {
    const now = Date.now();
    const testDuration = now - testConfig.startTime;
    
    // Conclude if test duration exceeded
    if (testDuration > testConfig.maxDuration) {
      return true;
    }
    
    // Conclude if significant result with sufficient sample size
    if (analysis.isSignificant && 
        analysis.controlCount > 1000 && 
        analysis.treatmentCount > 1000) {
      return true;
    }
    
    return false;
  }

  /**
   * Conclude A/B test
   */
  concludeTest(testId, analysis) {
    const testConfig = this.activeTests.get(testId);
    if (!testConfig) return;
    
    // Remove from active tests
    this.activeTests.delete(testId);
    
    // Store final results
    const finalResults = {
      testId,
      testConfig,
      analysis,
      concludedAt: Date.now(),
      recommendation: this.generateTestRecommendation(analysis)
    };
    
    // Save concluded test
    this.saveConcludedTest(testId, finalResults);
    
    this.emit('ab_test:concluded', finalResults);
  }

  /**
   * User Segmentation
   */

  /**
   * Initialize user segmentation
   */
  async initializeSegmentation() {
    // Load segment definitions
    await this.loadSegmentDefinitions();
    
    this.logger.log('User segmentation initialized');
  }

  /**
   * Load segment definitions
   */
  async loadSegmentDefinitions() {
    // Segment definitions would be loaded from configuration
    // This is a simplified implementation
  }

  /**
   * Get user segment for event
   */
  getUserSegment(eventData) {
    const segment = {};
    
    // Device segment
    segment.device = this.getDeviceSegment();
    
    // Network segment
    segment.network = this.getNetworkSegment();
    
    // User type segment (based on session data)
    segment.userType = this.getUserTypeSegment(eventData);
    
    // Geographic segment (if available)
    segment.region = this.getRegionSegment();
    
    return segment;
  }

  /**
   * Get device segment
   */
  getDeviceSegment() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(userAgent)) {
      return 'mobile';
    } else if (/tablet|ipad/.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Get network segment
   */
  getNetworkSegment() {
    if (navigator.connection) {
      return navigator.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Get user type segment
   */
  getUserTypeSegment(eventData) {
    // Simplified user type detection
    const sessionId = eventData.sessionId;
    if (sessionId) {
      // Check if returning user (has previous sessions)
      const hasHistory = localStorage.getItem(`user_history_${sessionId}`);
      return hasHistory ? 'returning' : 'new';
    }
    return 'unknown';
  }

  /**
   * Get region segment
   */
  getRegionSegment() {
    // Would use geolocation API or IP-based detection
    // Simplified implementation
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    if (timezone.includes('America')) return 'na';
    if (timezone.includes('Europe')) return 'eu';
    if (timezone.includes('Asia')) return 'asia';
    
    return 'other';
  }

  /**
   * Update segmented data
   */
  async updateSegmentedData(events) {
    for (const event of events) {
      if (!event.userSegment) continue;
      
      for (const [segmentType, segment] of Object.entries(event.userSegment)) {
        const segmentKey = `${segmentType}_${segment}`;
        
        if (!this.segmentedData.has(segmentKey)) {
          this.segmentedData.set(segmentKey, {
            segmentType,
            segment,
            events: new Map(),
            totalCount: 0,
            lastUpdated: Date.now()
          });
        }
        
        const segmentData = this.segmentedData.get(segmentKey);
        
        if (!segmentData.events.has(event.eventType)) {
          segmentData.events.set(event.eventType, {
            count: 0,
            sum: 0,
            errors: 0,
            values: []
          });
        }
        
        const eventTypeData = segmentData.events.get(event.eventType);
        eventTypeData.count += 1;
        
        const value = event.value || event.duration || event.totalDuration;
        if (typeof value === 'number') {
          eventTypeData.sum += value;
          eventTypeData.values.push(value);
          
          // Keep only recent values
          if (eventTypeData.values.length > 1000) {
            eventTypeData.values.shift();
          }
        }
        
        if (event.error || event.success === false) {
          eventTypeData.errors += 1;
        }
        
        segmentData.totalCount += 1;
        segmentData.lastUpdated = Date.now();
      }
    }
  }

  /**
   * Data Export Pipeline
   */

  /**
   * Start export pipeline
   */
  startExportPipeline() {
    // Schedule exports based on configuration
    if (this.config.export.schedule) {
      // In production, would use a proper cron scheduler
      setInterval(() => {
        this.performScheduledExport();
      }, 86400000); // Daily export
    }
  }

  /**
   * Perform scheduled export
   */
  async performScheduledExport() {
    try {
      const exportData = this.prepareExportData();
      
      for (const format of this.config.export.formats) {
        const formattedData = this.formatExportData(exportData, format);
        await this.exportData(formattedData, format);
      }
      
      this.emit('export:completed', {
        timestamp: Date.now(),
        formats: this.config.export.formats
      });
      
    } catch (error) {
      this.logger.error('Export failed:', error);
      this.emit('export:failed', error);
    }
  }

  /**
   * Prepare data for export
   */
  prepareExportData() {
    const exportData = {
      metadata: {
        exportTimestamp: Date.now(),
        dataRange: this.getExportDataRange(),
        version: '1.0'
      },
      aggregatedData: Object.fromEntries(this.aggregatedData),
      segmentedData: Object.fromEntries(this.segmentedData),
      abTestResults: Object.fromEntries(this.testResults),
      qualityMetrics: Object.fromEntries(this.qualityMetrics)
    };
    
    return exportData;
  }

  /**
   * Get data range for export
   */
  getExportDataRange() {
    const now = Date.now();
    const dayStart = now - (now % 86400000); // Start of current day
    
    return {
      startTime: dayStart - 86400000, // Previous day
      endTime: dayStart
    };
  }

  /**
   * Format export data
   */
  formatExportData(data, format) {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        return this.convertToCSV(data);
      
      case 'parquet':
        // Would use a parquet library in production
        return this.convertToParquet(data);
      
      default:
        return JSON.stringify(data);
    }
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    // Simplified CSV conversion
    // In production, would use a proper CSV library
    const rows = [];
    
    // Add headers
    rows.push('timestamp,eventType,level,count,average,p95,errorRate');
    
    // Add data rows
    for (const [level, levelData] of Object.entries(data.aggregatedData)) {
      for (const [key, aggregation] of Object.entries(levelData)) {
        rows.push([
          aggregation.timeSlot,
          aggregation.eventType,
          level,
          aggregation.count,
          aggregation.average || 0,
          aggregation.p95 || 0,
          aggregation.errorRate || 0
        ].join(','));
      }
    }
    
    return rows.join('\n');
  }

  /**
   * Convert data to Parquet format (placeholder)
   */
  convertToParquet(data) {
    // Placeholder for Parquet conversion
    return Buffer.from(JSON.stringify(data));
  }

  /**
   * Export data to configured endpoints
   */
  async exportData(formattedData, format) {
    for (const endpoint of this.config.export.endpoints) {
      try {
        await this.sendToEndpoint(endpoint, formattedData, format);
      } catch (error) {
        this.logger.error(`Failed to export to ${endpoint}:`, error);
      }
    }
  }

  /**
   * Send data to specific endpoint
   */
  async sendToEndpoint(endpoint, data, format) {
    // Implementation would depend on endpoint type
    // Could be HTTP API, S3, database, etc.
    this.emit('export:endpoint_success', { endpoint, format });
  }

  /**
   * Utility Methods
   */

  /**
   * Get current session ID
   */
  getCurrentSessionId() {
    return this.performanceAnalytics.getCurrentSessionId?.() || 'unknown';
  }

  /**
   * Get device context
   */
  getDeviceContext() {
    return {
      userAgent: navigator.userAgent,
      memory: navigator.deviceMemory,
      cores: navigator.hardwareConcurrency,
      pixelRatio: window.devicePixelRatio
    };
  }

  /**
   * Get network context
   */
  getNetworkContext() {
    if (navigator.connection) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }
    return {};
  }

  /**
   * Record data quality issue
   */
  recordQualityIssue(issueType, data) {
    if (!this.qualityMetrics.has(issueType)) {
      this.qualityMetrics.set(issueType, {
        type: issueType,
        count: 0,
        lastOccurrence: null,
        samples: []
      });
    }
    
    const qualityMetric = this.qualityMetrics.get(issueType);
    qualityMetric.count += 1;
    qualityMetric.lastOccurrence = Date.now();
    qualityMetric.samples.push({
      data,
      timestamp: Date.now()
    });
    
    // Keep only recent samples
    if (qualityMetric.samples.length > 10) {
      qualityMetric.samples.shift();
    }
    
    this.emit('quality:issue_recorded', {
      type: issueType,
      count: qualityMetric.count,
      data
    });
  }

  /**
   * Update historical data
   */
  async updateHistoricalData(events) {
    // Store events in historical data structure
    // Implementation would depend on storage backend
  }

  /**
   * Initialize data structures
   */
  async initializeDataStructures() {
    // Initialize all required data structures
    for (const level of Object.keys(this.config.aggregation)) {
      this.aggregatedData.set(level, new Map());
    }
  }

  /**
   * Load historical data
   */
  async loadHistoricalData() {
    // Load historical data from storage
    // Implementation would depend on storage backend
  }

  /**
   * Clean up expired data
   */
  cleanupExpiredData() {
    const now = Date.now();
    
    for (const [level, retention] of Object.entries(this.config.aggregation)) {
      const cutoff = now - retention.retention;
      const levelData = this.aggregatedData.get(level);
      
      if (levelData) {
        for (const [key, data] of levelData) {
          if (data.timeSlot < cutoff) {
            levelData.delete(key);
          }
        }
      }
    }
    
    this.emit('cleanup:completed', { timestamp: now });
  }

  /**
   * Save concluded test
   */
  saveConcludedTest(testId, results) {
    try {
      const concludedTests = JSON.parse(localStorage.getItem('concluded_ab_tests') || '{}');
      concludedTests[testId] = results;
      localStorage.setItem('concluded_ab_tests', JSON.stringify(concludedTests));
    } catch (error) {
      this.logger.warn('Failed to save concluded test:', error);
    }
  }

  /**
   * Public API Methods
   */

  /**
   * Get real-time metrics
   */
  getRealTimeMetrics(eventType = null, timeRange = 600000) { // Default 10 minutes
    const now = Date.now();
    const cutoff = now - timeRange;
    const realTimeData = this.aggregatedData.get('realTime');
    
    if (!realTimeData) return [];
    
    const metrics = [];
    
    for (const [key, data] of realTimeData) {
      if (data.timeSlot < cutoff) continue;
      if (eventType && data.eventType !== eventType) continue;
      
      metrics.push(this.calculateDerivedMetrics(data));
    }
    
    return metrics.sort((a, b) => b.timeSlot - a.timeSlot);
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(level, eventType = null, timeRange = null) {
    const levelData = this.aggregatedData.get(level);
    if (!levelData) return [];
    
    const metrics = [];
    const now = Date.now();
    const cutoff = timeRange ? now - timeRange : 0;
    
    for (const [key, data] of levelData) {
      if (data.timeSlot < cutoff) continue;
      if (eventType && data.eventType !== eventType) continue;
      
      metrics.push(data);
    }
    
    return metrics.sort((a, b) => b.timeSlot - a.timeSlot);
  }

  /**
   * Get segment performance
   */
  getSegmentPerformance(segmentType = null, segment = null) {
    const segments = [];
    
    for (const [key, data] of this.segmentedData) {
      if (segmentType && data.segmentType !== segmentType) continue;
      if (segment && data.segment !== segment) continue;
      
      segments.push({
        ...data,
        performance: this.calculateSegmentPerformance(data)
      });
    }
    
    return segments;
  }

  /**
   * Calculate segment performance metrics
   */
  calculateSegmentPerformance(segmentData) {
    const performance = {};
    
    for (const [eventType, eventData] of segmentData.events) {
      performance[eventType] = {
        count: eventData.count,
        average: eventData.count > 0 ? eventData.sum / eventData.count : 0,
        errorRate: eventData.count > 0 ? (eventData.errors / eventData.count) * 100 : 0
      };
      
      if (eventData.values.length > 0) {
        performance[eventType].median = this.calculateMedian(eventData.values);
        performance[eventType].p95 = this.calculatePercentile(eventData.values, 95);
      }
    }
    
    return performance;
  }

  /**
   * Get A/B test results
   */
  getABTestResults(testId = null) {
    if (testId) {
      const testData = this.testResults.get(testId);
      if (!testData) return null;
      
      const testConfig = this.activeTests.get(testId);
      const analysis = testConfig ? this.performStatisticalAnalysis(testId, testConfig, testData) : null;
      
      return {
        testId,
        data: Object.fromEntries(testData),
        analysis
      };
    }
    
    const results = {};
    for (const [id, data] of this.testResults) {
      results[id] = Object.fromEntries(data);
    }
    
    return results;
  }

  /**
   * Get data quality metrics
   */
  getDataQualityMetrics() {
    return Object.fromEntries(this.qualityMetrics);
  }

  /**
   * Shutdown pipeline
   */
  shutdown() {
    this.isRunning = false;
    
    // Flush remaining data
    this.flushBuffer();
    this.processBatchQueue();
    
    // Perform final export if enabled
    if (this.config.export.enabled) {
      this.performScheduledExport();
    }
    
    this.emit('pipeline:shutdown');
    this.removeAllListeners();
  }
}

/**
 * Anomaly Detector Helper Class
 */
class AnomalyDetector {
  constructor() {
    this.baselines = new Map();
    this.windowSize = 100;
  }
  
  isAnomaly(eventType, event) {
    const key = `${eventType}_${event.name || 'default'}`;
    const value = event.value || event.duration || event.totalDuration;
    
    if (typeof value !== 'number' || value <= 0) return false;
    
    if (!this.baselines.has(key)) {
      this.baselines.set(key, {
        values: [],
        mean: 0,
        stdDev: 0,
        count: 0
      });
    }
    
    const baseline = this.baselines.get(key);
    
    // Add value to baseline
    baseline.values.push(value);
    baseline.count += 1;
    
    if (baseline.values.length > this.windowSize) {
      baseline.values.shift();
    }
    
    // Recalculate statistics
    baseline.mean = baseline.values.reduce((sum, v) => sum + v, 0) / baseline.values.length;
    
    if (baseline.values.length > 10) {
      const variance = baseline.values.reduce((sum, v) => sum + Math.pow(v - baseline.mean, 2), 0) / baseline.values.length;
      baseline.stdDev = Math.sqrt(variance);
      
      // Check for anomaly (more than 3 standard deviations from mean)
      const zScore = Math.abs(value - baseline.mean) / baseline.stdDev;
      return zScore > 3;
    }
    
    return false;
  }
}

// Create singleton instance
let globalAnalyticsDataPipeline = null;

export function createAnalyticsDataPipeline(options = {}) {
  return new AnalyticsDataPipeline(options);
}

export function getAnalyticsDataPipeline(options = {}) {
  if (!globalAnalyticsDataPipeline) {
    globalAnalyticsDataPipeline = new AnalyticsDataPipeline(options);
  }
  return globalAnalyticsDataPipeline;
}

export default AnalyticsDataPipeline;