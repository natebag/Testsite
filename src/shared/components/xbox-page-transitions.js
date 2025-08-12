/**
 * Xbox 360-Style Page Transitions for MLG.clan Platform
 * Advanced page transitions with gaming aesthetics and smooth animations
 */

class XboxPageTransitions {
  constructor(options = {}) {
    this.options = {
      primaryColor: '#00ff88',
      secondaryColor: '#8b5cf6', 
      accentColor: '#3b82f6',
      darkBg: '#0a0a0f',
      surfaceBg: '#1a1a2e',
      transitionDuration: 600,
      easingFunction: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
      enableSounds: false, // For future audio implementation
      enableParallax: true,
      enablePreloader: true,
      debugMode: false,
      ...options
    };
    
    this.activeTransitions = new Map();
    this.transitionQueue = [];
    this.isTransitioning = false;
    this.currentPage = null;
    this.previousPage = null;
    
    this.init();
  }

  init() {
    this.injectStyles();
    this.setupGlobalTransitionContainer();
    console.log('🎮 Xbox Page Transitions initialized');
  }

  /**
   * Execute Xbox 360-style blade transition
   * @param {string} direction - 'left', 'right', 'up', 'down'
   * @param {HTMLElement} container - Target container
   * @param {string} newContent - New page content
   * @param {Object} options - Transition options
   */
  async executeBladeTransition(direction, container, newContent, options = {}) {
    const transitionId = this.generateTransitionId();
    const duration = options.duration || this.options.transitionDuration;
    
    if (this.isTransitioning) {
      return this.queueTransition('blade', { direction, container, newContent, options });
    }
    
    this.isTransitioning = true;
    this.activeTransitions.set(transitionId, { type: 'blade', startTime: Date.now() });
    
    try {
      // Show loading overlay
      if (this.options.enablePreloader) {
        this.showTransitionPreloader(container, 'Loading page...');
      }
      
      // Create blade transition elements
      const bladeContainer = document.createElement('div');
      bladeContainer.className = 'xbox-blade-transition';
      bladeContainer.innerHTML = `
        <div class="blade-background"></div>
        <div class="blade-content-wrapper">
          <div class="blade-current-content">${container.innerHTML}</div>
          <div class="blade-new-content">${newContent}</div>
        </div>
        <div class="blade-overlay">
          <div class="blade-glow"></div>
          <div class="blade-particles">
            ${this.generateParticles(12)}
          </div>
        </div>
      `;
      
      // Set initial positions based on direction
      const transforms = this.getBladeTransforms(direction);
      const currentContent = bladeContainer.querySelector('.blade-current-content');
      const newContentElement = bladeContainer.querySelector('.blade-new-content');
      const overlay = bladeContainer.querySelector('.blade-overlay');
      
      // Initial state
      newContentElement.style.transform = transforms.newInitial;
      overlay.style.opacity = '0';
      
      // Replace container content
      container.innerHTML = '';
      container.appendChild(bladeContainer);
      
      // Execute transition
      await this.animateBladeTransition(
        currentContent,
        newContentElement,
        overlay,
        transforms,
        duration
      );
      
      // Cleanup and finalize
      container.innerHTML = newContent;
      
      // Add page loaded effects
      this.addPageLoadedEffects(container);
      
    } catch (error) {
      console.error('Blade transition error:', error);
      container.innerHTML = newContent;
    } finally {
      this.isTransitioning = false;
      this.activeTransitions.delete(transitionId);
      this.processTransitionQueue();
    }
  }

  /**
   * Execute Xbox Guide-style slide transition
   * @param {HTMLElement} container - Target container
   * @param {string} newContent - New page content
   * @param {Object} options - Transition options
   */
  async executeGuideTransition(container, newContent, options = {}) {
    const transitionId = this.generateTransitionId();
    const duration = options.duration || this.options.transitionDuration;
    
    if (this.isTransitioning) {
      return this.queueTransition('guide', { container, newContent, options });
    }
    
    this.isTransitioning = true;
    this.activeTransitions.set(transitionId, { type: 'guide', startTime: Date.now() });
    
    try {
      // Create guide transition
      const guideContainer = document.createElement('div');
      guideContainer.className = 'xbox-guide-transition';
      guideContainer.innerHTML = `
        <div class="guide-background">
          <div class="guide-pattern"></div>
        </div>
        <div class="guide-panel guide-panel-current">
          <div class="panel-content">${container.innerHTML}</div>
          <div class="panel-glow"></div>
        </div>
        <div class="guide-panel guide-panel-new">
          <div class="panel-content">${newContent}</div>
          <div class="panel-glow"></div>
        </div>
        <div class="guide-orb">
          <div class="orb-rings">
            <div class="orb-ring orb-ring-1"></div>
            <div class="orb-ring orb-ring-2"></div>
            <div class="orb-ring orb-ring-3"></div>
          </div>
          <div class="orb-center">🎮</div>
        </div>
      `;
      
      const currentPanel = guideContainer.querySelector('.guide-panel-current');
      const newPanel = guideContainer.querySelector('.guide-panel-new');
      const orb = guideContainer.querySelector('.guide-orb');
      
      // Initial positions
      newPanel.style.transform = 'translateX(100%)';
      orb.style.opacity = '0';
      
      container.innerHTML = '';
      container.appendChild(guideContainer);
      
      // Execute guide animation
      await this.animateGuideTransition(currentPanel, newPanel, orb, duration);
      
      // Finalize
      container.innerHTML = newContent;
      this.addPageLoadedEffects(container);
      
    } catch (error) {
      console.error('Guide transition error:', error);
      container.innerHTML = newContent;
    } finally {
      this.isTransitioning = false;
      this.activeTransitions.delete(transitionId);
      this.processTransitionQueue();
    }
  }

  /**
   * Execute gaming-themed particle transition
   * @param {HTMLElement} container - Target container
   * @param {string} newContent - New page content
   * @param {Object} options - Transition options
   */
  async executeParticleTransition(container, newContent, options = {}) {
    const transitionId = this.generateTransitionId();
    const duration = options.duration || this.options.transitionDuration;
    const particleCount = options.particles || 50;
    
    if (this.isTransitioning) {
      return this.queueTransition('particle', { container, newContent, options });
    }
    
    this.isTransitioning = true;
    this.activeTransitions.set(transitionId, { type: 'particle', startTime: Date.now() });
    
    try {
      const particleContainer = document.createElement('div');
      particleContainer.className = 'xbox-particle-transition';
      particleContainer.innerHTML = `
        <div class="particle-background"></div>
        <div class="particle-content particle-content-current">${container.innerHTML}</div>
        <div class="particle-content particle-content-new">${newContent}</div>
        <div class="particle-system">
          ${this.generateParticles(particleCount, 'gaming')}
        </div>
        <div class="particle-vortex">
          <div class="vortex-ring vortex-ring-1"></div>
          <div class="vortex-ring vortex-ring-2"></div>
          <div class="vortex-ring vortex-ring-3"></div>
        </div>
      `;
      
      const currentContent = particleContainer.querySelector('.particle-content-current');
      const newContentElement = particleContainer.querySelector('.particle-content-new');
      const particleSystem = particleContainer.querySelector('.particle-system');
      const vortex = particleContainer.querySelector('.particle-vortex');
      
      // Initial state
      newContentElement.style.opacity = '0';
      newContentElement.style.transform = 'scale(0.8) rotateY(90deg)';
      vortex.style.opacity = '0';
      
      container.innerHTML = '';
      container.appendChild(particleContainer);
      
      // Animate particles and transition
      await this.animateParticleTransition(
        currentContent,
        newContentElement,
        particleSystem,
        vortex,
        duration
      );
      
      container.innerHTML = newContent;
      this.addPageLoadedEffects(container);
      
    } catch (error) {
      console.error('Particle transition error:', error);
      container.innerHTML = newContent;
    } finally {
      this.isTransitioning = false;
      this.activeTransitions.delete(transitionId);
      this.processTransitionQueue();
    }
  }

  /**
   * Execute holographic transition effect
   * @param {HTMLElement} container - Target container  
   * @param {string} newContent - New page content
   * @param {Object} options - Transition options
   */
  async executeHolographicTransition(container, newContent, options = {}) {
    const transitionId = this.generateTransitionId();
    const duration = options.duration || this.options.transitionDuration;
    
    if (this.isTransitioning) {
      return this.queueTransition('holographic', { container, newContent, options });
    }
    
    this.isTransitioning = true;
    this.activeTransitions.set(transitionId, { type: 'holographic', startTime: Date.now() });
    
    try {
      const holoContainer = document.createElement('div');
      holoContainer.className = 'xbox-holographic-transition';
      holoContainer.innerHTML = `
        <div class="holo-background">
          <div class="holo-grid"></div>
          <div class="holo-scanlines"></div>
        </div>
        <div class="holo-content holo-content-current">${container.innerHTML}</div>
        <div class="holo-content holo-content-new">${newContent}</div>
        <div class="holo-effects">
          <div class="holo-glitch"></div>
          <div class="holo-flicker"></div>
          <div class="holo-noise"></div>
        </div>
      `;
      
      const currentContent = holoContainer.querySelector('.holo-content-current');
      const newContentElement = holoContainer.querySelector('.holo-content-new');
      const effects = holoContainer.querySelector('.holo-effects');
      
      // Initial state
      newContentElement.style.opacity = '0';
      newContentElement.style.filter = 'blur(10px) hue-rotate(90deg)';
      effects.style.opacity = '0';
      
      container.innerHTML = '';
      container.appendChild(holoContainer);
      
      // Execute holographic animation
      await this.animateHolographicTransition(
        currentContent,
        newContentElement,
        effects,
        duration
      );
      
      container.innerHTML = newContent;
      this.addPageLoadedEffects(container);
      
    } catch (error) {
      console.error('Holographic transition error:', error);
      container.innerHTML = newContent;
    } finally {
      this.isTransitioning = false;
      this.activeTransitions.delete(transitionId);
      this.processTransitionQueue();
    }
  }

  // Animation helper methods
  async animateBladeTransition(currentContent, newContent, overlay, transforms, duration) {
    return new Promise(resolve => {
      // Phase 1: Show overlay and start blade movement
      overlay.style.transition = `opacity ${duration/3}ms ${this.options.easingFunction}`;
      overlay.style.opacity = '1';
      
      setTimeout(() => {
        // Phase 2: Blade content transition
        const transitionCSS = `transform ${duration/2}ms ${this.options.easingFunction}`;
        currentContent.style.transition = transitionCSS;
        newContent.style.transition = transitionCSS;
        
        currentContent.style.transform = transforms.currentFinal;
        newContent.style.transform = transforms.newFinal;
        
        setTimeout(() => {
          // Phase 3: Hide overlay
          overlay.style.opacity = '0';
          
          setTimeout(resolve, duration/3);
        }, duration/2);
      }, duration/3);
    });
  }

  async animateGuideTransition(currentPanel, newPanel, orb, duration) {
    return new Promise(resolve => {
      // Show orb
      orb.style.transition = `opacity ${duration/4}ms ease-out`;
      orb.style.opacity = '1';
      
      setTimeout(() => {
        // Slide panels
        const transitionCSS = `transform ${duration/2}ms ${this.options.easingFunction}`;
        currentPanel.style.transition = transitionCSS;
        newPanel.style.transition = transitionCSS;
        
        currentPanel.style.transform = 'translateX(-100%)';
        newPanel.style.transform = 'translateX(0)';
        
        setTimeout(() => {
          // Hide orb
          orb.style.opacity = '0';
          setTimeout(resolve, duration/4);
        }, duration/2);
      }, duration/4);
    });
  }

  async animateParticleTransition(currentContent, newContent, particles, vortex, duration) {
    return new Promise(resolve => {
      // Show vortex and particles
      vortex.style.transition = `opacity ${duration/3}ms ease-out`;
      vortex.style.opacity = '1';
      
      // Animate particles
      const particleElements = particles.querySelectorAll('.particle');
      particleElements.forEach((particle, index) => {
        setTimeout(() => {
          particle.classList.add('particle-active');
        }, index * 50);
      });
      
      setTimeout(() => {
        // Content transition
        const contentTransition = `all ${duration/2}ms ${this.options.easingFunction}`;
        currentContent.style.transition = contentTransition;
        newContent.style.transition = contentTransition;
        
        currentContent.style.opacity = '0';
        currentContent.style.transform = 'scale(0.8) rotateY(-90deg)';
        
        newContent.style.opacity = '1';
        newContent.style.transform = 'scale(1) rotateY(0deg)';
        
        setTimeout(() => {
          vortex.style.opacity = '0';
          setTimeout(resolve, duration/3);
        }, duration/2);
      }, duration/3);
    });
  }

  async animateHolographicTransition(currentContent, newContent, effects, duration) {
    return new Promise(resolve => {
      // Show effects
      effects.style.transition = `opacity ${duration/4}ms ease-out`;
      effects.style.opacity = '1';
      
      setTimeout(() => {
        // Glitch transition
        const transitionCSS = `all ${duration/2}ms ${this.options.easingFunction}`;
        currentContent.style.transition = transitionCSS;
        newContent.style.transition = transitionCSS;
        
        currentContent.style.opacity = '0';
        currentContent.style.filter = 'blur(10px) hue-rotate(-90deg)';
        
        newContent.style.opacity = '1';
        newContent.style.filter = 'blur(0px) hue-rotate(0deg)';
        
        setTimeout(() => {
          effects.style.opacity = '0';
          setTimeout(resolve, duration/4);
        }, duration/2);
      }, duration/4);
    });
  }

  // Utility methods
  getBladeTransforms(direction) {
    const transforms = {
      left: {
        newInitial: 'translateX(100%)',
        newFinal: 'translateX(0)',
        currentFinal: 'translateX(-100%)'
      },
      right: {
        newInitial: 'translateX(-100%)',
        newFinal: 'translateX(0)',
        currentFinal: 'translateX(100%)'
      },
      up: {
        newInitial: 'translateY(100%)',
        newFinal: 'translateY(0)',
        currentFinal: 'translateY(-100%)'
      },
      down: {
        newInitial: 'translateY(-100%)',
        newFinal: 'translateY(0)',
        currentFinal: 'translateY(100%)'
      }
    };
    
    return transforms[direction] || transforms.right;
  }

  generateParticles(count, type = 'standard') {
    let particles = '';
    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 2;
      const duration = 2 + Math.random() * 3;
      const size = type === 'gaming' ? Math.random() * 6 + 2 : Math.random() * 4 + 1;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      
      particles += `
        <div class="particle particle-${type}" 
             style="
               left: ${x}%; 
               top: ${y}%; 
               width: ${size}px; 
               height: ${size}px;
               animation-delay: ${delay}s;
               animation-duration: ${duration}s;
             "></div>
      `;
    }
    return particles;
  }

  showTransitionPreloader(container, message) {
    const preloader = document.createElement('div');
    preloader.className = 'xbox-transition-preloader';
    preloader.innerHTML = `
      <div class="preloader-content">
        <div class="preloader-orb">
          <div class="orb-ring"></div>
          <div class="orb-center">🎮</div>
        </div>
        <div class="preloader-message">${message}</div>
      </div>
    `;
    
    container.appendChild(preloader);
    
    // Remove preloader after a short delay
    setTimeout(() => {
      if (preloader.parentNode) {
        preloader.remove();
      }
    }, this.options.transitionDuration);
  }

  addPageLoadedEffects(container) {
    // Add subtle entrance animation to new content
    const elements = container.querySelectorAll('*');
    elements.forEach((element, index) => {
      if (index < 10) { // Limit to first 10 elements for performance
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.4s ease-out';
        
        setTimeout(() => {
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
        }, index * 50);
      }
    });
    
    // Clean up styles after animation
    setTimeout(() => {
      elements.forEach(element => {
        element.style.opacity = '';
        element.style.transform = '';
        element.style.transition = '';
      });
    }, 2000);
  }

  generateTransitionId() {
    return 'xbox-transition-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  queueTransition(type, params) {
    this.transitionQueue.push({ type, params });
    return Promise.resolve();
  }

  async processTransitionQueue() {
    if (this.transitionQueue.length === 0 || this.isTransitioning) return;
    
    const next = this.transitionQueue.shift();
    
    switch (next.type) {
      case 'blade':
        await this.executeBladeTransition(
          next.params.direction,
          next.params.container,
          next.params.newContent,
          next.params.options
        );
        break;
      case 'guide':
        await this.executeGuideTransition(
          next.params.container,
          next.params.newContent,
          next.params.options
        );
        break;
      case 'particle':
        await this.executeParticleTransition(
          next.params.container,
          next.params.newContent,
          next.params.options
        );
        break;
      case 'holographic':
        await this.executeHolographicTransition(
          next.params.container,
          next.params.newContent,
          next.params.options
        );
        break;
    }
  }

  setupGlobalTransitionContainer() {
    // Add a global transition overlay if needed
    if (!document.getElementById('xbox-transition-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'xbox-transition-overlay';
      overlay.className = 'xbox-global-overlay';
      document.body.appendChild(overlay);
    }
  }

  /**
   * Inject CSS styles for Xbox transitions
   */
  injectStyles() {
    const styles = `
      <style id="xbox-transitions-styles">
        /* Global transition overlay */
        .xbox-global-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 9999;
          background: transparent;
        }
        
        /* Xbox Blade Transition */
        .xbox-blade-transition {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: ${this.options.darkBg};
        }
        
        .blade-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, ${this.options.darkBg}, ${this.options.surfaceBg}, ${this.options.darkBg});
          opacity: 0.9;
        }
        
        .blade-content-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .blade-current-content,
        .blade-new-content {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: ${this.options.surfaceBg}90;
          backdrop-filter: blur(10px);
        }
        
        .blade-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, ${this.options.primaryColor}20, transparent, ${this.options.secondaryColor}20);
          pointer-events: none;
          z-index: 10;
        }
        
        .blade-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, ${this.options.primaryColor}30, transparent);
          border-radius: 50%;
          animation: bladeGlow 2s ease-in-out infinite;
        }
        
        @keyframes bladeGlow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
        }
        
        /* Xbox Guide Transition */
        .xbox-guide-transition {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: ${this.options.darkBg};
        }
        
        .guide-background {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, ${this.options.darkBg}, ${this.options.surfaceBg}80, ${this.options.darkBg});
        }
        
        .guide-pattern {
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(45deg, ${this.options.primaryColor}05 25%, transparent 25%),
            linear-gradient(-45deg, ${this.options.primaryColor}05 25%, transparent 25%);
          background-size: 40px 40px;
          animation: patternMove 20s linear infinite;
        }
        
        @keyframes patternMove {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 40px 40px, -40px 40px; }
        }
        
        .guide-panel {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: ${this.options.surfaceBg}95;
          border-left: 4px solid ${this.options.primaryColor};
          backdrop-filter: blur(15px);
        }
        
        .panel-content {
          padding: 2rem;
          height: 100%;
          overflow-y: auto;
        }
        
        .panel-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(to bottom, 
            transparent, 
            ${this.options.primaryColor}, 
            ${this.options.accentColor}, 
            ${this.options.primaryColor}, 
            transparent
          );
          animation: panelGlow 3s ease-in-out infinite;
        }
        
        @keyframes panelGlow {
          0%, 100% { opacity: 0.5; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.2); }
        }
        
        .guide-orb {
          position: absolute;
          top: 2rem;
          right: 2rem;
          width: 60px;
          height: 60px;
          z-index: 20;
        }
        
        .orb-rings {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .orb-ring {
          position: absolute;
          border: 2px solid;
          border-radius: 50%;
          animation: orbSpin 4s linear infinite;
        }
        
        .orb-ring-1 {
          width: 100%;
          height: 100%;
          border-color: ${this.options.primaryColor}60;
        }
        
        .orb-ring-2 {
          width: 70%;
          height: 70%;
          top: 15%;
          left: 15%;
          border-color: ${this.options.secondaryColor}80;
          animation-duration: 3s;
          animation-direction: reverse;
        }
        
        .orb-ring-3 {
          width: 40%;
          height: 40%;
          top: 30%;
          left: 30%;
          border-color: ${this.options.accentColor}60;
          animation-duration: 2s;
        }
        
        .orb-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
          z-index: 2;
        }
        
        @keyframes orbSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Particle Transition */
        .xbox-particle-transition {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: ${this.options.darkBg};
        }
        
        .particle-background {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center, ${this.options.surfaceBg}60, ${this.options.darkBg});
        }
        
        .particle-content {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: ${this.options.surfaceBg}70;
          backdrop-filter: blur(5px);
        }
        
        .particle-system {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 15;
        }
        
        .particle {
          position: absolute;
          background: ${this.options.primaryColor};
          border-radius: 50%;
          opacity: 0;
          transition: all 0.3s ease-out;
        }
        
        .particle-standard {
          animation: particleFloat 4s ease-in-out infinite;
        }
        
        .particle-gaming {
          background: linear-gradient(45deg, ${this.options.primaryColor}, ${this.options.accentColor});
          animation: particleGaming 3s ease-in-out infinite;
        }
        
        .particle-active {
          opacity: 0.8;
          transform: scale(1);
        }
        
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
        }
        
        @keyframes particleGaming {
          0%, 100% { 
            transform: scale(1) rotate(0deg); 
            opacity: 0.6;
            box-shadow: 0 0 10px ${this.options.primaryColor}40;
          }
          50% { 
            transform: scale(1.5) rotate(180deg); 
            opacity: 1;
            box-shadow: 0 0 20px ${this.options.primaryColor}60;
          }
        }
        
        .particle-vortex {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 150px;
          height: 150px;
          z-index: 10;
        }
        
        .vortex-ring {
          position: absolute;
          border: 2px solid;
          border-radius: 50%;
          opacity: 0.6;
        }
        
        .vortex-ring-1 {
          width: 100%;
          height: 100%;
          border-color: ${this.options.primaryColor};
          animation: vortexSpin 2s linear infinite;
        }
        
        .vortex-ring-2 {
          width: 70%;
          height: 70%;
          top: 15%;
          left: 15%;
          border-color: ${this.options.secondaryColor};
          animation: vortexSpin 1.5s linear infinite reverse;
        }
        
        .vortex-ring-3 {
          width: 40%;
          height: 40%;
          top: 30%;
          left: 30%;
          border-color: ${this.options.accentColor};
          animation: vortexSpin 1s linear infinite;
        }
        
        @keyframes vortexSpin {
          from { transform: rotate(0deg) scale(1); }
          to { transform: rotate(360deg) scale(1.1); }
        }
        
        /* Holographic Transition */
        .xbox-holographic-transition {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: ${this.options.darkBg};
        }
        
        .holo-background {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, ${this.options.darkBg}, ${this.options.surfaceBg}80);
        }
        
        .holo-grid {
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(${this.options.primaryColor}20 1px, transparent 1px),
            linear-gradient(90deg, ${this.options.primaryColor}20 1px, transparent 1px);
          background-size: 20px 20px;
          animation: gridMove 10s linear infinite;
        }
        
        @keyframes gridMove {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 20px 20px, 20px 20px; }
        }
        
        .holo-scanlines {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            transparent 50%,
            ${this.options.primaryColor}10 50%
          );
          background-size: 100% 4px;
          animation: scanlines 2s linear infinite;
        }
        
        @keyframes scanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }
        
        .holo-content {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: ${this.options.surfaceBg}85;
          backdrop-filter: blur(8px);
        }
        
        .holo-effects {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10;
        }
        
        .holo-glitch {
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, 
            transparent 30%, 
            ${this.options.primaryColor}10 32%, 
            transparent 34%,
            transparent 60%,
            ${this.options.secondaryColor}10 62%,
            transparent 64%
          );
          animation: glitchMove 3s ease-in-out infinite;
        }
        
        @keyframes glitchMove {
          0%, 100% { transform: translateX(-100%); opacity: 0; }
          50% { transform: translateX(100%); opacity: 1; }
        }
        
        .holo-flicker {
          position: absolute;
          width: 100%;
          height: 100%;
          background: ${this.options.primaryColor}05;
          animation: holoFlicker 0.1s ease-in-out infinite alternate;
        }
        
        @keyframes holoFlicker {
          0% { opacity: 0.95; }
          100% { opacity: 1; }
        }
        
        .holo-noise {
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 50%, transparent 20%, ${this.options.primaryColor}03 21%),
            radial-gradient(circle at 80% 20%, transparent 20%, ${this.options.accentColor}03 21%),
            radial-gradient(circle at 40% 80%, transparent 20%, ${this.options.secondaryColor}03 21%);
          animation: noiseMove 4s linear infinite;
        }
        
        @keyframes noiseMove {
          0% { background-position: 0 0, 0 0, 0 0; }
          100% { background-position: 100px 100px, -100px 50px, 50px -100px; }
        }
        
        /* Xbox Transition Preloader */
        .xbox-transition-preloader {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: ${this.options.darkBg}90;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          backdrop-filter: blur(10px);
        }
        
        .preloader-content {
          text-align: center;
        }
        
        .preloader-orb {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
        }
        
        .preloader-orb .orb-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid ${this.options.primaryColor}40;
          border-top-color: ${this.options.primaryColor};
          border-radius: 50%;
          animation: preloaderSpin 1s linear infinite;
        }
        
        .preloader-orb .orb-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 2rem;
          animation: preloaderPulse 2s ease-in-out infinite;
        }
        
        @keyframes preloaderSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes preloaderPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }
        
        .preloader-message {
          color: ${this.options.primaryColor};
          font-size: 1rem;
          font-weight: 500;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .guide-orb {
            width: 40px;
            height: 40px;
            top: 1rem;
            right: 1rem;
          }
          
          .orb-center {
            font-size: 1rem;
          }
          
          .particle-vortex {
            width: 100px;
            height: 100px;
          }
          
          .preloader-orb {
            width: 60px;
            height: 60px;
          }
          
          .preloader-orb .orb-center {
            font-size: 1.5rem;
          }
        }
        
        /* Performance optimizations */
        .xbox-blade-transition *,
        .xbox-guide-transition *,
        .xbox-particle-transition *,
        .xbox-holographic-transition * {
          will-change: transform, opacity;
          backface-visibility: hidden;
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .xbox-blade-transition,
          .xbox-guide-transition,
          .xbox-particle-transition,
          .xbox-holographic-transition {
            animation: none;
            transition: opacity 0.3s ease;
          }
          
          .particle,
          .orb-ring,
          .vortex-ring {
            animation: none;
          }
        }
      </style>
    `;
    
    // Remove existing styles if present
    const existingStyles = document.getElementById('xbox-transitions-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }

  // Public API methods
  blade(direction, container, newContent, options = {}) {
    return this.executeBladeTransition(direction, container, newContent, options);
  }

  guide(container, newContent, options = {}) {
    return this.executeGuideTransition(container, newContent, options);
  }

  particle(container, newContent, options = {}) {
    return this.executeParticleTransition(container, newContent, options);
  }

  holographic(container, newContent, options = {}) {
    return this.executeHolographicTransition(container, newContent, options);
  }

  isActive() {
    return this.isTransitioning;
  }

  getActiveTransitions() {
    return Array.from(this.activeTransitions.entries());
  }

  clearQueue() {
    this.transitionQueue = [];
  }
}

// Initialize and export
if (typeof window !== 'undefined') {
  window.XboxPageTransitions = XboxPageTransitions;
  window.xboxTransitions = new XboxPageTransitions();
  
  console.log('🎮 Xbox Page Transitions ready for action!');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = XboxPageTransitions;
}