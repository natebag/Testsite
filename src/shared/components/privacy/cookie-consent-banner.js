/**
 * Cookie Consent Banner
 * 
 * Xbox 360-style cookie consent banner for GDPR compliance including:
 * - Essential/functional/analytics/marketing cookie categories
 * - Granular consent controls
 * - Persistent consent storage
 * - Integration with GDPR service
 * 
 * @author Claude Code - Security & Privacy Architect
 * @version 1.0.0
 * @created 2025-08-13
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Cookie categories with descriptions
 */
const COOKIE_CATEGORIES = {
  ESSENTIAL: {
    title: 'Essential Cookies',
    description: 'Required for basic website functionality and security',
    required: true,
    examples: ['Authentication', 'Session management', 'Security'],
    color: 'blue'
  },
  FUNCTIONAL: {
    title: 'Functional Cookies',
    description: 'Enhance your experience with personalized features',
    required: false,
    examples: ['User preferences', 'Language settings', 'Gaming customizations'],
    color: 'green'
  },
  ANALYTICS: {
    title: 'Analytics Cookies',
    description: 'Help us understand usage patterns to improve the platform',
    required: false,
    examples: ['Usage statistics', 'Performance monitoring', 'Feature tracking'],
    color: 'purple'
  },
  MARKETING: {
    title: 'Marketing Cookies',
    description: 'Deliver relevant content and track campaign effectiveness',
    required: false,
    examples: ['Targeted content', 'Campaign tracking', 'Social media integration'],
    color: 'orange'
  }
};

/**
 * Cookie Consent Banner Component
 */
export function CookieConsentBanner({ 
  onConsentChange,
  initialConsents = {},
  showBanner = true,
  position = 'bottom', // 'top' or 'bottom'
  gdprService = null
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consents, setConsents] = useState({
    ESSENTIAL: true,
    FUNCTIONAL: false,
    ANALYTICS: false,
    MARKETING: false,
    ...initialConsents
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if consent has already been given
  useEffect(() => {
    const checkExistingConsent = async () => {
      try {
        // Check localStorage first for quick response
        const storedConsent = localStorage.getItem('mlg-cookie-consent');
        if (storedConsent) {
          const { consents: storedConsents, timestamp } = JSON.parse(storedConsent);
          
          // Check if consent is still valid (1 year)
          const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
          if (timestamp > oneYearAgo) {
            setConsents(storedConsents);
            setIsVisible(false);
            return;
          }
        }

        // If no valid stored consent and banner should be shown
        if (showBanner) {
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error checking cookie consent:', error);
        if (showBanner) {
          setIsVisible(true);
        }
      }
    };

    checkExistingConsent();
  }, [showBanner]);

  const handleConsentChange = (category, granted) => {
    if (category === 'ESSENTIAL') return; // Cannot disable essential cookies
    
    setConsents(prev => ({
      ...prev,
      [category]: granted
    }));
  };

  const handleAcceptAll = () => {
    const allConsents = {
      ESSENTIAL: true,
      FUNCTIONAL: true,
      ANALYTICS: true,
      MARKETING: true
    };
    setConsents(allConsents);
    submitConsent(allConsents);
  };

  const handleRejectAll = () => {
    const minimalConsents = {
      ESSENTIAL: true,
      FUNCTIONAL: false,
      ANALYTICS: false,
      MARKETING: false
    };
    setConsents(minimalConsents);
    submitConsent(minimalConsents);
  };

  const handleSavePreferences = () => {
    submitConsent(consents);
  };

  const submitConsent = async (finalConsents) => {
    setIsSubmitting(true);
    
    try {
      // Store in localStorage
      localStorage.setItem('mlg-cookie-consent', JSON.stringify({
        consents: finalConsents,
        timestamp: Date.now(),
        version: '1.0'
      }));

      // Submit to GDPR service if available
      if (gdprService) {
        await gdprService.recordCookieConsent(finalConsents);
      }

      // Call parent callback
      if (onConsentChange) {
        onConsentChange(finalConsents);
      }

      // Hide banner
      setIsVisible(false);
    } catch (error) {
      console.error('Error saving cookie consent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bannerVariants = {
    hidden: { 
      opacity: 0, 
      y: position === 'bottom' ? 100 : -100,
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0, 
      y: position === 'bottom' ? 100 : -100,
      scale: 0.95,
      transition: { duration: 0.3 }
    }
  };

  const detailsVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto',
      transition: { duration: 0.3 }
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={bannerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`fixed left-0 right-0 z-50 ${
          position === 'bottom' ? 'bottom-0' : 'top-0'
        }`}
      >
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t-2 border-green-500 shadow-2xl">
          {/* Main Banner Content */}
          <div className="px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🍪</span>
                    <h3 className="text-lg font-bold text-white">
                      Cookie Preferences
                    </h3>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3">
                    We use cookies to enhance your gaming experience, provide personalized 
                    content, and analyze platform usage. By continuing to use MLG.clan, 
                    you consent to our use of essential cookies.
                  </p>

                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-green-400 text-sm hover:text-green-300 underline"
                  >
                    {showDetails ? 'Hide Details' : 'Customize Settings'}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={handleRejectAll}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 transition-colors text-sm whitespace-nowrap"
                  >
                    Essential Only
                  </button>
                  
                  <button
                    onClick={handleAcceptAll}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 transition-colors text-sm whitespace-nowrap"
                  >
                    {isSubmitting ? 'Saving...' : 'Accept All'}
                  </button>
                </div>
              </div>

              {/* Detailed Cookie Settings */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    variants={detailsVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="mt-6 border-t border-gray-700 pt-6"
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(COOKIE_CATEGORIES).map(([category, config]) => (
                        <CookieCategoryCard
                          key={category}
                          category={category}
                          config={config}
                          consent={consents[category]}
                          onChange={handleConsentChange}
                        />
                      ))}
                    </div>

                    <div className="flex justify-end mt-6 space-x-3">
                      <button
                        onClick={() => setShowDetails(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      
                      <button
                        onClick={handleSavePreferences}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 transition-colors text-sm"
                      >
                        {isSubmitting ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Privacy Policy Link */}
          <div className="bg-gray-800 px-6 py-2 border-t border-gray-700">
            <div className="max-w-7xl mx-auto text-center">
              <p className="text-gray-400 text-xs">
                Learn more about our data practices in our{' '}
                <a 
                  href="/privacy-policy" 
                  className="text-green-400 hover:text-green-300 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
                {' '}and{' '}
                <a 
                  href="/cookie-policy" 
                  className="text-green-400 hover:text-green-300 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cookie Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Cookie Category Card Component
 */
function CookieCategoryCard({ category, config, consent, onChange }) {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-900 bg-opacity-20',
    green: 'border-green-500 bg-green-900 bg-opacity-20',
    purple: 'border-purple-500 bg-purple-900 bg-opacity-20',
    orange: 'border-orange-500 bg-orange-900 bg-opacity-20'
  };

  return (
    <motion.div
      className={`border rounded-lg p-4 ${colorClasses[config.color]} ${
        config.required ? 'opacity-75' : ''
      }`}
      whileHover={{ scale: config.required ? 1 : 1.02 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-semibold text-white text-sm">
              {config.title}
            </h4>
            {config.required && (
              <span className="bg-blue-600 text-xs px-2 py-1 rounded text-white">
                Required
              </span>
            )}
          </div>
          
          <p className="text-gray-300 text-xs mb-3">
            {config.description}
          </p>
          
          <div className="space-y-1">
            <p className="text-gray-400 text-xs font-medium">Examples:</p>
            {config.examples.map((example, index) => (
              <span
                key={index}
                className="inline-block bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded mr-1 mb-1"
              >
                {example}
              </span>
            ))}
          </div>
        </div>
        
        <div className="ml-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => onChange(category, e.target.checked)}
              disabled={config.required}
              className="form-checkbox h-4 w-4 text-green-600 rounded focus:ring-green-500 focus:ring-2"
            />
          </label>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Cookie Consent Manager Hook
 */
export function useCookieConsent() {
  const [consents, setConsents] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConsents = () => {
      try {
        const stored = localStorage.getItem('mlg-cookie-consent');
        if (stored) {
          const { consents: storedConsents, timestamp } = JSON.parse(stored);
          
          // Check if consent is still valid (1 year)
          const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
          if (timestamp > oneYearAgo) {
            setConsents(storedConsents);
          }
        }
      } catch (error) {
        console.error('Error loading cookie consent:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConsents();
  }, []);

  const updateConsent = (newConsents) => {
    setConsents(newConsents);
    localStorage.setItem('mlg-cookie-consent', JSON.stringify({
      consents: newConsents,
      timestamp: Date.now(),
      version: '1.0'
    }));
  };

  const hasConsent = (category) => {
    return consents?.[category] === true;
  };

  const isConsentGiven = () => {
    return consents !== null;
  };

  return {
    consents,
    loading,
    hasConsent,
    isConsentGiven,
    updateConsent
  };
}

export default CookieConsentBanner;