import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Filter,
  Users as UsersIcon,
  Car,
  Calendar,
  Crown,
  AlertCircle,
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
import { Label } from '../../components/ui/label';
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
import { userService } from '../../services/user.service';
import { vehicleService } from '../../services/vehicle.service';
import { bookingService } from '../../services/booking.service';
import { extractErrorMessage } from '../../utils/errorHandler';
import type { Agency, User } from '../../types';

interface AgencyStats {
  users: number;
  vehicles: number;
  bookings: number;
}

export default function AgencyManagement() {
  const { toast } = useToast();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [filteredAgencies, setFilteredAgencies] = useState<Agency[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [error, setError] = useState('');
  const [agencyStats, setAgencyStats] = useState<Record<string, AgencyStats>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Tunisie',
    subscriptionPlan: 'BASIQUE' as 'BASIQUE' | 'STANDARD' | 'PREMIUM' | 'ENTREPRISE',
    ownerId: '',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAgencies();
  }, [searchTerm, statusFilter, planFilter, agencies]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [agenciesData, usersData] = await Promise.all([
        agencyService.getAll(),
        userService.getAll(),
      ]);

      setAgencies(agenciesData);
      setFilteredAgencies(agenciesData);

      // Filter owners (PROPRIETAIRE role)
      const ownerUsers = usersData.filter((u) => u.role === 'PROPRIETAIRE');
      setOwners(ownerUsers);

      // Load stats for each agency
      await loadAgencyStats(agenciesData);
    } catch (err) {
      setError(extractErrorMessage(err));
      toast({
        title: 'Erreur',
        description: extractErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAgencyStats = async (agenciesList: Agency[]) => {
    const stats: Record<string, AgencyStats> = {};

    await Promise.all(
      agenciesList.map(async (agency) => {
        try {
          const [users, vehicles, bookings] = await Promise.all([
            userService.getAll(agency.id).catch(() => []),
            vehicleService.getAll(agency.id).catch(() => []),
            bookingService.getAll(agency.id).catch(() => []),
          ]);

          stats[agency.id] = {
            users: Array.isArray(users) ? users.length : 0,
            vehicles: Array.isArray(vehicles) ? vehicles.length : 0,
            bookings: Array.isArray(bookings) ? bookings.length : 0,
          };
        } catch (err) {
          stats[agency.id] = { users: 0, vehicles: 0, bookings: 0 };
        }
      })
    );

    setAgencyStats(stats);
  };

  const filterAgencies = () => {
    let filtered = agencies;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (agency) =>
          agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agency.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agency.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) =>
        statusFilter === 'active' ? a.isActive : !a.isActive
      );
    }

    // Plan filter
    if (planFilter !== 'all') {
      filtered = filtered.filter((a) => a.subscriptionPlan === planFilter);
    }

    setFilteredAgencies(filtered);
    setCurrentPage(1);
  };

  const handleOpenDialog = (agency?: Agency) => {
    if (agency) {
      setSelectedAgency(agency);
      setFormData({
        name: agency.name,
        legalName: agency.legalName,
        taxId: agency.taxId,
        email: agency.email,
        phone: agency.phone,
        address: agency.address,
        city: agency.city,
        postalCode: agency.postalCode || '',
        country: agency.country,
        subscriptionPlan: agency.subscriptionPlan,
        ownerId: agency.ownerId || '',
        isActive: agency.isActive,
      });
    } else {
      setSelectedAgency(null);
      setFormData({
        name: '',
        legalName: '',
        taxId: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'Tunisie',
        subscriptionPlan: 'BASIQUE',
        ownerId: '',
        isActive: true,
      });
    }
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const agencyData = {
        name: formData.name,
        legalName: formData.legalName,
        taxId: formData.taxId,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode || undefined,
        country: formData.country,
        subscriptionPlan: formData.subscriptionPlan,
        ownerId: formData.ownerId || undefined,
        isActive: formData.isActive,
      };

      if (selectedAgency) {
        const updated = await agencyService.update(selectedAgency.id, agencyData);
        setAgencies((prev) =>
          prev.map((a) => (a.id === selectedAgency.id ? updated : a))
        );
        toast({
          title: 'Agence mise à jour',
          description: 'L\'agence a été mise à jour avec succès.',
          variant: 'success',
        });
      } else {
        const created = await agencyService.create(agencyData as any);
        setAgencies((prev) => [...prev, created]);
        toast({
          title: 'Agence créée',
          description: 'La nouvelle agence a été créée avec succès.',
          variant: 'success',
        });
      }

      setDialogOpen(false);
      loadData(); // Reload to update stats
    } catch (err) {
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      toast({
        title: 'Erreur',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (agency: Agency) => {
    try {
      const updated = await agencyService.toggleStatus(agency.id);
      setAgencies((prev) =>
        prev.map((a) => (a.id === agency.id ? updated : a))
      );
      toast({
        title: 'Statut modifié',
        description: `L'agence est maintenant ${updated.isActive ? 'active' : 'inactive'}.`,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: extractErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedAgency) return;

    try {
      await agencyService.delete(selectedAgency.id);
      setAgencies((prev) => prev.filter((a) => a.id !== selectedAgency.id));
      toast({
        title: 'Agence supprimée',
        description: 'L\'agence a été supprimée avec succès.',
        variant: 'success',
      });
      setDeleteDialogOpen(false);
      setSelectedAgency(null);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: extractErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'ENTREPRISE':
        return 'default';
      case 'PREMIUM':
        return 'success';
      case 'STANDARD':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getOwnerName = (ownerId?: string) => {
    if (!ownerId) return 'Non assigné';
    const owner = owners.find((o) => o.id === ownerId);
    return owner ? owner.fullName : 'Inconnu';
  };

  // Pagination
  const totalPages = Math.ceil(filteredAgencies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAgencies = filteredAgencies.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des agences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Gestion des Agences
            </h1>
            <p className="text-lg text-gray-600">
              Gérer toutes les agences du système
            </p>
          </div>
          <Button
            className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600"
            onClick={() => handleOpenDialog()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer une Agence
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une agence..."
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
                  <SelectValue placeholder="Plan d'abonnement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les plans</SelectItem>
                  <SelectItem value="BASIQUE">Basique</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                  <SelectItem value="ENTREPRISE">Entreprise</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {filteredAgencies.length} agence(s)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agencies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Agences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Propriétaire</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Statistiques</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAgencies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-gray-500">Aucune agence trouvée</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentAgencies.map((agency) => (
                      <TableRow key={agency.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{agency.name}</p>
                            <p className="text-sm text-gray-500">{agency.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-amber-500" />
                            <span className="text-sm">
                              {getOwnerName(agency.ownerId)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{agency.city}</p>
                            <p className="text-xs text-gray-500">{agency.country}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPlanBadgeVariant(agency.subscriptionPlan)}>
                            {agency.subscriptionPlan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={agency.isActive ? 'success' : 'secondary'}
                          >
                            {agency.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1">
                              <UsersIcon className="h-4 w-4 text-gray-500" />
                              <span>{agencyStats[agency.id]?.users || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Car className="h-4 w-4 text-gray-500" />
                              <span>{agencyStats[agency.id]?.vehicles || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span>{agencyStats[agency.id]?.bookings || 0}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(agency)}
                              title={agency.isActive ? 'Désactiver' : 'Activer'}
                            >
                              {agency.isActive ? (
                                <ToggleRight className="h-4 w-4" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(agency)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAgency(agency);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Page {currentPage} sur {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAgency ? 'Modifier l\'agence' : 'Créer une nouvelle agence'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de l'agence
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom Commercial *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalName">Raison Sociale *</Label>
                <Input
                  id="legalName"
                  value={formData.legalName}
                  onChange={(e) =>
                    setFormData({ ...formData, legalName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxId">Matricule Fiscale *</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Code Postal</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subscriptionPlan">Plan d'Abonnement *</Label>
                <Select
                  value={formData.subscriptionPlan}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, subscriptionPlan: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASIQUE">Basique</SelectItem>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="ENTREPRISE">Entreprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerId">Propriétaire</Label>
                <Select
                  value={formData.ownerId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ownerId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un propriétaire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Non assigné</SelectItem>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {selectedAgency ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'agence "{selectedAgency?.name}" ?
              Cette action est irréversible et supprimera toutes les données associées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
