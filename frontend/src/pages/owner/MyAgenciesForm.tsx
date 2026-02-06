import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
// import { Alert, AlertDescription } from '../../components/ui/alert';
import type { Agency } from '../../types';
import { TUNISIA_GOVERNORATES } from '../../data/tunisia-locations';

interface MyAgenciesFormProps {
  agency: Agency | null;
  onSubmit: (data: Partial<Agency>) => void;
  onCancel: () => void;
}

export default function MyAgenciesForm({ agency, onSubmit, onCancel }: MyAgenciesFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Tunisie',
    subscriptionPlan: 'BASIQUE' as 'BASIQUE' | 'STANDARD' | 'PREMIUM' | 'ENTREPRISE',
    isActive: true,
    currency: 'TND',
    language: 'fr',
    timezone: 'Africa/Tunis',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name || '',
        legalName: agency.legalName || '',
        taxId: agency.taxId || '',
        email: agency.email || '',
        phone: agency.phone || '',
        address: agency.address || '',
        city: agency.city || '',
        postalCode: agency.postalCode || '',
        country: agency.country || 'Tunisie',
        subscriptionPlan: agency.subscriptionPlan || 'BASIQUE',
        isActive: agency.isActive !== undefined ? agency.isActive : true,
        currency: agency.currency || 'TND',
        language: agency.language || 'fr',
        timezone: agency.timezone || 'Africa/Tunis',
      });

      // Set governorate based on city
      const gov = TUNISIA_GOVERNORATES.find((g) => g.cities.includes(agency.city));
      if (gov) {
        setSelectedGovernorate(gov.code);
        setAvailableCities(gov.cities);
      }
    }
  }, [agency]);

  const handleGovernorateChange = (governorateCode: string) => {
    setSelectedGovernorate(governorateCode);
    const governorate = TUNISIA_GOVERNORATES.find((g) => g.code === governorateCode);
    if (governorate) {
      setAvailableCities(governorate.cities);
      setFormData({ ...formData, city: '' });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom commercial est requis';
    }

    if (!formData.legalName.trim()) {
      newErrors.legalName = 'La raison sociale est requise';
    }

    if (!formData.taxId.trim()) {
      newErrors.taxId = 'Le numéro fiscal est requis';
    } else if (!/^\d+$/.test(formData.taxId)) {
      newErrors.taxId = 'Le numéro fiscal doit contenir uniquement des chiffres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!/^\+?\d{8,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Format de téléphone invalide';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'L\'adresse est requise';
    }

    if (!formData.city) {
      newErrors.city = 'La ville est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informations Générales</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom Commercial <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nom de l'agence"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="legalName">
              Raison Sociale <span className="text-red-500">*</span>
            </Label>
            <Input
              id="legalName"
              value={formData.legalName}
              onChange={(e) => handleInputChange('legalName', e.target.value)}
              placeholder="Raison sociale légale"
              className={errors.legalName ? 'border-red-500' : ''}
            />
            {errors.legalName && (
              <p className="text-sm text-red-500">{errors.legalName}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxId">
            Numéro d'Identification Fiscale <span className="text-red-500">*</span>
          </Label>
          <Input
            id="taxId"
            value={formData.taxId}
            onChange={(e) => handleInputChange('taxId', e.target.value)}
            placeholder="Ex: 1234567A"
            className={errors.taxId ? 'border-red-500' : ''}
          />
          {errors.taxId && (
            <p className="text-sm text-red-500">{errors.taxId}</p>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Coordonnées</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="contact@agence.tn"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Téléphone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+216 XX XXX XXX"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Adresse</h3>
        
        <div className="space-y-2">
          <Label htmlFor="address">
            Adresse Complète <span className="text-red-500">*</span>
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Rue, numéro, etc."
            className={errors.address ? 'border-red-500' : ''}
          />
          {errors.address && (
            <p className="text-sm text-red-500">{errors.address}</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="governorate">
              Gouvernorat <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedGovernorate} onValueChange={handleGovernorateChange}>
              <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {TUNISIA_GOVERNORATES.map((gov) => (
                  <SelectItem key={gov.code} value={gov.code}>
                    {gov.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">
              Ville <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.city}
              onValueChange={(value) => handleInputChange('city', value)}
              disabled={!selectedGovernorate}
            >
              <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.city && (
              <p className="text-sm text-red-500">{errors.city}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode">Code Postal</Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              placeholder="Ex: 1000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Pays</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            placeholder="Tunisie"
          />
        </div>
      </div>

      {/* Subscription Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Abonnement</h3>
        
        <div className="space-y-2">
          <Label htmlFor="subscriptionPlan">Plan d'Abonnement</Label>
          <Select
            value={formData.subscriptionPlan}
            onValueChange={(value: any) => handleInputChange('subscriptionPlan', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BASIQUE">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Basique</span>
                  <span className="text-xs text-slate-500">
                    Fonctionnalités de base
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="STANDARD">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Standard</span>
                  <span className="text-xs text-slate-500">
                    Fonctionnalités avancées
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="PREMIUM">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Premium</span>
                  <span className="text-xs text-slate-500">
                    Toutes les fonctionnalités
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="ENTREPRISE">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Entreprise</span>
                  <span className="text-xs text-slate-500">
                    Solutions personnalisées
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleInputChange('isActive', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300"
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Agence active
          </Label>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Paramètres Régionaux</h3>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="currency">Devise</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => handleInputChange('currency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TND">TND (Dinar Tunisien)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="USD">USD (Dollar US)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Langue</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => handleInputChange('language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Fuseau Horaire</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => handleInputChange('timezone', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Africa/Tunis">Africa/Tunis (GMT+1)</SelectItem>
                <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {agency ? 'Mettre à Jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
