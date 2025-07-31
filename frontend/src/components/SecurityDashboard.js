import React, { useState, useEffect } from 'react';
import { useAuth, authenticatedFetch } from '../utils/auth';
import { useAccessibility } from './AccessibilityProvider';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorBoundary';

// Security Dashboard Component (Admin Only)
export const SecurityDashboard = () => {
  const { user } = useAuth();
  const { announce } = useAccessibility();
  const [securityEvents, setSecurityEvents] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [rateLimitStats, setRateLimitStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    eventType: '',
    dateFrom: '',
    dateTo: '',
    limit: 50
  });

  useEffect(() => {
    loadSecurityData();
  }, [filters]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load security events
      const eventsParams = new URLSearchParams({
        limit: filters.limit.toString(),
        ...(filters.eventType && { event_type: filters.eventType }),
        ...(filters.dateFrom && { date_from: filters.dateFrom }),
        ...(filters.dateTo && { date_to: filters.dateTo })
      });

      const [eventsResponse, sessionsResponse, rateLimitResponse] = await Promise.all([
        authenticatedFetch(`/api/admin/security-events?${eventsParams}`),
        authenticatedFetch('/api/admin/active-sessions'),
        authenticatedFetch('/api/admin/rate-limit-stats')
      ]);

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setSecurityEvents(eventsData.events || []);
      }

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setActiveSessions(sessionsData.sessions || []);
      }

      if (rateLimitResponse.ok) {
        const rateLimitData = await rateLimitResponse.json();
        setRateLimitStats(rateLimitData.stats || []);
      }

    } catch (err) {
      setError(err.message);
      announce('Failed to load security data', 'assertive');
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId) => {
    try {
      const response = await authenticatedFetch(`/api/admin/revoke-session/${sessionId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }

      announce('Session revoked successfully', 'polite');
      loadSecurityData(); // Reload data
    } catch (err) {
      setError(err.message);
    }
  };

  const getEventTypeIcon = (eventType) => {
    const icons = {
      login: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
      logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
      failed_login: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
      registration: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      password_change: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
      api_key_created: 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z',
      rate_limit_exceeded: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };

    return icons[eventType] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  };

  const getEventTypeColor = (eventType, success) => {
    if (!success) return 'text-red-500';
    
    const colors = {
      login: 'text-green-500',
      logout: 'text-blue-500',
      registration: 'text-purple-500',
      password_change: 'text-yellow-500',
      api_key_created: 'text-indigo-500',
      rate_limit_exceeded: 'text-red-500'
    };

    return colors[eventType] || 'text-gray-500';
  };

  const formatEventType = (eventType) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!user) {
    return <div>Access denied</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Monitor security events, sessions, and system activity
        </p>
      </div>

      {error && (
        <ErrorAlert error={error} onDismiss={() => setError(null)} />
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Type
            </label>
            <select
              id="eventType"
              value={filters.eventType}
              onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Events</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="failed_login">Failed Login</option>
              <option value="registration">Registration</option>
              <option value="password_change">Password Change</option>
              <option value="api_key_created">API Key Created</option>
              <option value="rate_limit_exceeded">Rate Limit Exceeded</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Date
            </label>
            <input
              id="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Date
            </label>
            <input
              id="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Limit
            </label>
            <select
              id="limit"
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Sessions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {activeSessions.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Failed Logins (24h)
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {securityEvents.filter(e => e.event_type === 'failed_login' && 
                      new Date(e.created_at) > new Date(Date.now() - 24*60*60*1000)).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    New Users (7d)
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {securityEvents.filter(e => e.event_type === 'registration' && 
                      new Date(e.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Rate Limited IPs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {rateLimitStats.filter(s => s.blocked_until && new Date(s.blocked_until) > new Date()).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Events */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Security Events</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading security events...</p>
            </div>
          ) : securityEvents.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No events found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your filters to see more results.
              </p>
            </div>
          ) : (
            <div className="flow-root">
              <ul className="-mb-8">
                {securityEvents.map((event, eventIdx) => (
                  <li key={`${event.id}-${eventIdx}`}>
                    <div className="relative pb-8">
                      {eventIdx !== securityEvents.length - 1 && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${
                            event.success ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getEventTypeIcon(event.event_type)} />
                            </svg>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatEventType(event.event_type)}
                              </span>
                              {event.user_id && (
                                <span> by User #{event.user_id}</span>
                              )}
                              {event.ip_address && (
                                <span> from {event.ip_address}</span>
                              )}
                            </p>
                            {event.details && Object.keys(event.details).length > 0 && (
                              <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                {Object.entries(event.details).map(([key, value]) => (
                                  <span key={key} className="mr-3">
                                    {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                            <time dateTime={event.created_at}>
                              {formatDate(event.created_at)}
                            </time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Active Sessions</h3>
          
          {activeSessions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No active sessions found.</p>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {activeSessions.map((session) => (
                    <tr key={session.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        User #{session.user_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {session.ip_address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {session.device_info?.type || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(session.last_used)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => revokeSession(session.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;