import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Car,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  UserCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { authService } from '../services/auth.service';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const user = authService.getCurrentUserFromStorage();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navigation = user?.role === 'super_admin'
    ? [
        { name: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Gestion Agences', href: '/admin/agencies', icon: Building2 },
        { name: 'Tous les Utilisateurs', href: '/admin/users', icon: Users },
        { name: 'Paramètres Système', href: '/admin/settings', icon: Settings },
      ]
    : user?.role === 'proprietaire'
    ? [
        { name: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
        { name: 'Mes Agences', href: '/owner/agencies', icon: Building2 },
        { name: 'Employés', href: '/owner/employees', icon: Users },
        { name: 'Véhicules', href: '/owner/vehicles', icon: Car },
        { name: 'Clients', href: '/owner/clients', icon: Users },
        { name: 'Réservations', href: '/owner/bookings', icon: Calendar },
        { name: 'Contrats', href: '/owner/contracts', icon: FileText },
        { name: 'Gestionnaires', href: '/owner/managers', icon: UserCircle },
      ]
    : [
        { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Véhicules', href: '/dashboard/vehicles', icon: Car },
        { name: 'Réservations', href: '/dashboard/bookings', icon: Calendar },
        { name: 'Clients', href: '/dashboard/customers', icon: Users },
        { name: 'Contrats', href: '/dashboard/contracts', icon: FileText },
        { name: 'Paiements', href: '/dashboard/payments', icon: CreditCard },
        { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
      ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Car Rental</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.nom} {user?.prenom}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-800">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-200 ${sidebarOpen ? 'lg:pl-64' : ''}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-600 dark:text-slate-400"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="ml-4 flex-1">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                Gestion de Location de Véhicules
              </h1>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
