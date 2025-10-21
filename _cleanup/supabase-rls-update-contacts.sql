-- supabase-rls-update-contacts.sql
--
-- Purpose: Enable Row-Level Security (RLS) for the `contacts` table and
-- provide policies so that:
--  - authenticated users can SELECT the contacts they created (owner)
--  - authenticated users can INSERT contacts but only with their own user_id
--  - owners can UPDATE/DELETE their own contacts
--  - admin/superadmin roles can SELECT/UPDATE/DELETE all contacts
--
-- Instructions:
-- 1. Run this script in your Supabase SQL editor (or psql) against the project
--    where the `contacts` table and `users` table exist.
-- 2. Review the role-checking logic below. It assumes a `users` table with a
--    `role` column containing values like 'user', 'admin', 'superadmin'.
-- 3. You may need to adjust column names (user_id) if your schema differs.
--
-- Note on security:
-- - Policies use the `auth.uid()` helper to map the currently authenticated
--   user's id. For server-side/system operations you should continue to use
--   service_role or dedicated privileged functions.
-- - Be careful granting broad access to admin roles. Confirm your `users`
--   table stores trusted role information and that only authorized actors can
--   modify it.

-- Enable RLS on contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Ensure there's no legacy permissive policy left
-- (Optional) Drop existing policies if you want a clean slate - uncomment if desired
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts') THEN
--     EXECUTE 'DROP POLICY IF EXISTS "authenticated_select_contacts" ON public.contacts';
--   END IF;
-- END $$;

-- Helper: check if the current user has admin or superadmin role
-- We use a policy expression that looks up the role from the users table.
-- Adjust `users` table/role column names if different in your DB.

-- POLICY: Allow admins/superadmins full access (SELECT/UPDATE/DELETE)
-- Implementation uses a sub-select that checks the users table for the role

-- SELECT policy: owners OR admins/superadmins
CREATE POLICY "select_contacts_owner_or_admin" ON public.contacts
  FOR SELECT
  USING (
    -- allow if the contact belongs to the current user
    (user_id = auth.uid()::uuid)
    -- OR allow if current user is an admin/superadmin
    OR EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid()::uuid AND u.role IN ('admin','superadmin')
    )
  );

-- INSERT policy: allow authenticated users to insert only with their own user_id
CREATE POLICY "insert_contacts_authenticated_own_user" ON public.contacts
  FOR INSERT
  WITH CHECK (
    -- inserted row must have user_id equal to the authenticated user
    (user_id = auth.uid()::uuid)
    -- option: allow admins to insert any user_id if desired (uncomment the OR condition)
    -- OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::uuid AND u.role IN ('admin','superadmin'))
  );

-- UPDATE policy: allow owners to update their rows; admins/superadmins can update any
CREATE POLICY "update_contacts_owner_or_admin" ON public.contacts
  FOR UPDATE
  USING (
    (user_id = auth.uid()::uuid)
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::uuid AND u.role IN ('admin','superadmin'))
  )
  WITH CHECK (
    -- Ensure that updates do not reassign owner to a different user accidentally
    (user_id = auth.uid()::uuid)
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::uuid AND u.role IN ('admin','superadmin'))
  );

-- DELETE policy: allow owners to delete their rows; admins/superadmins can delete any
CREATE POLICY "delete_contacts_owner_or_admin" ON public.contacts
  FOR DELETE
  USING (
    (user_id = auth.uid()::uuid)
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::uuid AND u.role IN ('admin','superadmin'))
  );

-- Optional: allow anon (public) or authenticated general select for some columns only
-- (Typically not recommended for PII)
-- CREATE POLICY "select_public_lite" ON public.contacts
--   FOR SELECT
--   USING (true)
--   WITH CHECK (false);

-- Final notes printed for DB operator
COMMENT ON TABLE public.contacts IS 'RLS enabled; policies: owner-or-admin for select/insert/update/delete';

-- Grant execute privileges on functions (required for your RPC functions to work with RLS)
GRANT EXECUTE ON FUNCTION public.get_contacts_simple(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_contact_simple(text, text, date, text, text, uuid, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_contact_simple(uuid, text, text, text, date, text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.delete_contact_simple(uuid) TO authenticated, anon;

-- Important: Since your app uses SECURITY DEFINER functions, you might need to temporarily
-- allow broader access for the service role or modify the functions to respect RLS.
-- If the above doesn't work, you may need to add a bypass policy for service operations:

-- Bypass policy for service role (uncomment if RPC functions still fail)
-- CREATE POLICY "bypass_rls_for_service" ON public.contacts
--   FOR ALL
--   TO service_role
--   USING (true)
--   WITH CHECK (true);

-- Alternative: If you want all authenticated users to see all contacts in collaborative view,
-- replace the SELECT policy above with this more permissive one:
-- DROP POLICY IF EXISTS "select_contacts_owner_or_admin" ON public.contacts;
-- CREATE POLICY "select_contacts_all_authenticated" ON public.contacts
--   FOR SELECT
--   USING (auth.role() = 'authenticated');

-- End of script
