
import { toast } from "sonner";

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

// Mock storage for call data
const callStorage: Record<string, any> = {};

/**
 * Process a hangup event from Dialpad
 * In a real app, this would store the data in a database
 */
export const processHangupEvent = async (payload: HangupEventPayload): Promise<void> => {
  console.log("Processing hangup event:", payload);
  
  // Wait 60 seconds to allow for call transcript/recording to be ready
  // In a real implementation, this would be done via a background job or queue
  await new Promise(resolve => setTimeout(resolve, 60 * 1000));
  
  // Store the call data keyed by call_id
  callStorage[payload.call_id] = {
    ...callStorage[payload.call_id],
    call_id: payload.call_id,
    timestamp: payload.timestamp,
    call_center_id: payload.call_center_id,
    caller_id: payload.caller_id,
    direction: payload.call_direction,
    duration: payload.duration,
    recording_url: payload.recording_url || null,
  };
  
  console.log("Call data after hangup event:", callStorage[payload.call_id]);
  
  // In a real app, this would save to a database
  toast.success("Call hangup event processed", {
    description: `Call ID: ${payload.call_id.substring(0, 8)}...`,
  });
};

/**
 * Process a disposition event from Dialpad
 * In a real app, this would update the existing call record in a database
 */
export const processDispositionEvent = async (payload: DispositionEventPayload): Promise<void> => {
  console.log("Processing disposition event:", payload);
  
  // Wait 300 seconds (5 minutes) to allow for agent to complete disposition
  // In a real implementation, this would be done via a background job or queue
  await new Promise(resolve => setTimeout(resolve, 300 * 1000));
  
  // Check if we've already received the hangup event for this call
  if (!callStorage[payload.call_id]) {
    callStorage[payload.call_id] = {
      call_id: payload.call_id,
      timestamp: payload.timestamp,
      call_center_id: payload.call_center_id,
    };
  }
  
  // Update the call data with disposition information
  callStorage[payload.call_id] = {
    ...callStorage[payload.call_id],
    agent_id: payload.agent_id,
    disposition: payload.disposition,
    notes: payload.notes || null,
  };
  
  console.log("Call data after disposition event:", callStorage[payload.call_id]);
  
  // In a real app, this would update a record in a database
  toast.success("Call disposition event processed", {
    description: `Call ID: ${payload.call_id.substring(0, 8)}..., Disposition: ${payload.disposition}`,
  });
};

/**
 * Process an inbound lead webhook
 * In a real app, this would create a new lead in the database
 */
export const processLeadWebhook = async (payload: any): Promise<void> => {
  console.log("Processing lead webhook:", payload);
  
  // In a real app, this would create a new lead in the database
  toast.success("New lead received", {
    description: `Lead: ${payload.contact?.name || "Unknown"}`,
  });
};
