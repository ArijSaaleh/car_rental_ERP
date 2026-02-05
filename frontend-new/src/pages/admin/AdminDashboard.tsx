import { useEffect, useState } from 'react';
import { 
  Building2, 
  Users, 
  Car, 
  Calendar,
  DollarSign,
  Activity,
  BarChart3,
  Sparkles,
  Eye,
  TrendingUp
} from 'lucide-react';
import { StatsCard, MiniStatsCard } from '../../components/StatsCard';
import { Table, StatusBadge, ActionButton } from '../../components/Table';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
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
  legalName: string;
  email: string;
  phone: string;
  city: string;
  subscriptionPlan: string;
  isActive: boolean;
  createdAt: string;
  parentAgencyId?: string | null;
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
      const agenciesResponse = await api.get('/agencies');
      
      const agenciesData = agenciesResponse.data;
      setStats({
        total_agencies: agenciesData.length,
        active_agencies: agenciesData.filter((a: any) => a.isActive).length,
        total_users: 0, // Will be loaded separately
        total_vehicles: 0, // Will be loaded separately
        total_customers: 0, // Will be loaded separately
        total_bookings: 0,
        total_revenue: 0,
      });

      setAgencies(agenciesResponse.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Agence',
      render: (agency: Agency) => (
        <div>
          <p className="font-semibold text-gray-900">{agency.name}</p>
          <p className="text-xs text-gray-600">{agency.city}</p>
        </div>
      ),
    },
    {
      key: 'subscriptionPlan',
      label: 'Plan',
      render: (agency: Agency) => (
        <StatusBadge 
          status={agency.subscriptionPlan} 
          variant={
            agency.subscriptionPlan === 'PREMIUM' ? 'success' :
            agency.subscriptionPlan === 'STANDARD' ? 'info' : 'default'
          }
        >
          <span className="capitalize">{agency.subscriptionPlan}</span>
        </StatusBadge>
      ),
    },
    {
      key: 'isActive',
      label: 'Statut',
      render: (agency: Agency) => (
        <StatusBadge 
          status={agency.isActive ? 'Actif' : 'Inactif'} 
          variant={agency.isActive ? 'success' : 'error'}
        />
      ),
    },
    {
      key: 'vehicle_count',
      label: 'Véhicules',
      render: (agency: Agency) => (
        <span className="font-semibold text-gray-900">{agency.vehicle_count || 0}</span>
      ),
    },
    {
      key: 'customer_count',
      label: 'Clients',
      render: (agency: Agency) => (
        <span className="font-semibold text-gray-900">{agency.customer_count || 0}</span>
      ),
    },
    {
      key: 'manager_count',
      label: 'Employés',
      render: (agency: Agency) => (
        <span className="font-semibold text-gray-900">
          {(agency.manager_count || 0) + (agency.employee_count || 0)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (agency: Agency) => (
        <ActionButton onClick={() => console.log('View', agency.id)} variant="secondary">
          <Eye className="h-4 w-4 mr-1 inline" />
          Voir
        </ActionButton>
      ),
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
              Administration
            </h1>
            <p className="text-lg text-gray-600">
              Vue globale du système
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

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Agences Totales"
            value={stats.total_agencies}
            icon={<Building2 className="h-6 w-6" />}
            trend={{ value: 15, label: "vs mois dernier" }}
            variant="primary"
          />
          
          <StatsCard
            title="Revenus Totaux"
            value={`${stats.total_revenue.toLocaleString('fr-FR')}DT`}
            icon={<DollarSign className="h-6 w-6" />}
            trend={{ value: 12.5, label: "vs mois dernier" }}
            variant="success"
          />
          
          <StatsCard
            title="Réservations"
            value={stats.total_bookings}
            icon={<Calendar className="h-6 w-6" />}
            trend={{ value: -2.4, label: "vs mois dernier" }}
            variant="accent"
          />
          
          <StatsCard
            title="Flotte Totale"
            value={stats.total_vehicles}
            icon={<Car className="h-6 w-6" />}
            trend={{ value: 8.1, label: "vs mois dernier" }}
            variant="warning"
          />
        </div>

        {/* Mini Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniStatsCard
            label="Agences Actives"
            value={stats.active_agencies}
            icon={<Activity className="h-4 w-4" />}
            color="green"
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
            color="blue"
          />
          <MiniStatsCard
            label="Taux d'activité"
            value="94%"
            icon={<TrendingUp className="h-4 w-4" />}
            color="orange"
          />
        </div>

        {/* Agencies Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Toutes les Agences</h2>
              <p className="text-sm text-gray-600">
                Gestion et surveillance des agences du système
              </p>
            </div>
            <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-100">
              Exporter les données
            </Button>
          </div>

          <Table
            data={agencies}
            columns={columns}
            emptyMessage="Aucune agence enregistrée"
          />
        </div>

        {/* Performance Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Croissance des agences</h3>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Graphique de croissance</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Revenus par période</h3>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
              <div className="text-center">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Graphique des revenus</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
