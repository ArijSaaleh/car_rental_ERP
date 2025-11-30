# Guide de Contribution

Merci de votre intérêt pour contribuer à la Car Rental SaaS Platform ! Ce document fournit des directives pour contribuer au projet.

## 🚀 Pour Commencer

1. **Fork** le projet
2. **Clone** votre fork
   ```bash
   git clone https://github.com/votre-username/car-rental.git
   cd car-rental
   ```
3. **Créer une branche** pour votre fonctionnalité
   ```bash
   git checkout -b feature/ma-super-fonctionnalite
   ```
4. **Installer les dépendances** et lancer l'environnement de développement
   ```bash
   docker-compose up -d
   ```

## 📋 Convention de Nommage des Branches

- `feature/nom-fonctionnalite` - Nouvelles fonctionnalités
- `bugfix/nom-bug` - Corrections de bugs
- `hotfix/nom-urgence` - Corrections urgentes
- `refactor/nom-refactoring` - Refactoring du code
- `docs/nom-documentation` - Mises à jour de documentation

## 💻 Standards de Code

### Backend (Python/FastAPI)

#### Style de Code
- Suivre **PEP 8**
- Utiliser **Black** pour le formatage
- Maximum 88 caractères par ligne
- Type hints obligatoires

```python
# ✅ Bon
def create_vehicle(
    db: Session,
    vehicle_data: VehicleCreate,
    agency_id: UUID
) -> Vehicle:
    """
    Create a new vehicle with proper typing
    """
    pass

# ❌ Mauvais
def create_vehicle(db, data, id):
    pass
```

#### Docstrings
Utiliser le format Google style:

```python
def calculate_rental_price(days: int, daily_rate: float) -> float:
    """
    Calculate the total rental price.
    
    Args:
        days: Number of rental days
        daily_rate: Daily rental rate in TND
        
    Returns:
        Total rental price
        
    Raises:
        ValueError: If days or daily_rate is negative
    """
    if days < 0 or daily_rate < 0:
        raise ValueError("Days and rate must be positive")
    return days * daily_rate
```

#### Imports
Organisation des imports:

```python
# Standard library
import os
from datetime import datetime
from typing import List, Optional

# Third-party
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

# Local
from app.core.database import get_db
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate
```

### Frontend (React/TypeScript)

#### Composants
- Un composant par fichier
- PascalCase pour les noms de composants
- Préférer les functional components

```typescript
// ✅ Bon
import React from 'react';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onEdit }) => {
  return (
    <div className="vehicle-card">
      {/* ... */}
    </div>
  );
};

export default VehicleCard;
```

#### Hooks
- Préfixer avec `use`
- Extraire la logique complexe dans des hooks personnalisés

```typescript
const useVehicles = (agencyId: string) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadVehicles();
  }, [agencyId]);
  
  return { vehicles, loading };
};
```

## 🧪 Tests

### Backend Tests (Pytest)

```bash
# Lancer tous les tests
cd backend
pytest

# Tests avec couverture
pytest --cov=app

# Tests spécifiques
pytest tests/test_vehicles.py
```

Exemple de test:

```python
def test_create_vehicle(client, auth_headers):
    """Test vehicle creation"""
    response = client.post(
        "/api/v1/vehicles/",
        json={
            "license_plate": "123-TUN-456",
            "brand": "Renault",
            "model": "Clio",
            "year": 2023,
            # ...
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["license_plate"] == "123-TUN-456"
```

### Frontend Tests (Jest)

```bash
# Lancer tous les tests
cd frontend
npm test

# Tests en mode watch
npm test -- --watch
```

## 📝 Commits

### Format de Commit
Utiliser le format Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage, pas de changement de code
- `refactor`: Refactoring
- `test`: Ajout de tests
- `chore`: Maintenance

**Exemples:**

```bash
feat(vehicles): add vehicle export to CSV

Implement CSV export functionality for vehicle list.
Includes filtering and pagination support.

Closes #123
```

```bash
fix(auth): correct JWT token expiration

Token was expiring too quickly due to timezone issue.
Now properly uses UTC for consistency.
```

## 🔄 Pull Request Process

1. **Mettre à jour votre branche** avec la dernière version de `main`
   ```bash
   git checkout main
   git pull upstream main
   git checkout feature/ma-fonctionnalite
   git rebase main
   ```

2. **Tester localement**
   - Tous les tests doivent passer
   - Pas d'erreurs de linting
   - Fonctionnalité testée manuellement

3. **Créer une Pull Request**
   - Titre descriptif
   - Description détaillée des changements
   - Screenshots si changements UI
   - Référence aux issues liées

4. **Template de PR**
   ```markdown
   ## Description
   Brève description des changements
   
   ## Type de changement
   - [ ] Bug fix
   - [ ] Nouvelle fonctionnalité
   - [ ] Breaking change
   - [ ] Documentation
   
   ## Checklist
   - [ ] Tests ajoutés/mis à jour
   - [ ] Documentation mise à jour
   - [ ] Pas de breaking changes
   - [ ] Code reviewed
   
   ## Screenshots (si applicable)
   
   ## Issues liées
   Closes #123
   ```

## 🏗️ Architecture

### Ajouter un Nouveau Modèle

1. Créer le modèle dans `backend/app/models/`
2. Créer les schémas Pydantic dans `backend/app/schemas/`
3. Créer le service dans `backend/app/services/`
4. Créer les endpoints dans `backend/app/api/v1/endpoints/`
5. Ajouter au router principal
6. Créer les migrations Alembic
7. Ajouter les tests

### Ajouter une Nouvelle Page Frontend

1. Créer le composant page dans `frontend/src/pages/`
2. Créer les composants nécessaires dans `frontend/src/components/`
3. Ajouter les services API dans `frontend/src/services/`
4. Ajouter les types dans `frontend/src/types/`
5. Ajouter la route dans `App.tsx`
6. Ajouter les tests

## 🐛 Signaler un Bug

Créer une issue avec:

- **Titre clair et descriptif**
- **Description détaillée**
  - Comportement attendu
  - Comportement actuel
  - Étapes pour reproduire
- **Environnement**
  - OS
  - Version de Docker
  - Version du navigateur (si frontend)
- **Screenshots/Logs** si applicable
- **Label approprié** (bug, enhancement, question, etc.)

## 💡 Proposer une Fonctionnalité

Créer une issue avec:

- **Titre descriptif**
- **Problème à résoudre**
- **Solution proposée**
- **Alternatives considérées**
- **Informations additionnelles**

## 📚 Documentation

- Documenter toutes les nouvelles fonctionnalités
- Mettre à jour le README si nécessaire
- Ajouter des exemples d'utilisation
- Documenter les endpoints API

## ⚡ Performance

- Optimiser les requêtes de base de données
- Éviter les N+1 queries
- Utiliser la pagination pour les listes
- Minimiser les appels API frontend
- Utiliser le caching quand approprié

## 🔒 Sécurité

- Ne jamais commiter de secrets (tokens, passwords)
- Utiliser `.env` pour les configurations sensibles
- Valider toutes les entrées utilisateur
- Toujours filtrer par `agency_id` pour le multi-tenant
- Vérifier les permissions (RBAC)
- Échapper les données dans les templates

## 📜 License

En contribuant, vous acceptez que vos contributions soient sous la même licence que le projet.

## 🙏 Remerciements

Merci de contribuer à améliorer cette plateforme ! Vos contributions sont grandement appréciées.

## 📞 Questions?

Si vous avez des questions, n'hésitez pas à:
- Ouvrir une issue
- Contacter l'équipe de développement
- Consulter la documentation dans `docs/`

---

**Happy Coding! 🎉**
