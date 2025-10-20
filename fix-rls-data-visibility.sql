-- Quick fix for RLS blocking existing contacts
-- This script provides several options to resolve the data visibility issue

-- OPTION 1: Temporarily disable RLS to verify it's the cause
-- Run this first to test if your existing contacts appear
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;

-- Test your app now. If contacts appear, then RLS was the issue.
-- If you want to re-enable RLS later:
-- ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- OPTION 2: If Option 1 worked, try this more permissive RLS policy instead
-- (Re-enable RLS first if you disabled it)
-- ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "select_contacts_owner_or_admin" ON public.contacts;
DROP POLICY IF EXISTS "insert_contacts_authenticated" ON public.contacts;
DROP POLICY IF EXISTS "update_contacts_owner_or_admin" ON public.contacts;
DROP POLICY IF EXISTS "delete_contacts_owner_or_admin" ON public.contacts;

-- Drop existing collaborative policies (in case they already exist)
DROP POLICY IF EXISTS "select_contacts_collaborative" ON public.contacts;
DROP POLICY IF EXISTS "update_contacts_owner_admin" ON public.contacts;
DROP POLICY IF EXISTS "delete_contacts_owner_admin" ON public.contacts;
DROP POLICY IF EXISTS "bypass_rls_for_service" ON public.contacts;

-- Create more permissive policies for collaborative view
CREATE POLICY "select_contacts_collaborative" ON public.contacts
  FOR SELECT
  USING (
    -- Allow if user is authenticated (everyone can see all contacts)
    auth.role() = 'authenticated'
  );

CREATE POLICY "insert_contacts_authenticated" ON public.contacts
  FOR INSERT
  WITH CHECK (
    -- Anyone authenticated can create contacts
    auth.role() = 'authenticated'
  );

CREATE POLICY "update_contacts_owner_admin" ON public.contacts
  FOR UPDATE
  USING (
    -- Owner can update OR user is admin/superadmin
    user_id = auth.uid()::uuid OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid()::uuid 
      AND role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    -- Same conditions for the updated data
    user_id = auth.uid()::uuid OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid()::uuid 
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "delete_contacts_owner_admin" ON public.contacts
  FOR DELETE
  USING (
    -- Owner can delete OR user is admin/superadmin
    user_id = auth.uid()::uuid OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid()::uuid 
      AND role IN ('admin', 'superadmin')
    )
  );

-- OPTION 3: If your existing contacts have NULL user_id values, fix them
-- First check if this is the issue:
-- SELECT COUNT(*) FROM public.contacts WHERE user_id IS NULL;

-- If there are NULL values, you can assign them to a specific user:
-- Replace 'your-user-id-here' with an actual user ID from your users table
-- UPDATE public.contacts 
-- SET user_id = 'your-user-id-here'
-- WHERE user_id IS NULL;

-- OPTION 4: Create a bypass for your RPC functions (if using service role)
CREATE POLICY "bypass_rls_for_service" ON public.contacts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.contacts TO service_role;