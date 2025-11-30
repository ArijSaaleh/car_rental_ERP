import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { adminService } from '../../services/admin.service';
import { AgencyHealthStatus } from '../../types/admin';

const HealthMonitoring: React.FC = () => {
  const [healthData, setHealthData] = useState<AgencyHealthStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAgenciesHealth();
      setHealthData(data);
    } catch (error) {
      console.error('Error loading health data:', error);
      setError('Erreur lors du chargement des données de santé');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckIcon sx={{ color: '#4caf50' }} />;
    if (score >= 60) return <WarningIcon sx={{ color: '#ff9800' }} />;
    return <ErrorIcon sx={{ color: '#f44336' }} />;
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellente';
    if (score >= 60) return 'Bonne';
    if (score >= 40) return 'Moyenne';
    return 'Faible';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const healthySystems = healthData.filter((h) => h.health_score >= 80).length;
  const warningSystems = healthData.filter((h) => h.health_score >= 60 && h.health_score < 80).length;
  const criticalSystems = healthData.filter((h) => h.health_score < 60).length;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Monitoring Santé des Agences
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#e8f5e9' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="#4caf50">
                    {healthySystems}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Systèmes Sains
                  </Typography>
                </Box>
                <CheckIcon sx={{ fontSize: 48, color: '#4caf50' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#fff3e0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="#ff9800">
                    {warningSystems}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Attention Requise
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 48, color: '#ff9800' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#ffebee' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="#f44336">
                    {criticalSystems}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    État Critique
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 48, color: '#f44336' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Health Details */}
      <Grid container spacing={3}>
        {healthData.map((agency) => (
          <Grid item xs={12} md={6} lg={4} key={agency.agency_id}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {agency.agency_name}
                  </Typography>
                  <Chip
                    label={agency.subscription_plan}
                    size="small"
                    color={
                      agency.subscription_plan === 'ENTERPRISE'
                        ? 'error'
                        : agency.subscription_plan === 'PREMIUM'
                        ? 'warning'
                        : 'success'
                    }
                  />
                  {!agency.is_active && (
                    <Chip label="INACTIF" size="small" color="default" sx={{ ml: 1 }} />
                  )}
                </Box>
                {getHealthIcon(agency.health_score)}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Score de Santé</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: getHealthColor(agency.health_score) }}>
                    {agency.health_score}/100 - {getHealthLabel(agency.health_score)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={agency.health_score}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getHealthColor(agency.health_score),
                    },
                  }}
                />
              </Box>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">
                    Utilisateurs
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {agency.total_users}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">
                    Véhicules
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {agency.total_vehicles}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">
                    Réservations
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {agency.active_bookings}
                  </Typography>
                </Grid>
              </Grid>

              {agency.last_activity && (
                <Typography variant="caption" color="text.secondary">
                  Dernière activité: {new Date(agency.last_activity).toLocaleDateString('fr-FR')}
                </Typography>
              )}

              {agency.issues.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="error" fontWeight="bold">
                    Problèmes détectés:
                  </Typography>
                  {agency.issues.map((issue, idx) => (
                    <Typography key={idx} variant="caption" display="block" color="error">
                      • {issue}
                    </Typography>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HealthMonitoring;
