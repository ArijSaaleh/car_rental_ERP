# 🚀 Guide de Démarrage - Windows PowerShell

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

1. **Docker Desktop for Windows**
   - Télécharger: https://www.docker.com/products/docker-desktop
   - Version minimale: 4.0+
   - WSL 2 activé (recommandé)

2. **PowerShell 5.1+** (inclus dans Windows 10/11)
   - Vérifier la version: `$PSVersionTable.PSVersion`

3. **Git for Windows** (optionnel)
   - Télécharger: https://git-scm.com/download/win

## Démarrage Rapide (Méthode Automatique)

### Option 1: Script PowerShell

1. Ouvrir PowerShell **en tant qu'administrateur**
2. Naviguer vers le dossier du projet :
   ```powershell
   cd "c:\Users\Arij\Desktop\ironhex\solutions\Car Rental\CR"
   ```

3. Exécuter le script de démarrage :
   ```powershell
   .\start.ps1
   ```

   Si vous avez une erreur de politique d'exécution :
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\start.ps1
   ```

4. Attendre que tous les services démarrent (~2-3 minutes)

5. Accéder à l'application :
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000
   - Documentation API: http://localhost:8000/api/docs

## Démarrage Manuel (Étape par Étape)

### 1. Vérifier Docker

```powershell
# Vérifier que Docker est installé et fonctionne
docker --version
docker-compose --version

# Démarrer Docker Desktop si nécessaire
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

### 2. Configuration Backend

```powershell
# Créer le fichier .env depuis l'exemple
cd backend
Copy-Item .env.example .env

# Éditer .env si nécessaire (optionnel)
notepad .env

cd ..
```

### 3. Lancer l'Application

```powershell
# Build et démarrer tous les services
docker-compose up -d --build

# Vérifier que les services sont démarrés
docker-compose ps
```

### 4. Initialiser la Base de Données

```powershell
# Attendre 10 secondes que PostgreSQL soit prêt
Start-Sleep -Seconds 10

# Créer les migrations
docker-compose exec backend alembic revision --autogenerate -m "Initial migration"

# Appliquer les migrations
docker-compose exec backend alembic upgrade head
```

### 5. Créer un Administrateur

```powershell
# Méthode 1: Via script interactif
docker-compose exec backend python scripts/create_admin.py

# Méthode 2: Via Python direct
docker-compose exec backend python -c @"
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

db = SessionLocal()
admin = User(
    email='admin@carrental.tn',
    hashed_password=get_password_hash('admin123'),
    full_name='Super Admin',
    role=UserRole.SUPER_ADMIN,
    is_active=True,
    is_verified=True
)
db.add(admin)
db.commit()
print('Admin créé avec succès!')
"@
```

## Commandes Utiles PowerShell

### Gestion des Services

```powershell
# Voir les logs en temps réel
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend

# Arrêter tous les services
docker-compose stop

# Démarrer les services arrêtés
docker-compose start

# Redémarrer un service
docker-compose restart backend

# Arrêter et supprimer tous les conteneurs
docker-compose down

# Supprimer également les volumes (⚠️ supprime les données)
docker-compose down -v
```

### Accès aux Conteneurs

```powershell
# Accéder au shell du backend
docker-compose exec backend bash

# Accéder au shell du frontend
docker-compose exec frontend sh

# Accéder à PostgreSQL
docker-compose exec postgres psql -U car_rental_user -d car_rental_db
```

### Vérification de l'État

```powershell
# État de tous les services
docker-compose ps

# État détaillé d'un conteneur
docker inspect car-rental-backend

# Utilisation des ressources
docker stats
```

### Nettoyage

```powershell
# Nettoyer les conteneurs arrêtés
docker container prune -f

# Nettoyer les images non utilisées
docker image prune -a -f

# Nettoyer les volumes non utilisés
docker volume prune -f

# Nettoyage complet (⚠️ prudence)
docker system prune -a --volumes -f
```

## Résolution de Problèmes Windows

### Port Déjà Utilisé

```powershell
# Trouver le processus utilisant le port 3000
netstat -ano | findstr :3000

# Tuer le processus (remplacer <PID> par l'ID du processus)
taskkill /PID <PID> /F

# Exemple pour le port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Docker Desktop Ne Démarre Pas

```powershell
# Redémarrer le service Docker
Restart-Service -Name com.docker.service

# Si WSL 2 pose problème
wsl --shutdown
Restart-Service -Name LxssManager
```

### Erreur de Connexion à PostgreSQL

```powershell
# Vérifier que PostgreSQL est bien démarré
docker-compose ps postgres

# Voir les logs PostgreSQL
docker-compose logs postgres

# Redémarrer PostgreSQL
docker-compose restart postgres
```

### Problème de Permissions

```powershell
# Exécuter PowerShell en tant qu'administrateur
Start-Process powershell -Verb RunAs

# Donner les permissions au dossier
icacls "c:\Users\Arij\Desktop\ironhex\solutions\Car Rental\CR" /grant Everyone:F /T
```

### Erreur CORS Frontend

```powershell
# Vérifier que CORS_ORIGINS est correct dans backend/.env
Get-Content backend\.env | Select-String CORS_ORIGINS

# Devrait contenir: CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

## Variables d'Environnement PowerShell

```powershell
# Définir temporairement une variable d'environnement
$env:DATABASE_URL = "postgresql://user:pass@localhost:5432/db"

# Voir toutes les variables d'environnement
Get-ChildItem Env:

# Voir une variable spécifique
$env:PATH
```

## Mise à Jour de l'Application

```powershell
# Pull les dernières modifications (si Git)
git pull

# Rebuild avec les nouvelles modifications
docker-compose up -d --build

# Appliquer les nouvelles migrations
docker-compose exec backend alembic upgrade head

# Redémarrer les services
docker-compose restart
```

## Backup de la Base de Données

```powershell
# Créer un backup
$date = Get-Date -Format "yyyyMMdd_HHmmss"
docker-compose exec -T postgres pg_dump -U car_rental_user car_rental_db > "backup_$date.sql"

# Restaurer un backup
Get-Content backup_20251130_120000.sql | docker-compose exec -T postgres psql -U car_rental_user -d car_rental_db
```

## Accès aux Services

Après le démarrage complet :

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Application React |
| Backend | http://localhost:8000 | API FastAPI |
| Swagger | http://localhost:8000/api/docs | Documentation interactive |
| ReDoc | http://localhost:8000/api/redoc | Documentation alternative |
| PgAdmin | http://localhost:5050 | Gestion PostgreSQL (optionnel) |

## Support

Si vous rencontrez des problèmes :

1. Vérifier les logs : `docker-compose logs -f`
2. Consulter la documentation : `README.md`, `QUICKSTART.md`
3. Vérifier que Docker Desktop est démarré
4. Redémarrer les services : `docker-compose restart`
5. En dernier recours : `docker-compose down -v` puis `.\start.ps1`

---

**Bon développement sur Windows ! 🎉**
