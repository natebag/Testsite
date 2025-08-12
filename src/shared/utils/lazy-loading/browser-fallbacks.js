/**
 * MLG Browser Fallback Strategies
 * 
 * Fallback implementations for older browsers that don't support
 * modern lazy loading APIs like Intersection Observer
 */

class MLGBrowserFallbacks {
  constructor() {
    this.fallbackActive = false
    this.polyfills = new Map()
    this.supportedFeatures = new Map()
    this.fallbackStrategies = new Map()
    
    this.initialize()
  }

  initialize() {
    this.detectBrowserCapabilities()
    this.loadPolyfillsIfNeeded()
    this.setupFallbackStrategies()
    
    console.log('🔧 MLG Browser Fallbacks initialized')
    if (this.fallbackActive) {
      console.log('⚠️ Using fallback strategies for older browser')
    }
  }

  detectBrowserCapabilities() {
    // Detect core APIs needed for lazy loading
    const features = {
      intersectionObserver: 'IntersectionObserver' in window,
      mutationObserver: 'MutationObserver' in window,
      requestAnimationFrame: 'requestAnimationFrame' in window,
      requestIdleCallback: 'requestIdleCallback' in window,
      webp: false,
      avif: false,
      es6Modules: 'import' in document.createElement('script'),
      customElements: 'customElements' in window,
      shadowDOM: 'attachShadow' in Element.prototype,
      serviceWorker: 'serviceWorker' in navigator,
      promise: typeof Promise !== 'undefined',
      fetch: 'fetch' in window,
      arrayfrom: typeof Array.from === 'function',
      objectAssign: typeof Object.assign === 'function'
    }

    // Test WebP support
    this.testWebPSupport().then(supported => {
      features.webp = supported
      this.supportedFeatures.set('webp', supported)
    })

    // Test AVIF support
    this.testAVIFSupport().then(supported => {
      features.avif = supported
      this.supportedFeatures.set('avif', supported)
    })

    // Store feature detection results
    for (const [feature, supported] of Object.entries(features)) {
      this.supportedFeatures.set(feature, supported)
    }

    // Determine if fallbacks are needed
    this.fallbackActive = !features.intersectionObserver || 
                         !features.requestAnimationFrame || 
                         !features.promise

    console.log('🔍 Browser capabilities detected:', features)
  }

  async testWebPSupport() {
    return new Promise(resolve => {
      const webP = new Image()
      webP.onload = webP.onerror = () => resolve(webP.height === 2)
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
  }

  async testAVIFSupport() {
    return new Promise(resolve => {
      const avif = new Image()
      avif.onload = avif.onerror = () => resolve(avif.height === 2)
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
    })
  }

  loadPolyfillsIfNeeded() {
    // Load polyfills for missing features
    if (!this.supportedFeatures.get('intersectionObserver')) {
      this.loadIntersectionObserverPolyfill()
    }

    if (!this.supportedFeatures.get('requestIdleCallback')) {
      this.loadRequestIdleCallbackPolyfill()
    }

    if (!this.supportedFeatures.get('promise')) {
      this.loadPromisePolyfill()
    }

    if (!this.supportedFeatures.get('fetch')) {
      this.loadFetchPolyfill()
    }

    if (!this.supportedFeatures.get('arrayfrom')) {
      this.loadArrayFromPolyfill()
    }

    if (!this.supportedFeatures.get('objectAssign')) {
      this.loadObjectAssignPolyfill()
    }
  }

  setupFallbackStrategies() {
    // Register fallback strategies for different scenarios
    this.fallbackStrategies.set('lazy-images', this.createScrollBasedImageLoader.bind(this))
    this.fallbackStrategies.set('lazy-components', this.createTimerBasedComponentLoader.bind(this))
    this.fallbackStrategies.set('progressive-loading', this.createSimpleProgressiveLoader.bind(this))
    this.fallbackStrategies.set('video-loading', this.createBasicVideoLoader.bind(this))
  }

  // Polyfill implementations
  loadIntersectionObserverPolyfill() {
    if (this.polyfills.has('intersectionObserver')) return

    console.log('📦 Loading IntersectionObserver polyfill...')

    // Simple IntersectionObserver polyfill
    window.IntersectionObserver = class IntersectionObserverPolyfill {
      constructor(callback, options = {}) {
        this.callback = callback
        this.options = {
          root: options.root || null,
          rootMargin: options.rootMargin || '0px',
          threshold: options.threshold || 0
        }
        this.observedElements = new Set()
        this.isPolyfill = true
        
        // Parse root margin
        this.parseRootMargin()
        
        // Start checking visibility
        this.startChecking()
      }

      parseRootMargin() {
        const margin = this.options.rootMargin.replace(/px/g, '').split(' ')
        this.rootMarginValues = {
          top: parseInt(margin[0]) || 0,
          right: parseInt(margin[1]) || parseInt(margin[0]) || 0,
          bottom: parseInt(margin[2]) || parseInt(margin[0]) || 0,
          left: parseInt(margin[3]) || parseInt(margin[1]) || parseInt(margin[0]) || 0
        }
      }

      observe(element) {
        this.observedElements.add(element)
      }

      unobserve(element) {
        this.observedElements.delete(element)
      }

      disconnect() {
        this.observedElements.clear()
        if (this.checkTimer) {
          clearInterval(this.checkTimer)
        }
      }

      startChecking() {
        this.checkTimer = setInterval(() => {
          this.checkIntersections()
        }, 100) // Check every 100ms
      }

      checkIntersections() {
        const entries = []
        
        this.observedElements.forEach(element => {
          const rect = element.getBoundingClientRect()
          const windowHeight = window.innerHeight || document.documentElement.clientHeight
          const windowWidth = window.innerWidth || document.documentElement.clientWidth

          // Apply root margin
          const adjustedRect = {
            top: rect.top - this.rootMarginValues.top,
            bottom: rect.bottom + this.rootMarginValues.bottom,
            left: rect.left - this.rootMarginValues.left,
            right: rect.right + this.rootMarginValues.right
          }

          const isIntersecting = (
            adjustedRect.bottom >= 0 &&
            adjustedRect.right >= 0 &&
            adjustedRect.top <= windowHeight &&
            adjustedRect.left <= windowWidth
          )

          entries.push({
            target: element,
            isIntersecting: isIntersecting,
            intersectionRatio: isIntersecting ? 1 : 0,
            boundingClientRect: rect,
            time: Date.now()
          })
        })

        if (entries.length > 0) {
          this.callback(entries)
        }
      }
    }

    this.polyfills.set('intersectionObserver', true)
    console.log('✅ IntersectionObserver polyfill loaded')
  }

  loadRequestIdleCallbackPolyfill() {
    if (this.polyfills.has('requestIdleCallback')) return

    console.log('📦 Loading requestIdleCallback polyfill...')

    window.requestIdleCallback = function(callback, options = {}) {
      const timeout = options.timeout || 5000
      const startTime = Date.now()
      
      return setTimeout(() => {
        callback({
          didTimeout: Date.now() - startTime >= timeout,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - startTime))
        })
      }, 1)
    }

    window.cancelIdleCallback = function(id) {
      clearTimeout(id)
    }

    this.polyfills.set('requestIdleCallback', true)
    console.log('✅ requestIdleCallback polyfill loaded')
  }

  loadPromisePolyfill() {
    if (this.polyfills.has('promise')) return

    console.log('📦 Loading Promise polyfill...')

    // Simple Promise polyfill (basic implementation)
    if (typeof Promise === 'undefined') {
      window.Promise = class PromisePolyfill {
        constructor(executor) {
          this.state = 'pending'
          this.value = undefined
          this.handlers = []

          try {
            executor(this.resolve.bind(this), this.reject.bind(this))
          } catch (error) {
            this.reject(error)
          }
        }

        resolve(value) {
          if (this.state === 'pending') {
            this.state = 'fulfilled'
            this.value = value
            this.handlers.forEach(handler => handler.onFulfilled(value))
          }
        }

        reject(error) {
          if (this.state === 'pending') {
            this.state = 'rejected'
            this.value = error
            this.handlers.forEach(handler => handler.onRejected(error))
          }
        }

        then(onFulfilled, onRejected) {
          return new Promise((resolve, reject) => {
            if (this.state === 'fulfilled') {
              try {
                const result = onFulfilled ? onFulfilled(this.value) : this.value
                resolve(result)
              } catch (error) {
                reject(error)
              }
            } else if (this.state === 'rejected') {
              if (onRejected) {
                try {
                  const result = onRejected(this.value)
                  resolve(result)
                } catch (error) {
                  reject(error)
                }
              } else {
                reject(this.value)
              }
            } else {
              this.handlers.push({
                onFulfilled: (value) => {
                  try {
                    const result = onFulfilled ? onFulfilled(value) : value
                    resolve(result)
                  } catch (error) {
                    reject(error)
                  }
                },
                onRejected: (error) => {
                  if (onRejected) {
                    try {
                      const result = onRejected(error)
                      resolve(result)
                    } catch (err) {
                      reject(err)
                    }
                  } else {
                    reject(error)
                  }
                }
              })
            }
          })
        }

        catch(onRejected) {
          return this.then(null, onRejected)
        }

        static resolve(value) {
          return new Promise(resolve => resolve(value))
        }

        static reject(error) {
          return new Promise((_, reject) => reject(error))
        }

        static all(promises) {
          return new Promise((resolve, reject) => {
            if (promises.length === 0) {
              resolve([])
              return
            }

            let completed = 0
            const results = new Array(promises.length)

            promises.forEach((promise, index) => {
              Promise.resolve(promise).then(value => {
                results[index] = value
                completed++
                if (completed === promises.length) {
                  resolve(results)
                }
              }).catch(reject)
            })
          })
        }
      }
    }

    this.polyfills.set('promise', true)
    console.log('✅ Promise polyfill loaded')
  }

  loadFetchPolyfill() {
    if (this.polyfills.has('fetch')) return

    console.log('📦 Loading fetch polyfill...')

    // Basic fetch polyfill using XMLHttpRequest
    window.fetch = function(url, options = {}) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        
        xhr.open(options.method || 'GET', url, true)
        
        // Set headers
        if (options.headers) {
          for (const [key, value] of Object.entries(options.headers)) {
            xhr.setRequestHeader(key, value)
          }
        }

        xhr.onload = function() {
          const response = {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Map(),
            text: () => Promise.resolve(xhr.responseText),
            json: () => Promise.resolve(JSON.parse(xhr.responseText)),
            blob: () => Promise.resolve(new Blob([xhr.response])),
            arrayBuffer: () => Promise.resolve(xhr.response)
          }
          resolve(response)
        }

        xhr.onerror = () => reject(new Error('Network error'))
        xhr.ontimeout = () => reject(new Error('Request timeout'))

        xhr.send(options.body)
      })
    }

    this.polyfills.set('fetch', true)
    console.log('✅ fetch polyfill loaded')
  }

  loadArrayFromPolyfill() {
    if (this.polyfills.has('arrayfrom')) return

    if (!Array.from) {
      Array.from = function(arrayLike, mapFn, thisArg) {
        const items = Object(arrayLike)
        const len = parseInt(items.length) || 0
        const result = new Array(len)
        
        for (let i = 0; i < len; i++) {
          const value = items[i]
          result[i] = mapFn ? mapFn.call(thisArg, value, i) : value
        }
        
        return result
      }
    }

    this.polyfills.set('arrayfrom', true)
    console.log('✅ Array.from polyfill loaded')
  }

  loadObjectAssignPolyfill() {
    if (this.polyfills.has('objectAssign')) return

    if (!Object.assign) {
      Object.assign = function(target, ...sources) {
        if (target == null) {
          throw new TypeError('Cannot convert undefined or null to object')
        }

        const to = Object(target)

        for (const source of sources) {
          if (source != null) {
            for (const key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                to[key] = source[key]
              }
            }
          }
        }

        return to
      }
    }

    this.polyfills.set('objectAssign', true)
    console.log('✅ Object.assign polyfill loaded')
  }

  // Fallback strategy implementations
  createScrollBasedImageLoader() {
    return class ScrollBasedImageLoader {
      constructor(options = {}) {
        this.options = {
          threshold: options.threshold || 200,
          throttle: options.throttle || 100,
          ...options
        }
        this.images = new Set()
        this.lastScrollTime = 0
        this.init()
      }

      init() {
        this.handleScroll = this.throttle(this.checkImages.bind(this), this.options.throttle)
        window.addEventListener('scroll', this.handleScroll, { passive: true })
        window.addEventListener('resize', this.handleScroll, { passive: true })
      }

      observe(img) {
        this.images.add(img)
        this.checkImages() // Check immediately
      }

      unobserve(img) {
        this.images.delete(img)
      }

      checkImages() {
        const windowHeight = window.innerHeight || document.documentElement.clientHeight
        
        this.images.forEach(img => {
          const rect = img.getBoundingClientRect()
          const isVisible = rect.top <= windowHeight + this.options.threshold && 
                           rect.bottom >= -this.options.threshold

          if (isVisible && img.dataset.src && !img.src) {
            this.loadImage(img)
            this.images.delete(img)
          }
        })
      }

      loadImage(img) {
        const src = img.dataset.src
        delete img.dataset.src

        const tempImg = new Image()
        tempImg.onload = () => {
          img.src = src
          img.classList.remove('mlg-loading')
          img.classList.add('mlg-loaded')
        }
        tempImg.onerror = () => {
          img.classList.add('mlg-error')
        }
        tempImg.src = src
      }

      throttle(func, delay) {
        let timeoutId
        let lastExecTime = 0
        
        return function(...args) {
          const currentTime = Date.now()
          
          if (currentTime - lastExecTime > delay) {
            func.apply(this, args)
            lastExecTime = currentTime
          } else {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => {
              func.apply(this, args)
              lastExecTime = Date.now()
            }, delay - (currentTime - lastExecTime))
          }
        }
      }

      disconnect() {
        window.removeEventListener('scroll', this.handleScroll)
        window.removeEventListener('resize', this.handleScroll)
        this.images.clear()
      }
    }
  }

  createTimerBasedComponentLoader() {
    return class TimerBasedComponentLoader {
      constructor(options = {}) {
        this.options = {
          delay: options.delay || 1000,
          maxConcurrent: options.maxConcurrent || 2,
          ...options
        }
        this.loadQueue = []
        this.loading = 0
      }

      loadComponent(importFn, fallback) {
        return new Promise((resolve, reject) => {
          this.loadQueue.push({
            importFn,
            fallback,
            resolve,
            reject
          })
          
          this.processQueue()
        })
      }

      processQueue() {
        if (this.loading >= this.options.maxConcurrent || this.loadQueue.length === 0) {
          return
        }

        const item = this.loadQueue.shift()
        this.loading++

        setTimeout(async () => {
          try {
            const module = await item.importFn()
            item.resolve(module)
          } catch (error) {
            item.reject(error)
          } finally {
            this.loading--
            this.processQueue()
          }
        }, this.options.delay)
      }
    }
  }

  createSimpleProgressiveLoader() {
    return class SimpleProgressiveLoader {
      constructor() {
        this.loadQueue = []
        this.isProcessing = false
      }

      addToQueue(loadFn, priority = 'normal') {
        this.loadQueue.push({ loadFn, priority })
        this.loadQueue.sort((a, b) => {
          const priorityOrder = { high: 3, normal: 2, low: 1 }
          return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2)
        })
        
        this.processQueue()
      }

      async processQueue() {
        if (this.isProcessing || this.loadQueue.length === 0) return

        this.isProcessing = true

        while (this.loadQueue.length > 0) {
          const item = this.loadQueue.shift()
          
          try {
            await item.loadFn()
          } catch (error) {
            console.warn('Progressive load failed:', error)
          }

          // Small delay between loads
          await new Promise(resolve => setTimeout(resolve, 50))
        }

        this.isProcessing = false
      }
    }
  }

  createBasicVideoLoader() {
    return class BasicVideoLoader {
      constructor() {
        this.videos = new Set()
      }

      loadVideo(videoElement, sources) {
        // Load video with basic format fallback
        const video = videoElement
        
        // Try sources in order of preference
        for (const source of sources) {
          if (video.canPlayType(source.type)) {
            video.src = source.src
            video.load()
            break
          }
        }

        return new Promise((resolve, reject) => {
          video.oncanplaythrough = () => resolve(video)
          video.onerror = () => reject(new Error('Video load failed'))
        })
      }
    }
  }

  // Public API methods
  getFallbackStrategy(type) {
    const strategy = this.fallbackStrategies.get(type)
    return strategy ? strategy() : null
  }

  isFallbackActive() {
    return this.fallbackActive
  }

  getPolyfillStatus() {
    return Object.fromEntries(this.polyfills)
  }

  getSupportedFeatures() {
    return Object.fromEntries(this.supportedFeatures)
  }

  // Utility methods for feature detection
  static detectImageFormat() {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1

    return {
      webp: canvas.toDataURL('image/webp').indexOf('webp') > -1,
      avif: (() => {
        try {
          return canvas.toDataURL('image/avif').indexOf('avif') > -1
        } catch {
          return false
        }
      })(),
      jpeg: true, // Always supported
      png: true   // Always supported
    }
  }

  static getBrowserInfo() {
    const ua = navigator.userAgent
    
    return {
      isIE: /MSIE|Trident/.test(ua),
      isEdge: /Edge/.test(ua),
      isChrome: /Chrome/.test(ua) && !/Edge/.test(ua),
      isFirefox: /Firefox/.test(ua),
      isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
      isMobile: /Mobi|Android/i.test(ua),
      version: this.extractBrowserVersion(ua)
    }
  }

  static extractBrowserVersion(ua) {
    let match = ua.match(/(Chrome|Firefox|Safari|Edge|MSIE)\/(\d+)/)
    if (match) {
      return { name: match[1], version: parseInt(match[2]) }
    }
    return { name: 'unknown', version: 0 }
  }
}

// Export the class
export { MLGBrowserFallbacks }

// Global instance
const mlgBrowserFallbacks = new MLGBrowserFallbacks()
window.MLGBrowserFallbacks = mlgBrowserFallbacks

// Convenience methods
window.getFallbackStrategy = (type) => mlgBrowserFallbacks.getFallbackStrategy(type)
window.isFallbackActive = () => mlgBrowserFallbacks.isFallbackActive()
window.getBrowserSupport = () => mlgBrowserFallbacks.getSupportedFeatures()

console.log('🔧 MLG Browser Fallbacks module loaded')