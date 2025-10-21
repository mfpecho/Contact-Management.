-- Step-by-step diagnostic for contact visibility issue
-- Run these queries ONE BY ONE in your Supabase SQL editor

-- STEP 1: Check total contacts in database
SELECT 'Total contacts in database:' as check_type, COUNT(*) as result FROM public.contacts;

-- STEP 2: Check if RLS is actually disabled
SELECT 'RLS Status:' as check_type, 
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as result
FROM pg_tables 
WHERE tablename = 'contacts';

-- STEP 3: Check user_id distribution (look for NULL values)
SELECT 'user_id NULL count:' as check_type, COUNT(*) as result 
FROM public.contacts WHERE user_id IS NULL
UNION ALL
SELECT 'user_id NOT NULL count:' as check_type, COUNT(*) as result 
FROM public.contacts WHERE user_id IS NOT NULL;

-- STEP 4: Check if users table has data
SELECT 'Total users in database:' as check_type, COUNT(*) as result FROM public.users;

-- STEP 5: Sample of existing contacts (check actual data)
SELECT 
    id,
    first_name,
    last_name,
    user_id,
    created_at
FROM public.contacts 
ORDER BY created_at 
LIMIT 5;

-- STEP 6: Check if your RPC function works directly
-- Replace 'your-user-id-here' with an actual user ID from step 5
-- SELECT * FROM get_contacts_simple('your-user-id-here');

-- STEP 7: Check what auth.uid() returns (this might be NULL if using custom auth)
SELECT 
    auth.uid() as current_auth_uid,
    auth.role() as current_auth_role;

-- STEP 8: If auth.uid() is NULL, your app might not be using Supabase Auth
-- Check if you're using custom authentication instead