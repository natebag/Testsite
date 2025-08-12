/**
 * MLG.clan PWA Manager
 * Handles PWA installation, updates, background sync, and offline functionality
 */

class PWAManager {
  constructor() {
    this.swRegistration = null;
    this.deferredPrompt = null;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.installPromptShown = false;
    
    this.init();
  }

  /**
   * Initialize PWA Manager
   */
  async init() {
    try {
      // Register service worker
      await this.registerServiceWorker();
      
      // Set up installation prompt handling
      this.setupInstallPrompt();
      
      // Set up online/offline handling
      this.setupConnectionHandling();
      
      // Set up background sync
      this.setupBackgroundSync();
      
      // Set up push notifications
      this.setupPushNotifications();
      
      // Check for updates
      this.checkForUpdates();
      
      console.log('[PWA] Manager initialized successfully');
    } catch (error) {
      console.error('[PWA] Manager initialization failed:', error);
    }
  }

  /**
   * Register Service Worker
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('[PWA] Service Worker registered:', this.swRegistration.scope);
        
        // Listen for SW messages
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
        
        return this.swRegistration;
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
        throw error;
      }
    } else {
      throw new Error('Service Workers not supported');
    }
  }

  /**
   * Setup installation prompt handling
   */
  setupInstallPrompt() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('[PWA] Install prompt available');
      
      // Prevent the mini-infobar from appearing
      event.preventDefault();
      
      // Store the event for later use
      this.deferredPrompt = event;
      
      // Show custom install prompt after delay
      if (!this.installPromptShown) {
        setTimeout(() => this.showInstallPrompt(), 3000);
      }
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', (event) => {
      console.log('[PWA] App installed successfully');
      this.trackInstallEvent();
      this.hideInstallPrompt();
    });
  }

  /**
   * Setup connection handling
   */
  setupConnectionHandling() {
    // Online event
    window.addEventListener('online', () => {
      console.log('[PWA] Connection restored');
      this.isOnline = true;
      this.handleConnectionRestore();
      this.showConnectionStatus('online');
    });

    // Offline event
    window.addEventListener('offline', () => {
      console.log('[PWA] Connection lost');
      this.isOnline = false;
      this.handleConnectionLost();
      this.showConnectionStatus('offline');
    });

    // Initial connection status
    this.showConnectionStatus(navigator.onLine ? 'online' : 'offline');
  }

  /**
   * Setup background sync
   */
  setupBackgroundSync() {
    // Listen for sync events from SW
    if (this.swRegistration && 'sync' in window.ServiceWorkerRegistration.prototype) {
      console.log('[PWA] Background sync available');
    }
  }

  /**
   * Setup push notifications
   */
  async setupPushNotifications() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      try {
        // Request notification permission
        const permission = await this.requestNotificationPermission();
        
        if (permission === 'granted') {
          await this.subscribeToPushNotifications();
        }
      } catch (error) {
        console.error('[PWA] Push notification setup failed:', error);
      }
    }
  }

  /**
   * Show custom install prompt
   */
  async showInstallPrompt() {
    if (!this.deferredPrompt || this.installPromptShown) return;

    this.installPromptShown = true;

    // Create custom install prompt UI
    const installPrompt = this.createInstallPromptUI();
    document.body.appendChild(installPrompt);

    // Handle install button click
    const installButton = installPrompt.querySelector('.install-button');
    const dismissButton = installPrompt.querySelector('.dismiss-button');

    installButton?.addEventListener('click', async () => {
      try {
        // Show the install prompt
        this.deferredPrompt.prompt();
        
        // Wait for user choice
        const { outcome } = await this.deferredPrompt.userChoice;
        
        console.log('[PWA] Install prompt outcome:', outcome);
        
        if (outcome === 'accepted') {
          this.trackInstallEvent('accepted');
        } else {
          this.trackInstallEvent('dismissed');
        }
        
        // Clean up
        this.deferredPrompt = null;
        this.hideInstallPrompt();
      } catch (error) {
        console.error('[PWA] Install prompt failed:', error);
        this.hideInstallPrompt();
      }
    });

    dismissButton?.addEventListener('click', () => {
      this.trackInstallEvent('dismissed');
      this.hideInstallPrompt();
    });
  }

  /**
   * Create install prompt UI
   */
  createInstallPromptUI() {
    const prompt = document.createElement('div');
    prompt.className = 'pwa-install-prompt';
    prompt.innerHTML = `
      <div class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
        <div class="bg-gaming-surface border border-gaming-accent/30 rounded-xl p-6 shadow-2xl backdrop-blur-lg">
          <div class="flex items-start space-x-4">
            <div class="w-12 h-12 bg-gaming-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <i data-lucide="download" class="w-6 h-6 text-gaming-accent"></i>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-white mb-2">Install MLG.clan</h3>
              <p class="text-gray-300 text-sm mb-4">
                Get faster access, offline features, and native app experience
              </p>
              <div class="flex space-x-3">
                <button class="install-button bg-gaming-accent text-gaming-bg px-4 py-2 rounded-lg text-sm font-medium hover:bg-gaming-accent/80 transition-colors">
                  Install App
                </button>
                <button class="dismiss-button text-gray-400 hover:text-white transition-colors text-sm">
                  Maybe Later
                </button>
              </div>
            </div>
            <button class="dismiss-button text-gray-400 hover:text-white">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    // Initialize Lucide icons for the prompt
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);

    return prompt;
  }

  /**
   * Hide install prompt
   */
  hideInstallPrompt() {
    const prompt = document.querySelector('.pwa-install-prompt');
    if (prompt) {
      prompt.remove();
    }
  }

  /**
   * Show connection status indicator
   */
  showConnectionStatus(status) {
    // Remove existing indicator
    const existing = document.querySelector('.connection-status-indicator');
    if (existing) {
      existing.remove();
    }

    // Create new indicator
    const indicator = document.createElement('div');
    indicator.className = 'connection-status-indicator fixed top-4 right-4 z-40 transition-all duration-300';
    
    const config = {
      online: {
        bg: 'bg-gaming-accent/20',
        border: 'border-gaming-accent/30',
        dot: 'bg-gaming-accent',
        text: 'text-gaming-accent',
        label: 'Online'
      },
      offline: {
        bg: 'bg-gaming-red/20',
        border: 'border-gaming-red/30',
        dot: 'bg-gaming-red animate-pulse',
        text: 'text-gaming-red',
        label: 'Offline'
      }
    };

    const statusConfig = config[status];
    
    indicator.innerHTML = `
      <div class="flex items-center space-x-2 ${statusConfig.bg} border ${statusConfig.border} rounded-lg px-3 py-2 backdrop-blur-sm">
        <div class="w-3 h-3 ${statusConfig.dot} rounded-full"></div>
        <span class="text-sm ${statusConfig.text}">${statusConfig.label}</span>
      </div>
    `;

    document.body.appendChild(indicator);

    // Auto-hide online indicator after delay
    if (status === 'online') {
      setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => indicator.remove(), 300);
      }, 3000);
    }
  }

  /**
   * Handle connection restore
   */
  async handleConnectionRestore() {
    try {
      // Trigger background sync for pending data
      await this.requestBackgroundSync('gaming-data');
      await this.requestBackgroundSync('user-actions');
      
      // Refresh cached content
      await this.refreshCriticalCache();
      
      // Notify user
      this.showNotification('Connection Restored', {
        body: 'Your data is now syncing in the background',
        tag: 'connection-restored',
        icon: '/assets/icons/icon-192x192.png'
      });
    } catch (error) {
      console.error('[PWA] Connection restore handling failed:', error);
    }
  }

  /**
   * Handle connection lost
   */
  handleConnectionLost() {
    // Show offline capabilities
    this.showOfflineCapabilities();
  }

  /**
   * Show offline capabilities notification
   */
  showOfflineCapabilities() {
    const notification = document.createElement('div');
    notification.className = 'offline-capabilities-notification fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50';
    notification.innerHTML = `
      <div class="bg-gaming-surface border border-gaming-yellow/30 rounded-xl p-4 shadow-2xl backdrop-blur-lg">
        <div class="flex items-center space-x-3">
          <i data-lucide="wifi-off" class="w-6 h-6 text-gaming-yellow flex-shrink-0"></i>
          <div class="flex-1">
            <h4 class="text-white font-medium">You're offline</h4>
            <p class="text-gray-300 text-sm">Some features are still available</p>
          </div>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-gray-400 hover:text-white">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Initialize icons
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);

    // Auto-remove after delay
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  /**
   * Request background sync
   */
  async requestBackgroundSync(tag) {
    try {
      if (this.swRegistration && 'sync' in window.ServiceWorkerRegistration.prototype) {
        await this.swRegistration.sync.register(tag);
        console.log('[PWA] Background sync requested:', tag);
      }
    } catch (error) {
      console.error('[PWA] Background sync request failed:', error);
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('[PWA] Notification permission:', permission);
      return permission;
    }
    return 'denied';
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications() {
    try {
      if (!this.swRegistration) return;

      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey())
      });

      console.log('[PWA] Push subscription created:', subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      throw error;
    }
  }

  /**
   * Show notification
   */
  async showNotification(title, options = {}) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          icon: '/assets/icons/icon-192x192.png',
          badge: '/assets/icons/icon-72x72.png',
          ...options
        });
      }
    } catch (error) {
      console.error('[PWA] Notification failed:', error);
    }
  }

  /**
   * Check for app updates
   */
  async checkForUpdates() {
    try {
      if (!this.swRegistration) return;

      // Check for waiting SW
      if (this.swRegistration.waiting) {
        this.showUpdatePrompt();
      }

      // Listen for new SW
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration.installing;
        
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdatePrompt();
          }
        });
      });
    } catch (error) {
      console.error('[PWA] Update check failed:', error);
    }
  }

  /**
   * Show update prompt
   */
  showUpdatePrompt() {
    const updatePrompt = document.createElement('div');
    updatePrompt.className = 'pwa-update-prompt';
    updatePrompt.innerHTML = `
      <div class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
        <div class="bg-gaming-purple/20 border border-gaming-purple/30 rounded-xl p-4 shadow-2xl backdrop-blur-lg">
          <div class="flex items-center space-x-3">
            <i data-lucide="download" class="w-6 h-6 text-gaming-purple flex-shrink-0"></i>
            <div class="flex-1">
              <h4 class="text-white font-medium">Update Available</h4>
              <p class="text-gray-300 text-sm mb-3">New features and improvements are ready</p>
              <button onclick="pwaManager.updateApp()" class="bg-gaming-purple text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gaming-purple/80 transition-colors mr-3">
                Update Now
              </button>
              <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" class="text-gray-400 hover:text-white text-sm">
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(updatePrompt);

    // Initialize icons
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);
  }

  /**
   * Update the app
   */
  async updateApp() {
    try {
      if (!this.swRegistration || !this.swRegistration.waiting) return;

      // Tell the waiting SW to skip waiting
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload the page when the new SW takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    } catch (error) {
      console.error('[PWA] App update failed:', error);
    }
  }

  /**
   * Cache gaming data for offline use
   */
  async cacheGamingData(data) {
    try {
      if (this.swRegistration) {
        this.swRegistration.active?.postMessage({
          type: 'CACHE_GAMING_DATA',
          payload: data
        });
      }
    } catch (error) {
      console.error('[PWA] Cache gaming data failed:', error);
    }
  }

  /**
   * Refresh critical cache
   */
  async refreshCriticalCache() {
    try {
      const cache = await caches.open('mlg-clan-api-v1.0.0');
      const criticalUrls = [
        '/api/user/profile',
        '/api/clans/my-clans',
        '/api/leaderboard/top'
      ];

      for (const url of criticalUrls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response.clone());
          }
        } catch (error) {
          console.warn('[PWA] Failed to refresh cache for:', url);
        }
      }
    } catch (error) {
      console.error('[PWA] Critical cache refresh failed:', error);
    }
  }

  /**
   * Handle service worker messages
   */
  handleServiceWorkerMessage(event) {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'SYNC_COMPLETE':
        console.log('[PWA] Sync completed:', payload);
        break;
      case 'CACHE_UPDATED':
        console.log('[PWA] Cache updated:', payload);
        break;
      default:
        console.log('[PWA] SW message:', type, payload);
    }
  }

  /**
   * Track install event
   */
  trackInstallEvent(outcome = 'shown') {
    // Track installation metrics
    console.log('[PWA] Install event tracked:', outcome);
    
    // Send analytics event
    if (window.gtag) {
      window.gtag('event', 'pwa_install_prompt', {
        event_category: 'PWA',
        event_label: outcome
      });
    }
  }

  /**
   * Get VAPID public key (placeholder)
   */
  getVapidPublicKey() {
    // This should be your actual VAPID public key
    return 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9YngNvECd';
  }

  /**
   * Convert base64 VAPID key to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  /**
   * Send subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      
      console.log('[PWA] Subscription sent to server');
    } catch (error) {
      console.error('[PWA] Failed to send subscription to server:', error);
    }
  }

  /**
   * Add data to sync queue
   */
  addToSyncQueue(data) {
    this.syncQueue.push({
      id: Date.now().toString(),
      data,
      timestamp: Date.now()
    });
    
    console.log('[PWA] Added to sync queue:', data);
  }

  /**
   * Get sync queue status
   */
  getSyncQueueStatus() {
    return {
      pending: this.syncQueue.length,
      isOnline: this.isOnline,
      lastSync: this.lastSyncTime || null
    };
  }

  /**
   * Clear sync queue
   */
  clearSyncQueue() {
    this.syncQueue = [];
    console.log('[PWA] Sync queue cleared');
  }
}

// Initialize global PWA Manager
window.pwaManager = new PWAManager();

export { PWAManager };
export default PWAManager;