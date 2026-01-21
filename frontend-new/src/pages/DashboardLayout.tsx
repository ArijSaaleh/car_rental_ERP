import { Outlet, useNavigate } from 'react-router-dom';
import { ModernSidebar } from '../components/ModernSidebar';
import { authService } from '../services/auth.service';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const user = authService.getCurrentUserFromStorage();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const userName = user?.nom && user?.prenom 
    ? `${user.prenom} ${user.nom}` 
    : user?.email || 'User';

  return (
    <div className="min-h-screen bg-background flex">
      {/* Modern Sidebar */}
      <ModernSidebar 
        userRole={user?.role as 'super_admin' | 'proprietaire' | 'client'} 
        userName={userName}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 overflow-auto">
        <main className="w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
