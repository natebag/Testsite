/**
 * Gaming Error Boundary
 * 
 * Advanced error boundary for code-split routes with gaming-optimized error recovery
 * Provides detailed error reporting and fallback strategies
 */

import React from 'react';

class GamingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state to render error UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Track error for analytics
    this.trackError(error, errorInfo);
    
    console.error('🎮 Gaming Route Error:', error, errorInfo);
  }

  trackError = (error, errorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      routeName: this.props.routeName,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    };

    // Store error locally for debugging
    const existingErrors = JSON.parse(localStorage.getItem('mlg_route_errors') || '[]');
    existingErrors.push(errorData);
    
    // Keep only last 20 errors
    if (existingErrors.length > 20) {
      existingErrors.splice(0, existingErrors.length - 20);
    }
    
    localStorage.setItem('mlg_route_errors', JSON.stringify(existingErrors));

    // Send to analytics if available
    if (window.MLGAnalytics) {
      window.MLGAnalytics.trackError('route_error', errorData);
    }
  };

  handleRetry = async () => {
    if (this.state.retryCount >= 3) {
      console.warn('⚠️ Max retry attempts reached for route');
      return;
    }

    this.setState({ 
      isRecovering: true,
      retryCount: this.state.retryCount + 1 
    });

    // Clear any cached modules that might be causing issues
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        await navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            return registration.update();
          }
        });
      } catch (swError) {
        console.warn('Service worker update failed:', swError);
      }
    }

    // Attempt to clear route-specific cache
    if (window.MLGRouteLoader && this.props.routeName) {
      try {
        await window.MLGRouteLoader.preloadRoute(this.props.routeName);
      } catch (preloadError) {
        console.warn('Route preload failed:', preloadError);
      }
    }

    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false
      });
    }, 1000);
  };

  handleReportError = () => {
    const errorReport = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      routeName: this.props.routeName,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Copy to clipboard for easy reporting
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error report copied to clipboard! Please share with support.');
      })
      .catch(() => {
        // Fallback: show error in console
        console.log('Gaming Route Error Report:', errorReport);
        alert('Error report logged to console. Please check browser console.');
      });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided by parent
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default gaming-themed error UI
      return (
        <div className="gaming-error-boundary">
          <div className="gaming-error-content">
            <div className="gaming-error-icon">
              <div className="error-controller">
                <div className="controller-body"></div>
                <div className="controller-dpad"></div>
                <div className="controller-buttons"></div>
              </div>
            </div>

            <h2 className="gaming-error-title">
              🎮 Gaming Experience Interrupted
            </h2>

            <p className="gaming-error-message">
              Oops! Something went wrong loading the {this.props.routeName || 'gaming'} interface.
              Don't worry - your progress is safe!
            </p>

            <div className="gaming-error-details">
              <details>
                <summary>Technical Details (for developers)</summary>
                <pre className="error-stack">
                  {this.state.error?.stack}
                </pre>
              </details>
            </div>

            <div className="gaming-error-actions">
              <button 
                onClick={this.handleRetry}
                disabled={this.state.isRecovering || this.state.retryCount >= 3}
                className="gaming-retry-btn"
              >
                {this.state.isRecovering ? (
                  <>
                    <span className="retry-spinner"></span>
                    Recovering...
                  </>
                ) : this.state.retryCount >= 3 ? (
                  'Max Retries Reached'
                ) : (
                  `Retry Gaming Interface ${this.state.retryCount > 0 ? `(${this.state.retryCount}/3)` : ''}`
                )}
              </button>

              <button 
                onClick={this.handleReportError}
                className="gaming-report-btn"
              >
                📋 Report Error
              </button>

              <button 
                onClick={() => window.location.href = '/'}
                className="gaming-home-btn"
              >
                🏠 Return Home
              </button>
            </div>

            <div className="gaming-error-tips">
              <h4>Quick Fixes:</h4>
              <ul>
                <li>Check your internet connection</li>
                <li>Clear browser cache and reload</li>
                <li>Try connecting your wallet again</li>
                <li>Switch to a different browser</li>
                <li>Contact support if the issue persists</li>
              </ul>
            </div>
          </div>

          <style jsx>{`
            .gaming-error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 500px;
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
              color: white;
              padding: 2rem;
              border-radius: 12px;
              margin: 1rem;
            }

            .gaming-error-content {
              text-align: center;
              max-width: 600px;
            }

            .gaming-error-icon {
              margin-bottom: 2rem;
            }

            .error-controller {
              position: relative;
              width: 80px;
              height: 50px;
              margin: 0 auto;
              border: 3px solid #ff4444;
              border-radius: 15px;
              background: linear-gradient(45deg, #ff4444, #cc0000);
              animation: controller-shake 0.5s infinite alternate;
            }

            .controller-body {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 60px;
              height: 30px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 8px;
            }

            .controller-dpad {
              position: absolute;
              top: 10px;
              left: 15px;
              width: 15px;
              height: 15px;
              background: white;
              opacity: 0.8;
            }

            .controller-buttons {
              position: absolute;
              top: 10px;
              right: 15px;
              width: 15px;
              height: 15px;
              border-radius: 50%;
              background: white;
              opacity: 0.8;
            }

            .gaming-error-title {
              font-size: 1.75rem;
              margin-bottom: 1rem;
              color: #ff6b6b;
            }

            .gaming-error-message {
              font-size: 1.1rem;
              margin-bottom: 2rem;
              line-height: 1.5;
              color: #e0e0e0;
            }

            .gaming-error-details {
              margin-bottom: 2rem;
              text-align: left;
            }

            .gaming-error-details summary {
              cursor: pointer;
              color: #ffd700;
              font-weight: bold;
              margin-bottom: 1rem;
            }

            .error-stack {
              background: rgba(0, 0, 0, 0.3);
              padding: 1rem;
              border-radius: 8px;
              font-family: monospace;
              font-size: 0.8rem;
              max-height: 200px;
              overflow-y: auto;
              color: #ff9999;
              border-left: 3px solid #ff4444;
            }

            .gaming-error-actions {
              display: flex;
              flex-wrap: wrap;
              gap: 1rem;
              justify-content: center;
              margin-bottom: 2rem;
            }

            .gaming-retry-btn,
            .gaming-report-btn,
            .gaming-home-btn {
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 8px;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }

            .gaming-retry-btn {
              background: linear-gradient(45deg, #00ff9d, #00d4aa);
              color: #0a0a0a;
            }

            .gaming-retry-btn:hover:not(:disabled) {
              background: linear-gradient(45deg, #00d4aa, #00b894);
              transform: translateY(-2px);
            }

            .gaming-retry-btn:disabled {
              background: #666;
              color: #999;
              cursor: not-allowed;
            }

            .gaming-report-btn {
              background: linear-gradient(45deg, #ffd700, #ffed4a);
              color: #0a0a0a;
            }

            .gaming-report-btn:hover {
              background: linear-gradient(45deg, #ffed4a, #fff176);
              transform: translateY(-2px);
            }

            .gaming-home-btn {
              background: linear-gradient(45deg, #6c5ce7, #a29bfe);
              color: white;
            }

            .gaming-home-btn:hover {
              background: linear-gradient(45deg, #a29bfe, #fd79a8);
              transform: translateY(-2px);
            }

            .retry-spinner {
              width: 16px;
              height: 16px;
              border: 2px solid rgba(0, 0, 0, 0.1);
              border-top: 2px solid #0a0a0a;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }

            .gaming-error-tips {
              background: rgba(255, 255, 255, 0.05);
              padding: 1.5rem;
              border-radius: 8px;
              text-align: left;
            }

            .gaming-error-tips h4 {
              color: #00ff9d;
              margin-bottom: 1rem;
            }

            .gaming-error-tips ul {
              list-style: none;
              padding: 0;
            }

            .gaming-error-tips li {
              padding: 0.3rem 0;
              position: relative;
              padding-left: 1.5rem;
            }

            .gaming-error-tips li::before {
              content: '🎯';
              position: absolute;
              left: 0;
            }

            @keyframes controller-shake {
              0% { transform: translateX(0); }
              100% { transform: translateX(4px); }
            }

            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }

            /* Mobile responsiveness */
            @media (max-width: 768px) {
              .gaming-error-boundary {
                padding: 1rem;
                min-height: 400px;
              }

              .gaming-error-title {
                font-size: 1.5rem;
              }

              .gaming-error-message {
                font-size: 1rem;
              }

              .gaming-error-actions {
                flex-direction: column;
                align-items: center;
              }

              .gaming-retry-btn,
              .gaming-report-btn,
              .gaming-home-btn {
                width: 100%;
                max-width: 300px;
              }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GamingErrorBoundary;