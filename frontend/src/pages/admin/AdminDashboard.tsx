import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Car, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Activity,
  AlertCircle,
  CheckCircle,
  Plus,
  Settings,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useToast } from '../../hooks/use-toast';
import { agencyService } from '../../services/agency.service';
import { userService } from '../../services/user.service';
import { vehicleService } from '../../services/vehicle.service';
import { bookingService } from '../../services/booking.service';
import { extractErrorMessage } from '../../utils/errorHandler';
import type { Agency, User, Booking } from '../../types';

interface SystemStats {
  totalAgencies: number;
  activeAgencies: number;
  totalUsers: number;
  totalVehicles: number;
  totalBookings: number;
  activeBookings: number;
  totalRevenue: string;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface RecentActivity {
  id: string;
  type: 'agency' | 'user' | 'booking' | 'vehicle';
  action: string;
  description: string;
  timestamp: string;
  status?: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    totalAgencies: 0,
    activeAgencies: 0,
    totalUsers: 0,
    totalVehicles: 0,
    totalBookings: 0,
    activeBookings: 0,
    totalRevenue: '0',
    systemHealth: 'healthy',
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load all system data
      const [agenciesData, usersData] = await Promise.all([
        agencyService.getAll(),
        userService.getAll(),
      ]);

      setAgencies(agenciesData);

      // Calculate aggregated stats
      let totalVehicles = 0;
      let totalBookings = 0;
      let activeBookings = 0;
      let totalRevenue = 0;

      // Fetch vehicles and bookings for each agency
      const vehiclePromises = agenciesData.map((agency) =>
        vehicleService.getAll(agency.id).catch(() => [])
      );
      const bookingPromises = agenciesData.map((agency) =>
        bookingService.getAll(agency.id).catch(() => [])
      );

      const allVehicles = await Promise.all(vehiclePromises);
      const allBookings = await Promise.all(bookingPromises);

      allVehicles.forEach((vehicles) => {
        totalVehicles += Array.isArray(vehicles) ? vehicles.length : 0;
      });

      allBookings.forEach((bookings) => {
        const bookingsArray = Array.isArray(bookings) ? bookings : [];
        totalBookings += bookingsArray.length;
        activeBookings += bookingsArray.filter((b: Booking) =>
          ['CONFIRMED', 'IN_PROGRESS'].includes(b.status)
        ).length;
        
        // Calculate revenue
        bookingsArray.forEach((b: Booking) => {
          if (b.paymentStatus === 'PAID' || b.paymentStatus === 'PARTIAL') {
            totalRevenue += parseFloat(b.totalAmount || '0');
          }
        });
      });

      // Determine system health
      const systemHealth = calculateSystemHealth(
        agenciesData.length,
        usersData.length,
        totalVehicles
      );

      setStats({
        totalAgencies: agenciesData.length,
        activeAgencies: agenciesData.filter((a) => a.isActive).length,
        totalUsers: usersData.length,
        totalVehicles,
        totalBookings,
        activeBookings,
        totalRevenue: totalRevenue.toFixed(2),
        systemHealth,
      });

      // Generate recent activities (mock data - in production, this would come from backend)
      generateRecentActivities(agenciesData, usersData, allBookings.flat());
    } catch (err) {
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      toast({
        title: 'Erreur',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSystemHealth = (
    agencies: number,
    users: number,
    vehicles: number
  ): 'healthy' | 'warning' | 'critical' => {
    if (agencies === 0 || users === 0) return 'critical';
    if (vehicles < 5) return 'warning';
    return 'healthy';
  };

  const generateRecentActivities = (
    agencies: Agency[],
    users: User[],
    bookings: Booking[]
  ) => {
    const activities: RecentActivity[] = [];

    // Add recent agencies (last 3)
    agencies.slice(-3).forEach((agency) => {
      activities.push({
        id: agency.id,
        type: 'agency',
        action: 'Nouvelle agence créée',
        description: agency.name,
        timestamp: agency.createdAt,
        status: agency.isActive ? 'active' : 'inactive',
      });
    });

    // Add recent users (last 3)
    users.slice(-3).forEach((user) => {
      activities.push({
        id: user.id,
        type: 'user',
        action: 'Nouvel utilisateur',
        description: `${user.fullName} (${user.role})`,
        timestamp: user.createdAt,
        status: user.isActive ? 'active' : 'inactive',
      });
    });

    // Add recent bookings (last 3)
    bookings.slice(-3).forEach((booking) => {
      activities.push({
        id: booking.id,
        type: 'booking',
        action: 'Nouvelle réservation',
        description: `Réservation #${booking.bookingNumber}`,
        timestamp: booking.createdAt,
        status: booking.status.toLowerCase(),
      });
    });

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setRecentActivities(activities.slice(0, 10));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'agency':
        return <Building2 className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'booking':
        return <Calendar className="h-4 w-4" />;
      case 'vehicle':
        return <Car className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getHealthBadge = () => {
    const { systemHealth } = stats;
    if (systemHealth === 'healthy') {
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Système Sain
        </Badge>
      );
    }
    if (systemHealth === 'warning') {
      return (
        <Badge variant="warning" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Attention
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Critique
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord système...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-gray-900">
                Tableau de Bord Administrateur
              </h1>
              {getHealthBadge()}
            </div>
            <p className="text-lg text-gray-600">
              Vue d'ensemble complète du système
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => navigate('/admin/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
            <Button
              className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600"
              onClick={() => navigate('/admin/agencies')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer une Agence
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Agences Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalAgencies}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {stats.activeAgencies} actives
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Utilisateurs Totaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalUsers}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Sur toutes les agences
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Véhicules Totaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalVehicles}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Dans le système
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <Car className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Réservations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalBookings}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {stats.activeBookings} actives
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Revenu Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {parseFloat(stats.totalRevenue).toLocaleString('fr-TN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                TND
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Toutes agences confondues
              </p>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate('/admin/reports')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Voir les Rapports
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => navigate('/admin/agencies')}
                >
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <span className="text-sm">Gérer les Agences</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => navigate('/admin/users')}
                >
                  <Users className="h-6 w-6 text-purple-600" />
                  <span className="text-sm">Gérer les Utilisateurs</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => navigate('/admin/settings')}
                >
                  <Settings className="h-6 w-6 text-gray-600" />
                  <span className="text-sm">Paramètres Système</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => window.location.reload()}
                >
                  <Activity className="h-6 w-6 text-green-600" />
                  <span className="text-sm">Actualiser les Données</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Top Agencies */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentActivities.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Aucune activité récente
                  </p>
                ) : (
                  recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-gray-100">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString('fr-FR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                      {activity.status && (
                        <Badge
                          variant={
                            activity.status === 'active' ||
                            activity.status === 'confirmed'
                              ? 'success'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Agencies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Principales Agences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {agencies.slice(0, 5).map((agency) => (
                  <div
                    key={agency.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/agencies`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Building2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {agency.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {agency.city}, {agency.country}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={agency.isActive ? 'success' : 'secondary'}
                      >
                        {agency.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">
                        {agency.subscriptionPlan}
                      </p>
                    </div>
                  </div>
                ))}
                {agencies.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Aucune agence trouvée
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
