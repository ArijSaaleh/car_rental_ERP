import { useEffect, useState } from 'react';
import { Building2, Users, Car, Calendar, TrendingUp, DollarSign, BarChart3, Activity, ArrowUpRight, Sparkles } from 'lucide-react';
import { StatsCard, MiniStatsCard } from '../../components/StatsCard';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorHandler';
import { agencyService } from '../../services/agency.service';

interface AgencyListItem {
  id: string;
  name: string;
  legal_name: string;
  email: string;
  phone: string;
  city: string;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
  manager_count: number;
  employee_count: number;
  vehicle_count: number;
  customer_count: number;
}

interface MultiAgencyStats {
  total_agencies: number;
  active_agencies: number;
  total_users: number;
  total_vehicles: number;
  total_customers: number;
  total_bookings: number;
  total_revenue: number;
  agencies: AgencyListItem[];
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState<MultiAgencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      // Get all agencies owned by this owner
      const agencies = await agencyService.getAll();
      
      if (agencies.length === 0) {
        setError('Aucune agence trouvée. Veuillez créer une agence.');
        setLoading(false);
        return;
      }

      // Aggregate statistics from all agencies
      let totalVehicles = 0;
      let totalCustomers = 0;
      let totalBookings = 0;
      let totalRevenue = 0;
      const agencyList: AgencyListItem[] = [];

      for (const agency of agencies) {
        try {
          // Get stats for each agency
          const [vehiclesRes, customersRes, bookingsRes] = await Promise.all([
            api.get(`/vehicles?agency_id=${agency.id}`),
            api.get(`/customers?agency_id=${agency.id}`),
            api.get(`/bookings?agency_id=${agency.id}`)
          ]);

          const vehicles = Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [];
          const customers = Array.isArray(customersRes.data) ? customersRes.data : [];
          const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];

          totalVehicles += vehicles.length;
          totalCustomers += customers.length;
          totalBookings += bookings.length;
          
          // Calculate revenue from bookings
          const agencyRevenue = bookings.reduce((sum: number, booking: any) => {
            return sum + (parseFloat(booking.total_price) || 0);
          }, 0);
          totalRevenue += agencyRevenue;

          agencyList.push({
            id: agency.id,
            name: agency.name,
            legal_name: agency.legal_name || agency.name,
            email: agency.email,
            phone: agency.phone,
            city: agency.city,
            subscription_plan: agency.subscription_plan || 'basic',
            is_active: agency.is_active !== false,
            created_at: agency.created_at,
            manager_count: 0, // Could be enhanced later
            employee_count: 0, // Could be enhanced later
            vehicle_count: vehicles.length,
            customer_count: customers.length,
          });
        } catch (agencyError) {
          console.error(`Error loading stats for agency ${agency.id}:`, agencyError);
        }
      }

      const normalizedData: MultiAgencyStats = {
        total_agencies: agencies.length,
        active_agencies: agencies.filter((a: any) => a.is_active !== false).length,
        total_users: 0, // Could be enhanced later
        total_vehicles: totalVehicles,
        total_customers: totalCustomers,
        total_bookings: totalBookings,
        total_revenue: totalRevenue,
        agencies: agencyList,
      };

      setStats(normalizedData);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
              Nouvelle Agence
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="animate-scale-in">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {stats && (
          <>
            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Agences Actives"
                value={stats.active_agencies}
                icon={<Building2 className="h-6 w-6" />}
                trend={{ value: 12, label: "vs mois dernier" }}
                variant="primary"
              />
              
              <StatsCard
                title="Revenus Totaux"
                value={`${stats.total_revenue.toLocaleString('fr-FR')}DT`}
                icon={<DollarSign className="h-6 w-6" />}
                trend={{ value: 8.5, label: "vs mois dernier" }}
                variant="success"
              />
              
              <StatsCard
                title="Réservations"
                value={stats.total_bookings}
                icon={<Calendar className="h-6 w-6" />}
                trend={{ value: -3.2, label: "vs mois dernier" }}
                variant="accent"
              />
              
              <StatsCard
                title="Flotte Totale"
                value={stats.total_vehicles}
                icon={<Car className="h-6 w-6" />}
                trend={{ value: 5.1, label: "vs mois dernier" }}
                variant="warning"
              />
            </div>

            {/* Mini Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MiniStatsCard
                label="Total Agences"
                value={stats.total_agencies}
                icon={<Building2 className="h-4 w-4" />}
                color="blue"
              />
              <MiniStatsCard
                label="Utilisateurs"
                value={stats.total_users}
                icon={<Users className="h-4 w-4" />}
                color="purple"
              />
              <MiniStatsCard
                label="Clients"
                value={stats.total_customers}
                icon={<Users className="h-4 w-4" />}
                color="green"
              />
              <MiniStatsCard
                label="Taux d'occupation"
                value="78%"
                icon={<Activity className="h-4 w-4" />}
                color="orange"
              />
            </div>

            {/* Agencies Overview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Mes Agences</h2>
                  <p className="text-sm text-gray-600">
                    Gestion et performance de vos agences
                  </p>
                </div>
                <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-100">
                  Voir toutes les agences
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                <div className="space-y-1 divide-y divide-gray-100">
                  {stats.agencies.slice(0, 5).map((agency) => (
                    <div
                      key={agency.id}
                      className="flex items-center justify-between p-6 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-md shadow-blue-500/30">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg">{agency.name}</h3>
                          <p className="text-sm text-gray-600 truncate">
                            {agency.city} • {agency.email}
                          </p>
                        </div>
                      </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{agency.vehicle_count}</p>
                        <p className="text-xs text-gray-600">Véhicules</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{agency.customer_count}</p>
                        <p className="text-xs text-gray-600">Clients</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {agency.manager_count + agency.employee_count}
                        </p>
                        <p className="text-xs text-gray-600">Employés</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {agency.is_active ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            Actif
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            Inactif
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                          {agency.subscription_plan}
                        </span>
                      </div>

                      <Button variant="outline" size="sm" className="rounded-lg hover:bg-gray-50">
                        Gérer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {stats.agencies.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-12">
                  <div className="text-center">
                    <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Aucune agence pour le moment</p>
                    <Button className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30">
                      Créer votre première agence
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Chart Placeholder */}
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
                <h3 className="text-xl font-bold text-gray-900 mb-4">Revenus mensuels</h3>
                <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Graphique des revenus</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
