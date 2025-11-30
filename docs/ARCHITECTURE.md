# Architecture Technique - Car Rental SaaS Platform

## Vue d'Ensemble

Cette plateforme est une application SaaS Multi-Tenant construite avec une architecture moderne découplée :
- **Backend**: API RESTful avec FastAPI
- **Frontend**: Application React SPA
- **Base de données**: PostgreSQL avec isolation multi-tenant
- **Infrastructure**: Docker Compose pour le développement, Kubernetes prêt pour la production

## 🏗️ Architecture Multi-Tenant

### Isolation des Données

L'isolation multi-tenant est implémentée au niveau de la base de données et de l'application :

```
┌─────────────────────────────────────────────────┐
│                   Frontend (React)              │
│              http://localhost:3000              │
└─────────────────┬───────────────────────────────┘
                  │ HTTP/REST + JWT
                  ▼
┌─────────────────────────────────────────────────┐
│              FastAPI Backend                    │
│           http://localhost:8000                 │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │   TenantMiddleware                       │  │
│  │   - Extraction du tenant_id du JWT       │  │
│  │   - Injection dans request.state         │  │
│  └──────────────────────────────────────────┘  │
│                  │                              │
│                  ▼                              │
│  ┌──────────────────────────────────────────┐  │
│  │   Authentication & Authorization         │  │
│  │   - JWT Validation                       │  │
│  │   - Role-Based Access Control (RBAC)     │  │
│  └──────────────────────────────────────────┘  │
│                  │                              │
│                  ▼                              │
│  ┌──────────────────────────────────────────┐  │
│  │   Feature Flags Middleware               │  │
│  │   - Vérification des paliers             │  │
│  │   - Contrôle d'accès aux fonctionnalités │  │
│  └──────────────────────────────────────────┘  │
│                  │                              │
│                  ▼                              │
│  ┌──────────────────────────────────────────┐  │
│  │   Business Logic (Services)              │  │
│  │   - Filtrage automatique par tenant_id   │  │
│  │   - Validation des données               │  │
│  └──────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────┘
                  │ SQLAlchemy ORM
                  ▼
┌─────────────────────────────────────────────────┐
│              PostgreSQL Database                │
│                                                 │
│  ┌──────────────┬──────────────┬─────────────┐ │
│  │  Tenant 1    │  Tenant 2    │  Tenant 3   │ │
│  │  (Agency A)  │  (Agency B)  │  (Agency C) │ │
│  │              │              │             │ │
│  │  - Users     │  - Users     │  - Users    │ │
│  │  - Vehicles  │  - Vehicles  │  - Vehicles │ │
│  │  - Bookings  │  - Bookings  │  - Bookings │ │
│  └──────────────┴──────────────┴─────────────┘ │
└─────────────────────────────────────────────────┘
```

### Modèle de Données

```sql
-- Agency (Tenant)
┌─────────────────────────┐
│       agencies          │
├─────────────────────────┤
│ id (PK, UUID)           │
│ name                    │
│ subscription_plan       │◄─── Contrôle Feature Flags
│ is_active               │
│ created_at              │
└───────┬─────────────────┘
        │
        │ 1:N
        │
┌───────▼─────────────────┐
│        users            │
├─────────────────────────┤
│ id (PK, UUID)           │
│ agency_id (FK)          │◄─── Lien Multi-Tenant
│ email                   │
│ role                    │◄─── RBAC
│ hashed_password         │
└─────────────────────────┘

┌─────────────────────────┐
│      vehicles           │
├─────────────────────────┤
│ id (PK, UUID)           │
│ agency_id (FK)          │◄─── Isolation Multi-Tenant
│ license_plate           │
│ brand, model, year      │
│ status                  │
│ mileage                 │
└─────────────────────────┘
```

## 🔐 Sécurité

### 1. Authentification JWT

```python
# Flow d'authentification
Login → Verify Credentials → Generate JWT Token
                                    │
                                    ▼
                    Token contient: {
                      "sub": user_id,
                      "email": user_email,
                      "role": user_role,
                      "agency_id": tenant_id,
                      "exp": expiration_time
                    }
                                    │
                                    ▼
        Client stocke le token → Chaque requête inclut:
                                  Authorization: Bearer <token>
                                    │
                                    ▼
                    Middleware vérifie et décode le token
                                    │
                                    ▼
                    Injection de user_context dans request
```

### 2. RBAC (Role-Based Access Control)

```
Rôles hiérarchiques:

SUPER_ADMIN
    └─── Accès à toutes les agences
         └─── Peut créer/modifier des agences
         
PROPRIETAIRE (Agency Owner)
    └─── Accès complet à son agence
         └─── Gestion des utilisateurs
         └─── Gestion complète de la flotte
         
MANAGER
    └─── Gestion quotidienne de l'agence
         └─── CRUD véhicules
         └─── Gestion des réservations (phase 2)
         
EMPLOYEE (Phase future)
    └─── Consultation uniquement
```

## 🎯 Feature Flags par Palier

```python
SUBSCRIPTION_PLANS = {
    "BASIQUE": {
        "features": ["fleet_management"],
        "price": "50 TND/mois"
    },
    "STANDARD": {
        "features": ["fleet_management", "pricing", "contracts"],
        "price": "150 TND/mois"
    },
    "PREMIUM": {
        "features": ["fleet_management", "pricing", "contracts", "ocr_automation"],
        "price": "300 TND/mois"
    },
    "ENTREPRISE": {
        "features": ["fleet_management", "pricing", "contracts", "ocr_automation", "yield_management"],
        "price": "Sur devis"
    }
}
```

## 🔄 Flow de Requête Typique

### Exemple: Créer un Véhicule

```
1. Frontend (React)
   └─► POST /api/v1/vehicles
       Headers: { Authorization: Bearer <JWT> }
       Body: { license_plate, brand, model, ... }

2. Backend API (FastAPI)
   └─► TenantMiddleware
       └─► Extrait tenant_id du JWT
       
   └─► AuthMiddleware
       └─► Valide le JWT
       └─► Charge l'utilisateur
       
   └─► FeatureFlagsMiddleware
       └─► Vérifie que l'agence a accès à "fleet_management"
       
   └─► Endpoint /vehicles/
       └─► Vérifie le rôle (Manager/Proprietaire requis)
       
   └─► VehicleService.create_vehicle()
       └─► Ajoute automatiquement agency_id = current_user.agency_id
       └─► Validation des données
       └─► Insertion en base
       
3. PostgreSQL
   └─► INSERT INTO vehicles (agency_id, ...) VALUES (...)

4. Response
   └─► 201 Created
       └─► VehicleResponse avec toutes les infos
```

## 📦 Structure des Modules

### Backend

```
app/
├── api/                    # Couche API
│   └── v1/
│       ├── endpoints/      # Endpoints REST
│       └── router.py       # Routage principal
│
├── core/                   # Configuration centrale
│   ├── config.py          # Settings
│   ├── database.py        # Connexion DB
│   ├── security.py        # JWT, Hash
│   └── dependencies.py    # Dependencies FastAPI
│
├── models/                # Modèles SQLAlchemy
│   ├── agency.py          # Tenant
│   ├── user.py            # Utilisateurs
│   └── vehicle.py         # Véhicules
│
├── schemas/               # Schémas Pydantic
│   ├── agency.py          # Validation Agence
│   ├── user.py            # Validation User
│   └── vehicle.py         # Validation Véhicule
│
├── services/              # Logique métier
│   ├── auth.py            # Service d'authentification
│   └── vehicle.py         # Service véhicules
│
├── middleware/            # Middlewares
│   ├── tenant.py          # Multi-Tenant
│   └── feature_flags.py   # Feature Flags
│
└── main.py               # Point d'entrée FastAPI
```

### Frontend

```
src/
├── components/            # Composants réutilisables
│   ├── VehicleList.tsx
│   └── VehicleForm.tsx
│
├── pages/                # Pages de l'application
│   ├── Login.tsx
│   └── Dashboard.tsx
│
├── services/             # Services API
│   ├── api.ts            # Client Axios
│   ├── auth.service.ts   # Auth
│   └── vehicle.service.ts # Véhicules
│
├── types/                # Types TypeScript
│   └── index.ts
│
├── config/               # Configuration
│   └── api.ts
│
└── App.tsx              # Composant racine
```

## 🚀 Évolutivité

### Horizontal Scaling

```
┌─────────────┐
│  Load       │
│  Balancer   │
└──────┬──────┘
       │
   ┌───┴───┬───────┬───────┐
   ▼       ▼       ▼       ▼
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│API 1│ │API 2│ │API 3│ │API N│  (Stateless)
└──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘
   │       │       │       │
   └───────┴───┬───┴───────┘
               ▼
        ┌──────────────┐
        │  PostgreSQL  │
        │   (Master)   │
        └──────┬───────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌─────────┐         ┌─────────┐
│Replica 1│         │Replica N│
└─────────┘         └─────────┘
```

### Microservices Future

Phase 2-4 pourront être déployés comme microservices séparés :
- Fleet Service (Phase 1) ✅
- Pricing Service (Phase 2)
- Contract Service (Phase 2)
- OCR Service (Phase 3)
- Yield Management Service (Phase 4)

## 🛡️ Bonnes Pratiques Implémentées

1. **Separation of Concerns**: API, Services, Models séparés
2. **Dependency Injection**: FastAPI dependencies
3. **Type Safety**: Pydantic schemas + TypeScript
4. **Database Migrations**: Alembic
5. **Environment Configuration**: .env files
6. **Containerization**: Docker
7. **CI/CD**: GitHub Actions
8. **Testing**: Pytest + Jest
9. **Documentation**: Auto-generated (Swagger/ReDoc)
10. **Security**: JWT, HTTPS ready, CORS configured

---

**Architecture évolutive et prête pour la production** 🚀
