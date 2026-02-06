import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2, 
  MapPin, 
  Phone, 
  Mail,
  Calendar,
  TrendingUp,
  Power,
  Filter,
  Car,
  Users,
  DollarSign
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useToast } from '../../hooks/use-toast';
import { agencyService } from '../../services/agency.service';
import { vehicleService } from '../../services/vehicle.service';
import { bookingService } from '../../services/booking.service';
import type { Agency } from '../../types';
import { extractErrorMessage } from '../../utils/errorHandler';
import MyAgenciesForm from './MyAgenciesForm';

interface AgencyWithStats extends Agency {
  vehiclesCount?: number;
  bookingsCount?: number;
  activeBookingsCount?: number;
}

export default function MyAgencies() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState<AgencyWithStats[]>([]);
  const [filteredAgencies, setFilteredAgencies] = useState<AgencyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    filterAgencies();
  }, [agencies, searchTerm, statusFilter, planFilter]);

  const loadAgencies = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await agencyService.getAll();
      setAgencies(data);
      loadAgencyStats(data);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAgencyStats = async (agenciesData: Agency[]) => {
    try {
      setStatsLoading(true);
      const agenciesWithStats = await Promise.all(
        agenciesData.map(async (agency) => {
          try {
            const [vehicles, bookings] = await Promise.all([
              vehicleService.getAll({ agencyId: agency.id }),
              bookingService.getAll({ agencyId: agency.id }),
            ]);

            const vehiclesArray = Array.isArray(vehicles) ? vehicles : vehicles.vehicles || [];
            const bookingsArray = Array.isArray(bookings) ? bookings : bookings.bookings || [];

            return {
              ...agency,
              vehiclesCount: vehiclesArray.length,
              bookingsCount: bookingsArray.length,
              activeBookingsCount: bookingsArray.filter((b: any) => 
                ['CONFIRMED', 'IN_PROGRESS'].includes(b.status)
              ).length,
            };
          } catch {
            return {
              ...agency,
              vehiclesCount: 0,
              bookingsCount: 0,
              activeBookingsCount: 0,
            };
          }
        })
      );
      setAgencies(agenciesWithStats);
    } catch (err) {
      console.error('Failed to load agency stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const filterAgencies = () => {
    let filtered = [...agencies];

    if (searchTerm) {
      filtered = filtered.filter(
        (agency) =>
          agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agency.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agency.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((agency) => 
        statusFilter === 'active' ? agency.isActive : !agency.isActive
      );
    }

    if (planFilter && planFilter !== 'all') {
      filtered = filtered.filter((agency) => agency.subscriptionPlan === planFilter);
    }

    setFilteredAgencies(filtered);
  };

  const handleCreate = () => {
    setSelectedAgency(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (agency: Agency) => {
    setSelectedAgency(agency);
    setFormDialogOpen(true);
  };

  const handleDelete = (agency: Agency) => {
    setSelectedAgency(agency);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAgency) return;

    // Optimistic update
    const previousAgencies = [...agencies];
    setAgencies(agencies.filter((a) => a.id !== selectedAgency.id));
    setDeleteDialogOpen(false);

    try {
      await agencyService.delete(selectedAgency.id);
      toast({
        title: 'Succès',
        description: 'Agence supprimée avec succès',
      });
    } catch (err) {
      // Rollback on error
      setAgencies(previousAgencies);
      const errorMessage = extractErrorMessage(err);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (agency: Agency) => {
    // Optimistic update
    const previousAgencies = [...agencies];
    setAgencies(
      agencies.map((a) =>
        a.id === agency.id ? { ...a, isActive: !a.isActive } : a
      )
    );

    try {
      await agencyService.toggleStatus(agency.id);
      toast({
        title: 'Succès',
        description: `Agence ${!agency.isActive ? 'activée' : 'désactivée'} avec succès`,
      });
    } catch (err) {
      // Rollback on error
      setAgencies(previousAgencies);
      const errorMessage = extractErrorMessage(err);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (data: Partial<Agency>) => {
    try {
      if (selectedAgency) {
        // Update
        const previousAgencies = [...agencies];
        const optimisticUpdate = { ...selectedAgency, ...data };
        setAgencies(
          agencies.map((a) => (a.id === selectedAgency.id ? optimisticUpdate as AgencyWithStats : a))
        );
        setFormDialogOpen(false);

        try {
          const updated = await agencyService.update(selectedAgency.id, data);
          setAgencies(
            agencies.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
          );
          toast({
            title: 'Succès',
            description: 'Agence mise à jour avec succès',
          });
        } catch (err) {
          setAgencies(previousAgencies);
          throw err;
        }
      } else {
        // Create
        const newAgency = await agencyService.create(data as Omit<Agency, 'id' | 'createdAt' | 'updatedAt'>);
        setAgencies([...agencies, newAgency]);
        setFormDialogOpen(false);
        toast({
          title: 'Succès',
          description: 'Agence créée avec succès',
        });
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-500' : ''}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      BASIQUE: 'bg-slate-500',
      STANDARD: 'bg-blue-500',
      PREMIUM: 'bg-purple-500',
      ENTREPRISE: 'bg-amber-500',
    };
    return (
      <Badge className={colors[plan] || 'bg-slate-500'}>
        {plan}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-slate-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mes Agences</h1>
          <p className="text-slate-600 mt-1">Gérez vos agences de location</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Agence
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
                <SelectItem value="BASIQUE">Basique</SelectItem>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="PREMIUM">Premium</SelectItem>
                <SelectItem value="ENTREPRISE">Entreprise</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Building2 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('table')}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Content */}
      {filteredAgencies.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Aucune agence trouvée
              </h3>
              <p className="text-slate-600 mb-4">
                {searchTerm || statusFilter !== 'all' || planFilter !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Commencez par créer votre première agence'}
              </p>
              {!searchTerm && statusFilter === 'all' && planFilter === 'all' && (
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une Agence
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgencies.map((agency) => (
            <Card
              key={agency.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/owner/agencies/${agency.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{agency.name}</CardTitle>
                    <p className="text-sm text-slate-600">{agency.legalName}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(agency.isActive)}
                    {getPlanBadge(agency.subscriptionPlan)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{agency.city}, {agency.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{agency.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{agency.phone}</span>
                  </div>

                  {!statsLoading && (
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t mt-4">
                      <div className="text-center">
                        <Car className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                        <div className="text-sm font-semibold">{agency.vehiclesCount || 0}</div>
                        <div className="text-xs text-slate-600">Véhicules</div>
                      </div>
                      <div className="text-center">
                        <Calendar className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                        <div className="text-sm font-semibold">{agency.bookingsCount || 0}</div>
                        <div className="text-xs text-slate-600">Réservations</div>
                      </div>
                      <div className="text-center">
                        <TrendingUp className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                        <div className="text-sm font-semibold">{agency.activeBookingsCount || 0}</div>
                        <div className="text-xs text-slate-600">Actives</div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(agency);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(agency);
                      }}
                    >
                      <Power className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(agency);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-center">Véhicules</TableHead>
                  <TableHead className="text-center">Réservations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgencies.map((agency) => (
                  <TableRow
                    key={agency.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => navigate(`/owner/agencies/${agency.id}`)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{agency.name}</div>
                        <div className="text-sm text-slate-600">{agency.legalName}</div>
                      </div>
                    </TableCell>
                    <TableCell>{agency.city}</TableCell>
                    <TableCell className="truncate max-w-xs">{agency.email}</TableCell>
                    <TableCell>{agency.phone}</TableCell>
                    <TableCell>{getPlanBadge(agency.subscriptionPlan)}</TableCell>
                    <TableCell>{getStatusBadge(agency.isActive)}</TableCell>
                    <TableCell className="text-center">
                      {!statsLoading && (agency.vehiclesCount || 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      {!statsLoading && (
                        <div className="flex flex-col items-center">
                          <div>{agency.bookingsCount || 0}</div>
                          <div className="text-xs text-slate-500">
                            ({agency.activeBookingsCount || 0} actives)
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(agency);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(agency);
                          }}
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(agency);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAgency ? 'Modifier l\'Agence' : 'Nouvelle Agence'}
            </DialogTitle>
            <DialogDescription>
              {selectedAgency
                ? 'Modifiez les informations de l\'agence'
                : 'Complétez les informations pour créer une nouvelle agence'}
            </DialogDescription>
          </DialogHeader>
          <MyAgenciesForm
            agency={selectedAgency}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'agence "{selectedAgency?.name}" ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
