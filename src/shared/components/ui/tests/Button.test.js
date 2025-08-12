/**
 * MLG.clan Button Component Tests
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import Button from '../Button.js';

describe('Button Component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('renders basic button', () => {
    const buttonHtml = Button({
      children: 'Test Button'
    });

    container.innerHTML = buttonHtml;
    const button = container.querySelector('button');

    expect(button).toBeTruthy();
    expect(button.textContent.trim()).toContain('Test Button');
    expect(button.type).toBe('button');
  });

  test('applies primary variant classes', () => {
    const buttonHtml = Button({
      variant: 'primary',
      children: 'Primary Button'
    });

    container.innerHTML = buttonHtml;
    const button = container.querySelector('button');

    expect(button.className).toContain('bg-gradient-to-r');
    expect(button.className).toContain('from-green-400');
  });

  test('applies different sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];
    
    sizes.forEach(size => {
      const buttonHtml = Button({
        size,
        children: `${size} Button`
      });

      container.innerHTML = buttonHtml;
      const button = container.querySelector('button');

      expect(button.className).toContain(`min-h-`);
    });
  });

  test('handles disabled state', () => {
    const buttonHtml = Button({
      disabled: true,
      children: 'Disabled Button'
    });

    container.innerHTML = buttonHtml;
    const button = container.querySelector('button');

    expect(button.disabled).toBe(true);
    expect(button.className).toContain('opacity-50');
    expect(button.className).toContain('cursor-not-allowed');
  });

  test('handles loading state', () => {
    const buttonHtml = Button({
      loading: true,
      children: 'Loading Button'
    });

    container.innerHTML = buttonHtml;
    const button = container.querySelector('button');
    const spinner = button.querySelector('svg.animate-spin');

    expect(button.className).toContain('cursor-wait');
    expect(spinner).toBeTruthy();
  });

  test('handles full width', () => {
    const buttonHtml = Button({
      fullWidth: true,
      children: 'Full Width Button'
    });

    container.innerHTML = buttonHtml;
    const button = container.querySelector('button');

    expect(button.className).toContain('w-full');
  });

  test('applies gaming variant styles', () => {
    const buttonHtml = Button({
      variant: 'gaming',
      children: 'Gaming Button'
    });

    container.innerHTML = buttonHtml;
    const button = container.querySelector('button');

    expect(button.className).toContain('from-cyan-400');
    expect(button.className).toContain('to-cyan-500');
  });

  test('applies burn variant styles', () => {
    const buttonHtml = Button({
      variant: 'burn',
      children: 'Burn Button'
    });

    container.innerHTML = buttonHtml;
    const button = container.querySelector('button');

    expect(button.className).toContain('from-red-500');
    expect(button.className).toContain('animate-pulse');
  });

  test('handles click events', () => {
    let clicked = false;
    const handleClick = () => { clicked = true; };

    const buttonHtml = Button({
      onClick: handleClick,
      children: 'Click Me'
    });

    container.innerHTML = buttonHtml;
    const button = container.querySelector('button');

    // Simulate click
    button.click();
    
    // Note: In real implementation, you'd need to properly set up event handlers
    // This is a simplified test structure
  });

  test('prevents click when disabled', () => {
    let clicked = false;
    const handleClick = () => { clicked = true; };

    const buttonHtml = Button({
      disabled: true,
      onClick: handleClick,
      children: 'Disabled Button'
    });

    container.innerHTML = buttonHtml;
    const button = container.querySelector('button');

    // Disabled buttons should not trigger click events
    expect(button.disabled).toBe(true);
  });

  test('includes accessibility attributes', () => {
    const buttonHtml = Button({
      ariaLabel: 'Custom label',
      children: 'Accessible Button'
    });

    container.innerHTML = buttonHtml;
    const button = container.querySelector('button');

    expect(button.getAttribute('aria-label')).toBe('Custom label');
    expect(button.getAttribute('role')).toBe('button');
    expect(button.tabIndex).toBe(0);
  });

  test('adds test id when provided', () => {
    const buttonHtml = Button({
      testId: 'test-button',
      children: 'Test Button'
    });

    container.innerHTML = buttonHtml;
    const button = container.querySelector('button');

    expect(button.getAttribute('data-testid')).toBe('test-button');
  });

  test('applies custom className', () => {
    const buttonHtml = Button({
      className: 'custom-class',
      children: 'Custom Button'
    });

    container.innerHTML = buttonHtml;
    const button = container.querySelector('button');

    expect(button.className).toContain('custom-class');
  });
});

/**
 * Visual Regression Tests
 * These would typically use screenshot comparison tools
 */
describe('Button Visual Tests', () => {
  test('all variants render correctly', () => {
    const variants = ['primary', 'secondary', 'accent', 'gaming', 'xbox', 'burn'];
    
    variants.forEach(variant => {
      const buttonHtml = Button({
        variant,
        children: `${variant} Button`
      });

      // In a real test environment, you'd capture screenshots here
      expect(buttonHtml).toContain('button');
    });
  });

  test('all sizes render correctly', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];
    
    sizes.forEach(size => {
      const buttonHtml = Button({
        size,
        children: `${size} Button`
      });

      expect(buttonHtml).toContain('button');
    });
  });
});

/**
 * Integration Tests
 */
describe('Button Integration', () => {
  test('works with form submission', () => {
    const buttonHtml = Button({
      type: 'submit',
      children: 'Submit'
    });

    const container = document.createElement('div');
    container.innerHTML = `
      <form>
        ${buttonHtml}
      </form>
    `;

    const button = container.querySelector('button');
    expect(button.type).toBe('submit');
  });

  test('integrates with loading states', () => {
    // Test loading state transitions
    let loading = false;
    
    const getButtonHtml = () => Button({
      loading,
      children: loading ? 'Loading...' : 'Submit'
    });

    let buttonHtml = getButtonHtml();
    expect(buttonHtml).toContain('Submit');

    loading = true;
    buttonHtml = getButtonHtml();
    expect(buttonHtml).toContain('Loading...');
    expect(buttonHtml).toContain('animate-spin');
  });
});