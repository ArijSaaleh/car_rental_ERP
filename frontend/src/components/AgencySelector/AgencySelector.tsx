import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Add as AddIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { multiAgencyService } from '../../services/multi-agency.service';
import { AgencyListItem } from '../../types/proprietaire';

interface AgencySelectorProps {
  onAgencyChange?: (agencyId: string | null) => void;
  onCreateNew?: () => void;
}

const AgencySelector: React.FC<AgencySelectorProps> = ({ onAgencyChange, onCreateNew }) => {
  const [agencies, setAgencies] = useState<AgencyListItem[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    try {
      setLoading(true);
      const data = await multiAgencyService.getOwnedAgencies();
      setAgencies(data);
      
      // Get previously selected agency or use first one
      const savedAgencyId = multiAgencyService.getSelectedAgencyId();
      if (savedAgencyId && data.some(a => a.id === savedAgencyId)) {
        setSelectedAgencyId(savedAgencyId);
      } else if (data.length > 0) {
        setSelectedAgencyId(data[0].id);
        multiAgencyService.switchAgency(data[0].id);
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectAgency = (agencyId: string | null) => {
    setSelectedAgencyId(agencyId);
    if (agencyId) {
      multiAgencyService.switchAgency(agencyId);
    } else {
      multiAgencyService.clearSelectedAgency();
    }
    if (onAgencyChange) {
      onAgencyChange(agencyId);
    }
    handleClose();
  };

  const handleCreateNew = () => {
    handleClose();
    if (onCreateNew) {
      onCreateNew();
    }
  };

  const selectedAgency = agencies.find(a => a.id === selectedAgencyId);

  if (loading) {
    return <CircularProgress size={24} />;
  }

  return (
    <Box>
      <Button
        variant="outlined"
        onClick={handleClick}
        endIcon={<ExpandMoreIcon />}
        startIcon={<BusinessIcon />}
        sx={{ minWidth: 250 }}
      >
        {selectedAgency ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Typography variant="body2" sx={{ flexGrow: 1, textAlign: 'left' }}>
              {selectedAgency.name}
            </Typography>
            <Chip 
              label={selectedAgency.subscription_plan} 
              size="small" 
              color="primary"
            />
          </Box>
        ) : (
          'Toutes les agences'
        )}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { minWidth: 300, maxHeight: 400 },
        }}
      >
        <MenuItem onClick={() => handleSelectAgency(null)}>
          <ListItemIcon>
            {selectedAgencyId === null && <CheckIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body1" fontWeight="bold">
              Vue d'ensemble
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Toutes les agences
            </Typography>
          </ListItemText>
        </MenuItem>

        <Divider />

        {agencies.map((agency) => (
          <MenuItem
            key={agency.id}
            onClick={() => handleSelectAgency(agency.id)}
            selected={selectedAgencyId === agency.id}
          >
            <ListItemIcon>
              {selectedAgencyId === agency.id && <CheckIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2">{agency.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {agency.city} • {agency.users_count} utilisateurs
                  </Typography>
                </Box>
                <Chip 
                  label={agency.subscription_plan} 
                  size="small" 
                  variant="outlined"
                />
              </Box>
            </ListItemText>
          </MenuItem>
        ))}

        <Divider />

        <MenuItem onClick={handleCreateNew}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2" color="primary">
              Nouvelle Agence
            </Typography>
          </ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AgencySelector;
