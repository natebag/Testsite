/**
 * MLG.clan Form Component
 * 
 * Comprehensive form components with validation and gaming aesthetics
 */

import { createComponent, combineClasses, validateProps } from './utils.js';

/**
 * Form component with built-in validation
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Form content
 * @param {Function} props.onSubmit - Submit handler
 * @param {Object} props.validation - Validation schema
 * @param {boolean} props.loading - Whether form is submitting
 * @param {string} props.className - Additional CSS classes
 * @returns {string} Form HTML
 */
const Form = createComponent('Form', (props) => {
  const {
    children,
    onSubmit,
    validation = {},
    loading = false,
    className = '',
    testId,
    noValidate = true,
    ...restProps
  } = props;

  const formClasses = combineClasses(
    'space-y-6',
    loading ? 'pointer-events-none opacity-75' : '',
    className
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Basic validation
    const errors = validateFormData(data, validation);
    
    if (Object.keys(errors).length === 0 && onSubmit) {
      onSubmit(data, e);
    } else {
      // Display validation errors
      displayValidationErrors(errors);
    }
  };

  return `
    <form 
      class="${formClasses}"
      ${noValidate ? 'novalidate' : ''}
      onsubmit="(${handleSubmit.toString()})(event)"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      ${children}
    </form>
  `;
});

/**
 * Form Field component with label and validation
 */
export const FormField = createComponent('FormField', (props) => {
  const {
    children,
    label = '',
    required = false,
    error = '',
    success = '',
    helperText = '',
    className = '',
    testId,
    ...restProps
  } = props;

  return `
    <div 
      class="form-field space-y-2 ${className}"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      ${label ? `
        <label class="block text-sm font-medium text-gray-300">
          ${label}
          ${required ? '<span class="text-red-400 ml-1">*</span>' : ''}
        </label>
      ` : ''}
      
      ${children}
      
      ${error ? `
        <p class="text-sm text-red-400 flex items-center mt-1">
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          ${error}
        </p>
      ` : ''}
      
      ${success ? `
        <p class="text-sm text-green-400 flex items-center mt-1">
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          ${success}
        </p>
      ` : ''}
      
      ${helperText && !error && !success ? `
        <p class="text-sm text-gray-400 mt-1">${helperText}</p>
      ` : ''}
    </div>
  `;
});

/**
 * Form Group component for grouping related fields
 */
export const FormGroup = createComponent('FormGroup', (props) => {
  const {
    children,
    title = '',
    description = '',
    className = '',
    testId,
    ...restProps
  } = props;

  return `
    <div 
      class="form-group space-y-4 p-6 bg-gray-900/50 border border-gray-700 rounded-lg ${className}"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      ${title ? `
        <div class="form-group-header border-b border-gray-700 pb-3">
          <h3 class="text-lg font-semibold text-white">${title}</h3>
          ${description ? `
            <p class="text-sm text-gray-400 mt-1">${description}</p>
          ` : ''}
        </div>
      ` : ''}
      
      <div class="form-group-content space-y-4">
        ${children}
      </div>
    </div>
  `;
});

/**
 * Gaming Form - Specialized form with gaming aesthetics
 */
export const GamingForm = createComponent('GamingForm', (props) => {
  const {
    children,
    title = '',
    subtitle = '',
    onSubmit,
    loading = false,
    className = '',
    testId,
    ...restProps
  } = props;

  return `
    <div 
      class="gaming-form bg-gray-900/80 border border-green-400/30 rounded-xl p-8 backdrop-blur-sm ${className}"
      ${testId ? `data-testid="${testId}"` : ''}
    >
      ${title || subtitle ? `
        <div class="form-header text-center mb-8">
          ${title ? `
            <h2 class="text-2xl font-bold text-white mb-2">${title}</h2>
          ` : ''}
          ${subtitle ? `
            <p class="text-gray-400">${subtitle}</p>
          ` : ''}
        </div>
      ` : ''}
      
      ${Form({
        onSubmit,
        loading,
        children,
        testId: testId ? `${testId}-form` : undefined,
        ...restProps
      })}
    </div>
  `;
});

/**
 * Validation utilities
 */
function validateFormData(data, schema) {
  const errors = {};

  Object.entries(schema).forEach(([field, rules]) => {
    const value = data[field];

    if (rules.required && (!value || value.trim() === '')) {
      errors[field] = `${rules.label || field} is required`;
      return;
    }

    if (value && rules.minLength && value.length < rules.minLength) {
      errors[field] = `${rules.label || field} must be at least ${rules.minLength} characters`;
      return;
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
      errors[field] = `${rules.label || field} must be no more than ${rules.maxLength} characters`;
      return;
    }

    if (value && rules.pattern && !rules.pattern.test(value)) {
      errors[field] = rules.message || `${rules.label || field} format is invalid`;
      return;
    }

    if (value && rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[field] = `${rules.label || field} must be a valid email address`;
      return;
    }

    if (rules.custom && typeof rules.custom === 'function') {
      const customError = rules.custom(value, data);
      if (customError) {
        errors[field] = customError;
      }
    }
  });

  return errors;
}

function displayValidationErrors(errors) {
  // Clear existing errors
  document.querySelectorAll('.form-field .text-red-400').forEach(el => {
    el.remove();
  });

  // Display new errors
  Object.entries(errors).forEach(([field, message]) => {
    const fieldElement = document.querySelector(`[name="${field}"]`);
    if (fieldElement) {
      const fieldContainer = fieldElement.closest('.form-field');
      if (fieldContainer) {
        const errorElement = document.createElement('p');
        errorElement.className = 'text-sm text-red-400 flex items-center mt-1';
        errorElement.innerHTML = `
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          ${message}
        `;
        fieldContainer.appendChild(errorElement);
      }
    }
  });
}

export default Form;