import { lazy, Suspense } from 'react';
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

const Loader = () => (
  <div className="min-h-screen bg-bg flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
  const { user } = useAuthStore();
  const { _hasHydrated } = useDataStore();

  if (!_hasHydrated) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'technician' ? '/tecnico' : '/'} replace />;
  }

  return <>{children}</>;
};

function App() {
  const { user } = useAuthStore();

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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
