/**
 * MLG.clan Mobile Native Features Integration Examples
 * 
 * Comprehensive examples and integration patterns for mobile-native features
 * in the MLG.clan gaming platform
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

// ==========================================
// GAMING ACHIEVEMENT SHARING INTEGRATION
// ==========================================

/**
 * Gaming Achievement Share Integration
 * Demonstrates how to implement gaming-optimized sharing with metadata
 */
class GamingAchievementShare {
  constructor(mobileFeatures) {
    this.mobileFeatures = mobileFeatures;
    this.setupAchievementSharing();
  }

  setupAchievementSharing() {
    // Listen for achievement unlocks
    window.addEventListener('mlg:achievement:unlocked', (event) => {
      this.handleAchievementUnlocked(event.detail);
    });

    // Setup share buttons on achievement cards
    this.setupShareButtons();
  }

  setupShareButtons() {
    document.addEventListener('click', (event) => {
      if (event.target.matches('[data-share-achievement]')) {
        const achievementId = event.target.dataset.shareAchievement;
        this.shareAchievement(achievementId);
      }
    });
  }

  async handleAchievementUnlocked(achievementData) {
    // Show achievement notification with share option
    const achievementCard = this.createAchievementCard(achievementData);
    document.body.appendChild(achievementCard);

    // Auto-trigger haptic feedback
    this.mobileFeatures.triggerHapticFeedback('achievement');

    // Auto-share prompt after 3 seconds
    setTimeout(() => {
      this.promptAchievementShare(achievementData);
    }, 3000);
  }

  createAchievementCard(achievement) {
    const card = document.createElement('div');
    card.className = 'gaming-achievement-share';
    card.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <h3 class="achievement-title">${achievement.title}</h3>
      <p class="achievement-description">${achievement.description}</p>
      <div class="achievement-stats">
        <div class="achievement-stat">
          <span class="stat-value">${achievement.points}</span>
          <span class="stat-label">Points</span>
        </div>
        <div class="achievement-stat">
          <span class="stat-value">${achievement.rarity}%</span>
          <span class="stat-label">Rarity</span>
        </div>
        <div class="achievement-stat">
          <span class="stat-value">${achievement.tokens}</span>
          <span class="stat-label">MLG Tokens</span>
        </div>
      </div>
      <div class="achievement-actions">
        <button class="gaming-button mobile-touch-optimized" 
                data-share-achievement="${achievement.id}">
          📤 Share Achievement
        </button>
        <button class="gaming-button mobile-touch-optimized secondary"
                onclick="this.parentElement.parentElement.remove()">
          ✕ Close
        </button>
      </div>
    `;
    return card;
  }

  async shareAchievement(achievementId) {
    const achievement = await this.fetchAchievementData(achievementId);
    
    const shareData = {
      title: `🏆 ${achievement.title} Achievement Unlocked!`,
      text: `I just unlocked "${achievement.title}" on MLG.clan! ${achievement.description} Join me in competitive gaming with blockchain rewards! #MLGclan #Gaming #Achievement`,
      url: `${window.location.origin}/achievements/${achievementId}?ref=share`,
      files: achievement.image ? [await this.generateAchievementImage(achievement)] : undefined
    };

    try {
      await this.mobileFeatures.shareGamingContent('achievement', shareData);
      
      // Track successful share
      this.trackAchievementShare(achievementId, 'success');
      
      // Reward user with bonus tokens for sharing
      this.rewardSharingBonus(achievementId);
      
    } catch (error) {
      console.error('Error sharing achievement:', error);
      this.trackAchievementShare(achievementId, 'error');
    }
  }

  async generateAchievementImage(achievement) {
    // Generate achievement image with gaming branding
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 1200;
    canvas.height = 630; // Social media optimized dimensions
    
    // Gaming background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#0a0a0f');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Achievement content
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 64px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(achievement.title, canvas.width / 2, 200);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '32px Inter';
    ctx.fillText(achievement.description, canvas.width / 2, 280);
    
    // MLG.clan branding
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 40px Inter';
    ctx.fillText('MLG.clan', canvas.width / 2, 500);
    
    // Convert to blob
    return new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png');
    });
  }

  trackAchievementShare(achievementId, status) {
    window.dispatchEvent(new CustomEvent('mlg:analytics:track', {
      detail: {
        category: 'achievement_sharing',
        action: 'share_attempt',
        data: { achievementId, status }
      }
    }));
  }
}

// ==========================================
// CLAN INVITATION QR CODE SYSTEM
// ==========================================

/**
 * Clan QR Code Integration
 * Demonstrates QR code generation and scanning for clan invitations
 */
class ClanQRIntegration {
  constructor(mobileFeatures) {
    this.mobileFeatures = mobileFeatures;
    this.setupQRIntegration();
  }

  setupQRIntegration() {
    // Setup QR generation buttons
    document.addEventListener('click', (event) => {
      if (event.target.matches('[data-generate-clan-qr]')) {
        const clanId = event.target.dataset.generateClanQr;
        this.generateClanInviteQR(clanId);
      }
      
      if (event.target.matches('[data-scan-clan-qr]')) {
        this.scanClanInviteQR();
      }
    });

    // Listen for QR scan results
    window.addEventListener('mlg:qr:scanned', (event) => {
      this.handleQRScanned(event.detail);
    });
  }

  async generateClanInviteQR(clanId) {
    try {
      const clan = await this.fetchClanData(clanId);
      
      const inviteData = {
        type: 'clan_invite',
        clanId: clan.id,
        clanName: clan.name,
        inviteCode: this.generateInviteCode(),
        timestamp: Date.now(),
        expiry: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        inviterAddress: await this.getCurrentUserAddress()
      };

      // Generate QR code using external library or canvas
      const qrCodeImage = await this.generateQRCode(inviteData);
      
      // Show QR code modal
      this.showQRCodeModal(clan, qrCodeImage, inviteData);
      
      // Track QR generation
      this.trackClanQREvent('qr_generated', { clanId });
      
    } catch (error) {
      console.error('Error generating clan QR code:', error);
      this.mobileFeatures.showToast('Failed to generate QR code', 'error');
    }
  }

  showQRCodeModal(clan, qrCodeImage, inviteData) {
    const modal = document.createElement('div');
    modal.className = 'clan-qr-modal';
    modal.innerHTML = `
      <div class="qr-modal-content">
        <div class="qr-modal-header">
          <h3>Invite to ${clan.name}</h3>
          <button class="qr-modal-close">✕</button>
        </div>
        <div class="qr-code-container">
          <img src="${qrCodeImage}" alt="Clan Invite QR Code" class="qr-code-image">
        </div>
        <div class="qr-modal-info">
          <p>Scan this QR code to join our clan!</p>
          <div class="invite-details">
            <div class="invite-stat">
              <span class="stat-label">Members</span>
              <span class="stat-value">${clan.memberCount}</span>
            </div>
            <div class="invite-stat">
              <span class="stat-label">Rank</span>
              <span class="stat-value">#${clan.rank}</span>
            </div>
            <div class="invite-stat">
              <span class="stat-label">Wins</span>
              <span class="stat-value">${clan.wins}</span>
            </div>
          </div>
        </div>
        <div class="qr-modal-actions">
          <button class="gaming-button mobile-touch-optimized" 
                  onclick="navigator.share({title: 'Join my MLG.clan!', text: 'Scan this QR code to join our gaming clan on MLG.clan', url: '${this.generateInviteLink(inviteData)}'})">
            📤 Share Invite
          </button>
          <button class="gaming-button mobile-touch-optimized secondary"
                  onclick="MLGMobileNativeFeatures.copyToClipboard('${this.generateInviteLink(inviteData)}', 'clan_invite')">
            📋 Copy Link
          </button>
        </div>
      </div>
    `;

    // Add close functionality
    modal.querySelector('.qr-modal-close').addEventListener('click', () => {
      modal.remove();
    });

    // Add to page
    document.body.appendChild(modal);
    
    // Animate in
    requestAnimationFrame(() => {
      modal.classList.add('visible');
    });
  }

  async scanClanInviteQR() {
    try {
      await this.mobileFeatures.openQRScanner();
      this.trackClanQREvent('qr_scanner_opened');
    } catch (error) {
      console.error('Error opening QR scanner:', error);
      this.mobileFeatures.showToast('Unable to access camera', 'error');
    }
  }

  async handleQRScanned(qrData) {
    try {
      const data = JSON.parse(qrData.text);
      
      if (data.type === 'clan_invite') {
        await this.processClanInvite(data);
      } else {
        this.mobileFeatures.showToast('Invalid QR code', 'warning');
      }
      
    } catch (error) {
      console.error('Error processing QR code:', error);
      this.mobileFeatures.showToast('Unable to process QR code', 'error');
    }
  }

  async processClanInvite(inviteData) {
    // Check invite validity
    if (Date.now() > inviteData.expiry) {
      this.mobileFeatures.showToast('Invite has expired', 'warning');
      return;
    }

    // Fetch clan details
    const clan = await this.fetchClanData(inviteData.clanId);
    
    // Show join confirmation
    this.showClanJoinConfirmation(clan, inviteData);
    
    this.trackClanQREvent('invite_scanned', { clanId: inviteData.clanId });
  }

  showClanJoinConfirmation(clan, inviteData) {
    const confirmation = document.createElement('div');
    confirmation.className = 'clan-join-confirmation';
    confirmation.innerHTML = `
      <div class="join-confirmation-content">
        <div class="clan-preview">
          <div class="clan-avatar">${clan.avatar || '🛡️'}</div>
          <h3 class="clan-name">${clan.name}</h3>
          <p class="clan-description">${clan.description}</p>
          <div class="clan-stats">
            <div class="clan-stat">
              <span class="stat-value">${clan.memberCount}</span>
              <span class="stat-label">Members</span>
            </div>
            <div class="clan-stat">
              <span class="stat-value">#${clan.rank}</span>
              <span class="stat-label">Rank</span>
            </div>
            <div class="clan-stat">
              <span class="stat-value">${clan.wins}</span>
              <span class="stat-label">Wins</span>
            </div>
          </div>
        </div>
        <div class="join-actions">
          <button class="gaming-button mobile-touch-optimized" 
                  onclick="this.joinClan('${inviteData.clanId}', '${inviteData.inviteCode}')">
            ⚔️ Join Clan
          </button>
          <button class="gaming-button mobile-touch-optimized secondary"
                  onclick="this.parentElement.parentElement.parentElement.remove()">
            ✕ Cancel
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(confirmation);
  }

  trackClanQREvent(action, data = {}) {
    window.dispatchEvent(new CustomEvent('mlg:analytics:track', {
      detail: {
        category: 'clan_qr',
        action,
        data
      }
    }));
  }
}

// ==========================================
// TOURNAMENT BRACKET SHARING
// ==========================================

/**
 * Tournament Bracket Sharing Integration
 * Demonstrates sharing tournament results with live updates
 */
class TournamentBracketShare {
  constructor(mobileFeatures) {
    this.mobileFeatures = mobileFeatures;
    this.setupTournamentSharing();
  }

  setupTournamentSharing() {
    // Listen for tournament updates
    window.addEventListener('mlg:tournament:updated', (event) => {
      this.handleTournamentUpdate(event.detail);
    });

    // Setup share buttons
    document.addEventListener('click', (event) => {
      if (event.target.matches('[data-share-tournament]')) {
        const tournamentId = event.target.dataset.shareTournament;
        this.shareTournamentBracket(tournamentId);
      }
    });
  }

  async shareTournamentBracket(tournamentId) {
    try {
      const tournament = await this.fetchTournamentData(tournamentId);
      const bracketImage = await this.generateBracketImage(tournament);
      
      const shareData = {
        title: `⚔️ ${tournament.name} Tournament Bracket`,
        text: `Check out the ${tournament.name} tournament bracket on MLG.clan! ${tournament.participants} participants competing for ${tournament.prizePool} MLG tokens! #Tournament #Gaming #MLGclan`,
        url: `${window.location.origin}/tournaments/${tournamentId}?ref=bracket_share`,
        files: [bracketImage]
      };

      await this.mobileFeatures.shareGamingContent('tournament', shareData);
      
      this.trackTournamentShare(tournamentId, 'bracket_shared');
      
    } catch (error) {
      console.error('Error sharing tournament bracket:', error);
      this.mobileFeatures.showToast('Failed to share bracket', 'error');
    }
  }

  async generateBracketImage(tournament) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 1200;
    canvas.height = 800;
    
    // Tournament bracket background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#0a0a0f');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Tournament title
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 48px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(tournament.name, canvas.width / 2, 80);
    
    // Prize pool
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 32px Inter';
    ctx.fillText(`🏆 ${tournament.prizePool} MLG Tokens`, canvas.width / 2, 130);
    
    // Draw bracket structure
    this.drawBracketStructure(ctx, tournament.bracket, canvas.width, canvas.height);
    
    // MLG.clan branding
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 24px Inter';
    ctx.fillText('MLG.clan Tournament Platform', canvas.width / 2, canvas.height - 30);
    
    return new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png');
    });
  }

  drawBracketStructure(ctx, bracket, width, height) {
    const startY = 200;
    const bracketHeight = height - 300;
    const rounds = bracket.rounds.length;
    
    bracket.rounds.forEach((round, roundIndex) => {
      const x = (width / (rounds + 1)) * (roundIndex + 1);
      const matchHeight = bracketHeight / round.matches.length;
      
      round.matches.forEach((match, matchIndex) => {
        const y = startY + (matchHeight * matchIndex) + (matchHeight / 2);
        
        // Draw match
        this.drawMatch(ctx, match, x, y);
      });
    });
  }

  drawMatch(ctx, match, x, y) {
    const matchWidth = 180;
    const matchHeight = 80;
    
    // Match background
    ctx.fillStyle = 'rgba(26, 26, 46, 0.8)';
    ctx.fillRect(x - matchWidth/2, y - matchHeight/2, matchWidth, matchHeight);
    
    // Match border
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - matchWidth/2, y - matchHeight/2, matchWidth, matchHeight);
    
    // Player names
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    
    if (match.player1) {
      ctx.fillText(match.player1.name, x, y - 20);
    }
    
    if (match.player2) {
      ctx.fillText(match.player2.name, x, y + 10);
    }
    
    // Score if available
    if (match.score) {
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 12px Inter';
      ctx.fillText(match.score, x, y + 30);
    }
  }

  trackTournamentShare(tournamentId, action) {
    window.dispatchEvent(new CustomEvent('mlg:analytics:track', {
      detail: {
        category: 'tournament_sharing',
        action,
        data: { tournamentId }
      }
    }));
  }
}

// ==========================================
// MLG TOKEN TRANSACTION SHARING
// ==========================================

/**
 * Token Transaction Sharing Integration
 * Demonstrates sharing blockchain transactions with verification
 */
class TokenTransactionShare {
  constructor(mobileFeatures) {
    this.mobileFeatures = mobileFeatures;
    this.setupTransactionSharing();
  }

  setupTransactionSharing() {
    // Listen for successful transactions
    window.addEventListener('mlg:transaction:success', (event) => {
      this.handleTransactionSuccess(event.detail);
    });

    // Setup share buttons
    document.addEventListener('click', (event) => {
      if (event.target.matches('[data-share-transaction]')) {
        const txHash = event.target.dataset.shareTransaction;
        this.shareTransaction(txHash);
      }
    });
  }

  async handleTransactionSuccess(transactionData) {
    // Show success notification with share option
    const notification = this.createTransactionNotification(transactionData);
    document.body.appendChild(notification);

    // Haptic feedback for successful transaction
    this.mobileFeatures.triggerHapticFeedback('success');

    // Auto-prompt share for large transactions
    if (transactionData.amount > 1000) {
      setTimeout(() => {
        this.promptTransactionShare(transactionData);
      }, 2000);
    }
  }

  createTransactionNotification(transaction) {
    const notification = document.createElement('div');
    notification.className = 'transaction-success-notification';
    notification.innerHTML = `
      <div class="transaction-notification-content">
        <div class="transaction-icon">🪙</div>
        <h3 class="transaction-title">Transaction Successful!</h3>
        <div class="transaction-details">
          <div class="transaction-amount">${transaction.amount} MLG</div>
          <div class="transaction-type">${transaction.type}</div>
          <div class="transaction-hash">${this.formatHash(transaction.hash)}</div>
        </div>
        <div class="transaction-actions">
          <button class="gaming-button mobile-touch-optimized" 
                  data-share-transaction="${transaction.hash}">
            📤 Share Transaction
          </button>
          <button class="gaming-button mobile-touch-optimized secondary"
                  onclick="this.parentElement.parentElement.parentElement.remove()">
            ✓ Close
          </button>
        </div>
      </div>
    `;
    return notification;
  }

  async shareTransaction(txHash) {
    try {
      const transaction = await this.fetchTransactionData(txHash);
      
      const shareData = {
        title: `🪙 MLG Token Transaction Verified`,
        text: `Just completed a ${transaction.amount} MLG token ${transaction.type} on Solana! Verified on-chain with transparent gaming rewards. Join MLG.clan for Web3 gaming! #MLGTokens #Solana #Gaming #Web3`,
        url: `${window.location.origin}/transactions/${txHash}?ref=tx_share`
      };

      await this.mobileFeatures.shareGamingContent('token', shareData);
      
      this.trackTransactionShare(txHash, 'shared');
      
      // Reward user for sharing transactions (community building)
      this.rewardTransactionSharing(txHash);
      
    } catch (error) {
      console.error('Error sharing transaction:', error);
      this.mobileFeatures.showToast('Failed to share transaction', 'error');
    }
  }

  formatHash(hash) {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  }

  trackTransactionShare(txHash, action) {
    window.dispatchEvent(new CustomEvent('mlg:analytics:track', {
      detail: {
        category: 'token_sharing',
        action,
        data: { txHash }
      }
    }));
  }
}

// ==========================================
// GAMING PHOTO CAPTURE INTEGRATION
// ==========================================

/**
 * Gaming Photo Capture Integration
 * Demonstrates camera integration for gaming content
 */
class GamingPhotoCapture {
  constructor(mobileFeatures) {
    this.mobileFeatures = mobileFeatures;
    this.setupPhotoCapture();
  }

  setupPhotoCapture() {
    // Setup camera buttons
    document.addEventListener('click', (event) => {
      if (event.target.matches('[data-capture-gaming-photo]')) {
        const context = event.target.dataset.captureGamingPhoto;
        this.openGamingCamera(context);
      }
    });

    // Listen for photo captures
    window.addEventListener('mlg:camera:photoCaptured', (event) => {
      this.handlePhotoCaptured(event.detail);
    });
  }

  async openGamingCamera(context = 'profile') {
    try {
      await this.mobileFeatures.openCameraCapture({
        context,
        facingMode: context === 'selfie' ? 'user' : 'environment'
      });
      
      this.trackCameraEvent('camera_opened', { context });
      
    } catch (error) {
      console.error('Error opening camera:', error);
      this.mobileFeatures.showToast('Unable to access camera', 'error');
    }
  }

  async handlePhotoCaptured(photoData) {
    try {
      // Process gaming photo with MLG branding
      const processedPhoto = await this.processGamingPhoto(photoData);
      
      // Show photo preview with gaming options
      this.showGamingPhotoPreview(processedPhoto);
      
      this.trackCameraEvent('photo_captured', { 
        type: photoData.type,
        timestamp: photoData.timestamp 
      });
      
    } catch (error) {
      console.error('Error processing gaming photo:', error);
      this.mobileFeatures.showToast('Failed to process photo', 'error');
    }
  }

  async processGamingPhoto(photoData) {
    // Add gaming overlays and branding
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Load original image
    const img = new Image();
    img.src = photoData.imageUrl;
    
    await new Promise(resolve => {
      img.onload = resolve;
    });
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw original image
    ctx.drawImage(img, 0, 0);
    
    // Add gaming overlay
    this.addGamingOverlay(ctx, canvas.width, canvas.height);
    
    // Convert back to blob
    const processedBlob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.9);
    });
    
    return {
      ...photoData,
      processedBlob,
      processedUrl: URL.createObjectURL(processedBlob)
    };
  }

  addGamingOverlay(ctx, width, height) {
    // Gaming frame overlay
    const frameWidth = 40;
    
    // Top-left corner
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(0, 0, frameWidth, 5);
    ctx.fillRect(0, 0, 5, frameWidth);
    
    // Top-right corner
    ctx.fillRect(width - frameWidth, 0, frameWidth, 5);
    ctx.fillRect(width - 5, 0, 5, frameWidth);
    
    // Bottom-left corner
    ctx.fillRect(0, height - 5, frameWidth, 5);
    ctx.fillRect(0, height - frameWidth, 5, frameWidth);
    
    // Bottom-right corner
    ctx.fillRect(width - frameWidth, height - 5, frameWidth, 5);
    ctx.fillRect(width - 5, height - frameWidth, 5, frameWidth);
    
    // MLG.clan watermark
    ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'right';
    ctx.fillText('MLG.clan', width - 20, height - 20);
  }

  showGamingPhotoPreview(photoData) {
    const preview = document.createElement('div');
    preview.className = 'gaming-photo-preview';
    preview.innerHTML = `
      <div class="photo-preview-content">
        <div class="photo-preview-header">
          <h3>Gaming Photo Captured!</h3>
          <button class="photo-preview-close">✕</button>
        </div>
        <div class="photo-preview-image">
          <img src="${photoData.processedUrl}" alt="Gaming Photo">
        </div>
        <div class="photo-preview-actions">
          <button class="gaming-button mobile-touch-optimized"
                  onclick="this.shareGamingPhoto('${photoData.processedUrl}')">
            📤 Share Photo
          </button>
          <button class="gaming-button mobile-touch-optimized secondary"
                  onclick="this.saveGamingPhoto('${photoData.processedUrl}')">
            💾 Save Photo
          </button>
          <button class="gaming-button mobile-touch-optimized secondary"
                  onclick="this.setProfilePhoto('${photoData.processedUrl}')">
            👤 Set as Profile
          </button>
        </div>
      </div>
    `;

    // Add close functionality
    preview.querySelector('.photo-preview-close').addEventListener('click', () => {
      preview.remove();
      URL.revokeObjectURL(photoData.processedUrl);
    });

    document.body.appendChild(preview);
  }

  trackCameraEvent(action, data = {}) {
    window.dispatchEvent(new CustomEvent('mlg:analytics:track', {
      detail: {
        category: 'gaming_camera',
        action,
        data
      }
    }));
  }
}

// ==========================================
// GLOBAL INITIALIZATION
// ==========================================

/**
 * Initialize all mobile native feature integrations
 */
function initializeMobileNativeIntegrations() {
  // Wait for mobile features system to be ready
  if (window.MLGMobileNativeFeatures) {
    const mobileFeatures = window.MLGMobileNativeFeatures;
    
    // Initialize all integrations
    window.GamingAchievementShare = new GamingAchievementShare(mobileFeatures);
    window.ClanQRIntegration = new ClanQRIntegration(mobileFeatures);
    window.TournamentBracketShare = new TournamentBracketShare(mobileFeatures);
    window.TokenTransactionShare = new TokenTransactionShare(mobileFeatures);
    window.GamingPhotoCapture = new GamingPhotoCapture(mobileFeatures);
    
    console.log('🎮 MLG Mobile Native Feature Integrations initialized');
    
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('mlg:mobile:integrations:ready'));
    
  } else {
    // Wait for mobile features system
    window.addEventListener('mlg:mobile:initialized', () => {
      initializeMobileNativeIntegrations();
    });
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMobileNativeIntegrations);
} else {
  initializeMobileNativeIntegrations();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GamingAchievementShare,
    ClanQRIntegration,
    TournamentBracketShare,
    TokenTransactionShare,
    GamingPhotoCapture,
    initializeMobileNativeIntegrations
  };
}