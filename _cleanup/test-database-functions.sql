-- Quick test to verify database functions are working
-- Run this in Supabase SQL Editor to check function status

-- Test 1: Check if get_users_simple function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'get_users_simple';

-- Test 2: Try calling the function
SELECT get_users_simple();

-- Test 3: Check current users table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Test 4: Check actual users in database
SELECT 
  id,
  name,
  email,
  role,
  username,
  employee_number,
  position,
  created_at,
  updated_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Test 5: Check if RLS policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users';

-- If any of these fail, it means the database functions haven't been applied yet
-- Run fix-database-function-errors.sql to fix all issues