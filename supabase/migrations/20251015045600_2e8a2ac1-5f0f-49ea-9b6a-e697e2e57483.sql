-- Fix search_path for update_validation_approval_timestamp function
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

-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all clients (needed for dropdowns)
CREATE POLICY "Authenticated users can view clients"
ON public.clients
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on leads table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view leads for their customer
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

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all projects (needed for dropdowns)
CREATE POLICY "Authenticated users can view projects"
ON public.projects
FOR SELECT
TO authenticated
USING (true);