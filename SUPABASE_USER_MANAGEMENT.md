# Supabase User Management Setup Guide

This guide explains how to set up and use the comprehensive user management system for SuperAdmin roles in your contacts management application.

## Overview

The system provides:
- **Role-based access control** (User, Admin, SuperAdmin)
- **Secure user creation** with password hashing
- **Comprehensive logging** of all user management actions
- **Data validation** and duplicate prevention
- **Username generation** utilities

## Database Setup

### 1. Run the Main Schema

First, execute the main schema file to set up the basic structure:

```sql
-- Run this in your Supabase SQL editor
\i supabase-schema.sql
```

### 2. Run the User Management Enhancement

Then, execute the user management enhancement script:

```sql
-- Run this in your Supabase SQL editor
\i supabase-user-management.sql
```

This will create:
- Enhanced RLS policies for SuperAdmin operations
- User management functions
- Password reset capabilities
- Username generation utilities
- Initial SuperAdmin account

## Initial SuperAdmin Account

After running the scripts, you'll have a default SuperAdmin account:

- **Email**: `superadmin@company.com`
- **Password**: `SuperAdmin123!`
- **Role**: `superadmin`

**⚠️ IMPORTANT**: Change this password immediately after first login!

## Available Functions

### 1. Create User (SuperAdmin Only)
```sql
SELECT create_user_by_superadmin(
    p_email := 'user@company.com',
    p_password := 'securePassword123',
    p_name := 'John Doe',
    p_username := 'johndoe',
    p_employee_number := 'EMP001',
    p_position := 'Software Developer',
    p_role := 'user',
    p_avatar := NULL  -- Optional, will auto-generate if not provided
);
```

### 2. Update User (SuperAdmin Only)
```sql
SELECT update_user_by_superadmin(
    p_user_id := 'user-uuid-here',
    p_email := 'newemail@company.com',
    p_name := 'Updated Name',
    p_role := 'admin'
    -- Other parameters are optional
);
```

### 3. Delete User (SuperAdmin Only)
```sql
SELECT delete_user_by_superadmin(
    p_user_id := 'user-uuid-here'
);
```

### 4. Get All Users (Admin/SuperAdmin)
```sql
SELECT * FROM get_all_users();
```

### 5. Reset Password (SuperAdmin Only)
```sql
SELECT reset_user_password(
    p_user_id := 'user-uuid-here',
    p_new_password := 'newSecurePassword123'
);
```

### 6. Generate Username
```sql
SELECT generate_username(
    p_name := 'John Doe',
    p_employee_number := 'EMP123'
);
-- Returns: johndoe123 (or johndoe1231 if johndoe123 exists)
```

## Role Permissions

### SuperAdmin
- Create, update, delete any user
- Reset any user's password
- View all users and their details
- Access all system functions
- View complete changelog

### Admin
- View all users (read-only)
- Manage contacts for all users
- View changelog
- Cannot create/delete users

### User
- View and manage only their own contacts
- Update their own profile
- Cannot access user management features

## Frontend Integration

### Using in React Components

The system integrates with your existing React context:

```typescript
import { useDatabaseContext } from '../contexts/DatabaseContextSimple';

const MyComponent = () => {
  const { 
    createUserBySuperAdmin, 
    resetUserPassword, 
    generateUsername 
  } = useDatabaseContext();

  const handleCreateUser = async () => {
    try {
      const newUser = await createUserBySuperAdmin({
        email: 'user@company.com',
        password: 'password123',
        name: 'John Doe',
        username: 'johndoe',
        employeeNumber: 'EMP001',
        position: 'Developer',
        role: 'user'
      });
      console.log('User created:', newUser);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };
};
```

### AddUserModal Features

The enhanced AddUserModal now includes:
- **Password field** with validation (minimum 6 characters)
- **Username field** with validation (alphanumeric only)
- **Real-time validation** with error messages
- **Auto-generated avatars** based on user names
- **Role selection** with descriptions

## Security Features

### Password Security
- Passwords are hashed using bcrypt with salt
- Minimum length requirements enforced
- Never stored in plain text

### Access Control
- Row Level Security (RLS) policies enforce permissions
- Functions use `SECURITY DEFINER` for controlled access
- All operations are logged for audit trails

### Data Validation
- Email format validation
- Username uniqueness checks
- Employee number uniqueness
- Role validation (user/admin/superadmin only)

## Changelog Integration

All user management actions are automatically logged:

```sql
-- Example changelog entry for user creation
{
  "timestamp": "2025-10-18T10:30:00Z",
  "user_name": "Super Administrator",
  "user_role": "superadmin",
  "action": "create",
  "entity": "user",
  "description": "Created new user user: John Doe",
  "details": {
    "email": "john@company.com",
    "role": "user",
    "employee_number": "EMP001",
    "position": "Developer"
  }
}
```

## Error Handling

The system provides comprehensive error handling:

### Common Error Responses
```json
{
  "success": false,
  "error": "Email already exists"
}

{
  "success": false,
  "error": "Unauthorized: Only SuperAdmin can create users"
}

{
  "success": true,
  "user_id": "uuid-here",
  "message": "User created successfully"
}
```

## Environment Variables

Make sure your environment variables are configured:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Testing the System

### 1. Test SuperAdmin Login
```typescript
const result = await login('superadmin@company.com', 'SuperAdmin123!');
```

### 2. Test User Creation
Use the AddUserModal in the application or call the function directly.

### 3. Verify Permissions
Try logging in with different role accounts to verify access controls.

## Troubleshooting

### Common Issues

1. **"Unauthorized" errors**: Ensure the current user has SuperAdmin role
2. **"Duplicate entry" errors**: Check for existing emails, usernames, or employee numbers
3. **Connection errors**: Verify Supabase URL and API key
4. **RLS policy errors**: Ensure policies are properly applied after schema changes

### Debugging Steps

1. Check the browser console for detailed error messages
2. Verify user authentication status
3. Check Supabase logs for SQL errors
4. Ensure all migrations have been applied

## Best Practices

1. **Always change default passwords** immediately
2. **Use strong passwords** for all accounts
3. **Regularly audit user accounts** and remove unused ones
4. **Monitor the changelog** for suspicious activities
5. **Test permission changes** in a development environment first

## Next Steps

After setting up the system:

1. Change the default SuperAdmin password
2. Create your first admin users
3. Test the user creation workflow
4. Set up backup procedures for user data
5. Configure monitoring for security events

For additional support or customization, refer to the application's main documentation or contact your development team.