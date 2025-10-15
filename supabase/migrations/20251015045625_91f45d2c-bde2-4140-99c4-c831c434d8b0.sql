-- Fix search_path for generate_validation_id function
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