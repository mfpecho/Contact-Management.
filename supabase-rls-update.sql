-- supabase-rls-update.sql
-- Purpose: update Row Level Security (RLS) for `contacts` to support a "collaborative view".
-- This script will add a policy that allows authenticated users to SELECT (view) contacts created by any user
-- while preserving existing insert/update/delete policies that enforce ownership.
--
-- IMPORTANT: Review and apply this in the Supabase SQL Editor or via psql with a privileged role.
-- Always test in a staging environment before applying to production.

-- DROP existing collaborative policy if present (safe to run multiple times)
DROP POLICY IF EXISTS "Authenticated can view all contacts (collaborative)" ON public.contacts;

-- Policy: Allow authenticated users to SELECT all contacts (collaborative view)
-- This allows any logged-in user to see all contacts in the `contacts` table.
-- We still keep INSERT/UPDATE/DELETE policies scoped to owner (user_id) so only owners can change their contacts.

CREATE POLICY "Authenticated can view all contacts (collaborative)" ON public.contacts
  FOR SELECT
  USING (auth.role() IS NOT NULL);

-- Notes:
-- - `auth.role()` is available in Supabase Postgres and returns the role name for the authenticated principal.
--   In many Supabase setups, auth.role() returns 'authenticated' for logged-in users.
-- - Alternatively, if your environment supports `auth.uid()` and checking users table role, you can change the
--   USING condition to a more restrictive check (e.g., allow only users with role IN ('user','admin','superadmin')).
--
-- Optional: More restrictive policy example (uncomment to use instead of the above):
-- DROP POLICY IF EXISTS "Authenticated can view all contacts (collaborative)" ON public.contacts;
-- CREATE POLICY "Authenticated can view all contacts (collaborative)" ON public.contacts
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.users u
--       WHERE u.id::text = auth.uid()::text
--       AND u.role IN ('user', 'admin', 'superadmin')
--     )
--   );

-- Grant execute rights for anonymous/authenticated roles is not required for RLS policy, but ensure
-- RPC functions used by the app have appropriate privileges to return results under RLS.

-- End of script
