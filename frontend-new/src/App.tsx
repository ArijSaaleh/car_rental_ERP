import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { authService } from './services/auth.service';

// Eager load critical components
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

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
const AgencyManagers = lazy(() => import('./pages/owner/AgencyManagers'));
const EmployeeManagement = lazy(() => import('./pages/owner/EmployeeManagement'));
const FleetManagement = lazy(() => import('./pages/owner/FleetManagement'));
const ClientManagement = lazy(() => import('./pages/owner/ClientManagement'));
const ContractManagement = lazy(() => import('./pages/owner/ContractManagement'));
const BookingManagement = lazy(() => import('./pages/owner/BookingManagement'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  const isAuthenticated = authService.isAuthenticated();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
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

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
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

        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={['proprietaire']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="agencies" element={<MyAgencies />} />
          <Route path="managers" element={<AgencyManagers />} />
          <Route path="employees" element={<EmployeeManagement />} />
          <Route path="vehicles" element={<FleetManagement />} />
          <Route path="clients" element={<ClientManagement />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="contracts" element={<ContractManagement />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
