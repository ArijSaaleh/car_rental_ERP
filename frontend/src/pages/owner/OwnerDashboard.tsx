import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Car, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useToast } from '../../hooks/use-toast';
import { agencyService } from '../../services/agency.service';
import { vehicleService } from '../../services/vehicle.service';
import { bookingService } from '../../services/booking.service';
import type { Agency } from '../../types';

interface DashboardStats {
  totalAgencies: number;
  totalVehicles: number;
  totalBookings: number;
  totalRevenue: string;
  availableVehicles: number;
  activeBookings: number;
}

export default function OwnerDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalAgencies: 0,
    totalVehicles: 0,
    totalBookings: 0,
    totalRevenue: '0',
    availableVehicles: 0,
    activeBookings: 0,
  });
  const [agencies, setAgencies] = useState<Agency[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load agencies (owner sees only their agencies)
      const agenciesData = await agencyService.getAll();
      setAgencies(agenciesData);

      // Calculate aggregated stats across all owned agencies
      let totalVehicles = 0;
      let totalBookings = 0;
      let availableVehicles = 0;
      let activeBookings = 0;

      // Fetch vehicles and bookings for each agency
      const promises = agenciesData.map(async (agency) => {
        const [vehicles, bookings] = await Promise.all([
          vehicleService.getAll({ agencyId: agency.id }),
          bookingService.getAll(agency.id),
        ]);

        totalVehicles += vehicles.length;
        availableVehicles += vehicles.filter((v: any) => v.status === 'DISPONIBLE').length;
        
        const bookingsArray = Array.isArray(bookings) ? bookings : [];
        totalBookings += bookingsArray.length;
        activeBookings += bookingsArray.filter((b: any) => 
          ['CONFIRMED', 'IN_PROGRESS'].includes(b.status)
        ).length;
      });

      await Promise.all(promises);

      setStats({
        totalAgencies: agenciesData.length,
        totalVehicles,
        totalBookings,
        totalRevenue: '0', // TODO: Implement revenue calculation from payments
        availableVehicles,
        activeBookings,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du tableau de bord',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Agences',
      value: stats.totalAgencies,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      onClick: () => navigate('/owner/agencies'),
    },
    {
      title: 'Véhicules Totaux',
      value: stats.totalVehicles,
      icon: Car,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      detail: `${stats.availableVehicles} disponibles`,
      onClick: () => navigate('/owner/vehicles'),
    },
    {
      title: 'Réservations',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      detail: `${stats.activeBookings} actives`,
      onClick: () => navigate('/owner/bookings'),
    },
    {
      title: 'Revenus Totaux',
      value: `${stats.totalRevenue} TND`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      onClick: () => navigate('/owner/payments'),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-slate-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tableau de Bord Propriétaire</h1>
          <p className="text-slate-600 mt-1">Vue d'ensemble de toutes vos agences</p>
        </div>
        <Button onClick={() => navigate('/owner/agencies')}>
          <Building2 className="w-4 h-4 mr-2" />
          Nouvelle Agence
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
              onClick={stat.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.detail && (
                  <p className="text-xs text-slate-600 mt-1">{stat.detail}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Agencies List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Mes Agences
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agencies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Aucune agence
              </h3>
              <p className="text-slate-600 mb-4">
                Commencez par créer votre première agence
              </p>
              <Button onClick={() => navigate('/owner/agencies')}>
                <Building2 className="w-4 h-4 mr-2" />
                Créer une Agence
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agencies.map((agency) => (
                <Card
                  key={agency.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/owner/agencies')}
                >
                  <CardContent className="pt-6">\n                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{agency.name}</h3>
                        <p className="text-sm text-slate-600">{agency.city}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          agency.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {agency.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{agency.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>{agency.subscriptionPlan || 'Basic'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
