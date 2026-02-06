import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, CreditCard, DollarSign, FileText, ArrowRightLeft } from 'lucide-react';
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
    bookingId: '',
    amount: 0,
    paidAt: '',
    paymentMethod: 'CASH' as const,
    paymentType: 'RENTAL_FEE' as const,
    status: 'PENDING' as const,
    paymentReference: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = payments.filter(
      (payment) =>
        payment.paymentReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.status.toLowerCase().includes(searchTerm.toLowerCase())
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
        bookingId: payment.bookingId.toString(),
        amount: parseFloat(payment.amount),
        paidAt: (payment.paidAt || payment.createdAt).split('T')[0],
        paymentMethod: payment.paymentMethod as typeof formData.paymentMethod,
        paymentType: payment.paymentType as typeof formData.paymentType,
        status: payment.status as typeof formData.status,
        paymentReference: payment.paymentReference,
      });
    } else {
      setSelectedPayment(null);
      setFormData({
        bookingId: '',
        amount: 0,
        paidAt: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        paymentType: 'RENTAL_FEE',
        status: 'PENDING',
        paymentReference: '',
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
        await paymentService.update(selectedPayment.id.toString(), formData as any);
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
      await paymentService.delete(selectedPayment.id.toString());
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      REFUNDED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      COMPLETED: 'Effectué',
      REFUNDED: 'Remboursé',
      CANCELLED: 'Annulé',
      FAILED: 'Échoué',
    };
    return (
      <Badge className={variants[status] || 'bg-slate-100 text-slate-800'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'CASH':
        return <DollarSign className="h-4 w-4" />;
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return <CreditCard className="h-4 w-4" />;
      case 'CHECK':
        return <FileText className="h-4 w-4" />;
      case 'BANK_TRANSFER':
        return <ArrowRightLeft className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
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
                        <div className="font-medium">{payment.paymentReference}</div>
                      </TableCell>
                      <TableCell>
                        #{payment.bookingId}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">
                          {payment.paymentType.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getModeIcon(payment.paymentMethod)}
                          <span className="capitalize">
                            {payment.paymentMethod.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{payment.amount} DT</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
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
                <Label htmlFor="bookingId">Réservation</Label>
                <Select
                  value={formData.bookingId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, bookingId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une réservation" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.bookingId?.toString() || contract.id.toString()}>
                        Contrat #{contract.contractNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentReference">Référence</Label>
                <Input
                  id="paymentReference"
                  value={formData.paymentReference}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentReference: e.target.value })
                  }
                  placeholder="REF-XXXX"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Montant (DT)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paidAt">Date de paiement</Label>
                <Input
                  id="paidAt"
                  type="date"
                  value={formData.paidAt}
                  onChange={(e) =>
                    setFormData({ ...formData, paidAt: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Mode de paiement</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Espèces</SelectItem>
                    <SelectItem value="CREDIT_CARD">Carte de crédit</SelectItem>
                    <SelectItem value="DEBIT_CARD">Carte de débit</SelectItem>
                    <SelectItem value="CHECK">Chèque</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Virement bancaire</SelectItem>
                    <SelectItem value="MOBILE_PAYMENT">Paiement mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentType">Type de paiement</Label>
                <Select
                  value={formData.paymentType}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, paymentType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RENTAL_FEE">Location</SelectItem>
                    <SelectItem value="DEPOSIT">Caution</SelectItem>
                    <SelectItem value="EXCESS_CHARGE">Franchise</SelectItem>
                    <SelectItem value="DAMAGE_CHARGE">Frais de dommage</SelectItem>
                    <SelectItem value="LATE_FEE">Frais de retard</SelectItem>
                    <SelectItem value="REFUND">Remboursement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="COMPLETED">Effectué</SelectItem>
                    <SelectItem value="FAILED">Échoué</SelectItem>
                    <SelectItem value="REFUNDED">Remboursé</SelectItem>
                    <SelectItem value="CANCELLED">Annulé</SelectItem>
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
