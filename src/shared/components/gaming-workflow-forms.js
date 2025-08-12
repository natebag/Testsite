/**
 * Gaming Workflow Forms
 * 
 * Specialized mobile-optimized forms for MLG.clan gaming workflows
 * - Vote confirmation forms with token burn display
 * - Clan management forms with role-based inputs
 * - Tournament registration with gaming-specific fields
 * - Token operations with real-time balance updates
 */

import MLGMobileFormSystem from './mobile-form-system.js';

class GamingWorkflowForms {
  constructor() {
    this.mobileFormSystem = window.MLGMobileFormSystem || MLGMobileFormSystem;
    this.init();
  }

  init() {
    console.log('🎮 Gaming Workflow Forms initialized');
  }

  /**
   * Create Vote Confirmation Form
   */
  createVoteConfirmationForm(config) {
    const {
      contentId,
      contentTitle,
      voteCost = 25,
      userBalance = 1250,
      onVoteConfirm,
      onCancel
    } = config;

    const formConfig = {
      id: 'vote-confirmation-form',
      title: '🗳️ Confirm Your Vote',
      subtitle: 'Burn MLG tokens to cast your vote',
      gamingTheme: 'xbox360',
      fields: [
        {
          type: 'hidden',
          name: 'contentId',
          value: contentId
        },
        {
          type: 'text',
          name: 'contentTitle',
          label: 'Content',
          value: contentTitle,
          disabled: true,
          icon: 'play'
        },
        {
          type: 'number',
          name: 'voteCost',
          label: 'Vote Cost (MLG Tokens)',
          value: voteCost,
          gamingType: 'token-amount',
          icon: 'coins',
          helperText: `You will burn ${voteCost} MLG tokens for this vote`
        },
        {
          type: 'text',
          name: 'confirmation',
          label: 'Type "CONFIRM" to proceed',
          placeholder: 'Type CONFIRM',
          required: true,
          gamingType: 'gaming-confirmation',
          icon: 'shield-check'
        }
      ],
      actions: [
        {
          type: 'submit',
          text: `🔥 Burn ${voteCost} MLG & Vote`,
          variant: 'primary',
          icon: 'flame'
        },
        {
          type: 'button',
          text: 'Cancel',
          variant: 'secondary',
          icon: 'x',
          onClick: onCancel
        }
      ]
    };

    const form = this.mobileFormSystem.createGamingForm(formConfig);
    
    // Add balance warning if insufficient funds
    if (userBalance < voteCost) {
      this.addInsufficientFundsWarning(form, voteCost, userBalance);
    }

    // Add vote cost breakdown
    this.addVoteCostBreakdown(form, voteCost, userBalance);

    // Setup vote confirmation logic
    this.setupVoteConfirmationLogic(form, onVoteConfirm);

    return form;
  }

  /**
   * Create Clan Management Form
   */
  createClanManagementForm(config) {
    const {
      mode = 'create', // 'create', 'edit', 'join'
      clanData = {},
      onSubmit,
      onCancel
    } = config;

    const isCreate = mode === 'create';
    const isJoin = mode === 'join';

    const formConfig = {
      id: 'clan-management-form',
      title: isCreate ? '🏛️ Create New Clan' : isJoin ? '🤝 Join Clan' : '⚙️ Edit Clan',
      subtitle: isCreate ? 'Establish your gaming dynasty' : isJoin ? 'Request to join this clan' : 'Update clan information',
      gamingTheme: 'xbox360',
      fields: []
    };

    if (isCreate || !isJoin) {
      formConfig.fields.push(
        {
          type: 'text',
          name: 'clanName',
          label: 'Clan Name',
          placeholder: 'Enter clan name',
          value: clanData.name || '',
          required: true,
          gamingType: 'clan-name',
          icon: 'crown',
          helperText: 'Choose a unique name for your clan (max 25 characters)'
        },
        {
          type: 'textarea',
          name: 'clanDescription',
          label: 'Clan Description',
          placeholder: 'Describe your clan...',
          value: clanData.description || '',
          maxlength: 500,
          icon: 'file-text',
          helperText: 'Tell potential members about your clan'
        }
      );
    }

    if (isCreate) {
      formConfig.fields.push(
        {
          type: 'select',
          name: 'clanType',
          label: 'Clan Type',
          required: true,
          options: [
            { value: 'competitive', label: '🏆 Competitive' },
            { value: 'casual', label: '🎮 Casual' },
            { value: 'professional', label: '💼 Professional' },
            { value: 'community', label: '👥 Community' }
          ],
          icon: 'target'
        },
        {
          type: 'number',
          name: 'stakingRequirement',
          label: 'Minimum Staking Requirement',
          placeholder: '100',
          value: clanData.stakingRequirement || 100,
          gamingType: 'token-amount',
          icon: 'lock',
          helperText: 'Minimum MLG tokens members must stake to join'
        }
      );
    }

    if (isJoin) {
      formConfig.fields.push(
        {
          type: 'textarea',
          name: 'joinMessage',
          label: 'Why do you want to join?',
          placeholder: 'Tell the clan leaders why you want to join...',
          required: true,
          maxlength: 300,
          icon: 'message-circle',
          helperText: 'Convince the clan leaders to accept you'
        },
        {
          type: 'text',
          name: 'gamingExperience',
          label: 'Gaming Experience',
          placeholder: 'e.g., 5 years competitive FPS',
          required: true,
          icon: 'gamepad-2',
          helperText: 'Describe your gaming background'
        }
      );
    }

    formConfig.actions = [
      {
        type: 'submit',
        text: isCreate ? '🏛️ Create Clan' : isJoin ? '🤝 Request to Join' : '💾 Save Changes',
        variant: 'primary',
        icon: isCreate ? 'plus' : isJoin ? 'user-plus' : 'save'
      },
      {
        type: 'button',
        text: 'Cancel',
        variant: 'secondary',
        icon: 'x',
        onClick: onCancel
      }
    ];

    const form = this.mobileFormSystem.createGamingForm(formConfig);
    
    // Add clan-specific enhancements
    this.setupClanFormEnhancements(form, mode);

    return form;
  }

  /**
   * Create Tournament Registration Form
   */
  createTournamentRegistrationForm(config) {
    const {
      tournamentId,
      tournamentName,
      entryFee = 50,
      maxTeamSize = 5,
      onSubmit,
      onCancel
    } = config;

    const formConfig = {
      id: 'tournament-registration-form',
      title: '🏆 Tournament Registration',
      subtitle: `Register for ${tournamentName}`,
      gamingTheme: 'xbox360',
      fields: [
        {
          type: 'hidden',
          name: 'tournamentId',
          value: tournamentId
        },
        {
          type: 'text',
          name: 'teamName',
          label: 'Team Name',
          placeholder: 'Enter your team name',
          required: true,
          gamingType: 'gaming-username',
          icon: 'users',
          helperText: 'Choose a unique team name for the tournament'
        },
        {
          type: 'select',
          name: 'teamSize',
          label: 'Team Size',
          required: true,
          options: Array.from({ length: maxTeamSize }, (_, i) => ({
            value: i + 1,
            label: `${i + 1} Player${i > 0 ? 's' : ''}`
          })),
          icon: 'users'
        },
        {
          type: 'textarea',
          name: 'teamMembers',
          label: 'Team Members',
          placeholder: 'List your team members (one per line)',
          required: true,
          maxlength: 500,
          icon: 'user-check',
          helperText: 'Enter the usernames of all team members'
        },
        {
          type: 'select',
          name: 'skillLevel',
          label: 'Skill Level',
          required: true,
          options: [
            { value: 'beginner', label: '🌱 Beginner' },
            { value: 'intermediate', label: '⚡ Intermediate' },
            { value: 'advanced', label: '🔥 Advanced' },
            { value: 'professional', label: '👑 Professional' }
          ],
          icon: 'trending-up'
        },
        {
          type: 'number',
          name: 'entryFee',
          label: 'Entry Fee (MLG Tokens)',
          value: entryFee,
          disabled: true,
          gamingType: 'token-amount',
          icon: 'coins',
          helperText: `Entry fee: ${entryFee} MLG tokens per team`
        }
      ],
      actions: [
        {
          type: 'submit',
          text: `🏆 Register Team (${entryFee} MLG)`,
          variant: 'primary',
          icon: 'trophy'
        },
        {
          type: 'button',
          text: 'Cancel',
          variant: 'secondary',
          icon: 'x',
          onClick: onCancel
        }
      ]
    };

    const form = this.mobileFormSystem.createGamingForm(formConfig);
    
    // Add tournament-specific features
    this.setupTournamentFormEnhancements(form, config);

    return form;
  }

  /**
   * Create Token Operation Form
   */
  createTokenOperationForm(config) {
    const {
      operation = 'transfer', // 'transfer', 'stake', 'unstake', 'burn'
      recipientAddress = '',
      amount = '',
      userBalance = 1250,
      onSubmit,
      onCancel
    } = config;

    const operationLabels = {
      transfer: { title: '💸 Transfer Tokens', icon: 'send', action: 'Transfer' },
      stake: { title: '🔒 Stake Tokens', icon: 'lock', action: 'Stake' },
      unstake: { title: '🔓 Unstake Tokens', icon: 'unlock', action: 'Unstake' },
      burn: { title: '🔥 Burn Tokens', icon: 'flame', action: 'Burn' }
    };

    const opConfig = operationLabels[operation];

    const formConfig = {
      id: 'token-operation-form',
      title: opConfig.title,
      subtitle: `${opConfig.action} your MLG tokens`,
      gamingTheme: 'xbox360',
      fields: [
        {
          type: 'number',
          name: 'amount',
          label: `Amount to ${opConfig.action}`,
          placeholder: '0.00',
          value: amount,
          required: true,
          gamingType: 'token-amount',
          icon: 'coins',
          helperText: `Available balance: ${userBalance.toLocaleString()} MLG`
        }
      ],
      actions: [
        {
          type: 'submit',
          text: `${opConfig.icon === 'flame' ? '🔥' : '✅'} ${opConfig.action} Tokens`,
          variant: operation === 'burn' ? 'danger' : 'primary',
          icon: opConfig.icon
        },
        {
          type: 'button',
          text: 'Cancel',
          variant: 'secondary',
          icon: 'x',
          onClick: onCancel
        }
      ]
    };

    // Add recipient field for transfers
    if (operation === 'transfer') {
      formConfig.fields.splice(0, 0, {
        type: 'text',
        name: 'recipientAddress',
        label: 'Recipient Address',
        placeholder: 'Enter wallet address',
        value: recipientAddress,
        required: true,
        gamingType: 'wallet-address',
        icon: 'user',
        helperText: 'Enter the recipient\'s wallet address'
      });
    }

    // Add confirmation for burn operations
    if (operation === 'burn') {
      formConfig.fields.push({
        type: 'text',
        name: 'burnConfirmation',
        label: 'Type "BURN" to confirm',
        placeholder: 'Type BURN',
        required: true,
        gamingType: 'gaming-confirmation',
        icon: 'alert-triangle',
        helperText: 'This action is irreversible!'
      });
    }

    const form = this.mobileFormSystem.createGamingForm(formConfig);
    
    // Add token operation specific features
    this.setupTokenOperationEnhancements(form, operation, userBalance);

    return form;
  }

  /**
   * Create Quick Vote Form (for rapid voting)
   */
  createQuickVoteForm(config) {
    const {
      contentItems = [],
      voteCost = 25,
      userBalance = 1250,
      onVoteSubmit
    } = config;

    const formConfig = {
      id: 'quick-vote-form',
      title: '⚡ Quick Vote',
      subtitle: 'Vote on multiple items quickly',
      gamingTheme: 'xbox360',
      fields: [
        {
          type: 'custom',
          name: 'voteSelection',
          component: this.createVoteSelectionComponent(contentItems, voteCost)
        },
        {
          type: 'number',
          name: 'totalCost',
          label: 'Total Cost',
          value: 0,
          disabled: true,
          gamingType: 'token-amount',
          icon: 'calculator',
          helperText: 'Total MLG tokens to be burned'
        }
      ],
      actions: [
        {
          type: 'submit',
          text: '🔥 Cast All Votes',
          variant: 'primary',
          icon: 'zap'
        }
      ]
    };

    const form = this.mobileFormSystem.createGamingForm(formConfig);
    
    // Setup quick vote logic
    this.setupQuickVoteLogic(form, contentItems, voteCost, userBalance, onVoteSubmit);

    return form;
  }

  /**
   * Add insufficient funds warning
   */
  addInsufficientFundsWarning(form, required, available) {
    const warning = document.createElement('div');
    warning.className = 'insufficient-funds-warning';
    warning.innerHTML = `
      <div class="warning-content">
        <i data-lucide="alert-triangle"></i>
        <div class="warning-text">
          <strong>Insufficient Balance</strong>
          <p>You need ${required} MLG but only have ${available} MLG</p>
        </div>
      </div>
      <button type="button" class="get-tokens-btn">
        <i data-lucide="shopping-cart"></i>
        Get More Tokens
      </button>
    `;

    const header = form.querySelector('.form-header');
    if (header) {
      header.insertAdjacentElement('afterend', warning);
    }
  }

  /**
   * Add vote cost breakdown
   */
  addVoteCostBreakdown(form, voteCost, userBalance) {
    const breakdown = document.createElement('div');
    breakdown.className = 'vote-cost-breakdown';
    breakdown.innerHTML = `
      <div class="breakdown-header">
        <h4>Transaction Summary</h4>
      </div>
      <div class="breakdown-items">
        <div class="breakdown-item">
          <span>Vote Cost:</span>
          <span class="cost-value">${voteCost} MLG</span>
        </div>
        <div class="breakdown-item">
          <span>Current Balance:</span>
          <span class="balance-value">${userBalance} MLG</span>
        </div>
        <div class="breakdown-item total">
          <span>Balance After Vote:</span>
          <span class="remaining-value">${userBalance - voteCost} MLG</span>
        </div>
      </div>
      <div class="breakdown-footer">
        <small>⚠️ Burned tokens cannot be recovered</small>
      </div>
    `;

    const fieldsContainer = form.querySelector('.form-fields-container');
    if (fieldsContainer) {
      fieldsContainer.appendChild(breakdown);
    }
  }

  /**
   * Setup vote confirmation logic
   */
  setupVoteConfirmationLogic(form, onVoteConfirm) {
    const confirmationInput = form.querySelector('input[name="confirmation"]');
    const submitButton = form.querySelector('button[type="submit"]');

    if (confirmationInput && submitButton) {
      // Disable submit until confirmation is entered
      submitButton.disabled = true;
      submitButton.style.opacity = '0.5';

      confirmationInput.addEventListener('input', (e) => {
        const isConfirmed = e.target.value.toUpperCase() === 'CONFIRM';
        submitButton.disabled = !isConfirmed;
        submitButton.style.opacity = isConfirmed ? '1' : '0.5';

        if (isConfirmed) {
          e.target.classList.add('confirmed');
        } else {
          e.target.classList.remove('confirmed');
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      if (data.confirmation?.toUpperCase() !== 'CONFIRM') {
        this.mobileFormSystem.showFormError(form, 'Please type CONFIRM to proceed');
        return;
      }

      if (onVoteConfirm) {
        try {
          await onVoteConfirm(data);
        } catch (error) {
          this.mobileFormSystem.showFormError(form, error.message || 'Vote failed');
        }
      }
    });
  }

  /**
   * Setup clan form enhancements
   */
  setupClanFormEnhancements(form, mode) {
    if (mode === 'create') {
      // Add clan name availability checker
      const nameInput = form.querySelector('input[name="clanName"]');
      if (nameInput) {
        let debounceTimer;
        nameInput.addEventListener('input', () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            this.checkClanNameAvailability(nameInput);
          }, 500);
        });
      }

      // Add staking requirement calculator
      const stakingInput = form.querySelector('input[name="stakingRequirement"]');
      if (stakingInput) {
        stakingInput.addEventListener('input', () => {
          this.updateStakingRequirementInfo(stakingInput);
        });
      }
    }
  }

  /**
   * Setup tournament form enhancements
   */
  setupTournamentFormEnhancements(form, config) {
    const teamSizeSelect = form.querySelector('select[name="teamSize"]');
    const teamMembersTextarea = form.querySelector('textarea[name="teamMembers"]');

    if (teamSizeSelect && teamMembersTextarea) {
      teamSizeSelect.addEventListener('change', (e) => {
        const size = parseInt(e.target.value);
        this.updateTeamMembersPlaceholder(teamMembersTextarea, size);
      });
    }

    // Add entry fee calculator
    this.addEntryFeeCalculator(form, config);
  }

  /**
   * Setup token operation enhancements
   */
  setupTokenOperationEnhancements(form, operation, userBalance) {
    const amountInput = form.querySelector('input[name="amount"]');
    
    if (amountInput) {
      // Add real-time balance validation
      amountInput.addEventListener('input', (e) => {
        const amount = parseFloat(e.target.value) || 0;
        this.validateTokenAmount(amountInput, amount, userBalance);
      });

      // Add preset amount buttons
      this.addPresetAmountButtons(form, userBalance);
    }

    // Add operation-specific warnings
    if (operation === 'burn') {
      this.addBurnWarning(form);
    }
  }

  /**
   * Setup quick vote logic
   */
  setupQuickVoteLogic(form, contentItems, voteCost, userBalance, onVoteSubmit) {
    let selectedVotes = new Set();

    // Setup vote selection handlers
    const voteSelectors = form.querySelectorAll('.vote-selector-item');
    voteSelectors.forEach(selector => {
      const checkbox = selector.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', (e) => {
        const contentId = e.target.value;
        
        if (e.target.checked) {
          selectedVotes.add(contentId);
        } else {
          selectedVotes.delete(contentId);
        }

        this.updateQuickVoteTotalCost(form, selectedVotes.size, voteCost);
        this.validateQuickVoteSelection(form, selectedVotes.size, voteCost, userBalance);
      });
    });
  }

  /**
   * Create vote selection component
   */
  createVoteSelectionComponent(contentItems, voteCost) {
    const component = document.createElement('div');
    component.className = 'vote-selection-component';

    const itemsHTML = contentItems.map(item => `
      <div class="vote-selector-item">
        <input type="checkbox" id="vote-${item.id}" value="${item.id}" class="vote-checkbox">
        <label for="vote-${item.id}" class="vote-label">
          <div class="content-info">
            <div class="content-title">${item.title}</div>
            <div class="content-meta">${item.author} • ${item.votes} votes</div>
          </div>
          <div class="vote-cost">${voteCost} MLG</div>
        </label>
      </div>
    `).join('');

    component.innerHTML = `
      <div class="vote-selection-header">
        <h4>Select Content to Vote On</h4>
        <button type="button" class="select-all-btn">Select All</button>
      </div>
      <div class="vote-selection-list">
        ${itemsHTML}
      </div>
    `;

    return component;
  }

  /**
   * Check clan name availability
   */
  async checkClanNameAvailability(input) {
    const name = input.value.trim();
    if (name.length < 3) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const isAvailable = Math.random() > 0.4; // 60% available

      if (isAvailable) {
        this.mobileFormSystem.showFieldSuccess(input, 'Clan name is available!');
      } else {
        this.mobileFormSystem.showFieldError(input, 'Clan name is already taken');
      }
    } catch (error) {
      this.mobileFormSystem.showFieldError(input, 'Could not check availability');
    }
  }

  /**
   * Update staking requirement info
   */
  updateStakingRequirementInfo(input) {
    const amount = parseFloat(input.value) || 0;
    const wrapper = input.closest('.input-wrapper');
    
    let info = wrapper.querySelector('.staking-info');
    if (!info) {
      info = document.createElement('div');
      info.className = 'staking-info';
      wrapper.appendChild(info);
    }

    info.innerHTML = `
      <div class="staking-details">
        <div class="detail-item">
          <span>Required per member:</span>
          <span>${amount} MLG</span>
        </div>
        <div class="detail-item">
          <span>For 50 members:</span>
          <span>${(amount * 50).toLocaleString()} MLG total</span>
        </div>
      </div>
    `;
  }

  /**
   * Update team members placeholder
   */
  updateTeamMembersPlaceholder(textarea, teamSize) {
    const examples = [
      'Player1_Username',
      'GamerTag_2024',
      'ProPlayer_Elite',
      'Gaming_Master',
      'Competitive_User'
    ];

    const placeholder = examples.slice(0, teamSize).join('\n');
    textarea.placeholder = placeholder;
    
    // Update helper text
    const helperText = textarea.closest('.mobile-form-field').querySelector('.field-helper-text');
    if (helperText) {
      helperText.textContent = `Enter ${teamSize} team member username${teamSize > 1 ? 's' : ''} (one per line)`;
    }
  }

  /**
   * Add entry fee calculator
   */
  addEntryFeeCalculator(form, config) {
    const calculator = document.createElement('div');
    calculator.className = 'entry-fee-calculator';
    calculator.innerHTML = `
      <div class="calculator-header">
        <h4>Tournament Entry Breakdown</h4>
      </div>
      <div class="calculator-items">
        <div class="calc-item">
          <span>Entry Fee per Team:</span>
          <span>${config.entryFee} MLG</span>
        </div>
        <div class="calc-item">
          <span>Prize Pool Contribution:</span>
          <span>${Math.floor(config.entryFee * 0.8)} MLG</span>
        </div>
        <div class="calc-item">
          <span>Platform Fee:</span>
          <span>${Math.floor(config.entryFee * 0.2)} MLG</span>
        </div>
      </div>
    `;

    const fieldsContainer = form.querySelector('.form-fields-container');
    if (fieldsContainer) {
      fieldsContainer.appendChild(calculator);
    }
  }

  /**
   * Validate token amount
   */
  validateTokenAmount(input, amount, userBalance) {
    if (amount > userBalance) {
      this.mobileFormSystem.showFieldError(input, `Insufficient balance. You have ${userBalance} MLG`);
      return false;
    } else if (amount <= 0) {
      this.mobileFormSystem.showFieldError(input, 'Amount must be greater than 0');
      return false;
    } else {
      this.mobileFormSystem.clearFieldValidation(input);
      return true;
    }
  }

  /**
   * Add preset amount buttons
   */
  addPresetAmountButtons(form, userBalance) {
    const amountInput = form.querySelector('input[name="amount"]');
    if (!amountInput) return;

    const wrapper = amountInput.closest('.input-wrapper');
    const presetsContainer = document.createElement('div');
    presetsContainer.className = 'preset-amounts';

    const presets = [
      { label: '25%', value: Math.floor(userBalance * 0.25) },
      { label: '50%', value: Math.floor(userBalance * 0.5) },
      { label: '75%', value: Math.floor(userBalance * 0.75) },
      { label: 'MAX', value: userBalance }
    ];

    presetsContainer.innerHTML = presets.map(preset => `
      <button type="button" class="preset-btn" data-amount="${preset.value}">
        ${preset.label}
      </button>
    `).join('');

    wrapper.appendChild(presetsContainer);

    // Setup preset button handlers
    presetsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('preset-btn')) {
        const amount = e.target.getAttribute('data-amount');
        amountInput.value = amount;
        amountInput.dispatchEvent(new Event('input'));
      }
    });
  }

  /**
   * Add burn warning
   */
  addBurnWarning(form) {
    const warning = document.createElement('div');
    warning.className = 'burn-warning';
    warning.innerHTML = `
      <div class="warning-content">
        <i data-lucide="alert-triangle"></i>
        <div class="warning-text">
          <strong>⚠️ Permanent Action</strong>
          <p>Burned tokens are permanently removed from circulation and cannot be recovered.</p>
        </div>
      </div>
    `;

    const fieldsContainer = form.querySelector('.form-fields-container');
    if (fieldsContainer) {
      fieldsContainer.insertBefore(warning, fieldsContainer.firstChild);
    }
  }

  /**
   * Update quick vote total cost
   */
  updateQuickVoteTotalCost(form, voteCount, voteCost) {
    const totalCostInput = form.querySelector('input[name="totalCost"]');
    if (totalCostInput) {
      const totalCost = voteCount * voteCost;
      totalCostInput.value = totalCost;
    }
  }

  /**
   * Validate quick vote selection
   */
  validateQuickVoteSelection(form, voteCount, voteCost, userBalance) {
    const totalCost = voteCount * voteCost;
    const submitButton = form.querySelector('button[type="submit"]');

    if (totalCost > userBalance) {
      submitButton.disabled = true;
      submitButton.style.opacity = '0.5';
      this.mobileFormSystem.showFormError(form, `Insufficient balance. Need ${totalCost} MLG but have ${userBalance} MLG`);
    } else if (voteCount === 0) {
      submitButton.disabled = true;
      submitButton.style.opacity = '0.5';
    } else {
      submitButton.disabled = false;
      submitButton.style.opacity = '1';
      
      // Update button text with count
      const buttonText = submitButton.querySelector('.button-text');
      if (buttonText) {
        buttonText.textContent = `🔥 Cast ${voteCount} Vote${voteCount > 1 ? 's' : ''} (${totalCost} MLG)`;
      }
    }
  }
}

// Initialize and export
const gamingWorkflowForms = new GamingWorkflowForms();
window.GamingWorkflowForms = gamingWorkflowForms;

export default gamingWorkflowForms;