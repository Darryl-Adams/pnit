import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    fontSize: 'normal', // small, normal, large, extra-large
    focusVisible: true,
    announcements: true
  });

  const [announcements, setAnnouncements] = useState([]);

  // Initialize accessibility preferences
  useEffect(() => {
    // Check system preferences
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)')
    };

    const updatePreferences = () => {
      setPreferences(prev => ({
        ...prev,
        reducedMotion: mediaQueries.reducedMotion.matches,
        highContrast: mediaQueries.highContrast.matches
      }));
    };

    // Initial check
    updatePreferences();

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    // Load saved preferences
    const saved = localStorage.getItem('pnit-accessibility-preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse accessibility preferences:', error);
      }
    }

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('pnit-accessibility-preferences', JSON.stringify(preferences));
    
    // Apply CSS classes based on preferences
    const root = document.documentElement;
    
    // Reduced motion
    if (preferences.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // High contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Font size
    root.classList.remove('font-small', 'font-normal', 'font-large', 'font-extra-large');
    root.classList.add(`font-${preferences.fontSize}`);
    
  }, [preferences]);

  // Announce function for screen readers
  const announce = (message, priority = 'polite') => {
    if (!preferences.announcements) return;
    
    const id = Date.now();
    const announcement = {
      id,
      message,
      priority,
      timestamp: new Date()
    };
    
    setAnnouncements(prev => [...prev, announcement]);
    
    // Remove announcement after it's been read
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 3000);
  };

  // Update a specific preference
  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Keyboard navigation helpers
  const handleKeyNavigation = (event, callbacks) => {
    const { key, shiftKey, ctrlKey, altKey } = event;
    
    // Common keyboard shortcuts
    if (ctrlKey) {
      switch (key) {
        case 'k':
          event.preventDefault();
          callbacks.search?.();
          break;
        case '/':
          event.preventDefault();
          callbacks.help?.();
          break;
      }
    }
    
    // Navigation keys
    switch (key) {
      case 'Escape':
        callbacks.escape?.();
        break;
      case 'Enter':
        if (!event.defaultPrevented) {
          callbacks.enter?.(event);
        }
        break;
      case ' ':
        if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
          callbacks.space?.(event);
        }
        break;
      case 'ArrowUp':
        callbacks.arrowUp?.(event);
        break;
      case 'ArrowDown':
        callbacks.arrowDown?.(event);
        break;
      case 'ArrowLeft':
        callbacks.arrowLeft?.(event);
        break;
      case 'ArrowRight':
        callbacks.arrowRight?.(event);
        break;
      case 'Home':
        callbacks.home?.(event);
        break;
      case 'End':
        callbacks.end?.(event);
        break;
      case 'Tab':
        if (shiftKey) {
          callbacks.shiftTab?.(event);
        } else {
          callbacks.tab?.(event);
        }
        break;
    }
  };

  // Focus management
  const focusManagement = {
    trapFocus: (container) => {
      const focusableElements = container.querySelectorAll(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };
      
      container.addEventListener('keydown', handleKeyDown);
      firstElement?.focus();
      
      return () => {
        container.removeEventListener('keydown', handleKeyDown);
      };
    },
    
    restoreFocus: (element) => {
      if (element && typeof element.focus === 'function') {
        element.focus();
      }
    },
    
    moveFocus: (direction, currentElement) => {
      const focusableElements = Array.from(
        document.querySelectorAll(
          'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
        )
      );
      
      const currentIndex = focusableElements.indexOf(currentElement);
      let nextIndex;
      
      switch (direction) {
        case 'next':
          nextIndex = currentIndex + 1;
          if (nextIndex >= focusableElements.length) nextIndex = 0;
          break;
        case 'previous':
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) nextIndex = focusableElements.length - 1;
          break;
        case 'first':
          nextIndex = 0;
          break;
        case 'last':
          nextIndex = focusableElements.length - 1;
          break;
        default:
          return;
      }
      
      focusableElements[nextIndex]?.focus();
    }
  };

  const value = {
    preferences,
    updatePreference,
    announce,
    announcements,
    handleKeyNavigation,
    focusManagement
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* Screen reader announcements */}
      <div 
        id="sr-announcements"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcements
          .filter(a => a.priority === 'polite')
          .map(a => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>
      
      <div 
        id="sr-announcements-assertive"
        className="sr-only"
        aria-live="assertive"
        aria-atomic="true"
      >
        {announcements
          .filter(a => a.priority === 'assertive')
          .map(a => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>
    </AccessibilityContext.Provider>
  );
};

// Higher-order component for accessibility
export const withAccessibility = (Component) => {
  return function AccessibleComponent(props) {
    return (
      <AccessibilityProvider>
        <Component {...props} />
      </AccessibilityProvider>
    );
  };
};

// Accessibility settings component
export const AccessibilitySettings = ({ className = '' }) => {
  const { preferences, updatePreference } = useAccessibility();

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Accessibility Preferences
        </h3>
        
        <div className="space-y-4">
          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div>
              <label 
                htmlFor="reduced-motion" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Reduce Motion
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Minimize animations and transitions
              </p>
            </div>
            <input
              id="reduced-motion"
              type="checkbox"
              checked={preferences.reducedMotion}
              onChange={(e) => updatePreference('reducedMotion', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div>
              <label 
                htmlFor="high-contrast" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                High Contrast
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Increase color contrast for better visibility
              </p>
            </div>
            <input
              id="high-contrast"
              type="checkbox"
              checked={preferences.highContrast}
              onChange={(e) => updatePreference('highContrast', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
          </div>

          {/* Font Size */}
          <div>
            <label 
              htmlFor="font-size" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Font Size
            </label>
            <select
              id="font-size"
              value={preferences.fontSize}
              onChange={(e) => updatePreference('fontSize', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="small">Small</option>
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>

          {/* Screen Reader Announcements */}
          <div className="flex items-center justify-between">
            <div>
              <label 
                htmlFor="announcements" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Screen Reader Announcements
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enable status updates for screen readers
              </p>
            </div>
            <input
              id="announcements"
              type="checkbox"
              checked={preferences.announcements}
              onChange={(e) => updatePreference('announcements', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// CSS for accessibility features (to be added to global styles)
export const accessibilityCSS = `
  /* Reduced motion preferences */
  .reduce-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* High contrast mode */
  .high-contrast {
    --tw-bg-opacity: 1;
    --tw-text-opacity: 1;
  }
  
  .high-contrast * {
    border-color: currentColor !important;
  }

  /* Font size preferences */
  .font-small {
    font-size: 14px;
  }
  
  .font-normal {
    font-size: 16px;
  }
  
  .font-large {
    font-size: 18px;
  }
  
  .font-extra-large {
    font-size: 20px;
  }

  /* Focus indicators */
  *:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Skip links */
  .sr-only:not(:focus):not(:active) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .sr-only:focus,
  .sr-only:active {
    position: static;
    width: auto;
    height: auto;
    padding: inherit;
    margin: inherit;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
`;

export default AccessibilityProvider;