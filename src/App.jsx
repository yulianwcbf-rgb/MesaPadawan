import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { useEffect } from 'react';
// HashRouter is used so the app works on GitHub Pages (static hosting) at any
// path, with no server-side rewrite rules and no 404 on deep links/refresh.
import { HashRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabase/client';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

// Protects app routes: unauthenticated visitors are sent to the login page.
function RequireAuth({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// Keeps already-authenticated users out of the login/register pages.
function PublicOnly({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

// Supabase's password-recovery redirect appends its own tokens as a URL hash
// (#access_token=...&type=recovery), which collides with HashRouter's own use
// of the hash for routing and doesn't match any route. Catch it two ways:
// a same-tick check of the raw hash (fast path), and Supabase's own
// PASSWORD_RECOVERY auth event (reliable even if the hash gets cleaned up by
// Supabase's client before/after this check runs).
function RecoveryRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      navigate('/reset-password', { replace: true });
    }
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') navigate('/reset-password', { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return null;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
    <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
    <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
    <Route path="*" element={<PageNotFound />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <RecoveryRedirect />
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
