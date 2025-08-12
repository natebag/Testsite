/**
 * Gaming Loading States Components
 * Xbox 360-inspired loading animations and transitions for MLG.clan platform
 */

class GamingLoadingStates {
  constructor(options = {}) {
    this.options = {
      primaryColor: '#00ff88',
      secondaryColor: '#8b5cf6',
      accentColor: '#3b82f6',
      warningColor: '#fbbf24',
      errorColor: '#ef4444',
      darkBg: '#0a0a0f',
      surfaceBg: '#1a1a2e',
      animationDuration: 800,
      pulseDelay: 150,
      ...options
    };
    
    this.loadingInstances = new Map();
    this.animationFrames = new Map();
    
    this.injectStyles();
    console.log('🎮 Gaming Loading States initialized');
  }

  /**
   * Xbox 360-style dashboard loader
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Loading options
   */
  showDashboardLoader(container, options = {}) {
    const loaderId = this.generateId();
    const message = options.message || 'Loading MLG Dashboard...';
    const showProgress = options.progress !== false;
    
    const loaderHTML = `
      <div id="${loaderId}" class="gaming-dashboard-loader fade-in">
        <div class="dashboard-loader-container">
          <!-- Xbox 360-style orb animation -->
          <div class="xbox-orb-container">
            <div class="xbox-orb">
              <div class="orb-ring orb-ring-1"></div>
              <div class="orb-ring orb-ring-2"></div>
              <div class="orb-ring orb-ring-3"></div>
              <div class="orb-center">
                <div class="orb-logo">🎮</div>
              </div>
            </div>
          </div>
          
          <!-- Loading bars similar to Xbox guide -->
          <div class="xbox-loading-bars">
            <div class="loading-bar bar-1"></div>
            <div class="loading-bar bar-2"></div>
            <div class="loading-bar bar-3"></div>
            <div class="loading-bar bar-4"></div>
            <div class="loading-bar bar-5"></div>
          </div>
          
          <!-- Status text -->
          <div class="loading-status">
            <h3 class="status-title">${message}</h3>
            <p class="status-subtitle">Initializing gaming systems...</p>
          </div>
          
          ${showProgress ? `
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" id="${loaderId}-progress"></div>
              </div>
              <div class="progress-text" id="${loaderId}-progress-text">0%</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    container.innerHTML = loaderHTML;
    this.loadingInstances.set(loaderId, { container, type: 'dashboard', startTime: Date.now() });
    
    if (showProgress) {
      this.animateProgress(loaderId, options.duration || 3000);
    }
    
    return loaderId;
  }

  /**
   * Create skeleton loader with gaming aesthetic
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Skeleton options
   */
  showSkeletonLoader(container, options = {}) {
    const loaderId = this.generateId();
    const lines = options.lines || 5;
    const showAvatar = options.avatar !== false;
    const showCards = options.cards || 0;
    
    let skeletonHTML = `
      <div id="${loaderId}" class="gaming-skeleton-loader fade-in">
        <div class="skeleton-container">
    `;
    
    // Avatar and title section
    if (showAvatar) {
      skeletonHTML += `
        <div class="skeleton-header">
          <div class="skeleton-avatar pulse-neon"></div>
          <div class="skeleton-title-group">
            <div class="skeleton-line skeleton-title pulse-neon"></div>
            <div class="skeleton-line skeleton-subtitle pulse-neon"></div>
          </div>
        </div>
      `;
    }
    
    // Content lines
    skeletonHTML += '<div class="skeleton-content">';
    for (let i = 0; i < lines; i++) {
      const width = 60 + Math.random() * 35; // Random width for natural look
      const delay = i * 100;
      skeletonHTML += `
        <div class="skeleton-line pulse-neon" 
             style="width: ${width}%; animation-delay: ${delay}ms"></div>
      `;
    }
    skeletonHTML += '</div>';
    
    // Card skeletons for dashboard
    if (showCards > 0) {
      skeletonHTML += '<div class="skeleton-cards">';
      for (let i = 0; i < showCards; i++) {
        const delay = (lines + i) * 100;
        skeletonHTML += `
          <div class="skeleton-card pulse-neon" style="animation-delay: ${delay}ms">
            <div class="skeleton-card-header pulse-neon"></div>
            <div class="skeleton-card-content">
              <div class="skeleton-line pulse-neon"></div>
              <div class="skeleton-line pulse-neon" style="width: 70%"></div>
            </div>
          </div>
        `;
      }
      skeletonHTML += '</div>';
    }
    
    skeletonHTML += `
        </div>
      </div>
    `;
    
    container.innerHTML = skeletonHTML;
    this.loadingInstances.set(loaderId, { container, type: 'skeleton', startTime: Date.now() });
    
    return loaderId;
  }

  /**
   * Spinning loader with gaming elements
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Spinner options
   */
  showSpinnerLoader(container, options = {}) {
    const loaderId = this.generateId();
    const message = options.message || 'Loading...';
    const size = options.size || 'medium'; // small, medium, large
    const style = options.style || 'orb'; // orb, gear, portal, matrix
    
    const sizeClasses = {
      small: 'spinner-small',
      medium: 'spinner-medium',
      large: 'spinner-large'
    };
    
    let spinnerElement = '';
    
    switch (style) {
      case 'orb':
        spinnerElement = `
          <div class="gaming-spinner gaming-spinner-orb ${sizeClasses[size]}">
            <div class="spinner-ring ring-1"></div>
            <div class="spinner-ring ring-2"></div>
            <div class="spinner-ring ring-3"></div>
            <div class="spinner-core">⚡</div>
          </div>
        `;
        break;
      
      case 'gear':
        spinnerElement = `
          <div class="gaming-spinner gaming-spinner-gear ${sizeClasses[size]}">
            <div class="gear gear-outer">⚙️</div>
            <div class="gear gear-inner">⚙️</div>
          </div>
        `;
        break;
      
      case 'portal':
        spinnerElement = `
          <div class="gaming-spinner gaming-spinner-portal ${sizeClasses[size]}">
            <div class="portal-ring portal-ring-1"></div>
            <div class="portal-ring portal-ring-2"></div>
            <div class="portal-ring portal-ring-3"></div>
            <div class="portal-center">🌀</div>
          </div>
        `;
        break;
      
      case 'matrix':
        spinnerElement = `
          <div class="gaming-spinner gaming-spinner-matrix ${sizeClasses[size]}">
            <div class="matrix-grid">
              ${Array.from({length: 9}, (_, i) => `<div class="matrix-pixel matrix-pixel-${i + 1}"></div>`).join('')}
            </div>
          </div>
        `;
        break;
    }
    
    const loaderHTML = `
      <div id="${loaderId}" class="gaming-spinner-loader fade-in">
        <div class="spinner-container">
          ${spinnerElement}
          <div class="spinner-message">${message}</div>
          <div class="spinner-dots">
            <span class="dot dot-1">•</span>
            <span class="dot dot-2">•</span>
            <span class="dot dot-3">•</span>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = loaderHTML;
    this.loadingInstances.set(loaderId, { container, type: 'spinner', startTime: Date.now() });
    
    return loaderId;
  }

  /**
   * Progress bar with gaming aesthetics
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Progress options
   */
  showProgressLoader(container, options = {}) {
    const loaderId = this.generateId();
    const title = options.title || 'Processing...';
    const subtitle = options.subtitle || 'Please wait while we handle your request';
    const showPercentage = options.percentage !== false;
    const showSteps = options.steps || [];
    const animated = options.animated !== false;
    
    let stepsHTML = '';
    if (showSteps.length > 0) {
      stepsHTML = '<div class="progress-steps">';
      showSteps.forEach((step, index) => {
        stepsHTML += `
          <div class="progress-step" id="${loaderId}-step-${index}">
            <div class="step-indicator">
              <div class="step-number">${index + 1}</div>
            </div>
            <div class="step-label">${step}</div>
          </div>
        `;
      });
      stepsHTML += '</div>';
    }
    
    const loaderHTML = `
      <div id="${loaderId}" class="gaming-progress-loader fade-in">
        <div class="progress-loader-container">
          <div class="progress-header">
            <h3 class="progress-title">${title}</h3>
            <p class="progress-subtitle">${subtitle}</p>
          </div>
          
          <div class="progress-bar-container">
            <div class="progress-track">
              <div class="progress-fill ${animated ? 'animated' : ''}" id="${loaderId}-fill"></div>
              <div class="progress-glow"></div>
            </div>
            ${showPercentage ? `
              <div class="progress-percentage" id="${loaderId}-percentage">0%</div>
            ` : ''}
          </div>
          
          ${stepsHTML}
          
          <div class="progress-status" id="${loaderId}-status">Initializing...</div>
        </div>
      </div>
    `;
    
    container.innerHTML = loaderHTML;
    this.loadingInstances.set(loaderId, { 
      container, 
      type: 'progress', 
      startTime: Date.now(),
      steps: showSteps 
    });
    
    return loaderId;
  }

  /**
   * Real-time pulsing loader for live updates
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Pulse options
   */
  showPulseLoader(container, options = {}) {
    const loaderId = this.generateId();
    const message = options.message || 'Live updates active...';
    const intensity = options.intensity || 'medium'; // low, medium, high
    const shape = options.shape || 'circle'; // circle, square, diamond
    
    const intensityClasses = {
      low: 'pulse-low',
      medium: 'pulse-medium',
      high: 'pulse-high'
    };
    
    const shapeClasses = {
      circle: 'pulse-circle',
      square: 'pulse-square',
      diamond: 'pulse-diamond'
    };
    
    const loaderHTML = `
      <div id="${loaderId}" class="gaming-pulse-loader fade-in">
        <div class="pulse-container">
          <div class="pulse-indicator ${shapeClasses[shape]} ${intensityClasses[intensity]}">
            <div class="pulse-core"></div>
            <div class="pulse-wave pulse-wave-1"></div>
            <div class="pulse-wave pulse-wave-2"></div>
            <div class="pulse-wave pulse-wave-3"></div>
          </div>
          <div class="pulse-message">${message}</div>
          <div class="pulse-status">
            <span class="status-dot"></span>
            <span class="status-text">Connected</span>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = loaderHTML;
    this.loadingInstances.set(loaderId, { container, type: 'pulse', startTime: Date.now() });
    
    return loaderId;
  }

  /**
   * Update progress for progress loaders
   * @param {string} loaderId - Loader ID
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} status - Optional status message
   * @param {number} currentStep - Current step index
   */
  updateProgress(loaderId, progress, status = null, currentStep = -1) {
    const instance = this.loadingInstances.get(loaderId);
    if (!instance) return;
    
    const clampedProgress = Math.max(0, Math.min(100, progress));
    
    // Update progress bar
    const fillElement = document.getElementById(`${loaderId}-fill`);
    const percentageElement = document.getElementById(`${loaderId}-percentage`);
    const statusElement = document.getElementById(`${loaderId}-status`);
    const progressTextElement = document.getElementById(`${loaderId}-progress-text`);
    
    if (fillElement) {
      fillElement.style.width = `${clampedProgress}%`;
    }
    
    if (percentageElement) {
      percentageElement.textContent = `${Math.round(clampedProgress)}%`;
    }
    
    if (progressTextElement) {
      progressTextElement.textContent = `${Math.round(clampedProgress)}%`;
    }
    
    if (statusElement && status) {
      statusElement.textContent = status;
    }
    
    // Update steps if applicable
    if (currentStep >= 0 && instance.steps) {
      instance.steps.forEach((_, index) => {
        const stepElement = document.getElementById(`${loaderId}-step-${index}`);
        if (stepElement) {
          if (index < currentStep) {
            stepElement.classList.add('step-completed');
          } else if (index === currentStep) {
            stepElement.classList.add('step-active');
            stepElement.classList.remove('step-completed');
          } else {
            stepElement.classList.remove('step-active', 'step-completed');
          }
        }
      });
    }
  }

  /**
   * Animate progress automatically
   * @param {string} loaderId - Loader ID
   * @param {number} duration - Animation duration in ms
   * @param {Function} onComplete - Completion callback
   */
  animateProgress(loaderId, duration = 3000, onComplete = null) {
    const startTime = Date.now();
    const instance = this.loadingInstances.get(loaderId);
    
    if (!instance) return;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      this.updateProgress(loaderId, progress, `Loading... ${Math.round(progress)}%`);
      
      if (progress < 100) {
        const frameId = requestAnimationFrame(animate);
        this.animationFrames.set(loaderId, frameId);
      } else {
        this.animationFrames.delete(loaderId);
        if (onComplete) onComplete();
      }
    };
    
    animate();
  }

  /**
   * Hide loading state
   * @param {string} loaderId - Loader ID
   * @param {Object} options - Hide options
   */
  hideLoader(loaderId, options = {}) {
    const instance = this.loadingInstances.get(loaderId);
    if (!instance) return;
    
    const duration = options.duration || 300;
    const callback = options.onComplete;
    
    // Cancel any running animations
    const frameId = this.animationFrames.get(loaderId);
    if (frameId) {
      cancelAnimationFrame(frameId);
      this.animationFrames.delete(loaderId);
    }
    
    const element = document.getElementById(loaderId);
    if (element) {
      element.classList.add('fade-out');
      
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        this.loadingInstances.delete(loaderId);
        if (callback) callback();
      }, duration);
    } else {
      this.loadingInstances.delete(loaderId);
      if (callback) callback();
    }
  }

  /**
   * Show error state with retry options
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Error options
   */
  showErrorState(container, options = {}) {
    const loaderId = this.generateId();
    const title = options.title || 'Connection Error';
    const message = options.message || 'Unable to load content. Please check your connection and try again.';
    const showRetry = options.retry !== false;
    const retryCallback = options.onRetry;
    const showSupport = options.support !== false;
    
    const errorHTML = `
      <div id="${loaderId}" class="gaming-error-state fade-in">
        <div class="error-container">
          <div class="error-icon">
            <div class="error-symbol">⚠️</div>
            <div class="error-pulse"></div>
          </div>
          
          <div class="error-content">
            <h3 class="error-title">${title}</h3>
            <p class="error-message">${message}</p>
          </div>
          
          <div class="error-actions">
            ${showRetry ? `
              <button class="error-btn error-btn-primary" onclick="window.gamingLoader.handleRetry('${loaderId}', ${retryCallback ? 'true' : 'false'})">
                <span class="btn-icon">🔄</span>
                <span class="btn-text">Retry</span>
              </button>
            ` : ''}
            
            <button class="error-btn error-btn-secondary" onclick="window.history.back()">
              <span class="btn-icon">←</span>
              <span class="btn-text">Go Back</span>
            </button>
            
            ${showSupport ? `
              <button class="error-btn error-btn-tertiary" onclick="window.open('mailto:support@mlg.clan')">
                <span class="btn-icon">💬</span>
                <span class="btn-text">Contact Support</span>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = errorHTML;
    this.loadingInstances.set(loaderId, { 
      container, 
      type: 'error', 
      startTime: Date.now(),
      onRetry: retryCallback
    });
    
    return loaderId;
  }

  /**
   * Handle retry action
   */
  handleRetry(loaderId, hasCallback) {
    const instance = this.loadingInstances.get(loaderId);
    if (!instance) return;
    
    if (hasCallback && instance.onRetry) {
      instance.onRetry();
    }
    
    this.hideLoader(loaderId);
  }

  /**
   * Generate unique loader ID
   */
  generateId() {
    return 'gaming-loader-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get all active loaders
   */
  getActiveLoaders() {
    return Array.from(this.loadingInstances.entries()).map(([id, instance]) => ({
      id,
      type: instance.type,
      duration: Date.now() - instance.startTime
    }));
  }

  /**
   * Hide all active loaders
   */
  hideAllLoaders() {
    for (const [loaderId] of this.loadingInstances) {
      this.hideLoader(loaderId);
    }
  }

  /**
   * Inject CSS styles for gaming loaders
   */
  injectStyles() {
    const styles = `
      <style id="gaming-loading-styles">
        /* Base animations and transitions */
        .fade-in {
          animation: gamingFadeIn 0.4s ease-out forwards;
        }
        
        .fade-out {
          animation: gamingFadeOut 0.3s ease-in forwards;
        }
        
        @keyframes gamingFadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes gamingFadeOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.95); }
        }
        
        /* Pulse effect for neon elements */
        .pulse-neon {
          animation: pulseNeon 2s ease-in-out infinite;
        }
        
        @keyframes pulseNeon {
          0%, 100% { 
            box-shadow: 0 0 5px ${this.options.primaryColor}40, 0 0 10px ${this.options.primaryColor}20;
            opacity: 0.8;
          }
          50% { 
            box-shadow: 0 0 15px ${this.options.primaryColor}60, 0 0 25px ${this.options.primaryColor}40;
            opacity: 1;
          }
        }

        /* Xbox 360 Dashboard Loader */
        .gaming-dashboard-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          background: linear-gradient(135deg, ${this.options.darkBg} 0%, ${this.options.surfaceBg} 50%, ${this.options.darkBg} 100%);
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }
        
        .gaming-dashboard-loader::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, ${this.options.primaryColor}10, transparent);
          animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .dashboard-loader-container {
          text-align: center;
          z-index: 1;
          position: relative;
        }
        
        /* Xbox orb animation */
        .xbox-orb-container {
          margin-bottom: 2rem;
        }
        
        .xbox-orb {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto;
        }
        
        .orb-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid;
          animation: orbRotate 4s linear infinite;
        }
        
        .orb-ring-1 {
          width: 120px;
          height: 120px;
          border-color: ${this.options.primaryColor}60;
          animation-duration: 4s;
        }
        
        .orb-ring-2 {
          width: 90px;
          height: 90px;
          top: 15px;
          left: 15px;
          border-color: ${this.options.secondaryColor}80;
          animation-duration: 3s;
          animation-direction: reverse;
        }
        
        .orb-ring-3 {
          width: 60px;
          height: 60px;
          top: 30px;
          left: 30px;
          border-color: ${this.options.accentColor}60;
          animation-duration: 2s;
        }
        
        .orb-center {
          position: absolute;
          width: 40px;
          height: 40px;
          top: 40px;
          left: 40px;
          background: radial-gradient(circle, ${this.options.primaryColor}20, transparent);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          animation: orbPulse 2s ease-in-out infinite;
        }
        
        @keyframes orbRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        
        /* Xbox loading bars */
        .xbox-loading-bars {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 2rem;
        }
        
        .loading-bar {
          width: 4px;
          height: 40px;
          background: ${this.options.surfaceBg};
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }
        
        .loading-bar::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 0%;
          background: linear-gradient(to top, ${this.options.primaryColor}, ${this.options.accentColor});
          animation: barFill 2s ease-in-out infinite;
        }
        
        .loading-bar.bar-1::after { animation-delay: 0s; }
        .loading-bar.bar-2::after { animation-delay: 0.2s; }
        .loading-bar.bar-3::after { animation-delay: 0.4s; }
        .loading-bar.bar-4::after { animation-delay: 0.6s; }
        .loading-bar.bar-5::after { animation-delay: 0.8s; }
        
        @keyframes barFill {
          0%, 100% { height: 20%; }
          50% { height: 100%; }
        }
        
        /* Loading status */
        .loading-status {
          margin-bottom: 2rem;
        }
        
        .status-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
          margin-bottom: 0.5rem;
          text-shadow: 0 0 10px ${this.options.primaryColor}40;
        }
        
        .status-subtitle {
          font-size: 1rem;
          color: #9ca3af;
          opacity: 0.8;
        }
        
        /* Progress container */
        .progress-container {
          max-width: 300px;
          margin: 0 auto;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: ${this.options.surfaceBg};
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
          position: relative;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, ${this.options.primaryColor}, ${this.options.accentColor});
          border-radius: 4px;
          width: 0%;
          transition: width 0.3s ease;
          position: relative;
        }
        
        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          right: -10px;
          width: 10px;
          height: 100%;
          background: linear-gradient(90deg, transparent, ${this.options.primaryColor}80);
          border-radius: 0 4px 4px 0;
        }
        
        .progress-text {
          text-align: center;
          font-size: 0.875rem;
          color: ${this.options.primaryColor};
          font-weight: bold;
        }

        /* Skeleton Loader */
        .gaming-skeleton-loader {
          padding: 2rem;
          background: ${this.options.surfaceBg}40;
          border-radius: 12px;
          border: 1px solid ${this.options.primaryColor}20;
        }
        
        .skeleton-header {
          display: flex;
          align-items: center;
          margin-bottom: 2rem;
          gap: 1rem;
        }
        
        .skeleton-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(
            90deg,
            ${this.options.surfaceBg} 25%,
            ${this.options.primaryColor}20 50%,
            ${this.options.surfaceBg} 75%
          );
          background-size: 200% 100%;
          flex-shrink: 0;
        }
        
        .skeleton-title-group {
          flex: 1;
        }
        
        .skeleton-line {
          height: 1rem;
          background: linear-gradient(
            90deg,
            ${this.options.surfaceBg} 25%,
            ${this.options.primaryColor}20 50%,
            ${this.options.surfaceBg} 75%
          );
          background-size: 200% 100%;
          border-radius: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .skeleton-title {
          height: 1.5rem;
          width: 60%;
          margin-bottom: 0.5rem;
        }
        
        .skeleton-subtitle {
          height: 1rem;
          width: 40%;
        }
        
        .skeleton-content .skeleton-line:last-child {
          margin-bottom: 0;
        }
        
        /* Skeleton cards */
        .skeleton-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 2rem;
        }
        
        .skeleton-card {
          background: ${this.options.darkBg}60;
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid ${this.options.primaryColor}10;
        }
        
        .skeleton-card-header {
          height: 2rem;
          background: linear-gradient(
            90deg,
            ${this.options.surfaceBg} 25%,
            ${this.options.primaryColor}20 50%,
            ${this.options.surfaceBg} 75%
          );
          background-size: 200% 100%;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .skeleton-card-content .skeleton-line {
          margin-bottom: 0.5rem;
        }
        
        .skeleton-card-content .skeleton-line:last-child {
          margin-bottom: 0;
        }

        /* Gaming Spinner Loaders */
        .gaming-spinner-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          text-align: center;
        }
        
        .spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .gaming-spinner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Spinner sizes */
        .spinner-small { width: 40px; height: 40px; }
        .spinner-medium { width: 60px; height: 60px; }
        .spinner-large { width: 80px; height: 80px; }
        
        /* Orb spinner */
        .gaming-spinner-orb .spinner-ring {
          position: absolute;
          border: 2px solid transparent;
          border-radius: 50%;
        }
        
        .gaming-spinner-orb .ring-1 {
          width: 100%;
          height: 100%;
          border-top-color: ${this.options.primaryColor};
          animation: spinClockwise 2s linear infinite;
        }
        
        .gaming-spinner-orb .ring-2 {
          width: 70%;
          height: 70%;
          border-right-color: ${this.options.secondaryColor};
          animation: spinCounterclockwise 1.5s linear infinite;
        }
        
        .gaming-spinner-orb .ring-3 {
          width: 40%;
          height: 40%;
          border-bottom-color: ${this.options.accentColor};
          animation: spinClockwise 1s linear infinite;
        }
        
        .gaming-spinner-orb .spinner-core {
          position: absolute;
          font-size: 1.2em;
          animation: corePulse 1s ease-in-out infinite;
        }
        
        @keyframes spinClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spinCounterclockwise {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes corePulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        
        /* Gear spinner */
        .gaming-spinner-gear {
          position: relative;
        }
        
        .gear {
          position: absolute;
          font-size: 2em;
        }
        
        .gear-outer {
          animation: spinClockwise 3s linear infinite;
        }
        
        .gear-inner {
          font-size: 1.2em;
          animation: spinCounterclockwise 2s linear infinite;
        }
        
        /* Portal spinner */
        .gaming-spinner-portal .portal-ring {
          position: absolute;
          border: 2px solid;
          border-radius: 50%;
          opacity: 0;
          animation: portalRipple 2s ease-out infinite;
        }
        
        .portal-ring-1 {
          width: 100%;
          height: 100%;
          border-color: ${this.options.primaryColor};
          animation-delay: 0s;
        }
        
        .portal-ring-2 {
          width: 70%;
          height: 70%;
          border-color: ${this.options.secondaryColor};
          animation-delay: 0.7s;
        }
        
        .portal-ring-3 {
          width: 40%;
          height: 40%;
          border-color: ${this.options.accentColor};
          animation-delay: 1.4s;
        }
        
        .portal-center {
          position: absolute;
          font-size: 1.5em;
          animation: portalCore 2s ease-in-out infinite;
        }
        
        @keyframes portalRipple {
          0% {
            opacity: 1;
            transform: scale(0.5);
          }
          100% {
            opacity: 0;
            transform: scale(1.5);
          }
        }
        
        @keyframes portalCore {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
        }
        
        /* Matrix spinner */
        .gaming-spinner-matrix .matrix-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          gap: 2px;
          width: 100%;
          height: 100%;
        }
        
        .matrix-pixel {
          background: ${this.options.primaryColor};
          border-radius: 1px;
          animation: matrixBlink 1.5s infinite;
        }
        
        .matrix-pixel-1 { animation-delay: 0s; }
        .matrix-pixel-2 { animation-delay: 0.1s; }
        .matrix-pixel-3 { animation-delay: 0.2s; }
        .matrix-pixel-4 { animation-delay: 0.3s; }
        .matrix-pixel-5 { animation-delay: 0.4s; }
        .matrix-pixel-6 { animation-delay: 0.5s; }
        .matrix-pixel-7 { animation-delay: 0.6s; }
        .matrix-pixel-8 { animation-delay: 0.7s; }
        .matrix-pixel-9 { animation-delay: 0.8s; }
        
        @keyframes matrixBlink {
          0%, 50% { opacity: 1; transform: scale(1); }
          51%, 100% { opacity: 0.3; transform: scale(0.8); }
        }
        
        /* Spinner message and dots */
        .spinner-message {
          font-size: 1rem;
          color: ${this.options.primaryColor};
          font-weight: 500;
        }
        
        .spinner-dots {
          display: flex;
          gap: 0.25rem;
        }
        
        .spinner-dots .dot {
          color: ${this.options.primaryColor};
          animation: dotBounce 1.4s ease-in-out infinite both;
        }
        
        .dot-1 { animation-delay: 0s; }
        .dot-2 { animation-delay: 0.2s; }
        .dot-3 { animation-delay: 0.4s; }
        
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(1) translateY(0); opacity: 0.6; }
          40% { transform: scale(1.2) translateY(-10px); opacity: 1; }
        }

        /* Progress Loader */
        .gaming-progress-loader {
          padding: 2rem;
          background: ${this.options.surfaceBg}60;
          border-radius: 12px;
          border: 1px solid ${this.options.primaryColor}30;
          text-align: center;
          min-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .progress-loader-container {
          max-width: 400px;
          width: 100%;
        }
        
        .progress-header {
          margin-bottom: 2rem;
        }
        
        .progress-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
          margin-bottom: 0.5rem;
          text-shadow: 0 0 10px ${this.options.primaryColor}30;
        }
        
        .progress-subtitle {
          font-size: 1rem;
          color: #9ca3af;
          opacity: 0.9;
        }
        
        .progress-bar-container {
          margin-bottom: 2rem;
          position: relative;
        }
        
        .progress-track {
          width: 100%;
          height: 12px;
          background: ${this.options.darkBg};
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          border: 1px solid ${this.options.primaryColor}20;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, 
            ${this.options.primaryColor}, 
            ${this.options.accentColor}, 
            ${this.options.primaryColor}
          );
          background-size: 200% 100%;
          border-radius: 6px;
          width: 0%;
          transition: width 0.5s ease;
          position: relative;
        }
        
        .progress-fill.animated {
          animation: progressGlow 2s ease-in-out infinite;
        }
        
        @keyframes progressGlow {
          0%, 100% { 
            background-position: 0% 50%;
            box-shadow: 0 0 10px ${this.options.primaryColor}40;
          }
          50% { 
            background-position: 100% 50%;
            box-shadow: 0 0 20px ${this.options.primaryColor}60;
          }
        }
        
        .progress-glow {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(90deg, transparent, ${this.options.primaryColor}20, transparent);
          border-radius: 8px;
          opacity: 0.5;
          animation: progressSweep 3s linear infinite;
        }
        
        @keyframes progressSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .progress-percentage {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 1rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
          text-shadow: 0 0 5px ${this.options.primaryColor}40;
        }
        
        /* Progress steps */
        .progress-steps {
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          text-align: left;
        }
        
        .progress-step {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: ${this.options.darkBg}40;
          border-radius: 8px;
          border-left: 3px solid transparent;
          transition: all 0.3s ease;
        }
        
        .progress-step.step-active {
          border-left-color: ${this.options.accentColor};
          background: ${this.options.accentColor}10;
        }
        
        .progress-step.step-completed {
          border-left-color: ${this.options.primaryColor};
          background: ${this.options.primaryColor}10;
        }
        
        .step-indicator {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${this.options.surfaceBg};
          border: 2px solid #4b5563;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        
        .step-completed .step-indicator {
          background: ${this.options.primaryColor};
          border-color: ${this.options.primaryColor};
        }
        
        .step-active .step-indicator {
          background: ${this.options.accentColor};
          border-color: ${this.options.accentColor};
          animation: stepPulse 2s ease-in-out infinite;
        }
        
        @keyframes stepPulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 ${this.options.accentColor}40;
          }
          50% { 
            box-shadow: 0 0 0 8px ${this.options.accentColor}20;
          }
        }
        
        .step-number {
          font-size: 0.875rem;
          font-weight: bold;
          color: white;
        }
        
        .step-completed .step-number::after {
          content: '✓';
        }
        
        .step-completed .step-number {
          font-size: 0;
        }
        
        .step-label {
          font-size: 0.875rem;
          color: #d1d5db;
          flex: 1;
        }
        
        .step-active .step-label {
          color: ${this.options.accentColor};
          font-weight: 500;
        }
        
        .step-completed .step-label {
          color: ${this.options.primaryColor};
        }
        
        .progress-status {
          font-size: 0.875rem;
          color: ${this.options.accentColor};
          font-weight: 500;
          opacity: 0.9;
        }

        /* Pulse Loader */
        .gaming-pulse-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 150px;
          text-align: center;
        }
        
        .pulse-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .pulse-indicator {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .pulse-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
        }
        
        .pulse-square {
          width: 60px;
          height: 60px;
          border-radius: 8px;
        }
        
        .pulse-diamond {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          transform: rotate(45deg);
        }
        
        .pulse-core {
          position: absolute;
          width: 20px;
          height: 20px;
          background: ${this.options.primaryColor};
          border-radius: inherit;
          z-index: 3;
        }
        
        .pulse-wave {
          position: absolute;
          border: 2px solid ${this.options.primaryColor};
          border-radius: inherit;
          opacity: 0;
        }
        
        .pulse-low .pulse-wave { animation: pulseWave 3s ease-out infinite; }
        .pulse-medium .pulse-wave { animation: pulseWave 2s ease-out infinite; }
        .pulse-high .pulse-wave { animation: pulseWave 1s ease-out infinite; }
        
        .pulse-wave-1 {
          width: 100%;
          height: 100%;
          animation-delay: 0s;
        }
        
        .pulse-wave-2 {
          width: 100%;
          height: 100%;
          animation-delay: 0.7s;
        }
        
        .pulse-wave-3 {
          width: 100%;
          height: 100%;
          animation-delay: 1.4s;
        }
        
        @keyframes pulseWave {
          0% {
            opacity: 1;
            transform: scale(0.5);
          }
          100% {
            opacity: 0;
            transform: scale(2);
          }
        }
        
        .pulse-message {
          font-size: 1rem;
          color: ${this.options.primaryColor};
          font-weight: 500;
        }
        
        .pulse-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #9ca3af;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          background: ${this.options.primaryColor};
          border-radius: 50%;
          animation: statusBlink 2s ease-in-out infinite;
        }
        
        @keyframes statusBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* Error State */
        .gaming-error-state {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 2rem;
        }
        
        .error-container {
          text-align: center;
          max-width: 500px;
          padding: 2rem;
          background: ${this.options.surfaceBg}80;
          border-radius: 12px;
          border: 1px solid ${this.options.errorColor}30;
          position: relative;
        }
        
        .error-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, ${this.options.errorColor}05, transparent, ${this.options.errorColor}05);
          border-radius: 12px;
          pointer-events: none;
        }
        
        .error-icon {
          position: relative;
          margin-bottom: 2rem;
          display: inline-block;
        }
        
        .error-symbol {
          font-size: 4rem;
          display: block;
          position: relative;
          z-index: 2;
        }
        
        .error-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          border: 2px solid ${this.options.errorColor};
          border-radius: 50%;
          opacity: 0;
          animation: errorPulse 2s ease-out infinite;
        }
        
        @keyframes errorPulse {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.5);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.5);
          }
        }
        
        .error-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${this.options.errorColor};
          margin-bottom: 1rem;
          text-shadow: 0 0 10px ${this.options.errorColor}30;
        }
        
        .error-message {
          font-size: 1rem;
          color: #d1d5db;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        
        .error-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .error-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          text-decoration: none;
        }
        
        .error-btn-primary {
          background: ${this.options.accentColor};
          color: white;
        }
        
        .error-btn-primary:hover {
          background: ${this.options.accentColor}dd;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${this.options.accentColor}30;
        }
        
        .error-btn-secondary {
          background: ${this.options.primaryColor};
          color: ${this.options.darkBg};
        }
        
        .error-btn-secondary:hover {
          background: ${this.options.primaryColor}dd;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${this.options.primaryColor}30;
        }
        
        .error-btn-tertiary {
          background: ${this.options.surfaceBg};
          color: #d1d5db;
          border: 1px solid #4b5563;
        }
        
        .error-btn-tertiary:hover {
          background: #374151;
          border-color: #6b7280;
          transform: translateY(-1px);
        }
        
        .btn-icon {
          font-size: 1rem;
        }
        
        .btn-text {
          font-size: 0.875rem;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .gaming-dashboard-loader {
            min-height: 300px;
          }
          
          .xbox-orb {
            width: 80px;
            height: 80px;
          }
          
          .orb-ring-1 {
            width: 80px;
            height: 80px;
          }
          
          .orb-ring-2 {
            width: 60px;
            height: 60px;
            top: 10px;
            left: 10px;
          }
          
          .orb-ring-3 {
            width: 40px;
            height: 40px;
            top: 20px;
            left: 20px;
          }
          
          .orb-center {
            width: 25px;
            height: 25px;
            top: 27px;
            left: 27px;
            font-size: 14px;
          }
          
          .status-title {
            font-size: 1.25rem;
          }
          
          .skeleton-cards {
            grid-template-columns: 1fr;
          }
          
          .progress-steps {
            text-align: center;
          }
          
          .progress-step {
            flex-direction: column;
            text-align: center;
            gap: 0.5rem;
          }
          
          .error-actions {
            gap: 0.5rem;
          }
        }
      </style>
    `;
    
    const existingStyles = document.getElementById('gaming-loading-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }
}

// Initialize global gaming loader instance
if (typeof window !== 'undefined') {
  window.gamingLoader = new GamingLoadingStates();
  
  // Handle retry function globally
  window.gamingLoader.handleRetry = function(loaderId, hasCallback) {
    this.handleRetry(loaderId, hasCallback);
  }.bind(window.gamingLoader);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GamingLoadingStates;
}

console.log('🎮 Gaming Loading States component loaded successfully!');