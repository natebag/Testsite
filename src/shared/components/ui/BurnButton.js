/**
 * MLG.clan Burn Button Component
 * 
 * Specialized button for token burning with dramatic effects
 */

import { createComponent, combineClasses, getAccessibleButtonProps } from './utils.js';

/**
 * Burn Button component with dramatic fire effects
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {number} props.burnAmount - Amount of tokens to burn
 * @param {string} props.tokenSymbol - Token symbol (e.g., 'MLG')
 * @param {Function} props.onBurn - Burn confirmation handler
 * @param {boolean} props.loading - Whether burn is in progress
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.requireConfirmation - Whether to show confirmation modal
 * @returns {string} Burn Button HTML
 */
const BurnButton = createComponent('BurnButton', (props) => {
  const {
    children = 'Burn Tokens',
    burnAmount = 0,
    tokenSymbol = 'MLG',
    onBurn,
    loading = false,
    disabled = false,
    requireConfirmation = true,
    className = '',
    testId,
    ...restProps
  } = props;

  const buttonClasses = combineClasses(
    'relative overflow-hidden font-bold text-white border-2 border-red-500',
    'bg-gradient-to-r from-red-600 via-orange-600 to-red-600',
    'hover:from-red-500 hover:via-orange-500 hover:to-red-500',
    'transition-all duration-300 transform',
    'focus:outline-none focus:ring-4 focus:ring-red-400/50',
    'px-6 py-3 rounded-lg',
    loading ? 'animate-pulse cursor-wait' : 'hover:scale-105 active:scale-95',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    'shadow-lg shadow-red-500/25 hover:shadow-red-500/50',
    className
  );

  const accessibleProps = getAccessibleButtonProps({
    disabled: disabled || loading,
    loading,
    ariaLabel: `Burn ${burnAmount} ${tokenSymbol} tokens`,
    type: 'button'
  });

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }

    if (requireConfirmation) {
      showBurnConfirmation();
    } else if (onBurn) {
      onBurn({ amount: burnAmount, tokenSymbol });
    }
  };

  const showBurnConfirmation = () => {
    // Create and show confirmation modal
    const modalHtml = `
      <div id="burn-confirmation-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm">
        <div class="relative max-w-md w-full bg-gray-900 border-2 border-red-500 rounded-xl p-6 transform transition-all duration-300 animate-pulse">
          <!-- Fire Animation Background -->
          <div class="absolute inset-0 rounded-xl overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-t from-red-900/20 via-orange-900/10 to-transparent animate-pulse"></div>
          </div>
          
          <div class="relative z-10 text-center space-y-4">
            <!-- Warning Icon -->
            <div class="mx-auto w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            
            <h3 class="text-xl font-bold text-white">Confirm Token Burn</h3>
            <p class="text-gray-300">You are about to burn <span class="text-red-400 font-bold">${burnAmount} ${tokenSymbol}</span> tokens.</p>
            <p class="text-red-400 text-sm font-medium">⚠️ This action cannot be undone!</p>
            
            <div class="flex space-x-3 pt-4">
              <button 
                onclick="closeBurnModal()" 
                class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onclick="confirmBurn()" 
                class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors font-bold"
              >
                🔥 BURN IT
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Add modal functions to global scope
    window.closeBurnModal = () => {
      const modal = document.getElementById('burn-confirmation-modal');
      if (modal) modal.remove();
    };

    window.confirmBurn = () => {
      window.closeBurnModal();
      if (onBurn) {
        onBurn({ amount: burnAmount, tokenSymbol });
      }
    };
  };

  return `
    <button 
      class="${buttonClasses}"
      ${Object.entries(accessibleProps).map(([key, value]) => 
        value !== undefined ? `${key}="${value}"` : ''
      ).filter(Boolean).join(' ')}
      ${testId ? `data-testid="${testId}"` : ''}
      onclick="(${handleClick.toString()})(event)"
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      <!-- Fire Effect Background -->
      <div class="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      
      <!-- Animated Fire Particles -->
      <div class="absolute inset-0 overflow-hidden rounded-lg">
        <div class="absolute -top-1 -left-1 w-2 h-2 bg-orange-400 rounded-full animate-bounce opacity-75" style="animation-delay: 0s;"></div>
        <div class="absolute -top-2 left-1/3 w-1 h-1 bg-red-400 rounded-full animate-bounce opacity-75" style="animation-delay: 0.2s;"></div>
        <div class="absolute -top-1 right-1/4 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce opacity-75" style="animation-delay: 0.4s;"></div>
      </div>
      
      <div class="relative z-10 flex items-center justify-center space-x-2">
        ${loading ? `
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Burning...</span>
        ` : `
          <span class="text-xl">🔥</span>
          <span>${children}</span>
          ${burnAmount > 0 ? `<span class="text-sm opacity-75">(${burnAmount} ${tokenSymbol})</span>` : ''}
        `}
      </div>
      
      <!-- Glow Effect -->
      <div class="absolute inset-0 rounded-lg bg-red-500 opacity-0 hover:opacity-20 transition-opacity duration-300 animate-pulse"></div>
    </button>
  `;
});

/**
 * Quick Burn Buttons - Predefined burn amounts
 */
export const QuickBurnButtons = createComponent('QuickBurnButtons', (props) => {
  const {
    amounts = [10, 50, 100, 500],
    tokenSymbol = 'MLG',
    onBurn,
    className = '',
    testId,
    ...restProps
  } = props;

  return `
    <div 
      class="quick-burn-buttons grid grid-cols-2 md:grid-cols-4 gap-3 ${className}"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      ${amounts.map(amount => BurnButton({
        burnAmount: amount,
        tokenSymbol,
        onBurn,
        children: `${amount} ${tokenSymbol}`,
        className: 'text-sm py-2 px-4',
        testId: testId ? `${testId}-${amount}` : undefined
      })).join('')}
    </div>
  `;
});

export default BurnButton;