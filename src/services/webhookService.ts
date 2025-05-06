
import { supabase } from "@/integrations/supabase/client";

export interface LeadWebhookPayload {
  contact: {
    name?: string;
    phone?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  lead: {
    source?: string;
    location?: string;
    timestamp?: string;
    notes?: string;
  };
  agency: {
    id: string;
  };
}

// Send notification about a new lead
export const sendLeadNotification = async (
  payload: LeadWebhookPayload, 
  webhookUrl: string
): Promise<boolean> => {
  try {
    // In a real implementation, this would make a POST request to the webhook URL
    console.log(`Sending notification to ${webhookUrl}`, payload);
    
    // Simulate a successful webhook delivery
    return true;
  } catch (error) {
    console.error("Error sending lead notification:", error);
    return false;
  }
};

// Process an incoming webhook for a new lead
export const processLeadWebhook = async (
  payload: LeadWebhookPayload, 
  secret: string
): Promise<{success: boolean, leadId?: string, error?: string}> => {
  try {
    // In a real implementation, this would validate the webhook secret and process the lead
    console.log("Processing lead webhook with secret:", secret);
    
    // For demo purposes, let's assume all webhooks are valid
    const { data: webhookData, error: webhookError } = await supabase
      .from('webhooks')
      .select('client_id')
      .eq('secret', secret)
      .eq('type', 'lead')
      .eq('active', true)
      .single();
    
    if (webhookError) {
      return { success: false, error: "Invalid webhook secret" };
    }
    
    // Get agencies for this client
    const { data: agencyData, error: agencyError } = await supabase
      .from('agencies')
      .select('id')
      .eq('client_id', webhookData.client_id)
      .single();
    
    if (agencyError) {
      return { success: false, error: "Client has no agencies" };
    }
    
    // Create a new lead
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert({
        agency_id: payload.agency.id || agencyData.id,
        contact_id: payload.contact.name || `${payload.contact.firstName || ''} ${payload.contact.lastName || ''}`.trim() || 'Unknown',
        contact_number: payload.contact.phone || 'Unknown',
        location: payload.lead?.location || 'Main Location',
        time_of_notification: payload.lead?.timestamp || new Date().toISOString(),
        firstName: payload.contact.firstName || '',
        lastName: payload.contact.lastName || '',
      })
      .select('id')
      .single();
    
    if (leadError) {
      return { success: false, error: leadError.message };
    }
    
    return { success: true, leadId: leadData.id };
  } catch (error) {
    console.error("Error processing lead webhook:", error);
    return { success: false, error: error.message };
  }
};

// Get webhook information by secret
export const getWebhookBySecret = async (secret: string) => {
  const { data, error } = await supabase
    .from('webhooks')
    .select(`
      id,
      client_id,
      agency_id,
      type,
      url,
      active,
      clients (
        name
      )
    `)
    .eq('secret', secret)
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
};
