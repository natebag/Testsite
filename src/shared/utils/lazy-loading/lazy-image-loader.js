/**
 * MLG Lazy Image Loader
 * 
 * High-performance image lazy loading using Intersection Observer API
 * Optimized for Core Web Vitals (LCP, CLS) and gaming assets
 */

class MLGLazyImageLoader {
  constructor(options = {}) {
    this.options = {
      // Intersection Observer options
      rootMargin: options.rootMargin || '50px',
      threshold: options.threshold || 0.1,
      
      // Loading strategy
      loadingStrategy: options.loadingStrategy || 'eager-viewport',
      
      // Placeholder options
      useBlurPlaceholder: options.useBlurPlaceholder || true,
      placeholderQuality: options.placeholderQuality || 10,
      
      // Performance options
      enableWebP: options.enableWebP || true,
      enableAVIF: options.enableAVIF || true,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      
      // Gaming-specific options
      prioritizeGameAssets: options.prioritizeGameAssets || true,
      preloadCriticalImages: options.preloadCriticalImages || true,
      
      // Callbacks
      onLoad: options.onLoad || null,
      onError: options.onError || null,
      onProgress: options.onProgress || null
    }

    this.observer = null
    this.loadingImages = new Set()
    this.loadedImages = new Set()
    this.errorImages = new Set()
    this.retryCount = new Map()
    
    // Performance tracking
    this.metrics = {
      totalImages: 0,
      loadedImages: 0,
      errorImages: 0,
      avgLoadTime: 0,
      totalLoadTime: 0,
      lcp: 0
    }

    this.initialize()
  }

  initialize() {
    // Check for Intersection Observer support
    if (!('IntersectionObserver' in window)) {
      console.warn('MLG Lazy Loader: IntersectionObserver not supported, falling back to eager loading')
      this.fallbackToEagerLoading()
      return
    }

    this.createObserver()
    this.setupPerformanceObserver()
    this.preloadCriticalImages()
    
    console.log('🖼️ MLG Lazy Image Loader initialized')
  }

  createObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target)
          this.observer.unobserve(entry.target)
        }
      })
    }, {
      rootMargin: this.options.rootMargin,
      threshold: this.options.threshold
    })
  }

  setupPerformanceObserver() {
    // Monitor LCP for image optimization
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          const lastEntry = entries[entries.length - 1]
          if (lastEntry && lastEntry.element && lastEntry.element.tagName === 'IMG') {
            this.metrics.lcp = lastEntry.startTime
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (error) {
        console.warn('MLG Lazy Loader: LCP observer not supported:', error)
      }
    }
  }

  async preloadCriticalImages() {
    if (!this.options.preloadCriticalImages) return

    // Find images marked as critical
    const criticalImages = document.querySelectorAll('img[data-priority="high"], img[data-critical="true"]')
    
    for (const img of criticalImages) {
      try {
        await this.preloadImage(img.dataset.src || img.src)
        console.log('🚀 Preloaded critical image:', img.dataset.src || img.src)
      } catch (error) {
        console.warn('⚠️ Failed to preload critical image:', error)
      }
    }
  }

  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = reject
      img.src = src
    })
  }

  async loadImage(imgElement) {
    if (this.loadingImages.has(imgElement) || this.loadedImages.has(imgElement)) {
      return
    }

    this.loadingImages.add(imgElement)
    const startTime = performance.now()

    try {
      // Add loading class for CSS transitions
      imgElement.classList.add('mlg-loading')
      
      // Determine the best image source
      const srcToLoad = await this.getBestImageSrc(imgElement)
      
      // Create new image for loading
      const newImg = new Image()
      
      // Set up loading promise
      const loadPromise = new Promise((resolve, reject) => {
        newImg.onload = () => {
          resolve(newImg)
        }
        
        newImg.onerror = () => {
          reject(new Error(`Failed to load image: ${srcToLoad}`))
        }
      })

      // Load the image
      newImg.src = srcToLoad
      
      // Wait for image to load
      await loadPromise
      
      // Apply the loaded image
      await this.applyLoadedImage(imgElement, newImg, srcToLoad)
      
      // Track metrics
      const loadTime = performance.now() - startTime
      this.updateMetrics(true, loadTime)
      
      // Call success callback
      if (this.options.onLoad) {
        this.options.onLoad(imgElement, loadTime)
      }

      console.log(`✅ Loaded image in ${loadTime.toFixed(2)}ms:`, srcToLoad)

    } catch (error) {
      await this.handleImageError(imgElement, error, startTime)
    } finally {
      this.loadingImages.delete(imgElement)
    }
  }

  async getBestImageSrc(imgElement) {
    const dataSrc = imgElement.dataset.src
    const srcset = imgElement.dataset.srcset
    const fallbackSrc = imgElement.src

    if (!dataSrc && !srcset) {
      return fallbackSrc
    }

    // Handle srcset for responsive images
    if (srcset) {
      return this.selectBestSrcFromSet(srcset)
    }

    // Handle modern format support
    if (this.options.enableAVIF || this.options.enableWebP) {
      const modernSrc = await this.getModernFormatSrc(dataSrc)
      if (modernSrc) return modernSrc
    }

    return dataSrc || fallbackSrc
  }

  selectBestSrcFromSet(srcset) {
    const sources = srcset.split(',').map(src => {
      const [url, descriptor] = src.trim().split(' ')
      const width = descriptor ? parseInt(descriptor.replace('w', '')) : Infinity
      return { url: url.trim(), width }
    })

    // Sort by width and select appropriate size
    sources.sort((a, b) => a.width - b.width)
    const viewportWidth = window.innerWidth * window.devicePixelRatio
    
    const bestSource = sources.find(source => source.width >= viewportWidth) || sources[sources.length - 1]
    return bestSource.url
  }

  async getModernFormatSrc(originalSrc) {
    // Check for pre-generated modern formats
    const baseName = originalSrc.replace(/\.[^/.]+$/, '')
    const extension = originalSrc.split('.').pop()

    // Try AVIF first (better compression)
    if (this.options.enableAVIF && this.supportsAVIF()) {
      const avifSrc = `${baseName}.avif`
      if (await this.imageExists(avifSrc)) {
        return avifSrc
      }
    }

    // Try WebP second
    if (this.options.enableWebP && this.supportsWebP()) {
      const webpSrc = `${baseName}.webp`
      if (await this.imageExists(webpSrc)) {
        return webpSrc
      }
    }

    return originalSrc
  }

  supportsWebP() {
    if (this._webpSupported !== undefined) return this._webpSupported
    
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    this._webpSupported = canvas.toDataURL('image/webp').indexOf('webp') > -1
    return this._webpSupported
  }

  supportsAVIF() {
    if (this._avifSupported !== undefined) return this._avifSupported
    
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    try {
      this._avifSupported = canvas.toDataURL('image/avif').indexOf('avif') > -1
    } catch {
      this._avifSupported = false
    }
    return this._avifSupported
  }

  async imageExists(src) {
    try {
      const response = await fetch(src, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  async applyLoadedImage(imgElement, loadedImg, src) {
    return new Promise((resolve) => {
      // Prevent layout shift by setting dimensions if not present
      if (!imgElement.style.width && !imgElement.style.height) {
        const computedStyle = window.getComputedStyle(imgElement)
        if (computedStyle.width === 'auto' && computedStyle.height === 'auto') {
          imgElement.style.width = `${loadedImg.naturalWidth}px`
          imgElement.style.height = `${loadedImg.naturalHeight}px`
        }
      }

      // Apply the source
      if (imgElement.dataset.srcset) {
        imgElement.srcset = imgElement.dataset.srcset
        delete imgElement.dataset.srcset
      }
      
      imgElement.src = src
      delete imgElement.dataset.src

      // Handle fade-in animation
      imgElement.classList.remove('mlg-loading')
      imgElement.classList.add('mlg-loaded')

      // Mark as loaded
      this.loadedImages.add(imgElement)

      // Wait for transition to complete
      setTimeout(resolve, 300)
    })
  }

  async handleImageError(imgElement, error, startTime) {
    console.warn('⚠️ Image loading error:', error.message)
    
    const retryKey = imgElement.dataset.src || imgElement.src
    const currentRetries = this.retryCount.get(retryKey) || 0

    if (currentRetries < this.options.retryAttempts) {
      // Retry loading
      this.retryCount.set(retryKey, currentRetries + 1)
      
      setTimeout(() => {
        console.log(`🔄 Retrying image load (attempt ${currentRetries + 1}/${this.options.retryAttempts}):`, retryKey)
        this.loadImage(imgElement)
      }, this.options.retryDelay * (currentRetries + 1))
      
      return
    }

    // Max retries reached, handle error
    this.errorImages.add(imgElement)
    imgElement.classList.remove('mlg-loading')
    imgElement.classList.add('mlg-error')

    // Apply fallback image if available
    const fallbackSrc = imgElement.dataset.fallback
    if (fallbackSrc) {
      imgElement.src = fallbackSrc
    }

    // Update metrics
    const errorTime = performance.now() - startTime
    this.updateMetrics(false, errorTime)

    // Call error callback
    if (this.options.onError) {
      this.options.onError(imgElement, error, currentRetries)
    }
  }

  updateMetrics(success, loadTime) {
    this.metrics.totalImages++
    
    if (success) {
      this.metrics.loadedImages++
      this.metrics.totalLoadTime += loadTime
      this.metrics.avgLoadTime = this.metrics.totalLoadTime / this.metrics.loadedImages
    } else {
      this.metrics.errorImages++
    }
  }

  // Public API methods
  observe(imgElement) {
    if (!imgElement || imgElement.tagName !== 'IMG') {
      console.warn('MLG Lazy Loader: Invalid image element provided')
      return
    }

    // Add loading placeholder if enabled
    if (this.options.useBlurPlaceholder && imgElement.dataset.src) {
      this.addBlurPlaceholder(imgElement)
    }

    // Observe the element
    if (this.observer) {
      this.observer.observe(imgElement)
    } else {
      // Fallback for unsupported browsers
      this.loadImage(imgElement)
    }
  }

  observeAll(selector = 'img[data-src]') {
    const images = document.querySelectorAll(selector)
    images.forEach(img => this.observe(img))
    console.log(`👁️ Observing ${images.length} images for lazy loading`)
  }

  addBlurPlaceholder(imgElement) {
    // Create a low-quality placeholder
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = 40
    canvas.height = 30
    
    // Create a simple gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, 40, 30)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(1, '#0a0a0f')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 40, 30)
    
    // Apply as initial src with blur
    imgElement.src = canvas.toDataURL()
    imgElement.style.filter = 'blur(5px)'
    imgElement.style.transition = 'filter 0.3s ease-out'
  }

  fallbackToEagerLoading() {
    // Load all images immediately for unsupported browsers
    const lazyImages = document.querySelectorAll('img[data-src]')
    
    lazyImages.forEach(img => {
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset
        delete img.dataset.srcset
      }
      
      if (img.dataset.src) {
        img.src = img.dataset.src
        delete img.dataset.src
      }
    })

    console.log('📷 Fallback: Loaded all images eagerly')
  }

  // Performance and debugging methods
  getMetrics() {
    return {
      ...this.metrics,
      successRate: (this.metrics.loadedImages / this.metrics.totalImages * 100).toFixed(2) + '%',
      errorRate: (this.metrics.errorImages / this.metrics.totalImages * 100).toFixed(2) + '%'
    }
  }

  getLoadingStatus() {
    return {
      loading: this.loadingImages.size,
      loaded: this.loadedImages.size,
      errors: this.errorImages.size,
      total: this.metrics.totalImages
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }

    this.loadingImages.clear()
    this.loadedImages.clear()
    this.errorImages.clear()
    this.retryCount.clear()
    
    console.log('🗑️ MLG Lazy Image Loader destroyed')
  }
}

// Export for module usage
export { MLGLazyImageLoader }

// Global instance for immediate use
window.MLGLazyImageLoader = MLGLazyImageLoader

// Auto-initialize with default options
window.mlgLazyLoader = new MLGLazyImageLoader({
  rootMargin: '100px',
  threshold: 0.1,
  loadingStrategy: 'eager-viewport',
  useBlurPlaceholder: true,
  enableWebP: true,
  enableAVIF: true,
  prioritizeGameAssets: true,
  preloadCriticalImages: true
})

// Auto-observe existing images
document.addEventListener('DOMContentLoaded', () => {
  window.mlgLazyLoader.observeAll()
})

console.log('🖼️ MLG Lazy Image Loader module loaded')