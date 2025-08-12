/**
 * Gaming Preload Manager
 * 
 * Intelligent preloading system optimized for gaming user behavior
 * Implements predictive loading based on gaming patterns and user interactions
 */

class GamingPreloadManager {
  constructor() {
    this.preloadQueue = new Map();
    this.preloadedResources = new Set();
    this.userBehaviorData = this.loadUserBehavior();
    this.networkAdapter = null;
    this.isPreloadingEnabled = true;
    
    // Gaming-specific preload priorities
    this.priorities = {
      'critical': 1,    // Voting, wallet - load immediately
      'high': 2,        // Clans, profile - preload on hover/interaction
      'medium': 3,      // Content, analytics - preload based on behavior
      'low': 4,         // DAO, admin - lazy load
      'background': 5   // Heavy assets - load during idle time
    };
    
    this.initializeNetworkAdapter();
    this.setupBehaviorTracking();
    this.startIdlePreloading();
  }

  initializeNetworkAdapter() {
    if ('connection' in navigator) {
      this.networkAdapter = {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        saveData: navigator.connection.saveData
      };

      navigator.connection.addEventListener('change', () => {
        this.networkAdapter = {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          saveData: navigator.connection.saveData
        };
        this.adaptPreloadingStrategy();
      });
    }
  }

  setupBehaviorTracking() {
    // Track gaming behavior patterns
    const gamingEvents = [
      'wallet-connected',
      'vote-cast',
      'clan-joined',
      'content-viewed',
      'leaderboard-checked',
      'profile-visited',
      'dao-participated'
    ];

    gamingEvents.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.trackUserBehavior(eventType, event.detail);
        this.triggerPredictivePreloading(eventType);
      });
    });

    // Track route navigation patterns
    this.trackNavigationPatterns();
  }

  trackUserBehavior(eventType, data = {}) {
    const behaviorEntry = {
      event: eventType,
      timestamp: Date.now(),
      route: window.location.pathname,
      data: data
    };

    this.userBehaviorData.recentEvents.push(behaviorEntry);
    
    // Keep only last 100 events
    if (this.userBehaviorData.recentEvents.length > 100) {
      this.userBehaviorData.recentEvents.shift();
    }

    // Update behavior patterns
    this.updateBehaviorPatterns(eventType);
    
    // Save to localStorage
    this.saveUserBehavior();
  }

  trackNavigationPatterns() {
    let lastRoute = window.location.pathname;
    
    const observer = new MutationObserver(() => {
      const currentRoute = window.location.pathname;
      if (currentRoute !== lastRoute) {
        this.trackRouteTransition(lastRoute, currentRoute);
        lastRoute = currentRoute;
      }
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  }

  trackRouteTransition(fromRoute, toRoute) {
    const transition = `${fromRoute} -> ${toRoute}`;
    
    if (!this.userBehaviorData.routeTransitions[transition]) {
      this.userBehaviorData.routeTransitions[transition] = 0;
    }
    
    this.userBehaviorData.routeTransitions[transition]++;
    this.saveUserBehavior();
    
    // Trigger preloading based on common transitions
    this.preloadCommonNextRoutes(toRoute);
  }

  updateBehaviorPatterns(eventType) {
    if (!this.userBehaviorData.eventFrequency[eventType]) {
      this.userBehaviorData.eventFrequency[eventType] = 0;
    }
    
    this.userBehaviorData.eventFrequency[eventType]++;
    
    // Update user profile based on behavior
    this.updateUserProfile(eventType);
  }

  updateUserProfile(eventType) {
    const profiles = {
      'voter': ['vote-cast', 'voting-page-visited'],
      'social': ['clan-joined', 'leaderboard-checked'],
      'creator': ['content-submitted', 'content-viewed'],
      'analyst': ['analytics-viewed', 'dao-participated'],
      'trader': ['wallet-connected', 'token-transaction']
    };

    Object.entries(profiles).forEach(([profile, events]) => {
      if (events.includes(eventType)) {
        this.userBehaviorData.userProfile[profile] = 
          (this.userBehaviorData.userProfile[profile] || 0) + 1;
      }
    });
  }

  triggerPredictivePreloading(eventType) {
    const preloadMap = {
      'wallet-connected': [
        { resource: '/clans', priority: 'high' },
        { resource: '/voting', priority: 'critical' },
        { resource: '/profile', priority: 'medium' }
      ],
      'vote-cast': [
        { resource: '/clans', priority: 'high' },
        { resource: '/analytics', priority: 'medium' }
      ],
      'clan-joined': [
        { resource: '/voting', priority: 'high' },
        { resource: '/content', priority: 'medium' },
        { resource: '/leaderboard', priority: 'high' }
      ],
      'content-viewed': [
        { resource: '/voting', priority: 'high' },
        { resource: '/clans', priority: 'medium' }
      ],
      'profile-visited': [
        { resource: '/analytics', priority: 'medium' },
        { resource: '/voting', priority: 'high' }
      ]
    };

    const preloadTargets = preloadMap[eventType] || [];
    
    preloadTargets.forEach(target => {
      this.schedulePreload(target.resource, target.priority, 'predictive');
    });
  }

  preloadCommonNextRoutes(currentRoute) {
    // Get most common transitions from current route
    const commonTransitions = Object.entries(this.userBehaviorData.routeTransitions)
      .filter(([transition]) => transition.startsWith(currentRoute + ' ->'))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3); // Top 3 most common next routes

    commonTransitions.forEach(([transition, frequency]) => {
      if (frequency >= 3) { // Only preload if transition happened at least 3 times
        const nextRoute = transition.split(' -> ')[1];
        this.schedulePreload(nextRoute, 'medium', 'behavioral');
      }
    });
  }

  schedulePreload(resource, priority = 'medium', reason = 'manual') {
    if (!this.isPreloadingEnabled || this.preloadedResources.has(resource)) {
      return;
    }

    // Check network conditions
    if (!this.shouldPreloadOnCurrentNetwork(priority)) {
      console.log(`🚫 Skipping preload of ${resource} due to network conditions`);
      return;
    }

    const preloadTask = {
      resource,
      priority,
      reason,
      scheduledAt: Date.now(),
      attempts: 0
    };

    this.preloadQueue.set(resource, preloadTask);
    
    // Execute preload based on priority
    this.executePreload(preloadTask);
  }

  executePreload(preloadTask) {
    const { resource, priority, reason } = preloadTask;
    
    console.log(`🚀 Preloading ${resource} (priority: ${priority}, reason: ${reason})`);
    
    // Determine preload strategy based on resource type
    if (resource.endsWith('.js') || resource.endsWith('.jsx')) {
      this.preloadJavaScript(resource, preloadTask);
    } else if (resource.endsWith('.css')) {
      this.preloadCSS(resource, preloadTask);
    } else if (resource.match(/\.(png|jpg|webp|svg)$/)) {
      this.preloadImage(resource, preloadTask);
    } else {
      // Route preloading
      this.preloadRoute(resource, preloadTask);
    }
  }

  async preloadRoute(route, preloadTask) {
    try {
      // Use the gaming route loader if available
      if (window.MLGRouteLoader) {
        await window.MLGRouteLoader.preloadRoute(route.replace('/', ''));
      } else {
        // Fallback: preload route via link prefetch
        this.preloadViaLinkPrefetch(route);
      }
      
      this.markPreloadComplete(preloadTask.resource, 'success');
    } catch (error) {
      console.warn(`Failed to preload route ${route}:`, error);
      this.markPreloadComplete(preloadTask.resource, 'error', error);
    }
  }

  preloadJavaScript(url, preloadTask) {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = url;
    
    link.onload = () => this.markPreloadComplete(preloadTask.resource, 'success');
    link.onerror = (error) => this.markPreloadComplete(preloadTask.resource, 'error', error);
    
    document.head.appendChild(link);
  }

  preloadCSS(url, preloadTask) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = url;
    
    link.onload = () => this.markPreloadComplete(preloadTask.resource, 'success');
    link.onerror = (error) => this.markPreloadComplete(preloadTask.resource, 'error', error);
    
    document.head.appendChild(link);
  }

  preloadImage(url, preloadTask) {
    const img = new Image();
    
    img.onload = () => this.markPreloadComplete(preloadTask.resource, 'success');
    img.onerror = (error) => this.markPreloadComplete(preloadTask.resource, 'error', error);
    
    img.src = url;
  }

  preloadViaLinkPrefetch(url) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }

  markPreloadComplete(resource, status, error = null) {
    this.preloadedResources.add(resource);
    this.preloadQueue.delete(resource);
    
    const logMessage = status === 'success' 
      ? `✅ Preloaded: ${resource}`
      : `❌ Failed to preload: ${resource}`;
    
    console.log(logMessage, error || '');
    
    // Track preload analytics
    if (window.MLGAnalytics) {
      window.MLGAnalytics.trackEvent('resource_preload', {
        resource,
        status,
        error: error?.message || null,
        timestamp: Date.now()
      });
    }
  }

  shouldPreloadOnCurrentNetwork(priority) {
    if (!this.networkAdapter) return true;
    
    const { effectiveType, saveData, downlink } = this.networkAdapter;
    
    // Don't preload on data saver mode unless critical
    if (saveData && priority !== 'critical') {
      return false;
    }
    
    // Network-based preloading rules
    switch (effectiveType) {
      case 'slow-2g':
        return priority === 'critical';
      case '2g':
        return ['critical', 'high'].includes(priority);
      case '3g':
        return ['critical', 'high', 'medium'].includes(priority);
      case '4g':
        return true; // Preload everything on 4G
      default:
        return ['critical', 'high', 'medium'].includes(priority);
    }
  }

  adaptPreloadingStrategy() {
    const { effectiveType, downlink, saveData } = this.networkAdapter;
    
    if (saveData || effectiveType === 'slow-2g') {
      // Conservative preloading
      this.clearNonCriticalPreloads();
    } else if (effectiveType === '4g' && downlink > 5) {
      // Aggressive preloading
      this.scheduleAggressivePreloading();
    }
  }

  clearNonCriticalPreloads() {
    const criticalResources = new Set();
    
    this.preloadQueue.forEach((task, resource) => {
      if (task.priority !== 'critical') {
        this.preloadQueue.delete(resource);
      }
    });
  }

  scheduleAggressivePreloading() {
    // Preload all frequently accessed routes
    const frequentRoutes = this.getFrequentRoutes();
    
    frequentRoutes.forEach(route => {
      this.schedulePreload(route, 'background', 'aggressive');
    });
  }

  getFrequentRoutes() {
    const routeCounts = {};
    
    // Count route visits from behavior data
    this.userBehaviorData.recentEvents.forEach(event => {
      const route = event.route;
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    });
    
    // Return routes visited more than 5 times
    return Object.entries(routeCounts)
      .filter(([route, count]) => count >= 5)
      .map(([route]) => route);
  }

  startIdlePreloading() {
    // Use requestIdleCallback for background preloading
    const idlePreload = (deadline) => {
      while (deadline.timeRemaining() > 0 && this.preloadQueue.size > 0) {
        // Find lowest priority task
        const backgroundTasks = Array.from(this.preloadQueue.values())
          .filter(task => task.priority === 'background')
          .sort((a, b) => a.scheduledAt - b.scheduledAt);
        
        if (backgroundTasks.length > 0) {
          this.executePreload(backgroundTasks[0]);
          break; // Only do one per idle callback
        } else {
          break; // No background tasks
        }
      }
      
      // Schedule next idle preloading
      if ('requestIdleCallback' in window) {
        requestIdleCallback(idlePreload, { timeout: 5000 });
      }
    };
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(idlePreload, { timeout: 1000 });
    }
  }

  loadUserBehavior() {
    const defaultBehavior = {
      recentEvents: [],
      routeTransitions: {},
      eventFrequency: {},
      userProfile: {},
      lastUpdated: Date.now()
    };
    
    try {
      const stored = localStorage.getItem('mlg_user_behavior');
      return stored ? { ...defaultBehavior, ...JSON.parse(stored) } : defaultBehavior;
    } catch {
      return defaultBehavior;
    }
  }

  saveUserBehavior() {
    try {
      this.userBehaviorData.lastUpdated = Date.now();
      localStorage.setItem('mlg_user_behavior', JSON.stringify(this.userBehaviorData));
    } catch (error) {
      console.warn('Failed to save user behavior data:', error);
    }
  }

  // Public API methods
  preload(resource, priority = 'medium') {
    this.schedulePreload(resource, priority, 'manual');
  }

  preloadForGamingScenario(scenario) {
    const scenarioPreloads = {
      'new-user': [
        { resource: '/voting', priority: 'critical' },
        { resource: '/wallet', priority: 'critical' },
        { resource: '/clans', priority: 'high' }
      ],
      'returning-voter': [
        { resource: '/clans', priority: 'high' },
        { resource: '/analytics', priority: 'medium' }
      ],
      'clan-member': [
        { resource: '/voting', priority: 'critical' },
        { resource: '/content', priority: 'high' },
        { resource: '/leaderboard', priority: 'high' }
      ],
      'content-creator': [
        { resource: '/voting', priority: 'high' },
        { resource: '/analytics', priority: 'medium' },
        { resource: '/profile', priority: 'medium' }
      ]
    };

    const preloads = scenarioPreloads[scenario] || [];
    preloads.forEach(({ resource, priority }) => {
      this.schedulePreload(resource, priority, `scenario:${scenario}`);
    });
  }

  enablePreloading() {
    this.isPreloadingEnabled = true;
    console.log('🚀 Gaming preloading enabled');
  }

  disablePreloading() {
    this.isPreloadingEnabled = false;
    console.log('🛑 Gaming preloading disabled');
  }

  getPreloadStats() {
    return {
      queueSize: this.preloadQueue.size,
      preloadedCount: this.preloadedResources.size,
      userProfile: this.userBehaviorData.userProfile,
      networkCondition: this.networkAdapter,
      isEnabled: this.isPreloadingEnabled
    };
  }

  clearPreloadCache() {
    this.preloadQueue.clear();
    this.preloadedResources.clear();
    console.log('🧹 Preload cache cleared');
  }
}

// Initialize global preload manager
const gamingPreloadManager = new GamingPreloadManager();

// Export for use in components
export { GamingPreloadManager, gamingPreloadManager };

// Make available globally
if (typeof window !== 'undefined') {
  window.MLGPreloadManager = gamingPreloadManager;
}

export default gamingPreloadManager;