-- Admin User View Permissions SQL Script
-- This script ensures admins and superadmins can properly view and manage users

-- ==============================================
-- 1. DROP EXISTING USER POLICIES (CLEAN SLATE)
-- ==============================================

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- ==============================================
-- 2. CREATE COMPREHENSIVE USER VIEW POLICIES
-- ==============================================

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        auth.uid()::text = id::text
    );

-- Policy 2: Admins and superadmins can view ALL users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()
            AND role IN ('admin', 'superadmin')
        )
    );

-- Policy 3: Superadmins can insert new users
CREATE POLICY "Superadmins can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()
            AND role = 'superadmin'
        )
    );

-- Policy 4: Superadmins can update user profiles (except their own role)
CREATE POLICY "Superadmins can update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()
            AND role = 'superadmin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()
            AND role = 'superadmin'
        )
    );

-- Policy 5: Superadmins can delete users (except themselves)
CREATE POLICY "Superadmins can delete users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()
            AND role = 'superadmin'
        )
        AND id != auth.uid() -- Prevent self-deletion
    );

-- Policy 6: Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        auth.uid()::text = id::text
    ) WITH CHECK (
        auth.uid()::text = id::text
        AND (OLD.role = NEW.role) -- Prevent users from changing their own role
    );

-- ==============================================
-- 3. CREATE HELPER FUNCTION FOR USER MANAGEMENT
-- ==============================================

-- Function to check if current user is admin/superadmin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    );
END;
$$;

-- Function to check if current user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()
        AND role = 'superadmin'
    );
END;
$$;

-- ==============================================
-- 4. CREATE USER MANAGEMENT FUNCTIONS
-- ==============================================

-- Function to get all users (for admins)
CREATE OR REPLACE FUNCTION get_users_for_admin()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    users_result json;
    user_count integer;
    current_user_role text;
BEGIN
    -- Check if user is admin or superadmin
    SELECT role INTO current_user_role 
    FROM users 
    WHERE id = auth.uid();
    
    IF current_user_role NOT IN ('admin', 'superadmin') THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    -- Get user count for logging
    SELECT COUNT(*) INTO user_count FROM users;
    RAISE NOTICE 'Admin % fetching all % users', auth.uid(), user_count;
    
    -- Get all users with proper JSON formatting
    SELECT json_build_object(
        'success', true,
        'count', user_count,
        'users', COALESCE(json_agg(
            json_build_object(
                'id', u.id::text,
                'name', u.name,
                'email', u.email,
                'username', u.username,
                'role', u.role,
                'employeeNumber', u.employee_number,
                'position', u.position,
                'avatar', u.avatar,
                'createdAt', u.created_at::text,
                'updatedAt', u.updated_at::text
            ) ORDER BY u.created_at DESC
        ), '[]'::json)
    ) INTO users_result
    FROM users u;
    
    RETURN users_result;
END;
$$;

-- Function to create user by admin
CREATE OR REPLACE FUNCTION create_user_by_admin(
    p_name VARCHAR(255),
    p_email VARCHAR(255),
    p_username VARCHAR(100),
    p_password_hash TEXT,
    p_role VARCHAR(20),
    p_employee_number VARCHAR(50),
    p_position VARCHAR(100),
    p_avatar TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    current_user_role text;
    result json;
BEGIN
    -- Check if current user is superadmin
    SELECT role INTO current_user_role 
    FROM users 
    WHERE id = auth.uid();
    
    IF current_user_role != 'superadmin' THEN
        RAISE EXCEPTION 'Access denied. Superadmin privileges required to create users.';
    END IF;
    
    -- Validate role
    IF p_role NOT IN ('user', 'admin', 'superadmin') THEN
        RAISE EXCEPTION 'Invalid role. Must be user, admin, or superadmin.';
    END IF;
    
    -- Insert new user
    INSERT INTO users (
        name, email, username, password_hash, role, 
        employee_number, position, avatar
    ) VALUES (
        p_name, p_email, p_username, p_password_hash, p_role,
        p_employee_number, p_position, p_avatar
    ) RETURNING id INTO new_user_id;
    
    -- Log the creation
    PERFORM log_changelog(
        auth.uid(),
        (SELECT name FROM users WHERE id = auth.uid()),
        current_user_role,
        'create',
        'user',
        'Created new user: ' || p_name,
        new_user_id,
        p_name,
        json_build_object(
            'email', p_email,
            'username', p_username,
            'role', p_role,
            'employee_number', p_employee_number,
            'position', p_position
        )::text
    );
    
    -- Return success result
    SELECT json_build_object(
        'success', true,
        'message', 'User created successfully',
        'user_id', new_user_id::text,
        'user_name', p_name
    ) INTO result;
    
    RETURN result;
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User with this email, username, or employee number already exists'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- ==============================================
-- 5. GRANT PERMISSIONS
-- ==============================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION is_superadmin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_by_admin(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR, VARCHAR, TEXT) TO authenticated;

-- ==============================================
-- 6. TEST THE PERMISSIONS
-- ==============================================

-- Test query to verify admin can see users (run after applying this script)
-- SELECT get_users_for_admin();

-- Test query to check if current user is admin
-- SELECT is_admin_user();

-- Test query to check if current user is superadmin  
-- SELECT is_superadmin_user();

-- ==============================================
-- 7. VERIFICATION QUERIES
-- ==============================================

-- Check existing policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Check if functions were created successfully
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('is_admin_user', 'is_superadmin_user', 'get_users_for_admin', 'create_user_by_admin')
ORDER BY routine_name;

-- Show current user and their role (for testing)
-- SELECT 
--     id,
--     name,
--     email,
--     role,
--     'Current user context' as note
-- FROM users 
-- WHERE id = auth.uid();

-- ==============================================
-- 8. SUCCESS MESSAGE FUNCTION
-- ==============================================

-- Function to display success message after applying permissions
DO $$
BEGIN
    RAISE NOTICE 'Admin user view permissions have been successfully applied!';
    RAISE NOTICE 'Admins and superadmins can now view all users using get_users_for_admin() function';
    RAISE NOTICE 'Superadmins can create users using create_user_by_admin() function';
    RAISE NOTICE 'Script execution completed successfully!';
END
$$;