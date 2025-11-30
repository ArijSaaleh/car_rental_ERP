import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminService } from '../../services/admin.service';
import { PlatformRevenueReport } from '../../types/admin';
import { format, subDays } from 'date-fns';

const RevenueAnalytics: React.FC = () => {
  const [report, setReport] = useState<PlatformRevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await adminService.getRevenueReport(startDate, endDate);
      setReport(data);
    } catch (error) {
      console.error('Error loading revenue report:', error);
      setError('Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!report) return null;

  const columns: GridColDef[] = [
    { field: 'agency_name', headerName: 'Agence', width: 200 },
    { field: 'subscription_plan', headerName: 'Plan', width: 120 },
    {
      field: 'total_revenue',
      headerName: 'Revenus',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" color="primary">
          {params.value.toLocaleString('fr-TN')} TND
        </Typography>
      ),
    },
    { field: 'payment_count', headerName: 'Paiements', width: 120, align: 'center' },
  ];

  // Prepare data for bar chart
  const topAgencies = [...report.agencies]
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, 10);

  // Prepare data for pie chart (by plan)
  const revenueByPlan = report.agencies.reduce((acc: any, agency) => {
    if (!acc[agency.subscription_plan]) {
      acc[agency.subscription_plan] = 0;
    }
    acc[agency.subscription_plan] += agency.total_revenue;
    return acc;
  }, {});

  const pieData = Object.entries(revenueByPlan).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#9e9e9e', '#4caf50', '#ff9800', '#f44336'];

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Analyse des Revenus
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Date Range Selector */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Date début"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Date fin"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button variant="contained" fullWidth onClick={loadReport}>
              Générer Rapport
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h6" color="white" gutterBottom>
            Revenus Totaux
          </Typography>
          <Typography variant="h3" fontWeight="bold" color="white">
            {report.total_revenue.toLocaleString('fr-TN')} TND
          </Typography>
          <Typography variant="body2" color="white" sx={{ mt: 1 }}>
            Du {new Date(report.period_start).toLocaleDateString('fr-FR')} au{' '}
            {new Date(report.period_end).toLocaleDateString('fr-FR')}
          </Typography>
        </CardContent>
      </Card>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top 10 Agences par Revenus
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topAgencies}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="agency_name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: any) => `${value.toLocaleString('fr-TN')} TND`} />
                <Legend />
                <Bar dataKey="total_revenue" fill="#1976d2" name="Revenus (TND)" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Distribution par Plan
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / report.total_revenue) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value.toLocaleString('fr-TN')} TND`} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed Table */}
      <Paper elevation={2}>
        <DataGrid
          rows={report.agencies}
          columns={columns}
          getRowId={(row) => row.agency_id}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          autoHeight
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
};

export default RevenueAnalytics;
