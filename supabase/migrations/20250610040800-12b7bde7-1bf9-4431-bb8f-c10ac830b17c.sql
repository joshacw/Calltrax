
-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agencies table
CREATE TABLE public.agencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create integration_settings table
CREATE TABLE public.integration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhooks table
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL,
  location TEXT,
  contact_number TEXT NOT NULL,
  time_of_notification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  time_of_first_call TIMESTAMP WITH TIME ZONE,
  speed_to_lead INTEGER,
  number_of_calls INTEGER NOT NULL DEFAULT 0,
  number_of_conversations INTEGER NOT NULL DEFAULT 0,
  connected BOOLEAN NOT NULL DEFAULT false,
  appointment_booked BOOLEAN NOT NULL DEFAULT false,
  time_of_last_call TIMESTAMP WITH TIME ZONE,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calls table
CREATE TABLE public.calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  contact_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  duration INTEGER NOT NULL DEFAULT 0,
  public_share_link TEXT,
  disposition TEXT,
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agent_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
CREATE POLICY "Allow all operations on clients" ON public.clients FOR ALL USING (true);

-- Create policies for agencies table
CREATE POLICY "Allow all operations on agencies" ON public.agencies FOR ALL USING (true);

-- Create policies for integration_settings table
CREATE POLICY "Allow all operations on integration_settings" ON public.integration_settings FOR ALL USING (true);

-- Create policies for webhooks table
CREATE POLICY "Allow all operations on webhooks" ON public.webhooks FOR ALL USING (true);

-- Create policies for leads table
CREATE POLICY "Allow all operations on leads" ON public.leads FOR ALL USING (true);

-- Create policies for calls table
CREATE POLICY "Allow all operations on calls" ON public.calls FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_agencies_client_id ON public.agencies(client_id);
CREATE INDEX idx_integration_settings_client_id ON public.integration_settings(client_id);
CREATE INDEX idx_webhooks_client_id ON public.webhooks(client_id);
CREATE INDEX idx_leads_agency_id ON public.leads(agency_id);
CREATE INDEX idx_calls_lead_id ON public.calls(lead_id);
CREATE INDEX idx_leads_time_of_notification ON public.leads(time_of_notification);
CREATE INDEX idx_calls_timestamp ON public.calls(timestamp);
