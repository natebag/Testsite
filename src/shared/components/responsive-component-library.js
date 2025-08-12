/**
 * MLG.clan Responsive Component Library
 * 
 * Comprehensive responsive updates for all UI components
 * Mobile-first design with gaming optimization
 * 
 * Components Updated:
 * - Cards and Tiles
 * - Navigation Elements
 * - Forms and Inputs
 * - Modals and Overlays
 * - Loading States
 * - Data Display Components
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

import { 
  generateGamingClasses, 
  getTouchOptimizedClasses,
  deviceUtils,
  touchUtils,
  responsivePatterns,
  createResponsiveImage
} from './ui/utils.js';

/**
 * Responsive Card Component
 */
export class ResponsiveCard {
  static create(config = {}) {
    const {
      title = '',
      content = '',
      variant = 'default',
      size = 'medium',
      interactive = false,
      image = null,
      actions = [],
      className = ''
    } = config;

    const cardClasses = generateGamingClasses('gamingCard', {
      base: 'bg-tile-bg-primary border border-tile-border rounded-lg overflow-hidden',
      sm: 'rounded-xl',
      md: 'rounded-xl',
      lg: 'rounded-2xl'
    });

    const interactiveClasses = interactive ? 
      getTouchOptimizedClasses('cursor-pointer hover:bg-tile-hover active:scale-98 transition-all duration-200') : '';

    return `
      <div class="${cardClasses} ${interactiveClasses} ${className}">
        ${image ? this.renderCardImage(image) : ''}
        <div class="p-4 sm:p-6">
          ${title ? `<h3 class="text-lg sm:text-xl font-semibold text-white mb-3">${title}</h3>` : ''}
          ${content ? `<div class="text-gray-300 text-sm sm:text-base leading-relaxed">${content}</div>` : ''}
          ${actions.length > 0 ? this.renderCardActions(actions) : ''}
        </div>
      </div>
    `;
  }

  static renderCardImage(image) {
    return `
      <div class="aspect-video w-full overflow-hidden">
        <img src="${image.src}" 
             alt="${image.alt || ''}"
             class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
             loading="lazy">
      </div>
    `;
  }

  static renderCardActions(actions) {
    return `
      <div class="mt-4 pt-4 border-t border-tile-border">
        <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
          ${actions.map(action => `
            <button class="${getTouchOptimizedClasses(touchUtils.touchTarget)} 
                           flex-1 sm:flex-none px-4 py-2 text-sm font-medium
                           ${action.variant === 'primary' ? 
                             'bg-gaming-accent text-black hover:bg-gaming-accent/90' : 
                             'bg-tile-bg-secondary text-gaming-accent border border-gaming-accent hover:bg-gaming-accent hover:text-black'
                           }
                           rounded-lg transition-all duration-200 active:scale-95"
                    data-action="${action.id}">
              ${action.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }
}

/**
 * Responsive Navigation Component
 */
export class ResponsiveNavigation {
  static createMobileNav(config = {}) {
    const {
      items = [],
      currentPath = '',
      className = ''
    } = config;

    return `
      <nav class="fixed bottom-0 left-0 right-0 z-50 bg-gaming-surface border-t border-tile-border ${className}">
        <div class="grid grid-cols-${Math.min(items.length, 5)} gap-0">
          ${items.map(item => this.renderMobileNavItem(item, currentPath)).join('')}
        </div>
      </nav>
    `;
  }

  static renderMobileNavItem(item, currentPath) {
    const isActive = currentPath === item.path;
    const activeClasses = isActive ? 'text-gaming-accent bg-tile-hover' : 'text-gray-400';
    
    return `
      <a href="${item.path}" 
         class="${getTouchOptimizedClasses(touchUtils.touchTargetLarge)}
                flex flex-col items-center justify-center py-2 px-1
                ${activeClasses} hover:text-gaming-accent transition-colors duration-200"
         data-nav-item="${item.id}">
        <div class="w-6 h-6 mb-1 flex items-center justify-center">
          ${item.icon}
        </div>
        <span class="text-xs font-medium truncate max-w-full">${item.label}</span>
        ${isActive ? '<div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gaming-accent rounded-b"></div>' : ''}
      </a>
    `;
  }

  static createDesktopNav(config = {}) {
    const {
      items = [],
      currentPath = '',
      logo = null,
      actions = [],
      className = ''
    } = config;

    return `
      <nav class="hidden md:flex items-center justify-between p-4 lg:p-6 bg-gaming-surface border-b border-tile-border ${className}">
        <div class="flex items-center space-x-8">
          ${logo ? `<div class="flex-shrink-0">${logo}</div>` : ''}
          <div class="flex space-x-6">
            ${items.map(item => this.renderDesktopNavItem(item, currentPath)).join('')}
          </div>
        </div>
        
        ${actions.length > 0 ? `
          <div class="flex items-center space-x-4">
            ${actions.map(action => `
              <button class="${getTouchOptimizedClasses(touchUtils.touchTarget)}
                             px-4 py-2 text-sm font-medium rounded-lg
                             ${action.variant === 'primary' ? 
                               'bg-gaming-accent text-black hover:bg-gaming-accent/90' : 
                               'text-gray-300 hover:text-white'
                             }
                             transition-all duration-200"
                      data-action="${action.id}">
                ${action.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </nav>
    `;
  }

  static renderDesktopNavItem(item, currentPath) {
    const isActive = currentPath === item.path;
    const activeClasses = isActive ? 'text-gaming-accent border-gaming-accent' : 'text-gray-300 border-transparent hover:text-white';
    
    return `
      <a href="${item.path}" 
         class="border-b-2 pb-1 px-1 text-sm font-medium transition-colors duration-200 ${activeClasses}"
         data-nav-item="${item.id}">
        ${item.label}
      </a>
    `;
  }
}

/**
 * Responsive Input Component
 */
export class ResponsiveInput {
  static create(config = {}) {
    const {
      type = 'text',
      placeholder = '',
      label = '',
      value = '',
      disabled = false,
      error = '',
      icon = null,
      size = 'medium',
      fullWidth = true,
      className = ''
    } = config;

    const inputId = `input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const inputClasses = generateGamingClasses('gamingText', {
      base: `${getTouchOptimizedClasses(touchUtils.touchTarget)} 
             w-full px-3 py-2 bg-gaming-surface border border-tile-border rounded-lg
             text-white placeholder-gray-400 
             focus:outline-none focus:ring-2 focus:ring-gaming-accent focus:border-gaming-accent
             disabled:opacity-50 disabled:cursor-not-allowed
             transition-all duration-200`,
      sm: 'px-4 py-3 text-base',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg'
    });

    return `
      <div class="${fullWidth ? 'w-full' : ''} ${className}">
        ${label ? `
          <label for="${inputId}" class="block text-sm font-medium text-gray-300 mb-2">
            ${label}
          </label>
        ` : ''}
        
        <div class="relative">
          ${icon ? `
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div class="text-gray-400 w-5 h-5">
                ${icon}
              </div>
            </div>
          ` : ''}
          
          <input 
            type="${type}"
            id="${inputId}"
            placeholder="${placeholder}"
            value="${value}"
            ${disabled ? 'disabled' : ''}
            class="${inputClasses} ${icon ? 'pl-10' : ''} ${error ? 'border-gaming-red focus:ring-gaming-red focus:border-gaming-red' : ''}"
            data-input-component="true">
        </div>
        
        ${error ? `
          <p class="mt-2 text-sm text-gaming-red">
            ${error}
          </p>
        ` : ''}
      </div>
    `;
  }
}

/**
 * Responsive Modal Component
 */
export class ResponsiveModal {
  static create(config = {}) {
    const {
      title = '',
      content = '',
      size = 'medium',
      closable = true,
      actions = [],
      className = ''
    } = config;

    const sizeClasses = {
      small: 'max-w-md',
      medium: 'max-w-lg',
      large: 'max-w-2xl',
      xlarge: 'max-w-4xl',
      fullscreen: 'max-w-none mx-4 my-4 sm:mx-8 sm:my-8'
    };

    return `
      <div class="fixed inset-0 z-50 overflow-y-auto" data-modal="true">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <!-- Background overlay -->
          <div class="fixed inset-0 transition-opacity" data-modal-backdrop="true">
            <div class="absolute inset-0 bg-black opacity-75 backdrop-blur-sm"></div>
          </div>

          <!-- Modal panel -->
          <div class="${generateGamingClasses('gamingCard', {
              base: 'inline-block w-full transform overflow-hidden rounded-lg bg-gaming-surface text-left align-bottom shadow-xl transition-all sm:align-middle',
              sm: 'rounded-xl'
            })} ${sizeClasses[size] || sizeClasses.medium} ${className}">
            
            ${title || closable ? `
              <div class="flex items-center justify-between p-4 sm:p-6 border-b border-tile-border">
                ${title ? `<h3 class="text-lg sm:text-xl font-semibold text-white">${title}</h3>` : '<div></div>'}
                ${closable ? `
                  <button class="${getTouchOptimizedClasses(touchUtils.touchTarget)}
                                 p-2 -mr-2 text-gray-400 hover:text-white rounded-lg
                                 transition-colors duration-200"
                          data-modal-close="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                ` : ''}
              </div>
            ` : ''}

            <div class="p-4 sm:p-6">
              ${content}
            </div>

            ${actions.length > 0 ? `
              <div class="px-4 py-3 sm:px-6 sm:py-4 bg-gaming-bg border-t border-tile-border">
                <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  ${actions.map(action => `
                    <button class="${getTouchOptimizedClasses(touchUtils.touchTarget)}
                                   px-4 py-2 text-sm font-medium rounded-lg
                                   ${action.variant === 'primary' ? 
                                     'bg-gaming-accent text-black hover:bg-gaming-accent/90' : 
                                     'bg-tile-bg-secondary text-gray-300 border border-tile-border hover:bg-tile-hover'
                                   }
                                   transition-all duration-200 active:scale-95"
                            data-action="${action.id}">
                      ${action.label}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Responsive Loading States
 */
export class ResponsiveLoading {
  static createSkeletonCard() {
    return `
      <div class="${generateGamingClasses('gamingCard')} animate-pulse">
        <div class="aspect-video bg-gray-700 rounded-t-lg"></div>
        <div class="p-4 sm:p-6 space-y-3">
          <div class="h-4 bg-gray-700 rounded w-3/4"></div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-700 rounded"></div>
            <div class="h-3 bg-gray-700 rounded w-5/6"></div>
          </div>
          <div class="flex gap-2 pt-2">
            <div class="h-8 bg-gray-700 rounded w-20"></div>
            <div class="h-8 bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      </div>
    `;
  }

  static createLoadingSpinner(size = 'medium') {
    const sizeClasses = {
      small: 'w-4 h-4',
      medium: 'w-8 h-8',
      large: 'w-12 h-12'
    };

    return `
      <div class="flex items-center justify-center p-8">
        <svg class="animate-spin ${sizeClasses[size]} text-gaming-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    `;
  }

  static createProgressBar(progress = 0, showPercent = true) {
    return `
      <div class="w-full">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium text-gray-300">Loading...</span>
          ${showPercent ? `<span class="text-sm text-gaming-accent">${Math.round(progress)}%</span>` : ''}
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2">
          <div class="bg-gradient-to-r from-gaming-accent to-xbox-green-light h-2 rounded-full transition-all duration-300" 
               style="width: ${Math.min(Math.max(progress, 0), 100)}%"></div>
        </div>
      </div>
    `;
  }
}

/**
 * Responsive Data Display Components
 */
export class ResponsiveDataDisplay {
  static createStatsGrid(stats = []) {
    return `
      <div class="${generateGamingClasses('dashboard')}">
        ${stats.map(stat => `
          <div class="${generateGamingClasses('gamingCard')} text-center">
            <div class="p-4 sm:p-6">
              <div class="text-2xl sm:text-3xl font-bold text-gaming-accent mb-2">
                ${stat.value}
              </div>
              <div class="text-sm sm:text-base text-gray-300">
                ${stat.label}
              </div>
              ${stat.change ? `
                <div class="mt-2 text-xs sm:text-sm ${stat.change > 0 ? 'text-green-400' : 'text-red-400'}">
                  ${stat.change > 0 ? '↗' : '↘'} ${Math.abs(stat.change)}%
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  static createTable(config = {}) {
    const {
      headers = [],
      rows = [],
      responsive = true,
      striped = true,
      className = ''
    } = config;

    if (responsive && deviceUtils.getCurrentBreakpoint() === 'base') {
      return this.createMobileTable(headers, rows, className);
    }

    return `
      <div class="overflow-x-auto ${className}">
        <table class="min-w-full divide-y divide-tile-border">
          <thead class="bg-gaming-surface">
            <tr>
              ${headers.map(header => `
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  ${header}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody class="bg-tile-bg-primary divide-y divide-tile-border">
            ${rows.map((row, index) => `
              <tr class="${striped && index % 2 === 1 ? 'bg-gaming-surface' : ''}">
                ${row.map(cell => `
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${cell}
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  static createMobileTable(headers, rows, className) {
    return `
      <div class="space-y-4 ${className}">
        ${rows.map(row => `
          <div class="${generateGamingClasses('gamingCard')} p-4">
            ${row.map((cell, index) => `
              <div class="flex justify-between py-2 ${index < row.length - 1 ? 'border-b border-tile-border' : ''}">
                <span class="text-sm font-medium text-gray-300">${headers[index]}:</span>
                <span class="text-sm text-white">${cell}</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }
}

/**
 * Component Library Initialization
 */
export function initializeResponsiveComponents() {
  // Add responsive behavior to existing components
  document.addEventListener('DOMContentLoaded', () => {
    // Auto-enhance existing buttons with touch optimization
    const buttons = document.querySelectorAll('button:not([data-touch-optimized])');
    buttons.forEach(button => {
      if (!button.classList.contains(touchUtils.touchTarget.split(' ')[0])) {
        button.classList.add(...touchUtils.touchTarget.split(' '));
        button.style.touchAction = 'manipulation';
        button.setAttribute('data-touch-optimized', 'true');
      }
    });

    // Auto-enhance images with responsive loading
    const images = document.querySelectorAll('img:not([data-responsive-enhanced])');
    images.forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
      img.setAttribute('data-responsive-enhanced', 'true');
    });

    // Setup responsive modal handling
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-modal-backdrop]') || e.target.matches('[data-modal-close]')) {
        const modal = e.target.closest('[data-modal]');
        if (modal) {
          modal.style.display = 'none';
        }
      }
    });
  });

  // Handle orientation changes
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      // Re-calculate responsive layouts
      const responsiveElements = document.querySelectorAll('[data-responsive]');
      responsiveElements.forEach(element => {
        element.dispatchEvent(new CustomEvent('responsive-update'));
      });
    }, 100);
  });
}

// CSS Styles for responsive components
export const responsiveComponentStyles = `
  /* Enhanced touch targets */
  [data-touch-optimized="true"] {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  /* Mobile-first responsive utilities */
  .mobile-only { display: block; }
  .desktop-only { display: none; }

  @media (min-width: 768px) {
    .mobile-only { display: none; }
    .desktop-only { display: block; }
  }

  /* Gaming-specific responsive patterns */
  .gaming-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
  }

  @media (min-width: 640px) {
    .gaming-grid { 
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
  }

  @media (min-width: 1024px) {
    .gaming-grid { 
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }
  }

  @media (min-width: 1280px) {
    .gaming-grid { 
      grid-template-columns: repeat(4, 1fr);
    }
  }

  /* Responsive text scaling */
  .responsive-text {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  @media (min-width: 640px) {
    .responsive-text {
      font-size: 1rem;
      line-height: 1.5rem;
    }
  }

  @media (min-width: 1024px) {
    .responsive-text {
      font-size: 1.125rem;
      line-height: 1.75rem;
    }
  }

  /* Active states for touch devices */
  @media (hover: none) and (pointer: coarse) {
    .hover\\:scale-105:hover {
      transform: none;
    }
    
    .active\\:scale-95:active {
      transform: scale(0.95);
    }
  }
`;

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  initializeResponsiveComponents();
}

export default {
  ResponsiveCard,
  ResponsiveNavigation,
  ResponsiveInput,
  ResponsiveModal,
  ResponsiveLoading,
  ResponsiveDataDisplay,
  initializeResponsiveComponents
};