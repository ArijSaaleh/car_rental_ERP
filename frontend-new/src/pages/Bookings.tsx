import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
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
  dailyRate: typeof booking.dailyRate === 'string' ? parseFloat(booking.dailyRate) : booking.dailyRate,
  duration_days: typeof booking.duration_days === 'string' ? parseInt(booking.duration_days) : booking.duration_days,
  subtotal: typeof booking.subtotal === 'string' ? parseFloat(booking.subtotal) : booking.subtotal,
  tax_amount: typeof booking.tax_amount === 'string' ? parseFloat(booking.tax_amount) : booking.tax_amount,
  timbre_fiscal: typeof booking.timbre_fiscal === 'string' ? parseFloat(booking.timbre_fiscal) : booking.timbre_fiscal,
  total_amount: typeof booking.total_amount === 'string' ? parseFloat(booking.total_amount) : booking.total_amount,
  depositAmount: typeof booking.depositAmount === 'string' ? parseFloat(booking.depositAmount) : booking.depositAmount,
});

export default function Bookings() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<BookingCreate>({
    customerId: 0,
    vehicleId: 0,
    startDate: '',
    endDate: '',
    fuel_policy: 'full_to_full',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = bookings.filter(
      (booking) =>
        booking.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vehicle?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBookings(filtered);
  }, [searchTerm, bookings]);

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
        customerId: booking.customerId,
        vehicleId: booking.vehicleId as any,
        startDate: booking.startDate.split('T')[0],
        endDate: booking.endDate.split('T')[0],
        fuel_policy: booking.fuel_policy || 'full_to_full',
        notes: booking.notes || '',
      });
    } else {
      setSelectedBooking(null);
      setFormData({
        customerId: 0,
        vehicleId: 0,
        startDate: '',
        endDate: '',
        fuel_policy: 'full_to_full',
        notes: '',
      });
    }
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.customerId || formData.customerId === 0) {
      setError('Veuillez sélectionner un client');
      return;
    }
    if (!formData.vehicleId || formData.vehicleId === 0) {
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

    // Validate dates
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
          notes: formData.notes,
        };
        await bookingService.update(selectedBooking.id, updateData);
        toast({
          title: "Réservation mise à jour",
          description: "La réservation a été modifiée avec succès.",
          variant: "success",
        });
      } else {
        await bookingService.create(formData);
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
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-slate-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Réservations
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gérez vos réservations de véhicules
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle réservation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par client, véhicule ou statut..."
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
                  <TableHead>N° Réservation</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Date Début</TableHead>
                  <TableHead>Date Fin</TableHead>
                  <TableHead>Prix Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      Aucune réservation trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.bookingNumber}</TableCell>
                      <TableCell>
                        {booking.customer?.firstName} {booking.customer?.lastName}
                      </TableCell>
                      <TableCell>
                        {booking.vehicle?.brand} {booking.vehicle?.model}
                      </TableCell>
                      <TableCell>{new Date(booking.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(booking.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>{booking.total_amount.toFixed(3)} DT</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setDetailsOpen(true);
                            }}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(booking)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedBooking(booking);
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
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBooking ? 'Modifier la réservation' : 'Nouvelle réservation'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de la réservation
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Client *</Label>
                <Select
                  value={formData.customerId > 0 ? formData.customerId.toString() : ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, customerId: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.prenom} {customer.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleId">Véhicule *</Label>
                <Select
                  value={formData.vehicleId > 0 ? formData.vehicleId.toString() : ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicleId: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un véhicule" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.filter((v) => v.statut === 'DISPONIBLE').map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.marque} {vehicle.modele} - {vehicle.matricule}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuel_policy">Politique de carburant</Label>
                <Select
                  value={formData.fuel_policy}
                  onValueChange={(value) =>
                    setFormData({ ...formData, fuel_policy: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_to_full">Plein à plein</SelectItem>
                    <SelectItem value="same_to_same">Même niveau</SelectItem>
                    <SelectItem value="prepaid">Prépayé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Notes additionnelles..."
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
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
          onClose={() => {
            setDetailsOpen(false);
            setSelectedBooking(null);
          }}
          onUpdate={loadData}
        />
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler cette réservation ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Annulation...' : 'Annuler la réservation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
