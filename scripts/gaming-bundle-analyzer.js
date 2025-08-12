/**
 * Gaming Bundle Analyzer
 * 
 * Advanced bundle analysis tool for gaming performance optimization
 * Provides detailed insights into code splitting effectiveness
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { gzipSync, brotliCompressSync } from 'zlib';

class GamingBundleAnalyzer {
  constructor(distPath = 'dist') {
    this.distPath = distPath;
    this.analysisResults = {
      timestamp: new Date().toISOString(),
      bundles: [],
      performance: {},
      recommendations: [],
      criticalIssues: []
    };
  }

  async analyzeBundles() {
    console.log('🎮 Starting Gaming Bundle Analysis...');
    
    if (!existsSync(this.distPath)) {
      throw new Error(`Distribution directory ${this.distPath} does not exist`);
    }

    // Analyze JavaScript bundles
    await this.analyzeJSBundles();
    
    // Analyze CSS bundles
    await this.analyzeCSSBundles();
    
    // Analyze asset files
    await this.analyzeAssets();
    
    // Calculate performance metrics
    this.calculatePerformanceMetrics();
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Check for critical issues
    this.checkCriticalIssues();
    
    // Generate report
    const report = this.generateReport();
    
    console.log('✅ Bundle analysis complete');
    return report;
  }

  analyzeJSBundles() {
    const jsFiles = this.getFilesByExtension('.js');
    
    jsFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf8');
      const fileName = filePath.split('/').pop();
      
      const bundle = {
        name: fileName,
        type: 'javascript',
        size: content.length,
        gzipSize: gzipSync(content).length,
        brotliSize: brotliCompressSync(content).length,
        isEntry: fileName.includes('index') || fileName.includes('main'),
        isChunk: fileName.includes('-') && !fileName.includes('index'),
        category: this.categorizeBundle(fileName),
        priority: this.getBundlePriority(fileName),
        analysis: this.analyzeJSContent(content, fileName)
      };

      this.analysisResults.bundles.push(bundle);
    });
  }

  analyzeCSSBundles() {
    const cssFiles = this.getFilesByExtension('.css');
    
    cssFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf8');
      const fileName = filePath.split('/').pop();
      
      const bundle = {
        name: fileName,
        type: 'css',
        size: content.length,
        gzipSize: gzipSync(content).length,
        brotliSize: brotliCompressSync(content).length,
        category: 'styles',
        priority: 'medium',
        analysis: this.analyzeCSSContent(content, fileName)
      };

      this.analysisResults.bundles.push(bundle);
    });
  }

  analyzeAssets() {
    const assetFiles = this.getFilesByExtension(['.png', '.jpg', '.svg', '.gif', '.webp']);
    
    assetFiles.forEach(filePath => {
      const content = readFileSync(filePath);
      const fileName = filePath.split('/').pop();
      
      const asset = {
        name: fileName,
        type: 'asset',
        size: content.length,
        category: 'media',
        priority: 'low',
        analysis: {
          isOptimized: this.isImageOptimized(fileName, content.length),
          shouldBeWebP: fileName.match(/\.(png|jpg|jpeg)$/i) !== null,
          isCritical: fileName.includes('logo') || fileName.includes('favicon')
        }
      };

      this.analysisResults.bundles.push(asset);
    });
  }

  getFilesByExtension(extensions) {
    const fs = require('fs');
    const path = require('path');
    const files = [];
    
    const extensionList = Array.isArray(extensions) ? extensions : [extensions];
    
    function scanDirectory(dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      items.forEach(item => {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          scanDirectory(fullPath);
        } else {
          const ext = path.extname(item.name);
          if (extensionList.includes(ext)) {
            files.push(fullPath);
          }
        }
      });
    }
    
    scanDirectory(this.distPath);
    return files;
  }

  categorizeBundle(fileName) {
    // Gaming-specific bundle categorization
    const categories = {
      'critical-voting': ['voting', 'burn', 'vote'],
      'critical-wallet': ['wallet', 'phantom', 'web3'],
      'social-clans': ['clans', 'clan', 'leaderboard'],
      'content-mgmt': ['content', 'moderation', 'submission'],
      'token-features': ['token', 'spl', 'solana'],
      'realtime-core': ['websocket', 'realtime', 'socket'],
      'monitoring': ['analytics', 'performance', 'tracking'],
      'vendor': ['vendor', 'lib', 'node_modules'],
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

  analyzeJSContent(content, fileName) {
    return {
      hasReact: content.includes('React') || content.includes('jsx'),
      hasSolana: content.includes('@solana') || content.includes('phantom'),
      hasWebSocket: content.includes('WebSocket') || content.includes('socket'),
      hasAsyncImport: content.includes('import(') || content.includes('lazy('),
      estimatedComplexity: this.estimateComplexity(content),
      dependencyCount: (content.match(/import.*from/g) || []).length,
      exportCount: (content.match(/export/g) || []).length,
      functionCount: (content.match(/function|=>/g) || []).length,
      minified: !content.includes('\n\n') && content.length > 10000
    };
  }

  analyzeCSSContent(content, fileName) {
    return {
      ruleCount: (content.match(/{[^}]*}/g) || []).length,
      hasMediaQueries: content.includes('@media'),
      hasAnimations: content.includes('@keyframes') || content.includes('animation'),
      hasFlexbox: content.includes('flex'),
      hasGrid: content.includes('grid'),
      hasCSSVariables: content.includes('var(--'),
      minified: !content.includes('\n\n') && content.length > 1000
    };
  }

  estimateComplexity(code) {
    // Simple complexity estimation based on various factors
    let complexity = 0;
    
    // Cyclomatic complexity indicators
    complexity += (code.match(/if|else|for|while|switch|case|catch/g) || []).length;
    complexity += (code.match(/&&|\|\||:/g) || []).length;
    complexity += (code.match(/async|await|Promise|then|catch/g) || []).length;
    
    // Return complexity level
    if (complexity < 10) return 'low';
    if (complexity < 25) return 'medium';
    if (complexity < 50) return 'high';
    return 'very-high';
  }

  isImageOptimized(fileName, size) {
    const sizeThresholds = {
      '.png': 100000, // 100KB
      '.jpg': 150000, // 150KB
      '.jpeg': 150000,
      '.gif': 50000,  // 50KB
      '.svg': 10000   // 10KB
    };
    
    const ext = fileName.substring(fileName.lastIndexOf('.'));
    const threshold = sizeThresholds[ext] || 100000;
    
    return size <= threshold;
  }

  calculatePerformanceMetrics() {
    const jsBundles = this.analysisResults.bundles.filter(b => b.type === 'javascript');
    const cssBundles = this.analysisResults.bundles.filter(b => b.type === 'css');
    const assets = this.analysisResults.bundles.filter(b => b.type === 'asset');

    // Calculate total sizes
    const totalSize = this.analysisResults.bundles.reduce((sum, b) => sum + b.size, 0);
    const totalGzipSize = this.analysisResults.bundles.reduce((sum, b) => sum + (b.gzipSize || 0), 0);
    const totalBrotliSize = this.analysisResults.bundles.reduce((sum, b) => sum + (b.brotliSize || 0), 0);

    // Calculate critical path metrics
    const criticalBundles = jsBundles.filter(b => b.priority === 'critical');
    const criticalSize = criticalBundles.reduce((sum, b) => sum + b.size, 0);
    const criticalGzipSize = criticalBundles.reduce((sum, b) => sum + b.gzipSize, 0);

    this.analysisResults.performance = {
      totalBundles: this.analysisResults.bundles.length,
      totalSize: totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      totalGzipSize: totalGzipSize,
      totalGzipSizeFormatted: this.formatBytes(totalGzipSize),
      totalBrotliSize: totalBrotliSize,
      totalBrotliSizeFormatted: this.formatBytes(totalBrotliSize),
      compressionRatio: ((1 - totalGzipSize / totalSize) * 100).toFixed(2) + '%',
      
      // Critical path metrics
      criticalBundleCount: criticalBundles.length,
      criticalSize: criticalSize,
      criticalSizeFormatted: this.formatBytes(criticalSize),
      criticalGzipSize: criticalGzipSize,
      criticalGzipSizeFormatted: this.formatBytes(criticalGzipSize),
      
      // Gaming performance targets
      meetsCriticalSizeTarget: criticalGzipSize <= 200000, // 200KB
      meetsOverallSizeTarget: totalGzipSize <= 1000000,    // 1MB
      
      // Bundle distribution
      jsBundleCount: jsBundles.length,
      cssBundleCount: cssBundles.length,
      assetCount: assets.length,
      
      // Average bundle size
      avgBundleSize: Math.round(totalSize / this.analysisResults.bundles.length),
      avgBundleSizeFormatted: this.formatBytes(Math.round(totalSize / this.analysisResults.bundles.length))
    };
  }

  generateRecommendations() {
    const performance = this.analysisResults.performance;
    const bundles = this.analysisResults.bundles;
    
    // Critical size recommendations
    if (!performance.meetsCriticalSizeTarget) {
      this.analysisResults.recommendations.push({
        type: 'critical',
        category: 'bundle-size',
        message: `Critical bundles exceed 200KB limit (${performance.criticalGzipSizeFormatted})`,
        action: 'Further split critical voting and wallet components',
        impact: 'high',
        effort: 'medium'
      });
    }

    // Large bundle recommendations
    const largeBundles = bundles.filter(b => b.gzipSize > 100000); // 100KB
    largeBundles.forEach(bundle => {
      this.analysisResults.recommendations.push({
        type: 'optimization',
        category: 'bundle-size',
        message: `Large bundle detected: ${bundle.name} (${this.formatBytes(bundle.gzipSize)})`,
        action: `Consider splitting ${bundle.name} into smaller chunks`,
        impact: 'medium',
        effort: 'medium'
      });
    });

    // Unoptimized images
    const unoptimizedImages = bundles.filter(b => 
      b.type === 'asset' && !b.analysis.isOptimized
    );
    
    unoptimizedImages.forEach(asset => {
      this.analysisResults.recommendations.push({
        type: 'optimization',
        category: 'asset-optimization',
        message: `Unoptimized image: ${asset.name} (${this.formatBytes(asset.size)})`,
        action: 'Optimize image and consider WebP format',
        impact: 'low',
        effort: 'low'
      });
    });

    // Code splitting opportunities
    const monolithicBundles = bundles.filter(b => 
      b.type === 'javascript' && 
      b.size > 300000 && 
      !b.analysis.hasAsyncImport
    );
    
    monolithicBundles.forEach(bundle => {
      this.analysisResults.recommendations.push({
        type: 'architecture',
        category: 'code-splitting',
        message: `Monolithic bundle without lazy loading: ${bundle.name}`,
        action: 'Implement React.lazy() and dynamic imports',
        impact: 'high',
        effort: 'high'
      });
    });
  }

  checkCriticalIssues() {
    const performance = this.analysisResults.performance;
    const bundles = this.analysisResults.bundles;

    // Critical size violations
    if (performance.criticalGzipSize > 500000) { // 500KB absolute limit
      this.analysisResults.criticalIssues.push({
        type: 'performance',
        severity: 'critical',
        message: 'Critical bundles exceed 500KB - will severely impact gaming performance',
        affectedBundles: bundles.filter(b => b.priority === 'critical').map(b => b.name)
      });
    }

    // Missing compression
    const uncompressedBundles = bundles.filter(b => 
      b.type === 'javascript' && 
      !b.analysis.minified && 
      b.size > 50000
    );
    
    if (uncompressedBundles.length > 0) {
      this.analysisResults.criticalIssues.push({
        type: 'build',
        severity: 'high',
        message: 'Unminified bundles detected in production build',
        affectedBundles: uncompressedBundles.map(b => b.name)
      });
    }

    // Vendor bundle size
    const vendorBundles = bundles.filter(b => b.category === 'vendor');
    const vendorSize = vendorBundles.reduce((sum, b) => sum + (b.gzipSize || 0), 0);
    
    if (vendorSize > 800000) { // 800KB
      this.analysisResults.criticalIssues.push({
        type: 'dependencies',
        severity: 'medium',
        message: 'Vendor bundles are too large - consider removing unused dependencies',
        details: `Total vendor size: ${this.formatBytes(vendorSize)}`
      });
    }
  }

  generateReport() {
    const report = {
      ...this.analysisResults,
      summary: this.generateSummary(),
      gamingPerformanceScore: this.calculateGamingScore()
    };

    // Save detailed report
    const reportPath = join(this.distPath, 'bundle-analysis-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Save HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = join(this.distPath, 'bundle-analysis-report.html');
    writeFileSync(htmlPath, htmlReport);

    console.log(`📊 Analysis report saved to ${reportPath}`);
    console.log(`📊 HTML report saved to ${htmlPath}`);

    return report;
  }

  generateSummary() {
    const performance = this.analysisResults.performance;
    
    return {
      status: this.analysisResults.criticalIssues.length === 0 ? 'good' : 
              this.analysisResults.criticalIssues.some(i => i.severity === 'critical') ? 'critical' : 'warning',
      totalBundles: performance.totalBundles,
      totalSize: performance.totalSizeFormatted,
      criticalSize: performance.criticalSizeFormatted,
      compressionRatio: performance.compressionRatio,
      recommendations: this.analysisResults.recommendations.length,
      criticalIssues: this.analysisResults.criticalIssues.length,
      gamingOptimized: performance.meetsCriticalSizeTarget && performance.meetsOverallSizeTarget
    };
  }

  calculateGamingScore() {
    let score = 100;
    const performance = this.analysisResults.performance;

    // Deduct points for large critical bundles
    if (performance.criticalGzipSize > 200000) {
      score -= Math.min(30, (performance.criticalGzipSize - 200000) / 10000);
    }

    // Deduct points for overall size
    if (performance.totalGzipSize > 1000000) {
      score -= Math.min(20, (performance.totalGzipSize - 1000000) / 50000);
    }

    // Deduct points for critical issues
    score -= this.analysisResults.criticalIssues.length * 10;

    // Deduct points for unoptimized bundles
    score -= this.analysisResults.recommendations.filter(r => r.impact === 'high').length * 5;

    return Math.max(0, Math.round(score));
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MLG.clan Bundle Analysis Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
        .score { font-size: 3rem; font-weight: bold; color: #00ff9d; }
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .critical { border-left: 4px solid #ff4444; }
        .warning { border-left: 4px solid #ffa500; }
        .good { border-left: 4px solid #00ff9d; }
        .bundle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
        .bundle-item { padding: 1rem; background: #f9f9f9; border-radius: 6px; border-left: 3px solid #ddd; }
        .bundle-critical { border-left-color: #ff4444; }
        .bundle-high { border-left-color: #ffa500; }
        .bundle-medium { border-left-color: #2196f3; }
        .bundle-low { border-left-color: #4caf50; }
        pre { background: #2d2d2d; color: #f8f8f2; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 MLG.clan Bundle Analysis</h1>
        <div class="score">${report.gamingPerformanceScore}/100</div>
        <p>Gaming Performance Score</p>
        <small>Generated: ${report.timestamp}</small>
    </div>

    <div class="cards">
        <div class="card ${report.summary.status === 'good' ? 'good' : report.summary.status === 'critical' ? 'critical' : 'warning'}">
            <h3>Summary</h3>
            <p><strong>Status:</strong> ${report.summary.status.toUpperCase()}</p>
            <p><strong>Total Size:</strong> ${report.summary.totalSize}</p>
            <p><strong>Critical Size:</strong> ${report.summary.criticalSize}</p>
            <p><strong>Compression:</strong> ${report.summary.compressionRatio}</p>
        </div>
        
        <div class="card">
            <h3>Bundle Distribution</h3>
            <p><strong>JavaScript:</strong> ${report.performance.jsBundleCount} bundles</p>
            <p><strong>CSS:</strong> ${report.performance.cssBundleCount} bundles</p>
            <p><strong>Assets:</strong> ${report.performance.assetCount} files</p>
            <p><strong>Average Size:</strong> ${report.performance.avgBundleSizeFormatted}</p>
        </div>
        
        <div class="card">
            <h3>Gaming Targets</h3>
            <p><strong>Critical Size Target:</strong> ${report.performance.meetsCriticalSizeTarget ? '✅' : '❌'} &lt; 200KB</p>
            <p><strong>Overall Size Target:</strong> ${report.performance.meetsOverallSizeTarget ? '✅' : '❌'} &lt; 1MB</p>
        </div>
    </div>

    <div class="cards">
        <div class="card">
            <h3>Bundle Details</h3>
            <div class="bundle-grid">
                ${report.bundles.map(bundle => `
                    <div class="bundle-item bundle-${bundle.priority || 'medium'}">
                        <strong>${bundle.name}</strong><br>
                        Size: ${this.formatBytes(bundle.size)}<br>
                        Gzip: ${bundle.gzipSize ? this.formatBytes(bundle.gzipSize) : 'N/A'}<br>
                        Type: ${bundle.type}<br>
                        Priority: ${bundle.priority || 'N/A'}
                    </div>
                `).join('')}
            </div>
        </div>
    </div>

    ${report.criticalIssues.length > 0 ? `
    <div class="card critical">
        <h3>Critical Issues</h3>
        ${report.criticalIssues.map(issue => `
            <div style="margin-bottom: 1rem; padding: 1rem; background: #fff5f5; border-radius: 6px;">
                <strong>${issue.severity.toUpperCase()}:</strong> ${issue.message}
                ${issue.details ? `<br><small>${issue.details}</small>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="card">
        <h3>Recommendations</h3>
        ${report.recommendations.map(rec => `
            <div style="margin-bottom: 1rem; padding: 1rem; background: #f0f8ff; border-radius: 6px;">
                <strong>${rec.type.toUpperCase()}:</strong> ${rec.message}<br>
                <small>Action: ${rec.action} (Impact: ${rec.impact}, Effort: ${rec.effort})</small>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI Usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new GamingBundleAnalyzer();
  
  analyzer.analyzeBundles()
    .then(report => {
      console.log('\n🎮 Gaming Bundle Analysis Complete!');
      console.log(`📊 Gaming Performance Score: ${report.gamingPerformanceScore}/100`);
      console.log(`📦 Total Bundles: ${report.performance.totalBundles}`);
      console.log(`📏 Total Size: ${report.performance.totalSizeFormatted}`);
      console.log(`⚡ Critical Size: ${report.performance.criticalSizeFormatted}`);
      
      if (report.criticalIssues.length > 0) {
        console.log(`\n⚠️  Critical Issues: ${report.criticalIssues.length}`);
        report.criticalIssues.forEach(issue => {
          console.log(`   - ${issue.message}`);
        });
      }
      
      if (report.recommendations.length > 0) {
        console.log(`\n💡 Recommendations: ${report.recommendations.length}`);
        report.recommendations.slice(0, 3).forEach(rec => {
          console.log(`   - ${rec.message}`);
        });
      }
      
      process.exit(report.criticalIssues.some(i => i.severity === 'critical') ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Bundle analysis failed:', error);
      process.exit(1);
    });
}

export { GamingBundleAnalyzer };
export default GamingBundleAnalyzer;