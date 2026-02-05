import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useToast } from '../../hooks/use-toast';
import { LocationSelectors } from '../../components/LocationSelectors';
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorHandler';

interface Agency {
  id: string;
  name: string;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  country: string;
  subscriptionPlan: string;
  isActive: boolean;
  proprietaireId?: number;
  proprietaire?: {
    id: number;
    fullName: string;
    email: string;
  };
  createdAt: string;
}

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export default function AgencyManagement() {
  const { toast } = useToast();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [filteredAgencies, setFilteredAgencies] = useState<Agency[]>([]);
  const [proprietaires, setProprietaires] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    governorate: '',
    city: '',
    postalCode: '',
    country: 'Tunisia',
    subscriptionPlan: 'BASIQUE',
    isActive: true,
    proprietaireId: '',
    owner_email: '',
    owner_nom: '',
    owner_prenom: '',
    owner_phone: '',
    owner_password: '',
    create_new_owner: false,
  });

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    const filtered = agencies.filter(
      (agency) =>
        agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAgencies(filtered);
  }, [searchTerm, agencies]);

  const loadAgencies = async () => {
    try {
      const [agenciesRes, usersRes] = await Promise.all([
        api.get('/agencies'),
        api.get('/users'),
      ]);
      setAgencies(agenciesRes.data);
      setFilteredAgencies(agenciesRes.data);
      // Filter only proprietaires
      const owners = usersRes.data.filter((u: User) => u.role === 'PROPRIETAIRE');
      setProprietaires(owners);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (agency?: Agency) => {
    if (agency) {
      setSelectedAgency(agency);
      
      // Map city to governorate
      let governorate = '';
      if (agency.city) {
        // Find which governorate contains this city
        const cityLower = agency.city.toLowerCase();
        if (['tunis', 'carthage', 'la marsa', 'sidi bou said'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Tunis';
        } else if (['sfax', 'sakiet ezzit', 'sakiet eddaier'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Sfax';
        } else if (['sousse', 'hammam sousse', 'port el kantaoui'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Sousse';
        } else if (['nabeul', 'hammamet', 'kelibia'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Nabeul';
        } else if (['monastir', 'skanes', 'ksar hellal'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Monastir';
        } else if (['bizerte', 'menzel bourguiba', 'ras jebel'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Bizerte';
        } else if (['gabes', 'matmata', 'mareth'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Gabès';
        } else if (['kairouan'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Kairouan';
        } else if (['ariana', 'ettadhamen'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Ariana';
        } else if (['ben arous', 'rades', 'hammam lif'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Ben Arous';
        } else if (['mahdia'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Mahdia';
        } else if (['medenine', 'djerba', 'zarzis'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Médenine';
        } else if (['gafsa'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Gafsa';
        } else if (['tozeur', 'nefta'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Tozeur';
        } else if (['kebili', 'douz'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Kébili';
        } else if (['kasserine'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Kasserine';
        } else if (['sidi bouzid'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Sidi Bouzid';
        } else if (['beja'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Béja';
        } else if (['jendouba', 'tabarka'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Jendouba';
        } else if (['kef'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Le Kef';
        } else if (['siliana'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Siliana';
        } else if (['zaghouan'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Zaghouan';
        } else if (['manouba'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Manouba';
        } else if (['tataouine'].some(c => cityLower.includes(c.toLowerCase()))) {
          governorate = 'Tataouine';
        }
      }
      
      setFormData({
        name: agency.name,
        legalName: agency.legalName,
        taxId: agency.taxId,
        email: agency.email,
        phone: agency.phone,
        address: agency.address,
        governorate: governorate,
        city: agency.city,
        postalCode: agency.postalCode || '',
        country: agency.country,
        subscriptionPlan: agency.subscriptionPlan,
        isActive: agency.isActive,
        proprietaireId: agency.proprietaireId?.toString() || '',
        owner_email: '',
        owner_nom: '',
        owner_prenom: '',
        owner_phone: '',
        owner_password: '',
        create_new_owner: false,
      });
    } else {
      setSelectedAgency(null);
      setFormData({
        name: '',
        legalName: '',
        taxId: '',
        email: '',
        phone: '',
        address: '',
        governorate: '',
        city: '',
        postalCode: '',
        country: 'Tunisia',
        subscriptionPlan: 'BASIQUE',
        isActive: true,
        proprietaireId: '',
        owner_email: '',
        owner_nom: '',
        owner_prenom: '',
        owner_phone: '',
        owner_password: '',
        create_new_owner: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (selectedAgency) {
        // Update existing agency - only send fields that can be updated
        const payload: any = {
          name: formData.name,
          legalName: formData.legalName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          taxId: formData.taxId,
          subscriptionPlan: formData.subscriptionPlan,
        };
        
        if (formData.proprietaireId) {
          payload.ownerId = formData.proprietaireId;
        }
        
        await api.patch(`/agencies/${selectedAgency.id}`, payload);
        toast({
          title: "Agence mise à jour",
          description: "L'agence a été mise à jour avec succès.",
          variant: "success",
        });
      } else {
        // Create new agency with onboarding
        if (formData.create_new_owner) {
          // First create the owner user
          const ownerPayload = {
            email: formData.owner_email,
            password: formData.owner_password,
            fullName: `${formData.owner_prenom} ${formData.owner_nom}`,
            phone: formData.owner_phone || formData.phone,
            role: 'PROPRIETAIRE',
          };
          
          const ownerResponse = await api.post('/auth/register', ownerPayload);
          
          // Then create the agency
          const agencyPayload = {
            name: formData.name,
            legalName: formData.legalName || formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode || '',
            country: formData.country,
            taxId: formData.taxId || `TAX${Date.now()}`,
            ownerId: ownerResponse.data.user.id,
            subscriptionPlan: formData.subscriptionPlan || 'BASIQUE',
          };
          
          await api.post('/agencies', agencyPayload);
          toast({
            title: "Agence créée",
            description: "Nouvelle agence et propriétaire créés avec succès.",
            variant: "success",
          });
        } else {
          // Associate with existing owner
          const selectedOwner = proprietaires.find(
            (p) => p.id.toString() === formData.proprietaireId
          );
          
          if (!selectedOwner) {
            setError('Veuillez sélectionner un propriétaire');
            setLoading(false);
            return;
          }

          const payload = {
            name: formData.name,
            legalName: formData.legalName || formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode || '',
            country: formData.country,
            taxId: formData.taxId || `TAX${Date.now()}`,
            ownerId: formData.proprietaireId,
            subscriptionPlan: formData.subscriptionPlan || 'BASIQUE',
          };
          
          await api.post('/agencies', payload);
          toast({
            title: "Agence créée",
            description: "Nouvelle agence associée au propriétaire existant.",
            variant: "success",
          });
        }
      }
      await loadAgencies();
      setDialogOpen(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgency) return;
    setLoading(true);

    try {
      await api.delete(`/agencies/${selectedAgency.id}`);
      toast({
        title: "Agence supprimée",
        description: "L'agence a été supprimée avec succès.",
        variant: "success",
      });
      await loadAgencies();
      setDeleteDialogOpen(false);
      setSelectedAgency(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      basique: 'bg-gray-100 text-gray-800',
      standard: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
    };
    return (
      <Badge className={colors[plan] || 'bg-gray-100 text-gray-800'}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </Badge>
    );
  };

  if (loading && agencies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-slate-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Gestion des Agences
          </h1>
          <p className="text-lg text-gray-600">
            Administrer toutes les agences de la plateforme
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30">
          <Plus className="h-4 w-4" />
          Créer une agence
        </Button>
      </div>

      <Card className="bg-white border-gray-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email ou ville..."
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
                <TableHead>Agence</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Aucune agence trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <div>
                          <div className="font-medium">{agency.name}</div>
                          <div className="text-sm text-slate-500">{agency.legalName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{agency.email}</div>
                        <div className="text-slate-500">{agency.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{agency.city}</div>
                        <div className="text-slate-500">{agency.country}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getPlanBadge(agency.subscriptionPlan)}</TableCell>
                    <TableCell>
                      <Badge variant={agency.isActive ? 'default' : 'destructive'}>
                        {agency.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(agency)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAgency(agency);
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
              {selectedAgency ? "Modifier l'agence" : 'Créer une agence'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de l'agence
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Owner Type Selection - Only for new agencies */}
              {!selectedAgency && (
                <>
                  <div className="col-span-2">
                    <Label>Type de Propriétaire *</Label>
                    <RadioGroup
                      value={formData.create_new_owner ? 'new' : 'existing'}
                      onValueChange={(value: string) =>
                        setFormData((prev) => ({
                          ...prev,
                          create_new_owner: value === 'new',
                        }))
                      }
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="new" id="new-owner" />
                        <label htmlFor="new-owner" className="cursor-pointer">Nouveau propriétaire</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="existing" id="existing-owner" />
                        <label htmlFor="existing-owner" className="cursor-pointer">Propriétaire existant</label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Existing Owner Dropdown */}
                  {!formData.create_new_owner && (
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="proprietaireId">Sélectionner le Propriétaire *</Label>
                      <Select
                        value={formData.proprietaireId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, proprietaireId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un propriétaire existant" />
                        </SelectTrigger>
                        <SelectContent>
                          {proprietaires.map((owner) => (
                            <SelectItem key={owner.id} value={owner.id.toString()}>
                              {owner.fullName} - {owner.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* New Owner Form */}
                  {formData.create_new_owner && (
                    <>
                      <div className="col-span-2 border-b pb-2 mb-2">
                        <h3 className="font-semibold text-gray-700">Informations du Nouveau Propriétaire</h3>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="owner_prenom">Prénom *</Label>
                        <Input
                          id="owner_prenom"
                          value={formData.owner_prenom}
                          onChange={(e) =>
                            setFormData({ ...formData, owner_prenom: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="owner_nom">Nom *</Label>
                        <Input
                          id="owner_nom"
                          value={formData.owner_nom}
                          onChange={(e) =>
                            setFormData({ ...formData, owner_nom: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="owner_email">Email *</Label>
                        <Input
                          id="owner_email"
                          type="email"
                          value={formData.owner_email}
                          onChange={(e) =>
                            setFormData({ ...formData, owner_email: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="owner_phone">Téléphone *</Label>
                        <Input
                          id="owner_phone"
                          type="tel"
                          value={formData.owner_phone}
                          onChange={(e) =>
                            setFormData({ ...formData, owner_phone: e.target.value })
                          }
                          required
                          placeholder="+216 XX XXX XXX"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="owner_password">Mot de Passe *</Label>
                        <Input
                          id="owner_password"
                          type="password"
                          value={formData.owner_password}
                          onChange={(e) =>
                            setFormData({ ...formData, owner_password: e.target.value })
                          }
                          required
                          placeholder="Min 8 caractères"
                        />
                      </div>

                      <div className="col-span-2 border-b pb-2 mb-2 mt-4">
                        <h3 className="font-semibold text-gray-700">Informations de l'Agence</h3>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* For editing existing agency - show current owner */}
              {selectedAgency && (
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="proprietaireId">Propriétaire</Label>
                  {selectedAgency.proprietaire && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-2">
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">Propriétaire actuel : </span>
                        {selectedAgency.proprietaire.fullName} ({selectedAgency.proprietaire.email})
                      </p>
                    </div>
                  )}
                  <Select
                    value={formData.proprietaireId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, proprietaireId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un propriétaire" />
                    </SelectTrigger>
                    <SelectContent>
                      {proprietaires.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id.toString()}>
                          {owner.fullName} - {owner.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nom Commercial</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalName">Raison Sociale</Label>
                <Input
                  id="legalName"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Matricule Fiscal</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2">
                <LocationSelectors
                  governorate={formData.governorate}
                  city={formData.city}
                  onGovernorateChange={(value) => setFormData({ ...formData, governorate: value })}
                  onCityChange={(value) => setFormData({ ...formData, city: value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Code Postal</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="1000"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscriptionPlan">Plan d'Abonnement</Label>
                <Select
                  value={formData.subscriptionPlan}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subscriptionPlan: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASIQUE">Basique</SelectItem>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="isActive">Statut</Label>
                <Select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, isActive: value === 'active' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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
              Êtes-vous sûr de vouloir supprimer cette agence ? Cette action supprimera
              également tous les utilisateurs, véhicules et données associés.
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
