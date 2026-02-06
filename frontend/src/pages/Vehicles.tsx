import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Car as CarIcon, Filter, Calendar, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useToast } from '../hooks/use-toast';
import { vehicleService } from '../services/vehicle.service';
import type { Vehicle } from '../types';
import { extractErrorMessage } from '../utils/errorHandler';
import { CAR_BRANDS, CAR_MODELS, CAR_COLORS, FUEL_TYPES, VEHICLE_STATUS } from '../constants/vehicles';

export default function Vehicles() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [formData, setFormData] = useState<{
    licensePlate: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    fuelType: 'ESSENCE' | 'DIESEL' | 'HYBRIDE' | 'ELECTRIQUE';
    transmission: 'MANUELLE' | 'AUTOMATIQUE';
    mileage: number;
    dailyRate: string;
    status: 'DISPONIBLE' | 'LOUE' | 'MAINTENANCE' | 'HORS_SERVICE';
    insuranceExpiry?: string;
    registrationExpiry?: string;
  }>({
    licensePlate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    fuelType: 'ESSENCE',
    transmission: 'MANUELLE',
    mileage: 0,
    dailyRate: '0',
    status: 'DISPONIBLE',
    insuranceExpiry: '',
    registrationExpiry: '',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    let filtered = vehicles;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (vehicle) =>
          vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Brand filter
    if (brandFilter && brandFilter !== 'all') {
      filtered = filtered.filter(v => v.brand === brandFilter);
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    setFilteredVehicles(filtered);
  }, [searchTerm, brandFilter, statusFilter, vehicles]);

  // Update available models when brand changes
  useEffect(() => {
    if (formData.brand && CAR_MODELS[formData.brand]) {
      setAvailableModels(CAR_MODELS[formData.brand]);
      // Reset model if current model is not available for selected brand
      if (!CAR_MODELS[formData.brand].includes(formData.model)) {
        setFormData(prev => ({ ...prev, model: '' }));
      }
    } else {
      setAvailableModels([]);
    }
  }, [formData.brand]);

  const loadVehicles = async () => {
    try {
      const data = await vehicleService.getAll();
      setVehicles(data);
      setFilteredVehicles(data);
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
        licensePlate: vehicle.licensePlate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        fuelType: vehicle.fuelType,
        transmission: vehicle.transmission || 'MANUELLE',
        mileage: vehicle.mileage,
        dailyRate: vehicle.dailyRate,
        status: vehicle.status,
        insuranceExpiry: vehicle.insuranceExpiry || '',
        registrationExpiry: vehicle.registrationExpiry || '',
      });
    } else {
      setSelectedVehicle(null);
      setFormData({
        licensePlate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        fuelType: 'ESSENCE',
        transmission: 'MANUELLE',
        mileage: 0,
        dailyRate: '0',
        status: 'DISPONIBLE',
        insuranceExpiry: '',
        registrationExpiry: '',
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
      // Build vehicle data - don't send 'status' on create (not in CreateVehicleDto)
      const vehicleData: Record<string, any> = {
        licensePlate: formData.licensePlate,
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        color: formData.color,
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        mileage: formData.mileage,
        dailyRate: formData.dailyRate,
        insuranceExpiry: formData.insuranceExpiry || undefined,
        registrationExpiry: formData.registrationExpiry || undefined,
      };

      if (selectedVehicle) {
        // Status is allowed in UpdateVehicleDto
        vehicleData.status = formData.status;
        await vehicleService.update(selectedVehicle.id as any, vehicleData);
        toast({
          title: "Véhicule mis à jour",
          description: "Le véhicule a été mis à jour avec succès.",
          variant: "success",
        });
      } else {
        await vehicleService.create(vehicleData as any);
        toast({
          title: "Véhicule créé",
          description: "Le nouveau véhicule a été ajouté avec succès.",
          variant: "success",
        });
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
      await vehicleService.delete(selectedVehicle.id as any);
      toast({
        title: "Véhicule supprimé",
        description: "Le véhicule a été supprimé avec succès.",
        variant: "success",
      });
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

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expire', color: 'red', text: 'Expiré' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expire_bientot', color: 'orange', text: `${daysUntilExpiry}j restants` };
    }
    return { status: 'valide', color: 'green', text: 'Valide' };
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-slate-600">Chargement...</div>
      </div>
    );
  }

  // Calculate statistics
  const stats = {
    total: vehicles.length,
    disponible: vehicles.filter(v => v.status === 'DISPONIBLE').length,
    loue: vehicles.filter(v => v.status === 'LOUE').length,
    maintenance: vehicles.filter(v => v.status === 'MAINTENANCE').length,
    insuranceExpiring: vehicles.filter(v => {
      const status = getExpiryStatus(v.insuranceExpiry);
      return status && (status.status === 'expire' || status.status === 'expire_bientot');
    }).length,
    registrationExpiring: vehicles.filter(v => {
      const status = getExpiryStatus(v.registrationExpiry);
      return status && (status.status === 'expire' || status.status === 'expire_bientot');
    }).length,
  };

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
              <p className="text-gray-600 text-sm mt-1">
                Gérez vos véhicules en toute simplicité
              </p>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          size="lg"
          className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 px-8 py-6 text-base font-semibold rounded-xl"
        >
          <Plus className="h-5 w-5" />
          Nouveau Véhicule
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{stats.total}</div>
              <div className="text-sm opacity-90 text-center">Total Véhicules</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{stats.disponible}</div>
              <div className="text-sm opacity-90 text-center">Disponibles</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500 to-amber-600 border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{stats.loue}</div>
              <div className="text-sm opacity-90 text-center">Loués</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{stats.maintenance}</div>
              <div className="text-sm opacity-90 text-center">Maintenance</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-rose-500 to-pink-600 border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{stats.insuranceExpiring}</div>
              <div className="text-sm opacity-90 text-center">Assurance</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500 to-rose-600 border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{stats.registrationExpiring}</div>
              <div className="text-sm opacity-90 text-center">Immatriculation</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts for expiring documents */}
      {vehicles.some(v => {
        const insuranceStatus = getExpiryStatus(v.insuranceExpiry);
        const registrationStatus = getExpiryStatus(v.registrationExpiry);
        return (insuranceStatus && (insuranceStatus.status === 'expire' || insuranceStatus.status === 'expire_bientot')) ||
               (registrationStatus && (registrationStatus.status === 'expire' || registrationStatus.status === 'expire_bientot'));
      }) && (
        <div className="grid gap-4 md:grid-cols-2">
          {vehicles.filter(v => {
            const insuranceStatus = getExpiryStatus(v.insuranceExpiry);
            return insuranceStatus && (insuranceStatus.status === 'expire' || insuranceStatus.status === 'expire_bientot');
          }).length > 0 && (
            <Alert className="border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50">
              <Shield className="h-5 w-5 text-orange-600" />
              <AlertDescription className="text-orange-900 font-medium">
                <strong className="text-lg">{vehicles.filter(v => {
                  const insuranceStatus = getExpiryStatus(v.insuranceExpiry);
                  return insuranceStatus && (insuranceStatus.status === 'expire' || insuranceStatus.status === 'expire_bientot');
                }).length}</strong> véhicule(s) avec assurance à renouveler
              </AlertDescription>
            </Alert>
          )}
          
          {vehicles.filter(v => {
            const registrationStatus = getExpiryStatus(v.registrationExpiry);
            return registrationStatus && (registrationStatus.status === 'expire' || registrationStatus.status === 'expire_bientot');
          }).length > 0 && (
            <Alert className="border-red-300 bg-gradient-to-r from-red-50 to-pink-50">
              <Calendar className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-900 font-medium">
                <strong className="text-lg">{vehicles.filter(v => {
                  const registrationStatus = getExpiryStatus(v.registrationExpiry);
                  return registrationStatus && (registrationStatus.status === 'expire' || registrationStatus.status === 'expire_bientot');
                }).length}</strong> véhicule(s) avec immatriculation à renouveler
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Filters and Search */}
      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b-2 border-blue-100 pb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Recherche et Filtres
          </h3>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="relative flex-1 w-full lg:max-w-xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Rechercher par marque, modèle ou matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl text-base shadow-sm"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="w-full sm:w-[220px] h-12 border-2 border-gray-300 rounded-xl shadow-sm hover:border-blue-400 transition-colors">
                  <SelectValue placeholder="🚗 Toutes marques" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">🚗 Toutes marques</SelectItem>
                  {CAR_BRANDS.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-12 border-2 border-gray-300 rounded-xl shadow-sm hover:border-blue-400 transition-colors">
                  <SelectValue placeholder="📊 Tous statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📊 Tous statuts</SelectItem>
                  {VEHICLE_STATUS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {(searchTerm || brandFilter !== 'all' || statusFilter !== 'all') && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-gray-600">
                {filteredVehicles.length} résultat{filteredVehicles.length !== 1 ? 's' : ''} trouvé{filteredVehicles.length !== 1 ? 's' : ''}
              </span>
              {(searchTerm || brandFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setBrandFilter('all');
                    setStatusFilter('all');
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-100 to-gray-100">
              <TableRow className="border-b-2 border-blue-200">
                <TableHead className="font-bold text-gray-900 text-sm py-4">Matricule</TableHead>
                <TableHead className="font-bold text-gray-900 text-sm py-4">Véhicule</TableHead>
                <TableHead className="font-bold text-gray-900 text-sm py-4">Année</TableHead>
                <TableHead className="font-bold text-gray-900 text-sm py-4">Couleur</TableHead>
                <TableHead className="font-bold text-gray-900 text-sm py-4">Carburant</TableHead>
                <TableHead className="font-bold text-gray-900 text-sm py-4">Transmission</TableHead>
                <TableHead className="font-bold text-gray-900 text-sm py-4">Kilométrage</TableHead>
                <TableHead className="font-bold text-gray-900 text-sm py-4">Prix/Jour</TableHead>
                <TableHead className="font-bold text-gray-900 text-sm py-4">Assurance</TableHead>
                <TableHead className="font-bold text-gray-900 text-sm py-4">Immatriculation</TableHead>
                <TableHead className="font-bold text-gray-900 text-sm py-4">Statut</TableHead>
                <TableHead className="text-right font-bold text-gray-900 text-sm py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full">
                        <CarIcon className="h-20 w-20 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-gray-900 text-xl font-semibold mb-2">Aucun véhicule trouvé</p>
                        <p className="text-gray-500 text-sm mb-4">
                          {vehicles.length === 0 
                            ? "Commencez par ajouter votre premier véhicule"
                            : "Essayez de modifier vos critères de recherche"}
                        </p>
                      </div>
                      {vehicles.length === 0 && (
                        <Button 
                          onClick={() => handleOpenDialog()}
                          size="lg"
                          className="mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Ajouter le premier véhicule
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map((vehicle, index) => {
                  const insuranceStatus = getExpiryStatus(vehicle.insuranceExpiry);
                  const registrationStatus = getExpiryStatus(vehicle.registrationExpiry);
                  
                  return (
                    <TableRow 
                      key={vehicle.id} 
                      className={`
                        hover:bg-blue-50/80 transition-all duration-200 border-b border-gray-100
                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                      `}
                    >
                      <TableCell className="font-mono font-bold text-gray-900 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                          {vehicle.licensePlate}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 shadow-sm">
                            <CarIcon className="h-5 w-5 text-blue-700" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">
                              {vehicle.brand}
                            </div>
                            <div className="text-sm text-gray-600">
                              {vehicle.model}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700 font-semibold py-4">{vehicle.year}</TableCell>
                      <TableCell className="py-4">
                        <span className="capitalize px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200 shadow-sm">
                          {vehicle.color}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="capitalize px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 shadow-sm">
                          {vehicle.fuelType}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="capitalize px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border border-indigo-200 shadow-sm">
                          {vehicle.transmission === 'AUTOMATIQUE' ? 'Auto' : 'Manuelle'}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-700 font-semibold py-4">
                        {vehicle.mileage?.toLocaleString()} km
                      </TableCell>
                      <TableCell className="font-bold text-blue-700 text-lg py-4">
                        {vehicle.dailyRate} <span className="text-sm text-gray-500">TND</span>
                      </TableCell>
                      <TableCell className="py-4">
                        {insuranceStatus ? (
                          <div className="flex items-center gap-2">
                            <Shield className={`h-4 w-4 ${
                              insuranceStatus.status === 'valide' ? 'text-green-600' :
                              insuranceStatus.status === 'expire_bientot' ? 'text-orange-600' :
                              'text-red-600'
                            }`} />
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              insuranceStatus.status === 'valide' ? 'bg-green-100 text-green-800 border border-green-200' :
                              insuranceStatus.status === 'expire_bientot' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                              'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {insuranceStatus.text}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Non renseigné</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        {registrationStatus ? (
                          <div className="flex items-center gap-2">
                            <Calendar className={`h-4 w-4 ${
                              registrationStatus.status === 'valide' ? 'text-green-600' :
                              registrationStatus.status === 'expire_bientot' ? 'text-orange-600' :
                              'text-red-600'
                            }`} />
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              registrationStatus.status === 'valide' ? 'bg-green-100 text-green-800 border border-green-200' :
                              registrationStatus.status === 'expire_bientot' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                              'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {registrationStatus.text}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Non renseigné</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">{getStatusBadge(vehicle.status)}</TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(vehicle)}
                            className="hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors"
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
                            className="hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                <CarIcon className="h-6 w-6 text-blue-700" />
              </div>
              {selectedVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 mt-2">
              Remplissez les informations du véhicule ci-dessous
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {/* Section 1: Informations principales */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                  Informations principales
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licensePlate" className="text-sm font-semibold text-gray-700">
                      Matricule *
                    </Label>
                    <Input
                      id="licensePlate"
                      value={formData.licensePlate}
                      onChange={(e) =>
                        setFormData({ ...formData, licensePlate: e.target.value })
                      }
                      placeholder="123 TU 4567"
                      className="h-11 border-2 border-gray-300 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand" className="text-sm font-semibold text-gray-700">
                      Marque *
                    </Label>
                    <Select
                      value={formData.brand}
                      onValueChange={(value) =>
                        setFormData({ ...formData, brand: value })
                      }
                    >
                      <SelectTrigger className="h-11 border-2 border-gray-300 focus:border-blue-500">
                        <SelectValue placeholder="Sélectionner une marque" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {CAR_BRANDS.map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-sm font-semibold text-gray-700">
                      Modèle *
                    </Label>
                    <Select
                      value={formData.model}
                      onValueChange={(value) =>
                        setFormData({ ...formData, model: value })
                      }
                      disabled={!formData.brand}
                    >
                      <SelectTrigger className="h-11 border-2 border-gray-300 focus:border-blue-500">
                        <SelectValue placeholder="Sélectionner un modèle" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {availableModels.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!formData.brand && (
                      <p className="text-xs text-orange-600 font-medium">⚠️ Sélectionnez d'abord une marque</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-sm font-semibold text-gray-700">
                      Année *
                    </Label>
                    <Input
                      id="year"
                      type="number"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })
                      }
                      className="h-11 border-2 border-gray-300 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Caractéristiques */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                  Caractéristiques
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-sm font-semibold text-gray-700">
                      Couleur *
                    </Label>
                    <Select
                      value={formData.color}
                      onValueChange={(value) =>
                        setFormData({ ...formData, color: value })
                      }
                    >
                      <SelectTrigger className="h-11 border-2 border-gray-300 focus:border-green-500">
                        <SelectValue placeholder="Sélectionner une couleur" />
                      </SelectTrigger>
                      <SelectContent>
                        {CAR_COLORS.map(color => (
                          <SelectItem key={color.value} value={color.value}>
                            {color.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fuelType" className="text-sm font-semibold text-gray-700">
                      Type de carburant *
                    </Label>
                    <Select
                      value={formData.fuelType}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, fuelType: value })
                      }
                    >
                      <SelectTrigger className="h-11 border-2 border-gray-300 focus:border-green-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_TYPES.map(fuel => (
                          <SelectItem key={fuel.value} value={fuel.value}>
                            {fuel.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transmission" className="text-sm font-semibold text-gray-700">
                      Transmission *
                    </Label>
                    <Select
                      value={formData.transmission}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, transmission: value })
                      }
                    >
                      <SelectTrigger className="h-11 border-2 border-gray-300 focus:border-green-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANUELLE">Manuelle</SelectItem>
                        <SelectItem value="AUTOMATIQUE">Automatique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mileage" className="text-sm font-semibold text-gray-700">
                      Kilométrage *
                    </Label>
                    <Input
                      id="mileage"
                      type="number"
                      min="0"
                      value={formData.mileage}
                      onChange={(e) =>
                        setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })
                      }
                      className="h-11 border-2 border-gray-300 focus:border-green-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dailyRate" className="text-sm font-semibold text-gray-700">
                      Prix journalier (TND) *
                    </Label>
                    <Input
                      id="dailyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.dailyRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dailyRate: e.target.value,
                        })
                      }
                      className="h-11 border-2 border-gray-300 focus:border-green-500"
                      required
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
                      Statut *
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger className="h-11 border-2 border-gray-300 focus:border-green-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_STATUS.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 3: Documents */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
                  Documents administratifs
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="insuranceExpiry" className="text-sm font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-600" />
                        Date expiration assurance
                      </div>
                    </Label>
                    <Input
                      id="insuranceExpiry"
                      type="date"
                      value={formData.insuranceExpiry}
                      onChange={(e) =>
                        setFormData({ ...formData, insuranceExpiry: e.target.value })
                      }
                      className="h-11 border-2 border-gray-300 focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationExpiry" className="text-sm font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        Date expiration immatriculation
                      </div>
                    </Label>
                    <Input
                      id="registrationExpiry"
                      type="date"
                      value={formData.registrationExpiry}
                      onChange={(e) =>
                        setFormData({ ...formData, registrationExpiry: e.target.value })
                      }
                      className="h-11 border-2 border-gray-300 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 border-t pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                className="px-6"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Enregistrement...
                  </>
                ) : (
                  selectedVehicle ? 'Mettre à jour' : 'Ajouter'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold text-red-900 flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          
          {selectedVehicle && (
            <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CarIcon className="h-8 w-8 text-red-600" />
                <div>
                  <div className="font-bold text-gray-900">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </div>
                  <div className="text-sm text-gray-600 font-mono">
                    {selectedVehicle.licensePlate}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="px-6"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="px-6 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
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
