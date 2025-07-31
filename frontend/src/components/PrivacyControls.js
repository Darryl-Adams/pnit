import React, { useState, useEffect } from 'react';
import { useAuth, authenticatedFetch } from '../utils/auth';
import { useAccessibility } from './AccessibilityProvider';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorBoundary';
import { SettingsContainer } from './SettingsComponents';

// Data Privacy Controls
export const DataPrivacyControls = () => {
  const { user, logout } = useAuth();
  const { announce } = useAccessibility();
  const [privacySettings, setPrivacySettings] = useState({
    data_processing_consent: true,
    marketing_consent: false,
    analytics_consent: true,
    third_party_sharing: false,
    data_retention_period: 365,
    automatic_deletion: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/settings/privacy');
      if (response.ok) {
        const data = await response.json();
        setPrivacySettings(prev => ({ ...prev, ...data.privacy_settings }));
      }
    } catch (err) {
      setError('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await authenticatedFetch('/api/settings/privacy', {
        method: 'PUT',
        body: JSON.stringify({ privacy_settings: privacySettings })
      });

      if (!response.ok) {
        throw new Error('Failed to save privacy settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      announce('Privacy settings saved successfully', 'polite');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <SettingsContainer title="Data Privacy" description="Control how your data is used and stored">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
        </div>
      </SettingsContainer>
    );
  }

  return (
    <SettingsContainer 
      title="Data Privacy" 
      description="Control how your personal data is collected, used, and stored"
    >
      {error && (
        <ErrorAlert 
          error={error} 
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-green-800 dark:text-green-200">
              Privacy settings updated successfully
            </p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Consent Management */}
        <fieldset>
          <legend className="text-base font-medium text-gray-900 dark:text-white mb-4">
            Data Processing Consent
          </legend>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label htmlFor="data-processing" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Essential Data Processing
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Required for core PNIT functionality (account management, connection storage)
                </p>
              </div>
              <input
                id="data-processing"
                type="checkbox"
                checked={privacySettings.data_processing_consent}
                onChange={(e) => updateSetting('data_processing_consent', e.target.checked)}
                disabled={true}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded opacity-50"
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label htmlFor="analytics-consent" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Analytics & Performance
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Help us improve PNIT by collecting anonymous usage statistics
                </p>
              </div>
              <input
                id="analytics-consent"
                type="checkbox"
                checked={privacySettings.analytics_consent}
                onChange={(e) => updateSetting('analytics_consent', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label htmlFor="marketing-consent" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Marketing Communications
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Receive updates about new features and product improvements
                </p>
              </div>
              <input
                id="marketing-consent"
                type="checkbox"
                checked={privacySettings.marketing_consent}
                onChange={(e) => updateSetting('marketing_consent', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label htmlFor="third-party-sharing" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Third-Party Data Sharing
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Allow sharing anonymized data with research partners (currently disabled)
                </p>
              </div>
              <input
                id="third-party-sharing"
                type="checkbox"
                checked={privacySettings.third_party_sharing}
                onChange={(e) => updateSetting('third_party_sharing', e.target.checked)}
                disabled={true}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded opacity-50"
              />
            </div>
          </div>
        </fieldset>

        {/* Data Retention */}
        <fieldset>
          <legend className="text-base font-medium text-gray-900 dark:text-white mb-4">
            Data Retention
          </legend>
          <div className="space-y-4">
            <div>
              <label htmlFor="retention-period" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Automatic Data Deletion Period
              </label>
              <select
                id="retention-period"
                value={privacySettings.data_retention_period}
                onChange={(e) => updateSetting('data_retention_period', parseInt(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              >
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>6 months</option>
                <option value={365}>1 year</option>
                <option value={730}>2 years</option>
                <option value={-1}>Never (manual deletion only)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Automatically delete query history and temporary data after this period
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="automatic-deletion" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Automatic Deletion
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically clean up old data based on retention period
                </p>
              </div>
              <input
                id="automatic-deletion"
                type="checkbox"
                checked={privacySettings.automatic_deletion}
                onChange={(e) => updateSetting('automatic_deletion', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
            </div>
          </div>
        </fieldset>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={savePrivacySettings}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save Privacy Settings'
            )}
          </button>
        </div>
      </div>
    </SettingsContainer>
  );
};

// Account Deletion Component
export const AccountDeletion = () => {
  const { user, logout } = useAuth();
  const { announce } = useAccessibility();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      setError('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      
      announce('Deleting account', 'polite');

      const response = await authenticatedFetch('/api/settings/delete-account', {
        method: 'DELETE',
        body: JSON.stringify({ confirmation: confirmationText })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      announce('Account deleted successfully. You will be logged out.', 'assertive');
      
      // Log out and redirect after a brief delay
      setTimeout(() => {
        logout();
        window.location.href = '/';
      }, 2000);

    } catch (err) {
      setError(err.message);
      announce('Account deletion failed', 'assertive');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SettingsContainer 
      title="Delete Account" 
      description="Permanently delete your account and all associated data"
    >
      {error && (
        <ErrorAlert 
          error={error} 
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}

      <div className="space-y-6">
        {/* Warning */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                This action cannot be undone
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>Deleting your account will:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Permanently delete all your connections data</li>
                  <li>Remove all query history and conversations</li>
                  <li>Revoke all API keys and access tokens</li>
                  <li>Delete your user profile and preferences</li>
                  <li>Cancel any active subscriptions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Account Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Account Summary
          </h4>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Account created:</span>
              <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span>Email:</span>
              <span>{user?.email || 'Not provided'}</span>
            </div>
            <div className="flex justify-between">
              <span>User ID:</span>
              <span>{user?.id}</span>
            </div>
          </div>
        </div>

        {/* Data Export Reminder */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            💾 Export Your Data First
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
            Before deleting your account, consider exporting your data for your records.
          </p>
          <a 
            href="#data-export" 
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            Go to Data Export →
          </a>
        </div>

        {/* Deletion Confirmation */}
        {!showConfirmation ? (
          <div className="flex justify-start">
            <button
              onClick={() => setShowConfirmation(true)}
              className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-700 text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete My Account
            </button>
          </div>
        ) : (
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-900 dark:text-red-200 mb-3">
              Confirm Account Deletion
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              To confirm deletion, please type <strong>"DELETE MY ACCOUNT"</strong> in the field below:
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="confirm-deletion" className="sr-only">
                  Type DELETE MY ACCOUNT to confirm
                </label>
                <input
                  id="confirm-deletion"
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  disabled={deleting}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || confirmationText !== 'DELETE MY ACCOUNT'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <LoadingSpinner size="sm" color="white" className="mr-2" />
                      Deleting Account...
                    </>
                  ) : (
                    'Confirm Deletion'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setConfirmationText('');
                    setError(null);
                  }}
                  disabled={deleting}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SettingsContainer>
  );
};

export default { DataPrivacyControls, AccountDeletion };