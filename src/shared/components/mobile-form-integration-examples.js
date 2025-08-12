/**
 * Mobile Form Integration Examples
 * 
 * Complete examples showing how to integrate mobile-optimized forms
 * into the MLG.clan gaming platform with proper workflows
 */

import MLGMobileFormSystem from './mobile-form-system.js';
import GamingWorkflowForms from './gaming-workflow-forms.js';
import MobileFormAccessibility from './mobile-form-accessibility.js';

class MobileFormIntegrationExamples {
  constructor() {
    this.examples = new Map();
    this.init();
  }

  init() {
    this.setupExamples();
    console.log('📱 Mobile Form Integration Examples initialized');
  }

  /**
   * Setup all integration examples
   */
  setupExamples() {
    this.examples.set('vote-confirmation', this.createVoteConfirmationExample);
    this.examples.set('clan-creation', this.createClanCreationExample);
    this.examples.set('tournament-registration', this.createTournamentRegistrationExample);
    this.examples.set('token-transfer', this.createTokenTransferExample);
    this.examples.set('quick-vote', this.createQuickVoteExample);
    this.examples.set('profile-update', this.createProfileUpdateExample);
  }

  /**
   * Vote Confirmation Form Example
   */
  createVoteConfirmationExample() {
    const container = document.createElement('div');
    container.className = 'form-example vote-confirmation-example';

    // Example data
    const voteData = {
      contentId: '12345',
      contentTitle: 'Epic Valorant Clutch - 1v5 Ace',
      voteCost: 25,
      userBalance: 1250
    };

    // Create the form
    const form = window.GamingWorkflowForms.createVoteConfirmationForm({
      ...voteData,
      onVoteConfirm: async (data) => {
        console.log('Vote confirmed:', data);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show success notification
        window.MLGMobileFormSystem.showNotification(
          `🎉 Vote cast successfully! Burned ${data.voteCost} MLG tokens`,
          'success'
        );

        // Remove form
        container.remove();
      },
      onCancel: () => {
        console.log('Vote cancelled');
        container.remove();
      }
    });

    container.appendChild(form);

    // Add example info
    const info = document.createElement('div');
    info.className = 'example-info';
    info.innerHTML = `
      <h3>🗳️ Vote Confirmation Form</h3>
      <p>This form allows users to confirm token burn votes with:</p>
      <ul>
        <li>Token amount validation with real-time balance checking</li>
        <li>Confirmation typing requirement for security</li>
        <li>Gaming-optimized keyboard for confirmation input</li>
        <li>Accessible announcements for screen readers</li>
        <li>Touch-optimized buttons with haptic feedback</li>
      </ul>
    `;

    container.insertBefore(info, form);
    return container;
  }

  /**
   * Clan Creation Form Example
   */
  createClanCreationExample() {
    const container = document.createElement('div');
    container.className = 'form-example clan-creation-example';

    const form = window.GamingWorkflowForms.createClanManagementForm({
      mode: 'create',
      onSubmit: async (data) => {
        console.log('Clan creation data:', data);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        window.MLGMobileFormSystem.showNotification(
          `🏛️ Clan "${data.clanName}" created successfully!`,
          'success'
        );

        container.remove();
      },
      onCancel: () => {
        console.log('Clan creation cancelled');
        container.remove();
      }
    });

    container.appendChild(form);

    // Add example info
    const info = document.createElement('div');
    info.className = 'example-info';
    info.innerHTML = `
      <h3>🏛️ Clan Creation Form</h3>
      <p>Features demonstrated:</p>
      <ul>
        <li>Gaming username validation with availability checking</li>
        <li>Auto-capitalization for clan names</li>
        <li>Token amount input with numeric keyboard</li>
        <li>Character count tracking for descriptions</li>
        <li>Voice input support for text fields</li>
      </ul>
    `;

    container.insertBefore(info, form);
    return container;
  }

  /**
   * Tournament Registration Form Example
   */
  createTournamentRegistrationExample() {
    const container = document.createElement('div');
    container.className = 'form-example tournament-registration-example';

    const form = window.GamingWorkflowForms.createTournamentRegistrationForm({
      tournamentId: 'tournament-2024-001',
      tournamentName: 'MLG Elite Championship',
      entryFee: 50,
      maxTeamSize: 5,
      onSubmit: async (data) => {
        console.log('Tournament registration:', data);
        
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        window.MLGMobileFormSystem.showNotification(
          `🏆 Team "${data.teamName}" registered for ${data.tournamentName}!`,
          'success'
        );

        container.remove();
      },
      onCancel: () => {
        console.log('Tournament registration cancelled');
        container.remove();
      }
    });

    container.appendChild(form);

    const info = document.createElement('div');
    info.className = 'example-info';
    info.innerHTML = `
      <h3>🏆 Tournament Registration Form</h3>
      <p>Mobile optimizations:</p>
      <ul>
        <li>Dynamic team member field updates based on team size</li>
        <li>Entry fee calculator with prize pool breakdown</li>
        <li>Skill level selection with gaming terminology</li>
        <li>Multi-line text input for team member usernames</li>
        <li>Touch-friendly dropdowns for mobile interaction</li>
      </ul>
    `;

    container.insertBefore(info, form);
    return container;
  }

  /**
   * Token Transfer Form Example
   */
  createTokenTransferExample() {
    const container = document.createElement('div');
    container.className = 'form-example token-transfer-example';

    const form = window.GamingWorkflowForms.createTokenOperationForm({
      operation: 'transfer',
      userBalance: 1250,
      onSubmit: async (data) => {
        console.log('Token transfer:', data);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        window.MLGMobileFormSystem.showNotification(
          `💸 Transferred ${data.amount} MLG to ${data.recipientAddress.substring(0, 8)}...`,
          'success'
        );

        container.remove();
      },
      onCancel: () => {
        console.log('Token transfer cancelled');
        container.remove();
      }
    });

    container.appendChild(form);

    const info = document.createElement('div');
    info.className = 'example-info';
    info.innerHTML = `
      <h3>💸 Token Transfer Form</h3>
      <p>Gaming-specific features:</p>
      <ul>
        <li>Decimal keyboard for precise token amounts</li>
        <li>MAX button for quick balance selection</li>
        <li>Real-time balance validation and warnings</li>
        <li>Wallet address format validation</li>
        <li>Preset amount buttons (25%, 50%, 75%, MAX)</li>
      </ul>
    `;

    container.insertBefore(info, form);
    return container;
  }

  /**
   * Quick Vote Form Example
   */
  createQuickVoteExample() {
    const container = document.createElement('div');
    container.className = 'form-example quick-vote-example';

    const contentItems = [
      { id: '1', title: 'Epic Rocket League Goal', author: 'ProGamer', votes: 847 },
      { id: '2', title: 'Insane CS:GO Clutch', author: 'SniperKing', votes: 623 },
      { id: '3', title: 'MLG Tournament Highlights', author: 'ESportsTV', votes: 1205 }
    ];

    const form = window.GamingWorkflowForms.createQuickVoteForm({
      contentItems,
      voteCost: 25,
      userBalance: 1250,
      onVoteSubmit: async (selectedVotes) => {
        console.log('Quick votes:', selectedVotes);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        window.MLGMobileFormSystem.showNotification(
          `⚡ Cast ${selectedVotes.length} votes successfully!`,
          'success'
        );

        container.remove();
      }
    });

    container.appendChild(form);

    const info = document.createElement('div');
    info.className = 'example-info';
    info.innerHTML = `
      <h3>⚡ Quick Vote Form</h3>
      <p>Batch voting features:</p>
      <ul>
        <li>Multi-selection with real-time cost calculation</li>
        <li>Balance validation for multiple votes</li>
        <li>Select all/none functionality</li>
        <li>Visual feedback for selection state</li>
        <li>Optimized for rapid content curation</li>
      </ul>
    `;

    container.insertBefore(info, form);
    return container;
  }

  /**
   * Profile Update Form Example
   */
  createProfileUpdateExample() {
    const container = document.createElement('div');
    container.className = 'form-example profile-update-example';

    const currentProfile = {
      username: 'GamerPro2024',
      displayName: 'Elite Gamer',
      bio: 'Competitive FPS player with 5+ years experience',
      favoriteGames: 'Valorant, CS:GO, Apex Legends',
      skillLevel: 'advanced'
    };

    const form = window.MLGMobileFormSystem.createGamingForm({
      id: 'profile-update-form',
      title: '👤 Update Gaming Profile',
      subtitle: 'Keep your gaming profile up to date',
      gamingTheme: 'xbox360',
      fields: [
        {
          type: 'text',
          name: 'username',
          label: 'Gaming Username',
          value: currentProfile.username,
          required: true,
          gamingType: 'gaming-username',
          icon: 'user',
          helperText: 'Your unique gaming identifier'
        },
        {
          type: 'text',
          name: 'displayName',
          label: 'Display Name',
          value: currentProfile.displayName,
          required: true,
          icon: 'badge',
          helperText: 'How others see your name'
        },
        {
          type: 'textarea',
          name: 'bio',
          label: 'Gaming Bio',
          value: currentProfile.bio,
          maxlength: 300,
          icon: 'file-text',
          helperText: 'Tell others about your gaming background'
        },
        {
          type: 'text',
          name: 'favoriteGames',
          label: 'Favorite Games',
          value: currentProfile.favoriteGames,
          icon: 'gamepad-2',
          helperText: 'Your top gaming titles'
        },
        {
          type: 'select',
          name: 'skillLevel',
          label: 'Skill Level',
          value: currentProfile.skillLevel,
          required: true,
          options: [
            { value: 'beginner', label: '🌱 Beginner' },
            { value: 'intermediate', label: '⚡ Intermediate' },
            { value: 'advanced', label: '🔥 Advanced' },
            { value: 'professional', label: '👑 Professional' }
          ],
          icon: 'trending-up'
        }
      ],
      actions: [
        {
          type: 'submit',
          text: '💾 Save Profile',
          variant: 'primary',
          icon: 'save'
        },
        {
          type: 'button',
          text: 'Cancel',
          variant: 'secondary',
          icon: 'x',
          onClick: () => container.remove()
        }
      ]
    });

    // Add form submission handler
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      console.log('Profile update:', data);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      window.MLGMobileFormSystem.showNotification(
        '👤 Gaming profile updated successfully!',
        'success'
      );

      container.remove();
    });

    container.appendChild(form);

    const info = document.createElement('div');
    info.className = 'example-info';
    info.innerHTML = `
      <h3>👤 Profile Update Form</h3>
      <p>User experience features:</p>
      <ul>
        <li>Pre-filled fields with current values</li>
        <li>Smart auto-capitalization for display names</li>
        <li>Character counting for bio field</li>
        <li>Gaming skill level dropdown with emojis</li>
        <li>Voice input for bio and favorite games</li>
      </ul>
    `;

    container.insertBefore(info, form);
    return container;
  }

  /**
   * Create comprehensive demo page
   */
  createDemoPage() {
    const demoPage = document.createElement('div');
    demoPage.className = 'mobile-form-demo-page';
    demoPage.innerHTML = `
      <div class="demo-header">
        <h1>📱 MLG.clan Mobile Form System Demo</h1>
        <p>Comprehensive mobile-optimized forms for gaming workflows</p>
        
        <div class="demo-stats">
          <div class="stat-item">
            <div class="stat-value">8</div>
            <div class="stat-label">Form Types</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">48px+</div>
            <div class="stat-label">Touch Targets</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">5</div>
            <div class="stat-label">Keyboard Types</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">♿</div>
            <div class="stat-label">Accessible</div>
          </div>
        </div>
      </div>

      <div class="demo-navigation">
        <button class="demo-nav-btn active" data-example="vote-confirmation">
          🗳️ Vote Confirmation
        </button>
        <button class="demo-nav-btn" data-example="clan-creation">
          🏛️ Clan Creation
        </button>
        <button class="demo-nav-btn" data-example="tournament-registration">
          🏆 Tournament Reg
        </button>
        <button class="demo-nav-btn" data-example="token-transfer">
          💸 Token Transfer
        </button>
        <button class="demo-nav-btn" data-example="quick-vote">
          ⚡ Quick Vote
        </button>
        <button class="demo-nav-btn" data-example="profile-update">
          👤 Profile Update
        </button>
      </div>

      <div class="demo-content"></div>

      <div class="demo-features">
        <h2>🎮 Gaming-Optimized Features</h2>
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">⌨️</div>
            <h3>Smart Keyboards</h3>
            <p>Context-aware keyboard types for different gaming inputs</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">👆</div>
            <h3>Touch Optimized</h3>
            <p>48px+ touch targets with haptic feedback</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🎙️</div>
            <h3>Voice Input</h3>
            <p>Hands-free form completion for compatible fields</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">♿</div>
            <h3>Accessible</h3>
            <p>Screen reader support with gaming-context announcements</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🔋</div>
            <h3>Battery Efficient</h3>
            <p>Optimized performance for low-end mobile devices</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🎯</div>
            <h3>Gaming Focused</h3>
            <p>Specialized workflows for voting, clans, tournaments</p>
          </div>
        </div>
      </div>

      <div class="demo-accessibility">
        <h2>♿ Accessibility Features</h2>
        <div class="accessibility-list">
          <div class="accessibility-item">
            <span class="accessibility-check">✅</span>
            <span>WCAG 2.1 AA compliant</span>
          </div>
          <div class="accessibility-item">
            <span class="accessibility-check">✅</span>
            <span>Screen reader announcements</span>
          </div>
          <div class="accessibility-item">
            <span class="accessibility-check">✅</span>
            <span>Keyboard navigation support</span>
          </div>
          <div class="accessibility-item">
            <span class="accessibility-check">✅</span>
            <span>High contrast mode support</span>
          </div>
          <div class="accessibility-item">
            <span class="accessibility-check">✅</span>
            <span>Voice input integration</span>
          </div>
          <div class="accessibility-item">
            <span class="accessibility-check">✅</span>
            <span>Touch target minimum 48px</span>
          </div>
        </div>
      </div>
    `;

    // Setup demo navigation
    this.setupDemoNavigation(demoPage);

    // Load default example
    this.loadExample(demoPage, 'vote-confirmation');

    return demoPage;
  }

  /**
   * Setup demo navigation
   */
  setupDemoNavigation(demoPage) {
    const navButtons = demoPage.querySelectorAll('.demo-nav-btn');
    const contentArea = demoPage.querySelector('.demo-content');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Load example
        const exampleType = btn.getAttribute('data-example');
        this.loadExample(demoPage, exampleType);
      });
    });
  }

  /**
   * Load specific example
   */
  loadExample(demoPage, exampleType) {
    const contentArea = demoPage.querySelector('.demo-content');
    
    // Clear existing content
    contentArea.innerHTML = '<div class="loading">Loading example...</div>';

    // Load example with small delay for better UX
    setTimeout(() => {
      const exampleFunction = this.examples.get(exampleType);
      if (exampleFunction) {
        const example = exampleFunction();
        contentArea.innerHTML = '';
        contentArea.appendChild(example);
      }
    }, 300);
  }

  /**
   * Integration with existing pages
   */
  static integrateWithVotingPage() {
    // Add mobile vote confirmation to voting page
    const voteButtons = document.querySelectorAll('.vote-btn');
    
    voteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        
        const contentId = btn.getAttribute('data-content-id');
        const cost = parseInt(btn.getAttribute('data-cost')) || 25;
        
        // Create mobile-optimized vote confirmation form
        const voteForm = window.GamingWorkflowForms.createVoteConfirmationForm({
          contentId,
          contentTitle: btn.closest('.content-item')?.querySelector('.content-title')?.textContent || 'Content',
          voteCost: cost,
          userBalance: 1250, // Get from global state
          onVoteConfirm: async (data) => {
            // Execute the original vote logic
            await window.votingPlatform?.executeVote(contentId, cost);
            
            // Remove modal
            document.querySelector('.vote-modal')?.remove();
          },
          onCancel: () => {
            document.querySelector('.vote-modal')?.remove();
          }
        });

        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'vote-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.appendChild(voteForm);

        document.body.appendChild(modal);
      });
    });
  }

  /**
   * Integration with clan pages
   */
  static integrateWithClanPage() {
    // Add mobile clan creation form
    const createClanBtn = document.querySelector('#create-clan-btn');
    
    if (createClanBtn) {
      createClanBtn.addEventListener('click', () => {
        const clanForm = window.GamingWorkflowForms.createClanManagementForm({
          mode: 'create',
          onSubmit: async (data) => {
            console.log('Creating clan:', data);
            // API integration here
            
            document.querySelector('.clan-modal')?.remove();
          },
          onCancel: () => {
            document.querySelector('.clan-modal')?.remove();
          }
        });

        const modal = document.createElement('div');
        modal.className = 'clan-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.appendChild(clanForm);

        document.body.appendChild(modal);
      });
    }
  }

  /**
   * Create mobile form showcase
   */
  static createShowcase() {
    const showcase = new MobileFormIntegrationExamples();
    const demoPage = showcase.createDemoPage();
    
    // Add showcase styles
    showcase.injectShowcaseStyles();
    
    return demoPage;
  }

  /**
   * Inject showcase styles
   */
  injectShowcaseStyles() {
    if (document.querySelector('#mobile-form-showcase-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'mobile-form-showcase-styles';
    styles.textContent = `
      .mobile-form-demo-page {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
        min-height: 100vh;
        color: white;
      }

      .demo-header {
        text-align: center;
        margin-bottom: 3rem;
      }

      .demo-header h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        color: #00ff88;
        text-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
      }

      .demo-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
        margin-top: 2rem;
      }

      .stat-item {
        text-align: center;
        padding: 1rem;
        background: rgba(0, 255, 136, 0.1);
        border: 1px solid rgba(0, 255, 136, 0.3);
        border-radius: 8px;
      }

      .stat-value {
        font-size: 1.8rem;
        font-weight: bold;
        color: #00ff88;
        margin-bottom: 0.5rem;
      }

      .stat-label {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
      }

      .demo-navigation {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 2rem;
        justify-content: center;
      }

      .demo-nav-btn {
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
        white-space: nowrap;
      }

      .demo-nav-btn:hover,
      .demo-nav-btn.active {
        background: rgba(0, 255, 136, 0.2);
        border-color: #00ff88;
        color: #00ff88;
      }

      .demo-content {
        margin-bottom: 3rem;
        min-height: 400px;
      }

      .example-info {
        background: rgba(0, 255, 136, 0.05);
        border: 1px solid rgba(0, 255, 136, 0.2);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 2rem;
      }

      .example-info h3 {
        color: #00ff88;
        margin-bottom: 1rem;
        font-size: 1.3rem;
      }

      .example-info ul {
        list-style: none;
        padding-left: 0;
      }

      .example-info li {
        padding: 0.3rem 0;
        padding-left: 1.5rem;
        position: relative;
      }

      .example-info li::before {
        content: '✨';
        position: absolute;
        left: 0;
        color: #00ff88;
      }

      .demo-features {
        margin-bottom: 3rem;
      }

      .demo-features h2 {
        text-align: center;
        color: #00ff88;
        margin-bottom: 2rem;
        font-size: 2rem;
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
      }

      .feature-item {
        text-align: center;
        padding: 1.5rem;
        background: rgba(26, 26, 46, 0.8);
        border: 1px solid rgba(0, 255, 136, 0.2);
        border-radius: 12px;
        transition: all 0.3s ease;
      }

      .feature-item:hover {
        border-color: rgba(0, 255, 136, 0.5);
        transform: translateY(-2px);
      }

      .feature-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
      }

      .feature-item h3 {
        color: #00ff88;
        margin-bottom: 0.8rem;
        font-size: 1.2rem;
      }

      .feature-item p {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
        line-height: 1.5;
      }

      .demo-accessibility {
        background: rgba(26, 26, 46, 0.5);
        border: 1px solid rgba(0, 255, 136, 0.2);
        border-radius: 12px;
        padding: 2rem;
      }

      .demo-accessibility h2 {
        color: #00ff88;
        margin-bottom: 1.5rem;
        text-align: center;
      }

      .accessibility-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
      }

      .accessibility-item {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 0.5rem;
      }

      .accessibility-check {
        color: #00ff88;
        font-weight: bold;
        font-size: 1.1rem;
      }

      .loading {
        text-align: center;
        padding: 2rem;
        color: rgba(255, 255, 255, 0.6);
        font-size: 1.1rem;
      }

      .vote-modal,
      .clan-modal {
        backdrop-filter: blur(5px);
      }

      .vote-modal .mlg-mobile-form,
      .clan-modal .mlg-mobile-form {
        max-width: 400px;
        margin: 1rem;
      }

      @media (max-width: 768px) {
        .mobile-form-demo-page {
          padding: 1rem;
        }

        .demo-header h1 {
          font-size: 2rem;
        }

        .demo-stats {
          grid-template-columns: repeat(2, 1fr);
        }

        .demo-navigation {
          flex-direction: column;
        }

        .demo-nav-btn {
          width: 100%;
          justify-content: center;
        }

        .features-grid {
          grid-template-columns: 1fr;
        }

        .accessibility-list {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(styles);
  }
}

// Initialize and export
const mobileFormIntegrationExamples = new MobileFormIntegrationExamples();
window.MobileFormIntegrationExamples = mobileFormIntegrationExamples;

// Auto-integrate with existing pages if they're present
document.addEventListener('DOMContentLoaded', () => {
  // Check for voting page
  if (document.querySelector('.vote-btn')) {
    MobileFormIntegrationExamples.integrateWithVotingPage();
  }

  // Check for clan page
  if (document.querySelector('#create-clan-btn')) {
    MobileFormIntegrationExamples.integrateWithClanPage();
  }
});

export default mobileFormIntegrationExamples;