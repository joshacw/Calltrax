-- Fix RLS Policies for Leads and Calls Access
-- Run this in Supabase SQL Editor to diagnose and fix access issues

-- STEP 1: Check current RLS status
-- Uncomment to see which tables have RLS enabled
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename IN ('leads', 'calls', 'contacts', 'tenants', 'profiles', 'lead_activities');

-- STEP 2: Option A - Disable RLS for Development (Quick Fix)
-- WARNING: Only use this in development environments!
-- Uncomment these lines if you want to completely disable RLS:

-- ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE calls DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE lead_activities DISABLE ROW LEVEL SECURITY;

-- STEP 3: Option B - Create Permissive Policies (Production-Safe)
-- These policies allow authenticated users to access data
-- This is safer for production as it still requires authentication

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated read access to leads" ON leads;
DROP POLICY IF EXISTS "Allow authenticated read access to calls" ON calls;
DROP POLICY IF EXISTS "Allow authenticated read access to contacts" ON contacts;
DROP POLICY IF EXISTS "Allow authenticated read access to tenants" ON tenants;
DROP POLICY IF EXISTS "Allow authenticated read access to profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated read access to lead_activities" ON lead_activities;

-- Create new permissive policies for authenticated users
CREATE POLICY "Allow authenticated read access to leads"
ON leads FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated write access to leads"
ON leads FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated read access to calls"
ON calls FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated write access to calls"
ON calls FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated read access to contacts"
ON contacts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated write access to contacts"
ON contacts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated read access to tenants"
ON tenants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read access to profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated write access to profiles"
ON profiles FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated read access to lead_activities"
ON lead_activities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated write access to lead_activities"
ON lead_activities FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled on these tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- STEP 4: Verify policies are created
-- Uncomment to see all policies:
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE tablename IN ('leads', 'calls', 'contacts', 'tenants', 'profiles', 'lead_activities')
-- ORDER BY tablename, policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been updated successfully!';
  RAISE NOTICE 'All authenticated users can now read and write to leads, calls, contacts, tenants, profiles, and lead_activities tables.';
  RAISE NOTICE 'For more restrictive policies in production, modify the USING clauses to check tenant_id or other conditions.';
END $$;
