import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
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
import { bookingService } from '../services/booking.service';
import { vehicleService } from '../services/vehicle.service';
import { customerService } from '../services/customer.service';
import type { Booking } from '../types';
import { extractErrorMessage } from '../utils/errorHandler';

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<{
    client_id: string;
    vehicule_id: string;
    date_debut: string;
    date_fin: string;
    prix_total: number;
    statut: 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';
  }>({
    client_id: '',
    vehicule_id: '',
    date_debut: '',
    date_fin: '',
    prix_total: 0,
    statut: 'en_attente',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = bookings.filter(
      (booking) =>
        booking.client?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vehicule?.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.statut.toLowerCase().includes(searchTerm.toLowerCase())
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
      setBookings(bookingsData);
      setFilteredBookings(bookingsData);
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
        client_id: booking.client_id.toString(),
        vehicule_id: booking.vehicule_id.toString(),
        date_debut: booking.date_debut.split('T')[0],
        date_fin: booking.date_fin.split('T')[0],
        prix_total: booking.prix_total,
        statut: booking.statut as typeof formData.statut,
      });
    } else {
      setSelectedBooking(null);
      setFormData({
        client_id: '',
        vehicule_id: '',
        date_debut: '',
        date_fin: '',
        prix_total: 0,
        statut: 'en_attente',
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
      if (selectedBooking) {
        await bookingService.update(selectedBooking.id, formData as any);
      } else {
        await bookingService.create(formData as any);
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
      await bookingService.delete(selectedBooking.id);
      await loadData();
      setDeleteDialogOpen(false);
      setSelectedBooking(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    const variants: Record<string, string> = {
      en_attente: 'bg-yellow-100 text-yellow-800',
      confirmee: 'bg-blue-100 text-blue-800',
      en_cours: 'bg-green-100 text-green-800',
      terminee: 'bg-gray-100 text-gray-800',
      annulee: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      confirmee: 'Confirmée',
      en_cours: 'En cours',
      terminee: 'Terminée',
      annulee: 'Annulée',
    };
    return (
      <Badge className={variants[statut] || 'bg-gray-100 text-gray-800'}>
        {labels[statut] || statut}
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
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Aucune réservation trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {booking.client?.nom} {booking.client?.prenom}
                      </TableCell>
                      <TableCell>
                        {booking.vehicule?.marque} {booking.vehicule?.modele}
                      </TableCell>
                      <TableCell>{new Date(booking.date_debut).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(booking.date_fin).toLocaleDateString()}</TableCell>
                      <TableCell>{booking.prix_total} DT</TableCell>
                      <TableCell>{getStatusBadge(booking.statut)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
        <DialogContent className="max-w-2xl">
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
                <Label htmlFor="client_id">Client</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, client_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.nom} {customer.prenom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicule_id">Véhicule</Label>
                <Select
                  value={formData.vehicule_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicule_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un véhicule" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.filter((v) => v.statut === 'disponible').map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.marque} {vehicle.modele} - {vehicle.matricule}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_debut">Date de début</Label>
                <Input
                  id="date_debut"
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) =>
                    setFormData({ ...formData, date_debut: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_fin">Date de fin</Label>
                <Input
                  id="date_fin"
                  type="date"
                  value={formData.date_fin}
                  onChange={(e) =>
                    setFormData({ ...formData, date_fin: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prix_total">Prix total (DT)</Label>
                <Input
                  id="prix_total"
                  type="number"
                  step="0.01"
                  value={formData.prix_total}
                  onChange={(e) =>
                    setFormData({ ...formData, prix_total: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, statut: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="confirmee">Confirmée</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="terminee">Terminée</SelectItem>
                    <SelectItem value="annulee">Annulée</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette réservation ?
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
