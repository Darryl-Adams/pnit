// Frontend authentication utilities

// Store session tokens in localStorage
export const setSessionTokens = (sessionToken, refreshToken, expiresAt) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pnit_session_token', sessionToken);
    localStorage.setItem('pnit_refresh_token', refreshToken);
    localStorage.setItem('pnit_session_expires', expiresAt);
  }
};

// Get session token from localStorage
export const getSessionToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('pnit_session_token');
  }
  return null;
};

// Get refresh token from localStorage
export const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('pnit_refresh_token');
  }
  return null;
};

// Get session expiry from localStorage
export const getSessionExpiry = () => {
  if (typeof window !== 'undefined') {
    const expiry = localStorage.getItem('pnit_session_expires');
    return expiry ? new Date(expiry) : null;
  }
  return null;
};

// Remove all auth tokens from localStorage
export const removeAuthTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pnit_session_token');
    localStorage.removeItem('pnit_refresh_token');
    localStorage.removeItem('pnit_session_expires');
    // Legacy token cleanup
    localStorage.removeItem('pnit_auth_token');
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const sessionToken = getSessionToken();
  const expiresAt = getSessionExpiry();
  
  if (!sessionToken || !expiresAt) return false;
  
  // Check if session is expired
  return new Date() < expiresAt;
};

// Check if session needs refresh (expires within 5 minutes)
export const needsRefresh = () => {
  const expiresAt = getSessionExpiry();
  if (!expiresAt) return false;
  
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return expiresAt < fiveMinutesFromNow;
};

// Legacy support - keep for backward compatibility
export const setAuthToken = (token) => {
  console.warn('setAuthToken is deprecated. Use setSessionTokens instead.');
  if (typeof window !== 'undefined') {
    localStorage.setItem('pnit_auth_token', token);
  }
};

export const getAuthToken = () => {
  // Try new session token first, fallback to legacy token
  return getSessionToken() || (typeof window !== 'undefined' ? localStorage.getItem('pnit_auth_token') : null);
};

export const removeAuthToken = () => {
  removeAuthTokens();
};

// Get authorization headers for API requests
export const getAuthHeaders = () => {
  const token = getSessionToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
};

// Refresh session token
export const refreshSession = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      throw new Error('Session refresh failed');
    }

    const data = await response.json();
    setSessionTokens(data.session.token, data.session.refreshToken, data.session.expiresAt);
    
    return data.session.token;
  } catch (error) {
    // Refresh failed, clear tokens and redirect to login
    removeAuthTokens();
    window.location.href = '/login';
    throw error;
  }
};

// Make authenticated API request with automatic token refresh
export const authenticatedFetch = async (url, options = {}) => {
  // Check if we need to refresh the token
  if (needsRefresh()) {
    try {
      await refreshSession();
    } catch (error) {
      // Refresh failed, will redirect to login
      throw error;
    }
  }

  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };
  
  let response = await fetch(url, {
    ...options,
    headers
  });
  
  // If we get 401, try refreshing once more
  if (response.status === 401 && getRefreshToken()) {
    try {
      await refreshSession();
      
      // Retry the original request with new token
      const newHeaders = {
        ...getAuthHeaders(),
        ...options.headers
      };
      
      response = await fetch(url, {
        ...options,
        headers: newHeaders
      });
    } catch (refreshError) {
      // Refresh failed, clear tokens and redirect
      removeAuthTokens();
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
  }
  
  // If still 401 after refresh attempt, redirect to login
  if (response.status === 401) {
    removeAuthTokens();
    window.location.href = '/login';
    throw new Error('Authentication required');
  }
  
  return response;
};

// Create demo user (for development)
export const createDemoUser = async () => {
  try {
    const response = await fetch('/api/auth/demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to create demo user');
    }
    
    const data = await response.json();
    setAuthToken(data.token);
    
    return data;
  } catch (error) {
    console.error('Demo user creation failed:', error);
    throw error;
  }
};

// User context for React components
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        try {
          // Fetch current user profile
          const response = await fetch('/api/auth/me', {
            headers: getAuthHeaders()
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else if (response.status === 401) {
            // Try to refresh session
            try {
              await refreshSession();
              // Retry fetching user profile
              const retryResponse = await fetch('/api/auth/me', {
                headers: getAuthHeaders()
              });
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                setUser(retryData.user);
              } else {
                removeAuthTokens();
              }
            } catch (refreshError) {
              removeAuthTokens();
            }
          } else {
            removeAuthTokens();
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          removeAuthTokens();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (sessionToken, userData, refreshToken, expiresAt) => {
    if (refreshToken && expiresAt) {
      setSessionTokens(sessionToken, refreshToken, expiresAt);
    } else {
      // Legacy support
      setAuthToken(sessionToken);
    }
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Attempt to logout on server
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local tokens and redirect
      removeAuthTokens();
      setUser(null);
      window.location.href = '/';
    }
  };

  const logoutAll = async () => {
    try {
      // Logout from all devices
      await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      // Always clear local tokens and redirect
      removeAuthTokens();
      setUser(null);
      window.location.href = '/';
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    logoutAll,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};