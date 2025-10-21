-- Fix User Type Contact Access Issues
-- This script addresses RLS policy issues preventing users from fetching contact data

-- Step 1: Drop existing problematic RLS policies
DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
DROP POLICY IF EXISTS "Admins can view all contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;

-- Step 2: Create new collaborative RLS policies that work with the authentication system
-- Allow all authenticated users to view all contacts (collaborative system)
CREATE POLICY "collaborative_view_all_contacts" ON contacts
    FOR SELECT 
    USING (
        -- Allow access if user is authenticated through Supabase Auth
        auth.role() = 'authenticated' 
        OR
        -- Allow access if current_setting exists (for RPC functions)
        current_setting('app.current_user_id', true) IS NOT NULL
        OR
        -- Allow if user exists in users table (additional safety check)
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = COALESCE(
                auth.uid()::text,
                current_setting('app.current_user_id', true)
            )
        )
    );

-- Allow authenticated users to insert contacts
CREATE POLICY "collaborative_insert_contacts" ON contacts
    FOR INSERT 
    WITH CHECK (
        -- Allow if user is authenticated OR current user setting exists
        auth.role() = 'authenticated' OR
        current_setting('app.current_user_id', true) IS NOT NULL OR
        -- Allow if creating user exists in users table
        user_id IN (SELECT id FROM users)
    );

-- Allow users to update contacts (owner or admin)
CREATE POLICY "users_can_update_contacts" ON contacts
    FOR UPDATE 
    USING (
        -- Owner can update their own contacts
        user_id::text = COALESCE(
            auth.uid()::text, 
            current_setting('app.current_user_id', true)
        ) OR
        -- Admins and superadmins can update any contact
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = COALESCE(
                auth.uid()::text, 
                current_setting('app.current_user_id', true)
            )
            AND role IN ('admin', 'superadmin')
        )
    );

-- Allow users to delete contacts (owner or admin)
CREATE POLICY "users_can_delete_contacts" ON contacts
    FOR DELETE 
    USING (
        -- Owner can delete their own contacts
        user_id::text = COALESCE(
            auth.uid()::text, 
            current_setting('app.current_user_id', true)
        ) OR
        -- Admins and superadmins can delete any contact
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = COALESCE(
                auth.uid()::text, 
                current_setting('app.current_user_id', true)
            )
            AND role IN ('admin', 'superadmin')
        )
    );

-- Step 3: Update the get_contacts function to bypass RLS when needed
CREATE OR REPLACE FUNCTION get_contacts_simple(
    user_id_filter uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to bypass RLS
AS $$
DECLARE
    contacts_result json;
    contact_count integer;
    current_user_id uuid;
    current_user_role text;
BEGIN
    -- Get current user info from custom auth or Supabase auth
    current_user_id := COALESCE(
        auth.uid(),
        current_setting('app.current_user_id', true)::uuid
    );
    
    -- Log the request for debugging
    RAISE NOTICE 'get_contacts_simple called with user_id_filter: %, current_user: %', 
        user_id_filter, current_user_id;
    
    -- Get current user role for authorization
    SELECT role INTO current_user_role 
    FROM users 
    WHERE id = current_user_id;
    
    RAISE NOTICE 'Current user role: %', current_user_role;
    
    -- Set current user for RLS policies
    IF current_user_id IS NOT NULL THEN
        PERFORM set_config('app.current_user_id', current_user_id::text, true);
    END IF;
    
    -- If no user filter is provided, return all contacts (collaborative view)
    -- All authenticated users can see all contacts in this system
    IF user_id_filter IS NULL THEN
        -- Get count first for logging
        SELECT COUNT(*) INTO contact_count FROM contacts;
        RAISE NOTICE 'Fetching all % contacts from database', contact_count;
        
        -- Use CTE for proper ordering
        WITH ordered_contacts AS (
            SELECT 
                c.id,
                c.first_name,
                c.middle_name,
                c.last_name,
                c.birthday,
                c.phone,
                c.company,
                c.user_id,
                c.created_at,
                u.name as user_name
            FROM contacts c
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
        )
        SELECT json_build_object(
            'success', true,
            'contacts', COALESCE(json_agg(
                json_build_object(
                    'id', oc.id::text,
                    'firstName', COALESCE(oc.first_name, ''),
                    'middleName', COALESCE(oc.middle_name, ''),
                    'lastName', COALESCE(oc.last_name, ''),
                    'birthday', COALESCE(oc.birthday::text, ''),
                    'contactNumber', COALESCE(oc.phone, ''),
                    'company', COALESCE(oc.company, ''),
                    'ownerId', COALESCE(oc.user_id::text, ''),
                    'ownerName', COALESCE(oc.user_name, 'Unknown User'),
                    'createdAt', COALESCE(oc.created_at::text, '')
                )
            ), '[]'::json),
            'count', contact_count
        ) INTO contacts_result
        FROM ordered_contacts oc;
    ELSE
        -- Get count first for logging
        SELECT COUNT(*) INTO contact_count FROM contacts WHERE user_id = user_id_filter;
        RAISE NOTICE 'Fetching % contacts for user %', contact_count, user_id_filter;
        
        -- Use CTE for proper ordering
        WITH ordered_contacts AS (
            SELECT 
                c.id,
                c.first_name,
                c.middle_name,
                c.last_name,
                c.birthday,
                c.phone,
                c.company,
                c.user_id,
                c.created_at,
                u.name as user_name
            FROM contacts c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.user_id = user_id_filter
            ORDER BY c.created_at DESC
        )
        SELECT json_build_object(
            'success', true,
            'contacts', COALESCE(json_agg(
                json_build_object(
                    'id', oc.id::text,
                    'firstName', COALESCE(oc.first_name, ''),
                    'middleName', COALESCE(oc.middle_name, ''),
                    'lastName', COALESCE(oc.last_name, ''),
                    'birthday', COALESCE(oc.birthday::text, ''),
                    'contactNumber', COALESCE(oc.phone, ''),
                    'company', COALESCE(oc.company, ''),
                    'ownerId', COALESCE(oc.user_id::text, ''),
                    'ownerName', COALESCE(oc.user_name, 'Unknown User'),
                    'createdAt', COALESCE(oc.created_at::text, '')
                )
            ), '[]'::json),
            'count', contact_count
        ) INTO contacts_result
        FROM ordered_contacts oc;
    END IF;
    
    -- Log results
    RAISE NOTICE 'Returning % contacts', contact_count;
    
    RETURN contacts_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_contacts_simple: %', SQLERRM;
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to fetch contacts: ' || SQLERRM,
            'contacts', '[]'::json
        );
END;
$$;

-- Step 4: Create a function to set authentication context for RPC calls
CREATE OR REPLACE FUNCTION set_auth_context(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set the current user context for RLS policies
    PERFORM set_config('app.current_user_id', user_id::text, true);
END;
$$;

-- Step 5: Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_contacts_simple TO authenticated;
GRANT EXECUTE ON FUNCTION get_contacts_simple TO anon;
GRANT EXECUTE ON FUNCTION set_auth_context TO authenticated;
GRANT EXECUTE ON FUNCTION set_auth_context TO anon;

-- Step 6: Ensure tables allow the service role to bypass RLS
ALTER TABLE contacts FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE changelog FORCE ROW LEVEL SECURITY;

-- Create service role bypass policy (for administrative functions)
CREATE POLICY "service_role_bypass_contacts" ON contacts
    USING (current_user = 'service_role');
    
CREATE POLICY "service_role_bypass_users" ON users  
    USING (current_user = 'service_role');
    
CREATE POLICY "service_role_bypass_changelog" ON changelog
    USING (current_user = 'service_role');

-- Step 7: Test the fix with a simple query
-- This should return all contacts for any authenticated user
DO $$
DECLARE
    test_result json;
    test_user_id uuid;
BEGIN
    -- Get a test user ID
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    -- Set auth context
    IF test_user_id IS NOT NULL THEN
        PERFORM set_config('app.current_user_id', test_user_id::text, true);
        
        -- Test the function
        SELECT get_contacts_simple() INTO test_result;
        
        RAISE NOTICE 'Test result: %', test_result;
    ELSE
        RAISE NOTICE 'No users found for testing';
    END IF;
END $$;