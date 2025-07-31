import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent, minimal = false } = this.props;
      
      // If a custom fallback component is provided, use it
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onReload={this.handleReload}
          />
        );
      }

      // Minimal error display for small components
      if (minimal) {
        return (
          <div 
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center">
              <svg 
                className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Something went wrong
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  This component failed to load properly.
                </p>
              </div>
              <button
                onClick={this.handleRetry}
                className="ml-4 text-sm text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-red-900 rounded px-2 py-1"
              >
                Retry
              </button>
            </div>
          </div>
        );
      }

      // Full error page
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              {/* Error Icon */}
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
                <svg 
                  className="w-6 h-6 text-red-600 dark:text-red-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              {/* Error Content */}
              <div className="text-center">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We encountered an unexpected error. This has been automatically reported to our team.
                </p>

                {/* Development Error Details */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="text-left mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Error Details (Development)
                    </summary>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                      <div>
                        <strong>Error:</strong> {this.state.error.toString()}
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="whitespace-pre-wrap text-xs mt-1 p-2 bg-gray-200 dark:bg-gray-600 rounded">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={this.handleReload}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Reload Page
                  </button>
                </div>

                {/* Additional Help */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    If this problem persists, please{' '}
                    <a 
                      href="/contact" 
                      className="text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                    >
                      contact support
                    </a>
                    {' '}or try refreshing your browser.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error Alert Component for inline errors
export const ErrorAlert = ({ 
  error, 
  title = "Error", 
  onDismiss, 
  onRetry,
  className = '',
  variant = 'error' // error, warning, info
}) => {
  const variantClasses = {
    error: {
      container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      icon: 'text-red-500',
      title: 'text-red-800 dark:text-red-200',
      description: 'text-red-700 dark:text-red-300',
      button: 'text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100'
    },
    warning: {
      container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-500',
      title: 'text-yellow-800 dark:text-yellow-200',
      description: 'text-yellow-700 dark:text-yellow-300',
      button: 'text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100'
    },
    info: {
      container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      icon: 'text-blue-500',
      title: 'text-blue-800 dark:text-blue-200',
      description: 'text-blue-700 dark:text-blue-300',
      button: 'text-blue-800 dark:text-blue-200 hover:text-blue-900 dark:hover:text-blue-100'
    }
  };

  const classes = variantClasses[variant];

  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z";
      case 'info':
        return "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z";
      default: // error
        return "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z";
    }
  };

  return (
    <div 
      className={`p-4 border rounded-md ${classes.container} ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg 
            className={`w-5 h-5 ${classes.icon}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d={getIcon()} clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${classes.title}`}>
            {title}
          </h3>
          <div className={`mt-1 text-sm ${classes.description}`}>
            {typeof error === 'string' ? error : error?.message || 'An unexpected error occurred'}
          </div>
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex space-x-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`text-sm font-medium ${classes.button} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded px-2 py-1`}
                >
                  Try again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`text-sm font-medium ${classes.button} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded px-2 py-1`}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Toast notification for errors
export const ErrorToast = ({ 
  message, 
  isVisible, 
  onClose, 
  autoClose = true,
  duration = 5000 
}) => {
  React.useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div 
        className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{message}</span>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-500 rounded"
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;