
-- Function to increment call counts and update lead data safely
CREATE OR REPLACE FUNCTION public.increment_call_count(lead_id UUID, is_conversation BOOLEAN)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the lead record
  UPDATE public.leads
  SET 
    time_of_last_call = NOW(),
    number_of_calls = number_of_calls + 1,
    number_of_conversations = CASE WHEN is_conversation THEN number_of_conversations + 1 ELSE number_of_conversations END,
    connected = CASE WHEN is_conversation THEN TRUE ELSE connected END
  WHERE id = lead_id;
END;
$$;
