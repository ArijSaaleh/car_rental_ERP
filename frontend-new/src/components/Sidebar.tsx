import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Car, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Settings,
  ChevronRight,
  Building2,
  UserCircle,
  CreditCard,
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: string;
}

interface SidebarProps {
  userRole?: 'super_admin' | 'proprietaire' | 'client';
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ userRole = 'proprietaire', isCollapsed = false, onToggle }: SidebarProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const getNavItems = (): NavItem[] => {
    if (userRole === 'super_admin') {
      return [
        { label: 'Tableau de bord', href: '/admin/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Utilisateurs', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
        { label: 'Agences', href: '/admin/agencies', icon: <Building2 className="h-5 w-5" /> },
        { label: 'Statistiques', href: '/admin/stats', icon: <BarChart3 className="h-5 w-5" /> },
        { label: 'Paramètres', href: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
      ];
    }
    
    if (userRole === 'proprietaire') {
      return [
        { label: 'Tableau de bord', href: '/owner/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Mes Agences', href: '/owner/agencies', icon: <Building2 className="h-5 w-5" /> },
        { label: 'Flotte', href: '/owner/vehicles', icon: <Car className="h-5 w-5" /> },
        { label: 'Réservations', href: '/owner/bookings', icon: <Calendar className="h-5 w-5" /> },
        { label: 'Clients', href: '/owner/clients', icon: <Users className="h-5 w-5" /> },
        { label: 'Contrats', href: '/owner/contracts', icon: <FileText className="h-5 w-5" /> },
        { label: 'Paiements', href: '/owner/payments', icon: <CreditCard className="h-5 w-5" /> },
      ];
    }
    
    return [
      { label: 'Mes Réservations', href: '/bookings', icon: <Calendar className="h-5 w-5" /> },
      { label: 'Véhicules', href: '/vehicles', icon: <Car className="h-5 w-5" /> },
      { label: 'Mon Profil', href: '/profile', icon: <UserCircle className="h-5 w-5" /> },
    ];
  };

  const navItems = getNavItems();

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className={cn("py-6 border-b border-white/10", isCollapsed ? "px-3" : "px-6")}>
        <button 
          onClick={onToggle}
          className={cn(
            "flex items-center group w-full hover:opacity-80 transition-opacity bg-transparent border-none",
            isCollapsed ? "justify-center" : "gap-3 text-left"
          )}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-50"></div>
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50 group-hover:scale-105 transition-transform">
              <Car className="h-6 w-6 text-white" />
            </div>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-white">
                DriveFlow
              </h1>
              <p className="text-xs text-gray-400">Car Rental</p>
            </div>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 py-6 space-y-1 overflow-y-auto", isCollapsed ? "px-2" : "px-4")}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center rounded-xl transition-all duration-200 group relative",
                isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3 gap-3",
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={cn(
                "transition-all duration-200",
                isActive ? "text-white scale-110" : "text-gray-400 group-hover:text-blue-400 group-hover:scale-110"
              )}>
                {item.icon}
              </span>
              {!isCollapsed && <span className="font-medium flex-1">{item.label}</span>}
              {!isCollapsed && item.badge && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
                  {item.badge}
                </span>
              )}
              {!isCollapsed && isActive && (
                <ChevronRight className="h-4 w-4 ml-auto text-white" />
              )}
            </Link>
          );
        })}
      </nav>


    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white shadow-lg rounded-xl hover:bg-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className={cn(
        "hidden lg:flex bg-gray-900 border-r border-white/10 flex-col transition-all duration-300 h-full",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 bottom-0 h-full w-72 bg-gray-900 border-r border-white/10 flex-col z-40 transition-transform duration-300",
          isOpen ? "translate-x-0 flex" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
