/**
 * Code Splitting Integration for MLG.clan Gaming Platform
 * 
 * Centralized initialization and coordination of all code splitting features
 * Optimized for gaming performance and user experience
 */

import { gamingRouteLoader } from '../components/gaming/GamingRouteLoader.jsx';
import { gamingPreloadManager } from '../utils/performance/GamingPreloadManager.js';
import { gamingPerformanceMonitor } from '../utils/performance/GamingPerformanceMonitor.jsx';

class CodeSplittingIntegration {
  constructor() {
    this.isInitialized = false;
    this.performanceMetrics = {};
    this.optimizationStrategies = new Map();
    this.userBehaviorProfile = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    console.log('🎮 Initializing Gaming Code Splitting System...');
    
    try {
      // Initialize core components
      await this.initializeRouteLoader();
      await this.initializePreloadManager();
      await this.initializePerformanceMonitor();
      
      // Set up integrations
      this.setupCrossComponentIntegration();
      this.setupUserBehaviorTracking();
      this.setupPerformanceOptimization();
      
      // Initialize gaming-specific optimizations
      await this.initializeGamingOptimizations();
      
      this.isInitialized = true;
      console.log('✅ Gaming Code Splitting System initialized successfully');
      
      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('mlg-code-splitting-ready', {
        detail: { timestamp: Date.now() }
      }));
      
    } catch (error) {
      console.error('❌ Failed to initialize Code Splitting System:', error);
      throw error;
    }
  }

  async initializeRouteLoader() {
    console.log('🔄 Setting up route loading system...');
    
    // Initialize route performance tracking
    gamingRouteLoader.routeComponents.forEach((routeData, routeName) => {
      // Set up preloading triggers
      this.setupRoutePreloading(routeName, routeData);
    });
  }

  async initializePreloadManager() {
    console.log('🚀 Setting up preload management...');
    
    // Detect user profile and set up preloading strategy
    await this.detectUserProfile();
    
    // Configure preloading based on user profile
    this.configurePreloadingStrategy();
    
    // Set up network-adaptive preloading
    this.setupNetworkAdaptivePreloading();
  }

  async initializePerformanceMonitor() {
    console.log('📊 Setting up performance monitoring...');
    
    // Start performance monitoring
    gamingPerformanceMonitor.startMonitoring();
    
    // Set up performance-based optimizations
    this.setupPerformanceBasedOptimizations();
  }

  setupCrossComponentIntegration() {
    // Integrate route loader with preload manager
    gamingRouteLoader.preloadRoute = async (routeName) => {
      return gamingPreloadManager.preload(`/src/components/routes/${routeName}Route.jsx`, 'high');
    };

    // Integrate performance monitor with route loader
    const originalCreateLazyRoute = gamingRouteLoader.createLazyRoute.bind(gamingRouteLoader);
    gamingRouteLoader.createLazyRoute = (importFunction, routeName, preloadTriggers) => {
      const wrappedImportFunction = async () => {
        gamingPerformanceMonitor.routePerformanceMonitor.startTiming(routeName);
        try {
          const module = await importFunction();
          gamingPerformanceMonitor.routePerformanceMonitor.endTiming(routeName);
          return module;
        } catch (error) {
          gamingPerformanceMonitor.routePerformanceMonitor.endTiming(routeName);
          throw error;
        }
      };
      
      return originalCreateLazyRoute(wrappedImportFunction, routeName, preloadTriggers);
    };

    // Integrate preload manager with performance monitor
    const originalSchedulePreload = gamingPreloadManager.schedulePreload.bind(gamingPreloadManager);
    gamingPreloadManager.schedulePreload = (resource, priority, reason) => {
      const performanceScore = gamingPerformanceMonitor.getPerformanceScore();
      
      // Adjust preloading based on current performance
      if (performanceScore < 70 && priority !== 'critical') {
        console.log(`🐌 Skipping preload of ${resource} due to low performance score (${performanceScore})`);
        return;
      }
      
      return originalSchedulePreload(resource, priority, reason);
    };
  }

  setupUserBehaviorTracking() {
    const gamingBehaviors = [
      'wallet-connected',
      'vote-cast', 
      'clan-joined',
      'content-submitted',
      'leaderboard-viewed',
      'profile-updated',
      'analytics-accessed',
      'dao-participated'
    ];

    gamingBehaviors.forEach(behavior => {
      document.addEventListener(behavior, (event) => {
        this.trackGamingBehavior(behavior, event.detail);
      });
    });

    // Track route-based gaming patterns
    this.trackGamingRoutePatterns();
  }

  trackGamingBehavior(behavior, data) {
    // Update user behavior profile
    this.updateUserBehaviorProfile(behavior, data);
    
    // Trigger predictive preloading
    this.triggerPredictivePreloading(behavior);
    
    // Optimize performance based on behavior
    this.optimizeBasedOnBehavior(behavior);
  }

  trackGamingRoutePatterns() {
    let currentRoute = window.location.pathname;
    
    // Track gaming session patterns
    const sessionStart = Date.now();
    const routeVisits = new Map();
    
    const trackRouteVisit = (route) => {
      const visitCount = routeVisits.get(route) || 0;
      routeVisits.set(route, visitCount + 1);
      
      // Identify gaming power users (frequent route switches)
      const totalVisits = Array.from(routeVisits.values()).reduce((sum, count) => sum + count, 0);
      if (totalVisits > 10 && Date.now() - sessionStart < 600000) { // 10 routes in 10 minutes
        this.identifyPowerUser();
      }
    };

    // Monitor route changes
    const observer = new MutationObserver(() => {
      const newRoute = window.location.pathname;
      if (newRoute !== currentRoute) {
        trackRouteVisit(newRoute);
        currentRoute = newRoute;
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  identifyPowerUser() {
    console.log('🎯 Power user detected - enabling aggressive preloading');
    
    // Enable aggressive preloading for power users
    gamingPreloadManager.preloadForGamingScenario('power-user');
    
    // Preload all critical gaming components
    const criticalComponents = [
      '/voting',
      '/clans', 
      '/wallet',
      '/profile',
      '/leaderboard'
    ];
    
    criticalComponents.forEach(component => {
      gamingPreloadManager.preload(component, 'high', 'power-user');
    });
  }

  async detectUserProfile() {
    // Analyze stored user behavior
    const behaviorData = JSON.parse(localStorage.getItem('mlg_user_behavior') || '{}');
    
    if (!behaviorData.eventFrequency) {
      this.userBehaviorProfile = 'new-user';
      return;
    }

    const events = behaviorData.eventFrequency;
    const totalEvents = Object.values(events).reduce((sum, count) => sum + count, 0);
    
    if (totalEvents < 5) {
      this.userBehaviorProfile = 'new-user';
    } else if (events['vote-cast'] > events['clan-joined'] * 2) {
      this.userBehaviorProfile = 'voter';
    } else if (events['clan-joined'] > 0 && events['leaderboard-viewed'] > 3) {
      this.userBehaviorProfile = 'social-gamer';
    } else if (events['content-submitted'] > 2) {
      this.userBehaviorProfile = 'content-creator';
    } else if (events['analytics-accessed'] > events['voting'] || events['dao-participated'] > 0) {
      this.userBehaviorProfile = 'analyst';
    } else {
      this.userBehaviorProfile = 'casual-user';
    }

    console.log(`👤 User profile detected: ${this.userBehaviorProfile}`);
  }

  configurePreloadingStrategy() {
    const strategies = {
      'new-user': {
        immediate: ['/voting', '/wallet'],
        hover: ['/clans', '/profile'],
        idle: []
      },
      'voter': {
        immediate: ['/voting', '/clans'],
        hover: ['/analytics', '/profile'],
        idle: ['/dao']
      },
      'social-gamer': {
        immediate: ['/clans', '/voting'],
        hover: ['/content', '/leaderboard'],
        idle: ['/analytics']
      },
      'content-creator': {
        immediate: ['/content', '/voting'],
        hover: ['/analytics', '/profile'],
        idle: ['/dao']
      },
      'analyst': {
        immediate: ['/analytics', '/dao'],
        hover: ['/voting', '/clans'],
        idle: ['/content']
      },
      'casual-user': {
        immediate: ['/voting'],
        hover: ['/clans', '/profile'],
        idle: ['/content', '/analytics']
      }
    };

    const strategy = strategies[this.userBehaviorProfile] || strategies['casual-user'];
    
    // Implement immediate preloading
    strategy.immediate.forEach(route => {
      gamingPreloadManager.preload(route, 'critical', 'profile-based');
    });

    // Set up hover preloading
    strategy.hover.forEach(route => {
      this.setupHoverPreloading(route);
    });

    // Schedule idle preloading
    strategy.idle.forEach(route => {
      gamingPreloadManager.schedulePreload(route, 'background', 'profile-based');
    });
  }

  setupHoverPreloading(route) {
    const selector = `[href="${route}"], [data-route="${route}"]`;
    
    document.addEventListener('mouseover', (event) => {
      if (event.target.matches(selector)) {
        gamingPreloadManager.preload(route, 'medium', 'hover');
      }
    });
  }

  setupNetworkAdaptivePreloading() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      const adaptStrategy = () => {
        const { effectiveType, downlink, saveData } = connection;
        
        if (saveData) {
          console.log('📱 Data saver mode detected - conservative preloading');
          gamingPreloadManager.disablePreloading();
        } else {
          gamingPreloadManager.enablePreloading();
          
          switch (effectiveType) {
            case '4g':
              if (downlink > 10) {
                console.log('🚄 Fast connection - aggressive preloading');
                this.enableAggressivePreloading();
              }
              break;
            case '3g':
              console.log('📶 3G connection - moderate preloading');
              this.enableModeratePreloading();
              break;
            case '2g':
            case 'slow-2g':
              console.log('🐌 Slow connection - minimal preloading');
              this.enableMinimalPreloading();
              break;
          }
        }
      };

      adaptStrategy();
      connection.addEventListener('change', adaptStrategy);
    }
  }

  enableAggressivePreloading() {
    // Preload all gaming routes
    const allRoutes = ['/voting', '/clans', '/content', '/profile', '/analytics', '/dao'];
    allRoutes.forEach(route => {
      gamingPreloadManager.preload(route, 'background', 'aggressive');
    });
  }

  enableModeratePreloading() {
    // Preload based on user profile with medium priority
    this.configurePreloadingStrategy();
  }

  enableMinimalPreloading() {
    // Only preload critical gaming features
    gamingPreloadManager.preload('/voting', 'critical', 'minimal');
    gamingPreloadManager.preload('/wallet', 'critical', 'minimal');
  }

  setupPerformanceBasedOptimizations() {
    // Monitor performance and adjust strategies
    setInterval(() => {
      const performanceScore = gamingPerformanceMonitor.getPerformanceScore();
      
      if (performanceScore < 60) {
        console.log(`⚠️ Low performance detected (${performanceScore}) - optimizing`);
        this.enablePerformanceMode();
      } else if (performanceScore > 80) {
        console.log(`✅ Good performance (${performanceScore}) - standard mode`);
        this.enableStandardMode();
      }
    }, 30000); // Check every 30 seconds
  }

  enablePerformanceMode() {
    // Reduce preloading and optimize for current experience
    gamingPreloadManager.clearPreloadCache();
    
    // Only critical preloading
    this.enableMinimalPreloading();
    
    // Defer non-critical operations
    this.deferNonCriticalOperations();
  }

  enableStandardMode() {
    // Resume normal preloading strategy
    this.configurePreloadingStrategy();
    
    // Re-enable deferred operations
    this.enableDeferredOperations();
  }

  deferNonCriticalOperations() {
    // Defer analytics tracking
    if (window.MLGAnalytics) {
      window.MLGAnalytics.defer = true;
    }
    
    // Reduce animation complexity
    document.body.classList.add('performance-mode');
  }

  enableDeferredOperations() {
    // Re-enable analytics
    if (window.MLGAnalytics) {
      window.MLGAnalytics.defer = false;
    }
    
    // Restore animations
    document.body.classList.remove('performance-mode');
  }

  async initializeGamingOptimizations() {
    console.log('🎮 Setting up gaming-specific optimizations...');
    
    // Preload critical gaming assets
    await this.preloadCriticalGamingAssets();
    
    // Set up gaming interaction optimizations
    this.setupGamingInteractionOptimizations();
    
    // Initialize Web3 preloading
    this.setupWeb3Preloading();
  }

  async preloadCriticalGamingAssets() {
    const criticalAssets = [
      // Critical voting components
      '/src/features/voting/solana-voting-system.js',
      
      // Critical wallet components  
      '/src/features/wallet/phantom-wallet.js',
      
      // Core UI components
      '/src/shared/components/burn-vote-confirmation-ui.js',
      
      // State management
      '/src/shared/utils/state/index.js'
    ];

    const preloadPromises = criticalAssets.map(asset => 
      gamingPreloadManager.preload(asset, 'critical', 'gaming-init')
    );

    await Promise.all(preloadPromises);
    console.log('✅ Critical gaming assets preloaded');
  }

  setupGamingInteractionOptimizations() {
    // Optimize vote button interactions
    document.addEventListener('vote-button-hover', () => {
      gamingPreloadManager.preload('/src/components/voting/VotingInterface.jsx', 'high', 'interaction');
    });

    // Optimize wallet connection
    document.addEventListener('wallet-button-hover', () => {
      gamingPreloadManager.preload('/src/features/wallet/phantom-wallet.js', 'critical', 'interaction');
    });

    // Optimize clan interactions
    document.addEventListener('clan-link-hover', () => {
      gamingPreloadManager.preload('/src/components/routes/ClansRoute.jsx', 'high', 'interaction');
    });
  }

  setupWeb3Preloading() {
    // Preload Web3 components when wallet is detected
    if (window.solana || window.phantom) {
      console.log('👛 Web3 wallet detected - preloading blockchain components');
      
      const web3Components = [
        '/src/features/tokens/spl-mlg-token.js',
        '/src/shared/components/wallet-ui.js',
        '/src/shared/components/transaction-confirmation-ui.js'
      ];

      web3Components.forEach(component => {
        gamingPreloadManager.preload(component, 'high', 'web3-detected');
      });
    }
  }

  // Public API methods
  getOptimizationStatus() {
    return {
      initialized: this.isInitialized,
      userProfile: this.userBehaviorProfile,
      performanceScore: gamingPerformanceMonitor.getPerformanceScore(),
      preloadStats: gamingPreloadManager.getPreloadStats(),
      routeMetrics: gamingRouteLoader.getRouteAnalytics()
    };
  }

  optimizeForGamingScenario(scenario) {
    console.log(`🎯 Optimizing for gaming scenario: ${scenario}`);
    
    gamingPreloadManager.preloadForGamingScenario(scenario);
    
    // Scenario-specific optimizations
    switch (scenario) {
      case 'tournament-mode':
        this.enableTournamentOptimizations();
        break;
      case 'voting-session':
        this.enableVotingOptimizations();
        break;
      case 'clan-competition':
        this.enableClanOptimizations();
        break;
    }
  }

  enableTournamentOptimizations() {
    // Aggressive preloading for tournament features
    const tournamentRoutes = ['/clans', '/leaderboard', '/voting', '/analytics'];
    tournamentRoutes.forEach(route => {
      gamingPreloadManager.preload(route, 'critical', 'tournament');
    });
  }

  enableVotingOptimizations() {
    // Optimize for voting workflows
    gamingPreloadManager.preload('/voting', 'critical', 'voting-session');
    gamingPreloadManager.preload('/wallet', 'critical', 'voting-session');
    gamingPreloadManager.preload('/clans', 'high', 'voting-session');
  }

  enableClanOptimizations() {
    // Optimize for clan interactions
    gamingPreloadManager.preload('/clans', 'critical', 'clan-competition');
    gamingPreloadManager.preload('/leaderboard', 'critical', 'clan-competition');
    gamingPreloadManager.preload('/voting', 'high', 'clan-competition');
  }
}

// Create global integration instance
const codeSplittingIntegration = new CodeSplittingIntegration();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    codeSplittingIntegration.initialize().catch(console.error);
  });
} else {
  codeSplittingIntegration.initialize().catch(console.error);
}

// Make available globally
window.MLGCodeSplitting = codeSplittingIntegration;

export { CodeSplittingIntegration, codeSplittingIntegration };
export default codeSplittingIntegration;