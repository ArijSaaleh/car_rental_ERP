import { useEffect, useState } from 'react';
import { 
  Building2, 
  Users, 
  Car, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Activity,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorHandler';

interface AdminStats {
  total_agencies: number;
  active_agencies: number;
  total_users: number;
  total_vehicles: number;
  total_customers: number;
  total_bookings: number;
  total_revenue: number;
}

interface Agency {
  id: string;
  name: string;
  legal_name: string;
  email: string;
  phone: string;
  city: string;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
  parent_agency_id?: string | null;
  is_main: boolean;
  branch_count: number;
  manager_count: number;
  employee_count: number;
  vehicle_count: number;
  customer_count: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    total_agencies: 0,
    active_agencies: 0,
    total_users: 0,
    total_vehicles: 0,
    total_customers: 0,
    total_bookings: 0,
    total_revenue: 0,
  });
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats({
        total_agencies: response.data.total_agencies,
        active_agencies: response.data.active_agencies,
        total_users: response.data.total_users,
        total_vehicles: response.data.total_vehicles,
        total_customers: response.data.total_customers,
        total_bookings: response.data.total_bookings,
        total_revenue: typeof response.data.total_revenue === 'string' 
          ? parseFloat(response.data.total_revenue) 
          : response.data.total_revenue,
      });
      setAgencies(response.data.agencies || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Agences',
      value: stats.total_agencies,
      subtitle: `${stats.active_agencies} actives`,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Utilisateurs',
      value: stats.total_users,
      subtitle: 'Tous rôles',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Véhicules',
      value: stats.total_vehicles,
      subtitle: 'Toutes agences',
      icon: Car,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Clients',
      value: stats.total_customers,
      subtitle: 'Base totale',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Réservations',
      value: stats.total_bookings,
      subtitle: 'Total système',
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Revenu Total',
      value: `${stats.total_revenue.toFixed(2)} DT`,
      subtitle: 'Toutes agences',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ];

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      basique: 'bg-gray-100 text-gray-800',
      standard: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
    };
    return (
      <Badge className={colors[plan] || 'bg-gray-100 text-gray-800'}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-slate-600">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Administration Système
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Vue d'ensemble de toutes les agences et statistiques globales
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </div>
                <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Activity Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-white border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8" />
            <div>
              <CardTitle className="text-2xl">Activité du Système</CardTitle>
              <p className="text-white/90 text-sm mt-1">
                Plateforme SaaS Multi-Tenant en cours d'exécution
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">{stats.active_agencies}</div>
              <div className="text-sm text-white/80">Agences Actives</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total_vehicles}</div>
              <div className="text-sm text-white/80">Flotte Totale</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total_bookings}</div>
              <div className="text-sm text-white/80">Réservations</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                <TrendingUp className="h-6 w-6 inline mr-1" />
                {((stats.active_agencies / Math.max(stats.total_agencies, 1)) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-white/80">Taux d'Activation</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agencies Table with Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Agences (Vue Hiérarchique)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agence</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Utilisateurs</TableHead>
                <TableHead>Véhicules</TableHead>
                <TableHead>Clients</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    Aucune agence enregistrée
                  </TableCell>
                </TableRow>
              ) : (
                agencies
                  .filter(a => a.is_main) // Only main agencies at top level
                  .map((mainAgency) => {
                    const branches = agencies.filter(a => a.parent_agency_id === mainAgency.id);
                    return (
                      <>
                        {/* Main Agency Row */}
                        <TableRow key={mainAgency.id} className="bg-blue-50 font-semibold">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-blue-600" />
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {mainAgency.name}
                                  <Badge className="bg-blue-600 text-white text-xs">
                                    Principal
                                  </Badge>
                                  {mainAgency.branch_count > 0 && (
                                    <span className="text-xs text-blue-600">
                                      ({mainAgency.branch_count} succursale{mainAgency.branch_count > 1 ? 's' : ''})
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-slate-500">{mainAgency.legal_name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{mainAgency.email}</div>
                              <div className="text-slate-500">{mainAgency.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>{mainAgency.city}</TableCell>
                          <TableCell>{getPlanBadge(mainAgency.subscription_plan)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{mainAgency.manager_count + mainAgency.employee_count}</div>
                              <div className="text-slate-500">
                                {mainAgency.manager_count} managers
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{mainAgency.vehicle_count}</TableCell>
                          <TableCell>{mainAgency.customer_count}</TableCell>
                          <TableCell>
                            {getStatusBadge(mainAgency.is_active)}
                          </TableCell>
                        </TableRow>

                        {/* Branch Rows (indented) */}
                        {branches.map((branch) => (
                          <TableRow key={branch.id} className="bg-slate-50">
                            <TableCell>
                              <div className="flex items-center gap-2 pl-8">
                                <div className="text-slate-400">└─</div>
                                <Building2 className="h-4 w-4 text-slate-400" />
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {branch.name}
                                    <Badge className="bg-slate-100 text-slate-600 text-xs">
                                      Succursale
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-slate-500">{branch.legal_name}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{branch.email}</div>
                                <div className="text-slate-500">{branch.phone}</div>
                              </div>
                            </TableCell>
                            <TableCell>{branch.city}</TableCell>
                            <TableCell>{getPlanBadge(branch.subscription_plan)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{branch.manager_count + branch.employee_count}</div>
                                <div className="text-slate-500">
                                  {branch.manager_count} managers
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{branch.vehicle_count}</TableCell>
                            <TableCell>{branch.customer_count}</TableCell>
                            <TableCell>
                              {getStatusBadge(branch.is_active)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    );
                  })
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
