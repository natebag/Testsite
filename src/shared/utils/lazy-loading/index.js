/**
 * MLG Comprehensive Lazy Loading System
 * 
 * Main entry point that integrates all lazy loading components
 * Provides unified API and automatic initialization
 */

// Import all lazy loading modules
import { MLGLazyImageLoader } from './lazy-image-loader.js'
import { MLGLazyComponentLoader } from './lazy-component-loader.jsx'
import { MLGProgressiveLoadingStrategies } from './progressive-loading-strategies.js'
import { MLGGamingAssetLoader } from './gaming-asset-loader.js'
import { MLGLazyLoadingPerformanceMonitor } from './performance-monitor.js'
import { MLGBrowserFallbacks } from './browser-fallbacks.js'

class MLGLazyLoadingSystem {
  constructor(options = {}) {
    this.options = {
      // Global settings
      autoInit: options.autoInit !== false,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring !== false,
      enableFallbacks: options.enableFallbacks !== false,
      enableGamingAssets: options.enableGamingAssets !== false,
      
      // Image loading settings
      imageSettings: {
        rootMargin: '100px',
        threshold: 0.1,
        useBlurPlaceholder: true,
        enableWebP: true,
        enableAVIF: true,
        ...options.imageSettings
      },

      // Component loading settings
      componentSettings: {
        minLoadingTime: 300,
        loadingDelay: 150,
        errorBoundary: true,
        ...options.componentSettings
      },

      // Progressive loading settings
      progressiveSettings: {
        networkAdaptive: true,
        deviceAdaptive: true,
        batteryOptimized: true,
        ...options.progressiveSettings
      },

      // Gaming asset settings
      gamingAssetSettings: {
        enableAudioContext: true,
        enableVideoOptimization: true,
        cacheStrategy: 'aggressive',
        ...options.gamingAssetSettings
      },

      // Performance monitoring settings
      performanceSettings: {
        trackCoreWebVitals: true,
        trackUserInteractions: true,
        reportingInterval: 30000,
        ...options.performanceSettings
      }
    }

    this.modules = new Map()
    this.initialized = false
    this.performanceReport = null
    
    if (this.options.autoInit) {
      this.initialize()
    }
  }

  async initialize() {
    if (this.initialized) {
      console.warn('MLG Lazy Loading System already initialized')
      return
    }

    console.log('🚀 Initializing MLG Comprehensive Lazy Loading System...')

    try {
      // Initialize browser fallbacks first
      if (this.options.enableFallbacks) {
        this.modules.set('fallbacks', new MLGBrowserFallbacks())
        console.log('✅ Browser fallbacks initialized')
      }

      // Initialize performance monitoring
      if (this.options.enablePerformanceMonitoring) {
        this.modules.set('performance', new MLGLazyLoadingPerformanceMonitor())
        console.log('✅ Performance monitoring initialized')
      }

      // Initialize progressive loading strategies
      this.modules.set('progressive', new MLGProgressiveLoadingStrategies())
      console.log('✅ Progressive loading strategies initialized')

      // Initialize image loading
      this.modules.set('images', new MLGLazyImageLoader(this.options.imageSettings))
      console.log('✅ Image lazy loading initialized')

      // Initialize component loading
      this.modules.set('components', new MLGLazyComponentLoader())
      console.log('✅ Component lazy loading initialized')

      // Initialize gaming asset loading
      if (this.options.enableGamingAssets) {
        this.modules.set('gamingAssets', new MLGGamingAssetLoader())
        console.log('✅ Gaming asset loading initialized')
      }

      // Setup integrations between modules
      this.setupModuleIntegrations()

      // Auto-discover and initialize lazy loading for existing content
      this.autoDiscoverContent()

      // Setup performance reporting
      if (this.options.enablePerformanceMonitoring) {
        this.setupPerformanceReporting()
      }

      this.initialized = true
      
      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('mlg-lazy-loading-ready', {
        detail: { system: this }
      }))

      console.log('🎯 MLG Comprehensive Lazy Loading System initialized successfully')

    } catch (error) {
      console.error('❌ Failed to initialize MLG Lazy Loading System:', error)
      throw error
    }
  }

  setupModuleIntegrations() {
    const performance = this.modules.get('performance')
    const fallbacks = this.modules.get('fallbacks')
    
    if (performance) {
      // Integrate performance monitoring with other modules
      const images = this.modules.get('images')
      const components = this.modules.get('components')
      const gamingAssets = this.modules.get('gamingAssets')

      // Hook into image loading events
      if (images) {
        const originalOnLoad = images.options.onLoad
        images.options.onLoad = (imgElement, loadTime) => {
          performance.measureImageLoad(
            imgElement.src,
            loadTime,
            imgElement.classList.contains('mlg-lazy'),
            this.estimateImageSize(imgElement)
          )
          if (originalOnLoad) originalOnLoad(imgElement, loadTime)
        }
      }

      // Hook into component loading
      if (components) {
        performance.addMeasurementCallback((type, data) => {
          if (type === 'component-load') {
            console.log('📊 Component performance tracked:', data)
          }
        })
      }

      // Hook into gaming asset loading
      if (gamingAssets) {
        // Integration will be handled by the gaming asset loader internally
      }
    }

    // Use fallback strategies if needed
    if (fallbacks && fallbacks.isFallbackActive()) {
      console.log('🔧 Activating fallback strategies')
      this.activateFallbackMode()
    }
  }

  autoDiscoverContent() {
    console.log('🔍 Auto-discovering lazy loadable content...')
    
    // Discover lazy images
    const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]')
    if (lazyImages.length > 0) {
      const imageLoader = this.modules.get('images')
      if (imageLoader) {
        lazyImages.forEach(img => imageLoader.observe(img))
        console.log(`📷 Discovered ${lazyImages.length} lazy images`)
      }
    }

    // Discover video elements
    const lazyVideos = document.querySelectorAll('video[data-src]')
    if (lazyVideos.length > 0 && this.options.enableGamingAssets) {
      const assetLoader = this.modules.get('gamingAssets')
      if (assetLoader) {
        lazyVideos.forEach(video => {
          this.loadVideoLazily(video)
        })
        console.log(`🎥 Discovered ${lazyVideos.length} lazy videos`)
      }
    }

    // Discover components with lazy loading attributes
    const lazyComponents = document.querySelectorAll('[data-lazy-component]')
    if (lazyComponents.length > 0) {
      console.log(`⚛️ Discovered ${lazyComponents.length} lazy components`)
    }
  }

  setupPerformanceReporting() {
    const performance = this.modules.get('performance')
    if (!performance) return

    // Set up periodic performance reporting
    setInterval(() => {
      this.performanceReport = performance.getPerformanceReport()
      
      // Trigger custom event for external monitoring
      window.dispatchEvent(new CustomEvent('mlg-performance-report', {
        detail: this.performanceReport
      }))

      // Log summary to console (can be disabled in production)
      if (this.options.performanceSettings.logReports !== false) {
        this.logPerformanceSummary()
      }

    }, this.options.performanceSettings.reportingInterval)
  }

  activateFallbackMode() {
    const fallbacks = this.modules.get('fallbacks')
    if (!fallbacks) return

    // Replace image loader with fallback
    if (fallbacks.getSupportedFeatures().intersectionObserver === false) {
      const FallbackImageLoader = fallbacks.getFallbackStrategy('lazy-images')
      if (FallbackImageLoader) {
        this.modules.set('images', new FallbackImageLoader({
          threshold: 200,
          throttle: 100
        }))
        console.log('🔄 Using fallback image loader')
      }
    }

    // Use fallback component loading
    const FallbackComponentLoader = fallbacks.getFallbackStrategy('lazy-components')
    if (FallbackComponentLoader) {
      // This would integrate with React loading in a real implementation
      console.log('🔄 Fallback component loading available')
    }
  }

  // Public API methods

  // Image lazy loading
  loadImage(imageElement, options = {}) {
    const imageLoader = this.modules.get('images')
    if (imageLoader) {
      imageLoader.observe(imageElement)
    }
  }

  loadImages(selector = 'img[data-src]') {
    const imageLoader = this.modules.get('images')
    if (imageLoader) {
      imageLoader.observeAll(selector)
    }
  }

  // Component lazy loading
  createLazyComponent(importFunction, options = {}) {
    const componentLoader = this.modules.get('components')
    if (componentLoader) {
      return componentLoader.createLazyComponent(importFunction, options)
    }
    throw new Error('Component loader not available')
  }

  createSuspenseWrapper(LazyComponent, options = {}) {
    const componentLoader = this.modules.get('components')
    if (componentLoader) {
      return componentLoader.createSuspenseWrapper(LazyComponent, options)
    }
    throw new Error('Component loader not available')
  }

  // Progressive loading
  loadWithStrategy(strategyName, content, options = {}) {
    const progressiveLoader = this.modules.get('progressive')
    if (progressiveLoader) {
      return progressiveLoader.loadContent(strategyName, content, options)
    }
    throw new Error('Progressive loader not available')
  }

  // Gaming assets
  loadGameAsset(assetConfig) {
    const assetLoader = this.modules.get('gamingAssets')
    if (assetLoader) {
      return assetLoader.loadGameAsset(assetConfig)
    }
    throw new Error('Gaming asset loader not available')
  }

  loadGameAssetBatch(assets, options = {}) {
    const assetLoader = this.modules.get('gamingAssets')
    if (assetLoader) {
      return assetLoader.loadAssetBatch(assets, options)
    }
    throw new Error('Gaming asset loader not available')
  }

  // Video loading helper
  async loadVideoLazily(videoElement) {
    const src = videoElement.dataset.src
    if (!src) return

    const assetLoader = this.modules.get('gamingAssets')
    if (assetLoader) {
      try {
        const videoAsset = await assetLoader.loadGameAsset({
          url: src,
          type: 'video',
          quality: '720p'
        })
        
        videoElement.src = src
        delete videoElement.dataset.src
        videoElement.load()
        
        console.log('🎥 Video loaded lazily:', src)
      } catch (error) {
        console.warn('Video lazy loading failed:', error)
      }
    }
  }

  // Performance and monitoring
  getPerformanceReport() {
    const performance = this.modules.get('performance')
    return performance ? performance.getPerformanceReport() : null
  }

  getMetrics() {
    const metrics = {}
    
    this.modules.forEach((module, name) => {
      if (typeof module.getMetrics === 'function') {
        metrics[name] = module.getMetrics()
      }
    })

    return metrics
  }

  logPerformanceSummary() {
    if (!this.performanceReport) return

    const { coreWebVitals, lazyLoading, componentLoading } = this.performanceReport

    console.group('📊 MLG Lazy Loading Performance Summary')
    console.log(`🎯 LCP: ${coreWebVitals.lcp?.toFixed(2) || 'N/A'}ms`)
    console.log(`⚡ FID: ${coreWebVitals.fid?.toFixed(2) || 'N/A'}ms`)
    console.log(`📐 CLS: ${coreWebVitals.cls?.toFixed(3) || 'N/A'}`)
    console.log(`📷 Images loaded: ${lazyLoading.totalImagesLoaded} (${lazyLoading.lazyImagesLoaded} lazy)`)
    console.log(`⚛️ Components loaded: ${componentLoading.componentsLoaded}`)
    console.log(`🎮 Lazy loading efficiency: ${lazyLoading.efficiency}%`)
    console.groupEnd()
  }

  // Configuration and utilities
  updateConfig(newOptions) {
    this.options = { ...this.options, ...newOptions }
    
    // Update individual module configs if needed
    this.modules.forEach((module, name) => {
      if (typeof module.updateConfig === 'function') {
        const moduleConfig = newOptions[`${name}Settings`]
        if (moduleConfig) {
          module.updateConfig(moduleConfig)
        }
      }
    })
  }

  // Preloading utilities
  preloadCriticalAssets(assets) {
    const assetLoader = this.modules.get('gamingAssets')
    if (assetLoader) {
      return assetLoader.preloadCriticalAssets(assets)
    }
  }

  preloadRoute(routeName, importFunction) {
    const componentLoader = this.modules.get('components')
    if (componentLoader) {
      const LazyComponent = componentLoader.createLazyComponent(importFunction, {
        chunkName: `route-${routeName}`,
        preload: true
      })
      return LazyComponent
    }
  }

  // Utility methods
  estimateImageSize(imgElement) {
    // Rough estimation for performance tracking
    return imgElement.naturalWidth * imgElement.naturalHeight * 4
  }

  // Cleanup and lifecycle
  pause() {
    this.modules.forEach(module => {
      if (typeof module.pause === 'function') {
        module.pause()
      }
    })
    console.log('⏸️ MLG Lazy Loading System paused')
  }

  resume() {
    this.modules.forEach(module => {
      if (typeof module.resume === 'function') {
        module.resume()
      }
    })
    console.log('▶️ MLG Lazy Loading System resumed')
  }

  destroy() {
    this.modules.forEach((module, name) => {
      if (typeof module.destroy === 'function') {
        module.destroy()
      }
    })
    
    this.modules.clear()
    this.initialized = false
    
    console.log('🗑️ MLG Lazy Loading System destroyed')
  }

  // Development and debugging helpers
  debug() {
    return {
      initialized: this.initialized,
      modules: Array.from(this.modules.keys()),
      options: this.options,
      performance: this.getPerformanceReport(),
      metrics: this.getMetrics()
    }
  }
}

// Create and export global instance
const mlgLazyLoadingSystem = new MLGLazyLoadingSystem()

// Export for module usage
export { MLGLazyLoadingSystem }

// Global API
window.MLGLazyLoading = mlgLazyLoadingSystem

// Convenience methods
window.lazyLoadImage = (img, options) => mlgLazyLoadingSystem.loadImage(img, options)
window.lazyLoadImages = (selector) => mlgLazyLoadingSystem.loadImages(selector)
window.createLazyComponent = (importFn, options) => mlgLazyLoadingSystem.createLazyComponent(importFn, options)
window.loadGameAsset = (config) => mlgLazyLoadingSystem.loadGameAsset(config)
window.getLazyLoadingMetrics = () => mlgLazyLoadingSystem.getMetrics()
window.getLazyLoadingPerformance = () => mlgLazyLoadingSystem.getPerformanceReport()

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!mlgLazyLoadingSystem.initialized) {
      mlgLazyLoadingSystem.initialize()
    }
  })
} else if (!mlgLazyLoadingSystem.initialized) {
  mlgLazyLoadingSystem.initialize()
}

console.log('🎯 MLG Comprehensive Lazy Loading System module loaded')

export default mlgLazyLoadingSystem