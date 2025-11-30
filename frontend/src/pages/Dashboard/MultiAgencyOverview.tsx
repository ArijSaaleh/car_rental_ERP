import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Group as GroupIcon,
  EventNote as EventIcon,
  TrendingUp as TrendingIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { multiAgencyService } from '../../services/multi-agency.service';
import { MultiAgencyStats, AgencySummary } from '../../types/proprietaire';

interface MultiAgencyOverviewProps {
  onCreateAgency?: () => void;
  onManageAgency?: (agencyId: string) => void;
}

const MultiAgencyOverview: React.FC<MultiAgencyOverviewProps> = ({
  onCreateAgency,
  onManageAgency,
}) => {
  const [stats, setStats] = useState<MultiAgencyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await multiAgencyService.getMultiAgencyStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading multi-agency stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanColor = (plan: string) => {
    const planUpper = plan?.toUpperCase();
    switch (planUpper) {
      case 'BASIQUE':
      case 'TRIAL':
        return 'default';
      case 'STANDARD':
      case 'BASIC':
        return 'primary';
      case 'PREMIUM':
        return 'secondary';
      case 'ENTREPRISE':
      case 'ENTERPRISE':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Erreur lors du chargement des statistiques</Typography>
      </Box>
    );
  }

  const summaryCards = [
    {
      title: 'Agences Totales',
      value: stats.total_agencies,
      subtitle: `${stats.active_agencies} actives`,
      icon: <BusinessIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      color: '#e3f2fd',
    },
    {
      title: 'Utilisateurs',
      value: stats.total_users,
      subtitle: 'Sur toutes les agences',
      icon: <PeopleIcon sx={{ fontSize: 40, color: '#2e7d32' }} />,
      color: '#e8f5e9',
    },
    {
      title: 'Véhicules',
      value: stats.total_vehicles,
      subtitle: 'Flotte totale',
      icon: <CarIcon sx={{ fontSize: 40, color: '#ed6c02' }} />,
      color: '#fff3e0',
    },
    {
      title: 'Clients',
      value: stats.total_customers,
      subtitle: 'Base de données',
      icon: <GroupIcon sx={{ fontSize: 40, color: '#9c27b0' }} />,
      color: '#f3e5f5',
    },
    {
      title: 'Réservations',
      value: stats.total_bookings,
      subtitle: 'Toutes périodes',
      icon: <EventIcon sx={{ fontSize: 40, color: '#0288d1' }} />,
      color: '#e1f5fe',
    },
    {
      title: 'Revenu Total',
      value: `${stats.total_revenue.toLocaleString('fr-TN')} TND`,
      subtitle: 'Cumulé',
      icon: <TrendingIcon sx={{ fontSize: 40, color: '#d32f2f' }} />,
      color: '#ffebee',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Vue d'ensemble Multi-Agences</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateAgency}
        >
          Nouvelle Agence
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                backgroundColor: card.color,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {card.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {card.subtitle}
                    </Typography>
                  </Box>
                  <Box>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Agencies Table */}
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" mb={2}>
          Mes Agences
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Agence</TableCell>
                <TableCell>Ville</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell align="center">Utilisateurs</TableCell>
                <TableCell align="center">Véhicules</TableCell>
                <TableCell align="center">Clients</TableCell>
                <TableCell align="center">Réservations</TableCell>
                <TableCell align="right">Revenu</TableCell>
                <TableCell>Managers</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.agencies.map((agency: AgencySummary) => (
                <TableRow key={agency.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {agency.name}
                      </Typography>
                      <Chip
                        label={agency.is_active ? 'Actif' : 'Inactif'}
                        color={agency.is_active ? 'success' : 'default'}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{agency.city}</TableCell>
                  <TableCell>
                    <Chip
                      label={agency.plan}
                      color={getPlanColor(agency.plan)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{agency.users_count}</TableCell>
                  <TableCell align="center">{agency.vehicles_count}</TableCell>
                  <TableCell align="center">{agency.customers_count}</TableCell>
                  <TableCell align="center">{agency.bookings_count}</TableCell>
                  <TableCell align="right">
                    {agency.revenue.toLocaleString('fr-TN')} TND
                  </TableCell>
                  <TableCell>
                    <Box>
                      {agency.managers.slice(0, 2).map((manager) => (
                        <Typography key={manager.id} variant="caption" display="block">
                          {manager.full_name}
                        </Typography>
                      ))}
                      {agency.managers.length > 2 && (
                        <Typography variant="caption" color="text.secondary">
                          +{agency.managers.length - 2} autres
                        </Typography>
                      )}
                      {agency.managers.length === 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Aucun manager
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Gérer cette agence">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onManageAgency && onManageAgency(agency.id)}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default MultiAgencyOverview;
