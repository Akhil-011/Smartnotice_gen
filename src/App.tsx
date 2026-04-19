
import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { Toaster } from './components/ui/toaster';

type Page = 'landing' | 'login' | 'signup';

function App() {
  const { user, loading } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    console.log('[App] User state changed:', user ? `${user.id} (${user.name})` : 'null');
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setBootstrapped(true);
      }
    }, 2500);

    useAuthStore
      .getState()
      .initialize()
      .finally(() => {
        if (!cancelled) {
          setBootstrapped(true);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      console.log('[App] User is null, setting page to landing');
      setCurrentPage('landing');
    } else {
      console.log('[App] User exists, can show dashboard');
    }
  }, [user]);

  if (loading && !bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-slate-600 font-medium">Loading Smart Notice Board...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (currentPage === 'signup') {
      return (
        <>
          <SignupPage onBack={() => setCurrentPage('login')} />
          <Toaster />
        </>
      );
    } else if (currentPage === 'login') {
      return (
        <>
          <LoginPage onSignupClick={() => setCurrentPage('signup')} />
          <Toaster />
        </>
      );
    } else {
      return (
        <>
          <LandingPage onLoginClick={() => setCurrentPage('login')} />
          <Toaster />
        </>
      );
    }
  }

  return (
    <>
      <DashboardPage />
      <Toaster />
    </>
  );
}

export default App;
