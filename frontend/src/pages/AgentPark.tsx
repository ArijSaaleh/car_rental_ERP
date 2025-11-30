import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Card, CardContent, TextField, Typography, Grid, IconButton, Alert, AppBar, Toolbar, Avatar, Chip, Stack, Paper, Stepper, Step, StepLabel } from '@mui/material';
import { Camera, Check, Close, DirectionsCar, Assignment, PhotoCamera, Send, Logout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { gradients, animations } from '../theme/theme';

interface VehicleInspection {
  vehicleId: number;
  licensePlate: string;
  inspectionType: 'pickup' | 'return';
  mileage: number;
  fuelLevel: string;
  photos: string[];
  damages: string;
  notes: string;
}

const AgentParkInterface: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [inspection, setInspection] = useState<VehicleInspection>({
    vehicleId: 0,
    licensePlate: '',
    inspectionType: 'pickup',
    mileage: 0,
    fuelLevel: 'full',
    photos: [],
    damages: '',
    notes: ''
  });
  
  const [cameraActive, setCameraActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const navigate = useNavigate();

  const steps = ['Info Véhicule', 'Photos', 'État & Notes', 'Validation'];

  useEffect(() => {
    // Enregistrer le service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => console.log('Service Worker enregistré:', registration))
        .catch((error) => console.log('Erreur Service Worker:', error));
    }
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Caméra arrière sur mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setStream(mediaStream);
      setCameraActive(true);
    } catch (error) {
      console.error('Erreur accès caméra:', error);
      alert('Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const photoData = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setInspection({
          ...inspection,
          photos: [...inspection.photos, photoData]
        });
        
        stopCamera();
      }
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = inspection.photos.filter((_, i) => i !== index);
    setInspection({ ...inspection, photos: newPhotos });
  };

  const handleSubmit = async () => {
    try {
      // TODO: Envoyer les données à l'API
      console.log('Inspection soumise:', inspection);
      
      setSuccessMessage('Inspection enregistrée avec succès !');
      
      // Réinitialiser le formulaire
      setTimeout(() => {
        setInspection({
          vehicleId: 0,
          licensePlate: '',
          inspectionType: 'pickup',
          mileage: 0,
          fuelLevel: 'full',
          photos: [],
          damages: '',
          notes: ''
        });
        setSuccessMessage('');
        setActiveStep(0);
      }, 2000);
      
    } catch (error) {
      console.error('Erreur soumission:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
        🚗 Inspection Véhicule
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            {/* Informations de base */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Plaque d'immatriculation"
                value={inspection.licensePlate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInspection({ ...inspection, licensePlate: e.target.value })}
                placeholder="Ex: 123 TUN 4567"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="Type d'inspection"
                value={inspection.inspectionType}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInspection({ ...inspection, inspectionType: e.target.value as 'pickup' | 'return' })}
                SelectProps={{ native: true }}
              >
                <option value="pickup">Départ</option>
                <option value="return">Retour</option>
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="Niveau carburant"
                value={inspection.fuelLevel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInspection({ ...inspection, fuelLevel: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="full">Plein</option>
                <option value="3/4">3/4</option>
                <option value="half">1/2</option>
                <option value="1/4">1/4</option>
                <option value="empty">Vide</option>
              </TextField>
            </Grid>

            {/* Kilométrage */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Kilométrage"
                value={inspection.mileage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInspection({ ...inspection, mileage: parseInt(e.target.value) || 0 })}
                placeholder="Ex: 45000"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>

            {/* Dommages */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Dommages visibles"
                value={inspection.damages}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInspection({ ...inspection, damages: e.target.value })}
                placeholder="Décrire les rayures, bosses, etc."
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes additionnelles"
                value={inspection.notes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInspection({ ...inspection, notes: e.target.value })}
                placeholder="Autres observations..."
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Section Caméra */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📸 Photos du véhicule ({inspection.photos.length})
          </Typography>

          {!cameraActive && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<Camera />}
              onClick={startCamera}
              sx={{ mb: 2 }}
            >
              Prendre une photo
            </Button>
          )}

          {cameraActive && (
            <Box sx={{ position: 'relative', mb: 2 }}>
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  maxHeight: '400px',
                  borderRadius: '8px',
                  backgroundColor: '#000'
                }}
                playsInline
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<Check />}
                  onClick={capturePhoto}
                >
                  Capturer
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Close />}
                  onClick={stopCamera}
                >
                  Annuler
                </Button>
              </Box>
            </Box>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Aperçu des photos */}
          {inspection.photos.length > 0 && (
            <Grid container spacing={1}>
              {inspection.photos.map((photo, index) => (
                <Grid item xs={6} key={index}>
                  <Box sx={{ position: 'relative' }}>
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        border: '2px solid #ddd'
                      }}
                    />
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(255, 0, 0, 0.7)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 0, 0, 0.9)'
                        }
                      }}
                      onClick={() => removePhoto(index)}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Bouton de soumission */}
      <Button
        fullWidth
        variant="contained"
        size="large"
        color="primary"
        onClick={handleSubmit}
        disabled={!inspection.licensePlate || inspection.mileage === 0}
      >
        Enregistrer l'inspection
      </Button>
    </Box>
  );
};

export default AgentParkInterface;
