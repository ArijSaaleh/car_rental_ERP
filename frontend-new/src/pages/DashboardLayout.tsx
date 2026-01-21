import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { authService } from '../services/auth.service';
import { UserMenu } from '../components/UserMenu';
import { useState } from 'react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const user = authService.getCurrentUserFromStorage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex">
      {/* Sidebar */}
      <Sidebar 
        userRole={user?.role as 'super_admin' | 'proprietaire' | 'client'} 
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 overflow-auto">
        {/* Header with User Menu */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-end">
            <UserMenu />
          </div>
        </header>
        
        <main className="w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
