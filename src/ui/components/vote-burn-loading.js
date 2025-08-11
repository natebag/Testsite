/**
 * Vote Submission & Token Burn Loading Effects
 * Specialized loading animations for MLG token burn voting with dramatic visual effects
 */

class VoteBurnLoading {
  constructor(options = {}) {
    this.options = {
      primaryColor: '#00ff88',
      burnColor: '#ef4444',
      fireColor: '#f97316',
      emberColor: '#fbbf24',
      darkBg: '#0a0a0f',
      surfaceBg: '#1a1a2e',
      successColor: '#10b981',
      ...options
    };
    
    this.activeVoteLoaders = new Map();
    this.burnAnimations = new Map();
    
    this.init();
  }

  init() {
    this.injectVoteStyles();
    console.log('🔥 Vote Burn Loading initialized');
  }

  /**
   * Show token burn animation for voting
   * @param {HTMLElement} container - Target container
   * @param {Object} options - Vote options
   */
  showTokenBurn(container, options = {}) {
    const loaderId = this.generateId();
    const tokenAmount = options.amount || 25;
    const tokenSymbol = options.symbol || 'MLG';
    const contentTitle = options.contentTitle || 'Content Item';
    const voteType = options.type || 'upvote'; // upvote, downvote
    
    const loaderHTML = `
      <div id="${loaderId}" class="vote-burn-loader fade-in">
        <div class="burn-container">
          <!-- Token Burn Visual -->
          <div class="token-burn-visual">
            <div class="burn-chamber">
              <!-- Token being burned -->
              <div class="burning-token">
                <div class="token-icon">🪙</div>
                <div class="token-amount">${tokenAmount}</div>
                <div class="token-symbol">${tokenSymbol}</div>
              </div>
              
              <!-- Fire animation -->
              <div class="fire-container">
                <div class="flame flame-1"></div>
                <div class="flame flame-2"></div>
                <div class="flame flame-3"></div>
                <div class="flame flame-4"></div>
                <div class="flame flame-5"></div>
              </div>
              
              <!-- Ember particles -->
              <div class="ember-container">
                ${this.generateEmberParticles(20)}
              </div>
              
              <!-- Smoke effect -->
              <div class="smoke-container">
                <div class="smoke smoke-1"></div>
                <div class="smoke smoke-2"></div>
                <div class="smoke smoke-3"></div>
              </div>
            </div>
            
            <!-- Burn progress ring -->
            <div class="burn-progress-ring">
              <div class="progress-track"></div>
              <div class="progress-fill" id="${loaderId}-progress-ring"></div>
              <div class="ring-center">
                <div class="burn-icon">🔥</div>
              </div>
            </div>
          </div>
          
          <!-- Vote Information -->
          <div class="vote-info">
            <h3 class="vote-title">
              ${voteType === 'upvote' ? '⬆️ Upvoting' : '⬇️ Downvoting'} Content
            </h3>
            <div class="content-info">
              <div class="content-title">"${contentTitle}"</div>
              <div class="burn-details">
                <div class="detail-item">
                  <span class="detail-label">Burning:</span>
                  <span class="detail-value burn-amount">${tokenAmount} ${tokenSymbol}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Vote Power:</span>
                  <span class="detail-value vote-power">+${tokenAmount} points</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Burn Stages -->
          <div class="burn-stages">
            <div class="stage" id="${loaderId}-stage-1">
              <div class="stage-icon">🪙</div>
              <div class="stage-text">Preparing tokens</div>
              <div class="stage-status">Ready</div>
            </div>
            
            <div class="stage" id="${loaderId}-stage-2">
              <div class="stage-icon">🔥</div>
              <div class="stage-text">Igniting burn</div>
              <div class="stage-status">Waiting</div>
            </div>
            
            <div class="stage" id="${loaderId}-stage-3">
              <div class="stage-icon">📊</div>
              <div class="stage-text">Recording vote</div>
              <div class="stage-status">Waiting</div>
            </div>
            
            <div class="stage" id="${loaderId}-stage-4">
              <div class="stage-icon">✅</div>
              <div class="stage-text">Vote confirmed</div>
              <div class="stage-status">Waiting</div>
            </div>
          </div>
          
          <!-- Burn Statistics -->
          <div class="burn-stats">
            <div class="stat-item">
              <div class="stat-label">Total Burned Today</div>
              <div class="stat-value" id="${loaderId}-total-burned">
                ${(Math.random() * 50000 + 25000).toFixed(0)} ${tokenSymbol}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Your Votes Today</div>
              <div class="stat-value" id="${loaderId}-user-votes">
                ${Math.floor(Math.random() * 10 + 1)}/10
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Burn Rate</div>
              <div class="stat-value burn-rate">
                ${tokenAmount} ${tokenSymbol}/vote
              </div>
            </div>
          </div>
          
          <!-- Transaction Hash -->
          <div class="transaction-info" id="${loaderId}-tx-info" style="display: none;">
            <div class="tx-label">Transaction Hash:</div>
            <div class="tx-hash" id="${loaderId}-tx-hash">...</div>
            <button class="tx-link-btn" onclick="window.voteBurner.viewTransaction('${loaderId}')">
              View on Solana Explorer
            </button>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = loaderHTML;
    this.activeVoteLoaders.set(loaderId, {
      container,
      type: 'burn',
      startTime: Date.now(),
      tokenAmount,
      voteType,
      currentStage: 0
    });
    
    // Start burn animation sequence
    this.animateBurnSequence(loaderId, options.duration || 5000);
    
    return loaderId;
  }

  /**
   * Show vote confirmation loading
   * @param {HTMLElement} container - Target container
   * @param {Object} options - Confirmation options
   */
  showVoteConfirmation(container, options = {}) {
    const loaderId = this.generateId();
    const voteType = options.type || 'upvote';
    const contentTitle = options.contentTitle || 'Content Item';
    const previousVotes = options.previousVotes || 847;
    const userVoteWeight = options.voteWeight || 25;
    
    const loaderHTML = `
      <div id="${loaderId}" class="vote-confirmation-loader fade-in">
        <div class="confirmation-container">
          <!-- Vote Impact Visual -->
          <div class="vote-impact-visual">
            <div class="vote-meter">
              <div class="meter-background">
                <div class="meter-fill" id="${loaderId}-meter-fill"></div>
                <div class="meter-needle" id="${loaderId}-meter-needle"></div>
              </div>
              <div class="meter-labels">
                <span class="label-low">Low Impact</span>
                <span class="label-high">High Impact</span>
              </div>
            </div>
            
            <div class="impact-waves">
              <div class="wave wave-1"></div>
              <div class="wave wave-2"></div>
              <div class="wave wave-3"></div>
            </div>
          </div>
          
          <!-- Vote Summary -->
          <div class="vote-summary">
            <h3 class="confirmation-title">
              ${voteType === 'upvote' ? '🚀 Boosting' : '🛑 Reducing'} Content Ranking
            </h3>
            
            <div class="content-summary">
              <div class="content-title">"${contentTitle}"</div>
              <div class="vote-change">
                <div class="previous-count">${previousVotes} votes</div>
                <div class="vote-arrow">${voteType === 'upvote' ? '→' : '↓'}</div>
                <div class="new-count">${previousVotes + (voteType === 'upvote' ? userVoteWeight : -userVoteWeight)} votes</div>
              </div>
            </div>
            
            <div class="impact-details">
              <div class="impact-item">
                <span class="impact-label">Your Vote Weight:</span>
                <span class="impact-value">+${userVoteWeight} points</span>
              </div>
              <div class="impact-item">
                <span class="impact-label">Ranking Change:</span>
                <span class="impact-value ranking-change" id="${loaderId}-ranking">Calculating...</span>
              </div>
              <div class="impact-item">
                <span class="impact-label">Community Impact:</span>
                <span class="impact-value community-impact" id="${loaderId}-community">Processing...</span>
              </div>
            </div>
          </div>
          
          <!-- Network Activity -->
          <div class="network-activity">
            <div class="activity-header">
              <h4 class="activity-title">Network Activity</h4>
              <div class="activity-indicator">
                <div class="indicator-dot"></div>
                <span class="indicator-text">Broadcasting vote...</span>
              </div>
            </div>
            
            <div class="activity-feed" id="${loaderId}-activity">
              <div class="activity-item">
                <div class="activity-time">Now</div>
                <div class="activity-text">Vote transaction initiated</div>
              </div>
              <div class="activity-item">
                <div class="activity-time">+1s</div>
                <div class="activity-text">Token burn confirmed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = loaderHTML;
    this.activeVoteLoaders.set(loaderId, {
      container,
      type: 'confirmation',
      startTime: Date.now(),
      voteType,
      previousVotes,
      userVoteWeight
    });
    
    // Start confirmation animation
    this.animateVoteConfirmation(loaderId, options.duration || 4000);
    
    return loaderId;
  }

  /**
   * Show daily vote limit reached
   * @param {HTMLElement} container - Target container
   * @param {Object} options - Limit options
   */
  showVoteLimitReached(container, options = {}) {
    const loaderId = this.generateId();
    const votesUsed = options.votesUsed || 4;
    const dailyLimit = options.dailyLimit || 4;
    const resetTime = options.resetTime || '24h';
    const burnCost = options.burnCost || 25;
    const tokenSymbol = options.symbol || 'MLG';
    const userBalance = options.balance || 1250;
    
    const canAffordBurn = userBalance >= burnCost;
    
    const loaderHTML = `
      <div id="${loaderId}" class="vote-limit-loader fade-in">
        <div class="limit-container">
          <!-- Limit Visual -->
          <div class="limit-visual">
            <div class="limit-gauge">
              <div class="gauge-track">
                <div class="gauge-fill" style="width: ${(votesUsed / dailyLimit) * 100}%"></div>
              </div>
              <div class="gauge-label">
                <span class="votes-used">${votesUsed}</span>
                <span class="votes-total">/${dailyLimit}</span>
              </div>
            </div>
            
            <div class="limit-icon">
              <div class="icon-background">🚫</div>
              <div class="icon-pulse"></div>
            </div>
          </div>
          
          <!-- Limit Information -->
          <div class="limit-info">
            <h3 class="limit-title">Daily Vote Limit Reached</h3>
            <p class="limit-description">
              You've used all ${dailyLimit} of your free daily votes. 
              Your votes reset in ${resetTime}.
            </p>
            
            <div class="reset-timer">
              <div class="timer-icon">⏰</div>
              <div class="timer-text">
                <span class="timer-label">Votes reset in:</span>
                <span class="timer-countdown" id="${loaderId}-countdown">23:45:12</span>
              </div>
            </div>
          </div>
          
          <!-- Burn Option -->
          <div class="burn-option">
            <h4 class="option-title">Continue Voting with Token Burn</h4>
            <div class="option-description">
              Burn ${burnCost} ${tokenSymbol} tokens to cast additional votes beyond your daily limit.
            </div>
            
            <div class="burn-cost-breakdown">
              <div class="cost-item">
                <span class="cost-label">Cost per vote:</span>
                <span class="cost-value">${burnCost} ${tokenSymbol}</span>
              </div>
              <div class="cost-item">
                <span class="cost-label">Your balance:</span>
                <span class="cost-value balance-amount">${userBalance} ${tokenSymbol}</span>
              </div>
              <div class="cost-item">
                <span class="cost-label">After this vote:</span>
                <span class="cost-value remaining-balance">${userBalance - burnCost} ${tokenSymbol}</span>
              </div>
            </div>
            
            ${canAffordBurn ? `
              <div class="burn-actions">
                <button class="burn-btn confirm-burn" onclick="window.voteBurner.confirmBurn('${loaderId}')">
                  <div class="btn-icon">🔥</div>
                  <div class="btn-text">
                    <div class="btn-title">Burn & Vote</div>
                    <div class="btn-subtitle">${burnCost} ${tokenSymbol}</div>
                  </div>
                </button>
                
                <button class="burn-btn cancel-burn" onclick="window.voteBurner.cancelBurn('${loaderId}')">
                  <div class="btn-icon">❌</div>
                  <div class="btn-text">
                    <div class="btn-title">Cancel</div>
                    <div class="btn-subtitle">Keep tokens</div>
                  </div>
                </button>
              </div>
            ` : `
              <div class="insufficient-balance">
                <div class="balance-warning">
                  <div class="warning-icon">⚠️</div>
                  <div class="warning-text">
                    <div class="warning-title">Insufficient Balance</div>
                    <div class="warning-subtitle">
                      You need ${burnCost - userBalance} more ${tokenSymbol} tokens to continue voting.
                    </div>
                  </div>
                </div>
                
                <div class="balance-actions">
                  <button class="action-btn get-tokens" onclick="window.voteBurner.getMoreTokens()">
                    <span class="btn-icon">💰</span>
                    <span class="btn-text">Get More Tokens</span>
                  </button>
                  
                  <button class="action-btn go-back" onclick="window.voteBurner.goBack('${loaderId}')">
                    <span class="btn-icon">←</span>
                    <span class="btn-text">Go Back</span>
                  </button>
                </div>
              </div>
            `}
          </div>
          
          <!-- Burn Statistics -->
          <div class="limit-stats">
            <div class="stat-box">
              <div class="stat-icon">🔥</div>
              <div class="stat-content">
                <div class="stat-value">${(Math.random() * 10000 + 5000).toFixed(0)}</div>
                <div class="stat-label">Tokens burned today</div>
              </div>
            </div>
            
            <div class="stat-box">
              <div class="stat-icon">🗳️</div>
              <div class="stat-content">
                <div class="stat-value">${Math.floor(Math.random() * 500 + 200)}</div>
                <div class="stat-label">Burn votes today</div>
              </div>
            </div>
            
            <div class="stat-box">
              <div class="stat-icon">📈</div>
              <div class="stat-content">
                <div class="stat-value">${burnCost}</div>
                <div class="stat-label">Current burn rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = loaderHTML;
    this.activeVoteLoaders.set(loaderId, {
      container,
      type: 'limit',
      startTime: Date.now(),
      canAffordBurn,
      burnCost,
      userBalance
    });
    
    // Start countdown timer
    this.startCountdownTimer(loaderId);
    
    return loaderId;
  }

  /**
   * Animate burn sequence
   */
  animateBurnSequence(loaderId, duration) {
    const instance = this.activeVoteLoaders.get(loaderId);
    if (!instance) return;
    
    const stageCount = 4;
    const stageDuration = duration / stageCount;
    const progressRing = document.getElementById(`${loaderId}-progress-ring`);
    
    // Animate progress ring
    if (progressRing) {
      progressRing.style.transition = `stroke-dashoffset ${duration}ms ease-out`;
      setTimeout(() => {
        progressRing.style.strokeDashoffset = '0';
      }, 100);
    }
    
    // Animate stages
    for (let i = 0; i < stageCount; i++) {
      setTimeout(() => {
        this.activateBurnStage(loaderId, i + 1);
        instance.currentStage = i + 1;
        
        // Add activities to feed
        this.addBurnActivity(loaderId, i + 1);
        
        // Generate transaction hash on final stage
        if (i === stageCount - 1) {
          setTimeout(() => {
            this.showTransactionHash(loaderId);
          }, 500);
        }
      }, i * stageDuration);
    }
  }

  /**
   * Animate vote confirmation
   */
  animateVoteConfirmation(loaderId, duration) {
    const instance = this.activeVoteLoaders.get(loaderId);
    if (!instance) return;
    
    const meterFill = document.getElementById(`${loaderId}-meter-fill`);
    const meterNeedle = document.getElementById(`${loaderId}-meter-needle`);
    const rankingElement = document.getElementById(`${loaderId}-ranking`);
    const communityElement = document.getElementById(`${loaderId}-community`);
    
    // Animate meter
    if (meterFill && meterNeedle) {
      const impact = Math.min(instance.userVoteWeight / 100, 1);
      
      setTimeout(() => {
        meterFill.style.width = `${impact * 100}%`;
        meterNeedle.style.transform = `rotate(${impact * 180 - 90}deg)`;
      }, 500);
      
      // Update ranking
      setTimeout(() => {
        if (rankingElement) {
          const rankingChange = Math.floor(Math.random() * 10) + 1;
          rankingElement.textContent = `+${rankingChange} positions`;
          rankingElement.classList.add('positive-change');
        }
      }, 1500);
      
      // Update community impact
      setTimeout(() => {
        if (communityElement) {
          const impactLevel = impact > 0.7 ? 'High' : impact > 0.4 ? 'Medium' : 'Low';
          communityElement.textContent = `${impactLevel} impact`;
          communityElement.classList.add(`impact-${impactLevel.toLowerCase()}`);
        }
      }, 2500);
    }
    
    // Add network activities
    const activities = [
      { delay: 1000, text: 'Vote weight calculated' },
      { delay: 2000, text: 'Ranking algorithm updated' },
      { delay: 3000, text: 'Community metrics refreshed' },
      { delay: 3500, text: 'Vote confirmation complete' }
    ];
    
    activities.forEach(activity => {
      setTimeout(() => {
        this.addNetworkActivity(loaderId, activity.text);
      }, activity.delay);
    });
  }

  /**
   * Generate ember particles
   */
  generateEmberParticles(count) {
    let particles = '';
    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 3;
      const duration = 2 + Math.random() * 2;
      const size = Math.random() * 4 + 2;
      const x = Math.random() * 200 - 100;
      const y = Math.random() * 200 - 100;
      
      particles += `
        <div class="ember-particle" 
             style="
               left: ${x}px; 
               top: ${y}px; 
               width: ${size}px; 
               height: ${size}px;
               animation-delay: ${delay}s;
               animation-duration: ${duration}s;
             "></div>
      `;
    }
    return particles;
  }

  /**
   * Activate burn stage
   */
  activateBurnStage(loaderId, stageNumber) {
    const stageElement = document.getElementById(`${loaderId}-stage-${stageNumber}`);
    if (stageElement) {
      stageElement.classList.add('stage-active');
      
      const statusElement = stageElement.querySelector('.stage-status');
      if (statusElement) {
        statusElement.textContent = 'Processing...';
      }
      
      setTimeout(() => {
        stageElement.classList.remove('stage-active');
        stageElement.classList.add('stage-completed');
        
        if (statusElement) {
          statusElement.textContent = 'Completed';
        }
      }, 1000);
    }
  }

  /**
   * Add burn activity
   */
  addBurnActivity(loaderId, stage) {
    const activities = [
      'Token burn initiated',
      'Flame intensity increased', 
      'Vote weight calculated',
      'Transaction confirmed'
    ];
    
    console.log(`Burn activity: ${activities[stage - 1]}`);
  }

  /**
   * Add network activity
   */
  addNetworkActivity(loaderId, text) {
    const activityFeed = document.getElementById(`${loaderId}-activity`);
    if (activityFeed) {
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item fade-in';
      activityItem.innerHTML = `
        <div class="activity-time">+${Math.floor((Date.now() - this.activeVoteLoaders.get(loaderId).startTime) / 1000)}s</div>
        <div class="activity-text">${text}</div>
      `;
      activityFeed.appendChild(activityItem);
      
      // Limit to 5 activities
      const items = activityFeed.querySelectorAll('.activity-item');
      if (items.length > 5) {
        items[0].remove();
      }
    }
  }

  /**
   * Show transaction hash
   */
  showTransactionHash(loaderId) {
    const txInfo = document.getElementById(`${loaderId}-tx-info`);
    const txHash = document.getElementById(`${loaderId}-tx-hash`);
    
    if (txInfo && txHash) {
      // Generate fake transaction hash
      const hash = this.generateTransactionHash();
      txHash.textContent = `${hash.slice(0, 8)}...${hash.slice(-8)}`;
      txHash.title = hash;
      
      txInfo.style.display = 'block';
      
      // Store full hash for viewing
      const instance = this.activeVoteLoaders.get(loaderId);
      if (instance) {
        instance.transactionHash = hash;
      }
    }
  }

  /**
   * Start countdown timer
   */
  startCountdownTimer(loaderId) {
    const countdownElement = document.getElementById(`${loaderId}-countdown`);
    if (!countdownElement) return;
    
    let timeLeft = 23 * 3600 + 45 * 60 + 12; // 23h 45m 12s
    
    const updateTimer = () => {
      const hours = Math.floor(timeLeft / 3600);
      const minutes = Math.floor((timeLeft % 3600) / 60);
      const seconds = timeLeft % 60;
      
      countdownElement.textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      if (timeLeft > 0) {
        timeLeft--;
        setTimeout(updateTimer, 1000);
      }
    };
    
    updateTimer();
  }

  /**
   * Generate transaction hash
   */
  generateTransactionHash() {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return 'vote-loader-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Button handlers
  confirmBurn(loaderId) {
    const instance = this.activeVoteLoaders.get(loaderId);
    if (instance) {
      // Replace content with burn animation
      this.showTokenBurn(instance.container, {
        amount: instance.burnCost,
        symbol: 'MLG'
      });
    }
  }

  cancelBurn(loaderId) {
    const instance = this.activeVoteLoaders.get(loaderId);
    if (instance) {
      this.hideLoader(loaderId);
    }
  }

  getMoreTokens() {
    // This would typically redirect to a token acquisition flow
    console.log('Redirect to token acquisition');
  }

  goBack(loaderId) {
    const instance = this.activeVoteLoaders.get(loaderId);
    if (instance) {
      this.hideLoader(loaderId);
    }
  }

  viewTransaction(loaderId) {
    const instance = this.activeVoteLoaders.get(loaderId);
    if (instance && instance.transactionHash) {
      window.open(`https://explorer.solana.com/tx/${instance.transactionHash}`, '_blank');
    }
  }

  /**
   * Hide vote loader
   */
  hideLoader(loaderId, options = {}) {
    const instance = this.activeVoteLoaders.get(loaderId);
    if (!instance) return;
    
    const element = document.getElementById(loaderId);
    if (element) {
      element.classList.add('fade-out');
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        this.activeVoteLoaders.delete(loaderId);
        if (options.onComplete) options.onComplete();
      }, 300);
    } else {
      this.activeVoteLoaders.delete(loaderId);
      if (options.onComplete) options.onComplete();
    }
  }

  /**
   * Inject vote-specific CSS styles
   */
  injectVoteStyles() {
    const styles = `
      <style id="vote-burn-styles">
        /* Vote Burn Loader Base */
        .vote-burn-loader,
        .vote-confirmation-loader,
        .vote-limit-loader {
          padding: 2rem;
          background: ${this.options.surfaceBg}95;
          border-radius: 12px;
          border: 1px solid ${this.options.primaryColor}30;
          backdrop-filter: blur(15px);
          min-height: 400px;
        }
        
        /* Token Burn Visual */
        .token-burn-visual {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .burn-chamber {
          position: relative;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, ${this.options.darkBg}, ${this.options.surfaceBg});
          border-radius: 50%;
          border: 2px solid ${this.options.burnColor}30;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          overflow: hidden;
        }
        
        .burning-token {
          position: relative;
          text-align: center;
          z-index: 3;
          animation: tokenShake 2s ease-in-out infinite;
        }
        
        .token-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
          filter: brightness(1.2) drop-shadow(0 0 10px ${this.options.emberColor}60);
          animation: tokenGlow 2s ease-in-out infinite;
        }
        
        .token-amount {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${this.options.emberColor};
          margin-bottom: 0.25rem;
        }
        
        .token-symbol {
          font-size: 0.875rem;
          color: ${this.options.fireColor};
          font-weight: 600;
        }
        
        @keyframes tokenShake {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(1deg); }
          75% { transform: translateY(2px) rotate(-1deg); }
        }
        
        @keyframes tokenGlow {
          0%, 100% { filter: brightness(1.2) drop-shadow(0 0 10px ${this.options.emberColor}60); }
          50% { filter: brightness(1.5) drop-shadow(0 0 20px ${this.options.emberColor}80); }
        }
        
        /* Fire Animation */
        .fire-container {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 60px;
        }
        
        .flame {
          position: absolute;
          bottom: 0;
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          animation: flicker 0.5s ease-in-out infinite alternate;
        }
        
        .flame-1 {
          left: 30px;
          width: 20px;
          height: 30px;
          background: linear-gradient(${this.options.fireColor}, ${this.options.emberColor});
          animation-delay: 0s;
        }
        
        .flame-2 {
          left: 20px;
          width: 15px;
          height: 25px;
          background: linear-gradient(${this.options.burnColor}, ${this.options.fireColor});
          animation-delay: 0.1s;
        }
        
        .flame-3 {
          left: 45px;
          width: 15px;
          height: 25px;
          background: linear-gradient(${this.options.burnColor}, ${this.options.fireColor});
          animation-delay: 0.2s;
        }
        
        .flame-4 {
          left: 35px;
          width: 10px;
          height: 20px;
          background: linear-gradient(${this.options.emberColor}, ${this.options.fireColor});
          animation-delay: 0.15s;
        }
        
        .flame-5 {
          left: 40px;
          width: 8px;
          height: 15px;
          background: linear-gradient(${this.options.emberColor}, #ffffff80);
          animation-delay: 0.25s;
        }
        
        @keyframes flicker {
          0% { transform: scale(1) scaleY(1); }
          100% { transform: scale(0.8) scaleY(1.2); }
        }
        
        /* Ember Particles */
        .ember-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 2;
        }
        
        .ember-particle {
          position: absolute;
          background: ${this.options.emberColor};
          border-radius: 50%;
          animation: emberFloat 4s ease-out infinite;
          opacity: 0.8;
        }
        
        @keyframes emberFloat {
          0% { 
            transform: translateY(50px) scale(1);
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
          100% { 
            transform: translateY(-150px) scale(0.2);
            opacity: 0;
          }
        }
        
        /* Smoke Effect */
        .smoke-container {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 100px;
          pointer-events: none;
          z-index: 1;
        }
        
        .smoke {
          position: absolute;
          bottom: 60px;
          width: 20px;
          height: 20px;
          background: rgba(200, 200, 200, 0.3);
          border-radius: 50%;
          animation: smokeRise 3s ease-out infinite;
        }
        
        .smoke-1 {
          left: 35px;
          animation-delay: 0s;
        }
        
        .smoke-2 {
          left: 40px;
          animation-delay: 0.5s;
        }
        
        .smoke-3 {
          left: 45px;
          animation-delay: 1s;
        }
        
        @keyframes smokeRise {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0.7;
          }
          100% {
            transform: translateY(-100px) scale(1.5);
            opacity: 0;
          }
        }
        
        /* Burn Progress Ring */
        .burn-progress-ring {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto;
        }
        
        .progress-track,
        .progress-fill {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }
        
        .progress-track {
          border: 4px solid ${this.options.darkBg};
          transform: rotate(-90deg);
        }
        
        .progress-fill {
          border: 4px solid transparent;
          border-top-color: ${this.options.burnColor};
          border-right-color: ${this.options.burnColor};
          transform: rotate(-90deg);
          stroke-dasharray: 251;
          stroke-dashoffset: 251;
          animation: burnProgress 5s ease-out forwards;
        }
        
        @keyframes burnProgress {
          to { stroke-dashoffset: 0; }
        }
        
        .ring-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 2rem;
          animation: burnIconPulse 1s ease-in-out infinite;
        }
        
        @keyframes burnIconPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }
        
        /* Vote Information */
        .vote-info {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .vote-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
          margin-bottom: 1rem;
          text-shadow: 0 0 10px ${this.options.primaryColor}40;
        }
        
        .content-info {
          background: ${this.options.darkBg}60;
          border-radius: 8px;
          padding: 1.5rem;
          border: 1px solid ${this.options.burnColor}30;
          margin-bottom: 1.5rem;
        }
        
        .content-title {
          font-size: 1.1rem;
          color: white;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        
        .burn-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .detail-label {
          font-size: 0.875rem;
          color: #9ca3af;
        }
        
        .detail-value {
          font-size: 0.875rem;
          color: white;
          font-weight: 600;
        }
        
        .burn-amount {
          color: ${this.options.burnColor};
          text-shadow: 0 0 5px ${this.options.burnColor}40;
        }
        
        .vote-power {
          color: ${this.options.primaryColor};
        }
        
        /* Burn Stages */
        .burn-stages {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1rem;
          background: ${this.options.darkBg}40;
          border-radius: 8px;
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }
        
        .stage.stage-active {
          border-color: ${this.options.fireColor};
          background: ${this.options.fireColor}10;
          animation: stageActive 1s ease-in-out;
        }
        
        .stage.stage-completed {
          border-color: ${this.options.primaryColor};
          background: ${this.options.primaryColor}10;
        }
        
        @keyframes stageActive {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .stage-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        
        .stage-text {
          font-size: 0.875rem;
          color: #d1d5db;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .stage-status {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          background: ${this.options.surfaceBg};
          color: #9ca3af;
        }
        
        .stage-completed .stage-status {
          background: ${this.options.primaryColor}20;
          color: ${this.options.primaryColor};
        }
        
        .stage-active .stage-status {
          background: ${this.options.fireColor}20;
          color: ${this.options.fireColor};
        }
        
        /* Burn Statistics */
        .burn-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .stat-item {
          text-align: center;
          padding: 1rem;
          background: ${this.options.darkBg}60;
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
          font-size: 1.25rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
        }
        
        .burn-rate {
          color: ${this.options.burnColor};
        }
        
        /* Transaction Info */
        .transaction-info {
          text-align: center;
          padding: 1rem;
          background: ${this.options.successColor}10;
          border: 1px solid ${this.options.successColor}30;
          border-radius: 8px;
          margin-top: 2rem;
        }
        
        .tx-label {
          font-size: 0.875rem;
          color: #9ca3af;
          margin-bottom: 0.5rem;
        }
        
        .tx-hash {
          font-family: 'Courier New', monospace;
          font-size: 0.75rem;
          color: ${this.options.successColor};
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: ${this.options.darkBg}60;
          border-radius: 4px;
          word-break: break-all;
        }
        
        .tx-link-btn {
          background: ${this.options.successColor};
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        
        .tx-link-btn:hover {
          background: ${this.options.successColor}dd;
        }
        
        /* Vote Confirmation Styles */
        .vote-confirmation-loader .confirmation-container {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .vote-impact-visual {
          margin-bottom: 2rem;
          position: relative;
        }
        
        .vote-meter {
          width: 200px;
          height: 100px;
          margin: 0 auto 2rem;
          position: relative;
        }
        
        .meter-background {
          width: 100%;
          height: 20px;
          background: ${this.options.darkBg};
          border-radius: 10px;
          position: relative;
          overflow: hidden;
          border: 2px solid ${this.options.primaryColor}30;
        }
        
        .meter-fill {
          height: 100%;
          background: linear-gradient(90deg, ${this.options.primaryColor}, ${this.options.fireColor});
          border-radius: 10px;
          width: 0%;
          transition: width 1s ease-out;
        }
        
        .meter-needle {
          position: absolute;
          top: -10px;
          left: 50%;
          width: 2px;
          height: 40px;
          background: ${this.options.burnColor};
          transform-origin: bottom;
          transform: translateX(-50%) rotate(-90deg);
          transition: transform 1s ease-out;
        }
        
        .meter-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #9ca3af;
        }
        
        .impact-waves {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 300px;
          pointer-events: none;
        }
        
        .wave {
          position: absolute;
          border: 2px solid ${this.options.primaryColor}40;
          border-radius: 50%;
          animation: waveExpand 3s ease-out infinite;
        }
        
        .wave-1 {
          width: 100px;
          height: 100px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 0s;
        }
        
        .wave-2 {
          width: 150px;
          height: 150px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 1s;
        }
        
        .wave-3 {
          width: 200px;
          height: 200px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 2s;
        }
        
        @keyframes waveExpand {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.5);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(2);
          }
        }
        
        /* Vote Summary */
        .vote-summary {
          background: ${this.options.darkBg}60;
          border-radius: 8px;
          padding: 2rem;
          border: 1px solid ${this.options.primaryColor}20;
          margin-bottom: 2rem;
        }
        
        .confirmation-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
          margin-bottom: 1.5rem;
        }
        
        .content-summary {
          margin-bottom: 2rem;
        }
        
        .vote-change {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-top: 1rem;
          font-size: 1.1rem;
        }
        
        .previous-count,
        .new-count {
          font-weight: bold;
        }
        
        .previous-count {
          color: #9ca3af;
        }
        
        .new-count {
          color: ${this.options.primaryColor};
        }
        
        .vote-arrow {
          font-size: 1.5rem;
          color: ${this.options.fireColor};
        }
        
        .impact-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .impact-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .impact-label {
          font-size: 0.875rem;
          color: #9ca3af;
        }
        
        .impact-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
        }
        
        .ranking-change.positive-change {
          color: ${this.options.successColor};
        }
        
        .community-impact.impact-high {
          color: ${this.options.burnColor};
        }
        
        .community-impact.impact-medium {
          color: ${this.options.fireColor};
        }
        
        .community-impact.impact-low {
          color: ${this.options.emberColor};
        }
        
        /* Network Activity */
        .network-activity {
          background: ${this.options.darkBg}40;
          border-radius: 8px;
          padding: 1.5rem;
          border: 1px solid ${this.options.primaryColor}20;
        }
        
        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .activity-title {
          font-size: 1rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
        }
        
        .activity-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .indicator-dot {
          width: 8px;
          height: 8px;
          background: ${this.options.primaryColor};
          border-radius: 50%;
          animation: indicatorPulse 2s ease-in-out infinite;
        }
        
        @keyframes indicatorPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        
        .indicator-text {
          font-size: 0.875rem;
          color: ${this.options.primaryColor};
        }
        
        .activity-feed {
          max-height: 120px;
          overflow-y: auto;
        }
        
        .activity-item {
          display: flex;
          gap: 1rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid ${this.options.surfaceBg}30;
        }
        
        .activity-item:last-child {
          border-bottom: none;
        }
        
        .activity-time {
          font-size: 0.75rem;
          color: ${this.options.fireColor};
          font-weight: 500;
          min-width: 40px;
        }
        
        .activity-text {
          font-size: 0.875rem;
          color: #d1d5db;
          flex: 1;
        }
        
        /* Vote Limit Styles */
        .vote-limit-loader .limit-container {
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
        }
        
        .limit-visual {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .limit-gauge {
          width: 200px;
          margin-bottom: 1rem;
        }
        
        .gauge-track {
          width: 100%;
          height: 12px;
          background: ${this.options.darkBg};
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid ${this.options.burnColor}30;
        }
        
        .gauge-fill {
          height: 100%;
          background: linear-gradient(90deg, ${this.options.primaryColor}, ${this.options.burnColor});
          border-radius: 6px;
          transition: width 0.5s ease;
        }
        
        .gauge-label {
          display: flex;
          justify-content: center;
          align-items: baseline;
          gap: 0.25rem;
          margin-top: 0.5rem;
        }
        
        .votes-used {
          font-size: 2rem;
          font-weight: bold;
          color: ${this.options.burnColor};
        }
        
        .votes-total {
          font-size: 1.25rem;
          color: #9ca3af;
        }
        
        .limit-icon {
          position: relative;
          margin-bottom: 1rem;
        }
        
        .icon-background {
          font-size: 4rem;
          position: relative;
          z-index: 2;
        }
        
        .icon-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          border: 3px solid ${this.options.burnColor}60;
          border-radius: 50%;
          animation: iconPulse 2s ease-out infinite;
        }
        
        @keyframes iconPulse {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.5);
          }
        }
        
        /* Limit Information */
        .limit-info {
          margin-bottom: 2rem;
        }
        
        .limit-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${this.options.burnColor};
          margin-bottom: 1rem;
        }
        
        .limit-description {
          font-size: 1rem;
          color: #d1d5db;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
        
        .reset-timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 1rem;
          background: ${this.options.darkBg}60;
          border-radius: 8px;
          border: 1px solid ${this.options.primaryColor}30;
        }
        
        .timer-icon {
          font-size: 1.5rem;
        }
        
        .timer-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .timer-label {
          font-size: 0.875rem;
          color: #9ca3af;
          margin-bottom: 0.25rem;
        }
        
        .timer-countdown {
          font-family: 'Courier New', monospace;
          font-size: 1.25rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
        }
        
        /* Burn Option */
        .burn-option {
          background: ${this.options.darkBg}60;
          border-radius: 8px;
          padding: 2rem;
          border: 1px solid ${this.options.burnColor}30;
          margin-bottom: 2rem;
        }
        
        .option-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: ${this.options.burnColor};
          margin-bottom: 1rem;
        }
        
        .option-description {
          font-size: 1rem;
          color: #d1d5db;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
        
        .burn-cost-breakdown {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        
        .cost-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid ${this.options.surfaceBg}30;
        }
        
        .cost-item:last-child {
          border-bottom: none;
        }
        
        .cost-label {
          font-size: 0.875rem;
          color: #9ca3af;
        }
        
        .cost-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
        }
        
        .balance-amount {
          color: ${this.options.primaryColor};
        }
        
        .remaining-balance {
          color: ${this.options.emberColor};
        }
        
        /* Burn Actions */
        .burn-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        
        .burn-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          text-decoration: none;
        }
        
        .confirm-burn {
          background: ${this.options.burnColor};
          color: white;
        }
        
        .confirm-burn:hover {
          background: ${this.options.burnColor}dd;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px ${this.options.burnColor}40;
        }
        
        .cancel-burn {
          background: ${this.options.surfaceBg};
          color: #d1d5db;
          border: 1px solid #4b5563;
        }
        
        .cancel-burn:hover {
          background: #374151;
          border-color: #6b7280;
        }
        
        .btn-icon {
          font-size: 1.25rem;
        }
        
        .btn-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .btn-title {
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .btn-subtitle {
          font-size: 0.75rem;
          opacity: 0.8;
        }
        
        /* Insufficient Balance */
        .insufficient-balance {
          text-align: center;
        }
        
        .balance-warning {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.5rem;
          background: ${this.options.burnColor}10;
          border: 1px solid ${this.options.burnColor}30;
          border-radius: 8px;
          margin-bottom: 2rem;
        }
        
        .warning-icon {
          font-size: 2rem;
          flex-shrink: 0;
          margin-top: 0.25rem;
        }
        
        .warning-text {
          text-align: left;
        }
        
        .warning-title {
          font-size: 1rem;
          font-weight: bold;
          color: ${this.options.burnColor};
          margin-bottom: 0.5rem;
        }
        
        .warning-subtitle {
          font-size: 0.875rem;
          color: #d1d5db;
          line-height: 1.5;
        }
        
        .balance-actions {
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
        
        .get-tokens {
          background: ${this.options.primaryColor};
          color: ${this.options.darkBg};
        }
        
        .get-tokens:hover {
          background: ${this.options.primaryColor}dd;
          transform: translateY(-1px);
        }
        
        .go-back {
          background: ${this.options.surfaceBg};
          color: #d1d5db;
          border: 1px solid #4b5563;
        }
        
        .go-back:hover {
          background: #374151;
          border-color: #6b7280;
        }
        
        .btn-icon {
          font-size: 1rem;
        }
        
        .btn-text {
          font-size: 0.875rem;
        }
        
        /* Limit Statistics */
        .limit-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }
        
        .stat-box {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: ${this.options.darkBg}40;
          border-radius: 8px;
          border: 1px solid ${this.options.primaryColor}20;
        }
        
        .stat-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }
        
        .stat-content {
          flex: 1;
        }
        
        .stat-box .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
          margin-bottom: 0.25rem;
        }
        
        .stat-box .stat-label {
          font-size: 0.75rem;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .burn-chamber {
            width: 150px;
            height: 150px;
          }
          
          .token-icon {
            font-size: 2rem;
          }
          
          .burn-stages,
          .burn-stats,
          .limit-stats {
            grid-template-columns: 1fr;
          }
          
          .vote-change {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .burn-actions,
          .balance-actions {
            flex-direction: column;
          }
          
          .vote-meter {
            width: 150px;
          }
          
          .impact-waves {
            width: 200px;
            height: 200px;
          }
          
          .balance-warning {
            flex-direction: column;
            text-align: center;
          }
          
          .warning-text {
            text-align: center;
          }
        }
        
        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .flame,
          .ember-particle,
          .smoke,
          .token-burn-visual *,
          .impact-waves .wave {
            animation: none;
          }
          
          .burning-token {
            animation: none;
          }
          
          .token-icon {
            animation: none;
          }
        }
        
        /* High contrast mode */
        @media (prefers-contrast: high) {
          .vote-burn-loader,
          .vote-confirmation-loader,
          .vote-limit-loader {
            border: 2px solid ${this.options.primaryColor};
          }
          
          .burn-chamber {
            border: 3px solid ${this.options.burnColor};
          }
          
          .stage,
          .stat-item,
          .burn-option {
            border: 2px solid currentColor;
          }
        }
      </style>
    `;
    
    const existingStyles = document.getElementById('vote-burn-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }
}

// Initialize global vote burner
if (typeof window !== 'undefined') {
  window.voteBurner = new VoteBurnLoading();
  
  // Bind methods to global scope for onclick handlers
  window.voteBurner.confirmBurn = window.voteBurner.confirmBurn.bind(window.voteBurner);
  window.voteBurner.cancelBurn = window.voteBurner.cancelBurn.bind(window.voteBurner);
  window.voteBurner.getMoreTokens = window.voteBurner.getMoreTokens.bind(window.voteBurner);
  window.voteBurner.goBack = window.voteBurner.goBack.bind(window.voteBurner);
  window.voteBurner.viewTransaction = window.voteBurner.viewTransaction.bind(window.voteBurner);
  
  console.log('🔥 Vote Burn Loading ready to ignite!');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoteBurnLoading;
}