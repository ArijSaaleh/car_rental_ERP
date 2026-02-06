import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Calendar, Users, Car, Clock, Filter, CheckCircle, XCircle } from 'lucide-react';
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
import { BookingDetails } from '../components/BookingDetails';
import { bookingService } from '../services/booking.service';
import { vehicleService } from '../services/vehicle.service';
import { customerService } from '../services/customer.service';
import type { Booking, BookingCreate, BookingUpdate } from '../types';
import { extractErrorMessage } from '../utils/errorHandler';

// Helper function to normalize booking data from API
const normalizeBooking = (booking: any): Booking => ({
  ...booking,
  dailyRate: typeof booking.dailyRate === 'string' ? booking.dailyRate : String(booking.dailyRate),
  durationDays: typeof booking.durationDays === 'string' ? parseInt(booking.durationDays) : booking.durationDays,
  subtotal: typeof booking.subtotal === 'string' ? booking.subtotal : String(booking.subtotal),
  taxAmount: typeof booking.taxAmount === 'string' ? booking.taxAmount : String(booking.taxAmount),
  timbreFiscal: typeof booking.timbreFiscal === 'string' ? booking.timbreFiscal : String(booking.timbreFiscal),
  totalAmount: typeof booking.totalAmount === 'string' ? booking.totalAmount : String(booking.totalAmount),
  depositAmount: typeof booking.depositAmount === 'string' ? booking.depositAmount : String(booking.depositAmount),
});

export default function Bookings() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<BookingCreate>({
    customerId: '',
    vehicleId: '',
    startDate: '',
    endDate: '',
    fuelPolicy: 'full_to_full',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = bookings;
    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.vehicle?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }
    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, bookings]);

  const loadData = async () => {
    try {
      const [bookingsData, vehiclesData, customersData] = await Promise.all([
        bookingService.getAll(),
        vehicleService.getAll(),
        customerService.getAll(),
      ]);
      const normalizedBookings = bookingsData.map(normalizeBooking);
      setBookings(normalizedBookings);
      setFilteredBookings(normalizedBookings);
      setVehicles(vehiclesData);
      setCustomers(customersData);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (booking?: Booking) => {
    if (booking) {
      setSelectedBooking(booking);
      setFormData({
        customerId: booking.customerId.toString(),
        vehicleId: booking.vehicleId,
        startDate: booking.startDate.split('T')[0],
        endDate: booking.endDate.split('T')[0],
        fuelPolicy: booking.fuelPolicy || 'full_to_full',
        notes: booking.notes || '',
      });
    } else {
      setSelectedBooking(null);
      setFormData({
        customerId: '',
        vehicleId: '',
        startDate: '',
        endDate: '',
        fuelPolicy: 'full_to_full',
        notes: '',
      });
    }
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.customerId || formData.customerId === '') {
      setError('Veuillez sélectionner un client');
      return;
    }
    if (!formData.vehicleId || formData.vehicleId === '') {
      setError('Veuillez sélectionner un véhicule');
      return;
    }
    if (!formData.startDate) {
      setError('Veuillez sélectionner une date de début');
      return;
    }
    if (!formData.endDate) {
      setError('Veuillez sélectionner une date de fin');
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (endDate <= startDate) {
      setError('La date de fin doit être après la date de début');
      return;
    }

    setLoading(true);

    try {
      if (selectedBooking) {
        const updateData: BookingUpdate = {
          startDate: formData.startDate,
          endDate: formData.endDate,
        };
        // Only add notes if it has a value
        if (formData.notes && formData.notes.trim()) {
          updateData.notes = formData.notes.trim();
        }
        await bookingService.update(selectedBooking.id, updateData);
        toast({
          title: "Réservation mise à jour",
          description: "La réservation a été modifiée avec succès.",
          variant: "success",
        });
      } else {
        // Build payload with only non-empty fields
        const payload: Record<string, any> = {
          customerId: formData.customerId,
          vehicleId: formData.vehicleId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          fuelPolicy: formData.fuelPolicy,
        };
        // Only add notes if it has a value
        if (formData.notes && formData.notes.trim()) {
          payload.notes = formData.notes.trim();
        }
        await bookingService.create(payload as any);
        toast({
          title: "Réservation créée",
          description: "La nouvelle réservation a été ajoutée avec succès.",
          variant: "success",
        });
      }
      await loadData();
      setDialogOpen(false);
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
      await bookingService.cancel(selectedBooking.id);
      await loadData();
      setDeleteDialogOpen(false);
      setSelectedBooking(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; icon: any; label: string }> = {
      pending: { bg: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="h-3 w-3" />, label: 'En attente' },
      confirmed: { bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: <CheckCircle className="h-3 w-3" />, label: 'Confirmée' },
      in_progress: { bg: 'bg-green-100 text-green-800 border-green-200', icon: <Car className="h-3 w-3" />, label: 'En cours' },
      completed: { bg: 'bg-gray-100 text-gray-800 border-gray-200', icon: <CheckCircle className="h-3 w-3" />, label: 'Terminée' },
      cancelled: { bg: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="h-3 w-3" />, label: 'Annulée' },
    };
    const c = config[status] || { bg: 'bg-gray-100 text-gray-800 border-gray-200', icon: null, label: status };
    return (
      <Badge className={`${c.bg} border font-semibold gap-1`}>
        {c.icon}
        {c.label}
      </Badge>
    );
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    inProgress: bookings.filter(b => b.status === 'IN_PROGRESS').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl shadow-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text text-transparent">
                Réservations
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Gérez vos réservations de véhicules
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          size="lg"
          className="gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 px-8 py-6 text-base font-semibold rounded-xl"
        >
          <Plus className="h-5 w-5" />
          Nouvelle Réservation
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{stats.total}</div>
              <div className="text-sm opacity-90 text-center">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-amber-600 border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{stats.pending}</div>
              <div className="text-sm opacity-90 text-center">En attente</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{stats.confirmed}</div>
              <div className="text-sm opacity-90 text-center">Confirmées</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{stats.inProgress}</div>
              <div className="text-sm opacity-90 text-center">En cours</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-500 to-slate-600 border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{stats.completed}</div>
              <div className="text-sm opacity-90 text-center">Terminées</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50 border-b-2 border-purple-100 pb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-purple-600" />
            Recherche et Filtres
          </h3>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="relative flex-1 w-full lg:max-w-xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Rechercher par client, véhicule ou n° réservation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-xl text-base shadow-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-12 border-2 border-gray-300 rounded-xl shadow-sm hover:border-purple-400 transition-colors">
                <SelectValue placeholder="Tous statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== 'all') && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-600">
                {filteredBookings.length} résultat{filteredBookings.length !== 1 ? 's' : ''}
              </span>
              <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                Réinitialiser
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-slate-100 to-gray-100">
                <TableRow className="border-b-2 border-purple-200">
                  <TableHead className="font-bold text-gray-900 text-sm py-4">N° Réservation</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Client</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Véhicule</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Période</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Prix Total</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Statut</TableHead>
                  <TableHead className="text-right font-bold text-gray-900 text-sm py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full">
                          <Calendar className="h-20 w-20 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-gray-900 text-xl font-semibold mb-2">Aucune réservation trouvée</p>
                          <p className="text-gray-500 text-sm mb-4">
                            {bookings.length === 0
                              ? "Commencez par créer une réservation"
                              : "Essayez de modifier vos critères de recherche"}
                          </p>
                        </div>
                        {bookings.length === 0 && (
                          <Button onClick={() => handleOpenDialog()} size="lg" className="mt-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg">
                            <Plus className="h-5 w-5 mr-2" />
                            Première réservation
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking, index) => (
                    <TableRow
                      key={booking.id}
                      className={`
                        hover:bg-purple-50/80 transition-all duration-200 border-b border-gray-100
                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                      `}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-violet-500 rounded-full"></div>
                          <span className="font-mono font-bold text-gray-900">{booking.bookingNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 shadow-sm">
                            <Users className="h-4 w-4 text-purple-700" />
                          </div>
                          <span className="font-medium text-gray-900">
                            {booking.customer?.firstName} {booking.customer?.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-semibold text-gray-900">{booking.vehicle?.brand} {booking.vehicle?.model}</div>
                            <div className="text-xs text-gray-500">{booking.vehicle?.licensePlate}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{new Date(booking.startDate).toLocaleDateString('fr-FR')}</div>
                          <div className="text-gray-500">au {new Date(booking.endDate).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-purple-700 text-lg py-4">
                        {parseFloat(booking.totalAmount).toFixed(3)} <span className="text-sm text-gray-500">TND</span>
                      </TableCell>
                      <TableCell className="py-4">{getStatusBadge(booking.status)}</TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedBooking(booking); setDetailsOpen(true); }} className="hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-colors" title="Voir les détails">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(booking)} className="hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedBooking(booking); setDeleteDialogOpen(true); }} className="hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-700" />
              </div>
              {selectedBooking ? 'Modifier la réservation' : 'Nouvelle réservation'}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 mt-2">
              Remplissez les informations de la réservation
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
                  Client et Véhicule
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Client *</Label>
                    <Select value={formData.customerId || ''} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                      <SelectTrigger className="h-11 border-2 border-gray-300 focus:border-purple-500">
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.firstName || customer.prenom} {customer.lastName || customer.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Véhicule *</Label>
                    <Select value={formData.vehicleId || ''} onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}>
                      <SelectTrigger className="h-11 border-2 border-gray-300 focus:border-purple-500">
                        <SelectValue placeholder="Sélectionner un véhicule" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.filter((v) => v.status === 'DISPONIBLE').map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                  Dates et Détails
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Date de début *</Label>
                    <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="h-11 border-2 border-gray-300 focus:border-blue-500" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Date de fin *</Label>
                    <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="h-11 border-2 border-gray-300 focus:border-blue-500" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Politique carburant</Label>
                    <Select value={formData.fuelPolicy} onValueChange={(value) => setFormData({ ...formData, fuelPolicy: value })}>
                      <SelectTrigger className="h-11 border-2 border-gray-300 focus:border-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_to_full">Plein à plein</SelectItem>
                        <SelectItem value="same_to_same">Même niveau</SelectItem>
                        <SelectItem value="prepaid">Prépayé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Notes</Label>
                    <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Notes additionnelles..." className="h-11 border-2 border-gray-300 focus:border-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="px-6">Annuler</Button>
              <Button type="submit" disabled={loading} className="px-6 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Enregistrement...</>
                ) : (
                  selectedBooking ? 'Mettre à jour' : 'Créer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetails
          booking={selectedBooking}
          open={detailsOpen}
          onClose={() => { setDetailsOpen(false); setSelectedBooking(null); }}
          onUpdate={loadData}
        />
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold text-red-900 flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              Annuler la réservation
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Êtes-vous sûr de vouloir annuler cette réservation ?
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-red-600" />
                <div>
                  <div className="font-bold text-gray-900">{selectedBooking.bookingNumber}</div>
                  <div className="text-sm text-gray-600">
                    {selectedBooking.customer?.firstName} {selectedBooking.customer?.lastName} - {selectedBooking.vehicle?.brand} {selectedBooking.vehicle?.model}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="px-6">Retour</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="px-6 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Annulation...</>
              ) : (
                <><XCircle className="h-4 w-4 mr-2" />Annuler la réservation</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
