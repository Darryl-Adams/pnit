import React, { useState, useEffect } from 'react';
import { useAuth, authenticatedFetch } from '../utils/auth';
import { useAccessibility, AccessibilitySettings } from './AccessibilityProvider';
import { LoadingSpinner, SkeletonLoader } from './LoadingSpinner';
import { ErrorAlert } from './ErrorBoundary';

// Main settings container
export const SettingsContainer = ({ children, title, description, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-lg ${className}`}>
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

// User preferences management
export const UserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      browser: true,
      query_results: true,
      system_updates: false
    },
    privacy: {
      data_retention_days: 365,
      allow_analytics: true,
      share_usage_stats: false
    },
    interface: {
      theme: 'auto', // light, dark, auto
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      items_per_page: 25
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load user preferences
  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/settings/preferences`);
      if (response.ok) {
        const data = await response.json();
        setPreferences(prev => ({ ...prev, ...data.preferences }));
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await authenticatedFetch('/api/settings/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences })
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (category, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <SettingsContainer title="User Preferences" description="Customize your PNIT experience">
        <SkeletonLoader lines={8} height="h-6" />
      </SettingsContainer>
    );
  }

  return (
    <SettingsContainer 
      title="User Preferences" 
      description="Customize your PNIT experience and notification settings"
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
              Preferences saved successfully!
            </p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Notifications */}
        <fieldset>
          <legend className="text-base font-medium text-gray-900 dark:text-white mb-4">
            Notifications
          </legend>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="email-notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Notifications
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receive email updates about your queries and connections
                </p>
              </div>
              <input
                id="email-notifications"
                type="checkbox"
                checked={preferences.notifications.email}
                onChange={(e) => updatePreference('notifications', 'email', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="browser-notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Browser Notifications
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Show desktop notifications for important updates
                </p>
              </div>
              <input
                id="browser-notifications"
                type="checkbox"
                checked={preferences.notifications.browser}
                onChange={(e) => updatePreference('notifications', 'browser', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="query-notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Query Results
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Notify when query processing is complete
                </p>
              </div>
              <input
                id="query-notifications"
                type="checkbox"
                checked={preferences.notifications.query_results}
                onChange={(e) => updatePreference('notifications', 'query_results', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
            </div>
          </div>
        </fieldset>

        {/* Interface */}
        <fieldset>
          <legend className="text-base font-medium text-gray-900 dark:text-white mb-4">
            Interface
          </legend>
          <div className="space-y-4">
            <div>
              <label htmlFor="theme-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <select
                id="theme-select"
                value={preferences.interface.theme}
                onChange={(e) => updatePreference('interface', 'theme', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div>
              <label htmlFor="items-per-page" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Items per page
              </label>
              <select
                id="items-per-page"
                value={preferences.interface.items_per_page}
                onChange={(e) => updatePreference('interface', 'items_per_page', parseInt(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div>
              <label htmlFor="timezone-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timezone
              </label>
              <select
                id="timezone-select"
                value={preferences.interface.timezone}
                onChange={(e) => updatePreference('interface', 'timezone', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Privacy */}
        <fieldset>
          <legend className="text-base font-medium text-gray-900 dark:text-white mb-4">
            Privacy
          </legend>
          <div className="space-y-4">
            <div>
              <label htmlFor="data-retention" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Retention (days)
              </label>
              <select
                id="data-retention"
                value={preferences.privacy.data_retention_days}
                onChange={(e) => updatePreference('privacy', 'data_retention_days', parseInt(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              >
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
                <option value={-1}>Never delete</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Automatically delete old query history after this period
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="allow-analytics" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Allow Analytics
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Help improve PNIT by sharing anonymous usage data
                </p>
              </div>
              <input
                id="allow-analytics"
                type="checkbox"
                checked={preferences.privacy.allow_analytics}
                onChange={(e) => updatePreference('privacy', 'allow_analytics', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
            </div>
          </div>
        </fieldset>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </div>
    </SettingsContainer>
  );
};

// API Key Management Component
export const APIKeyManagement = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/settings/api-keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys);
      }
    } catch (err) {
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;

    try {
      setCreating(true);
      setError(null);

      const response = await authenticatedFetch('/api/settings/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to create API key');
      }

      const data = await response.json();
      setApiKeys(prev => [...prev, data.key]);
      setNewKeyName('');
      setShowCreateForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const revokeApiKey = async (keyId) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/settings/api-keys/${keyId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to revoke API key');
      }

      setApiKeys(prev => prev.filter(key => key.id !== keyId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <SettingsContainer title="API Keys" description="Manage your API access keys">
        <SkeletonLoader lines={4} height="h-8" />
      </SettingsContainer>
    );
  }

  return (
    <SettingsContainer 
      title="API Keys" 
      description="Create and manage API keys for programmatic access to PNIT"
    >
      {error && (
        <ErrorAlert 
          error={error} 
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}

      <div className="space-y-6">
        {/* Create New Key */}
        <div>
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New API Key
            </button>
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Create New API Key
              </h4>
              <div className="flex space-x-3">
                <div className="flex-1">
                  <label htmlFor="key-name" className="sr-only">
                    API Key Name
                  </label>
                  <input
                    id="key-name"
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Enter a name for this key..."
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button
                  onClick={createApiKey}
                  disabled={creating || !newKeyName.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    'Create'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewKeyName('');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* API Keys List */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Your API Keys
          </h4>
          {apiKeys.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <p>No API keys created yet</p>
              <p className="text-sm mt-1">Create your first API key to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                      {key.name}
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Created {new Date(key.created_at).toLocaleDateString()}
                      {key.last_used && ` • Last used ${new Date(key.last_used).toLocaleDateString()}`}
                    </p>
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-2 inline-block font-mono">
                      {key.key_preview}...
                    </code>
                  </div>
                  <button
                    onClick={() => revokeApiKey(key.id)}
                    className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                    aria-label={`Revoke ${key.name} API key`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Documentation */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Using Your API Keys
          </h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>Include your API key in requests using the Authorization header:</p>
            <code className="block bg-blue-100 dark:bg-blue-900/40 p-2 rounded font-mono text-xs">
              Authorization: Bearer YOUR_API_KEY
            </code>
            <p className="text-xs mt-2">
              <a href="/docs/api" className="underline hover:no-underline">
                View full API documentation →
              </a>
            </p>
          </div>
        </div>
      </div>
    </SettingsContainer>
  );
};

export default { SettingsContainer, UserPreferences, APIKeyManagement };