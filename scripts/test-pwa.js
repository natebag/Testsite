/**
 * MLG.clan PWA Testing Script
 * Automated testing for PWA functionality
 */

class PWATester {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  /**
   * Run all PWA tests
   */
  async runTests() {
    console.log('🧪 Starting MLG.clan PWA Tests...\n');

    // Manifest tests
    await this.testManifest();
    
    // Service Worker tests
    await this.testServiceWorker();
    
    // Offline functionality tests
    await this.testOfflineFeatures();
    
    // Performance tests
    await this.testPerformance();
    
    // Security tests
    await this.testSecurity();
    
    // Gaming features tests
    await this.testGamingFeatures();

    // Print results
    this.printResults();
  }

  /**
   * Test PWA manifest
   */
  async testManifest() {
    console.log('📱 Testing PWA Manifest...');
    
    try {
      const response = await fetch('/manifest.json');
      this.assert(response.ok, 'Manifest is accessible');
      
      const manifest = await response.json();
      this.assert(manifest.name, 'Manifest has name');
      this.assert(manifest.short_name, 'Manifest has short_name');
      this.assert(manifest.start_url, 'Manifest has start_url');
      this.assert(manifest.display === 'standalone', 'Manifest has standalone display');
      this.assert(manifest.theme_color, 'Manifest has theme_color');
      this.assert(manifest.background_color, 'Manifest has background_color');
      this.assert(manifest.icons && manifest.icons.length > 0, 'Manifest has icons');
      this.assert(manifest.shortcuts && manifest.shortcuts.length > 0, 'Manifest has shortcuts');
      
      console.log('✅ Manifest tests passed');
    } catch (error) {
      console.error('❌ Manifest tests failed:', error.message);
      this.results.failed++;
    }
  }

  /**
   * Test Service Worker
   */
  async testServiceWorker() {
    console.log('⚙️ Testing Service Worker...');
    
    try {
      this.assert('serviceWorker' in navigator, 'Service Worker is supported');
      
      const registration = await navigator.serviceWorker.getRegistration();
      this.assert(registration, 'Service Worker is registered');
      
      if (registration) {
        this.assert(registration.scope === location.origin + '/', 'Service Worker has correct scope');
        
        // Test service worker response
        const swResponse = await fetch('/sw.js');
        this.assert(swResponse.ok, 'Service Worker script is accessible');
      }
      
      console.log('✅ Service Worker tests passed');
    } catch (error) {
      console.error('❌ Service Worker tests failed:', error.message);
      this.results.failed++;
    }
  }

  /**
   * Test offline features
   */
  async testOfflineFeatures() {
    console.log('🔌 Testing Offline Features...');
    
    try {
      // Test offline page
      const offlineResponse = await fetch('/pages/offline.html');
      this.assert(offlineResponse.ok, 'Offline page is accessible');
      
      // Test cache existence
      const cacheNames = await caches.keys();
      this.assert(cacheNames.length > 0, 'Caches are created');
      
      // Test IndexedDB
      const dbTest = indexedDB.open('mlg-clan-offline', 1);
      this.assert(dbTest, 'IndexedDB is available');
      
      console.log('✅ Offline features tests passed');
    } catch (error) {
      console.error('❌ Offline features tests failed:', error.message);
      this.results.failed++;
    }
  }

  /**
   * Test performance
   */
  async testPerformance() {
    console.log('⚡ Testing Performance...');
    
    try {
      // Test Core Web Vitals monitoring
      this.assert(window.pwaPerformanceMonitor, 'Performance monitor is loaded');
      
      if (window.pwaPerformanceMonitor) {
        const metrics = window.pwaPerformanceMonitor.getCurrentMetrics();
        this.assert(metrics, 'Performance metrics are being collected');
      }
      
      // Test navigation performance
      if (performance.getEntriesByType) {
        const navigationEntries = performance.getEntriesByType('navigation');
        this.assert(navigationEntries.length > 0, 'Navigation timing is available');
      }
      
      console.log('✅ Performance tests passed');
    } catch (error) {
      console.error('❌ Performance tests failed:', error.message);
      this.results.failed++;
    }
  }

  /**
   * Test security
   */
  async testSecurity() {
    console.log('🔒 Testing Security...');
    
    try {
      // Test secure context
      this.assert(window.isSecureContext || location.hostname === 'localhost', 'App is in secure context');
      
      // Test PWA security manager
      this.assert(window.pwaSecurityManager, 'Security manager is loaded');
      
      if (window.pwaSecurityManager) {
        const securityStatus = window.pwaSecurityManager.getSecurityStatus();
        this.assert(securityStatus.score >= 60, 'Security score is acceptable');
      }
      
      // Test CSP
      const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      this.assert(metaCSP, 'Content Security Policy is set');
      
      console.log('✅ Security tests passed');
    } catch (error) {
      console.error('❌ Security tests failed:', error.message);
      this.results.failed++;
    }
  }

  /**
   * Test gaming features
   */
  async testGamingFeatures() {
    console.log('🎮 Testing Gaming Features...');
    
    try {
      // Test offline data manager
      this.assert(window.offlineDataManager, 'Offline data manager is loaded');
      
      // Test PWA manager
      this.assert(window.pwaManager, 'PWA manager is loaded');
      
      // Test gaming performance monitoring
      if (window.pwaPerformanceMonitor) {
        const gamingMetrics = window.pwaPerformanceMonitor.getCurrentMetrics().gamingMetrics;
        this.assert(typeof gamingMetrics === 'object', 'Gaming metrics are being tracked');
      }
      
      // Test background sync support
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const hasSyncSupport = 'sync' in registration;
        console.log(`Background Sync Support: ${hasSyncSupport ? '✅' : '⚠️'}`);
      }
      
      console.log('✅ Gaming features tests passed');
    } catch (error) {
      console.error('❌ Gaming features tests failed:', error.message);
      this.results.failed++;
    }
  }

  /**
   * Assert test condition
   */
  assert(condition, message) {
    this.results.total++;
    
    if (condition) {
      console.log(`  ✅ ${message}`);
      this.results.passed++;
    } else {
      console.log(`  ❌ ${message}`);
      this.results.failed++;
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Print test results
   */
  printResults() {
    console.log('\n📊 PWA Test Results:');
    console.log('======================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Total:  ${this.results.total}`);
    console.log(`🎯 Score:  ${Math.round((this.results.passed / this.results.total) * 100)}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All PWA tests passed! Your gaming platform is PWA-ready! 🎮');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }
  }

  /**
   * Test PWA installation eligibility
   */
  async testInstallation() {
    console.log('\n📲 Testing PWA Installation Eligibility...');
    
    // Check if app can be installed
    if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
      console.log('✅ Installation API is supported');
    } else {
      console.log('⚠️ Installation API may not be fully supported');
    }
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('✅ App is running in standalone mode (installed)');
    } else {
      console.log('🌐 App is running in browser mode');
    }
  }
}

// Export for use in browser console
window.PWATester = PWATester;

// Auto-run tests if PWA modules are loaded
if (typeof window !== 'undefined') {
  window.addEventListener('load', async () => {
    // Wait for PWA modules to load
    setTimeout(async () => {
      if (window.pwaManager && window.pwaSecurityManager) {
        console.log('🚀 Auto-running PWA tests...');
        const tester = new PWATester();
        await tester.runTests();
        await tester.testInstallation();
      } else {
        console.log('⚠️ PWA modules not fully loaded. Run tests manually with: new PWATester().runTests()');
      }
    }, 3000);
  });
}

export { PWATester };
export default PWATester;