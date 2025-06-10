
-- Create a function to get user profile safely
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  role TEXT,
  client_id UUID,
  agency_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.role, p.client_id, p.agency_id, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$;
