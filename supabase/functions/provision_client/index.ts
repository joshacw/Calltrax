import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const generateWebhookSecret = (): string => {
  return crypto.randomUUID().replace(/-/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { clientName, timezone = 'Australia/Perth' } = await req.json()

    if (!clientName || clientName.trim().length === 0) {
      throw new Error('Client name is required')
    }

    console.log(`[Provision] Starting provisioning for: ${clientName}`)

    const dialpadApiKey = Deno.env.get('DIALPAD_API_KEY')
    const dialpadOfficeId = Deno.env.get('DIALPAD_OFFICE_ID')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    
    if (!dialpadApiKey) throw new Error('DIALPAD_API_KEY not configured')
    if (!dialpadOfficeId) throw new Error('DIALPAD_OFFICE_ID not configured')
    if (!supabaseUrl) throw new Error('SUPABASE_URL not configured')

    // Use Supabase Edge Functions for webhooks
    const projectRef = supabaseUrl.split('//')[1].split('.')[0]
    const baseUrl = `https://${projectRef}.supabase.co/functions/v1`

    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const slug = generateSlug(clientName)

    // Check for duplicate
    const { data: existingTenant } = await supabaseAdmin
      .from('tenants')
      .select('id, name, dialpad_cc_id')
      .ilike('name', clientName.trim())
      .single()

    if (existingTenant) {
      console.log(`[Provision] Client already exists: ${existingTenant.id}`)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'A client with this name already exists',
          existingClient: existingTenant
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      )
    }

    // Step 1: Create Dialpad Contact Center
    console.log('[Provision] Creating Dialpad contact center...')

    const dialpadResponse = await fetch('https://dialpad.com/api/v2/callcenters', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dialpadApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: clientName.trim(),
        office_id: parseInt(dialpadOfficeId),
        timezone: timezone,
        state: 'active',
        hours_on: true,
        monday_hours: ['09:00', '17:00'],
        tuesday_hours: ['09:00', '17:00'],
        wednesday_hours: ['09:00', '17:00'],
        thursday_hours: ['09:00', '17:00'],
        friday_hours: ['09:00', '17:00'],
        saturday_hours: [],
        sunday_hours: [],
      })
    })

    if (!dialpadResponse.ok) {
      const errorText = await dialpadResponse.text()
      throw new Error(`Dialpad API error (${dialpadResponse.status}): ${errorText}`)
    }

    const dialpadCC = await dialpadResponse.json()
    console.log('[Provision] Dialpad CC created:', dialpadCC.id)

    // Step 2: Create Dialpad Webhook Endpoint
    console.log('[Provision] Creating Dialpad webhook endpoint...')
    
    const webhookSecret = generateWebhookSecret()
    const webhookUrl = `${baseUrl}/dialpad-events/${slug}`

    const webhookResponse = await fetch('https://dialpad.com/api/v2/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dialpadApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hook_url: webhookUrl,
        secret: webhookSecret,
      })
    })

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      throw new Error(`Failed to create webhook: ${errorText}`)
    }

    const webhook = await webhookResponse.json()
    console.log('[Provision] Webhook created:', webhook.id)

    // Step 3: Subscribe to Call Events
    console.log('[Provision] Subscribing to call events...')

    const callStates = ['ringing', 'connected', 'hangup', 'dispositions', 'voicemail']

    const subscriptionResponse = await fetch('https://dialpad.com/api/v2/subscriptions/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dialpadApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint_id: webhook.id,
        target_type: 'callcenter',
        target_id: dialpadCC.id,
        call_states: callStates,
        enabled: true,
      })
    })

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text()
      throw new Error(`Failed to create subscription: ${errorText}`)
    }

    const subscription = await subscriptionResponse.json()
    console.log('[Provision] Call subscription created:', subscription.id)

    // Step 4: Create Tenant in Supabase
    console.log('[Provision] Creating tenant record in Supabase...')

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: clientName.trim(),
        slug: slug,
        dialpad_cc_id: dialpadCC.id.toString(),
        dialpad_cc_phone: dialpadCC.phone_number || null,
        timezone: timezone,
        status: 'active',
        metadata: {
          created_via: 'edge_function',
          dialpad_office_id: dialpadCC.office_id,
          dialpad_webhook_id: webhook.id,
          dialpad_subscription_id: subscription.id,
          webhook_url: webhookUrl,
          webhook_secret: webhookSecret,
          call_states: callStates,
          created_at: new Date().toISOString(),
        }
      })
      .select()
      .single()

    if (tenantError) {
      throw new Error(`Failed to create tenant record: ${tenantError.message}`)
    }

    console.log('[Provision] Tenant created successfully:', tenant.id)

    // Step 5: Create Inbound Lead Webhook
    console.log('[Provision] Creating inbound lead webhook...')
    
    const leadWebhookId = crypto.randomUUID().replace(/-/g, '')
    const leadWebhookUrl = `${baseUrl}/inbound-lead/${leadWebhookId}`

    const { error: leadWebhookError } = await supabaseAdmin
      .from('webhooks')
      .insert({
        client_id: tenant.id,
        type: 'lead',
        url: leadWebhookUrl,
        secret: leadWebhookId,
        active: true,
      })

    if (leadWebhookError) {
      console.error('[Provision] Lead webhook creation error:', leadWebhookError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Client "${clientName}" provisioned successfully`,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          dialpad_cc_id: tenant.dialpad_cc_id,
          timezone: tenant.timezone,
        },
        dialpad: {
          id: dialpadCC.id,
          name: dialpadCC.name,
          webhook_id: webhook.id,
          subscription_id: subscription.id,
        },
        webhooks: {
          dialpad_events: webhookUrl,
          inbound_leads: leadWebhookUrl,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[Provision] Error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
