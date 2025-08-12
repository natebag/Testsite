/**
 * Performance Audit Script
 * Validates build optimizations and security configurations
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { gzipSync } from 'zlib';

const DIST_DIR = './temp/dist';
const PERFORMANCE_BUDGETS = {
  // Performance budgets in KB (gzipped)
  maxBundleSize: 250, // Individual bundle max
  maxTotalSize: 1000, // Total JS size max
  maxCSSSize: 50,     // CSS max
  maxImageSize: 500   // Images max
};

const SECURITY_HEADERS = [
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Content-Security-Policy',
  'Strict-Transport-Security',
  'X-XSS-Protection'
];

class PerformanceAuditor {
  constructor() {
    this.results = {
      bundles: [],
      performance: {},
      security: {},
      recommendations: []
    };
  }

  async runAudit() {
    console.log('🔍 Starting Performance & Security Audit...\n');
    
    this.analyzeBundles();
    this.checkPerformanceBudgets();
    this.validateSecurityHeaders();
    this.generateRecommendations();
    
    this.printResults();
    
    return this.results;
  }

  analyzeBundles() {
    console.log('📦 Analyzing Bundle Sizes...');
    
    const jsFiles = this.getFilesByExtension('.js');
    const cssFiles = this.getFilesByExtension('.css');
    
    let totalJSSize = 0;
    let totalCSSSize = 0;
    
    // Analyze JS bundles
    jsFiles.forEach(file => {
      const content = readFileSync(file.path);
      const gzippedSize = gzipSync(content).length;
      const sizeKB = Math.round(gzippedSize / 1024 * 100) / 100;
      
      this.results.bundles.push({
        name: file.name,
        type: 'js',
        size: content.length,
        gzippedSize: gzippedSize,
        sizeKB: sizeKB
      });
      
      totalJSSize += gzippedSize;
    });
    
    // Analyze CSS bundles
    cssFiles.forEach(file => {
      const content = readFileSync(file.path);
      const gzippedSize = gzipSync(content).length;
      const sizeKB = Math.round(gzippedSize / 1024 * 100) / 100;
      
      this.results.bundles.push({
        name: file.name,
        type: 'css',
        size: content.length,
        gzippedSize: gzippedSize,
        sizeKB: sizeKB
      });
      
      totalCSSSize += gzippedSize;
    });
    
    this.results.performance.totalJSSizeKB = Math.round(totalJSSize / 1024 * 100) / 100;
    this.results.performance.totalCSSSizeKB = Math.round(totalCSSSize / 1024 * 100) / 100;
    
    console.log(`   Total JS Size: ${this.results.performance.totalJSSizeKB} KB`);
    console.log(`   Total CSS Size: ${this.results.performance.totalCSSSizeKB} KB`);
  }

  checkPerformanceBudgets() {
    console.log('\n⚡ Checking Performance Budgets...');
    
    // Check individual bundle sizes
    const oversizedBundles = this.results.bundles.filter(bundle => 
      bundle.sizeKB > PERFORMANCE_BUDGETS.maxBundleSize
    );
    
    // Check total sizes
    const budgetChecks = {
      totalJSBudget: this.results.performance.totalJSSizeKB <= PERFORMANCE_BUDGETS.maxTotalSize,
      totalCSSBudget: this.results.performance.totalCSSSizeKB <= PERFORMANCE_BUDGETS.maxCSSSize,
      individualBundles: oversizedBundles.length === 0
    };
    
    this.results.performance.budgetChecks = budgetChecks;
    this.results.performance.oversizedBundles = oversizedBundles;
    
    // Report budget status
    Object.entries(budgetChecks).forEach(([check, passed]) => {
      const status = passed ? '✅' : '❌';
      const checkName = check.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`   ${status} ${checkName}`);
    });
    
    if (oversizedBundles.length > 0) {
      console.log(`\n   ⚠️  Oversized bundles (>${PERFORMANCE_BUDGETS.maxBundleSize}KB):`);
      oversizedBundles.forEach(bundle => {
        console.log(`      - ${bundle.name}: ${bundle.sizeKB} KB`);
      });
    }
  }

  validateSecurityHeaders() {
    console.log('\n🔒 Validating Security Configuration...');
    
    // Check if server.js has helmet configuration
    try {
      const serverContent = readFileSync('./server.js', 'utf8');
      
      const securityChecks = {
        helmet: serverContent.includes('helmet'),
        csp: serverContent.includes('contentSecurityPolicy'),
        hsts: serverContent.includes('hsts'),
        rateLimit: serverContent.includes('rateLimit'),
        cors: serverContent.includes('cors')
      };
      
      this.results.security = securityChecks;
      
      Object.entries(securityChecks).forEach(([check, implemented]) => {
        const status = implemented ? '✅' : '❌';
        const checkName = check.toUpperCase();
        console.log(`   ${status} ${checkName} configured`);
      });
      
    } catch (error) {
      console.log('   ⚠️  Could not validate server security configuration');
      this.results.security.error = error.message;
    }
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Performance recommendations
    if (!this.results.performance.budgetChecks?.totalJSBudget) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: `Total JS size (${this.results.performance.totalJSSizeKB}KB) exceeds budget (${PERFORMANCE_BUDGETS.maxTotalSize}KB). Consider code splitting or tree-shaking.`
      });
    }
    
    if (this.results.performance.oversizedBundles?.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: `${this.results.performance.oversizedBundles.length} bundles exceed individual size budget. Consider further chunk splitting.`
      });
    }
    
    // Security recommendations
    if (!this.results.security.helmet) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        message: 'Helmet security middleware not detected. Implement security headers.'
      });
    }
    
    if (!this.results.security.rateLimit) {
      recommendations.push({
        type: 'security',
        priority: 'medium',
        message: 'Rate limiting not detected. Implement API rate limiting.'
      });
    }
    
    // Optimization recommendations
    const largestBundle = this.results.bundles
      .filter(b => b.type === 'js')
      .sort((a, b) => b.sizeKB - a.sizeKB)[0];
    
    if (largestBundle && largestBundle.sizeKB > 100) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: `Largest bundle (${largestBundle.name}: ${largestBundle.sizeKB}KB) could benefit from lazy loading.`
      });
    }
    
    this.results.recommendations = recommendations;
  }

  printResults() {
    console.log('\n📊 PERFORMANCE AUDIT RESULTS');
    console.log('================================\n');
    
    // Bundle summary
    console.log('📦 BUNDLE ANALYSIS:');
    const jsBundles = this.results.bundles.filter(b => b.type === 'js');
    const cssBundles = this.results.bundles.filter(b => b.type === 'css');
    
    console.log(`   JavaScript files: ${jsBundles.length}`);
    console.log(`   CSS files: ${cssBundles.length}`);
    console.log(`   Total size: ${this.results.performance.totalJSSizeKB + this.results.performance.totalCSSSizeKB} KB (gzipped)\n`);
    
    // Top 5 largest bundles
    const topBundles = this.results.bundles
      .sort((a, b) => b.sizeKB - a.sizeKB)
      .slice(0, 5);
    
    console.log('🎯 LARGEST BUNDLES:');
    topBundles.forEach((bundle, index) => {
      console.log(`   ${index + 1}. ${bundle.name}: ${bundle.sizeKB} KB`);
    });
    
    // Performance status
    const performancePassed = Object.values(this.results.performance.budgetChecks || {}).every(Boolean);
    const securityPassed = Object.values(this.results.security).filter(v => typeof v === 'boolean').every(Boolean);
    
    console.log(`\n⚡ PERFORMANCE: ${performancePassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🔒 SECURITY: ${securityPassed ? '✅ PASSED' : '❌ NEEDS ATTENTION'}`);
    
    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`   ${index + 1}. ${priority} [${rec.type.toUpperCase()}] ${rec.message}`);
      });
    }
    
    console.log('\n✨ Audit completed!');
  }

  getFilesByExtension(extension) {
    const files = [];
    
    function scanDirectory(dir) {
      const items = readdirSync(dir);
      
      items.forEach(item => {
        const itemPath = join(dir, item);
        const stat = statSync(itemPath);
        
        if (stat.isDirectory()) {
          scanDirectory(itemPath);
        } else if (extname(item) === extension) {
          files.push({
            name: item,
            path: itemPath
          });
        }
      });
    }
    
    try {
      scanDirectory(DIST_DIR);
    } catch (error) {
      console.log(`⚠️  Could not scan ${DIST_DIR} directory`);
    }
    
    return files;
  }
}

// Run audit if called directly
if (import.meta.url.endsWith('performance-audit.js')) {
  const auditor = new PerformanceAuditor();
  auditor.runAudit().catch(console.error);
}

export default PerformanceAuditor;