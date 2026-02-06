import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { authService } from './services/auth.service';
import { Toaster } from './components/ui/toaster';
import { OfflineIndicator } from './components/OfflineIndicator';
import type { User } from './types';

// Eager load critical components
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './pages/Unauthorized';

// Helper function to get default dashboard route based on user role
const getDefaultDashboard = (user: User | null): string => {
  if (!user) return '/login';
  
  switch (user.role) {
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    case 'PROPRIETAIRE':
      return '/owner/dashboard';
    case 'MANAGER':
    case 'AGENT_COMPTOIR':
    case 'AGENT_PARC':
      return '/dashboard';
    case 'CLIENT':
      return '/client/bookings';
    default:
      return '/dashboard';
  }
};

// Lazy load routes for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Customers = lazy(() => import('./pages/Customers'));
const Contracts = lazy(() => import('./pages/Contracts'));
const Payments = lazy(() => import('./pages/Payments'));

// Admin routes
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AgencyManagement = lazy(() => import('./pages/admin/AgencyManagement'));
const Users = lazy(() => import('./pages/admin/Users'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));

// Owner routes
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard'));
const MyAgencies = lazy(() => import('./pages/owner/MyAgencies'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUserFromStorage();
  const defaultDashboard = getDefaultDashboard(user);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to={defaultDashboard} replace /> : <Login />}
            />
            
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Root redirect to appropriate dashboard */}
            <Route path="/" element={<Navigate to={defaultDashboard} replace />} />
            
            {/* Legacy redirects for backward compatibility */}
            <Route path="/vehicles" element={<Navigate to="/dashboard/vehicles" replace />} />
            <Route path="/bookings" element={<Navigate to="/dashboard/bookings" replace />} />
            <Route path="/customers" element={<Navigate to="/dashboard/customers" replace />} />
            <Route path="/contracts" element={<Navigate to="/dashboard/contracts" replace />} />
            <Route path="/payments" element={<Navigate to="/dashboard/payments" replace />} />

            {/* Super Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="agencies" element={<AgencyManagement />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<SystemSettings />} />
            </Route>

            {/* Owner Routes */}
            <Route
              path="/owner"
              element={
                <ProtectedRoute allowedRoles={['PROPRIETAIRE']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<OwnerDashboard />} />
              <Route path="agencies" element={<MyAgencies />} />
              {/* Owner can access all shared management pages */}
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="customers" element={<Customers />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="payments" element={<Payments />} />
            </Route>

            {/* Manager/Agent Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'AGENT_COMPTOIR', 'AGENT_PARC']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="customers" element={<Customers />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="payments" element={<Payments />} />
            </Route>

            {/* Client Routes */}
            <Route
              path="/client"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="bookings" replace />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="profile" element={<Customers />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster />
        <OfflineIndicator />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
