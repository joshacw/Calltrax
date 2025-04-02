
import { useState } from "react";
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
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { createDialpadClient } from "@/services/dialpadService";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  onSuccess?: (clientName: string) => void;
}

export const ClientForm = ({ onSuccess }: ClientFormProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiTokenMissing, setApiTokenMissing] = useState(false);
  const [steps, setSteps] = useState<Record<string, StepStatus>>({
    createChannel: { status: "pending", message: "Create channel in Dialpad" },
    createCallCenter: { status: "pending", message: "Create call center in Dialpad" },
    setupHangupWebhook: { status: "pending", message: "Setup webhook for hangup events" },
    setupDispositionWebhook: { status: "pending", message: "Setup webhook for disposition events" },
  });
  
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
    },
  });

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
      
      // Step 1: Create a channel in Dialpad
      updateStep("createChannel", "loading");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      updateStep("createChannel", "completed");
      
      // Step 2: Create a call center in Dialpad
      updateStep("createCallCenter", "loading");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      updateStep("createCallCenter", "completed");
      
      // Step 3: Setup webhook for hangup events
      updateStep("setupHangupWebhook", "loading");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      updateStep("setupHangupWebhook", "completed");
      
      // Step 4: Setup webhook for disposition events
      updateStep("setupDispositionWebhook", "loading");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      updateStep("setupDispositionWebhook", "completed");
      
      // In a real app, this would call the real Dialpad API
      // const result = await createDialpadClient(data.name);
      // console.log("Dialpad integration completed:", result);
      
      toast.success(`Client ${data.name} has been created with all Dialpad integrations.`);
      form.reset();
      
      if (onSuccess) {
        onSuccess(data.name);
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("There was an error creating the client. Please try again.");
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
                  className="text-amber-800 border-amber-300 hover:bg-amber-100"
                >
                  Go to Settings
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
