-- Create mis_records table
CREATE TABLE IF NOT EXISTS public.mis_records (
  sl_no SERIAL PRIMARY KEY,
  rev_month DATE,
  customer_name VARCHAR(255),
  customer_id VARCHAR(100),
  project_id VARCHAR(100),
  project_name VARCHAR(255),
  revenue NUMERIC(12, 2),
  approved_cost NUMERIC(12, 2),
  unapproved_lead_count INTEGER,
  unapproved_lead_cost NUMERIC(12, 2),
  lob VARCHAR(100),
  margin NUMERIC(12, 2)
);

-- Create active_workers table
CREATE TABLE IF NOT EXISTS public.active_workers (
  record_date DATE,
  active_workers INTEGER
);

-- Enable Row Level Security (RLS) if needed
ALTER TABLE public.mis_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_workers ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anonymous read access (adjust as needed for your security requirements)
CREATE POLICY "Allow anonymous read access to mis_records" 
  ON public.mis_records FOR SELECT 
  USING (true);

CREATE POLICY "Allow anonymous read access to active_workers" 
  ON public.active_workers FOR SELECT 
  USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.mis_records TO anon;
GRANT SELECT ON public.active_workers TO anon;

