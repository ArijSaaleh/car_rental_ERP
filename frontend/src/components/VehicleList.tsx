import React from 'react';
import { Vehicle } from '../types';
import './VehicleList.css';

interface VehicleListProps {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
}

const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onEdit, onDelete }) => {
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      disponible: 'Disponible',
      loue: 'Loué',
      maintenance: 'Maintenance',
      hors_service: 'Hors service',
    };
    return labels[status] || status;
  };

  const getStatusClass = (status: string): string => {
    return `status-badge status-${status}`;
  };

  if (vehicles.length === 0) {
    return (
      <div className="no-vehicles">
        <p>Aucun véhicule dans la flotte. Commencez par en ajouter un!</p>
      </div>
    );
  }

  return (
    <div className="vehicle-list">
      <table>
        <thead>
          <tr>
            <th>Plaque</th>
            <th>Marque</th>
            <th>Modèle</th>
            <th>Année</th>
            <th>Carburant</th>
            <th>Transmission</th>
            <th>Kilométrage</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td className="license-plate">{vehicle.license_plate}</td>
              <td>{vehicle.brand}</td>
              <td>{vehicle.model}</td>
              <td>{vehicle.year}</td>
              <td>{vehicle.fuel_type}</td>
              <td>{vehicle.transmission}</td>
              <td>{vehicle.mileage.toLocaleString()} km</td>
              <td>
                <span className={getStatusClass(vehicle.status)}>
                  {getStatusLabel(vehicle.status)}
                </span>
              </td>
              <td className="actions">
                <button
                  onClick={() => onEdit(vehicle)}
                  className="edit-btn"
                  title="Modifier"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(vehicle.id)}
                  className="delete-btn"
                  title="Supprimer"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VehicleList;
