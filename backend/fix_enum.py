"""Fix UserRole enum to use uppercase names matching Python enum"""
import psycopg2

conn = psycopg2.connect(
    dbname='car_rental_db',
    user='postgres',
    password='0000',
    host='localhost',
    port='5432'
)

cur = conn.cursor()

try:
    print("Fixing UserRole enum...")
    
    # Drop and recreate the enum with uppercase values
    cur.execute("""
        -- Drop the existing enum (this will fail if used by tables)
        -- ALTER TYPE userrole RENAME TO userrole_old;
        
        -- Create new enum with uppercase names
        CREATE TYPE userrole_new AS ENUM (
            'SUPER_ADMIN',
            'PROPRIETAIRE', 
            'MANAGER',
            'AGENT_COMPTOIR',
            'AGENT_PARC',
            'CLIENT'
        );
        
        -- Change column type
        ALTER TABLE users 
        ALTER COLUMN role TYPE userrole_new 
        USING role::text::userrole_new;
        
        -- Drop old enum
        DROP TYPE userrole;
        
        -- Rename new enum to old name
        ALTER TYPE userrole_new RENAME TO userrole;
    """)
    
    conn.commit()
    print("[OK] UserRole enum fixed successfully!")
    
except Exception as e:
    conn.rollback()
    print(f"[ERROR] Failed to fix enum: {e}")
    
finally:
    cur.close()
    conn.close()
