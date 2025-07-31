import Head from 'next/head';
import { useState } from 'react';
import PNITLayout from '../../components/PNITLayout';
import { AccessibilityProvider } from '../../components/AccessibilityProvider';
import { QueryHistoryList } from '../../components/HistoryComponents';
import { AnalyticsDashboard } from '../../components/AnalyticsComponents';

export default function History() {
  const [activeTab, setActiveTab] = useState('history');

  const tabs = [
    { 
      id: 'history', 
      label: 'Query History', 
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' 
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
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
          <title>History & Analytics | PNIT</title>
          <meta name="description" content="View your query history, analytics, and connection insights" />
        </Head>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  onKeyDown={(e) => handleKeyDown(e, tab.id)}
                  className={`
                    flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900
                    ${activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <svg 
                    className="w-5 h-5 mr-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <main id="main-content">
            {activeTab === 'history' && <QueryHistoryList />}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
          </main>
        </div>
      </PNITLayout>
    </AccessibilityProvider>
  );
}
