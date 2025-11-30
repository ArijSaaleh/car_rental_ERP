# Super Admin Dashboard - Frontend Guide

## 🎨 Design System

### Technologies Used
- **Material-UI v5** - Component library with modern, responsive design
- **Emotion** - CSS-in-JS styling
- **MUI Data Grid** - Advanced data tables with filtering, sorting, pagination
- **Recharts** - Beautiful, responsive charts for analytics
- **Date-fns** - Date formatting and manipulation

### Color Scheme
- **Primary**: `#1976d2` (Blue)
- **Success**: `#4caf50` (Green) - Healthy systems, active status
- **Warning**: `#ff9800` (Orange) - Attention needed
- **Error**: `#f44336` (Red) - Critical issues

### Subscription Plan Colors
- **TRIAL**: Grey (`#9e9e9e`)
- **BASIC**: Green (`#4caf50`)
- **PREMIUM**: Orange (`#ff9800`)
- **ENTERPRISE**: Red (`#f44336`)

## 📁 File Structure

```
frontend/src/
├── pages/SuperAdmin/
│   ├── SuperAdminDashboard.tsx    # Main dashboard with navigation
│   ├── AgenciesManagement.tsx     # Agency CRUD operations
│   ├── HealthMonitoring.tsx       # System health monitoring
│   ├── RevenueAnalytics.tsx       # Revenue reports with charts
│   ├── AuditLogs.tsx              # Audit trail viewer
│   └── UsersManagement.tsx        # Cross-tenant user management
├── services/
│   └── admin.service.ts           # API service for super admin
└── types/
    └── admin.ts                   # TypeScript interfaces
```

## 🚀 Features Implemented

### 1. Dashboard Overview
- **Platform Statistics Cards**:
  - Total/Active Agencies
  - Total Users across all agencies
  - Total Vehicles in fleet
  - Total Bookings
  - Total Revenue
  
- **Plan Distribution**:
  - Visual breakdown by subscription plan
  - Revenue per plan

### 2. Agency Management
- **List View**: DataGrid with sorting, filtering, pagination
- **Onboarding Dialog**: Create new agency with owner account
- **Actions**:
  - Change subscription plan (with reason tracking)
  - Toggle active/inactive status
  - View detailed statistics
  
### 3. Health Monitoring
- **Summary Cards**:
  - Healthy Systems (≥80 score)
  - Warning Systems (60-79 score)
  - Critical Systems (<60 score)
  
- **Agency Health Cards**:
  - Health score (0-100) with color-coded progress bar
  - Resource counts (users, vehicles, bookings)
  - Last activity timestamp
  - Detected issues list

### 4. Revenue Analytics
- **Date Range Selector**: Custom period reporting
- **Total Revenue Card**: Gradient background with period summary
- **Charts**:
  - **Bar Chart**: Top 10 agencies by revenue
  - **Pie Chart**: Revenue distribution by plan
- **Detailed Table**: All agencies with revenue breakdown

### 5. Audit Logs
- **Advanced Filtering**:
  - Admin email
  - Action type
  - Resource type/ID
  - Date range
  - Results limit
  
- **DataGrid with Details**:
  - Expandable rows showing full action details
  - IP address and user agent tracking
  - Timestamp with precise formatting

### 6. Users Management
- **Cross-Tenant View**: All users across all agencies
- **Role-Based Display**: Color-coded chips
- **Filtering**: By role, agency, status

## 🔐 Access Control

All super admin features are protected by:
1. **Frontend Route Protection**: `ProtectedRoute` component
2. **Backend Authorization**: `require_super_admin()` dependency on all endpoints

## 📍 Routes

- `/super-admin` - Super Admin Dashboard
- `/dashboard` - Regular User Dashboard
- `/login` - Authentication

## 🎯 Usage

### Accessing the Super Admin Dashboard

1. **Login** with super admin credentials:
   - Email: `admin@carental.tn`
   - Password: `Admin@2024`

2. **Navigate** to `/super-admin` in your browser

3. **Navigate** using the sidebar menu:
   - Vue d'ensemble - Platform statistics overview
   - Gestion Agences - Create and manage agencies
   - Santé Système - Monitor agency health
   - Revenus - Revenue analytics with charts
   - Utilisateurs - View all users
   - Journal d'Audit - Search audit logs

### Common Tasks

#### Create a New Agency
1. Go to "Gestion Agences"
2. Click "Nouvelle Agence"
3. Fill in agency details and owner information
4. Select subscription plan
5. Click "Créer l'agence"

#### Change Subscription Plan
1. Go to "Gestion Agences"
2. Click the swap icon on the agency row
3. Select new plan and provide reason
4. Click "Changer"

#### View Revenue Report
1. Go to "Revenus"
2. Select date range
3. Click "Générer Rapport"
4. View charts and detailed table

#### Search Audit Logs
1. Go to "Journal d'Audit"
2. Expand "Filtres de recherche"
3. Set filters (admin, action, date range, etc.)
4. Click "Rechercher"
5. Click on rows to expand and view details

## 🎨 Component Design Patterns

### Material-UI Components Used
- `AppBar` & `Toolbar` - Top navigation
- `Drawer` - Sidebar navigation (responsive)
- `DataGrid` - Advanced data tables
- `Card` & `Paper` - Content containers
- `Chip` - Status badges
- `Dialog` - Modal forms
- `Grid` - Responsive layouts
- `TextField` - Form inputs
- `Button` - Actions
- `Alert` - Success/Error messages

### Recharts Components
- `BarChart` - Revenue comparison
- `PieChart` - Plan distribution
- `ResponsiveContainer` - Responsive sizing

## 🌐 API Integration

All API calls are centralized in `services/admin.service.ts`:

```typescript
// Example usage
import { adminService } from '../services/admin.service';

const stats = await adminService.getPlatformStats();
const agencies = await adminService.getAgencies({ is_active: true });
const health = await adminService.getAgenciesHealth();
```

## 📱 Responsive Design

- **Desktop**: Full sidebar navigation, multi-column grids
- **Tablet**: Collapsible sidebar, 2-column grids
- **Mobile**: Drawer menu, single-column grids

## 🎨 Customization

To customize colors, modify:
1. **MUI Theme**: Create theme in `App.tsx` with `createTheme()`
2. **Component Colors**: Update `sx` props in components
3. **Chart Colors**: Modify `COLORS` array in `RevenueAnalytics.tsx`

## 🔧 Next Steps

Optional enhancements:
1. **Export to PDF/Excel** - Add export buttons to reports
2. **Real-time Updates** - WebSocket for live statistics
3. **Email Notifications** - Integration with notification service
4. **Advanced Filters** - More granular filtering options
5. **Custom Dashboards** - User-configurable widgets
6. **Dark Mode** - Theme toggle
7. **Multi-language** - i18n support

## 🐛 Troubleshooting

### DataGrid not showing
- Check that `@mui/x-data-grid` is installed
- Verify API is returning data in correct format

### Charts not rendering
- Ensure `recharts` is installed
- Check that data has correct structure

### API errors
- Verify backend is running on `http://localhost:8000`
- Check authentication token is valid
- Review CORS settings if needed
