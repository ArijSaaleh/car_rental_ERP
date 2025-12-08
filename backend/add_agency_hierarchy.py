"""
Migration script to add parent_agency_id column to agencies table
and update existing data to reflect main agency + branches hierarchy
"""
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.core.database import engine, SessionLocal

def run_migration():
    """Add parent_agency_id column and update existing data"""
    
    with engine.begin() as conn:
        print("🔧 Starting agency hierarchy migration...")
        
        # 1. Add parent_agency_id column
        print("\n1️⃣ Adding parent_agency_id column...")
        conn.execute(text("""
            ALTER TABLE agencies 
            ADD COLUMN IF NOT EXISTS parent_agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;
        """))
        
        # 2. Add index on parent_agency_id
        print("2️⃣ Creating index on parent_agency_id...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_agencies_parent_agency_id 
            ON agencies(parent_agency_id);
        """))
        
        # 3. Update existing data: Set first agency per owner as main, others as branches
        print("3️⃣ Updating existing agencies (first = main, others = branches)...")
        
        # Get all agencies grouped by owner
        result = conn.execute(text("""
            SELECT owner_id, array_agg(id ORDER BY created_at) as agency_ids
            FROM agencies
            WHERE owner_id IS NOT NULL
            GROUP BY owner_id
            HAVING COUNT(*) > 1;
        """))
        
        owners_with_multiple = result.fetchall()
        
        if owners_with_multiple:
            for row in owners_with_multiple:
                owner_id, agency_ids = row
                main_agency_id = agency_ids[0]  # First created = main
                branch_ids = agency_ids[1:]      # Rest = branches
                
                print(f"   Owner {owner_id}: Main agency = {main_agency_id}, Branches = {branch_ids}")
                
                # Set branches to point to main agency
                for branch_id in branch_ids:
                    conn.execute(text("""
                        UPDATE agencies 
                        SET parent_agency_id = :main_agency_id 
                        WHERE id = :branch_id;
                    """), {"main_agency_id": main_agency_id, "branch_id": branch_id})
        else:
            print("   No owners with multiple agencies found")
        
        # 4. Update proprietaire users to associate with their main agency
        print("4️⃣ Associating proprietaires with their main agency...")
        conn.execute(text("""
            UPDATE users 
            SET agency_id = (
                SELECT id 
                FROM agencies 
                WHERE agencies.owner_id = users.id 
                  AND agencies.parent_agency_id IS NULL
                LIMIT 1
            )
            WHERE role = 'PROPRIETAIRE' 
              AND agency_id IS NULL
              AND EXISTS (
                  SELECT 1 FROM agencies WHERE agencies.owner_id = users.id
              );
        """))
        
        print("\n✅ Migration completed successfully!")
        
        # 5. Verify the changes
        print("\n📊 Verification:")
        result = conn.execute(text("""
            SELECT 
                COUNT(*) as total_agencies,
                COUNT(*) FILTER (WHERE parent_agency_id IS NULL) as main_agencies,
                COUNT(*) FILTER (WHERE parent_agency_id IS NOT NULL) as branches
            FROM agencies;
        """))
        stats = result.fetchone()
        print(f"   Total agencies: {stats[0]}")
        print(f"   Main agencies: {stats[1]}")
        print(f"   Branches: {stats[2]}")
        
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM users 
            WHERE role = 'PROPRIETAIRE' AND agency_id IS NOT NULL;
        """))
        associated_owners = result.scalar()
        print(f"   Proprietaires associated with main agency: {associated_owners}")

if __name__ == "__main__":
    run_migration()
