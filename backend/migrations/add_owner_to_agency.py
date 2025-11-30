"""
Migration: Add owner_id to agencies table to support multi-agency ownership
"""
from sqlalchemy import text
from app.core.database import SessionLocal, engine


def upgrade():
    """Add owner_id column to agencies table"""
    db = SessionLocal()
    
    try:
        # Add owner_id column
        db.execute(text("""
            ALTER TABLE agencies 
            ADD COLUMN IF NOT EXISTS owner_id UUID;
        """))
        
        # Add foreign key constraint
        db.execute(text("""
            ALTER TABLE agencies 
            ADD CONSTRAINT fk_agency_owner 
            FOREIGN KEY (owner_id) 
            REFERENCES users(id) 
            ON DELETE RESTRICT;
        """))
        
        # Create index on owner_id
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_agencies_owner_id 
            ON agencies(owner_id);
        """))
        
        # For existing agencies, set the owner_id to the first PROPRIETAIRE user in that agency
        db.execute(text("""
            UPDATE agencies a
            SET owner_id = (
                SELECT u.id 
                FROM users u 
                WHERE u.agency_id = a.id 
                AND u.role = 'PROPRIETAIRE' 
                LIMIT 1
            )
            WHERE owner_id IS NULL;
        """))
        
        db.commit()
        print("✓ Migration completed: Added owner_id to agencies table")
        
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def downgrade():
    """Remove owner_id column from agencies table"""
    db = SessionLocal()
    
    try:
        # Drop foreign key constraint
        db.execute(text("""
            ALTER TABLE agencies 
            DROP CONSTRAINT IF EXISTS fk_agency_owner;
        """))
        
        # Drop index
        db.execute(text("""
            DROP INDEX IF EXISTS ix_agencies_owner_id;
        """))
        
        # Drop column
        db.execute(text("""
            ALTER TABLE agencies 
            DROP COLUMN IF EXISTS owner_id;
        """))
        
        db.commit()
        print("✓ Rollback completed: Removed owner_id from agencies table")
        
    except Exception as e:
        print(f"✗ Rollback failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Running migration: Add owner_id to agencies")
    upgrade()
