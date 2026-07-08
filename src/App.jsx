import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
// HashRouter is used so the app works on GitHub Pages (static hosting) at any
// path, with no server-side rewrite rules and no 404 on deep links/refresh.
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
