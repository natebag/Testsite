#!/usr/bin/env node

/**
 * Production Readiness CLI
 * Command-line interface for production readiness validation
 */

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import ProductionReadinessChecker from './production-readiness-checker.js';

class ProductionReadinessCLI {
  constructor() {
    this.checker = new ProductionReadinessChecker();
  }

  /**
   * Display banner
   */
  displayBanner() {
    console.log(chalk.blue.bold(`
╔════════════════════════════════════════════════════════════════════════╗
║                       MLG.clan Production Readiness                    ║
║                         Comprehensive Validation                       ║
╚════════════════════════════════════════════════════════════════════════╝
    `));
    console.log(chalk.yellow('🚀 Validating production deployment readiness...\n'));
  }

  /**
   * Run full production readiness check
   */
  async runFullCheck(options = {}) {
    this.displayBanner();
    
    const spinner = ora('Running production readiness checks...').start();
    
    try {
      const report = await this.checker.runProductionReadinessCheck();
      
      spinner.stop();
      
      // Display results
      this.displayResults(report);
      
      // Export report if requested
      if (options.export) {
        await this.exportReport(report, options.export);
      }
      
      // Exit with appropriate code
      const exitCode = report.summary.production_ready ? 0 : 1;
      if (options.exitCode !== false) {
        process.exit(exitCode);
      }
      
      return report;
      
    } catch (error) {
      spinner.fail('Production readiness check failed');
      console.error(chalk.red('\nError:'), error.message);
      
      if (options.exitCode !== false) {
        process.exit(1);
      }
      throw error;
    }
  }

  /**
   * Display check results
   */
  displayResults(report) {
    const { summary, results, critical_failures, warnings, recommendations } = report;
    
    // Overall status
    console.log(this.getStatusHeader(summary));
    console.log();
    
    // Score breakdown
    this.displayScoreBreakdown(summary, results);
    
    // Category breakdown
    this.displayCategoryBreakdown(report.checklist_categories);
    
    // Critical failures
    if (critical_failures.length > 0) {
      this.displayCriticalFailures(critical_failures);
    }
    
    // Warnings
    if (warnings.length > 0) {
      this.displayWarnings(warnings);
    }
    
    // Recommendations
    this.displayRecommendations(recommendations);
    
    // Final verdict
    this.displayFinalVerdict(summary);
  }

  /**
   * Get status header with color coding
   */
  getStatusHeader(summary) {
    const { percentage, readiness_level, production_ready } = summary;
    
    let statusColor, statusIcon;
    
    if (production_ready) {
      statusColor = percentage >= 95 ? chalk.green : chalk.yellow;
      statusIcon = percentage >= 95 ? '🎉' : '✅';
    } else {
      statusColor = chalk.red;
      statusIcon = '❌';
    }
    
    return statusColor.bold(`
${statusIcon} Production Readiness: ${readiness_level}
📊 Overall Score: ${percentage}% (${summary.overall_score}/${summary.max_score} points)
🚀 Production Ready: ${production_ready ? 'YES' : 'NO'}
    `);
  }

  /**
   * Display score breakdown
   */
  displayScoreBreakdown(summary, results) {
    console.log(chalk.bold('📋 Check Summary:'));
    console.log('================');
    console.log(`Total Checks: ${results.total_checks}`);
    console.log(`${chalk.green('✓')} Passed: ${results.passed_checks}`);
    console.log(`${chalk.red('✗')} Failed: ${results.failed_checks}`);
    console.log(`${chalk.red('🚨')} Critical Failures: ${results.critical_failures}`);
    console.log(`${chalk.yellow('⚠️')} Warnings: ${results.warnings}`);
    console.log();
  }

  /**
   * Display category breakdown
   */
  displayCategoryBreakdown(categories) {
    console.log(chalk.bold('📂 Category Breakdown:'));
    console.log('======================');
    
    Object.entries(categories).forEach(([categoryName, categoryData]) => {
      const { percentage, passed, total } = categoryData;
      const statusIcon = percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️' : '❌';
      const color = percentage >= 80 ? chalk.green : percentage >= 60 ? chalk.yellow : chalk.red;
      
      console.log(
        `${statusIcon} ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}: ` +
        color(`${percentage}%`) + ` (${passed}/${total} checks passed)`
      );
    });
    console.log();
  }

  /**
   * Display critical failures
   */
  displayCriticalFailures(failures) {
    console.log(chalk.red.bold('🚨 CRITICAL FAILURES - Must Fix Before Production:'));
    console.log('==================================================');
    
    failures.forEach((failure, index) => {
      console.log(chalk.red(`${index + 1}. ${failure.description}`));
      console.log(chalk.gray(`   Error: ${failure.message}`));
      console.log();
    });
  }

  /**
   * Display warnings
   */
  displayWarnings(warnings) {
    console.log(chalk.yellow.bold('⚠️  WARNINGS - Recommended Fixes:'));
    console.log('==================================');
    
    warnings.forEach((warning, index) => {
      console.log(chalk.yellow(`${index + 1}. ${warning.description}`));
      console.log(chalk.gray(`   Issue: ${warning.message}`));
    });
    console.log();
  }

  /**
   * Display recommendations
   */
  displayRecommendations(recommendations) {
    console.log(chalk.bold('💡 Recommendations:'));
    console.log('===================');
    
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    console.log();
  }

  /**
   * Display final verdict
   */
  displayFinalVerdict(summary) {
    const { production_ready, percentage } = summary;
    
    console.log('='.repeat(70));
    
    if (production_ready) {
      if (percentage >= 95) {
        console.log(chalk.green.bold('🎉 EXCELLENT! Ready for production deployment'));
        console.log(chalk.green('   All critical requirements met with high score'));
      } else if (percentage >= 85) {
        console.log(chalk.green.bold('✅ GOOD! Ready for production deployment'));
        console.log(chalk.yellow('   Consider addressing warnings for optimal performance'));
      } else {
        console.log(chalk.yellow.bold('✅ ACCEPTABLE! Ready for production deployment'));
        console.log(chalk.yellow('   Strongly recommend addressing warnings before deployment'));
      }
    } else {
      console.log(chalk.red.bold('❌ NOT READY for production deployment'));
      console.log(chalk.red('   Critical failures must be resolved before proceeding'));
    }
    
    console.log('='.repeat(70));
  }

  /**
   * Run specific category check
   */
  async runCategoryCheck(category, options = {}) {
    console.log(chalk.blue(`Running ${category} readiness checks...\n`));
    
    const spinner = ora(`Checking ${category} configuration...`).start();
    
    try {
      const fullReport = await this.checker.runProductionReadinessCheck();
      const categoryData = fullReport.checklist_categories[category];
      
      spinner.stop();
      
      if (!categoryData) {
        console.log(chalk.red(`Unknown category: ${category}`));
        return;
      }
      
      // Display category-specific results
      this.displayCategoryResults(category, categoryData, fullReport);
      
    } catch (error) {
      spinner.fail(`${category} check failed`);
      console.error(chalk.red('Error:'), error.message);
      
      if (options.exitCode !== false) {
        process.exit(1);
      }
    }
  }

  /**
   * Display category-specific results
   */
  displayCategoryResults(categoryName, categoryData, fullReport) {
    const { percentage, passed, total } = categoryData;
    
    console.log(chalk.bold(`📊 ${categoryName.toUpperCase()} Results:`));
    console.log('='.repeat(30));
    console.log(`Score: ${percentage}% (${passed}/${total} passed)`);
    console.log();
    
    // Show individual test results for this category
    const categoryTests = this.getCategoryTests(categoryName);
    categoryTests.forEach(testName => {
      const result = fullReport.detailed_results[testName];
      if (result) {
        const icon = result.passed ? chalk.green('✓') : chalk.red('✗');
        const weight = `[${result.weight}pt]`;
        console.log(`${icon} ${result.description} ${chalk.gray(weight)}`);
        if (!result.passed) {
          console.log(chalk.gray(`  ${result.message}`));
        }
      }
    });
  }

  /**
   * Get tests for a specific category
   */
  getCategoryTests(category) {
    const categoryMap = {
      infrastructure: ['environment_configuration', 'ssl_certificates', 'database_setup', 'redis_setup', 'solana_connectivity', 'load_balancer_config', 'auto_scaling_setup'],
      security: ['security_headers', 'rate_limiting', 'input_sanitization', 'authentication_system', 'csp_implementation', 'ddos_protection', 'audit_logging', 'gdpr_compliance'],
      application: ['gaming_features', 'web3_integration', 'voting_system', 'clan_system', 'content_system', 'mobile_responsiveness'],
      performance: ['performance_optimization', 'caching_strategy', 'cdn_setup', 'lazy_loading', 'bundle_optimization'],
      monitoring: ['health_monitoring', 'error_tracking', 'logging_system', 'backup_system', 'deployment_automation']
    };
    
    return categoryMap[category] || [];
  }

  /**
   * Export report to file
   */
  async exportReport(report, exportPath) {
    try {
      // Ensure directory exists
      const dir = path.dirname(exportPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Generate different export formats
      const ext = path.extname(exportPath).toLowerCase();
      
      if (ext === '.json') {
        await fs.writeFile(exportPath, JSON.stringify(report, null, 2));
      } else if (ext === '.txt') {
        await this.exportTextReport(report, exportPath);
      } else if (ext === '.html') {
        await this.exportHTMLReport(report, exportPath);
      } else {
        // Default to JSON
        await fs.writeFile(exportPath, JSON.stringify(report, null, 2));
      }
      
      console.log(chalk.green(`\n📄 Report exported to: ${exportPath}`));
      
    } catch (error) {
      console.error(chalk.red('Export failed:'), error.message);
    }
  }

  /**
   * Export text report
   */
  async exportTextReport(report, filePath) {
    const lines = [];
    
    lines.push('MLG.clan Production Readiness Report');
    lines.push('=' .repeat(40));
    lines.push(`Generated: ${report.summary.timestamp}`);
    lines.push(`Overall Score: ${report.summary.percentage}% (${report.summary.overall_score}/${report.summary.max_score})`);
    lines.push(`Production Ready: ${report.summary.production_ready ? 'YES' : 'NO'}`);
    lines.push('');
    
    if (report.critical_failures.length > 0) {
      lines.push('CRITICAL FAILURES:');
      lines.push('-'.repeat(20));
      report.critical_failures.forEach(failure => {
        lines.push(`- ${failure.description}: ${failure.message}`);
      });
      lines.push('');
    }
    
    if (report.warnings.length > 0) {
      lines.push('WARNINGS:');
      lines.push('-'.repeat(10));
      report.warnings.forEach(warning => {
        lines.push(`- ${warning.description}: ${warning.message}`);
      });
      lines.push('');
    }
    
    lines.push('RECOMMENDATIONS:');
    lines.push('-'.repeat(15));
    report.recommendations.forEach(rec => {
      lines.push(`- ${rec}`);
    });
    
    await fs.writeFile(filePath, lines.join('\n'));
  }

  /**
   * Export HTML report
   */
  async exportHTMLReport(report, filePath) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MLG.clan Production Readiness Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .score { font-size: 24px; font-weight: bold; }
        .ready { color: green; }
        .not-ready { color: red; }
        .warning { color: orange; }
        .section { margin: 20px 0; }
        .failure, .warning-item { background: #ffe6e6; padding: 10px; margin: 5px 0; border-left: 4px solid red; }
        .warning-item { background: #fff3cd; border-left-color: orange; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .pass { color: green; }
        .fail { color: red; }
    </style>
</head>
<body>
    <div class="header">
        <h1>MLG.clan Production Readiness Report</h1>
        <p>Generated: ${report.summary.timestamp}</p>
        <div class="score ${report.summary.production_ready ? 'ready' : 'not-ready'}">
            Overall Score: ${report.summary.percentage}% (${report.summary.overall_score}/${report.summary.max_score})
        </div>
        <p><strong>Production Ready:</strong> <span class="${report.summary.production_ready ? 'ready' : 'not-ready'}">${report.summary.production_ready ? 'YES' : 'NO'}</span></p>
    </div>
    
    ${report.critical_failures.length > 0 ? `
    <div class="section">
        <h2>Critical Failures</h2>
        ${report.critical_failures.map(failure => `
            <div class="failure">
                <strong>${failure.description}</strong><br>
                ${failure.message}
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${report.warnings.length > 0 ? `
    <div class="section">
        <h2>Warnings</h2>
        ${report.warnings.map(warning => `
            <div class="warning-item">
                <strong>${warning.description}</strong><br>
                ${warning.message}
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    <div class="section">
        <h2>Category Breakdown</h2>
        <table>
            <tr><th>Category</th><th>Score</th><th>Passed</th><th>Total</th></tr>
            ${Object.entries(report.checklist_categories).map(([name, data]) => `
                <tr>
                    <td>${name.charAt(0).toUpperCase() + name.slice(1)}</td>
                    <td>${data.percentage}%</td>
                    <td>${data.passed}</td>
                    <td>${data.total}</td>
                </tr>
            `).join('')}
        </table>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>`;
    
    await fs.writeFile(filePath, html);
  }

  /**
   * Setup CLI commands
   */
  setupCommands() {
    program
      .name('production-readiness')
      .description('MLG.clan Production Readiness Validator')
      .version('1.0.0');

    program
      .command('check')
      .description('Run complete production readiness check')
      .option('-e, --export <path>', 'Export report to file (.json, .txt, .html)')
      .option('--no-exit-code', 'Do not exit with error code on failure')
      .action(async (options) => {
        await this.runFullCheck(options);
      });

    program
      .command('category <category>')
      .description('Check specific category (infrastructure, security, application, performance, monitoring)')
      .option('--no-exit-code', 'Do not exit with error code on failure')
      .action(async (category, options) => {
        await this.runCategoryCheck(category.toLowerCase(), options);
      });

    program
      .command('score')
      .description('Show current readiness score only')
      .action(async () => {
        const spinner = ora('Calculating readiness score...').start();
        try {
          const report = await this.checker.runProductionReadinessCheck();
          spinner.stop();
          
          console.log(chalk.blue.bold('MLG.clan Production Readiness Score'));
          console.log('=' .repeat(35));
          console.log(`Score: ${chalk.bold(report.summary.percentage + '%')} (${report.summary.overall_score}/${report.summary.max_score})`);
          console.log(`Level: ${chalk.bold(report.summary.readiness_level)}`);
          console.log(`Ready: ${report.summary.production_ready ? chalk.green('YES') : chalk.red('NO')}`);
          
          process.exit(report.summary.production_ready ? 0 : 1);
        } catch (error) {
          spinner.fail('Score calculation failed');
          console.error(chalk.red('Error:'), error.message);
          process.exit(1);
        }
      });

    if (process.argv.length <= 2) {
      this.runFullCheck();
      return;
    }

    program.parse();
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new ProductionReadinessCLI();
  cli.setupCommands();
}

export default ProductionReadinessCLI;