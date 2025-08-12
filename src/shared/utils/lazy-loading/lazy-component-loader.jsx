/**
 * MLG Lazy Component Loader
 * 
 * React component lazy loading with Suspense boundaries
 * Optimized for heavy gaming components and performance
 */

import React, { Suspense, lazy, useState, useEffect } from 'react'

// Gaming-themed loading components
const GamingLoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-gaming-accent border-t-transparent rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-12 h-12 border-4 border-gaming-purple border-b-transparent rounded-full animate-spin animate-reverse"></div>
    </div>
    <span className="ml-4 text-gaming-accent animate-pulse">Loading...</span>
  </div>
)

const GamingSkeletonCard = () => (
  <div className="bg-gaming-surface rounded-xl p-6 animate-pulse">
    <div className="h-4 bg-gray-600 rounded w-3/4 mb-4"></div>
    <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-700 rounded w-5/6"></div>
  </div>
)

const GamingSkeletonList = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 bg-gaming-surface rounded-lg animate-pulse">
        <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-600 rounded w-3/4"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
)

class MLGLazyComponentLoader {
  constructor() {
    this.componentCache = new Map()
    this.loadingComponents = new Set()
    this.failedComponents = new Set()
    this.preloadQueue = []
    this.metrics = {
      totalComponents: 0,
      loadedComponents: 0,
      failedComponents: 0,
      avgLoadTime: 0,
      totalLoadTime: 0
    }
    
    console.log('⚛️ MLG Lazy Component Loader initialized')
  }

  /**
   * Create a lazy-loaded component with enhanced error handling
   */
  createLazyComponent(importFunction, options = {}) {
    const {
      fallback = <GamingLoadingSpinner />,
      errorFallback = null,
      preload = false,
      priority = 'normal',
      retryAttempts = 3,
      retryDelay = 1000,
      chunkName = null
    } = options

    // Create the lazy component with retry logic
    const LazyComponent = lazy(async () => {
      const startTime = performance.now()
      const componentKey = chunkName || importFunction.toString()
      
      this.metrics.totalComponents++
      this.loadingComponents.add(componentKey)

      for (let attempt = 0; attempt <= retryAttempts; attempt++) {
        try {
          console.log(`⚛️ Loading component (attempt ${attempt + 1}/${retryAttempts + 1}):`, chunkName || 'anonymous')
          
          const module = await importFunction()
          
          // Track successful load
          const loadTime = performance.now() - startTime
          this.metrics.loadedComponents++
          this.metrics.totalLoadTime += loadTime
          this.metrics.avgLoadTime = this.metrics.totalLoadTime / this.metrics.loadedComponents
          
          this.loadingComponents.delete(componentKey)
          this.componentCache.set(componentKey, module)
          
          console.log(`✅ Component loaded in ${loadTime.toFixed(2)}ms:`, chunkName || 'anonymous')
          
          return module
          
        } catch (error) {
          console.warn(`⚠️ Component load attempt ${attempt + 1} failed:`, error.message)
          
          if (attempt === retryAttempts) {
            // Final attempt failed
            this.metrics.failedComponents++
            this.loadingComponents.delete(componentKey)
            this.failedComponents.add(componentKey)
            
            if (errorFallback) {
              // Return error fallback as a component
              return { default: errorFallback }
            }
            
            throw error
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        }
      }
    })

    // Preload if requested
    if (preload) {
      this.preloadComponent(LazyComponent, priority)
    }

    return LazyComponent
  }

  /**
   * Create a lazy component wrapper with Suspense boundary
   */
  createSuspenseWrapper(LazyComponent, options = {}) {
    const {
      fallback = <GamingLoadingSpinner />,
      errorBoundary = true,
      loadingDelay = 200,
      minLoadingTime = 500,
      loadingComponent = null
    } = options

    const SuspenseWrapper = (props) => {
      const [showLoading, setShowLoading] = useState(false)
      const [loadingStartTime, setLoadingStartTime] = useState(null)

      useEffect(() => {
        // Delay showing loading indicator to prevent flash
        const timer = setTimeout(() => {
          setShowLoading(true)
          setLoadingStartTime(Date.now())
        }, loadingDelay)

        return () => clearTimeout(timer)
      }, [])

      const LoadingComponent = loadingComponent || fallback
      const EnhancedLoadingComponent = showLoading ? LoadingComponent : null

      const ComponentWithMinDelay = (props) => {
        const [ready, setReady] = useState(false)

        useEffect(() => {
          if (loadingStartTime) {
            const elapsedTime = Date.now() - loadingStartTime
            const remainingTime = Math.max(0, minLoadingTime - elapsedTime)
            
            setTimeout(() => setReady(true), remainingTime)
          } else {
            setReady(true)
          }
        }, [loadingStartTime])

        if (!ready && showLoading) {
          return EnhancedLoadingComponent
        }

        return <LazyComponent {...props} />
      }

      if (errorBoundary) {
        return (
          <MLGErrorBoundary>
            <Suspense fallback={EnhancedLoadingComponent}>
              <ComponentWithMinDelay {...props} />
            </Suspense>
          </MLGErrorBoundary>
        )
      }

      return (
        <Suspense fallback={EnhancedLoadingComponent}>
          <ComponentWithMinDelay {...props} />
        </Suspense>
      )
    }

    return SuspenseWrapper
  }

  /**
   * Preload a component for better UX
   */
  async preloadComponent(LazyComponent, priority = 'normal') {
    if (priority === 'high') {
      try {
        await LazyComponent._payload._result
        console.log('🚀 High priority component preloaded')
      } catch (error) {
        console.warn('⚠️ Failed to preload high priority component:', error)
      }
    } else {
      // Add to preload queue for idle time processing
      this.preloadQueue.push(LazyComponent)
      this.processPreloadQueue()
    }
  }

  processPreloadQueue() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.preloadNextComponent())
    } else {
      setTimeout(() => this.preloadNextComponent(), 100)
    }
  }

  async preloadNextComponent() {
    if (this.preloadQueue.length === 0) return

    const LazyComponent = this.preloadQueue.shift()
    
    try {
      await LazyComponent._payload._result
      console.log('🔄 Component preloaded during idle time')
    } catch (error) {
      console.warn('⚠️ Failed to preload component during idle time:', error)
    }

    // Continue processing queue
    if (this.preloadQueue.length > 0) {
      this.processPreloadQueue()
    }
  }

  /**
   * Create specialized gaming component loaders
   */
  createGameAssetLoader(importFunction, options = {}) {
    return this.createLazyComponent(importFunction, {
      fallback: <GamingSkeletonCard />,
      errorFallback: () => (
        <div className="bg-gaming-surface border border-gaming-red rounded-xl p-6 text-center">
          <div className="text-gaming-red mb-2">⚠️ Failed to load game asset</div>
          <div className="text-sm text-gray-400">Please refresh the page</div>
        </div>
      ),
      retryAttempts: 5,
      retryDelay: 2000,
      ...options
    })
  }

  createClanComponentLoader(importFunction, options = {}) {
    return this.createLazyComponent(importFunction, {
      fallback: <GamingSkeletonList />,
      errorFallback: () => (
        <div className="bg-gaming-surface border border-gaming-yellow rounded-xl p-6 text-center">
          <div className="text-gaming-yellow mb-2">⚠️ Clan data temporarily unavailable</div>
          <div className="text-sm text-gray-400">Retrying connection...</div>
        </div>
      ),
      ...options
    })
  }

  createVotingComponentLoader(importFunction, options = {}) {
    return this.createLazyComponent(importFunction, {
      fallback: (
        <div className="bg-gaming-surface rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-gaming-accent bg-opacity-20 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
      ),
      errorFallback: () => (
        <div className="bg-gaming-surface border border-gaming-red rounded-xl p-6 text-center">
          <div className="text-gaming-red mb-2">⚠️ Voting system unavailable</div>
          <div className="text-sm text-gray-400">Please try again later</div>
        </div>
      ),
      ...options
    })
  }

  /**
   * Get loading metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalComponents > 0 
        ? (this.metrics.loadedComponents / this.metrics.totalComponents * 100).toFixed(2) + '%'
        : '0%',
      failureRate: this.metrics.totalComponents > 0 
        ? (this.metrics.failedComponents / this.metrics.totalComponents * 100).toFixed(2) + '%' 
        : '0%',
      currentlyLoading: this.loadingComponents.size,
      queuedForPreload: this.preloadQueue.length
    }
  }

  /**
   * Utility methods for common gaming patterns
   */
  
  // Route-based lazy loading
  createRouteComponent(importFunction, routeName) {
    return this.createSuspenseWrapper(
      this.createLazyComponent(importFunction, {
        chunkName: `route-${routeName}`,
        preload: false,
        fallback: (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <GamingLoadingSpinner />
              <div className="mt-4 text-gaming-accent">Loading {routeName}...</div>
            </div>
          </div>
        )
      }),
      {
        loadingDelay: 150,
        minLoadingTime: 300
      }
    )
  }

  // Modal/overlay lazy loading
  createModalComponent(importFunction, modalName) {
    return this.createSuspenseWrapper(
      this.createLazyComponent(importFunction, {
        chunkName: `modal-${modalName}`,
        priority: 'high',
        fallback: (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gaming-surface rounded-xl p-8">
              <GamingLoadingSpinner />
            </div>
          </div>
        )
      }),
      {
        loadingDelay: 0,
        minLoadingTime: 200
      }
    )
  }

  // Heavy data visualization components
  createChartComponent(importFunction, chartType) {
    return this.createSuspenseWrapper(
      this.createLazyComponent(importFunction, {
        chunkName: `chart-${chartType}`,
        retryAttempts: 2,
        fallback: (
          <div className="bg-gaming-surface rounded-xl p-8 animate-pulse">
            <div className="h-4 bg-gray-600 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        )
      }),
      {
        loadingDelay: 300,
        minLoadingTime: 600
      }
    )
  }
}

// Error boundary for lazy components
class MLGErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('MLG Error Boundary caught error:', error, errorInfo)
    
    // Report to error tracking service if available
    if (window.MLGErrorHandler) {
      window.MLGErrorHandler.handleReactError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-gaming-surface border border-gaming-red rounded-xl p-6 text-center">
          <div className="text-gaming-red text-xl mb-2">⚠️ Component Error</div>
          <div className="text-sm text-gray-400 mb-4">
            Something went wrong loading this component
          </div>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-gaming-accent text-black rounded-lg hover:bg-gaming-accent/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Export components and utilities
export { 
  MLGLazyComponentLoader,
  MLGErrorBoundary,
  GamingLoadingSpinner,
  GamingSkeletonCard,
  GamingSkeletonList
}

// Create global instance
const mlgLazyComponentLoader = new MLGLazyComponentLoader()

// Export global instance
window.MLGLazyComponentLoader = mlgLazyComponentLoader

console.log('⚛️ MLG Lazy Component Loader module loaded')