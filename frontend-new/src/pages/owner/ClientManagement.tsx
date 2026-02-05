import { useEffect, useState } from 'react';
import { Search, Eye, Ban, CheckCircle, TrendingUp, Users as UsersIcon } from 'lucide-react';
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
import { Textarea } from '../../components/ui/textarea';
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorHandler';

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isBlacklisted: boolean;
  blacklistReason?: string;
  createdAt: string;
  // Computed fields - may not exist
  totalRentals?: number;
  totalRevenue?: number;
  lastRentalDate?: string;
}

interface RentalHistory {
  id: number;
  bookingNumber: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  vehicle?: {
    brand: string;
    model: string;
    licensePlate: string;
  };
}

// Helper functions to normalize data from API
const normalizeClient = (client: any): Client => ({
  id: client.id,
  firstName: client.firstName,
  lastName: client.lastName,
  email: client.email,
  phone: client.phone,
  isBlacklisted: client.isBlacklisted || false,
  blacklistReason: client.blacklistReason,
  createdAt: client.createdAt,
  totalRentals: client.totalRentals || 0,
  totalRevenue: typeof client.totalRevenue === 'string' ? parseFloat(client.totalRevenue) : (client.totalRevenue || 0),
  lastRentalDate: client.lastRentalDate,
});

const normalizeRentalHistory = (rental: any): RentalHistory => ({
  id: rental.id,
  bookingNumber: rental.bookingNumber,
  startDate: rental.startDate,
  endDate: rental.endDate,
  durationDays: rental.durationDays,
  totalAmount: typeof rental.totalAmount === 'string' ? parseFloat(rental.totalAmount) : rental.totalAmount,
  status: rental.status,
  paymentStatus: rental.paymentStatus,
  createdAt: rental.createdAt,
  vehicle: rental.vehicle,
});

export default function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [rentalHistory, setRentalHistory] = useState<RentalHistory[]>([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(
      (c) =>
        c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers');
      const normalizedClients = response.data.map(normalizeClient);
      setClients(normalizedClients);
      setFilteredClients(normalizedClients);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadRentalHistory = async (clientId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/customers/${clientId}/bookings`);
      const normalizedHistory = response.data.map(normalizeRentalHistory);
      setRentalHistory(normalizedHistory);
      setHistoryDialogOpen(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBlacklist = async () => {
    if (!selectedClient) return;

    setLoading(true);
    try {
      await api.put(`/customers/${selectedClient.id}/blacklist`, {
        is_blacklisted: !selectedClient.isBlacklisted,
        reason: selectedClient.isBlacklisted ? null : blacklistReason,
      });
      await loadClients();
      setBlacklistDialogOpen(false);
      setBlacklistReason('');
      setSelectedClient(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {(c.totalRevenue || 0), 0),
      totalRentals: clients.reduce((sum, c) => sum + (c.totalRentals || 0)
    }
  };

  const getStats = () => {
    return {
      total: clients.length,
      blacklisted: clients.filter((c) => c.isBlacklisted).length,
      totalRevenue: clients.reduce((sum, c) => sum + c.total_revenue, 0),
      totalRentals: clients.reduce((sum, c) => sum + c.total_rentals, 0),
    };
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-700'}>
        {status}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      partially_paid: 'bg-orange-100 text-orange-700',
      refunded: 'bg-blue-100 text-blue-700',
      failed: 'bg-red-100 text-red-700',
    };
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-700'}>
        {status}
      </Badge>
    );
  };

  const stats = getStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Clients</h1>
          <p className="text-slate-600 mt-2">
            Consultez vos clients et leur historique de locations
          </p>
        </div>
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
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Locations Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalRentals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenu Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalRevenue.toFixed(2)} DT
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Blacklistés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.blacklisted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par nom, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Agence</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Locations</TableHead>
                  <TableHead>Revenu</TableHead>
                  <TableHead>Dernière Location</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                      Aucun client trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="font-medium">
                          {client.firstName} {client.lastName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{client.email}</div>
                          <div className="text-slate-500">{client.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{client.totalRentals || 0}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-green-600">
                          {(client.totalRevenue || 0).toFixed(2)} DT
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.lastRentalDate
                          ? new Date(client.lastRentalDate).toLocaleDateString('fr-FR')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {client.isBlacklisted ? (
                          <Badge className="bg-red-100 text-red-700">Blacklisté</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700">Actif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedClient(client);
                              loadRentalHistory(client.id);
                            }}
                            title="Voir l'historique"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedClient(client);
                              setBlacklistReason(client.blacklistReason || '');
                              setBlacklistDialogOpen(true);
                            }}
                            title={client.isBlacklisted ? 'Retirer de la blacklist' : 'Ajouter à la blacklist'}
                          >
                            {client.isBlacklisted ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Ban className="h-4 w-4 text-red-600" />
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

      {/* Rental History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Historique de Location - {selectedClient?.firstName} {selectedClient?.lastName}
            </DialogTitle>
            <DialogDescription>
              Total de {rentalHistory.length} location(s) | Revenu total: {(selectedClient?.totalRevenue || 0).toFixed(2)} DT
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-x-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Réservation</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentalHistory.map((rental) => (
                  <TableRow key={rental.bookingNumber}>
                    <TableCell className="font-mono text-xs">
                      {rental.bookingNumber}
                    </TableCell>
                    <TableCell>
                      {rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'N/A'}
                    </TableCell>
                    <TableCell>{new Date(rental.startDate).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{new Date(rental.endDate).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{rental.durationDays}j</TableCell>
                    <TableCell className="font-semibold">
                      {rental.totalAmount.toFixed(2)} DT
                    </TableCell>
                    <TableCell>{getStatusBadge(rental.status)}</TableCell>
                    <TableCell>{getPaymentBadge(rental.paymentStatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button onClick={() => setHistoryDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blacklist Dialog */}
      <Dialog open={blacklistDialogOpen} onOpenChange={setBlacklistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedClient?.isBlacklisted ? 'Retirer de la blacklist' : 'Ajouter à la blacklist'}
            </DialogTitle>
            <DialogDescription>
              Client: {selectedClient?.firstName} {selectedClient?.lastName}
            </DialogDescription>
          </DialogHeader>

          {!selectedClient?.isBlacklisted && (
            <div className="space-y-2">
              <Label htmlFor="reason">Raison de la blacklist *</Label>
              <Textarea
                id="reason"
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                placeholder="Ex: Retard de paiement répété, dommages au véhicule..."
                rows={4}
              />
            </div>
          )}

          {selectedClient?.isBlacklisted && selectedClient.blacklistReason && (
            <div className="space-y-2">
              <Label>Raison actuelle:</Label>
              <div className="p-3 bg-slate-100 rounded text-sm">
                {selectedClient.blacklistReason}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlacklistDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant={selectedClient?.isBlacklisted ? 'default' : 'destructive'}
              onClick={handleBlacklist}
              disabled={loading || (!selectedClient?.isBlacklisted && !blacklistReason.trim())}
            >
              {loading
                ? 'Enregistrement...'
                : selectedClient?.isBlacklisted
                ? 'Retirer de la Blacklist'
                : 'Ajouter à la Blacklist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
