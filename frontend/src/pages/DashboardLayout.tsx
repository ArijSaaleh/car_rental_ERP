import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { authService } from '../services/auth.service';
import { UserMenu } from '../components/UserMenu';
import { useState } from 'react';
import type { User } from '../types';

export default function DashboardLayout() {
  const user = authService.getCurrentUserFromStorage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Map user role to sidebar role type
  const getSidebarRole = (userRole: User['role'] | undefined): 'SUPER_ADMIN' | 'PROPRIETAIRE' | 'MANAGER' | 'CLIENT' => {
    if (!userRole) return 'CLIENT';
    
    switch (userRole) {
      case 'SUPER_ADMIN':
        return 'SUPER_ADMIN';
      case 'PROPRIETAIRE':
        return 'PROPRIETAIRE';
      case 'MANAGER':
      case 'AGENT_COMPTOIR':
      case 'AGENT_PARC':
        return 'MANAGER';
      case 'CLIENT':
      default:
        return 'CLIENT';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-screen z-40">
        <Sidebar 
          userRole={getSidebarRole(user?.role)} 
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* Main Content with left margin for sidebar */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
        {/* Sticky Header with User Menu */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-end">
            <UserMenu />
          </div>
        </header>
        
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
