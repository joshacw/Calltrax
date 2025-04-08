/**
 * Service for interacting with the Dialpad API
 * This is a real implementation that makes API calls to Dialpad
 */

import { supabase } from '@/integrations/supabase/client';

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

// Get the proper base URL for the proxy endpoint based on the environment
const getProxyUrl = () => {
  // Always use the production Supabase URL
  return 'https://kjpbwdyyhqgwkzuymzer.supabase.co/functions/v1/dialpad-proxy';
};

// Base URL for the proxy endpoint
const PROXY_URL = getProxyUrl();

// Get the Dialpad API token from localStorage
const getDialpadApiToken = (): string => {
  return localStorage.getItem("dialpadApiToken") || "";
};

// Helper function to make authenticated requests to Dialpad API through our proxy
const dialpadRequest = async <T>(
  method: string,
  endpoint: string,
  body?: Record<string, unknown>,
  retries = 3
): Promise<T> => {
  const apiToken = getDialpadApiToken();
  if (!apiToken) {
    throw new Error("Dialpad API token not found. Please set it in Settings > Integrations.");
  }

  try {
    console.log(`Making ${method} request to Dialpad API: ${endpoint} through proxy: ${PROXY_URL}`);
    console.log(`Using token (first 5 chars): ${apiToken.substring(0, 5)}...`);

    // Get the Supabase session for authorization
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No active Supabase session found. Please log in again.");
    }

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        method,
        endpoint,
        token: apiToken,
        body,
      }),
    };
    console.log('PL-service', requestOptions);

    // Use an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

    const fetchOptions = {
      ...requestOptions,
      signal: controller.signal,
    };

    const response = await fetch(`${PROXY_URL}?debug=true`, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      const errorMessage = errorData.error || response.statusText;
      console.error(`Dialpad API error (${response.status}): ${errorMessage}`, errorData);
      throw new Error(`Dialpad API error (${response.status}): ${errorMessage}`);
    }

    const result = await response.json();

    // If the proxied request had an error status, throw it
    if (result.status >= 400) {
      console.error(`Dialpad API error (${result.status}): ${result.statusText}`, result);
      throw new Error(`Dialpad API error (${result.status}): ${result.statusText || 'Unknown error'}`);
    }

    return result.data as T;
  } catch (error) {
    console.error("Dialpad API request error:", error);

    // Handle AbortController timeouts
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request to Dialpad API timed out after 20 seconds. Please try again later.");
    }

    if (retries > 0 && (error instanceof TypeError || (error instanceof Error && (error.message.includes("network") || error.message.includes("fetch"))))) {
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
  connectedEndpoint: DialpadEndpoint;
  hangupSubscription: DialpadSubscription;
  dispositionSubscription: DialpadSubscription;
  connectedSubscription: DialpadSubscription;
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

    const connectedEndpoint = await createDialpadEndpoint(
      `https://api.calltrax.com/webhooks/dialpad/connected/${callCenter.id}`
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

    const connectedSubscription = await createDialpadSubscription(
      callCenter.id,
      ["connected"],
      connectedEndpoint.id
    );

    return {
      channel,
      callCenter,
      hangupEndpoint,
      dispositionEndpoint,
      connectedEndpoint,
      hangupSubscription,
      dispositionSubscription,
      connectedSubscription
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

// Test connection to Dialpad API through our proxy
export const testDialpadConnection = async (token: string): Promise<boolean> => {
  try {
    console.log("Testing Dialpad connection with token:", token ? "Token provided" : "No token");

    if (!token) {
      return false;
    }

    // Add more detailed logging for debugging
    console.log("Using proxy URL:", PROXY_URL);

    // Use a simple retry mechanism for the test connection
    let attemptCount = 0;
    const maxAttempts = 2;

    while (attemptCount < maxAttempts) {
      attemptCount++;
      console.log(`Connection test attempt ${attemptCount}/${maxAttempts}`);

      try {
        // Get the Supabase session for authorization
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.warn("No active Supabase session found for authorization");
        } else {
          console.log("Got Supabase session, access token available:", !!session.access_token);
        }

        // Use our proxy endpoint to test the connection with a simple endpoint
        const requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": session ? `Bearer ${session.access_token}` : ""
          },
          body: JSON.stringify({
            method: "GET",
            endpoint: "/channels?limit=1",
            token: token
          }),
        };

        console.log("Test connection request options:", {
          ...requestOptions,
          body: {
            ...JSON.parse(requestOptions.body),
            token: "[REDACTED]"
          }
        });

        // Add timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(`${PROXY_URL}?debug=true`, {
          ...requestOptions,
          signal: controller.signal
        });

        console.log('response', response);

        clearTimeout(timeoutId);

        // Check if we got a response at all
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Proxy error response:", errorText);

          // If we got a 500+ error from our own proxy, it might be a temporary issue
          if (response.status >= 500) {
            throw new Error(`Temporary server error: ${response.status} ${response.statusText}`);
          }

          return false;
        }

        // Parse the response
        const result = await response.json();
        console.log("Dialpad test connection response:", result.status, result.statusText, result);

        // If the proxied request returns 401, the token is invalid
        if (result.status === 401) {
          console.error("Invalid Dialpad API token (401 Unauthorized)");
          return false;
        }

        // Check for non-JSON responses which might indicate an issue
        if (result.data && result.data._nonJson) {
          console.error("Received non-JSON response from Dialpad API:", result.data.text);
          console.error("Content type:", result.data.contentType);

          // Check if this looks like a rate limiting or temporary issue
          if (result.data.text.includes("rate limit") ||
              result.data.text.includes("too many requests") ||
              result.status === 429) {
            console.warn("Dialpad API rate limiting detected. Try again later.");
            throw new Error("Rate limiting detected. Retrying...");
          }

          return false;
        }

        // If we get here, the test was successful
        return result.status >= 200 && result.status < 300;
      } catch (error) {
        console.error(`Connection test attempt ${attemptCount} failed:`, error);

        // For AbortController timeout errors
        if (error.name === "AbortError") {
          console.warn("Connection test timed out");
          // If this is not our last attempt, retry
          if (attemptCount < maxAttempts) {
            console.log("Retrying after timeout...");
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }

        // Only retry if it's a network error and not the last attempt
        if (error instanceof TypeError && error.message.includes("fetch") && attemptCount < maxAttempts) {
          console.log("Network error, retrying in 2 seconds...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        // If we've tried all attempts or it's not a retryable error, return false
        if (attemptCount >= maxAttempts) {
          console.error("All connection test attempts failed");
          return false;
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Failed to test Dialpad connection:", error);
    // For network errors to our proxy, consider it a temporary issue, not a token issue
    return false;
  }
};

// Validate Dialpad API token
export const validateDialpadApiToken = async (): Promise<boolean> => {
  try {
    const token = getDialpadApiToken();
    if (!token) {
      return false;
    }

    console.log("Validating Dialpad API token...");
    return await testDialpadConnection(token);
  } catch (error) {
    console.error("Dialpad API token validation failed:", error);
    return false;
  }
};
