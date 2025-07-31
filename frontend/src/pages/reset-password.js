import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AccessibilityProvider } from '../components/AccessibilityProvider';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorBoundary';
import { useAccessibility } from '../components/AccessibilityProvider';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { announce } = useAccessibility();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Get reset token from URL
    const resetToken = router.query.token;
    if (resetToken) {
      setToken(resetToken);
    } else if (router.isReady) {
      // No token provided, redirect to forgot password
      router.push('/login?mode=forgot-password');
    }
  }, [router]);

  const evaluatePasswordStrength = (password) => {
    if (!password) return null;
    
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    
    return {
      score: passedChecks,
      checks,
      strength: passedChecks < 3 ? 'weak' : passedChecks < 5 ? 'medium' : 'strong'
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check password strength
    if (name === 'newPassword') {
      setPasswordStrength(evaluatePasswordStrength(value));
    }

    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError('Invalid reset token');
      return;
    }
    
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordStrength || passwordStrength.score < 5) {
      setError('Password must meet all security requirements');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Password reset failed');
        announce('Password reset failed', 'assertive');
        return;
      }

      setSuccess(true);
      announce('Password reset successful', 'polite');

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      announce('Network error during password reset', 'assertive');
    } finally {
      setLoading(false);
    }
  };

  if (!token && router.isReady) {
    return null; // Will redirect via useEffect
  }

  if (success) {
    return (
      <AccessibilityProvider>
        <Head>
          <title>Password Reset Successful | PNIT</title>
        </Head>
        
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Password Reset Successful</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Your password has been updated successfully. You will be redirected to the login page shortly.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </AccessibilityProvider>
    );
  }

  return (
    <AccessibilityProvider>
      <Head>
        <title>Reset Password | PNIT</title>
        <meta name="description" content="Reset your PNIT account password" />
      </Head>
      
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
          </div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Reset Your Password
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>

        {/* Reset Form */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            {error && (
              <ErrorAlert 
                error={error} 
                onDismiss={() => setError(null)}
                className="mb-4"
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.newPassword}
                    onChange={handleChange}
                    disabled={loading}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Password Strength
                      </span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.strength === 'strong' ? 'text-green-600' :
                        passwordStrength.strength === 'medium' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.strength === 'strong' ? 'bg-green-600' :
                          passwordStrength.strength === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      <div className="grid grid-cols-2 gap-1">
                        <span className={passwordStrength.checks.length ? 'text-green-600' : 'text-gray-400'}>
                          ✓ 8+ characters
                        </span>
                        <span className={passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}>
                          ✓ Uppercase
                        </span>
                        <span className={passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-400'}>
                          ✓ Lowercase
                        </span>
                        <span className={passwordStrength.checks.number ? 'text-green-600' : 'text-gray-400'}>
                          ✓ Number
                        </span>
                        <span className={passwordStrength.checks.special ? 'text-green-600' : 'text-gray-400'} style={{ gridColumn: 'span 2' }}>
                          ✓ Special character (@$!%*?&)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  placeholder="Confirm your new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !passwordStrength || passwordStrength.score < 5}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Resetting password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary"
              >
                ← Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </AccessibilityProvider>
  );
}