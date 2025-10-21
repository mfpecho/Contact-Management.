-- URGENT FIX: Enable True Collaborative Contact Viewing
-- This script specifically addresses the issue where users can only see their own contacts

-- STEP 1: Completely disable RLS temporarily to test if it's the issue
-- Run this first to verify RLS is the problem
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;

-- Test your app now. If all users can see all contacts, then RLS was blocking collaborative viewing.
-- If this fixes the issue, proceed to STEP 2 to implement proper collaborative RLS.

-- STEP 2: Re-enable RLS with SIMPLIFIED collaborative policies
-- Only run this after confirming STEP 1 worked

-- Re-enable RLS
-- ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start completely fresh
-- DROP POLICY IF EXISTS "collaborative_view_all_contacts" ON contacts;
-- DROP POLICY IF EXISTS "collaborative_insert_contacts" ON contacts;
-- DROP POLICY IF EXISTS "collaborative_update_contacts" ON contacts;
-- DROP POLICY IF EXISTS "collaborative_delete_contacts" ON contacts;
-- DROP POLICY IF EXISTS "service_role_full_access" ON contacts;

-- Create ONE SIMPLE policy that allows everyone to see everything
-- CREATE POLICY "allow_all_authenticated" ON contacts FOR ALL USING (true);

-- STEP 3: Alternative - Use the get_contacts function with SECURITY DEFINER
-- This approach bypasses RLS entirely for contact fetching

CREATE OR REPLACE FUNCTION get_all_contacts_collaborative()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER  -- This bypasses RLS completely
AS $$
DECLARE
    contacts_result json;
    contact_count integer;
BEGIN
    -- Count all contacts
    SELECT COUNT(*) INTO contact_count FROM contacts;
    
    -- Get all contacts with owner information
    WITH all_contacts AS (
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
                'id', ac.id::text,
                'firstName', COALESCE(ac.first_name, ''),
                'middleName', COALESCE(ac.middle_name, ''),
                'lastName', COALESCE(ac.last_name, ''),
                'birthday', COALESCE(ac.birthday::text, ''),
                'contactNumber', COALESCE(ac.phone, ''),
                'company', COALESCE(ac.company, ''),
                'ownerId', COALESCE(ac.user_id::text, ''),
                'ownerName', COALESCE(ac.user_name, 'Unknown User'),
                'createdAt', COALESCE(ac.created_at::text, '')
            )
        ), '[]'::json),
        'count', contact_count,
        'message', 'All contacts retrieved collaboratively'
    ) INTO contacts_result
    FROM all_contacts ac;
    
    RETURN contacts_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to fetch collaborative contacts: ' || SQLERRM,
            'contacts', '[]'::json
        );
END;
$$;

-- Grant permissions to the new function
GRANT EXECUTE ON FUNCTION get_all_contacts_collaborative TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_contacts_collaborative TO anon;

-- STEP 4: Test the new function
SELECT get_all_contacts_collaborative();

-- DEBUGGING QUERIES - Run these to understand what's happening

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity, enablerls 
FROM pg_tables 
WHERE tablename = 'contacts';

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'contacts';

-- Test basic contact access
SELECT 
    'Total contacts in database: ' || COUNT(*)::text as info
FROM contacts;

-- Test if any user context is set
SELECT 
    CASE 
        WHEN current_setting('app.current_user_id', true) IS NOT NULL 
        THEN 'User context is set: ' || current_setting('app.current_user_id', true)
        ELSE 'No user context set'
    END as auth_context;

-- Test Supabase auth
SELECT 
    CASE 
        WHEN auth.uid() IS NOT NULL 
        THEN 'Supabase auth UID: ' || auth.uid()::text
        ELSE 'No Supabase auth'
    END as supabase_auth;

-- INSTRUCTIONS:
-- 1. First, run STEP 1 (disable RLS) and test your app
-- 2. If users can see all contacts, then RLS was the issue
-- 3. Use the new get_all_contacts_collaborative() function instead of get_contacts_simple()
-- 4. Update your TypeScript code to call this new function

-- FINAL MESSAGE
DO $$
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'COLLABORATIVE VIEWING FIX APPLIED';
    RAISE NOTICE '====================================================';
    RAISE NOTICE '1. RLS has been DISABLED for testing';
    RAISE NOTICE '2. New function get_all_contacts_collaborative() created';
    RAISE NOTICE '3. This function bypasses RLS completely';
    RAISE NOTICE '4. Update your app to use this function for collaborative viewing';
    RAISE NOTICE '5. Test your app now - all users should see all contacts';
    RAISE NOTICE '====================================================';
END $$;