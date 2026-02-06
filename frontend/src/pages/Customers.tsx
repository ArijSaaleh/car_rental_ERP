import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, User, Users, Phone, Mail, MapPin, IdCard, Filter } from 'lucide-react';
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
import { Alert, AlertDescription } from '../components/ui/alert';
import { useToast } from '../hooks/use-toast';
import { customerService } from '../services/customer.service';
import type { Customer } from '../types';
import { extractErrorMessage } from '../utils/errorHandler';

export default function Customers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    cinNumber: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    licenseNumber: '',
    licenseIssueDate: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter(
      (customer) =>
        customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.cinNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        lastName: customer.lastName,
        firstName: customer.firstName,
        cinNumber: customer.cinNumber || '',
        email: customer.email,
        phone: customer.phone,
        address: customer.address || '',
        dateOfBirth: customer.dateOfBirth?.split('T')[0] || '',
        licenseNumber: customer.licenseNumber,
        licenseIssueDate: customer.licenseIssueDate?.split('T')[0] || '',
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        lastName: '',
        firstName: '',
        cinNumber: '',
        email: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        licenseNumber: '',
        licenseIssueDate: '',
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
      // Build payload with only non-empty fields
      const payload: Record<string, any> = {
        lastName: formData.lastName,
        firstName: formData.firstName,
        email: formData.email,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
      };

      // Only add optional fields if they have values
      if (formData.cinNumber && formData.cinNumber.trim()) {
        payload.cinNumber = formData.cinNumber.trim();
      }
      if (formData.address && formData.address.trim()) {
        payload.address = formData.address.trim();
      }
      if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
        payload.dateOfBirth = formData.dateOfBirth;
      }
      if (formData.licenseIssueDate && formData.licenseIssueDate.trim()) {
        payload.licenseIssueDate = formData.licenseIssueDate;
      }

      if (selectedCustomer) {
        await customerService.update(selectedCustomer.id, payload);
        toast({
          title: "Client mis à jour",
          description: "Le client a été modifié avec succès.",
          variant: "success",
        });
      } else {
        await customerService.create(payload);
        toast({
          title: "Client créé",
          description: "Le nouveau client a été ajouté avec succès.",
          variant: "success",
        });
      }
      await loadCustomers();
      setDialogOpen(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    setLoading(true);

    try {
      await customerService.delete(selectedCustomer.id);
      toast({
        title: "Client supprimé",
        description: "Le client a été supprimé avec succès.",
        variant: "success",
      });
      await loadCustomers();
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading && customers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement des clients...</p>
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
            <div className="p-3 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-2xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-900 to-cyan-900 bg-clip-text text-transparent">
                Gestion des Clients
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Gérez votre base de clients
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          size="lg"
          className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 px-8 py-6 text-base font-semibold rounded-xl"
        >
          <Plus className="h-5 w-5" />
          Nouveau Client
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{customers.length}</div>
              <div className="text-sm opacity-90 text-center">Total Clients</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">
                {customers.filter(c => c.licenseNumber).length}
              </div>
              <div className="text-sm opacity-90 text-center">Avec Permis</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">
                {customers.filter(c => c.cinNumber).length}
              </div>
              <div className="text-sm opacity-90 text-center">CIN Vérifié</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-white">
              <div className="text-3xl font-bold mb-1">{filteredCustomers.length}</div>
              <div className="text-sm opacity-90 text-center">Résultats</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-teal-50 border-b-2 border-teal-100 pb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-teal-600" />
            Recherche
          </h3>
          <div className="relative w-full lg:max-w-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, email, CIN ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 border-2 border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 rounded-xl text-base shadow-sm"
            />
          </div>
          {searchTerm && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-600">
                {filteredCustomers.length} résultat{filteredCustomers.length !== 1 ? 's' : ''} trouvé{filteredCustomers.length !== 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
              >
                Réinitialiser
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-slate-100 to-gray-100">
                <TableRow className="border-b-2 border-teal-200">
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Client</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">CIN</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Contact</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Adresse</TableHead>
                  <TableHead className="font-bold text-gray-900 text-sm py-4">Permis</TableHead>
                  <TableHead className="text-right font-bold text-gray-900 text-sm py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full">
                          <Users className="h-20 w-20 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-gray-900 text-xl font-semibold mb-2">Aucun client trouvé</p>
                          <p className="text-gray-500 text-sm mb-4">
                            {customers.length === 0
                              ? "Commencez par ajouter votre premier client"
                              : "Essayez de modifier vos critères de recherche"}
                          </p>
                        </div>
                        {customers.length === 0 && (
                          <Button
                            onClick={() => handleOpenDialog()}
                            size="lg"
                            className="mt-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Ajouter le premier client
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <TableRow
                      key={customer.id}
                      className={`
                        hover:bg-teal-50/80 transition-all duration-200 border-b border-gray-100
                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                      `}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 shadow-sm">
                            <User className="h-5 w-5 text-teal-700" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {customer.cinNumber ? (
                          <Badge className="bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 border border-teal-200">
                            <IdCard className="h-3 w-3 mr-1" />
                            {customer.cinNumber}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Non renseigné</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {customer.phone}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {customer.address ? (
                          <div className="flex items-center gap-1 text-sm text-gray-700 max-w-[180px] truncate">
                            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            {customer.address}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">{customer.licenseNumber || '-'}</div>
                          <div className="text-xs text-gray-500">
                            {customer.licenseIssueDate
                              ? `Délivré: ${new Date(customer.licenseIssueDate).toLocaleDateString('fr-FR')}`
                              : ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(customer)}
                            className="hover:bg-teal-100 hover:text-teal-700 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setDeleteDialogOpen(true);
                            }}
                            className="hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-teal-900 to-cyan-900 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg">
                <User className="h-6 w-6 text-teal-700" />
              </div>
              {selectedCustomer ? 'Modifier le client' : 'Ajouter un client'}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 mt-2">
              Remplissez les informations du client ci-dessous
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {/* Identity Section */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-teal-600 rounded-full"></div>
                  Identité
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Nom *</Label>
                    <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Nom de famille" className="h-11 border-2 border-gray-300 focus:border-teal-500" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">Prénom *</Label>
                    <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="Prénom" className="h-11 border-2 border-gray-300 focus:border-teal-500" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cinNumber" className="text-sm font-semibold text-gray-700">CIN *</Label>
                    <Input id="cinNumber" value={formData.cinNumber} onChange={(e) => setFormData({ ...formData, cinNumber: e.target.value })} placeholder="Numéro CIN" className="h-11 border-2 border-gray-300 focus:border-teal-500" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-sm font-semibold text-gray-700">Date de naissance *</Label>
                    <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="h-11 border-2 border-gray-300 focus:border-teal-500" required />
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                  Contact
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email *</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemple.com" className="h-11 border-2 border-gray-300 focus:border-blue-500" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Téléphone *</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+216 XX XXX XXX" className="h-11 border-2 border-gray-300 focus:border-blue-500" required />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Adresse *</Label>
                    <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Adresse complète" className="h-11 border-2 border-gray-300 focus:border-blue-500" required />
                  </div>
                </div>
              </div>

              {/* Driving License Section */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
                  Permis de conduire
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber" className="text-sm font-semibold text-gray-700">Numéro de permis *</Label>
                    <Input id="licenseNumber" value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} placeholder="Numéro de permis" className="h-11 border-2 border-gray-300 focus:border-purple-500" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseIssueDate" className="text-sm font-semibold text-gray-700">Date de délivrance *</Label>
                    <Input id="licenseIssueDate" type="date" value={formData.licenseIssueDate} onChange={(e) => setFormData({ ...formData, licenseIssueDate: e.target.value })} className="h-11 border-2 border-gray-300 focus:border-purple-500" required />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="px-6">Annuler</Button>
              <Button type="submit" disabled={loading} className="px-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Enregistrement...</>
                ) : (
                  selectedCustomer ? 'Mettre à jour' : 'Ajouter'
                )}
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
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-red-600" />
                <div>
                  <div className="font-bold text-gray-900">{selectedCustomer.firstName} {selectedCustomer.lastName}</div>
                  <div className="text-sm text-gray-600">{selectedCustomer.email}</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="px-6">Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="px-6 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Suppression...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" />Supprimer</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
