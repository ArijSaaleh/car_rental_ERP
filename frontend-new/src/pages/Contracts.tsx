import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, FileText, Download } from 'lucide-react';
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
import { contractService } from '../services/contract.service';
import { bookingService } from '../services/booking.service';
import type { Contract } from '../types';
import { extractErrorMessage } from '../utils/errorHandler';

export default function Contracts() {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<{
    reservation_id: string;
    date_debut: string;
    date_fin: string;
    conditions: string;
    caution: number;
    franchise: number;
    kilometrage_inclus: number;
    prix_km_supplementaire: number;
    statut: 'en_attente' | 'actif' | 'termine' | 'annule';
  }>({
    reservation_id: '',
    date_debut: '',
    date_fin: '',
    conditions: '',
    caution: 0,
    franchise: 0,
    kilometrage_inclus: 0,
    prix_km_supplementaire: 0,
    statut: 'en_attente',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = contracts.filter(
      (contract) =>
        contract.reservation?.client?.nom
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        contract.statut.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContracts(filtered);
  }, [searchTerm, contracts]);

  const loadData = async () => {
    try {
      const [contractsData, bookingsData] = await Promise.all([
        contractService.getAll(),
        bookingService.getAll(),
      ]);
      setContracts(contractsData);
      setFilteredContracts(contractsData);
      setBookings(bookingsData);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (contract?: Contract) => {
    if (contract) {
      setSelectedContract(contract);
      setFormData({
        reservation_id: contract.reservation_id.toString(),
        date_debut: contract.date_debut.split('T')[0],
        date_fin: contract.date_fin.split('T')[0],
        conditions: contract.conditions,
        caution: contract.caution,
        franchise: contract.franchise,
        kilometrage_inclus: contract.kilometrage_inclus,
        prix_km_supplementaire: contract.prix_km_supplementaire,
        statut: contract.statut,
      });
    } else {
      setSelectedContract(null);
      setFormData({
        reservation_id: '',
        date_debut: '',
        date_fin: '',
        conditions: '',
        caution: 0,
        franchise: 0,
        kilometrage_inclus: 0,
        prix_km_supplementaire: 0,
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
      if (selectedContract) {
        await contractService.update(selectedContract.id, formData as any);
        toast({
          title: "Contrat mis à jour",
          description: "Le contrat a été modifié avec succès.",
          variant: "success",
        });
      } else {
        await contractService.create(formData as any);
        toast({
          title: "Contrat créé",
          description: "Le nouveau contrat a été généré avec succès.",
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
    if (!selectedContract) return;
    setLoading(true);

    try {
      await contractService.delete(selectedContract.id);
      toast({
        title: "Contrat supprimé",
        description: "Le contrat a été supprimé avec succès.",
        variant: "success",
      });
      await loadData();
      setDeleteDialogOpen(false);
      setSelectedContract(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    const variants: Record<string, string> = {
      en_attente: 'bg-yellow-100 text-yellow-800',
      actif: 'bg-green-100 text-green-800',
      termine: 'bg-gray-100 text-gray-800',
      annule: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      actif: 'Actif',
      termine: 'Terminé',
      annule: 'Annulé',
    };
    return (
      <Badge className={variants[statut] || 'bg-gray-100 text-gray-800'}>
        {labels[statut] || statut}
      </Badge>
    );
  };

  if (loading && contracts.length === 0) {
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
            Contrats
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gérez vos contrats de location
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau contrat
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par client ou statut..."
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
                  <TableHead>Contrat</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Caution</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Aucun contrat trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">#{contract.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contract.reservation?.client?.nom}{' '}
                        {contract.reservation?.client?.prenom}
                      </TableCell>
                      <TableCell>
                        {contract.reservation?.vehicule?.marque}{' '}
                        {contract.reservation?.vehicule?.modele}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(contract.date_debut).toLocaleDateString()}</div>
                          <div className="text-slate-500">
                            au {new Date(contract.date_fin).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{contract.caution} DT</TableCell>
                      <TableCell>{getStatusBadge(contract.statut)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(contract)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedContract(contract);
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
              {selectedContract ? 'Modifier le contrat' : 'Nouveau contrat'}
            </DialogTitle>
            <DialogDescription>Remplissez les informations du contrat</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reservation_id">Réservation</Label>
                <Select
                  value={formData.reservation_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, reservation_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une réservation" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id.toString()}>
                        {booking.client?.nom} - {booking.vehicule?.marque}{' '}
                        {booking.vehicule?.modele}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="termine">Terminé</SelectItem>
                    <SelectItem value="annule">Annulé</SelectItem>
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
                  onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caution">Caution (DT)</Label>
                <Input
                  id="caution"
                  type="number"
                  step="0.01"
                  value={formData.caution}
                  onChange={(e) =>
                    setFormData({ ...formData, caution: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="franchise">Franchise (DT)</Label>
                <Input
                  id="franchise"
                  type="number"
                  step="0.01"
                  value={formData.franchise}
                  onChange={(e) =>
                    setFormData({ ...formData, franchise: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kilometrage_inclus">Kilométrage inclus</Label>
                <Input
                  id="kilometrage_inclus"
                  type="number"
                  value={formData.kilometrage_inclus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kilometrage_inclus: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prix_km_supplementaire">Prix km supplémentaire</Label>
                <Input
                  id="prix_km_supplementaire"
                  type="number"
                  step="0.01"
                  value={formData.prix_km_supplementaire}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prix_km_supplementaire: parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="conditions">Conditions</Label>
                <textarea
                  id="conditions"
                  value={formData.conditions}
                  onChange={(e) =>
                    setFormData({ ...formData, conditions: e.target.value })
                  }
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  required
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

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce contrat ?
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
