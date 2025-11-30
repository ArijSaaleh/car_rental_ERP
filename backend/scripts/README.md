# Scripts de Développement

Ce dossier contient des scripts utilitaires pour le développement et le déploiement.

## Scripts Disponibles

### `create_admin.py`
Crée un utilisateur super admin pour accéder à la plateforme.

Usage:
```bash
docker-compose exec backend python scripts/create_admin.py
```

### `seed_data.py`
Peuple la base de données avec des données de test (agences, utilisateurs, véhicules).

Usage:
```bash
docker-compose exec backend python scripts/seed_data.py
```

### `reset_db.py`
Réinitialise complètement la base de données (⚠️ ATTENTION: supprime toutes les données).

Usage:
```bash
docker-compose exec backend python scripts/reset_db.py
```
