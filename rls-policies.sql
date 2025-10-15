-- RLS Policies for Revenue Tracker Database
-- These policies will allow authenticated users to read and write data

-- =============================================
-- CLIENTS TABLE POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;

-- Allow authenticated users to view all clients
CREATE POLICY "Authenticated users can view clients"
ON public.clients
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert clients
CREATE POLICY "Authenticated users can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update clients
CREATE POLICY "Authenticated users can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete clients
CREATE POLICY "Authenticated users can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (true);

-- =============================================
-- PROJECTS TABLE POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projects;

-- Allow authenticated users to view all projects
CREATE POLICY "Authenticated users can view projects"
ON public.projects
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert projects
CREATE POLICY "Authenticated users can insert projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update projects
CREATE POLICY "Authenticated users can update projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete projects
CREATE POLICY "Authenticated users can delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (true);

-- =============================================
-- VALIDATIONS TABLE POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own customer validations" ON public.validations;
DROP POLICY IF EXISTS "Users can update own customer validations" ON public.validations;
DROP POLICY IF EXISTS "Authenticated users can view all validations" ON public.validations;
DROP POLICY IF EXISTS "Authenticated users can insert validations" ON public.validations;
DROP POLICY IF EXISTS "Authenticated users can update validations" ON public.validations;
DROP POLICY IF EXISTS "Authenticated users can delete validations" ON public.validations;

-- Allow authenticated users to view all validations (for finance team)
CREATE POLICY "Authenticated users can view all validations"
ON public.validations
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert validations
CREATE POLICY "Authenticated users can insert validations"
ON public.validations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update validations
CREATE POLICY "Authenticated users can update validations"
ON public.validations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete validations
CREATE POLICY "Authenticated users can delete validations"
ON public.validations
FOR DELETE
TO authenticated
USING (true);

-- =============================================
-- LEADS TABLE POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own customer leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;

-- Allow authenticated users to view all leads
CREATE POLICY "Authenticated users can view all leads"
ON public.leads
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert leads
CREATE POLICY "Authenticated users can insert leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update leads
CREATE POLICY "Authenticated users can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete leads
CREATE POLICY "Authenticated users can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (true);

-- =============================================
-- PROFILES TABLE POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can delete profiles" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert profiles
CREATE POLICY "Authenticated users can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- =============================================
-- ADDITIONAL HELPFUL POLICIES
-- =============================================

-- Policy to allow service role to bypass RLS (for admin operations)
-- This is useful for data seeding and admin tasks
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.clients TO authenticated;
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.validations TO authenticated;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Grant usage on sequences (for auto-incrementing fields)
GRANT USAGE ON SEQUENCE validation_file_seq TO authenticated;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- You can run these queries to verify the policies are working:
-- SELECT * FROM pg_policies WHERE tablename IN ('clients', 'projects', 'validations', 'leads', 'profiles');
-- SELECT * FROM information_schema.table_privileges WHERE grantee = 'authenticated';
