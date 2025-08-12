/**
 * MLG.clan Modal Component
 * 
 * A flexible modal component with gaming aesthetics and accessibility features
 */

import { createComponent, combineClasses, getAnimationClasses } from './utils.js';

/**
 * Modal component with gaming aesthetics
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Modal content
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {string} props.size - Modal size (sm, md, lg, xl, full)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.closeOnOverlayClick - Whether to close on overlay click
 * @param {boolean} props.showCloseButton - Whether to show close button
 * @param {string} props.title - Modal title
 * @returns {string} Modal HTML
 */
const Modal = createComponent('Modal', (props) => {
  const {
    children,
    isOpen = false,
    onClose,
    size = 'md',
    className = '',
    closeOnOverlayClick = true,
    showCloseButton = true,
    title = '',
    testId,
    ...restProps
  } = props;

  if (!isOpen) return '';

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  const modalClasses = combineClasses(
    'fixed inset-0 z-50 flex items-center justify-center p-4',
    'bg-black bg-opacity-75 backdrop-blur-sm'
  );

  const contentClasses = combineClasses(
    'relative w-full',
    sizeClasses[size],
    'bg-gray-900 border border-green-400/30 rounded-xl shadow-2xl',
    'transform transition-all duration-300',
    isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
    className
  );

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const handleCloseClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  return `
    <div 
      class="${modalClasses}"
      onclick="(${handleOverlayClick.toString()})(event)"
      onkeydown="(${handleKeyDown.toString()})(event)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="${title ? 'modal-title' : ''}"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      <div class="${contentClasses}">
        ${title || showCloseButton ? `
          <div class="flex items-center justify-between p-6 border-b border-gray-700">
            ${title ? `
              <h2 id="modal-title" class="text-xl font-semibold text-white">
                ${title}
              </h2>
            ` : '<div></div>'}
            
            ${showCloseButton ? `
              <button 
                type="button"
                class="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
                onclick="(${handleCloseClick.toString()})()"
                aria-label="Close modal"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ` : ''}
          </div>
        ` : ''}
        
        <div class="p-6">
          ${children}
        </div>
      </div>
    </div>
  `;
});

/**
 * Modal Header component
 */
export const ModalHeader = createComponent('ModalHeader', (props) => {
  const {
    children,
    className = '',
    testId,
    ...restProps
  } = props;

  return `
    <div 
      class="border-b border-gray-700 pb-4 mb-4 ${className}"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      ${children}
    </div>
  `;
});

/**
 * Modal Body component
 */
export const ModalBody = createComponent('ModalBody', (props) => {
  const {
    children,
    className = '',
    testId,
    ...restProps
  } = props;

  return `
    <div 
      class="flex-1 ${className}"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      ${children}
    </div>
  `;
});

/**
 * Modal Footer component
 */
export const ModalFooter = createComponent('ModalFooter', (props) => {
  const {
    children,
    className = '',
    testId,
    ...restProps
  } = props;

  return `
    <div 
      class="border-t border-gray-700 pt-4 mt-4 flex justify-end space-x-3 ${className}"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      ${children}
    </div>
  `;
});

export default Modal;