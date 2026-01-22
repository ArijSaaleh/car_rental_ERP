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
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Alert, AlertDescription } from '../../components/ui/alert';
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorHandler';

interface Agency {
  id: string;
  name: string;
}

interface Contract {
  id: number;
  contract_number: string;
  booking_id: number;
  booking_number?: string;
  customer_name?: string;
  vehicle_info?: string;
  start_date?: string;
  end_date?: string;
  total_amount?: number;
  status: string;
  agency_id: string;
  terms_and_conditions?: string;
  special_clauses?: any;
  created_at?: string;
}

// Helper function to normalize contract data from API
const normalizeContract = (contract: any): Contract => ({
  id: contract.id,
  contract_number: contract.contract_number,
  booking_id: contract.booking_id,
  booking_number: contract.booking_number || contract.contract_number,
  customer_name: contract.customer_name || 'N/A',
  vehicle_info: contract.vehicle_info || 'N/A',
  start_date: contract.start_date,
  end_date: contract.end_date,
  total_amount: contract.total_amount ? (typeof contract.total_amount === 'string' ? parseFloat(contract.total_amount) : contract.total_amount) : 0,
  status: contract.status,
  agency_id: contract.agency_id,
  terms_and_conditions: contract.terms_and_conditions,
  special_clauses: contract.special_clauses,
  created_at: contract.created_at,
});

export default function ContractManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    if (selectedAgencyId) {
      loadContracts();
    }
  }, [selectedAgencyId]);

  useEffect(() => {
    const filtered = contracts.filter(
      (c) =>
        c.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.vehicle_info.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContracts(filtered);
  }, [searchTerm, contracts]);

  const loadAgencies = async () => {
    try {
      const response = await api.get('/proprietaire/agencies');
      setAgencies(response.data);
      if (response.data.length > 0) {
        setSelectedAgencyId(response.data[0].id);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const loadContracts = async () => {
    if (!selectedAgencyId) return;
    
    setLoading(true);
    try {
      console.log('📋 Loading contracts for agency:', selectedAgencyId);
      const response = await api.get('/contracts/', {
        params: { agency_id: selectedAgencyId }
      });
      console.log('✅ Contracts loaded:', response.data.length);
      const normalizedContracts = response.data.map(normalizeContract);
      setContracts(normalizedContracts);
      setFilteredContracts(normalizedContracts);
    } catch (err: any) {
      console.error('❌ Failed to load contracts:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        agency_id: selectedAgencyId
      });
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setError('');
    setDialogOpen(true);
  };

  const handleDownloadPDF = async (contract: Contract) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/contracts/${contract.id}/pdf`, {
        params: { agency_id: selectedAgencyId },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Contrat_${contract.contract_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
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
            Consultez et téléchargez les contrats de location
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedAgencyId}
            onChange={(e) => setSelectedAgencyId(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            {agencies.map(agency => (
              <option key={agency.id} value={agency.id}>{agency.name}</option>
            ))}
          </select>
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
                        {contract.total_amount ? contract.total_amount.toFixed(2) : '0.00'} DT
                      </TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewContract(contract)}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(contract)}
                            title="Télécharger le PDF"
                          >
                            <Download className="h-4 w-4 text-blue-600" />
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

      {/* View Contract Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du Contrat</DialogTitle>
            <DialogDescription>
              Contrat N°: {selectedContract?.contract_number}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {selectedContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Numéro de Réservation</p>
                  <p className="font-semibold">{selectedContract.booking_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Statut</p>
                  {getStatusBadge(selectedContract.status)}
                </div>
                <div>
                  <p className="text-sm text-slate-600">Client</p>
                  <p className="font-semibold">{selectedContract.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Véhicule</p>
                  <p className="font-semibold">{selectedContract.vehicle_info}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Date de Début</p>
                  <p className="font-semibold">
                    {new Date(selectedContract.start_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Date de Fin</p>
                  <p className="font-semibold">
                    {new Date(selectedContract.end_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-600">Montant Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedContract.total_amount ? selectedContract.total_amount.toFixed(2) : '0.00'} DT
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleDownloadPDF(selectedContract)}
                  className="w-full"
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? 'Téléchargement...' : 'Télécharger le PDF'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
