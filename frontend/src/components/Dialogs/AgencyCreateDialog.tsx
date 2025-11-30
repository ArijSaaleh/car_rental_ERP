import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';
import { multiAgencyService } from '../../services/multi-agency.service';
import { AgencyCreate } from '../../types/proprietaire';

interface AgencyCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AgencyCreateDialog: React.FC<AgencyCreateDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AgencyCreate>({
    name: '',
    legal_name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Tunisia',
    subscription_plan: 'basique',
  });

  const handleChange = (field: keyof AgencyCreate) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setLoading(true);

      // Validation
      if (!formData.name || !formData.legal_name || !formData.tax_id || !formData.email || !formData.phone) {
        setError('Veuillez remplir tous les champs obligatoires');
        setLoading(false);
        return;
      }

      await multiAgencyService.createAgency(formData);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la création de l\'agence');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      legal_name: '',
      tax_id: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Tunisia',
      subscription_plan: 'basique',
    });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <BusinessIcon sx={{ mr: 1 }} />
          Créer une Nouvelle Agence
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nom de l'Agence"
              value={formData.name}
              onChange={handleChange('name')}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Raison Sociale"
              value={formData.legal_name}
              onChange={handleChange('legal_name')}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Matricule Fiscal"
              value={formData.tax_id}
              onChange={handleChange('tax_id')}
              required
              helperText="Format: 1234567A"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Téléphone"
              value={formData.phone}
              onChange={handleChange('phone')}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ville"
              value={formData.city}
              onChange={handleChange('city')}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Adresse"
              value={formData.address}
              onChange={handleChange('address')}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Pays"
              value={formData.country}
              onChange={handleChange('country')}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Plan d'Abonnement"
              value={formData.subscription_plan}
              onChange={handleChange('subscription_plan')}
              required
            >
              <MenuItem value="basique">Basique</MenuItem>
              <MenuItem value="standard">Standard</MenuItem>
              <MenuItem value="premium">Premium</MenuItem>
              <MenuItem value="entreprise">Entreprise</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Note:</strong> Après la création de l'agence, vous pourrez assigner des managers pour gérer les opérations quotidiennes.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Création...' : 'Créer l\'Agence'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AgencyCreateDialog;
