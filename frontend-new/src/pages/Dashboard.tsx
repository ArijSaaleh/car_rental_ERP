import { useEffect, useState } from 'react';
import { Car, Users, Calendar, TrendingUp, BarChart3, DollarSign, Activity, Sparkles } from 'lucide-react';
import { StatsCard, MiniStatsCard } from '../components/StatsCard';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { vehicleService } from '../services/vehicle.service';
import { bookingService } from '../services/booking.service';
import { customerService } from '../services/customer.service';
import { agencyService } from '../services/agency.service';
import { authService } from '../services/auth.service';
import { extractErrorMessage } from '../utils/errorHandler';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    totalBookings: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const user = authService.getCurrentUserFromStorage();
      let agencyId = user?.agency_id;

      // If owner without direct agency_id, load their main agency
      if (!agencyId && user?.role === 'proprietaire') {
        try {
          const agencies = await agencyService.getAll();
          // Filter main agencies (those without parent_agency_id)
          const mainAgencies = agencies.filter((a: any) => !a.parent_agency_id);
          if (mainAgencies.length > 0) {
            agencyId = mainAgencies[0].id;
          } else if (agencies.length > 0) {
            // Fallback to first agency if no main agency found
            agencyId = agencies[0].id;
          }
        } catch (err) {
          console.error('Failed to load agencies:', err);
        }
      }

      if (!agencyId) {
        setError('Aucune agence trouvée. Veuillez créer une agence ou vous reconnecter.');
        setLoading(false);
        return;
      }

      const [vehicles, bookings, customers] = await Promise.all([
        vehicleService.getAll(agencyId),
        bookingService.getAll(agencyId),
        customerService.getAll(agencyId),
      ]);

      setStats({
        totalVehicles: vehicles.length,
        availableVehicles: vehicles.filter((v) => v.status === 'disponible').length,
        totalBookings: bookings.length,
        totalCustomers: customers.length,
      });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Véhicules',
      value: stats.totalVehicles,
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Véhicules Disponibles',
      value: stats.availableVehicles,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Réservations',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Clients',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Tableau de bord
            </h1>
            <p className="text-lg text-gray-600">
              Vue d'ensemble de votre activité
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-100">
              <BarChart3 className="h-4 w-4 mr-2" />
              Rapports
            </Button>
            <Button className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30">
              <Sparkles className="h-4 w-4 mr-2" />
              Nouvelle Réservation
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="animate-scale-in">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Véhicules"
            value={stats.totalVehicles}
            icon={<Car className="h-6 w-6" />}
            trend={{ value: 12, label: "vs mois dernier" }}
            variant="primary"
          />
          
          <StatsCard
            title="Véhicules Disponibles"
            value={stats.availableVehicles}
            icon={<TrendingUp className="h-6 w-6" />}
            trend={{ value: 8.5, label: "vs mois dernier" }}
            variant="success"
          />
          
          <StatsCard
            title="Réservations"
            value={stats.totalBookings}
            icon={<Calendar className="h-6 w-6" />}
            trend={{ value: -2.4, label: "vs mois dernier" }}
            variant="accent"
          />
          
          <StatsCard
            title="Clients"
            value={stats.totalCustomers}
            icon={<Users className="h-6 w-6" />}
            trend={{ value: 5.1, label: "vs mois dernier" }}
            variant="warning"
          />
        </div>

        {/* Mini Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniStatsCard
            label="Véhicules actifs"
            value={stats.availableVehicles}
            icon={<Activity className="h-4 w-4" />}
            color="green"
          />
          <MiniStatsCard
            label="En maintenance"
            value={stats.totalVehicles - stats.availableVehicles}
            icon={<Car className="h-4 w-4" />}
            color="orange"
          />
          <MiniStatsCard
            label="Clients actifs"
            value={stats.totalCustomers}
            icon={<Users className="h-4 w-4" />}
            color="blue"
          />
          <MiniStatsCard
            label="Taux d'occupation"
            value="85%"
            icon={<TrendingUp className="h-4 w-4" />}
            color="purple"
          />
        </div>

      

        {/* Performance Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Réservations récentes</h3>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Graphique des réservations</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Activité de la flotte</h3>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
              <div className="text-center">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Graphique d'activité</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
