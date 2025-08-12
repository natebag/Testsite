/**
 * MLG Lazy Loading Performance Monitor
 * 
 * Comprehensive performance monitoring for lazy loading effectiveness
 * Tracks Core Web Vitals, loading metrics, and optimization opportunities
 */

class MLGLazyLoadingPerformanceMonitor {
  constructor() {
    this.metrics = {
      // Core Web Vitals
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      
      // Lazy loading specific metrics
      totalImagesLoaded: 0,
      lazyImagesLoaded: 0,
      eagerImagesLoaded: 0,
      imagesInViewport: 0,
      imageLoadTimes: [],
      avgImageLoadTime: 0,
      
      // Component loading metrics
      componentsLoaded: 0,
      componentLoadTimes: [],
      avgComponentLoadTime: 0,
      suspenseActivations: 0,
      
      // Asset loading metrics
      assetsLoaded: 0,
      assetLoadTimes: [],
      totalBytesLoaded: 0,
      cacheMisses: 0,
      cacheHits: 0,
      
      // User experience metrics
      scrollDepth: 0,
      maxScrollDepth: 0,
      timeToFirstLazyLoad: null,
      lazyLoadingEfficiency: 0,
      
      // Performance budget tracking
      budgetViolations: [],
      loadingStrategyChanges: 0,
      
      // Network and device context
      networkQuality: 'unknown',
      deviceCapabilities: 'unknown',
      batterySaver: false
    }

    this.observers = new Map()
    this.measurementCallbacks = new Set()
    this.performanceEntries = []
    this.isMonitoring = false
    
    // Performance thresholds
    this.thresholds = {
      lcp: 2500, // Good LCP
      fid: 100,  // Good FID
      cls: 0.1,  // Good CLS
      imageLoadTime: 1500, // Max acceptable image load time
      componentLoadTime: 2000, // Max acceptable component load time
      assetLoadTime: 3000 // Max acceptable asset load time
    }

    this.initialize()
  }

  async initialize() {
    this.setupPerformanceObservers()
    this.setupUserInteractionTracking()
    this.setupNetworkQualityMonitoring()
    this.setupBatteryMonitoring()
    this.startMonitoring()
    
    console.log('📊 MLG Lazy Loading Performance Monitor initialized')
  }

  setupPerformanceObservers() {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported')
      return
    }

    // Core Web Vitals Observer
    try {
      const webVitalsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        
        entries.forEach(entry => {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              this.metrics.lcp = entry.startTime
              this.checkLCPOptimization(entry)
              break
            case 'first-input':
              this.metrics.fid = entry.processingStart - entry.startTime
              break
            case 'layout-shift':
              if (!entry.hadRecentInput) {
                this.metrics.cls = (this.metrics.cls || 0) + entry.value
              }
              break
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                this.metrics.fcp = entry.startTime
              }
              break
          }
          
          this.performanceEntries.push(entry)
          this.notifyMeasurementCallbacks('web-vital', entry)
        })
      })

      webVitalsObserver.observe({ 
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint'] 
      })
      
      this.observers.set('webVitals', webVitalsObserver)

    } catch (error) {
      console.warn('Failed to set up Web Vitals observer:', error)
    }

    // Resource timing observer for images and assets
    try {
      const resourceObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        
        entries.forEach(entry => {
          if (entry.initiatorType === 'img') {
            this.trackImageLoad(entry)
          } else if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
            this.trackAssetLoad(entry)
          }
        })
      })

      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.set('resource', resourceObserver)

    } catch (error) {
      console.warn('Failed to set up resource observer:', error)
    }

    // Navigation timing observer
    try {
      const navigationObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach(entry => {
          this.metrics.ttfb = entry.responseStart - entry.requestStart
          this.trackNavigationMetrics(entry)
        })
      })

      navigationObserver.observe({ entryTypes: ['navigation'] })
      this.observers.set('navigation', navigationObserver)

    } catch (error) {
      console.warn('Failed to set up navigation observer:', error)
    }

    // Long task observer for identifying blocking operations
    try {
      const longTaskObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach(entry => {
          this.trackLongTask(entry)
        })
      })

      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.set('longTask', longTaskObserver)

    } catch (error) {
      console.warn('Failed to set up long task observer:', error)
    }
  }

  setupUserInteractionTracking() {
    // Track scroll depth for lazy loading effectiveness
    let ticking = false
    
    const updateScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / docHeight) * 100)
      
      this.metrics.scrollDepth = scrollPercent
      this.metrics.maxScrollDepth = Math.max(this.metrics.maxScrollDepth, scrollPercent)
      
      ticking = false
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDepth)
        ticking = true
      }
    }, { passive: true })

    // Track first lazy load timing
    document.addEventListener('mlg-lazy-load-start', (event) => {
      if (this.metrics.timeToFirstLazyLoad === null) {
        this.metrics.timeToFirstLazyLoad = performance.now()
      }
    })
  }

  setupNetworkQualityMonitoring() {
    if ('connection' in navigator) {
      const updateNetworkQuality = () => {
        const connection = navigator.connection
        this.metrics.networkQuality = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        }
      }

      updateNetworkQuality()
      navigator.connection.addEventListener('change', updateNetworkQuality)
    }
  }

  setupBatteryMonitoring() {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const updateBatteryStatus = () => {
          this.metrics.batterySaver = battery.level < 0.2 || !battery.charging
        }

        updateBatteryStatus()
        battery.addEventListener('levelchange', updateBatteryStatus)
        battery.addEventListener('chargingchange', updateBatteryStatus)
      }).catch(() => {
        // Battery API not available
      })
    }
  }

  // Measurement methods
  measureImageLoad(url, loadTime, wasLazy = false, size = 0) {
    this.metrics.totalImagesLoaded++
    
    if (wasLazy) {
      this.metrics.lazyImagesLoaded++
    } else {
      this.metrics.eagerImagesLoaded++
    }

    this.metrics.imageLoadTimes.push({
      url,
      loadTime,
      wasLazy,
      size,
      timestamp: Date.now()
    })

    this.updateAverageLoadTime('image')
    this.checkImageLoadingThreshold(loadTime, wasLazy)
    this.notifyMeasurementCallbacks('image-load', { url, loadTime, wasLazy, size })

    console.log(`📸 Image load tracked: ${loadTime.toFixed(2)}ms (${wasLazy ? 'lazy' : 'eager'})`)
  }

  measureComponentLoad(componentName, loadTime, chunkSize = 0) {
    this.metrics.componentsLoaded++
    
    this.metrics.componentLoadTimes.push({
      name: componentName,
      loadTime,
      chunkSize,
      timestamp: Date.now()
    })

    this.updateAverageLoadTime('component')
    this.checkComponentLoadingThreshold(loadTime, componentName)
    this.notifyMeasurementCallbacks('component-load', { componentName, loadTime, chunkSize })

    console.log(`⚛️ Component load tracked: ${componentName} in ${loadTime.toFixed(2)}ms`)
  }

  measureAssetLoad(assetType, url, loadTime, size = 0, fromCache = false) {
    this.metrics.assetsLoaded++
    this.metrics.totalBytesLoaded += size

    if (fromCache) {
      this.metrics.cacheHits++
    } else {
      this.metrics.cacheMisses++
    }

    this.metrics.assetLoadTimes.push({
      type: assetType,
      url,
      loadTime,
      size,
      fromCache,
      timestamp: Date.now()
    })

    this.checkAssetLoadingThreshold(loadTime, assetType)
    this.notifyMeasurementCallbacks('asset-load', { assetType, url, loadTime, size, fromCache })

    console.log(`🎮 Asset load tracked: ${assetType} in ${loadTime.toFixed(2)}ms (${fromCache ? 'cached' : 'network'})`)
  }

  measureSuspenseActivation(componentName, duration) {
    this.metrics.suspenseActivations++
    this.notifyMeasurementCallbacks('suspense-activation', { componentName, duration })
  }

  // Performance analysis methods
  trackImageLoad(entry) {
    const wasLazy = this.isLazyImage(entry.name)
    const loadTime = entry.responseEnd - entry.requestStart
    const size = entry.transferSize || entry.encodedBodySize || 0

    this.measureImageLoad(entry.name, loadTime, wasLazy, size)
  }

  trackAssetLoad(entry) {
    const assetType = this.getAssetType(entry.name)
    const loadTime = entry.responseEnd - entry.requestStart
    const size = entry.transferSize || entry.encodedBodySize || 0
    const fromCache = entry.transferSize === 0 && entry.decodedBodySize > 0

    this.measureAssetLoad(assetType, entry.name, loadTime, size, fromCache)
  }

  trackNavigationMetrics(entry) {
    // Calculate additional navigation metrics
    const metrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
      loadComplete: entry.loadEventEnd - entry.navigationStart,
      firstByte: entry.responseStart - entry.requestStart,
      domProcessing: entry.domComplete - entry.domLoading,
      resourceLoadTime: entry.loadEventEnd - entry.domContentLoadedEventEnd
    }

    this.notifyMeasurementCallbacks('navigation', metrics)
  }

  trackLongTask(entry) {
    const blockingTime = entry.duration
    
    if (blockingTime > 50) { // Tasks > 50ms are concerning
      this.notifyMeasurementCallbacks('long-task', {
        duration: blockingTime,
        startTime: entry.startTime,
        name: entry.name
      })

      console.warn(`⚠️ Long task detected: ${blockingTime.toFixed(2)}ms`)
    }
  }

  checkLCPOptimization(entry) {
    // Check if LCP element is an image and if it was lazy loaded
    if (entry.element && entry.element.tagName === 'IMG') {
      const wasLazy = entry.element.hasAttribute('data-src') || 
                     entry.element.classList.contains('mlg-lazy')
      
      if (wasLazy && entry.startTime > this.thresholds.lcp) {
        this.addBudgetViolation('lcp-lazy-image', {
          lcp: entry.startTime,
          threshold: this.thresholds.lcp,
          element: entry.element.src || entry.element.dataset.src
        })

        console.warn('⚠️ LCP element is lazy loaded image, consider eager loading')
      }
    }
  }

  // Helper methods
  isLazyImage(url) {
    // Check if image was loaded through lazy loading system
    return this.performanceEntries.some(entry => 
      entry.name === url && entry.initiatorType === 'img'
    )
  }

  getAssetType(url) {
    const extension = url.split('.').pop().split('?')[0].toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(extension)) {
      return 'image'
    } else if (['mp4', 'webm', 'avi', 'mov'].includes(extension)) {
      return 'video'
    } else if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
      return 'audio'
    } else if (['js', 'mjs'].includes(extension)) {
      return 'script'
    } else if (extension === 'css') {
      return 'stylesheet'
    }
    
    return 'other'
  }

  updateAverageLoadTime(type) {
    if (type === 'image') {
      const times = this.metrics.imageLoadTimes.map(i => i.loadTime)
      this.metrics.avgImageLoadTime = times.reduce((a, b) => a + b, 0) / times.length
    } else if (type === 'component') {
      const times = this.metrics.componentLoadTimes.map(c => c.loadTime)
      this.metrics.avgComponentLoadTime = times.reduce((a, b) => a + b, 0) / times.length
    }
  }

  checkImageLoadingThreshold(loadTime, wasLazy) {
    if (loadTime > this.thresholds.imageLoadTime) {
      this.addBudgetViolation('image-load-time', {
        loadTime,
        threshold: this.thresholds.imageLoadTime,
        wasLazy
      })
    }
  }

  checkComponentLoadingThreshold(loadTime, componentName) {
    if (loadTime > this.thresholds.componentLoadTime) {
      this.addBudgetViolation('component-load-time', {
        loadTime,
        threshold: this.thresholds.componentLoadTime,
        component: componentName
      })
    }
  }

  checkAssetLoadingThreshold(loadTime, assetType) {
    if (loadTime > this.thresholds.assetLoadTime) {
      this.addBudgetViolation('asset-load-time', {
        loadTime,
        threshold: this.thresholds.assetLoadTime,
        assetType
      })
    }
  }

  addBudgetViolation(type, details) {
    this.metrics.budgetViolations.push({
      type,
      details,
      timestamp: Date.now()
    })

    console.warn(`💰 Performance budget violation: ${type}`, details)
  }

  // Analysis and reporting methods
  calculateLazyLoadingEfficiency() {
    if (this.metrics.totalImagesLoaded === 0) return 0

    const lazyRatio = this.metrics.lazyImagesLoaded / this.metrics.totalImagesLoaded
    const scrollEfficiency = this.metrics.maxScrollDepth / 100 // How much of page was actually viewed
    
    this.metrics.lazyLoadingEfficiency = (lazyRatio * scrollEfficiency * 100).toFixed(2)
    return this.metrics.lazyLoadingEfficiency
  }

  getCoreWebVitalsScore() {
    const scores = {}

    // LCP Score (0-100)
    if (this.metrics.lcp !== null) {
      if (this.metrics.lcp <= 2500) scores.lcp = 100
      else if (this.metrics.lcp <= 4000) scores.lcp = Math.max(0, 100 - ((this.metrics.lcp - 2500) / 15))
      else scores.lcp = 0
    }

    // FID Score (0-100)
    if (this.metrics.fid !== null) {
      if (this.metrics.fid <= 100) scores.fid = 100
      else if (this.metrics.fid <= 300) scores.fid = Math.max(0, 100 - ((this.metrics.fid - 100) / 2))
      else scores.fid = 0
    }

    // CLS Score (0-100)
    if (this.metrics.cls !== null) {
      if (this.metrics.cls <= 0.1) scores.cls = 100
      else if (this.metrics.cls <= 0.25) scores.cls = Math.max(0, 100 - ((this.metrics.cls - 0.1) * 667))
      else scores.cls = 0
    }

    return scores
  }

  getPerformanceReport() {
    this.calculateLazyLoadingEfficiency()
    
    return {
      timestamp: Date.now(),
      
      // Core Web Vitals
      coreWebVitals: {
        lcp: this.metrics.lcp,
        fid: this.metrics.fid,
        cls: this.metrics.cls,
        fcp: this.metrics.fcp,
        ttfb: this.metrics.ttfb,
        scores: this.getCoreWebVitalsScore()
      },

      // Lazy loading metrics
      lazyLoading: {
        totalImagesLoaded: this.metrics.totalImagesLoaded,
        lazyImagesLoaded: this.metrics.lazyImagesLoaded,
        eagerImagesLoaded: this.metrics.eagerImagesLoaded,
        avgImageLoadTime: this.metrics.avgImageLoadTime,
        efficiency: this.metrics.lazyLoadingEfficiency,
        timeToFirstLazyLoad: this.metrics.timeToFirstLazyLoad
      },

      // Component loading
      componentLoading: {
        componentsLoaded: this.metrics.componentsLoaded,
        avgComponentLoadTime: this.metrics.avgComponentLoadTime,
        suspenseActivations: this.metrics.suspenseActivations
      },

      // Asset loading
      assetLoading: {
        assetsLoaded: this.metrics.assetsLoaded,
        totalBytesLoaded: this.metrics.totalBytesLoaded,
        cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100,
        avgAssetLoadTime: this.metrics.assetLoadTimes.length > 0 
          ? this.metrics.assetLoadTimes.reduce((sum, asset) => sum + asset.loadTime, 0) / this.metrics.assetLoadTimes.length 
          : 0
      },

      // User experience
      userExperience: {
        maxScrollDepth: this.metrics.maxScrollDepth,
        imagesInViewport: this.metrics.imagesInViewport
      },

      // Performance budget
      performanceBudget: {
        violations: this.metrics.budgetViolations.length,
        details: this.metrics.budgetViolations
      },

      // Context
      context: {
        networkQuality: this.metrics.networkQuality,
        deviceCapabilities: this.metrics.deviceCapabilities,
        batterySaver: this.metrics.batterySaver
      }
    }
  }

  exportPerformanceData(format = 'json') {
    const report = this.getPerformanceReport()
    
    if (format === 'csv') {
      return this.convertToCSV(report)
    } else if (format === 'xml') {
      return this.convertToXML(report)
    }
    
    return JSON.stringify(report, null, 2)
  }

  // Callback management
  addMeasurementCallback(callback) {
    this.measurementCallbacks.add(callback)
  }

  removeMeasurementCallback(callback) {
    this.measurementCallbacks.delete(callback)
  }

  notifyMeasurementCallbacks(type, data) {
    this.measurementCallbacks.forEach(callback => {
      try {
        callback(type, data, this.metrics)
      } catch (error) {
        console.warn('Measurement callback error:', error)
      }
    })
  }

  // Lifecycle methods
  startMonitoring() {
    this.isMonitoring = true
    console.log('📊 Performance monitoring started')
  }

  pauseMonitoring() {
    this.isMonitoring = false
    console.log('⏸️ Performance monitoring paused')
  }

  resumeMonitoring() {
    this.isMonitoring = true
    console.log('▶️ Performance monitoring resumed')
  }

  resetMetrics() {
    // Reset all metrics except observers
    for (const key in this.metrics) {
      if (Array.isArray(this.metrics[key])) {
        this.metrics[key] = []
      } else if (typeof this.metrics[key] === 'number') {
        this.metrics[key] = 0
      } else {
        this.metrics[key] = null
      }
    }
    
    this.performanceEntries = []
    console.log('🔄 Performance metrics reset')
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    this.measurementCallbacks.clear()
    this.isMonitoring = false
    
    console.log('🗑️ MLG Performance Monitor destroyed')
  }
}

// Export the class
export { MLGLazyLoadingPerformanceMonitor }

// Global instance
const mlgPerformanceMonitor = new MLGLazyLoadingPerformanceMonitor()
window.MLGPerformanceMonitor = mlgPerformanceMonitor

// Convenience methods for external usage
window.measureImageLoad = (url, loadTime, wasLazy, size) => 
  mlgPerformanceMonitor.measureImageLoad(url, loadTime, wasLazy, size)

window.measureComponentLoad = (name, loadTime, chunkSize) => 
  mlgPerformanceMonitor.measureComponentLoad(name, loadTime, chunkSize)

window.measureAssetLoad = (type, url, loadTime, size, fromCache) => 
  mlgPerformanceMonitor.measureAssetLoad(type, url, loadTime, size, fromCache)

window.getPerformanceReport = () => 
  mlgPerformanceMonitor.getPerformanceReport()

console.log('📊 MLG Lazy Loading Performance Monitor module loaded')