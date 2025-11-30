import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Chip,
  LinearProgress,
  Button,
  Paper,
  Badge,
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DirectionsCar,
  EventNote,
  People,
  Assessment,
  Settings,
  Logout,
  Build,
  ReportProblem,
  TrendingUp,
  CalendarToday,
  AttachMoney,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { gradients, animations } from '../theme/theme';

const drawerWidth = 260;

interface QuickStat {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: string;
}

const ManagerDashboard: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const navigate = useNavigate();

  const quickStats: QuickStat[] = [
    {
      title: 'Véhicules Disponibles',
      value: 12,
      subtitle: 'Sur 25 total',
      icon: <DirectionsCar sx={{ fontSize: 32 }} />,
      gradient: gradients.ocean,
      trend: '+8%',
    },
    {
      title: 'Réservations Aujourd\'hui',
      value: 8,
      subtitle: '3 en attente',
      icon: <EventNote sx={{ fontSize: 32 }} />,
      gradient: gradients.success,
      trend: '+15%',
    },
    {
      title: 'Maintenance',
      value: 3,
      subtitle: '2 urgent',
      icon: <Build sx={{ fontSize: 32 }} />,
      gradient: gradients.warning,
    },
    {
      title: 'Revenus du Jour',
      value: '1,850 TND',
      subtitle: 'Objectif: 2,000 TND',
      icon: <AttachMoney sx={{ fontSize: 32 }} />,
      gradient: gradients.success,
      trend: '+12%',
    },
  ];

  const recentActivities = [
    { type: 'success', message: 'Nouvelle réservation - Client: Ahmed Ben Ali', time: 'Il y a 5 min' },
    { type: 'warning', message: 'Maintenance programmée - Peugeot 208 (123 TUN 4567)', time: 'Il y a 15 min' },
    { type: 'info', message: 'Retour véhicule - Renault Clio (456 TUN 7890)', time: 'Il y a 1h' },
    { type: 'error', message: 'Incident signalé - Dacia Logan (789 TUN 1234)', time: 'Il y a 2h' },
  ];

  const upcomingBookings = [
    { customer: 'Mohamed Trabelsi', vehicle: 'Peugeot 208', time: '10:00', status: 'confirmed' },
    { customer: 'Fatma Mansouri', vehicle: 'Renault Clio', time: '11:30', status: 'pending' },
    { customer: 'Karim Bouazizi', vehicle: 'Dacia Sandero', time: '14:00', status: 'confirmed' },
    { customer: 'Salma Cherif', vehicle: 'Fiat 500', time: '16:00', status: 'pending' },
  ];

  const menuItems = [
    { text: 'Vue d\'ensemble', icon: <DashboardIcon />, view: 'overview' },
    { text: 'Flotte', icon: <DirectionsCar />, view: 'fleet' },
    { text: 'Réservations', icon: <EventNote />, view: 'bookings' },
    { text: 'Clients', icon: <People />, view: 'customers' },
    { text: 'Rapports', icon: <Assessment />, view: 'reports' },
    { text: 'Paramètres', icon: <Settings />, view: 'settings' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle sx={{ color: '#10b981' }} />;
      case 'warning': return <Warning sx={{ color: '#f59e0b' }} />;
      case 'error': return <ErrorIcon sx={{ color: '#ef4444' }} />;
      default: return <CheckCircle sx={{ color: '#06b6d4' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ background: gradients.ocean, color: 'white', display: 'flex', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>M</Avatar>
        <Box>
          <Typography variant="subtitle2" fontWeight={600}>Manager</Typography>
          <Typography variant="caption">Agence Tunis</Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.view}
            selected={activeView === item.view}
            onClick={() => setActiveView(item.view)}
            sx={{
              mx: 1,
              mb: 0.5,
              borderRadius: 2,
              '&.Mui-selected': {
                background: gradients.ocean,
                color: 'white',
                '& .MuiListItemIcon-root': { color: 'white' },
                '&:hover': {
                  background: gradients.ocean,
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: activeView === item.view ? 'white' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ mt: 2 }} />
      <List>
        <ListItemButton onClick={handleLogout} sx={{ mx: 1, borderRadius: 2 }}>
          <ListItemIcon><Logout /></ListItemIcon>
          <ListItemText primary="Déconnexion" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Tableau de Bord Manager
          </Typography>
          <Stack direction="row" spacing={2}>
            <IconButton>
              <Badge badgeContent={4} color="error">
                <EventNote />
              </Badge>
            </IconButton>
            <Avatar sx={{ bgcolor: 'primary.main' }}>M</Avatar>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4, ...animations.slideUp }}>
          {quickStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  background: stat.gradient,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ opacity: 0.9 }}>{stat.icon}</Box>
                    {stat.trend && (
                      <Chip
                        label={stat.trend}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {stat.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Upcoming Bookings */}
          <Grid item xs={12} md={8}>
            <Card sx={{ ...animations.fadeIn }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Prochaines Réservations
                  </Typography>
                  <Button size="small" startIcon={<CalendarToday />}>
                    Voir tout
                  </Button>
                </Box>
                <Stack spacing={2}>
                  {upcomingBookings.map((booking, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          {booking.customer.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {booking.customer}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {booking.vehicle}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip label={booking.time} size="small" />
                        <Chip
                          label={booking.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                          size="small"
                          color={getStatusColor(booking.status) as any}
                        />
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={4}>
            <Card sx={{ ...animations.fadeIn }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Activité Récente
                </Typography>
                <Stack spacing={2} sx={{ mt: 3 }}>
                  {recentActivities.map((activity, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 2 }}>
                      {getActivityIcon(activity.type)}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {activity.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.time}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Fleet Status */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  État de la Flotte
                </Typography>
                <Stack spacing={2} sx={{ mt: 3 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Disponible</Typography>
                      <Typography variant="body2" fontWeight={600}>48%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={48}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': { bgcolor: '#10b981' },
                      }}
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Loué</Typography>
                      <Typography variant="body2" fontWeight={600}>40%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={40}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': { bgcolor: '#2563eb' },
                      }}
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Maintenance</Typography>
                      <Typography variant="body2" fontWeight={600}>12%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={12}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': { bgcolor: '#f59e0b' },
                      }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Performance du Mois
                </Typography>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#eff6ff' }}>
                      <TrendingUp sx={{ color: '#2563eb', fontSize: 32 }} />
                      <Typography variant="h5" fontWeight={700} color="primary">
                        92%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Taux d'occupation
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ecfdf5' }}>
                      <AttachMoney sx={{ color: '#10b981', fontSize: 32 }} />
                      <Typography variant="h5" fontWeight={700} sx={{ color: '#10b981' }}>
                        45.2K
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Revenus (TND)
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ManagerDashboard;
