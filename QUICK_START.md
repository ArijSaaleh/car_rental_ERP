# 🚀 DÉMARRAGE RAPIDE - CAR RENTAL ERP

## 📦 Première Installation

```bash
# Exécuter le script d'installation
setup.bat
```

## 🌱 Générer des Données de Test

```bash
# Option 1: Via le menu
run_scripts.bat
# Puis choisir option 1

# Option 2: Direct
cd backend
python scripts\seed_data.py
```

## ▶️ Lancer l'Application

```bash
# Option 1: Lancement automatique (RECOMMANDÉ)
start_app.bat

# Option 2: Manuel
# Terminal 1 - Backend
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend-new
npm run dev
```

## 🔐 Connexion

Ouvrir: **http://localhost:5173**

**Identifiants:**
- Super Admin: `arij@admin.com` / `password123`
- Propriétaire: `arij@owner.com` / `password123`

## 🧪 Tester l'API

```bash
cd backend
python scripts\test_api.py
```

## 📚 Documentation Complète

- **SCRIPTS_README.md** - Guide détaillé des scripts
- **SYNTHESE_COMPLETE.md** - Synthèse complète du projet

## 🛠️ Scripts Disponibles

| Script | Description |
|--------|-------------|
| `setup.bat` | Installation des dépendances |
| `start_app.bat` | Lance backend + frontend |
| `run_scripts.bat` | Menu pour seed et tests |
| `backend/scripts/seed_data.py` | Génère données de test |
| `backend/scripts/test_api.py` | Teste tous les endpoints |

## 🎯 Fonctionnalités Principales

### ✅ Gestion des Agences
- Création avec dropdowns gouvernorat/ville (Tunisie)
- Gestion multi-agences
- Statistiques par agence

### ✅ Gestion de la Flotte
- CRUD complet des véhicules
- Statuts: Disponible, En location, En maintenance
- Filtres et recherche

### ✅ Gestion des Réservations
- Création de réservations
- Vérification de disponibilité
- Gestion des statuts
- Calcul automatique des prix

### ✅ Gestion des Contrats
- Création basée sur réservation
- Génération PDF
- Signature électronique
- Tracking des statuts

### ✅ Gestion des Clients
- CRUD complet
- Historique des réservations
- Informations permis de conduire

### ✅ Gestion des Paiements
- Plusieurs méthodes (Espèces, CB, Chèque, Virement)
- Suivi des paiements
- Paiements partiels

## 🌍 Sélecteurs Tunisiens

Les formulaires incluent des dropdowns pour:
- **24 Gouvernorats** de Tunisie
- **200+ Villes** organisées par gouvernorat
- Sélection en cascade (gouvernorat → ville)

## 🎨 Interface

- Design moderne et responsive
- Mode sombre automatique
- Notifications toast
- Animations fluides
- Gradients et ombres

## ⚡ Ports Utilisés

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- API Docs: `http://localhost:8000/docs`

## 🐛 En Cas de Problème

1. **Backend ne démarre pas:**
   - Vérifier PostgreSQL est en cours d'exécution
   - Vérifier les variables d'environnement
   - Exécuter les migrations Alembic

2. **Frontend ne démarre pas:**
   - Exécuter `npm install` dans `frontend-new/`
   - Vérifier Node.js est installé (v18+)

3. **Tests API échouent:**
   - Vérifier backend est en cours d'exécution
   - Vérifier les données ont été seedées
   - Consulter les logs backend

4. **Erreurs de base de données:**
   - Vérifier PostgreSQL est accessible
   - Exécuter les migrations: `alembic upgrade head`
   - Re-seeder la base: `python scripts/seed_data.py`

## 📞 URLs Utiles

- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API Documentation: http://localhost:8000/docs
- API Alternative Docs: http://localhost:8000/redoc

## ✨ Nouveautés Implémentées

✅ Dropdowns gouvernorats et villes de Tunisie
✅ Script de seed automatique avec données réalistes
✅ Script de test API complet
✅ Design moderne uniformisé
✅ Scripts batch pour faciliter l'usage
✅ Documentation complète

## 🎉 C'est Parti !

```bash
start_app.bat
```

Puis ouvrir http://localhost:5173 et se connecter avec `arij@admin.com` / `password123`

---

**Bon développement ! 🚀**
