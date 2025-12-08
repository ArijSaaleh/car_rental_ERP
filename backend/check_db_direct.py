"""Script to check proprietaire and agency data in database"""
import psycopg2

conn = psycopg2.connect(
    dbname='car_rental_db',
    user='postgres',
    password='0000',
    host='localhost',
    port='5432'
)

cur = conn.cursor()

# Check proprietaires (using enum value 'proprietaire')
cur.execute("SELECT id, email, full_name, role::text FROM users WHERE role::text = 'proprietaire' LIMIT 5")
props = cur.fetchall()

print(f'Total Proprietaires found: {len(props)}')
print()

for p in props:
    prop_id, email, full_name, role = p
    print(f'Proprietaire: {email} (ID: {prop_id}, Name: {full_name})')
    
    # Get agencies for this proprietaire
    cur.execute("""
        SELECT id, name, city, is_active, subscription_plan 
        FROM agencies 
        WHERE owner_id = %s
    """, (prop_id,))
    
    agencies = cur.fetchall()
    print(f'  Agencies: {len(agencies)}')
    
    for a in agencies:
        agency_id, name, city, is_active, plan = a
        print(f'    - {name} (ID: {agency_id}, City: {city}, Active: {is_active}, Plan: {plan})')
    
    print()

cur.close()
conn.close()
