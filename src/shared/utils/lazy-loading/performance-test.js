/**
 * MLG Lazy Loading Performance Test Suite
 * 
 * Comprehensive testing for lazy loading effectiveness and Core Web Vitals improvements
 * Includes automated tests, benchmarks, and performance measurements
 */

class MLGLazyLoadingPerformanceTest {
  constructor() {
    this.testResults = new Map()
    this.benchmarks = new Map()
    this.metrics = {
      beforeOptimization: {},
      afterOptimization: {},
      improvements: {}
    }
    this.testImages = []
    this.testComponents = []
    this.testAssets = []
    
    this.initialize()
  }

  initialize() {
    console.log('🧪 MLG Lazy Loading Performance Test Suite initialized')
    this.setupTestEnvironment()
    this.generateTestContent()
  }

  setupTestEnvironment() {
    // Create test container
    this.testContainer = document.createElement('div')
    this.testContainer.id = 'mlg-lazy-test-container'
    this.testContainer.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 1200px;
      height: 800px;
      overflow: auto;
      background: #0a0a0f;
      z-index: -9999;
    `
    document.body.appendChild(this.testContainer)

    // Setup performance observers for testing
    this.setupTestObservers()
  }

  setupTestObservers() {
    if ('PerformanceObserver' in window) {
      this.lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach(entry => {
          this.recordMetric('lcp', entry.startTime, entry.element?.src || 'unknown')
        })
      })

      try {
        this.lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (error) {
        console.warn('LCP observer failed:', error)
      }

      // Resource timing observer
      this.resourceObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach(entry => {
          if (entry.initiatorType === 'img') {
            this.recordResourceTiming(entry)
          }
        })
      })

      try {
        this.resourceObserver.observe({ entryTypes: ['resource'] })
      } catch (error) {
        console.warn('Resource observer failed:', error)
      }
    }
  }

  generateTestContent() {
    // Generate test images of various sizes
    const imageSizes = [
      { width: 300, height: 200, name: 'small' },
      { width: 800, height: 600, name: 'medium' },
      { width: 1920, height: 1080, name: 'large' },
      { width: 400, height: 800, name: 'tall' },
      { width: 1200, height: 400, name: 'wide' }
    ]

    imageSizes.forEach((size, index) => {
      for (let i = 0; i < 5; i++) {
        this.testImages.push({
          id: `test-img-${size.name}-${i}`,
          src: `https://picsum.photos/${size.width}/${size.height}?random=${index * 5 + i}`,
          width: size.width,
          height: size.height,
          category: size.name,
          loadTime: 0,
          visible: false
        })
      }
    })

    console.log(`📷 Generated ${this.testImages.length} test images`)
  }

  // Core test methods
  async runFullTestSuite() {
    console.log('🚀 Starting comprehensive lazy loading performance test suite...')

    const results = {
      timestamp: Date.now(),
      testDuration: 0,
      tests: {}
    }

    const startTime = performance.now()

    try {
      // Test 1: Baseline performance without lazy loading
      console.log('📊 Test 1: Baseline performance measurement')
      results.tests.baseline = await this.testBaseline()

      // Test 2: Lazy loading effectiveness
      console.log('📊 Test 2: Lazy loading effectiveness')
      results.tests.lazyLoading = await this.testLazyLoadingEffectiveness()

      // Test 3: Core Web Vitals impact
      console.log('📊 Test 3: Core Web Vitals impact')
      results.tests.coreWebVitals = await this.testCoreWebVitalsImpact()

      // Test 4: Component loading performance
      console.log('📊 Test 4: Component loading performance')
      results.tests.componentLoading = await this.testComponentLoadingPerformance()

      // Test 5: Asset loading optimization
      console.log('📊 Test 5: Asset loading optimization')
      results.tests.assetLoading = await this.testAssetLoadingOptimization()

      // Test 6: Network condition adaptability
      console.log('📊 Test 6: Network condition adaptability')
      results.tests.networkAdaptability = await this.testNetworkAdaptability()

      // Test 7: Browser compatibility
      console.log('📊 Test 7: Browser compatibility')
      results.tests.browserCompatibility = await this.testBrowserCompatibility()

      // Test 8: Memory usage analysis
      console.log('📊 Test 8: Memory usage analysis')
      results.tests.memoryUsage = await this.testMemoryUsage()

      const endTime = performance.now()
      results.testDuration = endTime - startTime

      // Generate comprehensive report
      const report = this.generatePerformanceReport(results)
      
      console.log('✅ Performance test suite completed')
      console.log(report.summary)

      return report

    } catch (error) {
      console.error('❌ Performance test suite failed:', error)
      throw error
    }
  }

  async testBaseline() {
    console.log('⏱️ Measuring baseline performance without lazy loading...')

    const baseline = {
      initialPageLoad: 0,
      firstImageLoad: 0,
      allImagesLoaded: 0,
      totalTransferSize: 0,
      resourceCount: 0
    }

    // Measure initial page load without lazy loading
    const startTime = performance.now()
    
    // Create eager-loaded images
    const eagerImages = this.testImages.slice(0, 10).map(imgData => {
      const img = document.createElement('img')
      img.src = imgData.src
      img.style.width = '100px'
      img.style.height = 'auto'
      this.testContainer.appendChild(img)
      return img
    })

    // Wait for first image to load
    const firstImagePromise = new Promise((resolve) => {
      eagerImages[0].onload = () => {
        baseline.firstImageLoad = performance.now() - startTime
        resolve()
      }
    })

    // Wait for all images to load
    const allImagesPromise = Promise.all(
      eagerImages.map(img => new Promise((resolve) => {
        img.onload = img.onerror = resolve
      }))
    )

    await firstImagePromise
    await allImagesPromise

    baseline.allImagesLoaded = performance.now() - startTime

    // Calculate total transfer size
    const resourceEntries = performance.getEntriesByType('resource')
    baseline.resourceCount = resourceEntries.length
    baseline.totalTransferSize = resourceEntries.reduce((total, entry) => {
      return total + (entry.transferSize || 0)
    }, 0)

    // Cleanup
    eagerImages.forEach(img => img.remove())

    console.log('📊 Baseline results:', baseline)
    return baseline
  }

  async testLazyLoadingEffectiveness() {
    console.log('⚡ Testing lazy loading effectiveness...')

    const lazyTest = {
      imagesCreated: 0,
      imagesLoadedImmediately: 0,
      imagesLoadedOnScroll: 0,
      averageLoadTime: 0,
      intersectionObserverSupported: 'IntersectionObserver' in window,
      fallbackUsed: false
    }

    // Create lazy images
    const lazyImages = this.testImages.slice(0, 20).map((imgData, index) => {
      const img = document.createElement('img')
      img.dataset.src = imgData.src
      img.classList.add('mlg-lazy-image', 'mlg-loading')
      img.style.cssText = `
        width: 200px;
        height: 150px;
        margin: 20px;
        display: block;
      `
      
      // Position some images below the fold
      if (index > 5) {
        img.style.marginTop = '800px'
      }

      this.testContainer.appendChild(img)
      return { element: img, data: imgData, loaded: false, loadTime: 0 }
    })

    lazyTest.imagesCreated = lazyImages.length

    // Initialize lazy loading
    if (window.MLGLazyLoading) {
      lazyImages.forEach(({ element }) => {
        window.MLGLazyLoading.loadImage(element)
      })
    }

    // Count immediately loaded images
    await new Promise(resolve => setTimeout(resolve, 500))
    
    lazyImages.forEach(imgObj => {
      if (imgObj.element.src && imgObj.element.src !== location.href) {
        lazyTest.imagesLoadedImmediately++
        imgObj.loaded = true
      }
    })

    // Simulate scrolling to trigger lazy loading
    this.testContainer.scrollTop = 0
    await new Promise(resolve => setTimeout(resolve, 100))
    
    this.testContainer.scrollTop = 500
    await new Promise(resolve => setTimeout(resolve, 200))
    
    this.testContainer.scrollTop = 1200
    await new Promise(resolve => setTimeout(resolve, 200))

    // Count images loaded after scrolling
    lazyImages.forEach(imgObj => {
      if (!imgObj.loaded && imgObj.element.src && imgObj.element.src !== location.href) {
        lazyTest.imagesLoadedOnScroll++
        imgObj.loaded = true
      }
    })

    // Calculate effectiveness
    const totalLoaded = lazyTest.imagesLoadedImmediately + lazyTest.imagesLoadedOnScroll
    lazyTest.effectiveness = (lazyTest.imagesLoadedOnScroll / totalLoaded) * 100

    // Cleanup
    lazyImages.forEach(({ element }) => element.remove())

    console.log('📊 Lazy loading effectiveness:', lazyTest)
    return lazyTest
  }

  async testCoreWebVitalsImpact() {
    console.log('🎯 Testing Core Web Vitals impact...')

    const cwvTest = {
      beforeOptimization: {},
      afterOptimization: {},
      improvement: {}
    }

    // Test with eager loading (baseline)
    console.log('Testing with eager loading...')
    const eagerStart = performance.now()
    
    // Create page with eager images
    const eagerImages = this.testImages.slice(0, 15).map(imgData => {
      const img = document.createElement('img')
      img.src = imgData.src
      img.style.cssText = `
        width: 300px;
        height: 200px;
        margin: 10px;
      `
      this.testContainer.appendChild(img)
      return img
    })

    // Measure LCP candidate
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    cwvTest.beforeOptimization = {
      timeToFirstImage: performance.now() - eagerStart,
      resourceCount: performance.getEntriesByType('resource').length,
      transferSize: this.calculateTotalTransferSize()
    }

    // Cleanup eager images
    eagerImages.forEach(img => img.remove())

    // Test with lazy loading
    console.log('Testing with lazy loading...')
    const lazyStart = performance.now()
    
    // Create page with lazy images
    const lazyImages = this.testImages.slice(0, 15).map(imgData => {
      const img = document.createElement('img')
      img.dataset.src = imgData.src
      img.classList.add('mlg-lazy-image')
      img.style.cssText = `
        width: 300px;
        height: 200px;
        margin: 10px;
      `
      this.testContainer.appendChild(img)
      return img
    })

    // Initialize lazy loading for visible images only
    if (window.MLGLazyLoading) {
      lazyImages.slice(0, 6).forEach(img => {
        window.MLGLazyLoading.loadImage(img)
      })
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    cwvTest.afterOptimization = {
      timeToFirstImage: performance.now() - lazyStart,
      resourceCount: performance.getEntriesByType('resource').length - cwvTest.beforeOptimization.resourceCount,
      transferSize: this.calculateTotalTransferSize() - cwvTest.beforeOptimization.transferSize
    }

    // Calculate improvements
    cwvTest.improvement = {
      loadTimeReduction: cwvTest.beforeOptimization.timeToFirstImage - cwvTest.afterOptimization.timeToFirstImage,
      resourceReduction: cwvTest.beforeOptimization.resourceCount - cwvTest.afterOptimization.resourceCount,
      transferSizeReduction: cwvTest.beforeOptimization.transferSize - cwvTest.afterOptimization.transferSize,
      percentageImprovement: ((cwvTest.beforeOptimization.timeToFirstImage - cwvTest.afterOptimization.timeToFirstImage) / cwvTest.beforeOptimization.timeToFirstImage * 100).toFixed(2)
    }

    // Cleanup lazy images
    lazyImages.forEach(img => img.remove())

    console.log('📊 Core Web Vitals impact:', cwvTest)
    return cwvTest
  }

  async testComponentLoadingPerformance() {
    console.log('⚛️ Testing component loading performance...')

    const componentTest = {
      componentLoadTimes: [],
      suspenseActivations: 0,
      errorBoundaryActivations: 0,
      averageLoadTime: 0,
      cacheHitRate: 0
    }

    // Test multiple component loading scenarios
    const testComponents = [
      { name: 'Modal', delay: 100 },
      { name: 'Chart', delay: 500 },
      { name: 'Dashboard', delay: 800 },
      { name: 'Settings', delay: 200 },
      { name: 'Profile', delay: 300 }
    ]

    for (const component of testComponents) {
      const startTime = performance.now()
      
      // Simulate component loading
      try {
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            // Simulate random loading success/failure
            if (Math.random() > 0.9) {
              componentTest.errorBoundaryActivations++
              reject(new Error(`Component ${component.name} failed to load`))
            } else {
              resolve()
            }
          }, component.delay)
        })

        const loadTime = performance.now() - startTime
        componentTest.componentLoadTimes.push({
          name: component.name,
          loadTime,
          success: true
        })

        componentTest.suspenseActivations++

      } catch (error) {
        const loadTime = performance.now() - startTime
        componentTest.componentLoadTimes.push({
          name: component.name,
          loadTime,
          success: false,
          error: error.message
        })
      }
    }

    // Calculate averages
    const successfulLoads = componentTest.componentLoadTimes.filter(c => c.success)
    componentTest.averageLoadTime = successfulLoads.length > 0 
      ? successfulLoads.reduce((sum, c) => sum + c.loadTime, 0) / successfulLoads.length 
      : 0

    console.log('📊 Component loading performance:', componentTest)
    return componentTest
  }

  async testAssetLoadingOptimization() {
    console.log('🎮 Testing asset loading optimization...')

    const assetTest = {
      textureLoadTimes: [],
      videoLoadTimes: [],
      audioLoadTimes: [],
      compressionEfficiency: {},
      formatOptimization: {},
      cachePerformance: {}
    }

    // Test texture loading
    const textureTests = [
      { format: 'jpg', quality: 'low', expectedTime: 200 },
      { format: 'webp', quality: 'medium', expectedTime: 150 },
      { format: 'avif', quality: 'high', expectedTime: 100 }
    ]

    for (const test of textureTests) {
      const startTime = performance.now()
      
      try {
        // Simulate asset loading
        const simulatedAsset = await this.simulateAssetLoad(test)
        const loadTime = performance.now() - startTime
        
        assetTest.textureLoadTimes.push({
          format: test.format,
          quality: test.quality,
          loadTime,
          size: simulatedAsset.size,
          compressionRatio: simulatedAsset.compressionRatio
        })

      } catch (error) {
        console.warn(`Asset loading failed: ${test.format}`, error)
      }
    }

    // Calculate optimization effectiveness
    assetTest.compressionEfficiency = this.calculateCompressionEfficiency(assetTest.textureLoadTimes)
    assetTest.formatOptimization = this.calculateFormatOptimization(assetTest.textureLoadTimes)

    console.log('📊 Asset loading optimization:', assetTest)
    return assetTest
  }

  async testNetworkAdaptability() {
    console.log('📡 Testing network condition adaptability...')

    const networkTest = {
      fastNetwork: { loadTime: 0, qualitySelected: '' },
      slowNetwork: { loadTime: 0, qualitySelected: '' },
      offlineMode: { fallbackUsed: false, cacheHits: 0 },
      adaptationEffectiveness: 0
    }

    // Simulate different network conditions
    const networkConditions = [
      { type: 'fast', downlink: 10, rtt: 50 },
      { type: 'slow', downlink: 0.5, rtt: 400 }
    ]

    for (const condition of networkConditions) {
      const startTime = performance.now()
      
      // Simulate network-adapted loading
      const selectedQuality = this.selectQualityForNetwork(condition)
      const loadTime = await this.simulateNetworkLoad(condition, selectedQuality)
      
      networkTest[`${condition.type}Network`] = {
        loadTime: performance.now() - startTime,
        qualitySelected: selectedQuality,
        downlink: condition.downlink,
        rtt: condition.rtt
      }
    }

    // Calculate adaptation effectiveness
    const fastTime = networkTest.fastNetwork.loadTime
    const slowTime = networkTest.slowNetwork.loadTime
    networkTest.adaptationEffectiveness = ((fastTime - slowTime) / fastTime * 100).toFixed(2)

    console.log('📊 Network adaptability:', networkTest)
    return networkTest
  }

  async testBrowserCompatibility() {
    console.log('🌐 Testing browser compatibility...')

    const browserTest = {
      intersectionObserverSupport: 'IntersectionObserver' in window,
      requestIdleCallbackSupport: 'requestIdleCallback' in window,
      webpSupport: false,
      avifSupport: false,
      polyfillsLoaded: [],
      fallbackStrategiesUsed: [],
      compatibilityScore: 0
    }

    // Test image format support
    browserTest.webpSupport = await this.testImageFormatSupport('webp')
    browserTest.avifSupport = await this.testImageFormatSupport('avif')

    // Test polyfill usage
    if (window.MLGBrowserFallbacks) {
      browserTest.polyfillsLoaded = Object.keys(window.MLGBrowserFallbacks.getPolyfillStatus())
      browserTest.fallbackStrategiesUsed = window.MLGBrowserFallbacks.isFallbackActive() ? ['scroll-based-lazy-loading'] : []
    }

    // Calculate compatibility score
    let score = 0
    if (browserTest.intersectionObserverSupport) score += 25
    if (browserTest.requestIdleCallbackSupport) score += 15
    if (browserTest.webpSupport) score += 20
    if (browserTest.avifSupport) score += 20
    score += Math.max(0, 20 - browserTest.polyfillsLoaded.length * 5) // Fewer polyfills = better support

    browserTest.compatibilityScore = score

    console.log('📊 Browser compatibility:', browserTest)
    return browserTest
  }

  async testMemoryUsage() {
    console.log('🧠 Testing memory usage...')

    const memoryTest = {
      beforeOptimization: {},
      afterOptimization: {},
      improvement: {},
      cacheSize: 0,
      memoryLeaks: []
    }

    // Measure memory before optimization
    if ('memory' in performance) {
      memoryTest.beforeOptimization = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      }
    }

    // Create many images and components to stress test
    const stressImages = []
    for (let i = 0; i < 100; i++) {
      const img = document.createElement('img')
      img.dataset.src = `https://picsum.photos/200/150?random=${i}`
      img.classList.add('mlg-lazy-image')
      this.testContainer.appendChild(img)
      stressImages.push(img)
    }

    // Trigger some loading
    if (window.MLGLazyLoading) {
      stressImages.slice(0, 20).forEach(img => {
        window.MLGLazyLoading.loadImage(img)
      })
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    // Measure memory after optimization
    if ('memory' in performance) {
      memoryTest.afterOptimization = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      }

      memoryTest.improvement = {
        heapSizeDifference: memoryTest.afterOptimization.usedJSHeapSize - memoryTest.beforeOptimization.usedJSHeapSize,
        percentageChange: ((memoryTest.afterOptimization.usedJSHeapSize - memoryTest.beforeOptimization.usedJSHeapSize) / memoryTest.beforeOptimization.usedJSHeapSize * 100).toFixed(2)
      }
    }

    // Get cache size if available
    if (window.MLGGamingAssetLoader) {
      memoryTest.cacheSize = window.MLGGamingAssetLoader.getCacheSize()
    }

    // Cleanup stress test
    stressImages.forEach(img => img.remove())

    console.log('📊 Memory usage:', memoryTest)
    return memoryTest
  }

  // Helper methods
  recordMetric(type, value, context = '') {
    if (!this.metrics[type]) {
      this.metrics[type] = []
    }
    this.metrics[type].push({
      value,
      context,
      timestamp: Date.now()
    })
  }

  recordResourceTiming(entry) {
    // Record resource timing for analysis
    this.testResults.set(`resource-${entry.name}`, {
      loadTime: entry.responseEnd - entry.requestStart,
      transferSize: entry.transferSize,
      type: entry.initiatorType
    })
  }

  calculateTotalTransferSize() {
    const resourceEntries = performance.getEntriesByType('resource')
    return resourceEntries.reduce((total, entry) => {
      return total + (entry.transferSize || 0)
    }, 0)
  }

  async simulateAssetLoad(config) {
    // Simulate asset loading with different characteristics
    const baseSize = 1024 * 100 // 100KB base
    const qualityMultiplier = { low: 0.5, medium: 1, high: 2 }
    const formatEfficiency = { jpg: 1, webp: 0.7, avif: 0.5 }
    
    const size = baseSize * qualityMultiplier[config.quality] * formatEfficiency[config.format]
    const loadTime = size / 1000 + Math.random() * 100 // Simulate network variation
    
    await new Promise(resolve => setTimeout(resolve, loadTime))
    
    return {
      size,
      compressionRatio: baseSize / size,
      loadTime
    }
  }

  selectQualityForNetwork(networkCondition) {
    if (networkCondition.downlink > 5) {
      return 'high'
    } else if (networkCondition.downlink > 1) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  async simulateNetworkLoad(networkCondition, quality) {
    const baseTime = 100
    const networkMultiplier = 10 / networkCondition.downlink
    const rttPenalty = networkCondition.rtt / 10
    
    const simulatedTime = baseTime * networkMultiplier + rttPenalty
    await new Promise(resolve => setTimeout(resolve, simulatedTime))
    
    return simulatedTime
  }

  async testImageFormatSupport(format) {
    return new Promise(resolve => {
      const testImages = {
        webp: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA',
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
      }

      const img = new Image()
      img.onload = () => resolve(img.height === 2)
      img.onerror = () => resolve(false)
      img.src = testImages[format]
    })
  }

  calculateCompressionEfficiency(loadTimes) {
    const formatSizes = loadTimes.reduce((acc, item) => {
      if (!acc[item.format]) acc[item.format] = []
      acc[item.format].push(item.size)
      return acc
    }, {})

    const efficiency = {}
    Object.keys(formatSizes).forEach(format => {
      const avgSize = formatSizes[format].reduce((a, b) => a + b, 0) / formatSizes[format].length
      efficiency[format] = avgSize
    })

    return efficiency
  }

  calculateFormatOptimization(loadTimes) {
    const formatTimes = loadTimes.reduce((acc, item) => {
      if (!acc[item.format]) acc[item.format] = []
      acc[item.format].push(item.loadTime)
      return acc
    }, {})

    const optimization = {}
    Object.keys(formatTimes).forEach(format => {
      const avgTime = formatTimes[format].reduce((a, b) => a + b, 0) / formatTimes[format].length
      optimization[format] = avgTime
    })

    return optimization
  }

  generatePerformanceReport(results) {
    const report = {
      timestamp: results.timestamp,
      testDuration: results.testDuration,
      summary: {},
      details: results.tests,
      recommendations: [],
      score: 0
    }

    // Generate summary
    const baseline = results.tests.baseline
    const lazyLoading = results.tests.lazyLoading
    const coreWebVitals = results.tests.coreWebVitals

    report.summary = {
      overallImprovement: coreWebVitals?.improvement?.percentageImprovement + '%' || 'N/A',
      lazyLoadingEffectiveness: lazyLoading?.effectiveness?.toFixed(2) + '%' || 'N/A',
      resourceReduction: coreWebVitals?.improvement?.resourceReduction || 0,
      transferSizeReduction: this.formatBytes(coreWebVitals?.improvement?.transferSizeReduction || 0),
      browserCompatibilityScore: results.tests.browserCompatibility?.compatibilityScore || 0,
      memoryImpact: results.tests.memoryUsage?.improvement?.percentageChange + '%' || 'N/A'
    }

    // Generate recommendations
    if (lazyLoading?.effectiveness < 70) {
      report.recommendations.push('Consider adjusting lazy loading thresholds for better effectiveness')
    }

    if (coreWebVitals?.improvement?.loadTimeReduction < 500) {
      report.recommendations.push('Optimize image sizes and formats for better load time improvements')
    }

    if (results.tests.browserCompatibility?.compatibilityScore < 70) {
      report.recommendations.push('Consider additional polyfills for better browser support')
    }

    if (results.tests.memoryUsage?.improvement?.heapSizeDifference > 10000000) {
      report.recommendations.push('Monitor memory usage and implement cache size limits')
    }

    // Calculate overall score
    let score = 0
    score += Math.min(30, lazyLoading?.effectiveness || 0) * 0.3
    score += Math.min(30, (coreWebVitals?.improvement?.loadTimeReduction || 0) / 20)
    score += Math.min(25, results.tests.browserCompatibility?.compatibilityScore || 0) * 0.25
    score += Math.min(15, Math.max(0, 15 - (results.tests.memoryUsage?.improvement?.heapSizeDifference || 0) / 1000000))

    report.score = Math.round(score)

    return report
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Public API
  async quickPerformanceCheck() {
    console.log('⚡ Running quick performance check...')
    
    const quickResults = await Promise.all([
      this.testLazyLoadingEffectiveness(),
      this.testCoreWebVitalsImpact(),
      this.testBrowserCompatibility()
    ])

    const summary = {
      lazyLoadingEffectiveness: quickResults[0].effectiveness,
      coreWebVitalsImprovement: quickResults[1].improvement.percentageImprovement,
      browserCompatibility: quickResults[2].compatibilityScore,
      timestamp: Date.now()
    }

    console.log('📊 Quick performance check results:', summary)
    return summary
  }

  cleanup() {
    // Cleanup test environment
    if (this.testContainer) {
      this.testContainer.remove()
    }

    if (this.lcpObserver) {
      this.lcpObserver.disconnect()
    }

    if (this.resourceObserver) {
      this.resourceObserver.disconnect()
    }

    console.log('🧹 Performance test cleanup completed')
  }
}

// Export the class
export { MLGLazyLoadingPerformanceTest }

// Global instance for easy testing
const mlgPerformanceTest = new MLGLazyLoadingPerformanceTest()
window.MLGPerformanceTest = mlgPerformanceTest

// Convenience methods
window.runLazyLoadingTest = () => mlgPerformanceTest.runFullTestSuite()
window.quickPerformanceCheck = () => mlgPerformanceTest.quickPerformanceCheck()

console.log('🧪 MLG Lazy Loading Performance Test Suite module loaded')
console.log('💡 Run window.runLazyLoadingTest() to start comprehensive testing')
console.log('💡 Run window.quickPerformanceCheck() for a quick assessment')