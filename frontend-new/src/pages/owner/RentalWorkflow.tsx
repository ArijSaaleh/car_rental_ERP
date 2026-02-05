import { useState, useEffect } from 'react';
import { Search, User, Car, CreditCard, FileText, PlayCircle, CheckCircle, ArrowRight, ArrowLeft, Plus, X, Calendar, DollarSign, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorHandler';
import { agencyService } from '../../services/agency.service';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cin_number?: string;
  driver_license?: string;
  address?: string;
}

interface Vehicle {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  daily_rate: number;
  status: string;
  mileage: number;
}

interface Agency {
  id: string;
  name: string;
}

const STEPS = [
  { id: 1, title: 'Sélection Client', description: 'Rechercher ou créer un client', icon: User },
  { id: 2, title: 'Véhicule & Dates', description: 'Choisir véhicule et période', icon: Car },
  { id: 3, title: 'Contrat', description: 'Préparer et signer le contrat', icon: FileText },
  { id: 4, title: 'Paiement', description: 'Enregistrer paiement et caution', icon: CreditCard },
  { id: 5, title: 'Finalisation', description: 'Créer réservation et démarrer', icon: CheckCircle },
];

const PAYMENT_METHODS = [
  { value: 'especes', label: '💵 Espèces' },
  { value: 'carte', label: '💳 Carte bancaire' },
  { value: 'cheque', label: '📝 Chèque' },
  { value: 'virement', label: '🏦 Virement' },
];

export default function RentalWorkflow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    cin_number: '',
    driver_license: '',
    address: '',
  });

  // Step 2
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [bookingForm, setBookingForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    fuel_policy: 'full_to_full',
    notes: '',
  });
  const [pricing, setPricing] = useState({
    days: 0,
    daily_rate: 0,
    subtotal: 0,
    tax_rate: 0.19,
    tax_amount: 0,
    timbre_fiscal: 1,
    total_amount: 0,
    deposit_amount: 500,
  });

  // Step 3: Contract
  const [contractArticles, setContractArticles] = useState({
    article1: 'Le locataire s\'engage à utiliser le véhicule en bon père de famille et à respecter le code de la route tunisien.',
    article2: 'Le véhicule ne doit pas sortir du territoire tunisien sans autorisation écrite préalable.',
    article3: 'Le locataire s\'engage à restituer le véhicule au lieu et à l\'heure convenus, dans l\'état où il l\'a reçu.',
    article4: 'Toute prolongation de location doit être autorisée par le loueur et fera l\'objet d\'un avenant au présent contrat.',
    article5: 'Le locataire déclare avoir pris connaissance de l\'état du véhicule et accepte celui-ci sans réserve.',
    article6: 'Une caution est exigée et sera restituée au retour du véhicule en bon état.',
  });
  const [contractData, setContractData] = useState<any>(null);
  const [contractPdfGenerated, setContractPdfGenerated] = useState(false);
  const [contractTermsAccepted, setContractTermsAccepted] = useState(false);

  // Step 4: Payment
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: 0,
    payment_method: 'especes',
    deposit_paid: false,
    deposit_method: 'especes',
    notes: '',
  });
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Step 5: Finalization
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [startMileage, setStartMileage] = useState(0);
  const [rentalStarted, setRentalStarted] = useState(false);

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    if (selectedAgencyId) {
      loadVehicles();
      loadCustomers();
    }
  }, [selectedAgencyId]);

  useEffect(() => {
    if (selectedAgencyId && bookingForm.startDate && bookingForm.endDate) {
      loadVehicles();
    }
  }, [bookingForm.startDate, bookingForm.endDate]);

  useEffect(() => {
    calculatePricing();
  }, [bookingForm.startDate, bookingForm.endDate, selectedVehicle]);

  const loadAgencies = async () => {
    try {
      const data = await agencyService.getAll();
      setAgencies(data);
      if (data.length > 0) {
        setSelectedAgencyId(data[0].id);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const loadVehicles = async () => {
    if (!selectedAgencyId) return;
    setLoading(true);
    try {
      // Si les dates sont sélectionnées, vérifier la disponibilité pour chaque véhicule
      if (bookingForm.startDate && bookingForm.endDate) {
        const response = await api.get(`/vehicles?agencyId=${selectedAgencyId}&status=DISPONIBLE`);
        const allVehicles = response.data.vehicles || response.data || [];
        
        // Vérifier la disponibilité pour chaque véhicule
        const availabilityChecks = await Promise.all(
          allVehicles.map(async (vehicle: Vehicle) => {
            try {
              const availResponse = await api.post('/bookings/check-availability', {
                vehicle_id: vehicle.id,
                start_date: `${bookingForm.startDate}T00:00:00`,
                end_date: `${bookingForm.endDate}T00:00:00`,
              }, {
                params: { agencyId: selectedAgencyId }
              });
              return availResponse.data.available ? vehicle : null;
            } catch (err) {
              return null;
            }
          })
        );
        
        const availableVehicles = availabilityChecks.filter((v): v is Vehicle => v !== null);
        setVehicles(availableVehicles);
      } else {
        // Sans dates, charger tous les véhicules disponibles
        const response = await api.get(`/vehicles?agencyId=${selectedAgencyId}&status=DISPONIBLE`);
        const vehiclesList = response.data.vehicles || response.data || [];
        setVehicles(vehiclesList);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    if (!selectedAgencyId) return;
    try {
      const response = await api.get(`/customers?agencyId=${selectedAgencyId}`);
      const customers = response.data.customers || response.data || [];
      setSearchResults(customers);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const searchCustomers = async () => {
    if (!searchTerm.trim()) {
      loadCustomers();
      return;
    }
    if (!selectedAgencyId) {
      setError('Veuillez sélectionner une agence');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/customers?agencyId=${selectedAgencyId}&search=${searchTerm}`);
      const customers = response.data.customers || response.data || [];
      setSearchResults(customers);
      if (customers.length === 0) {
        setIsNewCustomer(true);
        setCustomerForm({ ...customerForm, first_name: searchTerm });
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async () => {
    if (!selectedAgencyId) {
      setError('Veuillez sélectionner une agence');
      throw new Error('agency_id is required');
    }
    setLoading(true);
    try {
      const response = await api.post('/customers', {
        ...customerForm,
        agencyId: selectedAgencyId,
      });
      setSelectedCustomer(response.data);
      setIsNewCustomer(false);
      setSuccess('Client créé avec succès');
      return response.data;
    } catch (err) {
      setError(extractErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const calculatePricing = () => {
    if (!selectedVehicle || !bookingForm.startDate || !bookingForm.endDate) return;

    const start = new Date(bookingForm.startDate);
    const end = new Date(bookingForm.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return;

    const daily_rate = selectedVehicle.dailyRate || 0;
    const subtotal = days * daily_rate;
    const tax_amount = subtotal * pricing.tax_rate;
    const total_amount = subtotal + tax_amount + pricing.timbre_fiscal;

    setPricing({
      ...pricing,
      days,
      daily_rate,
      subtotal,
      tax_amount,
      total_amount,
    });

    setPaymentForm({
      ...paymentForm,
      amount_paid: total_amount,
    });
  };

  // Step 3: Generate and prepare contract (before creating booking)
  const prepareContract = async () => {
    if (!selectedCustomer || !selectedVehicle) {
      setError('Client et véhicule requis');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Construire les terms_and_conditions à partir des articles
      const termsHTML = `
        <h2>CONDITIONS GÉNÉRALES DE LOCATION DE VÉHICULE</h2>
        <p><strong>Contrat établi selon la législation tunisienne</strong></p>
        
        <h3>Article 1 - Usage du véhicule</h3>
        <p>${contractArticles.article1}</p>
        
        <h3>Article 2 - Territoire d'utilisation</h3>
        <p>${contractArticles.article2}</p>
        
        <h3>Article 3 - Restitution</h3>
        <p>${contractArticles.article3}</p>
        
        <h3>Article 4 - Prolongation</h3>
        <p>${contractArticles.article4}</p>
        
        <h3>Article 5 - État du véhicule</h3>
        <p>${contractArticles.article5}</p>
        
        <h3>Article 6 - Caution</h3>
        <p>${contractArticles.article6}</p>
        
        <p style="margin-top: 30px;"><strong>Le locataire déclare avoir pris connaissance de ces conditions et les accepter.</strong></p>
      `;

      // Préparer les special_clauses avec les informations détaillées
      const specialClauses = {
        client_name: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
        client_cin: selectedCustomer.cinNumber,
        client_license: selectedCustomer.driver_license,
        vehicle_brand: selectedVehicle.brand,
        vehicle_model: selectedVehicle.model,
        vehicle_plate: selectedVehicle.licensePlate,
        start_date: bookingForm.startDate,
        end_date: bookingForm.endDate,
        montant_location: pricing.total_amount,
        montant_caution: pricing.depositAmount,
        politique_carburant: 'Plein à plein',
        kilometrage_initial: selectedVehicle.mileage || 0,
        assurance: 'Responsabilité Civile incluse',
        franchise: '300 DT en cas de dommage',
        timbre_fiscal: pricing.timbre_fiscal,
      };

      // Sauvegarder les données du contrat pour la création ultérieure
      setContractData({
        terms_and_conditions: termsHTML,
        special_clauses: specialClauses,
      });
      
      setContractPdfGenerated(true);
      setSuccess('Contrat préparé avec succès');
    } catch (err: any) {
      console.error('Contract preparation error:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Validate payment
  const validatePayment = () => {
    if (paymentForm.amount_paid < pricing.total_amount) {
      setError('Le montant payé est insuffisant');
      return false;
    }
    setPaymentCompleted(true);
    setSuccess('Paiement validé');
    return true;
  };

  // Step 5: Create booking with contract and payment (final step)
  const finalizeRental = async () => {
    if (!selectedCustomer || !selectedVehicle || !contractData || !paymentCompleted) {
      setError('Veuillez compléter toutes les étapes précédentes');
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log('=== Starting finalization ===');
      
      // 1. Créer la réservation
      const bookingData = {
        customer_id: selectedCustomer.id,
        vehicle_id: selectedVehicle.id,
        start_date: `${bookingForm.startDate}T00:00:00`,
        end_date: `${bookingForm.endDate}T00:00:00`,
        daily_rate: pricing.dailyRate,
        deposit_amount: pricing.depositAmount,
        fuel_policy: bookingForm.fuel_policy,
        notes: bookingForm.notes,
      };
      
      console.log('1. Creating booking with data:', bookingData);
      const bookingResponse = await api.post(`/bookings?agencyId=${selectedAgencyId}`, bookingData);
      const newBookingId = bookingResponse.data.id;
      setBookingId(newBookingId);
      console.log('✅ Booking created:', newBookingId);
      
      // 2. Créer le contrat lié à la réservation
      console.log('2. Creating contract for booking:', newBookingId);
      
      // Prepare contract payload - ensure special_clauses is a proper object
      const contractPayload = {
        booking_id: newBookingId,
        terms_and_conditions: contractData.terms_and_conditions,
        special_clauses: contractData.special_clauses || {}
      };
      
      console.log('Contract payload:', {
        booking_id: contractPayload.booking_id,
        terms_length: contractPayload.terms_and_conditions?.length,
        special_clauses_keys: Object.keys(contractPayload.special_clauses || {}),
        agencyId: selectedAgencyId
      });
      
      let contractId;
      try {
        const contractResponse = await api.post('/contracts/', contractPayload, {
          params: { agencyId: selectedAgencyId },
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        contractId = contractResponse.data.id;
        console.log('✅ Contract created:', contractId);
      } catch (contractError: any) {
        console.error('❌ Contract creation failed:', contractError);
        console.error('Error details:', {
          message: contractError.message,
          code: contractError.code,
          response_data: contractError.response?.data,
          response_status: contractError.response?.status,
          request_url: contractError.config?.url,
          request_data: contractError.config?.data
        });
        
        // If contract creation fails, we should rollback the booking
        // But for now, just throw the error with more context
        const errorMsg = contractError.response?.data?.detail || contractError.message;
        throw new Error(`Échec création contrat: ${errorMsg}`);
      }
      
      // 3. Enregistrer les paiements
      console.log('3. Recording payments');
      await api.post(
        `/bookings/${newBookingId}/payment?amount=${paymentForm.amount_paid}&payment_method=${paymentForm.payment_method}&payment_type=rental&notes=${encodeURIComponent(paymentForm.notes || '')}`
      );
      console.log('✅ Rental payment recorded');

      if (paymentForm.deposit_paid) {
        await api.post(
          `/bookings/${newBookingId}/payment?amount=${pricing.depositAmount}&payment_method=${paymentForm.deposit_method}&payment_type=deposit&notes=${encodeURIComponent('Caution')}`
        );
        console.log('✅ Deposit payment recorded');
      }
      
      // 4. Confirmer la réservation
      console.log('4. Confirming booking');
      await api.post(`/bookings/${newBookingId}/confirm`, null, {
        params: { agencyId: selectedAgencyId }
      });
      console.log('✅ Booking confirmed');
      
      // 5. Démarrer la location
      console.log('5. Starting rental with mileage:', startMileage);
      await api.post(`/bookings/${newBookingId}/start`, null, {
        params: {
          agencyId: selectedAgencyId,
          initial_mileage: startMileage,
          initial_fuel_level: 'full'
        }
      });
      console.log('✅ Rental started');
      
      // 6. Télécharger le contrat PDF
      console.log('6. Downloading contract PDF');
      const pdfResponse = await api.get(`/contracts/${contractId}/pdf`, {
        params: { agencyId: selectedAgencyId },
        responseType: 'blob',
      });
      
      const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrat-location-${newBookingId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      console.log('✅ PDF downloaded');
      
      setRentalStarted(true);
      setSuccess('Location finalisée avec succès! Le contrat a été téléchargé.');
      console.log('=== Finalization complete ===');
    } catch (err: any) {
      console.error('❌ Finalization error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    setError('');
    setSuccess('');

    if (!selectedAgencyId) {
      setError('Veuillez sélectionner une agence');
      return;
    }

    try {
      if (currentStep === 1) {
        // Step 1: Validate customer
        if (!selectedCustomer) {
          if (isNewCustomer) {
            await createCustomer();
          } else {
            setError('Veuillez sélectionner ou créer un client');
            return;
          }
        }
      } else if (currentStep === 2) {
        // Step 2: Validate vehicle and dates
        if (!selectedVehicle) {
          setError('Veuillez sélectionner un véhicule');
          return;
        }
        if (!bookingForm.startDate || !bookingForm.endDate) {
          setError('Veuillez sélectionner les dates');
          return;
        }
        // Validate dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(bookingForm.startDate);
        const endDate = new Date(bookingForm.endDate);
        
        if (startDate < today) {
          setError('La date de début doit être aujourd\'hui ou après');
          return;
        }
        if (endDate <= startDate) {
          setError('La date de fin doit être après la date de début');
          return;
        }
        // Initialize start mileage for later use
        setStartMileage(selectedVehicle.mileage);
      } else if (currentStep === 3) {
        // Step 3: Prepare contract and validate acceptance
        if (!contractPdfGenerated) {
          await prepareContract();
        }
        if (!contractTermsAccepted) {
          setError('Veuillez accepter les conditions du contrat');
          return;
        }
      } else if (currentStep === 4) {
        // Step 4: Validate payment
        if (!validatePayment()) {
          return;
        }
      } else if (currentStep === 5) {
        // Step 5: Finalize everything (create booking, contract, payment, start)
        await finalizeRental();
        return; // Don't go to next step, rental is complete
      }

      setCurrentStep(currentStep + 1);
    } catch (err) {
      // Error already handled
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
      setSuccess('');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-white p-6 rounded-xl border-2 border-blue-100">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="🔍 Rechercher un client (nom, CIN, téléphone...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchCustomers()}
                    className="h-12 text-lg"
                  />
                </div>
                <Button onClick={searchCustomers} disabled={loading} size="lg" className="h-12 px-8">
                  <Search className="h-5 w-5 mr-2" />
                  Rechercher
                </Button>
                <Button onClick={() => setIsNewCustomer(true)} variant="outline" size="lg" className="h-12 px-8">
                  <Plus className="h-5 w-5 mr-2" />
                  Nouveau
                </Button>
              </div>
            </div>

            {/* Selected Customer */}
            {selectedCustomer && !isNewCustomer && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-600 text-white rounded-full p-3">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-900">{selectedCustomer.firstName} {selectedCustomer.lastName}</h3>
                      <div className="flex gap-4 mt-2 text-green-700">
                        <span>📧 {selectedCustomer.email}</span>
                        <span>📱 {selectedCustomer.phone}</span>
                        {selectedCustomer.cinNumber && <span>🆔 CIN: {selectedCustomer.cinNumber}</span>}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedCustomer(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Customer Form */}
            {isNewCustomer && (
              <div className="bg-white p-6 rounded-xl border-2 border-blue-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">➕ Nouveau Client</h3>
                  <Button variant="ghost" onClick={() => setIsNewCustomer(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base">Prénom *</Label>
                    <Input
                      value={customerForm.firstName}
                      onChange={(e) => setCustomerForm({ ...customerForm, first_name: e.target.value })}
                      className="mt-1 h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-base">Nom *</Label>
                    <Input
                      value={customerForm.lastName}
                      onChange={(e) => setCustomerForm({ ...customerForm, last_name: e.target.value })}
                      className="mt-1 h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-base">Email *</Label>
                    <Input
                      type="email"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                      className="mt-1 h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-base">Téléphone *</Label>
                    <Input
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      className="mt-1 h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-base">Numéro CIN *</Label>
                    <Input
                      value={customerForm.cinNumber}
                      onChange={(e) => setCustomerForm({ ...customerForm, cin_number: e.target.value })}
                      className="mt-1 h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-base">Permis de conduire *</Label>
                    <Input
                      value={customerForm.driver_license}
                      onChange={(e) => setCustomerForm({ ...customerForm, driver_license: e.target.value })}
                      className="mt-1 h-11"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-base">Adresse</Label>
                    <Input
                      value={customerForm.address}
                      onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                      className="mt-1 h-11"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Search Results */}
            {!isNewCustomer && searchResults.length > 0 && !selectedCustomer && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Résultats de recherche ({searchResults.length})</h3>
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {searchResults.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className="bg-white p-4 rounded-lg border-2 border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-lg">{customer.firstName} {customer.lastName}</p>
                          <div className="flex gap-3 mt-1 text-sm text-slate-600">
                            <span>📧 {customer.email}</span>
                            <span>📱 {customer.phone}</span>
                          </div>
                        </div>
                        {customer.cinNumber && (
                          <Badge variant="outline" className="text-sm">CIN: {customer.cinNumber}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Dates Selection */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border-2 border-blue-100">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Date de début
                </Label>
                <Input
                  type="date"
                  value={bookingForm.startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setBookingForm({ 
                      ...bookingForm, 
                      start_date: newStartDate,
                      // Reset end_date if it's before new start_date
                      end_date: bookingForm.endDate && bookingForm.endDate <= newStartDate ? '' : bookingForm.endDate
                    });
                  }}
                  className="mt-2 h-12 text-lg"
                />
              </div>
              <div className="bg-white p-6 rounded-xl border-2 border-blue-100">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Date de fin
                </Label>
                <Input
                  type="date"
                  value={bookingForm.endDate}
                  min={bookingForm.startDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingForm({ ...bookingForm, end_date: e.target.value })}
                  className="mt-2 h-12 text-lg"
                  disabled={!bookingForm.startDate}
                />
                {!bookingForm.startDate && (
                  <p className="text-sm text-gray-500 mt-2">Sélectionnez d'abord la date de début</p>
                )}
              </div>
            </div>

            {/* Selected Vehicle */}
            {selectedVehicle && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 text-white rounded-full p-3">
                      <Car className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-blue-900">{selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})</h3>
                      <div className="flex gap-4 mt-2 text-blue-700">
                        <span>🚗 {selectedVehicle.licensePlate}</span>
                        <span>📏 {selectedVehicle.mileage?.toLocaleString()} km</span>
                        <span className="font-bold text-lg">💰 {selectedVehicle.dailyRate} DT/jour</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedVehicle(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Pricing Summary */}
            {selectedVehicle && pricing.days > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                <h3 className="text-xl font-bold text-green-900 mb-4">💰 Détails de la tarification</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-green-700">Durée de location</span>
                    <span className="font-semibold">{pricing.days} jour{pricing.days > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-green-700">Tarif journalier</span>
                    <span className="font-semibold">{pricing.dailyRate.toFixed(2)} DT</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-green-700">Sous-total</span>
                    <span className="font-semibold">{pricing.subtotal.toFixed(2)} DT</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-green-700">TVA (19%)</span>
                    <span className="font-semibold">{pricing.tax_amount.toFixed(2)} DT</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-green-700">Timbre fiscal</span>
                    <span className="font-semibold">{pricing.timbre_fiscal.toFixed(2)} DT</span>
                  </div>
                  <div className="border-t-2 border-green-300 pt-3 mt-3">
                    <div className="flex justify-between text-2xl font-bold text-green-900">
                      <span>TOTAL</span>
                      <span>{pricing.total_amount.toFixed(2)} DT</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-lg bg-amber-100 p-3 rounded-lg">
                    <span className="text-amber-800 font-semibold">Caution</span>
                    <span className="font-bold text-amber-900">{pricing.depositAmount.toFixed(2)} DT</span>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicles List */}
            {!selectedVehicle && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">🚗 Véhicules disponibles ({vehicles.length})</h3>
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle)}
                      className="bg-white p-5 rounded-lg border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">{vehicle.brand} {vehicle.model} ({vehicle.year})</h4>
                          <div className="flex gap-4 mt-2 text-slate-600">
                            <span>🚗 {vehicle.licensePlate}</span>
                            <span>📏 {vehicle.mileage?.toLocaleString()} km</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-blue-600">{vehicle.dailyRate} DT</p>
                          <p className="text-sm text-slate-600">par jour</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        // Step 3: Contract preparation and signature
        return (
          <div className="space-y-6">
            {/* Contract Preview Info */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border-2 border-purple-200">
              <h3 className="text-xl font-bold text-purple-900 mb-4">📄 Préparation du Contrat de Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Client</p>
                  <p className="font-bold text-lg">{selectedCustomer?.firstName} {selectedCustomer?.lastName}</p>
                  <p className="text-sm text-slate-600">CIN: {selectedCustomer?.cinNumber}</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Véhicule</p>
                  <p className="font-bold text-lg">{selectedVehicle?.brand} {selectedVehicle?.model}</p>
                  <p className="text-sm text-slate-600">{selectedVehicle?.licensePlate}</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Période</p>
                  <p className="font-bold">{bookingForm.startDate} → {bookingForm.endDate}</p>
                  <p className="text-sm text-slate-600">{pricing.days} jour(s)</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Montant total</p>
                  <p className="font-bold text-lg text-blue-600">{pricing.total_amount.toFixed(2)} DT</p>
                  <p className="text-sm text-slate-600">Caution: {pricing.depositAmount} DT</p>
                </div>
              </div>
            </div>

            {/* Contract Articles */}
            <div className="bg-white p-6 rounded-xl border-2 border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">📋 Articles du Contrat de Location</Label>
                <Badge variant="outline">Conforme à la législation tunisienne</Badge>
              </div>
              
              <Alert className="mb-4">
                <AlertDescription>
                  Vous pouvez personnaliser les articles du contrat selon vos besoins.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label className="font-semibold text-blue-900">Article 1 - Usage du véhicule</Label>
                  <textarea
                    value={contractArticles.article1}
                    onChange={(e) => setContractArticles({...contractArticles, article1: e.target.value})}
                    className="w-full mt-2 p-3 border rounded-lg min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="font-semibold text-blue-900">Article 2 - Territoire d'utilisation</Label>
                  <textarea
                    value={contractArticles.article2}
                    onChange={(e) => setContractArticles({...contractArticles, article2: e.target.value})}
                    className="w-full mt-2 p-3 border rounded-lg min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="font-semibold text-blue-900">Article 3 - Restitution</Label>
                  <textarea
                    value={contractArticles.article3}
                    onChange={(e) => setContractArticles({...contractArticles, article3: e.target.value})}
                    className="w-full mt-2 p-3 border rounded-lg min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="font-semibold text-blue-900">Article 4 - Prolongation</Label>
                  <textarea
                    value={contractArticles.article4}
                    onChange={(e) => setContractArticles({...contractArticles, article4: e.target.value})}
                    className="w-full mt-2 p-3 border rounded-lg min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="font-semibold text-blue-900">Article 5 - État du véhicule</Label>
                  <textarea
                    value={contractArticles.article5}
                    onChange={(e) => setContractArticles({...contractArticles, article5: e.target.value})}
                    className="w-full mt-2 p-3 border rounded-lg min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="font-semibold text-blue-900">Article 6 - Caution</Label>
                  <textarea
                    value={contractArticles.article6}
                    onChange={(e) => setContractArticles({...contractArticles, article6: e.target.value})}
                    className="w-full mt-2 p-3 border rounded-lg min-h-[60px]"
                  />
                </div>
              </div>
            </div>

            {/* Contract Acceptance */}
            <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-200">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={contractTermsAccepted}
                  onChange={(e) => setContractTermsAccepted(e.target.checked)}
                  className="w-6 h-6"
                  id="accept-terms"
                />
                <label htmlFor="accept-terms" className="text-lg font-semibold cursor-pointer">
                  Le client accepte les termes et conditions du contrat de location
                </label>
              </div>
              {contractPdfGenerated && (
                <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                  <p className="text-green-800 font-semibold">✅ Contrat préparé et prêt pour la signature</p>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        // Step 4: Payment
        return (
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-4">💳 Montant à payer</h3>
              <div className="text-4xl font-bold text-blue-600">{pricing.total_amount.toFixed(2)} DT</div>
              <p className="text-blue-700 mt-2">Location de {pricing.days} jour{pricing.days > 1 ? 's' : ''}</p>
              <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-slate-600">Sous-total</p>
                  <p className="font-bold">{pricing.subtotal.toFixed(2)} DT</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-slate-600">TVA (19%)</p>
                  <p className="font-bold">{pricing.tax_amount.toFixed(2)} DT</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-slate-600">Timbre fiscal</p>
                  <p className="font-bold">{pricing.timbre_fiscal.toFixed(2)} DT</p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-6 rounded-xl border-2 border-blue-100">
              <Label className="text-lg font-semibold mb-3 block">Mode de paiement</Label>
              <Select
                value={paymentForm.payment_method}
                onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value })}
              >
                <SelectTrigger className="h-14 text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value} className="text-lg py-3">
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Paid */}
            <div className="bg-white p-6 rounded-xl border-2 border-blue-100">
              <Label className="text-lg font-semibold mb-3 block">Montant payé</Label>
              <Input
                type="number"
                value={paymentForm.amount_paid}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: parseFloat(e.target.value) || 0 })}
                className="h-14 text-2xl font-bold text-right"
                step="0.01"
              />
              {paymentForm.amount_paid < pricing.total_amount && (
                <p className="text-red-600 mt-2 font-semibold">
                  ⚠️ Montant insuffisant. Reste à payer: {(pricing.total_amount - paymentForm.amount_paid).toFixed(2)} DT
                </p>
              )}
              {paymentForm.amount_paid >= pricing.total_amount && (
                <p className="text-green-600 mt-2 font-semibold">✅ Paiement complet</p>
              )}
            </div>

            {/* Deposit */}
            <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">Caution ({pricing.depositAmount} DT)</Label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentForm.deposit_paid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, deposit_paid: e.target.checked })}
                    className="w-6 h-6"
                  />
                  <span className="text-lg font-medium">Payée</span>
                </label>
              </div>
              
              {paymentForm.deposit_paid && (
                <Select
                  value={paymentForm.deposit_method}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, deposit_method: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white p-6 rounded-xl border-2 border-blue-100">
              <Label className="text-base font-semibold mb-2 block">Notes de paiement (optionnel)</Label>
              <Input
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Remarques sur le paiement..."
                className="h-12"
              />
            </div>

            {paymentCompleted && (
              <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="text-lg font-bold text-green-900">Paiement validé</h3>
                    <p className="text-green-700">Vous pouvez passer à l'étape suivante</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        // Step 5: Finalization
        return (
          <div className="space-y-6">
            {!rentalStarted ? (
              <>
                {/* Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border-2 border-purple-200">
                  <h3 className="text-xl font-bold text-purple-900 mb-4">🎯 Récapitulatif Final</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-slate-600">Client</p>
                      <p className="font-bold text-lg">{selectedCustomer?.firstName} {selectedCustomer?.lastName}</p>
                      <p className="text-sm">📧 {selectedCustomer?.email}</p>
                      <p className="text-sm">📱 {selectedCustomer?.phone}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-slate-600">Véhicule</p>
                      <p className="font-bold text-lg">{selectedVehicle?.brand} {selectedVehicle?.model}</p>
                      <p className="text-sm">{selectedVehicle?.licensePlate}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-slate-600">Période</p>
                      <p className="font-bold">{bookingForm.startDate} → {bookingForm.endDate}</p>
                      <p className="text-sm">{pricing.days} jour(s)</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-slate-600">Montant</p>
                      <p className="font-bold text-lg text-blue-600">{pricing.total_amount.toFixed(2)} DT</p>
                      <p className="text-sm text-green-600">✅ Payé</p>
                    </div>
                  </div>
                </div>

                {/* Contract Status */}
                <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="text-lg font-bold text-green-900">Contrat prêt</h3>
                      <p className="text-green-700">Le contrat sera créé et téléchargé automatiquement</p>
                    </div>
                  </div>
                </div>

                {/* Mileage Input */}
                <div className="bg-white p-6 rounded-xl border-2 border-blue-100">
                  <Label className="text-lg font-semibold mb-3 block">🔢 Kilométrage de départ</Label>
                  <Input
                    type="number"
                    value={startMileage}
                    onChange={(e) => setStartMileage(parseInt(e.target.value) || 0)}
                    className="h-14 text-2xl font-bold text-right"
                    placeholder="Ex: 45000"
                  />
                  <p className="text-sm text-slate-600 mt-2">Kilométrage actuel du compteur</p>
                </div>

                <Alert>
                  <AlertDescription>
                    En cliquant sur "Finaliser", le système va:
                    <ul className="list-disc ml-6 mt-2">
                      <li>Créer la réservation</li>
                      <li>Générer et enregistrer le contrat</li>
                      <li>Enregistrer les paiements</li>
                      <li>Démarrer la location</li>
                      <li>Télécharger le contrat PDF</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <div className="bg-green-50 p-8 rounded-xl border-2 border-green-200 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-900 mb-2">Location démarrée avec succès!</h3>
                <p className="text-green-700 text-lg">Le contrat a été téléchargé</p>
                <Button 
                  onClick={() => window.location.href = '/owner/bookings'} 
                  className="mt-6"
                  size="lg"
                >
                  Voir les réservations
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Nouvelle Location
              </h1>
              <p className="text-slate-600 mt-2 text-lg">Processus guidé en 5 étapes simples</p>
            </div>
            <div>
              <Label className="text-base mb-2 block">Agence *</Label>
              <Select 
                value={selectedAgencyId} 
                onValueChange={setSelectedAgencyId}
                disabled={currentStep > 1 || loading}
              >
                <SelectTrigger className="w-80 h-12 text-base">
                  <SelectValue placeholder="Sélectionner une agence" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id} className="text-base">
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`
                        w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                        ${isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl scale-110' : ''}
                        ${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-slate-200 text-slate-500' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-8 w-8" />
                      ) : (
                        <Icon className="h-8 w-8" />
                      )}
                    </div>
                    <div className="text-center mt-3">
                      <p className={`font-bold ${isActive ? 'text-blue-600' : 'text-slate-700'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{step.description}</p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="flex-1 mx-4 mb-12">
                      <div
                        className={`h-2 w-full transition-all duration-500 rounded-full ${
                          isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6 text-lg py-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-300 bg-green-50 text-lg py-4">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 min-h-[500px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || loading}
            size="lg"
            className="h-14 px-8 text-lg"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Précédent
          </Button>
          
          <div className="text-center">
            <p className="text-slate-600 text-sm">Étape {currentStep} sur {STEPS.length}</p>
          </div>

          <Button
            onClick={handleNext}
            disabled={loading || !selectedAgencyId || rentalStarted}
            size="lg"
            className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Traitement...
              </>
            ) : currentStep === 5 ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Finaliser la location
              </>
            ) : currentStep === 3 && !contractPdfGenerated ? (
              <>
                <FileText className="h-5 w-5 mr-2" />
                Préparer le contrat
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
