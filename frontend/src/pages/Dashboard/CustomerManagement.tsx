import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Card,
  CardContent,
  InputAdornment,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { customersService } from '../../services/customers.service';
import { Customer, CustomerCreate, CustomerUpdate, CustomerStats } from '../../types/proprietaire';

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  const [createForm, setCreateForm] = useState<CustomerCreate>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    license_number: '',
    address: '',
    city: '',
    customer_type: 'individual',
    cin_number: '',
    company_name: '',
    company_tax_id: '',
  });

  const [editForm, setEditForm] = useState<CustomerUpdate>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    license_number: '',
    address: '',
    city: '',
    customer_type: 'individual',
    cin_number: '',
    company_name: '',
    company_tax_id: '',
  });

  useEffect(() => {
    loadCustomers();
    loadStats();
  }, [searchQuery, filterType]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterType) params.customer_type = filterType;
      if (searchQuery) params.search = searchQuery;

      const data = await customersService.getCustomers(params);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await customersService.getCustomerStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreate = async () => {
    try {
      setError('');
      await customersService.createCustomer(createForm);
      setSuccess('Client créé avec succès!');
      setOpenDialog(false);
      loadCustomers();
      loadStats();
      resetCreateForm();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erreur lors de la création du client');
    }
  };

  const handleEdit = async () => {
    if (!selectedCustomer) return;
    try {
      setError('');
      await customersService.updateCustomer(selectedCustomer.id, editForm);
      setSuccess('Client mis à jour avec succès!');
      setOpenEditDialog(false);
      loadCustomers();
      setSelectedCustomer(null);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${customer.first_name} ${customer.last_name}?`)) {
      try {
        await customersService.deleteCustomer(customer.id);
        setSuccess('Client supprimé avec succès');
        loadCustomers();
        loadStats();
      } catch (error: any) {
        setError(error.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      license_number: '',
      address: '',
      city: '',
      customer_type: 'individual',
      cin_number: '',
      company_name: '',
      company_tax_id: '',
    });
  };

  const openEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      license_number: customer.license_number,
      address: customer.address || '',
      city: customer.city || '',
      customer_type: customer.customer_type,
      cin_number: customer.cin_number || '',
      company_name: customer.company_name || '',
      company_tax_id: customer.company_tax_id || '',
    });
    setOpenEditDialog(true);
  };

  const getCustomerTypeColor = (type: string) => {
    return type === 'individual' ? 'primary' : 'secondary';
  };

  const getCustomerTypeLabel = (type: string) => {
    return type === 'individual' ? 'Particulier' : 'Entreprise';
  };

  const columns: GridColDef[] = [
    {
      field: 'full_name',
      headerName: 'Nom',
      flex: 1,
      minWidth: 200,
      valueGetter: (params: any) => `${params.row.first_name} ${params.row.last_name}`,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'phone',
      headerName: 'Téléphone',
      width: 140,
    },
    {
      field: 'city',
      headerName: 'Ville',
      width: 130,
    },
    {
      field: 'customer_type',
      headerName: 'Type',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          icon={params.value === 'individual' ? <PersonIcon /> : <BusinessIcon />}
          label={getCustomerTypeLabel(params.value)}
          color={getCustomerTypeColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'cin_number',
      headerName: 'CIN',
      width: 120,
      renderCell: (params: GridRenderCellParams) => params.value || '-',
    },
    {
      field: 'company_name',
      headerName: 'Entreprise',
      width: 150,
      renderCell: (params: GridRenderCellParams) => params.value || '-',
    },
    {
      field: 'created_at',
      headerName: 'Créé le',
      width: 120,
      renderCell: (params: GridRenderCellParams) =>
        new Date(params.value).toLocaleDateString('fr-FR'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const customer = params.row as Customer;
        return (
          <Box>
            <Tooltip title="Modifier">
              <IconButton size="small" onClick={() => openEditCustomer(customer)} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Supprimer">
              <IconButton size="small" onClick={() => handleDelete(customer)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Clients
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Clients
                </Typography>
                <Typography variant="h4">{stats.total_customers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ bgcolor: 'primary.light' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PersonIcon sx={{ mr: 1, fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Particuliers
                    </Typography>
                    <Typography variant="h4">{stats.individuals}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ bgcolor: 'secondary.light' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <BusinessIcon sx={{ mr: 1, fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Entreprises
                    </Typography>
                    <Typography variant="h4">{stats.companies}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters and Actions */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              placeholder="Rechercher (nom, email, CIN)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Filtrer par type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              size="small"
            >
              <MenuItem value="">Tous les types</MenuItem>
              <MenuItem value="individual">Particuliers</MenuItem>
              <MenuItem value="company">Entreprises</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Nouveau Client
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Customers DataGrid */}
      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={customers}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Create Customer Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <PersonAddIcon sx={{ mr: 1 }} />
            Créer un Nouveau Client
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Type de Client"
                value={createForm.customer_type}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    customer_type: e.target.value as 'individual' | 'company',
                  })
                }
                required
              >
                <MenuItem value="individual">Particulier</MenuItem>
                <MenuItem value="company">Entreprise</MenuItem>
              </TextField>
            </Grid>

            {createForm.customer_type === 'individual' ? (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="CIN"
                    value={createForm.cin_number}
                    onChange={(e) => setCreateForm({ ...createForm, cin_number: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Numéro de Permis"
                    value={createForm.license_number}
                    onChange={(e) => setCreateForm({ ...createForm, license_number: e.target.value })}
                    required
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nom de l'Entreprise"
                    value={createForm.company_name}
                    onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Matricule Fiscal"
                    value={createForm.company_tax_id}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, company_tax_id: e.target.value })
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Prénom Contact"
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nom Contact"
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Numéro de Permis"
                    value={createForm.license_number}
                    onChange={(e) => setCreateForm({ ...createForm, license_number: e.target.value })}
                    required
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Téléphone"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse"
                value={createForm.address}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ville"
                value={createForm.city}
                onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button onClick={handleCreate} variant="contained" color="primary">
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Modifier le Client</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Type de Client"
                value={editForm.customer_type}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    customer_type: e.target.value as 'individual' | 'company',
                  })
                }
              >
                <MenuItem value="individual">Particulier</MenuItem>
                <MenuItem value="company">Entreprise</MenuItem>
              </TextField>
            </Grid>

            {editForm.customer_type === 'individual' ? (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="CIN"
                    value={editForm.cin_number}
                    onChange={(e) => setEditForm({ ...editForm, cin_number: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Numéro de Permis"
                    value={editForm.license_number}
                    onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })}
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nom de l'Entreprise"
                    value={editForm.company_name}
                    onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Matricule Fiscal"
                    value={editForm.company_tax_id}
                    onChange={(e) => setEditForm({ ...editForm, company_tax_id: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Prénom Contact"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nom Contact"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Numéro de Permis"
                    value={editForm.license_number}
                    onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Téléphone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ville"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Annuler</Button>
          <Button onClick={handleEdit} variant="contained" color="primary">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerManagement;
