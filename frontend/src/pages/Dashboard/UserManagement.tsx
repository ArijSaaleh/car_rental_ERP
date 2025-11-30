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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VpnKey as KeyIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import { usersService } from '../../services/users.service';
import { User, UserCreate, UserUpdate, UserChangeRole, UserResetPassword, UserStats } from '../../types/proprietaire';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

  const [createForm, setCreateForm] = useState<UserCreate>({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'employee',
  });

  const [editForm, setEditForm] = useState<UserUpdate>({
    email: '',
    full_name: '',
    phone: '',
    is_active: true,
  });

  const [roleForm, setRoleForm] = useState<UserChangeRole>({
    new_role: 'employee',
  });

  const [passwordForm, setPasswordForm] = useState<UserResetPassword>({
    new_password: '',
  });

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [filterRole, filterActive]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterRole) params.role = filterRole;
      if (filterActive !== undefined) params.is_active = filterActive;
      
      const data = await usersService.getUsers(params);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await usersService.getUserStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreate = async () => {
    try {
      setError('');
      await usersService.createUser(createForm);
      setSuccess('Utilisateur créé avec succès!');
      setOpenDialog(false);
      loadUsers();
      loadStats();
      resetCreateForm();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    try {
      setError('');
      await usersService.updateUser(selectedUser.id, editForm);
      setSuccess('Utilisateur mis à jour avec succès!');
      setOpenEditDialog(false);
      loadUsers();
      setSelectedUser(null);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (user: User) => {
    if (window.confirm(`Êtes-vous sûr de vouloir désactiver ${user.full_name}?`)) {
      try {
        await usersService.deleteUser(user.id);
        setSuccess('Utilisateur désactivé avec succès');
        loadUsers();
        loadStats();
      } catch (error: any) {
        setError(error.response?.data?.detail || 'Erreur lors de la désactivation');
      }
    }
  };

  const handleActivate = async (user: User) => {
    try {
      await usersService.activateUser(user.id);
      setSuccess('Utilisateur réactivé avec succès');
      loadUsers();
      loadStats();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erreur lors de la réactivation');
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;
    try {
      setError('');
      await usersService.changeUserRole(selectedUser.id, roleForm);
      setSuccess('Rôle modifié avec succès!');
      setOpenRoleDialog(false);
      loadUsers();
      loadStats();
      setSelectedUser(null);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erreur lors du changement de rôle');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      setError('');
      await usersService.resetUserPassword(selectedUser.id, passwordForm);
      setSuccess('Mot de passe réinitialisé avec succès!');
      setOpenPasswordDialog(false);
      setSelectedUser(null);
      setPasswordForm({ new_password: '' });
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erreur lors de la réinitialisation');
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      role: 'employee',
    });
  };

  const openEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      full_name: user.full_name,
      phone: user.phone || '',
      is_active: user.is_active,
    });
    setOpenEditDialog(true);
  };

  const openChangeRole = (user: User) => {
    setSelectedUser(user);
    setRoleForm({ new_role: user.role === 'manager' ? 'employee' : 'manager' });
    setOpenRoleDialog(true);
  };

  const openResetPassword = (user: User) => {
    setSelectedUser(user);
    setPasswordForm({ new_password: '' });
    setOpenPasswordDialog(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'proprietaire': return 'error';
      case 'manager': return 'warning';
      case 'employee': return 'info';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'proprietaire': return 'Propriétaire';
      case 'manager': return 'Manager';
      case 'employee': return 'Employé';
      default: return role;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'full_name',
      headerName: 'Nom Complet',
      flex: 1,
      minWidth: 200,
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
      renderCell: (params: GridRenderCellParams) => params.value || '-',
    },
    {
      field: 'role',
      headerName: 'Rôle',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={getRoleLabel(params.value)}
          color={getRoleBadgeColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'is_active',
      headerName: 'Statut',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          icon={params.value ? <CheckIcon /> : <CancelIcon />}
          label={params.value ? 'Actif' : 'Inactif'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
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
      width: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const user = params.row as User;
        return (
          <Box>
            <Tooltip title="Modifier">
              <IconButton size="small" onClick={() => openEditUser(user)} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Changer le rôle">
              <IconButton size="small" onClick={() => openChangeRole(user)} color="warning">
                <SwapIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Réinitialiser mot de passe">
              <IconButton size="small" onClick={() => openResetPassword(user)} color="info">
                <KeyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {user.is_active ? (
              <Tooltip title="Désactiver">
                <IconButton size="small" onClick={() => handleDelete(user)} color="error">
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Réactiver">
                <IconButton size="small" onClick={() => handleActivate(user)} color="success">
                  <CheckIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Utilisateurs
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
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Utilisateurs
                </Typography>
                <Typography variant="h4">{stats.total_users}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'success.light' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Actifs
                </Typography>
                <Typography variant="h4">{stats.active_users}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'warning.light' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Managers
                </Typography>
                <Typography variant="h4">{stats.users_by_role?.manager || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'info.light' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Employés
                </Typography>
                <Typography variant="h4">{stats.users_by_role?.employee || 0}</Typography>
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
              select
              fullWidth
              label="Filtrer par rôle"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              size="small"
            >
              <MenuItem value="">Tous les rôles</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="employee">Employé</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Filtrer par statut"
              value={filterActive === undefined ? '' : filterActive.toString()}
              onChange={(e) => setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')}
              size="small"
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="true">Actifs</MenuItem>
              <MenuItem value="false">Inactifs</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Nouvel Utilisateur
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Users DataGrid */}
      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Create User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <PersonAddIcon sx={{ mr: 1 }} />
            Créer un Nouvel Utilisateur
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom Complet"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Téléphone"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mot de passe"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
                helperText="Minimum 8 caractères"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Rôle"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as 'manager' | 'employee' })}
                required
              >
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="employee">Employé</MenuItem>
              </TextField>
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

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier l'Utilisateur</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom Complet"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Téléphone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  />
                }
                label="Utilisateur actif"
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

      {/* Change Role Dialog */}
      <Dialog open={openRoleDialog} onClose={() => setOpenRoleDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Changer le Rôle</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Nouveau Rôle"
            value={roleForm.new_role}
            onChange={(e) => setRoleForm({ new_role: e.target.value as 'manager' | 'employee' })}
            sx={{ mt: 2 }}
          >
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="employee">Employé</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRoleDialog(false)}>Annuler</Button>
          <Button onClick={handleChangeRole} variant="contained" color="warning">
            Changer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Réinitialiser le Mot de Passe</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nouveau Mot de Passe"
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm({ new_password: e.target.value })}
            sx={{ mt: 2 }}
            helperText="Minimum 8 caractères"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Annuler</Button>
          <Button onClick={handleResetPassword} variant="contained" color="info">
            Réinitialiser
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
