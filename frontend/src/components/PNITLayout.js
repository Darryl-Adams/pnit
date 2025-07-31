import React, { useState, useEffect } from 'react';
import PNITSidebar from './PNITSidebar';
import { useAuth } from '../utils/auth';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

/**
 * PNITLayout wraps all /pnit/* pages with authentication, sidebar, and responsive design.
 * - Handles authentication state and loading
 * - Responsive sidebar with mobile support
 * - Error boundary for graceful error handling
 * - WCAG 2.2 AA compliant
 */
export default function PNITLayout({ children, requireAuth = true }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC to close sidebar on mobile
      if (e.key === 'Escape' && sidebarOpen && isMobile) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, isMobile]);

  // Skip to main content handler
  const handleSkipToMain = (e) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-6 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Authentication Required
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please sign in to access PNIT features.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Skip to main content link - WCAG requirement */}
        <a
          href="#main-content"
          onClick={handleSkipToMain}
          className="sr-only focus:not-sr-only absolute top-4 left-4 z-50 px-4 py-2 bg-primary text-white rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
        >
          Skip to main content
        </a>

        {/* Mobile header with menu button */}
        <header className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              PNIT
            </h1>
          </div>
          
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <div className="flex h-screen md:h-auto">
          {/* Sidebar */}
          <PNITSidebar 
            isOpen={sidebarOpen || !isMobile} 
            onClose={() => setSidebarOpen(false)}
            className="md:relative"
          />

          {/* Main content */}
          <main 
            id="main-content"
            className="flex-1 overflow-auto"
            tabIndex="-1"
            role="main"
            aria-label="Main content"
          >
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Announcement bar for important messages */}
        <div id="announcements" className="sr-only" aria-live="polite" aria-atomic="true">
          {/* Screen reader announcements will be inserted here */}
        </div>
      </div>
    </ErrorBoundary>
  );
}
