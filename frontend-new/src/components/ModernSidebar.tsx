import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Car, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
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

interface ModernSidebarProps {
  userRole?: 'super_admin' | 'proprietaire' | 'client';
  userName?: string;
  onLogout?: () => void;
}

export function ModernSidebar({ userRole = 'proprietaire', userName = 'User', onLogout }: ModernSidebarProps) {
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
        { label: 'Tableau de bord', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Mes Agences', href: '/owner/agencies', icon: <Building2 className="h-5 w-5" /> },
        { label: 'Flotte', href: '/owner/fleet', icon: <Car className="h-5 w-5" /> },
        { label: 'Réservations', href: '/owner/bookings', icon: <Calendar className="h-5 w-5" /> },
        { label: 'Clients', href: '/owner/clients', icon: <Users className="h-5 w-5" /> },
        { label: 'Contrats', href: '/owner/contracts', icon: <FileText className="h-5 w-5" /> },
        { label: 'Paiements', href: '/payments', icon: <CreditCard className="h-5 w-5" /> },
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
      <div className="px-6 py-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-primary">
            <Car className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              DriveFlow
            </h1>
            <p className="text-xs text-muted-foreground">Car Rental</p>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="px-6 py-6 border-b border-border/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
          <div className="h-10 w-10 rounded-full bg-gradient-accent flex items-center justify-center text-white font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {userRole === 'super_admin' ? 'Administrateur' : 
               userRole === 'proprietaire' ? 'Propriétaire' : 'Client'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-gradient-primary text-white shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <span className={cn(
                "transition-transform duration-200",
                isActive ? "scale-110" : "group-hover:scale-110"
              )}>
                {item.icon}
              </span>
              <span className="font-medium flex-1">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full bg-accent text-white text-xs font-semibold">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-6 border-t border-border/50">
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Déconnexion
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm shadow-lg rounded-xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-white/90 backdrop-blur-xl border-r border-border/50 flex-col">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white/95 backdrop-blur-xl border-r border-border/50 flex-col z-40 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
