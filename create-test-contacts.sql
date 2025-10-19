-- Test script to manually insert sample contacts for debugging
-- Run this in Supabase SQL Editor to create test data

-- First, let's check what users exist
SELECT 'Current users:' as info;
SELECT id, name, email, role FROM users ORDER BY created_at;

-- Create some test contacts for existing users
DO $$
DECLARE
    user_record RECORD;
    contact_result json;
BEGIN
    -- Get the first user (could be superadmin)
    SELECT id, name INTO user_record FROM users LIMIT 1;
    
    IF user_record.id IS NOT NULL THEN
        RAISE NOTICE 'Creating test contacts for user: % (ID: %)', user_record.name, user_record.id;
        
        -- Create test contact 1
        SELECT create_contact_simple(
            'Alice',
            'Johnson', 
            '1985-03-15'::date,
            '+1-555-0123',
            'Tech Solutions Inc',
            user_record.id,
            'Marie'
        ) INTO contact_result;
        
        RAISE NOTICE 'Contact 1 result: %', contact_result;
        
        -- Create test contact 2
        SELECT create_contact_simple(
            'Bob',
            'Smith', 
            '1990-07-22'::date,
            '+1-555-0456',
            'Design Studio LLC',
            user_record.id,
            'William'
        ) INTO contact_result;
        
        RAISE NOTICE 'Contact 2 result: %', contact_result;
        
        -- Create test contact 3
        SELECT create_contact_simple(
            'Carol',
            'Davis', 
            '1988-11-08'::date,
            '+1-555-0789',
            'Marketing Pro',
            user_record.id,
            'Elizabeth'
        ) INTO contact_result;
        
        RAISE NOTICE 'Contact 3 result: %', contact_result;
        
    ELSE
        RAISE NOTICE 'No users found! Please create a user first.';
    END IF;
END $$;

-- Check what contacts were created
SELECT 'Created contacts:' as info;
SELECT 
    c.id,
    c.first_name,
    c.middle_name,
    c.last_name,
    c.phone,
    c.company,
    u.name as owner_name,
    c.created_at
FROM contacts c
LEFT JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- Test the get_contacts_simple function
SELECT 'Testing get_contacts_simple (all contacts):' as info;
SELECT get_contacts_simple();

-- Test with specific user filter
SELECT 'Testing get_contacts_simple (user-specific):' as info;
SELECT get_contacts_simple((SELECT id FROM users LIMIT 1));