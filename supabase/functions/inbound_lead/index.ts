import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type WebhookEventType = 'new_lead' | 'survey_completed' | 'appointment_booked' | 'activity';

interface WebhookPayload {
  event_type?: WebhookEventType;
  timestamp?: string;

  // For new_lead events
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
    city?: string;
    company?: string;
    postcode?: string;
    address?: string;
    state?: string;
  };
  lead?: {
    source?: string;
    notes?: string;
    id?: string;
    location?: string;
  };
  ghl?: {
    account_id?: string;
    contact_id?: string;
  };

  // For survey_completed events
  survey?: {
    survey_id: string;
    survey_name: string;
    completed_at: string;
    answers: Array<{
      question: string;
      answer: string;
    }>;
  };

  // For appointment_booked events
  appointment?: {
    appointment_id: string;
    scheduled_at: string;
    duration_minutes: number;
    type: string;
    location?: string;
    notes?: string;
  };

  // For generic activity events
  activity?: {
    type: string;
    description: string;
    metadata?: Record<string, any>;
  };

  // Reference to existing contact/lead
  reference?: {
    phone?: string;
    email?: string;
    lead_id?: string;
    contact_id?: string;
  };
}

function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  return phone.replace(/\D/g, '');
}

async function findContactAndLead(reference: any, tenantId: string, supabase: any) {
  let contact = null;
  let lead = null;

  if (reference?.contact_id) {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', reference.contact_id)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    contact = data;
  } else if (reference?.phone) {
    // Normalize phone number before lookup
    const normalizedPhone = normalizePhone(reference.phone);
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', normalizedPhone)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    contact = data;
  } else if (reference?.email) {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('email', reference.email)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    contact = data;
  }

  // Find associated lead
  if (reference?.lead_id) {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('id', reference.lead_id)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    lead = data;
  } else if (contact) {
    // Get most recent lead for this contact
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('contact_id', contact.id)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    lead = data;
  }

  return { contact, lead };
}

async function handleNewLead(payload: WebhookPayload, tenantId: string, supabase: any) {
  console.log('[New Lead] Processing new lead')

  // Create or update contact
  const contactData = {
    tenant_id: tenantId,
    name: payload.contact?.name || 'Unknown',
    phone: payload.contact?.phone ? normalizePhone(payload.contact.phone) : null,
    email: payload.contact?.email || null,
    metadata: {
      source: payload.lead?.source || 'webhook',
      original_payload: payload,
      received_at: new Date().toISOString(),
    }
  }

  let contactId: string

  if (contactData.phone) {
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', contactData.phone)
      .maybeSingle()

    if (existingContact) {
      contactId = existingContact.id
      console.log('[New Lead] Using existing contact:', contactId)
    } else {
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert(contactData)
        .select('id')
        .single()

      if (contactError) throw contactError
      contactId = newContact.id
      console.log('[New Lead] Created new contact:', contactId)
    }
  } else {
    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert(contactData)
      .select('id')
      .single()

    if (contactError) throw contactError
    contactId = newContact.id
    console.log('[New Lead] Created new contact:', contactId)
  }

  // Create lead
  const leadData = {
    tenant_id: tenantId,
    contact_id: contactId,
    phone: contactData.phone || '',
    name: payload.contact?.name || '',
    email: payload.contact?.email || '',
    organisation_name: payload.contact?.company || '',
    postcode: payload.contact?.postcode || '',
    address: payload.contact?.address || '',
    city: payload.lead?.location || payload.contact?.city || '',
    state: payload.contact?.state || '',
    ghl_account_id: payload.ghl?.account_id || '',
    ghl_contact_id: payload.ghl?.contact_id || '',
    external_id: payload.lead?.id || crypto.randomUUID(),
    source: payload.lead?.source || 'webhook',
    raw_data: payload,
  }

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert(leadData)
    .select('id')
    .single()

  if (leadError) {
    console.error('[New Lead] Error creating lead:', leadError)
    throw leadError
  }

  console.log('[New Lead] Lead created successfully:', lead.id)

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Lead received',
      lead_id: lead.id,
      contact_id: contactId,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function handleSurveyCompleted(payload: WebhookPayload, tenantId: string, supabase: any) {
  console.log('[Survey] Processing survey completed event')

  // Find the contact/lead using reference
  const { contact, lead } = await findContactAndLead(payload.reference, tenantId, supabase);

  if (!contact) {
    return new Response(
      JSON.stringify({ error: 'Contact not found for survey event' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    );
  }

  // Insert activity record
  const { data: activity, error } = await supabase
    .from('lead_activities')
    .insert({
      tenant_id: tenantId,
      lead_id: lead?.id,
      contact_id: contact.id,
      event_type: 'survey_completed',
      event_data: {
        survey_id: payload.survey?.survey_id,
        survey_name: payload.survey?.survey_name,
        completed_at: payload.survey?.completed_at,
        answers: payload.survey?.answers
      }
    })
    .select()
    .single();

  if (error) {
    console.error('[Survey] Error creating activity:', error)
    throw error
  }

  // Optionally update lead metadata
  if (lead) {
    await supabase
      .from('leads')
      .update({
        metadata: {
          ...lead.metadata,
          last_survey_completed: payload.survey?.completed_at,
          survey_count: (lead.metadata?.survey_count || 0) + 1
        }
      })
      .eq('id', lead.id);
  }

  console.log('[Survey] Activity created successfully:', activity.id)

  return new Response(
    JSON.stringify({ success: true, activity_id: activity.id }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function handleAppointmentBooked(payload: WebhookPayload, tenantId: string, supabase: any) {
  console.log('[Appointment] Processing appointment booked event')

  // Find the contact/lead using reference
  const { contact, lead } = await findContactAndLead(payload.reference, tenantId, supabase);

  if (!contact) {
    return new Response(
      JSON.stringify({ error: 'Contact not found for appointment event' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    );
  }

  // Insert activity record
  const { data: activity, error } = await supabase
    .from('lead_activities')
    .insert({
      tenant_id: tenantId,
      lead_id: lead?.id,
      contact_id: contact.id,
      event_type: 'appointment_booked',
      event_data: payload.appointment
    })
    .select()
    .single();

  if (error) {
    console.error('[Appointment] Error creating activity:', error)
    throw error
  }

  // Update lead status to reflect appointment
  if (lead) {
    await supabase
      .from('leads')
      .update({
        status: 'appointment_booked',
        metadata: {
          ...lead.metadata,
          appointment: payload.appointment
        }
      })
      .eq('id', lead.id);
  }

  console.log('[Appointment] Activity created successfully:', activity.id)

  return new Response(
    JSON.stringify({ success: true, activity_id: activity.id }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function handleGenericActivity(payload: WebhookPayload, tenantId: string, supabase: any) {
  console.log('[Activity] Processing generic activity event')

  // Find the contact/lead using reference
  const { contact, lead } = await findContactAndLead(payload.reference, tenantId, supabase);

  if (!contact) {
    return new Response(
      JSON.stringify({ error: 'Contact not found for activity event' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    );
  }

  // Insert activity record
  const { data: activity, error } = await supabase
    .from('lead_activities')
    .insert({
      tenant_id: tenantId,
      lead_id: lead?.id,
      contact_id: contact.id,
      event_type: 'activity',
      event_data: payload.activity
    })
    .select()
    .single();

  if (error) {
    console.error('[Activity] Error creating activity:', error)
    throw error
  }

  console.log('[Activity] Activity created successfully:', activity.id)

  return new Response(
    JSON.stringify({ success: true, activity_id: activity.id }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const webhookId = pathParts[pathParts.length - 1]

    if (!webhookId || webhookId === 'inbound_lead') {
      throw new Error('Webhook ID is required in URL path')
    }

    console.log(`[Webhook] Received event for webhook: ${webhookId}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('client_id, secret')
      .eq('secret', webhookId)
      .eq('active', true)
      .maybeSingle()

    if (webhookError || !webhook) {
      console.error('[Webhook] Webhook not found:', webhookId)
      throw new Error('Invalid or inactive webhook')
    }

    console.log('[Webhook] Found webhook for client:', webhook.client_id)

    const payload: WebhookPayload = await req.json()
    const eventType = payload.event_type || 'new_lead' // Default to new_lead for backwards compatibility

    console.log(`[Webhook] Processing event type: ${eventType}`)
    console.log('[Webhook] Payload:', JSON.stringify(payload))

    // Route to appropriate handler based on event type
    switch (eventType) {
      case 'new_lead':
        return handleNewLead(payload, webhook.client_id, supabase);

      case 'survey_completed':
        return handleSurveyCompleted(payload, webhook.client_id, supabase);

      case 'appointment_booked':
        return handleAppointmentBooked(payload, webhook.client_id, supabase);

      case 'activity':
        return handleGenericActivity(payload, webhook.client_id, supabase);

      default:
        return new Response(
          JSON.stringify({ error: `Unknown event type: ${eventType}` }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
    }

  } catch (error) {
    console.error('[Webhook] Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
