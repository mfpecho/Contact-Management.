# Supabase Function Error Fix

## Problem
If you're experiencing issues with user creation not saving to the database, this guide will help diagnose and fix the issue.

## Current Enhanced Debugging

The application now includes comprehensive debugging that will show you exactly what's happening:

### Console Messages to Look For:
1. **Connection Test**: 
   - ✅ "Supabase database connection is working" 
   - ❌ "Supabase database connection failed"

2. **User Creation Process**:
   - "Creating user via SuperAdmin - will save to Supabase database"
   - "Supabase createUser called with userData"
   - "Calling RPC create_user_simple with params"
   - "RPC create_user_simple response"

3. **Error Handling**:
   - "Database function not found" → Schema not applied
   - "Database authentication failed" → Wrong credentials
   - "permission denied" → RLS or permissions issue

## Root Cause Diagnosis

The `create_user_simple` function doesn't exist because the database schema hasn't been applied to your Supabase project yet.

## 🚀 QUICK FIX (5 minutes)

### Option 1: One-Click Setup
1. **Open your Supabase project dashboard**
2. **Go to SQL Editor** (left sidebar) 
3. **Click "New query"**
4. **Copy and paste** the entire content of `supabase-quick-setup.sql`
5. **Click "Run"**
6. **You should see**: "Setup complete! The create_user_simple function is now available."

### Option 2: Manual Test
Test if the function exists by running this in Supabase SQL Editor:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_user_simple';
```

If it returns no rows, the function doesn't exist and needs to be created.

## 📋 Complete Setup Guide
For detailed step-by-step instructions, see `SUPABASE_SETUP_COMPLETE.md`

## Solution Options

### Option 1: Use the Simplified Functions (Recommended)

I've created a simplified version that should work more reliably. Follow these steps:

1. **Run the simplified SQL script in your Supabase SQL Editor:**
   ```sql
   -- Copy and paste the contents of supabase-user-management-simple.sql
   ```

2. **The simplified functions are:**
   - `create_user_simple()`
   - `update_user_simple()`
   - `delete_user_simple()`
   - `reset_password_simple()`
   - `generate_username_simple()`

3. **These functions have simpler parameter names and better compatibility**

### Option 2: Fix the Original Functions

If you prefer to use the original functions, run this in your Supabase SQL Editor:

```sql
-- First, drop any existing functions to avoid conflicts
DROP FUNCTION IF EXISTS create_user_by_superadmin;
DROP FUNCTION IF EXISTS update_user_by_superadmin;
DROP FUNCTION IF EXISTS delete_user_by_superadmin;
DROP FUNCTION IF EXISTS get_all_users;
DROP FUNCTION IF EXISTS reset_user_password;
DROP FUNCTION IF EXISTS generate_username;

-- Then run the corrected version from supabase-user-management.sql
```

### Option 3: Quick Test

To test if functions are working, run this in Supabase SQL Editor:

```sql
-- List all functions in the public schema
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name LIKE '%user%'
ORDER BY routine_name;
```

This will show you all user-related functions that exist.

## Verification Steps

After running either solution:

1. **Check if functions exist:**
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN (
       'create_user_simple',
       'update_user_simple', 
       'delete_user_simple',
       'reset_password_simple',
       'generate_username_simple'
   );
   ```

2. **Test a simple function call:**
   ```sql
   SELECT generate_username_simple('John Doe', 'EMP123');
   ```

3. **Test user creation:**
   ```sql
   SELECT create_user_simple(
       'test@example.com',
       'password123',
       'Test User',
       'testuser',
       'TEST001',
       'Test Position',
       'user'
   );
   ```

## Current Status

✅ **Fixed Issues:**
- Added explicit `public.` schema references to all functions
- Simplified parameter names for better compatibility
- Created backup simplified functions
- Updated frontend service calls to match

🔧 **Next Steps:**
1. Choose either Option 1 (Simplified) or Option 2 (Original Fixed)
2. Run the SQL script in your Supabase dashboard
3. Test the functions using the verification steps
4. Use the application to create users

## Files Updated

- `supabase-user-management.sql` - Fixed with explicit schema references
- `supabase-user-management-simple.sql` - New simplified version
- `src/lib/supabase.ts` - Updated to use simplified function names
- Frontend context already supports both approaches

## Recommendation

Use **Option 1 (Simplified Functions)** as they:
- Have better error handling
- Use simpler parameter names
- Are more compatible with Supabase
- Include all necessary validations
- Work with the existing frontend code