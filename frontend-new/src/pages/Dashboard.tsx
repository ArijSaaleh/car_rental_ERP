import { useEffect, useState } from 'react';
import { Car, Users, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { vehicleService } from '../services/vehicle.service';
import { bookingService } from '../services/booking.service';
import { customerService } from '../services/customer.service';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    totalBookings: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [vehicles, bookings, customers] = await Promise.all([
        vehicleService.getAll(),
        bookingService.getAll(),
        customerService.getAll(),
      ]);

      setStats({
        totalVehicles: vehicles.length,
        availableVehicles: vehicles.filter((v) => v.statut === 'disponible').length,
        totalBookings: bookings.length,
        totalCustomers: customers.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
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
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-slate-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Tableau de bord
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Welcome Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-white border-0">
        <CardHeader>
          <CardTitle className="text-2xl">Bienvenue sur Car Rental ERP</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/90">
            Gérez efficacement votre flotte de véhicules, vos réservations et vos clients
            depuis cette interface moderne et intuitive.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
