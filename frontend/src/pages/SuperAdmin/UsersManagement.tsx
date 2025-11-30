import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { adminService } from '../../services/admin.service';

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers({ limit: 100 });
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'full_name',
      headerName: 'Nom Complet',
      width: 200,
      valueGetter: (params) => {
        if (params.row.first_name && params.row.last_name) {
          return `${params.row.first_name} ${params.row.last_name}`;
        }
        return params.row.full_name || 'N/A';
      },
    },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'phone', headerName: 'Téléphone', width: 130 },
    {
      field: 'role',
      headerName: 'Rôle',
      width: 150,
      renderCell: (params) => {
        const colors: any = {
          SUPER_ADMIN: 'error',
          PROPRIETAIRE: 'warning',
          MANAGER: 'info',
          EMPLOYEE: 'default',
        };
        return <Chip label={params.value} color={colors[params.value] || 'default'} size="small" />;
      },
    },
    {
      field: 'is_active',
      headerName: 'Statut',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value ? 'Actif' : 'Inactif'} color={params.value ? 'success' : 'default'} size="small" />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Date création',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleDateString('fr-FR'),
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Gestion des Utilisateurs
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={2}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          pageSizeOptions={[25, 50, 100]}
          autoHeight
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
};

export default UsersManagement;
