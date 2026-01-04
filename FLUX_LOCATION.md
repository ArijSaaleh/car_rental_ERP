# 🚗 Flux de Location - Car Rental ERP

## Vue d'ensemble du système

Le système de location fonctionne en 4 étapes principales :

```
1. CLIENT → 2. RÉSERVATION → 3. CONTRAT → 4. LOCATION ACTIVE
```

---

## 📋 1. Gestion des Clients

### Création d'un client (AVANT la location)

**Où ?** Menu Owner → "Gestion des Clients" (`ClientManagement.tsx`)

**Informations requises :**
- ✅ **Identité** : Prénom, Nom, Email, Téléphone
- ✅ **CIN** : Numéro, Date d'émission, Date d'expiration
- ✅ **Permis de conduire** : Numéro, Catégorie, Dates
- ✅ **Adresse** : Adresse complète, Ville, Code postal
- ⚠️ **Type** : Particulier ou Entreprise
  - Si Entreprise : Matricule fiscal, RNE, Raison sociale

**Pourquoi créer le client avant ?**
- ✅ Base de données clients réguliers
- ✅ Vérification des documents en amont
- ✅ Historique client
- ✅ Liste noire (clients à problèmes)

---

## 📅 2. Création d'une Réservation (Booking)

### Flux de réservation

**Où ?** Menu → "Réservations" (`Bookings.tsx`)

**Étape 1 : Sélection**
```
1. Choisir l'agence
2. Sélectionner le client (déjà créé)
3. Choisir le véhicule (disponible)
4. Définir les dates (début/fin)
```

**Étape 2 : Détails financiers**
```
- Tarif journalier (du véhicule)
- Nombre de jours
- Sous-total = tarif × jours
- TVA (19% en Tunisie)
- Timbre fiscal (0.600 TND obligatoire)
- Caution (deposit)
```

**Étape 3 : Conditions**
```
- Kilométrage initial
- Limite kilométrique incluse
- Tarif par km supplémentaire
- Niveau de carburant (plein/3-4/moitié/1-4/vide)
- Politique carburant (plein à plein)
```

**États de la réservation :**
- 🟡 `PENDING` - En attente de confirmation
- 🟢 `CONFIRMED` - Confirmée, véhicule réservé
- 🔵 `IN_PROGRESS` - En cours (client a récupéré le véhicule)
- ✅ `COMPLETED` - Terminée (véhicule rendu)
- ❌ `CANCELLED` - Annulée

---

## 📄 3. Génération du Contrat

### Contrat automatique

**Quand ?** Automatiquement lors de la confirmation de la réservation

**Contenu du contrat :**
```
┌─────────────────────────────────────────┐
│  CONTRAT DE LOCATION N° XXX-2024       │
├─────────────────────────────────────────┤
│  Agence : [Nom de l'agence]            │
│  Client : [Nom complet]                │
│  CIN : [Numéro CIN]                    │
│  Permis : [Numéro permis]              │
│                                         │
│  Véhicule : [Marque Modèle]            │
│  Plaque : [123 TU 4567]                │
│  VIN : [17 caractères]                 │
│                                         │
│  Période : [01/01/2025 - 05/01/2025]   │
│  Durée : 4 jours                       │
│                                         │
│  Tarif journalier : 150.000 TND        │
│  Sous-total : 600.000 TND              │
│  TVA 19% : 114.000 TND                 │
│  Timbre fiscal : 0.600 TND             │
│  TOTAL : 714.600 TND                   │
│                                         │
│  Caution : 500.000 TND                 │
│                                         │
│  ─────────────────────────────────────  │
│  CONDITIONS GÉNÉRALES DE LOCATION      │
│  [Texte CGL de l'agence]               │
│                                         │
│  CLAUSES SPÉCIALES                     │
│  - Kilométrage limité : 200 km/jour    │
│  - Supplément km : 0.500 TND/km        │
│  - Plein à plein obligatoire           │
│  - Assurance tous risques incluse      │
│                                         │
│  ─────────────────────────────────────  │
│  SIGNATURE CLIENT    SIGNATURE AGENT    │
│  [Pad signature]     [Pad signature]    │
│  Date: ___________   Date: ___________  │
└─────────────────────────────────────────┘
```

**Statuts du contrat :**
- 📝 `DRAFT` - Brouillon
- ⏳ `PENDING_SIGNATURE` - En attente de signature
- ✍️ `SIGNED` - Signé (par les 2 parties)
- ✅ `COMPLETED` - Complété
- ❌ `CANCELLED` - Annulé

**Signature électronique :**
```javascript
1. Client signe sur tablette/écran (signature pad)
2. Système enregistre :
   - Données signature (base64)
   - Timestamp
   - Adresse IP
3. Agent contre-signe
4. PDF généré avec les 2 signatures
5. Stockage : local ou S3
```

---

## 🚙 4. Location Active

### Changement d'état du véhicule

**Quand le booking passe à "IN_PROGRESS" :**
```sql
UPDATE vehicles 
SET status = 'loue' 
WHERE id = vehicle_id;
```

**Affichage dans "Gestion de la Flotte" :**
```
┌────────────────────────────────────────────────────┐
│ Plaque │ Véhicule        │ Statut │ Loué à        │
├────────┼─────────────────┼────────┼───────────────┤
│ 123TU1 │ Renault Clio    │ 🔵 Loué│ 👤 Ahmed Ben  │
│        │                 │        │ 📞 +216 12... │
│        │                 │        │ 📅 01-05/01   │
├────────┼─────────────────┼────────┼───────────────┤
│ 456TU2 │ Peugeot 208     │ 🟢 Disp│ -             │
└────────────────────────────────────────────────────┘
```

### Informations visibles :
- ✅ Nom du client
- ✅ Numéro de téléphone
- ✅ Dates de location (début - fin)
- ✅ Numéro de réservation
- ✅ Statut du booking

---

## 🔄 Flux Complet (Exemple)

### Scénario : Ahmed veut louer une Clio pour 4 jours

#### **Jour -7 : Pré-enregistrement du client**
```
1. Agent ouvre "Gestion des Clients"
2. Clique "Nouveau Client"
3. Remplit :
   - Nom : Ahmed Ben Salah
   - CIN : 12345678
   - Permis : TUN123456
   - Tél : +216 12345678
4. Sauvegarde → Client créé dans la base
```

#### **Jour -1 : Création de la réservation**
```
1. Agent ouvre "Réservations"
2. Clique "Nouvelle Réservation"
3. Sélectionne :
   - Client : Ahmed Ben Salah (recherche par nom/CIN)
   - Véhicule : Renault Clio (123 TU 1234) - DISPONIBLE
   - Dates : 01/01/2025 → 05/01/2025 (4 jours)
4. Système calcule :
   - Tarif : 150 TND/jour
   - Sous-total : 600 TND
   - TVA : 114 TND
   - Timbre : 0.600 TND
   - TOTAL : 714.600 TND
5. Définit :
   - Caution : 500 TND
   - Km limite : 800 km (200/jour)
   - Politique : Plein à plein
6. Sauvegarde → Statut = PENDING
```

#### **Jour -1 : Confirmation et contrat**
```
1. Agent confirme la réservation
2. Statut → CONFIRMED
3. Système génère automatiquement :
   - Contrat N° CNT-2025-001
   - PDF avec toutes les infos
4. Client et agent signent électroniquement
5. Contrat → SIGNED
6. Véhicule RESTE en statut "disponible"
   (car la location n'a pas encore commencé)
```

#### **Jour 0 (01/01) : Récupération du véhicule**
```
1. Ahmed arrive à l'agence
2. Agent ouvre la réservation
3. Vérifie :
   - Documents (CIN, permis)
   - État du véhicule
   - Niveau carburant : PLEIN
   - Kilométrage : 15,234 km
4. Enregistre dans le booking :
   - initial_fuel_level : "full"
   - initial_mileage : 15234
   - pickup_datetime : 2025-01-01 10:00:00
5. Change le statut → IN_PROGRESS
6. Système met automatiquement :
   - Véhicule.status → "loue"
7. Remet les clés à Ahmed
```

#### **Pendant la location (Jours 1-3)**
```
- Dans "Gestion de la Flotte", le véhicule affiche :
  Statut : 🔵 Loué
  Loué à : Ahmed Ben Salah
           📞 +216 12345678
           📅 01/01 - 05/01/2025
- Le véhicule N'EST PAS disponible pour d'autres réservations
- Client peut être contacté si besoin
```

#### **Jour 4 (05/01) : Retour du véhicule**
```
1. Ahmed ramène le véhicule
2. Agent inspecte :
   - État général : OK
   - Niveau carburant : PLEIN ✅
   - Kilométrage : 15,956 km
   - Distance parcourue : 722 km < 800 km ✅
3. Enregistre :
   - final_fuel_level : "full"
   - final_mileage : 15956
   - return_datetime : 2025-01-05 18:00:00
4. Change le statut → COMPLETED
5. Système met automatiquement :
   - Véhicule.status → "disponible"
6. Rend la caution (500 TND)
```

---

## 💡 Réponses à vos questions

### ❓ "Comment va-t-on ajouter des clients sans contrat ?"

**Réponse :** C'est NORMAL et VOULU ! 

**Cas d'usage valides :**
1. ✅ **Clients réguliers** : Enregistrés dans la base pour futures locations
2. ✅ **Liste d'attente** : Clients intéressés mais pas encore de réservation
3. ✅ **Pré-qualification** : Vérification documents avant validation
4. ✅ **Entreprises** : Contrat cadre, locations multiples

**Exemple :** Une entreprise s'inscrit avec 50 employés. Tous sont enregistrés comme clients, mais seuls 5 ont une location active.

### ❓ "Chaque véhicule loué doit montrer il est loué par qui"

**Réponse :** C'est maintenant IMPLÉMENTÉ ! ✅

**Ce qui s'affiche dans la colonne "Loué à" :**
```
Si statut = "loue" ET booking actif :
  👤 Nom du client
  📞 Téléphone
  📅 01/01/2025 - 05/01/2025

Si statut = "disponible" :
  -
```

**Requête SQL effectuée :**
```sql
SELECT 
  v.*,
  b.booking_number,
  c.first_name || ' ' || c.last_name as customer_name,
  c.phone as customer_phone,
  b.start_date,
  b.end_date
FROM vehicles v
LEFT JOIN bookings b ON v.id = b.vehicle_id 
  AND b.status = 'in_progress'
LEFT JOIN customers c ON b.customer_id = c.id
WHERE v.agency_id = ?
```

---

## 🎯 Prochaines étapes recommandées

### 1. Activer le backend pour tester
```bash
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Vérifier les endpoints existants
```bash
# Liste des véhicules avec bookings actifs
GET /api/v1/vehicles?agency_id=xxx

# Devrait retourner :
{
  "vehicles": [
    {
      "id": "...",
      "license_plate": "123 TU 4567",
      "status": "loue",
      "current_booking": {
        "customer_name": "Ahmed Ben Salah",
        "customer_phone": "+216 12345678",
        "start_date": "2025-01-01",
        "end_date": "2025-01-05"
      }
    }
  ]
}
```

### 3. Créer un endpoint dédié si nécessaire

Si le backend ne retourne pas `current_booking`, il faudra :
1. Modifier `backend/app/schemas/vehicle.py`
2. Ajouter un champ `current_booking` dans `VehicleResponse`
3. Modifier `backend/app/services/vehicle.py` pour joindre les bookings actifs

---

## 📊 Résumé des statuts

### Véhicules
- 🟢 `disponible` - Peut être loué
- 🔵 `loue` - En location active
- 🟡 `maintenance` - En réparation
- 🔴 `hors_service` - Retiré du parc

### Bookings/Réservations
- 🟡 `pending` - En attente
- 🟢 `confirmed` - Confirmée
- 🔵 `in_progress` - En cours (véhicule = loué)
- ✅ `completed` - Terminée (véhicule = disponible)
- ❌ `cancelled` - Annulée

### Contrats
- 📝 `draft` - Brouillon
- ⏳ `pending_signature` - À signer
- ✍️ `signed` - Signé
- ✅ `completed` - Complété
- ❌ `cancelled` - Annulé

---

## 🔧 Configuration requise

### Backend : Endpoints nécessaires

```python
# Déjà existants (normalement)
GET  /api/v1/customers           # Liste clients
POST /api/v1/customers           # Créer client
GET  /api/v1/bookings            # Liste réservations
POST /api/v1/bookings            # Créer réservation
GET  /api/v1/contracts           # Liste contrats
POST /api/v1/contracts           # Générer contrat
GET  /api/v1/vehicles            # Liste véhicules

# À vérifier/ajouter
GET /api/v1/vehicles/{id}/current-booking  # Booking actif du véhicule
```

### Frontend : Pages nécessaires

```
✅ ClientManagement.tsx       - Gestion clients
✅ FleetManagement.tsx        - Gestion flotte (avec "Loué à")
⚠️ Bookings.tsx               - Gestion réservations (à vérifier)
⚠️ Contracts.tsx              - Gestion contrats (à créer ?)
```

---

## 💬 Questions fréquentes

**Q : Peut-on louer sans créer de client avant ?**
R : Non, le client DOIT exister dans la base avant de créer une réservation.

**Q : Un véhicule peut avoir plusieurs réservations ?**
R : Oui, mais une seule ACTIVE (in_progress) à la fois. Les autres sont futures (confirmed) ou passées (completed).

**Q : Comment annuler une location en cours ?**
R : Passer le booking à "cancelled", le véhicule redevient automatiquement "disponible".

**Q : La signature électronique est-elle obligatoire ?**
R : Légalement en Tunisie, oui pour les contrats > 5000 TND. Pour les petites locations, une signature manuscrite scannée peut suffire.

---

**Dernière mise à jour :** 8 Décembre 2024
**Version :** 1.0
**Auteur :** GitHub Copilot
