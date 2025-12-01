-- Create lead_activities table for tracking various activities related to leads
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

  event_type VARCHAR(50) NOT NULL, -- 'survey_completed', 'appointment_booked', 'activity'
  event_data JSONB NOT NULL,       -- Store the full event payload

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_contact_id ON lead_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_tenant_id ON lead_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_event_type ON lead_activities(event_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at DESC);

-- Disable RLS for development (enable with proper policies for production)
ALTER TABLE lead_activities DISABLE ROW LEVEL SECURITY;

-- Add comment to table
COMMENT ON TABLE lead_activities IS 'Tracks various activities and events related to leads such as surveys, appointments, and custom activities';
COMMENT ON COLUMN lead_activities.event_type IS 'Type of event: survey_completed, appointment_booked, or generic activity';
COMMENT ON COLUMN lead_activities.event_data IS 'Full event payload stored as JSONB for flexibility';
