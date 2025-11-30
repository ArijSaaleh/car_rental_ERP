import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  MonetizationOn as MoneyIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Logout as LogoutIcon,
  TrendingUp,
  DirectionsCar,
  EventNote,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { adminService } from '../../services/admin.service';
import { PlatformStats } from '../../types/admin';

// Import child components
import AgenciesManagement from './AgenciesManagement';
import HealthMonitoring from './HealthMonitoring';
import RevenueAnalytics from './RevenueAnalytics';
import AuditLogs from './AuditLogs';
import UsersManagement from './UsersManagement';

const drawerWidth = 260;

const SuperAdminDashboard: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<string>('overview');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPlatformStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading platform stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: <DashboardIcon /> },
    { id: 'agencies', label: 'Gestion Agences', icon: <BusinessIcon /> },
    { id: 'health', label: 'Santé Système', icon: <AssessmentIcon /> },
    { id: 'revenue', label: 'Revenus', icon: <MoneyIcon /> },
    { id: 'users', label: 'Utilisateurs', icon: <PeopleIcon /> },
    { id: 'audit', label: 'Journal d\'Audit', icon: <HistoryIcon /> },
  ];

  const drawer = (
    <Box>
      <Toolbar sx={{ backgroundColor: '#1976d2', color: 'white' }}>
        <Typography variant="h6" noWrap component="div">
          Super Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.id}
            selected={selectedView === item.id}
            onClick={() => setSelectedView(item.id)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.12)',
                borderLeft: '4px solid #1976d2',
              },
            }}
          >
            <ListItemIcon sx={{ color: selectedView === item.id ? '#1976d2' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List>
        <ListItemButton onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Déconnexion" />
        </ListItemButton>
      </List>
    </Box>
  );

  const renderStatsCards = () => {
    if (!stats) return null;

    const statsCards = [
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
        icon: <DirectionsCar sx={{ fontSize: 40, color: '#ed6c02' }} />,
        color: '#fff3e0',
      },
      {
        title: 'Réservations',
        value: stats.total_bookings,
        subtitle: 'Toutes périodes',
        icon: <EventNote sx={{ fontSize: 40, color: '#9c27b0' }} />,
        color: '#f3e5f5',
      },
      {
        title: 'Revenus Totaux',
        value: `${stats.total_revenue.toLocaleString('fr-TN')} TND`,
        subtitle: 'Depuis le début',
        icon: <TrendingUp sx={{ fontSize: 40, color: '#d32f2f' }} />,
        color: '#ffebee',
      },
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
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
    );
  };

  const renderPlanDistribution = () => {
    if (!stats) return null;

    const plans = [
      { name: 'TRIAL', count: stats.agencies_by_plan?.TRIAL || stats.agencies_by_plan?.['trial'] || 0, color: '#9e9e9e' },
      { name: 'BASIC', count: stats.agencies_by_plan?.BASIC || stats.agencies_by_plan?.['basic'] || 0, color: '#4caf50' },
      { name: 'PREMIUM', count: stats.agencies_by_plan?.PREMIUM || stats.agencies_by_plan?.['premium'] || 0, color: '#ff9800' },
      { name: 'ENTERPRISE', count: stats.agencies_by_plan?.ENTERPRISE || stats.agencies_by_plan?.['enterprise'] || 0, color: '#f44336' },
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Distribution par Plan
            </Typography>
            <Grid container spacing={2}>
              {plans.map((plan) => (
                <Grid item xs={6} key={plan.name}>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: plan.color,
                      color: 'white',
                      borderRadius: 1,
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold">
                      {plan.count}
                    </Typography>
                    <Typography variant="body2">{plan.name}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Revenus par Plan
            </Typography>
            <Grid container spacing={2}>
              {plans.map((plan) => (
                <Grid item xs={6} key={plan.name}>
                  <Box sx={{ p: 2, border: `2px solid ${plan.color}`, borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {plan.name}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {((stats.revenue_by_plan as any)?.[plan.name] || 
                        (stats.revenue_by_plan as any)?.[plan.name.toLowerCase()] || 
                        0).toLocaleString('fr-TN')} TND
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      );
    }

    switch (selectedView) {
      case 'overview':
        return (
          <>
            {renderStatsCards()}
            {renderPlanDistribution()}
          </>
        );
      case 'agencies':
        return <AgenciesManagement onUpdate={loadStats} />;
      case 'health':
        return <HealthMonitoring />;
      case 'revenue':
        return <RevenueAnalytics />;
      case 'users':
        return <UsersManagement />;
      case 'audit':
        return <AuditLogs />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Tableau de Bord Super Admin
          </Typography>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>SA</Avatar>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
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

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Container maxWidth="xl">{renderContent()}</Container>
      </Box>
    </Box>
  );
};

export default SuperAdminDashboard;
