import { useEffect, useState } from 'react';
import { Calendar, User, Car, CreditCard, FileText, Phone, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Booking } from '../types';
import { bookingService } from '../services/booking.service';
import { extractErrorMessage } from '../utils/errorHandler';

interface BookingDetailsProps {
  booking: Booking;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function BookingDetails({ booking, open, onClose, onUpdate }: BookingDetailsProps) {
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentType, setPaymentType] = useState('rental');
  const [actionData, setActionData] = useState({ mileage: '', fuelLevel: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentSummary, setPaymentSummary] = useState<any>(null);

  useEffect(() => {
    if (open && booking) {
      loadPaymentSummary();
    }
  }, [open, booking]);

  const loadPaymentSummary = async () => {
    try {
      const summary = await bookingService.getPaymentSummary(booking.id);
      setPaymentSummary(summary);
    } catch (err) {
      console.error('Failed to load payment summary:', err);
    }
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    setError('');
    try {
      await bookingService.confirm(booking.id);
      onUpdate?.();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStartRental = async () => {
    setLoading(true);
    setError('');
    try {
      await bookingService.startRental(
        booking.id,
        parseInt(actionData.mileage),
        actionData.fuelLevel
      );
      onUpdate?.();
      setStatusDialog(false);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRental = async () => {
    setLoading(true);
    setError('');
    try {
      await bookingService.completeRental(
        booking.id,
        parseInt(actionData.mileage),
        actionData.fuelLevel
      );
      onUpdate?.();
      setStatusDialog(false);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    setLoading(true);
    setError('');
    try {
      await bookingService.recordPayment(
        booking.id,
        parseFloat(paymentAmount),
        paymentMethod,
        paymentType
      );
      await loadPaymentSummary();
      setPaymentDialog(false);
      setPaymentAmount('');
      onUpdate?.();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-red-100 text-red-800',
      partial: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      pending: 'En attente',
      partial: 'Partiel',
      paid: 'Payé',
      refunded: 'Remboursé',
    };
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">Détails de la réservation</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">#{booking.bookingNumber}</p>
              </div>
              <div className="flex gap-2">
                {getStatusBadge(booking.status)}
                {getPaymentStatusBadge(booking.payment_status)}
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-slate-500">Nom</p>
                  <p className="font-medium">
                    {booking.customer?.firstName} {booking.customer?.lastName}
                  </p>
                </div>
                {booking.customer?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <p className="text-sm">{booking.customer.email}</p>
                  </div>
                )}
                {booking.customer?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <p className="text-sm">{booking.customer.phone}</p>
                  </div>
                )}
                {booking.customer?.cinNumber && (
                  <div>
                    <p className="text-sm text-slate-500">CIN</p>
                    <p className="text-sm">{booking.customer.cinNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="h-5 w-5" />
                  Véhicule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-slate-500">Modèle</p>
                  <p className="font-medium">
                    {booking.vehicle?.brand} {booking.vehicle?.model}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Matricule</p>
                  <p className="text-sm">{booking.vehicle?.licensePlate}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Année</p>
                  <p className="text-sm">{booking.vehicle?.year}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Tarif journalier</p>
                  <p className="text-sm">{booking.dailyRate} DT</p>
                </div>
              </CardContent>
            </Card>

            {/* Rental Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  Période de location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-slate-500">Date de début</p>
                  <p className="font-medium">
                    {new Date(booking.startDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date de fin</p>
                  <p className="font-medium">
                    {new Date(booking.endDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Durée</p>
                  <p className="text-sm">{booking.duration_days} jours</p>
                </div>
                {booking.pickup_datetime && (
                  <div>
                    <p className="text-sm text-slate-500">Heure de prise en charge</p>
                    <p className="text-sm">
                      {new Date(booking.pickup_datetime).toLocaleString()}
                    </p>
                  </div>
                )}
                {booking.return_datetime && (
                  <div>
                    <p className="text-sm text-slate-500">Heure de retour</p>
                    <p className="text-sm">
                      {new Date(booking.return_datetime).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5" />
                  Facturation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm text-slate-500">Sous-total</p>
                  <p className="text-sm">{booking.subtotal.toFixed(3)} DT</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-slate-500">TVA</p>
                  <p className="text-sm">{booking.tax_amount.toFixed(3)} DT</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-slate-500">Timbre fiscal</p>
                  <p className="text-sm">{booking.timbre_fiscal.toFixed(3)} DT</p>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                  <p>Total</p>
                  <p>{booking.total_amount.toFixed(3)} DT</p>
                </div>
                {paymentSummary && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <p className="text-sm">Payé</p>
                      <p className="text-sm">{paymentSummary.paid_amount.toFixed(3)} DT</p>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <p className="text-sm">Restant</p>
                      <p className="text-sm">{paymentSummary.remaining_amount.toFixed(3)} DT</p>
                    </div>
                  </>
                )}
                {booking.depositAmount > 0 && (
                  <div className="flex justify-between">
                    <p className="text-sm text-slate-500">Caution</p>
                    <p className="text-sm">{booking.depositAmount.toFixed(3)} DT</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mileage & Fuel Information */}
          {(booking.initial_mileage || booking.final_mileage) && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Kilométrage et carburant
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {booking.initial_mileage && (
                  <div>
                    <p className="text-sm text-slate-500">Kilométrage initial</p>
                    <p className="font-medium">{booking.initial_mileage} km</p>
                  </div>
                )}
                {booking.final_mileage && (
                  <div>
                    <p className="text-sm text-slate-500">Kilométrage final</p>
                    <p className="font-medium">{booking.final_mileage} km</p>
                  </div>
                )}
                {booking.initial_fuel_level && (
                  <div>
                    <p className="text-sm text-slate-500">Niveau carburant initial</p>
                    <p className="font-medium">{booking.initial_fuel_level}</p>
                  </div>
                )}
                {booking.final_fuel_level && (
                  <div>
                    <p className="text-sm text-slate-500">Niveau carburant final</p>
                    <p className="font-medium">{booking.final_fuel_level}</p>
                  </div>
                )}
                {booking.fuel_policy && (
                  <div>
                    <p className="text-sm text-slate-500">Politique carburant</p>
                    <p className="font-medium">{booking.fuel_policy}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {booking.notes && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{booking.notes}</p>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            {booking.status === 'pending' && (
              <Button onClick={handleConfirmBooking} disabled={loading}>
                Confirmer la réservation
              </Button>
            )}
            {booking.status === 'confirmed' && (
              <Button onClick={() => setStatusDialog(true)}>
                Démarrer la location
              </Button>
            )}
            {booking.status === 'in_progress' && (
              <Button onClick={() => setStatusDialog(true)}>
                Terminer la location
              </Button>
            )}
            {booking.payment_status !== 'paid' && (
              <Button variant="outline" onClick={() => setPaymentDialog(true)}>
                Enregistrer un paiement
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Montant (DT)</Label>
              <Input
                type="number"
                step="0.001"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.000"
              />
            </div>
            <div>
              <Label>Méthode de paiement</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="card">Carte bancaire</SelectItem>
                  <SelectItem value="transfer">Virement</SelectItem>
                  <SelectItem value="check">Chèque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type de paiement</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rental">Location</SelectItem>
                  <SelectItem value="deposit">Caution</SelectItem>
                  <SelectItem value="extra">Supplément</SelectItem>
                  <SelectItem value="refund">Remboursement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRecordPayment} disabled={loading || !paymentAmount}>
                Enregistrer
              </Button>
              <Button variant="outline" onClick={() => setPaymentDialog(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {booking.status === 'confirmed' ? 'Démarrer la location' : 'Terminer la location'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Kilométrage</Label>
              <Input
                type="number"
                value={actionData.mileage}
                onChange={(e) => setActionData({ ...actionData, mileage: e.target.value })}
                placeholder="Kilométrage actuel"
              />
            </div>
            <div>
              <Label>Niveau de carburant</Label>
              <Select
                value={actionData.fuelLevel}
                onValueChange={(value) => setActionData({ ...actionData, fuelLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empty">Vide</SelectItem>
                  <SelectItem value="1/4">1/4</SelectItem>
                  <SelectItem value="1/2">1/2</SelectItem>
                  <SelectItem value="3/4">3/4</SelectItem>
                  <SelectItem value="full">Plein</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={
                  booking.status === 'confirmed' ? handleStartRental : handleCompleteRental
                }
                disabled={loading || !actionData.mileage || !actionData.fuelLevel}
              >
                {loading ? 'En cours...' : 'Confirmer'}
              </Button>
              <Button variant="outline" onClick={() => setStatusDialog(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
