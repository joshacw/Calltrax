
// Mock data for dialpad service
import { toast } from "sonner";

// Validate if the API token exists and is valid
export const validateDialpadApiToken = async (): Promise<boolean> => {
  const apiToken = localStorage.getItem("dialpadApiToken");
  
  if (!apiToken) {
    console.log("No Dialpad API token found");
    return false;
  }
  
  // In a real implementation, this would make an API call to verify the token
  // For demo purposes, we just check if it exists and is not empty
  try {
    // Mock API verification - in a real app this would call Dialpad API
    return apiToken.length > 0;
  } catch (error) {
    console.error("Error validating Dialpad API token:", error);
    return false;
  }
};

// Test Dialpad connection with a provided token
export const testDialpadConnection = async (token: string): Promise<boolean> => {
  if (!token) {
    console.log("No Dialpad API token provided for testing");
    return false;
  }
  
  try {
    // In a real implementation, this would make an API call to test the token
    // For demo purposes, we simulate a successful connection if token is not empty
    console.log("Testing Dialpad connection with token length:", token.length);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation - in a real app this would call the Dialpad API
    return token.length > 10; // Basic validation - token should be longer than 10 chars
  } catch (error) {
    console.error("Error testing Dialpad connection:", error);
    return false;
  }
};

// Get Dialpad call centers from the API
export const getDialpadCallCenters = async () => {
  const apiToken = localStorage.getItem("dialpadApiToken");
  
  if (!apiToken) {
    throw new Error("No Dialpad API token found");
  }
  
  try {
    // In a real implementation, this would fetch from the Dialpad API
    // For demo purposes, we return mock data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock call centers
    return [
      {
        id: "cc_1",
        name: "Sales Team Call Center",
        channel_id: "ch_sales",
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "cc_2",
        name: "Support Team Call Center",
        channel_id: "ch_support",
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "cc_3",
        name: "Marketing Team Call Center",
        channel_id: "ch_marketing",
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "cc_4",
        name: "Enterprise Solutions Call Center",
        channel_id: "ch_enterprise",
        created_at: new Date().toISOString(),
      }
    ];
  } catch (error) {
    console.error("Error fetching Dialpad call centers:", error);
    throw new Error(`Failed to fetch Dialpad call centers: ${error.message}`);
  }
};

// Create a new Dialpad integration for a client
export const createDialpadClient = async (clientName: string) => {
  try {
    // This would normally make API calls to Dialpad to create needed resources
    // For demo purposes, we'll simulate success with mock data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response
    return {
      channel: { id: `channel-${Date.now()}` },
      callCenter: { id: `call-center-${Date.now()}` },
      hangupEndpoint: { id: `hangup-endpoint-${Date.now()}` },
      dispositionEndpoint: { id: `disposition-endpoint-${Date.now()}` },
      connectedEndpoint: { id: `connected-endpoint-${Date.now()}` },
      hangupSubscription: { id: `hangup-subscription-${Date.now()}` },
      dispositionSubscription: { id: `disposition-subscription-${Date.now()}` },
      connectedSubscription: { id: `connected-subscription-${Date.now()}` }
    };
  } catch (error) {
    console.error("Error creating Dialpad client:", error);
    throw new Error(`Failed to create Dialpad integration: ${error.message}`);
  }
};

// Save Dialpad API token
export const saveDialpadApiToken = (token: string): void => {
  localStorage.setItem("dialpadApiToken", token);
  toast.success("Dialpad API token saved successfully");
};

// Get Dialpad API token
export const getDialpadApiToken = (): string | null => {
  return localStorage.getItem("dialpadApiToken");
};

// Clear Dialpad API token
export const clearDialpadApiToken = (): void => {
  localStorage.removeItem("dialpadApiToken");
  toast.success("Dialpad API token cleared");
};

// Get demo webhook for clients without setting up real integration
export const getDemoWebhook = (): string => {
  return `${window.location.origin}/api/webhooks/lead/demo-${Math.random().toString(36).substring(2, 15)}`;
};

// Get client settings including Dialpad integration
export const getClientDialpadSettings = async (clientId: string) => {
  // In a real implementation, this would fetch from the database
  // For demo purposes, we return mock data
  return {
    apiToken: localStorage.getItem("dialpadApiToken") || "demo-token",
    webhookUrl: getDemoWebhook(),
    colorGrading: {
      good: "#10b981",
      average: "#f59e0b",
      poor: "#ef4444",
    },
    kpiTargets: {
      speedToLead: 120,
      connectionRate: 50,
      bookingRate: 30,
      callsPerLead: 3,
    },
  };
};
