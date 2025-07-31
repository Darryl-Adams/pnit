import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, authenticatedFetch } from '../utils/auth';
import { useAccessibility } from './AccessibilityProvider';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorBoundary';

// Query History List Component
export const QueryHistoryList = () => {
  const { user } = useAuth();
  const { announce } = useAccessibility();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    limit: 50,
    offset: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    currentPage: 1,
    totalPages: 1
  });

  const loadHistory = useCallback(async (resetOffset = false) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        limit: filters.limit.toString(),
        offset: resetOffset ? '0' : filters.offset.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { date_from: filters.dateFrom }),
        ...(filters.dateTo && { date_to: filters.dateTo })
      });

      const response = await authenticatedFetch(`/api/history?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to load history');
      }

      const data = await response.json();
      setHistory(data.history);
      setPagination({
        total: data.total,
        currentPage: Math.floor(data.offset / data.limit) + 1,
        totalPages: Math.ceil(data.total / data.limit)
      });

      announce(`Loaded ${data.history.length} queries from history`, 'polite');

    } catch (err) {
      setError(err.message);
      announce('Failed to load query history', 'assertive');
    } finally {
      setLoading(false);
    }
  }, [filters, announce]);

  useEffect(() => {
    loadHistory(true);
  }, [filters.search, filters.dateFrom, filters.dateTo, filters.limit]);

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm, offset: 0 }));
  };

  const handleDateFilter = (dateFrom, dateTo) => {
    setFilters(prev => ({ ...prev, dateFrom, dateTo, offset: 0 }));
  };

  const handlePageChange = (page) => {
    const newOffset = (page - 1) * filters.limit;
    setFilters(prev => ({ ...prev, offset: newOffset }));
    loadHistory();
  };

  const handleExport = async (format) => {
    try {
      const queryParams = new URLSearchParams({
        type: 'export',
        format,
        ...(filters.dateFrom && { date_from: filters.dateFrom }),
        ...(filters.dateTo && { date_to: filters.dateTo })
      });

      const response = await authenticatedFetch(`/api/history?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pnit-history-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      announce(`History exported as ${format.toUpperCase()}`, 'polite');

    } catch (err) {
      setError(`Export failed: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text, maxLength = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Query History</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and search your previous queries and responses
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => handleExport('json')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Export JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('txt')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Export Transcript
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search queries
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search in queries and responses..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From date
            </label>
            <input
              id="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleDateFilter(e.target.value, filters.dateTo)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To date
            </label>
            <input
              id="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleDateFilter(filters.dateFrom, e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Results per page
            </label>
            <select
              id="limit"
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), offset: 0 }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <ErrorAlert 
          error={error} 
          onDismiss={() => setError(null)}
        />
      )}

      {/* History List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        {loading ? (
          <div className="p-6 text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No queries found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filters.search || filters.dateFrom || filters.dateTo 
                ? 'Try adjusting your filters to see more results.'
                : 'Start using PNIT to see your query history here.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {history.map((item, index) => (
                <div key={item.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(item.created_at)}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Query:</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                            {truncateText(item.query, 200)}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Response:</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                            {truncateText(item.response, 300)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`Query: ${item.query}\n\nResponse: ${item.response}`);
                          announce('Conversation copied to clipboard', 'polite');
                        }}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        title="Copy conversation"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing{' '}
                        <span className="font-medium">{(pagination.currentPage - 1) * filters.limit + 1}</span>
                        {' '}to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.currentPage * filters.limit, pagination.total)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium">{pagination.total}</span>
                        {' '}results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === pagination.currentPage
                                  ? 'z-10 bg-primary border-primary text-white'
                                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QueryHistoryList;