import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Car as CarIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { vehicleService } from '../services/vehicle.service';
import type { Vehicle } from '../types';
import { extractErrorMessage } from '../utils/errorHandler';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<{
    matricule: string;
    marque: string;
    modele: string;
    annee: number;
    couleur: string;
    type_carburant: string;
    kilometrage: number;
    prix_journalier: number;
    statut: 'disponible' | 'loue' | 'maintenance';
  }>({
    matricule: '',
    marque: '',
    modele: '',
    annee: new Date().getFullYear(),
    couleur: '',
    type_carburant: 'essence',
    kilometrage: 0,
    prix_journalier: 0,
    statut: 'disponible',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    const filtered = vehicles.filter(
      (vehicle) =>
        vehicle.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.modele.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.matricule.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVehicles(filtered);
  }, [searchTerm, vehicles]);

  const loadVehicles = async () => {
    try {
      const data = await vehicleService.getAll();
      setVehicles(data);
      setFilteredVehicles(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setFormData({
        matricule: vehicle.matricule,
        marque: vehicle.marque,
        modele: vehicle.modele,
        annee: vehicle.annee,
        couleur: vehicle.couleur,
        type_carburant: vehicle.type_carburant,
        kilometrage: vehicle.kilometrage,
        prix_journalier: vehicle.prix_journalier,
        statut: vehicle.statut,
      });
    } else {
      setSelectedVehicle(null);
      setFormData({
        matricule: '',
        marque: '',
        modele: '',
        annee: new Date().getFullYear(),
        couleur: '',
        type_carburant: 'essence',
        kilometrage: 0,
        prix_journalier: 0,
        statut: 'disponible',
      });
    }
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (selectedVehicle) {
        await vehicleService.update(selectedVehicle.id, formData);
      } else {
        await vehicleService.create(formData as any);
      }
      await loadVehicles();
      setDialogOpen(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicle) return;
    setLoading(true);

    try {
      await vehicleService.delete(selectedVehicle.id);
      await loadVehicles();
      setDeleteDialogOpen(false);
      setSelectedVehicle(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      disponible: 'default',
      loue: 'secondary',
      maintenance: 'destructive',
    };
    const labels: Record<string, string> = {
      disponible: 'Disponible',
      loue: 'Loué',
      maintenance: 'Maintenance',
    };
    return <Badge variant={variants[statut]}>{labels[statut]}</Badge>;
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-slate-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Véhicules
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gérez votre flotte de véhicules
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un véhicule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par marque, modèle ou matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Année</TableHead>
                <TableHead>Carburant</TableHead>
                <TableHead>Prix/Jour</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Aucun véhicule trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.matricule}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CarIcon className="h-4 w-4 text-slate-400" />
                        <span>
                          {vehicle.marque} {vehicle.modele}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{vehicle.annee}</TableCell>
                    <TableCell className="capitalize">{vehicle.type_carburant}</TableCell>
                    <TableCell>{vehicle.prix_journalier} DT</TableCell>
                    <TableCell>{getStatusBadge(vehicle.statut)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(vehicle)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du véhicule
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricule">Matricule</Label>
                <Input
                  id="matricule"
                  value={formData.matricule}
                  onChange={(e) =>
                    setFormData({ ...formData, matricule: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marque">Marque</Label>
                <Input
                  id="marque"
                  value={formData.marque}
                  onChange={(e) =>
                    setFormData({ ...formData, marque: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modele">Modèle</Label>
                <Input
                  id="modele"
                  value={formData.modele}
                  onChange={(e) =>
                    setFormData({ ...formData, modele: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annee">Année</Label>
                <Input
                  id="annee"
                  type="number"
                  value={formData.annee}
                  onChange={(e) =>
                    setFormData({ ...formData, annee: parseInt(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="couleur">Couleur</Label>
                <Input
                  id="couleur"
                  value={formData.couleur}
                  onChange={(e) =>
                    setFormData({ ...formData, couleur: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type_carburant">Type de carburant</Label>
                <Select
                  value={formData.type_carburant}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type_carburant: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essence">Essence</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electrique">Électrique</SelectItem>
                    <SelectItem value="hybride">Hybride</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kilometrage">Kilométrage</Label>
                <Input
                  id="kilometrage"
                  type="number"
                  value={formData.kilometrage}
                  onChange={(e) =>
                    setFormData({ ...formData, kilometrage: parseInt(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prix_journalier">Prix journalier (DT)</Label>
                <Input
                  id="prix_journalier"
                  type="number"
                  step="0.01"
                  value={formData.prix_journalier}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prix_journalier: parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, statut: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="loue">Loué</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
