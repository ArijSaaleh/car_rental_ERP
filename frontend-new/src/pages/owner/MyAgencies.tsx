import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Building2, Users, Car, ToggleLeft, ToggleRight } from 'lucide-react';
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
import { Alert, AlertDescription } from '../../components/ui/alert';
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorHandler';

interface Agency {
  id: string;
  name: string;
  legal_name: string;
  tax_id: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code?: string;
  country: string;
  subscription_plan: string;
  is_active: boolean;
  parent_agencyId?: string | null;  // Hierarchy: NULL = main agency
  is_main: boolean;                   // True if main agency, false if branch
  branch_count: number;               // Number of branches (only for main)
  manager_count: number;
  employee_count: number;
  vehicle_count: number;
  customer_count: number;
  createdAt: string;
}

export default function MyAgencies() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [filteredAgencies, setFilteredAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [error, setError] = useState('');
  const [isBranchMode, setIsBranchMode] = useState(false);
  const [parentAgencyId, setParentAgencyId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Tunisia',
  });

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    const filtered = agencies.filter(
      (agency) =>
        agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAgencies(filtered);
  }, [searchTerm, agencies]);

  const loadAgencies = async () => {
    try {
      const response = await api.get('/agencies');
      setAgencies(response.data);
      setFilteredAgencies(response.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (agency?: Agency, asMainAgency: boolean = true) => {
    if (agency) {
      setSelectedAgency(agency);
      setIsBranchMode(false);
      setParentAgencyId('');
      setFormData({
        name: agency.name,
        legal_name: agency.legalName,
        tax_id: agency.taxId,
        email: agency.email,
        phone: agency.phone,
        address: agency.address,
        city: agency.city,
        postal_code: agency.postalCode || '',
        country: agency.country,
      });
    } else {
      setSelectedAgency(null);
      setIsBranchMode(!asMainAgency);
      setParentAgencyId('');
      setFormData({
        name: '',
        legal_name: '',
        tax_id: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'Tunisia',
      });
    }
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation for branch creation
    if (!selectedAgency && isBranchMode && !parentAgencyId) {
      setError('Veuillez sélectionner l\'agence principale');
      return;
    }

    setLoading(true);

    try {
      const payload = isBranchMode && !selectedAgency
        ? { ...formData, parent_agencyId: parentAgencyId }
        : formData;

      if (selectedAgency) {
        await api.put(`/agencies/${selectedAgency.id}`, payload);
      } else {
        await api.post('/agencies', payload);
      }
      await loadAgencies();
      setDialogOpen(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (agency: Agency) => {
    try {
      await api.post(`/agencies/${agency.id}/toggle-status`);
      await loadAgencies();
    } catch (err) {
      setError(extractErrorMessage(err));
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

  if (loading && agencies.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mes Agences</h1>
          <p className="text-slate-600 mt-2">Gérez vos agences de location</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenDialog(undefined, true)} className="gap-2">
            <Plus className="h-5 w-5" />
            Nouvelle Agence Principale
          </Button>
          {agencies.some(a => a.is_main) && (
            <Button 
              onClick={() => handleOpenDialog(undefined, false)} 
              variant="outline" 
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Nouvelle Succursale
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Agences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agencies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Véhicules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agencies.reduce((sum, a) => sum + a.vehicle_count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agencies.reduce((sum, a) => sum + a.customer_count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Employés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agencies.reduce((sum, a) => sum + a.manager_count + a.employee_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Rechercher par nom, raison sociale ou ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agence</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Véhicules</TableHead>
                  <TableHead>Clients</TableHead>
                  <TableHead>Employés</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgencies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                      Aucune agence trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgencies.map((agency) => (
                    <TableRow key={agency.id} className={!agency.is_main ? 'bg-slate-50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className={`h-6 w-6 ${agency.is_main ? 'text-blue-600' : 'text-slate-400'}`} />
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {agency.name}
                              {agency.is_main && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs">
                                  Principal
                                </Badge>
                              )}
                              {!agency.is_main && (
                                <Badge className="bg-slate-100 text-slate-600 text-xs">
                                  Succursale
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-slate-500">{agency.legalName}</div>
                            {agency.is_main && agency.branch_count > 0 && (
                              <div className="text-xs text-blue-600 mt-1">
                                {agency.branch_count} succursale{agency.branch_count > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{agency.email}</div>
                          <div className="text-slate-500">{agency.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{agency.city}</TableCell>
                      <TableCell>{getPlanBadge(agency.subscriptionPlan)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Car className="h-5 w-5 text-slate-400" />
                          {agency.vehicle_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-5 w-5 text-slate-400" />
                          {agency.customer_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        {agency.manager_count + agency.employee_count}
                      </TableCell>
                      <TableCell>{getStatusBadge(agency.isActive)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(agency)}
                          >
                            <Edit className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(agency)}
                          >
                            {agency.isActive ? (
                              <ToggleRight className="h-6 w-6 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-slate-400" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAgency 
                ? 'Modifier l\'agence' 
                : isBranchMode 
                  ? 'Nouvelle Succursale' 
                  : 'Nouvelle Agence Principale'}
            </DialogTitle>
            <DialogDescription>
              {isBranchMode 
                ? 'Créez une succursale rattachée à votre agence principale'
                : 'Remplissez les informations de l\'agence'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Parent Agency Selection for Branches */}
            {!selectedAgency && isBranchMode && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Label htmlFor="parent_agency" className="text-blue-900">
                  Agence Principale *
                </Label>
                <select
                  id="parent_agency"
                  value={parentAgencyId}
                  onChange={(e) => setParentAgencyId(e.target.value)}
                  required
                  className="mt-2 w-full p-2 border rounded-md"
                >
                  <option value="">Sélectionnez l'agence principale</option>
                  {agencies.filter(a => a.is_main).map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name} - {agency.city}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-blue-700 mt-2">
                  Cette succursale sera rattachée à l'agence sélectionnée
                </p>
              </div>
            )}

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
                <Label htmlFor="legal_name">Raison Sociale *</Label>
                <Input
                  id="legal_name"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_id">Matricule Fiscal *</Label>
                <Input
                  id="tax_id"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
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

              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Code Postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Pays *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : selectedAgency ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
