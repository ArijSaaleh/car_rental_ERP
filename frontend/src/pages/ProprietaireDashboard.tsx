import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  EventNote as EventIcon,
  Description as DescriptionIcon,
  Payment as PaymentIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { authService } from '../services/auth.service';
import UserManagement from './Dashboard/UserManagement';
import AgencySettings from './Dashboard/AgencySettings';
import CustomerManagement from './Dashboard/CustomerManagement';
import MultiAgencyOverview from './Dashboard/MultiAgencyOverview';
import AgencySelector from '../components/AgencySelector/AgencySelector';
import AgencyCreateDialog from '../components/Dialogs/AgencyCreateDialog';

const drawerWidth = 260;

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  view: string;
}

const menuItems: MenuItem[] = [
  { text: 'Vue d\'ensemble', icon: <DashboardIcon />, view: 'dashboard' },
  { text: 'Mes Agences', icon: <BusinessIcon />, view: 'agencies' },
  { text: 'Véhicules', icon: <CarIcon />, view: 'vehicles' },
  { text: 'Utilisateurs', icon: <PeopleIcon />, view: 'users' },
  { text: 'Clients', icon: <GroupIcon />, view: 'customers' },
  { text: 'Réservations', icon: <EventIcon />, view: 'bookings' },
  { text: 'Contrats', icon: <DescriptionIcon />, view: 'contracts' },
  { text: 'Paiements', icon: <PaymentIcon />, view: 'payments' },
  { text: 'Rapports', icon: <AssessmentIcon />, view: 'reports' },
  { text: 'Paramètres', icon: <SettingsIcon />, view: 'settings' },
];

const ProprietaireDashboard: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (view: string) => {
    setActiveView(view);
    if (mobileOpen) {
      setMobileOpen(false);
    }
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

  const handleAgencyChange = (agencyId: string | null) => {
    setSelectedAgencyId(agencyId);
    // Refresh current view to show data for selected agency
    if (activeView !== 'dashboard' && activeView !== 'agencies') {
      setActiveView(activeView); // Trigger re-render
    }
  };

  const handleManageAgency = (agencyId: string) => {
    setSelectedAgencyId(agencyId);
    setActiveView('settings');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <MultiAgencyOverview
            onCreateAgency={() => setOpenCreateDialog(true)}
            onManageAgency={handleManageAgency}
          />
        );
      case 'agencies':
        return (
          <MultiAgencyOverview
            onCreateAgency={() => setOpenCreateDialog(true)}
            onManageAgency={handleManageAgency}
          />
        );
      case 'users':
        return <UserManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'settings':
        return <AgencySettings />;
      default:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              {menuItems.find(item => item.view === activeView)?.text || 'En développement'}
            </Typography>
            <Typography variant="body1">
              Cette fonctionnalité sera disponible prochainement.
            </Typography>
          </Box>
        );
    }
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" noWrap component="div">
          Car Rental ERP
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.view} disablePadding>
            <ListItemButton
              selected={activeView === item.view}
              onClick={() => handleMenuClick(item.view)}
            >
              <ListItemIcon
                sx={{
                  color: activeView === item.view ? 'primary.main' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Déconnexion" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
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
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find((item) => item.view === activeView)?.text || 'Dashboard'}
          </Typography>
          {/* Agency Selector */}
          <AgencySelector
            onAgencyChange={handleAgencyChange}
            onCreateNew={() => setOpenCreateDialog(true)}
          />
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="menu"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        {renderContent()}
      </Box>
      
      {/* Agency Create Dialog */}
      <AgencyCreateDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onSuccess={() => {
          setOpenCreateDialog(false);
          setActiveView('agencies');
        }}
      />
    </Box>
  );
};

export default ProprietaireDashboard;
