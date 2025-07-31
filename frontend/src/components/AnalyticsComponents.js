import React, { useState, useEffect } from 'react';
import { useAuth, authenticatedFetch } from '../utils/auth';
import { useAccessibility } from './AccessibilityProvider';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorBoundary';

// Analytics Dashboard Component
export const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const { announce } = useAccessibility();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch('/api/history?type=analytics');
      
      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await response.json();
      setAnalytics(data);
      announce('Analytics loaded successfully', 'polite');

    } catch (err) {
      setError(err.message);
      announce('Failed to load analytics', 'assertive');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorAlert error={error} onDismiss={() => setError(null)} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No analytics data</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Start using PNIT to see your analytics here.
        </p>
      </div>
    );
  }

  const { query_stats, connection_stats, query_frequency, top_companies, recent_queries } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Insights into your PNIT usage and network connections
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Queries */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Queries
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {formatNumber(query_stats.total_queries)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Connections */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Connections
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {formatNumber(connection_stats.total_connections)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Active Days */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Days
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {formatNumber(query_stats.active_days)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Unique Companies */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H5m9 0v-5.5M7 3h10" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Unique Companies
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {formatNumber(connection_stats.unique_companies)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Query Frequency Chart */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Query Activity (Last 30 Days)
          </h3>
          {query_frequency.length > 0 ? (
            <div className="space-y-3">
              {query_frequency.slice(0, 10).map((day, index) => {
                const maxCount = Math.max(...query_frequency.map(d => d.count));
                const width = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                
                return (
                  <div key={day.date} className="flex items-center space-x-3">
                    <div className="w-20 text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                      <div
                        className="bg-primary h-4 rounded-full transition-all duration-300"
                        style={{ width: `${width}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-800 dark:text-gray-200">
                        {day.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No query activity in the last 30 days.</p>
          )}
        </div>

        {/* Top Companies */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Top Companies by Connections
          </h3>
          {top_companies.length > 0 ? (
            <div className="space-y-3">
              {top_companies.map((company, index) => {
                const maxCount = Math.max(...top_companies.map(c => c.connection_count));
                const width = maxCount > 0 ? (company.connection_count / maxCount) * 100 : 0;
                
                return (
                  <div key={company.company} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {company.company}
                        </p>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {company.connection_count}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No company data available.</p>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Usage Statistics */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Usage Statistics</h3>
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Average Query Length</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {formatNumber(query_stats.avg_query_length)} characters
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">First Query</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(query_stats.first_query)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Last Query</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(query_stats.last_query)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Companies with Names</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {formatNumber(connection_stats.companies_with_name)} / {formatNumber(connection_stats.total_connections)}
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  ({connection_stats.total_connections > 0 
                    ? Math.round((connection_stats.companies_with_name / connection_stats.total_connections) * 100) 
                    : 0}%)
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Last Data Import</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(connection_stats.last_import)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Recent Query Patterns */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Query Patterns</h3>
          {recent_queries.length > 0 ? (
            <div className="space-y-4">
              {recent_queries.map((query, index) => (
                <div key={index} className="border-l-4 border-primary pl-4">
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {query.query.length > 60 ? query.query.substring(0, 60) + '...' : query.query}
                  </p>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 space-x-4">
                    <span>{formatDate(query.created_at)}</span>
                    <span>{formatNumber(query.response_length)} chars response</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No recent queries found.</p>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={loadAnalytics}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Analytics
        </button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;