/**
 * MLG.clan Card Component
 * 
 * A flexible card component with gaming aesthetics and hover effects
 */

import { createComponent, combineClasses, getHoverClasses } from './utils.js';
import { CARD_CLASSES } from './constants.js';

/**
 * Card component with gaming aesthetics
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.variant - Card variant (default, gaming, xbox, elevated)
 * @param {string} props.size - Card size (sm, md, lg)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hoverable - Whether card has hover effects
 * @param {Function} props.onClick - Click handler for interactive cards
 * @param {string} props.hoverEffect - Type of hover effect
 * @returns {string} Card HTML
 */
const Card = createComponent('Card', (props) => {
  const {
    children,
    variant = 'default',
    size = 'md',
    className = '',
    hoverable = true,
    onClick,
    hoverEffect = 'default',
    testId,
    ...restProps
  } = props;

  const isInteractive = Boolean(onClick);

  const cardClasses = combineClasses(
    CARD_CLASSES.base,
    CARD_CLASSES.sizes[size],
    CARD_CLASSES.variants[variant],
    hoverable ? getHoverClasses(hoverEffect) : '',
    isInteractive ? 'cursor-pointer' : '',
    className
  );

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  const Tag = isInteractive ? 'button' : 'div';
  const interactiveProps = isInteractive ? {
    type: 'button',
    'aria-label': 'Interactive card',
    tabIndex: 0
  } : {};

  return `
    <${Tag} 
      class="${cardClasses}"
      ${Object.entries(interactiveProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
      ${testId ? `data-testid="${testId}"` : ''}
      ${isInteractive ? `onclick="(${handleClick.toString()})(event)"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      ${children}
    </${Tag}>
  `;
});

/**
 * Card Header component
 */
export const CardHeader = createComponent('CardHeader', (props) => {
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
 * Card Body component
 */
export const CardBody = createComponent('CardBody', (props) => {
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
 * Card Footer component
 */
export const CardFooter = createComponent('CardFooter', (props) => {
  const {
    children,
    className = '',
    testId,
    ...restProps
  } = props;

  return `
    <div 
      class="border-t border-gray-700 pt-4 mt-4 ${className}"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      ${children}
    </div>
  `;
});

export default Card;