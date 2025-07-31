import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AccessibilityProvider } from '../components/AccessibilityProvider';
import { LoginForm, RegisterForm, ForgotPasswordForm } from '../components/AuthComponents';
import { useAuth } from '../utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState('login');

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/pnit');
    }
  }, [user, loading, router]);

  // Handle query parameters for mode switching
  useEffect(() => {
    if (router.query.mode === 'register') {
      setMode('register');
    } else if (router.query.mode === 'forgot-password') {
      setMode('forgot-password');
    } else {
      setMode('login');
    }
  }, [router.query.mode]);

  const handleSuccess = (userData) => {
    // Redirect to the intended page or dashboard
    const returnUrl = router.query.returnUrl || '/pnit';
    router.push(returnUrl);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    router.push(`/login?mode=${newMode}`, undefined, { shallow: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <AccessibilityProvider>
      <Head>
        <title>
          {mode === 'register' ? 'Sign Up' : 
           mode === 'forgot-password' ? 'Reset Password' : 'Sign In'} | PNIT
        </title>
        <meta 
          name="description" 
          content={
            mode === 'register' ? 'Create your PNIT account to start exploring your network intelligence' :
            mode === 'forgot-password' ? 'Reset your PNIT account password' :
            'Sign in to your PNIT account to access your personal network intelligence'
          } 
        />
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
            PNIT
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Personal Network Intelligence Tool
          </p>
        </div>

        {/* Auth Form */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          {mode === 'login' && (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={() => switchMode('register')}
              onSwitchToForgotPassword={() => switchMode('forgot-password')}
            />
          )}
          {mode === 'register' && (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => switchMode('login')}
            />
          )}
          {mode === 'forgot-password' && (
            <ForgotPasswordForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => switchMode('login')}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <a href="/privacy" className="hover:text-primary">Privacy Policy</a>
            <span className="mx-2">•</span>
            <a href="/terms" className="hover:text-primary">Terms of Service</a>
            <span className="mx-2">•</span>
            <a href="/support" className="hover:text-primary">Support</a>
          </div>
          <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            © 2024 PNIT. All rights reserved.
          </div>
        </div>
      </div>
    </AccessibilityProvider>
  );
}