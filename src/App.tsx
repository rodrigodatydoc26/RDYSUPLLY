import { lazy, Suspense, useEffect } from 'react';
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

const Loader = () => (
  <div className="min-h-screen bg-bg flex flex-col items-center justify-center space-y-8 animate-fade">
    <div className="relative">
      <div className="w-20 h-20 border-[6px] border-primary/20 rounded-full" />
      <div className="absolute top-0 left-0 w-20 h-20 border-[6px] border-primary border-t-transparent rounded-full animate-spin" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 blur-[60px] pointer-events-none" />
    </div>
    <div className="text-center space-y-2">
      <p className="text-[12px] font-black text-primary uppercase tracking-[0.6em] animate-pulse">Sincronizando Sistema</p>
      <p className="text-[8px] font-bold text-text-1 uppercase tracking-[0.3em] opacity-20">INVESTMENT - PERFORMANCE</p>
    </div>
  </div>
);

const Page = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<Loader />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: string[] 
}) => {
  const { user, _hasHydrated: isAuthHydrated } = useAuthStore();
  const { _hasHydrated: isDataHydrated } = useDataStore();

  // 1. Prioridade: Se não tem usuário, login.
  if (!user && isAuthHydrated) return <Navigate to="/login" replace />;
  
  // 2. Se tem usuário mas dados ainda não sincronizaram, mostra sync.
  if (user && !isDataHydrated) return <Loader />;
  
  // 3. Se sincronizou mas não tem permissão, volta pra home.
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'technician' ? '/tecnico' : '/'} replace />;
  }

  return <>{children}</>;
};

function App() {
  const { user, _hasHydrated: isAuthHydrated, initializeAuth } = useAuthStore();
  const { fetchInitialData } = useDataStore();

  useEffect(() => {
    initializeAuth().catch(console.error);
    const timer = setTimeout(() => {
      if (!useAuthStore.getState()._hasHydrated) {
        useAuthStore.setState({ _hasHydrated: true });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [initializeAuth]);

  useEffect(() => {
    if (user) {
      fetchInitialData().catch(console.error);
      const timer = setTimeout(() => {
        if (!useDataStore.getState()._hasHydrated) {
          useDataStore.setState({ _hasHydrated: true });
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, fetchInitialData]);

  if (!isAuthHydrated) return <Loader />;

  return (
    <Router>
      <Toaster position="top-right" richColors />
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
