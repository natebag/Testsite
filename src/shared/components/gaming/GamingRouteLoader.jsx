/**
 * Gaming Route Loader with Advanced Code Splitting
 * 
 * Provides React.lazy() route-based code splitting optimized for gaming scenarios
 * Includes preloading, error boundaries, and gaming-specific loading states
 */

import React, { Suspense, lazy, useState, useEffect } from 'react';
import { GamingLoadingState } from './GamingLoadingState.jsx';
import { GamingErrorBoundary } from './GamingErrorBoundary.jsx';

// Gaming-optimized route loader with preloading capabilities
class GamingRouteLoader {
  constructor() {
    this.preloadedRoutes = new Set();
    this.routeComponents = new Map();
    this.preloadPromises = new Map();
  }

  // Create lazy-loaded route component
  createLazyRoute(importFunction, routeName, preloadTriggers = []) {
    const LazyComponent = lazy(async () => {
      try {
        console.log(`🎮 Loading ${routeName} route...`);
        const start = performance.now();
        
        const module = await importFunction();
        
        const loadTime = performance.now() - start;
        console.log(`✅ ${routeName} loaded in ${loadTime.toFixed(2)}ms`);
        
        // Track performance metrics
        this.trackRoutePerformance(routeName, loadTime);
        
        return module;
      } catch (error) {
        console.error(`❌ Failed to load ${routeName} route:`, error);
        throw error;
      }
    });

    // Store for preloading
    this.routeComponents.set(routeName, { 
      component: LazyComponent, 
      importFunction,
      preloadTriggers 
    });

    return LazyComponent;
  }

  // Preload route for anticipated navigation
  preloadRoute(routeName) {
    if (this.preloadedRoutes.has(routeName)) {
      return this.preloadPromises.get(routeName);
    }

    const routeData = this.routeComponents.get(routeName);
    if (!routeData) {
      console.warn(`⚠️  Route ${routeName} not found for preloading`);
      return Promise.resolve();
    }

    console.log(`🚀 Preloading ${routeName} route...`);
    
    const preloadPromise = routeData.importFunction()
      .then(() => {
        console.log(`✅ ${routeName} preloaded successfully`);
        this.preloadedRoutes.add(routeName);
      })
      .catch(error => {
        console.error(`❌ Failed to preload ${routeName}:`, error);
      });

    this.preloadPromises.set(routeName, preloadPromise);
    return preloadPromise;
  }

  // Preload multiple routes based on gaming flow
  preloadGamingFlow(currentRoute) {
    const gamingFlows = {
      'voting': ['clans', 'profile'], // After voting, users often check clans/profile
      'clans': ['voting', 'content'], // Clan members often vote and create content
      'profile': ['voting', 'analytics'], // Profile users check voting history
      'content': ['voting', 'clans'], // Content creators engage with voting/clans
      'dao': ['voting', 'analytics'], // DAO users analyze voting patterns
      'analytics': ['voting', 'dao'] // Analytics users dive into voting/governance
    };

    const nextRoutes = gamingFlows[currentRoute] || [];
    return Promise.all(nextRoutes.map(route => this.preloadRoute(route)));
  }

  // Track route loading performance
  trackRoutePerformance(routeName, loadTime) {
    if (window.MLGAnalytics) {
      window.MLGAnalytics.trackEvent('route_performance', {
        route: routeName,
        loadTime: loadTime,
        timestamp: Date.now()
      });
    }

    // Store in performance entries for monitoring
    const performanceData = {
      route: routeName,
      loadTime,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink
      } : null
    };

    const existingData = JSON.parse(localStorage.getItem('mlg_route_performance') || '[]');
    existingData.push(performanceData);
    
    // Keep only last 50 entries
    if (existingData.length > 50) {
      existingData.splice(0, existingData.length - 50);
    }
    
    localStorage.setItem('mlg_route_performance', JSON.stringify(existingData));
  }

  // Get route performance analytics
  getRouteAnalytics() {
    const data = JSON.parse(localStorage.getItem('mlg_route_performance') || '[]');
    const analytics = {};

    data.forEach(entry => {
      if (!analytics[entry.route]) {
        analytics[entry.route] = {
          loads: 0,
          totalTime: 0,
          avgTime: 0,
          minTime: Infinity,
          maxTime: 0
        };
      }

      const routeData = analytics[entry.route];
      routeData.loads++;
      routeData.totalTime += entry.loadTime;
      routeData.minTime = Math.min(routeData.minTime, entry.loadTime);
      routeData.maxTime = Math.max(routeData.maxTime, entry.loadTime);
      routeData.avgTime = routeData.totalTime / routeData.loads;
    });

    return analytics;
  }
}

// Global route loader instance
const gamingRouteLoader = new GamingRouteLoader();

// Gaming Route Wrapper Component
const GamingRoute = ({ 
  component: Component, 
  routeName, 
  loadingTitle = "Loading Gaming Experience",
  errorFallback = null,
  preloadOnHover = false,
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Preload based on gaming flow when component mounts
    if (routeName) {
      gamingRouteLoader.preloadGamingFlow(routeName);
    }
  }, [routeName]);

  useEffect(() => {
    // Preload on hover if enabled
    if (preloadOnHover && isHovered && routeName) {
      gamingRouteLoader.preloadRoute(routeName);
    }
  }, [preloadOnHover, isHovered, routeName]);

  return (
    <div 
      onMouseEnter={preloadOnHover ? () => setIsHovered(true) : undefined}
      onMouseLeave={preloadOnHover ? () => setIsHovered(false) : undefined}
    >
      <GamingErrorBoundary fallback={errorFallback} routeName={routeName}>
        <Suspense fallback={<GamingLoadingState title={loadingTitle} routeName={routeName} />}>
          <Component {...props} />
        </Suspense>
      </GamingErrorBoundary>
    </div>
  );
};

// High-Order Component for route wrapping
const withGamingRoute = (routeName, options = {}) => (Component) => {
  return (props) => (
    <GamingRoute
      component={Component}
      routeName={routeName}
      {...options}
      {...props}
    />
  );
};

// Export route loader and components
export { 
  gamingRouteLoader, 
  GamingRoute, 
  withGamingRoute,
  GamingRouteLoader 
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.MLGRouteLoader = gamingRouteLoader;
}

export default GamingRoute;