# Car Rental SaaS Platform

Plateforme SaaS Multi-Tenant pour la gestion de location de voitures, conçue pour les agences de location avec un focus initial sur le marché tunisien.

## 🚀 Caractéristiques Principales

### Phase 1 - MVP (Palier Basique) ✅ COMPLÉTÉ
- ✅ **Architecture Multi-Tenant** - Isolation stricte des données par agence
- ✅ **Authentification JWT** - Sécurité avec gestion des rôles (Super Admin, Propriétaire, Manager, Employé)
- ✅ **Gestion de Flotte** - CRUD complet pour les véhicules
- ✅ **Feature Flagging** - Contrôle d'accès aux fonctionnalités par palier d'abonnement
- ✅ **API RESTful** - Backend FastAPI avec documentation automatique
- ✅ **Interface Moderne** - Frontend React avec TypeScript

### Phase 2 - Palier Pro ✅ COMPLÉTÉ
- ✅ **Module Réservation** - Planning avec vérification de disponibilité et détection de conflits
- ✅ **Contrats PDF** - Génération automatique conformes à la législation tunisienne (timbre fiscal)
- ✅ **Signature Électronique** - Signature pad pour contrats sur tablette/PC
- ✅ **Paiements en Ligne** - Intégration Paymee et ClicToPay (passerelles tunisiennes)
- ✅ **PWA Agent de Parc** - Interface mobile pour inspections véhicules (photos, kilométrage, carburant)
- ✅ **Reporting Pro** - Dashboard KPIs (taux d'occupation, chiffre d'affaires mensuel, état flotte)

### Paliers d'Abonnement
1. **Basique** - Gestion de flotte (Phase 1)
2. **Pro** - Réservations + Contrats + Paiements + Reporting (Phase 2)
3. **Premium** - Pro + Automatisation OCR (Phase 3)
4. **Entreprise** - Premium + Yield Management (Phase 4)

## 🏗️ Architecture Technique

### Backend
- **Framework**: FastAPI (Python)
- **Base de données**: PostgreSQL
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentification**: JWT (python-jose)
- **Sécurité**: Bcrypt pour le hachage des mots de passe
- **PDF**: ReportLab pour génération de contrats
- **Paiements**: Intégration Paymee et ClicToPay

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **PWA**: Progressive Web App avec service worker
- **Style**: CSS moderne avec composants modulaires

### Infrastructure
- **Conteneurisation**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Base de données**: PostgreSQL 15
- **Reverse Proxy**: Nginx (production)

## 📋 Prérequis

- Docker Desktop (Windows/Mac) ou Docker Engine (Linux)
- Git
- Node.js 18+ (pour développement local sans Docker)
- Python 3.11+ (pour développement local sans Docker)

## 🚀 Démarrage Rapide

### 1. Cloner le repository
```bash
git clone <repository-url>
cd CR
```

### 2. Configuration de l'environnement

#### Backend
```bash
cd backend
cp .env.example .env
# Modifier .env avec vos configurations
```

#### Frontend
```bash
cd frontend
cp .env .env.local
# Modifier si nécessaire
```

### 3. Lancer avec Docker Compose

```bash
# Depuis la racine du projet
docker-compose up -d
```

Les services seront disponibles sur:
- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/api/docs
- **PgAdmin** (optionnel): http://localhost:5050

### 4. Initialiser la base de données

```bash
# Entrer dans le conteneur backend
docker-compose exec backend bash

# Créer la migration initiale
alembic revision --autogenerate -m "Initial migration"

# Appliquer les migrations
alembic upgrade head
```

### 5. Créer un super admin (optionnel)

```python
# Dans le conteneur backend
python
>>> from app.core.database import SessionLocal
>>> from app.models.user import User, UserRole
>>> from app.core.security import get_password_hash
>>> 
>>> db = SessionLocal()
>>> admin = User(
...     email="admin@carrental.com",
...     hashed_password=get_password_hash("admin123"),
...     full_name="Super Admin",
...     role=UserRole.SUPER_ADMIN,
...     is_active=True,
...     is_verified=True
... )
>>> db.add(admin)
>>> db.commit()
```

## 📚 Structure du Projet

```
CR/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── auth.py
│   │   │       │   └── vehicles.py
│   │   │       └── router.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── security.py
│   │   │   └── dependencies.py
│   │   ├── models/
│   │   │   ├── agency.py
│   │   │   ├── user.py
│   │   │   └── vehicle.py
│   │   ├── schemas/
│   │   │   ├── agency.py
│   │   │   ├── user.py
│   │   │   └── vehicle.py
│   │   ├── services/
│   │   │   ├── auth.py
│   │   │   └── vehicle.py
│   │   ├── middleware/
│   │   │   ├── tenant.py
│   │   │   └── feature_flags.py
│   │   └── main.py
│   ├── alembic/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VehicleList.tsx
│   │   │   └── VehicleForm.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.service.ts
│   │   │   └── vehicle.service.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── .github/
│   └── workflows/
│       └── ci-cd.yml
└── docker-compose.yml
```

## 🔐 Sécurité Multi-Tenant

### Isolation des Données
Chaque requête API est automatiquement filtrée par `agency_id` grâce au middleware de tenant:

```python
# Toutes les requêtes véhicules sont automatiquement filtrées
vehicles = db.query(Vehicle).filter(Vehicle.agency_id == current_user.agency_id).all()
```

### Rôles et Permissions
- **Super Admin**: Accès complet à toutes les agences
- **Propriétaire/Admin Réseau**: Gestion complète de son agence
- **Manager**: Gestion quotidienne de l'agence
- **Employee**: Accès limité (phases futures)

### Feature Flags
Les fonctionnalités sont contrôlées par le palier d'abonnement:

```python
# Vérification automatique dans les endpoints
FeatureFlags.require_feature(agency, FeatureFlags.FLEET_MANAGEMENT)
```

## 🔧 Développement

### Backend (sans Docker)

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
uvicorn app.main:app --reload
```

### Frontend (sans Docker)

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm start
```

## 📖 Documentation API

Une fois le backend lancé, la documentation interactive est disponible sur:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## 🧪 Tests

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm test
```

## 🚢 Déploiement

### Staging
Le pipeline CI/CD déploie automatiquement sur staging lors d'un push sur `main`.

### Production
```bash
# Build des images
docker-compose -f docker-compose.prod.yml build

# Déploiement
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 Roadmap

### Phase 2 - Standard (Q1 2024)
- [ ] Module de tarification dynamique
- [ ] Génération de contrats conformes
- [ ] Signature électronique

### Phase 3 - Premium (Q2 2024)
- [ ] Automatisation du comptoir avec OCR
- [ ] Scan des documents (permis, carte d'identité)
- [ ] Vérification automatique

### Phase 4 - Entreprise (Q3 2024)
- [ ] Yield Management
- [ ] Optimisation des prix
- [ ] Analytics avancés
- [ ] Prédictions de demande

## 🤝 Contribution

Les contributions sont les bienvenues! Veuillez suivre ces étapes:

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 License

Ce projet est sous licence propriétaire. Tous droits réservés.

## 📧 Contact

Pour toute question ou support: support@carrental.tn

## 🙏 Remerciements

- FastAPI pour l'excellent framework
- React Team pour React
- La communauté open-source

---

**Développé avec ❤️ pour les agences de location tunisiennes**
