import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Car, User, Calendar } from 'lucide-react';
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
  vin?: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  fuel_type: string;
  transmission: string;
  seats?: number;
  doors?: number;
  mileage: number;
  status: string;
  registration_number?: string;
  insurance_policy?: string;
  insurance_expiry?: string;
  technical_control_expiry?: string;
  daily_rate?: number;
  notes?: string;
  agency_id: string;
  current_booking?: {
    id: number;
    booking_number: string;
    customer_name: string;
    customer_phone: string;
    start_date: string;
    end_date: string;
    status: string;
  };
}

interface VehicleStats {
  total: number;
  disponible: number;
  loue: number;
  maintenance: number;
  hors_service: number;
}

export default function FleetManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<VehicleStats>({
    total: 0,
    disponible: 0,
    loue: 0,
    maintenance: 0,
    hors_service: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    license_plate: '',
    vin: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    fuel_type: 'essence',
    transmission: 'manuelle',
    seats: 5,
    doors: 5,
    mileage: 0,
    status: 'disponible',
    registration_number: '',
    insurance_policy: '',
    insurance_expiry: '',
    technical_control_expiry: '',
    daily_rate: 0,
    notes: '',
  });

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    if (selectedAgencyId) {
      setCurrentPage(1);
      loadVehicles();
    } else {
      setVehicles([]);
      setFilteredVehicles([]);
      setTotalVehicles(0);
    }
  }, [selectedAgencyId]);

  useEffect(() => {
    if (selectedAgencyId) {
      loadVehicles();
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (selectedAgencyId) {
        setCurrentPage(1);
        loadVehicles();
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, statusFilter]);

  const calculateStats = (vehiclesList: Vehicle[]) => {
    const newStats = {
      total: vehiclesList.length,
      disponible: vehiclesList.filter(v => v.status.toLowerCase() === 'disponible').length,
      loue: vehiclesList.filter(v => v.status.toLowerCase() === 'loue').length,
      maintenance: vehiclesList.filter(v => v.status.toLowerCase() === 'maintenance').length,
      hors_service: vehiclesList.filter(v => v.status.toLowerCase() === 'hors_service').length,
    };
    setStats(newStats);
  };

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
      const params = new URLSearchParams({
        agency_id: selectedAgencyId,
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      });
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('vehicle_status', statusFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await api.get(`/vehicles?${params.toString()}`);
      const vehiclesList = Array.isArray(response.data.vehicles) ? response.data.vehicles : [];
      setVehicles(vehiclesList);
      setFilteredVehicles(vehiclesList);
      setTotalVehicles(response.data.total || 0);
      calculateStats(vehiclesList);
    } catch (err) {
      setError(extractErrorMessage(err));
      setVehicles([]);
      setFilteredVehicles([]);
      setTotalVehicles(0);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (vehicle?: Vehicle) => {
    setError('');
    setSuccess('');
    
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setFormData({
        license_plate: vehicle.license_plate,
        vin: vehicle.vin || '',
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color || '',
        fuel_type: vehicle.fuel_type,
        transmission: vehicle.transmission,
        seats: vehicle.seats || 5,
        doors: vehicle.doors || 5,
        mileage: vehicle.mileage,
        status: vehicle.status,
        registration_number: vehicle.registration_number || '',
        insurance_policy: vehicle.insurance_policy || '',
        insurance_expiry: vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toISOString().split('T')[0] : '',
        technical_control_expiry: vehicle.technical_control_expiry ? new Date(vehicle.technical_control_expiry).toISOString().split('T')[0] : '',
        daily_rate: vehicle.daily_rate || 0,
        notes: vehicle.notes || '',
      });
    } else {
      setSelectedVehicle(null);
      setFormData({
        license_plate: '',
        vin: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        fuel_type: 'essence',
        transmission: 'manuelle',
        seats: 5,
        doors: 5,
        mileage: 0,
        status: 'disponible',
        registration_number: '',
        insurance_policy: '',
        insurance_expiry: '',
        technical_control_expiry: '',
        daily_rate: 0,
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare payload without agency_id (sent as query param instead)
      const payload = {
        license_plate: formData.license_plate,
        vin: formData.vin || null,
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        color: formData.color || null,
        fuel_type: formData.fuel_type,
        transmission: formData.transmission,
        seats: formData.seats,
        doors: formData.doors,
        mileage: formData.mileage,
        status: formData.status,
        registration_number: formData.registration_number || null,
        insurance_policy: formData.insurance_policy || null,
        insurance_expiry: formData.insurance_expiry || null,
        technical_control_expiry: formData.technical_control_expiry || null,
        daily_rate: formData.daily_rate,
        notes: formData.notes || null,
      };

      if (selectedVehicle) {
        await api.put(`/vehicles/${selectedVehicle.id}`, payload);
        setSuccess('Véhicule modifié avec succès');
      } else {
        // Send agency_id as query parameter for POST
        await api.post(`/vehicles?agency_id=${selectedAgencyId}`, payload);
        setSuccess('Véhicule créé avec succès');
      }
      
      setDialogOpen(false);
      await loadVehicles();
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
      setSuccess('Véhicule supprimé avec succès');
      setDeleteDialogOpen(false);
      await loadVehicles();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      disponible: { label: 'Disponible', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      loue: { label: 'Loué', variant: 'default' as const, className: 'bg-blue-100 text-blue-800' },
      maintenance: { label: 'Maintenance', variant: 'default' as const, className: 'bg-yellow-100 text-yellow-800' },
      hors_service: { label: 'Hors Service', variant: 'default' as const, className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const,
      className: '' 
    };
    
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion de la Flotte</h1>
          <p className="text-slate-600 mt-1">Gérez tous vos véhicules</p>
        </div>
        <Button onClick={() => handleOpenDialog()} disabled={!selectedAgencyId}>
          <Plus className="h-5 w-5 mr-2" />
          Nouveau Véhicule
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Hors Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.hors_service}</div>
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
            <div className="space-y-2">
              <Label>Agence</Label>
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
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
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
            </div>

            <div className="space-y-2">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Plaque, marque, modèle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      {selectedAgencyId ? (
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8 text-slate-500">Chargement...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plaque</TableHead>
                      <TableHead>VIN</TableHead>
                      <TableHead>Véhicule</TableHead>
                      <TableHead>Année</TableHead>
                      <TableHead>Couleur</TableHead>
                      <TableHead>Places</TableHead>
                      <TableHead>Portes</TableHead>
                      <TableHead>Transmission</TableHead>
                      <TableHead>Carburant</TableHead>
                      <TableHead>Kilométrage</TableHead>
                      <TableHead>Tarif/Jour</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Loué à</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center py-8 text-slate-500">
                          {vehicles.length === 0 
                            ? 'Aucun véhicule. Cliquez sur "Nouveau Véhicule" pour commencer.'
                            : 'Aucun véhicule trouvé avec ces filtres.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-mono font-medium text-xs">
                            {vehicle.license_plate}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {vehicle.vin || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-slate-400" />
                              <div className="font-medium">{vehicle.brand} {vehicle.model}</div>
                            </div>
                          </TableCell>
                          <TableCell>{vehicle.year}</TableCell>
                          <TableCell className="capitalize">{vehicle.color || '-'}</TableCell>
                          <TableCell>{vehicle.seats || '-'}</TableCell>
                          <TableCell>{vehicle.doors || '-'}</TableCell>
                          <TableCell className="capitalize">
                            {vehicle.transmission.toLowerCase() === 'manuelle' ? 'Manuelle' : 'Automatique'}
                          </TableCell>
                          <TableCell className="capitalize">
                            {vehicle.fuel_type.toLowerCase()}
                          </TableCell>
                          <TableCell>{vehicle.mileage.toLocaleString()} km</TableCell>
                          <TableCell className="font-medium">
                            {vehicle.daily_rate ? `${vehicle.daily_rate} DT` : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                          <TableCell>
                            {vehicle.current_booking ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <User className="h-3 w-3 text-blue-600" />
                                  <span className="font-medium text-blue-900">
                                    {vehicle.current_booking.customer_name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {new Date(vehicle.current_booking.start_date).toLocaleDateString('fr-FR')} - {new Date(vehicle.current_booking.end_date).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400">
                                  {vehicle.current_booking.customer_phone}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(vehicle)}
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedVehicle(vehicle);
                                  setDeleteDialogOpen(true);
                                }}
                                title="Supprimer"
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
            )}
            
            {/* Pagination Controls */}
            {!loading && totalVehicles > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-slate-600">
                  Affichage {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, totalVehicles)} sur {totalVehicles} véhicules
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  <div className="text-sm text-slate-600">
                    Page {currentPage} sur {Math.ceil(totalVehicles / pageSize)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= Math.ceil(totalVehicles / pageSize)}
                  >
                    Suivant
                  </Button>
                  <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-500">Sélectionnez une agence pour voir ses véhicules</p>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}
            </DialogTitle>
            <DialogDescription>
              Remplissez tous les champs obligatoires (*)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-slate-700">Informations de base</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_plate">Plaque d'immatriculation *</Label>
                    <Input
                      id="license_plate"
                      value={formData.license_plate}
                      onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                      required
                      placeholder="123 TU 4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vin">VIN (Numéro de châssis)</Label>
                    <Input
                      id="vin"
                      value={formData.vin}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                      placeholder="17 caractères"
                      maxLength={17}
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
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
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
                </div>
              </div>

              {/* Technical Specifications */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-slate-700">Caractéristiques techniques</h3>
                <div className="grid grid-cols-2 gap-4">

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
                    <SelectItem value="manuelle">Manuelle</SelectItem>
                    <SelectItem value="automatique">Automatique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seats">Nombre de places</Label>
                <Input
                  id="seats"
                  type="number"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 5 })}
                  min="2"
                  max="9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doors">Nombre de portes</Label>
                <Input
                  id="doors"
                  type="number"
                  value={formData.doors}
                  onChange={(e) => setFormData({ ...formData, doors: parseInt(e.target.value) || 5 })}
                  min="2"
                  max="5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileage">Kilométrage *</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                  required
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
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="loue">Loué</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="hors_service">Hors Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

                  <div className="space-y-2">
                    <Label htmlFor="daily_rate">Tarif Journalier (DT) *</Label>
                    <Input
                      id="daily_rate"
                      type="number"
                      value={formData.daily_rate}
                      onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Legal & Insurance */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-slate-700">Documents et assurance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registration_number">Numéro de carte grise</Label>
                    <Input
                      id="registration_number"
                      value={formData.registration_number}
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                      placeholder="Numéro d'enregistrement"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance_policy">Police d'assurance</Label>
                    <Input
                      id="insurance_policy"
                      value={formData.insurance_policy}
                      onChange={(e) => setFormData({ ...formData, insurance_policy: e.target.value })}
                      placeholder="Numéro de police"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance_expiry">Expiration assurance</Label>
                    <Input
                      id="insurance_expiry"
                      type="date"
                      value={formData.insurance_expiry}
                      onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="technical_control_expiry">Expiration contrôle technique</Label>
                    <Input
                      id="technical_control_expiry"
                      type="date"
                      value={formData.technical_control_expiry}
                      onChange={(e) => setFormData({ ...formData, technical_control_expiry: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-slate-700">Notes additionnelles</h3>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Informations supplémentaires sur le véhicule..."
                  />
                </div>
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
              Êtes-vous sûr de vouloir supprimer le véhicule <strong>"{selectedVehicle?.brand} {selectedVehicle?.model}"</strong> avec la plaque <strong>{selectedVehicle?.license_plate}</strong> ?
              <br /><br />
              Cette action est irréversible.
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
