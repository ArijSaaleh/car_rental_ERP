from app.core.database import engine
from sqlalchemy import text

# Ajouter la colonne postal_code
with engine.connect() as conn:
    conn.execute(text('ALTER TABLE agencies ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20)'))
    conn.commit()
    print('✅ Colonne postal_code ajoutée à la table agencies')
