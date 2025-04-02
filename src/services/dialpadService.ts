
/**
 * Service for interacting with the Dialpad API
 * This is a real implementation that makes API calls to Dialpad
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

// Base Dialpad API URL
const DIALPAD_API_BASE_URL = "https://api.dialpad.com/v2";

// Get the Dialpad API token from localStorage
const getDialpadApiToken = (): string => {
  return localStorage.getItem("dialpadApiToken") || "";
};

// Helper function to make authenticated requests to Dialpad API
const dialpadRequest = async <T>(
  method: string,
  endpoint: string,
  body?: any,
  retries = 3
): Promise<T> => {
  const apiToken = getDialpadApiToken();
  if (!apiToken) {
    throw new Error("Dialpad API token not found. Please set it in Settings > Integrations.");
  }

  const url = `${DIALPAD_API_BASE_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await fetch(url, options);
    
    // Handle rate limiting (429) with exponential backoff
    if (response.status === 429 && retries > 0) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
      console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return dialpadRequest<T>(method, endpoint, body, retries - 1);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Dialpad API error (${response.status}): ${errorData.error || response.statusText}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    if (retries > 0 && (error instanceof TypeError || error.message.includes("network"))) {
      // Network errors retry with exponential backoff
      const delay = 2000 * Math.pow(2, 3 - retries);
      console.log(`Network error. Retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return dialpadRequest<T>(method, endpoint, body, retries - 1);
    }
    throw error;
  }
};

// Create client in Dialpad by setting up all necessary components
export const createDialpadClient = async (clientName: string): Promise<{
  channel: DialpadChannel;
  callCenter: DialpadCallCenter;
  hangupEndpoint: DialpadEndpoint;
  dispositionEndpoint: DialpadEndpoint;
  hangupSubscription: DialpadSubscription;
  dispositionSubscription: DialpadSubscription;
}> => {
  try {
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
  } catch (error) {
    console.error("Error creating Dialpad client:", error);
    throw new Error(`Failed to create Dialpad client: ${error.message}`);
  }
};

// Create a channel in Dialpad
const createDialpadChannel = async (name: string): Promise<DialpadChannel> => {
  const response = await dialpadRequest<{ channel: DialpadChannel }>(
    "POST",
    "/channels",
    {
      name: `${name} Channel`,
      description: `Channel for ${name} created by CallTrax`
    }
  );
  
  return response.channel;
};

// Create a call center in Dialpad
const createDialpadCallCenter = async (name: string, channelId: string): Promise<DialpadCallCenter> => {
  const response = await dialpadRequest<{ call_center: DialpadCallCenter }>(
    "POST",
    "/call_centers",
    {
      name: `${name} Call Center`,
      channel_id: channelId,
      description: `Call center for ${name} created by CallTrax`
    }
  );
  
  return response.call_center;
};

// Create an endpoint in Dialpad
const createDialpadEndpoint = async (url: string): Promise<DialpadEndpoint> => {
  const response = await dialpadRequest<{ endpoint: DialpadEndpoint }>(
    "POST",
    "/endpoints",
    {
      url,
      description: "CallTrax webhook endpoint"
    }
  );
  
  return response.endpoint;
};

// Create a subscription in Dialpad
const createDialpadSubscription = async (
  callCenterId: string,
  callStates: string[],
  endpointId: string
): Promise<DialpadSubscription> => {
  const response = await dialpadRequest<{ subscription: DialpadSubscription }>(
    "POST",
    "/subscriptions",
    {
      enabled: true,
      call_states: callStates,
      endpoint_id: endpointId,
      target_type: "callcenter",
      target_id: callCenterId
    }
  );
  
  return response.subscription;
};

// Get all channels for a Dialpad account
export const getDialpadChannels = async (): Promise<DialpadChannel[]> => {
  const response = await dialpadRequest<{ channels: DialpadChannel[] }>("GET", "/channels");
  return response.channels;
};

// Get all call centers for a Dialpad account
export const getDialpadCallCenters = async (): Promise<DialpadCallCenter[]> => {
  const response = await dialpadRequest<{ call_centers: DialpadCallCenter[] }>("GET", "/call_centers");
  return response.call_centers;
};

// Get a specific call center by ID
export const getDialpadCallCenterById = async (id: string): Promise<DialpadCallCenter> => {
  const response = await dialpadRequest<{ call_center: DialpadCallCenter }>("GET", `/call_centers/${id}`);
  return response.call_center;
};

// Update a call center
export const updateDialpadCallCenter = async (id: string, data: any): Promise<DialpadCallCenter> => {
  const response = await dialpadRequest<{ call_center: DialpadCallCenter }>("PATCH", `/call_centers/${id}`, data);
  return response.call_center;
};

// Delete a call center
export const deleteDialpadCallCenter = async (id: string): Promise<void> => {
  await dialpadRequest<void>("DELETE", `/call_centers/${id}`);
};

// Validate Dialpad API token
export const validateDialpadApiToken = async (): Promise<boolean> => {
  try {
    await getDialpadChannels();
    return true;
  } catch (error) {
    console.error("Dialpad API token validation failed:", error);
    return false;
  }
};
