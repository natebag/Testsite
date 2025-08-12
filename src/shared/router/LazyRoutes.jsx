/**
 * Lazy Route Components with Gaming-Optimized Code Splitting
 * 
 * Implements React.lazy() for all major routes with strategic preloading
 * Optimized for gaming workflows and performance
 */

import { lazy } from 'react';
import { gamingRouteLoader } from '../components/gaming/GamingRouteLoader.jsx';

// Critical gaming routes - highest priority, smallest chunks
const LazyVotingRoute = gamingRouteLoader.createLazyRoute(
  () => import('../components/routes/VotingRoute.jsx'),
  'voting',
  ['mouseenter:nav-voting', 'focus:nav-voting']
);

const LazyWalletRoute = gamingRouteLoader.createLazyRoute(
  () => import('../components/routes/WalletRoute.jsx'),
  'wallet',
  ['wallet-connect-click', 'mouseenter:wallet-btn']
);

// Social gaming routes - medium priority
const LazyClansRoute = gamingRouteLoader.createLazyRoute(
  () => import('../components/routes/ClansRoute.jsx'),
  'clans',
  ['mouseenter:nav-clans', 'voting-completed']
);

const LazyProfileRoute = gamingRouteLoader.createLazyRoute(
  () => import('../components/routes/ProfileRoute.jsx'),
  'profile',
  ['mouseenter:nav-profile', 'wallet-connected']
);

// Content and community routes - standard priority
const LazyContentRoute = gamingRouteLoader.createLazyRoute(
  () => import('../components/routes/ContentRoute.jsx'),
  'content',
  ['mouseenter:nav-content', 'clan-joined']
);

const LazyAnalyticsRoute = gamingRouteLoader.createLazyRoute(
  () => import('../components/routes/AnalyticsRoute.jsx'),
  'analytics',
  ['mouseenter:nav-analytics', 'admin-access']
);

// Governance routes - lower priority
const LazyDAORoute = gamingRouteLoader.createLazyRoute(
  () => import('../components/routes/DAORoute.jsx'),
  'dao',
  ['mouseenter:nav-dao', 'governance-interest']
);

// Home route - always cached
const LazyHomeRoute = gamingRouteLoader.createLazyRoute(
  () => import('../components/routes/HomeRoute.jsx'),
  'home',
  ['app-init'] // Preload immediately
);

// Feature-based lazy components
const LazyWeb3Features = {
  // Wallet components
  PhantomWallet: lazy(() => import('../../features/wallet/phantom-wallet.js').then(module => ({
    default: module.PhantomWallet || module.default
  }))),
  
  WalletConnect: lazy(() => import('../components/wallet/WalletConnectModal.jsx')),
  
  TokenBalance: lazy(() => import('../components/wallet/TokenBalanceDisplay.jsx')),

  // Voting components  
  VotingInterface: lazy(() => import('../components/voting/VotingInterface.jsx')),
  
  BurnVoteConfirmation: lazy(() => import('../components/burn-vote-confirmation-ui.js').then(module => ({
    default: module.BurnVoteConfirmationUI || module.default
  }))),

  VoteHistory: lazy(() => import('../components/voting/VoteHistoryTable.jsx')),

  // Clan components
  ClanManagement: lazy(() => import('../components/clan-management-ui.jsx').then(module => ({
    default: module.ClanManagementUI || module.default
  }))),
  
  ClanLeaderboard: lazy(() => import('../components/clan-leaderboard-ui.jsx').then(module => ({
    default: module.ClanLeaderboardUI || module.default
  }))),

  ClanInvitations: lazy(() => import('../components/clans/ClanInvitationManager.jsx')),

  // Content components
  ContentSubmissionForm: lazy(() => import('../components/content-submission-form.js').then(module => ({
    default: module.ContentSubmissionForm || module.default
  }))),
  
  ModerationQueue: lazy(() => import('../components/moderation-queue-interface.js').then(module => ({
    default: module.ModerationQueueInterface || module.default
  }))),

  ContentDisplay: lazy(() => import('../components/content/ContentDisplayGrid.jsx')),

  // Analytics components
  PerformanceDashboard: lazy(() => import('../components/analytics/PerformanceDashboard.jsx')),
  
  UserAnalytics: lazy(() => import('../components/analytics/UserAnalyticsPanel.jsx')),
  
  TokenMetrics: lazy(() => import('../components/analytics/TokenMetricsChart.jsx'))
};

// Gaming utility components
const LazyGamingUtils = {
  LoadingStates: lazy(() => import('../components/gaming/GamingLoadingState.jsx')),
  
  ErrorBoundary: lazy(() => import('../components/gaming/GamingErrorBoundary.jsx')),
  
  PerformanceMonitor: lazy(() => import('../utils/performance/GamingPerformanceMonitor.jsx')),
  
  NotificationCenter: lazy(() => import('../components/gaming/NotificationCenter.jsx')),
  
  KeyboardShortcuts: lazy(() => import('../components/gaming/KeyboardShortcuts.jsx'))
};

// Third-party library components (heaviest, lowest priority)
const LazyExternalLibs = {
  ChartComponents: lazy(() => import('../components/charts/ChartLibraryWrapper.jsx')),
  
  QRCodeGenerator: lazy(() => import('../components/utils/QRCodeGenerator.jsx')),
  
  ImageOptimizer: lazy(() => import('../components/media/ImageOptimizer.jsx')),
  
  VideoPlayer: lazy(() => import('../components/media/VideoPlayer.jsx'))
};

// Route configuration with performance hints
const routeConfig = {
  '/': {
    component: LazyHomeRoute,
    priority: 'high',
    preload: 'immediate',
    title: 'MLG.clan - Gaming Platform'
  },
  '/voting': {
    component: LazyVotingRoute,
    priority: 'critical',
    preload: 'on-hover',
    title: 'Voting - MLG.clan'
  },
  '/clans': {
    component: LazyClansRoute,
    priority: 'high',
    preload: 'on-hover',
    title: 'Clans - MLG.clan'
  },
  '/content': {
    component: LazyContentRoute,
    priority: 'medium',
    preload: 'on-interaction',
    title: 'Content - MLG.clan'
  },
  '/profile': {
    component: LazyProfileRoute,
    priority: 'medium',
    preload: 'on-wallet-connect',
    title: 'Profile - MLG.clan'
  },
  '/dao': {
    component: LazyDAORoute,
    priority: 'low',
    preload: 'lazy',
    title: 'DAO Governance - MLG.clan'
  },
  '/analytics': {
    component: LazyAnalyticsRoute,
    priority: 'low',
    preload: 'lazy',
    title: 'Analytics - MLG.clan'
  },
  '/wallet': {
    component: LazyWalletRoute,
    priority: 'critical',
    preload: 'on-app-load',
    title: 'Wallet - MLG.clan'
  }
};

// Preloading strategies based on gaming user behavior
const preloadingStrategies = {
  // Immediate preloading on app start
  immediate: async () => {
    const criticalRoutes = ['voting', 'wallet'];
    return Promise.all(criticalRoutes.map(route => 
      gamingRouteLoader.preloadRoute(route)
    ));
  },

  // Preload based on user interaction patterns
  onUserEngagement: async (eventType) => {
    const preloadMap = {
      'wallet-connected': ['clans', 'voting', 'profile'],
      'voting-completed': ['clans', 'analytics'],
      'clan-joined': ['content', 'voting'],
      'content-submitted': ['voting', 'analytics'],
      'admin-detected': ['analytics', 'dao']
    };

    const routesToPreload = preloadMap[eventType] || [];
    return Promise.all(routesToPreload.map(route => 
      gamingRouteLoader.preloadRoute(route)
    ));
  },

  // Network-aware preloading
  adaptivePreloading: async () => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      // Only preload on fast connections
      if (connection.effectiveType === '4g' && connection.downlink > 5) {
        return preloadingStrategies.immediate();
      } else if (connection.effectiveType === '3g') {
        // Preload only critical routes on 3G
        return gamingRouteLoader.preloadRoute('voting');
      }
    }
    
    // Default preloading for unknown connections
    return gamingRouteLoader.preloadRoute('voting');
  },

  // Gaming session-based preloading
  sessionBasedPreloading: async (sessionData) => {
    const { isReturningUser, lastVisitedRoutes, userRole } = sessionData;
    
    if (isReturningUser && lastVisitedRoutes.length > 0) {
      // Preload user's frequently visited routes
      const topRoutes = lastVisitedRoutes.slice(0, 3);
      return Promise.all(topRoutes.map(route => 
        gamingRouteLoader.preloadRoute(route)
      ));
    }
    
    // Role-based preloading
    const rolePreloads = {
      'admin': ['analytics', 'dao', 'content'],
      'moderator': ['content', 'analytics', 'clans'],
      'clan-leader': ['clans', 'voting', 'analytics'],
      'member': ['voting', 'clans', 'content']
    };
    
    const routes = rolePreloads[userRole] || rolePreloads['member'];
    return Promise.all(routes.map(route => 
      gamingRouteLoader.preloadRoute(route)
    ));
  }
};

// Performance monitoring for route loading
const routePerformanceMonitor = {
  startTiming: (routeName) => {
    performance.mark(`route-${routeName}-start`);
  },
  
  endTiming: (routeName) => {
    performance.mark(`route-${routeName}-end`);
    performance.measure(
      `route-${routeName}-load`,
      `route-${routeName}-start`,
      `route-${routeName}-end`
    );
    
    const measure = performance.getEntriesByName(`route-${routeName}-load`)[0];
    if (measure) {
      console.log(`🎮 Route ${routeName} loaded in ${measure.duration.toFixed(2)}ms`);
      
      // Track slow routes
      if (measure.duration > 2000) { // 2 second threshold
        console.warn(`⚠️  Slow route detected: ${routeName} (${measure.duration.toFixed(2)}ms)`);
      }
    }
  },
  
  getRouteMetrics: () => {
    const routeEntries = performance.getEntriesByType('measure')
      .filter(entry => entry.name.includes('route-') && entry.name.includes('-load'));
    
    return routeEntries.map(entry => ({
      route: entry.name.replace('route-', '').replace('-load', ''),
      duration: entry.duration,
      timestamp: entry.startTime
    }));
  }
};

// Export everything for use in the application
export {
  // Route components
  LazyVotingRoute,
  LazyWalletRoute,
  LazyClansRoute,
  LazyProfileRoute,
  LazyContentRoute,
  LazyAnalyticsRoute,
  LazyDAORoute,
  LazyHomeRoute,
  
  // Feature components
  LazyWeb3Features,
  LazyGamingUtils,
  LazyExternalLibs,
  
  // Configuration and utilities
  routeConfig,
  preloadingStrategies,
  routePerformanceMonitor
};

export default routeConfig;