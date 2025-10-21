-- COMPREHENSIVE FIX for existing contacts not showing
-- This addresses the most common causes of the issue

-- STEP 1: First run diagnostic queries to understand the problem
SELECT 'Database has contacts:' as step, COUNT(*) as count FROM public.contacts;
SELECT 'RLS Status:' as step, 
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables WHERE tablename = 'contacts';

-- STEP 2: Check if existing contacts have NULL user_id (most common issue)
SELECT 
    'Contacts with NULL user_id:' as issue,
    COUNT(*) as count
FROM public.contacts 
WHERE user_id IS NULL;

-- STEP 3: Show sample of existing contacts to see the data
SELECT 
    id,
    first_name,
    last_name,
    user_id,
    created_at
FROM public.contacts 
ORDER BY created_at 
LIMIT 10;

-- STEP 4: Check what users exist in your system
SELECT 
    'Users in system:' as step,
    COUNT(*) as count
FROM public.users;

-- Show sample users
SELECT id, email, name FROM public.users ORDER BY created_at LIMIT 5;

-- FIX 1: If contacts have NULL user_id, assign them to the first available user
-- Get the first user's ID for assignment
DO $$
DECLARE
    first_user_id uuid;
    null_contact_count integer;
BEGIN
    -- Get first user ID
    SELECT id INTO first_user_id FROM public.users ORDER BY created_at LIMIT 1;
    
    -- Check how many contacts have NULL user_id
    SELECT COUNT(*) INTO null_contact_count FROM public.contacts WHERE user_id IS NULL;
    
    RAISE NOTICE 'Found % contacts with NULL user_id', null_contact_count;
    RAISE NOTICE 'First user ID found: %', first_user_id;
    
    -- Update NULL user_id contacts if any exist and we have a user
    IF null_contact_count > 0 AND first_user_id IS NOT NULL THEN
        UPDATE public.contacts 
        SET user_id = first_user_id
        WHERE user_id IS NULL;
        
        RAISE NOTICE 'Updated % contacts to have user_id: %', null_contact_count, first_user_id;
    ELSE
        RAISE NOTICE 'No contacts need user_id updates or no users found';
    END IF;
END $$;

-- FIX 2: Test the RPC function directly with actual data
-- This will help us see if the function works at all
SELECT 'Testing RPC function with no filter (should return all contacts):' as test;
SELECT * FROM get_contacts_simple(NULL);

-- FIX 3: Create a simple test function to bypass any issues
CREATE OR REPLACE FUNCTION debug_get_all_contacts()
RETURNS TABLE(
    contact_id uuid,
    contact_name text,
    contact_user_id uuid,
    contact_created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        id as contact_id,
        CONCAT(first_name, ' ', last_name) as contact_name,
        user_id as contact_user_id,
        created_at as contact_created_at
    FROM public.contacts
    ORDER BY created_at DESC;
$$;

-- Test the debug function
SELECT 'Testing debug function:' as test;
SELECT * FROM debug_get_all_contacts();

-- FIX 4: If your app uses custom authentication (not Supabase Auth),
-- you might need to modify how the RPC function is called
-- Check if auth.uid() returns anything
SELECT 
    'Current auth.uid():' as check_type,
    COALESCE(auth.uid()::text, 'NULL') as value;

-- FIX 5: Grant all necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO anon;
GRANT EXECUTE ON FUNCTION get_contacts_simple TO authenticated;
GRANT EXECUTE ON FUNCTION get_contacts_simple TO anon;
GRANT EXECUTE ON FUNCTION debug_get_all_contacts TO authenticated;
GRANT EXECUTE ON FUNCTION debug_get_all_contacts TO anon;