# Phase 2 - Migration Guide

## 🗄️ Migration Base de Données

### Étape 1: Créer la Migration

```bash
# Dans le conteneur backend
docker-compose exec backend alembic revision --autogenerate -m "Add Phase 2 models - Bookings, Customers, Contracts, Payments"
```

Cette commande va générer automatiquement un fichier de migration dans `backend/alembic/versions/` qui contiendra:

**Nouvelles tables:**
- `customers` - Clients de l'agence
- `bookings` - Réservations
- `contracts` - Contrats de location
- `payments` - Paiements

**Modifications:**
- Relations ajoutées dans `agencies`, `vehicles`

---

### Étape 2: Vérifier la Migration

Le fichier généré devrait contenir quelque chose comme:

```python
"""Add Phase 2 models - Bookings, Customers, Contracts, Payments

Revision ID: xxxxx
Revises: yyyyy
Create Date: 2024-xx-xx

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'xxxxx'
down_revision = 'yyyyy'
branch_labels = None
depends_on = None


def upgrade():
    # Create customers table
    op.create_table('customers',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('agency_id', sa.UUID(), nullable=False),
    sa.Column('customer_type', sa.String(length=20), nullable=True),
    sa.Column('first_name', sa.String(length=100), nullable=False),
    sa.Column('last_name', sa.String(length=100), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('phone', sa.String(length=20), nullable=False),
    sa.Column('cin_number', sa.String(length=20), nullable=True),
    sa.Column('cin_issue_date', sa.Date(), nullable=True),
    sa.Column('cin_expiry_date', sa.Date(), nullable=True),
    sa.Column('date_of_birth', sa.Date(), nullable=True),
    sa.Column('place_of_birth', sa.String(length=100), nullable=True),
    sa.Column('license_number', sa.String(length=50), nullable=False),
    sa.Column('license_issue_date', sa.Date(), nullable=True),
    sa.Column('license_expiry_date', sa.Date(), nullable=True),
    sa.Column('license_category', sa.String(length=20), nullable=True),
    sa.Column('address', sa.String(length=255), nullable=True),
    sa.Column('city', sa.String(length=100), nullable=True),
    sa.Column('postal_code', sa.String(length=10), nullable=True),
    sa.Column('country', sa.String(length=100), nullable=True),
    sa.Column('company_name', sa.String(length=200), nullable=True),
    sa.Column('company_tax_id', sa.String(length=50), nullable=True),
    sa.Column('company_registry_number', sa.String(length=50), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('is_blacklisted', sa.Boolean(), nullable=True),
    sa.Column('blacklist_reason', sa.Text(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['agency_id'], ['agencies.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_customers_agency_id'), 'customers', ['agency_id'], unique=False)
    op.create_index(op.f('ix_customers_cin_number'), 'customers', ['cin_number'], unique=True)
    op.create_index(op.f('ix_customers_email'), 'customers', ['email'], unique=False)
    
    # Create bookings table
    op.create_table('bookings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('booking_number', sa.String(length=50), nullable=False),
    sa.Column('agency_id', sa.Integer(), nullable=False),
    sa.Column('vehicle_id', sa.Integer(), nullable=False),
    sa.Column('customer_id', sa.Integer(), nullable=False),
    sa.Column('created_by_user_id', sa.Integer(), nullable=False),
    sa.Column('start_date', sa.Date(), nullable=False),
    sa.Column('end_date', sa.Date(), nullable=False),
    sa.Column('pickup_datetime', sa.DateTime(), nullable=True),
    sa.Column('return_datetime', sa.DateTime(), nullable=True),
    sa.Column('daily_rate', sa.Numeric(precision=10, scale=3), nullable=False),
    sa.Column('duration_days', sa.Integer(), nullable=False),
    sa.Column('subtotal', sa.Numeric(precision=10, scale=3), nullable=False),
    sa.Column('tax_amount', sa.Numeric(precision=10, scale=3), nullable=True),
    sa.Column('timbre_fiscal', sa.Numeric(precision=10, scale=3), nullable=True),
    sa.Column('total_amount', sa.Numeric(precision=10, scale=3), nullable=False),
    sa.Column('deposit_amount', sa.Numeric(precision=10, scale=3), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=True),
    sa.Column('payment_status', sa.String(length=20), nullable=True),
    sa.Column('initial_mileage', sa.Integer(), nullable=True),
    sa.Column('final_mileage', sa.Integer(), nullable=True),
    sa.Column('mileage_limit', sa.Integer(), nullable=True),
    sa.Column('extra_mileage_rate', sa.Numeric(precision=10, scale=3), nullable=True),
    sa.Column('initial_fuel_level', sa.String(length=20), nullable=True),
    sa.Column('final_fuel_level', sa.String(length=20), nullable=True),
    sa.Column('fuel_policy', sa.String(length=50), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('cancellation_reason', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['agency_id'], ['agencies.id'], ),
    sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
    sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ),
    sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bookings_booking_number'), 'bookings', ['booking_number'], unique=True)
    op.create_index(op.f('ix_bookings_agency_id'), 'bookings', ['agency_id'], unique=False)
    op.create_index(op.f('ix_bookings_start_date'), 'bookings', ['start_date'], unique=False)
    op.create_index(op.f('ix_bookings_end_date'), 'bookings', ['end_date'], unique=False)
    op.create_index(op.f('ix_bookings_status'), 'bookings', ['status'], unique=False)
    
    # Create contracts table
    op.create_table('contracts',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('contract_number', sa.String(length=50), nullable=False),
    sa.Column('agency_id', sa.Integer(), nullable=False),
    sa.Column('booking_id', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(length=30), nullable=True),
    sa.Column('pdf_url', sa.String(length=500), nullable=True),
    sa.Column('pdf_storage_path', sa.String(length=500), nullable=True),
    sa.Column('pdf_generated_at', sa.DateTime(), nullable=True),
    sa.Column('customer_signature_data', sa.Text(), nullable=True),
    sa.Column('customer_signed_at', sa.DateTime(), nullable=True),
    sa.Column('customer_ip_address', sa.String(length=45), nullable=True),
    sa.Column('agent_signature_data', sa.Text(), nullable=True),
    sa.Column('agent_signed_at', sa.DateTime(), nullable=True),
    sa.Column('agent_id', sa.Integer(), nullable=True),
    sa.Column('terms_and_conditions', sa.Text(), nullable=False),
    sa.Column('customer_accepted_terms', sa.Boolean(), nullable=True),
    sa.Column('accepted_terms_at', sa.DateTime(), nullable=True),
    sa.Column('special_clauses', postgresql.JSON(astext_type=sa.Text()), nullable=True),
    sa.Column('timbre_fiscal_amount', sa.String(length=20), nullable=True),
    sa.Column('contract_language', sa.String(length=10), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['agency_id'], ['agencies.id'], ),
    sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ),
    sa.ForeignKeyConstraint(['agent_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_contracts_contract_number'), 'contracts', ['contract_number'], unique=True)
    op.create_index(op.f('ix_contracts_booking_id'), 'contracts', ['booking_id'], unique=True)
    
    # Create payments table
    op.create_table('payments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('payment_reference', sa.String(length=100), nullable=False),
    sa.Column('agency_id', sa.Integer(), nullable=False),
    sa.Column('booking_id', sa.Integer(), nullable=False),
    sa.Column('payment_method', sa.String(length=30), nullable=False),
    sa.Column('payment_type', sa.String(length=30), nullable=True),
    sa.Column('amount', sa.Numeric(precision=10, scale=3), nullable=False),
    sa.Column('currency', sa.String(length=3), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=True),
    sa.Column('gateway', sa.String(length=50), nullable=True),
    sa.Column('gateway_transaction_id', sa.String(length=200), nullable=True),
    sa.Column('gateway_response', postgresql.JSON(astext_type=sa.Text()), nullable=True),
    sa.Column('gateway_fee', sa.Numeric(precision=10, scale=3), nullable=True),
    sa.Column('webhook_received_at', sa.DateTime(), nullable=True),
    sa.Column('callback_url', sa.String(length=500), nullable=True),
    sa.Column('card_last4', sa.String(length=4), nullable=True),
    sa.Column('card_brand', sa.String(length=20), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
    sa.Column('processed_by_user_id', sa.Integer(), nullable=True),
    sa.Column('paid_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['agency_id'], ['agencies.id'], ),
    sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ),
    sa.ForeignKeyConstraint(['processed_by_user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payments_payment_reference'), 'payments', ['payment_reference'], unique=True)
    op.create_index(op.f('ix_payments_gateway_transaction_id'), 'payments', ['gateway_transaction_id'], unique=False)


def downgrade():
    # Drop in reverse order (respect foreign keys)
    op.drop_table('payments')
    op.drop_table('contracts')
    op.drop_table('bookings')
    op.drop_table('customers')
```

---

### Étape 3: Appliquer la Migration

```bash
# Appliquer la migration
docker-compose exec backend alembic upgrade head

# Vérifier le statut
docker-compose exec backend alembic current
```

---

### Étape 4: Vérification

```bash
# Se connecter à PostgreSQL
docker-compose exec postgres psql -U car_rental_user -d car_rental_db

# Lister les tables
\dt

# Résultat attendu:
#            List of relations
#  Schema |      Name       | Type  |      Owner       
# --------+-----------------+-------+------------------
#  public | agencies        | table | car_rental_user
#  public | alembic_version | table | car_rental_user
#  public | bookings        | table | car_rental_user  ← NOUVEAU
#  public | contracts       | table | car_rental_user  ← NOUVEAU
#  public | customers       | table | car_rental_user  ← NOUVEAU
#  public | payments        | table | car_rental_user  ← NOUVEAU
#  public | users           | table | car_rental_user
#  public | vehicles        | table | car_rental_user

# Vérifier structure d'une table
\d bookings

# Quitter
\q
```

---

### Rollback (si nécessaire)

```bash
# Revenir à la migration précédente
docker-compose exec backend alembic downgrade -1

# Ou revenir au début
docker-compose exec backend alembic downgrade base
```

---

## 🔍 Troubleshooting

### Problème: "Target database is not up to date"
```bash
# Vérifier l'historique
docker-compose exec backend alembic history

# Forcer la migration
docker-compose exec backend alembic stamp head
docker-compose exec backend alembic upgrade head
```

### Problème: Conflits de relations
Si Alembic ne détecte pas correctement les relations:

1. Vérifier que tous les modèles sont importés dans `models/__init__.py`
2. Redémarrer le conteneur backend
3. Re-générer la migration

```bash
docker-compose restart backend
docker-compose exec backend alembic revision --autogenerate -m "Phase 2 models"
```

### Problème: Données existantes
Si vous avez déjà des données en base:

```bash
# Backup avant migration
docker-compose exec postgres pg_dump -U car_rental_user car_rental_db > backup_before_phase2.sql

# Restaurer si nécessaire
docker-compose exec -T postgres psql -U car_rental_user car_rental_db < backup_before_phase2.sql
```

---

## ✅ Checklist Migration

- [ ] Backup de la base de données
- [ ] Générer migration Alembic
- [ ] Vérifier le fichier de migration généré
- [ ] Appliquer la migration (`alembic upgrade head`)
- [ ] Vérifier les tables créées (psql `\dt`)
- [ ] Tester les relations (créer une réservation via API)
- [ ] Vérifier les index (psql `\di`)
- [ ] Tester les contraintes (foreign keys, unique)

---

**Migration Phase 2 prête** ✅
