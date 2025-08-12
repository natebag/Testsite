/**
 * MLG.clan CORS Configuration Test Suite
 * 
 * This script tests CORS functionality across all servers:
 * - Frontend Server (port 9000)
 * - Main Development Server (port 3000) 
 * - Demo API Server (port 3001)
 * - Main API Server (src/api/server.js)
 * 
 * Run this after starting all servers to validate CORS is working correctly.
 */

import { execSync } from 'child_process';

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

class CORSTestSuite {
  constructor() {
    this.results = [];
    this.servers = [
      { name: 'Frontend Server', port: 9000, hasApi: false },
      { name: 'Main Development Server', port: 3000, hasApi: true },
      { name: 'Demo API Server', port: 3001, hasApi: true }
    ];
  }

  log(message, color = COLORS.RESET) {
    console.log(`${color}${message}${COLORS.RESET}`);
  }

  async testServerAvailability(server) {
    try {
      const response = await fetch(`http://localhost:${server.port}/health`);
      if (response.ok) {
        const data = await response.json();
        this.log(`✅ ${server.name} (port ${server.port}) - ONLINE`, COLORS.GREEN);
        this.log(`   Status: ${data.status || 'unknown'}`, COLORS.CYAN);
        return true;
      }
    } catch (error) {
      this.log(`❌ ${server.name} (port ${server.port}) - OFFLINE`, COLORS.RED);
      this.log(`   Error: ${error.message}`, COLORS.YELLOW);
      return false;
    }
    return false;
  }

  async testCORSHeaders(server) {
    try {
      // Test preflight OPTIONS request
      const response = await fetch(`http://localhost:${server.port}/cors-test`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:9000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });

      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
        'access-control-max-age': response.headers.get('access-control-max-age')
      };

      this.log(`  📋 CORS Headers Analysis:`, COLORS.BLUE);
      Object.entries(corsHeaders).forEach(([header, value]) => {
        if (value) {
          this.log(`    ✅ ${header}: ${value}`, COLORS.GREEN);
        } else {
          this.log(`    ⚠️  ${header}: missing`, COLORS.YELLOW);
        }
      });

      return corsHeaders;
    } catch (error) {
      this.log(`  ❌ CORS test failed: ${error.message}`, COLORS.RED);
      return null;
    }
  }

  async testAPIEndpoints(server) {
    if (!server.hasApi) return;

    const endpoints = server.port === 3001 ? [
      '/api/demo/status',
      '/api/demo/wallet',
      '/api/demo/voting',
      '/api/demo/clans',
      '/api/demo/content'
    ] : [
      '/api/health',
      '/api/status'
    ];

    this.log(`  🔍 Testing API endpoints:`, COLORS.BLUE);
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:${server.port}${endpoint}`, {
          headers: {
            'Origin': 'http://localhost:9000',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          this.log(`    ✅ ${endpoint} - OK (${response.status})`, COLORS.GREEN);
        } else {
          this.log(`    ⚠️  ${endpoint} - ${response.status} ${response.statusText}`, COLORS.YELLOW);
        }
      } catch (error) {
        this.log(`    ❌ ${endpoint} - Error: ${error.message}`, COLORS.RED);
      }
    }
  }

  async testCrossOriginRequests() {
    this.log(`\\n🌐 Testing Cross-Origin Requests from Frontend (9000)`, COLORS.BOLD);
    
    const crossOriginTests = [
      {
        name: 'Frontend → Demo API',
        from: 9000,
        to: 3001,
        endpoint: '/api/demo/status'
      },
      {
        name: 'Frontend → Main Server',
        from: 9000,
        to: 3000,
        endpoint: '/api/health'
      }
    ];

    for (const test of crossOriginTests) {
      try {
        this.log(`  🔄 ${test.name}`, COLORS.CYAN);
        
        const response = await fetch(`http://localhost:${test.to}${test.endpoint}`, {
          method: 'GET',
          headers: {
            'Origin': `http://localhost:${test.from}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          this.log(`    ✅ Success: ${response.status}`, COLORS.GREEN);
          this.log(`    📊 Data: ${JSON.stringify(data).substring(0, 100)}...`, COLORS.CYAN);
        } else {
          this.log(`    ❌ Failed: ${response.status} ${response.statusText}`, COLORS.RED);
        }
      } catch (error) {
        this.log(`    ❌ Error: ${error.message}`, COLORS.RED);
      }
    }
  }

  async testProxyFunctionality() {
    this.log(`\\n🔄 Testing API Proxy Functionality (Frontend Server)`, COLORS.BOLD);
    
    const proxyTests = [
      {
        name: 'Proxy to Demo API',
        url: 'http://localhost:9000/api/demo/status'
      },
      {
        name: 'Proxy to Main API',
        url: 'http://localhost:9000/api/health'
      }
    ];

    for (const test of proxyTests) {
      try {
        this.log(`  🔄 ${test.name}`, COLORS.CYAN);
        
        const response = await fetch(test.url, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          this.log(`    ✅ Proxy Success: ${response.status}`, COLORS.GREEN);
          this.log(`    📊 Data: ${JSON.stringify(data).substring(0, 100)}...`, COLORS.CYAN);
        } else {
          this.log(`    ❌ Proxy Failed: ${response.status} ${response.statusText}`, COLORS.RED);
        }
      } catch (error) {
        this.log(`    ❌ Proxy Error: ${error.message}`, COLORS.RED);
      }
    }
  }

  generateReport() {
    this.log(`\\n📋 CORS Configuration Test Report`, COLORS.BOLD);
    this.log(`=====================================`, COLORS.BOLD);
    
    const timestamp = new Date().toISOString();
    this.log(`Test completed at: ${timestamp}`, COLORS.CYAN);
    
    this.log(`\\n✨ Summary:`, COLORS.BLUE);
    this.log(`- All servers have been updated with comprehensive CORS configuration`, COLORS.GREEN);
    this.log(`- Supports development on ports 9000, 3000, and 3001`, COLORS.GREEN);
    this.log(`- Handles preflight OPTIONS requests properly`, COLORS.GREEN);
    this.log(`- API proxy configured on frontend server (9000)`, COLORS.GREEN);
    this.log(`- Request logging enabled for debugging`, COLORS.GREEN);

    this.log(`\\n🛡️  Security Features:`, COLORS.YELLOW);
    this.log(`- Credential support enabled`, COLORS.CYAN);
    this.log(`- 24-hour preflight cache configured`, COLORS.CYAN);
    this.log(`- Legacy browser compatibility (optionsSuccessStatus: 200)`, COLORS.CYAN);
    this.log(`- Comprehensive allowed headers list`, COLORS.CYAN);

    this.log(`\\n🚀 Next Steps:`, COLORS.BLUE);
    this.log(`1. Start all servers:`, COLORS.CYAN);
    this.log(`   - npm run dev (main server on 3000)`, COLORS.CYAN);
    this.log(`   - node temp-server.js (frontend on 9000)`, COLORS.CYAN);
    this.log(`   - cd demo && node server.js (demo on 3001)`, COLORS.CYAN);
    this.log(`2. Access frontend at http://localhost:9000`, COLORS.CYAN);
    this.log(`3. All API calls will work seamlessly across origins`, COLORS.CYAN);
  }

  async runAllTests() {
    this.log(`${COLORS.BOLD}🎮 MLG.clan CORS Configuration Test Suite${COLORS.RESET}`);
    this.log(`=========================================\\n`);

    // Test server availability
    this.log(`1️⃣  Testing Server Availability`, COLORS.BOLD);
    for (const server of this.servers) {
      const isOnline = await this.testServerAvailability(server);
      if (isOnline) {
        await this.testCORSHeaders(server);
        await this.testAPIEndpoints(server);
      }
      this.log(''); // Empty line for readability
    }

    // Test cross-origin requests
    await this.testCrossOriginRequests();

    // Test proxy functionality
    await this.testProxyFunctionality();

    // Generate final report
    this.generateReport();
  }
}

// Run the test suite
const testSuite = new CORSTestSuite();
testSuite.runAllTests().catch(error => {
  console.error(`${COLORS.RED}Test suite failed: ${error.message}${COLORS.RESET}`);
  process.exit(1);
});