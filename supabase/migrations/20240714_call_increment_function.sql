
-- Function to increment call counts and update lead data safely
CREATE OR REPLACE FUNCTION public.increment_call_count(
  lead_id UUID, 
  is_conversation BOOLEAN,
  speed_to_lead_value INTEGER DEFAULT NULL,
  call_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the lead record
  UPDATE public.leads
  SET 
    time_of_last_call = call_timestamp,
    time_of_first_call = COALESCE(time_of_first_call, call_timestamp),
    speed_to_lead = CASE WHEN time_of_first_call IS NULL AND speed_to_lead_value IS NOT NULL THEN speed_to_lead_value ELSE speed_to_lead END,
    number_of_calls = number_of_calls + 1,
    number_of_conversations = CASE WHEN is_conversation THEN number_of_conversations + 1 ELSE number_of_conversations END,
    connected = CASE WHEN is_conversation THEN TRUE ELSE connected END
  WHERE id = lead_id;
END;
$$;
