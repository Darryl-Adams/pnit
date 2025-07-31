import Head from 'next/head';
import { useState } from 'react';
import PNITLayout from '../../components/PNITLayout';
import { AccessibilityProvider, AccessibilitySettings } from '../../components/AccessibilityProvider';
import { UserPreferences, APIKeyManagement } from '../../components/SettingsComponents';
import { DataExport, DataImport } from '../../components/DataManagement';
import { DataPrivacyControls, AccountDeletion } from '../../components/PrivacyControls';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('preferences');

  const tabs = [
    { id: 'preferences', label: 'Preferences', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'accessibility', label: 'Accessibility', icon: 'M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z' },
    { id: 'api-keys', label: 'API Keys', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
    { id: 'data-export', label: 'Export Data', icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'data-import', label: 'Import Data', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m-3 3V8' },
    { id: 'privacy', label: 'Privacy', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'account', label: 'Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Announce tab change for screen readers
    const tabLabel = tabs.find(tab => tab.id === tabId)?.label;
    if (tabLabel) {
      // This would use the accessibility context in a real implementation
      console.log(`Switched to ${tabLabel} tab`);
    }
  };

  const handleKeyDown = (e, tabId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTabChange(tabId);
    }
  };

  return (
    <AccessibilityProvider>
      <PNITLayout>
        <Head>
          <title>Settings | PNIT</title>
          <meta name="description" content="Manage your PNIT account settings, preferences, and privacy controls" />
        </Head>
        
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Manage your account preferences, privacy settings, and data
            </p>
          </header>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:w-64 flex-shrink-0">
              <nav className="space-y-1" aria-label="Settings navigation">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    onKeyDown={(e) => handleKeyDown(e, tab.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                      focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900
                      ${activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                  >
                    <div className="flex items-center">
                      <svg 
                        className="w-5 h-5 mr-3 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                      </svg>
                      {tab.label}
                    </div>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              <div className="space-y-6">
                {activeTab === 'preferences' && <UserPreferences />}
                {activeTab === 'accessibility' && (
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <AccessibilitySettings />
                  </div>
                )}
                {activeTab === 'api-keys' && <APIKeyManagement />}
                {activeTab === 'data-export' && <DataExport />}
                {activeTab === 'data-import' && <DataImport />}
                {activeTab === 'privacy' && <DataPrivacyControls />}
                {activeTab === 'account' && <AccountDeletion />}
              </div>
            </main>
          </div>

          {/* Help Section */}
          <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Need Help?
            </h2>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>
                If you have questions about your settings or need assistance, check out our{' '}
                <a href="/docs" className="underline hover:no-underline font-medium">
                  documentation
                </a>{' '}
                or{' '}
                <a href="/contact" className="underline hover:no-underline font-medium">
                  contact support
                </a>.
              </p>
              <div className="flex flex-wrap gap-4 mt-4">
                <a 
                  href="/docs/privacy" 
                  className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Privacy Policy
                </a>
                <a 
                  href="/docs/terms" 
                  className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Terms of Service
                </a>
                <a 
                  href="/docs/api" 
                  className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  API Documentation
                </a>
              </div>
            </div>
          </div>
        </div>
      </PNITLayout>
    </AccessibilityProvider>
  );
}
