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
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  customer_type: string;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  agency_name: string;
  total_rentals: number;
  total_revenue: number;
  last_rental_date?: string;
  created_at: string;
}

interface RentalHistory {
  booking_number: string;
  vehicle_info: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

// Helper functions to normalize data from API
const normalizeClient = (client: any): Client => ({
  ...client,
  total_revenue: typeof client.total_revenue === 'string' ? parseFloat(client.total_revenue) : client.total_revenue,
});

const normalizeRentalHistory = (rental: any): RentalHistory => ({
  ...rental,
  total_amount: typeof rental.total_amount === 'string' ? parseFloat(rental.total_amount) : rental.total_amount,
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
        c.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/proprietaire/clients');
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
      const response = await api.get(`/proprietaire/clients/${clientId}/rentals`);
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
      await api.put(`/proprietaire/clients/${selectedClient.id}/blacklist`, {
        is_blacklisted: !selectedClient.is_blacklisted,
        reason: selectedClient.is_blacklisted ? null : blacklistReason,
      });
      await loadClients();
      setBlacklistDialogOpen(false);
      setBlacklistReason('');
      setSelectedClient(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    return {
      total: clients.length,
      blacklisted: clients.filter((c) => c.is_blacklisted).length,
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
                          {client.first_name} {client.last_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{client.email}</div>
                          <div className="text-slate-500">{client.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{client.agency_name}</TableCell>
                      <TableCell className="capitalize">{client.customer_type}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{client.total_rentals}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-green-600">
                          {client.total_revenue.toFixed(2)} DT
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.last_rental_date
                          ? new Date(client.last_rental_date).toLocaleDateString('fr-FR')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {client.is_blacklisted ? (
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
                              setBlacklistReason(client.blacklist_reason || '');
                              setBlacklistDialogOpen(true);
                            }}
                            title={client.is_blacklisted ? 'Retirer de la blacklist' : 'Ajouter à la blacklist'}
                          >
                            {client.is_blacklisted ? (
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
              Historique de Location - {selectedClient?.first_name} {selectedClient?.last_name}
            </DialogTitle>
            <DialogDescription>
              Total de {rentalHistory.length} location(s) | Revenu total: {selectedClient?.total_revenue.toFixed(2)} DT
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
                  <TableRow key={rental.booking_number}>
                    <TableCell className="font-mono text-xs">
                      {rental.booking_number}
                    </TableCell>
                    <TableCell>{rental.vehicle_info}</TableCell>
                    <TableCell>{new Date(rental.start_date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{new Date(rental.end_date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{rental.duration_days}j</TableCell>
                    <TableCell className="font-semibold">
                      {rental.total_amount.toFixed(2)} DT
                    </TableCell>
                    <TableCell>{getStatusBadge(rental.status)}</TableCell>
                    <TableCell>{getPaymentBadge(rental.payment_status)}</TableCell>
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
              {selectedClient?.is_blacklisted ? 'Retirer de la Blacklist' : 'Ajouter à la Blacklist'}
            </DialogTitle>
            <DialogDescription>
              Client: {selectedClient?.first_name} {selectedClient?.last_name}
            </DialogDescription>
          </DialogHeader>

          {!selectedClient?.is_blacklisted && (
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

          {selectedClient?.is_blacklisted && selectedClient.blacklist_reason && (
            <div className="space-y-2">
              <Label>Raison actuelle:</Label>
              <div className="p-3 bg-slate-100 rounded text-sm">
                {selectedClient.blacklist_reason}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlacklistDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant={selectedClient?.is_blacklisted ? 'default' : 'destructive'}
              onClick={handleBlacklist}
              disabled={loading || (!selectedClient?.is_blacklisted && !blacklistReason.trim())}
            >
              {loading
                ? 'Enregistrement...'
                : selectedClient?.is_blacklisted
                ? 'Retirer de la Blacklist'
                : 'Ajouter à la Blacklist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
