/**
 * MLG.clan Mobile Native Features System
 * 
 * Comprehensive mobile-specific features implementation for the MLG.clan gaming platform
 * 
 * Features:
 * - Gaming-optimized mobile sharing with metadata
 * - Progressive Web App (PWA) enhancement and installation
 * - Device camera integration for gaming content
 * - QR code generation and scanning for gaming features
 * - Mobile clipboard integration for gaming IDs and addresses
 * - Push notifications for gaming events
 * - Haptic feedback for gaming interactions
 * - File system integration for gaming content management
 * - Battery optimization for extended gaming sessions
 * - Offline functionality for core gaming features
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

class MLGMobileNativeFeaturesSystem {
  constructor() {
    this.isSupported = this.checkMobileSupport();
    this.pwaDeferredPrompt = null;
    this.isInstalled = false;
    this.shareData = null;
    this.camera = null;
    this.cameraStream = null;
    this.qrScanner = null;
    this.notificationPermission = 'default';
    this.hapticSupported = 'vibrate' in navigator;
    this.clipboardSupported = 'clipboard' in navigator;
    this.fileSystemSupported = 'showOpenFilePicker' in window;
    this.batteryAPI = null;
    this.isOffline = !navigator.onLine;
    
    // Initialize core features
    this.init();
  }

  /**
   * Initialize the mobile native features system
   */
  async init() {
    try {
      console.log('🎮 Initializing MLG Mobile Native Features System...');
      
      // Initialize PWA features
      await this.initPWA();
      
      // Initialize sharing capabilities
      this.initNativeSharing();
      
      // Initialize camera system
      await this.initCameraSystem();
      
      // Initialize clipboard integration
      this.initClipboardIntegration();
      
      // Initialize haptic feedback
      this.initHapticFeedback();
      
      // Initialize file system integration
      this.initFileSystemIntegration();
      
      // Initialize battery optimization
      await this.initBatteryOptimization();
      
      // Initialize offline functionality
      this.initOfflineSupport();
      
      // Initialize push notifications
      await this.initPushNotifications();
      
      // Set up event listeners
      this.setupEventListeners();
      
      console.log('✅ MLG Mobile Native Features System initialized successfully');
      
      // Dispatch initialization event
      this.dispatchEvent('mlg:mobile:initialized', {
        features: this.getSupportedFeatures(),
        isSupported: this.isSupported
      });
      
    } catch (error) {
      console.error('❌ Error initializing MLG Mobile Native Features System:', error);
      this.handleError('initialization', error);
    }
  }

  /**
   * Check mobile support capabilities
   */
  checkMobileSupport() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return {
      isMobile,
      hasTouchScreen,
      isIOS: /iphone|ipad|ipod/i.test(userAgent),
      isAndroid: /android/i.test(userAgent),
      supportsServiceWorker: 'serviceWorker' in navigator,
      supportsPWA: 'serviceWorker' in navigator && 'PushManager' in window,
      supportsWebShare: 'share' in navigator,
      supportsCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      supportsVibration: 'vibrate' in navigator,
      supportsClipboard: 'clipboard' in navigator,
      supportsNotifications: 'Notification' in window,
      supportsBattery: 'getBattery' in navigator,
      supportsFileSystem: 'showOpenFilePicker' in window
    };
  }

  /**
   * Get list of supported features
   */
  getSupportedFeatures() {
    return {
      pwa: this.isSupported.supportsPWA,
      sharing: this.isSupported.supportsWebShare,
      camera: this.isSupported.supportsCamera,
      haptic: this.isSupported.supportsVibration,
      clipboard: this.isSupported.supportsClipboard,
      notifications: this.isSupported.supportsNotifications,
      battery: this.isSupported.supportsBattery,
      fileSystem: this.isSupported.supportsFileSystem,
      offline: this.isSupported.supportsServiceWorker
    };
  }

  // ==========================================
  // PWA FEATURES
  // ==========================================

  /**
   * Initialize PWA capabilities
   */
  async initPWA() {
    if (!this.isSupported.supportsPWA) {
      console.warn('⚠️ PWA features not supported on this device');
      return;
    }

    // Check if already installed
    this.checkPWAInstallStatus();
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.pwaDeferredPrompt = e;
      this.showPWAInstallBanner();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.hidePWAInstallBanner();
      this.showInstallSuccessMessage();
      this.trackPWAEvent('install_success');
    });

    // Check for updates
    this.checkForPWAUpdates();
  }

  /**
   * Show PWA install banner
   */
  showPWAInstallBanner() {
    if (this.isInstalled || !this.pwaDeferredPrompt) return;

    const banner = this.createPWAInstallBanner();
    document.body.appendChild(banner);
    
    // Animate in
    requestAnimationFrame(() => {
      banner.classList.add('visible');
    });

    this.trackPWAEvent('install_banner_shown');
  }

  /**
   * Create PWA install banner element
   */
  createPWAInstallBanner() {
    const banner = document.createElement('div');
    banner.className = 'pwa-install-banner gaming-mode';
    banner.innerHTML = `
      <div class="pwa-banner-content">
        <div class="pwa-icon">🎮</div>
        <div class="pwa-banner-text">
          <h3 class="pwa-banner-title">Install MLG.clan</h3>
          <p class="pwa-banner-description">Get the ultimate gaming experience with offline access and push notifications</p>
        </div>
        <div class="pwa-banner-actions">
          <button class="pwa-install-btn" data-action="install">Install App</button>
          <button class="pwa-dismiss-btn" data-action="dismiss">Maybe Later</button>
        </div>
      </div>
    `;

    // Add event listeners
    banner.querySelector('[data-action="install"]').addEventListener('click', () => {
      this.installPWA();
    });

    banner.querySelector('[data-action="dismiss"]').addEventListener('click', () => {
      this.dismissPWAInstallBanner();
    });

    return banner;
  }

  /**
   * Install PWA
   */
  async installPWA() {
    if (!this.pwaDeferredPrompt) return;

    try {
      // Show the install prompt
      this.pwaDeferredPrompt.prompt();
      
      // Wait for the user to respond
      const { outcome } = await this.pwaDeferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        this.trackPWAEvent('install_accepted');
      } else {
        this.trackPWAEvent('install_dismissed');
      }
      
      // Clear the deferred prompt
      this.pwaDeferredPrompt = null;
      this.hidePWAInstallBanner();
      
    } catch (error) {
      console.error('Error installing PWA:', error);
      this.trackPWAEvent('install_error', { error: error.message });
    }
  }

  /**
   * Check PWA install status
   */
  checkPWAInstallStatus() {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      return;
    }

    // Check if installed via navigator.getInstalledRelatedApps (Chrome)
    if ('getInstalledRelatedApps' in navigator) {
      navigator.getInstalledRelatedApps().then(apps => {
        this.isInstalled = apps.length > 0;
      });
    }
  }

  /**
   * Check for PWA updates
   */
  async checkForPWAUpdates() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateAvailableMessage();
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Error checking for PWA updates:', error);
    }
  }

  // ==========================================
  // GAMING-OPTIMIZED MOBILE SHARING
  // ==========================================

  /**
   * Initialize native sharing capabilities
   */
  initNativeSharing() {
    if (!this.isSupported.supportsWebShare) {
      console.warn('⚠️ Native sharing not supported, using fallback');
      this.initSharingFallback();
      return;
    }

    this.createSharingFAB();
  }

  /**
   * Create sharing floating action button
   */
  createSharingFAB() {
    const fab = document.createElement('button');
    fab.className = 'gaming-share-fab';
    fab.innerHTML = '📤';
    fab.setAttribute('aria-label', 'Share gaming content');
    
    fab.addEventListener('click', () => {
      this.showSharingOptions();
    });

    document.body.appendChild(fab);
  }

  /**
   * Show sharing options menu
   */
  showSharingOptions() {
    const menu = this.createSharingMenu();
    document.body.appendChild(menu);
    
    requestAnimationFrame(() => {
      menu.classList.add('visible');
    });

    // Close menu when clicking outside
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        this.hideSharingOptions(menu);
        document.removeEventListener('click', closeMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 100);
  }

  /**
   * Create sharing options menu
   */
  createSharingMenu() {
    const menu = document.createElement('div');
    menu.className = 'share-options-menu';
    menu.innerHTML = `
      <div class="share-option-item" data-type="achievement">
        <div class="share-option-icon">🏆</div>
        <div class="share-option-text">
          <div class="share-option-label">Share Achievement</div>
          <div class="share-option-description">Gaming milestones and trophies</div>
        </div>
      </div>
      <div class="share-option-item" data-type="tournament">
        <div class="share-option-icon">⚔️</div>
        <div class="share-option-text">
          <div class="share-option-label">Tournament Results</div>
          <div class="share-option-description">Bracket positions and scores</div>
        </div>
      </div>
      <div class="share-option-item" data-type="clan">
        <div class="share-option-icon">👥</div>
        <div class="share-option-text">
          <div class="share-option-label">Clan Milestone</div>
          <div class="share-option-description">Clan achievements and stats</div>
        </div>
      </div>
      <div class="share-option-item" data-type="token">
        <div class="share-option-icon">🪙</div>
        <div class="share-option-text">
          <div class="share-option-label">Token Transaction</div>
          <div class="share-option-description">Blockchain verification link</div>
        </div>
      </div>
      <div class="share-option-item" data-type="general">
        <div class="share-option-icon">🎮</div>
        <div class="share-option-text">
          <div class="share-option-label">Current Page</div>
          <div class="share-option-description">Share this gaming content</div>
        </div>
      </div>
    `;

    // Add click handlers
    menu.querySelectorAll('.share-option-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.type;
        this.shareGamingContent(type);
        this.hideSharingOptions(menu);
      });
    });

    return menu;
  }

  /**
   * Share gaming content with optimized metadata
   */
  async shareGamingContent(type) {
    try {
      let shareData = this.generateGamingShareData(type);
      
      if (navigator.share) {
        await navigator.share(shareData);
        this.trackSharingEvent('native_share_success', { type });
      } else {
        await this.fallbackShare(shareData);
        this.trackSharingEvent('fallback_share_success', { type });
      }
      
      // Show success haptic feedback
      this.triggerHapticFeedback('success');
      
    } catch (error) {
      if (error.name === 'AbortError') {
        this.trackSharingEvent('share_cancelled', { type });
      } else {
        console.error('Error sharing content:', error);
        this.trackSharingEvent('share_error', { type, error: error.message });
      }
    }
  }

  /**
   * Generate gaming-optimized share data
   */
  generateGamingShareData(type) {
    const baseUrl = window.location.origin;
    const currentPage = window.location.pathname;
    
    const shareTemplates = {
      achievement: {
        title: '🏆 MLG.clan Achievement Unlocked!',
        text: 'Check out my latest gaming achievement on MLG.clan! Join the ultimate gaming platform with Web3 integration.',
        url: `${baseUrl}/achievements${currentPage}`
      },
      tournament: {
        title: '⚔️ MLG.clan Tournament Results',
        text: 'See the latest tournament results and join competitive gaming on MLG.clan! #Gaming #Tournament #MLG',
        url: `${baseUrl}/tournaments${currentPage}`
      },
      clan: {
        title: '👥 Join My MLG.clan!',
        text: 'Experience the power of gaming clans with DAO governance and token rewards. Join us on MLG.clan!',
        url: `${baseUrl}/clans${currentPage}`
      },
      token: {
        title: '🪙 MLG Token Transaction',
        text: 'Verified blockchain transaction on Solana. See the power of gaming + DeFi on MLG.clan!',
        url: `${baseUrl}/transactions${currentPage}`
      },
      general: {
        title: '🎮 MLG.clan Gaming Platform',
        text: 'The ultimate gaming platform combining Web3, clans, DAO governance, and real-time tournaments!',
        url: window.location.href
      }
    };

    return shareTemplates[type] || shareTemplates.general;
  }

  // ==========================================
  // DEVICE CAMERA INTEGRATION
  // ==========================================

  /**
   * Initialize camera system
   */
  async initCameraSystem() {
    if (!this.isSupported.supportsCamera) {
      console.warn('⚠️ Camera not supported on this device');
      return;
    }

    // Create camera UI elements but don't show them yet
    this.createCameraOverlay();
  }

  /**
   * Create camera capture overlay
   */
  createCameraOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'camera-capture-overlay';
    overlay.innerHTML = `
      <div class="camera-header">
        <h3 class="camera-title">Gaming Profile Photo</h3>
        <button class="camera-close-btn" aria-label="Close camera">✕</button>
      </div>
      <div class="camera-preview">
        <video class="camera-video" autoplay muted playsinline></video>
        <div class="camera-overlay-frame"></div>
      </div>
      <div class="camera-controls">
        <button class="camera-gallery-btn" aria-label="Open gallery">🖼️</button>
        <button class="camera-capture-btn" aria-label="Capture photo"></button>
        <button class="camera-flip-btn" aria-label="Flip camera">🔄</button>
      </div>
    `;

    // Add event listeners
    overlay.querySelector('.camera-close-btn').addEventListener('click', () => {
      this.closeCameraCapture();
    });

    overlay.querySelector('.camera-capture-btn').addEventListener('click', () => {
      this.captureGamingPhoto();
    });

    overlay.querySelector('.camera-flip-btn').addEventListener('click', () => {
      this.flipCamera();
    });

    overlay.querySelector('.camera-gallery-btn').addEventListener('click', () => {
      this.openGallery();
    });

    document.body.appendChild(overlay);
    this.cameraOverlay = overlay;
  }

  /**
   * Open camera for gaming content capture
   */
  async openCameraCapture(options = {}) {
    try {
      const constraints = {
        video: {
          facingMode: options.facingMode || 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      this.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const video = this.cameraOverlay.querySelector('.camera-video');
      video.srcObject = this.cameraStream;
      
      this.cameraOverlay.classList.add('active');
      
      this.trackCameraEvent('camera_opened', { facingMode: constraints.video.facingMode });
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.handleCameraError(error);
    }
  }

  /**
   * Capture gaming photo
   */
  async captureGamingPhoto() {
    try {
      const video = this.cameraOverlay.querySelector('.camera-video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0);
      
      // Convert to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });
      
      // Process gaming photo
      await this.processGamingPhoto(blob);
      
      // Success haptic feedback
      this.triggerHapticFeedback('success');
      
      this.trackCameraEvent('photo_captured');
      
    } catch (error) {
      console.error('Error capturing photo:', error);
      this.triggerHapticFeedback('error');
    }
  }

  /**
   * Process captured gaming photo
   */
  async processGamingPhoto(blob) {
    // Create object URL for preview
    const imageUrl = URL.createObjectURL(blob);
    
    // Dispatch event with captured photo
    this.dispatchEvent('mlg:camera:photoCaptured', {
      blob,
      imageUrl,
      timestamp: Date.now(),
      type: 'gaming_profile'
    });
    
    // Show success message
    this.showToast('Gaming photo captured successfully!', 'success');
    
    // Close camera
    this.closeCameraCapture();
  }

  /**
   * Close camera capture
   */
  closeCameraCapture() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    
    if (this.cameraOverlay) {
      this.cameraOverlay.classList.remove('active');
    }
    
    this.trackCameraEvent('camera_closed');
  }

  // ==========================================
  // QR CODE INTEGRATION
  // ==========================================

  /**
   * Initialize QR scanner
   */
  initQRScanner() {
    this.createQRScannerOverlay();
  }

  /**
   * Create QR scanner overlay
   */
  createQRScannerOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'qr-scanner-overlay';
    overlay.innerHTML = `
      <div class="qr-scanner-header">
        <h3 class="qr-scanner-title">Scan Gaming QR Code</h3>
        <p class="qr-scanner-instructions">Position the QR code within the frame</p>
      </div>
      <div class="qr-scanner-area">
        <video class="qr-scanner-video" autoplay muted playsinline></video>
        <div class="qr-scanner-frame">
          <div class="qr-scan-line"></div>
        </div>
      </div>
      <div class="qr-scanner-actions">
        <button class="qr-scanner-btn secondary">Cancel</button>
        <button class="qr-scanner-btn">Generate QR</button>
      </div>
    `;

    document.body.appendChild(overlay);
    this.qrScannerOverlay = overlay;

    // Add event listeners
    overlay.querySelector('.qr-scanner-btn.secondary').addEventListener('click', () => {
      this.closeQRScanner();
    });

    overlay.querySelector('.qr-scanner-btn:not(.secondary)').addEventListener('click', () => {
      this.generateGamingQR();
    });
  }

  /**
   * Open QR scanner for gaming codes
   */
  async openQRScanner() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      const video = this.qrScannerOverlay.querySelector('.qr-scanner-video');
      video.srcObject = stream;
      
      this.qrScannerOverlay.classList.add('active');
      this.qrStream = stream;
      
      // Start QR detection
      this.startQRDetection(video);
      
      this.trackQREvent('scanner_opened');
      
    } catch (error) {
      console.error('Error opening QR scanner:', error);
      this.handleQRError(error);
    }
  }

  /**
   * Generate gaming QR code
   */
  generateGamingQR(data = null) {
    const qrData = data || {
      type: 'gaming_invite',
      platform: 'mlg.clan',
      url: window.location.href,
      timestamp: Date.now()
    };

    // Dispatch event for QR generation
    this.dispatchEvent('mlg:qr:generate', { data: qrData });
    
    this.trackQREvent('qr_generated', { type: qrData.type });
  }

  // ==========================================
  // HAPTIC FEEDBACK SYSTEM
  // ==========================================

  /**
   * Initialize haptic feedback
   */
  initHapticFeedback() {
    if (!this.hapticSupported) {
      console.warn('⚠️ Haptic feedback not supported on this device');
      return;
    }

    this.createHapticOverlay();
  }

  /**
   * Create haptic feedback overlay
   */
  createHapticOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'haptic-feedback-overlay';
    overlay.innerHTML = '<div class="haptic-pulse"></div>';
    
    document.body.appendChild(overlay);
    this.hapticOverlay = overlay;
  }

  /**
   * Trigger haptic feedback for gaming interactions
   */
  triggerHapticFeedback(type = 'default', intensity = 'medium') {
    if (!this.hapticSupported) return;

    const patterns = {
      default: [100],
      success: [50, 50, 100],
      error: [200, 100, 200],
      warning: [150],
      achievement: [50, 100, 50, 100, 200],
      vote: [100, 50, 100],
      button: [50],
      notification: [100, 200, 100]
    };

    const pattern = patterns[type] || patterns.default;
    
    try {
      navigator.vibrate(pattern);
      
      // Show visual feedback
      if (this.hapticOverlay) {
        this.hapticOverlay.className = `haptic-feedback-overlay active ${type}`;
        
        setTimeout(() => {
          this.hapticOverlay.classList.remove('active');
        }, 300);
      }
      
      this.trackHapticEvent(type, { pattern });
      
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
    }
  }

  // ==========================================
  // CLIPBOARD INTEGRATION
  // ==========================================

  /**
   * Initialize clipboard integration
   */
  initClipboardIntegration() {
    if (!this.clipboardSupported) {
      console.warn('⚠️ Clipboard API not supported, using fallback');
      this.initClipboardFallback();
      return;
    }
  }

  /**
   * Copy gaming content to clipboard
   */
  async copyToClipboard(text, type = 'general') {
    try {
      if (this.clipboardSupported) {
        await navigator.clipboard.writeText(text);
      } else {
        await this.fallbackCopyToClipboard(text);
      }
      
      this.showClipboardToast('Copied to clipboard!', 'success');
      this.triggerHapticFeedback('success');
      this.trackClipboardEvent('copy_success', { type });
      
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.showClipboardToast('Failed to copy', 'error');
      this.triggerHapticFeedback('error');
      this.trackClipboardEvent('copy_error', { type, error: error.message });
    }
  }

  /**
   * Show clipboard toast notification
   */
  showClipboardToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `clipboard-toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });
    
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2000);
  }

  // ==========================================
  // FILE SYSTEM INTEGRATION
  // ==========================================

  /**
   * Initialize file system integration
   */
  initFileSystemIntegration() {
    if (!this.fileSystemSupported) {
      console.warn('⚠️ File System Access API not supported, using fallback');
      this.initFileSystemFallback();
      return;
    }
  }

  /**
   * Open gaming file picker
   */
  async openGamingFilePicker(options = {}) {
    try {
      const filePickerOptions = {
        types: [{
          description: 'Gaming content',
          accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            'video/*': ['.mp4', '.webm', '.mov'],
            'application/json': ['.json']
          }
        }],
        excludeAcceptAllOption: true,
        multiple: options.multiple || false
      };

      const fileHandles = await window.showOpenFilePicker(filePickerOptions);
      
      const files = await Promise.all(
        fileHandles.map(async handle => {
          const file = await handle.getFile();
          return { handle, file };
        })
      );
      
      this.dispatchEvent('mlg:files:selected', { files });
      this.trackFileEvent('files_selected', { count: files.length });
      
      return files;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        this.trackFileEvent('file_picker_cancelled');
      } else {
        console.error('Error opening file picker:', error);
        this.trackFileEvent('file_picker_error', { error: error.message });
      }
    }
  }

  /**
   * Save gaming content to device
   */
  async saveGamingContent(content, filename, type = 'text/plain') {
    try {
      if (this.fileSystemSupported) {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Gaming content',
            accept: { [type]: [] }
          }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        
        this.showToast('File saved successfully!', 'success');
        this.trackFileEvent('file_saved', { type, filename });
        
      } else {
        this.fallbackSaveFile(content, filename, type);
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        this.trackFileEvent('save_cancelled');
      } else {
        console.error('Error saving file:', error);
        this.trackFileEvent('save_error', { error: error.message });
      }
    }
  }

  // ==========================================
  // PUSH NOTIFICATIONS
  // ==========================================

  /**
   * Initialize push notifications
   */
  async initPushNotifications() {
    if (!this.isSupported.supportsNotifications) {
      console.warn('⚠️ Push notifications not supported');
      return;
    }

    this.notificationPermission = Notification.permission;
    
    if (this.notificationPermission === 'default') {
      this.showNotificationPermissionRequest();
    }
  }

  /**
   * Show notification permission request
   */
  showNotificationPermissionRequest() {
    const permissionUI = this.createNotificationPermissionUI();
    document.body.appendChild(permissionUI);
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    try {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      
      if (permission === 'granted') {
        this.trackNotificationEvent('permission_granted');
        this.showToast('Notifications enabled!', 'success');
        await this.subscribeToGameNotifications();
      } else {
        this.trackNotificationEvent('permission_denied');
      }
      
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      this.trackNotificationEvent('permission_error', { error: error.message });
    }
  }

  /**
   * Send gaming notification
   */
  async sendGamingNotification(title, options = {}) {
    if (this.notificationPermission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        tag: 'mlg-gaming',
        requireInteraction: false,
        ...options
      });

      notification.addEventListener('click', () => {
        window.focus();
        this.trackNotificationEvent('notification_clicked', { title });
      });

      this.trackNotificationEvent('notification_sent', { title });
      
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // ==========================================
  // BATTERY OPTIMIZATION
  // ==========================================

  /**
   * Initialize battery optimization
   */
  async initBatteryOptimization() {
    if (!this.isSupported.supportsBattery) {
      console.warn('⚠️ Battery API not supported');
      return;
    }

    try {
      this.batteryAPI = await navigator.getBattery();
      
      this.batteryAPI.addEventListener('levelchange', () => {
        this.handleBatteryLevelChange();
      });
      
      this.batteryAPI.addEventListener('chargingchange', () => {
        this.handleChargingStateChange();
      });
      
      // Initial battery check
      this.checkBatteryStatus();
      
    } catch (error) {
      console.error('Error initializing battery API:', error);
    }
  }

  /**
   * Check battery status and optimize accordingly
   */
  checkBatteryStatus() {
    if (!this.batteryAPI) return;

    const level = this.batteryAPI.level;
    const charging = this.batteryAPI.charging;

    if (level < 0.2 && !charging) {
      this.enableBatterySaverMode();
    } else if (level > 0.5 || charging) {
      this.disableBatterySaverMode();
    }
  }

  /**
   * Enable battery saver mode
   */
  enableBatterySaverMode() {
    document.body.classList.add('battery-saver-mode');
    
    this.dispatchEvent('mlg:battery:saverEnabled', {
      level: this.batteryAPI?.level,
      charging: this.batteryAPI?.charging
    });
    
    this.showToast('Battery saver mode enabled', 'warning');
    this.trackBatteryEvent('saver_enabled');
  }

  /**
   * Disable battery saver mode
   */
  disableBatterySaverMode() {
    document.body.classList.remove('battery-saver-mode');
    
    this.dispatchEvent('mlg:battery:saverDisabled', {
      level: this.batteryAPI?.level,
      charging: this.batteryAPI?.charging
    });
    
    this.trackBatteryEvent('saver_disabled');
  }

  // ==========================================
  // OFFLINE SUPPORT
  // ==========================================

  /**
   * Initialize offline support
   */
  initOfflineSupport() {
    window.addEventListener('online', () => {
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleOnlineStatusChange(false);
    });

    // Initial status check
    this.handleOnlineStatusChange(navigator.onLine);
  }

  /**
   * Handle online/offline status changes
   */
  handleOnlineStatusChange(isOnline) {
    this.isOffline = !isOnline;
    
    if (isOnline) {
      this.hideOfflineIndicator();
      this.syncOfflineData();
      this.trackConnectivityEvent('back_online');
    } else {
      this.showOfflineIndicator();
      this.enableOfflineMode();
      this.trackConnectivityEvent('went_offline');
    }
    
    this.dispatchEvent('mlg:connectivity:changed', { isOnline, isOffline: this.isOffline });
  }

  /**
   * Show offline indicator
   */
  showOfflineIndicator() {
    let indicator = document.querySelector('.pwa-offline-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'pwa-offline-indicator';
      indicator.textContent = '⚠️ Offline Mode - Limited features available';
      document.body.appendChild(indicator);
    }
    
    indicator.classList.add('visible');
  }

  // ==========================================
  // EVENT SYSTEM
  // ==========================================

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Handle visibility changes for battery optimization
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleAppBackgrounded();
      } else {
        this.handleAppForegrounded();
      }
    });

    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      this.handleOrientationChange();
    });

    // Handle connection changes
    window.addEventListener('online', () => this.handleOnlineStatusChange(true));
    window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
  }

  /**
   * Dispatch custom event
   */
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
  }

  // ==========================================
  // ANALYTICS AND TRACKING
  // ==========================================

  /**
   * Track PWA events
   */
  trackPWAEvent(action, data = {}) {
    this.dispatchEvent('mlg:analytics:track', {
      category: 'pwa',
      action,
      data
    });
  }

  /**
   * Track sharing events
   */
  trackSharingEvent(action, data = {}) {
    this.dispatchEvent('mlg:analytics:track', {
      category: 'sharing',
      action,
      data
    });
  }

  /**
   * Track camera events
   */
  trackCameraEvent(action, data = {}) {
    this.dispatchEvent('mlg:analytics:track', {
      category: 'camera',
      action,
      data
    });
  }

  /**
   * Track QR events
   */
  trackQREvent(action, data = {}) {
    this.dispatchEvent('mlg:analytics:track', {
      category: 'qr',
      action,
      data
    });
  }

  /**
   * Track haptic events
   */
  trackHapticEvent(action, data = {}) {
    this.dispatchEvent('mlg:analytics:track', {
      category: 'haptic',
      action,
      data
    });
  }

  /**
   * Track clipboard events
   */
  trackClipboardEvent(action, data = {}) {
    this.dispatchEvent('mlg:analytics:track', {
      category: 'clipboard',
      action,
      data
    });
  }

  /**
   * Track file events
   */
  trackFileEvent(action, data = {}) {
    this.dispatchEvent('mlg:analytics:track', {
      category: 'file',
      action,
      data
    });
  }

  /**
   * Track notification events
   */
  trackNotificationEvent(action, data = {}) {
    this.dispatchEvent('mlg:analytics:track', {
      category: 'notification',
      action,
      data
    });
  }

  /**
   * Track battery events
   */
  trackBatteryEvent(action, data = {}) {
    this.dispatchEvent('mlg:analytics:track', {
      category: 'battery',
      action,
      data
    });
  }

  /**
   * Track connectivity events
   */
  trackConnectivityEvent(action, data = {}) {
    this.dispatchEvent('mlg:analytics:track', {
      category: 'connectivity',
      action,
      data
    });
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Show toast notification
   */
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `mlg-toast mlg-toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });
    
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  /**
   * Handle errors with user feedback
   */
  handleError(context, error) {
    console.error(`MLG Mobile Native Features Error (${context}):`, error);
    
    this.dispatchEvent('mlg:mobile:error', {
      context,
      error: error.message,
      timestamp: Date.now()
    });
    
    // Show user-friendly error message
    this.showToast(`Error: ${error.message}`, 'error');
    this.triggerHapticFeedback('error');
  }

  /**
   * Get current system status
   */
  getSystemStatus() {
    return {
      isSupported: this.isSupported,
      features: this.getSupportedFeatures(),
      pwa: {
        isInstalled: this.isInstalled,
        hasPrompt: !!this.pwaDeferredPrompt
      },
      camera: {
        hasPermission: this.cameraStream !== null,
        isActive: this.cameraOverlay?.classList.contains('active')
      },
      notifications: {
        permission: this.notificationPermission
      },
      battery: {
        level: this.batteryAPI?.level,
        charging: this.batteryAPI?.charging,
        saverMode: document.body.classList.contains('battery-saver-mode')
      },
      connectivity: {
        isOnline: !this.isOffline,
        isOffline: this.isOffline
      }
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Stop camera stream
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
    }

    // Stop QR scanner stream
    if (this.qrStream) {
      this.qrStream.getTracks().forEach(track => track.stop());
    }

    // Remove event listeners
    // (Add cleanup for all event listeners)

    console.log('🎮 MLG Mobile Native Features System destroyed');
  }
}

// Global instance
window.MLGMobileNativeFeatures = new MLGMobileNativeFeaturesSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MLGMobileNativeFeaturesSystem;
}

export default MLGMobileNativeFeaturesSystem;