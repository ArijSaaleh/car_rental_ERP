import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { authService } from '../services/auth.service';
import { UserMenu } from '../components/UserMenu';
import { useState } from 'react';

export default function DashboardLayout() {
  const user = authService.getCurrentUserFromStorage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-screen z-40">
        <Sidebar 
          userRole={user?.role as 'super_admin' | 'proprietaire' | 'client'} 
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
