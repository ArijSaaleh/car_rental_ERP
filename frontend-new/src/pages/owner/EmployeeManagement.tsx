import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, UserCircle, Mail, Phone, Shield, Filter } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorHandler';

interface Agency {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  agency_id: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export default function EmployeeManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'agent_comptoir',
    password: '',
    is_active: true,
  });

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    if (selectedAgencyId) {
      loadEmployees();
    } else {
      setEmployees([]);
      setFilteredEmployees([]);
    }
  }, [selectedAgencyId]);

  useEffect(() => {
    let filtered = employees.filter(
      (emp) =>
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (roleFilter !== 'all') {
      filtered = filtered.filter((emp) => emp.role === roleFilter);
    }

    setFilteredEmployees(filtered);
  }, [searchTerm, roleFilter, employees]);

  const loadAgencies = async () => {
    try {
      const response = await api.get('/proprietaire/agencies');
      setAgencies(response.data);
      if (response.data.length > 0) {
        setSelectedAgencyId(response.data[0].id);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!selectedAgencyId) return;

    setLoading(true);
    try {
      const response = await api.get(`/proprietaire/agencies/${selectedAgencyId}/employees`);
      setEmployees(response.data);
      setFilteredEmployees(response.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setSelectedEmployee(employee);
      setFormData({
        email: employee.email,
        full_name: employee.full_name,
        phone: employee.phone || '',
        role: employee.role,
        password: '',
        is_active: employee.is_active,
      });
    } else {
      setSelectedEmployee(null);
      setFormData({
        email: '',
        full_name: '',
        phone: '',
        role: 'agent_comptoir',
        password: '',
        is_active: true,
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
      if (selectedEmployee) {
        // Update
        const payload: any = {
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone || null,
          role: formData.role,
          is_active: formData.is_active,
        };
        await api.put(
          `/proprietaire/agencies/${selectedAgencyId}/employees/${selectedEmployee.id}`,
          payload
        );
      } else {
        // Create
        await api.post(`/proprietaire/agencies/${selectedAgencyId}/employees`, {
          ...formData,
          agency_id: selectedAgencyId,
        });
      }
      await loadEmployees();
      setDialogOpen(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      await api.delete(
        `/proprietaire/agencies/${selectedAgencyId}/employees/${selectedEmployee.id}`
      );
      await loadEmployees();
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      manager: 'bg-purple-100 text-purple-700',
      agent_comptoir: 'bg-blue-100 text-blue-700',
      agent_parc: 'bg-green-100 text-green-700',
    };
    const labels: Record<string, string> = {
      manager: 'Manager',
      agent_comptoir: 'Agent Comptoir',
      agent_parc: 'Agent Parc',
    };
    return (
      <Badge className={colors[role] || 'bg-gray-100 text-gray-700'}>
        {labels[role] || role}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-700">Actif</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700">Inactif</Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEmployeeStats = () => {
    return {
      total: employees.length,
      managers: employees.filter((e) => e.role === 'manager').length,
      agents_comptoir: employees.filter((e) => e.role === 'agent_comptoir').length,
      agents_parc: employees.filter((e) => e.role === 'agent_parc').length,
      active: employees.filter((e) => e.is_active).length,
    };
  };

  const stats = getEmployeeStats();

  if (loading && agencies.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Employés</h1>
          <p className="text-slate-600 mt-2">
            Gérez tous les employés de vos agences (Managers, Agents comptoir, Agents parc)
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2" disabled={!selectedAgencyId}>
          <Plus className="h-4 w-4" />
          Nouvel Employé
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.managers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Agents Comptoir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.agents_comptoir}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Agents Parc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.agents_parc}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      {/* Agency Selection & Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner une Agence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une agence" />
              </SelectTrigger>
              <SelectContent>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="manager">Managers</SelectItem>
                <SelectItem value="agent_comptoir">Agents Comptoir</SelectItem>
                <SelectItem value="agent_parc">Agents Parc</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedAgencyId && (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière Connexion</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Aucun employé trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-slate-400" />
                            <div className="font-medium">{employee.full_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            {employee.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {employee.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-slate-400" />
                              {employee.phone}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{getRoleBadge(employee.role)}</TableCell>
                        <TableCell>{getStatusBadge(employee.is_active)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">
                            {formatDate(employee.last_login)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(employee)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedEmployee(employee);
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
      )}

      {/* Add/Edit Employee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee ? 'Modifier l\'employé' : 'Nouvel employé'}
            </DialogTitle>
            <DialogDescription>
              {selectedEmployee
                ? 'Modifiez les informations de l\'employé'
                : 'Créez un nouvel employé pour cette agence'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom Complet *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
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
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+216 XX XXX XXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rôle *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager / Gérant</SelectItem>
                    <SelectItem value="agent_comptoir">Agent Comptoir</SelectItem>
                    <SelectItem value="agent_parc">Agent Parc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!selectedEmployee && (
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de Passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="Minimum 8 caractères"
                  />
                </div>
              )}

              {selectedEmployee && (
                <div className="space-y-2">
                  <Label htmlFor="is_active">Statut</Label>
                  <Select
                    value={formData.is_active.toString()}
                    onValueChange={(value) => setFormData({ ...formData, is_active: value === 'true' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Actif</SelectItem>
                      <SelectItem value="false">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : selectedEmployee ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'employé "{selectedEmployee?.full_name}" ?
              Cette action est irréversible.
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
