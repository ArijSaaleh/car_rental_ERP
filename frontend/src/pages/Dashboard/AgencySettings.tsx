import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Alert,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Article as ArticleIcon,
  CardMembership as CardIcon,
  TrendingUp as TrendingIcon,
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Group as GroupIcon,
  EventNote as EventIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { agencyService } from '../../services/agency.service';
import { Agency, AgencyUpdate, SubscriptionInfo, AgencyStatistics } from '../../types/proprietaire';

const AgencySettings: React.FC = () => {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [statistics, setStatistics] = useState<AgencyStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openPlansDialog, setOpenPlansDialog] = useState(false);

  const [editForm, setEditForm] = useState<AgencyUpdate>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    legal_name: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [agencyData, subscriptionData, statsData] = await Promise.all([
        agencyService.getAgency(),
        agencyService.getSubscriptionInfo(),
        agencyService.getStatistics(),
      ]);
      setAgency(agencyData);
      setSubscription(subscriptionData);
      setStatistics(statsData);
      setEditForm({
        name: agencyData.name,
        email: agencyData.email,
        phone: agencyData.phone,
        address: agencyData.address,
        city: agencyData.city,
        legal_name: agencyData.legal_name,
      });
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      const updated = await agencyService.updateAgency(editForm);
      setAgency(updated);
      setSuccess('Informations mises à jour avec succès!');
      setEditing(false);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erreur lors de la mise à jour');
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
      default: return 'default';
    }
  };

  const getDaysRemainingColor = (days: number) => {
    if (days > 30) return 'success';
    if (days > 7) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Paramètres de l'Agence
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Paramètres de l'Agence
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

      <Grid container spacing={3}>
        {/* Agency Information */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" display="flex" alignItems="center">
                <BusinessIcon sx={{ mr: 1 }} />
                Informations de l'Agence
              </Typography>
              {!editing ? (
                <Button variant="outlined" onClick={() => setEditing(true)}>
                  Modifier
                </Button>
              ) : (
                <Box>
                  <Button onClick={() => setEditing(false)} sx={{ mr: 1 }}>
                    Annuler
                  </Button>
                  <Button variant="contained" onClick={handleSave}>
                    Enregistrer
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nom de l'Agence"
                  value={editing ? editForm.name : agency?.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Raison Sociale"
                  value={editing ? editForm.legal_name : agency?.legal_name}
                  onChange={(e) => setEditForm({ ...editForm, legal_name: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <ArticleIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={editing ? editForm.email : agency?.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  value={editing ? editForm.phone : agency?.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Adresse"
                  value={editing ? editForm.address : agency?.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ville"
                  value={editing ? editForm.city : agency?.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Matricule Fiscal"
                  value={agency?.tax_id}
                  disabled
                  helperText="Non modifiable"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Pays"
                  value={agency?.country}
                  disabled
                  helperText="Non modifiable"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Subscription Info */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" display="flex" alignItems="center" mb={2}>
              <CardIcon sx={{ mr: 1 }} />
              Abonnement
            </Typography>

            {subscription && (
              <Box>
                <Box mb={2}>
                  <Chip
                    label={subscription.current_plan}
                    color={getPlanColor(subscription.current_plan)}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {subscription.is_active ? 'Actif' : 'Inactif'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Jours restants
                  </Typography>
                  <Chip
                    label={`${subscription.days_remaining} jours`}
                    color={getDaysRemainingColor(subscription.days_remaining)}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Date de début
                  </Typography>
                  <Typography variant="body1">
                    {new Date(subscription.start_date).toLocaleDateString('fr-FR')}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Date de fin
                  </Typography>
                  <Typography variant="body1">
                    {new Date(subscription.end_date).toLocaleDateString('fr-FR')}
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setOpenPlansDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Comparer les Plans
                </Button>
              </Box>
            )}
          </Paper>

          {/* Statistics Summary */}
          {statistics && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" display="flex" alignItems="center" mb={2}>
                <TrendingIcon sx={{ mr: 1 }} />
                Statistiques
              </Typography>

              <Box mb={2}>
                <Box display="flex" alignItems="center" mb={1}>
                  <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2">Utilisateurs: {statistics.users.total}</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <CarIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="body2">Véhicules: {statistics.vehicles.total}</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <GroupIcon sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="body2">Clients: {statistics.customers.total}</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <EventIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="body2">Réservations: {statistics.bookings.total}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="h6" color="success.main">
                  {statistics.revenue.total.toFixed(2)} {statistics.revenue.currency}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Revenu Total
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Available Features */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Fonctionnalités Disponibles
            </Typography>
            <Grid container spacing={1}>
              {agency?.available_features.map((feature) => (
                <Grid item key={feature}>
                  <Chip
                    icon={<CheckIcon />}
                    label={feature}
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Plan Comparison Dialog */}
      <Dialog open={openPlansDialog} onClose={() => setOpenPlansDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Comparaison des Plans d'Abonnement</DialogTitle>
        <DialogContent>
          {subscription?.plan_comparison ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Caractéristique</TableCell>
                    {Object.keys(subscription.plan_comparison).map((plan) => (
                      <TableCell key={plan} align="center">{plan.toUpperCase()}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Prix Mensuel</TableCell>
                    {Object.values(subscription.plan_comparison).map((plan, idx) => (
                      <TableCell key={idx} align="center">
                        {plan.price_monthly} DT
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Utilisateurs Max</TableCell>
                    {Object.values(subscription.plan_comparison).map((plan, idx) => (
                      <TableCell key={idx} align="center">
                        {plan.max_users || 'Illimité'}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Véhicules Max</TableCell>
                    {Object.values(subscription.plan_comparison).map((plan, idx) => (
                      <TableCell key={idx} align="center">
                        {plan.max_vehicles || 'Illimité'}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Fonctionnalités</TableCell>
                    {Object.values(subscription.plan_comparison).map((plan, idx) => (
                      <TableCell key={idx}>
                        {plan.features?.map((f) => (
                          <Chip key={f} label={f} size="small" sx={{ m: 0.5 }} />
                        ))}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>Les informations de comparaison des plans ne sont pas disponibles.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPlansDialog(false)}>Fermer</Button>
          <Button variant="contained" color="primary">
            Mettre à Niveau
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgencySettings;
