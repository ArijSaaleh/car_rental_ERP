import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Car as CarIcon, Filter } from 'lucide-react';
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
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorHandler';
import { CAR_BRANDS, CAR_MODELS, CAR_COLORS, FUEL_TYPES, VEHICLE_STATUS } from '../../constants/vehicles';
import { agencyService } from '../../services/agency.service';

interface Agency {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  fuel_type: string;
  transmission: string;
  mileage: number;
  status: string;
  daily_rate?: number;
  agency_id: string;
  insurance_expiry?: string;
  registration_expiry?: string;
}

export default function VehicleManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    license_plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    fuel_type: '',
    transmission: 'automatique',
    mileage: 0,
    status: 'disponible',
    daily_rate: 0,
    insurance_expiry: '',
    registration_expiry: '',
  });

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    if (selectedAgencyId) {
      loadVehicles();
    }
  }, [selectedAgencyId]);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, searchTerm, brandFilter, statusFilter]);

  useEffect(() => {
    if (formData.brand) {
      const models = CAR_MODELS[formData.brand] || [];
      setAvailableModels(models);
      if (!models.includes(formData.model)) {
        setFormData(prev => ({ ...prev, model: '' }));
      }
    } else {
      setAvailableModels([]);
    }
  }, [formData.brand]);

  const loadAgencies = async () => {
    try {
      const data = await agencyService.getAll();
      console.log('Agencies loaded:', data);
      setAgencies(data);
      if (data.length > 0) {
        setSelectedAgencyId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading agencies:', err);
      setError(extractErrorMessage(err));
    }
  };

  const loadVehicles = async () => {
    if (!selectedAgencyId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/vehicles?agency_id=${selectedAgencyId}`);
      console.log('Vehicles loaded:', response.data);
      const vehiclesList = response.data.vehicles || (Array.isArray(response.data) ? response.data : []);
      console.log('Vehicles list:', vehiclesList);
      setVehicles(vehiclesList);
    } catch (err) {
      console.error('Error loading vehicles:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = vehicles;

    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (brandFilter !== 'all') {
      filtered = filtered.filter(v => v.brand === brandFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    setFilteredVehicles(filtered);
  };

  const handleOpenDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setFormData({
        license_plate: vehicle.license_plate || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        color: vehicle.color || '',
        fuel_type: vehicle.fuel_type || '',
        transmission: vehicle.transmission || 'automatique',
        mileage: vehicle.mileage || 0,
        status: vehicle.status || 'disponible',
        daily_rate: vehicle.daily_rate || 0,
        insurance_expiry: vehicle.insurance_expiry || '',
        registration_expiry: vehicle.registration_expiry || '',
      });
    } else {
      setSelectedVehicle(null);
      setFormData({
        license_plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        fuel_type: '',
        transmission: 'automatique',
        mileage: 0,
        status: 'disponible',
        daily_rate: 0,
        insurance_expiry: '',
        registration_expiry: '',
      });
    }
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        agency_id: selectedAgencyId,
      };

      if (selectedVehicle) {
        await api.put(`/vehicles/${selectedVehicle.id}`, payload);
      } else {
        await api.post('/vehicles', payload);
      }
      await loadVehicles();
      setDialogOpen(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicle) return;

    setLoading(true);
    try {
      await api.delete(`/vehicles/${selectedVehicle.id}`);
      await loadVehicles();
      setDeleteDialogOpen(false);
      setSelectedVehicle(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = VEHICLE_STATUS.find(s => s.value === status);
    if (!statusConfig) return <Badge>{status}</Badge>;
    
    const colorClasses: Record<string, string> = {
      green: 'bg-green-100 text-green-700 border-green-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      red: 'bg-red-100 text-red-700 border-red-200',
    };
    
    return (
      <Badge className={colorClasses[statusConfig.color]}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getVehicleStats = () => {
    return {
      total: vehicles.length,
      disponible: vehicles.filter((v) => v.status === 'disponible').length,
      loue: vehicles.filter((v) => v.status === 'loue').length,
      maintenance: vehicles.filter((v) => v.status === 'maintenance').length,
    };
  };

  const stats = getVehicleStats();

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-slate-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
              <CarIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Gestion de Flotte
              </h1>
              <p className="text-slate-600 mt-1">Gérez tous vos véhicules multi-agences</p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Ajouter un Véhicule
        </Button>
      </div>

      {/* Agency Selector */}
      <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium text-slate-700 whitespace-nowrap">
              Agence:
            </Label>
            <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Sélectionnez une agence" />
              </SelectTrigger>
              <SelectContent>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium text-blue-100">Total Véhicules</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium text-green-100">Disponibles</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">{stats.disponible}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium text-purple-100">Loués</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">{stats.loue}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium text-orange-100">En Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">{stats.maintenance}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Rechercher (plaque, marque, modèle)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
            
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="bg-white border-slate-200">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par marque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les marques</SelectItem>
                {CAR_BRANDS.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white border-slate-200">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {VEHICLE_STATUS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
        <CardContent className="p-0">
          {filteredVehicles.length === 0 ? (
            <div className="p-12 text-center">
              <CarIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-600">Aucun véhicule trouvé</p>
              <p className="text-sm text-slate-400 mt-2">
                {vehicles.length === 0 
                  ? "Ajoutez votre premier véhicule pour commencer"
                  : "Essayez de modifier vos filtres de recherche"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                    <TableHead className="font-semibold text-slate-700">Plaque</TableHead>
                    <TableHead className="font-semibold text-slate-700">Marque</TableHead>
                    <TableHead className="font-semibold text-slate-700">Modèle</TableHead>
                    <TableHead className="font-semibold text-slate-700">Année</TableHead>
                    <TableHead className="font-semibold text-slate-700">Couleur</TableHead>
                    <TableHead className="font-semibold text-slate-700">Carburant</TableHead>
                    <TableHead className="font-semibold text-slate-700">Kilométrage</TableHead>
                    <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                    <TableHead className="font-semibold text-slate-700">Prix/jour</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle, index) => (
                    <TableRow 
                      key={vehicle.id}
                      className={`
                        hover:bg-blue-50/50 transition-colors
                        ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                      `}
                    >
                      <TableCell className="font-medium text-slate-900">
                        {vehicle.license_plate}
                      </TableCell>
                      <TableCell className="text-slate-700">{vehicle.brand}</TableCell>
                      <TableCell className="text-slate-700">{vehicle.model}</TableCell>
                      <TableCell className="text-slate-700">{vehicle.year}</TableCell>
                      <TableCell>
                        {vehicle.color && (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border border-slate-300"
                              style={{
                                backgroundColor: CAR_COLORS.find(c => c.value === vehicle.color)?.hex || '#999'
                              }}
                            />
                            <span className="text-slate-700">
                              {CAR_COLORS.find(c => c.value === vehicle.color)?.label || vehicle.color}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {FUEL_TYPES.find(f => f.value === vehicle.fuel_type)?.label || vehicle.fuel_type}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {vehicle.mileage?.toLocaleString()} km
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(vehicle.status)}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {vehicle.daily_rate} DT
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(vehicle)}
                            className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setDeleteDialogOpen(true);
                            }}
                            className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              {selectedVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du véhicule
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license_plate">Plaque d'immatriculation *</Label>
                <Input
                  id="license_plate"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marque *</Label>
                <Select
                  value={formData.brand}
                  onValueChange={(value) => setFormData({ ...formData, brand: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une marque" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAR_BRANDS.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modèle *</Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) => setFormData({ ...formData, model: value })}
                  disabled={!formData.brand}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Année *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Couleur</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une couleur" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAR_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border border-slate-300"
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuel_type">Type de carburant *</Label>
                <Select
                  value={formData.fuel_type}
                  onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPES.map((fuel) => (
                      <SelectItem key={fuel.value} value={fuel.value}>
                        {fuel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transmission">Transmission *</Label>
                <Select
                  value={formData.transmission}
                  onValueChange={(value) => setFormData({ ...formData, transmission: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatique">Automatique</SelectItem>
                    <SelectItem value="manuelle">Manuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileage">Kilométrage</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily_rate">Prix par jour (DT)</Label>
                <Input
                  id="daily_rate"
                  type="number"
                  value={formData.daily_rate}
                  onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Enregistrement...
                  </>
                ) : (
                  selectedVehicle ? 'Modifier' : 'Ajouter'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
