/**
 * MLG.clan Content Moderation Integration Examples - Sub-task 4.6
 * 
 * Integration examples showing how to connect the community-driven content
 * moderation system with existing MLG.clan components including voting,
 * content ranking, and user interfaces.
 * 
 * Integration Features:
 * - Content submission form with moderation hooks
 * - Voting interface extended with moderation options
 * - Real-time moderation status updates
 * - Reputation display and role management
 * - Content ranking algorithm integration
 * - Phantom wallet transaction signing
 * 
 * @author Claude Code - Production General Purpose Agent
 * @version 1.0.0
 */

import { contentModerationSystem, ContentModerationUtils, MODERATION_STATUS, MODERATION_VOTE_TYPES } from './content-moderation.js';
import { SolanaVotingSystem } from '../voting/solana-voting-system.js';
import { ContentRankingAlgorithm } from './content-ranking-algorithm.js';
import { phantomWallet } from '../wallet/phantom-wallet.js';

/**
 * Content Moderation UI Integration
 * 
 * Provides UI components and utilities for integrating content moderation
 * into the MLG.clan platform interface.
 */
export class ContentModerationUIIntegration {
  constructor() {
    this.moderationSystem = contentModerationSystem;
    this.votingSystem = new SolanaVotingSystem();
    this.rankingAlgorithm = new ContentRankingAlgorithm();
    this.wallet = phantomWallet;
    
    this.initialized = false;
  }

  /**
   * Initialize the moderation UI integration
   * @returns {Promise<boolean>}
   */
  async initialize() {
    try {
      if (!this.wallet.isConnected) {
        console.log('Wallet not connected, initializing in read-only mode');
      } else {
        await this.moderationSystem.initialize(this.wallet.wallet);
        await this.votingSystem.initialize(this.wallet.wallet);
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize moderation UI integration:', error);
      return false;
    }
  }

  /**
   * Create content report modal interface
   * @param {string} contentId - Content ID to report
   * @returns {HTMLElement}
   */
  createReportModal(contentId) {
    const modal = document.createElement('div');
    modal.className = 'moderation-report-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Report Content</h3>
            <button class="close-btn" onclick="this.closest('.moderation-report-modal').remove()">×</button>
          </div>
          
          <form id="report-form-${contentId}" class="report-form">
            <div class="form-group">
              <label for="report-category">Category</label>
              <select id="report-category" required>
                <option value="">Select a category</option>
                <option value="SPAM">Spam</option>
                <option value="INAPPROPRIATE">Inappropriate Content</option>
                <option value="COPYRIGHT">Copyright Violation</option>
                <option value="CHEATING">Cheating/Exploits</option>
                <option value="HARASSMENT">Harassment</option>
                <option value="LOW_QUALITY">Low Quality</option>
                <option value="MISINFORMATION">Misinformation</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="report-reason">Reason</label>
              <input type="text" id="report-reason" placeholder="Brief reason for report" required>
            </div>
            
            <div class="form-group">
              <label for="report-description">Description</label>
              <textarea id="report-description" rows="4" 
                placeholder="Provide detailed explanation (minimum 10 characters)" 
                required minlength="10"></textarea>
            </div>
            
            <div class="form-group">
              <label for="evidence-urls">Evidence (Optional)</label>
              <textarea id="evidence-urls" rows="2" 
                placeholder="URLs to supporting evidence, one per line"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn-secondary" 
                onclick="this.closest('.moderation-report-modal').remove()">Cancel</button>
              <button type="submit" class="btn-primary">Submit Report</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Add form submission handler
    const form = modal.querySelector(`#report-form-${contentId}`);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleReportSubmission(contentId, form);
    });

    return modal;
  }

  /**
   * Handle report form submission
   * @private
   */
  async handleReportSubmission(contentId, form) {
    try {
      if (!this.wallet.isConnected) {
        throw new Error('Please connect your wallet to report content');
      }

      const formData = new FormData(form);
      const evidenceText = form.querySelector('#evidence-urls').value;
      const evidence = evidenceText ? evidenceText.split('\n').filter(url => url.trim()) : [];

      const reportData = {
        reporterId: this.wallet.wallet.publicKey.toString(),
        reporterWallet: this.wallet.wallet.publicKey.toString(),
        category: formData.get('report-category') || form.querySelector('#report-category').value,
        reason: formData.get('report-reason') || form.querySelector('#report-reason').value,
        description: formData.get('report-description') || form.querySelector('#report-description').value,
        evidence
      };

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      // Submit report
      const result = await this.moderationSystem.reportContent(contentId, reportData);

      if (result.success) {
        this.showNotification('Report submitted successfully', 'success');
        form.closest('.moderation-report-modal').remove();
        
        // Update content status indicator
        this.updateContentModerationStatus(contentId, result.data);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Report submission failed:', error);
      this.showNotification(`Failed to submit report: ${error.message}`, 'error');
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }

  /**
   * Create moderation voting interface
   * @param {string} contentId - Content ID
   * @returns {HTMLElement}
   */
  createModerationVotingInterface(contentId) {
    const container = document.createElement('div');
    container.className = 'moderation-voting-interface';
    container.innerHTML = `
      <div class="moderation-voting-card">
        <div class="voting-header">
          <h4>Community Moderation Vote</h4>
          <div class="vote-status" id="vote-status-${contentId}">
            <span class="status-indicator">Voting Active</span>
          </div>
        </div>
        
        <div class="voting-info">
          <p>This content has been reported and needs community review.</p>
          <div class="report-summary" id="report-summary-${contentId}">
            Loading report information...
          </div>
        </div>
        
        <div class="voting-options">
          <div class="vote-option">
            <button class="vote-btn keep-btn" data-vote="keep" data-content="${contentId}">
              <span class="vote-icon">👍</span>
              <span class="vote-label">Keep Content</span>
              <span class="vote-cost" data-cost="KEEP_CONTENT">1 MLG</span>
            </button>
          </div>
          
          <div class="vote-option">
            <button class="vote-btn remove-btn" data-vote="remove" data-content="${contentId}">
              <span class="vote-icon">👎</span>
              <span class="vote-label">Remove Content</span>
              <span class="vote-cost" data-cost="REMOVE_CONTENT">2 MLG</span>
            </button>
          </div>
          
          <div class="vote-option">
            <button class="vote-btn escalate-btn" data-vote="escalate" data-content="${contentId}">
              <span class="vote-icon">⚠️</span>
              <span class="vote-label">Escalate Review</span>
              <span class="vote-cost" data-cost="ESCALATE_REVIEW">3 MLG</span>
            </button>
          </div>
        </div>
        
        <div class="voting-stats" id="voting-stats-${contentId}">
          Loading voting statistics...
        </div>
        
        <div class="user-vote-status" id="user-vote-${contentId}">
          <!-- Will show if user has already voted -->
        </div>
      </div>
    `;

    // Add event listeners for voting buttons
    container.querySelectorAll('.vote-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleModerationVote(e.target.closest('.vote-btn'));
      });
    });

    // Load initial data
    this.loadModerationVotingData(contentId);

    return container;
  }

  /**
   * Handle moderation vote button click
   * @private
   */
  async handleModerationVote(button) {
    try {
      if (!this.wallet.isConnected) {
        throw new Error('Please connect your wallet to vote');
      }

      const voteType = button.dataset.vote;
      const contentId = button.dataset.content;
      
      // Get vote cost and user reputation
      const userReputation = await this.moderationSystem.getUserReputation(
        this.wallet.wallet.publicKey.toString()
      );
      const tokenCost = this.moderationSystem.calculateModerationVoteCost(voteType, userReputation);

      // Show confirmation modal
      const confirmed = await this.showVoteConfirmationModal(voteType, tokenCost);
      if (!confirmed) return;

      // Show loading state
      button.disabled = true;
      button.classList.add('loading');
      const originalText = button.innerHTML;
      button.innerHTML = '<span class="spinner"></span> Processing...';

      // Generate vote message for signing
      const voteMessage = ContentModerationUtils.generateModerationVoteMessage(
        contentId,
        voteType,
        tokenCost
      );

      // Sign message with wallet
      const signature = await this.wallet.signMessage(voteMessage);

      // Execute token burn transaction
      const burnResult = await this.votingSystem.burnTokensForVote(tokenCost, 'moderation_vote');
      if (!burnResult.success) {
        throw new Error(`Token burn failed: ${burnResult.error}`);
      }

      // Submit moderation vote
      const voteData = {
        voterId: this.wallet.wallet.publicKey.toString(),
        voterWallet: this.wallet.wallet.publicKey.toString(),
        transactionSignature: burnResult.transactionSignature,
        comment: `Community moderation vote: ${voteType}`
      };

      const result = await this.moderationSystem.voteOnModeration(contentId, voteType.toUpperCase(), voteData);

      if (result.success) {
        this.showNotification(
          `Vote submitted successfully! ${result.data.tokensBurned} MLG tokens burned.`,
          'success'
        );
        
        // Update voting interface
        this.updateVotingInterface(contentId, result.data);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Moderation vote failed:', error);
      this.showNotification(`Failed to submit vote: ${error.message}`, 'error');
    } finally {
      // Reset button state
      button.disabled = false;
      button.classList.remove('loading');
      button.innerHTML = originalText;
    }
  }

  /**
   * Show vote confirmation modal
   * @private
   */
  async showVoteConfirmationModal(voteType, tokenCost) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'vote-confirmation-modal';
      modal.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Confirm Moderation Vote</h3>
            </div>
            
            <div class="confirmation-details">
              <p><strong>Vote Type:</strong> ${voteType.charAt(0).toUpperCase() + voteType.slice(1)}</p>
              <p><strong>Token Cost:</strong> ${tokenCost} MLG</p>
              
              <div class="warning-message">
                <p>⚠️ This action will burn MLG tokens from your wallet.</p>
                <p>Votes cannot be changed once submitted.</p>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn-secondary cancel-btn">Cancel</button>
              <button type="button" class="btn-primary confirm-btn">Confirm Vote</button>
            </div>
          </div>
        </div>
      `;

      // Add event listeners
      modal.querySelector('.cancel-btn').addEventListener('click', () => {
        modal.remove();
        resolve(false);
      });

      modal.querySelector('.confirm-btn').addEventListener('click', () => {
        modal.remove();
        resolve(true);
      });

      // Add to page
      document.body.appendChild(modal);
    });
  }

  /**
   * Load moderation voting data for content
   * @private
   */
  async loadModerationVotingData(contentId) {
    try {
      // Get current vote results
      const voteResults = await this.moderationSystem.calculateVoteResults(contentId);
      
      // Update statistics display
      const statsElement = document.getElementById(`voting-stats-${contentId}`);
      if (statsElement) {
        statsElement.innerHTML = `
          <div class="vote-breakdown">
            <div class="vote-stat">
              <span class="stat-label">Keep:</span>
              <span class="stat-value">${voteResults.keepVotes} votes (${(voteResults.keepRatio * 100).toFixed(1)}%)</span>
            </div>
            <div class="vote-stat">
              <span class="stat-label">Remove:</span>
              <span class="stat-value">${voteResults.removeVotes} votes (${(voteResults.removeRatio * 100).toFixed(1)}%)</span>
            </div>
            <div class="vote-stat">
              <span class="stat-label">Total MLG Burned:</span>
              <span class="stat-value">${voteResults.tokensBurned.toFixed(2)} MLG</span>
            </div>
          </div>
        `;
      }

      // Check if user has already voted
      if (this.wallet.isConnected) {
        const userWallet = this.wallet.wallet.publicKey.toString();
        const userVote = Array.from(this.moderationSystem.activeVotes.values())
          .find(vote => vote.contentId === contentId && vote.voterWallet === userWallet);

        const userVoteElement = document.getElementById(`user-vote-${contentId}`);
        if (userVoteElement) {
          if (userVote) {
            userVoteElement.innerHTML = `
              <div class="user-voted">
                <p>✅ You voted: <strong>${userVote.voteType}</strong></p>
                <p>Tokens burned: ${userVote.tokensBurned} MLG</p>
              </div>
            `;
          } else {
            userVoteElement.innerHTML = '<p class="can-vote">You can vote on this content.</p>';
          }
        }
      }

    } catch (error) {
      console.error('Failed to load voting data:', error);
    }
  }

  /**
   * Update voting interface after vote submission
   * @private
   */
  updateVotingInterface(contentId, voteData) {
    // Refresh voting data
    this.loadModerationVotingData(contentId);
    
    // Update vote status if action was taken
    if (voteData.actionTaken && voteData.actionTaken.action !== 'pending') {
      const statusElement = document.getElementById(`vote-status-${contentId}`);
      if (statusElement) {
        const action = voteData.actionTaken.action;
        const statusText = action === 'removed' ? 'Content Removed' : 
                          action === 'kept' ? 'Content Kept' : 
                          action === 'escalated' ? 'Escalated for Review' : 'Vote Completed';
        
        statusElement.innerHTML = `<span class="status-indicator ${action}">${statusText}</span>`;
      }
    }
  }

  /**
   * Create user reputation display
   * @param {string} walletAddress - User's wallet address
   * @returns {HTMLElement}
   */
  async createReputationDisplay(walletAddress) {
    const reputation = await this.moderationSystem.getUserReputation(walletAddress);
    const role = this.moderationSystem.getUserRole(reputation);
    const tier = ContentModerationUtils.calculateReputationTier(reputation.score);

    const container = document.createElement('div');
    container.className = 'user-reputation-display';
    container.innerHTML = `
      <div class="reputation-card">
        <div class="reputation-header">
          <h4>Community Standing</h4>
          <span class="reputation-tier ${tier.toLowerCase()}">${tier}</span>
        </div>
        
        <div class="reputation-details">
          <div class="reputation-score">
            <span class="score-label">Reputation:</span>
            <span class="score-value">${reputation.score}</span>
          </div>
          
          <div class="reputation-role">
            <span class="role-label">Role:</span>
            <span class="role-value">${role.name}</span>
          </div>
          
          <div class="reputation-stats">
            <div class="stat-item">
              <span class="stat-label">Total Votes:</span>
              <span class="stat-value">${reputation.votes}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Accuracy:</span>
              <span class="stat-value">${(reputation.accuracy * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
        
        <div class="role-permissions">
          <h5>Permissions:</h5>
          <ul class="permissions-list">
            ${role.permissions.map(permission => 
              `<li class="permission-item">${permission}</li>`
            ).join('')}
          </ul>
        </div>
      </div>
    `;

    return container;
  }

  /**
   * Create appeal submission interface
   * @param {string} contentId - Content ID to appeal
   * @returns {HTMLElement}
   */
  createAppealInterface(contentId) {
    const container = document.createElement('div');
    container.className = 'appeal-interface';
    container.innerHTML = `
      <div class="appeal-card">
        <div class="appeal-header">
          <h4>Appeal Content Removal</h4>
          <div class="stake-requirement">
            <span class="stake-label">Required Stake:</span>
            <span class="stake-amount">5 MLG tokens</span>
          </div>
        </div>
        
        <form id="appeal-form-${contentId}" class="appeal-form">
          <div class="form-group">
            <label for="appeal-type">Appeal Type</label>
            <select id="appeal-type" required>
              <option value="">Select appeal type</option>
              <option value="FALSE_POSITIVE">Content was incorrectly removed</option>
              <option value="INSUFFICIENT_EVIDENCE">Report lacked sufficient evidence</option>
              <option value="POLICY_MISAPPLICATION">Moderation policy was misapplied</option>
              <option value="TECHNICAL_ERROR">Technical error in voting system</option>
              <option value="BIAS_CLAIM">Claim of moderator bias or unfairness</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="appeal-description">Appeal Description</label>
            <textarea id="appeal-description" rows="5" 
              placeholder="Explain why this content should be restored (minimum 20 characters)"
              required minlength="20"></textarea>
          </div>
          
          <div class="form-group">
            <label for="appeal-evidence">Supporting Evidence</label>
            <textarea id="appeal-evidence" rows="3" 
              placeholder="URLs to supporting evidence, one per line"></textarea>
          </div>
          
          <div class="appeal-warning">
            <p>⚠️ <strong>Important:</strong></p>
            <ul>
              <li>Appeals require a 5 MLG token stake</li>
              <li>Stakes are refunded if appeal is successful</li>
              <li>You have 7 days from removal to submit an appeal</li>
              <li>Appeals are reviewed by the community</li>
            </ul>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-secondary" 
              onclick="this.closest('.appeal-interface').style.display='none'">Cancel</button>
            <button type="submit" class="btn-primary">Submit Appeal</button>
          </div>
        </form>
      </div>
    `;

    // Add form submission handler
    const form = container.querySelector(`#appeal-form-${contentId}`);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleAppealSubmission(contentId, form);
    });

    return container;
  }

  /**
   * Handle appeal form submission
   * @private
   */
  async handleAppealSubmission(contentId, form) {
    try {
      if (!this.wallet.isConnected) {
        throw new Error('Please connect your wallet to submit an appeal');
      }

      const formData = new FormData(form);
      const evidenceText = form.querySelector('#appeal-evidence').value;
      const evidence = evidenceText ? evidenceText.split('\n').filter(url => url.trim()) : [];

      // Show confirmation for stake payment
      const stakeAmount = 5; // MLG tokens
      const confirmed = await this.showStakeConfirmationModal(stakeAmount);
      if (!confirmed) return;

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';

      // Execute stake payment
      const stakeResult = await this.votingSystem.burnTokensForVote(stakeAmount, 'appeal_stake');
      if (!stakeResult.success) {
        throw new Error(`Stake payment failed: ${stakeResult.error}`);
      }

      // Prepare appeal data
      const appealData = {
        appellantId: this.wallet.wallet.publicKey.toString(),
        appellantWallet: this.wallet.wallet.publicKey.toString(),
        appealType: form.querySelector('#appeal-type').value,
        description: form.querySelector('#appeal-description').value,
        evidence,
        stakeTransactionSignature: stakeResult.transactionSignature
      };

      // Submit appeal
      const result = await this.moderationSystem.appealModerationDecision(contentId, appealData);

      if (result.success) {
        this.showNotification('Appeal submitted successfully! Community review initiated.', 'success');
        form.closest('.appeal-interface').style.display = 'none';
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Appeal submission failed:', error);
      this.showNotification(`Failed to submit appeal: ${error.message}`, 'error');
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }

  /**
   * Show stake confirmation modal
   * @private
   */
  async showStakeConfirmationModal(stakeAmount) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'stake-confirmation-modal';
      modal.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Confirm Appeal Stake</h3>
            </div>
            
            <div class="stake-details">
              <p><strong>Stake Amount:</strong> ${stakeAmount} MLG tokens</p>
              
              <div class="stake-info">
                <p>💡 <strong>How it works:</strong></p>
                <ul>
                  <li>Your stake will be held during the appeal review</li>
                  <li>If your appeal is successful, your stake will be refunded</li>
                  <li>If your appeal is denied, the stake helps prevent spam appeals</li>
                  <li>Appeals are reviewed by trusted community members</li>
                </ul>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn-secondary cancel-btn">Cancel</button>
              <button type="button" class="btn-primary confirm-btn">Pay Stake & Submit</button>
            </div>
          </div>
        </div>
      `;

      // Add event listeners
      modal.querySelector('.cancel-btn').addEventListener('click', () => {
        modal.remove();
        resolve(false);
      });

      modal.querySelector('.confirm-btn').addEventListener('click', () => {
        modal.remove();
        resolve(true);
      });

      document.body.appendChild(modal);
    });
  }

  /**
   * Update content moderation status indicator
   * @private
   */
  updateContentModerationStatus(contentId, statusData) {
    // Find content elements and update their status indicators
    const contentElements = document.querySelectorAll(`[data-content-id="${contentId}"]`);
    
    contentElements.forEach(element => {
      let statusIndicator = element.querySelector('.moderation-status');
      
      if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.className = 'moderation-status';
        element.appendChild(statusIndicator);
      }

      // Update status based on current moderation state
      const moderationData = this.moderationSystem.getModerationData(contentId);
      const status = moderationData.status;
      
      let statusText = '';
      let statusClass = '';

      switch (status) {
        case MODERATION_STATUS.REPORTED:
          statusText = `Reported (${moderationData.reportCount})`;
          statusClass = 'reported';
          break;
        case MODERATION_STATUS.VOTING_ACTIVE:
          statusText = 'Under Community Review';
          statusClass = 'voting';
          break;
        case MODERATION_STATUS.REMOVED:
          statusText = 'Removed by Community';
          statusClass = 'removed';
          break;
        case MODERATION_STATUS.APPEALED:
          statusText = 'Appeal Pending';
          statusClass = 'appealed';
          break;
        case MODERATION_STATUS.RESTORED:
          statusText = 'Restored';
          statusClass = 'restored';
          break;
        default:
          statusText = '';
          statusClass = 'active';
      }

      if (statusText) {
        statusIndicator.innerHTML = `
          <span class="status-indicator ${statusClass}">${statusText}</span>
        `;
        statusIndicator.style.display = 'block';
      } else {
        statusIndicator.style.display = 'none';
      }
    });
  }

  /**
   * Show notification to user
   * @private
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Add to page
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.id = 'notification-container';
      notificationContainer.className = 'notification-container';
      document.body.appendChild(notificationContainer);
    }

    notificationContainer.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Add moderation context menu to content
   * @param {HTMLElement} contentElement - Content element to add menu to
   * @param {string} contentId - Content ID
   */
  addModerationContextMenu(contentElement, contentId) {
    // Create context menu button
    const menuButton = document.createElement('button');
    menuButton.className = 'moderation-menu-button';
    menuButton.innerHTML = '⚙️';
    menuButton.title = 'Moderation Options';

    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'moderation-context-menu';
    menu.style.display = 'none';
    menu.innerHTML = `
      <div class="menu-items">
        <button class="menu-item report-item" data-action="report">
          <span class="menu-icon">🚨</span>
          <span class="menu-text">Report Content</span>
        </button>
        <button class="menu-item appeal-item" data-action="appeal" style="display: none;">
          <span class="menu-icon">⚖️</span>
          <span class="menu-text">Appeal Removal</span>
        </button>
        <button class="menu-item vote-item" data-action="vote" style="display: none;">
          <span class="menu-icon">🗳️</span>
          <span class="menu-text">Vote on Moderation</span>
        </button>
      </div>
    `;

    // Add event listeners
    menuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });

    menu.addEventListener('click', async (e) => {
      const action = e.target.closest('.menu-item')?.dataset.action;
      if (!action) return;

      menu.style.display = 'none';

      switch (action) {
        case 'report':
          const reportModal = this.createReportModal(contentId);
          document.body.appendChild(reportModal);
          break;
        
        case 'vote':
          const votingInterface = this.createModerationVotingInterface(contentId);
          contentElement.appendChild(votingInterface);
          break;
        
        case 'appeal':
          const appealInterface = this.createAppealInterface(contentId);
          contentElement.appendChild(appealInterface);
          break;
      }
    });

    // Hide menu when clicking elsewhere
    document.addEventListener('click', () => {
      menu.style.display = 'none';
    });

    // Update menu items based on content status
    this.updateContextMenu(menu, contentId);

    // Add to content element
    const menuContainer = document.createElement('div');
    menuContainer.className = 'moderation-menu-container';
    menuContainer.appendChild(menuButton);
    menuContainer.appendChild(menu);
    
    contentElement.appendChild(menuContainer);
  }

  /**
   * Update context menu based on content moderation status
   * @private
   */
  updateContextMenu(menu, contentId) {
    const moderationData = this.moderationSystem.getModerationData(contentId);
    const status = moderationData.status;

    const reportItem = menu.querySelector('.report-item');
    const voteItem = menu.querySelector('.vote-item');
    const appealItem = menu.querySelector('.appeal-item');

    // Always show report option
    reportItem.style.display = 'block';

    // Show vote option if voting is active
    if (status === MODERATION_STATUS.VOTING_ACTIVE) {
      voteItem.style.display = 'block';
    } else {
      voteItem.style.display = 'none';
    }

    // Show appeal option if content is removed
    if (status === MODERATION_STATUS.REMOVED) {
      appealItem.style.display = 'block';
    } else {
      appealItem.style.display = 'none';
    }
  }
}

/**
 * Content Ranking Integration with Moderation
 * 
 * Integrates content moderation status and reputation into the content
 * ranking algorithm to ensure high-quality, community-approved content
 * ranks higher in search and discovery.
 */
export class ModerationRankingIntegration {
  constructor() {
    this.moderationSystem = contentModerationSystem;
    this.rankingAlgorithm = new ContentRankingAlgorithm();
  }

  /**
   * Calculate moderation score factor for content ranking
   * @param {string} contentId - Content ID
   * @returns {Promise<number>}
   */
  async calculateModerationScore(contentId) {
    try {
      const moderationData = this.moderationSystem.getModerationData(contentId);
      let moderationScore = 1.0; // Neutral score

      switch (moderationData.status) {
        case MODERATION_STATUS.ACTIVE:
          // No reports or successfully defended content
          if (moderationData.reportCount === 0) {
            moderationScore = 1.0; // Neutral
          } else {
            // Content that survived community review gets boost
            const voteResults = await this.moderationSystem.calculateVoteResults(contentId);
            if (voteResults.keepRatio > 0.7) {
              moderationScore = 1.2; // 20% boost for community-approved content
            }
          }
          break;

        case MODERATION_STATUS.REPORTED:
          moderationScore = 0.9; // Slight penalty for reported content
          break;

        case MODERATION_STATUS.VOTING_ACTIVE:
          moderationScore = 0.8; // Reduce visibility during voting
          break;

        case MODERATION_STATUS.REMOVED:
          moderationScore = 0.0; // Completely hide removed content
          break;

        case MODERATION_STATUS.APPEALED:
        case MODERATION_STATUS.APPEAL_REVIEW:
          moderationScore = 0.1; // Minimal visibility during appeal
          break;

        case MODERATION_STATUS.RESTORED:
          moderationScore = 1.1; // Slight boost for successfully appealed content
          break;

        default:
          moderationScore = 1.0;
      }

      // Additional factors
      if (moderationData.reportCount > 0) {
        // Penalty based on number of reports relative to views
        const reportRatio = moderationData.reportCount / Math.max(1, moderationData.views || 1);
        moderationScore *= Math.max(0.1, 1 - (reportRatio * 0.5));
      }

      return Math.max(0, Math.min(2.0, moderationScore));

    } catch (error) {
      console.error('Failed to calculate moderation score:', error);
      return 1.0; // Return neutral score on error
    }
  }

  /**
   * Calculate creator reputation score for ranking
   * @param {string} walletAddress - Creator's wallet address
   * @returns {Promise<number>}
   */
  async calculateCreatorReputationScore(walletAddress) {
    try {
      const reputation = await this.moderationSystem.getUserReputation(walletAddress);
      const role = this.moderationSystem.getUserRole(reputation);

      // Base score from reputation points (0.5 to 1.5 range)
      let reputationScore = 0.5 + (reputation.score / 5000); // Max reputation gives 1.5x

      // Role-based multiplier
      const roleMultipliers = {
        'member': 1.0,
        'trusted': 1.1,
        'moderator': 1.2,
        'expert': 1.3
      };

      reputationScore *= roleMultipliers[role.id] || 1.0;

      // Accuracy bonus
      if (reputation.accuracy > 0.8) {
        reputationScore *= 1.1; // 10% bonus for high accuracy
      }

      return Math.max(0.1, Math.min(2.0, reputationScore));

    } catch (error) {
      console.error('Failed to calculate creator reputation score:', error);
      return 1.0; // Return neutral score on error
    }
  }

  /**
   * Integrate moderation factors into content ranking
   * @param {Array} contentList - List of content items
   * @returns {Promise<Array>}
   */
  async integrateModeration(contentList) {
    const enhancedContent = await Promise.all(
      contentList.map(async (content) => {
        try {
          const moderationScore = await this.calculateModerationScore(content.id);
          const creatorScore = await this.calculateCreatorReputationScore(content.creatorWallet);

          return {
            ...content,
            moderationScore,
            creatorReputationScore: creatorScore,
            adjustedScore: (content.baseScore || content.score || 1) * moderationScore * creatorScore
          };
        } catch (error) {
          console.error(`Failed to enhance content ${content.id}:`, error);
          return {
            ...content,
            moderationScore: 1.0,
            creatorReputationScore: 1.0,
            adjustedScore: content.baseScore || content.score || 1
          };
        }
      })
    );

    // Sort by adjusted score
    return enhancedContent.sort((a, b) => b.adjustedScore - a.adjustedScore);
  }
}

/**
 * Real-time Moderation Updates
 * 
 * Provides real-time updates for moderation status changes using
 * WebSockets or polling for live moderation interface updates.
 */
export class ModerationUpdatesManager {
  constructor() {
    this.moderationSystem = contentModerationSystem;
    this.subscribers = new Map(); // contentId -> callback[]
    this.polling = false;
    this.pollInterval = null;
  }

  /**
   * Subscribe to moderation updates for content
   * @param {string} contentId - Content ID
   * @param {Function} callback - Update callback
   */
  subscribe(contentId, callback) {
    if (!this.subscribers.has(contentId)) {
      this.subscribers.set(contentId, []);
    }
    this.subscribers.get(contentId).push(callback);

    // Start polling if not already running
    if (!this.polling) {
      this.startPolling();
    }
  }

  /**
   * Unsubscribe from moderation updates
   * @param {string} contentId - Content ID
   * @param {Function} callback - Callback to remove
   */
  unsubscribe(contentId, callback) {
    if (this.subscribers.has(contentId)) {
      const callbacks = this.subscribers.get(contentId);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      if (callbacks.length === 0) {
        this.subscribers.delete(contentId);
      }
    }

    // Stop polling if no subscribers
    if (this.subscribers.size === 0) {
      this.stopPolling();
    }
  }

  /**
   * Start polling for updates
   * @private
   */
  startPolling() {
    if (this.polling) return;
    
    this.polling = true;
    this.pollInterval = setInterval(() => {
      this.checkForUpdates();
    }, 5000); // Poll every 5 seconds
  }

  /**
   * Stop polling for updates
   * @private
   */
  stopPolling() {
    if (!this.polling) return;
    
    this.polling = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Check for moderation updates
   * @private
   */
  async checkForUpdates() {
    for (const contentId of this.subscribers.keys()) {
      try {
        const moderationData = this.moderationSystem.getModerationData(contentId);
        const voteResults = await this.moderationSystem.calculateVoteResults(contentId);
        
        const updateData = {
          contentId,
          status: moderationData.status,
          reportCount: moderationData.reportCount,
          voteResults,
          lastUpdated: moderationData.updatedAt
        };

        // Notify subscribers
        const callbacks = this.subscribers.get(contentId);
        callbacks.forEach(callback => {
          try {
            callback(updateData);
          } catch (error) {
            console.error('Error in moderation update callback:', error);
          }
        });

      } catch (error) {
        console.error(`Failed to check updates for content ${contentId}:`, error);
      }
    }
  }
}

// Export singleton instances
export const contentModerationUI = new ContentModerationUIIntegration();
export const moderationRanking = new ModerationRankingIntegration();
export const moderationUpdates = new ModerationUpdatesManager();

// Export default object with all integrations
export default {
  ContentModerationUIIntegration,
  ModerationRankingIntegration,
  ModerationUpdatesManager,
  contentModerationUI,
  moderationRanking,
  moderationUpdates
};