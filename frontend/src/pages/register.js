import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { AccessibilityProvider } from '../components/AccessibilityProvider';
import { RegisterForm } from '../components/AuthComponents';
import { useAuth } from '../utils/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/pnit');
    }
  }, [user, loading, router]);

  const handleSuccess = (userData) => {
    // Redirect to the intended page or dashboard
    const returnUrl = router.query.returnUrl || '/pnit';
    router.push(returnUrl);
  };

  const switchToLogin = () => {
    const returnUrl = router.query.returnUrl;
    const loginUrl = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login';
    router.push(loginUrl);
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
        <title>Sign Up | PNIT</title>
        <meta name="description" content="Create your PNIT account to start exploring your network intelligence" />
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

        {/* Registration Form */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={switchToLogin}
          />
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