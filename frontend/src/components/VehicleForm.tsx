import React, { useState, useEffect } from 'react';
import { vehicleService } from '../services/vehicle.service';
import { Vehicle, VehicleFormData, VehicleStatus, FuelType, TransmissionType } from '../types';
import './VehicleForm.css';

interface VehicleFormProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSuccess: () => void;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ vehicle, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<VehicleFormData>({
    license_plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    fuel_type: FuelType.ESSENCE,
    transmission: TransmissionType.MANUELLE,
    seats: 5,
    doors: 4,
    mileage: 0,
    status: VehicleStatus.DISPONIBLE,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (vehicle) {
      setFormData({
        license_plate: vehicle.license_plate,
        vin: vehicle.vin,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        fuel_type: vehicle.fuel_type,
        transmission: vehicle.transmission,
        seats: vehicle.seats,
        doors: vehicle.doors,
        mileage: vehicle.mileage,
        status: vehicle.status,
        registration_number: vehicle.registration_number,
        insurance_policy: vehicle.insurance_policy,
        daily_rate: vehicle.daily_rate,
        notes: vehicle.notes,
      });
    }
  }, [vehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (vehicle) {
        await vehicleService.updateVehicle(vehicle.id, formData);
      } else {
        await vehicleService.createVehicle(formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['year', 'seats', 'doors', 'mileage', 'daily_rate'].includes(name)
        ? Number(value)
        : value,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{vehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Plaque d'immatriculation *</label>
              <input
                type="text"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>VIN</label>
              <input
                type="text"
                name="vin"
                value={formData.vin || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Marque *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Modèle *</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Année *</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1900"
                max="2100"
                required
              />
            </div>
            <div className="form-group">
              <label>Couleur</label>
              <input
                type="text"
                name="color"
                value={formData.color || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Carburant *</label>
              <select name="fuel_type" value={formData.fuel_type} onChange={handleChange} required>
                <option value={FuelType.ESSENCE}>Essence</option>
                <option value={FuelType.DIESEL}>Diesel</option>
                <option value={FuelType.HYBRIDE}>Hybride</option>
                <option value={FuelType.ELECTRIQUE}>Électrique</option>
              </select>
            </div>
            <div className="form-group">
              <label>Transmission *</label>
              <select name="transmission" value={formData.transmission} onChange={handleChange} required>
                <option value={TransmissionType.MANUELLE}>Manuelle</option>
                <option value={TransmissionType.AUTOMATIQUE}>Automatique</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Sièges *</label>
              <input
                type="number"
                name="seats"
                value={formData.seats}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>Portes *</label>
              <input
                type="number"
                name="doors"
                value={formData.doors}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Kilométrage *</label>
              <input
                type="number"
                name="mileage"
                value={formData.mileage}
                onChange={handleChange}
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label>Statut *</label>
              <select name="status" value={formData.status} onChange={handleChange} required>
                <option value={VehicleStatus.DISPONIBLE}>Disponible</option>
                <option value={VehicleStatus.LOUE}>Loué</option>
                <option value={VehicleStatus.MAINTENANCE}>Maintenance</option>
                <option value={VehicleStatus.HORS_SERVICE}>Hors service</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Tarif journalier (TND)</label>
            <input
              type="number"
              name="daily_rate"
              value={formData.daily_rate || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'En cours...' : vehicle ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleForm;
