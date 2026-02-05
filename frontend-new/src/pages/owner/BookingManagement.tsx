import { useEffect, useState } from 'react';
import { Search, Edit, Trash2, Calendar, User, Car, CheckCircle, XCircle, Clock, CheckCircle2, Play, List, CalendarDays } from 'lucide-react';
import { Button } from '../../components/ui/button';
import BookingCalendar from '../../components/BookingCalendar';
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

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cinNumber?: string;
}

interface Vehicle {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  dailyRate: number;
}

interface Booking {
  id: number;
  bookingNumber: string;
  agencyId: string;
  vehicleId: string;
  customerId: number;
  startDate: string;
  endDate: string;
  dailyRate: number;
  durationDays: number;
  subtotal: number;
  taxAmount: number;
  timbreFiscal: number;
  totalAmount: number;
  depositAmount: number;
  status: string;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
  customer?: Customer;
  vehicle?: Vehicle;
}

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

// Helper function to normalize booking data from API
const normalizeBooking = (booking: any): Booking => ({
  id: booking.id,
  bookingNumber: booking.bookingNumber,
  agencyId: booking.agencyId,
  vehicleId: booking.vehicleId,
  customerId: booking.customerId,
  startDate: booking.startDate,
  endDate: booking.endDate,
  dailyRate: typeof booking.dailyRate === 'string' ? parseFloat(booking.dailyRate) : booking.dailyRate,
  durationDays: typeof booking.durationDays === 'string' ? parseInt(booking.durationDays) : booking.durationDays,
  subtotal: typeof booking.subtotal === 'string' ? parseFloat(booking.subtotal) : booking.subtotal,
  taxAmount: typeof booking.taxAmount === 'string' ? parseFloat(booking.taxAmount) : booking.taxAmount,
  timbreFiscal: typeof booking.timbreFiscal === 'string' ? parseFloat(booking.timbreFiscal) : booking.timbreFiscal,
  totalAmount: typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : booking.totalAmount,
  depositAmount: typeof booking.depositAmount === 'string' ? parseFloat(booking.depositAmount) : booking.depositAmount,
  status: booking.status,
  paymentStatus: booking.paymentStatus,
  notes: booking.notes,
  createdAt: booking.createdAt,
  customer: booking.customer,
  vehicle: booking.vehicle,
});
  deposit_amount: typeof booking.depositAmount === 'string' ? parseFloat(booking.depositAmount) : booking.depositAmount,
  vehicle: booking.vehicle ? {
    ...booking.vehicle,
    daily_rate: typeof booking.vehicle.dailyRate === 'string' ? parseFloat(booking.vehicle.dailyRate) : booking.vehicle.dailyRate,
  } : undefined,
});

export default function BookingManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    start_date: '',
    end_date: '',
    daily_rate: 0,
    deposit_amount: 0,
    fuel_policy: 'full_to_full',
    notes: '',
  });

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    if (selectedAgencyId) {
      loadData();
    }
  }, [selectedAgencyId]);

  const loadAgencies = async () => {
    try {
      const response = await api.get('/agencies');
      setAgencies(response.data);
      if (response.data.length > 0) {
        setSelectedAgencyId(response.data[0].id);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const loadData = async () => {
    if (!selectedAgencyId) return;
    
    setLoading(true);
    try {
      const [bookingsRes, customersRes, vehiclesRes] = await Promise.all([
        api.get(`/bookings?agencyId=${selectedAgencyId}`),
        api.get(`/customers?agencyId=${selectedAgencyId}`),
        api.get(`/vehicles?agencyId=${selectedAgencyId}`),
      ]);

      const rawBookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : bookingsRes.data.bookings || [];
      const bookingsList = rawBookings.map(normalizeBooking);
      
      setBookings(bookingsList);
      setCustomers(customersRes.data.customers || customersRes.data || []);
      
      // Normalize vehicle data too
      const rawVehicles = vehiclesRes.data.vehicles || vehiclesRes.data || [];
      const normalizedVehicles = rawVehicles.map((v: any) => ({
        ...v,
        daily_rate: typeof v.dailyRate === 'string' ? parseFloat(v.dailyRate) : v.dailyRate,
      }));
      setVehicles(normalizedVehicles);
      
      calculateStats(bookingsList);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsList: Booking[]) => {
    const newStats = {
      total: bookingsList.length,
      pending: bookingsList.filter(b => b.status === 'pending').length,
      confirmed: bookingsList.filter(b => b.status === 'confirmed').length,
      in_progress: bookingsList.filter(b => b.status === 'in_progress').length,
      completed: bookingsList.filter(b => b.status === 'completed').length,
      cancelled: bookingsList.filter(b => b.status === 'cancelled').length,
    };
    setStats(newStats);
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (booking: Booking) => {
    setError('');
    setSuccess('');
    
    setSelectedBooking(booking);
    setFormData({
      customer_id: booking.customerId.toString(),
      vehicle_id: booking.vehicleId,
      start_date: booking.startDate,
      end_date: booking.endDate,
      daily_rate: booking.dailyRate,
      deposit_amount: booking.depositAmount,
      fuel_policy: 'full_to_full',
      notes: booking.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    
    setLoading(true);
    setError('');

    try {
      const payload = {
        customer_id: parseInt(formData.customerId),
        vehicle_id: formData.vehicleId,
        start_date: formData.startDate,
        end_date: formData.endDate,
        daily_rate: formData.dailyRate || null,
        deposit_amount: formData.depositAmount,
        fuel_policy: formData.fuel_policy,
        notes: formData.notes || null,
      };

      await api.patch(`/bookings/${selectedBooking.id}`, payload);
      setSuccess('Réservation modifiée avec succès');
      
      setDialogOpen(false);
      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBooking) return;

    setLoading(true);
    try {
      await api.delete(`/bookings/${selectedBooking.id}`);
      setSuccess('Réservation supprimée avec succès');
      setDeleteDialogOpen(false);
      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (bookingId: number) => {
    setLoading(true);
    try {
      await api.post(`/bookings/${bookingId}/confirm`);
      setSuccess('Réservation confirmée avec succès');
      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStartRental = async (bookingId: number) => {
    const initialMileage = prompt('Kilométrage initial:');
    const fuelLevel = prompt('Niveau carburant (full/three_quarters/half/quarter/empty):');
    
    if (initialMileage && fuelLevel) {
      setLoading(true);
      try {
        await api.post(`/bookings/${bookingId}/start`, null, {
          params: {
            initial_mileage: parseInt(initialMileage),
            initial_fuel_level: fuelLevel
          }
        });
        setSuccess('Location démarrée avec succès');
        await loadData();
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCompleteRental = async (bookingId: number) => {
    const finalMileage = prompt('Kilométrage final:');
    const fuelLevel = prompt('Niveau carburant (full/three_quarters/half/quarter/empty):');
    
    if (finalMileage && fuelLevel) {
      setLoading(true);
      try {
        await api.post(`/bookings/${bookingId}/complete`, null, {
          params: {
            final_mileage: parseInt(finalMileage),
            final_fuel_level: fuelLevel
          }
        });
        setSuccess('Location terminée avec succès');
        await loadData();
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVehicleChange = (vehicleId: string) => {
    setFormData(prev => ({ ...prev, vehicle_id: vehicleId }));
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle && vehicle.dailyRate) {
      setFormData(prev => ({ ...prev, daily_rate: vehicle.dailyRate }));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { label: 'Confirmée', className: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      in_progress: { label: 'En cours', className: 'bg-green-100 text-green-800', icon: Car },
      completed: { label: 'Terminée', className: 'bg-gray-100 text-gray-800', icon: CheckCircle },
      cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      className: 'bg-gray-100 text-gray-800',
      icon: Clock
    };
    
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Payé', className: 'bg-green-100 text-green-800' },
      partially_paid: { label: 'Partiellement payé', className: 'bg-orange-100 text-orange-800' },
      refunded: { label: 'Remboursé', className: 'bg-purple-100 text-purple-800' },
      failed: { label: 'Échoué', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      className: 'bg-gray-100 text-gray-800'
    };
    
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Réservations</h1>
          <p className="text-slate-600 mt-1">Consultez et gérez toutes vos réservations de location</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg bg-white">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4 mr-2" />
              Liste
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-l-none"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendrier
            </Button>
          </div>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
            <CardTitle className="text-sm font-medium text-slate-600">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Confirmées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.in_progress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Annulées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
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
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmée</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="N° réservation, client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar or Table View */}
      {viewMode === 'calendar' ? (
        <BookingCalendar 
          bookings={filteredBookings}
          onBookingClick={(booking) => handleOpenDialog(booking)}
        />
      ) : (
        /* Bookings Table */
        selectedAgencyId ? (
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8 text-slate-500">Chargement...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Réservation</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Véhicule</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Montant Total</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                          Aucune réservation trouvée
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-mono font-medium">
                            {booking.bookingNumber}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-400" />
                              <div>
                                <div className="font-medium">
                                  {booking.customer?.firstName} {booking.customer?.lastName}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {booking.customer?.phone}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-slate-400" />
                              <div>
                                <div className="font-medium">
                                  {booking.vehicle?.brand} {booking.vehicle?.model}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {booking.vehicle?.licensePlate}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <div>
                                <div>{new Date(booking.startDate).toLocaleDateString('fr-FR')}</div>
                                <div className="text-xs text-slate-500">
                                  au {new Date(booking.endDate).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{booking.durationDays} jours</TableCell>
                          <TableCell className="font-medium">
                            {booking.totalAmount.toFixed(3)} DT
                          </TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>{getPaymentBadge(booking.paymentStatus)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {booking.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleConfirmBooking(booking.id)}
                                  className="text-green-600 hover:text-green-700"
                                  title="Confirmer"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Confirmer
                                </Button>
                              )}
                              {booking.status === 'confirmed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartRental(booking.id)}
                                  className="text-blue-600 hover:text-blue-700"
                                  title="Démarrer"
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Démarrer
                                </Button>
                              )}
                              {booking.status === 'in_progress' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCompleteRental(booking.id)}
                                  className="text-purple-600 hover:text-purple-700"
                                  title="Terminer"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Terminer
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(booking)}
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setDeleteDialogOpen(true);
                                  }}
                                  title="Annuler"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-slate-500">Sélectionnez une agence pour voir ses réservations</p>
            </CardContent>
          </Card>
        )
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la réservation</DialogTitle>
            <DialogDescription>
              Modifiez les détails de la réservation {selectedBooking?.bookingNumber}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {/* Client & Vehicle */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-slate-700">Client et Véhicule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer_id">Client *</Label>
                    <Select
                      value={formData.customerId}
                      onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.firstName} {customer.lastName} - {customer.cinNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicle_id">Véhicule *</Label>
                    <Select
                      value={formData.vehicleId}
                      onValueChange={handleVehicleChange}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un véhicule" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.filter(v => v.status === 'DISPONIBLE').map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.brand} {vehicle.model} - {vehicle.licensePlate} ({vehicle.dailyRate} DT/jour)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Dates & Pricing */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-slate-700">Dates et Tarification</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Date de début *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">Date de fin *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="daily_rate">Tarif journalier (DT)</Label>
                    <Input
                      id="daily_rate"
                      type="number"
                      step="0.001"
                      value={formData.dailyRate}
                      onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })}
                      placeholder="Utiliser le tarif du véhicule"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deposit_amount">Caution (DT) *</Label>
                    <Input
                      id="deposit_amount"
                      type="number"
                      step="0.001"
                      value={formData.depositAmount}
                      onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-slate-700">Conditions de location</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fuel_policy">Politique carburant</Label>
                    <Select
                      value={formData.fuel_policy}
                      onValueChange={(value) => setFormData({ ...formData, fuel_policy: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_to_full">Plein à plein</SelectItem>
                        <SelectItem value="same_to_same">Même niveau</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                  placeholder="Notes ou conditions particulières..."
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Modifier'}
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
              Êtes-vous sûr de vouloir supprimer la réservation <strong>{selectedBooking?.bookingNumber}</strong> ?
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
