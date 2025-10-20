-- Debug script to troubleshoot RLS and data visibility issues
-- Run this script to diagnose why existing contacts aren't showing

-- 1. Check if RLS is enabled on contacts table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'contacts';

-- 2. Check existing contacts count (total in database)
SELECT COUNT(*) as total_contacts_in_db FROM public.contacts;

-- 3. Check contacts visible to current user (respecting RLS)
SELECT COUNT(*) as contacts_visible_to_user FROM public.contacts;

-- 4. Check contacts by user_id distribution
SELECT 
    user_id,
    COUNT(*) as contact_count
FROM public.contacts 
GROUP BY user_id 
ORDER BY contact_count DESC;

-- 5. Check if user_id column has valid data
SELECT 
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_ids,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as valid_user_ids,
    COUNT(*) as total_contacts
FROM public.contacts;

-- 6. Check current user information
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 7. Check users table for role information
SELECT 
    id,
    role,
    email
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 8. Check policies on contacts table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'contacts';

-- 9. Test RPC function directly (replace with actual user_id)
-- SELECT * FROM get_contacts_simple('replace-with-actual-user-id');

-- 10. Check if contacts have proper user_id values that match users table
SELECT 
    c.id,
    c.user_id,
    u.email,
    c.first_name,
    c.last_name
FROM public.contacts c
LEFT JOIN public.users u ON c.user_id = u.id
LIMIT 10;

-- POTENTIAL FIXES:

-- Fix 1: If user_id is null for existing contacts, update them to a default user
-- UPDATE public.contacts 
-- SET user_id = 'default-user-id' 
-- WHERE user_id IS NULL;

-- Fix 2: If you want to temporarily disable RLS to see all data:
-- ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;

-- Fix 3: If you want more permissive access for debugging:
-- CREATE POLICY "temp_allow_all" ON public.contacts FOR ALL USING (true) WITH CHECK (true);