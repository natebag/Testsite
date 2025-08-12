/**
 * MLG.clan Skeleton Loader Component
 * 
 * Skeleton loading placeholders with gaming aesthetics
 */

import { createComponent, combineClasses, getSkeletonClasses } from './utils.js';

/**
 * Skeleton Loader component
 * @param {Object} props - Component props
 * @param {string} props.variant - Skeleton variant (text, title, button, card, avatar, etc.)
 * @param {string} props.width - Width of skeleton
 * @param {string} props.height - Height of skeleton
 * @param {boolean} props.animated - Whether to animate
 * @param {number} props.lines - Number of lines for text skeletons
 * @returns {string} Skeleton Loader HTML
 */
const SkeletonLoader = createComponent('SkeletonLoader', (props) => {
  const {
    variant = 'default',
    width = '',
    height = '',
    animated = true,
    lines = 1,
    className = '',
    testId,
    ...restProps
  } = props;

  const baseClasses = getSkeletonClasses({ variant, animated });
  
  const skeletonClasses = combineClasses(
    baseClasses,
    width ? `w-${width}` : '',
    height ? `h-${height}` : '',
    className
  );

  const styleProps = {
    ...(width && !width.includes('w-') ? { width } : {}),
    ...(height && !height.includes('h-') ? { height } : {})
  };

  const styleString = Object.entries(styleProps)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');

  // Multi-line text skeleton
  if (variant === 'text' && lines > 1) {
    return `
      <div 
        class="space-y-2 ${className}"
        ${testId ? `data-testid="${testId}"` : ''}
        ${Object.entries(restProps).map(([key, value]) => 
          `${key}="${value}"`
        ).join(' ')}
      >
        ${Array(lines).fill(0).map((_, index) => `
          <div 
            class="${baseClasses} ${index === lines - 1 ? 'w-3/4' : 'w-full'}"
            ${styleString ? `style="${styleString}"` : ''}
          ></div>
        `).join('')}
      </div>
    `;
  }

  return `
    <div 
      class="${skeletonClasses}"
      ${styleString ? `style="${styleString}"` : ''}
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    ></div>
  `;
});

/**
 * Gaming Card Skeleton - Placeholder for gaming tiles
 */
export const GamingCardSkeleton = createComponent('GamingCardSkeleton', (props) => {
  const {
    className = '',
    testId,
    ...restProps
  } = props;

  return `
    <div 
      class="bg-gray-900/80 border border-gray-700 rounded-xl p-6 space-y-4 ${className}"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      <!-- Header -->
      <div class="flex items-center space-x-3">
        ${SkeletonLoader({ variant: 'circle', width: '12', height: '12' })}
        <div class="flex-1 space-y-2">
          ${SkeletonLoader({ variant: 'title', width: '3/4' })}
          ${SkeletonLoader({ variant: 'text', width: '1/2' })}
        </div>
      </div>
      
      <!-- Content -->
      <div class="space-y-2">
        ${SkeletonLoader({ variant: 'text', lines: 3 })}
      </div>
      
      <!-- Footer -->
      <div class="flex justify-between items-center pt-4">
        ${SkeletonLoader({ variant: 'button', width: '20' })}
        ${SkeletonLoader({ variant: 'text', width: '16' })}
      </div>
    </div>
  `;
});

/**
 * Leaderboard Item Skeleton
 */
export const LeaderboardSkeleton = createComponent('LeaderboardSkeleton', (props) => {
  const {
    items = 5,
    className = '',
    testId,
    ...restProps
  } = props;

  return `
    <div 
      class="space-y-3 ${className}"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      ${Array(items).fill(0).map((_, index) => `
        <div class="flex items-center space-x-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <!-- Rank -->
          <div class="flex-shrink-0">
            ${SkeletonLoader({ variant: 'text', width: '8', height: '6' })}
          </div>
          
          <!-- Avatar -->
          ${SkeletonLoader({ variant: 'circle', width: '10', height: '10' })}
          
          <!-- Info -->
          <div class="flex-1 space-y-1">
            ${SkeletonLoader({ variant: 'title', width: '32' })}
            ${SkeletonLoader({ variant: 'text', width: '24' })}
          </div>
          
          <!-- Score -->
          <div class="flex-shrink-0">
            ${SkeletonLoader({ variant: 'text', width: '16', height: '6' })}
          </div>
        </div>
      `).join('')}
    </div>
  `;
});

/**
 * Profile Card Skeleton
 */
export const ProfileSkeleton = createComponent('ProfileSkeleton', (props) => {
  const {
    className = '',
    testId,
    ...restProps
  } = props;

  return `
    <div 
      class="bg-gray-900/80 border border-gray-700 rounded-xl p-6 space-y-6 ${className}"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      <!-- Profile Header -->
      <div class="flex items-center space-x-4">
        ${SkeletonLoader({ variant: 'circle', width: '16', height: '16' })}
        <div class="flex-1 space-y-2">
          ${SkeletonLoader({ variant: 'title', width: '48' })}
          ${SkeletonLoader({ variant: 'text', width: '32' })}
        </div>
        ${SkeletonLoader({ variant: 'button', width: '20' })}
      </div>
      
      <!-- Stats Grid -->
      <div class="grid grid-cols-3 gap-4">
        ${Array(3).fill(0).map(() => `
          <div class="text-center space-y-2">
            ${SkeletonLoader({ variant: 'title', width: '16', height: '8' })}
            ${SkeletonLoader({ variant: 'text', width: '20' })}
          </div>
        `).join('')}
      </div>
      
      <!-- Bio -->
      <div class="space-y-2">
        ${SkeletonLoader({ variant: 'text', lines: 4 })}
      </div>
    </div>
  `;
});

/**
 * Table Row Skeleton
 */
export const TableRowSkeleton = createComponent('TableRowSkeleton', (props) => {
  const {
    columns = 4,
    rows = 5,
    className = '',
    testId,
    ...restProps
  } = props;

  return `
    <div 
      class="space-y-2 ${className}"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      ${Array(rows).fill(0).map(() => `
        <div class="grid grid-cols-${columns} gap-4 p-4 bg-gray-900/30 rounded-lg">
          ${Array(columns).fill(0).map(() => `
            ${SkeletonLoader({ variant: 'text', width: 'full' })}
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
});

/**
 * Gaming Statistics Skeleton
 */
export const StatsSkeleton = createComponent('StatsSkeleton', (props) => {
  const {
    className = '',
    testId,
    ...restProps
  } = props;

  return `
    <div 
      class="grid grid-cols-2 md:grid-cols-4 gap-4 ${className}"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      ${Array(4).fill(0).map(() => `
        <div class="bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-center space-y-2">
          ${SkeletonLoader({ variant: 'title', width: '16', height: '8' })}
          ${SkeletonLoader({ variant: 'text', width: '20' })}
        </div>
      `).join('')}
    </div>
  `;
});

export default SkeletonLoader;