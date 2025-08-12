/**
 * MLG Progressive Loading Strategies
 * 
 * Different loading strategies optimized for various content types
 * Enhances Core Web Vitals and user experience
 */

class MLGProgressiveLoadingStrategies {
  constructor() {
    this.loadingStrategies = new Map()
    this.contentQueues = new Map()
    this.performanceObserver = null
    this.networkQuality = 'fast' // fast, slow, offline
    this.deviceCapabilities = 'high' // high, medium, low
    
    this.initialize()
  }

  initialize() {
    this.detectNetworkQuality()
    this.detectDeviceCapabilities()
    this.setupPerformanceObserver()
    this.registerDefaultStrategies()
    
    console.log('📈 MLG Progressive Loading Strategies initialized')
    console.log(`📊 Network: ${this.networkQuality}, Device: ${this.deviceCapabilities}`)
  }

  detectNetworkQuality() {
    if ('connection' in navigator) {
      const connection = navigator.connection
      const effectiveType = connection.effectiveType
      const downlink = connection.downlink

      if (effectiveType === '4g' && downlink > 2) {
        this.networkQuality = 'fast'
      } else if (effectiveType === '3g' || (effectiveType === '4g' && downlink <= 2)) {
        this.networkQuality = 'slow'
      } else {
        this.networkQuality = 'slow'
      }

      // Listen for network changes
      connection.addEventListener('change', () => {
        this.detectNetworkQuality()
        this.adjustLoadingStrategies()
      })
    }

    // Detect offline status
    window.addEventListener('online', () => {
      this.networkQuality = this.networkQuality === 'offline' ? 'fast' : this.networkQuality
      this.adjustLoadingStrategies()
    })

    window.addEventListener('offline', () => {
      this.networkQuality = 'offline'
      this.adjustLoadingStrategies()
    })
  }

  detectDeviceCapabilities() {
    const memory = navigator.deviceMemory || 4
    const cores = navigator.hardwareConcurrency || 4
    const pixelRatio = window.devicePixelRatio || 1

    // Simple scoring system
    let score = 0
    if (memory >= 8) score += 3
    else if (memory >= 4) score += 2
    else score += 1

    if (cores >= 8) score += 3
    else if (cores >= 4) score += 2
    else score += 1

    if (pixelRatio <= 1) score += 1
    else if (pixelRatio <= 2) score += 2
    else score += 3

    if (score >= 7) this.deviceCapabilities = 'high'
    else if (score >= 5) this.deviceCapabilities = 'medium'
    else this.deviceCapabilities = 'low'
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            // Adjust strategies based on load performance
            if (entry.loadEventEnd - entry.navigationStart > 3000) {
              this.networkQuality = 'slow'
              this.adjustLoadingStrategies()
            }
          }
        })
      })

      this.performanceObserver.observe({ entryTypes: ['navigation', 'resource'] })
    }
  }

  registerDefaultStrategies() {
    // Critical content - load immediately
    this.registerStrategy('critical', {
      priority: 'immediate',
      concurrency: 6,
      retryAttempts: 5,
      timeout: 30000,
      preload: true,
      conditions: {
        network: ['fast', 'slow'],
        device: ['high', 'medium', 'low']
      }
    })

    // Above-the-fold content
    this.registerStrategy('above-fold', {
      priority: 'high',
      concurrency: 4,
      retryAttempts: 3,
      timeout: 20000,
      preload: false,
      conditions: {
        network: ['fast', 'slow'],
        device: ['high', 'medium', 'low']
      }
    })

    // Visible content
    this.registerStrategy('visible', {
      priority: 'normal',
      concurrency: 3,
      retryAttempts: 2,
      timeout: 15000,
      preload: false,
      conditions: {
        network: ['fast'],
        device: ['high', 'medium']
      }
    })

    // Hover/interaction triggered content
    this.registerStrategy('hover', {
      priority: 'low',
      concurrency: 2,
      retryAttempts: 1,
      timeout: 10000,
      preload: false,
      delay: 300,
      conditions: {
        network: ['fast'],
        device: ['high']
      }
    })

    // Background/prefetch content
    this.registerStrategy('background', {
      priority: 'idle',
      concurrency: 1,
      retryAttempts: 1,
      timeout: 5000,
      preload: false,
      delay: 2000,
      conditions: {
        network: ['fast'],
        device: ['high', 'medium']
      }
    })

    // Gaming-specific strategies
    this.registerGamingStrategies()
  }

  registerGamingStrategies() {
    // Game assets (textures, models, sounds)
    this.registerStrategy('game-assets', {
      priority: 'high',
      concurrency: 2,
      retryAttempts: 4,
      timeout: 25000,
      preload: true,
      progressive: true,
      qualityLevels: ['low', 'medium', 'high'],
      conditions: {
        network: ['fast', 'slow'],
        device: ['high', 'medium', 'low']
      }
    })

    // Leaderboard data
    this.registerStrategy('leaderboard', {
      priority: 'normal',
      concurrency: 3,
      retryAttempts: 2,
      timeout: 10000,
      realtime: true,
      cacheStrategy: 'stale-while-revalidate',
      conditions: {
        network: ['fast', 'slow'],
        device: ['high', 'medium', 'low']
      }
    })

    // Clan information
    this.registerStrategy('clan-data', {
      priority: 'normal',
      concurrency: 2,
      retryAttempts: 3,
      timeout: 15000,
      pagination: true,
      batchSize: 10,
      conditions: {
        network: ['fast', 'slow'],
        device: ['high', 'medium', 'low']
      }
    })

    // Video content
    this.registerStrategy('video-content', {
      priority: 'low',
      concurrency: 1,
      retryAttempts: 1,
      timeout: 30000,
      adaptive: true,
      qualityLevels: ['240p', '480p', '720p', '1080p'],
      conditions: {
        network: ['fast'],
        device: ['high', 'medium']
      }
    })

    // Social feeds
    this.registerStrategy('social-feed', {
      priority: 'normal',
      concurrency: 2,
      retryAttempts: 2,
      timeout: 10000,
      infinite: true,
      batchSize: 20,
      virtualScrolling: true,
      conditions: {
        network: ['fast', 'slow'],
        device: ['high', 'medium']
      }
    })
  }

  registerStrategy(name, config) {
    this.loadingStrategies.set(name, {
      ...config,
      loadedItems: 0,
      failedItems: 0,
      totalLoadTime: 0,
      avgLoadTime: 0
    })

    // Initialize content queue for this strategy
    this.contentQueues.set(name, [])
  }

  // Content loading methods
  async loadContent(strategyName, content, options = {}) {
    const strategy = this.loadingStrategies.get(strategyName)
    if (!strategy) {
      console.warn(`Unknown loading strategy: ${strategyName}`)
      return this.loadContent('visible', content, options)
    }

    // Check if strategy is suitable for current conditions
    if (!this.isStrategySuitable(strategy)) {
      console.log(`Strategy ${strategyName} not suitable for current conditions, using fallback`)
      return this.loadContent('background', content, options)
    }

    const startTime = performance.now()

    try {
      let result
      
      switch (strategy.priority) {
        case 'immediate':
          result = await this.loadImmediate(content, strategy, options)
          break
        case 'high':
          result = await this.loadHigh(content, strategy, options)
          break
        case 'normal':
          result = await this.loadNormal(content, strategy, options)
          break
        case 'low':
          result = await this.loadLow(content, strategy, options)
          break
        case 'idle':
          result = await this.loadIdle(content, strategy, options)
          break
        default:
          result = await this.loadNormal(content, strategy, options)
      }

      // Update strategy metrics
      const loadTime = performance.now() - startTime
      strategy.loadedItems++
      strategy.totalLoadTime += loadTime
      strategy.avgLoadTime = strategy.totalLoadTime / strategy.loadedItems

      console.log(`✅ Content loaded using ${strategyName} strategy in ${loadTime.toFixed(2)}ms`)
      return result

    } catch (error) {
      strategy.failedItems++
      console.warn(`❌ Content failed to load using ${strategyName} strategy:`, error)
      throw error
    }
  }

  isStrategySuitable(strategy) {
    const { conditions } = strategy
    
    if (!conditions) return true
    
    const networkSuitable = !conditions.network || conditions.network.includes(this.networkQuality)
    const deviceSuitable = !conditions.device || conditions.device.includes(this.deviceCapabilities)
    
    return networkSuitable && deviceSuitable
  }

  async loadImmediate(content, strategy, options) {
    // Load immediately with high concurrency
    if (Array.isArray(content)) {
      return Promise.all(content.map(item => this.loadSingleItem(item, strategy, options)))
    }
    
    return this.loadSingleItem(content, strategy, options)
  }

  async loadHigh(content, strategy, options) {
    // High priority loading with controlled concurrency
    if (Array.isArray(content)) {
      return this.loadWithConcurrency(content, strategy.concurrency, strategy, options)
    }
    
    return this.loadSingleItem(content, strategy, options)
  }

  async loadNormal(content, strategy, options) {
    // Normal loading with intersection observer
    if (Array.isArray(content)) {
      return this.loadWithIntersectionObserver(content, strategy, options)
    }
    
    return this.loadWithIntersectionObserver([content], strategy, options)
  }

  async loadLow(content, strategy, options) {
    // Low priority loading with delays
    if (strategy.delay) {
      await new Promise(resolve => setTimeout(resolve, strategy.delay))
    }
    
    return this.loadNormal(content, strategy, options)
  }

  async loadIdle(content, strategy, options) {
    // Load during browser idle time
    return new Promise((resolve, reject) => {
      const loadWhenIdle = () => {
        this.loadNormal(content, strategy, options).then(resolve).catch(reject)
      }

      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadWhenIdle, { timeout: 5000 })
      } else {
        setTimeout(loadWhenIdle, strategy.delay || 1000)
      }
    })
  }

  async loadWithConcurrency(items, concurrency, strategy, options) {
    const results = []
    
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency)
      const batchResults = await Promise.allSettled(
        batch.map(item => this.loadSingleItem(item, strategy, options))
      )
      
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : null
      ))
      
      // Small delay between batches to prevent overwhelming
      if (i + concurrency < items.length) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    return results
  }

  async loadWithIntersectionObserver(items, strategy, options) {
    return new Promise((resolve) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const item = entry.target.dataset.content
            this.loadSingleItem(JSON.parse(item), strategy, options)
            observer.unobserve(entry.target)
          }
        })
      }, {
        rootMargin: '100px',
        threshold: 0.1
      })

      // Create placeholder elements if needed
      items.forEach(item => {
        const placeholder = document.createElement('div')
        placeholder.dataset.content = JSON.stringify(item)
        placeholder.style.height = '1px'
        document.body.appendChild(placeholder)
        observer.observe(placeholder)
      })
    })
  }

  async loadSingleItem(content, strategy, options) {
    const { retryAttempts = 1, timeout = 10000 } = strategy

    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        return await Promise.race([
          this.executeContentLoad(content, strategy, options),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
          )
        ])
      } catch (error) {
        if (attempt === retryAttempts - 1) {
          throw error
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        )
      }
    }
  }

  async executeContentLoad(content, strategy, options) {
    // Different loading logic based on content type
    if (content.type === 'image') {
      return this.loadImage(content, strategy, options)
    } else if (content.type === 'component') {
      return this.loadComponent(content, strategy, options)
    } else if (content.type === 'data') {
      return this.loadData(content, strategy, options)
    } else if (content.type === 'video') {
      return this.loadVideo(content, strategy, options)
    } else {
      return this.loadGeneric(content, strategy, options)
    }
  }

  async loadImage(content, strategy, options) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Image load failed'))
      
      // Progressive loading for images
      if (strategy.progressive && content.sources) {
        const quality = this.selectImageQuality(content.sources, strategy)
        img.src = quality.url
      } else {
        img.src = content.url || content.src
      }
    })
  }

  selectImageQuality(sources, strategy) {
    const qualityMap = {
      low: sources.find(s => s.quality === 'low') || sources[0],
      medium: sources.find(s => s.quality === 'medium') || sources[1] || sources[0],
      high: sources.find(s => s.quality === 'high') || sources[sources.length - 1]
    }

    // Select quality based on device and network
    if (this.deviceCapabilities === 'low' || this.networkQuality === 'slow') {
      return qualityMap.low
    } else if (this.deviceCapabilities === 'medium' || this.networkQuality === 'medium') {
      return qualityMap.medium
    } else {
      return qualityMap.high
    }
  }

  async loadComponent(content, strategy, options) {
    // Load React component lazily
    if (typeof content.import === 'function') {
      return await content.import()
    }
    
    throw new Error('Invalid component content')
  }

  async loadData(content, strategy, options) {
    // Load data with appropriate strategy
    const url = content.url || content.endpoint
    const fetchOptions = {
      method: content.method || 'GET',
      headers: content.headers || {},
      ...options
    }

    if (strategy.cacheStrategy === 'stale-while-revalidate') {
      return this.loadWithStaleWhileRevalidate(url, fetchOptions)
    }

    const response = await fetch(url, fetchOptions)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  async loadWithStaleWhileRevalidate(url, options) {
    const cacheKey = `mlg-cache-${btoa(url)}`
    
    // Try to get from cache first
    const cachedData = localStorage.getItem(cacheKey)
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData)
        
        // Return cached data immediately
        setTimeout(async () => {
          try {
            // Revalidate in background
            const response = await fetch(url, options)
            if (response.ok) {
              const fresh = await response.json()
              localStorage.setItem(cacheKey, JSON.stringify({
                data: fresh,
                timestamp: Date.now()
              }))
            }
          } catch (error) {
            console.warn('Background revalidation failed:', error)
          }
        }, 0)
        
        return parsed.data
      } catch (error) {
        console.warn('Cache parse error:', error)
      }
    }

    // No cache or cache error, fetch fresh
    const response = await fetch(url, options)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Cache for future use
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }))

    return data
  }

  async loadVideo(content, strategy, options) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      
      video.oncanplaythrough = () => resolve(video)
      video.onerror = () => reject(new Error('Video load failed'))
      
      // Adaptive quality for video
      if (strategy.adaptive && content.sources) {
        const quality = this.selectVideoQuality(content.sources)
        video.src = quality.url
      } else {
        video.src = content.url || content.src
      }
      
      video.preload = 'metadata'
    })
  }

  selectVideoQuality(sources) {
    const qualityOrder = {
      '1080p': 4,
      '720p': 3,
      '480p': 2,
      '240p': 1
    }

    // Sort by quality
    const sorted = sources.sort((a, b) => 
      (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0)
    )

    // Select based on device capabilities and network
    if (this.networkQuality === 'slow' || this.deviceCapabilities === 'low') {
      return sorted[sorted.length - 1] // Lowest quality
    } else if (this.networkQuality === 'medium' || this.deviceCapabilities === 'medium') {
      return sorted[Math.floor(sorted.length / 2)] // Medium quality
    } else {
      return sorted[0] // Highest quality
    }
  }

  async loadGeneric(content, strategy, options) {
    // Generic content loading
    if (typeof content.loader === 'function') {
      return await content.loader(options)
    }
    
    return content
  }

  adjustLoadingStrategies() {
    console.log(`📊 Adjusting loading strategies for ${this.networkQuality} network and ${this.deviceCapabilities} device`)
    
    // Adjust concurrency based on conditions
    this.loadingStrategies.forEach((strategy, name) => {
      if (this.networkQuality === 'slow') {
        strategy.concurrency = Math.max(1, Math.floor(strategy.concurrency / 2))
        strategy.timeout = Math.min(strategy.timeout * 1.5, 60000)
      } else if (this.networkQuality === 'fast') {
        strategy.concurrency = Math.min(strategy.concurrency * 1.5, 8)
        strategy.timeout = Math.max(strategy.timeout / 1.2, 5000)
      }
    })
  }

  // Utility methods
  getStrategyMetrics(strategyName) {
    const strategy = this.loadingStrategies.get(strategyName)
    if (!strategy) return null

    return {
      name: strategyName,
      loadedItems: strategy.loadedItems,
      failedItems: strategy.failedItems,
      avgLoadTime: strategy.avgLoadTime,
      successRate: strategy.loadedItems + strategy.failedItems > 0 
        ? (strategy.loadedItems / (strategy.loadedItems + strategy.failedItems) * 100).toFixed(2) + '%'
        : '0%'
    }
  }

  getAllMetrics() {
    const metrics = {}
    this.loadingStrategies.forEach((_, name) => {
      metrics[name] = this.getStrategyMetrics(name)
    })
    return metrics
  }

  // Quick loading methods for common content types
  loadGameAssets(assets) {
    return this.loadContent('game-assets', assets.map(asset => ({
      type: 'image',
      url: asset.url,
      priority: asset.priority || 'normal'
    })))
  }

  loadLeaderboard(endpoint, options = {}) {
    return this.loadContent('leaderboard', {
      type: 'data',
      url: endpoint,
      method: 'GET',
      ...options
    })
  }

  loadClanData(clanId, options = {}) {
    return this.loadContent('clan-data', {
      type: 'data',
      url: `/api/clans/${clanId}`,
      method: 'GET',
      ...options
    })
  }

  loadVideoContent(videoSrc, sources = []) {
    return this.loadContent('video-content', {
      type: 'video',
      url: videoSrc,
      sources: sources
    })
  }
}

// Export the class
export { MLGProgressiveLoadingStrategies }

// Global instance
const mlgProgressiveLoader = new MLGProgressiveLoadingStrategies()
window.MLGProgressiveLoader = mlgProgressiveLoader

console.log('📈 MLG Progressive Loading Strategies module loaded')