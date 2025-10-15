-- Updated RLS Policies for Revenue Tracker Database
-- These policies will allow both authenticated and anonymous users to read data (for development)

-- =============================================
-- LEADS TABLE POLICIES (Updated)
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own customer leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Dev read leads" ON public.leads;
DROP POLICY IF EXISTS "Dev insert leads" ON public.leads;
DROP POLICY IF EXISTS "Dev update leads" ON public.leads;

-- Allow both authenticated and anonymous users to view all leads (for development)
CREATE POLICY "Dev read leads" ON public.leads
FOR SELECT
TO authenticated, anon
USING (true);

-- Allow authenticated users to insert leads
CREATE POLICY "Dev insert leads" ON public.leads
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Allow authenticated users to update leads
CREATE POLICY "Dev update leads" ON public.leads
FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete leads
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;
CREATE POLICY "Dev delete leads" ON public.leads
FOR DELETE
TO authenticated, anon
USING (true);

-- =============================================
-- ADDITIONAL PERMISSIONS FOR ANONYMOUS USERS
-- =============================================

-- Grant permissions to anonymous role as well (for development)
GRANT SELECT ON public.leads TO anon;
GRANT INSERT ON public.leads TO anon;
GRANT UPDATE ON public.leads TO anon;
GRANT DELETE ON public.leads TO anon;

-- Also update other tables for consistency during development
GRANT SELECT ON public.validations TO anon;
GRANT SELECT ON public.clients TO anon;
GRANT SELECT ON public.projects TO anon;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- You can run these queries to verify the policies are working:
-- SELECT * FROM pg_policies WHERE tablename = 'leads';
-- SELECT * FROM information_schema.table_privileges WHERE grantee IN ('authenticated', 'anon') AND table_name = 'leads';

-- Test query to verify leads can be accessed:
-- SELECT COUNT(*) FROM public.leads;
