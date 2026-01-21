import { useEffect, useState } from 'react';
import { Building2, Users, Car, Receipt, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Alert, AlertDescription } from '../../components/ui/alert';
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

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-700">Actif</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700">Inactif</Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      basique: 'bg-blue-100 text-blue-700',
      standard: 'bg-purple-100 text-purple-700',
      premium: 'bg-amber-100 text-amber-700',
    };
    return <Badge className={colors[plan] || 'bg-gray-100 text-gray-700'}>{plan.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tableau de Bord Propriétaire</h1>
        <p className="text-slate-600 mt-2">Vue d'ensemble de vos agences</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Agences
            </CardTitle>
            <Building2 className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_agencies}</div>
            <p className="text-xs text-slate-600 mt-1">
              {stats.active_agencies} actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Véhicules
            </CardTitle>
            <Car className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_vehicles}</div>
            <p className="text-xs text-slate-600 mt-1">
              Toutes agences confondues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Clients
            </CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_customers}</div>
            <p className="text-xs text-slate-600 mt-1">
              Base clients totale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Chiffre d'Affaires
            </CardTitle>
            <Receipt className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_revenue.toLocaleString('fr-TN', {
                style: 'currency',
                currency: 'TND',
              })}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {stats.total_bookings} réservations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agencies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Agences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agence</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Véhicules</TableHead>
                  <TableHead>Clients</TableHead>
                  <TableHead>Employés</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.agencies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Aucune agence trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.agencies.map((agency) => (
                    <TableRow key={agency.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{agency.name}</div>
                          <div className="text-sm text-slate-500">{agency.legal_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{agency.city}</TableCell>
                      <TableCell>{getPlanBadge(agency.subscription_plan)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Car className="h-4 w-4 text-slate-400" />
                          {agency.vehicle_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-slate-400" />
                          {agency.customer_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        {agency.manager_count + agency.employee_count}
                      </TableCell>
                      <TableCell>{getStatusBadge(agency.is_active)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
