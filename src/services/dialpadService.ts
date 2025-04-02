
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

// Mock client creation in Dialpad
export const createDialpadClient = async (clientName: string): Promise<{
  channel: DialpadChannel;
  callCenter: DialpadCallCenter;
  hangupWebhook: DialpadWebhook;
  dispositionWebhook: DialpadWebhook;
}> => {
  // In a real implementation, this would make API calls to Dialpad
  
  // Create a channel
  const channel = await createDialpadChannel(clientName);
  
  // Create a call center
  const callCenter = await createDialpadCallCenter(clientName, channel.id);
  
  // Setup webhooks
  const hangupWebhook = await setupDialpadWebhook(
    callCenter.id,
    'call.hangup',
    `https://api.calltrax.com/webhooks/dialpad/hangup/${callCenter.id}`
  );
  
  const dispositionWebhook = await setupDialpadWebhook(
    callCenter.id,
    'call.disposition',
    `https://api.calltrax.com/webhooks/dialpad/disposition/${callCenter.id}`
  );
  
  return {
    channel,
    callCenter,
    hangupWebhook,
    dispositionWebhook
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

// Mock setting up a webhook in Dialpad
const setupDialpadWebhook = async (
  callCenterId: string,
  eventType: string,
  url: string
): Promise<DialpadWebhook> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock response
  return {
    id: `wh_${Math.random().toString(36).substring(2, 10)}`,
    url,
    event_type: eventType,
    created_at: new Date().toISOString()
  };
};
