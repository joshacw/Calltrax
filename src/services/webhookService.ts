import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Type definitions for webhook payloads
export interface HangupEventPayload {
  event_type: "call.hangup";
  call_id: string;
  timestamp: string;
  call_center_id: string;
  caller_id: string;
  call_direction: "inbound" | "outbound";
  duration: number;
  recording_url?: string;
  call_outcome?: "answered" | "voicemail" | "missed" | "declined";
  agent_connected?: boolean;
}

export interface DispositionEventPayload {
  event_type: "call.disposition";
  call_id: string;
  timestamp: string;
  call_center_id: string;
  agent_id: string;
  disposition: string;
  notes?: string;
}

export interface LeadWebhookPayload {
  contact: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
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

/**
 * Process a hangup event from Dialpad
 * This stores the call data in the database
 */
export const processHangupEvent = async (payload: HangupEventPayload): Promise<void> => {
  console.log("Processing hangup event:", payload);
  
  try {
    // Find the integration_settings to get the client_id
    const { data: settingsData, error: settingsError } = await supabase
      .from('integration_settings')
      .select('client_id, settings')
      .eq('integration_type', 'dialpad')
      .filter('settings->call_center_id', 'eq', payload.call_center_id)
      .single();
      
    if (settingsError) {
      console.error("Error finding client for call center:", settingsError);
      throw settingsError;
    }
    
    // Find the agency for this client
    const { data: agencyData, error: agencyError } = await supabase
      .from('agencies')
      .select('id')
      .eq('client_id', settingsData.client_id)
      .single();
      
    if (agencyError) {
      console.error("Error finding agency for client:", agencyError);
      throw agencyError;
    }
    
    // Check if there's a lead with this caller_id
    let leadId;
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('id, time_of_notification')
      .eq('agency_id', agencyData.id)
      .eq('contact_number', payload.caller_id)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (leadError) {
      console.error("Error checking for existing lead:", leadError);
      throw leadError;
    }
    
    // Determine if this was a real connection based on call outcome or agent connection
    const isRealConnection = 
      (payload.call_outcome === "answered" && payload.duration > 10) || 
      (payload.agent_connected === true);
    
    if (leadData.length === 0) {
      // Create a new lead if none exists
      const { data: newLead, error: newLeadError } = await supabase
        .from('leads')
        .insert({
          agency_id: agencyData.id,
          contact_number: payload.caller_id,
          location: 'Unknown', // Default location
          time_of_notification: payload.timestamp,
          time_of_first_call: payload.timestamp,
          time_of_last_call: payload.timestamp,
          number_of_calls: 1,
          number_of_conversations: isRealConnection ? 1 : 0,
          connected: isRealConnection,
          appointment_booked: false
        })
        .select('id')
        .single();
        
      if (newLeadError) {
        console.error("Error creating new lead:", newLeadError);
        throw newLeadError;
      }
      
      leadId = newLead.id;
    } else {
      // Update the existing lead
      leadId = leadData[0].id;
      
      // Calculate speed to lead if this is the first call and we have notification time
      let speedToLead;
      if (leadData[0].time_of_notification) {
        const firstCallTime = new Date(payload.timestamp);
        const notificationTime = new Date(leadData[0].time_of_notification);
        
        // Calculate speed to lead in seconds
        if (!isNaN(firstCallTime.getTime()) && !isNaN(notificationTime.getTime())) {
          speedToLead = Math.floor((firstCallTime.getTime() - notificationTime.getTime()) / 1000);
        }
      }
      
      // Use a correct increment method with our improved connection detection
      const { error: updateLeadError } = await supabase.rpc('increment_call_count', { 
        lead_id: leadId,
        is_conversation: isRealConnection,
        speed_to_lead_value: speedToLead,
        call_timestamp: payload.timestamp
      });
      
      if (updateLeadError) {
        console.error("Error updating lead:", updateLeadError);
        throw updateLeadError;
      }
    }
    
    // Insert the call record
    const { error: callError } = await supabase
      .from('calls')
      .insert({
        lead_id: leadId,
        contact_number: payload.caller_id,
        direction: payload.call_direction as "inbound" | "outbound",
        duration: payload.duration,
        public_share_link: payload.recording_url,
        timestamp: payload.timestamp,
        disposition: payload.call_outcome || null
      });
      
    if (callError) {
      console.error("Error inserting call record:", callError);
      throw callError;
    }
    
    toast.success("Call hangup event processed", {
      description: `Call ID: ${payload.call_id.substring(0, 8)}...`,
    });
  } catch (error) {
    console.error("Failed to process hangup event:", error);
    toast.error("Failed to process call event", {
      description: error.message,
    });
  }
};

/**
 * Process a disposition event from Dialpad
 * This updates the existing call record with disposition information
 */
export const processDispositionEvent = async (payload: DispositionEventPayload): Promise<void> => {
  console.log("Processing disposition event:", payload);
  
  try {
    // Find the integration_settings to get the client_id
    const { data: settingsData, error: settingsError } = await supabase
      .from('integration_settings')
      .select('client_id, settings')
      .eq('integration_type', 'dialpad')
      .filter('settings->call_center_id', 'eq', payload.call_center_id)
      .single();
      
    if (settingsError) {
      console.error("Error finding client for call center:", settingsError);
      throw settingsError;
    }
    
    // Find the call record by call_id
    const { data: callData, error: callError } = await supabase
      .from('calls')
      .select('id, lead_id')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (callError) {
      console.error("Error finding call record:", callError);
      throw callError;
    }
    
    if (callData.length === 0) {
      throw new Error("No call record found for disposition event");
    }
    
    // Update the call record with disposition information
    const { error: updateCallError } = await supabase
      .from('calls')
      .update({
        disposition: payload.disposition,
        notes: payload.notes || null
      })
      .eq('id', callData[0].id);
      
    if (updateCallError) {
      console.error("Error updating call with disposition:", updateCallError);
      throw updateCallError;
    }
    
    // If disposition indicates appointment booked, update the lead
    if (payload.disposition.toLowerCase().includes('appointment') || 
        payload.disposition.toLowerCase().includes('booked')) {
      const { error: updateLeadError } = await supabase
        .from('leads')
        .update({
          appointment_booked: true
        })
        .eq('id', callData[0].lead_id);
        
      if (updateLeadError) {
        console.error("Error updating lead with appointment status:", updateLeadError);
        throw updateLeadError;
      }
    }
    
    toast.success("Call disposition event processed", {
      description: `Call ID: ${payload.call_id.substring(0, 8)}..., Disposition: ${payload.disposition}`,
    });
  } catch (error) {
    console.error("Failed to process disposition event:", error);
    toast.error("Failed to process disposition event", {
      description: error.message,
    });
  }
};

/**
 * Process an inbound lead webhook
 * This creates a new lead in the database or updates an existing one
 */
export const processLeadWebhook = async (payload: LeadWebhookPayload): Promise<void> => {
  console.log("Processing lead webhook:", payload);
  
  try {
    const agencyId = payload.agency?.id;
    
    if (!agencyId) {
      throw new Error("Agency ID is required in webhook payload");
    }
    
    // Check if agency exists
    const { data: agencyData, error: agencyError } = await supabase
      .from('agencies')
      .select('id')
      .eq('id', agencyId)
      .single();
      
    if (agencyError) {
      console.error("Error finding agency:", agencyError);
      throw agencyError;
    }

    // Check if a lead with this contact number already exists
    const contactPhone = payload.contact?.phone || '';
    
    if (!contactPhone) {
      throw new Error("Contact phone number is required in webhook payload");
    }
    
    const { data: existingLeads, error: leadCheckError } = await supabase
      .from('leads')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('contact_number', contactPhone)
      .limit(1);
      
    if (leadCheckError) {
      console.error("Error checking for existing leads:", leadCheckError);
      throw leadCheckError;
    }
    
    if (existingLeads && existingLeads.length > 0) {
      // Update the existing lead instead of creating a new one
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          contact_id: payload.contact?.id || null,
          location: payload.lead?.location || 'Unknown',
          time_of_notification: payload.lead?.timestamp || new Date().toISOString()
        })
        .eq('id', existingLeads[0].id);
        
      if (updateError) {
        console.error("Error updating existing lead:", updateError);
        throw updateError;
      }
      
      toast.success("Lead updated", {
        description: `Contact: ${payload.contact?.name || contactPhone}`,
      });
      
      return;
    }
    
    // Create the lead if it doesn't exist
    const { error: leadError } = await supabase
      .from('leads')
      .insert({
        agency_id: agencyId,
        contact_id: payload.contact?.id || null,
        contact_number: contactPhone,
        location: payload.lead?.location || 'Unknown',
        time_of_notification: payload.lead?.timestamp || new Date().toISOString(),
        number_of_calls: 0,
        number_of_conversations: 0,
        connected: false,
        appointment_booked: false
      });
      
    if (leadError) {
      console.error("Error creating lead:", leadError);
      throw leadError;
    }
    
    toast.success("New lead received", {
      description: `Lead: ${payload.contact?.name || "Unknown"}`,
    });
  } catch (error) {
    console.error("Failed to process lead webhook:", error);
    toast.error("Failed to process lead webhook", {
      description: error.message,
    });
  }
};
