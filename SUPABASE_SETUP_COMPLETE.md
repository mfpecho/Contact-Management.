# Step-by-Step Supabase Database Setup

## IMPORTANT: Follow these steps in order to fix the missing `create_user_simple` function

### Step 1: Create the Users Table

1. **Open your Supabase project dashboard**
2. **Go to SQL Editor** (left sidebar)
3. **Click "New query"**
4. **Copy and paste this SQL and run it:**

```sql
-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'admin', 'superadmin')),
    name text NOT NULL,
    username text UNIQUE NOT NULL,
    employee_number text UNIQUE NOT NULL,
    "position" text NOT NULL,
    avatar text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Disable Row Level Security for now (you can enable it later with proper policies)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Step 2: Enable Required Extensions

**Run this SQL to enable password hashing:**

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Step 3: Create the create_user_simple Function

**Copy and paste this complete function:**

```sql
-- Function to create user with validation
CREATE OR REPLACE FUNCTION create_user_simple(
    user_email text,
    user_password text,
    user_name text,
    user_username text,
    user_employee_number text,
    user_position text,
    user_role text DEFAULT 'user'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id uuid;
    result json;
BEGIN
    -- Basic validation
    IF user_role NOT IN ('user', 'admin', 'superadmin') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid role');
    END IF;
    
    -- Check for duplicates
    IF EXISTS(SELECT 1 FROM users WHERE email = user_email) THEN
        RETURN json_build_object('success', false, 'error', 'Email already exists');
    END IF;
    
    IF EXISTS(SELECT 1 FROM users WHERE username = user_username) THEN
        RETURN json_build_object('success', false, 'error', 'Username already exists');
    END IF;
    
    IF EXISTS(SELECT 1 FROM users WHERE employee_number = user_employee_number) THEN
        RETURN json_build_object('success', false, 'error', 'Employee number already exists');
    END IF;
    
    -- Insert new user
    INSERT INTO users (
        email, 
        password_hash, 
        role, 
        name, 
        username, 
        employee_number, 
        "position", 
        avatar
    ) VALUES (
        user_email,
        crypt(user_password, gen_salt('bf')),
        user_role,
        user_name,
        user_username,
        user_employee_number,
        user_position,
        'https://ui-avatars.com/api/?name=' || replace(user_name, ' ', '+') || '&background=3b82f6&color=fff'
    ) RETURNING id INTO new_user_id;
    
    RETURN json_build_object(
        'success', true, 
        'user_id', new_user_id, 
        'message', 'User created successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Failed to create user: ' || SQLERRM
        );
END;
$$;
```

### Step 4: Grant Permissions

**Run this to allow your app to use the function:**

```sql
-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_user_simple TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_simple TO anon;
```

### Step 5: Test the Function

**Test if the function works by running:**

```sql
-- Test the function
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

**Expected result:**
```json
{"success": true, "user_id": "some-uuid", "message": "User created successfully"}
```

### Step 6: Create Other Required Functions

**If you want full functionality, also run these:**

```sql
-- Function to generate username
CREATE OR REPLACE FUNCTION generate_username_simple(
    full_name text,
    emp_number text
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    first_name text;
    emp_suffix text;
    base_username text;
    final_username text;
    counter int := 0;
BEGIN
    -- Extract first name and employee number suffix
    first_name := lower(split_part(full_name, ' ', 1));
    emp_suffix := right(emp_number, 3);
    
    -- Create base username
    base_username := regexp_replace(first_name || emp_suffix, '[^a-z0-9]', '', 'g');
    final_username := base_username;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS(SELECT 1 FROM users WHERE username = final_username) LOOP
        counter := counter + 1;
        final_username := base_username || counter::text;
    END LOOP;
    
    RETURN final_username;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_username_simple TO authenticated;
GRANT EXECUTE ON FUNCTION generate_username_simple TO anon;
```

### Step 7: Verify Everything Works

1. **Check if functions exist:**
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%';
```

2. **Check if table exists:**
```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

### Step 8: Test in Your Application

1. **Restart your development server**
2. **Open browser console (F12)**
3. **Login as SuperAdmin**: `superadmin@company.com` / `SuperAdmin123!`
4. **Try creating a user**
5. **Look for success message**: "✅ Supabase database connection is working"

### Step 9: Verify Data Was Saved

**Check in Supabase Table Editor:**
1. Go to **Table Editor** in Supabase
2. Select **users** table
3. You should see your created users there

## Alternative: Use the Complete SQL File

Instead of running individual steps, you can:

1. **Copy the entire content** of `supabase-user-management-simple.sql`
2. **Paste it into Supabase SQL Editor**
3. **Run it all at once**

This will create all tables, functions, and permissions needed.

## Troubleshooting

If you still get errors:

1. **Check Extensions**: Make sure `pgcrypto` is enabled
2. **Check Permissions**: Verify RLS is disabled or proper policies exist
3. **Check Credentials**: Ensure your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct
4. **Check Console**: Look for detailed error messages in browser console

## Success Indicators

✅ **Function created successfully**
✅ **Test query returns success JSON**
✅ **App console shows "Supabase database connection is working"**
✅ **Users appear in Supabase Table Editor after creation**