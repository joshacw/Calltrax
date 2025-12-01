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
    const slug = pathParts[pathParts.length - 1]

    if (!slug || slug === 'dialpad-events') {
      throw new Error('Client slug is required in URL path')
    }

    console.log(`[Dialpad Events] Received event for client: ${slug}`)

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

    // Get tenant by slug
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, metadata')
      .eq('slug', slug)
      .single()

    if (tenantError || !tenant) {
      console.error('[Dialpad Events] Tenant not found:', slug)
      throw new Error(`Tenant not found for slug: ${slug}`)
    }

    console.log('[Dialpad Events] Found tenant:', tenant.id)

    // Get request body
    const body = await req.text()
    let payload: any

    try {
      payload = JSON.parse(body)
    } catch (e) {
      // Might be JWT, try to parse as-is for now
      console.log('[Dialpad Events] Body is not JSON, might be JWT')
      payload = { raw: body }
    }

    console.log('[Dialpad Events] Event type:', payload.event_type || 'unknown')
    console.log('[Dialpad Events] Call ID:', payload.call_id || 'unknown')

    // Extract call data
    const callData = {
      external_id: payload.call_id?.toString() || `dialpad-${Date.now()}`,
      tenant_id: tenant.id,
      direction: payload.direction || 'outbound',
      from_number: payload.from_number || null,
      to_number: payload.to_number || null,
      status: mapDialpadState(payload.event_type),
      started_at: payload.start_time ? new Date(payload.start_time * 1000).toISOString() : new Date().toISOString(),
      connected_at: payload.event_type === 'connected' ? new Date().toISOString() : null,
      ended_at: payload.event_type === 'hangup' ? new Date().toISOString() : null,
      duration: payload.duration || null,
      recording_url: payload.recording_url || null,
      metadata: {
        dialpad_event: payload.event_type,
        call_center_id: payload.call_center_id,
        agent_id: payload.user_id,
        raw_payload: payload,
        received_at: new Date().toISOString(),
      }
    }

    // Check if call already exists
    const { data: existingCall } = await supabase
      .from('calls')
      .select('id, status')
      .eq('external_id', callData.external_id)
      .eq('tenant_id', tenant.id)
      .maybeSingle()

    if (existingCall) {
      // Update existing call
      console.log('[Dialpad Events] Updating existing call:', existingCall.id)
      
      const updateData: any = {
        status: callData.status,
        metadata: callData.metadata,
      }

      if (callData.connected_at) updateData.connected_at = callData.connected_at
      if (callData.ended_at) {
        updateData.ended_at = callData.ended_at
        updateData.duration = callData.duration
      }
      if (callData.recording_url) updateData.recording_url = callData.recording_url

      const { error: updateError } = await supabase
        .from('calls')
        .update(updateData)
        .eq('id', existingCall.id)

      if (updateError) {
        console.error('[Dialpad Events] Error updating call:', updateError)
      }

      // Handle disposition
      if (payload.event_type === 'dispositions' && payload.disposition) {
        console.log('[Dialpad Events] Adding disposition:', payload.disposition)
        
        await supabase
          .from('calls')
          .update({
            disposition: payload.disposition.toLowerCase(),
            disposition_notes: payload.disposition_notes || null,
          })
          .eq('id', existingCall.id)
      }

    } else {
      // Create new call record
      console.log('[Dialpad Events] Creating new call record')
      
      const { error: insertError } = await supabase
        .from('calls')
        .insert(callData)

      if (insertError) {
        console.error('[Dialpad Events] Error creating call:', insertError)
      }
    }

    console.log('[Dialpad Events] Successfully processed event')

    return new Response(
      JSON.stringify({ success: true, message: 'Event processed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('[Dialpad Events] Error:', error)
    
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

function mapDialpadState(eventType: string): string {
  const mapping: Record<string, string> = {
    'ringing': 'ringing',
    'connected': 'connected',
    'hangup': 'completed',
    'voicemail': 'voicemail',
    'missed': 'missed',
    'dispositions': 'completed',
  }
  
  return mapping[eventType] || 'unknown'
}
