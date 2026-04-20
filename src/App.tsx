import { lazy, Suspense, useEffect, memo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useAuthStore } from './store/useAuthStore';
import { useDataStore } from './store/useDataStore';

const LoginPage       = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const Dashboard       = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Inventory       = lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })));
const TechnicianPortal = lazy(() => import('./pages/TechnicianPortal').then(m => ({ default: m.TechnicianPortal })));
const Contracts       = lazy(() => import('./pages/Contracts').then(m => ({ default: m.Contracts })));
const Supplies        = lazy(() => import('./pages/Supplies').then(m => ({ default: m.Supplies })));
const History         = lazy(() => import('./pages/History').then(m => ({ default: m.History })));
const Users           = lazy(() => import('./pages/Users').then(m => ({ default: m.Users })));
const GlobalInventory = lazy(() => import('./pages/GlobalInventory').then(m => ({ default: m.GlobalInventory })));

// Minimal inline loader — no heavy blur/animations that cause jank
const Loader = memo(() => (
  <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
    <p className="text-[11px] font-black text-primary uppercase tracking-[0.5em]">RDY SUPPLY</p>
  </div>
));

// Lightweight page-level fallback (no blur, no glow — just a placeholder)
const PageFallback = memo(() => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
));

const Page = memo(({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageFallback />}>
      {children}
    </Suspense>
  </ErrorBoundary>
));

const ProtectedRoute = memo(({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: string[] 
}) => {
  const user = useAuthStore(s => s.user);
  const isAuthHydrated = useAuthStore(s => s._hasHydrated);
  const isDataHydrated = useDataStore(s => s._hasHydrated);

  if (!user && isAuthHydrated) return <Navigate to="/login" replace />;
  if (user && !isDataHydrated) return <Loader />;
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'technician' ? '/tecnico' : '/'} replace />;
  }

  return <>{children}</>;
});

function App() {
  const user = useAuthStore(s => s.user);
  const isAuthHydrated = useAuthStore(s => s._hasHydrated);
  const initializeAuth = useAuthStore(s => s.initializeAuth);
  const fetchInitialData = useDataStore(s => s.fetchInitialData);

  useEffect(() => {
    initializeAuth().catch(console.error);
    // Reduced timeout since auth store now has fast-path
    const timer = setTimeout(() => {
      if (!useAuthStore.getState()._hasHydrated) {
        useAuthStore.setState({ _hasHydrated: true });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [initializeAuth]);

  useEffect(() => {
    if (user) {
      fetchInitialData().catch(console.error);
      // Reduced timeout for data fetch
      const timer = setTimeout(() => {
        if (!useDataStore.getState()._hasHydrated) {
          useDataStore.setState({ _hasHydrated: true });
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, fetchInitialData]);

  if (!isAuthHydrated) return <Loader />;

  return (
    <Router>
      <Toaster position="top-right" richColors toastOptions={{ duration: 2000 }} />
      <Routes>
        <Route path="/login" element={
          <Page>{!user ? <LoginPage /> : <Navigate to="/" replace />}</Page>
        } />

        <Route path="/" element={
          <ProtectedRoute allowedRoles={['admin', 'analyst', 'cto']}>
            <AppLayout><Page><Dashboard /></Page></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/estoque" element={
          <ProtectedRoute allowedRoles={['admin', 'analyst', 'cto']}>
            <AppLayout><Page><Inventory /></Page></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/tecnico" element={
          <ProtectedRoute allowedRoles={['admin', 'technician']}>
            <AppLayout><Page><TechnicianPortal /></Page></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/contratos" element={
          <ProtectedRoute allowedRoles={['admin', 'analyst']}>
            <AppLayout><Page><Contracts /></Page></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/insumos" element={
          <ProtectedRoute allowedRoles={['admin', 'analyst']}>
            <AppLayout><Page><Supplies /></Page></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/historico" element={
          <ProtectedRoute allowedRoles={['admin', 'analyst', 'cto']}>
            <AppLayout><Page><History /></Page></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/usuarios" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><Page><Users /></Page></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/inventario" element={
          <ProtectedRoute allowedRoles={['admin', 'analyst', 'cto']}>
            <AppLayout><Page><GlobalInventory /></Page></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
