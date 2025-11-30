# 🚀 Guide de Démarrage Rapide - Car Rental SaaS Platform

## Installation en 5 Minutes

### Option 1: Démarrage Automatique (Recommandé)

#### Windows
```powershell
# Ouvrir PowerShell en tant qu'administrateur
cd "c:\Users\Arij\Desktop\ironhex\solutions\Car Rental\CR"
.\start.ps1
```

#### Linux/Mac
```bash
cd /path/to/CR
chmod +x start.sh
./start.sh
```

### Option 2: Démarrage Manuel

```bash
# 1. Créer le fichier .env pour le backend
cd backend
cp .env.example .env

# 2. Retourner à la racine et lancer Docker
cd ..
docker-compose up -d --build

# 3. Attendre que PostgreSQL démarre (environ 10 secondes)

# 4. Créer les migrations de base de données
docker-compose exec backend alembic revision --autogenerate -m "Initial migration"
docker-compose exec backend alembic upgrade head

# 5. Créer un super admin
docker-compose exec backend python scripts/create_admin.py
```

## 📍 Accès à l'Application

Après le démarrage, accédez à :

- **Frontend (Application)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentation API Interactive**: http://localhost:8000/api/docs
- **Documentation API ReDoc**: http://localhost:8000/api/redoc
- **PgAdmin (optionnel)**: http://localhost:5050

## 🔐 Créer Votre Premier Utilisateur

### Via Script (Recommandé)
```bash
docker-compose exec backend python scripts/create_admin.py
```

### Via API (Postman/Curl)
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@agence.tn",
    "password": "password123",
    "full_name": "Manager Agence",
    "role": "manager"
  }'
```

## 📝 Premier Test

### 1. Se Connecter
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@agence.tn",
    "password": "password123"
  }'
```

Vous recevrez un token JWT à utiliser pour les requêtes suivantes.

### 2. Créer une Agence (Super Admin uniquement)
Les agences doivent être créées via la console Python ou par un super admin.

### 3. Ajouter un Véhicule
Utilisez le frontend sur http://localhost:3000 ou l'API :

```bash
curl -X POST http://localhost:8000/api/v1/vehicles/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "license_plate": "123-TUN-456",
    "brand": "Renault",
    "model": "Clio",
    "year": 2023,
    "fuel_type": "essence",
    "transmission": "manuelle",
    "seats": 5,
    "doors": 4,
    "mileage": 15000,
    "status": "disponible",
    "daily_rate": 80.0
  }'
```

## 🛠️ Commandes Utiles

### Voir les Logs
```bash
# Tous les services
docker-compose logs -f

# Backend seulement
docker-compose logs -f backend

# Frontend seulement
docker-compose logs -f frontend
```

### Arrêter l'Application
```bash
docker-compose down
```

### Redémarrer un Service
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Accéder à la Console Backend
```bash
docker-compose exec backend bash
```

### Accéder à PostgreSQL
```bash
docker-compose exec postgres psql -U car_rental_user -d car_rental_db
```

### Réinitialiser Complètement
```bash
docker-compose down -v  # ⚠️ Supprime tous les volumes (données)
docker-compose up -d --build
```

## 🐛 Résolution de Problèmes

### Port 3000 ou 8000 déjà utilisé
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Erreur de connexion à la base de données
```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Redémarrer PostgreSQL
docker-compose restart postgres
```

### Les migrations ne s'appliquent pas
```bash
# Entrer dans le conteneur backend
docker-compose exec backend bash

# Vérifier l'état des migrations
alembic current

# Forcer la migration
alembic upgrade head
```

### Erreur CORS
Vérifiez que `CORS_ORIGINS` dans `backend/.env` inclut `http://localhost:3000`.

## 📚 Documentation Complète

- **README Principal**: `README.md`
- **Documentation API**: `docs/API.md`
- **Guide de Déploiement**: `docs/DEPLOYMENT.md`
- **Documentation Interactive**: http://localhost:8000/api/docs (après démarrage)

## 🎯 Prochaines Étapes

1. ✅ Créer votre premier utilisateur
2. ✅ Se connecter sur http://localhost:3000
3. ✅ Ajouter des véhicules à votre flotte
4. 📖 Explorer la documentation API
5. 🔧 Personnaliser selon vos besoins
6. 🚀 Passer aux phases suivantes (Tarification, Contrats, etc.)

## 💡 Conseils

- **Développement**: Utilisez les logs en temps réel avec `docker-compose logs -f`
- **Tests**: Testez les API via http://localhost:8000/api/docs
- **Sauvegarde**: Sauvegardez régulièrement votre base de données
- **Sécurité**: Changez les mots de passe par défaut en production

## 📞 Support

Pour toute question :
- Consultez la documentation dans `docs/`
- Vérifiez les logs avec `docker-compose logs`
- Consultez les Issues GitHub

---

**Bon développement ! 🎉**
