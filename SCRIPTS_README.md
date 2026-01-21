# 🚀 Scripts d'Administration - Car Rental ERP

## 📋 Scripts Disponibles

### 1. Script de Seed (Génération de données de test)

**Fichier:** `backend/scripts/seed_data.py`

**Description:** Génère des données de test complètes pour l'application incluant agences, véhicules, clients, réservations, contrats et paiements.

**Utilisation:**
```bash
cd backend
python scripts/seed_data.py
```

**Données générées:**
- 2 utilisateurs (admin + propriétaire)
- 5 agences dans différentes villes de Tunisie
- 50 véhicules répartis entre les agences
- 30 clients
- 50 réservations
- Contrats et paiements associés

**Identifiants de connexion:**
- Super Admin: `arij@admin.com` / `password123`
- Propriétaire: `arij@owner.com` / `password123`

---

### 2. Script de Test API (Test & Debug)

**Fichier:** `backend/scripts/test_api.py`

**Description:** Teste automatiquement tous les endpoints critiques de l'API et signale les erreurs.

**Prérequis:**
```bash
pip install httpx
```

**Utilisation:**
```bash
cd backend
python scripts/test_api.py
```

**Tests effectués:**
- ✓ Authentification (Admin & Owner)
- ✓ Gestion des agences
- ✓ Gestion des véhicules (CRUD complet)
- ✓ Gestion des clients
- ✓ Gestion des réservations
- ✓ Vérification disponibilité
- ✓ Gestion des contrats
- ✓ Gestion des paiements

**Output:**
- Rapport détaillé des tests
- Taux de réussite
- Liste des erreurs détectées
- Codes couleur pour faciliter la lecture

---

## 🌍 Sélecteurs de Localisation Tunisienne

**Nouveauté:** Des dropdowns pour sélectionner le gouvernorat et la ville ont été ajoutés.

**Fichiers:**
- `frontend-new/src/data/tunisia-locations.ts` - Données des 24 gouvernorats et leurs villes
- `frontend-new/src/components/LocationSelectors.tsx` - Composants de sélection

**Utilisation dans les formulaires:**

```tsx
import { LocationSelectors } from '../components/LocationSelectors';

// Dans votre composant
<LocationSelectors
  governorate={formData.governorate}
  city={formData.city}
  onGovernorateChange={(value) => setFormData({ ...formData, governorate: value })}
  onCityChange={(value) => setFormData({ ...formData, city: value })}
  disabled={loading}
/>
```

**Intégrations actuelles:**
- ✓ Formulaire de création/modification d'agence
- À ajouter: Formulaires clients, adresses de livraison, etc.

---

## 🔧 Configuration Backend

### Installation des dépendances

```bash
cd backend
pip install -r requirements.txt
```

### Lancement du serveur

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Ou utilisez le script:
```bash
cd backend
start_server.bat  # Windows
```

---

## 🎨 Configuration Frontend

### Installation des dépendances

```bash
cd frontend-new
npm install
```

### Lancement du serveur de développement

```bash
cd frontend-new
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

---

## 📊 Endpoints API Disponibles

### Authentification
- POST `/api/v1/auth/login` - Connexion
- POST `/api/v1/auth/refresh` - Rafraîchir token
- GET `/api/v1/auth/me` - Utilisateur actuel

### Gestion des Agences (Admin)
- GET `/api/v1/admin/agencies` - Liste agences
- POST `/api/v1/admin/agencies` - Créer agence
- PUT `/api/v1/admin/agencies/{id}` - Modifier agence
- DELETE `/api/v1/admin/agencies/{id}` - Supprimer agence
- GET `/api/v1/admin/agencies/{id}/statistics` - Statistiques agence

### Gestion des Véhicules
- GET `/api/v1/vehicles/?agency_id={id}` - Liste véhicules
- POST `/api/v1/vehicles/?agency_id={id}` - Créer véhicule
- GET `/api/v1/vehicles/{id}?agency_id={id}` - Détails véhicule
- PUT `/api/v1/vehicles/{id}?agency_id={id}` - Modifier véhicule
- DELETE `/api/v1/vehicles/{id}?agency_id={id}` - Supprimer véhicule

### Gestion des Clients
- GET `/api/v1/customers/?agency_id={id}` - Liste clients
- POST `/api/v1/customers/?agency_id={id}` - Créer client
- GET `/api/v1/customers/{id}?agency_id={id}` - Détails client
- PUT `/api/v1/customers/{id}?agency_id={id}` - Modifier client
- DELETE `/api/v1/customers/{id}?agency_id={id}` - Supprimer client

### Gestion des Réservations
- GET `/api/v1/bookings/?agency_id={id}` - Liste réservations
- POST `/api/v1/bookings/?agency_id={id}` - Créer réservation
- GET `/api/v1/bookings/{id}?agency_id={id}` - Détails réservation
- PUT `/api/v1/bookings/{id}?agency_id={id}` - Modifier réservation
- POST `/api/v1/bookings/check-availability?agency_id={id}` - Vérifier disponibilité
- PUT `/api/v1/bookings/{id}/status?agency_id={id}` - Changer statut

### Gestion des Contrats
- GET `/api/v1/contracts/?agency_id={id}` - Liste contrats
- POST `/api/v1/contracts/?agency_id={id}` - Créer contrat
- GET `/api/v1/contracts/{id}?agency_id={id}` - Détails contrat
- GET `/api/v1/contracts/{id}/pdf?agency_id={id}` - Télécharger PDF
- POST `/api/v1/contracts/{id}/sign?agency_id={id}` - Signer contrat

### Gestion des Paiements
- GET `/api/v1/payments/?agency_id={id}` - Liste paiements
- POST `/api/v1/payments/?agency_id={id}` - Créer paiement
- GET `/api/v1/payments/{id}?agency_id={id}` - Détails paiement

---

## 🐛 Debugging

### Logs Backend
Les logs sont affichés dans la console du serveur FastAPI.

### Logs Frontend
Utilisez les DevTools du navigateur (F12) pour voir les logs et erreurs.

### Tests API
Utilisez le script `test_api.py` pour identifier rapidement les problèmes:
```bash
python scripts/test_api.py
```

---

## 📝 Notes Importantes

1. **Base de données:** Assurez-vous que PostgreSQL est en cours d'exécution
2. **Migrations:** Exécutez les migrations Alembic avant d'utiliser les scripts
3. **Environnement:** Vérifiez que toutes les variables d'environnement sont configurées
4. **Ports:** Backend sur 8000, Frontend sur 5173
5. **CORS:** Configuré pour localhost:5173

---

## 🔐 Sécurité

- ⚠️ Les identifiants par défaut sont pour le développement uniquement
- 🔒 Changez les mots de passe en production
- 🛡️ Utilisez HTTPS en production
- 🔑 Configurez des secrets JWT forts

---

## 📞 Support

En cas de problème:
1. Vérifiez les logs
2. Exécutez `test_api.py` pour identifier les endpoints défaillants
3. Consultez la documentation FastAPI: http://localhost:8000/docs
4. Vérifiez la base de données

---

## ✅ Checklist de Déploiement

- [ ] Migrations de base de données exécutées
- [ ] Script de seed exécuté (si nécessaire)
- [ ] Tests API passent (test_api.py)
- [ ] Variables d'environnement configurées
- [ ] Mots de passe changés
- [ ] HTTPS activé
- [ ] Sauvegardes configurées
- [ ] Monitoring activé
