# User Management with Supabase Integration

## Overview
When a SuperAdmin adds user accounts through the "Add User" functionality, the users are automatically saved to the Supabase 'users' table in the connected database.

## How It Works

### 1. User Creation Flow
```
SuperAdmin clicks "Add User" → 
AddUserModal form → 
UserManagementTable.handleAddUser() → 
AppLayout.handleAddUser() → 
DatabaseContextSimple.createUserBySuperAdmin() → 
superAdminService.createUser() → 
Supabase RPC function 'create_user_simple' → 
Data saved to Supabase 'users' table
```

### 2. Database Integration
- **Supabase Service**: `src/lib/supabase.ts` contains all database operations
- **RPC Function**: `create_user_simple` in Supabase handles user creation with validation
- **Local State**: Users are immediately added to local state for UI responsiveness
- **Data Refresh**: After successful creation, the users list is refreshed from Supabase to ensure consistency

### 3. Validation & Security
- **Duplicate Check**: Email, username, and employee number uniqueness is validated
- **Password Hashing**: Passwords are securely hashed using bcrypt in the database
- **Role Validation**: Only valid roles (user, admin, superadmin) are accepted
- **Permission Check**: Only SuperAdmin users can create accounts

### 4. Database Schema
The users are saved to the Supabase 'users' table with the following structure:
```sql
users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'admin', 'superadmin')),
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  employee_number text UNIQUE NOT NULL,
  position text NOT NULL,
  avatar text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

### 5. Error Handling
- **Network Errors**: Falls back to local creation if Supabase is unavailable
- **Validation Errors**: Displays specific error messages for duplicate data
- **Database Errors**: Proper error propagation to the UI
- **Success Feedback**: Clear confirmation when users are saved to Supabase

### 6. Features
- **Real-time Updates**: Local state is immediately updated for responsive UI
- **Data Consistency**: Automatic refresh from database after successful creation
- **Logging**: All user creation actions are logged in the changelog
- **Username Generation**: Automatic username suggestion based on name and employee number

## Test Credentials
To test user creation, login as SuperAdmin:
- Email: `superadmin@company.com`
- Password: `SuperAdmin123!`

## Configuration
Make sure your Supabase credentials are properly set in:
- `VITE_SUPABASE_URL` environment variable
- `VITE_SUPABASE_ANON_KEY` environment variable

The application will fall back to demo credentials if environment variables are not set.