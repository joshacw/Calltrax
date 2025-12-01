import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const webhookId = pathParts[pathParts.length - 1]

    if (!webhookId || webhookId === 'inbound-lead') {
      throw new Error('Webhook ID is required in URL path')
    }

    console.log(`[Inbound Lead] Received lead for webhook: ${webhookId}`)

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
      console.error('[Inbound Lead] Webhook not found:', webhookId)
      throw new Error('Invalid or inactive webhook')
    }

    console.log('[Inbound Lead] Found webhook for client:', webhook.client_id)

    const payload = await req.json()
    console.log('[Inbound Lead] Lead data:', JSON.stringify(payload))

    // Create or update contact
    const contactData = {
      tenant_id: webhook.client_id,
      name: payload.contact?.name || 'Unknown',
      phone: payload.contact?.phone || null,
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
        .eq('tenant_id', webhook.client_id)
        .eq('phone', contactData.phone)
        .maybeSingle()

      if (existingContact) {
        contactId = existingContact.id
        console.log('[Inbound Lead] Using existing contact:', contactId)
      } else {
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert(contactData)
          .select('id')
          .single()

        if (contactError) throw contactError
        contactId = newContact.id
        console.log('[Inbound Lead] Created new contact:', contactId)
      }
    } else {
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert(contactData)
        .select('id')
        .single()

      if (contactError) throw contactError
      contactId = newContact.id
      console.log('[Inbound Lead] Created new contact:', contactId)
    }

    // Create lead - only use fields that exist in the table
    const leadData = {
      tenant_id: webhook.client_id,
      contact_id: contactId,
      phone: payload.contact?.phone || '',
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

    console.log('[Inbound Lead] Creating lead...')

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select('id')
      .single()

    if (leadError) {
      console.error('[Inbound Lead] Error creating lead:', leadError)
      throw leadError
    }

    console.log('[Inbound Lead] Lead created successfully:', lead.id)

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

  } catch (error) {
    console.error('[Inbound Lead] Error:', error)
    
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
