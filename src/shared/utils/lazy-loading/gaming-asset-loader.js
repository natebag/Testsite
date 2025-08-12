/**
 * MLG Gaming Asset Loader
 * 
 * Specialized lazy loading for gaming assets, videos, and interactive content
 * Optimized for gaming platforms with progressive quality and caching
 */

class MLGGamingAssetLoader {
  constructor() {
    this.assetCache = new Map()
    this.loadingQueue = new Map()
    this.preloadQueue = []
    this.videoPlayers = new Set()
    this.audioContext = null
    
    // Asset type configurations
    this.assetTypes = {
      texture: {
        formats: ['webp', 'avif', 'jpg', 'png'],
        sizes: ['thumbnail', 'medium', 'full'],
        priority: 'high',
        cache: true
      },
      model: {
        formats: ['gltf', 'glb', 'obj'],
        compressionLevels: ['low', 'medium', 'high'],
        priority: 'normal',
        cache: true
      },
      audio: {
        formats: ['webm', 'mp3', 'ogg'],
        quality: ['low', 'medium', 'high'],
        priority: 'low',
        cache: true,
        streaming: true
      },
      video: {
        formats: ['webm', 'mp4', 'avi'],
        resolutions: ['240p', '480p', '720p', '1080p'],
        priority: 'low',
        cache: false,
        streaming: true
      },
      sprite: {
        formats: ['webp', 'png'],
        sizes: ['1x', '2x', '3x'],
        priority: 'high',
        cache: true
      },
      animation: {
        formats: ['webp', 'gif', 'lottie'],
        quality: ['low', 'medium', 'high'],
        priority: 'normal',
        cache: true
      }
    }

    this.metrics = {
      totalAssets: 0,
      loadedAssets: 0,
      cachedAssets: 0,
      failedAssets: 0,
      totalLoadTime: 0,
      avgLoadTime: 0,
      bytesLoaded: 0,
      cacheHitRate: 0
    }

    this.initialize()
  }

  async initialize() {
    this.setupAudioContext()
    this.setupServiceWorkerCaching()
    this.setupResourceHints()
    
    console.log('🎮 MLG Gaming Asset Loader initialized')
  }

  setupAudioContext() {
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
        console.log('🔊 Audio context initialized')
      } catch (error) {
        console.warn('Audio context initialization failed:', error)
      }
    }
  }

  setupServiceWorkerCaching() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        console.log('💾 Service Worker ready for asset caching')
      })
    }
  }

  setupResourceHints() {
    // Add DNS prefetch for common gaming asset domains
    const assetDomains = [
      'cdn.mlgclan.com',
      'assets.mlgclan.com',
      'video.mlgclan.com'
    ]

    assetDomains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = `//${domain}`
      document.head.appendChild(link)
    })
  }

  // Main asset loading method
  async loadGameAsset(assetConfig) {
    const {
      url,
      type,
      priority = 'normal',
      quality = 'medium',
      preload = false,
      fallback = null,
      onProgress = null,
      metadata = {}
    } = assetConfig

    const assetKey = this.generateAssetKey(url, type, quality)
    
    // Check cache first
    if (this.assetCache.has(assetKey)) {
      this.metrics.cachedAssets++
      console.log('💾 Asset loaded from cache:', assetKey)
      return this.assetCache.get(assetKey)
    }

    // Check if already loading
    if (this.loadingQueue.has(assetKey)) {
      return this.loadingQueue.get(assetKey)
    }

    const startTime = performance.now()
    this.metrics.totalAssets++

    // Create loading promise
    const loadingPromise = this.executeAssetLoad(assetConfig, assetKey, startTime, onProgress)
    this.loadingQueue.set(assetKey, loadingPromise)

    try {
      const result = await loadingPromise
      
      // Update metrics
      const loadTime = performance.now() - startTime
      this.updateMetrics(true, loadTime, result.size || 0)
      
      // Cache the result
      if (this.assetTypes[type]?.cache !== false) {
        this.assetCache.set(assetKey, result)
      }
      
      console.log(`✅ Gaming asset loaded in ${loadTime.toFixed(2)}ms:`, assetKey)
      return result

    } catch (error) {
      this.updateMetrics(false, performance.now() - startTime, 0)
      
      // Try fallback if available
      if (fallback) {
        console.log('🔄 Trying fallback for failed asset:', assetKey)
        return this.loadGameAsset({ ...assetConfig, url: fallback, fallback: null })
      }
      
      throw error
    } finally {
      this.loadingQueue.delete(assetKey)
    }
  }

  generateAssetKey(url, type, quality) {
    return `${type}-${quality}-${btoa(url).slice(0, 16)}`
  }

  async executeAssetLoad(assetConfig, assetKey, startTime, onProgress) {
    const { url, type, quality } = assetConfig

    // Select best asset URL based on type and quality
    const optimizedUrl = await this.selectOptimalAsset(url, type, quality)

    switch (type) {
      case 'texture':
        return this.loadTexture(optimizedUrl, onProgress)
      case 'model':
        return this.loadModel(optimizedUrl, onProgress)
      case 'audio':
        return this.loadAudio(optimizedUrl, quality, onProgress)
      case 'video':
        return this.loadVideo(optimizedUrl, quality, onProgress)
      case 'sprite':
        return this.loadSprite(optimizedUrl, quality, onProgress)
      case 'animation':
        return this.loadAnimation(optimizedUrl, quality, onProgress)
      default:
        return this.loadGenericAsset(optimizedUrl, onProgress)
    }
  }

  async selectOptimalAsset(baseUrl, type, quality) {
    const typeConfig = this.assetTypes[type]
    if (!typeConfig) return baseUrl

    // Try different formats based on browser support
    for (const format of typeConfig.formats) {
      if (this.isFormatSupported(format, type)) {
        const optimizedUrl = this.buildAssetUrl(baseUrl, format, quality, type)
        
        // Check if the asset exists
        if (await this.assetExists(optimizedUrl)) {
          return optimizedUrl
        }
      }
    }

    return baseUrl
  }

  buildAssetUrl(baseUrl, format, quality, type) {
    const baseName = baseUrl.replace(/\.[^/.]+$/, '')
    const typeConfig = this.assetTypes[type]
    
    if (type === 'texture' || type === 'sprite') {
      return `${baseName}_${quality}.${format}`
    } else if (type === 'video') {
      return `${baseName}_${quality}.${format}`
    } else if (type === 'audio') {
      return `${baseName}_${quality}.${format}`
    }
    
    return `${baseName}.${format}`
  }

  isFormatSupported(format, type) {
    if (type === 'texture' || type === 'sprite') {
      const canvas = document.createElement('canvas')
      if (format === 'webp') {
        return canvas.toDataURL('image/webp').indexOf('webp') > -1
      } else if (format === 'avif') {
        try {
          return canvas.toDataURL('image/avif').indexOf('avif') > -1
        } catch {
          return false
        }
      }
      return true
    } else if (type === 'video') {
      const video = document.createElement('video')
      return video.canPlayType(`video/${format}`) !== ''
    } else if (type === 'audio') {
      const audio = document.createElement('audio')
      return audio.canPlayType(`audio/${format}`) !== ''
    }
    
    return true
  }

  async assetExists(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  // Specialized loading methods
  async loadTexture(url, onProgress) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        // Create canvas for texture processing
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img, 0, 0)
        
        resolve({
          type: 'texture',
          element: img,
          canvas: canvas,
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: this.estimateImageSize(img)
        })
      }
      
      img.onerror = () => reject(new Error(`Failed to load texture: ${url}`))
      img.src = url
    })
  }

  async loadModel(url, onProgress) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load model: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    
    return {
      type: 'model',
      data: arrayBuffer,
      url: url,
      size: arrayBuffer.byteLength
    }
  }

  async loadAudio(url, quality, onProgress) {
    if (this.audioContext) {
      // Load as AudioBuffer for Web Audio API
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to load audio: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      
      return {
        type: 'audio',
        buffer: audioBuffer,
        element: null,
        duration: audioBuffer.duration,
        size: arrayBuffer.byteLength
      }
    } else {
      // Fallback to HTML5 audio
      return new Promise((resolve, reject) => {
        const audio = new Audio()
        
        audio.oncanplaythrough = () => {
          resolve({
            type: 'audio',
            buffer: null,
            element: audio,
            duration: audio.duration,
            size: 0 // Can't determine exact size
          })
        }
        
        audio.onerror = () => reject(new Error(`Failed to load audio: ${url}`))
        audio.src = url
        audio.preload = 'auto'
      })
    }
  }

  async loadVideo(url, quality, onProgress) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      
      // Track loading progress
      video.addEventListener('progress', () => {
        if (onProgress && video.buffered.length > 0) {
          const loaded = video.buffered.end(0) / video.duration
          onProgress(loaded * 100)
        }
      })
      
      video.oncanplaythrough = () => {
        this.videoPlayers.add(video)
        
        resolve({
          type: 'video',
          element: video,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: 0 // Streaming, size varies
        })
      }
      
      video.onerror = () => reject(new Error(`Failed to load video: ${url}`))
      
      video.src = url
      video.preload = 'metadata'
      video.muted = true // Allow autoplay
    })
  }

  async loadSprite(url, quality, onProgress) {
    const img = await this.loadTexture(url, onProgress)
    
    return {
      ...img,
      type: 'sprite',
      // Add sprite-specific methods
      getFrame: (x, y, width, height) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img.canvas, x, y, width, height, 0, 0, width, height)
        return canvas
      }
    }
  }

  async loadAnimation(url, quality, onProgress) {
    const extension = url.split('.').pop().toLowerCase()
    
    if (extension === 'lottie' || extension === 'json') {
      // Lottie animation
      const response = await fetch(url)
      const animationData = await response.json()
      
      return {
        type: 'animation',
        subtype: 'lottie',
        data: animationData,
        size: JSON.stringify(animationData).length
      }
    } else {
      // Regular image animation (GIF, WebP)
      const img = await this.loadTexture(url, onProgress)
      return {
        ...img,
        type: 'animation',
        subtype: 'image'
      }
    }
  }

  async loadGenericAsset(url, onProgress) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load asset: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    
    return {
      type: 'generic',
      data: arrayBuffer,
      url: url,
      size: arrayBuffer.byteLength
    }
  }

  // Batch loading methods
  async loadAssetBatch(assets, options = {}) {
    const {
      concurrency = 3,
      priority = 'normal',
      onProgress = null,
      onComplete = null,
      onError = null
    } = options

    const results = []
    const errors = []
    let completed = 0

    // Process assets in batches
    for (let i = 0; i < assets.length; i += concurrency) {
      const batch = assets.slice(i, i + concurrency)
      
      const batchPromises = batch.map(async (asset, index) => {
        try {
          const result = await this.loadGameAsset(asset)
          completed++
          
          if (onProgress) {
            onProgress(completed, assets.length, result)
          }
          
          return result
        } catch (error) {
          completed++
          errors.push({ asset, error })
          
          if (onError) {
            onError(error, asset, completed, assets.length)
          }
          
          return null
        }
      })

      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : null))
    }

    if (onComplete) {
      onComplete(results, errors)
    }

    console.log(`📦 Asset batch loading complete: ${results.filter(r => r).length}/${assets.length} successful`)
    return { results, errors }
  }

  // Preloading methods
  async preloadCriticalAssets(assets) {
    console.log('🚀 Preloading critical gaming assets...')
    
    const criticalAssets = assets.filter(asset => asset.priority === 'critical')
    
    return Promise.all(criticalAssets.map(asset => 
      this.loadGameAsset({ ...asset, preload: true })
    ))
  }

  schedulePreload(assets, delay = 2000) {
    setTimeout(async () => {
      console.log('⏰ Starting scheduled asset preloading...')
      
      for (const asset of assets) {
        try {
          await this.loadGameAsset({ ...asset, preload: true })
          // Small delay between preloads to not block main thread
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.warn('Preload failed:', error)
        }
      }
    }, delay)
  }

  // Video-specific methods
  createVideoPlayer(videoAsset, container, options = {}) {
    const {
      autoplay = false,
      controls = true,
      loop = false,
      muted = false,
      poster = null
    } = options

    const video = videoAsset.element.cloneNode()
    video.autoplay = autoplay
    video.controls = controls
    video.loop = loop
    video.muted = muted
    
    if (poster) {
      video.poster = poster
    }

    // Add gaming-specific styling
    video.className = 'mlg-video-player rounded-lg shadow-lg'
    
    container.appendChild(video)
    this.videoPlayers.add(video)

    return video
  }

  pauseAllVideos() {
    this.videoPlayers.forEach(video => {
      if (!video.paused) {
        video.pause()
      }
    })
  }

  resumeAllVideos() {
    this.videoPlayers.forEach(video => {
      if (video.paused) {
        video.play().catch(console.warn)
      }
    })
  }

  // Cache management
  clearAssetCache() {
    this.assetCache.clear()
    console.log('🗑️ Asset cache cleared')
  }

  getCacheSize() {
    let totalSize = 0
    this.assetCache.forEach(asset => {
      totalSize += asset.size || 0
    })
    return totalSize
  }

  purgeLeastUsedAssets(maxSize) {
    const currentSize = this.getCacheSize()
    
    if (currentSize <= maxSize) return

    // Simple LRU implementation (in production, use more sophisticated approach)
    const sortedAssets = Array.from(this.assetCache.entries())
      .sort((a, b) => (a[1].lastUsed || 0) - (b[1].lastUsed || 0))

    let sizeToRemove = currentSize - maxSize
    let removed = 0

    for (const [key, asset] of sortedAssets) {
      if (sizeToRemove <= 0) break

      this.assetCache.delete(key)
      sizeToRemove -= asset.size || 0
      removed++
    }

    console.log(`🧹 Purged ${removed} assets from cache`)
  }

  // Utility methods
  estimateImageSize(img) {
    // Rough estimate based on dimensions and format
    return img.naturalWidth * img.naturalHeight * 4 // Assume RGBA
  }

  updateMetrics(success, loadTime, size) {
    if (success) {
      this.metrics.loadedAssets++
      this.metrics.totalLoadTime += loadTime
      this.metrics.avgLoadTime = this.metrics.totalLoadTime / this.metrics.loadedAssets
      this.metrics.bytesLoaded += size
    } else {
      this.metrics.failedAssets++
    }

    this.metrics.cacheHitRate = this.metrics.cachedAssets / this.metrics.totalAssets * 100
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalAssets > 0 
        ? (this.metrics.loadedAssets / this.metrics.totalAssets * 100).toFixed(2) + '%'
        : '0%',
      cacheHitRate: this.metrics.cacheHitRate.toFixed(2) + '%',
      mbLoaded: (this.metrics.bytesLoaded / 1024 / 1024).toFixed(2) + 'MB',
      cacheSize: (this.getCacheSize() / 1024 / 1024).toFixed(2) + 'MB'
    }
  }

  // Cleanup
  destroy() {
    this.assetCache.clear()
    this.loadingQueue.clear()
    this.preloadQueue.length = 0
    this.pauseAllVideos()
    this.videoPlayers.clear()
    
    if (this.audioContext) {
      this.audioContext.close()
    }

    console.log('🗑️ MLG Gaming Asset Loader destroyed')
  }
}

// Export the class
export { MLGGamingAssetLoader }

// Global instance
const mlgGamingAssetLoader = new MLGGamingAssetLoader()
window.MLGGamingAssetLoader = mlgGamingAssetLoader

// Utility functions for easy asset loading
window.loadGameTexture = (url, quality = 'medium') => 
  mlgGamingAssetLoader.loadGameAsset({ url, type: 'texture', quality })

window.loadGameVideo = (url, quality = '720p') => 
  mlgGamingAssetLoader.loadGameAsset({ url, type: 'video', quality })

window.loadGameAudio = (url, quality = 'medium') => 
  mlgGamingAssetLoader.loadGameAsset({ url, type: 'audio', quality })

window.loadGameSprite = (url, quality = 'medium') => 
  mlgGamingAssetLoader.loadGameAsset({ url, type: 'sprite', quality })

console.log('🎮 MLG Gaming Asset Loader module loaded')