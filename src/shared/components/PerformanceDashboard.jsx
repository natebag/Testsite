/**
 * Real-Time Performance Analytics Dashboard
 * 
 * Gaming-themed performance dashboard with real-time visualizations
 * for Web Core Vitals, gaming-specific metrics, alerts, and recommendations.
 * 
 * Features:
 * - Real-time Web Core Vitals tracking
 * - Gaming performance metrics visualization
 * - Performance alerts and regression detection
 * - Actionable optimization recommendations
 * - Gaming session analytics
 * - Network and device performance correlation
 * 
 * @author Claude Code - Analytics Architect
 * @version 1.0.0
 * @created 2025-08-12
 */

import React, { useState, useEffect, useRef } from 'react';
import { getPerformanceAnalytics } from '../performance/PerformanceAnalytics.js';

const PerformanceDashboard = ({ 
  className = '',
  refreshInterval = 5000,
  showRecommendations = true,
  theme = 'dark'
}) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const analyticsRef = useRef(null);

  useEffect(() => {
    initializeAnalytics();
    
    return () => {
      if (analyticsRef.current) {
        analyticsRef.current.removeAllListeners();
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      updatePerformanceData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const initializeAnalytics = async () => {
    try {
      analyticsRef.current = getPerformanceAnalytics();
      
      // Listen for real-time events
      analyticsRef.current.on('alert:created', handleNewAlert);
      analyticsRef.current.on('metric:recorded', handleNewMetric);
      analyticsRef.current.on('gaming_metric:recorded', handleGamingMetric);
      
      await updatePerformanceData();
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize performance analytics:', error);
      setIsLoading(false);
    }
  };

  const updatePerformanceData = async () => {
    if (!analyticsRef.current) return;
    
    try {
      const snapshot = analyticsRef.current.getPerformanceSnapshot();
      setPerformanceData(snapshot);
      setAlerts(snapshot.alerts || []);
      setRecommendations(snapshot.recommendations || []);
    } catch (error) {
      console.error('Failed to update performance data:', error);
    }
  };

  const handleNewAlert = (alert) => {
    setAlerts(prev => [alert, ...prev].slice(0, 10));
  };

  const handleNewMetric = (metric) => {
    // Update real-time metrics
    updatePerformanceData();
  };

  const handleGamingMetric = (metric) => {
    // Update gaming performance metrics
    updatePerformanceData();
  };

  const resolveAlert = (alertId) => {
    if (analyticsRef.current) {
      analyticsRef.current.resolveAlert(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ));
    }
  };

  if (isLoading) {
    return (
      <div className={`performance-dashboard loading ${theme} ${className}`}>
        <div className="loading-spinner">
          <div className="xbox-loading-ring"></div>
          <span>Initializing Performance Analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`performance-dashboard ${theme} ${className}`}>
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          <span className="icon">⚡</span>
          MLG.clan Performance Analytics
        </h1>
        <div className="dashboard-nav">
          <button 
            className={`nav-btn ${selectedMetric === 'overview' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('overview')}
          >
            Overview
          </button>
          <button 
            className={`nav-btn ${selectedMetric === 'vitals' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('vitals')}
          >
            Web Vitals
          </button>
          <button 
            className={`nav-btn ${selectedMetric === 'gaming' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('gaming')}
          >
            Gaming
          </button>
          <button 
            className={`nav-btn ${selectedMetric === 'alerts' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('alerts')}
          >
            Alerts ({alerts.filter(a => !a.resolved).length})
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {selectedMetric === 'overview' && (
          <OverviewSection data={performanceData} />
        )}
        {selectedMetric === 'vitals' && (
          <WebVitalsSection data={performanceData?.webVitals} />
        )}
        {selectedMetric === 'gaming' && (
          <GamingMetricsSection data={performanceData?.gaming} />
        )}
        {selectedMetric === 'alerts' && (
          <AlertsSection 
            alerts={alerts}
            onResolveAlert={resolveAlert}
          />
        )}
      </div>

      {showRecommendations && recommendations.length > 0 && (
        <RecommendationsPanel recommendations={recommendations} />
      )}
    </div>
  );
};

const OverviewSection = ({ data }) => {
  if (!data) return <div className="no-data">No performance data available</div>;

  const getOverallScore = () => {
    const webVitals = data.webVitals || {};
    const gaming = data.gaming || {};
    
    let score = 100;
    let factors = 0;
    
    // Web Vitals scoring
    Object.values(webVitals).forEach(vital => {
      if (vital.performance === 'poor') score -= 20;
      else if (vital.performance === 'needs_improvement') score -= 10;
      factors++;
    });
    
    // Gaming performance scoring
    Object.values(gaming).forEach(metric => {
      if (metric.performance === 'poor') score -= 15;
      else if (metric.performance === 'needs_improvement') score -= 7;
      factors++;
    });
    
    return Math.max(0, Math.round(score));
  };

  const overallScore = getOverallScore();
  const scoreColor = overallScore >= 90 ? '#00ff41' : overallScore >= 70 ? '#ffaa00' : '#ff0040';

  return (
    <div className="overview-section">
      <div className="performance-score-card">
        <h2>Overall Performance Score</h2>
        <div className="score-display">
          <div 
            className="score-circle"
            style={{ '--score-color': scoreColor }}
          >
            <span className="score-value">{overallScore}</span>
            <span className="score-label">/ 100</span>
          </div>
        </div>
        <div className="score-status">
          {overallScore >= 90 && <span className="status good">🏆 Excellent</span>}
          {overallScore >= 70 && overallScore < 90 && <span className="status okay">⚡ Good</span>}
          {overallScore < 70 && <span className="status poor">⚠️ Needs Improvement</span>}
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Web Core Vitals"
          icon="🌐"
          data={data.webVitals}
          type="vitals"
        />
        <MetricCard
          title="Gaming Performance"
          icon="🎮"
          data={data.gaming}
          type="gaming"
        />
        <MetricCard
          title="Network Quality"
          icon="📡"
          data={data.network}
          type="network"
        />
        <MetricCard
          title="Device Performance"
          icon="💻"
          data={data.device}
          type="device"
        />
      </div>

      <div className="real-time-status">
        <h3>Real-Time Status</h3>
        <div className="status-indicators">
          <StatusIndicator
            label="Vote System"
            status={getSystemStatus(data.gaming?.vote)}
            latency={data.gaming?.vote?.latest}
          />
          <StatusIndicator
            label="Leaderboards"
            status={getSystemStatus(data.gaming?.leaderboard)}
            latency={data.gaming?.leaderboard?.latest}
          />
          <StatusIndicator
            label="Tournaments"
            status={getSystemStatus(data.gaming?.tournament)}
            latency={data.gaming?.tournament?.latest}
          />
          <StatusIndicator
            label="Wallet"
            status={getSystemStatus(data.gaming?.wallet)}
            latency={data.gaming?.wallet?.latest}
          />
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, icon, data, type }) => {
  const getCardStatus = () => {
    if (!data) return 'unknown';
    
    const metrics = Object.values(data);
    if (metrics.some(m => m?.performance === 'poor')) return 'poor';
    if (metrics.some(m => m?.performance === 'needs_improvement')) return 'needs_improvement';
    return 'good';
  };

  const status = getCardStatus();
  const statusColors = {
    good: '#00ff41',
    needs_improvement: '#ffaa00',
    poor: '#ff0040',
    unknown: '#666'
  };

  return (
    <div className={`metric-card ${status}`}>
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <h4>{title}</h4>
      </div>
      <div 
        className="card-status-bar"
        style={{ backgroundColor: statusColors[status] }}
      ></div>
      <div className="card-content">
        {data ? (
          <div className="metrics-list">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="metric-item">
                <span className="metric-name">{key.toUpperCase()}</span>
                <span className={`metric-value ${value?.performance || 'unknown'}`}>
                  {formatMetricValue(value, type)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="no-data">No data available</span>
        )}
      </div>
    </div>
  );
};

const WebVitalsSection = ({ data }) => {
  if (!data) return <div className="no-data">No Web Vitals data available</div>;

  return (
    <div className="web-vitals-section">
      <h2>Web Core Vitals</h2>
      <div className="vitals-grid">
        {Object.entries(data).map(([vital, metrics]) => (
          <VitalCard key={vital} vital={vital} metrics={metrics} />
        ))}
      </div>
    </div>
  );
};

const VitalCard = ({ vital, metrics }) => {
  const vitalInfo = {
    LCP: { name: 'Largest Contentful Paint', unit: 'ms', icon: '🖼️' },
    FID: { name: 'First Input Delay', unit: 'ms', icon: '👆' },
    CLS: { name: 'Cumulative Layout Shift', unit: '', icon: '📐' },
    FCP: { name: 'First Contentful Paint', unit: 'ms', icon: '🎨' },
    TTI: { name: 'Time to Interactive', unit: 'ms', icon: '⚡' }
  };

  const info = vitalInfo[vital];
  const performance = metrics?.performance || 'unknown';

  return (
    <div className={`vital-card ${performance}`}>
      <div className="vital-header">
        <span className="vital-icon">{info?.icon}</span>
        <div>
          <h4>{vital}</h4>
          <span className="vital-name">{info?.name}</span>
        </div>
      </div>
      <div className="vital-metrics">
        <div className="vital-value">
          <span className="value">{Math.round(metrics?.latest || 0)}</span>
          <span className="unit">{info?.unit}</span>
        </div>
        <div className="vital-average">
          Avg: {Math.round(metrics?.average || 0)}{info?.unit}
        </div>
        <div className={`vital-status ${performance}`}>
          {performance.replace('_', ' ')}
        </div>
      </div>
    </div>
  );
};

const GamingMetricsSection = ({ data }) => {
  if (!data) return <div className="no-data">No gaming performance data available</div>;

  return (
    <div className="gaming-metrics-section">
      <h2>Gaming Performance Metrics</h2>
      <div className="gaming-grid">
        {Object.entries(data).map(([category, metrics]) => (
          <GamingMetricCard key={category} category={category} metrics={metrics} />
        ))}
      </div>
    </div>
  );
};

const GamingMetricCard = ({ category, metrics }) => {
  const categoryInfo = {
    vote: { name: 'Vote System', icon: '🗳️', color: '#00ff41' },
    leaderboard: { name: 'Leaderboards', icon: '🏆', color: '#ffaa00' },
    tournament: { name: 'Tournaments', icon: '🎯', color: '#ff0040' },
    wallet: { name: 'Wallet', icon: '💰', color: '#00aaff' },
    clan: { name: 'Clan Management', icon: '⚔️', color: '#aa00ff' }
  };

  const info = categoryInfo[category];
  const performance = metrics?.performance || 'unknown';

  return (
    <div className={`gaming-metric-card ${performance}`}>
      <div className="gaming-header">
        <span 
          className="gaming-icon"
          style={{ color: info?.color }}
        >
          {info?.icon}
        </span>
        <h4>{info?.name}</h4>
      </div>
      <div className="gaming-metrics">
        <div className="latency-display">
          <span className="latency-value">{Math.round(metrics?.latest || 0)}</span>
          <span className="latency-unit">ms</span>
        </div>
        <div className="metric-stats">
          <div className="stat">
            <span className="stat-label">Average</span>
            <span className="stat-value">{Math.round(metrics?.average || 0)}ms</span>
          </div>
          <div className="stat">
            <span className="stat-label">Count</span>
            <span className="stat-value">{metrics?.count || 0}</span>
          </div>
        </div>
        <div className={`performance-status ${performance}`}>
          {performance.replace('_', ' ')}
        </div>
      </div>
    </div>
  );
};

const AlertsSection = ({ alerts, onResolveAlert }) => {
  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const resolvedAlerts = alerts.filter(alert => alert.resolved);

  return (
    <div className="alerts-section">
      <h2>Performance Alerts</h2>
      
      {activeAlerts.length > 0 && (
        <div className="active-alerts">
          <h3>🚨 Active Alerts ({activeAlerts.length})</h3>
          <div className="alerts-list">
            {activeAlerts.map(alert => (
              <AlertCard 
                key={alert.id} 
                alert={alert} 
                onResolve={() => onResolveAlert(alert.id)}
              />
            ))}
          </div>
        </div>
      )}

      {resolvedAlerts.length > 0 && (
        <div className="resolved-alerts">
          <h3>✅ Recently Resolved ({resolvedAlerts.length})</h3>
          <div className="alerts-list">
            {resolvedAlerts.slice(0, 5).map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <div className="no-alerts">
          <span className="no-alerts-icon">🎉</span>
          <h3>All Systems Operating Normally</h3>
          <p>No performance alerts detected</p>
        </div>
      )}
    </div>
  );
};

const AlertCard = ({ alert, onResolve }) => {
  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#ff0040',
      major: '#ff4000',
      high: '#ff8000',
      medium: '#ffaa00',
      low: '#ffff00',
      minor: '#aaff00'
    };
    return colors[severity] || '#666';
  };

  const formatAlertType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className={`alert-card ${alert.resolved ? 'resolved' : 'active'}`}>
      <div className="alert-header">
        <div 
          className="alert-severity"
          style={{ backgroundColor: getSeverityColor(alert.data?.severity) }}
        >
          {alert.data?.severity?.toUpperCase() || 'UNKNOWN'}
        </div>
        <div className="alert-info">
          <h4>{formatAlertType(alert.type)}</h4>
          <span className="alert-time">
            {new Date(alert.timestamp).toLocaleTimeString()}
          </span>
        </div>
        {!alert.resolved && onResolve && (
          <button className="resolve-btn" onClick={onResolve}>
            Resolve
          </button>
        )}
      </div>
      <div className="alert-details">
        {alert.data?.vitalType && (
          <p><strong>Metric:</strong> {alert.data.vitalType}</p>
        )}
        {alert.data?.metricType && (
          <p><strong>Gaming Metric:</strong> {alert.data.metricType}</p>
        )}
        {alert.data?.value && (
          <p><strong>Value:</strong> {Math.round(alert.data.value)}ms</p>
        )}
        {alert.data?.threshold && (
          <p><strong>Threshold:</strong> {Math.round(alert.data.threshold)}ms</p>
        )}
        {alert.data?.percentageIncrease && (
          <p><strong>Regression:</strong> +{Math.round(alert.data.percentageIncrease)}%</p>
        )}
      </div>
    </div>
  );
};

const RecommendationsPanel = ({ recommendations }) => {
  const [expandedRec, setExpandedRec] = useState(null);

  return (
    <div className="recommendations-panel">
      <h3>🎯 Optimization Recommendations</h3>
      <div className="recommendations-list">
        {recommendations.map((rec, index) => (
          <RecommendationCard 
            key={index}
            recommendation={rec}
            isExpanded={expandedRec === index}
            onToggle={() => setExpandedRec(expandedRec === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
};

const RecommendationCard = ({ recommendation, isExpanded, onToggle }) => {
  const getSeverityIcon = (severity) => {
    const icons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };
    return icons[severity] || '⚪';
  };

  const getImpactColor = (impact) => {
    const colors = {
      high: '#00ff41',
      medium: '#ffaa00',
      low: '#666'
    };
    return colors[impact] || '#666';
  };

  return (
    <div className={`recommendation-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="rec-header" onClick={onToggle}>
        <div className="rec-info">
          <span className="rec-severity">
            {getSeverityIcon(recommendation.severity)}
          </span>
          <h4>{recommendation.title}</h4>
          <div className="rec-badges">
            <span 
              className="impact-badge"
              style={{ backgroundColor: getImpactColor(recommendation.impact) }}
            >
              {recommendation.impact} impact
            </span>
            <span className="difficulty-badge">
              {recommendation.difficulty} difficulty
            </span>
          </div>
        </div>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>
      
      {isExpanded && (
        <div className="rec-details">
          <p className="rec-description">{recommendation.description}</p>
          {recommendation.actions && (
            <div className="rec-actions">
              <h5>Recommended Actions:</h5>
              <ul>
                {recommendation.actions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatusIndicator = ({ label, status, latency }) => {
  const statusColors = {
    good: '#00ff41',
    needs_improvement: '#ffaa00',
    poor: '#ff0040',
    unknown: '#666'
  };

  return (
    <div className="status-indicator">
      <div 
        className="status-dot"
        style={{ backgroundColor: statusColors[status] }}
      ></div>
      <div className="status-info">
        <span className="status-label">{label}</span>
        {latency && (
          <span className="status-latency">{Math.round(latency)}ms</span>
        )}
      </div>
    </div>
  );
};

// Utility functions
const getSystemStatus = (metrics) => {
  if (!metrics) return 'unknown';
  return metrics.performance || 'unknown';
};

const formatMetricValue = (value, type) => {
  if (!value) return 'N/A';
  
  if (type === 'vitals' || type === 'gaming') {
    return `${Math.round(value.latest || value.average || 0)}ms`;
  }
  
  if (type === 'network') {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return `${value}ms`;
  }
  
  return value.toString();
};

export default PerformanceDashboard;