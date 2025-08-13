#!/usr/bin/env node

/**
 * MLG.clan Production Migration CLI
 * Command-line interface for database migrations in production
 */

import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ProductionMigrationManager from '../../src/core/database/migrations/production-migration-manager.js';
import environmentManager from '../../src/core/config/environment-manager.js';

class MigrationCLI {
  constructor() {
    this.migrationManager = new ProductionMigrationManager();
    this.isProduction = environmentManager.isProduction();
  }

  /**
   * Display banner
   */
  displayBanner() {
    console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════╗
║               MLG.clan Migration Tool            ║
║            Production Database Manager           ║
╚══════════════════════════════════════════════════╝
    `));
    
    console.log(chalk.yellow(`Environment: ${environmentManager.get('NODE_ENV')}`));
    console.log(chalk.yellow(`Database: ${this.sanitizeUrl(environmentManager.get('database.url'))}`));
    console.log();
  }

  /**
   * Sanitize database URL for display
   */
  sanitizeUrl(url) {
    return url.replace(/\/\/.*@/, '//***@');
  }

  /**
   * Confirm production operations
   */
  async confirmProductionOperation(operation) {
    if (!this.isProduction) return true;

    console.log(chalk.red.bold('⚠️  PRODUCTION ENVIRONMENT DETECTED ⚠️'));
    console.log(chalk.red(`You are about to perform: ${operation}`));
    console.log();

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Are you absolutely sure you want to proceed?',
        default: false
      }
    ]);

    if (!confirmed) {
      console.log(chalk.yellow('Operation cancelled.'));
      process.exit(0);
    }

    // Double confirmation for critical operations
    if (operation.includes('rollback') || operation.includes('reset')) {
      const { doubleConfirmed } = await inquirer.prompt([
        {
          type: 'input',
          name: 'doubleConfirmed',
          message: 'Type "CONFIRM" to proceed:',
          validate: (input) => input === 'CONFIRM' || 'You must type "CONFIRM" exactly'
        }
      ]);

      if (doubleConfirmed !== 'CONFIRM') {
        console.log(chalk.yellow('Operation cancelled.'));
        process.exit(0);
      }
    }

    return true;
  }

  /**
   * Run pending migrations
   */
  async runMigrations(options = {}) {
    try {
      await this.confirmProductionOperation('run pending migrations');

      console.log(chalk.blue('Checking for pending migrations...'));
      
      const result = await this.migrationManager.runMigrations({
        dryRun: options.dryRun,
        targetMigration: options.target
      });

      if (result.dryRun) {
        console.log(chalk.yellow('✓ Dry run completed - no changes made'));
        return;
      }

      if (result.success) {
        console.log(chalk.green(`✓ Successfully ran ${result.migrationsRun} migrations`));
        
        if (result.results && result.results.length > 0) {
          console.log('\nMigration results:');
          result.results.forEach(migration => {
            const status = migration.success ? chalk.green('✓') : chalk.red('✗');
            const time = migration.executionTime ? ` (${migration.executionTime}ms)` : '';
            console.log(`  ${status} ${migration.name}${time}`);
          });
        }
      } else {
        console.log(chalk.red('✗ Some migrations failed'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Migration error:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Rollback migrations
   */
  async rollbackMigrations(options = {}) {
    try {
      await this.confirmProductionOperation(`rollback ${options.steps || 1} migrations`);

      console.log(chalk.yellow(`Rolling back ${options.steps || 1} migrations...`));
      
      const result = await this.migrationManager.rollbackMigrations({
        steps: options.steps,
        targetMigration: options.target
      });

      if (result.success) {
        console.log(chalk.green(`✓ Successfully rolled back ${result.rolledBack} migrations`));
        
        if (result.results && result.results.length > 0) {
          console.log('\nRollback results:');
          result.results.forEach(migration => {
            const status = migration.success ? chalk.green('✓') : chalk.red('✗');
            console.log(`  ${status} ${migration.name}`);
          });
        }
      } else {
        console.log(chalk.red('✗ Some rollbacks failed'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Rollback error:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Show migration status
   */
  async showStatus() {
    try {
      console.log(chalk.blue('Fetching migration status...'));
      
      const status = await this.migrationManager.getMigrationStatus();
      
      console.log(chalk.bold('\nMigration Summary:'));
      console.log('==================');
      
      if (status.summary && status.summary.length > 0) {
        status.summary.forEach(item => {
          const statusColor = item.status === 'completed' ? chalk.green : 
                             item.status === 'failed' ? chalk.red : chalk.yellow;
          console.log(`${statusColor(item.status.toUpperCase())}: ${item.count} migrations`);
        });
      } else {
        console.log(chalk.yellow('No migration history found'));
      }
      
      console.log(`\nEnvironment: ${chalk.yellow(status.environment)}`);
      console.log(`Database: ${chalk.yellow(this.sanitizeUrl(status.database_url))}`);
      
      if (status.recent_migrations && status.recent_migrations.length > 0) {
        console.log(chalk.bold('\nRecent Migrations:'));
        console.log('==================');
        
        status.recent_migrations.forEach(migration => {
          const statusColor = migration.status === 'completed' ? chalk.green : 
                             migration.status === 'failed' ? chalk.red : chalk.yellow;
          const executionTime = migration.execution_time_ms ? ` (${migration.execution_time_ms}ms)` : '';
          const executedAt = new Date(migration.executed_at).toLocaleString();
          
          console.log(`${statusColor('●')} ${migration.migration_name}${executionTime}`);
          console.log(`  ${chalk.gray(`Executed: ${executedAt} | Environment: ${migration.environment}`)}`);
        });
      }
    } catch (error) {
      console.error(chalk.red('Status error:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Validate migration integrity
   */
  async validateIntegrity() {
    try {
      console.log(chalk.blue('Validating migration integrity...'));
      
      const validation = await this.migrationManager.validateMigrationIntegrity();
      
      if (validation.valid) {
        console.log(chalk.green(`✓ All ${validation.total} migrations are valid`));
      } else {
        console.log(chalk.red(`✗ ${validation.invalid_count} of ${validation.total} migrations are invalid`));
        
        console.log(chalk.bold('\nValidation Results:'));
        console.log('===================');
        
        validation.results.forEach(result => {
          const status = result.valid ? chalk.green('✓') : chalk.red('✗');
          console.log(`${status} ${result.migration} - ${result.status}`);
          
          if (!result.valid && result.stored_checksum && result.current_checksum) {
            console.log(`  ${chalk.gray(`Stored: ${result.stored_checksum.substring(0, 8)}`)}`);
            console.log(`  ${chalk.gray(`Current: ${result.current_checksum.substring(0, 8)}`)}`);
          }
        });
        
        if (this.isProduction) {
          console.log(chalk.red('\n⚠️  Migration integrity issues detected in production!'));
          process.exit(1);
        }
      }
    } catch (error) {
      console.error(chalk.red('Validation error:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Show pending migrations
   */
  async showPending() {
    try {
      console.log(chalk.blue('Checking for pending migrations...'));
      
      const pending = await this.migrationManager.getPendingMigrations();
      
      if (pending.length === 0) {
        console.log(chalk.green('✓ No pending migrations'));
      } else {
        console.log(chalk.yellow(`Found ${pending.length} pending migrations:`));
        console.log();
        
        pending.forEach((migration, index) => {
          console.log(`${chalk.blue((index + 1).toString().padStart(2))}. ${migration}`);
        });
        
        if (this.isProduction) {
          console.log(chalk.yellow('\n⚠️  Run migrations carefully in production!'));
        }
      }
    } catch (error) {
      console.error(chalk.red('Error checking pending migrations:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Interactive migration wizard
   */
  async runWizard() {
    console.log(chalk.blue.bold('MLG.clan Migration Wizard'));
    console.log(chalk.gray('Interactive migration management\n'));

    try {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Show migration status', value: 'status' },
            { name: 'Show pending migrations', value: 'pending' },
            { name: 'Run pending migrations', value: 'migrate' },
            { name: 'Run dry-run migration', value: 'dry-run' },
            { name: 'Rollback migrations', value: 'rollback' },
            { name: 'Validate migration integrity', value: 'validate' },
            { name: 'Exit', value: 'exit' }
          ]
        }
      ]);

      switch (action) {
        case 'status':
          await this.showStatus();
          break;
        case 'pending':
          await this.showPending();
          break;
        case 'migrate':
          await this.runMigrations();
          break;
        case 'dry-run':
          await this.runMigrations({ dryRun: true });
          break;
        case 'rollback':
          const { steps } = await inquirer.prompt([
            {
              type: 'number',
              name: 'steps',
              message: 'How many migrations to rollback?',
              default: 1,
              validate: (input) => input > 0 || 'Must be greater than 0'
            }
          ]);
          await this.rollbackMigrations({ steps });
          break;
        case 'validate':
          await this.validateIntegrity();
          break;
        case 'exit':
          console.log(chalk.blue('Goodbye!'));
          process.exit(0);
          break;
      }
    } catch (error) {
      console.error(chalk.red('Wizard error:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Setup CLI commands
   */
  setupCommands() {
    program
      .name('migrate-production')
      .description('MLG.clan Production Database Migration Tool')
      .version('1.0.0');

    program
      .command('status')
      .description('Show migration status')
      .action(async () => {
        this.displayBanner();
        await this.showStatus();
        process.exit(0);
      });

    program
      .command('pending')
      .description('Show pending migrations')
      .action(async () => {
        this.displayBanner();
        await this.showPending();
        process.exit(0);
      });

    program
      .command('migrate')
      .description('Run pending migrations')
      .option('--dry-run', 'Show what would be migrated without executing')
      .option('--target <migration>', 'Run migrations up to target migration')
      .action(async (options) => {
        this.displayBanner();
        await this.runMigrations(options);
        process.exit(0);
      });

    program
      .command('rollback')
      .description('Rollback migrations')
      .option('--steps <number>', 'Number of migrations to rollback', '1')
      .option('--target <migration>', 'Rollback to target migration')
      .action(async (options) => {
        this.displayBanner();
        await this.rollbackMigrations({
          steps: parseInt(options.steps),
          target: options.target
        });
        process.exit(0);
      });

    program
      .command('validate')
      .description('Validate migration integrity')
      .action(async () => {
        this.displayBanner();
        await this.validateIntegrity();
        process.exit(0);
      });

    program
      .command('wizard')
      .description('Interactive migration wizard')
      .action(async () => {
        this.displayBanner();
        await this.runWizard();
        process.exit(0);
      });

    // Default to wizard if no command provided
    if (process.argv.length <= 2) {
      this.displayBanner();
      this.runWizard();
      return;
    }

    program.parse();
  }

  /**
   * Handle process cleanup
   */
  setupCleanup() {
    const cleanup = async (signal) => {
      console.log(chalk.yellow(`\nReceived ${signal}, cleaning up...`));
      
      try {
        await this.migrationManager.close();
        console.log(chalk.blue('Database connections closed'));
      } catch (error) {
        console.error(chalk.red('Cleanup error:'), error.message);
      }
      
      process.exit(0);
    };

    process.on('SIGINT', () => cleanup('SIGINT'));
    process.on('SIGTERM', () => cleanup('SIGTERM'));
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
      process.exit(1);
    });

    process.on('uncaughtException', (error) => {
      console.error(chalk.red('Uncaught Exception:'), error);
      process.exit(1);
    });
  }

  /**
   * Run the CLI
   */
  async run() {
    this.setupCleanup();
    this.setupCommands();
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new MigrationCLI();
  cli.run().catch(error => {
    console.error(chalk.red('CLI Error:'), error.message);
    process.exit(1);
  });
}

export default MigrationCLI;