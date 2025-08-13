/**
 * Privacy Notice Components
 * 
 * Reusable privacy notices for forms and data collection points
 * to ensure GDPR transparency requirements are met throughout the platform.
 * 
 * @author Claude Code - Security & Privacy Architect
 * @version 1.0.0
 * @created 2025-08-13
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Privacy notice configurations for different data collection contexts
 */
const PRIVACY_NOTICES = {
  PROFILE_CREATION: {
    title: 'Profile Data Processing',
    purpose: 'To create and manage your gaming profile',
    dataCollected: ['Username', 'Display name', 'Avatar image', 'Bio', 'Gaming preferences'],
    legalBasis: 'Contract performance',
    retention: 'Account duration + 1 year',
    sharing: 'Publicly visible profile information only',
    rights: ['Access', 'Rectification', 'Erasure', 'Portability']
  },
  
  VOTING_PARTICIPATION: {
    title: 'Voting Data Processing',
    purpose: 'To enable community governance participation',
    dataCollected: ['Vote choices', 'Voting patterns', 'MLG token transactions', 'Timestamps'],
    legalBasis: 'Contract performance',
    retention: '3 years for governance transparency',
    sharing: 'Voting results are public, voter identity protected',
    rights: ['Access', 'Rectification', 'Portability']
  },
  
  CLAN_MEMBERSHIP: {
    title: 'Clan Membership Processing',
    purpose: 'To manage clan memberships and activities',
    dataCollected: ['Clan roles', 'Activity history', 'Social interactions', 'Performance stats'],
    legalBasis: 'Contract performance',
    retention: 'Account duration + 1 year',
    sharing: 'Clan members and leadership only',
    rights: ['Access', 'Rectification', 'Erasure', 'Portability']
  },
  
  CONTENT_SUBMISSION: {
    title: 'Content Submission Processing',
    purpose: 'To manage user-generated content and moderation',
    dataCollected: ['Content data', 'Metadata', 'Submission timestamps', 'Moderation status'],
    legalBasis: 'Contract performance',
    retention: 'Account duration + 2 years',
    sharing: 'Content visible to community, metadata internal',
    rights: ['Access', 'Rectification', 'Erasure', 'Portability']
  },
  
  ANALYTICS: {
    title: 'Analytics Data Processing',
    purpose: 'To improve platform features and user experience',
    dataCollected: ['Usage patterns', 'Performance metrics', 'Feature interactions', 'Session data'],
    legalBasis: 'Legitimate interest',
    retention: '2 years',
    sharing: 'Anonymous aggregated data only',
    rights: ['Access', 'Object', 'Erasure']
  },
  
  MARKETING: {
    title: 'Marketing Communications',
    purpose: 'To send platform updates and gaming content',
    dataCollected: ['Email address', 'Communication preferences', 'Engagement metrics'],
    legalBasis: 'Consent',
    retention: 'Until consent withdrawn',
    sharing: 'No sharing with third parties',
    rights: ['Access', 'Rectification', 'Erasure', 'Portability', 'Withdraw consent']
  }
};

/**
 * Main Privacy Notice Component
 */
export function PrivacyNotice({ 
  type, 
  expanded = false, 
  showConsent = false,
  onConsentChange,
  consentRequired = false,
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [consentGiven, setConsentGiven] = useState(false);
  
  const notice = PRIVACY_NOTICES[type];
  
  if (!notice) {
    console.warn(`Privacy notice type "${type}" not found`);
    return null;
  }

  const handleConsentChange = (granted) => {
    setConsentGiven(granted);
    if (onConsentChange) {
      onConsentChange(type, granted);
    }
  };

  return (
    <div className={`bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-blue-400">🔒</span>
          <h4 className="text-sm font-semibold text-blue-200">
            Privacy Notice: {notice.title}
          </h4>
        </div>
        
        {!expanded && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-400 hover:text-blue-300 text-xs"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>

      <p className="text-blue-200 text-xs mt-2">
        <strong>Purpose:</strong> {notice.purpose}
      </p>

      <AnimatePresence>
        {(isExpanded || expanded) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 text-xs text-blue-200"
          >
            <div>
              <strong>Data Collected:</strong>
              <ul className="list-disc list-inside ml-2 mt-1">
                {notice.dataCollected.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <strong>Legal Basis:</strong> {notice.legalBasis}
            </div>
            
            <div>
              <strong>Data Retention:</strong> {notice.retention}
            </div>
            
            <div>
              <strong>Data Sharing:</strong> {notice.sharing}
            </div>
            
            <div>
              <strong>Your Rights:</strong> {notice.rights.join(', ')}
            </div>
            
            <div className="text-blue-300">
              <a href="/privacy-policy" className="underline hover:text-blue-200">
                View full Privacy Policy
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showConsent && (
        <div className="mt-3 pt-3 border-t border-blue-500">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => handleConsentChange(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              required={consentRequired}
            />
            <span className="text-blue-200 text-xs">
              I consent to the processing of my data for this purpose
              {consentRequired && <span className="text-red-400 ml-1">*</span>}
            </span>
          </label>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Privacy Notice for forms
 */
export function CompactPrivacyNotice({ 
  types = [], 
  onConsentChange,
  className = ''
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [consents, setConsents] = useState({});

  const handleConsentChange = (type, granted) => {
    const newConsents = { ...consents, [type]: granted };
    setConsents(newConsents);
    
    if (onConsentChange) {
      onConsentChange(newConsents);
    }
  };

  return (
    <div className={`bg-gray-800 border border-gray-600 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-blue-400">🔒</span>
          <span className="text-sm font-medium text-white">
            Data Processing Notice
          </span>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-400 hover:text-blue-300 text-xs"
        >
          {showDetails ? 'Hide' : 'Details'}
        </button>
      </div>

      <p className="text-gray-300 text-xs mt-1">
        We process your data to provide requested services. 
        <a href="/privacy-policy" className="text-blue-400 underline ml-1">
          Learn more
        </a>
      </p>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2"
          >
            {types.map((type) => {
              const notice = PRIVACY_NOTICES[type];
              if (!notice) return null;
              
              return (
                <div key={type} className="bg-gray-700 rounded p-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-medium text-white">
                        {notice.title}
                      </h5>
                      <p className="text-xs text-gray-300 mt-1">
                        {notice.purpose}
                      </p>
                    </div>
                    
                    {notice.legalBasis === 'Consent' && (
                      <label className="flex items-center ml-2">
                        <input
                          type="checkbox"
                          checked={consents[type] || false}
                          onChange={(e) => handleConsentChange(type, e.target.checked)}
                          className="form-checkbox h-3 w-3 text-blue-600 rounded"
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Privacy Notice for specific form fields
 */
export function FieldPrivacyNotice({ 
  fieldName, 
  purpose, 
  required = false,
  className = '' 
}) {
  return (
    <div className={`text-xs text-gray-400 mt-1 ${className}`}>
      <span className="flex items-center space-x-1">
        <span>🔒</span>
        <span>
          This {fieldName} is {required ? 'required' : 'optional'} for {purpose}.
        </span>
        <a 
          href="/privacy-policy" 
          className="text-blue-400 hover:text-blue-300 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>
      </span>
    </div>
  );
}

/**
 * Data Subject Rights Notice
 */
export function DataSubjectRightsNotice({ className = '' }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const rights = [
    {
      name: 'Right to be Informed',
      description: 'Know what data we collect and how we use it'
    },
    {
      name: 'Right of Access',
      description: 'Request a copy of your personal data'
    },
    {
      name: 'Right to Rectification',
      description: 'Correct inaccurate or incomplete data'
    },
    {
      name: 'Right to Erasure',
      description: 'Request deletion of your personal data'
    },
    {
      name: 'Right to Data Portability',
      description: 'Export your data in a machine-readable format'
    },
    {
      name: 'Right to Object',
      description: 'Object to certain types of data processing'
    }
  ];

  return (
    <div className={`bg-green-900 bg-opacity-20 border border-green-500 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-green-200">
          Your Data Protection Rights
        </h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-green-400 hover:text-green-300 text-xs"
        >
          {isExpanded ? 'Hide' : 'Learn More'}
        </button>
      </div>

      <p className="text-green-200 text-xs mt-2">
        Under GDPR, you have several rights regarding your personal data.
      </p>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2"
          >
            {rights.map((right, index) => (
              <div key={index} className="bg-green-800 bg-opacity-30 rounded p-2">
                <h5 className="text-xs font-medium text-green-200">
                  {right.name}
                </h5>
                <p className="text-xs text-green-300 mt-1">
                  {right.description}
                </p>
              </div>
            ))}
            
            <div className="text-green-300 text-xs mt-3">
              <a 
                href="/privacy-settings" 
                className="underline hover:text-green-200"
              >
                Manage your privacy settings
              </a>
              {' or '}
              <a 
                href="/contact?subject=data-protection" 
                className="underline hover:text-green-200"
              >
                Contact our Data Protection Officer
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Cookie Usage Notice for specific features
 */
export function CookieUsageNotice({ 
  cookies = [], 
  purpose,
  className = '' 
}) {
  return (
    <div className={`bg-orange-900 bg-opacity-20 border border-orange-500 rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-orange-400">🍪</span>
        <h4 className="text-sm font-semibold text-orange-200">
          Cookie Usage
        </h4>
      </div>
      
      <p className="text-orange-200 text-xs mt-2">
        This feature uses cookies for {purpose}.
      </p>
      
      {cookies.length > 0 && (
        <div className="mt-2">
          <p className="text-orange-300 text-xs font-medium">Types:</p>
          <ul className="list-disc list-inside text-xs text-orange-200 ml-2">
            {cookies.map((cookie, index) => (
              <li key={index}>{cookie}</li>
            ))}
          </ul>
        </div>
      )}
      
      <p className="text-orange-300 text-xs mt-2">
        <a 
          href="/cookie-settings" 
          className="underline hover:text-orange-200"
        >
          Manage cookie preferences
        </a>
      </p>
    </div>
  );
}

export default PrivacyNotice;