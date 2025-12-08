import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Car, Filter } from 'lucide-react';
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
}

export default function VehicleManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    license_plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    fuel_type: 'essence',
    transmission: 'manuel',
    mileage: 0,
    daily_rate: 0,
  });

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    if (selectedAgencyId) {
      loadVehicles();
    } else {
      setVehicles([]);
      setFilteredVehicles([]);
    }
  }, [selectedAgencyId]);

  useEffect(() => {
    let filtered = vehicles.filter(
      (v) =>
        v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    setFilteredVehicles(filtered);
  }, [searchTerm, statusFilter, vehicles]);

  const loadAgencies = async () => {
    try {
      const response = await api.get('/proprietaire/agencies');
      setAgencies(response.data);
      if (response.data.length > 0) {
        setSelectedAgencyId(response.data[0].id);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    if (!selectedAgencyId) return;

    setLoading(true);
    try {
      const response = await api.get(`/vehicles?agency_id=${selectedAgencyId}&page_size=100`);
      setVehicles(response.data.vehicles || []);
      setFilteredVehicles(response.data.vehicles || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setFormData({
        license_plate: vehicle.license_plate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color || '',
        fuel_type: vehicle.fuel_type,
        transmission: vehicle.transmission,
        mileage: vehicle.mileage,
        daily_rate: vehicle.daily_rate || 0,
      });
    } else {
      setSelectedVehicle(null);
      setFormData({
        license_plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        fuel_type: 'essence',
        transmission: 'manuel',
        mileage: 0,
        daily_rate: 0,
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
    const colors: Record<string, string> = {
      disponible: 'bg-green-100 text-green-700',
      loue: 'bg-blue-100 text-blue-700',
      maintenance: 'bg-yellow-100 text-yellow-700',
      hors_service: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      disponible: 'Disponible',
      loue: 'Loué',
      maintenance: 'Maintenance',
      hors_service: 'Hors Service',
    };
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-700'}>
        {labels[status] || status}
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion de la Flotte</h1>
          <p className="text-slate-600 mt-2">
            Gérez tous les véhicules de vos agences
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2" disabled={!selectedAgencyId}>
          <Plus className="h-5 w-5" />
          Nouveau Véhicule
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.disponible}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Loués</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.loue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une agence" />
              </SelectTrigger>
              <SelectContent>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="loue">Loué</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="hors_service">Hors Service</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      {selectedAgencyId && (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plaque</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Année</TableHead>
                    <TableHead>Carburant</TableHead>
                    <TableHead>Kilométrage</TableHead>
                    <TableHead>Tarif/Jour</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                        Aucun véhicule trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-mono font-medium">
                          {vehicle.license_plate}
                        </TableCell>
                        <TableCell>
                        <div className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-slate-400" />
                            <div>
                              <div className="font-medium">{vehicle.brand} {vehicle.model}</div>
                              {vehicle.color && (
                                <div className="text-xs text-slate-500">{vehicle.color}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{vehicle.year}</TableCell>
                        <TableCell className="capitalize">{vehicle.fuel_type}</TableCell>
                        <TableCell>{vehicle.mileage.toLocaleString()} km</TableCell>
                        <TableCell>
                          {vehicle.daily_rate ? `${vehicle.daily_rate} DT` : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                            onClick={() => handleOpenDialog(vehicle)}
                              >
                              <Edit className="h-5 w-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedVehicle(vehicle);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-5 w-5 text-red-600" />
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
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license_plate">Plaque d'immatriculation *</Label>
                <Input
                  id="license_plate"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  required
                  placeholder="123 TU 4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marque *</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  required
                  placeholder="Renault, Peugeot..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modèle *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                  placeholder="Clio, 208..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Année *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                  min="1990"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Couleur</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Blanc, Noir..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuel_type">Carburant *</Label>
                <Select
                  value={formData.fuel_type}
                  onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essence">Essence</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electrique">Électrique</SelectItem>
                    <SelectItem value="hybride">Hybride</SelectItem>
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
                    <SelectItem value="manuel">Manuelle</SelectItem>
                    <SelectItem value="automatique">Automatique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileage">Kilométrage *</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="daily_rate">Tarif Journalier (DT)</Label>
                <Input
                  id="daily_rate"
                  type="number"
                  value={formData.daily_rate}
                  onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : selectedVehicle ? 'Modifier' : 'Créer'}
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
              Êtes-vous sûr de vouloir supprimer le véhicule "{selectedVehicle?.license_plate}" ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
