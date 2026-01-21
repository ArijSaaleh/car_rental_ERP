import { useEffect, useState } from 'react';
import { FileText, Download, Search, Eye } from 'lucide-react';
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

interface Contract {
  booking_id: number;
  booking_number: string;
  customer_name: string;
  vehicle_info: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
}

// Helper function to normalize contract data from API
const normalizeContract = (contract: any): Contract => ({
  ...contract,
  total_amount: typeof contract.total_amount === 'string' ? parseFloat(contract.total_amount) : contract.total_amount,
});

export default function ContractManagement() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    lessor_name: '',
    lessor_address: '',
    lessor_tax_id: '',
    lessor_registry: '',
    lessor_representative: '',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_license_plate: '',
    vehicle_vin: '',
    vehicle_year: new Date().getFullYear(),
    vehicle_mileage: 0,
    daily_rate: 0,
    deposit_amount: 0,
    mileage_limit: 0,
    extra_mileage_rate: 0,
    insurance_policy: '',
    insurance_coverage: '',
    special_conditions: '',
  });

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    const filtered = contracts.filter(
      (c) =>
        c.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.vehicle_info.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContracts(filtered);
  }, [searchTerm, contracts]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/proprietaire/contracts');
      const normalizedContracts = response.data.map(normalizeContract);
      setContracts(normalizedContracts);
      setFilteredContracts(normalizedContracts);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setFormData({
      lessor_name: '',
      lessor_address: '',
      lessor_tax_id: '',
      lessor_registry: '',
      lessor_representative: '',
      vehicle_brand: '',
      vehicle_model: '',
      vehicle_license_plate: '',
      vehicle_vin: '',
      vehicle_year: new Date().getFullYear(),
      vehicle_mileage: 0,
      daily_rate: 0,
      deposit_amount: 0,
      mileage_limit: 300,
      extra_mileage_rate: 0.5,
      insurance_policy: '',
      insurance_coverage: 'Tous risques',
      special_conditions: '',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleGeneratePDF = async () => {
    if (!selectedContract) return;

    setLoading(true);
    setError('');

    try {
      const payload = {
        booking_id: selectedContract.booking_id,
        ...formData,
      };

      const response = await api.post('/proprietaire/contracts/generate-pdf', payload, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Contrat_${selectedContract.booking_number}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setDialogOpen(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Contrats</h1>
          <p className="text-slate-600 mt-2">
            Générez des contrats de location conformes à la loi tunisienne
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Contrats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">En Cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {contracts.filter((c) => c.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Terminés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {contracts.filter((c) => c.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par numéro, client ou véhicule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Réservation</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      Aucun contrat trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract) => (
                    <TableRow key={contract.booking_id}>
                      <TableCell className="font-mono text-xs">
                        {contract.booking_number}
                      </TableCell>
                      <TableCell>{contract.customer_name}</TableCell>
                      <TableCell>{contract.vehicle_info}</TableCell>
                      <TableCell>
                        {new Date(contract.start_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {new Date(contract.end_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {contract.total_amount.toFixed(2)} DT
                      </TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(contract)}
                          title="Générer le contrat PDF"
                        >
                          <Download className="h-4 w-4 text-blue-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Generate Contract Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Générer Contrat de Location</DialogTitle>
            <DialogDescription>
              Réservation: {selectedContract?.booking_number} | Client: {selectedContract?.customer_name}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Lessor Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Informations du Bailleur (Agence)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lessor_name">Raison Sociale *</Label>
                  <Input
                    id="lessor_name"
                    value={formData.lessor_name}
                    onChange={(e) => setFormData({ ...formData, lessor_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lessor_tax_id">Matricule Fiscal *</Label>
                  <Input
                    id="lessor_tax_id"
                    value={formData.lessor_tax_id}
                    onChange={(e) => setFormData({ ...formData, lessor_tax_id: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="lessor_address">Adresse *</Label>
                  <Input
                    id="lessor_address"
                    value={formData.lessor_address}
                    onChange={(e) => setFormData({ ...formData, lessor_address: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lessor_registry">Registre de Commerce (RNE) *</Label>
                  <Input
                    id="lessor_registry"
                    value={formData.lessor_registry}
                    onChange={(e) => setFormData({ ...formData, lessor_registry: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lessor_representative">Représentant Légal *</Label>
                  <Input
                    id="lessor_representative"
                    value={formData.lessor_representative}
                    onChange={(e) => setFormData({ ...formData, lessor_representative: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Informations du Véhicule</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_brand">Marque *</Label>
                  <Input
                    id="vehicle_brand"
                    value={formData.vehicle_brand}
                    onChange={(e) => setFormData({ ...formData, vehicle_brand: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_model">Modèle *</Label>
                  <Input
                    id="vehicle_model"
                    value={formData.vehicle_model}
                    onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_license_plate">Immatriculation *</Label>
                  <Input
                    id="vehicle_license_plate"
                    value={formData.vehicle_license_plate}
                    onChange={(e) => setFormData({ ...formData, vehicle_license_plate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_vin">N° de Châssis (VIN) *</Label>
                  <Input
                    id="vehicle_vin"
                    value={formData.vehicle_vin}
                    onChange={(e) => setFormData({ ...formData, vehicle_vin: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_year">Année *</Label>
                  <Input
                    id="vehicle_year"
                    type="number"
                    value={formData.vehicle_year}
                    onChange={(e) => setFormData({ ...formData, vehicle_year: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_mileage">Kilométrage *</Label>
                  <Input
                    id="vehicle_mileage"
                    type="number"
                    value={formData.vehicle_mileage}
                    onChange={(e) => setFormData({ ...formData, vehicle_mileage: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Financial Terms */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Conditions Financières</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily_rate">Tarif Journalier (DT) *</Label>
                  <Input
                    id="daily_rate"
                    type="number"
                    step="0.001"
                    value={formData.daily_rate}
                    onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit_amount">Caution (DT) *</Label>
                  <Input
                    id="deposit_amount"
                    type="number"
                    step="0.001"
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage_limit">Limite Kilométrage</Label>
                  <Input
                    id="mileage_limit"
                    type="number"
                    value={formData.mileage_limit}
                    onChange={(e) => setFormData({ ...formData, mileage_limit: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extra_mileage_rate">Tarif km Supplémentaire (DT)</Label>
                  <Input
                    id="extra_mileage_rate"
                    type="number"
                    step="0.001"
                    value={formData.extra_mileage_rate}
                    onChange={(e) => setFormData({ ...formData, extra_mileage_rate: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Insurance */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Assurance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insurance_policy">N° Police d'Assurance *</Label>
                  <Input
                    id="insurance_policy"
                    value={formData.insurance_policy}
                    onChange={(e) => setFormData({ ...formData, insurance_policy: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance_coverage">Couverture *</Label>
                  <Input
                    id="insurance_coverage"
                    value={formData.insurance_coverage}
                    onChange={(e) => setFormData({ ...formData, insurance_coverage: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Special Conditions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Conditions Particulières</h3>
              <div className="space-y-2">
                <Label htmlFor="special_conditions">Conditions Spéciales (Optionnel)</Label>
                <Textarea
                  id="special_conditions"
                  value={formData.special_conditions}
                  onChange={(e) => setFormData({ ...formData, special_conditions: e.target.value })}
                  rows={4}
                  placeholder="Ajoutez des conditions particulières si nécessaire..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleGeneratePDF} disabled={loading} className="gap-2">
              <Download className="h-4 w-4" />
              {loading ? 'Génération...' : 'Générer PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
