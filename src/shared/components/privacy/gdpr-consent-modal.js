/**
 * GDPR Consent Management Modal
 * 
 * Xbox 360-style consent modal for GDPR compliance including:
 * - Purpose-based consent collection
 * - Cookie consent management  
 * - Privacy settings configuration
 * - Data processing transparency
 * 
 * @author Claude Code - Security & Privacy Architect
 * @version 1.0.0
 * @created 2025-08-13
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * GDPR consent purposes with user-friendly descriptions
 */
const CONSENT_PURPOSES = {
  AUTHENTICATION: {
    title: 'Account & Authentication',
    description: 'Essential for your account security and login functionality',
    required: true,
    category: 'essential',
    icon: '🔐',
    details: 'We process your wallet address, session data, and authentication tokens to keep your account secure and maintain your login sessions.'
  },
  PROFILE_MANAGEMENT: {
    title: 'Profile & Gaming Data',
    description: 'Store and manage your gaming profile, stats, and achievements',
    required: false,
    category: 'functional',
    icon: '🎮',
    details: 'Your username, avatar, gaming statistics, and achievement progress to enhance your gaming experience.'
  },
  VOTING_PARTICIPATION: {
    title: 'Community Voting',
    description: 'Participate in community governance and content voting',
    required: false,
    category: 'functional',
    icon: '🗳️',
    details: 'Your voting history and governance participation to ensure fair community decision-making.'
  },
  CLAN_ACTIVITIES: {
    title: 'Clan & Social Features',
    description: 'Join clans, connect with other gamers, and participate in social features',
    required: false,
    category: 'functional',
    icon: '👥',
    details: 'Clan memberships, social connections, and group activities to enhance your social gaming experience.'
  },
  ANALYTICS: {
    title: 'Platform Analytics',
    description: 'Help us improve the platform with anonymous usage data',
    required: false,
    category: 'analytics',
    icon: '📊',
    details: 'Anonymous usage patterns and performance data to improve platform features and user experience.'
  },
  MARKETING: {
    title: 'Marketing Communications',
    description: 'Receive updates about new features, events, and gaming content',
    required: false,
    category: 'marketing',
    icon: '📢',
    details: 'Email notifications about platform updates, gaming events, and new features you might enjoy.'
  },
  PERFORMANCE_TRACKING: {
    title: 'Performance Tracking',
    description: 'Track your gaming performance and provide personalized insights',
    required: false,
    category: 'functional',
    icon: '⚡',
    details: 'Gaming performance metrics, skill progression, and personalized recommendations to help you improve.'
  }
};

/**
 * Cookie categories for consent
 */
const COOKIE_CATEGORIES = {
  ESSENTIAL: {
    title: 'Essential Cookies',
    description: 'Required for basic website functionality',
    required: true,
    examples: ['Authentication tokens', 'Session management', 'Security features']
  },
  FUNCTIONAL: {
    title: 'Functional Cookies',
    description: 'Enable enhanced features and personalization',
    required: false,
    examples: ['User preferences', 'Language settings', 'Gaming customizations']
  },
  ANALYTICS: {
    title: 'Analytics Cookies',
    description: 'Help us understand how you use our platform',
    required: false,
    examples: ['Usage statistics', 'Performance monitoring', 'Feature usage tracking']
  },
  MARKETING: {
    title: 'Marketing Cookies',
    description: 'Used to deliver relevant content and advertisements',
    required: false,
    examples: ['Targeted content', 'Campaign tracking', 'Social media integration']
  }
};

/**
 * GDPR Consent Modal Component
 */
export function GDPRConsentModal({ 
  isOpen, 
  onClose, 
  onConsentSubmit,
  initialConsents = {},
  mode = 'initial', // 'initial', 'update', 'cookie-only'
  userInfo = null
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [consents, setConsents] = useState(initialConsents);
  const [cookieConsents, setCookieConsents] = useState({
    ESSENTIAL: true,
    FUNCTIONAL: false,
    ANALYTICS: false,
    MARKETING: false
  });
  const [showDetails, setShowDetails] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal steps
  const steps = [
    { id: 'welcome', title: 'Privacy & Data Protection', component: WelcomeStep },
    { id: 'purposes', title: 'Data Processing Purposes', component: PurposesStep },
    { id: 'cookies', title: 'Cookie Preferences', component: CookiesStep },
    { id: 'summary', title: 'Review Your Choices', component: SummaryStep }
  ];

  useEffect(() => {
    if (isOpen && mode === 'cookie-only') {
      setCurrentStep(2); // Jump to cookies step
    }
  }, [isOpen, mode]);

  const handleConsentChange = (purpose, granted) => {
    setConsents(prev => ({
      ...prev,
      [purpose]: granted
    }));
  };

  const handleCookieConsentChange = (category, granted) => {
    if (category === 'ESSENTIAL') return; // Cannot disable essential cookies
    
    setCookieConsents(prev => ({
      ...prev,
      [category]: granted
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConsentSubmit({
        purposes: consents,
        cookies: cookieConsents,
        timestamp: new Date().toISOString(),
        mode
      });
      onClose();
    } catch (error) {
      console.error('Error submitting consent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDetails = (purpose) => {
    setShowDetails(prev => ({
      ...prev,
      [purpose]: !prev[purpose]
    }));
  };

  // Modal animations
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: -50 }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  if (!isOpen) return null;

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-green-500 rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4 border-b border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {steps[currentStep].title}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-8 rounded-full transition-colors ${
                        index <= currentStep ? 'bg-green-400' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-sm text-green-200">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <CurrentStepComponent
                  consents={consents}
                  cookieConsents={cookieConsents}
                  showDetails={showDetails}
                  onConsentChange={handleConsentChange}
                  onCookieConsentChange={handleCookieConsentChange}
                  onToggleDetails={toggleDetails}
                  userInfo={userInfo}
                  mode={mode}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
              >
                Cancel
              </button>
              
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Preferences'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Welcome Step Component
 */
function WelcomeStep({ userInfo, mode }) {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl">🛡️</div>
      <h3 className="text-2xl font-bold text-green-400">
        Your Privacy Matters
      </h3>
      <div className="text-gray-300 space-y-4 max-w-2xl mx-auto">
        <p>
          Welcome to MLG.clan's privacy control center. We believe in transparency 
          and giving you control over your personal data.
        </p>
        {mode === 'initial' && (
          <p>
            Before you start gaming, let's set up your privacy preferences. 
            You can always change these settings later in your account dashboard.
          </p>
        )}
        {userInfo && (
          <div className="bg-blue-900 bg-opacity-50 border border-blue-500 rounded-lg p-4">
            <p className="text-blue-200">
              Welcome back, <span className="font-semibold">{userInfo.username}</span>! 
              You're updating your privacy preferences.
            </p>
          </div>
        )}
        <div className="bg-yellow-900 bg-opacity-50 border border-yellow-500 rounded-lg p-4">
          <p className="text-yellow-200 text-sm">
            <strong>Important:</strong> Some data processing is essential for platform 
            functionality (like authentication). Optional features require separate consent.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Purposes Step Component
 */
function PurposesStep({ 
  consents, 
  showDetails, 
  onConsentChange, 
  onToggleDetails 
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-green-400 mb-2">
          Data Processing Purposes
        </h3>
        <p className="text-gray-300">
          Choose how we can process your data to enhance your gaming experience
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(CONSENT_PURPOSES).map(([purpose, config]) => (
          <motion.div
            key={purpose}
            className={`border rounded-lg p-4 transition-colors ${
              config.required 
                ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
                : 'border-gray-600 bg-gray-800 bg-opacity-50'
            }`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="text-2xl">{config.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-white">
                      {config.title}
                    </h4>
                    {config.required && (
                      <span className="bg-blue-600 text-xs px-2 py-1 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm mt-1">
                    {config.description}
                  </p>
                  
                  {showDetails[purpose] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-3 bg-gray-700 rounded text-sm text-gray-200"
                    >
                      {config.details}
                    </motion.div>
                  )}
                  
                  <button
                    onClick={() => onToggleDetails(purpose)}
                    className="text-green-400 text-sm mt-2 hover:text-green-300"
                  >
                    {showDetails[purpose] ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
              </div>
              
              <div className="ml-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.required || consents[purpose] || false}
                    onChange={(e) => onConsentChange(purpose, e.target.checked)}
                    disabled={config.required}
                    className="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-300">
                    {config.required ? 'Required' : 'Allow'}
                  </span>
                </label>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * Cookies Step Component
 */
function CookiesStep({ 
  cookieConsents, 
  onCookieConsentChange 
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-green-400 mb-2">
          Cookie Preferences
        </h3>
        <p className="text-gray-300">
          Customize which cookies we can use to enhance your experience
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(COOKIE_CATEGORIES).map(([category, config]) => (
          <motion.div
            key={category}
            className={`border rounded-lg p-4 transition-colors ${
              config.required 
                ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
                : 'border-gray-600 bg-gray-800 bg-opacity-50'
            }`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-white">
                    {config.title}
                  </h4>
                  {config.required && (
                    <span className="bg-blue-600 text-xs px-2 py-1 rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-gray-300 text-sm mt-1">
                  {config.description}
                </p>
                
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">Examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {config.examples.map((example, index) => (
                      <span
                        key={index}
                        className="bg-gray-700 text-xs px-2 py-1 rounded"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="ml-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={cookieConsents[category]}
                    onChange={(e) => onCookieConsentChange(category, e.target.checked)}
                    disabled={config.required}
                    className="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-300">
                    {config.required ? 'Required' : 'Allow'}
                  </span>
                </label>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * Summary Step Component
 */
function SummaryStep({ consents, cookieConsents }) {
  const approvedPurposes = Object.entries(consents).filter(([_, granted]) => granted);
  const approvedCookies = Object.entries(cookieConsents).filter(([_, granted]) => granted);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-green-400 mb-2">
          Review Your Privacy Choices
        </h3>
        <p className="text-gray-300">
          Please review your selections before saving
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Data Processing Summary */}
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-3 flex items-center">
            <span className="text-green-400 mr-2">📋</span>
            Data Processing
          </h4>
          <div className="space-y-2">
            {Object.entries(CONSENT_PURPOSES).map(([purpose, config]) => {
              const isApproved = config.required || consents[purpose];
              return (
                <div key={purpose} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{config.title}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    isApproved 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}>
                    {isApproved ? 'Allowed' : 'Denied'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cookie Summary */}
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-3 flex items-center">
            <span className="text-green-400 mr-2">🍪</span>
            Cookie Preferences
          </h4>
          <div className="space-y-2">
            {Object.entries(COOKIE_CATEGORIES).map(([category, config]) => {
              const isApproved = cookieConsents[category];
              return (
                <div key={category} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{config.title}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    isApproved 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}>
                    {isApproved ? 'Allowed' : 'Denied'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-blue-900 bg-opacity-50 border border-blue-500 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          <strong>Remember:</strong> You can change these preferences at any time 
          in your Privacy Settings dashboard. We'll notify you if we need additional 
          consent for new features.
        </p>
      </div>
    </div>
  );
}

export default GDPRConsentModal;