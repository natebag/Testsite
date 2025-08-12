/**
 * MLG.clan Grid Component
 * 
 * Responsive grid layout component with gaming aesthetics
 */

import { createComponent, combineClasses, getResponsiveClasses } from './utils.js';

/**
 * Grid component for responsive layouts
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Grid content
 * @param {string|Object} props.cols - Number of columns (1-12) or responsive object
 * @param {string|Object} props.gap - Gap size or responsive object
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.autoFit - Whether to use auto-fit for responsive columns
 * @param {string} props.minItemWidth - Minimum item width for auto-fit
 * @returns {string} Grid HTML
 */
const Grid = createComponent('Grid', (props) => {
  const {
    children,
    cols = 1,
    gap = '4',
    className = '',
    autoFit = false,
    minItemWidth = '300px',
    testId,
    ...restProps
  } = props;

  // Handle responsive columns
  const getColumnClasses = () => {
    if (autoFit) {
      return `grid-cols-[repeat(auto-fit,minmax(${minItemWidth},1fr))]`;
    }

    if (typeof cols === 'object') {
      return getResponsiveClasses(
        Object.fromEntries(
          Object.entries(cols).map(([breakpoint, value]) => [
            breakpoint,
            `grid-cols-${value}`
          ])
        )
      );
    }

    return `grid-cols-${cols}`;
  };

  // Handle responsive gaps
  const getGapClasses = () => {
    if (typeof gap === 'object') {
      return getResponsiveClasses(
        Object.fromEntries(
          Object.entries(gap).map(([breakpoint, value]) => [
            breakpoint,
            `gap-${value}`
          ])
        )
      );
    }

    return `gap-${gap}`;
  };

  const gridClasses = combineClasses(
    'grid',
    getColumnClasses(),
    getGapClasses(),
    className
  );

  return `
    <div 
      class="${gridClasses}"
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
 * Gaming Tile Grid - Specialized grid for gaming tiles
 */
export const GamingTileGrid = createComponent('GamingTileGrid', (props) => {
  const {
    children,
    className = '',
    testId,
    ...restProps
  } = props;

  return Grid({
    cols: {
      base: '1',
      sm: '2', 
      md: '3',
      lg: '4'
    },
    gap: {
      base: '4',
      md: '6'
    },
    className: combineClasses('gaming-tile-grid', className),
    testId,
    ...restProps,
    children
  });
});

/**
 * Leaderboard Grid - Grid optimized for leaderboard layouts
 */
export const LeaderboardGrid = createComponent('LeaderboardGrid', (props) => {
  const {
    children,
    className = '',
    testId,
    ...restProps
  } = props;

  return Grid({
    cols: 1,
    gap: '3',
    className: combineClasses('leaderboard-grid', className),
    testId,
    ...restProps,
    children
  });
});

/**
 * Stats Grid - Grid for displaying statistics
 */
export const StatsGrid = createComponent('StatsGrid', (props) => {
  const {
    children,
    className = '',
    testId,
    ...restProps
  } = props;

  return Grid({
    cols: {
      base: '2',
      md: '4'
    },
    gap: '4',
    className: combineClasses('stats-grid', className),
    testId,
    ...restProps,
    children
  });
});

/**
 * Clan Grid - Grid for clan member layouts
 */
export const ClanGrid = createComponent('ClanGrid', (props) => {
  const {
    children,
    className = '',
    testId,
    ...restProps
  } = props;

  return Grid({
    cols: {
      base: '1',
      sm: '2',
      lg: '3',
      xl: '4'
    },
    gap: '6',
    className: combineClasses('clan-grid', className),
    testId,
    ...restProps,
    children
  });
});

/**
 * Tournament Bracket Grid
 */
export const TournamentGrid = createComponent('TournamentGrid', (props) => {
  const {
    children,
    rounds = 4,
    className = '',
    testId,
    ...restProps
  } = props;

  return `
    <div 
      class="tournament-grid grid gap-8 overflow-x-auto min-w-max ${className}"
      style="grid-template-columns: repeat(${rounds}, minmax(200px, 1fr));"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      ${children}
    </div>
  `;
});

export default Grid;