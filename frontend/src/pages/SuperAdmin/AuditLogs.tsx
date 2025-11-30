import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Button,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { ExpandMore as ExpandMoreIcon, Search as SearchIcon } from '@mui/icons-material';
import { adminService } from '../../services/admin.service';
import { AuditLogEntry, AuditLogFilter } from '../../types/admin';
import { format } from 'date-fns';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<AuditLogFilter>({
    limit: 50,
    offset: 0,
  });

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getAuditLogs(filter);
      setLogs(data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setError('Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'created_at',
      headerName: 'Date & Heure',
      width: 180,
      renderCell: (params) => format(new Date(params.value), 'dd/MM/yyyy HH:mm:ss'),
    },
    { field: 'admin_email', headerName: 'Admin', width: 200 },
    {
      field: 'action',
      headerName: 'Action',
      width: 200,
      renderCell: (params) => <Chip label={params.value} size="small" color="primary" />,
    },
    {
      field: 'resource_type',
      headerName: 'Type Ressource',
      width: 150,
      renderCell: (params) => <Chip label={params.value} size="small" variant="outlined" />,
    },
    { field: 'resource_id', headerName: 'ID Ressource', width: 150 },
    { field: 'ip_address', headerName: 'Adresse IP', width: 130 },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Journal d'Audit
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight="bold">Filtres de recherche</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Email Admin"
                value={filter.admin_email || ''}
                onChange={(e) => setFilter({ ...filter, admin_email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Action"
                value={filter.action || ''}
                onChange={(e) => setFilter({ ...filter, action: e.target.value })}
                placeholder="Ex: agency_created"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Type Ressource"
                value={filter.resource_type || ''}
                onChange={(e) => setFilter({ ...filter, resource_type: e.target.value })}
                placeholder="Ex: agency, user"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="ID Ressource"
                value={filter.resource_id || ''}
                onChange={(e) => setFilter({ ...filter, resource_id: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Date début"
                value={filter.start_date || ''}
                onChange={(e) => setFilter({ ...filter, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Date fin"
                value={filter.end_date || ''}
                onChange={(e) => setFilter({ ...filter, end_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Limite"
                value={filter.limit || 50}
                onChange={(e) => setFilter({ ...filter, limit: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                sx={{ height: '56px' }}
              >
                Rechercher
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Results */}
      <Paper elevation={2}>
        <DataGrid
          rows={logs}
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
      
      {/* Detail Panel Below Table */}
      {logs.length > 0 && (
        <Paper elevation={2} sx={{ mt: 2, p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            💡 Astuce: Cliquez sur une ligne pour voir les détails dans le futur (fonctionnalité premium MUI DataGrid)
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AuditLogs;
