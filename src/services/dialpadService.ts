
/**
 * Service for interacting with the Dialpad API
 * This is a mock implementation - in a real application, 
 * this would make actual API calls to Dialpad
 */

// Types for Dialpad service responses
export interface DialpadChannel {
  id: string;
  name: string;
  created_at: string;
}

export interface DialpadCallCenter {
  id: string;
  name: string;
  channel_id: string;
  created_at: string;
}

export interface DialpadWebhook {
  id: string;
  url: string;
  event_type: string;
  created_at: string;
}

export interface DialpadEndpoint {
  id: string;
  url: string;
  created_at: string;
}

export interface DialpadSubscription {
  id: string;
  enabled: boolean;
  call_states: string[];
  endpoint_id: string;
  target_type: string;
  target_id: string;
  created_at: string;
}

// Get the Dialpad API token from localStorage
const getDialpadApiToken = (): string => {
  return localStorage.getItem("dialpadApiToken") || "";
};

// Mock client creation in Dialpad
export const createDialpadClient = async (clientName: string): Promise<{
  channel: DialpadChannel;
  callCenter: DialpadCallCenter;
  hangupEndpoint: DialpadEndpoint;
  dispositionEndpoint: DialpadEndpoint;
  hangupSubscription: DialpadSubscription;
  dispositionSubscription: DialpadSubscription;
}> => {
  // Check if API token exists
  const apiToken = getDialpadApiToken();
  if (!apiToken) {
    throw new Error("Dialpad API token not found. Please set it in Settings > Integrations.");
  }
  
  // In a real implementation, this would make API calls to Dialpad using the token
  
  // Create a channel
  const channel = await createDialpadChannel(clientName);
  
  // Create a call center
  const callCenter = await createDialpadCallCenter(clientName, channel.id);
  
  // Create endpoints for webhooks
  const hangupEndpoint = await createDialpadEndpoint(
    `https://api.calltrax.com/webhooks/dialpad/hangup/${callCenter.id}`
  );
  
  const dispositionEndpoint = await createDialpadEndpoint(
    `https://api.calltrax.com/webhooks/dialpad/disposition/${callCenter.id}`
  );
  
  // Setup event subscriptions
  const hangupSubscription = await createDialpadSubscription(
    callCenter.id,
    ["hangup"],
    hangupEndpoint.id
  );
  
  const dispositionSubscription = await createDialpadSubscription(
    callCenter.id,
    ["disposition"],
    dispositionEndpoint.id
  );
  
  return {
    channel,
    callCenter,
    hangupEndpoint,
    dispositionEndpoint,
    hangupSubscription,
    dispositionSubscription
  };
};

// Mock creating a channel in Dialpad
const createDialpadChannel = async (name: string): Promise<DialpadChannel> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock response
  return {
    id: `ch_${Math.random().toString(36).substring(2, 10)}`,
    name: `${name} Channel`,
    created_at: new Date().toISOString()
  };
};

// Mock creating a call center in Dialpad
const createDialpadCallCenter = async (name: string, channelId: string): Promise<DialpadCallCenter> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock response
  return {
    id: `cc_${Math.random().toString(36).substring(2, 10)}`,
    name: `${name} Call Center`,
    channel_id: channelId,
    created_at: new Date().toISOString()
  };
};

// Mock creating an endpoint in Dialpad
const createDialpadEndpoint = async (url: string): Promise<DialpadEndpoint> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock response
  return {
    id: `ep_${Math.random().toString(36).substring(2, 10)}`,
    url,
    created_at: new Date().toISOString()
  };
};

// Mock creating a subscription in Dialpad
const createDialpadSubscription = async (
  callCenterId: string,
  callStates: string[],
  endpointId: string
): Promise<DialpadSubscription> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock response
  return {
    id: `sub_${Math.random().toString(36).substring(2, 10)}`,
    enabled: true,
    call_states: callStates,
    endpoint_id: endpointId,
    target_type: "callcenter",
    target_id: callCenterId,
    created_at: new Date().toISOString()
  };
};
