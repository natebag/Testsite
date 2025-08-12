/**
 * Gaming Performance Budget Monitor
 * 
 * Enforces performance budgets for gaming applications
 * Provides alerts, CI/CD integration, and automated optimization hints
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

class GamingPerformanceBudget {
  constructor(configPath = 'performance-budget.json') {
    this.configPath = configPath;
    this.budget = this.loadBudgetConfig();
    this.violations = [];
    this.warnings = [];
    this.recommendations = [];
  }

  loadBudgetConfig() {
    const defaultBudget = {
      // Gaming-optimized performance budgets
      bundles: {
        // Critical gaming paths - must be under these limits
        critical: {
          maxSizeKB: 200,        // 200KB for critical voting/wallet
          maxChunks: 3,          // Max 3 critical chunks
          description: "Critical gaming features (voting, wallet)"
        },
        
        // High priority gaming features
        high: {
          maxSizeKB: 150,        // 150KB per high priority chunk
          maxChunks: 5,          // Max 5 high priority chunks
          description: "High priority gaming features (clans, profile)"
        },
        
        // Overall application budget
        total: {
          maxSizeKB: 1024,       // 1MB total JavaScript
          maxChunks: 15,         // Max 15 total chunks
          description: "Total application size"
        },
        
        // Vendor dependencies
        vendor: {
          maxSizeKB: 500,        // 500KB for all vendor code
          maxChunks: 3,          // Max 3 vendor chunks
          description: "Third-party dependencies"
        },
        
        // CSS budget
        css: {
          maxSizeKB: 100,        // 100KB for all CSS
          maxChunks: 5,          // Max 5 CSS chunks
          description: "Styling and CSS"
        }
      },
      
      // Performance timing budgets
      timing: {
        fcp: 1500,              // First Contentful Paint < 1.5s
        lcp: 2500,              // Largest Contentful Paint < 2.5s
        fid: 100,               // First Input Delay < 100ms
        cls: 0.1,               // Cumulative Layout Shift < 0.1
        ttfb: 500,              // Time to First Byte < 500ms
        routeLoad: 2000,        // Route loading < 2s
        chunkLoad: 1000         // Chunk loading < 1s
      },
      
      // Gaming-specific metrics
      gaming: {
        walletConnect: 3000,    // Wallet connection < 3s
        voteTransaction: 5000,  // Vote transaction < 5s
        clanLoad: 2000,         // Clan data loading < 2s
        leaderboardUpdate: 1000 // Leaderboard update < 1s
      },
      
      // Network-adaptive budgets
      networkBudgets: {
        "4g": {
          multiplier: 1.0       // Full budget on 4G
        },
        "3g": {
          multiplier: 1.5       // 50% more time on 3G
        },
        "2g": {
          multiplier: 2.0       // Double time on 2G
        },
        "slow-2g": {
          multiplier: 3.0       // Triple time on slow connections
        }
      }
    };

    if (existsSync(this.configPath)) {
      try {
        const config = JSON.parse(readFileSync(this.configPath, 'utf8'));
        return { ...defaultBudget, ...config };
      } catch (error) {
        console.warn(`⚠️  Failed to load budget config: ${error.message}`);
        return defaultBudget;
      }
    }

    // Save default config
    writeFileSync(this.configPath, JSON.stringify(defaultBudget, null, 2));
    console.log(`📋 Created default performance budget: ${this.configPath}`);
    
    return defaultBudget;
  }

  async checkBudgets(distPath = 'dist') {
    console.log('🎮 Checking Gaming Performance Budgets...');
    
    this.violations = [];
    this.warnings = [];
    this.recommendations = [];
    
    if (!existsSync(distPath)) {
      throw new Error(`Distribution directory ${distPath} does not exist`);
    }

    // Check bundle size budgets
    await this.checkBundleBudgets(distPath);
    
    // Check timing budgets (if performance data exists)
    await this.checkTimingBudgets();
    
    // Generate budget report
    const report = this.generateBudgetReport();
    
    // Save budget report
    const reportPath = join(distPath, 'performance-budget-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Budget report saved: ${reportPath}`);
    
    return report;
  }

  async checkBundleBudgets(distPath) {
    const bundleAnalysis = await this.analyzeBundles(distPath);
    
    // Check critical bundle budget
    const criticalBundles = bundleAnalysis.filter(bundle => 
      bundle.category === 'critical-voting' || 
      bundle.category === 'critical-wallet' ||
      bundle.priority === 'critical'
    );
    
    const criticalSize = criticalBundles.reduce((sum, bundle) => sum + bundle.gzipSize, 0);
    const criticalSizeKB = Math.round(criticalSize / 1024);
    
    if (criticalSizeKB > this.budget.bundles.critical.maxSizeKB) {
      this.violations.push({
        type: 'bundle_budget',
        severity: 'critical',
        category: 'critical',
        message: `Critical bundles exceed budget: ${criticalSizeKB}KB > ${this.budget.bundles.critical.maxSizeKB}KB`,
        actual: criticalSizeKB,
        budget: this.budget.bundles.critical.maxSizeKB,
        impact: 'Severely impacts gaming performance',
        bundles: criticalBundles.map(b => b.name)
      });
    }

    if (criticalBundles.length > this.budget.bundles.critical.maxChunks) {
      this.violations.push({
        type: 'chunk_count',
        severity: 'high',
        category: 'critical',
        message: `Too many critical chunks: ${criticalBundles.length} > ${this.budget.bundles.critical.maxChunks}`,
        actual: criticalBundles.length,
        budget: this.budget.bundles.critical.maxChunks,
        impact: 'Increases initial load time',
        bundles: criticalBundles.map(b => b.name)
      });
    }

    // Check high priority bundle budget
    const highPriorityBundles = bundleAnalysis.filter(bundle => bundle.priority === 'high');
    const avgHighPrioritySize = highPriorityBundles.reduce((sum, bundle) => sum + bundle.gzipSize, 0) / highPriorityBundles.length;
    const avgHighPrioritySizeKB = Math.round(avgHighPrioritySize / 1024);

    if (avgHighPrioritySizeKB > this.budget.bundles.high.maxSizeKB) {
      this.warnings.push({
        type: 'bundle_budget',
        severity: 'medium',
        category: 'high',
        message: `Average high priority bundle size exceeds budget: ${avgHighPrioritySizeKB}KB > ${this.budget.bundles.high.maxSizeKB}KB`,
        actual: avgHighPrioritySizeKB,
        budget: this.budget.bundles.high.maxSizeKB,
        impact: 'May slow down secondary gaming features'
      });
    }

    // Check total bundle budget
    const totalJSSize = bundleAnalysis
      .filter(bundle => bundle.type === 'javascript')
      .reduce((sum, bundle) => sum + bundle.gzipSize, 0);
    const totalJSSizeKB = Math.round(totalJSSize / 1024);

    if (totalJSSizeKB > this.budget.bundles.total.maxSizeKB) {
      this.violations.push({
        type: 'bundle_budget',
        severity: 'high',
        category: 'total',
        message: `Total JavaScript exceeds budget: ${totalJSSizeKB}KB > ${this.budget.bundles.total.maxSizeKB}KB`,
        actual: totalJSSizeKB,
        budget: this.budget.bundles.total.maxSizeKB,
        impact: 'Overall application performance degradation'
      });
    }

    // Check vendor bundle budget
    const vendorBundles = bundleAnalysis.filter(bundle => bundle.category === 'vendor');
    const vendorSize = vendorBundles.reduce((sum, bundle) => sum + bundle.gzipSize, 0);
    const vendorSizeKB = Math.round(vendorSize / 1024);

    if (vendorSizeKB > this.budget.bundles.vendor.maxSizeKB) {
      this.warnings.push({
        type: 'bundle_budget',
        severity: 'medium',
        category: 'vendor',
        message: `Vendor bundles exceed budget: ${vendorSizeKB}KB > ${this.budget.bundles.vendor.maxSizeKB}KB`,
        actual: vendorSizeKB,
        budget: this.budget.bundles.vendor.maxSizeKB,
        impact: 'Large third-party dependencies slow initial load'
      });
    }

    // Generate bundle recommendations
    this.generateBundleRecommendations(bundleAnalysis);
  }

  async checkTimingBudgets() {
    // Check if performance data exists
    const performanceData = this.loadPerformanceData();
    
    if (!performanceData) {
      console.log('📊 No performance data available for timing budget checks');
      return;
    }

    const timingBudgets = this.budget.timing;
    
    Object.entries(timingBudgets).forEach(([metric, budget]) => {
      const actual = performanceData[metric];
      
      if (actual && actual > budget) {
        const violation = {
          type: 'timing_budget',
          severity: this.getTimingSeverity(metric, actual, budget),
          category: metric,
          message: `${metric.toUpperCase()} exceeds budget: ${actual.toFixed(2)}ms > ${budget}ms`,
          actual: actual,
          budget: budget,
          impact: this.getTimingImpact(metric)
        };

        if (violation.severity === 'critical') {
          this.violations.push(violation);
        } else {
          this.warnings.push(violation);
        }
      }
    });
  }

  async analyzeBundles(distPath) {
    // Reuse bundle analysis from GamingBundleAnalyzer
    const bundles = [];
    const jsFiles = this.getFilesByExtension(distPath, '.js');
    
    jsFiles.forEach(filePath => {
      try {
        const content = readFileSync(filePath, 'utf8');
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
        const stats = this.analyzeFile(filePath);
        
        bundles.push({
          name: fileName,
          type: 'javascript',
          size: content.length,
          gzipSize: this.estimateGzipSize(content),
          category: this.categorizeBundle(fileName),
          priority: this.getBundlePriority(fileName),
          path: filePath
        });
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, error.message);
      }
    });
    
    return bundles;
  }

  getFilesByExtension(dir, extension) {
    const fs = require('fs');
    const path = require('path');
    const files = [];
    
    function scanDirectory(currentDir) {
      try {
        const items = fs.readdirSync(currentDir, { withFileTypes: true });
        
        items.forEach(item => {
          const fullPath = path.join(currentDir, item.name);
          
          if (item.isDirectory()) {
            scanDirectory(fullPath);
          } else if (path.extname(item.name) === extension) {
            files.push(fullPath);
          }
        });
      } catch (error) {
        console.warn(`Failed to scan directory ${currentDir}:`, error.message);
      }
    }
    
    scanDirectory(dir);
    return files;
  }

  analyzeFile(filePath) {
    try {
      const fs = require('fs');
      return fs.statSync(filePath);
    } catch {
      return { size: 0 };
    }
  }

  estimateGzipSize(content) {
    // Simple estimation: gzip typically compresses to ~30% of original size
    // This is a rough estimate - real implementation would use actual gzip
    return Math.round(content.length * 0.3);
  }

  categorizeBundle(fileName) {
    const categories = {
      'critical-voting': ['voting', 'burn', 'vote'],
      'critical-wallet': ['wallet', 'phantom', 'web3'],
      'social-clans': ['clans', 'clan', 'leaderboard'],
      'content-mgmt': ['content', 'moderation'],
      'vendor': ['vendor', 'lib', 'node_modules', 'chunk-'],
      'ui-common': ['component', 'ui', 'common']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => fileName.toLowerCase().includes(keyword))) {
        return category;
      }
    }

    return 'uncategorized';
  }

  getBundlePriority(fileName) {
    const criticalBundles = ['voting', 'wallet', 'main', 'index'];
    const highPriorityBundles = ['clans', 'profile', 'realtime'];
    
    if (criticalBundles.some(bundle => fileName.includes(bundle))) {
      return 'critical';
    } else if (highPriorityBundles.some(bundle => fileName.includes(bundle))) {
      return 'high';
    } else if (fileName.includes('vendor')) {
      return 'low';
    } else {
      return 'medium';
    }
  }

  loadPerformanceData() {
    try {
      const data = localStorage.getItem('mlg_performance_report');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  getTimingSeverity(metric, actual, budget) {
    const ratio = actual / budget;
    
    if (ratio > 2.0) return 'critical';  // More than 2x budget
    if (ratio > 1.5) return 'high';      // More than 1.5x budget
    return 'medium';
  }

  getTimingImpact(metric) {
    const impacts = {
      fcp: 'Users see blank screen longer',
      lcp: 'Main content loads slowly',
      fid: 'Poor user interaction responsiveness',
      cls: 'Visual instability and poor UX',
      ttfb: 'Server response delays',
      routeLoad: 'Slow navigation between gaming features',
      chunkLoad: 'Code splitting benefits reduced'
    };
    
    return impacts[metric] || 'Performance impact';
  }

  generateBundleRecommendations(bundles) {
    // Large bundle recommendations
    const largeBundles = bundles.filter(bundle => bundle.gzipSize > 100 * 1024); // > 100KB
    largeBundles.forEach(bundle => {
      this.recommendations.push({
        type: 'bundle_optimization',
        severity: 'medium',
        message: `Consider splitting large bundle: ${bundle.name} (${Math.round(bundle.gzipSize / 1024)}KB)`,
        action: 'Implement more granular code splitting',
        bundle: bundle.name,
        currentSize: Math.round(bundle.gzipSize / 1024),
        targetSize: 100,
        effort: 'medium',
        impact: 'high'
      });
    });

    // Vendor optimization recommendations
    const vendorBundles = bundles.filter(bundle => bundle.category === 'vendor');
    const largeVendorBundles = vendorBundles.filter(bundle => bundle.gzipSize > 200 * 1024);
    
    largeVendorBundles.forEach(bundle => {
      this.recommendations.push({
        type: 'vendor_optimization',
        severity: 'high',
        message: `Large vendor bundle detected: ${bundle.name}`,
        action: 'Audit dependencies and remove unused libraries',
        bundle: bundle.name,
        currentSize: Math.round(bundle.gzipSize / 1024),
        effort: 'high',
        impact: 'high'
      });
    });

    // Critical path recommendations
    const criticalBundles = bundles.filter(bundle => bundle.priority === 'critical');
    const oversizedCritical = criticalBundles.filter(bundle => bundle.gzipSize > 150 * 1024);
    
    oversizedCritical.forEach(bundle => {
      this.recommendations.push({
        type: 'critical_path_optimization',
        severity: 'critical',
        message: `Critical gaming bundle too large: ${bundle.name}`,
        action: 'Move non-essential features to lazy-loaded chunks',
        bundle: bundle.name,
        currentSize: Math.round(bundle.gzipSize / 1024),
        targetSize: 150,
        effort: 'high',
        impact: 'critical'
      });
    });
  }

  generateBudgetReport() {
    const report = {
      timestamp: Date.now(),
      budget: this.budget,
      violations: this.violations,
      warnings: this.warnings,
      recommendations: this.recommendations,
      summary: this.generateSummary(),
      cicdStatus: this.getCICDStatus()
    };

    return report;
  }

  generateSummary() {
    const criticalViolations = this.violations.filter(v => v.severity === 'critical');
    const highViolations = this.violations.filter(v => v.severity === 'high');
    
    return {
      status: criticalViolations.length > 0 ? 'failed' : 
              highViolations.length > 0 ? 'warning' : 'passed',
      totalViolations: this.violations.length,
      totalWarnings: this.warnings.length,
      totalRecommendations: this.recommendations.length,
      criticalIssues: criticalViolations.length,
      budgetHealthScore: this.calculateBudgetHealthScore(),
      nextActions: this.getNextActions()
    };
  }

  calculateBudgetHealthScore() {
    let score = 100;
    
    // Deduct points for violations
    this.violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        default:
          score -= 5;
      }
    });

    // Deduct smaller amounts for warnings
    this.warnings.forEach(warning => {
      score -= 5;
    });

    return Math.max(0, Math.round(score));
  }

  getNextActions() {
    const actions = [];
    
    if (this.violations.length > 0) {
      actions.push('Fix critical budget violations before deployment');
    }
    
    if (this.warnings.length > 0) {
      actions.push('Address performance warnings to improve user experience');
    }
    
    const highImpactRecommendations = this.recommendations.filter(r => r.impact === 'high');
    if (highImpactRecommendations.length > 0) {
      actions.push('Implement high-impact optimizations');
    }
    
    if (actions.length === 0) {
      actions.push('All budgets passed! Consider tightening budgets for even better performance.');
    }
    
    return actions;
  }

  getCICDStatus() {
    const criticalViolations = this.violations.filter(v => v.severity === 'critical').length;
    const highViolations = this.violations.filter(v => v.severity === 'high').length;
    
    return {
      shouldFailBuild: criticalViolations > 0,
      shouldWarnBuild: highViolations > 0,
      exitCode: criticalViolations > 0 ? 1 : 0,
      message: criticalViolations > 0 ? 
        'Build failed due to critical performance budget violations' :
        highViolations > 0 ?
        'Build succeeded with performance warnings' :
        'All performance budgets passed'
    };
  }

  // CI/CD Integration methods
  async enforceBudgetsInCI() {
    const report = await this.checkBudgets();
    
    console.log(`\n🎮 Gaming Performance Budget Report`);
    console.log(`========================================`);
    console.log(`Status: ${report.summary.status.toUpperCase()}`);
    console.log(`Health Score: ${report.summary.budgetHealthScore}/100`);
    console.log(`Violations: ${report.summary.totalViolations}`);
    console.log(`Warnings: ${report.summary.totalWarnings}`);
    
    if (report.violations.length > 0) {
      console.log(`\n❌ Budget Violations:`);
      report.violations.forEach(violation => {
        console.log(`  - ${violation.message}`);
      });
    }
    
    if (report.warnings.length > 0) {
      console.log(`\n⚠️  Performance Warnings:`);
      report.warnings.forEach(warning => {
        console.log(`  - ${warning.message}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      report.recommendations.slice(0, 5).forEach(rec => {
        console.log(`  - ${rec.message}`);
      });
    }
    
    return report.cicdStatus;
  }

  setupContinuousMonitoring() {
    // Integration with performance monitoring
    if (typeof window !== 'undefined') {
      // Browser-based monitoring
      this.setupBrowserMonitoring();
    }
  }

  setupBrowserMonitoring() {
    // Monitor performance metrics in real-time
    const performanceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.checkRealTimeMetric(entry);
      });
    });

    try {
      performanceObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input'] });
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }
  }

  checkRealTimeMetric(entry) {
    const metricMap = {
      'first-contentful-paint': 'fcp',
      'largest-contentful-paint': 'lcp',
      'first-input': 'fid'
    };

    const metricName = metricMap[entry.name] || entry.name;
    const budget = this.budget.timing[metricName];
    
    if (budget && entry.startTime > budget) {
      console.warn(`🎮 Real-time budget violation: ${metricName.toUpperCase()} = ${entry.startTime.toFixed(2)}ms (budget: ${budget}ms)`);
      
      // Send alert if available
      if (window.MLGAnalytics) {
        window.MLGAnalytics.trackEvent('budget_violation', {
          metric: metricName,
          value: entry.startTime,
          budget: budget,
          timestamp: Date.now()
        });
      }
    }
  }
}

// CLI Usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const budgetMonitor = new GamingPerformanceBudget();
  
  budgetMonitor.enforceBudgetsInCI()
    .then(cicdStatus => {
      console.log(`\n${cicdStatus.message}`);
      process.exit(cicdStatus.exitCode);
    })
    .catch(error => {
      console.error('❌ Budget check failed:', error);
      process.exit(1);
    });
}

export { GamingPerformanceBudget };
export default GamingPerformanceBudget;