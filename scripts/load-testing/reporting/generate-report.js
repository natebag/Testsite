#!/usr/bin/env node

/**
 * MLG.clan Gaming Platform - Comprehensive Load Test Reporting
 * Unified reporting system for all load testing components
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MLGLoadTestReporter {
  constructor(options = {}) {
    this.options = {
      reportsDir: options.reportsDir || path.join(__dirname, '..', 'reports'),
      outputDir: options.outputDir || path.join(__dirname, '..', 'reports', 'consolidated'),
      includeDashboard: options.includeDashboard !== false,
      includeMetrics: options.includeMetrics !== false,
      format: options.format || 'both', // 'json', 'html', 'both'
      ...options
    };

    this.reportData = {
      timestamp: new Date().toISOString(),
      testSuite: 'MLG.clan Load Testing Suite',
      version: '1.0.0',
      summary: {},
      components: {},
      aggregatedMetrics: {},
      performanceGrades: {},
      recommendations: [],
      scalabilityAnalysis: {},
      riskAssessment: {}
    };
  }

  async generateConsolidatedReport() {
    console.log('📋 Generating MLG.clan Comprehensive Load Test Report');
    console.log(`📂 Scanning reports in: ${this.options.reportsDir}`);

    try {
      // Ensure output directory exists
      await fs.mkdir(this.options.outputDir, { recursive: true });

      // Collect all test reports
      await this.collectTestReports();

      // Analyze and aggregate data
      await this.analyzeTestResults();

      // Generate performance grades
      await this.generatePerformanceGrades();

      // Perform scalability analysis
      await this.performScalabilityAnalysis();

      // Generate risk assessment
      await this.generateRiskAssessment();

      // Generate consolidated recommendations
      await this.generateConsolidatedRecommendations();

      // Generate final reports
      await this.generateFinalReports();

      console.log('✅ Comprehensive load test report generated successfully');

    } catch (error) {
      console.error('❌ Report generation failed:', error);
      throw error;
    }
  }

  async collectTestReports() {
    console.log('📊 Collecting test reports...');

    const reportTypes = {
      k6: 'k6',
      artillery: 'artillery', 
      solana: 'solana',
      database: 'database',
      websocket: 'websocket',
      monitoring: 'monitoring'
    };

    for (const [type, directory] of Object.entries(reportTypes)) {
      try {
        const reportPath = path.join(this.options.reportsDir, directory);
        const reports = await this.findLatestReports(reportPath);
        
        if (reports.length > 0) {
          this.reportData.components[type] = await this.processComponentReports(type, reports);
          console.log(`  ✅ ${type}: ${reports.length} reports processed`);
        } else {
          console.log(`  ⚠️  ${type}: No reports found`);
        }
        
      } catch (error) {
        console.log(`  ❌ ${type}: Failed to collect reports - ${error.message}`);
      }
    }
  }

  async findLatestReports(reportPath) {
    try {
      const files = await fs.readdir(reportPath);
      const jsonReports = files
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(reportPath, file),
          timestamp: this.extractTimestampFromFilename(file)
        }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3); // Get latest 3 reports

      return jsonReports;
    } catch (error) {
      return [];
    }
  }

  extractTimestampFromFilename(filename) {
    const match = filename.match(/(\d{13})/); // 13-digit timestamp
    return match ? parseInt(match[1]) : 0;
  }

  async processComponentReports(type, reports) {
    const componentData = {
      reportCount: reports.length,
      latestReport: null,
      summary: {},
      trends: {},
      issues: []
    };

    if (reports.length === 0) return componentData;

    // Process latest report
    try {
      const latestReportData = await fs.readFile(reports[0].path, 'utf8');
      componentData.latestReport = JSON.parse(latestReportData);
      
      // Extract key metrics based on component type
      componentData.summary = this.extractComponentSummary(type, componentData.latestReport);
      
      // Analyze trends if multiple reports available
      if (reports.length > 1) {
        componentData.trends = await this.analyzeTrends(type, reports);
      }

      // Identify issues
      componentData.issues = this.identifyComponentIssues(type, componentData.latestReport);

    } catch (error) {
      console.error(`Failed to process ${type} reports:`, error.message);
    }

    return componentData;
  }

  extractComponentSummary(type, reportData) {
    switch (type) {
      case 'k6':
        return {
          totalRequests: reportData.summary?.totalTransactions || 0,
          successRate: reportData.summary?.successRate || '0%',
          avgResponseTime: reportData.performance?.responseTimePercentiles?.p50 || '0ms',
          p95ResponseTime: reportData.performance?.responseTimePercentiles?.p95 || '0ms',
          throughput: reportData.summary?.averageTransactionsPerSecond || '0',
          errors: reportData.errors || {}
        };

      case 'artillery':
        return {
          scenarios: reportData.tests?.length || 0,
          wsConnections: reportData.summary?.webSocketConnections || 0,
          messagesProcessed: reportData.summary?.messagesProcessed || 0,
          avgLatency: reportData.performance?.avgLatency || '0ms',
          successRate: reportData.summary?.successRate || '0%'
        };

      case 'solana':
        return {
          totalTransactions: reportData.summary?.totalTransactions || 0,
          successRate: reportData.summary?.successRate || '0%',
          avgConfirmationTime: reportData.summary?.averageConfirmationTime || '0ms',
          throughputTPS: reportData.summary?.averageTransactionsPerSecond || '0',
          rpcCalls: reportData.summary?.totalRpcCalls || 0,
          errors: reportData.errors || {}
        };

      case 'database':
        return {
          totalQueries: reportData.summary?.totalQueries || 0,
          successRate: reportData.summary?.successRate || '0%',
          avgQueryTime: reportData.performance?.responseTimePercentiles?.p50 || '0ms',
          queriesPerSecond: reportData.summary?.averageQueriesPerSecond || '0',
          lockWaits: reportData.summary?.lockWaits || 0,
          deadlocks: reportData.summary?.deadlocks || 0,
          connectionUtilization: reportData.performance?.connectionUtilization || {}
        };

      case 'websocket':
        return {
          targetConnections: reportData.summary?.targetConnections || 0,
          successfulConnections: reportData.summary?.successfulConnections || 0,
          connectionSuccessRate: reportData.summary?.connectionSuccessRate || '0%',
          messagesReceived: reportData.summary?.totalMessagesReceived || 0,
          messagesSent: reportData.summary?.totalMessagesSent || 0,
          avgConnectionLatency: reportData.performance?.connectionLatency?.average || '0ms',
          avgMessageLatency: reportData.performance?.messageLatency?.average || '0ms',
          disconnections: reportData.summary?.disconnections || 0
        };

      case 'monitoring':
        return {
          duration: reportData.duration || 0,
          totalAlerts: reportData.summary?.totalAlerts || 0,
          criticalAlerts: reportData.summary?.criticalAlerts || 0,
          warningAlerts: reportData.summary?.warningAlerts || 0,
          systemHealthScore: reportData.summary?.systemHealthScore || 0,
          avgVotingLatency: reportData.summary?.averageVotingLatency || 0,
          avgApiResponseTime: reportData.summary?.averageApiResponseTime || 0,
          peakWebSocketConnections: reportData.summary?.peakWebSocketConnections || 0
        };

      default:
        return {};
    }
  }

  async analyzeTrends(type, reports) {
    // Analyze trends across multiple reports
    const trends = {
      performance: 'stable',
      reliability: 'stable',
      throughput: 'stable',
      issues: []
    };

    try {
      // Load multiple reports and compare key metrics
      const reportData = await Promise.all(
        reports.slice(0, 3).map(async report => {
          const data = await fs.readFile(report.path, 'utf8');
          return JSON.parse(data);
        })
      );

      // Analyze performance trends
      trends.performance = this.analyzePerformanceTrend(type, reportData);
      trends.reliability = this.analyzeReliabilityTrend(type, reportData);
      trends.throughput = this.analyzeThroughputTrend(type, reportData);

    } catch (error) {
      trends.issues.push(`Failed to analyze trends: ${error.message}`);
    }

    return trends;
  }

  analyzePerformanceTrend(type, reports) {
    if (reports.length < 2) return 'insufficient_data';

    // Extract response times from reports
    const responseTimes = reports.map(report => {
      switch (type) {
        case 'k6':
          return this.parseTime(report.performance?.responseTimePercentiles?.p95);
        case 'database':
          return this.parseTime(report.performance?.responseTimePercentiles?.p95);
        case 'websocket':
          return this.parseTime(report.performance?.messageLatency?.average);
        case 'solana':
          return this.parseTime(report.summary?.averageConfirmationTime);
        default:
          return 0;
      }
    }).filter(time => time > 0);

    if (responseTimes.length < 2) return 'insufficient_data';

    const latest = responseTimes[0];
    const previous = responseTimes[1];
    const change = (latest - previous) / previous;

    if (change > 0.2) return 'degrading';
    if (change > 0.1) return 'slightly_degrading';
    if (change < -0.1) return 'improving';
    return 'stable';
  }

  analyzeReliabilityTrend(type, reports) {
    if (reports.length < 2) return 'insufficient_data';

    const successRates = reports.map(report => {
      switch (type) {
        case 'k6':
        case 'database':
        case 'solana':
          return this.parsePercentage(report.summary?.successRate);
        case 'websocket':
          return this.parsePercentage(report.summary?.connectionSuccessRate);
        default:
          return 100;
      }
    }).filter(rate => rate >= 0);

    if (successRates.length < 2) return 'insufficient_data';

    const latest = successRates[0];
    const previous = successRates[1];
    const change = latest - previous;

    if (change < -5) return 'degrading';
    if (change < -2) return 'slightly_degrading';
    if (change > 2) return 'improving';
    return 'stable';
  }

  analyzeThroughputTrend(type, reports) {
    if (reports.length < 2) return 'insufficient_data';

    const throughputs = reports.map(report => {
      switch (type) {
        case 'k6':
          return parseFloat(report.summary?.averageTransactionsPerSecond || 0);
        case 'database':
          return parseFloat(report.summary?.averageQueriesPerSecond || 0);
        case 'solana':
          return parseFloat(report.summary?.averageTransactionsPerSecond || 0);
        case 'websocket':
          return parseFloat(report.summary?.messagesPerSecond || 0);
        default:
          return 0;
      }
    }).filter(tp => tp > 0);

    if (throughputs.length < 2) return 'insufficient_data';

    const latest = throughputs[0];
    const previous = throughputs[1];
    const change = (latest - previous) / previous;

    if (change < -0.15) return 'degrading';
    if (change < -0.05) return 'slightly_degrading';
    if (change > 0.1) return 'improving';
    return 'stable';
  }

  identifyComponentIssues(type, reportData) {
    const issues = [];

    switch (type) {
      case 'k6':
        if (this.parsePercentage(reportData.summary?.successRate) < 95) {
          issues.push({ severity: 'high', message: 'API success rate below 95%' });
        }
        if (this.parseTime(reportData.performance?.responseTimePercentiles?.p95) > 1000) {
          issues.push({ severity: 'medium', message: 'P95 response time above 1 second' });
        }
        break;

      case 'database':
        if (reportData.summary?.lockWaits > 10) {
          issues.push({ severity: 'high', message: 'High database lock contention detected' });
        }
        if (reportData.summary?.deadlocks > 0) {
          issues.push({ severity: 'critical', message: 'Database deadlocks detected' });
        }
        break;

      case 'websocket':
        if (this.parsePercentage(reportData.summary?.connectionSuccessRate) < 90) {
          issues.push({ severity: 'high', message: 'WebSocket connection success rate below 90%' });
        }
        if (reportData.summary?.disconnections > reportData.summary?.successfulConnections * 0.1) {
          issues.push({ severity: 'medium', message: 'High WebSocket disconnection rate' });
        }
        break;

      case 'solana':
        if (this.parsePercentage(reportData.summary?.successRate) < 95) {
          issues.push({ severity: 'high', message: 'Solana transaction success rate below 95%' });
        }
        if (this.parseTime(reportData.summary?.averageConfirmationTime) > 3000) {
          issues.push({ severity: 'medium', message: 'Solana confirmation time above 3 seconds' });
        }
        break;

      case 'monitoring':
        if (reportData.summary?.criticalAlerts > 0) {
          issues.push({ severity: 'critical', message: `${reportData.summary.criticalAlerts} critical alerts detected` });
        }
        if (reportData.summary?.systemHealthScore < 80) {
          issues.push({ severity: 'medium', message: 'System health score below 80%' });
        }
        break;
    }

    return issues;
  }

  async analyzeTestResults() {
    console.log('🔍 Analyzing aggregated test results...');

    this.reportData.aggregatedMetrics = {
      totalRequests: 0,
      totalTransactions: 0,
      overallSuccessRate: 0,
      averageResponseTime: 0,
      peakConcurrency: 0,
      totalErrors: 0,
      systemStability: 'unknown',
      scalabilityScore: 0
    };

    // Aggregate metrics from all components
    Object.entries(this.reportData.components).forEach(([type, componentData]) => {
      if (!componentData.latestReport) return;

      const summary = componentData.summary;

      // Add to total requests/transactions
      this.reportData.aggregatedMetrics.totalRequests += 
        parseInt(summary.totalRequests || summary.totalQueries || summary.totalTransactions || 0);

      // Track peak concurrency
      if (type === 'k6' && summary.throughput) {
        this.reportData.aggregatedMetrics.peakConcurrency += parseFloat(summary.throughput);
      }

      // Count total errors
      if (summary.errors && typeof summary.errors === 'object') {
        this.reportData.aggregatedMetrics.totalErrors += 
          Object.values(summary.errors).reduce((sum, count) => sum + (count || 0), 0);
      }
    });

    // Calculate overall system stability
    this.reportData.aggregatedMetrics.systemStability = this.calculateSystemStability();
    this.reportData.aggregatedMetrics.scalabilityScore = this.calculateScalabilityScore();

    // Generate overall summary
    this.generateOverallSummary();
  }

  calculateSystemStability() {
    const components = Object.values(this.reportData.components);
    if (components.length === 0) return 'unknown';

    const criticalIssues = components.reduce((count, comp) => 
      count + (comp.issues?.filter(i => i.severity === 'critical').length || 0), 0
    );

    const highIssues = components.reduce((count, comp) => 
      count + (comp.issues?.filter(i => i.severity === 'high').length || 0), 0
    );

    if (criticalIssues > 0) return 'critical';
    if (highIssues > 2) return 'unstable';
    if (highIssues > 0) return 'concerning';
    return 'stable';
  }

  calculateScalabilityScore() {
    let score = 100;

    // Deduct points for each identified issue
    Object.values(this.reportData.components).forEach(comp => {
      if (!comp.issues) return;
      
      comp.issues.forEach(issue => {
        switch (issue.severity) {
          case 'critical': score -= 25; break;
          case 'high': score -= 15; break;
          case 'medium': score -= 10; break;
          case 'low': score -= 5; break;
        }
      });
    });

    return Math.max(0, score);
  }

  generateOverallSummary() {
    const hasK6 = this.reportData.components.k6?.summary;
    const hasDatabase = this.reportData.components.database?.summary;
    const hasWebSocket = this.reportData.components.websocket?.summary;
    const hasSolana = this.reportData.components.solana?.summary;
    const hasMonitoring = this.reportData.components.monitoring?.summary;

    this.reportData.summary = {
      testingSuite: 'MLG.clan Gaming Platform Load Testing',
      componentsTestedCount: Object.keys(this.reportData.components).length,
      overallHealthScore: this.reportData.aggregatedMetrics.scalabilityScore,
      systemStability: this.reportData.aggregatedMetrics.systemStability,
      readinessForProduction: this.assessProductionReadiness(),
      
      keyMetrics: {
        apiPerformance: hasK6 ? {
          successRate: hasK6.successRate,
          avgResponseTime: hasK6.avgResponseTime,
          p95ResponseTime: hasK6.p95ResponseTime,
          throughput: hasK6.throughput
        } : null,

        databasePerformance: hasDatabase ? {
          successRate: hasDatabase.successRate,
          avgQueryTime: hasDatabase.avgQueryTime,
          queriesPerSecond: hasDatabase.queriesPerSecond,
          lockWaits: hasDatabase.lockWaits
        } : null,

        webSocketPerformance: hasWebSocket ? {
          connectionSuccessRate: hasWebSocket.connectionSuccessRate,
          messagesProcessed: hasWebSocket.messagesReceived + hasWebSocket.messagesSent,
          avgLatency: hasWebSocket.avgMessageLatency
        } : null,

        blockchainPerformance: hasSolana ? {
          successRate: hasSolana.successRate,
          avgConfirmationTime: hasSolana.avgConfirmationTime,
          throughputTPS: hasSolana.throughputTPS
        } : null,

        systemMonitoring: hasMonitoring ? {
          healthScore: hasMonitoring.systemHealthScore,
          totalAlerts: hasMonitoring.totalAlerts,
          criticalAlerts: hasMonitoring.criticalAlerts
        } : null
      },

      scalabilityLimits: this.identifyScalabilityLimits(),
      criticalIssuesCount: this.countCriticalIssues(),
      recommendedMaxUsers: this.calculateRecommendedMaxUsers()
    };
  }

  assessProductionReadiness() {
    const stability = this.reportData.aggregatedMetrics.systemStability;
    const healthScore = this.reportData.aggregatedMetrics.scalabilityScore;
    const criticalIssues = this.countCriticalIssues();

    if (criticalIssues > 0) return 'not_ready';
    if (stability === 'critical' || stability === 'unstable') return 'not_ready';
    if (healthScore < 70) return 'needs_improvements';
    if (healthScore < 85) return 'ready_with_monitoring';
    return 'production_ready';
  }

  identifyScalabilityLimits() {
    const limits = [];

    // Analyze each component for bottlenecks
    if (this.reportData.components.database) {
      const db = this.reportData.components.database.summary;
      if (db.lockWaits > 5) {
        limits.push('Database lock contention under high concurrent writes');
      }
    }

    if (this.reportData.components.websocket) {
      const ws = this.reportData.components.websocket.summary;
      if (this.parsePercentage(ws.connectionSuccessRate) < 95) {
        limits.push('WebSocket connection handling under high concurrency');
      }
    }

    if (this.reportData.components.solana) {
      const sol = this.reportData.components.solana.summary;
      if (this.parseTime(sol.avgConfirmationTime) > 2000) {
        limits.push('Solana transaction confirmation times during network congestion');
      }
    }

    return limits.length > 0 ? limits : ['No significant scalability limits identified'];
  }

  countCriticalIssues() {
    return Object.values(this.reportData.components).reduce((count, comp) =>
      count + (comp.issues?.filter(i => i.severity === 'critical').length || 0), 0
    );
  }

  calculateRecommendedMaxUsers() {
    // Conservative estimate based on test results
    let maxUsers = 1000; // Default baseline

    // Adjust based on component performance
    if (this.reportData.components.k6?.summary) {
      const throughput = parseFloat(this.reportData.components.k6.summary.throughput) || 0;
      if (throughput > 0) {
        maxUsers = Math.min(maxUsers, Math.floor(throughput * 10)); // 10 requests per user estimate
      }
    }

    if (this.reportData.components.database?.summary) {
      const qps = parseFloat(this.reportData.components.database.summary.queriesPerSecond) || 0;
      if (qps > 0) {
        maxUsers = Math.min(maxUsers, Math.floor(qps * 5)); // 5 queries per user estimate
      }
    }

    // Apply safety factor based on stability
    const stability = this.reportData.aggregatedMetrics.systemStability;
    switch (stability) {
      case 'critical':
      case 'unstable':
        maxUsers = Math.floor(maxUsers * 0.5);
        break;
      case 'concerning':
        maxUsers = Math.floor(maxUsers * 0.7);
        break;
      case 'stable':
        maxUsers = Math.floor(maxUsers * 0.8);
        break;
    }

    return Math.max(100, maxUsers); // Minimum 100 users
  }

  async generatePerformanceGrades() {
    console.log('📊 Generating performance grades...');

    this.reportData.performanceGrades = {
      overall: 'C',
      components: {},
      criteria: {
        'A': 'Excellent - Production ready with high confidence',
        'B': 'Good - Production ready with monitoring', 
        'C': 'Average - Needs improvements before production',
        'D': 'Below Average - Significant issues to address',
        'F': 'Failing - Not suitable for production'
      }
    };

    // Grade each component
    Object.entries(this.reportData.components).forEach(([type, componentData]) => {
      this.reportData.performanceGrades.components[type] = this.gradeComponent(type, componentData);
    });

    // Calculate overall grade
    const componentGrades = Object.values(this.reportData.performanceGrades.components);
    const avgGrade = this.calculateAverageGrade(componentGrades);
    this.reportData.performanceGrades.overall = avgGrade;
  }

  gradeComponent(type, componentData) {
    if (!componentData.summary) return 'F';

    let score = 100;
    const issues = componentData.issues || [];

    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': score -= 40; break;
        case 'high': score -= 25; break;
        case 'medium': score -= 15; break;
        case 'low': score -= 5; break;
      }
    });

    // Component-specific scoring
    switch (type) {
      case 'k6':
        if (this.parsePercentage(componentData.summary.successRate) < 95) score -= 20;
        if (this.parseTime(componentData.summary.p95ResponseTime) > 1000) score -= 15;
        break;

      case 'database':
        if (componentData.summary.lockWaits > 0) score -= 10;
        if (componentData.summary.deadlocks > 0) score -= 30;
        break;

      case 'websocket':
        if (this.parsePercentage(componentData.summary.connectionSuccessRate) < 95) score -= 20;
        if (componentData.summary.disconnections > 0) score -= 10;
        break;

      case 'solana':
        if (this.parseTime(componentData.summary.avgConfirmationTime) > 3000) score -= 20;
        if (this.parsePercentage(componentData.summary.successRate) < 95) score -= 25;
        break;
    }

    return this.scoreToGrade(Math.max(0, score));
  }

  scoreToGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B'; 
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  calculateAverageGrade(grades) {
    const gradeValues = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
    const valueToGrade = { 4: 'A', 3: 'B', 2: 'C', 1: 'D', 0: 'F' };

    const avgValue = grades.reduce((sum, grade) => sum + gradeValues[grade], 0) / grades.length;
    return valueToGrade[Math.round(avgValue)] || 'C';
  }

  async performScalabilityAnalysis() {
    console.log('📈 Performing scalability analysis...');

    this.reportData.scalabilityAnalysis = {
      currentCapacity: this.calculateCurrentCapacity(),
      bottlenecks: this.identifyBottlenecks(),
      scalingRecommendations: this.generateScalingRecommendations(),
      resourceUtilization: this.analyzeResourceUtilization(),
      projectedLimits: this.projectScalingLimits()
    };
  }

  calculateCurrentCapacity() {
    const k6Data = this.reportData.components.k6?.summary;
    const dbData = this.reportData.components.database?.summary;
    const wsData = this.reportData.components.websocket?.summary;

    return {
      concurrentUsers: this.reportData.summary.recommendedMaxUsers,
      apiRequestsPerSecond: k6Data ? parseFloat(k6Data.throughput) : 0,
      databaseQPS: dbData ? parseFloat(dbData.queriesPerSecond) : 0,
      webSocketConnections: wsData ? wsData.successfulConnections : 0,
      estimatedDailyActiveUsers: this.reportData.summary.recommendedMaxUsers * 10 // 10% concurrency ratio
    };
  }

  identifyBottlenecks() {
    const bottlenecks = [];

    // Database bottlenecks
    const dbData = this.reportData.components.database?.summary;
    if (dbData?.lockWaits > 0) {
      bottlenecks.push({
        component: 'Database',
        type: 'Lock Contention',
        severity: 'high',
        description: 'Database lock waits detected during concurrent operations'
      });
    }

    // API bottlenecks
    const k6Data = this.reportData.components.k6?.summary;
    if (k6Data && this.parseTime(k6Data.p95ResponseTime) > 500) {
      bottlenecks.push({
        component: 'API',
        type: 'Response Time',
        severity: 'medium',
        description: 'P95 response times exceeding 500ms'
      });
    }

    // WebSocket bottlenecks
    const wsData = this.reportData.components.websocket?.summary;
    if (wsData && this.parsePercentage(wsData.connectionSuccessRate) < 95) {
      bottlenecks.push({
        component: 'WebSocket',
        type: 'Connection Management',
        severity: 'high',
        description: 'WebSocket connection success rate below 95%'
      });
    }

    // Solana bottlenecks
    const solData = this.reportData.components.solana?.summary;
    if (solData && this.parseTime(solData.avgConfirmationTime) > 2000) {
      bottlenecks.push({
        component: 'Solana',
        type: 'Transaction Confirmation',
        severity: 'medium',
        description: 'Transaction confirmation times exceeding 2 seconds'
      });
    }

    return bottlenecks.length > 0 ? bottlenecks : [
      { component: 'System', type: 'Overall', severity: 'info', description: 'No significant bottlenecks identified' }
    ];
  }

  generateScalingRecommendations() {
    const recommendations = [];

    // Database scaling
    if (this.reportData.components.database?.summary?.lockWaits > 0) {
      recommendations.push({
        priority: 'high',
        component: 'Database',
        recommendation: 'Implement read replicas and optimize query patterns',
        estimatedImpact: 'Supports 3-5x more concurrent users'
      });
    }

    // API scaling
    const k6Throughput = parseFloat(this.reportData.components.k6?.summary?.throughput || 0);
    if (k6Throughput > 0 && k6Throughput < 100) {
      recommendations.push({
        priority: 'medium',
        component: 'API',
        recommendation: 'Implement horizontal scaling with load balancing',
        estimatedImpact: 'Supports linear scaling of API throughput'
      });
    }

    // WebSocket scaling
    const wsConnections = this.reportData.components.websocket?.summary?.successfulConnections || 0;
    if (wsConnections > 500) {
      recommendations.push({
        priority: 'medium',
        component: 'WebSocket',
        recommendation: 'Implement WebSocket connection clustering',
        estimatedImpact: 'Supports 10x more concurrent connections'
      });
    }

    // Caching recommendations
    recommendations.push({
      priority: 'high',
      component: 'Caching',
      recommendation: 'Implement Redis caching for leaderboards and user stats',
      estimatedImpact: 'Reduces database load by 60-80%'
    });

    return recommendations;
  }

  analyzeResourceUtilization() {
    const monitoringData = this.reportData.components.monitoring?.summary;
    
    return {
      cpuUtilization: 'Not monitored in current test',
      memoryUtilization: 'Not monitored in current test', 
      networkUtilization: 'Not monitored in current test',
      databaseConnections: this.reportData.components.database?.summary?.connectionUtilization || {},
      webSocketConnections: this.reportData.components.websocket?.summary?.successfulConnections || 0,
      recommendations: [
        'Implement system resource monitoring',
        'Set up alerts for high resource utilization',
        'Monitor garbage collection and memory leaks'
      ]
    };
  }

  projectScalingLimits() {
    return {
      next6Months: {
        estimatedUsers: this.reportData.summary.recommendedMaxUsers * 2,
        requiredImprovements: ['Database optimization', 'API caching'],
        confidence: 'medium'
      },
      next12Months: {
        estimatedUsers: this.reportData.summary.recommendedMaxUsers * 5,
        requiredImprovements: ['Microservices architecture', 'Database sharding', 'CDN implementation'],
        confidence: 'low'
      },
      criticalThresholds: {
        databaseQPS: 1000,
        webSocketConnections: 10000,
        apiResponseTime: '100ms P95'
      }
    };
  }

  async generateRiskAssessment() {
    console.log('⚠️  Generating risk assessment...');

    this.reportData.riskAssessment = {
      overallRiskLevel: 'medium',
      risks: [],
      mitigationStrategies: [],
      businessImpact: {},
      technicalDebt: []
    };

    // Identify risks
    this.identifyRisks();
    this.assessBusinessImpact();
    this.identifyTechnicalDebt();
    this.generateMitigationStrategies();
  }

  identifyRisks() {
    const risks = [];

    // Critical component risks
    Object.entries(this.reportData.components).forEach(([type, componentData]) => {
      const criticalIssues = componentData.issues?.filter(i => i.severity === 'critical') || [];
      
      criticalIssues.forEach(issue => {
        risks.push({
          level: 'high',
          component: type,
          risk: issue.message,
          probability: 'high',
          impact: 'service_degradation'
        });
      });
    });

    // System-wide risks
    if (this.reportData.aggregatedMetrics.systemStability === 'critical') {
      risks.push({
        level: 'critical',
        component: 'system',
        risk: 'System instability under load',
        probability: 'high',
        impact: 'service_outage'
      });
    }

    // Scalability risks
    if (this.reportData.summary.recommendedMaxUsers < 500) {
      risks.push({
        level: 'medium',
        component: 'capacity',
        risk: 'Limited user capacity may impact growth',
        probability: 'medium',
        impact: 'growth_limitation'
      });
    }

    this.reportData.riskAssessment.risks = risks.length > 0 ? risks : [
      { level: 'low', component: 'system', risk: 'No significant risks identified', probability: 'low', impact: 'minimal' }
    ];

    // Set overall risk level
    const hasHighRisks = risks.some(r => r.level === 'critical' || r.level === 'high');
    this.reportData.riskAssessment.overallRiskLevel = hasHighRisks ? 'high' : 'medium';
  }

  assessBusinessImpact() {
    this.reportData.riskAssessment.businessImpact = {
      userExperienceRisk: this.assessUXRisk(),
      revenueRisk: this.assessRevenueRisk(),
      reputationRisk: this.assessReputationRisk(),
      operationalRisk: this.assessOperationalRisk()
    };
  }

  assessUXRisk() {
    const k6Data = this.reportData.components.k6?.summary;
    const wsData = this.reportData.components.websocket?.summary;
    
    let riskLevel = 'low';
    const issues = [];

    if (k6Data && this.parseTime(k6Data.p95ResponseTime) > 1000) {
      riskLevel = 'medium';
      issues.push('Slow API responses may frustrate users');
    }

    if (wsData && this.parsePercentage(wsData.connectionSuccessRate) < 90) {
      riskLevel = 'high';
      issues.push('WebSocket connection failures impact real-time gaming');
    }

    return { level: riskLevel, issues };
  }

  assessRevenueRisk() {
    const solData = this.reportData.components.solana?.summary;
    
    let riskLevel = 'low';
    const issues = [];

    if (solData && this.parsePercentage(solData.successRate) < 95) {
      riskLevel = 'high';
      issues.push('Failed token transactions directly impact revenue');
    }

    if (this.reportData.summary.recommendedMaxUsers < 1000) {
      riskLevel = 'medium';
      issues.push('Limited capacity constrains revenue growth');
    }

    return { level: riskLevel, issues };
  }

  assessReputationRisk() {
    const systemStability = this.reportData.aggregatedMetrics.systemStability;
    
    let riskLevel = 'low';
    const issues = [];

    if (systemStability === 'critical' || systemStability === 'unstable') {
      riskLevel = 'high';
      issues.push('System instability may damage gaming platform reputation');
    }

    return { level: riskLevel, issues };
  }

  assessOperationalRisk() {
    const dbData = this.reportData.components.database?.summary;
    const monitoringData = this.reportData.components.monitoring?.summary;
    
    let riskLevel = 'low';
    const issues = [];

    if (dbData?.deadlocks > 0) {
      riskLevel = 'high';
      issues.push('Database deadlocks require immediate operational attention');
    }

    if (!monitoringData) {
      riskLevel = 'medium';
      issues.push('Limited monitoring reduces operational visibility');
    }

    return { level: riskLevel, issues };
  }

  identifyTechnicalDebt() {
    const technicalDebt = [];

    // Performance debt
    if (this.reportData.performanceGrades.overall === 'C' || this.reportData.performanceGrades.overall === 'D') {
      technicalDebt.push({
        category: 'performance',
        description: 'System performance requires optimization',
        priority: 'high',
        estimatedEffort: '2-4 weeks'
      });
    }

    // Scalability debt
    if (this.reportData.summary.recommendedMaxUsers < 1000) {
      technicalDebt.push({
        category: 'scalability',
        description: 'Architecture needs scaling improvements',
        priority: 'medium',
        estimatedEffort: '4-8 weeks'
      });
    }

    // Monitoring debt
    if (!this.reportData.components.monitoring) {
      technicalDebt.push({
        category: 'observability',
        description: 'Enhanced monitoring and alerting needed',
        priority: 'medium',
        estimatedEffort: '1-2 weeks'
      });
    }

    this.reportData.riskAssessment.technicalDebt = technicalDebt;
  }

  generateMitigationStrategies() {
    const strategies = [];

    // High-risk mitigation
    this.reportData.riskAssessment.risks.forEach(risk => {
      if (risk.level === 'critical' || risk.level === 'high') {
        strategies.push({
          risk: risk.risk,
          strategy: this.generateMitigationStrategy(risk),
          timeline: this.estimateMitigationTimeline(risk),
          priority: risk.level
        });
      }
    });

    // General strategies
    strategies.push({
      risk: 'Capacity planning',
      strategy: 'Implement automated scaling and monitoring',
      timeline: '2-4 weeks',
      priority: 'medium'
    });

    strategies.push({
      risk: 'System reliability',
      strategy: 'Establish comprehensive testing and deployment pipeline',
      timeline: '3-6 weeks',
      priority: 'high'
    });

    this.reportData.riskAssessment.mitigationStrategies = strategies;
  }

  generateMitigationStrategy(risk) {
    switch (risk.component) {
      case 'database':
        return 'Optimize queries, add indexes, implement read replicas';
      case 'k6':
        return 'Implement caching, optimize API endpoints, add load balancing';
      case 'websocket':
        return 'Improve connection handling, add connection pooling';
      case 'solana':
        return 'Implement transaction retry logic, monitor network conditions';
      default:
        return 'Detailed investigation and targeted optimization required';
    }
  }

  estimateMitigationTimeline(risk) {
    switch (risk.level) {
      case 'critical': return '1-2 weeks';
      case 'high': return '2-4 weeks';
      case 'medium': return '4-8 weeks';
      default: return '8-12 weeks';
    }
  }

  async generateConsolidatedRecommendations() {
    console.log('💡 Generating consolidated recommendations...');

    const recommendations = [];

    // Immediate actions (P0)
    const criticalIssues = this.countCriticalIssues();
    if (criticalIssues > 0) {
      recommendations.push({
        priority: 'P0',
        category: 'Critical Issues',
        recommendation: `Address ${criticalIssues} critical issues before production deployment`,
        impact: 'Prevents system failures',
        effort: '1-2 weeks'
      });
    }

    // Performance optimizations (P1)
    if (this.reportData.performanceGrades.overall === 'C' || this.reportData.performanceGrades.overall === 'D') {
      recommendations.push({
        priority: 'P1',
        category: 'Performance',
        recommendation: 'Implement comprehensive performance optimization plan',
        impact: 'Improves user experience and system capacity',
        effort: '2-4 weeks'
      });
    }

    // Scalability improvements (P1)
    if (this.reportData.summary.recommendedMaxUsers < 1000) {
      recommendations.push({
        priority: 'P1',
        category: 'Scalability',
        recommendation: 'Implement horizontal scaling and database optimization',
        impact: 'Increases system capacity by 3-5x',
        effort: '4-6 weeks'
      });
    }

    // Component-specific recommendations
    Object.entries(this.reportData.components).forEach(([type, componentData]) => {
      if (componentData.latestReport?.recommendations) {
        componentData.latestReport.recommendations.slice(0, 3).forEach(rec => {
          recommendations.push({
            priority: 'P2',
            category: `${type.charAt(0).toUpperCase()}${type.slice(1)} Optimization`,
            recommendation: rec,
            impact: 'Component-specific improvement',
            effort: '1-3 weeks'
          });
        });
      }
    });

    // Infrastructure recommendations (P2)
    recommendations.push({
      priority: 'P2',
      category: 'Infrastructure',
      recommendation: 'Implement comprehensive monitoring and alerting system',
      impact: 'Improves operational visibility and incident response',
      effort: '2-3 weeks'
    });

    recommendations.push({
      priority: 'P2',
      category: 'Testing',
      recommendation: 'Establish automated performance testing in CI/CD pipeline',
      impact: 'Prevents performance regressions',
      effort: '1-2 weeks'
    });

    // Long-term recommendations (P3)
    recommendations.push({
      priority: 'P3',
      category: 'Architecture',
      recommendation: 'Consider microservices architecture for better scalability',
      impact: 'Enables independent scaling of components',
      effort: '12-16 weeks'
    });

    this.reportData.recommendations = recommendations;
  }

  async generateFinalReports() {
    console.log('📄 Generating final reports...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (this.options.format === 'json' || this.options.format === 'both') {
      const jsonPath = path.join(this.options.outputDir, `mlg-load-test-report-${timestamp}.json`);
      await fs.writeFile(jsonPath, JSON.stringify(this.reportData, null, 2));
      console.log(`✅ JSON report: ${jsonPath}`);
    }

    if (this.options.format === 'html' || this.options.format === 'both') {
      const htmlPath = path.join(this.options.outputDir, `mlg-load-test-report-${timestamp}.html`);
      const htmlContent = this.generateHTMLReport();
      await fs.writeFile(htmlPath, htmlContent);
      console.log(`✅ HTML report: ${htmlPath}`);
    }

    // Generate executive summary
    const summaryPath = path.join(this.options.outputDir, `mlg-executive-summary-${timestamp}.md`);
    const summaryContent = this.generateExecutiveSummary();
    await fs.writeFile(summaryPath, summaryContent);
    console.log(`✅ Executive summary: ${summaryPath}`);

    console.log('\n📊 MLG.clan Load Testing Results Summary');
    console.log('==========================================');
    console.log(`🏆 Overall Grade: ${this.reportData.performanceGrades.overall}`);
    console.log(`🎯 System Stability: ${this.reportData.aggregatedMetrics.systemStability}`);
    console.log(`👥 Recommended Max Users: ${this.reportData.summary.recommendedMaxUsers}`);
    console.log(`📈 Scalability Score: ${this.reportData.aggregatedMetrics.scalabilityScore}/100`);
    console.log(`🚦 Production Readiness: ${this.reportData.summary.readinessForProduction}`);
    console.log(`⚠️  Critical Issues: ${this.countCriticalIssues()}`);
  }

  generateHTMLReport() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MLG.clan Load Testing Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #0a0a0a; color: #e0e0e0; line-height: 1.6; }
        .header { background: linear-gradient(135deg, #00ff00, #008800); padding: 2rem; text-align: center; color: #000; }
        .header h1 { margin: 0; font-size: 2.5rem; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .header .subtitle { font-size: 1.1rem; margin-top: 0.5rem; opacity: 0.8; }
        .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin: 2rem 0; }
        .metric-card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 1.5rem; text-align: center; transition: transform 0.2s; }
        .metric-card:hover { transform: translateY(-2px); border-color: #00ff00; }
        .metric-value { font-size: 2rem; font-weight: bold; color: #00ff00; margin-bottom: 0.5rem; }
        .metric-label { color: #999; font-size: 0.9rem; }
        .grade-${this.reportData.performanceGrades.overall.toLowerCase()} { color: ${this.getGradeColor(this.reportData.performanceGrades.overall)}; }
        .section { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 2rem; margin: 2rem 0; }
        .section h2 { color: #00ff00; border-bottom: 2px solid #00ff00; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
        .component-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
        .component-card { background: #2a2a2a; border: 1px solid #444; border-radius: 6px; padding: 1rem; }
        .component-title { font-weight: bold; color: #00ff00; margin-bottom: 0.5rem; }
        .risk-high { color: #ff4444; }
        .risk-medium { color: #ffaa44; }
        .risk-low { color: #44ff44; }
        .recommendations { list-style-type: none; padding: 0; }
        .recommendations li { background: #2a2a2a; margin: 0.5rem 0; padding: 1rem; border-left: 4px solid #00ff00; border-radius: 4px; }
        .priority-p0 { border-left-color: #ff0000; }
        .priority-p1 { border-left-color: #ff8800; }
        .priority-p2 { border-left-color: #ffff00; }
        .priority-p3 { border-left-color: #00ff00; }
        .chart-container { background: #2a2a2a; border-radius: 8px; padding: 1rem; margin: 1rem 0; text-align: center; }
        .status-${this.reportData.summary.readinessForProduction} { 
            padding: 0.5rem 1rem; 
            border-radius: 20px; 
            background: ${this.getStatusColor(this.reportData.summary.readinessForProduction)};
            color: #000;
            font-weight: bold;
        }
        .footer { text-align: center; padding: 2rem; color: #666; border-top: 1px solid #333; margin-top: 3rem; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #333; }
        th { background: #333; color: #00ff00; font-weight: bold; }
        tr:hover { background: #2a2a2a; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 MLG.clan Load Testing Report</h1>
        <div class="subtitle">Comprehensive Performance & Scalability Analysis</div>
        <div class="subtitle">Generated: ${this.reportData.timestamp}</div>
    </div>

    <div class="container">
        <div class="summary-grid">
            <div class="metric-card">
                <div class="metric-value grade-${this.reportData.performanceGrades.overall.toLowerCase()}">${this.reportData.performanceGrades.overall}</div>
                <div class="metric-label">Overall Grade</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${this.reportData.summary.recommendedMaxUsers}</div>
                <div class="metric-label">Max Concurrent Users</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${this.reportData.aggregatedMetrics.scalabilityScore}</div>
                <div class="metric-label">Scalability Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Object.keys(this.reportData.components).length}</div>
                <div class="metric-label">Components Tested</div>
            </div>
            <div class="metric-card">
                <div class="metric-value status-${this.reportData.summary.readinessForProduction}">${this.formatReadinessStatus(this.reportData.summary.readinessForProduction)}</div>
                <div class="metric-label">Production Readiness</div>
            </div>
            <div class="metric-card">
                <div class="metric-value ${this.countCriticalIssues() > 0 ? 'risk-high' : 'risk-low'}">${this.countCriticalIssues()}</div>
                <div class="metric-label">Critical Issues</div>
            </div>
        </div>

        <div class="section">
            <h2>🎯 Executive Summary</h2>
            <p>The MLG.clan gaming platform was subjected to comprehensive load testing across ${Object.keys(this.reportData.components).length} core components. The system achieved an overall performance grade of <strong>${this.reportData.performanceGrades.overall}</strong> and is currently <strong>${this.formatReadinessStatus(this.reportData.summary.readinessForProduction)}</strong> for production deployment.</p>
            
            <p><strong>Key Findings:</strong></p>
            <ul>
                <li>System can support approximately <strong>${this.reportData.summary.recommendedMaxUsers} concurrent users</strong> under current configuration</li>
                <li>System stability is <strong>${this.reportData.aggregatedMetrics.systemStability}</strong> under load</li>
                <li><strong>${this.countCriticalIssues()}</strong> critical issues identified that require immediate attention</li>
                <li>Scalability score of <strong>${this.reportData.aggregatedMetrics.scalabilityScore}/100</strong> indicates ${this.interpretScalabilityScore()}</li>
            </ul>
        </div>

        <div class="section">
            <h2>📊 Component Performance Breakdown</h2>
            <div class="component-grid">
                ${Object.entries(this.reportData.components).map(([type, data]) => `
                    <div class="component-card">
                        <div class="component-title">${type.charAt(0).toUpperCase()}${type.slice(1)} Performance</div>
                        <div>Grade: <strong class="grade-${this.reportData.performanceGrades.components[type].toLowerCase()}">${this.reportData.performanceGrades.components[type]}</strong></div>
                        <div>Issues: <span class="${data.issues.length > 0 ? 'risk-high' : 'risk-low'}">${data.issues.length}</span></div>
                        <div>Trend: ${data.trends?.performance || 'Unknown'}</div>
                        ${this.generateComponentMetrics(type, data.summary)}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>⚠️ Risk Assessment</h2>
            <p>Overall Risk Level: <span class="risk-${this.reportData.riskAssessment.overallRiskLevel}">${this.reportData.riskAssessment.overallRiskLevel.toUpperCase()}</span></p>
            
            <h3>Identified Risks</h3>
            <table>
                <thead>
                    <tr><th>Component</th><th>Risk</th><th>Level</th><th>Impact</th></tr>
                </thead>
                <tbody>
                    ${this.reportData.riskAssessment.risks.map(risk => `
                        <tr>
                            <td>${risk.component}</td>
                            <td>${risk.risk}</td>
                            <td class="risk-${risk.level}">${risk.level.toUpperCase()}</td>
                            <td>${risk.impact}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>🚀 Scalability Analysis</h2>
            <h3>Current Capacity</h3>
            <ul>
                <li>Concurrent Users: <strong>${this.reportData.scalabilityAnalysis.currentCapacity.concurrentUsers}</strong></li>
                <li>API Requests/sec: <strong>${this.reportData.scalabilityAnalysis.currentCapacity.apiRequestsPerSecond}</strong></li>
                <li>Database QPS: <strong>${this.reportData.scalabilityAnalysis.currentCapacity.databaseQPS}</strong></li>
                <li>WebSocket Connections: <strong>${this.reportData.scalabilityAnalysis.currentCapacity.webSocketConnections}</strong></li>
            </ul>

            <h3>Identified Bottlenecks</h3>
            <ul>
                ${this.reportData.scalabilityAnalysis.bottlenecks.map(bottleneck => `
                    <li><span class="risk-${bottleneck.severity}">${bottleneck.component}</span>: ${bottleneck.description}</li>
                `).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>💡 Recommendations</h2>
            <ul class="recommendations">
                ${this.reportData.recommendations.slice(0, 10).map(rec => `
                    <li class="priority-${rec.priority.toLowerCase()}">
                        <strong>[${rec.priority}] ${rec.category}:</strong> ${rec.recommendation}
                        <br><small>Impact: ${rec.impact} | Effort: ${rec.effort}</small>
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>📈 Performance Grades</h2>
            <div class="component-grid">
                ${Object.entries(this.reportData.performanceGrades.components).map(([component, grade]) => `
                    <div class="component-card">
                        <div class="component-title">${component.charAt(0).toUpperCase()}${component.slice(1)}</div>
                        <div class="metric-value grade-${grade.toLowerCase()}">${grade}</div>
                        <div class="metric-label">${this.reportData.performanceGrades.criteria[grade]}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>

    <div class="footer">
        <p>🎮 Generated by MLG.clan Load Testing Framework v1.0.0</p>
        <p>For questions or support, contact the MLG.clan development team</p>
    </div>
</body>
</html>
    `;
  }

  generateComponentMetrics(type, summary) {
    if (!summary) return '<div>No metrics available</div>';

    switch (type) {
      case 'k6':
        return `
          <div><small>Success Rate: ${summary.successRate}</small></div>
          <div><small>Throughput: ${summary.throughput} req/s</small></div>
          <div><small>P95 Response: ${summary.p95ResponseTime}</small></div>
        `;
      case 'database':
        return `
          <div><small>Success Rate: ${summary.successRate}</small></div>
          <div><small>QPS: ${summary.queriesPerSecond}</small></div>
          <div><small>Lock Waits: ${summary.lockWaits}</small></div>
        `;
      case 'websocket':
        return `
          <div><small>Connection Rate: ${summary.connectionSuccessRate}</small></div>
          <div><small>Messages: ${summary.messagesReceived + summary.messagesSent}</small></div>
          <div><small>Avg Latency: ${summary.avgMessageLatency}</small></div>
        `;
      case 'solana':
        return `
          <div><small>Success Rate: ${summary.successRate}</small></div>
          <div><small>TPS: ${summary.throughputTPS}</small></div>
          <div><small>Confirmation: ${summary.avgConfirmationTime}</small></div>
        `;
      default:
        return '<div><small>Metrics available in detailed report</small></div>';
    }
  }

  generateExecutiveSummary() {
    return `# MLG.clan Load Testing - Executive Summary

## Overall Assessment
- **Performance Grade**: ${this.reportData.performanceGrades.overall}
- **Production Readiness**: ${this.formatReadinessStatus(this.reportData.summary.readinessForProduction)}
- **System Stability**: ${this.reportData.aggregatedMetrics.systemStability}
- **Scalability Score**: ${this.reportData.aggregatedMetrics.scalabilityScore}/100

## Key Metrics
- **Recommended Max Users**: ${this.reportData.summary.recommendedMaxUsers}
- **Components Tested**: ${Object.keys(this.reportData.components).length}
- **Critical Issues**: ${this.countCriticalIssues()}
- **Total Recommendations**: ${this.reportData.recommendations.length}

## Critical Actions Required
${this.reportData.recommendations.filter(r => r.priority === 'P0').map(r => 
  `- **${r.category}**: ${r.recommendation}`
).join('\n')}

## Business Impact
- **User Experience Risk**: ${this.reportData.riskAssessment.businessImpact.userExperienceRisk?.level || 'Not assessed'}
- **Revenue Risk**: ${this.reportData.riskAssessment.businessImpact.revenueRisk?.level || 'Not assessed'}
- **Operational Risk**: ${this.reportData.riskAssessment.businessImpact.operationalRisk?.level || 'Not assessed'}

## Next Steps
1. Address critical issues (P0) immediately
2. Implement performance optimizations (P1)
3. Plan scalability improvements (P1-P2)
4. Establish comprehensive monitoring
5. Regular performance testing in CI/CD

## Technical Recommendations Summary
${this.reportData.recommendations.slice(0, 5).map(r => 
  `- [${r.priority}] ${r.recommendation} (${r.effort})`
).join('\n')}

---
*Generated: ${this.reportData.timestamp}*
*MLG.clan Load Testing Framework v1.0.0*
`;
  }

  // Utility methods
  parseTime(timeString) {
    if (!timeString) return 0;
    return parseFloat(timeString.replace(/[^\d.]/g, ''));
  }

  parsePercentage(percentageString) {
    if (!percentageString) return 0;
    return parseFloat(percentageString.replace('%', ''));
  }

  getGradeColor(grade) {
    const colors = {
      'A': '#00ff00',
      'B': '#88ff00', 
      'C': '#ffff00',
      'D': '#ff8800',
      'F': '#ff0000'
    };
    return colors[grade] || '#ffffff';
  }

  getStatusColor(status) {
    const colors = {
      'production_ready': '#00ff00',
      'ready_with_monitoring': '#88ff00',
      'needs_improvements': '#ffff00',
      'not_ready': '#ff8800'
    };
    return colors[status] || '#ff0000';
  }

  formatReadinessStatus(status) {
    const labels = {
      'production_ready': 'Production Ready',
      'ready_with_monitoring': 'Ready with Monitoring',
      'needs_improvements': 'Needs Improvements',
      'not_ready': 'Not Ready'
    };
    return labels[status] || 'Unknown';
  }

  interpretScalabilityScore() {
    const score = this.reportData.aggregatedMetrics.scalabilityScore;
    if (score >= 90) return 'excellent scalability potential';
    if (score >= 80) return 'good scalability with minor optimizations needed';
    if (score >= 70) return 'adequate scalability with improvements required';
    if (score >= 60) return 'limited scalability requiring significant optimization';
    return 'poor scalability requiring architectural changes';
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  args.forEach(arg => {
    if (arg.startsWith('--reports-dir=')) {
      options.reportsDir = arg.split('=')[1];
    } else if (arg.startsWith('--output-dir=')) {
      options.outputDir = arg.split('=')[1];
    } else if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1];
    }
  });

  const reporter = new MLGLoadTestReporter(options);
  
  try {
    await reporter.generateConsolidatedReport();
    process.exit(0);
  } catch (error) {
    console.error('❌ Report generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default MLGLoadTestReporter;