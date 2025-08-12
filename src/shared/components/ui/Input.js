/**
 * MLG.clan Input Component
 * 
 * A flexible input component with gaming aesthetics and validation states
 */

import { createComponent, combineClasses, validateProps } from './utils.js';
import { INPUT_CLASSES, COMPONENT_SIZES } from './constants.js';

/**
 * Input component with gaming aesthetics
 * @param {Object} props - Component props
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.size - Input size (sm, md, lg)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {boolean} props.required - Whether input is required
 * @param {string} props.error - Error message
 * @param {string} props.success - Success message
 * @param {string} props.label - Input label
 * @param {string} props.helperText - Helper text
 * @returns {string} Input HTML
 */
const Input = createComponent('Input', (props) => {
  const {
    type = 'text',
    size = 'md',
    className = '',
    placeholder = '',
    value = '',
    onChange,
    disabled = false,
    required = false,
    error = '',
    success = '',
    label = '',
    helperText = '',
    testId,
    id,
    name,
    autoComplete,
    ...restProps
  } = props;

  // Validate props in development
  if (process.env.NODE_ENV === 'development') {
    validateProps(props, {
      type: { type: 'string' },
      size: { type: 'string', oneOf: Object.values(COMPONENT_SIZES) },
      disabled: { type: 'boolean' },
      required: { type: 'boolean' },
      onChange: { type: 'function' }
    }, 'Input');
  }

  const hasError = Boolean(error);
  const hasSuccess = Boolean(success) && !hasError;
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const inputClasses = combineClasses(
    INPUT_CLASSES.base,
    INPUT_CLASSES.sizes[size],
    hasError ? INPUT_CLASSES.states.error : '',
    hasSuccess ? INPUT_CLASSES.states.success : '',
    disabled ? INPUT_CLASSES.states.disabled : '',
    className
  );

  const handleChange = (e) => {
    if (disabled) return;
    if (onChange) {
      onChange(e);
    }
  };

  return `
    <div class="w-full">
      ${label ? `
        <label 
          for="${inputId}" 
          class="block text-sm font-medium text-gray-300 mb-2"
        >
          ${label}
          ${required ? '<span class="text-red-400 ml-1">*</span>' : ''}
        </label>
      ` : ''}
      
      <div class="relative">
        <input
          type="${type}"
          id="${inputId}"
          class="${inputClasses}"
          placeholder="${placeholder}"
          value="${value}"
          ${disabled ? 'disabled' : ''}
          ${required ? 'required' : ''}
          ${name ? `name="${name}"` : ''}
          ${autoComplete ? `autocomplete="${autoComplete}"` : ''}
          ${testId ? `data-testid="${testId}"` : ''}
          oninput="(${handleChange.toString()})(event)"
          ${Object.entries(restProps).map(([key, value]) => 
            `${key}="${value}"`
          ).join(' ')}
        />
        
        ${hasError ? `
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          </div>
        ` : ''}
        
        ${hasSuccess ? `
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
        ` : ''}
      </div>
      
      ${error ? `
        <p class="mt-2 text-sm text-red-400 flex items-center">
          <svg class="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          ${error}
        </p>
      ` : ''}
      
      ${success ? `
        <p class="mt-2 text-sm text-green-400 flex items-center">
          <svg class="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          ${success}
        </p>
      ` : ''}
      
      ${helperText && !error && !success ? `
        <p class="mt-2 text-sm text-gray-400">${helperText}</p>
      ` : ''}
    </div>
  `;
});

export default Input;