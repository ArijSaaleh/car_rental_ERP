# Phase 2 - Guide Complet

## 📋 Vue d'ensemble Phase 2 - "Pro Plan"

La Phase 2 ajoute les fonctionnalités critiques pour le lancement commercial de la plateforme SaaS de location de voitures, en se concentrant sur:
- **Module Réservation** avec gestion de disponibilité
- **Contrats PDF** conformes à la législation tunisienne
- **Signature électronique** sur tablette/PC
- **Paiements en ligne** (Paymee, ClicToPay)
- **PWA Agent de Parc** pour inspections mobiles
- **Reporting Pro** avec KPIs essentiels

---

## 🎯 Fonctionnalités Développées

### 1. Module Planning et Réservation

#### Backend
**Modèles créés:**
- `Booking` - Réservations avec calcul automatique de prix
- `Customer` - Clients (particuliers et entreprises)
- Relations multi-tenant avec véhicules et agences

**Service de disponibilité (`booking_service.py`):**
```python
# Vérification de disponibilité avec détection de conflits
BookingService.check_vehicle_availability(db, vehicle_id, start_date, end_date, agency_id)

# Liste des véhicules disponibles avec filtres
BookingService.get_available_vehicles(db, agency_id, start_date, end_date, filters)

# Calcul automatique de prix (TND avec timbre fiscal)
BookingService.calculate_rental_price(db, vehicle_id, start_date, end_date, agency_id)
```

**Endpoints API (`/api/v1/bookings`):**
- `POST /check-availability` - Vérifier disponibilité + conflits + pricing
- `GET /available-vehicles` - Liste véhicules dispo avec filtres (brand, fuel_type, etc.)
- `POST /` - Créer réservation (avec vérification auto de disponibilité)
- `GET /` - Liste réservations (filtres: status, vehicle_id, customer_id)
- `GET /{booking_id}` - Détail réservation
- `PUT /{booking_id}` - Modifier réservation (re-check disponibilité)
- `DELETE /{booking_id}` - Annuler réservation (soft delete)
- `GET /vehicle/{vehicle_id}/calendar` - Calendrier de réservations

**Logique de conflit:**
Détection automatique de chevauchement de dates entre réservations (CONFIRMED, IN_PROGRESS, PENDING).

---

### 2. Module Contrat et Facturation

#### Génération PDF Conforme (Tunisie)
**Service PDF (`pdf_service.py`):**
- Utilise **ReportLab** pour génération PDF
- Template professionnel avec en-tête agence
- **Timbre fiscal** obligatoire: 0.600 TND
- Informations client (CIN, permis de conduire)
- Détails véhicule (immatriculation, kilométrage départ)
- Conditions Générales de Location (CGL) personnalisables
- Signature manuelle ou électronique

**Endpoints API (`/api/v1/contracts`):**
- `POST /` - Créer contrat pour une réservation
- `GET /` - Liste contrats
- `GET /{contract_id}` - Détail contrat
- `GET /{contract_id}/pdf` - **Télécharger PDF** (streaming)
- `POST /{contract_id}/generate-pdf` - Générer et sauvegarder PDF
- `POST /{contract_id}/sign/customer` - **Signature électronique client**
- `POST /{contract_id}/sign/agent` - **Signature électronique agent**
- `PUT /{contract_id}` - Modifier contrat (draft uniquement)

**Fonctionnalités signature:**
- Stockage signature en Base64 (canvas pad)
- Horodatage et IP du signataire
- Acceptation des CGL avec timestamp
- Contrat = SIGNED quand les 2 parties ont signé

---

### 3. Module Paiement

#### Intégration Passerelles Tunisiennes
**Service Paiement (`payment_service.py`):**

**Paymee (Tunisie):**
```python
# Initier paiement
initiate_paymee_payment(payment, return_url, cancel_url, webhook_url, vendor_token)

# Vérifier webhook
verify_paymee_webhook(payload, signature, secret_key)

# Traiter confirmation
process_paymee_webhook(db, payment_reference, webhook_data)
```

**ClicToPay (Banques Tunisiennes):**
```python
# Initier paiement avec signature SHA256
initiate_clictopay_payment(payment, return_url, merchant_id, secret_key)
```

**Autres méthodes:**
- Espèces (cash)
- Carte bancaire
- Virement bancaire

**Endpoints API (`/api/v1/payments`):**
- `POST /` - Créer paiement
- `POST /{payment_id}/initiate/paymee` - Lancer paiement Paymee
- `POST /webhook/paymee` - **Webhook confirmation Paymee**
- `POST /{payment_id}/confirm-cash` - Confirmer paiement espèces
- `GET /` - Liste paiements
- `GET /stats` - Statistiques paiements (CA total, paiements en attente)
- `GET /{payment_id}` - Détail paiement

**Gestion webhook:**
- Vérification signature HMAC SHA256
- Mise à jour automatique statut réservation
- Calcul frais passerelle (~3% Paymee)

---

### 4. PWA Agent de Parc

#### Interface Mobile Progressive Web App
**Fichiers créés:**
- `manifest.json` - Configuration PWA
- `service-worker.js` - Offline support
- `AgentPark.tsx` - Interface inspection véhicule

**Fonctionnalités PWA:**
- 📸 **Accès caméra** (facingMode: environment)
- 📷 **Capture photos** multiples avec aperçu
- 🚗 **Formulaire inspection:**
  - Plaque d'immatriculation
  - Type inspection (départ/retour)
  - Kilométrage
  - Niveau carburant (plein, 3/4, 1/2, 1/4, vide)
  - Dommages visibles
  - Notes additionnelles
- 💾 **Stockage local** avec service worker
- 📱 **Installation mobile** (Add to Home Screen)

**Permissions requises:**
```json
"permissions": ["camera", "geolocation"]
```

**Usage:**
Agents de parc peuvent inspecter véhicules directement depuis smartphone/tablette avec photos en temps réel.

---

### 5. Reporting Pro

#### Dashboard KPIs Essentiels
**Service Reporting (`reporting_service.py`):**

**Taux d'occupation:**
```python
# Calcul: (Jours loués / Jours disponibles totaux) × 100
get_occupancy_rate(db, agency_id, start_date, end_date)
```

**Chiffre d'affaires:**
```python
# CA brut, frais passerelle, CA net
# Répartition par méthode de paiement
get_revenue_report(db, agency_id, start_date, end_date)
get_monthly_revenue(db, agency_id, year, month)
```

**État flotte:**
```python
# Comptage par statut (disponible, loué, maintenance, etc.)
get_fleet_status(db, agency_id)
```

**Top véhicules:**
```python
# Véhicules les plus loués avec CA généré
get_top_vehicles(db, agency_id, limit=5)
```

**Endpoints API (`/api/v1/reports`):**
- `GET /dashboard/summary` - **Résumé complet** (taux occupation + CA + flotte + réservations)
- `GET /occupancy-rate` - Taux occupation période
- `GET /revenue` - CA période
- `GET /revenue/monthly` - CA mensuel
- `GET /fleet-status` - État flotte
- `GET /top-vehicles` - Top véhicules rentables

**Accès:**
Tous les endpoints requièrent rôle `MANAGER` minimum.

---

## 🗄️ Nouveaux Modèles de Données

### Customer
```python
- CIN (Carte Identité Nationale) Tunisie
- Permis de conduire (numéro, validité, catégorie)
- Type: particulier / entreprise
- Matricule fiscal (si entreprise)
- Blacklist support
```

### Booking
```python
- Numéro réservation (RES-YYYYMMDD-XXXX)
- Dates (start_date, end_date, pickup_datetime, return_datetime)
- Tarification (daily_rate, subtotal, tax, timbre_fiscal, total)
- Kilométrage (initial, final, limite, tarif km sup.)
- Carburant (niveau départ/retour, politique)
- Statuts (booking, payment)
```

### Contract
```python
- Numéro contrat (CTR-...)
- PDF (URL, chemin stockage, timestamp génération)
- Signatures électroniques (client + agent) en Base64
- CGL (Conditions Générales de Location)
- Clauses spécifiques (JSON)
- Timbre fiscal: 0.600 TND
- Langue contrat (fr/ar)
```

### Payment
```python
- Référence (PAY-...)
- Méthode (cash, card, paymee, clictopay, etc.)
- Type (rental_fee, deposit, extra_charges, refund)
- Passerelle (gateway, transaction_id, response, frais)
- Webhook (timestamp, callback_url)
- Carte (last4, brand) - tokenisée
```

---

## 📊 Conformité Tunisienne

### Aspects Légaux Implémentés

1. **Timbre Fiscal:**
   - Montant: 0.600 TND (obligatoire)
   - Inclus dans tous les contrats PDF
   - Ajouté automatiquement au total

2. **Documents d'Identité:**
   - Support CIN (Carte Identité Nationale)
   - Permis de conduire avec validité
   - Matricule fiscal pour entreprises

3. **Devise:**
   - Dinar Tunisien (TND)
   - 3 décimales (millimes)
   - Code ISO 4217: 788

4. **Passerelles Paiement:**
   - Paymee (plateforme tunisienne)
   - ClicToPay (banques tunisiennes)
   - Support espèces et virement bancaire

---

## 🚀 API Endpoints Complets

### Réservations
```
POST   /api/v1/bookings/check-availability
GET    /api/v1/bookings/available-vehicles
POST   /api/v1/bookings
GET    /api/v1/bookings
GET    /api/v1/bookings/{booking_id}
PUT    /api/v1/bookings/{booking_id}
DELETE /api/v1/bookings/{booking_id}
GET    /api/v1/bookings/vehicle/{vehicle_id}/calendar
```

### Contrats
```
POST   /api/v1/contracts
GET    /api/v1/contracts
GET    /api/v1/contracts/{contract_id}
GET    /api/v1/contracts/{contract_id}/pdf
POST   /api/v1/contracts/{contract_id}/generate-pdf
POST   /api/v1/contracts/{contract_id}/sign/customer
POST   /api/v1/contracts/{contract_id}/sign/agent
PUT    /api/v1/contracts/{contract_id}
```

### Paiements
```
POST   /api/v1/payments
POST   /api/v1/payments/{payment_id}/initiate/paymee
POST   /api/v1/payments/webhook/paymee
POST   /api/v1/payments/{payment_id}/confirm-cash
GET    /api/v1/payments
GET    /api/v1/payments/stats
GET    /api/v1/payments/{payment_id}
```

### Reporting
```
GET    /api/v1/reports/dashboard/summary
GET    /api/v1/reports/occupancy-rate
GET    /api/v1/reports/revenue
GET    /api/v1/reports/revenue/monthly
GET    /api/v1/reports/fleet-status
GET    /api/v1/reports/top-vehicles
```

---

## 🔧 Configuration Requise

### Dépendances Backend (ajoutées)
```txt
reportlab==4.0.7      # Génération PDF
requests==2.31.0      # HTTP pour passerelles de paiement
```

### Variables d'Environnement
```env
# Paymee
PAYMEE_VENDOR_TOKEN=your_vendor_token
PAYMEE_SECRET_KEY=your_secret_key

# ClicToPay
CLICTOPAY_MERCHANT_ID=your_merchant_id
CLICTOPAY_SECRET_KEY=your_secret_key

# Stockage PDF
PDF_STORAGE_DIR=storage/contracts
```

---

## 📱 Installation PWA

### Étapes Client
1. Accéder à `/agent` depuis smartphone
2. Menu navigateur → "Ajouter à l'écran d'accueil"
3. L'icône PWA apparaît sur l'écran d'accueil
4. Lancement en mode standalone (fullscreen)

### Fonctionnement Offline
- Service worker cache les ressources essentielles
- Interface utilisable sans connexion
- Synchronisation auto lors de reconnexion

---

## 🎨 Frontend à Développer (Phase suivante)

Les composants React suivants doivent être créés:
- `BookingCalendar.tsx` - Calendrier de disponibilité
- `ContractViewer.tsx` - Visualisation contrat avec signature pad
- `PaymentForm.tsx` - Formulaire paiement multi-passerelles
- `ReportingDashboard.tsx` - Dashboard KPIs avec graphiques
- `CustomerForm.tsx` - Formulaire client (CIN, permis)

---

## ✅ Tests Recommandés

### Scénarios Phase 2
1. **Réservation:**
   - Vérifier disponibilité → conflit détecté
   - Créer réservation → calcul prix correct (timbre fiscal)
   - Modifier dates → re-check disponibilité

2. **Contrat:**
   - Générer PDF → timbre fiscal présent
   - Signature électronique → Base64 stocké
   - Télécharger PDF → formatage correct

3. **Paiement:**
   - Paymee: initier → URL retournée
   - Webhook → statut mis à jour
   - Espèces → confirmation manuelle

4. **PWA:**
   - Caméra → capture fonctionnelle
   - Photos → stockage local
   - Installation → icône home screen

5. **Reporting:**
   - Taux occupation → calcul précis
   - CA mensuel → total correct
   - Dashboard → toutes stats affichées

---

## 📝 Prochaines Étapes (Phase 3)

- Authentification par SMS (OTP)
- Notifications push PWA
- Gestion des assurances
- Module de facturation avancée
- Export PDF factures
- Intégration comptable
- Multi-langue (Français/Arabe)

---

## 🆘 Support

Pour questions sur la Phase 2:
- Backend: Voir `/api/docs` (Swagger UI)
- Modèles: `backend/app/models/`
- Services: `backend/app/services/`
- API: `backend/app/api/v1/endpoints/`

---

**Phase 2 Complétée ✅**
Tous les modules critiques pour le lancement commercial sont opérationnels.
