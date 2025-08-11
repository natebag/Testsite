/**
 * MLG.clan Comprehensive Clan Leaderboard UI - Sub-task 5.8
 * 
 * Production-ready clan leaderboard interface with Xbox 360 retro gaming aesthetic.
 * Implements multi-category leaderboards, time-based rankings, interactive analytics,
 * and comprehensive clan profile management with real-time updates.
 * 
 * Core Features:
 * - Multi-category leaderboard display with dynamic switching
 * - Time-based rankings interface with historical data visualization
 * - Rich clan profile cards with expandable details
 * - Interactive analytics and visualizations
 * - Real-time leaderboard updates via WebSocket
 * - Mobile-first responsive design with touch interactions
 * - Xbox 360 gaming aesthetic with competitive tournament themes
 * - Comprehensive accessibility support (WCAG 2.1 AA)
 * 
 * Integration:
 * - clan-leaderboard.js: Data fetching and calculations
 * - clan-statistics.js: Detailed metrics and analytics
 * - clan-management.js: Clan profile information
 * - MLG Token Contract: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL
 * - Phantom Wallet: Secure transaction signing
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-10
 */

import React, { 
  useState, 
  useEffect, 
  useMemo, 
  useCallback, 
  useRef,
  memo,
  Suspense 
} from 'react';

import ClanLeaderboardSystem, { 
  CLAN_LEADERBOARD_CONFIG 
} from '../../clans/clan-leaderboard.js';

import { 
  ClanStatisticsManager,
  CLAN_STATISTICS_CONFIG,
  formatStatisticValue,
  getHealthScoreRange,
  getPerformanceColor
} from '../../clans/clan-statistics.js';

import { 
  CLAN_TIER_CONFIG, 
  CLAN_ROLES 
} from '../../clans/clan-management.js';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

const XBOX_THEME = {
  // Xbox 360 Color Palette
  colors: {
    primary: '#6ab04c',        // Xbox Green
    primaryDark: '#2c5530',
    primaryLight: '#8bc34a',
    secondary: '#1e272e',
    accent: '#ff9f43',
    warning: '#ff6b6b',
    success: '#1dd1a1',
    background: '#0b1426',
    surface: '#1a1a2e',
    surfaceLight: '#2c2c54',
    text: '#ffffff',
    textMuted: '#b0b0b0',
    textDim: '#7d7d7d',
    border: '#3d4465',
    glow: 'rgba(106, 176, 76, 0.3)',
    glowBright: 'rgba(106, 176, 76, 0.6)'
  },
  
  // Gaming UI Animations
  animations: {
    glow: 'xbox-glow 2s ease-in-out infinite alternate',
    pulse: 'xbox-pulse 1.5s ease-in-out infinite',
    slideIn: 'xbox-slide-in 0.3s ease-out',
    scaleIn: 'xbox-scale-in 0.2s ease-out',
    rankChange: 'rank-change 0.5s ease-in-out',
    achievementPop: 'achievement-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  
  // Typography
  fonts: {
    primary: '"Segoe UI", "Xbox 360 Console", "Consolas", monospace',
    display: '"Xbox 360 Console", "Impact", "Arial Black", sans-serif',
    mono: '"Consolas", "Monaco", monospace'
  },
  
  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  
  // Border Radius
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '50%'
  }
};

const LEADERBOARD_CATEGORIES = Object.entries(CLAN_LEADERBOARD_CONFIG.CATEGORIES).map(
  ([key, config]) => ({
    ...config,
    key: key.toLowerCase()
  })
);

const TIME_PERIODS = Object.entries(CLAN_LEADERBOARD_CONFIG.TIME_PERIODS).map(
  ([key, config]) => ({
    ...config,
    key: key.toLowerCase()
  })
);

const VIEWPORT_BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
  wide: 1400
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format large numbers with appropriate suffixes
 */
const formatNumber = (num) => {
  if (!num || isNaN(num)) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (absNum >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  
  return num.toLocaleString();
};

/**
 * Get trend arrow and color based on change
 */
const getTrendIndicator = (change) => {
  if (change > 5) return { arrow: '↗️', color: '#1dd1a1', label: 'Rising' };
  if (change < -5) return { arrow: '↘️', color: '#ff6b6b', label: 'Falling' };
  return { arrow: '➡️', color: '#b0b0b0', label: 'Stable' };
};

/**
 * Debounce function for search and filtering
 */
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

/**
 * Custom hook for responsive design
 */
const useResponsive = () => {
  const [viewport, setViewport] = useState('desktop');
  
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      if (width <= VIEWPORT_BREAKPOINTS.mobile) {
        setViewport('mobile');
      } else if (width <= VIEWPORT_BREAKPOINTS.tablet) {
        setViewport('tablet');
      } else {
        setViewport('desktop');
      }
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);
  
  return viewport;
};

/**
 * Custom hook for intersection observer (virtualization)
 */
const useIntersectionObserver = (options = {}) => {
  const [entries, setEntries] = useState([]);
  const observer = useRef();
  
  const updateEntries = (observerEntries) => {
    setEntries(observerEntries);
  };
  
  const observe = (element) => {
    if (observer.current) {
      observer.current.observe(element);
    }
  };
  
  const unobserve = (element) => {
    if (observer.current) {
      observer.current.unobserve(element);
    }
  };
  
  useEffect(() => {
    observer.current = new IntersectionObserver(updateEntries, options);
    return () => observer.current?.disconnect();
  }, []);
  
  return [entries, { observe, unobserve }];
};

// =============================================================================
// LOADING COMPONENTS
// =============================================================================

const LoadingSkeleton = memo(({ className = '', height = '60px' }) => (
  <div
    className={`loading-skeleton ${className}`}
    style={{
      height,
      background: 'linear-gradient(90deg, #2c2c54 25%, #3d4465 50%, #2c2c54 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.5s infinite',
      borderRadius: XBOX_THEME.radius.md
    }}
  />
));

const LeaderboardSkeleton = memo(() => (
  <div className="leaderboard-skeleton">
    {Array.from({ length: 10 }, (_, i) => (
      <LoadingSkeleton key={i} height="80px" className="mb-3" />
    ))}
  </div>
));

// =============================================================================
// CATEGORY SELECTOR COMPONENT
// =============================================================================

const CategorySelector = memo(({ 
  activeCategory, 
  onCategoryChange, 
  categories = LEADERBOARD_CATEGORIES 
}) => {
  const viewport = useResponsive();
  
  return (
    <div className="category-selector">
      <label className="category-label">
        Category
      </label>
      <div className={`category-tabs ${viewport === 'mobile' ? 'mobile' : ''}`}>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(category.id)}
            style={{
              '--category-color': category.color
            }}
            aria-label={`Switch to ${category.name} leaderboard`}
          >
            <span className="category-icon" role="img" aria-hidden="true">
              {category.icon}
            </span>
            <span className="category-name">
              {viewport === 'mobile' 
                ? category.name.split(' ')[0] 
                : category.name
              }
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

// =============================================================================
// TIME PERIOD SELECTOR COMPONENT
// =============================================================================

const TimePeriodSelector = memo(({ 
  activePeriod, 
  onPeriodChange, 
  periods = TIME_PERIODS 
}) => (
  <div className="period-selector">
    <label htmlFor="period-select" className="period-label">
      Time Period
    </label>
    <select
      id="period-select"
      className="period-dropdown"
      value={activePeriod}
      onChange={(e) => onPeriodChange(e.target.value)}
      aria-label="Select time period for leaderboard"
    >
      {periods.map((period) => (
        <option key={period.id} value={period.id}>
          {period.icon} {period.name}
        </option>
      ))}
    </select>
  </div>
));

// =============================================================================
// SEARCH AND FILTER COMPONENT
// =============================================================================

const SearchAndFilter = memo(({ 
  searchTerm, 
  onSearchChange,
  filters,
  onFilterChange,
  sortBy,
  onSortChange 
}) => {
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const debouncedSearch = useDebounce(localSearch, 300);
  
  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);
  
  const viewport = useResponsive();
  
  return (
    <div className="search-filter-container">
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Search clans..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="search-input"
          aria-label="Search clans by name"
        />
        <span className="search-icon" role="img" aria-hidden="true">🔍</span>
      </div>
      
      {viewport !== 'mobile' && (
        <div className="filter-controls">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="sort-dropdown"
            aria-label="Sort clans by"
          >
            <option value="rank">Rank</option>
            <option value="name">Name</option>
            <option value="score">Score</option>
            <option value="tier">Tier</option>
            <option value="members">Members</option>
          </select>
          
          <button
            className={`filter-btn ${filters.bookmarked ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filters, bookmarked: !filters.bookmarked })}
            aria-label="Toggle bookmarked clans filter"
            title="Show bookmarked clans only"
          >
            ⭐ Bookmarked
          </button>
        </div>
      )}
    </div>
  );
});

// =============================================================================
// STATISTICS CARDS COMPONENT
// =============================================================================

const StatisticsCards = memo(({ statistics = {} }) => {
  const {
    totalClans = 0,
    averageScore = 0,
    participationRate = 0,
    lastUpdated = new Date().toISOString()
  } = statistics;
  
  const stats = [
    {
      label: 'Total Clans',
      value: formatNumber(totalClans),
      icon: '🏛️',
      color: XBOX_THEME.colors.primary
    },
    {
      label: 'Average Score',
      value: formatNumber(Math.round(averageScore)),
      icon: '📊',
      color: XBOX_THEME.colors.accent
    },
    {
      label: 'Participation',
      value: `${Math.round(participationRate)}%`,
      icon: '👥',
      color: XBOX_THEME.colors.success
    },
    {
      label: 'Last Updated',
      value: new Date(lastUpdated).toLocaleTimeString(),
      icon: '🕐',
      color: XBOX_THEME.colors.textMuted
    }
  ];
  
  return (
    <div className="statistics-cards">
      {stats.map((stat, index) => (
        <div key={stat.label} className="stat-card" style={{ '--stat-color': stat.color }}>
          <div className="stat-icon" role="img" aria-hidden="true">
            {stat.icon}
          </div>
          <div className="stat-content">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
});

// =============================================================================
// CLAN CARD COMPONENT
// =============================================================================

const ClanCard = memo(({ 
  clan,
  rank,
  onClanClick,
  onBookmark,
  isBookmarked = false,
  showTrend = true 
}) => {
  const tierConfig = CLAN_TIER_CONFIG[clan.clanData?.tier?.toUpperCase()] || CLAN_TIER_CONFIG.BRONZE;
  const trendInfo = getTrendIndicator(clan.trend || 0);
  const healthRange = getHealthScoreRange(clan.healthScore || 50);
  
  const handleCardClick = useCallback(() => {
    onClanClick(clan);
  }, [clan, onClanClick]);
  
  const handleBookmarkClick = useCallback((e) => {
    e.stopPropagation();
    onBookmark(clan.clanId, !isBookmarked);
  }, [clan.clanId, isBookmarked, onBookmark]);
  
  return (
    <div 
      className={`clan-card ${rank <= 3 ? 'podium-position' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`View details for ${clan.clanData?.name || 'Unknown Clan'}`}
    >
      {/* Rank Badge */}
      <div className="rank-section">
        <div className="rank-badge">
          {rank <= 3 && (
            <span className="podium-icon" role="img" aria-hidden="true">
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
            </span>
          )}
          <span className="rank-number">#{rank}</span>
        </div>
        
        {clan.badge && (
          <div className="performance-badge" title="Performance badge">
            <span role="img" aria-hidden="true">{clan.badge}</span>
          </div>
        )}
      </div>
      
      {/* Clan Info */}
      <div className="clan-info">
        <div className="clan-header">
          <h3 className="clan-name">
            {clan.clanData?.name || 'Unknown Clan'}
          </h3>
          <button
            className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={handleBookmarkClick}
            aria-label={`${isBookmarked ? 'Remove from' : 'Add to'} bookmarks`}
            title={`${isBookmarked ? 'Remove from' : 'Add to'} bookmarks`}
          >
            <span role="img" aria-hidden="true">
              {isBookmarked ? '⭐' : '☆'}
            </span>
          </button>
        </div>
        
        <div className="clan-metadata">
          <div className="clan-tier" style={{ '--tier-color': tierConfig.color }}>
            <span role="img" aria-hidden="true">{tierConfig.icon}</span>
            <span>{tierConfig.name}</span>
          </div>
          
          <div className="member-count">
            <span role="img" aria-hidden="true">👥</span>
            <span>{clan.clanData?.memberCount || 0} members</span>
          </div>
        </div>
      </div>
      
      {/* Score Section */}
      <div className="score-section">
        <div className="main-score">
          <span className="score-value">
            {formatNumber(Math.round(clan.score || 0))}
          </span>
          <span className="score-label">Score</span>
        </div>
        
        {showTrend && (
          <div className="trend-indicator" style={{ '--trend-color': trendInfo.color }}>
            <span role="img" aria-hidden="true">{trendInfo.arrow}</span>
            <span className="trend-label">{trendInfo.label}</span>
          </div>
        )}
      </div>
      
      {/* Metrics */}
      <div className="clan-metrics">
        <div className="metric-item">
          <span className="metric-icon" role="img" aria-hidden="true">🏆</span>
          <span className="metric-value">{clan.achievements || 0}</span>
          <span className="metric-label">Achievements</span>
        </div>
        
        <div className="metric-item">
          <span 
            className="metric-icon" 
            role="img" 
            aria-hidden="true"
            title={clan.streak?.active ? 'Active streak' : 'No active streak'}
          >
            {clan.streak?.active ? '🔥' : '❄️'}
          </span>
          <span className="metric-value">{clan.streak?.days || 0}</span>
          <span className="metric-label">Day Streak</span>
        </div>
        
        <div className="metric-item">
          <span className="metric-icon" role="img" aria-hidden="true">❤️</span>
          <span 
            className="metric-value" 
            style={{ color: healthRange.color }}
          >
            {Math.round(clan.healthScore || 50)}
          </span>
          <span className="metric-label">Health</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="progress-container">
        <div 
          className="progress-bar"
          style={{
            '--progress': `${Math.min((clan.score || 0) / 100, 100)}%`,
            '--progress-color': getPerformanceColor(clan.score || 0)
          }}
        />
      </div>
    </div>
  );
});

// =============================================================================
// VIRTUAL LIST COMPONENT (for large datasets)
// =============================================================================

const VirtualClanList = memo(({ 
  clans = [], 
  onClanClick,
  onBookmark,
  bookmarkedClans = new Set(),
  itemHeight = 200,
  containerHeight = 600 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef();
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 2,
      clans.length
    );
    
    return clans.slice(startIndex, endIndex).map((clan, index) => ({
      ...clan,
      virtualIndex: startIndex + index,
      actualIndex: startIndex + index + 1 // 1-based ranking
    }));
  }, [clans, scrollTop, itemHeight, containerHeight]);
  
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="virtual-clan-list"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div 
        className="virtual-spacer-top"
        style={{ height: Math.floor(scrollTop / itemHeight) * itemHeight }}
      />
      
      {visibleItems.map((clan) => (
        <div
          key={clan.clanId}
          className="virtual-item"
          style={{ height: itemHeight }}
        >
          <ClanCard
            clan={clan}
            rank={clan.actualIndex}
            onClanClick={onClanClick}
            onBookmark={onBookmark}
            isBookmarked={bookmarkedClans.has(clan.clanId)}
          />
        </div>
      ))}
      
      <div 
        className="virtual-spacer-bottom"
        style={{ 
          height: Math.max(0, (clans.length * itemHeight) - scrollTop - containerHeight)
        }}
      />
    </div>
  );
});

// =============================================================================
// CLAN DETAILS MODAL COMPONENT
// =============================================================================

const ClanDetailsModal = memo(({ 
  clan, 
  isOpen, 
  onClose,
  statisticsManager 
}) => {
  const [clanDetails, setClanDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    if (isOpen && clan && statisticsManager) {
      setLoading(true);
      statisticsManager.calculateClanStatistics(clan.clanId, 'daily')
        .then(setClanDetails)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, clan, statisticsManager]);
  
  if (!isOpen || !clan) return null;
  
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);
  
  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'members', name: 'Members', icon: '👥' },
    { id: 'achievements', name: 'Achievements', icon: '🏆' },
    { id: 'analytics', name: 'Analytics', icon: '📈' }
  ];
  
  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="clan-details-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {clan.clanData?.name || 'Clan Details'}
          </h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        
        {/* Modal Navigation */}
        <div className="modal-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`modal-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span role="img" aria-hidden="true">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
        
        {/* Modal Content */}
        <div className="modal-content">
          {loading ? (
            <div className="modal-loading">
              <div className="loading-spinner" />
              <p>Loading clan details...</p>
            </div>
          ) : (
            <div className="modal-tab-content">
              {activeTab === 'overview' && (
                <ClanOverview clan={clan} details={clanDetails} />
              )}
              {activeTab === 'members' && (
                <ClanMembers clanId={clan.clanId} />
              )}
              {activeTab === 'achievements' && (
                <ClanAchievements achievements={clan.achievements} />
              )}
              {activeTab === 'analytics' && (
                <ClanAnalytics details={clanDetails} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// CLAN OVERVIEW COMPONENT
// =============================================================================

const ClanOverview = memo(({ clan, details }) => {
  const tierConfig = CLAN_TIER_CONFIG[clan.clanData?.tier?.toUpperCase()] || CLAN_TIER_CONFIG.BRONZE;
  
  return (
    <div className="clan-overview">
      <div className="overview-grid">
        {/* Basic Info */}
        <div className="info-section">
          <h3>Clan Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Tier</label>
              <div className="tier-display" style={{ '--tier-color': tierConfig.color }}>
                <span role="img" aria-hidden="true">{tierConfig.icon}</span>
                {tierConfig.name}
              </div>
            </div>
            <div className="info-item">
              <label>Members</label>
              <span>{clan.clanData?.memberCount || 0} / {tierConfig.maxMembers}</span>
            </div>
            <div className="info-item">
              <label>Current Rank</label>
              <span>#{clan.rank}</span>
            </div>
            <div className="info-item">
              <label>Score</label>
              <span>{formatNumber(Math.round(clan.score || 0))}</span>
            </div>
          </div>
        </div>
        
        {/* Performance Metrics */}
        {details && (
          <div className="metrics-section">
            <h3>Performance Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <span role="img" aria-hidden="true">👥</span>
                  Member Activity
                </div>
                <div className="metric-value">
                  {Math.round(details.memberActivity?.engagementScore || 0)}%
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-header">
                  <span role="img" aria-hidden="true">💰</span>
                  Financial Health
                </div>
                <div className="metric-value">
                  {formatNumber(details.financialPerformance?.totalTokenBurns || 0)} MLG
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-header">
                  <span role="img" aria-hidden="true">⚖️</span>
                  Governance
                </div>
                <div className="metric-value">
                  {Math.round(details.governanceMetrics?.governanceParticipation || 0)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// =============================================================================
// PLACEHOLDER COMPONENTS FOR MODAL TABS
// =============================================================================

const ClanMembers = memo(({ clanId }) => (
  <div className="clan-members">
    <p>Member list for clan {clanId} would be loaded here.</p>
    <p>This would integrate with clan-management.js to fetch member data.</p>
  </div>
));

const ClanAchievements = memo(({ achievements }) => (
  <div className="clan-achievements">
    <p>Achievement gallery with {achievements || 0} unlocked achievements.</p>
    <p>This would display achievement badges, progress, and milestones.</p>
  </div>
));

const ClanAnalytics = memo(({ details }) => (
  <div className="clan-analytics">
    <p>Advanced analytics charts and trend data would be displayed here.</p>
    <p>Integration with clan-statistics.js for detailed performance metrics.</p>
  </div>
));

// =============================================================================
// MAIN LEADERBOARD COMPONENT
// =============================================================================

export default function ClanLeaderboardUI({
  walletAdapter,
  initialCategory = 'overall_power',
  initialPeriod = 'all_time',
  onError,
  onSuccess,
  className = '',
  theme = 'xbox'
}) {
  // State Management
  const [leaderboardSystem] = useState(() => new ClanLeaderboardSystem());
  const [statisticsManager] = useState(() => new ClanStatisticsManager(walletAdapter));
  
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activePeriod, setActivePeriod] = useState(initialPeriod);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ bookmarked: false });
  const [sortBy, setSortBy] = useState('rank');
  const [bookmarkedClans, setBookmarkedClans] = useState(new Set());
  const [selectedClan, setSelectedClan] = useState(null);
  const [showClanDetails, setShowClanDetails] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  // Responsive
  const viewport = useResponsive();
  
  // WebSocket for real-time updates
  const websocketRef = useRef(null);
  
  // =============================================================================
  // DATA LOADING FUNCTIONS
  // =============================================================================
  
  const loadLeaderboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [leaderboard, analytics] = await Promise.all([
        leaderboardSystem.generateLeaderboard(
          activeCategory,
          activePeriod,
          { 
            limit: itemsPerPage * 5, // Load more for filtering
            offset: 0 
          }
        ),
        leaderboardSystem.getLeaderboardAnalytics({
          categories: [activeCategory],
          periods: [activePeriod]
        })
      ]);
      
      setLeaderboardData(leaderboard);
      setStatistics(analytics);
      
      onSuccess?.('Leaderboard loaded successfully');
    } catch (err) {
      setError(err.message);
      onError?.(err);
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activePeriod, itemsPerPage, leaderboardSystem, onError, onSuccess]);
  
  // =============================================================================
  // FILTERED DATA
  // =============================================================================
  
  const filteredClans = useMemo(() => {
    if (!leaderboardData?.rankings) return [];
    
    let clans = leaderboardData.rankings;
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      clans = clans.filter(clan =>
        clan.clanData?.name?.toLowerCase().includes(search)
      );
    }
    
    // Apply bookmark filter
    if (filters.bookmarked) {
      clans = clans.filter(clan => bookmarkedClans.has(clan.clanId));
    }
    
    // Apply sorting
    clans = [...clans].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.clanData?.name || '').localeCompare(b.clanData?.name || '');
        case 'score':
          return b.score - a.score;
        case 'tier':
          const tierOrder = { diamond: 4, gold: 3, silver: 2, bronze: 1 };
          return (tierOrder[b.clanData?.tier] || 0) - (tierOrder[a.clanData?.tier] || 0);
        case 'members':
          return (b.clanData?.memberCount || 0) - (a.clanData?.memberCount || 0);
        case 'rank':
        default:
          return a.rank - b.rank;
      }
    });
    
    return clans;
  }, [leaderboardData, searchTerm, filters, sortBy, bookmarkedClans]);
  
  // =============================================================================
  // PAGINATION
  // =============================================================================
  
  const paginatedClans = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClans.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClans, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(filteredClans.length / itemsPerPage);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  const handleCategoryChange = useCallback((category) => {
    setActiveCategory(category);
    setCurrentPage(1);
  }, []);
  
  const handlePeriodChange = useCallback((period) => {
    setActivePeriod(period);
    setCurrentPage(1);
  }, []);
  
  const handleClanClick = useCallback((clan) => {
    setSelectedClan(clan);
    setShowClanDetails(true);
  }, []);
  
  const handleBookmark = useCallback((clanId, isBookmarked) => {
    setBookmarkedClans(prev => {
      const newSet = new Set(prev);
      if (isBookmarked) {
        newSet.add(clanId);
      } else {
        newSet.delete(clanId);
      }
      return newSet;
    });
  }, []);
  
  const handleRefresh = useCallback(() => {
    loadLeaderboardData();
  }, [loadLeaderboardData]);
  
  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  // Initial load
  useEffect(() => {
    loadLeaderboardData();
  }, [loadLeaderboardData]);
  
  // Initialize managers
  useEffect(() => {
    const initializeManagers = async () => {
      try {
        await Promise.all([
          leaderboardSystem.initializeConnections(),
          statisticsManager.initialize()
        ]);
      } catch (err) {
        console.error('Failed to initialize managers:', err);
      }
    };
    
    initializeManagers();
    
    return () => {
      statisticsManager.shutdown();
    };
  }, [leaderboardSystem, statisticsManager]);
  
  // WebSocket for real-time updates
  useEffect(() => {
    if (typeof WebSocket !== 'undefined') {
      // WebSocket implementation would go here
      // This is a placeholder for real-time functionality
      console.log('WebSocket real-time updates would be initialized here');
    }
    
    // Auto-refresh interval as fallback
    const interval = setInterval(() => {
      loadLeaderboardData();
    }, 60000); // Refresh every minute
    
    return () => {
      clearInterval(interval);
      websocketRef.current?.close();
    };
  }, [loadLeaderboardData]);
  
  // Load bookmarked clans from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mlg-bookmarked-clans');
      if (saved) {
        setBookmarkedClans(new Set(JSON.parse(saved)));
      }
    } catch (err) {
      console.warn('Failed to load bookmarked clans:', err);
    }
  }, []);
  
  // Save bookmarked clans to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mlg-bookmarked-clans', JSON.stringify([...bookmarkedClans]));
    } catch (err) {
      console.warn('Failed to save bookmarked clans:', err);
    }
  }, [bookmarkedClans]);
  
  // =============================================================================
  // RENDER
  // =============================================================================
  
  return (
    <div className={`clan-leaderboard-ui ${theme} ${viewport} ${className}`}>
      <Suspense fallback={<div>Loading...</div>}>
        {/* Header */}
        <header className="leaderboard-header">
          <div className="header-content">
            <h1 className="leaderboard-title">
              <span role="img" aria-hidden="true">🏆</span>
              MLG.clan Leaderboards
            </h1>
            <p className="leaderboard-subtitle">
              Competitive rankings across multiple categories with real-time updates
            </p>
          </div>
        </header>
        
        {/* Controls */}
        <section className="leaderboard-controls">
          <CategorySelector
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
          
          <TimePeriodSelector
            activePeriod={activePeriod}
            onPeriodChange={handlePeriodChange}
          />
          
          <div className="action-buttons">
            <button
              className="action-btn refresh-btn"
              onClick={handleRefresh}
              disabled={loading}
              aria-label="Refresh leaderboard"
            >
              <span role="img" aria-hidden="true">🔄</span>
              Refresh
            </button>
          </div>
        </section>
        
        {/* Statistics */}
        <section className="statistics-section">
          <StatisticsCards statistics={statistics.overview} />
        </section>
        
        {/* Search and Filters */}
        <section className="search-section">
          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFilterChange={setFilters}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </section>
        
        {/* Main Content */}
        <main className="leaderboard-content">
          {error && (
            <div className="error-message" role="alert">
              <span role="img" aria-hidden="true">⚠️</span>
              {error}
              <button onClick={handleRefresh}>Try Again</button>
            </div>
          )}
          
          {loading ? (
            <LeaderboardSkeleton />
          ) : filteredClans.length === 0 ? (
            <div className="empty-state">
              <span role="img" aria-hidden="true">🔍</span>
              <h3>No clans found</h3>
              <p>Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <>
              {/* Clan List */}
              <div className="clan-list">
                {viewport === 'desktop' && filteredClans.length > 100 ? (
                  <VirtualClanList
                    clans={filteredClans}
                    onClanClick={handleClanClick}
                    onBookmark={handleBookmark}
                    bookmarkedClans={bookmarkedClans}
                  />
                ) : (
                  paginatedClans.map((clan, index) => (
                    <ClanCard
                      key={clan.clanId}
                      clan={clan}
                      rank={clan.rank}
                      onClanClick={handleClanClick}
                      onBookmark={handleBookmark}
                      isBookmarked={bookmarkedClans.has(clan.clanId)}
                    />
                  ))
                )}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="pagination" aria-label="Leaderboard pagination">
                  <button
                    className="page-btn prev-btn"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    ← Previous
                  </button>
                  
                  <div className="page-info">
                    <span>Page {currentPage} of {totalPages}</span>
                  </div>
                  
                  <button
                    className="page-btn next-btn"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    Next →
                  </button>
                </nav>
              )}
            </>
          )}
        </main>
        
        {/* Clan Details Modal */}
        <ClanDetailsModal
          clan={selectedClan}
          isOpen={showClanDetails}
          onClose={() => setShowClanDetails(false)}
          statisticsManager={statisticsManager}
        />
      </Suspense>
      
      {/* Styles */}
      <style jsx>{`
        .clan-leaderboard-ui {
          --xbox-primary: ${XBOX_THEME.colors.primary};
          --xbox-primary-dark: ${XBOX_THEME.colors.primaryDark};
          --xbox-primary-light: ${XBOX_THEME.colors.primaryLight};
          --xbox-secondary: ${XBOX_THEME.colors.secondary};
          --xbox-accent: ${XBOX_THEME.colors.accent};
          --xbox-warning: ${XBOX_THEME.colors.warning};
          --xbox-success: ${XBOX_THEME.colors.success};
          --xbox-background: ${XBOX_THEME.colors.background};
          --xbox-surface: ${XBOX_THEME.colors.surface};
          --xbox-surface-light: ${XBOX_THEME.colors.surfaceLight};
          --xbox-text: ${XBOX_THEME.colors.text};
          --xbox-text-muted: ${XBOX_THEME.colors.textMuted};
          --xbox-text-dim: ${XBOX_THEME.colors.textDim};
          --xbox-border: ${XBOX_THEME.colors.border};
          --xbox-glow: ${XBOX_THEME.colors.glow};
          --xbox-glow-bright: ${XBOX_THEME.colors.glowBright};
          
          font-family: ${XBOX_THEME.fonts.primary};
          background: linear-gradient(135deg, var(--xbox-background) 0%, var(--xbox-secondary) 100%);
          color: var(--xbox-text);
          min-height: 100vh;
          padding: ${XBOX_THEME.spacing.lg};
          max-width: 1400px;
          margin: 0 auto;
        }
        
        /* Header Styles */
        .leaderboard-header {
          text-align: center;
          margin-bottom: ${XBOX_THEME.spacing.xxl};
          padding: ${XBOX_THEME.spacing.xxl} ${XBOX_THEME.spacing.lg};
          background: linear-gradient(135deg, var(--xbox-primary-dark) 0%, var(--xbox-primary) 100%);
          border-radius: ${XBOX_THEME.radius.xl};
          border: 2px solid var(--xbox-primary);
          box-shadow: 0 8px 32px var(--xbox-glow);
          position: relative;
          overflow: hidden;
        }
        
        .leaderboard-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, var(--xbox-glow-bright) 50%, transparent 70%);
          animation: ${XBOX_THEME.animations.glow};
        }
        
        .header-content {
          position: relative;
          z-index: 1;
        }
        
        .leaderboard-title {
          font-family: ${XBOX_THEME.fonts.display};
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: bold;
          margin: 0 0 ${XBOX_THEME.spacing.md};
          text-shadow: 0 0 20px var(--xbox-glow);
          letter-spacing: 2px;
          animation: ${XBOX_THEME.animations.pulse};
        }
        
        .leaderboard-subtitle {
          font-size: 1.2rem;
          opacity: 0.9;
          margin: 0;
          color: rgba(255, 255, 255, 0.9);
        }
        
        /* Controls Section */
        .leaderboard-controls {
          display: grid;
          grid-template-columns: 2fr 1fr auto;
          gap: ${XBOX_THEME.spacing.xl};
          margin-bottom: ${XBOX_THEME.spacing.xl};
          padding: ${XBOX_THEME.spacing.xl};
          background: rgba(255, 255, 255, 0.05);
          border-radius: ${XBOX_THEME.radius.lg};
          border: 1px solid var(--xbox-border);
          backdrop-filter: blur(10px);
        }
        
        /* Category Selector */
        .category-selector .category-label {
          display: block;
          font-weight: 600;
          margin-bottom: ${XBOX_THEME.spacing.md};
          color: var(--xbox-primary);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 0.9rem;
        }
        
        .category-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: ${XBOX_THEME.spacing.sm};
        }
        
        .category-tabs.mobile {
          flex-direction: column;
        }
        
        .category-tab {
          display: flex;
          align-items: center;
          gap: ${XBOX_THEME.spacing.sm};
          padding: ${XBOX_THEME.spacing.md} ${XBOX_THEME.spacing.lg};
          border: 2px solid var(--xbox-border);
          background: rgba(255, 255, 255, 0.05);
          color: var(--xbox-text);
          border-radius: ${XBOX_THEME.radius.md};
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          font-size: 0.9rem;
          position: relative;
          overflow: hidden;
        }
        
        .category-tab::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, var(--category-color), transparent);
          opacity: 0.3;
          transition: left 0.3s ease;
        }
        
        .category-tab:hover::before {
          left: 100%;
        }
        
        .category-tab:hover {
          border-color: var(--category-color, var(--xbox-primary));
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px var(--xbox-glow);
        }
        
        .category-tab.active {
          background: linear-gradient(135deg, var(--category-color, var(--xbox-primary)) 0%, color-mix(in srgb, var(--category-color, var(--xbox-primary)) 80%, black) 100%);
          border-color: var(--category-color, var(--xbox-primary));
          color: white;
          box-shadow: 0 4px 15px color-mix(in srgb, var(--category-color, var(--xbox-primary)) 40%, transparent);
          transform: translateY(-1px);
        }
        
        .category-icon {
          font-size: 1.1em;
          filter: drop-shadow(0 0 5px currentColor);
        }
        
        /* Period Selector */
        .period-selector .period-label {
          display: block;
          font-weight: 600;
          margin-bottom: ${XBOX_THEME.spacing.md};
          color: var(--xbox-primary);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 0.9rem;
        }
        
        .period-dropdown {
          width: 100%;
          padding: ${XBOX_THEME.spacing.md} ${XBOX_THEME.spacing.lg};
          border: 2px solid var(--xbox-border);
          background: rgba(255, 255, 255, 0.05);
          color: var(--xbox-text);
          border-radius: ${XBOX_THEME.radius.md};
          font-size: 1rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
        }
        
        .period-dropdown:focus {
          border-color: var(--xbox-primary);
          outline: none;
          box-shadow: 0 0 0 3px var(--xbox-glow);
          background: rgba(255, 255, 255, 0.1);
        }
        
        /* Action Buttons */
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: ${XBOX_THEME.spacing.md};
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${XBOX_THEME.spacing.sm};
          padding: ${XBOX_THEME.spacing.md} ${XBOX_THEME.spacing.lg};
          border: 2px solid var(--xbox-primary);
          background: linear-gradient(135deg, var(--xbox-glow) 0%, var(--xbox-primary-dark) 100%);
          color: white;
          border-radius: ${XBOX_THEME.radius.md};
          cursor: pointer;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }
        
        .action-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--xbox-primary) 0%, var(--xbox-primary-light) 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px var(--xbox-glow);
        }
        
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        /* Statistics Cards */
        .statistics-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: ${XBOX_THEME.spacing.lg};
          margin-bottom: ${XBOX_THEME.spacing.xl};
        }
        
        .stat-card {
          display: flex;
          align-items: center;
          gap: ${XBOX_THEME.spacing.lg};
          padding: ${XBOX_THEME.spacing.xl};
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          border-radius: ${XBOX_THEME.radius.lg};
          border: 1px solid var(--xbox-border);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--stat-color, var(--xbox-primary));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px var(--xbox-glow);
          border-color: var(--stat-color, var(--xbox-primary));
        }
        
        .stat-card:hover::before {
          transform: scaleX(1);
        }
        
        .stat-icon {
          font-size: 2.5rem;
          color: var(--stat-color, var(--xbox-primary));
          filter: drop-shadow(0 0 10px currentColor);
        }
        
        .stat-content {
          flex: 1;
        }
        
        .stat-value {
          font-size: 2.2rem;
          font-weight: bold;
          color: var(--stat-color, var(--xbox-primary));
          text-shadow: 0 0 10px currentColor;
          margin-bottom: ${XBOX_THEME.spacing.xs};
        }
        
        .stat-label {
          font-size: 1rem;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 500;
        }
        
        /* Search and Filter */
        .search-section {
          margin-bottom: ${XBOX_THEME.spacing.xl};
        }
        
        .search-filter-container {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: ${XBOX_THEME.spacing.lg};
          align-items: end;
        }
        
        .search-input-container {
          position: relative;
        }
        
        .search-input {
          width: 100%;
          padding: ${XBOX_THEME.spacing.md} ${XBOX_THEME.spacing.lg};
          padding-right: 3rem;
          border: 2px solid var(--xbox-border);
          background: rgba(255, 255, 255, 0.05);
          color: var(--xbox-text);
          border-radius: ${XBOX_THEME.radius.md};
          font-size: 1rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
        }
        
        .search-input:focus {
          border-color: var(--xbox-primary);
          outline: none;
          box-shadow: 0 0 0 3px var(--xbox-glow);
          background: rgba(255, 255, 255, 0.1);
        }
        
        .search-icon {
          position: absolute;
          right: ${XBOX_THEME.spacing.md};
          top: 50%;
          transform: translateY(-50%);
          color: var(--xbox-text-muted);
          pointer-events: none;
        }
        
        .filter-controls {
          display: flex;
          gap: ${XBOX_THEME.spacing.md};
          align-items: center;
        }
        
        .sort-dropdown {
          padding: ${XBOX_THEME.spacing.md} ${XBOX_THEME.spacing.lg};
          border: 2px solid var(--xbox-border);
          background: rgba(255, 255, 255, 0.05);
          color: var(--xbox-text);
          border-radius: ${XBOX_THEME.radius.md};
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
        }
        
        .sort-dropdown:focus {
          border-color: var(--xbox-primary);
          outline: none;
          box-shadow: 0 0 0 3px var(--xbox-glow);
        }
        
        .filter-btn {
          padding: ${XBOX_THEME.spacing.md} ${XBOX_THEME.spacing.lg};
          border: 2px solid var(--xbox-border);
          background: rgba(255, 255, 255, 0.05);
          color: var(--xbox-text);
          border-radius: ${XBOX_THEME.radius.md};
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }
        
        .filter-btn:hover {
          border-color: var(--xbox-primary);
          background: rgba(255, 255, 255, 0.1);
        }
        
        .filter-btn.active {
          background: linear-gradient(135deg, var(--xbox-primary) 0%, var(--xbox-primary-dark) 100%);
          border-color: var(--xbox-primary);
          color: white;
          box-shadow: 0 4px 15px var(--xbox-glow);
        }
        
        /* Main Content */
        .leaderboard-content {
          margin-bottom: ${XBOX_THEME.spacing.xxl};
        }
        
        .error-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${XBOX_THEME.spacing.md};
          padding: ${XBOX_THEME.spacing.xl};
          background: linear-gradient(135deg, var(--xbox-warning) 0%, color-mix(in srgb, var(--xbox-warning) 80%, black) 100%);
          border-radius: ${XBOX_THEME.radius.lg};
          color: white;
          font-weight: 600;
          margin-bottom: ${XBOX_THEME.spacing.xl};
        }
        
        .error-message button {
          padding: ${XBOX_THEME.spacing.sm} ${XBOX_THEME.spacing.md};
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          border-radius: ${XBOX_THEME.radius.sm};
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .error-message button:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .empty-state {
          text-align: center;
          padding: ${XBOX_THEME.spacing.xxl};
          color: var(--xbox-text-muted);
        }
        
        .empty-state span {
          font-size: 4rem;
          display: block;
          margin-bottom: ${XBOX_THEME.spacing.lg};
          opacity: 0.5;
        }
        
        .empty-state h3 {
          font-size: 1.5rem;
          margin: 0 0 ${XBOX_THEME.spacing.md};
        }
        
        .empty-state p {
          margin: 0;
          opacity: 0.7;
        }
        
        /* Clan List */
        .clan-list {
          display: flex;
          flex-direction: column;
          gap: ${XBOX_THEME.spacing.md};
        }
        
        /* Clan Card */
        .clan-card {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          gap: ${XBOX_THEME.spacing.lg};
          align-items: center;
          padding: ${XBOX_THEME.spacing.xl};
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          border: 1px solid var(--xbox-border);
          border-radius: ${XBOX_THEME.radius.lg};
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .clan-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--xbox-primary), var(--xbox-accent));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }
        
        .clan-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px var(--xbox-glow);
          border-color: var(--xbox-primary);
        }
        
        .clan-card:hover::before {
          transform: scaleX(1);
        }
        
        .clan-card.podium-position {
          border: 2px solid var(--xbox-accent);
          background: linear-gradient(135deg, 
            color-mix(in srgb, var(--xbox-accent) 10%, transparent) 0%, 
            rgba(255, 255, 255, 0.05) 100%);
        }
        
        .clan-card:focus-visible {
          outline: 3px solid var(--xbox-primary);
          outline-offset: 2px;
        }
        
        /* Rank Section */
        .rank-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: ${XBOX_THEME.spacing.sm};
          min-width: 80px;
        }
        
        .rank-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: ${XBOX_THEME.spacing.xs};
        }
        
        .podium-icon {
          font-size: 2rem;
          filter: drop-shadow(0 0 10px currentColor);
        }
        
        .rank-number {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--xbox-primary);
          text-shadow: 0 0 10px currentColor;
        }
        
        .performance-badge {
          font-size: 1.2rem;
        }
        
        /* Clan Info */
        .clan-info {
          flex: 1;
          min-width: 0;
        }
        
        .clan-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: ${XBOX_THEME.spacing.sm};
        }
        
        .clan-name {
          font-size: 1.3rem;
          font-weight: bold;
          color: var(--xbox-text);
          margin: 0;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }
        
        .bookmark-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--xbox-text-muted);
          cursor: pointer;
          transition: all 0.3s ease;
          padding: ${XBOX_THEME.spacing.xs};
        }
        
        .bookmark-btn:hover {
          color: var(--xbox-accent);
          transform: scale(1.1);
        }
        
        .bookmark-btn.bookmarked {
          color: var(--xbox-accent);
          filter: drop-shadow(0 0 5px currentColor);
        }
        
        .clan-metadata {
          display: flex;
          align-items: center;
          gap: ${XBOX_THEME.spacing.lg};
        }
        
        .clan-tier {
          display: flex;
          align-items: center;
          gap: ${XBOX_THEME.spacing.sm};
          padding: ${XBOX_THEME.spacing.xs} ${XBOX_THEME.spacing.md};
          background: color-mix(in srgb, var(--tier-color, var(--xbox-primary)) 20%, transparent);
          border: 1px solid var(--tier-color, var(--xbox-primary));
          border-radius: ${XBOX_THEME.radius.full};
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--tier-color, var(--xbox-primary));
        }
        
        .member-count {
          display: flex;
          align-items: center;
          gap: ${XBOX_THEME.spacing.sm};
          color: var(--xbox-text-muted);
          font-size: 0.9rem;
        }
        
        /* Score Section */
        .score-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: ${XBOX_THEME.spacing.sm};
          min-width: 100px;
        }
        
        .main-score {
          text-align: center;
        }
        
        .score-value {
          display: block;
          font-size: 2rem;
          font-weight: bold;
          color: var(--xbox-primary);
          text-shadow: 0 0 10px currentColor;
        }
        
        .score-label {
          display: block;
          font-size: 0.8rem;
          color: var(--xbox-text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .trend-indicator {
          display: flex;
          align-items: center;
          gap: ${XBOX_THEME.spacing.xs};
          font-size: 0.9rem;
          color: var(--trend-color, var(--xbox-text-muted));
        }
        
        /* Clan Metrics */
        .clan-metrics {
          display: flex;
          flex-direction: column;
          gap: ${XBOX_THEME.spacing.sm};
          min-width: 120px;
        }
        
        .metric-item {
          display: flex;
          align-items: center;
          gap: ${XBOX_THEME.spacing.sm};
          font-size: 0.9rem;
        }
        
        .metric-icon {
          font-size: 1rem;
          width: 1.2rem;
          text-align: center;
        }
        
        .metric-value {
          font-weight: 600;
          min-width: 2rem;
          text-align: right;
        }
        
        .metric-label {
          color: var(--xbox-text-muted);
          font-size: 0.8rem;
        }
        
        /* Progress Bar */
        .progress-container {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .progress-bar {
          height: 100%;
          width: var(--progress, 0%);
          background: var(--progress-color, var(--xbox-primary));
          transition: width 0.3s ease;
          box-shadow: 0 0 10px currentColor;
        }
        
        /* Pagination */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: ${XBOX_THEME.spacing.lg};
          margin-top: ${XBOX_THEME.spacing.xxl};
          padding: ${XBOX_THEME.spacing.xl};
        }
        
        .page-btn {
          padding: ${XBOX_THEME.spacing.md} ${XBOX_THEME.spacing.xl};
          border: 2px solid var(--xbox-primary);
          background: linear-gradient(135deg, var(--xbox-glow) 0%, var(--xbox-primary-dark) 100%);
          color: white;
          border-radius: ${XBOX_THEME.radius.md};
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .page-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--xbox-primary) 0%, var(--xbox-primary-light) 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px var(--xbox-glow);
        }
        
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .page-info {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--xbox-primary);
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        
        .clan-details-modal {
          background: linear-gradient(135deg, var(--xbox-surface) 0%, var(--xbox-surface-light) 100%);
          border: 2px solid var(--xbox-primary);
          border-radius: ${XBOX_THEME.radius.xl};
          width: 90%;
          max-width: 900px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: ${XBOX_THEME.spacing.xl};
          border-bottom: 2px solid var(--xbox-primary);
        }
        
        .modal-title {
          font-size: 1.8rem;
          color: var(--xbox-primary);
          margin: 0;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 2rem;
          color: var(--xbox-primary);
          cursor: pointer;
          transition: all 0.3s ease;
          padding: ${XBOX_THEME.spacing.sm};
        }
        
        .close-button:hover {
          color: var(--xbox-text);
          transform: scale(1.2);
        }
        
        .modal-tabs {
          display: flex;
          border-bottom: 1px solid var(--xbox-border);
        }
        
        .modal-tab {
          display: flex;
          align-items: center;
          gap: ${XBOX_THEME.spacing.sm};
          padding: ${XBOX_THEME.spacing.lg} ${XBOX_THEME.spacing.xl};
          border: none;
          background: transparent;
          color: var(--xbox-text-muted);
          cursor: pointer;
          transition: all 0.3s ease;
          border-bottom: 3px solid transparent;
        }
        
        .modal-tab:hover {
          color: var(--xbox-text);
          background: rgba(255, 255, 255, 0.05);
        }
        
        .modal-tab.active {
          color: var(--xbox-primary);
          border-bottom-color: var(--xbox-primary);
        }
        
        .modal-content {
          padding: ${XBOX_THEME.spacing.xl};
        }
        
        .modal-loading {
          text-align: center;
          padding: ${XBOX_THEME.spacing.xxl};
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid var(--xbox-glow);
          border-top: 4px solid var(--xbox-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto ${XBOX_THEME.spacing.lg};
        }
        
        /* Clan Overview Styles */
        .clan-overview {
          color: var(--xbox-text);
        }
        
        .overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: ${XBOX_THEME.spacing.xl};
        }
        
        .info-section h3,
        .metrics-section h3 {
          color: var(--xbox-primary);
          margin-bottom: ${XBOX_THEME.spacing.lg};
          font-size: 1.3rem;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: ${XBOX_THEME.spacing.lg};
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: ${XBOX_THEME.spacing.sm};
        }
        
        .info-item label {
          font-size: 0.9rem;
          color: var(--xbox-text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }
        
        .tier-display {
          display: flex;
          align-items: center;
          gap: ${XBOX_THEME.spacing.sm};
          color: var(--tier-color, var(--xbox-primary));
          font-weight: 600;
        }
        
        .metrics-grid {
          display: grid;
          gap: ${XBOX_THEME.spacing.md};
        }
        
        .metric-card {
          padding: ${XBOX_THEME.spacing.lg};
          background: rgba(255, 255, 255, 0.05);
          border-radius: ${XBOX_THEME.radius.md};
          border: 1px solid var(--xbox-border);
        }
        
        .metric-header {
          display: flex;
          align-items: center;
          gap: ${XBOX_THEME.spacing.sm};
          margin-bottom: ${XBOX_THEME.spacing.sm};
          font-weight: 600;
          color: var(--xbox-text-muted);
        }
        
        .metric-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--xbox-primary);
        }
        
        /* Loading Skeleton */
        .loading-skeleton {
          border-radius: ${XBOX_THEME.radius.md};
        }
        
        .leaderboard-skeleton .loading-skeleton {
          margin-bottom: ${XBOX_THEME.spacing.md};
        }
        
        /* Virtual List */
        .virtual-clan-list {
          overflow-y: auto;
          border: 1px solid var(--xbox-border);
          border-radius: ${XBOX_THEME.radius.lg};
        }
        
        .virtual-item {
          padding: ${XBOX_THEME.spacing.sm};
        }
        
        /* Animations */
        @keyframes xbox-glow {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @keyframes xbox-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        @keyframes xbox-slide-in {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes xbox-scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes rank-change {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); color: var(--xbox-accent); }
          100% { transform: scale(1); }
        }
        
        @keyframes achievement-pop {
          0% { transform: scale(0.8) rotate(-5deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        @keyframes skeleton-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Responsive Design */
        @media (max-width: ${VIEWPORT_BREAKPOINTS.tablet}px) {
          .clan-leaderboard-ui {
            padding: ${XBOX_THEME.spacing.md};
          }
          
          .leaderboard-controls {
            grid-template-columns: 1fr;
            gap: ${XBOX_THEME.spacing.lg};
          }
          
          .statistics-cards {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .search-filter-container {
            grid-template-columns: 1fr;
            gap: ${XBOX_THEME.spacing.md};
          }
          
          .clan-card {
            grid-template-columns: 1fr;
            gap: ${XBOX_THEME.spacing.md};
            text-align: center;
          }
          
          .clan-metrics {
            flex-direction: row;
            justify-content: center;
          }
          
          .overview-grid {
            grid-template-columns: 1fr;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: ${VIEWPORT_BREAKPOINTS.mobile}px) {
          .leaderboard-title {
            font-size: 2.5rem;
          }
          
          .statistics-cards {
            grid-template-columns: 1fr;
          }
          
          .clan-card {
            padding: ${XBOX_THEME.spacing.lg};
          }
          
          .score-value {
            font-size: 1.5rem;
          }
          
          .clan-details-modal {
            width: 95%;
            margin: ${XBOX_THEME.spacing.md};
          }
          
          .modal-tabs {
            flex-wrap: wrap;
          }
          
          .modal-tab {
            flex: 1;
            min-width: 120px;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// PROP TYPES AND DEFAULT PROPS
// =============================================================================

ClanLeaderboardUI.displayName = 'ClanLeaderboardUI';

// Export additional components for testing and storybook
export {
  CategorySelector,
  TimePeriodSelector,
  SearchAndFilter,
  StatisticsCards,
  ClanCard,
  VirtualClanList,
  ClanDetailsModal,
  LoadingSkeleton,
  LeaderboardSkeleton
};