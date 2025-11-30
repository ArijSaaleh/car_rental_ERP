import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../services/vehicle.service';
import { authService } from '../services/auth.service';
import { Vehicle, VehicleStats } from '../types';
import VehicleList from '../components/VehicleList';
import VehicleForm from '../components/VehicleForm';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehiclesResponse, statsResponse] = await Promise.all([
        vehicleService.getVehicles(),
        vehicleService.getVehicleStats(),
      ]);
      setVehicles(vehiclesResponse.vehicles);
      setStats(statsResponse);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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

  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setShowForm(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedVehicle(null);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    loadData();
  };

  const handleDeleteVehicle = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      try {
        await vehicleService.deleteVehicle(id);
        loadData();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('Erreur lors de la suppression du véhicule');
      }
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Gestion de Flotte</h1>
        <button onClick={handleLogout} className="logout-btn">
          Déconnexion
        </button>
      </header>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
          <div className="stat-card success">
            <h3>Disponibles</h3>
            <p className="stat-value">{stats.available}</p>
          </div>
          <div className="stat-card warning">
            <h3>Loués</h3>
            <p className="stat-value">{stats.rented}</p>
          </div>
          <div className="stat-card info">
            <h3>En maintenance</h3>
            <p className="stat-value">{stats.maintenance}</p>
          </div>
          <div className="stat-card">
            <h3>Taux d'utilisation</h3>
            <p className="stat-value">{stats.utilization_rate.toFixed(1)}%</p>
          </div>
        </div>
      )}

      <div className="actions">
        <button onClick={handleAddVehicle} className="add-btn">
          + Ajouter un véhicule
        </button>
      </div>

      {showForm && (
        <VehicleForm
          vehicle={selectedVehicle}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      <VehicleList
        vehicles={vehicles}
        onEdit={handleEditVehicle}
        onDelete={handleDeleteVehicle}
      />
    </div>
  );
};

export default Dashboard;
