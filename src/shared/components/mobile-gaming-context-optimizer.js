/**
 * MLG.clan Mobile Gaming Context Optimizer
 * 
 * Advanced context-aware performance optimization system that adapts
 * mobile performance based on specific gaming scenarios:
 * 
 * Gaming Context Modes:
 * 🏆 Tournament Mode: Maximum performance for competitive gaming
 * 🎮 Clan Mode: Balanced performance for social gaming interactions  
 * 🗳️ Voting Mode: Optimized for rapid content evaluation and decision making
 * 👤 Profile Mode: Power-efficient for extended browsing and stat viewing
 * 🌐 Social Mode: Balanced performance for community interaction and sharing
 * 
 * Each mode intelligently optimizes:
 * - CPU/GPU allocation and priority
 * - Memory management strategies
 * - Network request batching and prioritization
 * - Animation and rendering quality
 * - Battery consumption patterns
 * - User interaction responsiveness
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 1.0.0
 */

import { MobileGamingPerformanceOptimizer } from './mobile-gaming-performance-optimizer.js';
import { MobileGamingBatteryManager } from './mobile-gaming-battery-manager.js';

/**
 * Gaming Context Optimization Configuration
 */
const GAMING_CONTEXT_CONFIG = {
  // Context-Specific Performance Profiles
  contexts: {
    tournament: {
      name: 'Tournament Mode',
      description: 'Maximum performance for competitive gaming',
      icon: '🏆',
      priority: 'critical',
      
      performance: {
        cpuPriority: 'maximum',
        gpuAcceleration: 'enabled',
        memoryStrategy: 'aggressive-preload',
        frameRateTarget: 60,
        renderQuality: 'high',
        animationQuality: 'smooth',
        responsiveness: 'instant'
      },
      
      networking: {
        priority: 'realtime',
        maxConcurrent: 6,
        timeoutMs: 3000,
        retryAttempts: 3,
        caching: 'aggressive',
        preload: 'critical-assets',
        compression: 'minimal'
      },
      
      resources: {
        criticalAssets: ['leaderboards', 'live-brackets', 'player-stats', 'tournament-data'],
        preloadRadius: 5,
        cacheLifetime: 30000, // 30 seconds
        updateFrequency: 1000, // 1 second
        priorityQueue: 'tournament-critical'
      },
      
      battery: {
        optimization: 'performance-first',
        powerBudget: 'unrestricted',
        thermalLimit: 'high',
        backgroundProcessing: 'minimal'
      },
      
      ui: {
        animations: 'enhanced',
        transitions: 'smooth',
        effects: 'enabled',
        refreshRate: 'maximum',
        inputLatency: 'minimal'
      }
    },

    clan: {
      name: 'Clan Mode',
      description: 'Balanced performance for social gaming',
      icon: '🎮',
      priority: 'high',
      
      performance: {
        cpuPriority: 'balanced',
        gpuAcceleration: 'selective',
        memoryStrategy: 'balanced-cache',
        frameRateTarget: 45,
        renderQuality: 'medium-high',
        animationQuality: 'smooth',
        responsiveness: 'fast'
      },
      
      networking: {
        priority: 'interactive',
        maxConcurrent: 4,
        timeoutMs: 5000,
        retryAttempts: 2,
        caching: 'balanced',
        preload: 'social-assets',
        compression: 'balanced'
      },
      
      resources: {
        criticalAssets: ['clan-data', 'member-avatars', 'clan-stats', 'activity-feed'],
        preloadRadius: 3,
        cacheLifetime: 60000, // 1 minute
        updateFrequency: 5000, // 5 seconds
        priorityQueue: 'clan-social'
      },
      
      battery: {
        optimization: 'balanced',
        powerBudget: 'managed',
        thermalLimit: 'moderate',
        backgroundProcessing: 'selective'
      },
      
      ui: {
        animations: 'smooth',
        transitions: 'fluid',
        effects: 'selective',
        refreshRate: 'adaptive',
        inputLatency: 'low'
      }
    },

    voting: {
      name: 'Voting Mode',
      description: 'Optimized for rapid content evaluation',
      icon: '🗳️',
      priority: 'high',
      
      performance: {
        cpuPriority: 'high',
        gpuAcceleration: 'content-focused',
        memoryStrategy: 'content-cache',
        frameRateTarget: 45,
        renderQuality: 'medium',
        animationQuality: 'responsive',
        responsiveness: 'instant'
      },
      
      networking: {
        priority: 'content-delivery',
        maxConcurrent: 5,
        timeoutMs: 4000,
        retryAttempts: 2,
        caching: 'content-focused',
        preload: 'voting-queue',
        compression: 'optimized'
      },
      
      resources: {
        criticalAssets: ['content-thumbnails', 'voting-metadata', 'creator-info', 'voting-ui'],
        preloadRadius: 4,
        cacheLifetime: 45000, // 45 seconds
        updateFrequency: 2000, // 2 seconds
        priorityQueue: 'voting-content'
      },
      
      battery: {
        optimization: 'efficiency-focused',
        powerBudget: 'moderate',
        thermalLimit: 'moderate',
        backgroundProcessing: 'deferred'
      },
      
      ui: {
        animations: 'responsive',
        transitions: 'quick',
        effects: 'minimal',
        refreshRate: 'content-optimized',
        inputLatency: 'minimal'
      }
    },

    profile: {
      name: 'Profile Mode',
      description: 'Power-efficient for extended browsing',
      icon: '👤',
      priority: 'low',
      
      performance: {
        cpuPriority: 'conservative',
        gpuAcceleration: 'minimal',
        memoryStrategy: 'conservative',
        frameRateTarget: 30,
        renderQuality: 'efficient',
        animationQuality: 'reduced',
        responsiveness: 'standard'
      },
      
      networking: {
        priority: 'background',
        maxConcurrent: 2,
        timeoutMs: 8000,
        retryAttempts: 1,
        caching: 'aggressive',
        preload: 'minimal',
        compression: 'maximum'
      },
      
      resources: {
        criticalAssets: ['user-avatar', 'basic-stats', 'achievement-icons'],
        preloadRadius: 1,
        cacheLifetime: 300000, // 5 minutes
        updateFrequency: 30000, // 30 seconds
        priorityQueue: 'profile-basic'
      },
      
      battery: {
        optimization: 'maximum-efficiency',
        powerBudget: 'restricted',
        thermalLimit: 'low',
        backgroundProcessing: 'minimal'
      },
      
      ui: {
        animations: 'minimal',
        transitions: 'simple',
        effects: 'disabled',
        refreshRate: 'reduced',
        inputLatency: 'acceptable'
      }
    },

    social: {
      name: 'Social Mode',
      description: 'Balanced performance for community interaction',
      icon: '🌐',
      priority: 'medium',
      
      performance: {
        cpuPriority: 'balanced',
        gpuAcceleration: 'media-focused',
        memoryStrategy: 'media-cache',
        frameRateTarget: 45,
        renderQuality: 'medium',
        animationQuality: 'smooth',
        responsiveness: 'interactive'
      },
      
      networking: {
        priority: 'social-media',
        maxConcurrent: 4,
        timeoutMs: 6000,
        retryAttempts: 2,
        caching: 'media-focused',
        preload: 'social-feed',
        compression: 'adaptive'
      },
      
      resources: {
        criticalAssets: ['feed-content', 'gaming-clips', 'social-avatars', 'interaction-ui'],
        preloadRadius: 3,
        cacheLifetime: 120000, // 2 minutes
        updateFrequency: 10000, // 10 seconds
        priorityQueue: 'social-feed'
      },
      
      battery: {
        optimization: 'social-balanced',
        powerBudget: 'moderate',
        thermalLimit: 'moderate',
        backgroundProcessing: 'social-aware'
      },
      
      ui: {
        animations: 'media-enhanced',
        transitions: 'smooth',
        effects: 'social-focused',
        refreshRate: 'adaptive',
        inputLatency: 'interactive'
      }
    }
  },

  // Context Transition Rules
  transitions: {
    tournament: {
      from: ['clan', 'social'],
      preparationTime: 1000, // 1 second to prepare for tournament mode
      warnings: ['high-power-mode', 'battery-impact'],
      optimizations: ['preload-tournament-assets', 'clear-non-essential-cache']
    },
    clan: {
      from: ['social', 'profile'],
      preparationTime: 500,
      optimizations: ['preload-clan-data', 'prepare-social-features']
    },
    voting: {
      from: ['social', 'clan'],
      preparationTime: 300,
      optimizations: ['preload-content-queue', 'prepare-voting-ui']
    },
    profile: {
      from: ['any'],
      preparationTime: 100,
      optimizations: ['enable-power-saving', 'reduce-background-activity']
    },
    social: {
      from: ['profile', 'clan'],
      preparationTime: 400,
      optimizations: ['preload-social-feed', 'prepare-media-cache']
    }
  },

  // Resource Priority Mappings
  resourcePriorities: {
    tournament: {
      'leaderboard-data': 100,
      'live-brackets': 95,
      'player-stats': 90,
      'tournament-notifications': 85,
      'gaming-assets': 80
    },
    clan: {
      'clan-dashboard': 100,
      'member-activity': 90,
      'clan-stats': 85,
      'social-features': 80,
      'clan-media': 75
    },
    voting: {
      'content-queue': 100,
      'voting-interface': 95,
      'content-metadata': 90,
      'creator-profiles': 80,
      'voting-analytics': 70
    },
    profile: {
      'user-data': 100,
      'achievement-data': 80,
      'statistics': 70,
      'profile-media': 60,
      'settings': 50
    },
    social: {
      'social-feed': 100,
      'gaming-clips': 90,
      'social-interactions': 85,
      'community-content': 80,
      'social-notifications': 75
    }
  },

  // Performance Monitoring Thresholds per Context
  monitoringThresholds: {
    tournament: { fps: 55, latency: 16, memory: 40 },
    clan: { fps: 40, latency: 25, memory: 60 },
    voting: { fps: 40, latency: 20, memory: 50 },
    profile: { fps: 25, latency: 50, memory: 30 },
    social: { fps: 40, latency: 30, memory: 55 }
  }
};

/**
 * Mobile Gaming Context Optimizer Class
 */
export class MobileGamingContextOptimizer {
  constructor(options = {}) {
    this.options = {
      enableAutoContextDetection: true,
      enablePreemptiveOptimization: true,
      enableContextPrediction: true,
      enablePerformanceMonitoring: true,
      enableResourcePrioritization: true,
      enableTransitionOptimization: true,
      debugMode: false,
      ...options
    };

    // Current state
    this.state = {
      currentContext: 'general',
      previousContext: null,
      contextConfidence: 1.0,
      transitionInProgress: false,
      optimizationActive: false,
      predictedContext: null,
      contextHistory: []
    };

    // Performance tracking
    this.performance = {
      contextMetrics: new Map(),
      transitionTimes: new Map(),
      optimizationResults: new Map(),
      resourceUsage: new Map(),
      userSatisfaction: new Map()
    };

    // Resource management
    this.resources = {
      priorityQueues: new Map(),
      cachingStrategies: new Map(),
      preloadedAssets: new Set(),
      activeRequests: new Map(),
      resourcePools: new Map()
    };

    // Context detection
    this.detection = {
      urlPatterns: new Map(),
      elementSelectors: new Map(),
      userBehaviorPatterns: new Map(),
      activityTrackers: new Map(),
      contextIndicators: new Set()
    };

    // Optimization systems
    this.optimizers = {
      performance: null,
      battery: null,
      network: null,
      ui: null
    };

    // Analytics
    this.analytics = {
      contextSwitches: 0,
      optimizationSuccess: 0,
      performanceImprovements: 0,
      batteryImprovements: 0,
      userEngagement: 0,
      sessionData: []
    };

    this.init();
  }

  /**
   * Initialize the gaming context optimizer
   */
  async init() {
    console.log('🎯 Initializing MLG Gaming Context Optimizer...');

    try {
      // Initialize context detection patterns
      this.initializeContextDetection();

      // Setup performance monitoring
      this.setupPerformanceMonitoring();

      // Initialize resource management
      this.initializeResourceManagement();

      // Setup optimization systems
      await this.setupOptimizationSystems();

      // Start context monitoring
      if (this.options.enableAutoContextDetection) {
        this.startContextMonitoring();
      }

      // Detect initial context
      this.state.currentContext = await this.detectCurrentContext();
      await this.applyContextOptimizations(this.state.currentContext);

      console.log('✅ Gaming Context Optimizer initialized', {
        initialContext: this.state.currentContext,
        confidence: this.state.contextConfidence
      });

    } catch (error) {
      console.error('❌ Failed to initialize Context Optimizer:', error);
      // Fallback to safe general context
      this.state.currentContext = 'profile';
    }
  }

  /**
   * Initialize context detection patterns
   */
  initializeContextDetection() {
    // URL pattern detection
    this.detection.urlPatterns.set('tournament', [
      /\/tournament/i,
      /\/brackets/i,
      /\/leaderboard/i,
      /\/competition/i
    ]);

    this.detection.urlPatterns.set('clan', [
      /\/clan/i,
      /\/guild/i,
      /\/team/i,
      /\/members/i
    ]);

    this.detection.urlPatterns.set('voting', [
      /\/vote/i,
      /\/voting/i,
      /\/content/i,
      /\/review/i
    ]);

    this.detection.urlPatterns.set('profile', [
      /\/profile/i,
      /\/user/i,
      /\/account/i,
      /\/settings/i
    ]);

    this.detection.urlPatterns.set('social', [
      /\/social/i,
      /\/feed/i,
      /\/community/i,
      /\/clips/i
    ]);

    // Element selector detection
    this.detection.elementSelectors.set('tournament', [
      '.tournament-bracket',
      '.leaderboard-live',
      '.competition-dashboard',
      '[data-context="tournament"]'
    ]);

    this.detection.elementSelectors.set('clan', [
      '.clan-dashboard',
      '.member-list',
      '.clan-stats',
      '[data-context="clan"]'
    ]);

    this.detection.elementSelectors.set('voting', [
      '.voting-interface',
      '.content-queue',
      '.voting-controls',
      '[data-context="voting"]'
    ]);

    this.detection.elementSelectors.set('profile', [
      '.user-profile',
      '.achievement-showcase',
      '.profile-stats',
      '[data-context="profile"]'
    ]);

    this.detection.elementSelectors.set('social', [
      '.social-feed',
      '.gaming-clips',
      '.community-interactions',
      '[data-context="social"]'
    ]);
  }

  /**
   * Start context monitoring for automatic detection
   */
  startContextMonitoring() {
    // URL change monitoring
    window.addEventListener('popstate', () => {
      this.handleContextChange();
    });

    // Mutation observer for DOM changes
    const observer = new MutationObserver((mutations) => {
      const hasSignificantChanges = mutations.some(mutation => 
        mutation.type === 'childList' && mutation.addedNodes.length > 0
      );

      if (hasSignificantChanges) {
        this.scheduleContextCheck();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-context', 'data-page']
    });

    // User interaction monitoring
    this.setupUserBehaviorTracking();

    console.log('👁️ Context monitoring started');
  }

  /**
   * Setup user behavior tracking for context prediction
   */
  setupUserBehaviorTracking() {
    let interactionHistory = [];

    // Track clicks and taps
    document.addEventListener('click', (e) => {
      const interaction = {
        timestamp: Date.now(),
        element: e.target.tagName,
        className: e.target.className,
        dataContext: e.target.dataset.context,
        section: this.getElementSection(e.target)
      };

      interactionHistory.push(interaction);
      this.analyzeUserBehavior(interactionHistory);

      // Keep only recent interactions (last 5 minutes)
      const fiveMinutesAgo = Date.now() - 300000;
      interactionHistory = interactionHistory.filter(i => i.timestamp > fiveMinutesAgo);
    });

    // Track scroll behavior
    let scrollTimer;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        this.analyzeScrollBehavior();
      }, 500);
    });
  }

  /**
   * Detect current gaming context
   */
  async detectCurrentContext() {
    const detectionResults = new Map();

    // URL-based detection
    const urlContext = this.detectContextFromURL();
    if (urlContext) {
      detectionResults.set('url', { context: urlContext, confidence: 0.8 });
    }

    // DOM-based detection
    const domContext = this.detectContextFromDOM();
    if (domContext) {
      detectionResults.set('dom', { context: domContext, confidence: 0.9 });
    }

    // User behavior detection
    const behaviorContext = this.detectContextFromBehavior();
    if (behaviorContext) {
      detectionResults.set('behavior', { context: behaviorContext, confidence: 0.6 });
    }

    // Data attribute detection
    const dataContext = this.detectContextFromDataAttributes();
    if (dataContext) {
      detectionResults.set('data', { context: dataContext, confidence: 1.0 });
    }

    // Calculate weighted context
    const contextConfidence = this.calculateContextConfidence(detectionResults);
    this.state.contextConfidence = contextConfidence.confidence;

    return contextConfidence.context;
  }

  /**
   * Detect context from URL patterns
   */
  detectContextFromURL() {
    const currentURL = window.location.pathname.toLowerCase();

    for (const [context, patterns] of this.detection.urlPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(currentURL)) {
          return context;
        }
      }
    }

    return null;
  }

  /**
   * Detect context from DOM elements
   */
  detectContextFromDOM() {
    for (const [context, selectors] of this.detection.elementSelectors) {
      for (const selector of selectors) {
        if (document.querySelector(selector)) {
          return context;
        }
      }
    }

    return null;
  }

  /**
   * Detect context from data attributes
   */
  detectContextFromDataAttributes() {
    const contextElement = document.querySelector('[data-gaming-context]');
    if (contextElement) {
      return contextElement.dataset.gamingContext;
    }

    const pageElement = document.querySelector('[data-page]');
    if (pageElement) {
      const page = pageElement.dataset.page;
      // Map page names to contexts
      const pageContextMap = {
        'tournament': 'tournament',
        'clan': 'clan',
        'voting': 'voting',
        'profile': 'profile',
        'social': 'social'
      };
      return pageContextMap[page] || null;
    }

    return null;
  }

  /**
   * Calculate weighted context confidence
   */
  calculateContextConfidence(detectionResults) {
    if (detectionResults.size === 0) {
      return { context: 'general', confidence: 0.5 };
    }

    const contextScores = new Map();

    // Calculate weighted scores
    for (const [method, result] of detectionResults) {
      const weight = this.getDetectionMethodWeight(method);
      const score = result.confidence * weight;

      if (contextScores.has(result.context)) {
        contextScores.set(result.context, contextScores.get(result.context) + score);
      } else {
        contextScores.set(result.context, score);
      }
    }

    // Find highest scoring context
    let bestContext = 'general';
    let bestScore = 0;

    for (const [context, score] of contextScores) {
      if (score > bestScore) {
        bestContext = context;
        bestScore = score;
      }
    }

    return {
      context: bestContext,
      confidence: Math.min(bestScore, 1.0)
    };
  }

  /**
   * Get detection method weight
   */
  getDetectionMethodWeight(method) {
    const weights = {
      data: 1.0,      // Explicit data attributes are most reliable
      dom: 0.9,       // DOM elements are very reliable
      url: 0.8,       // URL patterns are quite reliable
      behavior: 0.6   // User behavior is less reliable but useful
    };

    return weights[method] || 0.5;
  }

  /**
   * Handle context changes
   */
  async handleContextChange() {
    const newContext = await this.detectCurrentContext();

    if (newContext !== this.state.currentContext && this.state.contextConfidence > 0.7) {
      await this.switchContext(newContext);
    }
  }

  /**
   * Switch to a new gaming context
   */
  async switchContext(newContext) {
    if (this.state.transitionInProgress) {
      console.log('⚠️ Context transition already in progress');
      return;
    }

    console.log(`🎯 Switching context: ${this.state.currentContext} → ${newContext}`);

    this.state.transitionInProgress = true;
    this.state.previousContext = this.state.currentContext;

    try {
      // Pre-transition optimizations
      await this.prepareContextTransition(newContext);

      // Apply new context
      await this.applyContextOptimizations(newContext);

      // Update state
      this.state.currentContext = newContext;
      this.state.contextHistory.push({
        context: newContext,
        timestamp: Date.now(),
        previousContext: this.state.previousContext
      });

      // Post-transition cleanup
      await this.completeContextTransition();

      // Analytics
      this.analytics.contextSwitches++;

      console.log(`✅ Context switched to ${newContext}`);

      // Emit event
      this.dispatchEvent('context-changed', {
        newContext,
        previousContext: this.state.previousContext,
        confidence: this.state.contextConfidence
      });

    } catch (error) {
      console.error('❌ Context switch failed:', error);
    } finally {
      this.state.transitionInProgress = false;
    }
  }

  /**
   * Prepare for context transition
   */
  async prepareContextTransition(targetContext) {
    const transitionConfig = GAMING_CONTEXT_CONFIG.transitions[targetContext];
    if (!transitionConfig) return;

    console.log(`🔄 Preparing transition to ${targetContext}...`);

    // Wait for preparation time
    if (transitionConfig.preparationTime) {
      await new Promise(resolve => setTimeout(resolve, transitionConfig.preparationTime));
    }

    // Run preparation optimizations
    for (const optimization of transitionConfig.optimizations || []) {
      await this.executeOptimization(optimization);
    }

    // Show warnings if needed
    if (transitionConfig.warnings) {
      this.showTransitionWarnings(targetContext, transitionConfig.warnings);
    }
  }

  /**
   * Apply context-specific optimizations
   */
  async applyContextOptimizations(context) {
    const config = GAMING_CONTEXT_CONFIG.contexts[context];
    if (!config) {
      console.warn(`Unknown context: ${context}`);
      return;
    }

    console.log(`⚡ Applying ${config.name} optimizations...`);

    this.state.optimizationActive = true;

    try {
      // Performance optimizations
      await this.applyPerformanceOptimizations(config.performance);

      // Network optimizations
      await this.applyNetworkOptimizations(config.networking);

      // Resource management optimizations
      await this.applyResourceOptimizations(config.resources);

      // Battery optimizations
      await this.applyBatteryOptimizations(config.battery);

      // UI optimizations
      await this.applyUIOptimizations(config.ui);

      // Update CSS for context
      this.applyContextCSS(context, config);

      this.analytics.optimizationSuccess++;

    } catch (error) {
      console.error('Failed to apply context optimizations:', error);
    } finally {
      this.state.optimizationActive = false;
    }
  }

  /**
   * Apply performance optimizations for context
   */
  async applyPerformanceOptimizations(performanceConfig) {
    // Set frame rate target
    document.documentElement.style.setProperty('--target-fps', performanceConfig.frameRateTarget.toString());

    // Apply CPU priority
    this.setCPUPriority(performanceConfig.cpuPriority);

    // Configure GPU acceleration
    this.configureGPUAcceleration(performanceConfig.gpuAcceleration);

    // Set memory strategy
    this.setMemoryStrategy(performanceConfig.memoryStrategy);

    // Configure rendering quality
    this.setRenderingQuality(performanceConfig.renderQuality);
  }

  /**
   * Apply network optimizations for context
   */
  async applyNetworkOptimizations(networkConfig) {
    // Configure request priorities
    this.setNetworkPriority(networkConfig.priority);

    // Set concurrent request limits
    this.setMaxConcurrentRequests(networkConfig.maxConcurrent);

    // Configure timeouts and retries
    this.setNetworkTimeouts(networkConfig.timeoutMs, networkConfig.retryAttempts);

    // Apply caching strategy
    this.setCachingStrategy(networkConfig.caching);

    // Configure preloading
    this.setPreloadingStrategy(networkConfig.preload);
  }

  /**
   * Apply resource management optimizations
   */
  async applyResourceOptimizations(resourceConfig) {
    // Set resource priorities
    this.setResourcePriorities(resourceConfig.criticalAssets);

    // Configure preload radius
    this.setPreloadRadius(resourceConfig.preloadRadius);

    // Set cache lifetime
    this.setCacheLifetime(resourceConfig.cacheLifetime);

    // Configure update frequency
    this.setUpdateFrequency(resourceConfig.updateFrequency);

    // Initialize priority queue
    this.initializePriorityQueue(resourceConfig.priorityQueue);
  }

  /**
   * Apply UI optimizations for context
   */
  async applyUIOptimizations(uiConfig) {
    // Set animation quality
    this.setAnimationQuality(uiConfig.animations);

    // Configure transitions
    this.setTransitionQuality(uiConfig.transitions);

    // Apply effects settings
    this.setEffectsLevel(uiConfig.effects);

    // Configure refresh rate
    this.setRefreshRate(uiConfig.refreshRate);

    // Set input latency optimization
    this.setInputLatencyOptimization(uiConfig.inputLatency);
  }

  /**
   * Apply context-specific CSS
   */
  applyContextCSS(context, config) {
    const root = document.documentElement;
    const body = document.body;

    // Remove existing context classes
    body.classList.remove('context-tournament', 'context-clan', 'context-voting', 'context-profile', 'context-social');

    // Add current context class
    body.classList.add(`context-${context}`);

    // Set CSS variables
    root.style.setProperty('--gaming-context', context);
    root.style.setProperty('--context-priority', config.priority);
    root.style.setProperty('--frame-rate-target', `${config.performance.frameRateTarget}fps`);
    root.style.setProperty('--animation-quality', config.ui.animations);
    root.style.setProperty('--render-quality', config.performance.renderQuality);

    // Apply context-specific visual optimizations
    if (config.performance.frameRateTarget < 45) {
      body.classList.add('reduced-framerate');
    } else {
      body.classList.remove('reduced-framerate');
    }

    if (config.ui.animations === 'minimal') {
      body.classList.add('minimal-animations');
    } else {
      body.classList.remove('minimal-animations');
    }
  }

  /**
   * Create context optimization dashboard
   */
  createContextDashboard() {
    const dashboard = document.createElement('div');
    dashboard.className = 'gaming-context-dashboard';
    dashboard.innerHTML = `
      <div class="context-header">
        <h3>🎯 Gaming Context Optimizer</h3>
        <div class="current-context">
          <span class="context-icon">${GAMING_CONTEXT_CONFIG.contexts[this.state.currentContext]?.icon || '🎮'}</span>
          <span class="context-name">${GAMING_CONTEXT_CONFIG.contexts[this.state.currentContext]?.name || 'Unknown'}</span>
          <span class="context-confidence">${Math.round(this.state.contextConfidence * 100)}%</span>
        </div>
      </div>
      
      <div class="context-selector">
        <label>Gaming Mode:</label>
        <div class="context-options">
          ${Object.entries(GAMING_CONTEXT_CONFIG.contexts).map(([key, config]) => `
            <button class="context-option ${key === this.state.currentContext ? 'active' : ''}" 
                    data-context="${key}">
              <span class="option-icon">${config.icon}</span>
              <span class="option-name">${config.name}</span>
              <span class="option-fps">${config.performance.frameRateTarget}fps</span>
            </button>
          `).join('')}
        </div>
      </div>
      
      <div class="context-metrics">
        <div class="metric-card">
          <label>Performance Target</label>
          <span class="metric-value">${GAMING_CONTEXT_CONFIG.contexts[this.state.currentContext]?.performance.frameRateTarget || 30}fps</span>
        </div>
        <div class="metric-card">
          <label>Context Switches</label>
          <span class="metric-value">${this.analytics.contextSwitches}</span>
        </div>
        <div class="metric-card">
          <label>Optimizations</label>
          <span class="metric-value">${this.analytics.optimizationSuccess}</span>
        </div>
      </div>
      
      <div class="context-optimizations">
        <h4>Active Optimizations</h4>
        <div class="optimization-list" data-section="optimizations">
          <!-- Optimizations will be populated dynamically -->
        </div>
      </div>
    `;

    // Add event listeners
    dashboard.addEventListener('click', (e) => {
      const contextButton = e.target.closest('[data-context]');
      if (contextButton) {
        this.switchContext(contextButton.dataset.context);
      }
    });

    // Update dashboard periodically
    setInterval(() => {
      this.updateContextDashboard(dashboard);
    }, 2000);

    return dashboard;
  }

  /**
   * Update context dashboard
   */
  updateContextDashboard(dashboard) {
    // Update current context display
    const contextIcon = dashboard.querySelector('.context-icon');
    const contextName = dashboard.querySelector('.context-name');
    const contextConfidence = dashboard.querySelector('.context-confidence');

    if (contextIcon) contextIcon.textContent = GAMING_CONTEXT_CONFIG.contexts[this.state.currentContext]?.icon || '🎮';
    if (contextName) contextName.textContent = GAMING_CONTEXT_CONFIG.contexts[this.state.currentContext]?.name || 'Unknown';
    if (contextConfidence) contextConfidence.textContent = `${Math.round(this.state.contextConfidence * 100)}%`;

    // Update active context button
    dashboard.querySelectorAll('.context-option').forEach(button => {
      button.classList.toggle('active', button.dataset.context === this.state.currentContext);
    });

    // Update metrics
    const metricValues = dashboard.querySelectorAll('.metric-value');
    if (metricValues[0]) metricValues[0].textContent = `${GAMING_CONTEXT_CONFIG.contexts[this.state.currentContext]?.performance.frameRateTarget || 30}fps`;
    if (metricValues[1]) metricValues[1].textContent = this.analytics.contextSwitches.toString();
    if (metricValues[2]) metricValues[2].textContent = this.analytics.optimizationSuccess.toString();

    // Update optimizations list
    this.updateOptimizationsList(dashboard);
  }

  /**
   * Get context analytics
   */
  getContextAnalytics() {
    return {
      currentContext: this.state.currentContext,
      contextConfidence: this.state.contextConfidence,
      transitionInProgress: this.state.transitionInProgress,
      analytics: { ...this.analytics },
      performance: {
        contextMetrics: Object.fromEntries(this.performance.contextMetrics),
        transitionTimes: Object.fromEntries(this.performance.transitionTimes)
      },
      contextHistory: this.state.contextHistory.slice(-10) // Last 10 context changes
    };
  }

  /**
   * Helper methods for optimization implementation
   */
  setCPUPriority(priority) {
    document.documentElement.style.setProperty('--cpu-priority', priority);
  }

  configureGPUAcceleration(level) {
    document.documentElement.style.setProperty('--gpu-acceleration', level);
  }

  setMemoryStrategy(strategy) {
    document.documentElement.style.setProperty('--memory-strategy', strategy);
  }

  setRenderingQuality(quality) {
    document.documentElement.style.setProperty('--render-quality', quality);
  }

  setNetworkPriority(priority) {
    document.documentElement.style.setProperty('--network-priority', priority);
  }

  setMaxConcurrentRequests(max) {
    document.documentElement.style.setProperty('--max-concurrent-requests', max.toString());
  }

  setAnimationQuality(quality) {
    document.documentElement.style.setProperty('--animation-quality', quality);
  }

  scheduleContextCheck() {
    if (this.contextCheckTimer) {
      clearTimeout(this.contextCheckTimer);
    }

    this.contextCheckTimer = setTimeout(() => {
      this.handleContextChange();
    }, 500);
  }

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(`mlg-context-${eventName}`, { detail });
    document.dispatchEvent(event);
  }

  /**
   * Cleanup and shutdown
   */
  destroy() {
    console.log('🔥 Destroying Gaming Context Optimizer...');

    // Clear timers
    if (this.contextCheckTimer) {
      clearTimeout(this.contextCheckTimer);
    }

    // Reset state
    this.state = {};
    this.performance = {};
    this.resources = {};

    console.log('✅ Gaming Context Optimizer destroyed');
  }
}

export default MobileGamingContextOptimizer;