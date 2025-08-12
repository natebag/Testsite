/**
 * MLG.clan PWA Security Manager
 * Handles security headers, HTTPS enforcement, and PWA security best practices
 */

class PWASecurityManager {
  constructor() {
    this.securityConfig = {
      enforceHTTPS: true,
      requireSecureContext: true,
      contentSecurityPolicy: true,
      permissions: {
        notifications: 'prompt',
        persistent: 'prompt',
        background: 'prompt'
      }
    };
    
    this.init();
  }

  /**
   * Initialize PWA security
   */
  async init() {
    try {
      // Enforce HTTPS
      this.enforceHTTPS();
      
      // Check secure context
      this.checkSecureContext();
      
      // Setup content security policy
      this.setupContentSecurityPolicy();
      
      // Setup permission validation
      this.setupPermissionValidation();
      
      // Setup integrity checks
      this.setupIntegrityChecks();
      
      console.log('[PWA Security] Security manager initialized');
    } catch (error) {
      console.error('[PWA Security] Security initialization failed:', error);
    }
  }

  /**
   * Enforce HTTPS connections
   */
  enforceHTTPS() {
    if (!this.securityConfig.enforceHTTPS) return;

    // Check if we're on HTTP in production
    if (location.protocol === 'http:' && location.hostname !== 'localhost') {
      // Redirect to HTTPS
      const httpsUrl = location.href.replace('http://', 'https://');
      console.warn('[PWA Security] Redirecting to HTTPS:', httpsUrl);
      location.replace(httpsUrl);
      return;
    }

    // Add HTTPS upgrade header
    if (location.protocol === 'https:') {
      this.addSecurityHeaders();
    }
  }

  /**
   * Check for secure context
   */
  checkSecureContext() {
    if (!this.securityConfig.requireSecureContext) return;

    if (!window.isSecureContext) {
      console.error('[PWA Security] Insecure context detected - PWA features may not work');
      this.showSecurityWarning('This application requires a secure connection (HTTPS) for full functionality.');
      return false;
    }

    console.log('[PWA Security] Secure context confirmed');
    return true;
  }

  /**
   * Add security headers programmatically
   */
  addSecurityHeaders() {
    // Add security meta tags
    this.addMetaTag('http-equiv', 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    this.addMetaTag('http-equiv', 'X-Content-Type-Options', 'nosniff');
    this.addMetaTag('http-equiv', 'X-Frame-Options', 'DENY');
    this.addMetaTag('http-equiv', 'X-XSS-Protection', '1; mode=block');
    this.addMetaTag('http-equiv', 'Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Add PWA-specific security headers
    this.addMetaTag('http-equiv', 'Feature-Policy', 
      'camera \'self\'; microphone \'self\'; geolocation \'self\'; payment \'self\'');
    
    console.log('[PWA Security] Security headers added');
  }

  /**
   * Setup Content Security Policy
   */
  setupContentSecurityPolicy() {
    if (!this.securityConfig.contentSecurityPolicy) return;

    const csp = this.buildContentSecurityPolicy();
    
    // Add CSP meta tag if not already present
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!existingCSP) {
      this.addMetaTag('http-equiv', 'Content-Security-Policy', csp);
      console.log('[PWA Security] CSP added');
    }

    // Monitor CSP violations
    this.monitorCSPViolations();
  }

  /**
   * Build Content Security Policy
   */
  buildContentSecurityPolicy() {
    const policies = {
      'default-src': "'self'",
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for some gaming features
        "'unsafe-eval'", // Required for dynamic content
        'https://cdn.tailwindcss.com',
        'https://unpkg.com',
        'https://cdn.socket.io'
      ].join(' '),
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for dynamic styling
        'https://cdn.tailwindcss.com'
      ].join(' '),
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:'
      ].join(' '),
      'connect-src': [
        "'self'",
        'wss:',
        'https:',
        'ws://localhost:3000' // Development
      ].join(' '),
      'font-src': [
        "'self'",
        'data:'
      ].join(' '),
      'object-src': "'none'",
      'media-src': "'self' blob: data:",
      'frame-src': [
        "'self'",
        'https://www.youtube.com',
        'https://player.twitch.tv',
        'https://www.tiktok.com'
      ].join(' '),
      'worker-src': "'self' blob:",
      'manifest-src': "'self'",
      'base-uri': "'self'",
      'form-action': "'self'"
    };

    return Object.entries(policies)
      .map(([directive, value]) => `${directive} ${value}`)
      .join('; ');
  }

  /**
   * Monitor CSP violations
   */
  monitorCSPViolations() {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.error('[PWA Security] CSP Violation:', {
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
        sourceFile: event.sourceFile
      });

      // Report to security monitoring
      this.reportSecurityViolation('csp', event);
    });
  }

  /**
   * Setup permission validation
   */
  setupPermissionValidation() {
    // Validate required permissions for PWA features
    this.validateNotificationPermission();
    this.validatePersistentStoragePermission();
    this.validateBackgroundSyncPermission();
  }

  /**
   * Validate notification permission
   */
  async validateNotificationPermission() {
    if ('Notification' in window) {
      const permission = Notification.permission;
      console.log('[PWA Security] Notification permission:', permission);

      if (permission === 'denied') {
        this.showPermissionGuidance('notifications');
      }
    }
  }

  /**
   * Validate persistent storage permission
   */
  async validatePersistentStoragePermission() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        console.log('[PWA Security] Persistent storage:', persistent);

        if (!persistent) {
          this.showPermissionGuidance('storage');
        }
      } catch (error) {
        console.error('[PWA Security] Persistent storage check failed:', error);
      }
    }
  }

  /**
   * Validate background sync permission
   */
  async validateBackgroundSyncPermission() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      console.log('[PWA Security] Background sync available');
    } else {
      console.warn('[PWA Security] Background sync not available');
    }
  }

  /**
   * Setup integrity checks
   */
  setupIntegrityChecks() {
    // Check service worker integrity
    this.checkServiceWorkerIntegrity();
    
    // Monitor for tampering
    this.setupTamperDetection();
    
    // Validate origin
    this.validateOrigin();
  }

  /**
   * Check service worker integrity
   */
  async checkServiceWorkerIntegrity() {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration) {
          // Check if SW script exists and is valid
          const response = await fetch('/sw.js', { method: 'HEAD' });
          
          if (!response.ok) {
            console.error('[PWA Security] Service worker script not found or invalid');
            this.reportSecurityViolation('sw_integrity', { status: response.status });
          }
        }
      }
    } catch (error) {
      console.error('[PWA Security] Service worker integrity check failed:', error);
    }
  }

  /**
   * Setup tamper detection
   */
  setupTamperDetection() {
    // Monitor for console manipulation
    let devtools = {
      open: false,
      orientation: null
    };

    const threshold = 160;
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          console.warn('[PWA Security] Developer tools detected');
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    // Monitor for key security globals
    this.monitorSecurityGlobals();
  }

  /**
   * Monitor security globals
   */
  monitorSecurityGlobals() {
    const originalConsole = window.console;
    const securityGlobals = ['fetch', 'XMLHttpRequest', 'WebSocket'];

    // Monitor fetch modifications
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      // Log suspicious fetch requests
      const url = args[0];
      if (typeof url === 'string' && !url.startsWith(location.origin) && 
          !url.startsWith('https://cdn.') && !url.startsWith('https://unpkg.com')) {
        console.warn('[PWA Security] External fetch detected:', url);
      }
      return originalFetch.apply(this, args);
    };
  }

  /**
   * Validate origin
   */
  validateOrigin() {
    const allowedOrigins = [
      location.origin,
      'https://mlg.clan',
      'http://localhost:3000' // Development
    ];

    if (!allowedOrigins.some(origin => location.origin === origin || location.origin.startsWith(origin))) {
      console.error('[PWA Security] Invalid origin detected:', location.origin);
      this.reportSecurityViolation('invalid_origin', { origin: location.origin });
    }
  }

  /**
   * Show security warning
   */
  showSecurityWarning(message) {
    const warning = document.createElement('div');
    warning.className = 'pwa-security-warning';
    warning.innerHTML = `
      <div class="fixed top-0 left-0 right-0 z-50 bg-gaming-red text-white p-4 text-center">
        <div class="flex items-center justify-center space-x-2">
          <i data-lucide="shield-alert" class="w-5 h-5"></i>
          <span>${message}</span>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="ml-4 text-white/80 hover:text-white">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(warning);

    // Initialize icons
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);
  }

  /**
   * Show permission guidance
   */
  showPermissionGuidance(type) {
    const messages = {
      notifications: 'Enable notifications to receive clan updates and tournament alerts',
      storage: 'Allow persistent storage for better offline experience',
      background: 'Enable background sync for automatic data updates'
    };

    const guidance = document.createElement('div');
    guidance.className = 'pwa-permission-guidance';
    guidance.innerHTML = `
      <div class="fixed bottom-4 right-4 max-w-sm bg-gaming-surface border border-gaming-yellow/30 rounded-xl p-4 shadow-2xl backdrop-blur-lg z-40">
        <div class="flex items-start space-x-3">
          <i data-lucide="info" class="w-5 h-5 text-gaming-yellow flex-shrink-0 mt-0.5"></i>
          <div class="flex-1">
            <h4 class="text-white font-medium mb-2">Permission Needed</h4>
            <p class="text-gray-300 text-sm mb-3">${messages[type]}</p>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-gaming-yellow hover:text-gaming-yellow/80 text-sm">
              Got it
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(guidance);

    // Initialize icons
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);

    // Auto-remove after delay
    setTimeout(() => {
      guidance.remove();
    }, 10000);
  }

  /**
   * Add meta tag
   */
  addMetaTag(attribute, name, content) {
    const existingTag = document.querySelector(`meta[${attribute}="${name}"]`);
    if (existingTag) {
      existingTag.setAttribute('content', content);
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    }
  }

  /**
   * Report security violation
   */
  async reportSecurityViolation(type, details) {
    try {
      const violation = {
        type,
        details,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: location.href,
        origin: location.origin
      };

      console.error('[PWA Security] Security violation reported:', violation);

      // Send to security monitoring endpoint
      if (navigator.onLine) {
        await fetch('/api/security/violations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(violation)
        }).catch(error => {
          console.error('[PWA Security] Failed to report violation:', error);
        });
      }
    } catch (error) {
      console.error('[PWA Security] Violation reporting failed:', error);
    }
  }

  /**
   * Generate security report
   */
  generateSecurityReport() {
    return {
      timestamp: Date.now(),
      secureContext: window.isSecureContext,
      protocol: location.protocol,
      origin: location.origin,
      permissions: {
        notifications: Notification.permission,
        serviceWorker: 'serviceWorker' in navigator,
        backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
        persistentStorage: 'storage' in navigator && 'persist' in navigator.storage
      },
      csp: {
        enabled: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
        violations: this.cspViolations || []
      },
      integrityChecks: {
        serviceWorker: this.swIntegrityOk || false,
        origin: this.originValid || false
      }
    };
  }

  /**
   * Get security status
   */
  getSecurityStatus() {
    const checks = [
      { name: 'HTTPS', passed: location.protocol === 'https:' || location.hostname === 'localhost' },
      { name: 'Secure Context', passed: window.isSecureContext },
      { name: 'Service Worker', passed: 'serviceWorker' in navigator },
      { name: 'CSP', passed: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]') },
      { name: 'Valid Origin', passed: this.originValid !== false }
    ];

    const passed = checks.filter(check => check.passed).length;
    const total = checks.length;
    const score = Math.round((passed / total) * 100);

    return {
      score,
      passed,
      total,
      checks,
      level: score >= 80 ? 'secure' : score >= 60 ? 'warning' : 'insecure'
    };
  }

  /**
   * Show security dashboard
   */
  showSecurityDashboard() {
    const status = this.getSecurityStatus();
    const report = this.generateSecurityReport();

    console.group('[PWA Security] Security Dashboard');
    console.log('Overall Score:', `${status.score}% (${status.level})`);
    console.log('Checks:', status.checks);
    console.log('Full Report:', report);
    console.groupEnd();

    // Show visual dashboard
    this.displaySecurityDashboard(status, report);
  }

  /**
   * Display security dashboard UI
   */
  displaySecurityDashboard(status, report) {
    const dashboard = document.createElement('div');
    dashboard.className = 'pwa-security-dashboard';
    dashboard.innerHTML = `
      <div class="fixed inset-4 bg-gaming-surface/95 backdrop-blur-lg rounded-xl border border-gaming-accent/30 z-50 overflow-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white">Security Dashboard</h2>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-gray-400 hover:text-white">
              <i data-lucide="x" class="w-6 h-6"></i>
            </button>
          </div>
          
          <div class="mb-6">
            <div class="flex items-center space-x-3 mb-2">
              <div class="text-3xl font-bold ${status.level === 'secure' ? 'text-gaming-accent' : status.level === 'warning' ? 'text-gaming-yellow' : 'text-gaming-red'}">
                ${status.score}%
              </div>
              <div class="text-white">
                <div class="font-semibold">Security Score</div>
                <div class="text-sm text-gray-400">${status.passed}/${status.total} checks passed</div>
              </div>
            </div>
            <div class="w-full bg-gaming-surface/50 rounded-full h-2">
              <div class="h-2 rounded-full ${status.level === 'secure' ? 'bg-gaming-accent' : status.level === 'warning' ? 'bg-gaming-yellow' : 'bg-gaming-red'}" style="width: ${status.score}%"></div>
            </div>
          </div>
          
          <div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <h3 class="text-lg font-semibold text-white">Security Checks</h3>
              ${status.checks.map(check => `
                <div class="flex items-center space-x-3 p-3 rounded-lg ${check.passed ? 'bg-gaming-accent/10' : 'bg-gaming-red/10'}">
                  <i data-lucide="${check.passed ? 'check-circle' : 'x-circle'}" class="w-5 h-5 ${check.passed ? 'text-gaming-accent' : 'text-gaming-red'}"></i>
                  <span class="text-white">${check.name}</span>
                </div>
              `).join('')}
            </div>
            
            <div class="space-y-3">
              <h3 class="text-lg font-semibold text-white">Report Details</h3>
              <div class="bg-gaming-surface/50 rounded-lg p-4 text-sm">
                <pre class="text-gray-300 whitespace-pre-wrap">${JSON.stringify(report, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dashboard);

    // Initialize icons
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);
  }
}

// Initialize global PWA security manager
window.pwaSecurityManager = new PWASecurityManager();

export { PWASecurityManager };
export default PWASecurityManager;