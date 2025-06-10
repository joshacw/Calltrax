
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Phone } from "lucide-react";
import { createDialpadClient, validateDialpadApiToken } from "@/services/dialpadService";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Create a schema for client creation
const clientSchema = z.object({
  name: z.string().min(2, {
    message: "Client name must be at least 2 characters.",
  }),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

interface StepStatus {
  status: "pending" | "loading" | "completed" | "error";
  message: string;
}

interface ClientFormProps {
  onSuccess?: (clientName: string, clientId: string, webhookUrl: string) => void;
}

// Function to generate a unique webhook URL
const generateWebhookUrl = () => {
  // Generate a random string for the webhook ID
  const webhookId = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
  // Return the full webhook URL
  return `${window.location.origin}/api/webhooks/lead/${webhookId}`;
};

export const ClientForm = ({ onSuccess }: ClientFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [apiTokenMissing, setApiTokenMissing] = useState(false);
  const [steps, setSteps] = useState<Record<string, StepStatus>>({
    createChannel: { status: "pending", message: "Create channel in Dialpad" },
    createCallCenter: { status: "pending", message: "Create call center in Dialpad" },
    createHangupEndpoint: { status: "pending", message: "Create endpoint for hangup events" },
    createDispositionEndpoint: { status: "pending", message: "Create endpoint for disposition events" },
    createConnectedEndpoint: { status: "pending", message: "Create endpoint for connection events" },
    setupHangupSubscription: { status: "pending", message: "Setup subscription for hangup events" },
    setupDispositionSubscription: { status: "pending", message: "Setup subscription for disposition events" },
    setupConnectedSubscription: { status: "pending", message: "Setup subscription for connection events" },
    saveClientToDatabase: { status: "pending", message: "Save client information to database" },
    createWebhook: { status: "pending", message: "Create inbound lead webhook" },
  });
  
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
    },
  });

  // Check if Dialpad API token exists on component mount
  useEffect(() => {
    const checkApiToken = async () => {
      const apiToken = localStorage.getItem("dialpadApiToken");
      if (!apiToken) {
        setApiTokenMissing(true);
      } else {
        try {
          const isValid = await validateDialpadApiToken();
          if (!isValid) {
            setApiTokenMissing(true);
            toast.error("The Dialpad API token is invalid. Please check your settings.");
          }
        } catch (error) {
          console.error("Error validating Dialpad token:", error);
          setApiTokenMissing(true);
        }
      }
    };
    
    checkApiToken();
  }, []);

  const saveClientToDatabase = async (name: string, dialpadData: any): Promise<{clientId: string, webhookUrl: string}> => {
    try {
      updateStep("saveClientToDatabase", "loading");
      
      // Insert client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          name,
        })
        .select('id')
        .single();
        
      if (clientError) throw clientError;

      if (!clientData) {
        throw new Error("Failed to create client - no data returned");
      }
      
      // Insert integration settings for Dialpad
      const { error: settingsError } = await supabase
        .from('integration_settings')
        .insert({
          client_id: clientData.id,
          integration_type: 'dialpad',
          settings: {
            channel_id: dialpadData.channel.id,
            call_center_id: dialpadData.callCenter.id,
            hangup_endpoint_id: dialpadData.hangupEndpoint.id,
            disposition_endpoint_id: dialpadData.dispositionEndpoint.id,
            connected_endpoint_id: dialpadData.connectedEndpoint.id,
            hangup_subscription_id: dialpadData.hangupSubscription.id,
            disposition_subscription_id: dialpadData.dispositionSubscription.id,
            connected_subscription_id: dialpadData.connectedSubscription.id,
          },
        });
        
      if (settingsError) throw settingsError;
      
      // Create agency for the client (admin only)
      if (user?.role === 'admin') {
        const { error: agencyError } = await supabase
          .from('agencies')
          .insert({
            name: `${name} Agency`,
            client_id: clientData.id,
          });
          
        if (agencyError) throw agencyError;
      }
      
      // Create inbound webhook
      updateStep("createWebhook", "loading");
      const webhookUrl = generateWebhookUrl();
      const webhookId = webhookUrl.split('/').pop();
      
      const { error: webhookError } = await supabase
        .from('webhooks')
        .insert({
          client_id: clientData.id,
          type: 'lead',
          url: webhookUrl,
          secret: webhookId || '',
          active: true,
        });
        
      if (webhookError) throw webhookError;
      
      updateStep("createWebhook", "completed");
      updateStep("saveClientToDatabase", "completed");
      return { clientId: clientData.id, webhookUrl };
    } catch (error: any) {
      console.error("Error saving client to database:", error);
      updateStep("saveClientToDatabase", "error", `Database error: ${error.message}`);
      if (steps.createWebhook.status === "loading") {
        updateStep("createWebhook", "error", `Webhook error: ${error.message}`);
      }
      throw error;
    }
  };

  const onSubmit = async (data: ClientFormValues) => {
    setLoading(true);
    setApiTokenMissing(false);
    
    try {
      // Check if Dialpad API token exists
      const apiToken = localStorage.getItem("dialpadApiToken");
      if (!apiToken) {
        setApiTokenMissing(true);
        setLoading(false);
        return;
      }
      
      // Step 1: Create all Dialpad resources
      updateStep("createChannel", "loading");
      
      try {
        // Create full Dialpad integration with real API calls
        const dialpadResult = await createDialpadClient(data.name);
        console.log("Dialpad integration completed:", dialpadResult);
        
        // Update steps status based on results
        updateStep("createChannel", "completed");
        updateStep("createCallCenter", "completed");
        updateStep("createHangupEndpoint", "completed");
        updateStep("createDispositionEndpoint", "completed");
        updateStep("createConnectedEndpoint", "completed");
        updateStep("setupHangupSubscription", "completed");
        updateStep("setupDispositionSubscription", "completed");
        updateStep("setupConnectedSubscription", "completed");
        
        // Save client information to database and create webhook
        const { clientId, webhookUrl } = await saveClientToDatabase(data.name, dialpadResult);
        
        toast.success(`Client ${data.name} has been created with all integrations.`);
        form.reset();
        
        if (onSuccess) {
          onSuccess(data.name, clientId, webhookUrl);
        }
      } catch (error: any) {
        console.error("Error during Dialpad integration:", error);
        // Mark any pending steps as error
        Object.keys(steps).forEach(step => {
          if (steps[step].status === "loading" || steps[step].status === "pending") {
            updateStep(step, "error", error.message);
          }
        });
        toast.error(`There was an error setting up the Dialpad integration: ${error.message}`);
      }
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(`There was an error creating the client: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateStep = (step: string, status: StepStatus["status"], message?: string) => {
    setSteps(prev => ({
      ...prev,
      [step]: { 
        status, 
        message: message || prev[step].message 
      }
    }));
  };

  const getStepIcon = (status: StepStatus["status"]) => {
    if (status === "loading") return <Loader2 className="h-4 w-4 animate-spin" />;
    if (status === "completed") return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === "error") return <XCircle className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Information</CardTitle>
        <CardDescription>
          Create a new client and set up their Dialpad integration automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {apiTokenMissing && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Dialpad API Token Missing</AlertTitle>
            <AlertDescription className="text-amber-700">
              You need to set up your Dialpad API token before adding clients.
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate("/settings")}
                  className="text-amber-800 border-amber-300 hover:bg-amber-100 flex items-center gap-2"
                >
                  <Phone size={16} />
                  <span>Go to Settings</span>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client name" {...field} disabled={loading} />
                  </FormControl>
                  <FormDescription>
                    This will be used to identify the client in the system and in Dialpad.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Integration Steps</h3>
              <ul className="space-y-2 border rounded-md p-4 bg-gray-50">
                {Object.entries(steps).map(([key, { status, message }]) => (
                  <li key={key} className="flex items-center gap-2 py-2 border-b last:border-b-0">
                    <div className="w-6">{getStepIcon(status)}</div>
                    <span className="flex-1">{message}</span>
                    <span className="text-xs text-gray-500 capitalize">{status}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up client...
                </>
              ) : (
                "Create Client"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
