/**
 * Gaming-Themed File Upload Progress Indicators
 * Xbox 360-style upload progress with gaming aesthetics and real-time feedback
 */

class GamingUploadProgress {
  constructor(options = {}) {
    this.options = {
      primaryColor: '#00ff88',
      secondaryColor: '#8b5cf6',
      accentColor: '#3b82f6',
      warningColor: '#fbbf24',
      errorColor: '#ef4444',
      successColor: '#10b981',
      darkBg: '#0a0a0f',
      surfaceBg: '#1a1a2e',
      ...options
    };
    
    this.activeUploads = new Map();
    this.uploadQueue = [];
    this.maxConcurrentUploads = 3;
    
    this.init();
  }

  init() {
    this.injectUploadStyles();
    console.log('📤 Gaming Upload Progress initialized');
  }

  /**
   * Show single file upload progress
   * @param {HTMLElement} container - Target container
   * @param {Object} options - Upload options
   */
  showFileUpload(container, options = {}) {
    const uploadId = this.generateId();
    const fileName = options.fileName || 'file.mp4';
    const fileSize = options.fileSize || '15.4 MB';
    const fileType = options.fileType || 'video';
    const uploadSpeed = options.uploadSpeed || '2.1 MB/s';
    const showPreview = options.preview !== false;
    
    const fileIcon = this.getFileIcon(fileType);
    const previewHTML = showPreview ? this.generatePreview(fileType, options.previewUrl) : '';
    
    const loaderHTML = `
      <div id="${uploadId}" class="gaming-upload-loader fade-in">
        <div class="upload-container">
          <!-- Upload Visual -->
          <div class="upload-visual">
            <div class="file-representation">
              ${previewHTML}
              <div class="file-icon-container">
                <div class="file-icon">${fileIcon}</div>
                <div class="file-glow"></div>
              </div>
            </div>
            
            <!-- Upload Beam Effect -->
            <div class="upload-beam">
              <div class="beam-particles">
                ${this.generateUploadParticles(15)}
              </div>
              <div class="beam-line"></div>
            </div>
            
            <!-- Cloud/Server Icon -->
            <div class="server-icon">
              <div class="server-body">☁️</div>
              <div class="server-pulse"></div>
            </div>
          </div>
          
          <!-- Upload Information -->
          <div class="upload-info">
            <div class="file-details">
              <h3 class="file-name">${fileName}</h3>
              <div class="file-meta">
                <span class="file-size">${fileSize}</span>
                <span class="file-type-badge">${fileType.toUpperCase()}</span>
              </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="upload-progress-container">
              <div class="progress-track">
                <div class="progress-fill" id="${uploadId}-progress"></div>
                <div class="progress-glow" id="${uploadId}-glow"></div>
              </div>
              <div class="progress-stats">
                <div class="progress-percentage" id="${uploadId}-percentage">0%</div>
                <div class="upload-speed" id="${uploadId}-speed">Preparing...</div>
              </div>
            </div>
            
            <!-- Upload Status -->
            <div class="upload-status" id="${uploadId}-status">
              <div class="status-icon">
                <div class="status-spinner"></div>
              </div>
              <div class="status-text">Initializing upload...</div>
            </div>
          </div>
          
          <!-- Upload Stats -->
          <div class="upload-stats">
            <div class="stat-item">
              <div class="stat-label">Uploaded</div>
              <div class="stat-value" id="${uploadId}-uploaded">0 MB</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Remaining</div>
              <div class="stat-value" id="${uploadId}-remaining">${fileSize}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Time Left</div>
              <div class="stat-value" id="${uploadId}-time">Calculating...</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Speed</div>
              <div class="stat-value" id="${uploadId}-speed-stat">0 MB/s</div>
            </div>
          </div>
          
          <!-- Upload Actions -->
          <div class="upload-actions">
            <button class="action-btn cancel-btn" onclick="window.uploadManager.cancelUpload('${uploadId}')">
              <span class="btn-icon">⏹️</span>
              <span class="btn-text">Cancel</span>
            </button>
            <button class="action-btn pause-btn" onclick="window.uploadManager.pauseUpload('${uploadId}')" id="${uploadId}-pause">
              <span class="btn-icon">⏸️</span>
              <span class="btn-text">Pause</span>
            </button>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = loaderHTML;
    this.activeUploads.set(uploadId, {
      container,
      type: 'single',
      startTime: Date.now(),
      fileName,
      fileSize: this.parseFileSize(fileSize),
      uploadSpeed: this.parseUploadSpeed(uploadSpeed),
      progress: 0,
      isPaused: false,
      isCompleted: false
    });
    
    // Start upload simulation
    this.simulateUpload(uploadId, options.duration || 8000);
    
    return uploadId;
  }

  /**
   * Show multiple file upload queue
   * @param {HTMLElement} container - Target container
   * @param {Object} options - Queue options
   */
  showUploadQueue(container, options = {}) {
    const queueId = this.generateId();
    const files = options.files || [
      { name: 'gameplay_clip1.mp4', size: '15.4 MB', type: 'video' },
      { name: 'screenshot_001.png', size: '2.1 MB', type: 'image' },
      { name: 'tournament_highlights.mp4', size: '48.7 MB', type: 'video' }
    ];
    const totalSize = options.totalSize || '66.2 MB';
    
    const filesHTML = files.map((file, index) => `
      <div class="queue-file" id="${queueId}-file-${index}">
        <div class="file-info">
          <div class="file-icon">${this.getFileIcon(file.type)}</div>
          <div class="file-details">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${file.size}</div>
          </div>
        </div>
        <div class="file-status" id="${queueId}-file-${index}-status">
          <div class="status-text">Queued</div>
          <div class="status-indicator waiting"></div>
        </div>
        <div class="file-progress">
          <div class="mini-progress-track">
            <div class="mini-progress-fill" id="${queueId}-file-${index}-progress"></div>
          </div>
        </div>
      </div>
    `).join('');
    
    const loaderHTML = `
      <div id="${queueId}" class="gaming-upload-queue fade-in">
        <div class="queue-container">
          <!-- Queue Header -->
          <div class="queue-header">
            <div class="queue-title">
              <h3 class="title-text">Upload Queue</h3>
              <div class="queue-stats">
                <span class="file-count">${files.length} files</span>
                <span class="total-size">${totalSize}</span>
              </div>
            </div>
            
            <!-- Overall Progress -->
            <div class="overall-progress">
              <div class="overall-track">
                <div class="overall-fill" id="${queueId}-overall"></div>
                <div class="overall-glow"></div>
              </div>
              <div class="overall-stats">
                <div class="overall-percentage" id="${queueId}-overall-percent">0%</div>
                <div class="overall-speed" id="${queueId}-overall-speed">0 MB/s</div>
              </div>
            </div>
          </div>
          
          <!-- File Queue -->
          <div class="file-queue">
            ${filesHTML}
          </div>
          
          <!-- Queue Controls -->
          <div class="queue-controls">
            <button class="control-btn start-btn" onclick="window.uploadManager.startQueue('${queueId}')" id="${queueId}-start">
              <span class="btn-icon">▶️</span>
              <span class="btn-text">Start Upload</span>
            </button>
            <button class="control-btn pause-all-btn" onclick="window.uploadManager.pauseQueue('${queueId}')" id="${queueId}-pause" disabled>
              <span class="btn-icon">⏸️</span>
              <span class="btn-text">Pause All</span>
            </button>
            <button class="control-btn clear-btn" onclick="window.uploadManager.clearQueue('${queueId}')">
              <span class="btn-icon">🗑️</span>
              <span class="btn-text">Clear Queue</span>
            </button>
          </div>
          
          <!-- Upload Summary -->
          <div class="upload-summary">
            <div class="summary-item">
              <div class="summary-label">Total Progress</div>
              <div class="summary-value" id="${queueId}-total-progress">0 / ${totalSize}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Active Uploads</div>
              <div class="summary-value" id="${queueId}-active-count">0</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Time Remaining</div>
              <div class="summary-value" id="${queueId}-time-remaining">--:--</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Average Speed</div>
              <div class="summary-value" id="${queueId}-avg-speed">0 MB/s</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = loaderHTML;
    this.activeUploads.set(queueId, {
      container,
      type: 'queue',
      startTime: Date.now(),
      files,
      totalSize: this.parseFileSize(totalSize),
      currentFileIndex: 0,
      isActive: false,
      isPaused: false,
      completedFiles: 0
    });
    
    return queueId;
  }

  /**
   * Show upload completion with success animation
   * @param {HTMLElement} container - Target container
   * @param {Object} options - Completion options
   */
  showUploadComplete(container, options = {}) {
    const completeId = this.generateId();
    const fileName = options.fileName || 'file.mp4';
    const uploadTime = options.uploadTime || '00:45';
    const averageSpeed = options.averageSpeed || '2.3 MB/s';
    const fileUrl = options.fileUrl || '#';
    
    const loaderHTML = `
      <div id="${completeId}" class="upload-complete-loader fade-in">
        <div class="complete-container">
          <!-- Success Animation -->
          <div class="success-animation">
            <div class="success-circle">
              <div class="checkmark">
                <div class="checkmark-stem"></div>
                <div class="checkmark-kick"></div>
              </div>
            </div>
            
            <!-- Celebration Particles -->
            <div class="celebration-particles">
              ${this.generateCelebrationParticles(20)}
            </div>
            
            <!-- Success Waves -->
            <div class="success-waves">
              <div class="wave wave-1"></div>
              <div class="wave wave-2"></div>
              <div class="wave wave-3"></div>
            </div>
          </div>
          
          <!-- Completion Message -->
          <div class="completion-message">
            <h3 class="complete-title">Upload Complete! 🎉</h3>
            <p class="complete-subtitle">${fileName} has been successfully uploaded</p>
          </div>
          
          <!-- Upload Summary -->
          <div class="completion-summary">
            <div class="summary-stat">
              <div class="stat-icon">⏱️</div>
              <div class="stat-info">
                <div class="stat-label">Upload Time</div>
                <div class="stat-value">${uploadTime}</div>
              </div>
            </div>
            
            <div class="summary-stat">
              <div class="stat-icon">🚀</div>
              <div class="stat-info">
                <div class="stat-label">Average Speed</div>
                <div class="stat-value">${averageSpeed}</div>
              </div>
            </div>
            
            <div class="summary-stat">
              <div class="stat-icon">✅</div>
              <div class="stat-info">
                <div class="stat-label">Status</div>
                <div class="stat-value">Success</div>
              </div>
            </div>
          </div>
          
          <!-- Completion Actions -->
          <div class="completion-actions">
            <button class="action-btn primary-btn" onclick="window.uploadManager.viewFile('${fileUrl}')">
              <span class="btn-icon">👁️</span>
              <span class="btn-text">View File</span>
            </button>
            <button class="action-btn secondary-btn" onclick="window.uploadManager.shareFile('${fileUrl}')">
              <span class="btn-icon">📤</span>
              <span class="btn-text">Share</span>
            </button>
            <button class="action-btn tertiary-btn" onclick="window.uploadManager.uploadMore()">
              <span class="btn-icon">➕</span>
              <span class="btn-text">Upload More</span>
            </button>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = loaderHTML;
    this.activeUploads.set(completeId, {
      container,
      type: 'complete',
      startTime: Date.now(),
      fileName,
      fileUrl
    });
    
    return completeId;
  }

  /**
   * Simulate upload progress
   */
  simulateUpload(uploadId, duration) {
    const instance = this.activeUploads.get(uploadId);
    if (!instance || instance.isCompleted) return;
    
    const startTime = Date.now();
    const progressElement = document.getElementById(`${uploadId}-progress`);
    const percentageElement = document.getElementById(`${uploadId}-percentage`);
    const speedElement = document.getElementById(`${uploadId}-speed`);
    const uploadedElement = document.getElementById(`${uploadId}-uploaded`);
    const remainingElement = document.getElementById(`${uploadId}-remaining`);
    const timeElement = document.getElementById(`${uploadId}-time`);
    const speedStatElement = document.getElementById(`${uploadId}-speed-stat`);
    const statusElement = document.getElementById(`${uploadId}-status`);
    
    const animate = () => {
      if (instance.isPaused || instance.isCompleted) return;
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      const uploadedBytes = (progress / 100) * instance.fileSize;
      const remainingBytes = instance.fileSize - uploadedBytes;
      const currentSpeed = instance.uploadSpeed * (0.8 + Math.random() * 0.4); // Vary speed
      const timeLeft = remainingBytes / currentSpeed;
      
      instance.progress = progress;
      
      // Update UI elements
      if (progressElement) {
        progressElement.style.width = `${progress}%`;
      }
      
      if (percentageElement) {
        percentageElement.textContent = `${Math.round(progress)}%`;
      }
      
      if (speedElement) {
        speedElement.textContent = `${this.formatSpeed(currentSpeed)}`;
      }
      
      if (uploadedElement) {
        uploadedElement.textContent = this.formatFileSize(uploadedBytes);
      }
      
      if (remainingElement) {
        remainingElement.textContent = this.formatFileSize(remainingBytes);
      }
      
      if (timeElement && timeLeft > 0) {
        timeElement.textContent = this.formatTime(timeLeft);
      }
      
      if (speedStatElement) {
        speedStatElement.textContent = this.formatSpeed(currentSpeed);
      }
      
      // Update status
      if (statusElement) {
        const statusText = statusElement.querySelector('.status-text');
        if (statusText) {
          if (progress < 25) {
            statusText.textContent = 'Uploading...';
          } else if (progress < 75) {
            statusText.textContent = 'Transferring data...';
          } else if (progress < 95) {
            statusText.textContent = 'Finalizing...';
          } else if (progress < 100) {
            statusText.textContent = 'Processing...';
          } else {
            statusText.textContent = 'Complete!';
          }
        }
      }
      
      if (progress < 100) {
        requestAnimationFrame(animate);
      } else {
        instance.isCompleted = true;
        this.showUploadComplete(instance.container, {
          fileName: instance.fileName,
          uploadTime: this.formatTime((Date.now() - startTime) / 1000),
          averageSpeed: this.formatSpeed(instance.uploadSpeed)
        });
      }
    };
    
    animate();
  }

  // Utility methods for file handling
  getFileIcon(fileType) {
    const icons = {
      video: '🎬',
      image: '🖼️',
      audio: '🎵',
      document: '📄',
      archive: '📦',
      code: '💻',
      default: '📁'
    };
    
    return icons[fileType] || icons.default;
  }

  generatePreview(fileType, previewUrl) {
    if (fileType === 'image' && previewUrl) {
      return `<div class="file-preview"><img src="${previewUrl}" alt="Preview"></div>`;
    } else if (fileType === 'video') {
      return `<div class="file-preview video-preview"><div class="play-button">▶️</div></div>`;
    }
    return '';
  }

  generateUploadParticles(count) {
    let particles = '';
    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 2;
      const duration = 1 + Math.random() * 2;
      const size = Math.random() * 4 + 2;
      
      particles += `
        <div class="upload-particle" 
             style="
               width: ${size}px; 
               height: ${size}px;
               animation-delay: ${delay}s;
               animation-duration: ${duration}s;
             "></div>
      `;
    }
    return particles;
  }

  generateCelebrationParticles(count) {
    let particles = '';
    const colors = [this.options.primaryColor, this.options.accentColor, this.options.successColor];
    
    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 2;
      const duration = 2 + Math.random() * 3;
      const size = Math.random() * 8 + 4;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const x = Math.random() * 200 - 100;
      const y = Math.random() * 200 - 100;
      
      particles += `
        <div class="celebration-particle" 
             style="
               left: ${x}px; 
               top: ${y}px;
               width: ${size}px; 
               height: ${size}px;
               background: ${color};
               animation-delay: ${delay}s;
               animation-duration: ${duration}s;
             "></div>
      `;
    }
    return particles;
  }

  // File size and speed utilities
  parseFileSize(sizeStr) {
    const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    const match = sizeStr.match(/^([\d.]+)\s*([A-Z]+)$/i);
    if (match) {
      return parseFloat(match[1]) * (units[match[2].toUpperCase()] || 1);
    }
    return 0;
  }

  parseUploadSpeed(speedStr) {
    return this.parseFileSize(speedStr.replace('/s', ''));
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatSpeed(bytesPerSecond) {
    return this.formatFileSize(bytesPerSecond) + '/s';
  }

  formatTime(seconds) {
    if (!seconds || seconds <= 0) return '--:--';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  generateId() {
    return 'upload-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Upload control methods
  cancelUpload(uploadId) {
    const instance = this.activeUploads.get(uploadId);
    if (instance) {
      instance.isCompleted = true;
      // Show cancellation message or redirect
      console.log(`Upload ${uploadId} cancelled`);
    }
  }

  pauseUpload(uploadId) {
    const instance = this.activeUploads.get(uploadId);
    if (instance) {
      instance.isPaused = !instance.isPaused;
      const pauseBtn = document.getElementById(`${uploadId}-pause`);
      
      if (pauseBtn) {
        const btnIcon = pauseBtn.querySelector('.btn-icon');
        const btnText = pauseBtn.querySelector('.btn-text');
        
        if (instance.isPaused) {
          btnIcon.textContent = '▶️';
          btnText.textContent = 'Resume';
        } else {
          btnIcon.textContent = '⏸️';
          btnText.textContent = 'Pause';
          this.simulateUpload(uploadId, 8000); // Resume simulation
        }
      }
    }
  }

  startQueue(queueId) {
    const instance = this.activeUploads.get(queueId);
    if (instance) {
      instance.isActive = true;
      const startBtn = document.getElementById(`${queueId}-start`);
      const pauseBtn = document.getElementById(`${queueId}-pause`);
      
      if (startBtn) startBtn.disabled = true;
      if (pauseBtn) pauseBtn.disabled = false;
      
      // Start processing queue
      this.processQueue(queueId);
    }
  }

  pauseQueue(queueId) {
    const instance = this.activeUploads.get(queueId);
    if (instance) {
      instance.isPaused = !instance.isPaused;
      // Implementation for pausing/resuming queue
    }
  }

  clearQueue(queueId) {
    const instance = this.activeUploads.get(queueId);
    if (instance) {
      this.activeUploads.delete(queueId);
      // Show confirmation or redirect
    }
  }

  processQueue(queueId) {
    // Implementation for processing upload queue
    console.log(`Processing queue ${queueId}`);
  }

  // File action methods
  viewFile(fileUrl) {
    window.open(fileUrl, '_blank');
  }

  shareFile(fileUrl) {
    if (navigator.share) {
      navigator.share({ url: fileUrl });
    } else {
      // Fallback for sharing
      console.log(`Share file: ${fileUrl}`);
    }
  }

  uploadMore() {
    // Trigger new upload flow
    console.log('Upload more files');
  }

  /**
   * Hide upload loader
   */
  hideLoader(uploadId, options = {}) {
    const instance = this.activeUploads.get(uploadId);
    if (!instance) return;
    
    const element = document.getElementById(uploadId);
    if (element) {
      element.classList.add('fade-out');
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        this.activeUploads.delete(uploadId);
        if (options.onComplete) options.onComplete();
      }, 300);
    } else {
      this.activeUploads.delete(uploadId);
      if (options.onComplete) options.onComplete();
    }
  }

  /**
   * Inject upload-specific styles
   */
  injectUploadStyles() {
    const styles = `
      <style id="gaming-upload-styles">
        /* Base Upload Styles */
        .gaming-upload-loader,
        .gaming-upload-queue,
        .upload-complete-loader {
          padding: 2rem;
          background: ${this.options.surfaceBg}95;
          border-radius: 12px;
          border: 1px solid ${this.options.primaryColor}30;
          backdrop-filter: blur(15px);
          min-height: 300px;
        }
        
        /* Single File Upload */
        .upload-container {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .upload-visual {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding: 0 2rem;
        }
        
        .file-representation {
          position: relative;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .file-preview {
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          background: ${this.options.darkBg};
          border: 2px solid ${this.options.primaryColor}30;
        }
        
        .file-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .video-preview {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, ${this.options.darkBg}, ${this.options.surfaceBg});
        }
        
        .play-button {
          font-size: 2rem;
          opacity: 0.8;
        }
        
        .file-icon-container {
          position: relative;
        }
        
        .file-icon {
          font-size: 4rem;
          display: block;
          position: relative;
          z-index: 2;
          animation: fileFloat 3s ease-in-out infinite;
        }
        
        .file-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, ${this.options.primaryColor}20, transparent);
          border-radius: 50%;
          animation: fileGlow 2s ease-in-out infinite;
        }
        
        @keyframes fileFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes fileGlow {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        }
        
        /* Upload Beam */
        .upload-beam {
          position: relative;
          width: 200px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .beam-line {
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, 
            transparent, 
            ${this.options.primaryColor}, 
            ${this.options.accentColor}, 
            ${this.options.primaryColor}, 
            transparent
          );
          border-radius: 2px;
          animation: beamPulse 2s ease-in-out infinite;
        }
        
        @keyframes beamPulse {
          0%, 100% { opacity: 0.6; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.5); }
        }
        
        .beam-particles {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        
        .upload-particle {
          position: absolute;
          background: ${this.options.primaryColor};
          border-radius: 50%;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          animation: particleMove 3s linear infinite;
        }
        
        @keyframes particleMove {
          0% { left: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        
        /* Server Icon */
        .server-icon {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .server-body {
          font-size: 3rem;
          position: relative;
          z-index: 2;
          animation: serverBounce 2s ease-in-out infinite;
        }
        
        .server-pulse {
          position: absolute;
          width: 100px;
          height: 100px;
          border: 2px solid ${this.options.accentColor};
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: serverPulse 2s ease-out infinite;
        }
        
        @keyframes serverBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes serverPulse {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
        }
        
        /* Upload Information */
        .upload-info {
          margin-bottom: 2rem;
        }
        
        .file-details {
          margin-bottom: 1.5rem;
        }
        
        .file-name {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
          margin-bottom: 0.5rem;
          word-break: break-word;
        }
        
        .file-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }
        
        .file-size {
          font-size: 1rem;
          color: #9ca3af;
        }
        
        .file-type-badge {
          background: ${this.options.accentColor};
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        /* Progress Container */
        .upload-progress-container {
          margin-bottom: 1.5rem;
        }
        
        .progress-track {
          width: 100%;
          height: 16px;
          background: ${this.options.darkBg};
          border-radius: 8px;
          position: relative;
          overflow: hidden;
          border: 2px solid ${this.options.primaryColor}30;
          margin-bottom: 0.75rem;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, 
            ${this.options.primaryColor}, 
            ${this.options.accentColor}, 
            ${this.options.primaryColor}
          );
          background-size: 200% 100%;
          border-radius: 8px;
          width: 0%;
          transition: width 0.5s ease;
          animation: progressShimmer 2s linear infinite;
        }
        
        @keyframes progressShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .progress-glow {
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          background: linear-gradient(90deg, transparent, ${this.options.primaryColor}40, transparent);
          border-radius: 12px;
          opacity: 0.6;
          animation: progressGlow 3s ease-in-out infinite;
        }
        
        @keyframes progressGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        .progress-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .progress-percentage {
          font-size: 1.25rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
          text-shadow: 0 0 10px ${this.options.primaryColor}40;
        }
        
        .upload-speed {
          font-size: 1rem;
          color: ${this.options.accentColor};
          font-weight: 500;
        }
        
        /* Upload Status */
        .upload-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 1rem;
          background: ${this.options.darkBg}60;
          border-radius: 8px;
          border: 1px solid ${this.options.primaryColor}20;
          margin-bottom: 2rem;
        }
        
        .status-icon {
          width: 32px;
          height: 32px;
          position: relative;
        }
        
        .status-spinner {
          width: 100%;
          height: 100%;
          border: 3px solid ${this.options.primaryColor}30;
          border-top-color: ${this.options.primaryColor};
          border-radius: 50%;
          animation: statusSpin 1s linear infinite;
        }
        
        @keyframes statusSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .status-text {
          font-size: 1rem;
          color: ${this.options.primaryColor};
          font-weight: 500;
        }
        
        /* Upload Stats */
        .upload-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .stat-item {
          text-align: center;
          padding: 1rem;
          background: ${this.options.darkBg}40;
          border-radius: 8px;
          border: 1px solid ${this.options.primaryColor}20;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-value {
          font-size: 1rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
        }
        
        /* Upload Actions */
        .upload-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          text-decoration: none;
        }
        
        .cancel-btn {
          background: ${this.options.errorColor};
          color: white;
        }
        
        .cancel-btn:hover {
          background: ${this.options.errorColor}dd;
          transform: translateY(-1px);
        }
        
        .pause-btn {
          background: ${this.options.warningColor};
          color: ${this.options.darkBg};
        }
        
        .pause-btn:hover {
          background: ${this.options.warningColor}dd;
          transform: translateY(-1px);
        }
        
        .primary-btn {
          background: ${this.options.primaryColor};
          color: ${this.options.darkBg};
        }
        
        .primary-btn:hover {
          background: ${this.options.primaryColor}dd;
          transform: translateY(-1px);
        }
        
        .secondary-btn {
          background: ${this.options.accentColor};
          color: white;
        }
        
        .secondary-btn:hover {
          background: ${this.options.accentColor}dd;
          transform: translateY(-1px);
        }
        
        .tertiary-btn {
          background: ${this.options.surfaceBg};
          color: #d1d5db;
          border: 1px solid #4b5563;
        }
        
        .tertiary-btn:hover {
          background: #374151;
          border-color: #6b7280;
        }
        
        .btn-icon {
          font-size: 1rem;
        }
        
        .btn-text {
          font-size: 0.875rem;
        }
        
        /* Upload Queue Styles */
        .gaming-upload-queue .queue-container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .queue-header {
          margin-bottom: 2rem;
        }
        
        .queue-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .title-text {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
        }
        
        .queue-stats {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        
        .file-count,
        .total-size {
          font-size: 0.875rem;
          color: #9ca3af;
          background: ${this.options.darkBg}60;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
        }
        
        .overall-progress {
          margin-bottom: 1rem;
        }
        
        .overall-track {
          width: 100%;
          height: 12px;
          background: ${this.options.darkBg};
          border-radius: 6px;
          position: relative;
          overflow: hidden;
          border: 2px solid ${this.options.primaryColor}30;
          margin-bottom: 0.5rem;
        }
        
        .overall-fill {
          height: 100%;
          background: linear-gradient(90deg, ${this.options.primaryColor}, ${this.options.accentColor});
          border-radius: 6px;
          width: 0%;
          transition: width 0.5s ease;
        }
        
        .overall-glow {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(90deg, transparent, ${this.options.primaryColor}30, transparent);
          border-radius: 8px;
          animation: overallGlow 3s linear infinite;
        }
        
        @keyframes overallGlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .overall-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .overall-percentage {
          font-size: 1rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
        }
        
        .overall-speed {
          font-size: 0.875rem;
          color: ${this.options.accentColor};
        }
        
        /* File Queue */
        .file-queue {
          margin-bottom: 2rem;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .queue-file {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: ${this.options.darkBg}40;
          border-radius: 8px;
          border: 1px solid ${this.options.primaryColor}20;
          margin-bottom: 0.75rem;
          transition: all 0.3s ease;
        }
        
        .queue-file:hover {
          border-color: ${this.options.primaryColor}40;
          background: ${this.options.darkBg}60;
        }
        
        .queue-file.active {
          border-color: ${this.options.accentColor};
          background: ${this.options.accentColor}10;
        }
        
        .queue-file.completed {
          border-color: ${this.options.successColor};
          background: ${this.options.successColor}10;
        }
        
        .file-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }
        
        .file-info .file-icon {
          font-size: 2rem;
        }
        
        .file-details {
          display: flex;
          flex-direction: column;
        }
        
        .file-info .file-name {
          font-size: 1rem;
          font-weight: 600;
          color: white;
          margin-bottom: 0.25rem;
        }
        
        .file-info .file-size {
          font-size: 0.875rem;
          color: #9ca3af;
        }
        
        .file-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 100px;
        }
        
        .file-status .status-text {
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .status-indicator.waiting {
          background: #6b7280;
        }
        
        .status-indicator.active {
          background: ${this.options.accentColor};
          animation: statusPulse 2s ease-in-out infinite;
        }
        
        .status-indicator.completed {
          background: ${this.options.successColor};
        }
        
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .file-progress {
          min-width: 100px;
        }
        
        .mini-progress-track {
          width: 100%;
          height: 6px;
          background: ${this.options.darkBg};
          border-radius: 3px;
          overflow: hidden;
        }
        
        .mini-progress-fill {
          height: 100%;
          background: ${this.options.primaryColor};
          border-radius: 3px;
          width: 0%;
          transition: width 0.3s ease;
        }
        
        /* Queue Controls */
        .queue-controls {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 2rem;
        }
        
        .control-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          text-decoration: none;
        }
        
        .start-btn {
          background: ${this.options.successColor};
          color: white;
        }
        
        .start-btn:hover:not(:disabled) {
          background: ${this.options.successColor}dd;
          transform: translateY(-1px);
        }
        
        .pause-all-btn {
          background: ${this.options.warningColor};
          color: ${this.options.darkBg};
        }
        
        .pause-all-btn:hover:not(:disabled) {
          background: ${this.options.warningColor}dd;
          transform: translateY(-1px);
        }
        
        .clear-btn {
          background: ${this.options.errorColor};
          color: white;
        }
        
        .clear-btn:hover {
          background: ${this.options.errorColor}dd;
          transform: translateY(-1px);
        }
        
        .control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }
        
        /* Upload Summary */
        .upload-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }
        
        .summary-item {
          text-align: center;
          padding: 1rem;
          background: ${this.options.darkBg}60;
          border-radius: 8px;
          border: 1px solid ${this.options.primaryColor}20;
        }
        
        .summary-label {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .summary-value {
          font-size: 1rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
        }
        
        /* Upload Complete Styles */
        .upload-complete-loader .complete-container {
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
        }
        
        .success-animation {
          position: relative;
          margin-bottom: 2rem;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .success-circle {
          width: 100px;
          height: 100px;
          border: 4px solid ${this.options.successColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 3;
          animation: successBounce 0.6s ease-out;
        }
        
        @keyframes successBounce {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        .checkmark {
          position: relative;
          width: 40px;
          height: 40px;
        }
        
        .checkmark-stem,
        .checkmark-kick {
          position: absolute;
          background: ${this.options.successColor};
          border-radius: 2px;
        }
        
        .checkmark-stem {
          width: 3px;
          height: 16px;
          top: 16px;
          left: 18px;
          transform: rotate(45deg);
          animation: checkmarkStem 0.3s ease-out 0.6s both;
        }
        
        .checkmark-kick {
          width: 3px;
          height: 8px;
          top: 24px;
          left: 10px;
          transform: rotate(-45deg);
          animation: checkmarkKick 0.3s ease-out 0.9s both;
        }
        
        @keyframes checkmarkStem {
          0% { height: 0; }
          100% { height: 16px; }
        }
        
        @keyframes checkmarkKick {
          0% { height: 0; }
          100% { height: 8px; }
        }
        
        .celebration-particles {
          position: absolute;
          width: 300px;
          height: 300px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 1;
        }
        
        .celebration-particle {
          position: absolute;
          border-radius: 50%;
          animation: celebrationFloat 4s ease-out infinite;
        }
        
        @keyframes celebrationFloat {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) scale(0.2);
            opacity: 0;
          }
        }
        
        .success-waves {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
        }
        
        .success-waves .wave {
          position: absolute;
          border: 2px solid ${this.options.successColor}60;
          border-radius: 50%;
          animation: successWave 3s ease-out infinite;
        }
        
        .success-waves .wave-1 {
          width: 120px;
          height: 120px;
          top: -60px;
          left: -60px;
          animation-delay: 0s;
        }
        
        .success-waves .wave-2 {
          width: 180px;
          height: 180px;
          top: -90px;
          left: -90px;
          animation-delay: 1s;
        }
        
        .success-waves .wave-3 {
          width: 240px;
          height: 240px;
          top: -120px;
          left: -120px;
          animation-delay: 2s;
        }
        
        @keyframes successWave {
          0% {
            opacity: 1;
            transform: scale(0.5);
          }
          100% {
            opacity: 0;
            transform: scale(2);
          }
        }
        
        /* Completion Message */
        .completion-message {
          margin-bottom: 2rem;
        }
        
        .complete-title {
          font-size: 2rem;
          font-weight: bold;
          color: ${this.options.successColor};
          margin-bottom: 1rem;
          text-shadow: 0 0 20px ${this.options.successColor}40;
        }
        
        .complete-subtitle {
          font-size: 1.1rem;
          color: #d1d5db;
          line-height: 1.6;
        }
        
        /* Completion Summary */
        .completion-summary {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: ${this.options.darkBg}60;
          border-radius: 8px;
          border: 1px solid ${this.options.successColor}30;
        }
        
        .summary-stat {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .summary-stat .stat-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        
        .summary-stat .stat-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .summary-stat .stat-label {
          font-size: 0.875rem;
          color: #9ca3af;
        }
        
        .summary-stat .stat-value {
          font-size: 0.875rem;
          font-weight: bold;
          color: ${this.options.successColor};
        }
        
        /* Completion Actions */
        .completion-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .upload-visual {
            flex-direction: column;
            gap: 2rem;
            padding: 0;
          }
          
          .upload-beam {
            width: 100px;
            transform: rotate(90deg);
          }
          
          .upload-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .upload-actions,
          .completion-actions,
          .queue-controls {
            flex-direction: column;
          }
          
          .queue-file {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .file-status,
          .file-progress {
            min-width: auto;
            width: 100%;
          }
          
          .file-info {
            width: 100%;
          }
          
          .overall-stats,
          .progress-stats {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
          }
          
          .success-animation {
            height: 150px;
          }
          
          .celebration-particles {
            width: 200px;
            height: 200px;
          }
        }
        
        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .file-icon,
          .server-body,
          .beam-line,
          .upload-particle,
          .celebration-particle,
          .success-waves .wave,
          .checkmark-stem,
          .checkmark-kick {
            animation: none;
          }
          
          .success-circle {
            animation: none;
            transform: scale(1);
          }
        }
        
        /* High contrast mode */
        @media (prefers-contrast: high) {
          .gaming-upload-loader,
          .gaming-upload-queue,
          .upload-complete-loader {
            border: 2px solid ${this.options.primaryColor};
          }
          
          .progress-track,
          .overall-track,
          .mini-progress-track {
            border: 2px solid currentColor;
          }
          
          .success-circle {
            border: 4px solid ${this.options.successColor};
          }
        }
      </style>
    `;
    
    const existingStyles = document.getElementById('gaming-upload-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }
}

// Initialize global upload manager
if (typeof window !== 'undefined') {
  window.uploadManager = new GamingUploadProgress();
  
  // Bind methods for onclick handlers
  const methods = [
    'cancelUpload', 'pauseUpload', 'startQueue', 'pauseQueue', 'clearQueue',
    'viewFile', 'shareFile', 'uploadMore'
  ];
  
  methods.forEach(method => {
    window.uploadManager[method] = window.uploadManager[method].bind(window.uploadManager);
  });
  
  console.log('📤 Gaming Upload Progress ready for action!');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GamingUploadProgress;
}