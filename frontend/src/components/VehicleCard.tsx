import { Car, Fuel, Users, Settings, Star, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

interface Vehicle {
  id: string;
  marque: string;
  modele: string;
  annee: number;
  immatriculation: string;
  couleur?: string;
  statut: 'disponible' | 'loue' | 'maintenance' | 'reserve';
  prix_par_jour?: number;
  carburant?: string;
  places?: number;
  transmission?: string;
  image?: string;
  rating?: number;
  totalRentals?: number;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onView?: () => void;
  onEdit?: () => void;
  onBook?: () => void;
  showActions?: boolean;
  variant?: 'grid' | 'list';
}

export function VehicleCard({ 
  vehicle, 
  onView, 
  onEdit, 
  onBook, 
  showActions = true,
  variant = 'grid'
}: VehicleCardProps) {
  const statusConfig = {
    disponible: { 
      label: 'Disponible', 
      color: 'bg-green-100 text-green-700 border-green-200',
      dot: 'bg-green-500'
    },
    loue: { 
      label: 'Loué', 
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      dot: 'bg-orange-500'
    },
    maintenance: { 
      label: 'Maintenance', 
      color: 'bg-red-100 text-red-700 border-red-200',
      dot: 'bg-red-500'
    },
    reserve: { 
      label: 'Réservé', 
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      dot: 'bg-blue-500'
    },
  };

  const status = statusConfig[vehicle.statut];

  if (variant === 'list') {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 card-hover">
        <div className="flex items-center gap-6">
          {/* Vehicle Image */}
          <div className="relative w-48 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
            {vehicle.image ? (
              <img src={vehicle.image} alt={`${vehicle.marque} ${vehicle.modele}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car className="h-16 w-16 text-gray-400" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              <button className="p-2 rounded-lg bg-white/90 backdrop-blur-sm hover:bg-white transition-colors">
                <Heart className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {vehicle.marque} {vehicle.modele}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {vehicle.annee} • {vehicle.immatriculation}
                </p>
              </div>
              <div className={cn("px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5", status.color)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)}></span>
                {status.label}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
              {vehicle.carburant && (
                <div className="flex items-center gap-1.5">
                  <Fuel className="h-4 w-4" />
                  <span>{vehicle.carburant}</span>
                </div>
              )}
              {vehicle.places && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>{vehicle.places} places</span>
                </div>
              )}
              {vehicle.transmission && (
                <div className="flex items-center gap-1.5">
                  <Settings className="h-4 w-4" />
                  <span>{vehicle.transmission}</span>
                </div>
              )}
              {vehicle.rating && (
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{vehicle.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {showActions && (
              <div className="flex items-center gap-3">
                {vehicle.prix_par_jour && (
                  <div className="mr-auto">
                    <span className="text-2xl font-bold text-primary">{vehicle.prix_par_jour}€</span>
                    <span className="text-sm text-muted-foreground">/jour</span>
                  </div>
                )}
                <Button variant="outline" onClick={onView} className="rounded-xl">
                  Détails
                </Button>
                {vehicle.statut === 'disponible' && onBook && (
                  <Button onClick={onBook} className="rounded-xl bg-gradient-primary hover:opacity-90 text-white">
                    Réserver
                  </Button>
                )}
                {onEdit && (
                  <Button variant="outline" onClick={onEdit} className="rounded-xl">
                    Modifier
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden card-hover group">
      {/* Vehicle Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {vehicle.image ? (
          <img 
            src={vehicle.image} 
            alt={`${vehicle.marque} ${vehicle.modele}`} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="h-20 w-20 text-gray-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <div className={cn("px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm flex items-center gap-1.5", status.color)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)}></span>
            {status.label}
          </div>
        </div>

        {/* Favorite Button */}
        <div className="absolute top-3 right-3">
          <button className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors">
            <Heart className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Quick Stats Overlay */}
        {vehicle.rating && vehicle.totalRentals && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-semibold">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{vehicle.rating.toFixed(1)}</span>
            </div>
            <div className="px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-xs text-muted-foreground">
              {vehicle.totalRentals} locations
            </div>
          </div>
        )}
      </div>

      {/* Vehicle Details */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-foreground mb-1">
            {vehicle.marque} {vehicle.modele}
          </h3>
          <p className="text-sm text-muted-foreground">
            {vehicle.annee} • {vehicle.immatriculation}
          </p>
        </div>

        {/* Specifications */}
        <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
          {vehicle.carburant && (
            <div className="flex items-center gap-1">
              <Fuel className="h-3.5 w-3.5" />
              <span>{vehicle.carburant}</span>
            </div>
          )}
          {vehicle.places && (
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{vehicle.places}</span>
            </div>
          )}
          {vehicle.transmission && (
            <div className="flex items-center gap-1">
              <Settings className="h-3.5 w-3.5" />
              <span>{vehicle.transmission}</span>
            </div>
          )}
        </div>

        {/* Price & Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            {vehicle.prix_par_jour ? (
              <div>
                <span className="text-xl font-bold text-primary">{vehicle.prix_par_jour}€</span>
                <span className="text-xs text-muted-foreground">/jour</span>
              </div>
            ) : (
              <div></div>
            )}
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onView} className="rounded-lg">
                Voir
              </Button>
              {vehicle.statut === 'disponible' && onBook && (
                <Button size="sm" onClick={onBook} className="rounded-lg bg-gradient-primary hover:opacity-90 text-white">
                  Réserver
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface VehicleShowcaseProps {
  title?: string;
  vehicles: Vehicle[];
  onViewAll?: () => void;
  variant?: 'grid' | 'list';
  showActions?: boolean;
}

export function VehicleShowcase({ 
  title = "Flotte de véhicules", 
  vehicles, 
  onViewAll,
  variant = 'grid',
  showActions = true
}: VehicleShowcaseProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {onViewAll && (
          <Button variant="outline" onClick={onViewAll} className="rounded-xl">
            Voir tout
          </Button>
        )}
      </div>

      {/* Vehicle Grid/List */}
      <div className={cn(
        variant === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "flex flex-col gap-4"
      )}>
        {vehicles.map((vehicle) => (
          <VehicleCard 
            key={vehicle.id} 
            vehicle={vehicle} 
            variant={variant}
            showActions={showActions}
          />
        ))}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-12">
          <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun véhicule disponible</p>
        </div>
      )}
    </div>
  );
}
