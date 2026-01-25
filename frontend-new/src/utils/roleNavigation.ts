import type { User } from '../types';

/**
 * Get the default dashboard route for a user based on their role
 */
export const getDefaultDashboard = (user: User | null): string => {
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

/**
 * Check if a user has permission to access a specific route
 */
export const canAccessRoute = (user: User | null, route: string): boolean => {
  if (!user) return false;

  const role = user.role as string;

  // Super admin can access all routes
  if (role === 'SUPER_ADMIN') return true;

  // Check role-specific routes
  if (route.startsWith('/admin/')) {
    return role === 'SUPER_ADMIN';
  }

  if (route.startsWith('/owner/')) {
    return role === 'PROPRIETAIRE';
  }

  if (route.startsWith('/dashboard/')) {
    return ['MANAGER', 'AGENT_COMPTOIR', 'AGENT_PARC'].includes(role);
  }

  if (route.startsWith('/client/')) {
    return role === 'CLIENT';
  }

  return true; // Allow access to public routes
};

/**
 * Get navigation items based on user role
 */
export const getRoleBasedNavigation = (role: User['role']) => {
  const baseRoutes = {
    SUPER_ADMIN: [
      { path: '/admin/dashboard', label: 'Tableau de bord' },
      { path: '/admin/users', label: 'Utilisateurs' },
      { path: '/admin/agencies', label: 'Agences' },
      { path: '/admin/settings', label: 'Paramètres' },
    ],
    PROPRIETAIRE: [
      { path: '/owner/dashboard', label: 'Tableau de bord' },
      { path: '/owner/new-rental', label: 'Nouvelle Location' },
      { path: '/owner/agencies', label: 'Mes Agences' },
      { path: '/owner/vehicles', label: 'Flotte' },
      { path: '/owner/bookings', label: 'Réservations' },
      { path: '/owner/clients', label: 'Clients' },
      { path: '/owner/contracts', label: 'Contrats' },
      { path: '/owner/payments', label: 'Paiements' },
    ],
    MANAGER: [
      { path: '/dashboard', label: 'Tableau de bord' },
      { path: '/dashboard/vehicles', label: 'Véhicules' },
      { path: '/dashboard/bookings', label: 'Réservations' },
      { path: '/dashboard/customers', label: 'Clients' },
      { path: '/dashboard/contracts', label: 'Contrats' },
      { path: '/dashboard/payments', label: 'Paiements' },
    ],
    AGENT_COMPTOIR: [
      { path: '/dashboard', label: 'Tableau de bord' },
      { path: '/dashboard/bookings', label: 'Réservations' },
      { path: '/dashboard/customers', label: 'Clients' },
      { path: '/dashboard/contracts', label: 'Contrats' },
      { path: '/dashboard/payments', label: 'Paiements' },
    ],
    AGENT_PARC: [
      { path: '/dashboard', label: 'Tableau de bord' },
      { path: '/dashboard/vehicles', label: 'Véhicules' },
      { path: '/dashboard/bookings', label: 'Réservations' },
    ],
    CLIENT: [
      { path: '/client/bookings', label: 'Mes Réservations' },
      { path: '/client/vehicles', label: 'Véhicules' },
      { path: '/client/profile', label: 'Mon Profil' },
    ],
  };

  return baseRoutes[role] || [];
};

/**
 * Redirect to appropriate dashboard after login
 */
export const redirectAfterLogin = (user: User): string => {
  return getDefaultDashboard(user);
};
