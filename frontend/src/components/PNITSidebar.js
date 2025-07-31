import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../utils/auth';

const navItems = [
  { 
    href: '/pnit', 
    label: 'Dashboard', 
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z M8 5a2 2 0 012-2h0a2 2 0 012 2v0H8v0z',
    description: 'Overview and stats'
  },
  { 
    href: '/pnit/upload', 
    label: 'Upload CSV', 
    icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m-3 3V8',
    description: 'Import LinkedIn connections'
  },
  { 
    href: '/pnit/chat', 
    label: 'AI Chat', 
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    description: 'Query your network with AI'
  },
  { 
    href: '/pnit/history', 
    label: 'Query History', 
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    description: 'View past conversations'
  },
  { 
    href: '/pnit/download-instructions', 
    label: 'LinkedIn Export', 
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    description: 'How to export from LinkedIn'
  },
  { 
    href: '/pnit/settings', 
    label: 'Settings', 
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    description: 'Account and preferences'
  },
];

export default function PNITSidebar({ isOpen = false, onClose = () => {}, className = '' }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [connectionStats, setConnectionStats] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fetch connection statistics
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConnectionStats();
    }
  }, [isAuthenticated, user]);

  const fetchConnectionStats = async () => {
    try {
      const response = await fetch(`/api/settings?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setConnectionStats(data.statistics);
      }
    } catch (error) {
      console.error('Failed to fetch connection stats:', error);
    }
  };

  const handleNavClick = () => {
    onClose();
  };

  const handleKeyDown = (e, callback) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 
          ${isCollapsed ? 'w-16' : 'w-64'} 
          bg-gray-50 dark:bg-gray-900 
          border-r border-gray-200 dark:border-gray-700 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col
          ${className}
        `}
        aria-label="PNIT Application Navigation"
        role="navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  PNIT
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Network Intelligence
                </p>
              </div>
            </div>
          )}
          
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Collapse toggle for desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:block p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        {user && !isCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name || 'User'}
                </p>
                {connectionStats && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {connectionStats.total_connections} connections
                  </p>
                )}
              </div>
            </div>
            
            {connectionStats && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-center">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {connectionStats.unique_companies}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Companies</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-center">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {connectionStats.total_queries}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Queries</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <div key={item.href}>
                <Link href={item.href} legacyBehavior>
                  <a
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md
                      transition-colors duration-200
                      focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900
                      ${isActive
                        ? 'bg-primary text-white' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={handleNavClick}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <svg 
                      className={`flex-shrink-0 w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {!isCollapsed && (
                      <div className="flex-1">
                        <span>{item.label}</span>
                        <p className="text-xs opacity-75 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </a>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>PNIT v1.0</p>
              <p className="mt-1">
                <a 
                  href="/about" 
                  className="hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-primary rounded"
                >
                  About & Privacy
                </a>
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
