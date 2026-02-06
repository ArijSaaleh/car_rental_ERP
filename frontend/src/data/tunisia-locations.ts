// Données des gouvernorats et villes de Tunisie

export interface City {
  name: string;
  governorate: string;
}

export interface Governorate {
  code: string;
  name: string;
  cities: string[];
}

export const TUNISIA_GOVERNORATES: Governorate[] = [
  {
    code: 'TUN',
    name: 'Tunis',
    cities: [
      'Tunis',
      'Le Bardo',
      'Le Kram',
      'La Goulette',
      'Carthage',
      'Sidi Bou Said',
      'La Marsa',
      'Sidi Hassine'
    ]
  },
  {
    code: 'ARI',
    name: 'Ariana',
    cities: [
      'Ariana',
      'La Soukra',
      'Raoued',
      'Kalâat el-Andalous',
      'Sidi Thabet',
      'Ettadhamen',
      'Mnihla'
    ]
  },
  {
    code: 'BEN',
    name: 'Ben Arous',
    cities: [
      'Ben Arous',
      'El Mourouj',
      'Hammam Lif',
      'Hammam Chott',
      'Bou Mhel el-Bassatine',
      'Ezzahra',
      'Radès',
      'Mégrine',
      'Mohamedia',
      'Fouchana'
    ]
  },
  {
    code: 'MAN',
    name: 'Manouba',
    cities: [
      'Manouba',
      'Den Den',
      'Douar Hicher',
      'Oued Ellil',
      'Mornaguia',
      'Borj El Amri',
      'Tebourba',
      'El Battan'
    ]
  },
  {
    code: 'NAB',
    name: 'Nabeul',
    cities: [
      'Nabeul',
      'Hammamet',
      'Kelibia',
      'Menzel Temime',
      'Korba',
      'Grombalia',
      'Dar Chaâbane El Fehri',
      'Béni Khiar',
      'El Haouaria',
      'Soliman',
      'Menzel Bouzelfa'
    ]
  },
  {
    code: 'ZAG',
    name: 'Zaghouan',
    cities: [
      'Zaghouan',
      'El Fahs',
      'Bir Mcherga',
      'Nadhour',
      'Saouaf',
      'Zriba'
    ]
  },
  {
    code: 'BIZ',
    name: 'Bizerte',
    cities: [
      'Bizerte',
      'Menzel Bourguiba',
      'Menzel Jemil',
      'Mateur',
      'Sejnane',
      'Joumine',
      'Tinja',
      'Ghar El Melh',
      'Utique',
      'El Alia',
      'Zarzouna'
    ]
  },
  {
    code: 'BEJ',
    name: 'Béja',
    cities: [
      'Béja',
      'Medjez el-Bab',
      'Testour',
      'Nefza',
      'Téboursouk',
      'Amdoun',
      'Goubellat',
      'Thibar'
    ]
  },
  {
    code: 'JEN',
    name: 'Jendouba',
    cities: [
      'Jendouba',
      'Tabarka',
      'Aïn Draham',
      'Fernana',
      'Ghardimaou',
      'Bou Salem',
      'Oued Meliz'
    ]
  },
  {
    code: 'KEF',
    name: 'Le Kef',
    cities: [
      'Le Kef',
      'Dahmani',
      'Tajerouine',
      'Nebeur',
      'Sakiet Sidi Youssef',
      'Kalâat Senan',
      'Kalâat Khasba',
      'Jerissa',
      'El Ksour'
    ]
  },
  {
    code: 'SIL',
    name: 'Siliana',
    cities: [
      'Siliana',
      'Bou Arada',
      'Gaâfour',
      'El Krib',
      'Makthar',
      'Rouhia',
      'Kesra',
      'Bargou',
      'El Aroussa'
    ]
  },
  {
    code: 'SOU',
    name: 'Sousse',
    cities: [
      'Sousse',
      'Hammam Sousse',
      'Msaken',
      'Kalâa Kebira',
      'Akouda',
      'Kalâa Seghira',
      'Sidi Bou Ali',
      'Hergla',
      'Enfidha',
      'Bouficha',
      'Kondar',
      'Sidi El Hani'
    ]
  },
  {
    code: 'MON',
    name: 'Monastir',
    cities: [
      'Monastir',
      'Moknine',
      'Jemmal',
      'Ksar Hellal',
      'Téboulba',
      'Sahline',
      'Ksibet el-Médiouni',
      'Zéramdine',
      'Bembla',
      'Ouerdanine',
      'Bekalta',
      'Beni Hassen'
    ]
  },
  {
    code: 'MAH',
    name: 'Mahdia',
    cities: [
      'Mahdia',
      'Ksour Essef',
      'El Jem',
      'Chebba',
      'Melloulèche',
      'Sidi Alouane',
      'Bou Merdes',
      'Ouled Chamekh',
      'Hebira',
      'Essouassi'
    ]
  },
  {
    code: 'SFA',
    name: 'Sfax',
    cities: [
      'Sfax',
      'Sakiet Ezzit',
      'Sakiet Eddaïer',
      'Bir Ali Ben Khélifa',
      'Agareb',
      'Jebiniana',
      'El Hencha',
      'Menzel Chaker',
      'Mahares',
      'Kerkennah',
      'El Amra',
      'Ghraiba'
    ]
  },
  {
    code: 'KAI',
    name: 'Kairouan',
    cities: [
      'Kairouan',
      'Haffouz',
      'Sbikha',
      'Nasrallah',
      'Chebika',
      'Oueslatia',
      'Hajeb El Ayoun',
      'El Alâa',
      'Menzel Mehiri',
      'Echrarda',
      'Bou Hajla'
    ]
  },
  {
    code: 'KAS',
    name: 'Kasserine',
    cities: [
      'Kasserine',
      'Sbeitla',
      'Sbiba',
      'Fériana',
      'Thala',
      'Foussana',
      'Hassi El Ferid',
      'Mejel Bel Abbès',
      'El Ayoun',
      'Jedeliane',
      'Hidra'
    ]
  },
  {
    code: 'SID',
    name: 'Sidi Bouzid',
    cities: [
      'Sidi Bouzid',
      'Jilma',
      'Regueb',
      'Mezzouna',
      'Meknassy',
      'Menzel Bouzaiene',
      'Bir El Hafey',
      'Sidi Ali Ben Aoun',
      'Ouled Haffouz',
      'Souk Jedid'
    ]
  },
  {
    code: 'GAB',
    name: 'Gabès',
    cities: [
      'Gabès',
      'Mareth',
      'El Hamma',
      'Métouia',
      'Menzel El Habib',
      'Matmata',
      'Nouvelle Matmata',
      'Ghannouch',
      'El Metouia'
    ]
  },
  {
    code: 'MED',
    name: 'Médenine',
    cities: [
      'Médenine',
      'Houmt Souk (Djerba)',
      'Midoun (Djerba)',
      'Zarzis',
      'Ben Gardane',
      'Ajim',
      'Beni Khedache',
      'Sidi Makhlouf'
    ]
  },
  {
    code: 'TAT',
    name: 'Tataouine',
    cities: [
      'Tataouine',
      'Ghomrassen',
      'Remada',
      'Bir Lahmar',
      'Dehiba',
      'Smar'
    ]
  },
  {
    code: 'GFS',
    name: 'Gafsa',
    cities: [
      'Gafsa',
      'El Ksar',
      'Métlaoui',
      'Moularès',
      'Redeyef',
      'Mdhila',
      'El Guettar',
      'Sened',
      'Belkhir'
    ]
  },
  {
    code: 'TOZ',
    name: 'Tozeur',
    cities: [
      'Tozeur',
      'Nefta',
      'Degache',
      'Tamerza',
      'Hazoua'
    ]
  },
  {
    code: 'KEB',
    name: 'Kébili',
    cities: [
      'Kébili',
      'Douz',
      'Souk Lahad',
      'Faouar'
    ]
  }
];

// Helper functions
export const getGovernorateByCode = (code: string): Governorate | undefined => {
  return TUNISIA_GOVERNORATES.find(gov => gov.code === code);
};

export const getGovernorateByName = (name: string): Governorate | undefined => {
  return TUNISIA_GOVERNORATES.find(gov => gov.name === name);
};

export const getCitiesByGovernorate = (governorateName: string): string[] => {
  const gov = getGovernorateByName(governorateName);
  return gov ? gov.cities : [];
};

export const getAllCities = (): City[] => {
  const cities: City[] = [];
  TUNISIA_GOVERNORATES.forEach(gov => {
    gov.cities.forEach(city => {
      cities.push({ name: city, governorate: gov.name });
    });
  });
  return cities;
};
