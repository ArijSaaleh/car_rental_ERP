import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, CreditCard, DollarSign } from 'lucide-react';
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
import { paymentService } from '../services/payment.service';
import { contractService } from '../services/contract.service';
import type { Payment } from '../types';
import { extractErrorMessage } from '../utils/errorHandler';

export default function Payments() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    contrat_id: '',
    montant: 0,
    date_paiement: '',
    mode_paiement: 'especes' as const,
    type_paiement: 'location' as const,
    statut: 'en_attente' as const,
    reference: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = payments.filter(
      (payment) =>
        payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.mode_paiement.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.statut.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPayments(filtered);
  }, [searchTerm, payments]);

  const loadData = async () => {
    try {
      const [paymentsData, contractsData] = await Promise.all([
        paymentService.getAll(),
        contractService.getAll(),
      ]);
      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
      setContracts(contractsData);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (payment?: Payment) => {
    if (payment) {
      setSelectedPayment(payment);
      setFormData({
        contrat_id: payment.contrat_id.toString(),
        montant: payment.montant,
        date_paiement: payment.date_paiement.split('T')[0],
        mode_paiement: payment.mode_paiement as typeof formData.mode_paiement,
        type_paiement: payment.type_paiement as typeof formData.type_paiement,
        statut: payment.statut as typeof formData.statut,
        reference: payment.reference,
      });
    } else {
      setSelectedPayment(null);
      setFormData({
        contrat_id: '',
        montant: 0,
        date_paiement: new Date().toISOString().split('T')[0],
        mode_paiement: 'especes',
        type_paiement: 'location',
        statut: 'en_attente',
        reference: '',
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
      if (selectedPayment) {
        await paymentService.update(selectedPayment.id, formData as any);
        toast({
          title: "Paiement mis à jour",
          description: "Le paiement a été modifié avec succès.",
          variant: "success",
        });
      } else {
        await paymentService.create(formData as any);
        toast({
          title: "Paiement enregistré",
          description: "Le nouveau paiement a été ajouté avec succès.",
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
    if (!selectedPayment) return;
    setLoading(true);

    try {
      await paymentService.delete(selectedPayment.id);
      toast({
        title: "Paiement supprimé",
        description: "Le paiement a été supprimé avec succès.",
        variant: "success",
      });
      await loadData();
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    const variants: Record<string, string> = {
      en_attente: 'bg-yellow-100 text-yellow-800',
      effectue: 'bg-green-100 text-green-800',
      rembourse: 'bg-blue-100 text-blue-800',
      annule: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      effectue: 'Effectué',
      rembourse: 'Remboursé',
      annule: 'Annulé',
    };
    return (
      <Badge className={variants[statut] || 'bg-gray-100 text-gray-800'}>
        {labels[statut] || statut}
      </Badge>
    );
  };

  const getModeIcon = (mode: string) => {
    if (mode === 'carte_bancaire') return <CreditCard className="h-4 w-4" />;
    return <DollarSign className="h-4 w-4" />;
  };

  if (loading && payments.length === 0) {
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
            Paiements
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gérez les transactions et paiements
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau paiement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par référence, mode ou statut..."
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
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      Aucun paiement trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium">{payment.reference}</div>
                      </TableCell>
                      <TableCell>
                        -
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">
                          {payment.type_paiement.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getModeIcon(payment.mode_paiement)}
                          <span className="capitalize">
                            {payment.mode_paiement.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(payment.date_paiement).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{payment.montant} DT</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.statut)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(payment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPayment(payment);
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
              {selectedPayment ? 'Modifier le paiement' : 'Nouveau paiement'}
            </DialogTitle>
            <DialogDescription>Remplissez les informations du paiement</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contrat_id">Contrat</Label>
                <Select
                  value={formData.contrat_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, contrat_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un contrat" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id.toString()}>
                        Contrat #{contract.id} -{' '}
                        {contract.reservation?.client?.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Référence</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  placeholder="REF-XXXX"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="montant">Montant (DT)</Label>
                <Input
                  id="montant"
                  type="number"
                  step="0.01"
                  value={formData.montant}
                  onChange={(e) =>
                    setFormData({ ...formData, montant: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_paiement">Date de paiement</Label>
                <Input
                  id="date_paiement"
                  type="date"
                  value={formData.date_paiement}
                  onChange={(e) =>
                    setFormData({ ...formData, date_paiement: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mode_paiement">Mode de paiement</Label>
                <Select
                  value={formData.mode_paiement}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, mode_paiement: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="especes">Espèces</SelectItem>
                    <SelectItem value="carte_bancaire">Carte bancaire</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                    <SelectItem value="virement">Virement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type_paiement">Type de paiement</Label>
                <Select
                  value={formData.type_paiement}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, type_paiement: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="caution">Caution</SelectItem>
                    <SelectItem value="franchise">Franchise</SelectItem>
                    <SelectItem value="km_supplementaire">Km supplémentaire</SelectItem>
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
                    <SelectItem value="effectue">Effectué</SelectItem>
                    <SelectItem value="rembourse">Remboursé</SelectItem>
                    <SelectItem value="annule">Annulé</SelectItem>
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
              Êtes-vous sûr de vouloir supprimer ce paiement ?
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
