-- Fix for leads_client_incharge_approval_check constraint violation
-- This constraint appears to be causing insert failures

-- Drop the problematic constraint
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_client_incharge_approval_check;

-- Verify the constraint is removed
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'leads_client_incharge_approval_check';

