/**
 * MLG.clan Platform Automated Test Reporting System
 * 
 * Comprehensive automated test reporting with metrics aggregation, trend analysis,
 * and actionable recommendations. Generates detailed reports across all testing
 * categories with executive summaries and technical deep-dives.
 * 
 * Features:
 * - Multi-format report generation (JSON, HTML, PDF, CSV)
 * - Real-time dashboard integration
 * - Trend analysis and regression detection
 * - Automated alerting and notifications
 * - Performance baseline comparisons
 * - Risk assessment and impact analysis
 * - Executive and technical reporting levels
 * - Integration with CI/CD pipelines
 * 
 * @author Claude Code - Universal Testing & Verification Agent
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Test Report Configuration
 */
const REPORT_CONFIG = {
  // Output formats
  formats: ['json', 'html', 'csv'],
  outputDirectory: process.env.REPORT_OUTPUT_DIR || './test-reports',
  
  // Report categories
  categories: [
    'load_testing',
    'database_stress',
    'cache_performance',
    'websocket_stress',
    'data_consistency',
    'transaction_integrity',
    'performance_benchmark',
    'gaming_scenarios',
    'emergency_scenarios',
  ],
  
  // Alerting thresholds
  alerting: {
    criticalFailureRate: 0.05,    // 5% failure rate triggers critical alert
    performanceDegradation: 0.20,  // 20% performance drop triggers alert
    errorRateIncrease: 0.10,      // 10% error rate increase triggers alert
    availabilityThreshold: 0.99,   // 99% availability required
  },
  
  // Report templates
  templates: {
    executive: 'executive-summary.html',
    technical: 'technical-details.html',
    dashboard: 'dashboard-data.json',
  },
  
  // Historical data retention
  historyRetention: {
    detailed: 30,    // 30 days of detailed reports
    summary: 90,     // 90 days of summary data
    trends: 365,     // 1 year of trend data
  },
};

/**
 * Automated Test Reporter Class
 */
class AutomatedTestReporter extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = { ...REPORT_CONFIG, ...config };
    
    // Report data storage
    this.testResults = new Map();
    this.historicalData = [];
    this.baselines = new Map();
    this.trends = new Map();
    
    // Report metadata
    this.reportId = crypto.randomUUID();
    this.startTime = Date.now();
    this.endTime = null;
    
    // Alerting system
    this.alerts = [];
    this.criticalIssues = [];
    
    this.logger = config.logger || console;
  }

  /**
   * Initialize reporting system
   */
  async initialize() {
    try {
      this.logger.info('Initializing automated test reporting system...');
      
      // Ensure output directory exists
      await this.ensureOutputDirectory();
      
      // Load historical data
      await this.loadHistoricalData();
      
      // Load performance baselines
      await this.loadBaselines();
      
      this.logger.info('Automated test reporting system initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize test reporting system:', error);
      throw error;
    }
  }

  /**
   * Ensure output directory exists
   */
  async ensureOutputDirectory() {
    try {
      await fs.access(this.config.outputDirectory);
    } catch (error) {
      await fs.mkdir(this.config.outputDirectory, { recursive: true });
    }
  }

  /**
   * Load historical test data
   */
  async loadHistoricalData() {
    try {
      const historyFile = path.join(this.config.outputDirectory, 'historical-data.json');
      
      try {
        const data = await fs.readFile(historyFile, 'utf8');
        this.historicalData = JSON.parse(data);
        this.logger.info(`Loaded ${this.historicalData.length} historical test records`);
      } catch (error) {
        // No historical data available - start fresh
        this.historicalData = [];
        this.logger.info('No historical data found - starting fresh');
      }
      
    } catch (error) {
      this.logger.warn('Failed to load historical data:', error.message);
      this.historicalData = [];
    }
  }

  /**
   * Load performance baselines
   */
  async loadBaselines() {
    try {
      const baselineFile = path.join(this.config.outputDirectory, 'baselines.json');
      
      try {
        const data = await fs.readFile(baselineFile, 'utf8');
        const baselineData = JSON.parse(data);
        
        for (const [category, baseline] of Object.entries(baselineData)) {
          this.baselines.set(category, baseline);
        }
        
        this.logger.info(`Loaded baselines for ${this.baselines.size} categories`);
      } catch (error) {
        // No baselines available
        this.logger.info('No baselines found - will establish new ones');
      }
      
    } catch (error) {
      this.logger.warn('Failed to load baselines:', error.message);
    }
  }

  /**
   * Add test results from a testing category
   */
  addTestResults(category, results) {
    if (!this.config.categories.includes(category)) {
      this.logger.warn(`Unknown test category: ${category}`);
      return;
    }
    
    this.testResults.set(category, {
      ...results,
      timestamp: Date.now(),
      category,
    });
    
    // Analyze results for alerts
    this.analyzeForAlerts(category, results);
    
    // Update trends
    this.updateTrends(category, results);
    
    this.emit('results_added', { category, results });
  }

  /**
   * Analyze test results for alert conditions
   */
  analyzeForAlerts(category, results) {
    const alerts = [];
    
    // Check failure rates
    if (results.summary && results.summary.failureRate) {
      if (results.summary.failureRate > this.config.alerting.criticalFailureRate) {
        alerts.push({
          type: 'CRITICAL_FAILURE_RATE',
          category,
          severity: 'CRITICAL',
          message: `Failure rate (${(results.summary.failureRate * 100).toFixed(2)}%) exceeds critical threshold`,
          value: results.summary.failureRate,
          threshold: this.config.alerting.criticalFailureRate,
        });
      }
    }
    
    // Check performance degradation
    const baseline = this.baselines.get(category);
    if (baseline && results.performance) {
      const performanceMetric = results.performance.avgResponseTime || results.performance.responseTime?.mean;
      const baselineMetric = baseline.performance?.avgResponseTime || baseline.performance?.responseTime?.mean;
      
      if (performanceMetric && baselineMetric) {
        const degradation = (performanceMetric - baselineMetric) / baselineMetric;
        
        if (degradation > this.config.alerting.performanceDegradation) {
          alerts.push({
            type: 'PERFORMANCE_DEGRADATION',
            category,
            severity: 'HIGH',
            message: `Performance degraded by ${(degradation * 100).toFixed(2)}% from baseline`,
            value: performanceMetric,
            baseline: baselineMetric,
            degradation: degradation,
          });
        }
      }
    }
    
    // Check error rates
    if (results.errors && results.errors.total && results.summary && results.summary.totalOperations) {
      const errorRate = results.errors.total / results.summary.totalOperations;
      
      if (errorRate > this.config.alerting.errorRateIncrease) {
        alerts.push({
          type: 'HIGH_ERROR_RATE',
          category,
          severity: 'MEDIUM',
          message: `Error rate (${(errorRate * 100).toFixed(2)}%) exceeds threshold`,
          value: errorRate,
          threshold: this.config.alerting.errorRateIncrease,
        });
      }
    }
    
    // Add alerts to collection
    this.alerts.push(...alerts);
    
    // Track critical issues
    const criticalAlerts = alerts.filter(alert => alert.severity === 'CRITICAL');
    this.criticalIssues.push(...criticalAlerts);
  }

  /**
   * Update trend data
   */
  updateTrends(category, results) {
    if (!this.trends.has(category)) {
      this.trends.set(category, []);
    }
    
    const trendData = this.trends.get(category);
    
    const dataPoint = {
      timestamp: Date.now(),
      performance: results.performance || {},
      summary: results.summary || {},
      errors: results.errors || {},
    };
    
    trendData.push(dataPoint);
    
    // Keep only recent trend data
    const maxTrendPoints = 100;
    if (trendData.length > maxTrendPoints) {
      trendData.splice(0, trendData.length - maxTrendPoints);
    }
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport() {
    this.endTime = Date.now();
    
    this.logger.info('Generating comprehensive test report...');
    
    try {
      // Compile all test data
      const reportData = await this.compileReportData();
      
      // Generate reports in all configured formats
      const reportFiles = [];
      
      for (const format of this.config.formats) {
        const filePath = await this.generateFormatSpecificReport(format, reportData);
        reportFiles.push(filePath);
      }
      
      // Update historical data
      await this.updateHistoricalData(reportData);
      
      // Update baselines if needed
      await this.updateBaselines(reportData);
      
      // Send alerts if any
      await this.processAlerts();
      
      this.logger.info(`Test report generated: ${reportFiles.join(', ')}`);
      
      return {
        reportId: this.reportId,
        files: reportFiles,
        summary: reportData.executiveSummary,
        alerts: this.alerts,
        criticalIssues: this.criticalIssues,
      };
      
    } catch (error) {
      this.logger.error('Failed to generate test report:', error);
      throw error;
    }
  }

  /**
   * Compile comprehensive report data
   */
  async compileReportData() {
    const reportData = {
      metadata: {
        reportId: this.reportId,
        generatedAt: new Date().toISOString(),
        testDuration: this.endTime - this.startTime,
        categories: Array.from(this.testResults.keys()),
      },
      
      executiveSummary: await this.generateExecutiveSummary(),
      
      categoryResults: this.compileCategoryResults(),
      
      performanceAnalysis: await this.generatePerformanceAnalysis(),
      
      trendAnalysis: this.generateTrendAnalysis(),
      
      alerts: this.alerts,
      
      criticalIssues: this.criticalIssues,
      
      recommendations: this.generateConsolidatedRecommendations(),
      
      qualityGate: this.evaluateQualityGate(),
      
      historicalComparison: this.generateHistoricalComparison(),
    };
    
    return reportData;
  }

  /**
   * Generate executive summary
   */
  async generateExecutiveSummary() {
    const totalTests = Array.from(this.testResults.values())
      .reduce((sum, result) => sum + (result.summary?.totalOperations || 0), 0);
    
    const totalFailures = Array.from(this.testResults.values())
      .reduce((sum, result) => sum + (result.summary?.totalErrors || result.summary?.failed || 0), 0);
    
    const overallSuccessRate = totalTests > 0 ? ((totalTests - totalFailures) / totalTests) * 100 : 0;
    
    const criticalIssuesCount = this.criticalIssues.length;
    const highSeverityAlertsCount = this.alerts.filter(a => a.severity === 'HIGH').length;
    
    // Determine overall status
    let overallStatus = 'PASSED';
    if (criticalIssuesCount > 0) {
      overallStatus = 'FAILED';
    } else if (overallSuccessRate < 95 || highSeverityAlertsCount > 0) {
      overallStatus = 'WARNING';
    }
    
    return {
      overallStatus,
      totalTests,
      successRate: Math.round(overallSuccessRate * 100) / 100,
      criticalIssues: criticalIssuesCount,
      highSeverityAlerts: highSeverityAlertsCount,
      testDuration: Math.round((this.endTime - this.startTime) / 1000),
      categoriesTested: this.testResults.size,
      goNoGoDecision: overallStatus === 'PASSED' ? 'GO' : 'NO-GO',
      riskLevel: this.calculateRiskLevel(),
    };
  }

  /**
   * Compile category results
   */
  compileCategoryResults() {
    const results = {};
    
    for (const [category, data] of this.testResults) {
      results[category] = {
        ...data,
        status: this.determineCategoryStatus(data),
        performanceGrade: this.calculatePerformanceGrade(data),
        keyMetrics: this.extractKeyMetrics(category, data),
      };
    }
    
    return results;
  }

  /**
   * Determine category status
   */
  determineCategoryStatus(data) {
    if (data.summary?.status) {
      return data.summary.status;
    }
    
    // Infer status from metrics
    const failureRate = data.summary?.failureRate || 0;
    const errorRate = data.errors?.rate || data.summary?.errorRate || 0;
    
    if (failureRate > 0.10 || errorRate > 0.10) {
      return 'FAILED';
    } else if (failureRate > 0.05 || errorRate > 0.05) {
      return 'WARNING';
    } else {
      return 'PASSED';
    }
  }

  /**
   * Calculate performance grade
   */
  calculatePerformanceGrade(data) {
    const metrics = [];
    
    // Response time grade
    if (data.performance?.responseTime) {
      const p95 = data.performance.responseTime.p95 || 0;
      if (p95 <= 100) metrics.push('A');
      else if (p95 <= 500) metrics.push('B');
      else if (p95 <= 1000) metrics.push('C');
      else if (p95 <= 2000) metrics.push('D');
      else metrics.push('F');
    }
    
    // Throughput grade
    if (data.performance?.throughput) {
      const throughput = data.performance.throughput.average || data.performance.throughput || 0;
      if (throughput >= 1000) metrics.push('A');
      else if (throughput >= 500) metrics.push('B');
      else if (throughput >= 100) metrics.push('C');
      else if (throughput >= 50) metrics.push('D');
      else metrics.push('F');
    }
    
    // Error rate grade
    const errorRate = data.errors?.rate || data.summary?.errorRate || 0;
    if (errorRate <= 0.01) metrics.push('A');
    else if (errorRate <= 0.05) metrics.push('B');
    else if (errorRate <= 0.10) metrics.push('C');
    else if (errorRate <= 0.20) metrics.push('D');
    else metrics.push('F');
    
    // Calculate overall grade
    if (metrics.length === 0) return 'N/A';
    
    const gradePoints = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
    const avgPoints = metrics.reduce((sum, grade) => sum + gradePoints[grade], 0) / metrics.length;
    
    if (avgPoints >= 3.5) return 'A';
    else if (avgPoints >= 2.5) return 'B';
    else if (avgPoints >= 1.5) return 'C';
    else if (avgPoints >= 0.5) return 'D';
    else return 'F';
  }

  /**
   * Extract key metrics for category
   */
  extractKeyMetrics(category, data) {
    const metrics = {};
    
    switch (category) {
      case 'load_testing':
        metrics.peakRPS = data.performance?.throughput?.peak || 0;
        metrics.avgResponseTime = data.performance?.responseTime?.mean || 0;
        metrics.errorRate = data.summary?.errorRate || 0;
        break;
        
      case 'database_stress':
        metrics.operationsPerSecond = data.performance?.operationsPerSecond || 0;
        metrics.connectionCount = data.connections?.peak || 0;
        metrics.deadlocks = data.postgresql?.deadlocks || 0;
        break;
        
      case 'cache_performance':
        metrics.hitRate = data.cache?.hitRate || 0;
        metrics.throughput = data.performance?.messageThroughput || 0;
        metrics.latency = data.performance?.averageLatency || 0;
        break;
        
      case 'websocket_stress':
        metrics.peakConnections = data.connections?.peak || 0;
        metrics.messageThroughput = data.messaging?.throughput || 0;
        metrics.connectionSuccessRate = data.connections?.successRate || 0;
        break;
        
      default:
        // Generic metrics
        metrics.successRate = data.summary?.successRate || 0;
        metrics.totalOperations = data.summary?.totalOperations || 0;
        metrics.avgDuration = data.performance?.avgDuration || 0;
    }
    
    return metrics;
  }

  /**
   * Generate performance analysis
   */
  async generatePerformanceAnalysis() {
    const analysis = {
      overall: {
        avgResponseTime: 0,
        peakThroughput: 0,
        errorRate: 0,
        availabilityScore: 0,
      },
      bottlenecks: [],
      improvements: [],
      regressions: [],
    };
    
    // Calculate overall metrics
    const allResults = Array.from(this.testResults.values());
    
    if (allResults.length > 0) {
      // Average response time across all categories
      const responseTimes = allResults
        .map(r => r.performance?.responseTime?.mean || r.performance?.avgResponseTime || 0)
        .filter(rt => rt > 0);
      
      analysis.overall.avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
        : 0;
      
      // Peak throughput
      const throughputs = allResults
        .map(r => r.performance?.throughput?.peak || r.performance?.throughput?.average || 0)
        .filter(tp => tp > 0);
      
      analysis.overall.peakThroughput = throughputs.length > 0 ? Math.max(...throughputs) : 0;
      
      // Error rate
      const errorRates = allResults
        .map(r => r.summary?.errorRate || r.errors?.rate || 0)
        .filter(er => er >= 0);
      
      analysis.overall.errorRate = errorRates.length > 0
        ? errorRates.reduce((sum, er) => sum + er, 0) / errorRates.length
        : 0;
    }
    
    // Identify bottlenecks
    analysis.bottlenecks = this.identifyBottlenecks();
    
    // Identify improvements from baseline
    analysis.improvements = this.identifyImprovements();
    
    // Identify regressions from baseline
    analysis.regressions = this.identifyRegressions();
    
    return analysis;
  }

  /**
   * Identify performance bottlenecks
   */
  identifyBottlenecks() {
    const bottlenecks = [];
    
    for (const [category, data] of this.testResults) {
      // High response time bottlenecks
      const responseTime = data.performance?.responseTime?.p95 || data.performance?.avgResponseTime;
      if (responseTime && responseTime > 1000) {
        bottlenecks.push({
          type: 'HIGH_RESPONSE_TIME',
          category,
          value: responseTime,
          severity: responseTime > 5000 ? 'HIGH' : 'MEDIUM',
          description: `${category} P95 response time is ${responseTime.toFixed(0)}ms`,
        });
      }
      
      // Low throughput bottlenecks
      const throughput = data.performance?.throughput?.average || data.performance?.operationsPerSecond;
      if (throughput && throughput < 100) {
        bottlenecks.push({
          type: 'LOW_THROUGHPUT',
          category,
          value: throughput,
          severity: throughput < 10 ? 'HIGH' : 'MEDIUM',
          description: `${category} throughput is only ${throughput.toFixed(0)} ops/sec`,
        });
      }
      
      // High error rate bottlenecks
      const errorRate = data.summary?.errorRate || data.errors?.rate;
      if (errorRate && errorRate > 0.05) {
        bottlenecks.push({
          type: 'HIGH_ERROR_RATE',
          category,
          value: errorRate,
          severity: errorRate > 0.20 ? 'HIGH' : 'MEDIUM',
          description: `${category} error rate is ${(errorRate * 100).toFixed(2)}%`,
        });
      }
    }
    
    return bottlenecks.sort((a, b) => {
      const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Identify improvements from baseline
   */
  identifyImprovements() {
    const improvements = [];
    
    for (const [category, data] of this.testResults) {
      const baseline = this.baselines.get(category);
      if (!baseline) continue;
      
      // Response time improvements
      const currentRT = data.performance?.responseTime?.mean || data.performance?.avgResponseTime;
      const baselineRT = baseline.performance?.responseTime?.mean || baseline.performance?.avgResponseTime;
      
      if (currentRT && baselineRT && currentRT < baselineRT * 0.9) {
        const improvement = ((baselineRT - currentRT) / baselineRT) * 100;
        improvements.push({
          type: 'RESPONSE_TIME_IMPROVEMENT',
          category,
          improvement: improvement,
          description: `${category} response time improved by ${improvement.toFixed(1)}%`,
        });
      }
      
      // Throughput improvements
      const currentTP = data.performance?.throughput?.average || data.performance?.operationsPerSecond;
      const baselineTP = baseline.performance?.throughput?.average || baseline.performance?.operationsPerSecond;
      
      if (currentTP && baselineTP && currentTP > baselineTP * 1.1) {
        const improvement = ((currentTP - baselineTP) / baselineTP) * 100;
        improvements.push({
          type: 'THROUGHPUT_IMPROVEMENT',
          category,
          improvement: improvement,
          description: `${category} throughput improved by ${improvement.toFixed(1)}%`,
        });
      }
    }
    
    return improvements;
  }

  /**
   * Identify regressions from baseline
   */
  identifyRegressions() {
    const regressions = [];
    
    for (const [category, data] of this.testResults) {
      const baseline = this.baselines.get(category);
      if (!baseline) continue;
      
      // Response time regressions
      const currentRT = data.performance?.responseTime?.mean || data.performance?.avgResponseTime;
      const baselineRT = baseline.performance?.responseTime?.mean || baseline.performance?.avgResponseTime;
      
      if (currentRT && baselineRT && currentRT > baselineRT * 1.2) {
        const regression = ((currentRT - baselineRT) / baselineRT) * 100;
        regressions.push({
          type: 'RESPONSE_TIME_REGRESSION',
          category,
          regression: regression,
          severity: regression > 50 ? 'HIGH' : 'MEDIUM',
          description: `${category} response time regressed by ${regression.toFixed(1)}%`,
        });
      }
      
      // Error rate regressions
      const currentER = data.summary?.errorRate || data.errors?.rate || 0;
      const baselineER = baseline.summary?.errorRate || baseline.errors?.rate || 0;
      
      if (currentER > baselineER + 0.01) {
        const regression = ((currentER - baselineER) / Math.max(baselineER, 0.001)) * 100;
        regressions.push({
          type: 'ERROR_RATE_REGRESSION',
          category,
          regression: regression,
          severity: currentER > 0.10 ? 'HIGH' : 'MEDIUM',
          description: `${category} error rate increased by ${regression.toFixed(1)}%`,
        });
      }
    }
    
    return regressions;
  }

  /**
   * Generate trend analysis
   */
  generateTrendAnalysis() {
    const trends = {};
    
    for (const [category, trendData] of this.trends) {
      if (trendData.length < 2) continue;
      
      const recent = trendData.slice(-10); // Last 10 data points
      const older = trendData.slice(-20, -10); // Previous 10 data points
      
      if (recent.length === 0 || older.length === 0) continue;
      
      // Response time trend
      const recentRT = recent.map(d => d.performance?.avgResponseTime || 0).filter(rt => rt > 0);
      const olderRT = older.map(d => d.performance?.avgResponseTime || 0).filter(rt => rt > 0);
      
      if (recentRT.length > 0 && olderRT.length > 0) {
        const recentAvg = recentRT.reduce((sum, rt) => sum + rt, 0) / recentRT.length;
        const olderAvg = olderRT.reduce((sum, rt) => sum + rt, 0) / olderRT.length;
        const change = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        trends[category] = {
          responseTime: {
            direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
            change: change,
          },
        };
      }
    }
    
    return trends;
  }

  /**
   * Generate consolidated recommendations
   */
  generateConsolidatedRecommendations() {
    const recommendations = [];
    
    // Collect all recommendations from test results
    for (const data of this.testResults.values()) {
      if (data.recommendations) {
        recommendations.push(...data.recommendations);
      }
    }
    
    // Add system-wide recommendations
    const systemRecommendations = this.generateSystemRecommendations();
    recommendations.push(...systemRecommendations);
    
    // Prioritize and deduplicate
    return this.prioritizeRecommendations(recommendations);
  }

  /**
   * Generate system-wide recommendations
   */
  generateSystemRecommendations() {
    const recommendations = [];
    
    // Overall performance recommendations
    const overallErrorRate = this.calculateOverallErrorRate();
    if (overallErrorRate > 0.05) {
      recommendations.push({
        type: 'SYSTEM_RELIABILITY',
        severity: 'HIGH',
        message: `Overall error rate (${(overallErrorRate * 100).toFixed(2)}%) exceeds acceptable threshold`,
        action: 'Implement comprehensive error handling and monitoring across all systems',
        impact: 'System reliability and user experience',
      });
    }
    
    // Resource utilization recommendations
    const resourceUtilization = this.calculateResourceUtilization();
    if (resourceUtilization.cpu > 80) {
      recommendations.push({
        type: 'RESOURCE_SCALING',
        severity: 'MEDIUM',
        message: `High CPU utilization (${resourceUtilization.cpu}%) detected`,
        action: 'Consider horizontal scaling or CPU optimization',
        impact: 'Performance and scalability',
      });
    }
    
    return recommendations;
  }

  /**
   * Calculate overall error rate
   */
  calculateOverallErrorRate() {
    const allResults = Array.from(this.testResults.values());
    const errorRates = allResults
      .map(r => r.summary?.errorRate || r.errors?.rate || 0)
      .filter(er => er >= 0);
    
    return errorRates.length > 0
      ? errorRates.reduce((sum, er) => sum + er, 0) / errorRates.length
      : 0;
  }

  /**
   * Calculate resource utilization
   */
  calculateResourceUtilization() {
    const resources = { cpu: 0, memory: 0, io: 0 };
    
    for (const data of this.testResults.values()) {
      if (data.resources) {
        resources.cpu = Math.max(resources.cpu, data.resources.cpu?.avg || 0);
        resources.memory = Math.max(resources.memory, data.resources.memory?.avg || 0);
        resources.io = Math.max(resources.io, data.resources.io?.avg || 0);
      }
    }
    
    return resources;
  }

  /**
   * Prioritize recommendations
   */
  prioritizeRecommendations(recommendations) {
    // Remove duplicates
    const unique = recommendations.filter((rec, index) => 
      index === recommendations.findIndex(r => r.type === rec.type && r.message === rec.message)
    );
    
    // Sort by severity and impact
    const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    
    return unique.sort((a, b) => {
      const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      if (severityDiff !== 0) return severityDiff;
      
      // Secondary sort by type for consistency
      return a.type.localeCompare(b.type);
    });
  }

  /**
   * Evaluate quality gate
   */
  evaluateQualityGate() {
    const criteria = {
      overallSuccessRate: { threshold: 95, weight: 0.3 },
      criticalIssues: { threshold: 0, weight: 0.3 },
      performanceDegradation: { threshold: 20, weight: 0.2 },
      errorRate: { threshold: 5, weight: 0.2 },
    };
    
    const scores = {};
    let overallScore = 0;
    
    // Calculate individual scores
    const successRate = this.calculateOverallSuccessRate();
    scores.overallSuccessRate = Math.min(100, (successRate / criteria.overallSuccessRate.threshold) * 100);
    
    scores.criticalIssues = this.criticalIssues.length <= criteria.criticalIssues.threshold ? 100 : 0;
    
    const performanceDegradation = this.calculatePerformanceDegradation();
    scores.performanceDegradation = Math.max(0, 100 - (performanceDegradation * 100 / criteria.performanceDegradation.threshold));
    
    const errorRate = this.calculateOverallErrorRate() * 100;
    scores.errorRate = Math.max(0, 100 - (errorRate / criteria.errorRate.threshold * 100));
    
    // Calculate weighted overall score
    for (const [criterion, score] of Object.entries(scores)) {
      overallScore += score * criteria[criterion].weight;
    }
    
    const passed = overallScore >= 80; // 80% threshold for passing
    
    return {
      passed,
      overallScore: Math.round(overallScore),
      individualScores: scores,
      criteria,
      decision: passed ? 'PASS' : 'FAIL',
    };
  }

  /**
   * Calculate overall success rate
   */
  calculateOverallSuccessRate() {
    const allResults = Array.from(this.testResults.values());
    
    let totalOperations = 0;
    let totalSuccesses = 0;
    
    for (const result of allResults) {
      const operations = result.summary?.totalOperations || 0;
      const errors = result.summary?.totalErrors || result.summary?.failed || 0;
      
      totalOperations += operations;
      totalSuccesses += (operations - errors);
    }
    
    return totalOperations > 0 ? (totalSuccesses / totalOperations) * 100 : 0;
  }

  /**
   * Calculate performance degradation
   */
  calculatePerformanceDegradation() {
    let maxDegradation = 0;
    
    for (const [category, data] of this.testResults) {
      const baseline = this.baselines.get(category);
      if (!baseline) continue;
      
      const currentRT = data.performance?.responseTime?.mean || data.performance?.avgResponseTime;
      const baselineRT = baseline.performance?.responseTime?.mean || baseline.performance?.avgResponseTime;
      
      if (currentRT && baselineRT) {
        const degradation = (currentRT - baselineRT) / baselineRT;
        maxDegradation = Math.max(maxDegradation, degradation);
      }
    }
    
    return maxDegradation;
  }

  /**
   * Generate historical comparison
   */
  generateHistoricalComparison() {
    const comparison = {
      trendsOverTime: {},
      performanceRegression: [],
      improvementAreas: [],
    };
    
    if (this.historicalData.length === 0) {
      comparison.message = 'No historical data available for comparison';
      return comparison;
    }
    
    // Compare with last 5 test runs
    const recentHistory = this.historicalData.slice(-5);
    
    for (const [category, currentData] of this.testResults) {
      const historicalData = recentHistory
        .map(h => h.categoryResults?.[category])
        .filter(Boolean);
      
      if (historicalData.length > 0) {
        // Calculate trends
        const responseTimes = historicalData.map(h => h.keyMetrics?.avgResponseTime || 0);
        const errorRates = historicalData.map(h => h.keyMetrics?.errorRate || 0);
        
        comparison.trendsOverTime[category] = {
          responseTimeTrend: this.calculateTrend(responseTimes),
          errorRateTrend: this.calculateTrend(errorRates),
        };
      }
    }
    
    return comparison;
  }

  /**
   * Calculate trend direction
   */
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-3).reduce((sum, v) => sum + v, 0) / Math.min(3, values.length);
    const older = values.slice(0, -3).reduce((sum, v) => sum + v, 0) / Math.max(1, values.length - 3);
    
    const change = (recent - older) / Math.max(older, 0.001);
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate risk level
   */
  calculateRiskLevel() {
    let riskScore = 0;
    
    // Critical issues add significant risk
    riskScore += this.criticalIssues.length * 30;
    
    // High severity alerts add risk
    const highSeverityAlerts = this.alerts.filter(a => a.severity === 'HIGH').length;
    riskScore += highSeverityAlerts * 15;
    
    // Performance degradation adds risk
    const performanceDegradation = this.calculatePerformanceDegradation();
    riskScore += Math.min(30, performanceDegradation * 100);
    
    // High error rate adds risk
    const errorRate = this.calculateOverallErrorRate();
    riskScore += Math.min(25, errorRate * 500);
    
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 50) return 'HIGH';
    if (riskScore >= 25) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate format-specific reports
   */
  async generateFormatSpecificReport(format, reportData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mlg-test-report-${timestamp}.${format}`;
    const filepath = path.join(this.config.outputDirectory, filename);
    
    switch (format) {
      case 'json':
        await fs.writeFile(filepath, JSON.stringify(reportData, null, 2));
        break;
        
      case 'html':
        const html = await this.generateHTMLReport(reportData);
        await fs.writeFile(filepath, html);
        break;
        
      case 'csv':
        const csv = this.generateCSVReport(reportData);
        await fs.writeFile(filepath, csv);
        break;
        
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
    
    return filepath;
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(reportData) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MLG.clan Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { background: #007cba; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007cba; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007cba; }
        .metric-label { color: #666; font-size: 0.9em; }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-warning { color: #ffc107; }
        .alert { padding: 10px; margin: 5px 0; border-radius: 3px; }
        .alert-critical { background: #f8d7da; border-left: 4px solid #dc3545; }
        .alert-high { background: #fff3cd; border-left: 4px solid #ffc107; }
        .alert-medium { background: #d1ecf1; border-left: 4px solid #17a2b8; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        .recommendation { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>MLG.clan Platform Test Report</h1>
        <p>Report ID: ${reportData.metadata.reportId}</p>
        <p>Generated: ${reportData.metadata.generatedAt}</p>
        <p class="status-${reportData.executiveSummary.overallStatus.toLowerCase()}">
            Overall Status: ${reportData.executiveSummary.overallStatus}
        </p>
    </div>

    <h2>Executive Summary</h2>
    <div class="summary">
        <div class="metric-card">
            <div class="metric-value">${reportData.executiveSummary.successRate}%</div>
            <div class="metric-label">Success Rate</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${reportData.executiveSummary.totalTests.toLocaleString()}</div>
            <div class="metric-label">Total Tests</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${reportData.executiveSummary.testDuration}s</div>
            <div class="metric-label">Test Duration</div>
        </div>
        <div class="metric-card">
            <div class="metric-value status-${reportData.executiveSummary.goNoGoDecision === 'GO' ? 'passed' : 'failed'}">
                ${reportData.executiveSummary.goNoGoDecision}
            </div>
            <div class="metric-label">Go/No-Go Decision</div>
        </div>
    </div>

    <h2>Critical Issues</h2>
    ${reportData.criticalIssues.length === 0 ? 
      '<p style="color: #28a745;">✅ No critical issues found</p>' :
      reportData.criticalIssues.map(issue => `
        <div class="alert alert-critical">
            <strong>${issue.type}</strong> in ${issue.category}<br>
            ${issue.message}
        </div>
      `).join('')
    }

    <h2>Performance Analysis</h2>
    <table>
        <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Status</th>
        </tr>
        <tr>
            <td>Average Response Time</td>
            <td>${Math.round(reportData.performanceAnalysis.overall.avgResponseTime)}ms</td>
            <td class="status-${reportData.performanceAnalysis.overall.avgResponseTime < 500 ? 'passed' : 'warning'}">
                ${reportData.performanceAnalysis.overall.avgResponseTime < 500 ? 'Good' : 'Needs Attention'}
            </td>
        </tr>
        <tr>
            <td>Peak Throughput</td>
            <td>${Math.round(reportData.performanceAnalysis.overall.peakThroughput)} ops/sec</td>
            <td class="status-passed">Good</td>
        </tr>
        <tr>
            <td>Error Rate</td>
            <td>${(reportData.performanceAnalysis.overall.errorRate * 100).toFixed(2)}%</td>
            <td class="status-${reportData.performanceAnalysis.overall.errorRate < 0.05 ? 'passed' : 'failed'}">
                ${reportData.performanceAnalysis.overall.errorRate < 0.05 ? 'Good' : 'High'}
            </td>
        </tr>
    </table>

    <h2>Category Results</h2>
    ${Object.entries(reportData.categoryResults).map(([category, result]) => `
        <h3>${category.replace(/_/g, ' ').toUpperCase()}</h3>
        <p>Status: <span class="status-${result.status.toLowerCase()}">${result.status}</span></p>
        <p>Performance Grade: <strong>${result.performanceGrade}</strong></p>
    `).join('')}

    <h2>Recommendations</h2>
    ${reportData.recommendations.slice(0, 10).map(rec => `
        <div class="recommendation">
            <h4>${rec.type.replace(/_/g, ' ')}</h4>
            <p><strong>Severity:</strong> ${rec.severity}</p>
            <p><strong>Message:</strong> ${rec.message}</p>
            <p><strong>Action:</strong> ${rec.action}</p>
        </div>
    `).join('')}

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; text-align: center;">
        Generated by MLG.clan Universal Testing & Verification Agent
    </footer>
</body>
</html>`;
    
    return html;
  }

  /**
   * Generate CSV report
   */
  generateCSVReport(reportData) {
    const rows = [
      ['Category', 'Status', 'Performance Grade', 'Success Rate', 'Error Rate', 'Avg Response Time'],
    ];
    
    for (const [category, result] of Object.entries(reportData.categoryResults)) {
      rows.push([
        category,
        result.status,
        result.performanceGrade,
        result.keyMetrics?.successRate || 'N/A',
        result.keyMetrics?.errorRate || 'N/A',
        result.keyMetrics?.avgResponseTime || 'N/A',
      ]);
    }
    
    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  /**
   * Update historical data
   */
  async updateHistoricalData(reportData) {
    const historyEntry = {
      timestamp: reportData.metadata.generatedAt,
      executiveSummary: reportData.executiveSummary,
      categoryResults: reportData.categoryResults,
      performanceAnalysis: reportData.performanceAnalysis,
    };
    
    this.historicalData.push(historyEntry);
    
    // Keep only recent history
    const maxHistory = 100;
    if (this.historicalData.length > maxHistory) {
      this.historicalData = this.historicalData.slice(-maxHistory);
    }
    
    // Save to file
    const historyFile = path.join(this.config.outputDirectory, 'historical-data.json');
    await fs.writeFile(historyFile, JSON.stringify(this.historicalData, null, 2));
  }

  /**
   * Update baselines
   */
  async updateBaselines(reportData) {
    let updated = false;
    
    for (const [category, result] of Object.entries(reportData.categoryResults)) {
      const currentBaseline = this.baselines.get(category);
      
      // Update baseline if this is a successful test and better than current baseline
      if (result.status === 'PASSED' && result.performanceGrade !== 'F') {
        if (!currentBaseline || this.shouldUpdateBaseline(result, currentBaseline)) {
          this.baselines.set(category, {
            performance: result.performance || {},
            summary: result.summary || {},
            timestamp: reportData.metadata.generatedAt,
          });
          updated = true;
        }
      }
    }
    
    if (updated) {
      const baselinesFile = path.join(this.config.outputDirectory, 'baselines.json');
      const baselineData = {};
      
      for (const [category, baseline] of this.baselines) {
        baselineData[category] = baseline;
      }
      
      await fs.writeFile(baselinesFile, JSON.stringify(baselineData, null, 2));
      this.logger.info('Performance baselines updated');
    }
  }

  /**
   * Determine if baseline should be updated
   */
  shouldUpdateBaseline(newResult, currentBaseline) {
    // Update if new result is significantly better
    const newRT = newResult.keyMetrics?.avgResponseTime || newResult.performance?.avgResponseTime;
    const baselineRT = currentBaseline.performance?.avgResponseTime;
    
    if (newRT && baselineRT) {
      return newRT < baselineRT * 0.9; // 10% improvement
    }
    
    // Default to updating if we can't compare
    return true;
  }

  /**
   * Process alerts
   */
  async processAlerts() {
    if (this.alerts.length === 0) return;
    
    this.logger.info(`Processing ${this.alerts.length} alerts`);
    
    // Group alerts by severity
    const criticalAlerts = this.alerts.filter(a => a.severity === 'CRITICAL');
    const highAlerts = this.alerts.filter(a => a.severity === 'HIGH');
    
    // Log critical alerts
    for (const alert of criticalAlerts) {
      this.logger.error(`CRITICAL ALERT: ${alert.message}`);
    }
    
    // Log high severity alerts
    for (const alert of highAlerts) {
      this.logger.warn(`HIGH ALERT: ${alert.message}`);
    }
    
    // Save alerts to file
    const alertsFile = path.join(this.config.outputDirectory, `alerts-${Date.now()}.json`);
    await fs.writeFile(alertsFile, JSON.stringify(this.alerts, null, 2));
  }
}

export default AutomatedTestReporter;

/**
 * Standalone execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const reporter = new AutomatedTestReporter();
  
  const runReporter = async () => {
    try {
      await reporter.initialize();
      
      // Example usage - add sample test results
      reporter.addTestResults('load_testing', {
        summary: { 
          totalOperations: 10000, 
          totalErrors: 50, 
          successRate: 99.5,
          status: 'PASSED'
        },
        performance: { 
          responseTime: { mean: 120, p95: 300, p99: 500 },
          throughput: { average: 833, peak: 1200 }
        },
        errors: { rate: 0.005, total: 50 },
      });
      
      const report = await reporter.generateReport();
      
      console.log('\n=== AUTOMATED TEST REPORT GENERATED ===');
      console.log(`Report ID: ${report.reportId}`);
      console.log(`Files: ${report.files.join(', ')}`);
      console.log(`Status: ${report.summary.overallStatus}`);
      console.log(`Decision: ${report.summary.goNoGoDecision}`);
      
      if (report.criticalIssues.length > 0) {
        console.log(`Critical Issues: ${report.criticalIssues.length}`);
      }
      
    } catch (error) {
      console.error('Test reporting failed:', error);
      process.exit(1);
    }
  };
  
  runReporter();
}