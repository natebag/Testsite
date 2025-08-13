/**
 * Privacy Settings Dashboard
 * 
 * Xbox 360-style privacy dashboard for GDPR compliance including:
 * - Current consent status overview
 * - Data export requests
 * - Data deletion requests  
 * - Privacy settings management
 * - Audit trail viewing
 * 
 * @author Claude Code - Security & Privacy Architect
 * @version 1.0.0
 * @created 2025-08-13
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Privacy Settings Dashboard Component
 */
export function PrivacySettingsDashboard({ 
  userId,
  onUpdateConsent,
  onRequestDataExport,
  onRequestDataDeletion,
  gdprService
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await gdprService.getComplianceDashboard(userId);
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', title: 'Privacy Overview', icon: '🛡️' },
    { id: 'consents', title: 'Data Consent', icon: '✅' },
    { id: 'exports', title: 'Data Exports', icon: '📥' },
    { id: 'deletion', title: 'Data Deletion', icon: '🗑️' },
    { id: 'audit', title: 'Activity Log', icon: '📋' }
  ];

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-green-500 rounded-lg p-8">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-green-400">Loading your privacy dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 border-2 border-red-500 rounded-lg p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-400 mb-4">Error loading privacy dashboard</p>
          <p className="text-gray-300 text-sm">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-green-500 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4 border-b border-green-500">
        <h2 className="text-2xl font-bold text-white">Privacy & Data Control</h2>
        <p className="text-green-200 text-sm mt-1">
          Manage your data privacy preferences and GDPR rights
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex space-x-1 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="text-sm font-medium">{tab.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab data={dashboardData} />
            )}
            {activeTab === 'consents' && (
              <ConsentsTab 
                data={dashboardData} 
                onUpdateConsent={onUpdateConsent}
                onRefresh={loadDashboardData}
              />
            )}
            {activeTab === 'exports' && (
              <ExportsTab 
                data={dashboardData} 
                onRequestDataExport={onRequestDataExport}
                onRefresh={loadDashboardData}
              />
            )}
            {activeTab === 'deletion' && (
              <DeletionTab 
                data={dashboardData} 
                onRequestDataDeletion={onRequestDataDeletion}
                onRefresh={loadDashboardData}
              />
            )}
            {activeTab === 'audit' && (
              <AuditTab data={dashboardData} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Overview Tab Component
 */
function OverviewTab({ data }) {
  const activeConsents = data.consents.filter(c => c.status === 'active').length;
  const totalConsents = data.consents.length;
  const recentExports = data.dataExports.filter(e => 
    new Date(e.request_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-green-400 mb-2">
          Your Privacy Status
        </h3>
        <p className="text-gray-300">
          Quick overview of your data privacy and GDPR compliance status
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatusCard
          icon="✅"
          title="Active Consents"
          value={`${activeConsents}/${totalConsents}`}
          description="Data processing permissions"
          color="green"
        />
        <StatusCard
          icon="📥"
          title="Recent Exports"
          value={recentExports}
          description="Data exports in last 30 days"
          color="blue"
        />
        <StatusCard
          icon="🔒"
          title="Data Categories"
          value={data.dataCategories.length}
          description="Types of data we process"
          color="purple"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="text-green-400 mr-2">📊</span>
          Recent Privacy Activity
        </h4>
        
        <div className="space-y-3">
          {data.consents.slice(0, 3).map((consent, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
              <div>
                <p className="text-white text-sm font-medium">{consent.purpose}</p>
                <p className="text-gray-400 text-xs">
                  {new Date(consent.date).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                consent.status === 'active' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-red-600 text-white'
              }`}>
                {consent.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* GDPR Rights Summary */}
      <div className="bg-blue-900 bg-opacity-50 border border-blue-500 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-200 mb-4">
          Your GDPR Rights
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span className="text-blue-200">Right to be informed</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span className="text-blue-200">Right of access</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span className="text-blue-200">Right to rectification</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span className="text-blue-200">Right to erasure</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span className="text-blue-200">Right to data portability</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span className="text-blue-200">Right to object</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Consents Tab Component
 */
function ConsentsTab({ data, onUpdateConsent, onRefresh }) {
  const [updating, setUpdating] = useState({});

  const handleConsentToggle = async (purpose, currentStatus) => {
    setUpdating(prev => ({ ...prev, [purpose]: true }));
    try {
      await onUpdateConsent(purpose, !currentStatus);
      await onRefresh();
    } catch (error) {
      console.error('Error updating consent:', error);
    } finally {
      setUpdating(prev => ({ ...prev, [purpose]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-green-400 mb-2">
          Data Processing Consent
        </h3>
        <p className="text-gray-300">
          Manage your consent for different types of data processing
        </p>
      </div>

      <div className="space-y-4">
        {data.consents.map((consent, index) => (
          <motion.div
            key={index}
            className="bg-gray-800 border border-gray-600 rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-white">
                  {consent.purpose.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </h4>
                <p className="text-gray-400 text-sm mt-1">
                  Last updated: {new Date(consent.date).toLocaleDateString()}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    consent.status === 'active' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}>
                    {consent.status}
                  </span>
                  {consent.consentGiven && (
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                      Consent Given
                    </span>
                  )}
                </div>
              </div>
              
              <div className="ml-4">
                <button
                  onClick={() => handleConsentToggle(consent.purpose, consent.consentGiven)}
                  disabled={updating[consent.purpose]}
                  className={`px-4 py-2 rounded transition-colors ${
                    consent.consentGiven
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-green-600 hover:bg-green-500 text-white'
                  } disabled:opacity-50`}
                >
                  {updating[consent.purpose] ? (
                    'Updating...'
                  ) : consent.consentGiven ? (
                    'Withdraw'
                  ) : (
                    'Grant'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-yellow-900 bg-opacity-50 border border-yellow-500 rounded-lg p-4">
        <p className="text-yellow-200 text-sm">
          <strong>Note:</strong> Some data processing is essential for platform functionality 
          and cannot be disabled. Withdrawing consent for optional features may limit your 
          gaming experience.
        </p>
      </div>
    </div>
  );
}

/**
 * Exports Tab Component
 */
function ExportsTab({ data, onRequestDataExport, onRefresh }) {
  const [requesting, setRequesting] = useState(false);

  const handleRequestExport = async () => {
    setRequesting(true);
    try {
      await onRequestDataExport({
        format: 'json',
        categories: data.dataCategories
      });
      await onRefresh();
    } catch (error) {
      console.error('Error requesting export:', error);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-green-400 mb-2">
          Data Export Requests
        </h3>
        <p className="text-gray-300">
          Download all your personal data (Right to Data Portability)
        </p>
      </div>

      {/* Request New Export */}
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">
          Request New Data Export
        </h4>
        <p className="text-gray-300 text-sm mb-4">
          Get a complete copy of all your personal data stored on our platform. 
          This includes your profile, gaming stats, voting history, and more.
        </p>
        <button
          onClick={handleRequestExport}
          disabled={requesting}
          className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 transition-colors"
        >
          {requesting ? 'Processing Request...' : 'Request Data Export'}
        </button>
      </div>

      {/* Previous Exports */}
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">
          Export History
        </h4>
        
        {data.dataExports.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No data exports requested yet
          </p>
        ) : (
          <div className="space-y-3">
            {data.dataExports.map((exportReq, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                <div>
                  <p className="text-white text-sm font-medium">
                    Export Request #{exportReq.id.slice(-8)}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Requested: {new Date(exportReq.request_date).toLocaleDateString()}
                  </p>
                  {exportReq.completed_at && (
                    <p className="text-gray-400 text-xs">
                      Completed: {new Date(exportReq.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    exportReq.status === 'completed' 
                      ? 'bg-green-600 text-white'
                      : exportReq.status === 'processing'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}>
                    {exportReq.status}
                  </span>
                  
                  {exportReq.status === 'completed' && exportReq.export_url && (
                    <a
                      href={exportReq.export_url}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Deletion Tab Component
 */
function DeletionTab({ data, onRequestDataDeletion, onRefresh }) {
  const [requesting, setRequesting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleRequestDeletion = async () => {
    setRequesting(true);
    try {
      await onRequestDataDeletion({
        deletionType: 'full',
        reason: 'User requested account deletion'
      });
      await onRefresh();
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error requesting deletion:', error);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-red-400 mb-2">
          Data Deletion Requests
        </h3>
        <p className="text-gray-300">
          Request permanent deletion of your account and data (Right to be Forgotten)
        </p>
      </div>

      {/* Deletion Requests */}
      {data.deletionRequests.length > 0 && (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4">
            Deletion Request History
          </h4>
          
          <div className="space-y-3">
            {data.deletionRequests.map((delReq, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                <div>
                  <p className="text-white text-sm font-medium">
                    Deletion Request #{delReq.id.slice(-8)}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Requested: {new Date(delReq.request_date).toLocaleDateString()}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Type: {delReq.deletion_type}
                  </p>
                </div>
                
                <span className={`px-2 py-1 rounded text-xs ${
                  delReq.status === 'completed' 
                    ? 'bg-red-600 text-white'
                    : delReq.status === 'pending_verification'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  {delReq.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Account Deletion */}
      <div className="bg-red-900 bg-opacity-30 border-2 border-red-500 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-red-300 mb-4">
          ⚠️ Delete My Account
        </h4>
        
        <div className="space-y-4 text-sm text-red-200">
          <p>
            <strong>Warning:</strong> This action will permanently delete your account 
            and all associated data. This includes:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Your gaming profile and statistics</li>
            <li>Clan memberships and history</li>
            <li>Voting records and content submissions</li>
            <li>Achievement progress and rewards</li>
            <li>All personal information</li>
          </ul>
          <p>
            <strong>This action cannot be undone.</strong> You will receive an email 
            to verify this request before deletion occurs.
          </p>
        </div>

        {!showConfirmation ? (
          <button
            onClick={() => setShowConfirmation(true)}
            className="mt-6 px-6 py-3 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
          >
            Request Account Deletion
          </button>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-red-200 font-semibold">
              Are you absolutely sure you want to delete your account?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleRequestDeletion}
                disabled={requesting}
                className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {requesting ? 'Processing...' : 'Yes, Delete My Account'}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Audit Tab Component
 */
function AuditTab({ data }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-green-400 mb-2">
          Privacy Activity Log
        </h3>
        <p className="text-gray-300">
          Track all privacy-related activities on your account
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">
          Recent Activity
        </h4>
        
        {data.processingActivities.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No recent privacy activity
          </p>
        ) : (
          <div className="space-y-3">
            {data.processingActivities.map((activity, index) => (
              <div key={index} className="flex items-start justify-between py-3 border-b border-gray-700 last:border-b-0">
                <div>
                  <p className="text-white text-sm font-medium">
                    {activity.activity_type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Purpose: {activity.purpose}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Categories: {activity.data_categories.join(', ')}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Legal Basis: {activity.legal_basis}
                  </p>
                </div>
                
                <div className="text-gray-500 text-xs">
                  {new Date(activity.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Status Card Component
 */
function StatusCard({ icon, title, value, description, color }) {
  const colorClasses = {
    green: 'border-green-500 bg-green-900 bg-opacity-20',
    blue: 'border-blue-500 bg-blue-900 bg-opacity-20',
    purple: 'border-purple-500 bg-purple-900 bg-opacity-20',
    red: 'border-red-500 bg-red-900 bg-opacity-20'
  };

  return (
    <motion.div
      className={`border rounded-lg p-6 ${colorClasses[color]}`}
      whileHover={{ scale: 1.05 }}
    >
      <div className="text-center">
        <div className="text-3xl mb-2">{icon}</div>
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        <div className="text-2xl font-bold text-green-400 my-2">{value}</div>
        <p className="text-gray-300 text-sm">{description}</p>
      </div>
    </motion.div>
  );
}

export default PrivacySettingsDashboard;