/**
 * Gaming-Optimized Loading States
 * 
 * Provides engaging loading experiences optimized for gaming scenarios
 * Includes Xbox-style animations, progress indicators, and performance hints
 */

import React, { useState, useEffect } from 'react';

const GamingLoadingState = ({ 
  title = "Loading Gaming Experience", 
  routeName = "unknown",
  showProgress = true,
  showTips = true,
  duration = 2000 // Estimated load duration for progress animation
}) => {
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);

  // Gaming tips to show during loading
  const gamingTips = [
    "💡 Connect your Phantom wallet for the full gaming experience",
    "🎮 Vote and burn MLG tokens to support your favorite content",
    "🏆 Join clans to compete in tournaments and earn rewards", 
    "⚡ Real-time leaderboards update as you play and vote",
    "🔥 Higher token burns increase your voting power",
    "🎯 Complete achievements to unlock exclusive clan features",
    "📊 Track your gaming stats in the analytics dashboard",
    "🚀 Preload routes by hovering over navigation links"
  ];

  // Route-specific loading messages
  const routeMessages = {
    voting: "Preparing voting interface and blockchain connections...",
    clans: "Loading clan data and member statistics...",
    content: "Fetching latest gaming content and submissions...",
    profile: "Loading your gaming profile and achievements...",
    dao: "Connecting to DAO governance systems...",
    analytics: "Compiling gaming analytics and performance data...",
    wallet: "Establishing secure wallet connections...",
    unknown: "Loading gaming components..."
  };

  useEffect(() => {
    // Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        // Accelerate progress towards the end for better perceived performance
        const increment = prev < 50 ? 2 : prev < 80 ? 3 : 5;
        return Math.min(prev + increment, 100);
      });
    }, duration / 50); // Update 50 times over duration

    return () => clearInterval(progressInterval);
  }, [duration]);

  useEffect(() => {
    // Rotate gaming tips
    if (!showTips) return;
    
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % gamingTips.length);
    }, 3000);

    return () => clearInterval(tipInterval);
  }, [showTips, gamingTips.length]);

  return (
    <div className="gaming-loading-container">
      <div className="gaming-loading-content">
        {/* Xbox-style loading animation */}
        <div className="xbox-loading-ring">
          <div className="xbox-ring-segment xbox-ring-1"></div>
          <div className="xbox-ring-segment xbox-ring-2"></div>
          <div className="xbox-ring-segment xbox-ring-3"></div>
          <div className="xbox-ring-segment xbox-ring-4"></div>
        </div>

        {/* Loading title and route message */}
        <h2 className="gaming-loading-title">{title}</h2>
        <p className="gaming-loading-message">
          {routeMessages[routeName] || routeMessages.unknown}
        </p>

        {/* Progress bar */}
        {showProgress && (
          <div className="gaming-progress-container">
            <div className="gaming-progress-bar">
              <div 
                className="gaming-progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="gaming-progress-text">{progress}%</span>
          </div>
        )}

        {/* Gaming tips */}
        {showTips && (
          <div className="gaming-tips-container">
            <div className="gaming-tip">
              {gamingTips[currentTip]}
            </div>
          </div>
        )}

        {/* Performance indicator */}
        <div className="gaming-perf-indicator">
          <span className="perf-dot perf-good"></span>
          Optimizing for gaming performance...
        </div>
      </div>

      <style jsx>{`
        .gaming-loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
          color: #ffffff;
          padding: 2rem;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }

        .gaming-loading-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 157, 0.1), transparent);
          animation: shimmer 2s infinite;
        }

        .gaming-loading-content {
          text-align: center;
          z-index: 1;
          position: relative;
        }

        .xbox-loading-ring {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 2rem;
        }

        .xbox-ring-segment {
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid #00ff9d;
          animation: xbox-spin 1.5s infinite;
        }

        .xbox-ring-1 { top: 0; left: 50%; margin-left: -8px; animation-delay: 0s; }
        .xbox-ring-2 { top: 50%; right: 0; margin-top: -8px; animation-delay: -0.4s; }
        .xbox-ring-3 { bottom: 0; left: 50%; margin-left: -8px; animation-delay: -0.8s; }
        .xbox-ring-4 { top: 50%; left: 0; margin-top: -8px; animation-delay: -1.2s; }

        .gaming-loading-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: #00ff9d;
          text-shadow: 0 0 10px rgba(0, 255, 157, 0.5);
        }

        .gaming-loading-message {
          font-size: 1rem;
          margin-bottom: 2rem;
          opacity: 0.9;
          color: #b3b3b3;
        }

        .gaming-progress-container {
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .gaming-progress-bar {
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          position: relative;
        }

        .gaming-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ff9d, #00d4aa);
          border-radius: 2px;
          transition: width 0.3s ease;
          position: relative;
        }

        .gaming-progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: progress-shimmer 1.5s infinite;
        }

        .gaming-progress-text {
          font-size: 0.9rem;
          color: #00ff9d;
          font-weight: bold;
          min-width: 40px;
          text-align: right;
        }

        .gaming-tips-container {
          margin-bottom: 2rem;
          height: 24px;
        }

        .gaming-tip {
          font-size: 0.9rem;
          color: #ffd700;
          animation: tip-fade-in 0.5s ease;
        }

        .gaming-perf-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #888;
        }

        .perf-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .perf-good {
          background: #00ff9d;
        }

        @keyframes xbox-spin {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        @keyframes progress-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes tip-fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .gaming-loading-container {
            min-height: 300px;
            padding: 1rem;
          }
          
          .gaming-loading-title {
            font-size: 1.25rem;
          }
          
          .gaming-loading-message {
            font-size: 0.9rem;
          }
          
          .xbox-loading-ring {
            width: 60px;
            height: 60px;
          }
          
          .xbox-ring-segment {
            width: 12px;
            height: 12px;
          }
          
          .xbox-ring-1, .xbox-ring-3 { margin-left: -6px; }
          .xbox-ring-2, .xbox-ring-4 { margin-top: -6px; }
        }
      `}</style>
    </div>
  );
};

// Compact loading spinner for smaller components
const GamingSpinner = ({ size = "medium", color = "#00ff9d" }) => {
  const sizes = {
    small: { width: 20, height: 20 },
    medium: { width: 40, height: 40 },
    large: { width: 60, height: 60 }
  };

  const spinnerSize = sizes[size] || sizes.medium;

  return (
    <div 
      className="gaming-spinner"
      style={{
        width: spinnerSize.width,
        height: spinnerSize.height,
        border: `2px solid rgba(255, 255, 255, 0.1)`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    >
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Skeleton loader for content placeholders
const GamingSkeleton = ({ lines = 3, avatar = false, className = "" }) => {
  return (
    <div className={`gaming-skeleton ${className}`}>
      {avatar && <div className="skeleton-avatar"></div>}
      <div className="skeleton-content">
        {Array.from({ length: lines }, (_, index) => (
          <div 
            key={index} 
            className="skeleton-line"
            style={{ width: `${100 - Math.random() * 30}%` }}
          ></div>
        ))}
      </div>

      <style jsx>{`
        .gaming-skeleton {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          animation: skeleton-pulse 1.5s ease-in-out infinite alternate;
        }

        .skeleton-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 2s infinite;
        }

        .skeleton-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .skeleton-line {
          height: 16px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: 4px;
          animation: skeleton-shimmer 2s infinite;
        }

        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes skeleton-pulse {
          0% { opacity: 1; }
          100% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export { GamingLoadingState, GamingSpinner, GamingSkeleton };
export default GamingLoadingState;