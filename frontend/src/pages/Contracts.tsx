import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, FileText, Filter, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
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
import { Textarea } from '../components/ui/textarea';
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    bookingId: '',
    status: 'DRAFT',
    startDate: '',
    endDate: '',
    depositAmount: 0,
    excessAmount: 0,
    mileageLimit: 0,
    extraMileageRate: 0,
    termsAndConditions: '',
  });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let filtered = contracts;
    if (searchTerm) {
      filtered = filtered.filter((c) =>
        c.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    setFilteredContracts(filtered);
  }, [searchTerm, statusFilter, contracts]);

  const loadData = async () => {
    try {
      const [contractsData, bookingsData] = await Promise.all([
        contractService.getAll(), bookingService.getAll(),
      ]);
      setContracts(contractsData);
      setFilteredContracts(contractsData);
      setBookings(bookingsData);
    } catch (err) { setError(extractErrorMessage(err)); } finally { setLoading(false); }
  };

  const handleOpenDialog = (contract?: Contract) => {
    if (contract) {
      setSelectedContract(contract);
      setFormData({
        bookingId: contract.bookingId?.toString() || '',
        status: contract.status || 'DRAFT',
        startDate: contract.startDate?.split('T')[0] || '',
        endDate: contract.endDate?.split('T')[0] || '',
        depositAmount: parseFloat(contract.depositAmount as any) || 0,
        excessAmount: parseFloat(contract.excessAmount as any) || 0,
        mileageLimit: contract.mileageLimit || 0,
        extraMileageRate: parseFloat(contract.extraMileageRate as any) || 0,
        termsAndConditions: contract.termsAndConditions || '',
      });
    } else {
      setSelectedContract(null);
      setFormData({
        bookingId: '',
        status: 'DRAFT',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        depositAmount: 0,
        excessAmount: 0,
        mileageLimit: 0,
        extraMileageRate: 0,
        termsAndConditions: '',
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
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      // Only add optional fields if they have values
      if (formData.depositAmount && formData.depositAmount > 0) {
        payload.depositAmount = formData.depositAmount;
      }
      if (formData.excessAmount && formData.excessAmount > 0) {
        payload.excessAmount = formData.excessAmount;
      }
      if (formData.mileageLimit && formData.mileageLimit > 0) {
        payload.mileageLimit = formData.mileageLimit;
      }
      if (formData.extraMileageRate && formData.extraMileageRate > 0) {
        payload.extraMileageRate = formData.extraMileageRate;
      }
      if (formData.termsAndConditions && formData.termsAndConditions.trim()) {
        payload.termsAndConditions = formData.termsAndConditions.trim();
      }

      if (selectedContract) {
        await contractService.update(selectedContract.id.toString(), payload);
        toast({ title: "Contrat mis à jour", description: "Le contrat a été modifié avec succès.", variant: "success" });
      } else {
        await contractService.create(payload);
        toast({ title: "Contrat créé", description: "Le nouveau contrat a été créé avec succès.", variant: "success" });
      }
      await loadData();
      setDialogOpen(false);
    } catch (err) { setError(extractErrorMessage(err)); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!selectedContract) return;
    setLoading(true);
    try {
      await contractService.delete(selectedContract.id.toString());
      toast({ title: "Contrat supprimé", description: "Le contrat a été supprimé avec succès.", variant: "success" });
      await loadData();
      setDeleteDialogOpen(false);
      setSelectedContract(null);
    } catch (err) { setError(extractErrorMessage(err)); } finally { setLoading(false); }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; icon: any; label: string }> = {
      DRAFT: { bg: 'bg-gray-100 text-gray-800 border-gray-200', icon: <Clock className="h-3 w-3" />, label: 'Brouillon' },
      ACTIVE: { bg: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle className="h-3 w-3" />, label: 'Actif' },
      COMPLETED: { bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: <CheckCircle className="h-3 w-3" />, label: 'Terminé' },
      CANCELLED: { bg: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="h-3 w-3" />, label: 'Annulé' },
    };
    const c = config[status] || { bg: 'bg-gray-100 text-gray-800 border-gray-200', icon: null, label: status };
    return <Badge className={`${c.bg} border font-semibold gap-1`}>{c.icon}{c.label}</Badge>;
  };

  if (loading && contracts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement des contrats...</p>
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
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-900 to-orange-900 bg-clip-text text-transparent">
                Contrats
              </h1>
              <p className="text-gray-600 text-sm mt-1">Gérez les contrats de location</p>
            </div>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} size="lg" className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 px-8 py-6 text-base font-semibold rounded-xl">
          <Plus className="h-5 w-5" />
          Nouveau Contrat
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{contracts.length}</div>
              <div className="text-sm opacity-90">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-500 to-slate-600 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{contracts.filter(c => c.status === 'DRAFT').length}</div>
              <div className="text-sm opacity-90">Brouillons</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{contracts.filter(c => c.status === 'ACTIVE').length}</div>
              <div className="text-sm opacity-90">Actifs</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{contracts.filter(c => c.status === 'COMPLETED').length}</div>
              <div className="text-sm opacity-90">Terminés</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-amber-50 border-b-2 border-amber-100 pb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-amber-600" />
            Recherche et Filtres
          </h3>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="relative flex-1 w-full lg:max-w-xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input placeholder="Rechercher par numéro de contrat..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-12 border-2 border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 rounded-xl text-base shadow-sm" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-12 border-2 border-gray-300 rounded-xl shadow-sm">
                <SelectValue placeholder="Tous statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="ACTIVE">Actif</SelectItem>
                <SelectItem value="COMPLETED">Terminé</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== 'all') && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-600">{filteredContracts.length} résultat{filteredContracts.length !== 1 ? 's' : ''}</span>
              <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">Réinitialiser</Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-slate-100 to-gray-100">
                <TableRow className="border-b-2 border-amber-200">
                  <TableHead className="font-bold text-gray-900 text-sm py-4">N° Contrat</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Début</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Fin</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Caution</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Km max</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Statut</TableHead>
                  <TableHead className="text-right font-bold text-gray-900 text-sm py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full">
                          <FileText className="h-20 w-20 text-amber-600" />
                        </div>
                        <p className="text-gray-900 text-xl font-semibold mb-2">Aucun contrat trouvé</p>
                        <p className="text-gray-500 text-sm">{contracts.length === 0 ? "Aucun contrat enregistré" : "Modifiez vos critères"}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract, index) => (
                    <TableRow key={contract.id} className={`hover:bg-amber-50/80 transition-all duration-200 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                          <span className="font-mono font-bold text-gray-900">{contract.contractNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Calendar className="h-3.5 w-3.5 text-amber-600" />
                          {contract.startDate ? new Date(contract.startDate).toLocaleDateString('fr-FR') : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Calendar className="h-3.5 w-3.5 text-orange-600" />
                          {contract.endDate ? new Date(contract.endDate).toLocaleDateString('fr-FR') : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-amber-700 py-4">{contract.depositAmount} <span className="text-xs text-gray-500">TND</span></TableCell>
                      <TableCell className="text-sm text-gray-700 py-4">{contract.mileageLimit ? `${contract.mileageLimit} km` : '-'}</TableCell>
                      <TableCell className="py-4">{getStatusBadge(contract.status)}</TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(contract)} className="hover:bg-amber-100 hover:text-amber-700 rounded-lg"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedContract(contract); setDeleteDialogOpen(true); }} className="hover:bg-red-100 hover:text-red-700 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-900 to-orange-900 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg"><FileText className="h-6 w-6 text-amber-700" /></div>
              {selectedContract ? 'Modifier le contrat' : 'Nouveau contrat'}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 mt-2">Remplissez les informations du contrat de location</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-6">
            {error && <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-amber-600 rounded-full"></div>Général</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Réservation *</Label>
                    <Select value={formData.bookingId} onValueChange={(v) => setFormData({ ...formData, bookingId: v })}>
                      <SelectTrigger className="h-11 border-2 border-gray-300"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        {bookings.map((b) => (<SelectItem key={b.id} value={b.id.toString()}>Réservation #{b.id}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Statut</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger className="h-11 border-2 border-gray-300"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Brouillon</SelectItem>
                        <SelectItem value="ACTIVE">Actif</SelectItem>
                        <SelectItem value="COMPLETED">Terminé</SelectItem>
                        <SelectItem value="CANCELLED">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Date début *</Label>
                    <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="h-11 border-2 border-gray-300" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Date fin *</Label>
                    <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="h-11 border-2 border-gray-300" required />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-emerald-600 rounded-full"></div>Montants et kilométrage</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Caution (TND)</Label>
                    <Input type="number" step="0.01" value={formData.depositAmount} onChange={(e) => setFormData({ ...formData, depositAmount: parseFloat(e.target.value) || 0 })} className="h-11 border-2 border-gray-300" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Franchise (TND)</Label>
                    <Input type="number" step="0.01" value={formData.excessAmount} onChange={(e) => setFormData({ ...formData, excessAmount: parseFloat(e.target.value) || 0 })} className="h-11 border-2 border-gray-300" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Km max</Label>
                    <Input type="number" value={formData.mileageLimit} onChange={(e) => setFormData({ ...formData, mileageLimit: parseInt(e.target.value) || 0 })} className="h-11 border-2 border-gray-300" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Prix km suppl. (TND)</Label>
                    <Input type="number" step="0.01" value={formData.extraMileageRate} onChange={(e) => setFormData({ ...formData, extraMileageRate: parseFloat(e.target.value) || 0 })} className="h-11 border-2 border-gray-300" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-blue-600 rounded-full"></div>Conditions</h3>
                <Textarea rows={4} value={formData.termsAndConditions} onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })} placeholder="Termes et conditions du contrat..." className="border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>

            <DialogFooter className="mt-8 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="px-6">Annuler</Button>
              <Button type="submit" disabled={loading} className="px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Enregistrement...</> : selectedContract ? 'Mettre à jour' : 'Créer'}
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
            <DialogDescription className="text-base mt-2">Êtes-vous sûr de vouloir supprimer ce contrat ?</DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-red-600" />
                <div>
                  <div className="font-bold text-gray-900">Contrat #{selectedContract.contractNumber}</div>
                  <div className="text-sm text-gray-600">{selectedContract.depositAmount} TND · {selectedContract.status}</div>
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
