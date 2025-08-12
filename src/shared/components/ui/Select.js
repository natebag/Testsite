/**
 * MLG.clan Select Component
 * 
 * A flexible select component with gaming aesthetics and validation states
 */

import { createComponent, combineClasses, validateProps } from './utils.js';
import { INPUT_CLASSES, COMPONENT_SIZES } from './constants.js';

/**
 * Select component with gaming aesthetics
 * @param {Object} props - Component props
 * @param {Array} props.options - Array of option objects with value and label
 * @param {string} props.value - Selected value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.size - Select size (sm, md, lg)
 * @param {boolean} props.disabled - Whether select is disabled
 * @param {boolean} props.required - Whether select is required
 * @param {string} props.error - Error message
 * @param {string} props.success - Success message
 * @param {string} props.label - Select label
 * @param {string} props.helperText - Helper text
 * @returns {string} Select HTML
 */
const Select = createComponent('Select', (props) => {
  const {
    options = [],
    value = '',
    onChange,
    placeholder = 'Select an option...',
    size = 'md',
    disabled = false,
    required = false,
    error = '',
    success = '',
    label = '',
    helperText = '',
    className = '',
    testId,
    id,
    name,
    ...restProps
  } = props;

  // Validate props in development
  if (process.env.NODE_ENV === 'development') {
    validateProps(props, {
      options: { type: 'object', required: true },
      size: { type: 'string', oneOf: Object.values(COMPONENT_SIZES) },
      disabled: { type: 'boolean' },
      required: { type: 'boolean' },
      onChange: { type: 'function' }
    }, 'Select');
  }

  const hasError = Boolean(error);
  const hasSuccess = Boolean(success) && !hasError;
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const selectClasses = combineClasses(
    INPUT_CLASSES.base,
    INPUT_CLASSES.sizes[size],
    hasError ? INPUT_CLASSES.states.error : '',
    hasSuccess ? INPUT_CLASSES.states.success : '',
    disabled ? INPUT_CLASSES.states.disabled : '',
    'cursor-pointer',
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
          for="${selectId}" 
          class="block text-sm font-medium text-gray-300 mb-2"
        >
          ${label}
          ${required ? '<span class="text-red-400 ml-1">*</span>' : ''}
        </label>
      ` : ''}
      
      <div class="relative">
        <select
          id="${selectId}"
          class="${selectClasses}"
          ${disabled ? 'disabled' : ''}
          ${required ? 'required' : ''}
          ${name ? `name="${name}"` : ''}
          ${testId ? `data-testid="${testId}"` : ''}
          onchange="(${handleChange.toString()})(event)"
          ${Object.entries(restProps).map(([key, value]) => 
            `${key}="${value}"`
          ).join(' ')}
        >
          ${placeholder ? `
            <option value="" disabled ${!value ? 'selected' : ''}>
              ${placeholder}
            </option>
          ` : ''}
          
          ${options.map(option => {
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionLabel = typeof option === 'object' ? option.label : option;
            const isSelected = String(optionValue) === String(value);
            const isDisabled = typeof option === 'object' && option.disabled;
            
            return `
              <option 
                value="${optionValue}" 
                ${isSelected ? 'selected' : ''}
                ${isDisabled ? 'disabled' : ''}
              >
                ${optionLabel}
              </option>
            `;
          }).join('')}
        </select>
        
        <!-- Dropdown Arrow -->
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        ${hasError ? `
          <div class="absolute inset-y-0 right-8 pr-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          </div>
        ` : ''}
        
        ${hasSuccess ? `
          <div class="absolute inset-y-0 right-8 pr-3 flex items-center pointer-events-none">
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

/**
 * Gaming Select - Specialized select with gaming themes
 */
export const GamingSelect = createComponent('GamingSelect', (props) => {
  const {
    options = [],
    placeholder = 'Choose your game...',
    className = '',
    ...restProps
  } = props;

  return Select({
    options,
    placeholder,
    className: combineClasses('gaming-select', className),
    ...restProps
  });
});

/**
 * Multi-Select component (basic implementation)
 */
export const MultiSelect = createComponent('MultiSelect', (props) => {
  const {
    options = [],
    value = [],
    onChange,
    placeholder = 'Select multiple options...',
    size = 'md',
    disabled = false,
    required = false,
    error = '',
    label = '',
    className = '',
    testId,
    maxSelections = null,
    ...restProps
  } = props;

  const selectedValues = Array.isArray(value) ? value : [];

  const handleOptionToggle = (optionValue) => {
    if (disabled) return;

    let newValues;
    if (selectedValues.includes(optionValue)) {
      newValues = selectedValues.filter(v => v !== optionValue);
    } else {
      if (maxSelections && selectedValues.length >= maxSelections) {
        return; // Don't allow more selections
      }
      newValues = [...selectedValues, optionValue];
    }

    if (onChange) {
      onChange({ target: { value: newValues } });
    }
  };

  return `
    <div class="w-full">
      ${label ? `
        <label class="block text-sm font-medium text-gray-300 mb-2">
          ${label}
          ${required ? '<span class="text-red-400 ml-1">*</span>' : ''}
        </label>
      ` : ''}
      
      <div class="relative">
        <div class="min-h-[44px] bg-gray-800 border border-gray-600 rounded-lg p-3 focus-within:ring-2 focus-within:ring-green-400 focus-within:border-transparent ${className}">
          ${selectedValues.length > 0 ? `
            <div class="flex flex-wrap gap-2 mb-2">
              ${selectedValues.map(val => {
                const option = options.find(opt => 
                  (typeof opt === 'object' ? opt.value : opt) === val
                );
                const label = option ? (typeof option === 'object' ? option.label : option) : val;
                
                return `
                  <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-600 text-white">
                    ${label}
                    <button 
                      type="button"
                      onclick="(${(() => handleOptionToggle(val)).toString()})()"
                      class="ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-green-500 focus:outline-none"
                    >
                      <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="text-gray-400 text-sm">${placeholder}</div>
          `}
        </div>
        
        <!-- Options Dropdown -->
        <div class="mt-2 bg-gray-800 border border-gray-600 rounded-lg max-h-60 overflow-y-auto">
          ${options.map(option => {
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionLabel = typeof option === 'object' ? option.label : option;
            const isSelected = selectedValues.includes(optionValue);
            const isDisabled = typeof option === 'object' && option.disabled;
            
            return `
              <button
                type="button"
                onclick="(${(() => handleOptionToggle(optionValue)).toString()})()"
                class="w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center justify-between ${isSelected ? 'bg-green-600/20 text-green-400' : 'text-white'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
                ${isDisabled ? 'disabled' : ''}
              >
                <span>${optionLabel}</span>
                ${isSelected ? `
                  <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                ` : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>
      
      ${error ? `
        <p class="mt-2 text-sm text-red-400">${error}</p>
      ` : ''}
    </div>
  `;
});

export default Select;