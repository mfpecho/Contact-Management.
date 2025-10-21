-- Debug Superadmin Collaborative View Issues
-- Run this in Supabase SQL Editor to diagnose the problem

-- Test 1: Check if superadmin users exist
SELECT 
    'Superadmin Users in Database:' as info,
    COUNT(*) as count,
    string_agg(name || ' (ID: ' || id || ', Email: ' || email || ')', E'\n') as users
FROM users 
WHERE role = 'superadmin';

-- Test 2: Check total contacts in database
SELECT 
    'Total Contacts in Database:' as info,
    COUNT(*) as count
FROM contacts;

-- Test 3: Test both collaborative functions directly
SELECT 'Testing get_all_contacts_collaborative()...' as test_step;
SELECT get_all_contacts_collaborative() as result;

SELECT 'Testing get_contacts_for_superadmin()...' as test_step;  
SELECT get_contacts_for_superadmin() as result;

-- Test 4: Check RLS status
SELECT 
    'RLS Status:' as info,
    tablename,
    rowsecurity as rls_enabled,
    enablerls as rls_forced
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('contacts', 'users', 'changelog');

-- Test 5: Check if there are any active RLS policies
SELECT 
    'Active RLS Policies on Contacts:' as info,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'contacts';

-- Test 6: Direct contact query (should work if RLS is disabled)
SELECT 
    'Direct Contact Query Test:' as info,
    c.id,
    c.first_name || ' ' || c.last_name as contact_name,
    u.name as owner_name,
    u.role as owner_role
FROM contacts c
LEFT JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC
LIMIT 5;

-- Test 7: Authentication context test
DO $$
DECLARE
    test_user_id uuid;
    test_result json;
BEGIN
    -- Get a superadmin user ID
    SELECT id INTO test_user_id FROM users WHERE role = 'superadmin' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Set auth context
        PERFORM set_config('app.current_user_id', test_user_id::text, true);
        
        -- Test collaborative function with context
        SELECT get_all_contacts_collaborative() INTO test_result;
        
        RAISE NOTICE 'Auth Context Test Result for Superadmin %: %', test_user_id, test_result;
    ELSE
        RAISE NOTICE 'No superadmin users found for testing';
    END IF;
END $$;

-- Test 8: Check if the original get_contacts_simple function works
SELECT 'Testing get_contacts_simple() with no filter...' as test_step;
SELECT get_contacts_simple(NULL) as result;

-- Summary message
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'SUPERADMIN DEBUG TEST COMPLETE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Check the results above to identify issues:';
    RAISE NOTICE '1. Verify superadmin users exist';
    RAISE NOTICE '2. Check if contacts exist in database';
    RAISE NOTICE '3. Test if collaborative functions work';
    RAISE NOTICE '4. Verify RLS is disabled';
    RAISE NOTICE '5. Check direct query access';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'If all tests pass but superadmin still has';
    RAISE NOTICE 'issues, the problem is in the application';
    RAISE NOTICE 'code, not the database configuration.';
END $$;