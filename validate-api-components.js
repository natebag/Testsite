/**
 * API Component Validation Script
 * Validates all MLG API integration components for Task 14.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MLGAPIValidator {
    constructor() {
        this.results = [];
        this.errors = [];
        this.components = [
            'mlg-error-handler.js',
            'mlg-api-client-consolidated.js', 
            'mlg-auth-manager.js',
            'mlg-websocket-manager.js',
            'mlg-cache-manager.js'
        ];
    }

    async validateAll() {
        console.log('🎮 Starting MLG API Component Validation...\n');

        // Validate file existence
        await this.validateFileExistence();
        
        // Validate component structure
        await this.validateComponentStructure();
        
        // Validate integration points
        await this.validateIntegrationPoints();
        
        // Generate report
        this.generateReport();
    }

    async validateFileExistence() {
        console.log('📁 Validating file existence...');
        
        for (const component of this.components) {
            const filePath = path.join(__dirname, 'src', 'js', component);
            
            try {
                const exists = fs.existsSync(filePath);
                if (exists) {
                    const stats = fs.statSync(filePath);
                    this.results.push({
                        component,
                        test: 'File Existence',
                        status: 'PASS',
                        details: `File exists (${stats.size} bytes)`
                    });
                } else {
                    this.results.push({
                        component,
                        test: 'File Existence', 
                        status: 'FAIL',
                        details: 'File not found'
                    });
                    this.errors.push(`Missing file: ${component}`);
                }
            } catch (error) {
                this.results.push({
                    component,
                    test: 'File Existence',
                    status: 'ERROR',
                    details: error.message
                });
                this.errors.push(`Error checking ${component}: ${error.message}`);
            }
        }
    }

    async validateComponentStructure() {
        console.log('🔍 Validating component structure...');
        
        for (const component of this.components) {
            const filePath = path.join(__dirname, 'src', 'js', component);
            
            if (!fs.existsSync(filePath)) continue;
            
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Check for class definition
                const className = this.getExpectedClassName(component);
                const hasClass = content.includes(`class ${className}`);
                
                this.results.push({
                    component,
                    test: 'Class Definition',
                    status: hasClass ? 'PASS' : 'FAIL', 
                    details: hasClass ? `${className} class found` : `${className} class not found`
                });
                
                // Check for constructor
                const hasConstructor = content.includes('constructor(');
                this.results.push({
                    component,
                    test: 'Constructor',
                    status: hasConstructor ? 'PASS' : 'FAIL',
                    details: hasConstructor ? 'Constructor found' : 'Constructor not found'
                });
                
                // Check for init method
                const hasInit = content.includes('init(') || content.includes('async init(');
                this.results.push({
                    component,
                    test: 'Initialization Method',
                    status: hasInit ? 'PASS' : 'FAIL', 
                    details: hasInit ? 'Init method found' : 'Init method not found'
                });
                
                // Check for global instance creation
                const hasGlobalInstance = content.includes(`window.${className}`);
                this.results.push({
                    component,
                    test: 'Global Instance',
                    status: hasGlobalInstance ? 'PASS' : 'FAIL',
                    details: hasGlobalInstance ? 'Global instance created' : 'Global instance not created'
                });
                
                // Check for ES6 export
                const hasExport = content.includes('export default') && content.includes(`export { ${className} }`);
                this.results.push({
                    component,
                    test: 'ES6 Exports',
                    status: hasExport ? 'PASS' : 'FAIL',
                    details: hasExport ? 'ES6 exports found' : 'ES6 exports not found'
                });
                
                // Component-specific validations
                await this.validateComponentSpecific(component, content);
                
            } catch (error) {
                this.results.push({
                    component,
                    test: 'Structure Analysis',
                    status: 'ERROR', 
                    details: error.message
                });
            }
        }
    }

    async validateComponentSpecific(component, content) {
        switch (component) {
            case 'mlg-error-handler.js':
                this.validateErrorHandler(content);
                break;
            case 'mlg-api-client-consolidated.js':
                this.validateApiClient(content);
                break;
            case 'mlg-auth-manager.js':
                this.validateAuthManager(content);
                break;
            case 'mlg-websocket-manager.js':
                this.validateWebSocketManager(content);
                break;
            case 'mlg-cache-manager.js':
                this.validateCacheManager(content);
                break;
        }
    }

    validateErrorHandler(content) {
        const component = 'mlg-error-handler.js';
        
        // Check for Xbox 360 themed error codes
        const hasXboxCodes = content.includes('E74') && content.includes('0102');
        this.results.push({
            component,
            test: 'Xbox 360 Error Codes',
            status: hasXboxCodes ? 'PASS' : 'FAIL',
            details: hasXboxCodes ? 'Xbox-themed error codes found' : 'Xbox-themed error codes missing'
        });

        // Check for gaming-themed messages
        const hasGamingThemes = content.includes('Red Ring') && content.includes('Achievement');
        this.results.push({
            component,
            test: 'Gaming-Themed Messages',
            status: hasGamingThemes ? 'PASS' : 'FAIL',
            details: hasGamingThemes ? 'Gaming-themed messages found' : 'Gaming-themed messages missing'
        });

        // Check for recovery strategies
        const hasRecoveryStrategies = content.includes('RECOVERY_STRATEGIES');
        this.results.push({
            component,
            test: 'Recovery Strategies',
            status: hasRecoveryStrategies ? 'PASS' : 'FAIL',
            details: hasRecoveryStrategies ? 'Recovery strategies defined' : 'Recovery strategies missing'
        });

        // Check for circuit breakers
        const hasCircuitBreakers = content.includes('circuitBreakers');
        this.results.push({
            component,
            test: 'Circuit Breakers',
            status: hasCircuitBreakers ? 'PASS' : 'FAIL',
            details: hasCircuitBreakers ? 'Circuit breaker system found' : 'Circuit breaker system missing'
        });
    }

    validateApiClient(content) {
        const component = 'mlg-api-client-consolidated.js';
        
        // Check for endpoint configuration
        const hasEndpoints = content.includes('endpoints');
        this.results.push({
            component,
            test: 'Endpoint Configuration',
            status: hasEndpoints ? 'PASS' : 'FAIL',
            details: hasEndpoints ? 'Endpoint configuration found' : 'Endpoint configuration missing'
        });

        // Check for HTTP methods
        const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];
        const hasAllMethods = httpMethods.every(method => content.includes(`async ${method}(`));
        this.results.push({
            component,
            test: 'HTTP Methods',
            status: hasAllMethods ? 'PASS' : 'FAIL',
            details: hasAllMethods ? 'All HTTP methods implemented' : 'Some HTTP methods missing'
        });

        // Check for interceptors
        const hasInterceptors = content.includes('requestInterceptors') && content.includes('responseInterceptors');
        this.results.push({
            component,
            test: 'Request/Response Interceptors',
            status: hasInterceptors ? 'PASS' : 'FAIL',
            details: hasInterceptors ? 'Interceptors implemented' : 'Interceptors missing'
        });

        // Check for gaming-themed API methods
        const hasGamingMethods = content.includes('login') && content.includes('getClans') && content.includes('castVote');
        this.results.push({
            component,
            test: 'Gaming API Methods',
            status: hasGamingMethods ? 'PASS' : 'FAIL',
            details: hasGamingMethods ? 'Gaming-specific methods found' : 'Gaming-specific methods missing'
        });
    }

    validateAuthManager(content) {
        const component = 'mlg-auth-manager.js';
        
        // Check for token encryption
        const hasEncryption = content.includes('encryptData') && content.includes('decryptData');
        this.results.push({
            component,
            test: 'Token Encryption',
            status: hasEncryption ? 'PASS' : 'FAIL',
            details: hasEncryption ? 'Token encryption implemented' : 'Token encryption missing'
        });

        // Check for fingerprinting
        const hasFingerprinting = content.includes('generateDeviceFingerprint');
        this.results.push({
            component,
            test: 'Device Fingerprinting',
            status: hasFingerprinting ? 'PASS' : 'FAIL',
            details: hasFingerprinting ? 'Device fingerprinting found' : 'Device fingerprinting missing'
        });

        // Check for session management
        const hasSessionMgmt = content.includes('sessionTimeout') && content.includes('activityTimeout');
        this.results.push({
            component,
            test: 'Session Management',
            status: hasSessionMgmt ? 'PASS' : 'FAIL',
            details: hasSessionMgmt ? 'Session management implemented' : 'Session management missing'
        });

        // Check for token refresh
        const hasTokenRefresh = content.includes('refreshToken');
        this.results.push({
            component,
            test: 'Token Refresh',
            status: hasTokenRefresh ? 'PASS' : 'FAIL',
            details: hasTokenRefresh ? 'Token refresh implemented' : 'Token refresh missing'
        });
    }

    validateWebSocketManager(content) {
        const component = 'mlg-websocket-manager.js';
        
        // Check for subscription system
        const hasSubscriptions = content.includes('subscribe') && content.includes('unsubscribe');
        this.results.push({
            component,
            test: 'Subscription System',
            status: hasSubscriptions ? 'PASS' : 'FAIL',
            details: hasSubscriptions ? 'Subscription system found' : 'Subscription system missing'
        });

        // Check for reconnection logic
        const hasReconnection = content.includes('reconnect') && content.includes('maxReconnectAttempts');
        this.results.push({
            component,
            test: 'Reconnection Logic',
            status: hasReconnection ? 'PASS' : 'FAIL',
            details: hasReconnection ? 'Reconnection logic implemented' : 'Reconnection logic missing'
        });

        // Check for fallback to polling
        const hasFallback = content.includes('initPollingFallback');
        this.results.push({
            component,
            test: 'Polling Fallback',
            status: hasFallback ? 'PASS' : 'FAIL',
            details: hasFallback ? 'Polling fallback implemented' : 'Polling fallback missing'
        });

        // Check for gaming-specific events
        const hasGamingEvents = content.includes('voting_update') && content.includes('clan_update');
        this.results.push({
            component,
            test: 'Gaming Events',
            status: hasGamingEvents ? 'PASS' : 'FAIL',
            details: hasGamingEvents ? 'Gaming-specific events found' : 'Gaming-specific events missing'
        });
    }

    validateCacheManager(content) {
        const component = 'mlg-cache-manager.js';
        
        // Check for multi-level caching
        const hasMultiLevel = content.includes('memoryCache') && content.includes('localStorage');
        this.results.push({
            component,
            test: 'Multi-Level Caching',
            status: hasMultiLevel ? 'PASS' : 'FAIL',
            details: hasMultiLevel ? 'Multi-level caching implemented' : 'Multi-level caching missing'
        });

        // Check for compression
        const hasCompression = content.includes('compress') && content.includes('decompress');
        this.results.push({
            component,
            test: 'Data Compression',
            status: hasCompression ? 'PASS' : 'FAIL',
            details: hasCompression ? 'Data compression implemented' : 'Data compression missing'
        });

        // Check for TTL strategies
        const hasTTL = content.includes('strategies') && content.includes('ttl');
        this.results.push({
            component,
            test: 'TTL Strategies',
            status: hasTTL ? 'PASS' : 'FAIL',
            details: hasTTL ? 'TTL strategies implemented' : 'TTL strategies missing'
        });

        // Check for performance monitoring
        const hasPerformance = content.includes('getStats') && content.includes('getPerformanceReport');
        this.results.push({
            component,
            test: 'Performance Monitoring',
            status: hasPerformance ? 'PASS' : 'FAIL',
            details: hasPerformance ? 'Performance monitoring found' : 'Performance monitoring missing'
        });
    }

    async validateIntegrationPoints() {
        console.log('🔗 Validating integration points...');
        
        // Check HTML files for component loading
        const htmlFiles = ['index.html', 'voting.html', 'content.html', 'clans.html'];
        
        for (const htmlFile of htmlFiles) {
            const filePath = path.join(__dirname, htmlFile);
            
            if (!fs.existsSync(filePath)) {
                this.results.push({
                    component: htmlFile,
                    test: 'HTML File Existence',
                    status: 'FAIL',
                    details: 'HTML file not found'
                });
                continue;
            }
            
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Check if MLG components are loaded
                const componentsLoaded = this.components.filter(comp => 
                    content.includes(`src/js/${comp}`)
                ).length;
                
                this.results.push({
                    component: htmlFile,
                    test: 'Component Loading',
                    status: componentsLoaded > 0 ? 'PASS' : 'FAIL',
                    details: `${componentsLoaded}/${this.components.length} components loaded`
                });
                
                // Check for proper script loading order
                const hasErrorHandler = content.includes('mlg-error-handler.js');
                const errorHandlerIndex = content.indexOf('mlg-error-handler.js');
                const otherComponentsAfter = this.components.slice(1).every(comp => {
                    const index = content.indexOf(comp);
                    return index === -1 || index > errorHandlerIndex;
                });
                
                this.results.push({
                    component: htmlFile,
                    test: 'Script Load Order',
                    status: (hasErrorHandler && otherComponentsAfter) ? 'PASS' : 'WARN',
                    details: hasErrorHandler ? 'Error handler loads first' : 'Error handler should load first'
                });
                
            } catch (error) {
                this.results.push({
                    component: htmlFile,
                    test: 'HTML Analysis',
                    status: 'ERROR',
                    details: error.message
                });
            }
        }
    }

    getExpectedClassName(filename) {
        const classNames = {
            'mlg-error-handler.js': 'MLGErrorHandler',
            'mlg-api-client-consolidated.js': 'MLGApiClient',
            'mlg-auth-manager.js': 'MLGAuthManager',
            'mlg-websocket-manager.js': 'MLGWebSocketManager',
            'mlg-cache-manager.js': 'MLGCacheManager'
        };
        return classNames[filename] || 'Unknown';
    }

    generateReport() {
        console.log('\n📊 VALIDATION REPORT');
        console.log('='.repeat(50));
        
        const stats = {
            total: this.results.length,
            pass: this.results.filter(r => r.status === 'PASS').length,
            fail: this.results.filter(r => r.status === 'FAIL').length,
            warn: this.results.filter(r => r.status === 'WARN').length,
            error: this.results.filter(r => r.status === 'ERROR').length
        };
        
        console.log(`Total Tests: ${stats.total}`);
        console.log(`✅ Passed: ${stats.pass} (${Math.round((stats.pass/stats.total)*100)}%)`);
        console.log(`❌ Failed: ${stats.fail}`);
        console.log(`⚠️  Warnings: ${stats.warn}`);
        console.log(`💥 Errors: ${stats.error}\n`);
        
        // Group results by component
        const byComponent = {};
        this.results.forEach(result => {
            if (!byComponent[result.component]) {
                byComponent[result.component] = [];
            }
            byComponent[result.component].push(result);
        });
        
        // Print detailed results
        Object.entries(byComponent).forEach(([component, results]) => {
            console.log(`\n🔍 ${component.toUpperCase()}`);
            console.log('-'.repeat(30));
            
            results.forEach(result => {
                const icon = {
                    'PASS': '✅',
                    'FAIL': '❌', 
                    'WARN': '⚠️',
                    'ERROR': '💥'
                }[result.status];
                
                console.log(`${icon} ${result.test}: ${result.details}`);
            });
        });
        
        // Summary and recommendations
        console.log('\n🎯 RECOMMENDATIONS');
        console.log('-'.repeat(30));
        
        if (stats.error > 0) {
            console.log('❗ Critical errors found - resolve before deployment');
        }
        
        if (stats.fail > 0) {
            console.log('❗ Failed tests need attention - functionality may be impacted');  
        }
        
        if (stats.warn > 0) {
            console.log('⚠️  Warnings found - consider addressing for optimal performance');
        }
        
        if (stats.pass === stats.total) {
            console.log('🎉 All tests passed - components are properly integrated!');
        }
        
        // Generate GO/NO-GO decision
        const passRate = (stats.pass / stats.total) * 100;
        const hasBlockingIssues = stats.error > 0 || stats.fail > Math.floor(stats.total * 0.2);
        
        console.log('\n🚦 GO/NO-GO DECISION');
        console.log('-'.repeat(30));
        
        if (passRate >= 80 && !hasBlockingIssues) {
            console.log('🟢 GO - Components are ready for testing');
        } else if (passRate >= 60) {
            console.log('🟡 CONDITIONAL GO - Address critical issues first');
        } else {
            console.log('🔴 NO-GO - Significant issues must be resolved');
        }
        
        console.log(`\nPass Rate: ${Math.round(passRate)}%`);
        console.log(`Blocking Issues: ${hasBlockingIssues ? 'Yes' : 'No'}`);
        
        // Save results to file
        const reportData = {
            timestamp: new Date().toISOString(),
            stats,
            results: this.results,
            errors: this.errors,
            passRate,
            decision: passRate >= 80 && !hasBlockingIssues ? 'GO' : passRate >= 60 ? 'CONDITIONAL' : 'NO-GO'
        };
        
        try {
            fs.writeFileSync(
                path.join(__dirname, 'api-validation-report.json'),
                JSON.stringify(reportData, null, 2)
            );
            console.log('\n📁 Report saved to: api-validation-report.json');
        } catch (error) {
            console.warn('Failed to save report:', error.message);
        }
    }
}

// Run validation
const validator = new MLGAPIValidator();
validator.validateAll().catch(console.error);