"""Test which enum values the database accepts"""
import psycopg2
from psycopg2.extensions import register_adapter, AsIs
import uuid

# Register UUID adapter
register_adapter(uuid.UUID, lambda u: AsIs(f"'{u}'::uuid"))

conn = psycopg2.connect(
    dbname='car_rental_db',
    user='postgres',
    password='0000',
    host='localhost',
    port='5432'
)

cur = conn.cursor()

# Try different role values
test_values = ['proprietaire', 'PROPRIETAIRE', 'agent_comptoir', 'AGENT_COMPTOIR', 'manager', 'MANAGER']

for role_value in test_values:
    try:
        user_id = uuid.uuid4()
        cur.execute("""
            INSERT INTO users (id, email, hashed_password, full_name, role, is_active)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (user_id, f'test_{role_value}@test.com', 'hash', 'Test User', role_value, True))
        
        result_id = cur.fetchone()[0]
        print(f"[OK] Role value '{role_value}' works!")
        
        # Clean up
        cur.execute("DELETE FROM users WHERE id = %s", (result_id,))
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        error_msg = str(e).split('\n')[0]
        print(f"[ERROR] Role value '{role_value}' failed: {error_msg[:80]}")

cur.close()
conn.close()
