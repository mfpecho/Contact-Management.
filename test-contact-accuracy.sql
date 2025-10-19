-- Test Contact Data Accuracy Script
-- Run this in Supabase SQL Editor to verify contact data integrity

-- First, check the current state of contacts table
SELECT 'Current contacts in database:' as info;
SELECT 
    id,
    first_name,
    middle_name,
    last_name,
    birthday,
    phone,
    company,
    user_id,
    created_at
FROM contacts 
ORDER BY created_at DESC;

-- Check for data integrity issues
SELECT 'Data integrity check:' as info;

-- Check for empty or null required fields
SELECT 
    'Contacts with missing required data:' as issue_type,
    id,
    CASE 
        WHEN first_name IS NULL OR trim(first_name) = '' THEN 'Missing first_name'
        WHEN last_name IS NULL OR trim(last_name) = '' THEN 'Missing last_name'
        WHEN phone IS NULL OR trim(phone) = '' THEN 'Missing phone'
        WHEN company IS NULL OR trim(company) = '' THEN 'Missing company'
        WHEN birthday IS NULL THEN 'Missing birthday'
        WHEN user_id IS NULL THEN 'Missing user_id'
        ELSE 'Data looks good'
    END as issue
FROM contacts
WHERE 
    first_name IS NULL OR trim(first_name) = '' OR
    last_name IS NULL OR trim(last_name) = '' OR
    phone IS NULL OR trim(phone) = '' OR
    company IS NULL OR trim(company) = '' OR
    birthday IS NULL OR
    user_id IS NULL;

-- Test the get_contacts_simple function
SELECT 'Testing get_contacts_simple function (all contacts):' as info;
SELECT get_contacts_simple();

-- Test with user filter
SELECT 'Testing get_contacts_simple function (user-specific):' as info;
SELECT get_contacts_simple((SELECT id FROM users LIMIT 1));

-- Create a test contact with accurate data
DO $$
DECLARE
    test_user_id uuid;
    test_result json;
BEGIN
    -- Get a user ID to test with
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test contact creation with accurate data
        SELECT create_contact_simple(
            'DataTest',          -- first_name
            'AccuracyUser',      -- last_name
            '1990-05-15'::date,  -- birthday (proper date format)
            '+1-555-TEST-001',   -- phone
            'Data Accuracy Corp', -- company
            test_user_id,        -- user_id
            'Quality'            -- middle_name
        ) INTO test_result;
        
        RAISE NOTICE 'Test contact creation result: %', test_result;
        
        -- Verify the test contact was created correctly
        SELECT 'Verifying test contact data:' as verification;
        SELECT 
            id,
            first_name,
            middle_name,
            last_name,
            birthday,
            phone,
            company,
            user_id
        FROM contacts 
        WHERE first_name = 'DataTest' AND last_name = 'AccuracyUser';
        
    ELSE
        RAISE NOTICE 'No users found - please create a user first';
    END IF;
END $$;

-- Final data accuracy report
SELECT 'Data Accuracy Summary:' as report;
SELECT 
    COUNT(*) as total_contacts,
    COUNT(CASE WHEN first_name IS NOT NULL AND trim(first_name) != '' THEN 1 END) as valid_first_names,
    COUNT(CASE WHEN last_name IS NOT NULL AND trim(last_name) != '' THEN 1 END) as valid_last_names,
    COUNT(CASE WHEN phone IS NOT NULL AND trim(phone) != '' THEN 1 END) as valid_phones,
    COUNT(CASE WHEN company IS NOT NULL AND trim(company) != '' THEN 1 END) as valid_companies,
    COUNT(CASE WHEN birthday IS NOT NULL THEN 1 END) as valid_birthdays,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as valid_user_ids
FROM contacts;