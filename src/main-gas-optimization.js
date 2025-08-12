/**
 * Main Gas Optimization Initialization Script
 * 
 * Entry point for initializing the complete gas optimization system
 * on MLG.clan platform pages. This script should be imported and
 * executed on pages that need Web3 transaction optimization.
 * 
 * @author Claude Code - Solana Web3 Security Architect
 * @version 1.0.0
 */

import { 
  initializeGasOptimization,
  getGasOptimizationIntegration,
  optimizeVoteTransaction,
  optimizeClanOperation
} from './features/web3/gas-optimization-integration.js';

/**
 * Main initialization function for gas optimization system
 */
export async function initializeMLGGasOptimization(options = {}) {
  try {
    console.log('🚀 Initializing MLG.clan Gas Optimization System...');
    
    const {
      enableBatching = true,
      enableUI = true,
      gamingMode = 'CASUAL',
      connection = null,
      enableMonitoring = true,
      autoDetectGamingMode = true
    } = options;
    
    // Detect gaming mode from page context if enabled
    let detectedGamingMode = gamingMode;
    if (autoDetectGamingMode) {
      detectedGamingMode = detectGamingModeFromPage() || gamingMode;
    }
    
    // Initialize the complete gas optimization system
    const initResult = await initializeGasOptimization({
      enableBatching,
      enableUI,
      gamingMode: detectedGamingMode,
      connection,
      enableMonitoring
    });
    
    // Setup page-specific integrations
    await setupPageIntegrations(initResult.integration);
    
    // Add global helpers for easy access
    setupGlobalHelpers(initResult.integration);
    
    // Setup automatic gaming mode detection
    if (autoDetectGamingMode) {
      setupGamingModeAutoDetection(initResult.integration);
    }
    
    console.log('✅ MLG.clan Gas Optimization System ready!');
    console.log(`🎮 Gaming mode: ${detectedGamingMode}`);
    console.log(`📦 Batching: ${enableBatching ? 'enabled' : 'disabled'}`);
    console.log(`🖥️ UI: ${enableUI ? 'enabled' : 'disabled'}`);
    
    return {
      success: true,
      integration: initResult.integration,
      gamingMode: detectedGamingMode,
      features: initResult.features
    };
    
  } catch (error) {
    console.error('❌ Failed to initialize MLG Gas Optimization:', error);
    
    // Create fallback system for graceful degradation
    createFallbackSystem();
    
    throw error;
  }
}

/**
 * Detect gaming mode based on current page context
 */
function detectGamingModeFromPage() {
  const currentPath = window.location.pathname;
  const pageTitle = document.title.toLowerCase();
  
  // Check for specific pages
  if (currentPath.includes('/voting') || pageTitle.includes('voting')) {
    return 'VOTING_SESSION';
  }
  
  if (currentPath.includes('/clans') || pageTitle.includes('clan')) {
    return 'CLAN_OPERATIONS';
  }
  
  if (currentPath.includes('/tournament') || pageTitle.includes('tournament')) {
    return 'COMPETITIVE';
  }
  
  // Check for specific elements that indicate gaming mode
  if (document.querySelector('[data-tournament-mode]')) {
    return 'COMPETITIVE';
  }
  
  if (document.querySelector('[data-clan-operation]')) {
    return 'CLAN_OPERATIONS';
  }
  
  if (document.querySelector('.vote-btn, [data-action="vote"], [data-action="upvote"]')) {
    return 'VOTING_SESSION';
  }
  
  return 'CASUAL';
}

/**
 * Setup page-specific integrations
 */
async function setupPageIntegrations(gasOptimization) {
  try {
    console.log('🔗 Setting up page-specific integrations...');
    
    // Voting page integrations
    if (window.location.pathname.includes('/voting') || document.querySelector('.vote-btn')) {
      await setupVotingPageIntegration(gasOptimization);
    }
    
    // Clan page integrations
    if (window.location.pathname.includes('/clans') || document.querySelector('[data-clan-operation]')) {
      await setupClanPageIntegration(gasOptimization);
    }
    
    // DAO page integrations
    if (window.location.pathname.includes('/dao')) {
      await setupDAOPageIntegration(gasOptimization);
    }
    
    // Profile page integrations
    if (window.location.pathname.includes('/profile')) {
      await setupProfilePageIntegration(gasOptimization);
    }
    
    console.log('✅ Page integrations complete');
    
  } catch (error) {
    console.warn('⚠️ Page integration setup failed:', error);
  }
}

/**
 * Setup voting page specific integrations
 */
async function setupVotingPageIntegration(gasOptimization) {
  console.log('🗳️ Setting up voting page integration');
  
  // Add gas optimization to vote buttons
  const voteButtons = document.querySelectorAll('.vote-btn, [data-action*="vote"]');
  
  voteButtons.forEach(button => {
    const originalClick = button.onclick;
    
    button.onclick = async (event) => {
      event.preventDefault();
      
      try {
        const cost = parseInt(button.getAttribute('data-cost')) || 25;
        const voteType = button.getAttribute('data-action') || 'upvote';
        
        // Show gas optimization UI for expensive votes
        if (cost >= 25) {
          await gasOptimization.optimizeGamingOperation('single_vote_burn', {
            tokenAmount: cost,
            showUI: true,
            userBalance: null // Will be detected automatically
          });
        }
        
        // Execute original click handler
        if (originalClick) {
          originalClick.call(button, event);
        }
        
      } catch (error) {
        console.error('❌ Vote optimization failed:', error);
        // Fall back to original behavior
        if (originalClick) {
          originalClick.call(button, event);
        }
      }
    };
  });
  
  // Add batch status indicator for voting
  const voteSection = document.querySelector('.voting-section, .vote-container');
  if (voteSection) {
    const batchIndicator = createBatchStatusIndicator();
    voteSection.appendChild(batchIndicator);
  }
}

/**
 * Setup clan page specific integrations
 */
async function setupClanPageIntegration(gasOptimization) {
  console.log('🏰 Setting up clan page integration');
  
  // Add gas optimization to clan operation buttons
  const clanButtons = document.querySelectorAll('[data-clan-operation]');
  
  clanButtons.forEach(button => {
    button.addEventListener('click', async (event) => {
      const operation = button.getAttribute('data-clan-operation');
      const cost = parseInt(button.getAttribute('data-cost')) || 50;
      
      if (cost > 10) { // Optimize expensive clan operations
        try {
          await gasOptimization.optimizeGamingOperation(`clan_${operation}`, {
            tokenAmount: cost,
            showUI: true,
            priority: 'HIGH'
          });
        } catch (error) {
          console.warn('⚠️ Clan operation optimization failed:', error);
        }
      }
    });
  });
}

/**
 * Setup DAO page specific integrations
 */
async function setupDAOPageIntegration(gasOptimization) {
  console.log('🏛️ Setting up DAO page integration');
  
  // DAO operations typically have higher stakes, so always show optimization
  const daoButtons = document.querySelectorAll('.dao-action-btn, [data-dao-action]');
  
  daoButtons.forEach(button => {
    button.addEventListener('click', async (event) => {
      try {
        await gasOptimization.optimizeGamingOperation('treasury', {
          showUI: true,
          priority: 'HIGH',
          maxFeeRatio: 0.1 // Allow higher fees for DAO operations
        });
      } catch (error) {
        console.warn('⚠️ DAO operation optimization failed:', error);
      }
    });
  });
}

/**
 * Setup profile page specific integrations
 */
async function setupProfilePageIntegration(gasOptimization) {
  console.log('👤 Setting up profile page integration');
  
  // Profile updates and token operations
  const profileButtons = document.querySelectorAll('.profile-action-btn');
  
  profileButtons.forEach(button => {
    button.addEventListener('click', async (event) => {
      const action = button.getAttribute('data-action');
      
      if (['update_profile', 'claim_rewards', 'stake_tokens'].includes(action)) {
        try {
          await gasOptimization.optimizeGamingOperation('profile_update', {
            showUI: false, // Profile operations are less time-sensitive
            priority: 'NORMAL'
          });
        } catch (error) {
          console.warn('⚠️ Profile operation optimization failed:', error);
        }
      }
    });
  });
}

/**
 * Setup global helper functions
 */
function setupGlobalHelpers(gasOptimization) {
  // Add convenient global functions
  window.optimizeVote = async (voteType, tokenAmount, options = {}) => {
    return await optimizeVoteTransaction(voteType, tokenAmount, options);
  };
  
  window.optimizeClanOp = async (operationType, options = {}) => {
    return await optimizeClanOperation(operationType, options);
  };
  
  window.showGasOptimization = async (operation, options = {}) => {
    return await gasOptimization.optimizeGamingOperation(operation, {
      ...options,
      showUI: true
    });
  };
  
  window.getGasStatus = () => {
    return gasOptimization.getSystemStatus();
  };
  
  console.log('🌐 Global gas optimization helpers ready');
}

/**
 * Setup automatic gaming mode detection
 */
function setupGamingModeAutoDetection(gasOptimization) {
  // Monitor for gaming mode changes based on user actions
  let detectionTimeout = null;
  
  const detectAndUpdate = () => {
    clearTimeout(detectionTimeout);
    detectionTimeout = setTimeout(() => {
      const newMode = detectGamingModeFromPage();
      if (newMode !== gasOptimization.currentGamingMode) {
        console.log(`🎮 Gaming mode auto-detected: ${newMode}`);
        gasOptimization.setGamingMode(newMode).catch(error => {
          console.warn('⚠️ Failed to auto-update gaming mode:', error);
        });
      }
    }, 1000); // 1 second debounce
  };
  
  // Listen for navigation changes
  window.addEventListener('popstate', detectAndUpdate);
  
  // Listen for dynamic content changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        detectAndUpdate();
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('🤖 Automatic gaming mode detection active');
}

/**
 * Create batch status indicator
 */
function createBatchStatusIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'gas-batch-indicator fixed bottom-4 right-4 bg-gaming-surface border border-gaming-accent rounded-lg p-3 z-40 hidden';
  indicator.innerHTML = `
    <div class="flex items-center space-x-2">
      <span class="text-blue-400">📦</span>
      <div>
        <div class="font-semibold text-sm">Batch Queue</div>
        <div class="text-xs text-gray-400" id="batch-status">Ready</div>
      </div>
    </div>
  `;
  
  // Update batch status periodically
  setInterval(() => {
    const gasOptimization = getGasOptimizationIntegration();
    if (gasOptimization && gasOptimization.components.transactionBatcher) {
      const stats = gasOptimization.components.transactionBatcher.getBatchStatistics();
      const hasActiveQueues = Object.values(stats.currentQueues || {}).some(queue => queue.count > 0);
      
      if (hasActiveQueues) {
        indicator.classList.remove('hidden');
        const statusEl = indicator.querySelector('#batch-status');
        if (statusEl) {
          const totalQueued = Object.values(stats.currentQueues).reduce((sum, queue) => sum + queue.count, 0);
          statusEl.textContent = `${totalQueued} transactions queued`;
        }
      } else {
        indicator.classList.add('hidden');
      }
    }
  }, 2000);
  
  return indicator;
}

/**
 * Create fallback system for when gas optimization fails
 */
function createFallbackSystem() {
  window.MLGGasOptimization = {
    optimizeVote: async (voteType, amount, options = {}) => {
      console.warn('⚠️ Gas optimization not available, using fallback');
      return { success: false, error: 'Gas optimization not available' };
    },
    
    optimizeClanOp: async (operation, options = {}) => {
      console.warn('⚠️ Gas optimization not available, using fallback');
      return { success: false, error: 'Gas optimization not available' };
    },
    
    showGasOptimization: async () => {
      console.warn('⚠️ Gas optimization UI not available');
      return null;
    },
    
    getStatus: () => ({
      initialized: false,
      error: 'Gas optimization system failed to initialize'
    })
  };
  
  console.log('🚨 Fallback gas optimization system created');
}

/**
 * Auto-initialize on DOM ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Check if auto-init is enabled
  const autoInit = document.querySelector('meta[name="mlg-gas-auto-init"]');
  if (autoInit && autoInit.content !== 'false') {
    try {
      // Get options from meta tags
      const options = {
        enableBatching: document.querySelector('meta[name="mlg-gas-batching"]')?.content !== 'false',
        enableUI: document.querySelector('meta[name="mlg-gas-ui"]')?.content !== 'false',
        gamingMode: document.querySelector('meta[name="mlg-gaming-mode"]')?.content || 'CASUAL',
        enableMonitoring: document.querySelector('meta[name="mlg-gas-monitoring"]')?.content !== 'false'
      };
      
      await initializeMLGGasOptimization(options);
    } catch (error) {
      console.warn('⚠️ Auto-initialization of gas optimization failed:', error);
    }
  }
});

// Export main functions
export {
  detectGamingModeFromPage,
  setupPageIntegrations,
  setupGlobalHelpers,
  optimizeVoteTransaction,
  optimizeClanOperation
};

export default initializeMLGGasOptimization;