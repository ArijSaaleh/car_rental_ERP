# Multi-Agency Ownership Model

## Overview
The system now supports **multi-agency ownership**, where a **PROPRIETAIRE** can own and manage multiple agencies. For each agency, the proprietaire can assign **managers** to handle day-to-day operations.

## Database Changes

### Agency Model
- **Added `owner_id`**: Foreign key to the User table (PROPRIETAIRE role)
- A proprietaire can own multiple agencies through this relationship
- Owner cannot be deleted if they own active agencies (RESTRICT constraint)

### User Model
- **Maintained `agency_id`**: Indicates which agency a user (manager/employee) works for
- Proprietaires can have NULL `agency_id` or be associated with one primary agency
- New relationship: `owned_agencies` - list of all agencies owned by a proprietaire

## Key Relationships

```
PROPRIETAIRE (User)
    └── owns multiple → AGENCIES
            └── each has multiple → MANAGERS/EMPLOYEES (Users)
```

## Management Scripts

### 1. List Proprietaire's Agencies
```bash
python manage_agencies.py list proprietaire@example.com
```
Shows all agencies owned by the proprietaire, including managers for each.

### 2. Add New Agency to Proprietaire
```bash
python manage_agencies.py add proprietaire@example.com "Second Agency" "7654321B" "agency2@example.com" "+216 12 345 679" "Sfax"
```
Creates a new agency and assigns it to the proprietaire.

### 3. Assign Manager to Agency
```bash
python manage_agencies.py assign_manager <agency_id> manager@agency.com "Jane Manager" "+216 98 765 433"
```
Creates a new manager user for a specific agency.

### 4. Transfer Agency Ownership
```bash
python manage_agencies.py transfer <agency_id> new_proprietaire@example.com
```
Transfers ownership of an agency to another proprietaire.

## Use Cases

### Scenario 1: Single Agency Owner
- Proprietaire owns one agency
- Proprietaire manages everything directly
- Can assign managers as the business grows

### Scenario 2: Multi-Agency Network
- Proprietaire owns multiple agencies (e.g., franchises in different cities)
- Each agency has its own manager
- Proprietaire oversees all agencies from a centralized dashboard
- Each manager can only access their assigned agency

### Scenario 3: Delegation
- Proprietaire assigns a manager to each agency
- Managers handle daily operations (bookings, customers, vehicles)
- Proprietaire focuses on strategic decisions and monitoring
- Proprietaire can switch between agencies in the dashboard

## Frontend Implications

### Proprietaire Dashboard Features to Add:
1. **Agency Selector**: Dropdown to switch between owned agencies
2. **Multi-Agency Overview**: Dashboard showing stats for all agencies
3. **Agency Management**: Create new agencies, assign managers
4. **Consolidated Reports**: Reports across all owned agencies

### Manager Dashboard:
- Limited to single agency access
- Cannot see or manage other agencies
- Reports only for their assigned agency

## API Endpoints to Implement

### For Proprietaires:
- `GET /api/v1/proprietaire/agencies` - List all owned agencies
- `POST /api/v1/proprietaire/agencies` - Create new agency
- `GET /api/v1/proprietaire/agencies/{id}` - Get specific agency details
- `PUT /api/v1/proprietaire/agencies/{id}` - Update agency
- `DELETE /api/v1/proprietaire/agencies/{id}` - Deactivate agency
- `POST /api/v1/proprietaire/agencies/{id}/managers` - Assign manager
- `GET /api/v1/proprietaire/statistics` - Consolidated stats across all agencies

### For Managers:
- Existing agency endpoints scoped to their `agency_id`
- Cannot access other agencies' data

## Security Considerations

1. **Authorization Checks**:
   - Proprietaire can only access agencies they own
   - Managers can only access their assigned agency
   - Employees can only access their assigned agency

2. **Data Isolation**:
   - All queries filtered by `agency_id` for managers/employees
   - Proprietaires see aggregated data across `owner_id`

3. **Role Hierarchy**:
   - SUPER_ADMIN > PROPRIETAIRE > MANAGER > EMPLOYEE
   - Each level has appropriate permissions

## Migration Status

✅ Database schema updated (owner_id added to agencies)
✅ Existing agencies migrated (owner_id set to current proprietaire)
✅ Management scripts created
⏳ Frontend dashboard updates (pending)
⏳ API endpoints for multi-agency management (pending)

## Next Steps

1. Update frontend to support agency switching
2. Create multi-agency overview dashboard
3. Implement API endpoints for agency management
4. Add agency creation wizard for proprietaires
5. Build consolidated reporting across agencies
