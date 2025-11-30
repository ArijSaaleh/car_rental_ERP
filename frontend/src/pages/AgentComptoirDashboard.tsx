import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Tab,
  Tabs,
  TextField,
  MenuItem,
  Stack,
  Chip,
  Avatar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
} from '@mui/material';
import {
  Add,
  Search,
  DirectionsCar,
  Person,
  Payment,
  Description,
  CheckCircle,
  Logout,
  QrCode,
  CalendarToday,
  AttachMoney,
  Print,
  Send,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { gradients, animations } from '../theme/theme';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AgentComptoirDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openBooking, setOpenBooking] = useState(false);
  const [openContract, setOpenContract] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const navigate = useNavigate();

  const todayBookings = [
    { id: 1, customer: 'Ahmed Ben Ali', vehicle: 'Peugeot 208', time: '10:00', status: 'confirmed', amount: '150 TND' },
    { id: 2, customer: 'Fatma Mansouri', vehicle: 'Renault Clio', time: '11:30', status: 'pending', amount: '180 TND' },
    { id: 3, customer: 'Karim Bouazizi', vehicle: 'Dacia Sandero', time: '14:00', status: 'confirmed', amount: '120 TND' },
  ];

  const activeContracts = [
    { id: 1, customer: 'Mohamed Trabelsi', vehicle: 'Fiat 500', start: '2024-01-15', end: '2024-01-18', status: 'active' },
    { id: 2, customer: 'Salma Cherif', vehicle: 'Peugeot 208', start: '2024-01-14', end: '2024-01-17', status: 'active' },
  ];

  const pendingPayments = [
    { id: 1, customer: 'Nabil Hamdi', amount: '450 TND', type: 'Solde location', due: 'Aujourd\'hui' },
    { id: 2, customer: 'Leila Bouzid', amount: '200 TND', type: 'Caution', due: 'Demain' },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': case 'active': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <AppBar position="static" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Comptoir - Agent
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              label="Agence Tunis"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <IconButton onClick={handleLogout}>
              <Logout />
            </IconButton>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>A</Avatar>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {/* Quick Actions */}
        <Grid container spacing={2} sx={{ mb: 4, ...animations.slideUp }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => setOpenBooking(true)}
              sx={{
                background: gradients.ocean,
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.05)' },
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Add sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Nouvelle Réservation
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => setOpenContract(true)}
              sx={{
                background: gradients.success,
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.05)' },
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Description sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Créer Contrat
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => setOpenPayment(true)}
              sx={{
                background: gradients.warning,
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.05)' },
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <AttachMoney sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Encaisser
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: gradients.info,
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.05)' },
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Check-in/out
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Tabs */}
        <Card sx={{ ...animations.fadeIn }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              px: 2,
            }}
          >
            <Tab label="Réservations du Jour" icon={<CalendarToday />} iconPosition="start" />
            <Tab label="Contrats Actifs" icon={<Description />} iconPosition="start" />
            <Tab label="Paiements" icon={<Payment />} iconPosition="start" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Stack spacing={2}>
              {todayBookings.map((booking) => (
                <Paper
                  key={booking.id}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          {booking.customer.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {booking.customer}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {booking.time}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DirectionsCar color="action" />
                        <Typography variant="body2">{booking.vehicle}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Chip
                        label={booking.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                        color={getStatusColor(booking.status) as any}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {booking.amount}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        startIcon={<Description />}
                      >
                        Contrat
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Stack spacing={2}>
              {activeContracts.map((contract) => (
                <Paper
                  key={contract.id}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'success.light' }}>
                          {contract.customer.charAt(0)}
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {contract.customer}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2">{contract.vehicle}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        {contract.start} → {contract.end}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Stack direction="row" spacing={1}>
                        <Button variant="outlined" size="small" startIcon={<Print />}>
                          Imprimer
                        </Button>
                        <Button variant="contained" size="small" color="success" startIcon={<CheckCircle />}>
                          Retour
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Stack spacing={2}>
              {pendingPayments.map((payment) => (
                <Paper
                  key={payment.id}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'warning.light' }}>
                          {payment.customer.charAt(0)}
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {payment.customer}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2">{payment.type}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="h6" fontWeight={700} color="primary">
                        {payment.amount}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Chip label={payment.due} color="warning" size="small" />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        startIcon={<AttachMoney />}
                      >
                        Encaisser
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          </TabPanel>
        </Card>
      </Box>

      {/* New Booking Dialog */}
      <Dialog open={openBooking} onClose={() => setOpenBooking(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nouvelle Réservation</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Client" select>
                <MenuItem>Ahmed Ben Ali</MenuItem>
                <MenuItem>Fatma Mansouri</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Véhicule" select>
                <MenuItem>Peugeot 208</MenuItem>
                <MenuItem>Renault Clio</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Date de début" type="date" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Date de fin" type="date" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={3} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBooking(false)}>Annuler</Button>
          <Button variant="contained" startIcon={<CheckCircle />}>
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgentComptoirDashboard;
