import { useEffect, useState } from 'react';
import { Building2, Users, Car, TrendingUp, DollarSign, ArrowUpRight, Sparkles, AlertCircle, ChevronDown, ChevronRight, MapPin, Phone, Mail, Calendar as CalendarIcon, CreditCard } from 'lucide-react';
import { StatsCard } from '../../components/StatsCard';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
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
  address: string;
  postal_code?: string;
  subscription_plan: string;
  is_active: boolean;
  createdAt: string;
  parent_agencyId: string | null;
  vehicle_count: number;
  customer_count: number;
}

interface MultiAgencyStats {
  total_agencies: number;
  active_agencies: number;
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
  const [expandedAgencies, setExpandedAgencies] = useState<Set<string>>(new Set());
  const [selectedAgency, setSelectedAgency] = useState<AgencyListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  const toggleAgency = (agencyId: string) => {
    const newExpanded = new Set(expandedAgencies);
    if (newExpanded.has(agencyId)) {
      newExpanded.delete(agencyId);
    } else {
      newExpanded.add(agencyId);
    }
    setExpandedAgencies(newExpanded);
  };

  const openAgencyDetails = (agency: AgencyListItem) => {
    setSelectedAgency(agency);
    setIsModalOpen(true);
  };

  const loadStatistics = async () => {
    try {
      const agencies = await agencyService.getAll();
      
      if (agencies.length === 0) {
        setError('Aucune agence trouvée. Veuillez créer une agence.');
        setLoading(false);
        return;
      }

      let totalVehicles = 0;
      let totalCustomers = 0;
      let totalBookings = 0;
      let totalRevenue = 0;
      const agencyList: AgencyListItem[] = [];

      await Promise.all(agencies.map(async (agency) => {
        try {
          const [vehiclesRes, customersRes, bookingsRes] = await Promise.all([
            api.get(`/vehicles?agencyId=${agency.id}`),
            api.get(`/customers?agencyId=${agency.id}`),
            api.get(`/bookings?agencyId=${agency.id}`)
          ]);

          const vehicles = vehiclesRes.data.vehicles || (Array.isArray(vehiclesRes.data) ? vehiclesRes.data : []);
          const customers = customersRes.data.customers || (Array.isArray(customersRes.data) ? customersRes.data : []);
          const bookings = bookingsRes.data.bookings || (Array.isArray(bookingsRes.data) ? bookingsRes.data : []);

          console.log(`Agency ${agency.name}:`, {
            vehicles: vehicles.length,
            customers: customers.length,
            bookings: bookings.length
          });

          totalVehicles += vehicles.length;
          totalCustomers += customers.length;
          totalBookings += bookings.length;
          
          const agencyRevenue = bookings.reduce((sum: number, booking: any) => {
            return sum + (parseFloat(booking.total_amount) || 0);
          }, 0);
          totalRevenue += agencyRevenue;

          agencyList.push({
            id: agency.id,
            name: agency.name,
            legal_name: agency.legalName || agency.name,
            email: agency.email,
            phone: agency.phone,
            city: agency.city,
            address: agency.address || '',
            postal_code: agency.postalCode,
            subscription_plan: agency.subscriptionPlan || 'BASIQUE',
            is_active: agency.isActive !== false,
            createdAt: agency.createdAt,
            parent_agencyId: agency.parentAgencyId || null,
            vehicle_count: vehicles.length,
            customer_count: customers.length,
          });
        } catch (agencyError) {
          console.error(`Error loading stats for agency ${agency.id}:`, agencyError);
        }
      }));

      setStats({
        total_agencies: agencies.length,
        active_agencies: agencies.filter((a: any) => a.isActive !== false).length,
        total_vehicles: totalVehicles,
        total_customers: totalCustomers,
        total_bookings: totalBookings,
        total_revenue: totalRevenue,
        agencies: agencyList,
      });
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
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Vue d'ensemble Multi-Agences
            </h1>
            <p className="text-gray-600 mt-1">
              Gestion centralisée de toutes vos agences
            </p>
          </div>
          <Button className="rounded-xl gradient-primary text-white shadow-lg">
            <Sparkles className="h-4 w-4 mr-2" />
            Nouvelle Agence
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {stats && (
          <>
            {/* Main Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Agences"
                value={stats.total_agencies}
                icon={<Building2 className="h-6 w-6" />}
                trend={{ value: 0, label: `${stats.active_agencies} actives` }}
                variant="primary"
                className="hover:shadow-xl transition-shadow duration-300"
              />
              <StatsCard
                title="Véhicules"
                value={stats.total_vehicles}
                icon={<Car className="h-6 w-6" />}
                trend={{ value: 0, label: "Toutes agences" }}
                variant="success"
                className="hover:shadow-xl transition-shadow duration-300"
              />
              <StatsCard
                title="Clients"
                value={stats.total_customers}
                icon={<Users className="h-6 w-6" />}
                trend={{ value: 0, label: "Total réseau" }}
                variant="accent"
                className="hover:shadow-xl transition-shadow duration-300"
              />
              <StatsCard
                title="Revenus"
                value={`${stats.total_revenue.toLocaleString('fr-TN')} TND`}
                icon={<DollarSign className="h-6 w-6" />}
                trend={{ value: 0, label: `${stats.total_bookings} réservations` }}
                variant="warning"
                className="hover:shadow-xl transition-shadow duration-300"
              />
            </div>

            {/* Quick Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenus Moyens</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.total_bookings > 0 
                    ? Math.round(stats.total_revenue / stats.total_bookings).toLocaleString('fr-TN')
                    : 0} TND
                </p>
                <p className="text-xs text-gray-500 mt-1">Par réservation</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Véhicules/Agence</span>
                  <Car className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.total_agencies > 0 
                    ? Math.round(stats.total_vehicles / stats.total_agencies)
                    : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Moyenne</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Clients/Agence</span>
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.total_agencies > 0 
                    ? Math.round(stats.total_customers / stats.total_agencies)
                    : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Moyenne</p>
              </div>
            </div>

            {/* Agencies Hierarchical List */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Vos Agences</h2>
                <p className="text-sm text-gray-600 mt-1">{stats.agencies.length} agence(s) enregistrée(s)</p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {stats.agencies
                  .filter(agency => !agency.parentAgencyId)
                  .map((mainAgency) => {
                    const branches = stats.agencies.filter(a => a.parent_agencyId === mainAgency.id);
                    const isExpanded = expandedAgencies.has(mainAgency.id);
                    
                    return (
                      <div key={mainAgency.id} className="transition-colors">
                        {/* Main Agency */}
                        <div className="p-6 hover:bg-gray-50">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3 flex-1">
                              {branches.length > 0 && (
                                <button
                                  onClick={() => toggleAgency(mainAgency.id)}
                                  className="mt-1 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-5 w-5" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5" />
                                  )}
                                </button>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Building2 className="h-5 w-5 text-blue-600" />
                                  <h3 className="text-lg font-semibold text-gray-900">{mainAgency.name}</h3>
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    Principale
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    mainAgency.isActive 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {mainAgency.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{mainAgency.legalName}</p>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-lg"
                              onClick={() => openAgencyDetails(mainAgency)}
                            >
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                              Détails
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 ml-8">
                            <div>
                              <p className="text-xs text-gray-500">Ville</p>
                              <p className="text-sm font-medium text-gray-900">{mainAgency.city}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Véhicules</p>
                              <p className="text-sm font-medium text-gray-900">{mainAgency.vehicle_count}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Clients</p>
                              <p className="text-sm font-medium text-gray-900">{mainAgency.customer_count}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Branches</p>
                              <p className="text-sm font-medium text-gray-900">{branches.length}</p>
                            </div>
                          </div>
                        </div>

                        {/* Branch Agencies */}
                        {isExpanded && branches.length > 0 && (
                          <div className="bg-gray-50 border-t border-gray-200">
                            {branches.map((branch) => (
                              <div key={branch.id} className="p-6 pl-16 border-b border-gray-200 last:border-b-0 hover:bg-gray-100 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-start gap-3 flex-1">
                                    <Building2 className="h-4 w-4 text-gray-400 mt-1" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-base font-semibold text-gray-900">{branch.name}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          branch.isActive 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                          {branch.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600">{branch.city}</p>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-lg"
                                    onClick={() => openAgencyDetails(branch)}
                                  >
                                    <ArrowUpRight className="h-4 w-4 mr-1" />
                                    Détails
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-xs text-gray-500">Véhicules</p>
                                    <p className="text-sm font-medium text-gray-900">{branch.vehicle_count}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Clients</p>
                                    <p className="text-sm font-medium text-gray-900">{branch.customer_count}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Abonnement</p>
                                    <p className="text-sm font-medium text-gray-900 capitalize">{branch.subscriptionPlan}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Agency Details Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Détails de l'agence
                  </DialogTitle>
                </DialogHeader>
                
                {selectedAgency && (
                  <div className="space-y-6">
                    {/* Header Info */}
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                        <Building2 className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{selectedAgency.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            selectedAgency.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {selectedAgency.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {!selectedAgency.parentAgencyId && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              Principale
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{selectedAgency.legalName}</p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Informations de contact</h4>
                        
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-sm font-medium text-gray-900">{selectedAgency.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Téléphone</p>
                            <p className="text-sm font-medium text-gray-900">{selectedAgency.phone}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Adresse</p>
                            <p className="text-sm font-medium text-gray-900">{selectedAgency.address}</p>
                            <p className="text-sm text-gray-600">{selectedAgency.city} {selectedAgency.postalCode || ''}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Statistiques</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Car className="h-4 w-4 text-blue-600" />
                              <p className="text-xs text-gray-600">Véhicules</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{selectedAgency.vehicle_count}</p>
                          </div>
                          
                          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4 text-purple-600" />
                              <p className="text-xs text-gray-600">Clients</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{selectedAgency.customer_count}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Abonnement</p>
                            <p className="text-sm font-medium text-gray-900 capitalize">{selectedAgency.subscriptionPlan}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Date de création</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(selectedAgency.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Fermer
                      </Button>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => window.location.href = `/owner/agencies/${selectedAgency.id}/edit`}
                      >
                        Modifier l'agence
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}