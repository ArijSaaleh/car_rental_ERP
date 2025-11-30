# Guide de Déploiement

## Prérequis

- Serveur Linux (Ubuntu 20.04+ recommandé)
- Docker et Docker Compose installés
- Nom de domaine configuré
- Certificat SSL (Let's Encrypt recommandé)

## 1. Préparation du Serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Créer un utilisateur pour l'application
sudo useradd -m -s /bin/bash carrental
sudo usermod -aG docker carrental
```

## 2. Cloner le Projet

```bash
# Se connecter en tant qu'utilisateur carrental
sudo su - carrental

# Cloner le repository
git clone <repository-url> car-rental
cd car-rental
```

## 3. Configuration de Production

### Backend

Créer `backend/.env.production`:
```env
DATABASE_URL=postgresql://carrental_prod:STRONG_PASSWORD@postgres:5432/carrental_prod
SECRET_KEY=GENERATE_STRONG_SECRET_KEY_HERE
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production
DEBUG=False
CORS_ORIGINS=https://yourdomain.com
```

### Frontend

Créer `frontend/.env.production`:
```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENV=production
```

## 4. Configuration Docker Compose pour Production

Créer `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: car-rental-db-prod
    environment:
      POSTGRES_USER: carrental_prod
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: carrental_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - car-rental-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: car-rental-backend-prod
    env_file:
      - ./backend/.env.production
    networks:
      - car-rental-network
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: car-rental-frontend-prod
    networks:
      - car-rental-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: car-rental-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    networks:
      - car-rental-network
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

networks:
  car-rental-network:
    driver: bridge

volumes:
  postgres_data:
```

## 5. Configuration Nginx

Créer `nginx/nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # API
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 6. Obtenir un Certificat SSL

```bash
# Installer Certbot
sudo apt install certbot

# Obtenir le certificat
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copier les certificats
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
```

## 7. Déploiement

```bash
# Build et démarrer les conteneurs
docker-compose -f docker-compose.prod.yml up -d --build

# Appliquer les migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Créer un super admin
docker-compose -f docker-compose.prod.yml exec backend python scripts/create_admin.py
```

## 8. Sauvegarde de la Base de Données

Créer un script de sauvegarde `backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/home/carrental/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Créer le dossier de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarder la base de données
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U carrental_prod carrental_prod > $BACKUP_DIR/backup_$DATE.sql

# Garder seulement les 7 dernières sauvegardes
ls -t $BACKUP_DIR/backup_*.sql | tail -n +8 | xargs rm -f

echo "Backup completed: $BACKUP_DIR/backup_$DATE.sql"
```

Ajouter au crontab pour sauvegarde quotidienne:
```bash
crontab -e
# Ajouter: 0 2 * * * /home/carrental/car-rental/backup.sh
```

## 9. Monitoring

### Logs
```bash
# Voir tous les logs
docker-compose -f docker-compose.prod.yml logs -f

# Logs d'un service spécifique
docker-compose -f docker-compose.prod.yml logs -f backend
```

### État des services
```bash
docker-compose -f docker-compose.prod.yml ps
```

## 10. Mise à Jour

```bash
# Récupérer les dernières modifications
git pull

# Rebuild et redémarrer
docker-compose -f docker-compose.prod.yml up -d --build

# Appliquer les migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## 11. Sécurité

- Changer tous les mots de passe par défaut
- Configurer le firewall (UFW)
- Activer fail2ban
- Mettre à jour régulièrement le système
- Surveiller les logs d'accès
- Utiliser des secrets sécurisés pour les clés JWT

## 12. Dépannage

### Problème de connexion à la base de données
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U carrental_prod -d carrental_prod
```

### Réinitialiser un conteneur
```bash
docker-compose -f docker-compose.prod.yml restart backend
```

### Problème de permissions
```bash
sudo chown -R carrental:carrental /home/carrental/car-rental
```
