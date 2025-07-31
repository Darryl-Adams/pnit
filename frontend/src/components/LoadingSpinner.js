import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  label = 'Loading...', 
  className = '',
  overlay = false,
  center = false 
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-primary',
    white: 'text-white',
    gray: 'text-gray-400',
    green: 'text-green-500',
    red: 'text-red-500',
    blue: 'text-blue-500'
  };

  const spinnerElement = (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-label={label}
    >
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
          {spinnerElement}
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
            {label}
          </p>
        </div>
      </div>
    );
  }

  if (center) {
    return (
      <div className="flex items-center justify-center p-4">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

// Skeleton loader for content placeholders
export const SkeletonLoader = ({ 
  lines = 3, 
  className = '', 
  animate = true,
  height = 'h-4'
}) => {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Loading content">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={`
            ${height} bg-gray-200 dark:bg-gray-700 rounded
            ${animate ? 'animate-pulse' : ''}
            ${i === lines - 1 ? 'w-3/4' : 'w-full'}
          `}
        />
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
};

// Dots loading indicator
export const DotsLoader = ({ 
  color = 'primary', 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2', 
    lg: 'w-3 h-3'
  };

  const colorClasses = {
    primary: 'bg-primary',
    white: 'bg-white',
    gray: 'bg-gray-400'
  };

  return (
    <div 
      className={`flex space-x-1 items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            ${sizeClasses[size]} ${colorClasses[color]} rounded-full
            animate-bounce
          `}
          style={{ 
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Progress bar loader
export const ProgressBar = ({ 
  progress = 0, 
  label = '',
  showPercentage = true,
  className = '' 
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={`w-full ${className}`} role="progressbar" aria-valuenow={clampedProgress} aria-valuemin="0" aria-valuemax="100">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

// Button loading state
export const LoadingButton = ({ 
  loading, 
  children, 
  disabled, 
  className = '',
  loadingText = 'Loading...',
  ...props 
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" color="white" label={loadingText} />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};

// Table loading state
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 4,
  className = '' 
}) => {
  return (
    <div className={`space-y-4 ${className}`} role="status" aria-label="Loading table data">
      {/* Header skeleton */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, i) => (
          <div key={`header-${i}`} className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        ))}
      </div>
      
      {/* Row skeletons */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <div 
              key={`cell-${rowIndex}-${colIndex}`} 
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" 
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading table data...</span>
    </div>
  );
};

// Card loading skeleton
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${className}`} role="status" aria-label="Loading card content">
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-center mt-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </div>
      <span className="sr-only">Loading card content...</span>
    </div>
  );
};

export default LoadingSpinner;