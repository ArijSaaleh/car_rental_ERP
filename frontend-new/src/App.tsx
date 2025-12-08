import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Bookings from './pages/Bookings';
import Customers from './pages/Customers';
import Contracts from './pages/Contracts';
import Payments from './pages/Payments';
import AdminDashboard from './pages/admin/AdminDashboard';
import AgencyManagement from './pages/admin/AgencyManagement';
import Users from './pages/admin/Users';
import SystemSettings from './pages/admin/SystemSettings';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import MyAgencies from './pages/owner/MyAgencies';
import AgencyManagers from './pages/owner/AgencyManagers';
import EmployeeManagement from './pages/owner/EmployeeManagement';
import VehicleManagement from './pages/owner/VehicleManagement';
import ClientManagement from './pages/owner/ClientManagement';
import ContractManagement from './pages/owner/ContractManagement';
import ProtectedRoute from './components/ProtectedRoute';
import { authService } from './services/auth.service';

function App() {
  const isAuthenticated = authService.isAuthenticated();

  return (
    <BrowserRouter>
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
          <Route path="vehicles" element={<VehicleManagement />} />
          <Route path="clients" element={<ClientManagement />} />
          <Route path="contracts" element={<ContractManagement />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
