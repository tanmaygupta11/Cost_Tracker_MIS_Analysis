-- Create user profiles table to link auth users with clients
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES public.clients(customer_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Enable RLS on validations table
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view validations for their customer
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

-- Policy: Users can update validations for their customer (for bulk actions)
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

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update validation_approval_at timestamp
CREATE OR REPLACE FUNCTION public.update_validation_approval_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Trigger to auto-update validation_approval_at
DROP TRIGGER IF EXISTS set_validation_approval_timestamp ON public.validations;
CREATE TRIGGER set_validation_approval_timestamp
  BEFORE UPDATE ON public.validations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_validation_approval_timestamp();