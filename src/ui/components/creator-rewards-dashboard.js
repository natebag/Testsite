/**
 * Creator Rewards Dashboard UI Component - Sub-task 4.7
 * 
 * React component for displaying creator earnings, analytics, and reward predictions
 * Integrates with the MLG.clan content reward system
 * Features retro Xbox 360 dashboard aesthetic with modern functionality
 * 
 * @author Claude Code - Solana Web3 Security Architect
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { ContentRewardSystem, RewardUIComponents } from '../../content/content-rewards.js';

/**
 * Creator Rewards Dashboard Configuration
 */
const DASHBOARD_CONFIG = {
  // Update intervals
  REFRESH_INTERVAL_MS: 30000, // 30 seconds
  METRICS_UPDATE_INTERVAL_MS: 5000, // 5 seconds for real-time metrics
  
  // Display settings
  MAX_HISTORY_ENTRIES: 50,
  CHART_DATA_POINTS: 30,
  TOP_CONTENT_LIMIT: 10,
  
  // Animation and UI settings
  LOADING_DELAY_MS: 500,
  NOTIFICATION_DURATION_MS: 5000,
  CHART_ANIMATION_DURATION: 300,
  
  // Theme colors (Xbox 360 inspired)
  COLORS: {
    primary: '#107c10', // Xbox Green
    secondary: '#005a9f', // Xbox Blue
    accent: '#ffb900', // Xbox Gold
    success: '#10bc10',
    warning: '#ff8c00',
    error: '#e81123',
    background: '#0e1e0e',
    surface: '#1a2f1a',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    border: '#2d4a2d'
  },
  
  // Tier colors
  TIER_COLORS: {
    standard: '#808080',
    rising_star: '#ffd700',
    established: '#ff8c00',
    clan_leader: '#107c10',
    verified: '#005a9f'
  }
};

/**
 * Earnings Summary Card Component
 */
const EarningsSummaryCard = ({ earnings, tier, trends, isLoading }) => {
  const getTierColor = (tierName) => DASHBOARD_CONFIG.TIER_COLORS[tierName] || DASHBOARD_CONFIG.COLORS.text;
  
  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toLocaleString();
  };
  
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };
  
  if (isLoading) {
    return (
      <div className="earnings-summary-card loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading earnings data...</div>
      </div>
    );
  }
  
  return (
    <div className="earnings-summary-card">
      <div className="earnings-header">
        <h2>Total Earnings</h2>
        <div className="tier-badge" style={{ backgroundColor: getTierColor(tier) }}>
          {tier.replace('_', ' ').toUpperCase()}
        </div>
      </div>
      
      <div className="earnings-amount">
        <span className="amount">{formatCurrency(earnings.total)}</span>
        <span className="currency">MLG</span>
      </div>
      
      <div className="earnings-stats">
        <div className="stat">
          <span className="label">Rank</span>
          <span className="value">#{earnings.rank}</span>
        </div>
        <div className="stat">
          <span className="label">Percentile</span>
          <span className="value">{earnings.percentile}th</span>
        </div>
        <div className="stat">
          <span className="label">Average</span>
          <span className="value">{formatCurrency(earnings.average)}</span>
        </div>
      </div>
      
      <div className="earnings-trend">
        <span className="trend-icon">{getTrendIcon(trends.trend)}</span>
        <span className="trend-text">
          {trends.trend === 'increasing' ? '+' : trends.trend === 'decreasing' ? '-' : ''}
          {Math.abs(trends.change)}% this week
        </span>
      </div>
    </div>
  );
};

/**
 * Reward Predictions Card Component
 */
const RewardPredictionsCard = ({ predictions, isLoading }) => {
  if (isLoading) {
    return (
      <div className="predictions-card loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return DASHBOARD_CONFIG.COLORS.success;
    if (confidence >= 0.6) return DASHBOARD_CONFIG.COLORS.warning;
    return DASHBOARD_CONFIG.COLORS.error;
  };
  
  return (
    <div className="predictions-card">
      <h3>Reward Predictions</h3>
      
      <div className="next-reward">
        <div className="prediction-header">
          <span className="label">Next Reward</span>
          <span className="timeframe">{predictions.nextReward.timeframe}</span>
        </div>
        <div className="prediction-amount">
          <span className="amount">{predictions.nextReward.estimated}</span>
          <span className="currency">MLG</span>
        </div>
        <div className="confidence-bar">
          <div 
            className="confidence-fill" 
            style={{ 
              width: `${predictions.nextReward.confidence * 100}%`,
              backgroundColor: getConfidenceColor(predictions.nextReward.confidence)
            }}
          ></div>
          <span className="confidence-text">
            {Math.round(predictions.nextReward.confidence * 100)}% confident
          </span>
        </div>
      </div>
      
      <div className="period-estimates">
        <div className="estimate">
          <span className="period">Weekly</span>
          <span className="amount">{predictions.weeklyEstimate} MLG</span>
        </div>
        <div className="estimate">
          <span className="period">Monthly</span>
          <span className="amount">{predictions.monthlyEstimate} MLG</span>
        </div>
      </div>
      
      <div className="growth-potential">
        <span className="label">Growth Potential</span>
        <span className={`potential ${predictions.growthPotential}`}>
          {predictions.growthPotential.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

/**
 * Performance Metrics Chart Component
 */
const PerformanceChart = ({ history, isLoading }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    const days = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return history
      .filter(entry => new Date(entry.timestamp) >= cutoffDate)
      .slice(-DASHBOARD_CONFIG.CHART_DATA_POINTS)
      .map(entry => ({
        date: new Date(entry.timestamp).toLocaleDateString(),
        amount: entry.amount,
        type: entry.type
      }));
  }, [history, selectedPeriod]);
  
  const maxAmount = useMemo(() => {
    return Math.max(...chartData.map(d => d.amount), 100);
  }, [chartData]);
  
  if (isLoading) {
    return (
      <div className="performance-chart loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  return (
    <div className="performance-chart">
      <div className="chart-header">
        <h3>Earnings History</h3>
        <div className="period-selector">
          {['week', 'month', 'quarter'].map(period => (
            <button
              key={period}
              className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="chart-container">
        <svg className="chart-svg" viewBox="0 0 400 200">
          {chartData.map((point, index) => {
            const x = (index / (chartData.length - 1)) * 350 + 25;
            const y = 175 - (point.amount / maxAmount) * 150;
            const isPerformanceReward = point.type === 'performance';
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={isPerformanceReward ? DASHBOARD_CONFIG.COLORS.primary : DASHBOARD_CONFIG.COLORS.accent}
                  className="chart-point"
                />
                {index > 0 && (
                  <line
                    x1={(index - 1) / (chartData.length - 1) * 350 + 25}
                    y1={175 - (chartData[index - 1].amount / maxAmount) * 150}
                    x2={x}
                    y2={y}
                    stroke={DASHBOARD_CONFIG.COLORS.primary}
                    strokeWidth="2"
                    className="chart-line"
                  />
                )}
                {/* Tooltip trigger */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="transparent"
                  className="chart-tooltip-trigger"
                  data-tooltip={`${point.date}: ${point.amount} MLG (${point.type})`}
                />
              </g>
            );
          })}
          
          {/* Y-axis labels */}
          <text x="15" y="25" className="axis-label" fill={DASHBOARD_CONFIG.COLORS.textSecondary}>
            {maxAmount}
          </text>
          <text x="15" y="100" className="axis-label" fill={DASHBOARD_CONFIG.COLORS.textSecondary}>
            {Math.round(maxAmount / 2)}
          </text>
          <text x="15" y="180" className="axis-label" fill={DASHBOARD_CONFIG.COLORS.textSecondary}>
            0
          </text>
        </svg>
        
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot performance"></span>
            <span>Performance Rewards</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot achievement"></span>
            <span>Achievements</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Content Performance Metrics Component
 */
const ContentPerformanceMetrics = ({ performance, isLoading }) => {
  if (isLoading) {
    return (
      <div className="content-metrics loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };
  
  const getEngagementColor = (rate) => {
    if (rate >= 0.15) return DASHBOARD_CONFIG.COLORS.success;
    if (rate >= 0.08) return DASHBOARD_CONFIG.COLORS.warning;
    return DASHBOARD_CONFIG.COLORS.error;
  };
  
  return (
    <div className="content-metrics">
      <h3>Content Performance</h3>
      
      <div className="metrics-grid">
        <div className="metric">
          <span className="metric-value">{performance.totalContent}</span>
          <span className="metric-label">Total Content</span>
        </div>
        
        <div className="metric">
          <span className="metric-value">{performance.averageScore.toFixed(1)}</span>
          <span className="metric-label">Avg. Score</span>
        </div>
        
        <div className="metric">
          <span className="metric-value">{performance.topContent}</span>
          <span className="metric-label">Top Performers</span>
        </div>
        
        <div className="metric">
          <span className="metric-value">{formatNumber(performance.totalViews)}</span>
          <span className="metric-label">Total Views</span>
        </div>
        
        <div className="metric">
          <span className="metric-value">{formatNumber(performance.totalEngagement)}</span>
          <span className="metric-label">Total Engagement</span>
        </div>
        
        <div className="metric">
          <span 
            className="metric-value engagement-rate" 
            style={{ color: getEngagementColor(performance.averageEngagementRate) }}
          >
            {(performance.averageEngagementRate * 100).toFixed(1)}%
          </span>
          <span className="metric-label">Engagement Rate</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Achievements and Milestones Component
 */
const AchievementsDisplay = ({ achievements, isLoading }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const filteredAchievements = useMemo(() => {
    if (!achievements) return [];
    if (selectedCategory === 'all') return achievements;
    return achievements.filter(achievement => achievement.type === selectedCategory);
  }, [achievements, selectedCategory]);
  
  const categories = useMemo(() => {
    if (!achievements) return ['all'];
    const cats = [...new Set(achievements.map(a => a.type))];
    return ['all', ...cats];
  }, [achievements]);
  
  if (isLoading) {
    return (
      <div className="achievements-display loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  return (
    <div className="achievements-display">
      <div className="achievements-header">
        <h3>Achievements</h3>
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      <div className="achievements-list">
        {filteredAchievements.length > 0 ? (
          filteredAchievements.map((achievement, index) => (
            <div key={index} className="achievement-item">
              <div className="achievement-icon">🏆</div>
              <div className="achievement-info">
                <div className="achievement-title">{achievement.description}</div>
                <div className="achievement-meta">
                  <span className="achievement-reward">+{achievement.amount} MLG</span>
                  <span className="achievement-date">
                    {new Date(achievement.earnedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-achievements">
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-text">
              No achievements yet. Keep creating great content!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Recommendations Panel Component
 */
const RecommendationsPanel = ({ recommendations, isLoading }) => {
  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'engagement': return '📈';
      case 'quality': return '⭐';
      case 'consistency': return '📅';
      case 'growth': return '🚀';
      case 'improvement': return '💡';
      case 'maintenance': return '✅';
      default: return '💡';
    }
  };
  
  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return DASHBOARD_CONFIG.COLORS.error;
      case 'medium': return DASHBOARD_CONFIG.COLORS.warning;
      case 'low': return DASHBOARD_CONFIG.COLORS.success;
      default: return DASHBOARD_CONFIG.COLORS.text;
    }
  };
  
  if (isLoading) {
    return (
      <div className="recommendations-panel loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  return (
    <div className="recommendations-panel">
      <h3>Recommendations</h3>
      
      <div className="recommendations-list">
        {recommendations && recommendations.length > 0 ? (
          recommendations.map((rec, index) => (
            <div key={index} className="recommendation-item">
              <div className="recommendation-icon">
                {getRecommendationIcon(rec.type)}
              </div>
              <div className="recommendation-content">
                <div className="recommendation-message">{rec.message}</div>
                {rec.impact && (
                  <div 
                    className="recommendation-impact"
                    style={{ color: getImpactColor(rec.impact) }}
                  >
                    {rec.impact.toUpperCase()} IMPACT
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-recommendations">
            <div className="empty-state-icon">✨</div>
            <div className="empty-state-text">
              You're doing great! Keep up the excellent work.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Reward Pool Status Component
 */
const RewardPoolStatus = ({ poolHealth, isLoading }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return DASHBOARD_CONFIG.COLORS.success;
      case 'warning': return DASHBOARD_CONFIG.COLORS.warning;
      case 'critical': return DASHBOARD_CONFIG.COLORS.error;
      default: return DASHBOARD_CONFIG.COLORS.text;
    }
  };
  
  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toLocaleString();
  };
  
  if (isLoading) {
    return (
      <div className="pool-status loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  return (
    <div className="pool-status">
      <div className="pool-header">
        <h3>Community Reward Pool</h3>
        <div 
          className="status-indicator"
          style={{ backgroundColor: getStatusColor(poolHealth.runway.status) }}
        >
          {poolHealth.runway.status.toUpperCase()}
        </div>
      </div>
      
      <div className="pool-metrics">
        <div className="pool-metric">
          <span className="metric-label">Treasury Balance</span>
          <span className="metric-value">{formatCurrency(poolHealth.treasuryBalance)} MLG</span>
        </div>
        
        <div className="pool-metric">
          <span className="metric-label">Daily Burn Rate</span>
          <span className="metric-value">{formatCurrency(poolHealth.runway.dailyBurnRate)} MLG</span>
        </div>
        
        <div className="pool-metric">
          <span className="metric-label">Estimated Runway</span>
          <span className="metric-value">{poolHealth.runway.estimatedDays} days</span>
        </div>
        
        <div className="pool-metric">
          <span className="metric-label">Overall Utilization</span>
          <span className="metric-value">{poolHealth.utilization.overall.toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="utilization-bars">
        {Object.entries(poolHealth.utilization).filter(([key]) => key !== 'overall').map(([period, utilization]) => (
          <div key={period} className="utilization-bar">
            <div className="bar-label">{period.charAt(0).toUpperCase() + period.slice(1)}</div>
            <div className="bar-container">
              <div 
                className="bar-fill"
                style={{ 
                  width: `${Math.min(utilization, 100)}%`,
                  backgroundColor: utilization > 80 ? DASHBOARD_CONFIG.COLORS.warning : DASHBOARD_CONFIG.COLORS.success
                }}
              ></div>
              <span className="bar-percentage">{utilization.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Main Creator Rewards Dashboard Component
 */
const CreatorRewardsDashboard = ({ 
  creatorId, 
  walletAddress,
  onError,
  onRewardClaim,
  className = '',
  refreshInterval = DASHBOARD_CONFIG.REFRESH_INTERVAL_MS
}) => {
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [poolHealth, setPoolHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // System instances
  const [rewardSystem] = useState(() => new ContentRewardSystem());
  const [uiComponents] = useState(() => new RewardUIComponents(rewardSystem));
  
  // Data fetching function
  const fetchDashboardData = useCallback(async () => {
    if (!creatorId) {
      setError('Creator ID is required');
      setIsLoading(false);
      return;
    }
    
    try {
      setError(null);
      
      // Validate wallet address if provided
      if (walletAddress) {
        try {
          new PublicKey(walletAddress);
        } catch (err) {
          throw new Error('Invalid Solana wallet address');
        }
      }
      
      // Fetch dashboard data
      const [dashboard, poolHealthData] = await Promise.all([
        rewardSystem.getCreatorDashboard(creatorId),
        rewardSystem.getRewardPoolHealth()
      ]);
      
      setDashboardData(dashboard);
      setPoolHealth(poolHealthData);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
      
      if (onError) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [creatorId, walletAddress, rewardSystem, onError]);
  
  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  // Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0) return;
    
    const intervalId = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [fetchDashboardData, refreshInterval]);
  
  // Error handling
  if (error) {
    return (
      <div className={`creator-rewards-dashboard error ${className}`}>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-message">
            <h3>Unable to Load Dashboard</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchDashboardData}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`creator-rewards-dashboard ${className}`}>
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Creator Rewards Dashboard</h1>
          <div className="header-meta">
            <span className="creator-id">Creator: {creatorId}</span>
            {lastUpdated && (
              <span className="last-updated">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={fetchDashboardData}
            disabled={isLoading}
          >
            {isLoading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>
      
      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Earnings Summary */}
        <div className="grid-item earnings-summary">
          <EarningsSummaryCard
            earnings={dashboardData?.earnings}
            tier={dashboardData?.tier}
            trends={dashboardData?.trends}
            isLoading={isLoading}
          />
        </div>
        
        {/* Reward Predictions */}
        <div className="grid-item predictions">
          <RewardPredictionsCard
            predictions={dashboardData?.predictions}
            isLoading={isLoading}
          />
        </div>
        
        {/* Performance Chart */}
        <div className="grid-item chart">
          <PerformanceChart
            history={dashboardData?.history}
            isLoading={isLoading}
          />
        </div>
        
        {/* Content Metrics */}
        <div className="grid-item content-metrics">
          <ContentPerformanceMetrics
            performance={dashboardData?.performance}
            isLoading={isLoading}
          />
        </div>
        
        {/* Achievements */}
        <div className="grid-item achievements">
          <AchievementsDisplay
            achievements={dashboardData?.achievements}
            isLoading={isLoading}
          />
        </div>
        
        {/* Recommendations */}
        <div className="grid-item recommendations">
          <RecommendationsPanel
            recommendations={dashboardData?.recommendations}
            isLoading={isLoading}
          />
        </div>
        
        {/* Pool Status */}
        <div className="grid-item pool-status">
          <RewardPoolStatus
            poolHealth={poolHealth}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

// Export components and utilities
export default CreatorRewardsDashboard;
export { 
  EarningsSummaryCard,
  RewardPredictionsCard,
  PerformanceChart,
  ContentPerformanceMetrics,
  AchievementsDisplay,
  RecommendationsPanel,
  RewardPoolStatus,
  DASHBOARD_CONFIG
};