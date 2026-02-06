import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, CreditCard, DollarSign, FileText, ArrowRightLeft, Filter, Wallet, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
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
  const [statusFilter, setStatusFilter] = useState('all');
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

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let filtered = payments;
    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    setFilteredPayments(filtered);
  }, [searchTerm, statusFilter, payments]);

  const loadData = async () => {
    try {
      const [paymentsData, contractsData] = await Promise.all([
        paymentService.getAll(), contractService.getAll(),
      ]);
      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
      setContracts(contractsData);
    } catch (err) { setError(extractErrorMessage(err)); } finally { setLoading(false); }
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
      // Build payload with only valid fields
      const payload: Record<string, any> = {
        bookingId: formData.bookingId,
        amount: formData.amount,
        paidAt: formData.paidAt,
        paymentMethod: formData.paymentMethod,
        paymentType: formData.paymentType,
        status: formData.status,
      };

      // Only add paymentReference if it has a value (not empty string)
      if (formData.paymentReference && formData.paymentReference.trim()) {
        payload.paymentReference = formData.paymentReference.trim();
      }

      if (selectedPayment) {
        await paymentService.update(selectedPayment.id.toString(), payload);
        toast({ title: "Paiement mis à jour", description: "Le paiement a été modifié avec succès.", variant: "success" });
      } else {
        await paymentService.create(payload);
        toast({ title: "Paiement enregistré", description: "Le nouveau paiement a été ajouté avec succès.", variant: "success" });
      }
      await loadData();
      setDialogOpen(false);
    } catch (err) { setError(extractErrorMessage(err)); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!selectedPayment) return;
    setLoading(true);
    try {
      await paymentService.delete(selectedPayment.id.toString());
      toast({ title: "Paiement supprimé", description: "Le paiement a été supprimé avec succès.", variant: "success" });
      await loadData();
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
    } catch (err) { setError(extractErrorMessage(err)); } finally { setLoading(false); }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; icon: any; label: string }> = {
      PENDING: { bg: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="h-3 w-3" />, label: 'En attente' },
      COMPLETED: { bg: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle className="h-3 w-3" />, label: 'Effectué' },
      REFUNDED: { bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: <ArrowRightLeft className="h-3 w-3" />, label: 'Remboursé' },
      CANCELLED: { bg: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="h-3 w-3" />, label: 'Annulé' },
      FAILED: { bg: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="h-3 w-3" />, label: 'Échoué' },
    };
    const c = config[status] || { bg: 'bg-gray-100 text-gray-800 border-gray-200', icon: null, label: status };
    return <Badge className={`${c.bg} border font-semibold gap-1`}>{c.icon}{c.label}</Badge>;
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'CASH': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'CREDIT_CARD': case 'DEBIT_CARD': return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'CHECK': return <FileText className="h-4 w-4 text-orange-600" />;
      case 'BANK_TRANSFER': return <ArrowRightLeft className="h-4 w-4 text-purple-600" />;
      default: return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      CASH: 'Espèces', CREDIT_CARD: 'Carte crédit', DEBIT_CARD: 'Carte débit',
      CHECK: 'Chèque', BANK_TRANSFER: 'Virement', MOBILE_PAYMENT: 'Mobile',
    };
    return labels[mode] || mode;
  };

  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
  const completedAmount = payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

  if (loading && payments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement des paiements...</p>
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
            <div className="p-3 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl shadow-lg">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-900 to-green-900 bg-clip-text text-transparent">
                Paiements
              </h1>
              <p className="text-gray-600 text-sm mt-1">Gérez les transactions et paiements</p>
            </div>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} size="lg" className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 px-8 py-6 text-base font-semibold rounded-xl">
          <Plus className="h-5 w-5" />
          Nouveau Paiement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-green-600 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{payments.length}</div>
              <div className="text-sm opacity-90">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{completedAmount.toFixed(0)}</div>
              <div className="text-sm opacity-90">Encaissé (TND)</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-amber-600 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{payments.filter(p => p.status === 'PENDING').length}</div>
              <div className="text-sm opacity-90">En attente</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{totalAmount.toFixed(0)}</div>
              <div className="text-sm opacity-90">Total (TND)</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-emerald-50 border-b-2 border-emerald-100 pb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-emerald-600" />
            Recherche et Filtres
          </h3>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="relative flex-1 w-full lg:max-w-xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input placeholder="Rechercher par référence ou mode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-12 border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl text-base shadow-sm" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-12 border-2 border-gray-300 rounded-xl shadow-sm">
                <SelectValue placeholder="Tous statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="COMPLETED">Effectué</SelectItem>
                <SelectItem value="REFUNDED">Remboursé</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== 'all') && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-600">{filteredPayments.length} résultat{filteredPayments.length !== 1 ? 's' : ''}</span>
              <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">Réinitialiser</Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-slate-100 to-gray-100">
                <TableRow className="border-b-2 border-emerald-200">
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Référence</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Type</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Mode</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Date</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Montant</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Statut</TableHead>
                  <TableHead className="text-right font-bold text-gray-900 text-sm py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full">
                          <CreditCard className="h-20 w-20 text-emerald-600" />
                        </div>
                        <p className="text-gray-900 text-xl font-semibold mb-2">Aucun paiement trouvé</p>
                        <p className="text-gray-500 text-sm">{payments.length === 0 ? "Aucun paiement enregistré" : "Modifiez vos critères"}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment, index) => (
                    <TableRow key={payment.id} className={`hover:bg-emerald-50/80 transition-all duration-200 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full"></div>
                          <span className="font-mono font-bold text-gray-900">{payment.paymentReference}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="capitalize px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200">
                          {payment.paymentType?.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          {getModeIcon(payment.paymentMethod)}
                          <span className="text-sm font-medium">{getModeLabel(payment.paymentMethod)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 py-4">{new Date(payment.paidAt || payment.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="font-bold text-emerald-700 text-lg py-4">{payment.amount} <span className="text-sm text-gray-500">TND</span></TableCell>
                      <TableCell className="py-4">{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(payment)} className="hover:bg-emerald-100 hover:text-emerald-700 rounded-lg"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedPayment(payment); setDeleteDialogOpen(true); }} className="hover:bg-red-100 hover:text-red-700 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-900 to-green-900 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg"><CreditCard className="h-6 w-6 text-emerald-700" /></div>
              {selectedPayment ? 'Modifier le paiement' : 'Nouveau paiement'}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 mt-2">Remplissez les informations du paiement</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-6">
            {error && <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-emerald-600 rounded-full"></div>Informations</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Contrat *</Label>
                    <Select value={formData.bookingId} onValueChange={(v) => setFormData({ ...formData, bookingId: v })}>
                      <SelectTrigger className="h-11 border-2 border-gray-300"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        {contracts.map((c) => (<SelectItem key={c.id} value={c.bookingId?.toString() || c.id.toString()}>Contrat #{c.contractNumber}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Référence *</Label>
                    <Input value={formData.paymentReference} onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })} placeholder="REF-XXXX" className="h-11 border-2 border-gray-300" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Montant (TND) *</Label>
                    <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} className="h-11 border-2 border-gray-300" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Date *</Label>
                    <Input type="date" value={formData.paidAt} onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })} className="h-11 border-2 border-gray-300" required />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-blue-600 rounded-full"></div>Détails</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Mode</Label>
                    <Select value={formData.paymentMethod} onValueChange={(v: any) => setFormData({ ...formData, paymentMethod: v })}>
                      <SelectTrigger className="h-11 border-2 border-gray-300"><SelectValue /></SelectTrigger>
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
                    <Label className="text-sm font-semibold text-gray-700">Type</Label>
                    <Select value={formData.paymentType} onValueChange={(v: any) => setFormData({ ...formData, paymentType: v })}>
                      <SelectTrigger className="h-11 border-2 border-gray-300"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RENTAL_FEE">Location</SelectItem>
                        <SelectItem value="DEPOSIT">Caution</SelectItem>
                        <SelectItem value="EXCESS_CHARGE">Franchise</SelectItem>
                        <SelectItem value="DAMAGE_CHARGE">Frais dommage</SelectItem>
                        <SelectItem value="LATE_FEE">Frais retard</SelectItem>
                        <SelectItem value="REFUND">Remboursement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm font-semibold text-gray-700">Statut</Label>
                    <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger className="h-11 border-2 border-gray-300"><SelectValue /></SelectTrigger>
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
              </div>
            </div>

            <DialogFooter className="mt-8 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="px-6">Annuler</Button>
              <Button type="submit" disabled={loading} className="px-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Enregistrement...</> : selectedPayment ? 'Mettre à jour' : 'Enregistrer'}
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
              <div className="p-2 bg-red-100 rounded-lg"><Trash2 className="h-5 w-5 text-red-600" /></div>
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription className="text-base mt-2">Êtes-vous sûr de vouloir supprimer ce paiement ?</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-red-600" />
                <div>
                  <div className="font-bold text-gray-900">{selectedPayment.paymentReference}</div>
                  <div className="text-sm text-gray-600">{selectedPayment.amount} TND</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="px-6">Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="px-6 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Suppression...</> : <><Trash2 className="h-4 w-4 mr-2" />Supprimer</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
