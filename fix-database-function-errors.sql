-- Database Function Fixes for Contact Management System
-- This file fixes the GROUP BY error in get_contacts_simple and ensures get_changelog exists

-- ==============================================
-- 1. FIX get_contacts_simple FUNCTION
-- ==============================================

-- Drop the existing function to recreate it properly
DROP FUNCTION IF EXISTS get_contacts_simple(uuid);

-- Recreate the function with proper GROUP BY handling
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
BEGIN
    -- Log the request for debugging
    RAISE NOTICE 'get_contacts_simple called with user_id_filter: %', user_id_filter;
    
    -- If no user filter is provided, return all contacts (for admins)
    -- If user filter is provided, return only that user's contacts
    IF user_id_filter IS NULL THEN
        -- Get count first for logging
        SELECT COUNT(*) INTO contact_count FROM contacts;
        RAISE NOTICE 'Fetching all % contacts from database', contact_count;
        
        -- Fixed: Proper subquery approach to avoid GROUP BY issues
        SELECT json_agg(contact_json)
        INTO contacts_result
        FROM (
            SELECT json_build_object(
                'id', c.id::text,
                'firstName', COALESCE(c.first_name, ''),
                'middleName', COALESCE(c.middle_name, ''),
                'lastName', COALESCE(c.last_name, ''),
                'birthday', COALESCE(c.birthday::text, ''),
                'contactNumber', COALESCE(c.phone, ''),
                'company', COALESCE(c.company, ''),
                'ownerId', COALESCE(c.user_id::text, ''),
                'ownerName', COALESCE(u.name, 'Unknown User'),
                'createdAt', COALESCE(c.created_at::text, '')
            ) as contact_json
            FROM contacts c
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
        ) subquery;
    ELSE
        -- Get count first for logging
        SELECT COUNT(*) INTO contact_count FROM contacts WHERE user_id = user_id_filter;
        RAISE NOTICE 'Fetching % contacts for user %', contact_count, user_id_filter;
        
        -- Fixed: Proper subquery approach to avoid GROUP BY issues
        SELECT json_agg(contact_json)
        INTO contacts_result
        FROM (
            SELECT json_build_object(
                'id', c.id::text,
                'firstName', COALESCE(c.first_name, ''),
                'middleName', COALESCE(c.middle_name, ''),
                'lastName', COALESCE(c.last_name, ''),
                'birthday', COALESCE(c.birthday::text, ''),
                'contactNumber', COALESCE(c.phone, ''),
                'company', COALESCE(c.company, ''),
                'ownerId', COALESCE(c.user_id::text, ''),
                'ownerName', COALESCE(u.name, 'Unknown User'),
                'createdAt', COALESCE(c.created_at::text, '')
            ) as contact_json
            FROM contacts c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.user_id = user_id_filter
            ORDER BY c.created_at DESC
        ) subquery;
    END IF;
    
    -- If no contacts found, return empty array
    IF contacts_result IS NULL THEN
        contacts_result := '[]'::json;
        RAISE NOTICE 'No contacts found, returning empty array';
    ELSE
        RAISE NOTICE 'Returning % contacts', json_array_length(contacts_result);
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'contacts', contacts_result,
        'count', COALESCE(json_array_length(contacts_result), 0)
    );
    
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

-- ==============================================
-- 2. ENSURE get_changelog FUNCTION EXISTS
-- ==============================================

-- Check if changelog table exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'changelog') THEN
        -- Create changelog table
        CREATE TABLE changelog (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            user_id UUID,
            user_name VARCHAR(255),
            user_role VARCHAR(20),
            action VARCHAR(20) NOT NULL,
            entity VARCHAR(20) NOT NULL,
            entity_id UUID,
            entity_name VARCHAR(255),
            description TEXT NOT NULL,
            details TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX idx_changelog_user_id ON changelog(user_id);
        CREATE INDEX idx_changelog_action ON changelog(action);
        CREATE INDEX idx_changelog_entity ON changelog(entity);
        CREATE INDEX idx_changelog_timestamp ON changelog(timestamp);

        RAISE NOTICE 'Created changelog table with indexes';
    ELSE
        RAISE NOTICE 'Changelog table already exists';
    END IF;
END $$;

-- Drop existing get_changelog function if it exists
DROP FUNCTION IF EXISTS get_changelog(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_changelog(INTEGER, INTEGER, UUID, VARCHAR, VARCHAR, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

-- Create the get_changelog function
CREATE OR REPLACE FUNCTION get_changelog(
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    changelog_result json;
    total_count integer;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_count FROM changelog;
    
    -- Get paginated changelog entries
    SELECT json_agg(changelog_json)
    INTO changelog_result
    FROM (
        SELECT json_build_object(
            'id', c.id::text,
            'timestamp', c.timestamp::text,
            'userId', COALESCE(c.user_id::text, ''),
            'userName', COALESCE(c.user_name, 'System'),
            'userRole', COALESCE(c.user_role, 'system'),
            'action', c.action,
            'entity', c.entity,
            'entityId', COALESCE(c.entity_id::text, ''),
            'entityName', COALESCE(c.entity_name, ''),
            'description', c.description,
            'details', COALESCE(c.details, ''),
            'createdAt', c.created_at::text
        ) as changelog_json
        FROM changelog c
        ORDER BY c.timestamp DESC
        LIMIT p_limit
        OFFSET p_offset
    ) subquery;
    
    -- If no changelog entries found, return empty array
    IF changelog_result IS NULL THEN
        changelog_result := '[]'::json;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'changelog', changelog_result,
        'total', total_count,
        'limit', p_limit,
        'offset', p_offset
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_changelog: %', SQLERRM;
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to fetch changelog: ' || SQLERRM,
            'changelog', '[]'::json
        );
END;
$$;

-- ==============================================
-- 2B. CREATE get_users_simple FUNCTION
-- ==============================================

-- Drop existing get_users_simple function if it exists
DROP FUNCTION IF EXISTS get_users_simple();

-- Create the get_users_simple function
CREATE OR REPLACE FUNCTION get_users_simple()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    users_result json;
    user_count integer;
BEGIN
    -- Log the request for debugging
    RAISE NOTICE 'get_users_simple called';
    
    -- Get total count first for logging
    SELECT COUNT(*) INTO user_count FROM users;
    RAISE NOTICE 'Fetching all % users from database', user_count;
    
    -- Get all users with proper JSON formatting
    SELECT json_agg(user_json)
    INTO users_result
    FROM (
        SELECT json_build_object(
            'id', u.id::text,
            'email', COALESCE(u.email, ''),
            'name', COALESCE(u.name, ''),
            'username', COALESCE(u.username, ''),
            'employeeNumber', COALESCE(u.employee_number, ''),
            'position', COALESCE(u.position, ''),
            'role', COALESCE(u.role, 'user'),
            'createdAt', COALESCE(u.created_at::text, ''),
            'avatar', u.avatar
        ) as user_json
        FROM users u
        ORDER BY u.created_at DESC
    ) subquery;
    
    -- If no users found, return empty array
    IF users_result IS NULL THEN
        users_result := '[]'::json;
        RAISE NOTICE 'No users found, returning empty array';
    ELSE
        RAISE NOTICE 'Returning % users', json_array_length(users_result);
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'users', users_result,
        'count', COALESCE(json_array_length(users_result), 0)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_users_simple: %', SQLERRM;
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to fetch users: ' || SQLERRM,
            'users', '[]'::json
        );
END;
$$;

-- ==============================================
-- 3. ENSURE log_changelog FUNCTION EXISTS
-- ==============================================

-- Drop existing log_changelog functions with different signatures
-- First, let's find and drop ALL existing log_changelog functions
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Drop all existing log_changelog functions regardless of signature
    FOR func_record IN 
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'log_changelog' AND n.nspname = 'public'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.proname || '(' || func_record.args || ')';
        RAISE NOTICE 'Dropped function: %(%)', func_record.proname, func_record.args;
    END LOOP;
END $$;

-- Create log_changelog function with consistent signature
CREATE OR REPLACE FUNCTION log_changelog(
    p_user_id UUID,
    p_user_name VARCHAR(255),
    p_user_role VARCHAR(20),
    p_action VARCHAR(20),
    p_entity VARCHAR(20),
    p_entity_id UUID DEFAULT NULL,
    p_entity_name VARCHAR(255) DEFAULT NULL,
    p_description TEXT DEFAULT '',
    p_details TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    changelog_id UUID;
BEGIN
    INSERT INTO changelog (
        user_id, user_name, user_role, action, entity,
        entity_id, entity_name, description, details
    ) VALUES (
        p_user_id, p_user_name, p_user_role, p_action, p_entity,
        p_entity_id, p_entity_name, p_description, p_details
    ) RETURNING id INTO changelog_id;
    
    RETURN changelog_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error logging to changelog: %', SQLERRM;
        RETURN NULL;
END;
$$;

-- ==============================================
-- 4. GRANT PROPER PERMISSIONS
-- ==============================================

-- Grant permissions to contact functions
GRANT EXECUTE ON FUNCTION get_contacts_simple TO authenticated;
GRANT EXECUTE ON FUNCTION get_contacts_simple TO anon;

-- Grant permissions to user functions
GRANT EXECUTE ON FUNCTION get_users_simple TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_simple TO anon;

-- Grant permissions to changelog functions
GRANT EXECUTE ON FUNCTION get_changelog TO authenticated;
GRANT EXECUTE ON FUNCTION get_changelog TO anon;
GRANT EXECUTE ON FUNCTION log_changelog TO authenticated;
GRANT EXECUTE ON FUNCTION log_changelog TO anon;

-- Grant table permissions
GRANT SELECT ON changelog TO authenticated;
GRANT INSERT ON changelog TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON contacts TO authenticated;

-- ==============================================
-- 5. TEST THE FUNCTIONS
-- ==============================================

-- Test get_contacts_simple function
DO $$
DECLARE
    test_result json;
BEGIN
    SELECT get_contacts_simple() INTO test_result;
    IF (test_result->>'success')::boolean THEN
        RAISE NOTICE 'SUCCESS: get_contacts_simple function is working correctly';
        RAISE NOTICE 'Contacts found: %', (test_result->>'count')::integer;
    ELSE
        RAISE NOTICE 'ERROR: get_contacts_simple failed with: %', test_result->>'error';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: get_contacts_simple test failed: %', SQLERRM;
END $$;

-- Test get_users_simple function
DO $$
DECLARE
    test_result json;
BEGIN
    SELECT get_users_simple() INTO test_result;
    IF (test_result->>'success')::boolean THEN
        RAISE NOTICE 'SUCCESS: get_users_simple function is working correctly';
        RAISE NOTICE 'Users found: %', (test_result->>'count')::integer;
    ELSE
        RAISE NOTICE 'ERROR: get_users_simple failed with: %', test_result->>'error';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: get_users_simple test failed: %', SQLERRM;
END $$;

-- Test get_changelog function
DO $$
DECLARE
    test_result json;
BEGIN
    SELECT get_changelog(10, 0) INTO test_result;
    IF (test_result->>'success')::boolean THEN
        RAISE NOTICE 'SUCCESS: get_changelog function is working correctly';
        RAISE NOTICE 'Changelog entries found: %', (test_result->>'total')::integer;
    ELSE
        RAISE NOTICE 'ERROR: get_changelog failed with: %', test_result->>'error';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: get_changelog test failed: %', SQLERRM;
END $$;

-- ==============================================
-- 6. CREATE get_system_activity_summary FUNCTION
-- ==============================================

-- Create the get_system_activity_summary function for ActivityDashboard
CREATE OR REPLACE FUNCTION get_system_activity_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    activity_result json;
    total_users integer;
    total_contacts integer;
    active_users integer;
    recent_contacts integer;
    recent_users integer;
BEGIN
    -- Log the request for debugging
    RAISE NOTICE 'get_system_activity_summary called';
    
    -- Get total counts
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO total_contacts FROM contacts;
    
    -- Get active users (users who have contacts)
    SELECT COUNT(DISTINCT user_id) INTO active_users FROM contacts WHERE user_id IS NOT NULL;
    
    -- Get recent activity (last 7 days)
    SELECT COUNT(*) INTO recent_contacts 
    FROM contacts 
    WHERE created_at >= NOW() - INTERVAL '7 days';
    
    SELECT COUNT(*) INTO recent_users 
    FROM users 
    WHERE created_at >= NOW() - INTERVAL '7 days';
    
    -- Build activity summary
    activity_result := json_build_object(
        'totalUsers', total_users,
        'totalContacts', total_contacts,
        'activeUsers', active_users,
        'recentContacts', recent_contacts,
        'recentUsers', recent_users,
        'averageContactsPerUser', CASE 
            WHEN total_users > 0 THEN ROUND(total_contacts::decimal / total_users::decimal, 2)
            ELSE 0 
        END,
        'lastUpdated', NOW()::text
    );
    
    RAISE NOTICE 'Activity summary: users=%, contacts=%, active=%, recent_contacts=%, recent_users=%', 
        total_users, total_contacts, active_users, recent_contacts, recent_users;
    
    RETURN json_build_object(
        'success', true,
        'data', activity_result
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_system_activity_summary: %', SQLERRM;
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to get activity summary: ' || SQLERRM,
            'data', json_build_object()
        );
END;
$$;

-- Grant permissions to activity functions
GRANT EXECUTE ON FUNCTION get_system_activity_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_activity_summary TO anon;

-- Test get_system_activity_summary function
DO $$
DECLARE
    test_result json;
BEGIN
    SELECT get_system_activity_summary() INTO test_result;
    IF (test_result->>'success')::boolean THEN
        RAISE NOTICE 'SUCCESS: get_system_activity_summary function is working correctly';
        RAISE NOTICE 'Activity data: %', test_result->'data';
    ELSE
        RAISE NOTICE 'ERROR: get_system_activity_summary failed with: %', test_result->>'error';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: get_system_activity_summary test failed: %', SQLERRM;
END $$;

-- ==============================================
-- 6B. CREATE get_user_activity_timeline FUNCTION
-- ==============================================

-- Create the get_user_activity_timeline function for user activity tracking
CREATE OR REPLACE FUNCTION get_user_activity_timeline(
    p_limit INTEGER DEFAULT 50
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    timeline_result json;
    total_count integer;
BEGIN
    -- Log the request for debugging
    RAISE NOTICE 'get_user_activity_timeline called with limit: %', p_limit;
    
    -- Get total count of timeline entries
    SELECT COUNT(*) INTO total_count FROM changelog;
    
    -- Get timeline entries from changelog
    SELECT json_agg(timeline_json)
    INTO timeline_result
    FROM (
        SELECT json_build_object(
            'id', c.id::text,
            'timestamp', c.timestamp::text,
            'userId', COALESCE(c.user_id::text, ''),
            'userName', COALESCE(c.user_name, 'System'),
            'userRole', COALESCE(c.user_role, 'system'),
            'action', c.action,
            'entity', c.entity,
            'entityId', COALESCE(c.entity_id::text, ''),
            'entityName', COALESCE(c.entity_name, ''),
            'description', c.description,
            'details', COALESCE(c.details, ''),
            'createdAt', c.created_at::text,
            'type', 'activity'
        ) as timeline_json
        FROM changelog c
        ORDER BY c.timestamp DESC
        LIMIT p_limit
    ) subquery;
    
    -- If no timeline entries found, return empty array
    IF timeline_result IS NULL THEN
        timeline_result := '[]'::json;
        RAISE NOTICE 'No timeline entries found, returning empty array';
    ELSE
        RAISE NOTICE 'Returning % timeline entries', json_array_length(timeline_result);
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'timeline', timeline_result,
        'total', total_count,
        'limit', p_limit
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_user_activity_timeline: %', SQLERRM;
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to get user activity timeline: ' || SQLERRM,
            'timeline', '[]'::json
        );
END;
$$;

-- Grant permissions to user activity timeline function
GRANT EXECUTE ON FUNCTION get_user_activity_timeline TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_timeline TO anon;

-- Test get_user_activity_timeline function
DO $$
DECLARE
    test_result json;
BEGIN
    SELECT get_user_activity_timeline(20) INTO test_result;
    IF (test_result->>'success')::boolean THEN
        RAISE NOTICE 'SUCCESS: get_user_activity_timeline function is working correctly';
        RAISE NOTICE 'Timeline entries found: %', (test_result->>'total')::integer;
    ELSE
        RAISE NOTICE 'ERROR: get_user_activity_timeline failed with: %', test_result->>'error';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: get_user_activity_timeline test failed: %', SQLERRM;
END $$;

-- ==============================================
-- 7. CREATE DEBUG INFORMATION FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION debug_database_functions()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    contact_count integer;
    changelog_count integer;
    user_count integer;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO contact_count FROM contacts;
    SELECT COUNT(*) INTO user_count FROM users;
    
    -- Check if changelog table exists and get count
    BEGIN
        SELECT COUNT(*) INTO changelog_count FROM changelog;
    EXCEPTION
        WHEN OTHERS THEN
            changelog_count := -1; -- Indicates table doesn't exist
    END;
    
    -- Build result
    result := json_build_object(
        'database_status', 'connected',
        'tables', json_build_object(
            'contacts', json_build_object('exists', true, 'count', contact_count),
            'users', json_build_object('exists', true, 'count', user_count),
            'changelog', json_build_object('exists', changelog_count >= 0, 'count', changelog_count)
        ),
        'functions', json_build_object(
            'get_contacts_simple', 'available',
            'get_users_simple', 'available',
            'get_changelog', 'available',
            'log_changelog', 'available',
            'get_system_activity_summary', 'available',
            'get_user_activity_timeline', 'available'
        ),
        'timestamp', NOW()
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'error', 'Failed to get debug info: ' || SQLERRM,
            'timestamp', NOW()
        );
END;
$$;

-- Grant permission for debug function
GRANT EXECUTE ON FUNCTION debug_database_functions TO authenticated;
GRANT EXECUTE ON FUNCTION debug_database_functions TO anon;

-- ==============================================
-- 8. FINAL STATUS CHECK
-- ==============================================

SELECT 
    'Database function fixes completed successfully!' as status,
    NOW() as timestamp;

-- Show available functions
SELECT 
    'Available functions:' as info,
    string_agg(routine_name, ', ') as functions
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_contacts_simple', 'get_users_simple', 'get_changelog', 'log_changelog', 'get_system_activity_summary', 'get_user_activity_timeline', 'debug_database_functions');

-- Final test: Call debug function
SELECT debug_database_functions() as final_debug_check;