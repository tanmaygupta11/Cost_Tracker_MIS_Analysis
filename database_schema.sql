-- =============================================
-- COST TRACKER MIS ANALYSIS - DATABASE SCHEMA
-- =============================================
-- This file contains all CREATE TABLE statements
-- for the tables used in the application.
-- Use this schema when setting up a new Supabase database.
-- =============================================

-- =============================================
-- 1. CLIENTS TABLE
-- =============================================
-- Stores customer/client information
CREATE TABLE IF NOT EXISTS public.clients (
    customer_id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_since TEXT
);

-- Add comment
COMMENT ON TABLE public.clients IS 'Stores customer/client information';

-- =============================================
-- 2. PROJECTS TABLE
-- =============================================
-- Stores project information linked to customers
CREATE TABLE IF NOT EXISTS public.projects (
    project_id TEXT PRIMARY KEY,
    project_name TEXT,
    customer_id TEXT REFERENCES public.clients(customer_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.projects IS 'Stores project information linked to customers';

-- Create index on customer_id for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON public.projects(customer_id);

-- =============================================
-- 3. VALIDATIONS TABLE
-- =============================================
-- Stores validation file records with revenue information
CREATE TABLE IF NOT EXISTS public.validations (
    validation_file_id TEXT PRIMARY KEY,
    sl_no INTEGER NOT NULL,
    customer_id TEXT REFERENCES public.clients(customer_id) ON DELETE SET NULL,
    customer_name TEXT,
    project_id TEXT REFERENCES public.projects(project_id) ON DELETE SET NULL,
    project_name TEXT,
    rev_month TEXT,  -- Format: YYYY-MM-DD or YYYY-MM
    revenue NUMERIC,  -- Revenue amount
    validation_status TEXT NOT NULL,  -- Values: 'Pending', 'Approved', 'Rejected'
    validation_approval_at TIMESTAMP WITH TIME ZONE,
    LOB TEXT,  -- Line of Business
    Validation_completed TEXT,  -- Values: 'Complete', 'Incomplete', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.validations IS 'Stores validation file records with revenue information';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_validations_customer_id ON public.validations(customer_id);
CREATE INDEX IF NOT EXISTS idx_validations_project_id ON public.validations(project_id);
CREATE INDEX IF NOT EXISTS idx_validations_rev_month ON public.validations(rev_month);
CREATE INDEX IF NOT EXISTS idx_validations_validation_status ON public.validations(validation_status);
CREATE INDEX IF NOT EXISTS idx_validations_sl_no ON public.validations(sl_no);

-- =============================================
-- 4. LEADS TABLE
-- =============================================
-- Stores individual lead/worker records linked to projects
CREATE TABLE IF NOT EXISTS public.leads (
    lead_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    final_work_completion_date TEXT,  -- Format: YYYY-MM-DD
    revisied_work_completion_date TEXT,  -- Format: YYYY-MM-DD
    unit_basis_commercial NUMERIC,
    project_incharge_approval TEXT,  -- Values: 'Approved', 'Rejected', 'Pending'
    project_incharge_approval_date TEXT,  -- Format: YYYY-MM-DD or ISO timestamp
    client_incharge_approval TEXT,  -- Values: 'Approved', 'Rejected', 'Pending'
    client_incharge_approval_date TEXT,  -- Format: YYYY-MM-DD or ISO timestamp
    "Original_Work_Completion_Date" TEXT,  -- Format: YYYY-MM-DD
    projectid TEXT,  -- Alternative project ID field
    "Zone" TEXT,
    "City" TEXT,
    "State" TEXT,
    "TC Code" TEXT,
    "Role" TEXT,
    "Shift" TEXT,
    status TEXT,  -- Lead status
    validation_file_id TEXT  -- Links to validations table
);

-- Add comment
COMMENT ON TABLE public.leads IS 'Stores individual lead/worker records linked to projects';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON public.leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_validation_file_id ON public.leads(validation_file_id);
CREATE INDEX IF NOT EXISTS idx_leads_final_work_completion_date ON public.leads(final_work_completion_date);

-- =============================================
-- 5. PROFILES TABLE
-- =============================================
-- Links Supabase auth users to customer/client records
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id TEXT REFERENCES public.clients(customer_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.profiles IS 'Links Supabase auth users to customer/client records';

-- Create index on customer_id for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_customer_id ON public.profiles(customer_id);

-- =============================================
-- SEQUENCES
-- =============================================
-- Sequence for generating validation file IDs
CREATE SEQUENCE IF NOT EXISTS public.validation_file_seq START WITH 1 INCREMENT BY 1;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to generate validation file IDs
CREATE OR REPLACE FUNCTION public.generate_validation_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    seq_num TEXT;
    random_suffix TEXT;
BEGIN
    -- Sequential number (padded to 4 digits)
    seq_num := lpad(nextval('validation_file_seq')::text, 4, '0');

    -- Random 4-character alphanumeric suffix
    random_suffix := upper(substring(md5(random()::text) from 1 for 4));

    -- Final formatted ID
    RETURN 'VAL-' || seq_num || random_suffix;
END;
$function$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, customer_id)
  VALUES (new.id, new.raw_user_meta_data->>'customer_id');
  RETURN new;
END;
$$;

-- Function to update validation_approval_at timestamp
CREATE OR REPLACE FUNCTION public.update_validation_approval_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update timestamp if status changed to Approved or Rejected and approval_at is null
  IF (NEW.validation_status IN ('Approved', 'Rejected')) 
     AND (OLD.validation_status != NEW.validation_status OR OLD.validation_status IS NULL)
     AND NEW.validation_approval_at IS NULL THEN
    NEW.validation_approval_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to auto-update validation_approval_at
DROP TRIGGER IF EXISTS set_validation_approval_timestamp ON public.validations;
CREATE TRIGGER set_validation_approval_timestamp
  BEFORE UPDATE ON public.validations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_validation_approval_timestamp();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- CLIENTS TABLE POLICIES
-- Allow authenticated users to view all clients
CREATE POLICY "Authenticated users can view clients"
ON public.clients
FOR SELECT
TO authenticated
USING (true);

-- PROJECTS TABLE POLICIES
-- Allow authenticated users to view all projects
CREATE POLICY "Authenticated users can view projects"
ON public.projects
FOR SELECT
TO authenticated
USING (true);

-- VALIDATIONS TABLE POLICIES
-- Users can view validations for their customer
CREATE POLICY "Users can view own customer validations"
ON public.validations
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT customer_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Users can update validations for their customer (for bulk actions)
CREATE POLICY "Users can update own customer validations"
ON public.validations
FOR UPDATE
TO authenticated
USING (
  customer_id IN (
    SELECT customer_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- LEADS TABLE POLICIES
-- Users can view leads for their customer
CREATE POLICY "Users can view own customer leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT customer_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- PROFILES TABLE POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- =============================================
-- GRANTS
-- =============================================

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.clients TO authenticated;
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.validations TO authenticated;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON SEQUENCE validation_file_seq TO authenticated;

-- =============================================
-- END OF SCHEMA
-- =============================================

