# Admin Pages Documentation

## Overview
Comprehensive admin pages for SUPER_ADMIN role in the car rental application, providing system-wide management and configuration capabilities.

## Created Files

### 1. **AdminDashboard.tsx**
System-wide dashboard with comprehensive statistics and monitoring.

**Features:**
- Total system statistics (agencies, users, vehicles, bookings)
- System health status indicator (healthy/warning/critical)
- Revenue metrics across all agencies
- Recent activity feed (agencies, users, bookings)
- Top agencies list
- Quick action buttons
- Real-time status monitoring

**Key Components:**
- Stats cards with color-coded metrics
- Activity timeline
- Agency performance cards
- System health badge
- Quick navigation to management pages

**Usage:**
```tsx
import { AdminDashboard } from './pages/admin';
// Route: /admin/dashboard
```

### 2. **AgencyManagement.tsx**
Complete system-wide agency management interface.

**Features:**
- List ALL agencies in the system
- Advanced filtering (status, subscription plan, owner)
- Search functionality (name, city, email)
- Create new agencies
- Edit existing agencies
- Delete agencies (with confirmation)
- Toggle agency status (active/inactive)
- Assign owners to agencies
- View per-agency statistics (users, vehicles, bookings)
- Pagination (10 items per page)

**Key Components:**
- Multi-filter search interface
- Comprehensive agency form with validation
- Owner assignment dropdown
- Statistics display per agency
- Status toggle buttons
- Delete confirmation dialog

**Form Fields:**
- Nom Commercial (Commercial Name)
- Raison Sociale (Legal Name)
- Matricule Fiscale (Tax ID)
- Email
- Téléphone (Phone)
- Ville (City)
- Adresse (Address)
- Code Postal (Postal Code)
- Pays (Country)
- Plan d'Abonnement (Subscription Plan): BASIQUE/STANDARD/PREMIUM/ENTREPRISE
- Propriétaire (Owner)

**Usage:**
```tsx
import { AgencyManagement } from './pages/admin';
// Route: /admin/agencies
```

### 3. **Users.tsx**
System-wide user management with role-based controls.

**Features:**
- List ALL users across all agencies
- Multi-level filtering (role, agency, status)
- Search by name, email, phone
- Edit user details
- Change user roles
- Assign users to agencies
- Activate/deactivate users
- Delete users (protected for SUPER_ADMIN)
- Reset passwords
- View last login information
- Pagination (10 items per page)

**Role Management:**
- SUPER_ADMIN (Red badge)
- PROPRIETAIRE (Purple badge)
- MANAGER (Blue badge)
- AGENT_COMPTOIR (Green badge)
- AGENT_PARC (Orange badge)
- CLIENT (Gray badge)

**Stats Cards:**
- Total users
- Active users
- Inactive users
- Admin count

**Key Components:**
- Role-specific color coding
- Agency filter with dropdown
- Status management buttons
- User avatar with initials
- Last login tracking
- Role badge display

**Form Fields:**
- Nom Complet (Full Name)
- Email (disabled for existing users)
- Téléphone (Phone)
- Rôle (Role)
- Agence (Agency)

**Usage:**
```tsx
import { Users } from './pages/admin';
// Route: /admin/users
```

### 4. **SystemSettings.tsx**
Comprehensive system configuration interface with tabbed layout.

**Features:**
- General system settings
- Email (SMTP) configuration
- Payment gateway settings (Paymee, Clic To Pay)
- Feature flags (enable/disable features)
- Maintenance mode toggle
- System logs viewer (placeholder)

**Tabs:**

#### General Settings
- Application name
- Support email & phone
- Default language (Français/العربية/English)
- Default currency (TND/EUR/USD)
- Default timezone

#### Email Configuration
- SMTP host & port
- SMTP credentials
- Secure connection toggle (TLS/SSL)
- From name & address
- Password visibility toggle

#### Payment Gateway
**Paymee:**
- Enable/disable toggle
- API key
- Secret key

**Clic To Pay:**
- Enable/disable toggle
- Merchant ID
- API key

#### Feature Flags
- Réservations (Bookings)
- Paiements (Payments)
- Contrats (Contracts)
- Rapports (Reports)
- Notifications

#### Maintenance Mode
- Enable/disable toggle
- Custom maintenance message
- Status indicator (operational/maintenance)
- Warning alerts

**Key Components:**
- Tabbed navigation
- Toggle switches for features
- Password masking/unmasking
- Live status indicators
- Auto-save functionality

**Usage:**
```tsx
import { SystemSettings } from './pages/admin';
// Route: /admin/settings
```

## New UI Components

### Tabs Component (`src/components/ui/tabs.tsx`)
Radix UI tabs wrapper with custom styling.

**Components:**
- `Tabs` - Root component
- `TabsList` - Tab navigation container
- `TabsTrigger` - Individual tab button
- `TabsContent` - Tab panel content

### Switch Component (`src/components/ui/switch.tsx`)
Toggle switch for boolean settings.

**Props:**
- `checked` - Current state
- `onCheckedChange` - Change handler
- `disabled` - Disabled state

## Installation & Dependencies

### Installed Packages
```bash
npm install @radix-ui/react-switch
```

### Already Available
- @radix-ui/react-tabs
- @radix-ui/react-dialog
- @radix-ui/react-select
- lucide-react
- shadcn/ui components

## Routing Setup

Add these routes to your router configuration:

```tsx
// In your router setup (e.g., App.tsx or router.tsx)
import {
  AdminDashboard,
  AgencyManagement,
  Users,
  SystemSettings,
} from './pages/admin';

// Protected routes for SUPER_ADMIN only
{
  path: '/admin',
  element: <ProtectedRoute allowedRoles={['SUPER_ADMIN']} />,
  children: [
    { path: 'dashboard', element: <AdminDashboard /> },
    { path: 'agencies', element: <AgencyManagement /> },
    { path: 'users', element: <Users /> },
    { path: 'settings', element: <SystemSettings /> },
  ]
}
```

## API Requirements

These pages expect the following API endpoints:

### Agencies
- `GET /agencies` - List all agencies
- `GET /agencies/:id` - Get agency by ID
- `POST /agencies` - Create agency
- `PATCH /agencies/:id` - Update agency
- `DELETE /agencies/:id` - Delete agency
- `POST /agencies/:id/toggle-status` - Toggle agency status

### Users
- `GET /users` - List all users
- `GET /users?agencyId={id}` - List users by agency
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Vehicles (for stats)
- `GET /vehicles?agencyId={id}` - List vehicles by agency

### Bookings (for stats)
- `GET /bookings?agencyId={id}` - List bookings by agency

### Settings
- `GET /settings` - Get system settings
- `POST /settings` - Update system settings

## Features

### Security
- SUPER_ADMIN role required for all pages
- Protected delete operations
- Confirmation dialogs for destructive actions
- Password masking for sensitive fields

### User Experience
- Loading states for all async operations
- Optimistic UI updates
- Toast notifications for all actions
- Error handling with user-friendly messages
- Responsive design (mobile, tablet, desktop)
- Search and filter capabilities
- Pagination for large datasets

### Data Handling
- CamelCase field names (backend compatibility)
- Type-safe with TypeScript
- Proper error extraction and display
- Fallback to default settings if backend unavailable

### Performance
- Parallel data loading where possible
- Efficient filtering and search
- Lazy loading for large datasets
- Optimized re-renders

## Styling

All pages use:
- Tailwind CSS for styling
- Gradient backgrounds
- Color-coded role badges
- Consistent card layouts
- Modern glassmorphism effects
- Responsive grid layouts
- Animated transitions

### Color Coding

**Roles:**
- Red: SUPER_ADMIN
- Purple: PROPRIETAIRE
- Blue: MANAGER
- Green: AGENT_COMPTOIR
- Orange: AGENT_PARC
- Gray: CLIENT

**Status:**
- Green: Active/Healthy/Success
- Red: Inactive/Critical/Error
- Amber: Warning
- Gray: Neutral/Secondary

## Best Practices

1. **Always check user role** before rendering admin pages
2. **Use confirmation dialogs** for destructive actions
3. **Show loading states** during async operations
4. **Display clear error messages** to users
5. **Validate form inputs** before submission
6. **Use optimistic updates** for better UX
7. **Implement proper pagination** for large datasets
8. **Cache frequently accessed data** when appropriate

## Future Enhancements

Potential improvements:
- Real-time updates with WebSockets
- Advanced analytics dashboard
- Bulk operations (delete, edit)
- Export functionality (CSV, PDF)
- System logs viewer implementation
- Audit trail tracking
- Email template editor
- Advanced search with filters
- Role-based permission matrix
- Multi-language support
- Theme customization

## Troubleshooting

### Common Issues

**Issue:** Pages not loading
- **Solution:** Check if user has SUPER_ADMIN role
- **Solution:** Verify API endpoints are accessible

**Issue:** Stats not showing
- **Solution:** Check backend API responses
- **Solution:** Verify agency IDs are correct

**Issue:** Forms not submitting
- **Solution:** Check console for validation errors
- **Solution:** Verify required fields are filled

**Issue:** Settings not saving
- **Solution:** Check settings service API endpoint
- **Solution:** Verify request payload format

## Support

For issues or questions:
- Check console for error messages
- Verify API endpoints are working
- Ensure proper authentication tokens
- Review TypeScript errors in IDE
- Check network tab for failed requests

## License

Part of the Car Rental Application - Internal Use Only
