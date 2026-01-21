import { useState, useEffect } from 'react';
import { TUNISIA_GOVERNORATES, getCitiesByGovernorate } from '../data/tunisia-locations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface GovernorateSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function GovernorateSelect({
  value,
  onChange,
  placeholder = 'Sélectionner un gouvernorat',
  disabled = false
}: GovernorateSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {TUNISIA_GOVERNORATES.map((gov) => (
          <SelectItem key={gov.code} value={gov.name}>
            {gov.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface CitySelectProps {
  governorate?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CitySelect({
  governorate,
  value,
  onChange,
  placeholder = 'Sélectionner une ville',
  disabled = false
}: CitySelectProps) {
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (governorate) {
      const governorateCities = getCitiesByGovernorate(governorate);
      setCities(governorateCities);
      // Si la ville sélectionnée n'est pas dans le nouveau gouvernorat, réinitialiser
      if (value && !governorateCities.includes(value)) {
        onChange('');
      }
    } else {
      setCities([]);
      onChange('');
    }
  }, [governorate]);

  return (
    <Select 
      value={value} 
      onValueChange={onChange} 
      disabled={disabled || !governorate || cities.length === 0}
    >
      <SelectTrigger>
        <SelectValue placeholder={governorate ? placeholder : 'Sélectionner d\'abord un gouvernorat'} />
      </SelectTrigger>
      <SelectContent>
        {cities.map((city) => (
          <SelectItem key={city} value={city}>
            {city}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface LocationSelectorsProps {
  governorate?: string;
  city?: string;
  onGovernorateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  disabled?: boolean;
}

export function LocationSelectors({
  governorate,
  city,
  onGovernorateChange,
  onCityChange,
  disabled = false
}: LocationSelectorsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Gouvernorat <span className="text-red-500">*</span>
        </label>
        <GovernorateSelect
          value={governorate}
          onChange={onGovernorateChange}
          disabled={disabled}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Ville <span className="text-red-500">*</span>
        </label>
        <CitySelect
          governorate={governorate}
          value={city}
          onChange={onCityChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
