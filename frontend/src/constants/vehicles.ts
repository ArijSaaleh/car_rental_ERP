// Marques de voitures populaires
export const CAR_BRANDS = [
  'Audi',
  'BMW',
  'Chevrolet',
  'Citroën',
  'Dacia',
  'Fiat',
  'Ford',
  'Honda',
  'Hyundai',
  'Kia',
  'Mazda',
  'Mercedes-Benz',
  'Nissan',
  'Opel',
  'Peugeot',
  'Renault',
  'Seat',
  'Skoda',
  'Toyota',
  'Volkswagen',
  'Volvo',
].sort();

// Modèles par marque
export const CAR_MODELS: Record<string, string[]> = {
  'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'e-tron'],
  'BMW': ['Serie 1', 'Serie 3', 'Serie 5', 'X1', 'X3', 'X5', 'i3', 'i4'],
  'Chevrolet': ['Spark', 'Cruze', 'Malibu', 'Tahoe', 'Suburban'],
  'Citroën': ['C3', 'C4', 'C5', 'Berlingo', 'Jumpy'],
  'Dacia': ['Sandero', 'Duster', 'Logan', 'Lodgy', 'Spring'],
  'Fiat': ['500', 'Panda', 'Tipo', 'Doblo'],
  'Ford': ['Fiesta', 'Focus', 'Mondeo', 'Kuga', 'Transit'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Jazz'],
  'Hyundai': ['i10', 'i20', 'i30', 'Tucson', 'Santa Fe', 'Kona'],
  'Kia': ['Picanto', 'Rio', 'Ceed', 'Sportage', 'Sorento', 'Niro'],
  'Mazda': ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-5'],
  'Mercedes-Benz': ['Classe A', 'Classe C', 'Classe E', 'GLA', 'GLC', 'GLE'],
  'Nissan': ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf'],
  'Opel': ['Corsa', 'Astra', 'Insignia', 'Crossland', 'Grandland'],
  'Peugeot': ['208', '308', '508', '2008', '3008', '5008'],
  'Renault': ['Clio', 'Megane', 'Captur', 'Kadjar', 'Scenic', 'Zoe'],
  'Seat': ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco'],
  'Skoda': ['Fabia', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq'],
  'Toyota': ['Yaris', 'Corolla', 'Camry', 'C-HR', 'RAV4', 'Prius'],
  'Volkswagen': ['Polo', 'Golf', 'Passat', 'T-Roc', 'Tiguan', 'Touareg', 'ID.3', 'ID.4'],
  'Volvo': ['V40', 'V60', 'V90', 'XC40', 'XC60', 'XC90'],
};

// Couleurs disponibles
export const CAR_COLORS = [
  { value: 'blanc', label: 'Blanc', hex: '#FFFFFF' },
  { value: 'noir', label: 'Noir', hex: '#000000' },
  { value: 'gris', label: 'Gris', hex: '#808080' },
  { value: 'argent', label: 'Argent', hex: '#C0C0C0' },
  { value: 'bleu', label: 'Bleu', hex: '#0066CC' },
  { value: 'rouge', label: 'Rouge', hex: '#DC143C' },
  { value: 'vert', label: 'Vert', hex: '#228B22' },
  { value: 'jaune', label: 'Jaune', hex: '#FFD700' },
  { value: 'orange', label: 'Orange', hex: '#FF8C00' },
  { value: 'marron', label: 'Marron', hex: '#8B4513' },
  { value: 'beige', label: 'Beige', hex: '#F5F5DC' },
  { value: 'violet', label: 'Violet', hex: '#8B008B' },
];

// Types de carburant
export const FUEL_TYPES = [
  { value: 'essence', label: 'Essence' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electrique', label: 'Électrique' },
  { value: 'hybride', label: 'Hybride' },
  { value: 'gpl', label: 'GPL' },
];

// Statuts de véhicule
export const VEHICLE_STATUS = [
  { value: 'disponible', label: 'Disponible', color: 'green' },
  { value: 'loue', label: 'Loué', color: 'blue' },
  { value: 'maintenance', label: 'Maintenance', color: 'orange' },
  { value: 'hors_service', label: 'Hors service', color: 'red' },
];

// États d'assurance
export const INSURANCE_STATUS = [
  { value: 'valide', label: 'Valide', color: 'green' },
  { value: 'expire_bientot', label: 'Expire bientôt', color: 'orange' },
  { value: 'expire', label: 'Expiré', color: 'red' },
];

// États d'immatriculation
export const REGISTRATION_STATUS = [
  { value: 'valide', label: 'Valide', color: 'green' },
  { value: 'expire_bientot', label: 'Expire bientôt', color: 'orange' },
  { value: 'expire', label: 'Expiré', color: 'red' },
];
