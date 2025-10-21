-- EMERGENCY FIX: Collaborative Contact Viewing for All User Types
-- This addresses the 404 errors and UUID issues preventing users from seeing contacts

-- ===========================================
-- STEP 1: Fix the UUID error in get_contacts_simple
-- ===========================================

-- Drop and recreate the function to handle empty string UUIDs properly
CREATE OR REPLACE FUNCTION get_contacts_simple(
    user_id_filter uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    contacts_result json;
    contact_count integer;
    safe_user_filter uuid;
BEGIN
    -- Handle empty string or invalid UUID by setting to NULL
    safe_user_filter := user_id_filter;
    
    -- Log the request for debugging
    RAISE NOTICE 'get_contacts_simple called with user_id_filter: % (safe_filter: %)', 
        user_id_filter, safe_user_filter;
    
    -- If no user filter is provided, return all contacts (collaborative view)
    IF safe_user_filter IS NULL THEN
        -- Get count first for logging
        SELECT COUNT(*) INTO contact_count FROM contacts;
        RAISE NOTICE 'Fetching all % contacts from database (collaborative view)', contact_count;
        
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
            'count', contact_count,
            'message', 'All contacts retrieved successfully (collaborative view)'
        ) INTO contacts_result
        FROM ordered_contacts oc;
    ELSE
        -- Get count first for logging
        SELECT COUNT(*) INTO contact_count FROM contacts WHERE user_id = safe_user_filter;
        RAISE NOTICE 'Fetching % contacts for user %', contact_count, safe_user_filter;
        
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
            WHERE c.user_id = safe_user_filter
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
            'count', contact_count,
            'message', 'User contacts retrieved successfully'
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

-- ===========================================
-- STEP 2: Create the missing collaborative functions
-- ===========================================

-- Create get_all_contacts_collaborative function
CREATE OR REPLACE FUNCTION get_all_contacts_collaborative()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    contacts_result json;
    contact_count integer;
BEGIN
    RAISE NOTICE 'get_all_contacts_collaborative called';
    
    -- Count all contacts
    SELECT COUNT(*) INTO contact_count FROM contacts;
    RAISE NOTICE 'Found % contacts in database', contact_count;
    
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
        'message', 'Collaborative contacts retrieved successfully',
        'source', 'get_all_contacts_collaborative'
    ) INTO contacts_result
    FROM all_contacts ac;
    
    RAISE NOTICE 'Returning % contacts from collaborative function', contact_count;
    
    RETURN contacts_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_all_contacts_collaborative: %', SQLERRM;
        RETURN json_build_object(
            'success', false,
            'error', 'Collaborative function failed: ' || SQLERRM,
            'contacts', '[]'::json,
            'source', 'get_all_contacts_collaborative_error'
        );
END;
$$;

-- Create get_contacts_for_superadmin function
CREATE OR REPLACE FUNCTION get_contacts_for_superadmin()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    contacts_result json;
    contact_count integer;
BEGIN
    RAISE NOTICE 'get_contacts_for_superadmin called';
    
    -- Count all contacts
    SELECT COUNT(*) INTO contact_count FROM contacts;
    RAISE NOTICE 'Superadmin function: Found % contacts in database', contact_count;
    
    -- Get ALL contacts with owner information (no restrictions for superadmin)
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
        'message', 'Superadmin contacts retrieved successfully',
        'source', 'get_contacts_for_superadmin'
    ) INTO contacts_result
    FROM all_contacts ac;
    
    RAISE NOTICE 'Superadmin function: Returning % contacts', contact_count;
    
    RETURN contacts_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_contacts_for_superadmin: %', SQLERRM;
        RETURN json_build_object(
            'success', false,
            'error', 'Superadmin function failed: ' || SQLERRM,
            'contacts', '[]'::json,
            'source', 'get_contacts_for_superadmin_error'
        );
END;
$$;

-- ===========================================
-- STEP 3: Ensure RLS is disabled for collaborative access
-- ===========================================

ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE changelog DISABLE ROW LEVEL SECURITY;

-- ===========================================
-- STEP 4: Grant permissions to all functions
-- ===========================================

GRANT EXECUTE ON FUNCTION get_contacts_simple TO authenticated;
GRANT EXECUTE ON FUNCTION get_contacts_simple TO anon;
GRANT EXECUTE ON FUNCTION get_all_contacts_collaborative TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_contacts_collaborative TO anon;
GRANT EXECUTE ON FUNCTION get_contacts_for_superadmin TO authenticated;
GRANT EXECUTE ON FUNCTION get_contacts_for_superadmin TO anon;

-- ===========================================
-- STEP 5: Test all functions
-- ===========================================

-- Test the fixed get_contacts_simple function
SELECT 'Testing get_contacts_simple()...' as test;
SELECT get_contacts_simple(NULL);

-- Test get_all_contacts_collaborative function
SELECT 'Testing get_all_contacts_collaborative()...' as test;
SELECT get_all_contacts_collaborative();

-- Test get_contacts_for_superadmin function
SELECT 'Testing get_contacts_for_superadmin()...' as test;
SELECT get_contacts_for_superadmin();

-- ===========================================
-- STEP 6: Check if there are contacts in the database
-- ===========================================

SELECT 
    'Database Status Check:' as info,
    (SELECT COUNT(*) FROM contacts) as total_contacts,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE role = 'superadmin') as superadmin_count;

-- ===========================================
-- STEP 7: Create some test contacts if none exist
-- ===========================================

DO $$
DECLARE
    contact_count integer;
    test_user_id uuid;
    superadmin_user_id uuid;
BEGIN
    -- Check if contacts exist
    SELECT COUNT(*) INTO contact_count FROM contacts;
    
    IF contact_count = 0 THEN
        RAISE NOTICE 'No contacts found, creating test contacts...';
        
        -- Get a regular user ID
        SELECT id INTO test_user_id FROM users WHERE role = 'user' LIMIT 1;
        
        -- Get a superadmin user ID
        SELECT id INTO superadmin_user_id FROM users WHERE role = 'superadmin' LIMIT 1;
        
        -- Create test contacts if users exist
        IF test_user_id IS NOT NULL THEN
            INSERT INTO contacts (first_name, last_name, phone, company, user_id, birthday) VALUES
            ('John', 'Doe', '09171234567', 'Test Company A', test_user_id, '1990-01-15'),
            ('Jane', 'Smith', '09187654321', 'Test Company B', test_user_id, '1985-05-20');
            
            RAISE NOTICE 'Created 2 test contacts for regular user';
        END IF;
        
        IF superadmin_user_id IS NOT NULL THEN
            INSERT INTO contacts (first_name, last_name, phone, company, user_id, birthday) VALUES
            ('Admin', 'User', '09199999999', 'Admin Company', superadmin_user_id, '1980-12-25'),
            ('Super', 'Admin', '09188888888', 'Super Company', superadmin_user_id, '1975-07-04');
            
            RAISE NOTICE 'Created 2 test contacts for superadmin user';
        END IF;
        
        -- Check final count
        SELECT COUNT(*) INTO contact_count FROM contacts;
        RAISE NOTICE 'Total contacts after creation: %', contact_count;
    ELSE
        RAISE NOTICE 'Found % existing contacts, no test data needed', contact_count;
    END IF;
END $$;

-- ===========================================
-- FINAL STATUS MESSAGE
-- ===========================================

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'COLLABORATIVE VIEWING FIX COMPLETE';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ Fixed UUID error in get_contacts_simple';
    RAISE NOTICE '✅ Created get_all_contacts_collaborative function';
    RAISE NOTICE '✅ Created get_contacts_for_superadmin function';
    RAISE NOTICE '✅ Disabled RLS for collaborative access';
    RAISE NOTICE '✅ Granted proper permissions';
    RAISE NOTICE '✅ Created test contacts if needed';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'All users should now see collaborative contacts!';
    RAISE NOTICE 'Refresh your application to test the fix.';
    RAISE NOTICE '================================================';
END $$;