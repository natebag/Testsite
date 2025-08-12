/**
 * Performance Insights and Optimization Recommendations Engine
 * 
 * Advanced analytics engine that analyzes performance data to provide
 * actionable insights, optimization recommendations, bottleneck identification,
 * and automated performance improvement suggestions for gaming scenarios.
 * 
 * Features:
 * - Performance bottleneck identification with root cause analysis
 * - Optimization opportunity detection using machine learning patterns
 * - Resource usage optimization suggestions with impact estimation
 * - Gaming workflow performance analysis and recommendations
 * - Automated performance optimization triggers
 * - Competitive gaming performance optimization
 * - User experience impact correlation analysis
 * - Performance prediction and proactive recommendations
 * 
 * @author Claude Code - Analytics Architect
 * @version 1.0.0
 * @created 2025-08-12
 */

import { EventEmitter } from 'events';
import { getPerformanceAnalytics } from './PerformanceAnalytics.js';
import { getGamingMetricsTracker } from './GamingMetricsTracker.js';
import { getPerformanceAlertSystem } from './PerformanceAlertSystem.js';
import { getAnalyticsDataPipeline } from './AnalyticsDataPipeline.js';

export class PerformanceInsightsEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Analysis configuration
      analysis: {
        insightGenerationInterval: options.insightGenerationInterval || 300000, // 5 minutes
        recommendationRefreshInterval: options.recommendationRefreshInterval || 900000, // 15 minutes
        bottleneckDetectionThreshold: options.bottleneckDetectionThreshold || 0.8, // 80th percentile
        performanceTrendAnalysisWindow: options.performanceTrendAnalysisWindow || 86400000, // 24 hours
        minimumDataPoints: options.minimumDataPoints || 50
      },
      
      // Insight thresholds and weights
      thresholds: {
        criticalBottleneck: 5000, // 5 seconds
        significantBottleneck: 2000, // 2 seconds
        minorBottleneck: 1000, // 1 second
        resourceUsageHigh: 0.8, // 80%
        resourceUsageMedium: 0.6, // 60%
        errorRateHigh: 0.05, // 5%
        errorRateMedium: 0.02 // 2%
      },
      
      // Gaming-specific analysis
      gaming: {
        competitivePerformanceWeight: 2.0, // Higher weight for competitive scenarios
        voteLatencyWeight: 1.5, // Critical for voting operations
        leaderboardWeight: 1.2, // Important for engagement
        tournamentWeight: 1.8, // Critical during tournaments
        walletWeight: 1.3 // Important for transactions
      },
      
      // Recommendation scoring
      scoring: {
        impactWeight: 0.4, // 40% weight
        difficultyWeight: 0.2, // 20% weight
        confidenceWeight: 0.3, // 30% weight
        urgencyWeight: 0.1 // 10% weight
      },
      
      // Machine learning configuration
      ml: {
        enablePatternDetection: options.enablePatternDetection !== false,
        enablePredictiveAnalysis: options.enablePredictiveAnalysis !== false,
        patternMinSupport: options.patternMinSupport || 0.1, // 10% minimum support
        predictionConfidenceThreshold: options.predictionConfidenceThreshold || 0.7
      },
      
      ...options
    };
    
    // Initialize core systems
    this.performanceAnalytics = getPerformanceAnalytics();
    this.gamingMetricsTracker = getGamingMetricsTracker();
    this.alertSystem = getPerformanceAlertSystem();
    this.dataPipeline = getAnalyticsDataPipeline();
    
    // Analysis state
    this.insights = new Map();
    this.recommendations = new Map();
    this.bottlenecks = new Map();
    this.patterns = new Map();
    this.predictions = new Map();
    
    // Performance models
    this.performanceModels = new Map();
    this.optimizationHistory = new Map();
    this.userImpactCorrelations = new Map();
    
    // Analysis engines
    this.bottleneckDetector = new BottleneckDetector(this.config);
    this.patternAnalyzer = new PatternAnalyzer(this.config);
    this.recommendationEngine = new RecommendationEngine(this.config);
    this.predictionEngine = new PredictionEngine(this.config);
    
    this.logger = options.logger || console;
    this.isRunning = false;
    
    this.initializeEngine();
  }

  /**
   * Initialize the performance insights engine
   */
  async initializeEngine() {
    try {
      // Setup event listeners
      this.setupEventListeners();
      
      // Load historical patterns and models
      await this.loadHistoricalData();
      
      // Initialize analysis engines
      await this.initializeAnalysisEngines();
      
      // Start analysis processes
      this.startAnalysisProcesses();
      
      this.isRunning = true;
      this.emit('engine:initialized');
      this.logger.log('Performance insights engine initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize performance insights engine:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for real-time analysis
   */
  setupEventListeners() {
    // Listen to data pipeline events for real-time analysis
    this.dataPipeline.on('realtime:updated', (data) => {
      this.analyzeRealTimeData(data);
    });
    
    this.dataPipeline.on('batch:processed', (batch) => {
      this.analyzeBatchData(batch);
    });
    
    this.dataPipeline.on('aggregation:completed', (aggregation) => {
      this.analyzeAggregatedData(aggregation);
    });
    
    // Listen to alert system events
    this.alertSystem.on('alert:created', (alert) => {
      this.analyzePerformanceAlert(alert);
    });
    
    this.alertSystem.on('correlation:pattern_detected', (pattern) => {
      this.analyzeCorrelationPattern(pattern);
    });
    
    // Listen to gaming metrics events
    this.gamingMetricsTracker.on('performance:degradation_detected', (degradation) => {
      this.analyzePerformanceDegradation(degradation);
    });
    
    this.gamingMetricsTracker.on('anomaly:detected', (anomaly) => {
      this.analyzePerformanceAnomaly(anomaly);
    });
  }

  /**
   * Real-Time Analysis
   */

  /**
   * Analyze real-time performance data
   */
  analyzeRealTimeData(data) {
    const { eventType, timeSlot, aggregation } = data;
    
    // Detect immediate bottlenecks
    const bottlenecks = this.bottleneckDetector.detectRealTimeBottlenecks(aggregation);
    if (bottlenecks.length > 0) {
      this.processBottlenecks(eventType, bottlenecks, 'realtime');
    }
    
    // Generate immediate insights
    const insights = this.generateRealTimeInsights(eventType, aggregation);
    if (insights.length > 0) {
      this.processInsights(insights);
    }
    
    // Check for optimization opportunities
    const opportunities = this.identifyOptimizationOpportunities(eventType, aggregation);
    if (opportunities.length > 0) {
      this.processOptimizationOpportunities(opportunities);
    }
  }

  /**
   * Generate real-time performance insights
   */
  generateRealTimeInsights(eventType, aggregation) {
    const insights = [];
    
    // Performance degradation insight
    if (aggregation.average > this.config.thresholds.significantBottleneck) {
      insights.push({
        type: 'performance_degradation',
        category: 'realtime',
        eventType,
        severity: this.calculateSeverity(aggregation.average),
        message: `${eventType} performance is degraded (${Math.round(aggregation.average)}ms average)`,
        value: aggregation.average,
        timestamp: Date.now(),
        context: {
          count: aggregation.count,
          p95: aggregation.p95,
          errorRate: aggregation.errorRate
        }
      });
    }
    
    // High error rate insight
    if (aggregation.errorRate > this.config.thresholds.errorRateHigh * 100) {
      insights.push({
        type: 'high_error_rate',
        category: 'reliability',
        eventType,
        severity: 'high',
        message: `High error rate detected for ${eventType} (${aggregation.errorRate.toFixed(1)}%)`,
        value: aggregation.errorRate,
        timestamp: Date.now(),
        context: {
          errors: aggregation.errors,
          total: aggregation.count
        }
      });
    }
    
    // Competitive context impact
    if (aggregation.competitiveRate > 50 && aggregation.average > this.config.thresholds.minorBottleneck) {
      insights.push({
        type: 'competitive_impact',
        category: 'gaming',
        eventType,
        severity: 'critical',
        message: `Performance issues during competitive gameplay (${aggregation.competitiveRate.toFixed(1)}% competitive events)`,
        value: aggregation.average,
        timestamp: Date.now(),
        context: {
          competitiveEvents: aggregation.competitiveEvents,
          totalEvents: aggregation.count,
          competitiveRate: aggregation.competitiveRate
        }
      });
    }
    
    return insights;
  }

  /**
   * Calculate insight severity based on performance value
   */
  calculateSeverity(value) {
    if (value > this.config.thresholds.criticalBottleneck) return 'critical';
    if (value > this.config.thresholds.significantBottleneck) return 'high';
    if (value > this.config.thresholds.minorBottleneck) return 'medium';
    return 'low';
  }

  /**
   * Batch Data Analysis
   */

  /**
   * Analyze processed batch data
   */
  analyzeBatchData(batch) {
    // Perform deeper analysis on batch data
    const trends = this.analyzeTrends(batch);
    const correlations = this.analyzeCorrelations(batch);
    const patterns = this.analyzePatterns(batch);
    
    this.processTrends(trends);
    this.processCorrelations(correlations);
    this.processPatterns(patterns);
  }

  /**
   * Analyze performance trends in batch data
   */
  analyzeTrends(batch) {
    const trends = [];
    const eventTypes = new Set();
    
    // Collect unique event types from batch
    batch.events?.forEach(event => eventTypes.add(event.eventType));
    
    // Analyze trend for each event type
    eventTypes.forEach(eventType => {
      const trend = this.calculateTrend(eventType, batch);
      if (trend.isSignificant) {
        trends.push(trend);
      }
    });
    
    return trends;
  }

  /**
   * Calculate performance trend for event type
   */
  calculateTrend(eventType, batch) {
    const historicalData = this.getHistoricalPerformanceData(eventType, 3600000); // 1 hour
    if (historicalData.length < this.config.analysis.minimumDataPoints) {
      return { isSignificant: false };
    }
    
    // Calculate trend using linear regression
    const trendAnalysis = this.performTrendAnalysis(historicalData);
    
    return {
      eventType,
      isSignificant: Math.abs(trendAnalysis.slope) > 0.1, // Significant if slope > 0.1 ms/minute
      direction: trendAnalysis.slope > 0 ? 'degrading' : 'improving',
      slope: trendAnalysis.slope,
      confidence: trendAnalysis.rSquared,
      currentValue: trendAnalysis.latest,
      predictedValue: trendAnalysis.predicted,
      timestamp: Date.now()
    };
  }

  /**
   * Perform trend analysis using linear regression
   */
  performTrendAnalysis(data) {
    if (data.length < 2) {
      return { slope: 0, rSquared: 0, latest: 0, predicted: 0 };
    }
    
    const n = data.length;
    const sumX = data.reduce((sum, point, index) => sum + index, 0);
    const sumY = data.reduce((sum, point) => sum + point.value, 0);
    const sumXY = data.reduce((sum, point, index) => sum + (index * point.value), 0);
    const sumXX = data.reduce((sum, point, index) => sum + (index * index), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = data.reduce((sum, point) => sum + Math.pow(point.value - yMean, 2), 0);
    const ssResidual = data.reduce((sum, point, index) => {
      const predicted = slope * index + intercept;
      return sum + Math.pow(point.value - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);
    
    return {
      slope,
      rSquared,
      latest: data[data.length - 1].value,
      predicted: slope * n + intercept
    };
  }

  /**
   * Bottleneck Detection and Analysis
   */

  /**
   * Process detected bottlenecks
   */
  processBottlenecks(eventType, bottlenecks, context) {
    bottlenecks.forEach(bottleneck => {
      const bottleneckId = `${eventType}_${bottleneck.type}_${Date.now()}`;
      
      const analysis = {
        id: bottleneckId,
        eventType,
        context,
        ...bottleneck,
        rootCause: this.identifyRootCause(bottleneck),
        impact: this.assessBottleneckImpact(bottleneck),
        recommendations: this.generateBottleneckRecommendations(bottleneck),
        timestamp: Date.now()
      };
      
      this.bottlenecks.set(bottleneckId, analysis);
      this.emit('bottleneck:detected', analysis);
      
      // Generate optimization recommendations
      this.generateOptimizationRecommendations(analysis);
    });
  }

  /**
   * Identify root cause of bottleneck
   */
  identifyRootCause(bottleneck) {
    const possibleCauses = [];
    
    // Network-related causes
    if (bottleneck.type.includes('network') || bottleneck.type.includes('wallet') || bottleneck.type.includes('vote')) {
      possibleCauses.push({
        category: 'network',
        confidence: 0.7,
        description: 'Network latency or connectivity issues',
        indicators: ['high response times', 'timeout errors', 'connection failures']
      });
    }
    
    // Rendering-related causes
    if (bottleneck.type.includes('render') || bottleneck.type.includes('leaderboard') || bottleneck.type.includes('tournament')) {
      possibleCauses.push({
        category: 'rendering',
        confidence: 0.6,
        description: 'DOM rendering or JavaScript execution bottleneck',
        indicators: ['high CPU usage', 'main thread blocking', 'large DOM updates']
      });
    }
    
    // Resource-related causes
    if (bottleneck.severity === 'critical' && bottleneck.value > 5000) {
      possibleCauses.push({
        category: 'resource',
        confidence: 0.8,
        description: 'System resource constraints',
        indicators: ['high memory usage', 'CPU throttling', 'disk I/O issues']
      });
    }
    
    // Gaming-specific causes
    if (bottleneck.type.includes('gaming')) {
      possibleCauses.push({
        category: 'gaming_logic',
        confidence: 0.5,
        description: 'Gaming logic or data processing bottleneck',
        indicators: ['complex calculations', 'large data sets', 'inefficient algorithms']
      });
    }
    
    // Return most likely cause
    return possibleCauses.sort((a, b) => b.confidence - a.confidence)[0] || {
      category: 'unknown',
      confidence: 0.3,
      description: 'Unable to determine root cause',
      indicators: []
    };
  }

  /**
   * Assess bottleneck impact on user experience
   */
  assessBottleneckImpact(bottleneck) {
    let impact = {
      userExperience: 'low',
      businessImpact: 'low',
      competitiveImpact: 'low',
      severity: bottleneck.severity
    };
    
    // Assess user experience impact
    if (bottleneck.value > this.config.thresholds.criticalBottleneck) {
      impact.userExperience = 'high';
    } else if (bottleneck.value > this.config.thresholds.significantBottleneck) {
      impact.userExperience = 'medium';
    }
    
    // Assess business impact
    const criticalOperations = ['vote', 'wallet', 'leaderboard'];
    if (criticalOperations.some(op => bottleneck.type.includes(op))) {
      impact.businessImpact = bottleneck.severity === 'critical' ? 'high' : 'medium';
    }
    
    // Assess competitive impact
    const competitiveOperations = ['tournament', 'leaderboard', 'vote'];
    if (competitiveOperations.some(op => bottleneck.type.includes(op))) {
      impact.competitiveImpact = 'high';
    }
    
    return impact;
  }

  /**
   * Generate bottleneck-specific recommendations
   */
  generateBottleneckRecommendations(bottleneck) {
    const recommendations = [];
    const rootCause = bottleneck.rootCause;
    
    switch (rootCause?.category) {
      case 'network':
        recommendations.push(
          ...this.generateNetworkOptimizationRecommendations(bottleneck)
        );
        break;
        
      case 'rendering':
        recommendations.push(
          ...this.generateRenderingOptimizationRecommendations(bottleneck)
        );
        break;
        
      case 'resource':
        recommendations.push(
          ...this.generateResourceOptimizationRecommendations(bottleneck)
        );
        break;
        
      case 'gaming_logic':
        recommendations.push(
          ...this.generateGamingOptimizationRecommendations(bottleneck)
        );
        break;
        
      default:
        recommendations.push(
          ...this.generateGenericOptimizationRecommendations(bottleneck)
        );
    }
    
    return recommendations;
  }

  /**
   * Generate network optimization recommendations
   */
  generateNetworkOptimizationRecommendations(bottleneck) {
    return [
      {
        type: 'network_optimization',
        title: 'Implement Request Batching',
        description: 'Batch multiple API requests to reduce network round trips',
        impact: 'high',
        difficulty: 'medium',
        confidence: 0.8,
        actions: [
          'Implement request queue with batching logic',
          'Combine multiple vote submissions into single request',
          'Use GraphQL or custom batching endpoint'
        ],
        estimatedImprovement: '30-50%'
      },
      {
        type: 'network_optimization',
        title: 'Add Request Caching',
        description: 'Cache frequently accessed data to reduce server requests',
        impact: 'medium',
        difficulty: 'low',
        confidence: 0.9,
        actions: [
          'Implement HTTP cache headers',
          'Add local storage for leaderboard data',
          'Use service worker for offline caching'
        ],
        estimatedImprovement: '20-40%'
      }
    ];
  }

  /**
   * Generate rendering optimization recommendations
   */
  generateRenderingOptimizationRecommendations(bottleneck) {
    return [
      {
        type: 'rendering_optimization',
        title: 'Implement Virtual Scrolling',
        description: 'Use virtual scrolling for large leaderboards and lists',
        impact: 'high',
        difficulty: 'high',
        confidence: 0.7,
        actions: [
          'Implement virtual scrolling for leaderboard components',
          'Lazy load tournament bracket data',
          'Use React.memo or similar for expensive components'
        ],
        estimatedImprovement: '40-60%'
      },
      {
        type: 'rendering_optimization',
        title: 'Optimize DOM Updates',
        description: 'Reduce DOM manipulations and use efficient update patterns',
        impact: 'medium',
        difficulty: 'medium',
        confidence: 0.8,
        actions: [
          'Use DocumentFragment for batch DOM updates',
          'Implement efficient diff algorithms',
          'Debounce frequent UI updates'
        ],
        estimatedImprovement: '25-35%'
      }
    ];
  }

  /**
   * Generate resource optimization recommendations
   */
  generateResourceOptimizationRecommendations(bottleneck) {
    return [
      {
        type: 'resource_optimization',
        title: 'Implement Memory Management',
        description: 'Optimize memory usage and prevent memory leaks',
        impact: 'high',
        difficulty: 'medium',
        confidence: 0.8,
        actions: [
          'Implement proper cleanup in React components',
          'Use WeakMap and WeakSet for temporary references',
          'Profile and fix memory leaks'
        ],
        estimatedImprovement: '30-50%'
      },
      {
        type: 'resource_optimization',
        title: 'Add Resource Preloading',
        description: 'Preload critical resources and data',
        impact: 'medium',
        difficulty: 'low',
        confidence: 0.9,
        actions: [
          'Preload tournament bracket data',
          'Use link[rel=preload] for critical assets',
          'Implement predictive prefetching'
        ],
        estimatedImprovement: '20-30%'
      }
    ];
  }

  /**
   * Generate gaming-specific optimization recommendations
   */
  generateGamingOptimizationRecommendations(bottleneck) {
    return [
      {
        type: 'gaming_optimization',
        title: 'Optimize Gaming Logic',
        description: 'Improve gaming calculations and data processing',
        impact: 'high',
        difficulty: 'high',
        confidence: 0.7,
        actions: [
          'Optimize leaderboard ranking algorithms',
          'Use Web Workers for heavy calculations',
          'Implement incremental data updates'
        ],
        estimatedImprovement: '35-55%'
      },
      {
        type: 'gaming_optimization',
        title: 'Enhance Real-time Updates',
        description: 'Improve real-time data synchronization',
        impact: 'medium',
        difficulty: 'medium',
        confidence: 0.8,
        actions: [
          'Implement WebSocket connection pooling',
          'Use delta updates instead of full refreshes',
          'Add optimistic UI updates'
        ],
        estimatedImprovement: '25-40%'
      }
    ];
  }

  /**
   * Generate generic optimization recommendations
   */
  generateGenericOptimizationRecommendations(bottleneck) {
    return [
      {
        type: 'general_optimization',
        title: 'Profile and Optimize',
        description: 'Use performance profiling to identify specific bottlenecks',
        impact: 'medium',
        difficulty: 'medium',
        confidence: 0.6,
        actions: [
          'Use browser DevTools for performance profiling',
          'Implement performance monitoring',
          'Add custom performance marks'
        ],
        estimatedImprovement: '15-25%'
      }
    ];
  }

  /**
   * Optimization Opportunities Analysis
   */

  /**
   * Identify optimization opportunities from performance data
   */
  identifyOptimizationOpportunities(eventType, aggregation) {
    const opportunities = [];
    
    // Resource usage optimization
    if (this.isResourceOptimizationCandidate(aggregation)) {
      opportunities.push({
        type: 'resource_optimization',
        eventType,
        priority: this.calculateOptimizationPriority(aggregation),
        potentialImpact: this.estimateOptimizationImpact(aggregation),
        data: aggregation
      });
    }
    
    // Caching optimization
    if (this.isCachingOptimizationCandidate(eventType, aggregation)) {
      opportunities.push({
        type: 'caching_optimization',
        eventType,
        priority: 'medium',
        potentialImpact: 'medium',
        data: aggregation
      });
    }
    
    // Batch processing optimization
    if (this.isBatchOptimizationCandidate(aggregation)) {
      opportunities.push({
        type: 'batch_optimization',
        eventType,
        priority: 'high',
        potentialImpact: 'high',
        data: aggregation
      });
    }
    
    return opportunities;
  }

  /**
   * Check if event is candidate for resource optimization
   */
  isResourceOptimizationCandidate(aggregation) {
    return aggregation.average > this.config.thresholds.significantBottleneck &&
           aggregation.count > 10 &&
           aggregation.p95 > aggregation.average * 1.5;
  }

  /**
   * Check if event is candidate for caching optimization
   */
  isCachingOptimizationCandidate(eventType, aggregation) {
    const cachingCandidates = ['leaderboard', 'tournament', 'clan'];
    return cachingCandidates.some(candidate => eventType.includes(candidate)) &&
           aggregation.count > 20;
  }

  /**
   * Check if event is candidate for batch optimization
   */
  isBatchOptimizationCandidate(aggregation) {
    return aggregation.count > 50 &&
           aggregation.errorRate < 5 &&
           aggregation.average > 500;
  }

  /**
   * Calculate optimization priority
   */
  calculateOptimizationPriority(aggregation) {
    if (aggregation.average > this.config.thresholds.criticalBottleneck) return 'critical';
    if (aggregation.average > this.config.thresholds.significantBottleneck) return 'high';
    if (aggregation.average > this.config.thresholds.minorBottleneck) return 'medium';
    return 'low';
  }

  /**
   * Estimate optimization impact
   */
  estimateOptimizationImpact(aggregation) {
    const impactScore = (aggregation.average / 1000) * aggregation.count;
    
    if (impactScore > 100) return 'high';
    if (impactScore > 50) return 'medium';
    return 'low';
  }

  /**
   * Process optimization opportunities
   */
  processOptimizationOpportunities(opportunities) {
    opportunities.forEach(opportunity => {
      const recommendations = this.generateOpportunityRecommendations(opportunity);
      
      recommendations.forEach(recommendation => {
        this.addRecommendation(recommendation);
      });
    });
  }

  /**
   * Generate recommendations for optimization opportunity
   */
  generateOpportunityRecommendations(opportunity) {
    const recommendations = [];
    
    switch (opportunity.type) {
      case 'resource_optimization':
        recommendations.push({
          id: `resource_opt_${Date.now()}`,
          type: opportunity.type,
          eventType: opportunity.eventType,
          title: 'Optimize Resource Usage',
          description: `Resource optimization opportunity detected for ${opportunity.eventType}`,
          priority: opportunity.priority,
          impact: opportunity.potentialImpact,
          confidence: 0.7,
          actions: this.getResourceOptimizationActions(opportunity),
          timestamp: Date.now()
        });
        break;
        
      case 'caching_optimization':
        recommendations.push({
          id: `cache_opt_${Date.now()}`,
          type: opportunity.type,
          eventType: opportunity.eventType,
          title: 'Implement Caching Strategy',
          description: `Caching optimization opportunity detected for ${opportunity.eventType}`,
          priority: opportunity.priority,
          impact: opportunity.potentialImpact,
          confidence: 0.8,
          actions: this.getCachingOptimizationActions(opportunity),
          timestamp: Date.now()
        });
        break;
        
      case 'batch_optimization':
        recommendations.push({
          id: `batch_opt_${Date.now()}`,
          type: opportunity.type,
          eventType: opportunity.eventType,
          title: 'Implement Batch Processing',
          description: `Batch processing optimization opportunity detected for ${opportunity.eventType}`,
          priority: opportunity.priority,
          impact: opportunity.potentialImpact,
          confidence: 0.9,
          actions: this.getBatchOptimizationActions(opportunity),
          timestamp: Date.now()
        });
        break;
    }
    
    return recommendations;
  }

  /**
   * Get resource optimization actions
   */
  getResourceOptimizationActions(opportunity) {
    return [
      'Profile memory usage patterns',
      'Implement lazy loading for non-critical components',
      'Optimize data structures and algorithms',
      'Use performance budgets for resource monitoring'
    ];
  }

  /**
   * Get caching optimization actions
   */
  getCachingOptimizationActions(opportunity) {
    return [
      'Implement HTTP caching with appropriate headers',
      'Add client-side caching for frequently accessed data',
      'Use service worker for offline caching',
      'Implement cache invalidation strategies'
    ];
  }

  /**
   * Get batch optimization actions
   */
  getBatchOptimizationActions(opportunity) {
    return [
      'Implement request batching for API calls',
      'Use database connection pooling',
      'Batch DOM updates to reduce reflow',
      'Implement debouncing for frequent operations'
    ];
  }

  /**
   * Recommendation Management
   */

  /**
   * Add recommendation to the system
   */
  addRecommendation(recommendation) {
    // Calculate overall score
    recommendation.score = this.calculateRecommendationScore(recommendation);
    
    this.recommendations.set(recommendation.id, recommendation);
    this.emit('recommendation:generated', recommendation);
    
    // Check if recommendation should trigger automated action
    if (this.shouldTriggerAutomation(recommendation)) {
      this.triggerAutomatedOptimization(recommendation);
    }
  }

  /**
   * Calculate recommendation score based on multiple factors
   */
  calculateRecommendationScore(recommendation) {
    const weights = this.config.scoring;
    
    // Impact score (0-100)
    const impactScore = this.getImpactScore(recommendation.impact);
    
    // Difficulty score (inverse - easier = higher score)
    const difficultyScore = this.getDifficultyScore(recommendation.difficulty);
    
    // Confidence score (0-100)
    const confidenceScore = (recommendation.confidence || 0.5) * 100;
    
    // Urgency score based on priority
    const urgencyScore = this.getUrgencyScore(recommendation.priority);
    
    // Calculate weighted score
    const score = 
      (impactScore * weights.impactWeight) +
      (difficultyScore * weights.difficultyWeight) +
      (confidenceScore * weights.confidenceWeight) +
      (urgencyScore * weights.urgencyWeight);
    
    return Math.round(score);
  }

  /**
   * Get impact score from impact level
   */
  getImpactScore(impact) {
    const impactScores = { low: 25, medium: 50, high: 75, critical: 100 };
    return impactScores[impact] || 50;
  }

  /**
   * Get difficulty score (inverse of difficulty)
   */
  getDifficultyScore(difficulty) {
    const difficultyScores = { low: 100, medium: 60, high: 30, very_high: 10 };
    return difficultyScores[difficulty] || 60;
  }

  /**
   * Get urgency score from priority
   */
  getUrgencyScore(priority) {
    const urgencyScores = { low: 25, medium: 50, high: 75, critical: 100 };
    return urgencyScores[priority] || 50;
  }

  /**
   * Check if recommendation should trigger automated action
   */
  shouldTriggerAutomation(recommendation) {
    return recommendation.score >= 80 && 
           recommendation.difficulty === 'low' &&
           recommendation.confidence >= 0.8;
  }

  /**
   * Trigger automated optimization
   */
  triggerAutomatedOptimization(recommendation) {
    this.emit('automation:triggered', {
      recommendationId: recommendation.id,
      type: recommendation.type,
      actions: recommendation.actions,
      timestamp: Date.now()
    });
  }

  /**
   * Pattern and Correlation Analysis
   */

  /**
   * Analyze performance patterns
   */
  analyzePatterns(batch) {
    const patterns = [];
    
    // Time-based patterns
    const timePatterns = this.analyzeTimePatterns(batch);
    patterns.push(...timePatterns);
    
    // User behavior patterns
    const userPatterns = this.analyzeUserBehaviorPatterns(batch);
    patterns.push(...userPatterns);
    
    // Performance correlation patterns
    const correlationPatterns = this.analyzePerformanceCorrelations(batch);
    patterns.push(...correlationPatterns);
    
    return patterns;
  }

  /**
   * Analyze time-based performance patterns
   */
  analyzeTimePatterns(batch) {
    const patterns = [];
    
    // Peak usage patterns
    const peakPattern = this.detectPeakUsagePatterns(batch);
    if (peakPattern) {
      patterns.push(peakPattern);
    }
    
    // Performance degradation patterns
    const degradationPattern = this.detectDegradationPatterns(batch);
    if (degradationPattern) {
      patterns.push(degradationPattern);
    }
    
    return patterns;
  }

  /**
   * Detect peak usage patterns
   */
  detectPeakUsagePatterns(batch) {
    // Analyze usage patterns by hour of day
    const hourlyUsage = new Map();
    
    batch.events?.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      if (!hourlyUsage.has(hour)) {
        hourlyUsage.set(hour, { count: 0, totalLatency: 0 });
      }
      const hourData = hourlyUsage.get(hour);
      hourData.count += 1;
      hourData.totalLatency += event.duration || 0;
    });
    
    // Find peak hours
    const peakHours = [];
    const avgUsage = Array.from(hourlyUsage.values()).reduce((sum, data) => sum + data.count, 0) / hourlyUsage.size;
    
    for (const [hour, data] of hourlyUsage) {
      if (data.count > avgUsage * 1.5) {
        peakHours.push({
          hour,
          usage: data.count,
          avgLatency: data.totalLatency / data.count
        });
      }
    }
    
    if (peakHours.length > 0) {
      return {
        type: 'peak_usage_pattern',
        description: 'High usage periods with potential performance impact',
        peakHours,
        recommendations: this.generatePeakUsageRecommendations(peakHours)
      };
    }
    
    return null;
  }

  /**
   * Generate recommendations for peak usage patterns
   */
  generatePeakUsageRecommendations(peakHours) {
    return [
      {
        title: 'Scale Resources During Peak Hours',
        description: 'Implement auto-scaling for high traffic periods',
        actions: [
          'Set up auto-scaling rules for identified peak hours',
          'Pre-warm caches before peak periods',
          'Implement load balancing strategies'
        ]
      },
      {
        title: 'Optimize for Peak Performance',
        description: 'Optimize critical paths for peak usage scenarios',
        actions: [
          'Profile performance during peak hours',
          'Implement performance budgets for peak scenarios',
          'Use CDN for static assets during high traffic'
        ]
      }
    ];
  }

  /**
   * Predictive Analysis
   */

  /**
   * Generate performance predictions
   */
  generatePerformancePredictions(eventType) {
    const predictions = [];
    
    // Trend-based predictions
    const trendPrediction = this.generateTrendPrediction(eventType);
    if (trendPrediction) {
      predictions.push(trendPrediction);
    }
    
    // Seasonal predictions
    const seasonalPrediction = this.generateSeasonalPrediction(eventType);
    if (seasonalPrediction) {
      predictions.push(seasonalPrediction);
    }
    
    // Anomaly predictions
    const anomalyPrediction = this.generateAnomalyPrediction(eventType);
    if (anomalyPrediction) {
      predictions.push(anomalyPrediction);
    }
    
    return predictions;
  }

  /**
   * Generate trend-based prediction
   */
  generateTrendPrediction(eventType) {
    const historicalData = this.getHistoricalPerformanceData(eventType, 86400000); // 24 hours
    if (historicalData.length < this.config.analysis.minimumDataPoints) {
      return null;
    }
    
    const trendAnalysis = this.performTrendAnalysis(historicalData);
    
    if (trendAnalysis.rSquared > this.config.ml.predictionConfidenceThreshold) {
      const futureValue = trendAnalysis.slope * (historicalData.length + 60) + trendAnalysis.intercept; // 1 hour ahead
      
      return {
        type: 'trend_prediction',
        eventType,
        currentValue: trendAnalysis.latest,
        predictedValue: futureValue,
        confidence: trendAnalysis.rSquared,
        timeHorizon: 3600000, // 1 hour
        recommendation: futureValue > trendAnalysis.latest * 1.2 ? 
          'Performance degradation predicted - consider proactive optimization' :
          'Performance trend is stable'
      };
    }
    
    return null;
  }

  /**
   * Data Processing and Analysis Engines
   */

  /**
   * Load historical data and models
   */
  async loadHistoricalData() {
    try {
      // Load performance models
      const storedModels = localStorage.getItem('performance_models');
      if (storedModels) {
        const models = JSON.parse(storedModels);
        for (const [key, model] of Object.entries(models)) {
          this.performanceModels.set(key, model);
        }
      }
      
      // Load optimization history
      const optimizationHistory = localStorage.getItem('optimization_history');
      if (optimizationHistory) {
        const history = JSON.parse(optimizationHistory);
        for (const [key, data] of Object.entries(history)) {
          this.optimizationHistory.set(key, data);
        }
      }
      
    } catch (error) {
      this.logger.warn('Failed to load historical data:', error);
    }
  }

  /**
   * Initialize analysis engines
   */
  async initializeAnalysisEngines() {
    await Promise.all([
      this.bottleneckDetector.initialize(),
      this.patternAnalyzer.initialize(),
      this.recommendationEngine.initialize(),
      this.predictionEngine.initialize()
    ]);
  }

  /**
   * Start analysis processes
   */
  startAnalysisProcesses() {
    // Insight generation process
    setInterval(() => {
      this.generatePeriodicInsights();
    }, this.config.analysis.insightGenerationInterval);
    
    // Recommendation refresh process
    setInterval(() => {
      this.refreshRecommendations();
    }, this.config.analysis.recommendationRefreshInterval);
    
    // Pattern analysis process
    setInterval(() => {
      this.analyzeHistoricalPatterns();
    }, 3600000); // Every hour
    
    // Prediction update process
    setInterval(() => {
      this.updatePredictions();
    }, 1800000); // Every 30 minutes
  }

  /**
   * Generate periodic insights from aggregated data
   */
  generatePeriodicInsights() {
    const eventTypes = ['web_vital', 'gaming_performance', 'user_experience'];
    
    eventTypes.forEach(eventType => {
      const insights = this.generateInsightsForEventType(eventType);
      insights.forEach(insight => {
        this.processInsights([insight]);
      });
    });
  }

  /**
   * Generate insights for specific event type
   */
  generateInsightsForEventType(eventType) {
    const insights = [];
    
    // Get recent aggregated data
    const aggregatedData = this.dataPipeline.getAggregatedMetrics('hourly', eventType, 86400000);
    
    if (aggregatedData.length < 2) return insights;
    
    // Performance trend insight
    const trendInsight = this.generateTrendInsight(eventType, aggregatedData);
    if (trendInsight) insights.push(trendInsight);
    
    // Performance comparison insight
    const comparisonInsight = this.generateComparisonInsight(eventType, aggregatedData);
    if (comparisonInsight) insights.push(comparisonInsight);
    
    return insights;
  }

  /**
   * Generate trend insight
   */
  generateTrendInsight(eventType, data) {
    if (data.length < 6) return null; // Need at least 6 hours of data
    
    const recent = data.slice(0, 3); // Last 3 hours
    const previous = data.slice(3, 6); // Previous 3 hours
    
    const recentAvg = recent.reduce((sum, d) => sum + (d.average || 0), 0) / recent.length;
    const previousAvg = previous.reduce((sum, d) => sum + (d.average || 0), 0) / previous.length;
    
    const change = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    if (Math.abs(change) > 20) { // Significant change
      return {
        type: 'trend_change',
        category: 'performance',
        eventType,
        severity: Math.abs(change) > 50 ? 'high' : 'medium',
        message: `${eventType} performance has ${change > 0 ? 'degraded' : 'improved'} by ${Math.abs(change).toFixed(1)}%`,
        value: change,
        context: {
          recentAvg: Math.round(recentAvg),
          previousAvg: Math.round(previousAvg),
          changePercent: change
        },
        timestamp: Date.now()
      };
    }
    
    return null;
  }

  /**
   * Generate comparison insight
   */
  generateComparisonInsight(eventType, data) {
    const latest = data[0];
    const weekAgo = data.find(d => 
      Math.abs(d.timeSlot - (latest.timeSlot - 604800000)) < 3600000
    ); // Find data from same time last week
    
    if (!weekAgo) return null;
    
    const change = ((latest.average - weekAgo.average) / weekAgo.average) * 100;
    
    if (Math.abs(change) > 15) {
      return {
        type: 'weekly_comparison',
        category: 'performance',
        eventType,
        severity: Math.abs(change) > 30 ? 'high' : 'medium',
        message: `${eventType} performance is ${change > 0 ? 'worse' : 'better'} than same time last week by ${Math.abs(change).toFixed(1)}%`,
        value: change,
        context: {
          currentValue: Math.round(latest.average),
          weekAgoValue: Math.round(weekAgo.average),
          changePercent: change
        },
        timestamp: Date.now()
      };
    }
    
    return null;
  }

  /**
   * Utility Methods
   */

  /**
   * Get historical performance data for analysis
   */
  getHistoricalPerformanceData(eventType, timeRange) {
    return this.dataPipeline.getAggregatedMetrics('minutely', eventType, timeRange);
  }

  /**
   * Process insights by storing and emitting them
   */
  processInsights(insights) {
    insights.forEach(insight => {
      const insightId = `${insight.type}_${insight.eventType}_${Date.now()}`;
      insight.id = insightId;
      
      this.insights.set(insightId, insight);
      this.emit('insight:generated', insight);
      
      // Generate recommendations based on insight
      const recommendations = this.generateInsightRecommendations(insight);
      recommendations.forEach(rec => this.addRecommendation(rec));
    });
  }

  /**
   * Generate recommendations based on insight
   */
  generateInsightRecommendations(insight) {
    const recommendations = [];
    
    if (insight.type === 'trend_change' && insight.value > 20) {
      recommendations.push({
        id: `trend_rec_${Date.now()}`,
        type: 'performance_improvement',
        title: 'Address Performance Degradation',
        description: `Performance trend shows degradation for ${insight.eventType}`,
        priority: insight.severity === 'high' ? 'critical' : 'high',
        impact: 'high',
        confidence: 0.8,
        actions: [
          'Investigate recent code changes',
          'Profile performance bottlenecks',
          'Review resource usage patterns',
          'Consider rollback if recent deployment'
        ],
        timestamp: Date.now()
      });
    }
    
    return recommendations;
  }

  /**
   * Refresh recommendations by removing old ones and updating scores
   */
  refreshRecommendations() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    // Remove old recommendations
    for (const [id, recommendation] of this.recommendations) {
      if (now - recommendation.timestamp > maxAge) {
        this.recommendations.delete(id);
      } else {
        // Update score based on current data
        recommendation.score = this.calculateRecommendationScore(recommendation);
      }
    }
    
    this.emit('recommendations:refreshed', {
      count: this.recommendations.size,
      timestamp: now
    });
  }

  /**
   * Public API Methods
   */

  /**
   * Get current insights
   */
  getCurrentInsights(category = null, severity = null) {
    let insights = Array.from(this.insights.values());
    
    if (category) {
      insights = insights.filter(insight => insight.category === category);
    }
    
    if (severity) {
      insights = insights.filter(insight => insight.severity === severity);
    }
    
    return insights
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50); // Return top 50 insights
  }

  /**
   * Get recommendations sorted by score
   */
  getTopRecommendations(limit = 10, type = null) {
    let recommendations = Array.from(this.recommendations.values());
    
    if (type) {
      recommendations = recommendations.filter(rec => rec.type === type);
    }
    
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get bottleneck analysis
   */
  getBottleneckAnalysis(eventType = null) {
    let bottlenecks = Array.from(this.bottlenecks.values());
    
    if (eventType) {
      bottlenecks = bottlenecks.filter(b => b.eventType === eventType);
    }
    
    return bottlenecks.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get performance predictions
   */
  getPerformancePredictions(eventType = null) {
    let predictions = Array.from(this.predictions.values());
    
    if (eventType) {
      predictions = predictions.filter(p => p.eventType === eventType);
    }
    
    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get optimization opportunities
   */
  getOptimizationOpportunities() {
    return this.getTopRecommendations(20)
      .filter(rec => rec.type.includes('optimization'))
      .map(rec => ({
        ...rec,
        category: 'optimization_opportunity'
      }));
  }

  /**
   * Shutdown insights engine
   */
  shutdown() {
    this.isRunning = false;
    
    // Save current state
    this.savePerformanceModels();
    this.saveOptimizationHistory();
    
    this.emit('engine:shutdown');
    this.removeAllListeners();
  }

  /**
   * Save performance models
   */
  savePerformanceModels() {
    try {
      const models = Object.fromEntries(this.performanceModels);
      localStorage.setItem('performance_models', JSON.stringify(models));
    } catch (error) {
      this.logger.warn('Failed to save performance models:', error);
    }
  }

  /**
   * Save optimization history
   */
  saveOptimizationHistory() {
    try {
      const history = Object.fromEntries(this.optimizationHistory);
      localStorage.setItem('optimization_history', JSON.stringify(history));
    } catch (error) {
      this.logger.warn('Failed to save optimization history:', error);
    }
  }
}

/**
 * Helper Classes for Specialized Analysis
 */

class BottleneckDetector {
  constructor(config) {
    this.config = config;
    this.detectionRules = new Map();
  }
  
  async initialize() {
    // Initialize detection rules
    this.setupDetectionRules();
  }
  
  setupDetectionRules() {
    // Define bottleneck detection patterns
    this.detectionRules.set('high_latency', {
      condition: (data) => data.average > this.config.thresholds.significantBottleneck,
      severity: (data) => data.average > this.config.thresholds.criticalBottleneck ? 'critical' : 'high'
    });
    
    this.detectionRules.set('high_variability', {
      condition: (data) => data.stdDev && data.stdDev > data.average * 0.5,
      severity: () => 'medium'
    });
    
    this.detectionRules.set('error_spikes', {
      condition: (data) => data.errorRate > this.config.thresholds.errorRateHigh * 100,
      severity: (data) => data.errorRate > this.config.thresholds.errorRateHigh * 200 ? 'high' : 'medium'
    });
  }
  
  detectRealTimeBottlenecks(aggregation) {
    const bottlenecks = [];
    
    for (const [type, rule] of this.detectionRules) {
      if (rule.condition(aggregation)) {
        bottlenecks.push({
          type,
          severity: rule.severity(aggregation),
          value: aggregation.average,
          data: aggregation,
          detectedAt: Date.now()
        });
      }
    }
    
    return bottlenecks;
  }
}

class PatternAnalyzer {
  constructor(config) {
    this.config = config;
    this.patterns = new Map();
  }
  
  async initialize() {
    // Initialize pattern detection algorithms
  }
}

class RecommendationEngine {
  constructor(config) {
    this.config = config;
    this.ruleEngine = new Map();
  }
  
  async initialize() {
    // Initialize recommendation rules
  }
}

class PredictionEngine {
  constructor(config) {
    this.config = config;
    this.models = new Map();
  }
  
  async initialize() {
    // Initialize prediction models
  }
}

// Create singleton instance
let globalPerformanceInsightsEngine = null;

export function createPerformanceInsightsEngine(options = {}) {
  return new PerformanceInsightsEngine(options);
}

export function getPerformanceInsightsEngine(options = {}) {
  if (!globalPerformanceInsightsEngine) {
    globalPerformanceInsightsEngine = new PerformanceInsightsEngine(options);
  }
  return globalPerformanceInsightsEngine;
}

export default PerformanceInsightsEngine;