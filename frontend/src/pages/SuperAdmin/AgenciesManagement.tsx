import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  PowerSettingsNew as PowerIcon,
  SwapHoriz as SwapIcon,
} from "@mui/icons-material";
import { adminService } from "../../services/admin.service";
import { AgencyDetails, AgencyOnboardingRequest } from "../../types/admin";

interface Props {
  onUpdate: () => void;
}

const AgenciesManagement: React.FC<Props> = ({ onUpdate }) => {
  const [agencies, setAgencies] = useState<AgencyDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<AgencyDetails | null>(
    null
  );
  const [openSubscriptionDialog, setOpenSubscriptionDialog] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({
    new_plan: "",
    reason: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState<AgencyOnboardingRequest>({
    agency_name: "",
    agency_email: "",
    agency_phone: "",
    agency_address: "",
    agency_city: "",
    agency_country: "Tunisie",
    subscription_plan: "TRIAL",
    owner_first_name: "",
    owner_last_name: "",
    owner_email: "",
    owner_phone: "",
  });

  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAgencies();
      setAgencies(data);
    } catch (error) {
      console.error("Error loading agencies:", error);
      setError("Erreur lors du chargement des agences");
    } finally {
      setLoading(false);
    }
  };

  const handleOnboard = async () => {
    try {
      setError("");
      await adminService.onboardAgency(formData);
      setSuccess("Agence créée avec succès!");
      setOpenDialog(false);
      loadAgencies();
      onUpdate();
      resetForm();
    } catch (error: any) {
      setError(
        error.response?.data?.detail || "Erreur lors de la création de l'agence"
      );
    }
  };

  const handleToggleStatus = async (agency: AgencyDetails) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir ${
          agency.is_active ? "désactiver" : "activer"
        } cette agence?`
      )
    ) {
      try {
        await adminService.toggleAgencyStatus(agency.id);
        setSuccess(
          `Agence ${agency.is_active ? "désactivée" : "activée"} avec succès`
        );
        loadAgencies();
        onUpdate();
      } catch (error) {
        setError("Erreur lors du changement de statut");
      }
    }
  };

  const handleChangeSubscription = async () => {
    if (!selectedAgency) return;

    try {
      await adminService.changeSubscription({
        agency_id: selectedAgency.id,
        new_plan: subscriptionForm.new_plan as any,
        reason: subscriptionForm.reason,
      });
      setSuccess("Abonnement modifié avec succès");
      setOpenSubscriptionDialog(false);
      loadAgencies();
      onUpdate();
    } catch (error) {
      setError("Erreur lors du changement d'abonnement");
    }
  };

  const resetForm = () => {
    setFormData({
      agency_name: "",
      agency_email: "",
      agency_phone: "",
      agency_address: "",
      agency_city: "",
      agency_country: "Tunisie",
      subscription_plan: "TRIAL",
      owner_first_name: "",
      owner_last_name: "",
      owner_email: "",
      owner_phone: "",
    });
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Nom",
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {params.row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.city}
          </Typography>
        </Box>
      ),
    },
    { field: "email", headerName: "Email", width: 200 },
    { field: "phone", headerName: "Téléphone", width: 130 },
    {
      field: "subscription_plan",
      headerName: "Plan",
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const colors: any = {
          TRIAL: "default",
          BASIC: "success",
          PREMIUM: "warning",
          ENTERPRISE: "error",
        };
        return (
          <Chip
            label={params.value}
            color={colors[params.value] || "default"}
            size="small"
          />
        );
      },
    },
    {
      field: "is_active",
      headerName: "Statut",
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? "Actif" : "Inactif"}
          color={params.value ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "users_count",
      headerName: "Utilisateurs",
      width: 110,
      align: "center",
    },
    {
      field: "vehicles_count",
      headerName: "Véhicules",
      width: 110,
      align: "center",
    },
    {
      field: "total_revenue",
      headerName: "Revenus",
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="bold" color="primary">
          {params.value.toLocaleString("fr-TN")} TND
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Changer le plan">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedAgency(params.row);
                setSubscriptionForm({
                  new_plan: params.row.subscription_plan,
                  reason: "",
                });
                setOpenSubscriptionDialog(true);
              }}
            >
              <SwapIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.is_active ? "Désactiver" : "Activer"}>
            <IconButton
              size="small"
              color={params.row.is_active ? "error" : "success"}
              onClick={() => handleToggleStatus(params.row)}
            >
              <PowerIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Gestion des Agences
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Nouvelle Agence
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Paper elevation={2}>
        <DataGrid
          rows={agencies}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          autoHeight
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Onboarding Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Créer une Nouvelle Agence</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Informations Agence
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom de l'agence"
                value={formData.agency_name}
                onChange={(e) =>
                  setFormData({ ...formData, agency_name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.agency_email}
                onChange={(e) =>
                  setFormData({ ...formData, agency_email: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Téléphone"
                value={formData.agency_phone}
                onChange={(e) =>
                  setFormData({ ...formData, agency_phone: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ville"
                value={formData.agency_city}
                onChange={(e) =>
                  setFormData({ ...formData, agency_city: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse"
                value={formData.agency_address}
                onChange={(e) =>
                  setFormData({ ...formData, agency_address: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Plan d'abonnement"
                value={formData.subscription_plan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subscription_plan: e.target.value as any,
                  })
                }
              >
                <MenuItem value="TRIAL">TRIAL</MenuItem>
                <MenuItem value="BASIC">BASIC</MenuItem>
                <MenuItem value="PREMIUM">PREMIUM</MenuItem>
                <MenuItem value="ENTERPRISE">ENTERPRISE</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Propriétaire de l'agence
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prénom"
                value={formData.owner_first_name}
                onChange={(e) =>
                  setFormData({ ...formData, owner_first_name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom"
                value={formData.owner_last_name}
                onChange={(e) =>
                  setFormData({ ...formData, owner_last_name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.owner_email}
                onChange={(e) =>
                  setFormData({ ...formData, owner_email: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Téléphone"
                value={formData.owner_phone}
                onChange={(e) =>
                  setFormData({ ...formData, owner_phone: e.target.value })
                }
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleOnboard}>
            Créer l'agence
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subscription Change Dialog */}
      <Dialog
        open={openSubscriptionDialog}
        onClose={() => setOpenSubscriptionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Changer le Plan d'Abonnement</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Nouveau Plan"
                value={subscriptionForm.new_plan}
                onChange={(e) =>
                  setSubscriptionForm({
                    ...subscriptionForm,
                    new_plan: e.target.value,
                  })
                }
              >
                <MenuItem value="TRIAL">TRIAL</MenuItem>
                <MenuItem value="BASIC">BASIC</MenuItem>
                <MenuItem value="PREMIUM">PREMIUM</MenuItem>
                <MenuItem value="ENTERPRISE">ENTERPRISE</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Raison du changement"
                value={subscriptionForm.reason}
                onChange={(e) =>
                  setSubscriptionForm({
                    ...subscriptionForm,
                    reason: e.target.value,
                  })
                }
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSubscriptionDialog(false)}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleChangeSubscription}>
            Changer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgenciesManagement;
