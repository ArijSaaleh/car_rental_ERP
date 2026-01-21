import { useEffect, useState } from 'react';
import { Building2, Users, Car, Calendar, TrendingUp, DollarSign, BarChart3, Activity, ArrowUpRight, Sparkles } from 'lucide-react';
import { StatsCard, MiniStatsCard } from '../../components/StatsCard';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorHandler';

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
      const response = await api.get('/proprietaire/statistics');
      const normalizedData = {
        ...response.data,
        total_revenue: typeof response.data.total_revenue === 'string' 
          ? parseFloat(response.data.total_revenue) 
          : response.data.total_revenue,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Tableau de bord
            </h1>
            <p className="text-lg text-muted-foreground">
              Vue d'ensemble de votre activité
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl">
              <BarChart3 className="h-4 w-4 mr-2" />
              Rapports
            </Button>
            <Button className="rounded-xl bg-gradient-primary hover:opacity-90 text-white">
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
                value={`${stats.total_revenue.toLocaleString('fr-FR')}€`}
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
            <div className="bg-white/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">Mes Agences</h2>
                  <p className="text-sm text-muted-foreground">
                    Gestion et performance de vos agences
                  </p>
                </div>
                <Button variant="outline" className="rounded-xl">
                  Voir toutes les agences
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="space-y-4">
                {stats.agencies.slice(0, 5).map((agency) => (
                  <div
                    key={agency.id}
                    className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-border/50 hover:border-primary/50 transition-all card-hover"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 rounded-xl bg-gradient-primary">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-lg">{agency.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {agency.city} • {agency.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-foreground">{agency.vehicle_count}</p>
                        <p className="text-xs text-muted-foreground">Véhicules</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-foreground">{agency.customer_count}</p>
                        <p className="text-xs text-muted-foreground">Clients</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-foreground">
                          {agency.manager_count + agency.employee_count}
                        </p>
                        <p className="text-xs text-muted-foreground">Employés</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {agency.is_active ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                            Actif
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                            Inactif
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 capitalize">
                          {agency.subscription_plan}
                        </span>
                      </div>

                      <Button variant="outline" size="sm" className="rounded-lg">
                        Gérer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {stats.agencies.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Aucune agence pour le moment</p>
                  <Button className="rounded-xl bg-gradient-primary hover:opacity-90 text-white">
                    Créer votre première agence
                  </Button>
                </div>
              )}
            </div>

            {/* Performance Chart Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-foreground mb-4">Réservations récentes</h3>
                <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-xl border border-border/50">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Graphique des réservations</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-foreground mb-4">Revenus mensuels</h3>
                <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-xl border border-border/50">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Graphique des revenus</p>
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
