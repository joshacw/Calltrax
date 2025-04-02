
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ClientForm } from "@/components/ClientForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Copy, Link as LinkIcon, Webhook, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LeadWebhookPayload } from "@/services/webhookService";

const notificationSchema = z.object({
  enabled: z.boolean().default(true),
  includeContact: z.boolean().default(true),
  includeLocation: z.boolean().default(true),
  includeTimestamp: z.boolean().default(true),
  customMessage: z.string().optional(),
  notificationTitle: z.string().min(1, "Notification title is required"),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

const AddClientPage = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [testPayload, setTestPayload] = useState<string>(JSON.stringify({
    contact: {
      name: "John Doe",
      phone: "+12025550123",
      email: "john.doe@example.com"
    },
    lead: {
      source: "Website",
      location: "Main Location",
      timestamp: new Date().toISOString(),
      notes: "Interested in your services"
    },
    agency: {
      id: "00000000-0000-0000-0000-000000000000"
    }
  }, null, 2));
  const [payloadPreview, setPayloadPreview] = useState<LeadWebhookPayload | null>(null);
  
  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      enabled: true,
      includeContact: true,
      includeLocation: true,
      includeTimestamp: true,
      customMessage: "New lead received!",
      notificationTitle: "New Lead Notification",
    },
  });

  const handleSuccess = (name: string, id: string, webhookUrl: string) => {
    setClientName(name);
    setClientId(id);
    setWebhookUrl(webhookUrl);
    setSuccess(true);
  };
  
  const copyToClipboard = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      toast.success("Webhook URL copied to clipboard");
    }
  };
  
  const handleTestPayload = () => {
    try {
      const payload = JSON.parse(testPayload);
      setPayloadPreview(payload);
      toast.success("Test payload is valid JSON");
    } catch (error) {
      toast.error("Invalid JSON payload");
    }
  };
  
  const saveNotificationSettings = async (data: NotificationFormValues) => {
    if (!clientId) {
      toast.error("Client ID is missing");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('integration_settings')
        .update({
          settings: {
            notification: {
              enabled: data.enabled,
              includeContact: data.includeContact,
              includeLocation: data.includeLocation,
              includeTimestamp: data.includeTimestamp,
              customMessage: data.customMessage,
              notificationTitle: data.notificationTitle,
            }
          }
        })
        .eq('client_id', clientId)
        .eq('integration_type', 'dialpad');
        
      if (error) throw error;
      
      toast.success("Notification settings saved successfully");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Failed to save notification settings");
    }
  };
  
  const renderPayloadPreview = () => {
    if (!payloadPreview) return null;
    
    return (
      <div className="mt-4 rounded-md bg-gray-50 p-4 border">
        <h3 className="text-sm font-medium mb-2">Notification Preview</h3>
        <div className="bg-white p-3 rounded-md border">
          <div className="font-medium">{form.watch('notificationTitle')}</div>
          <div className="text-sm mt-1">
            {form.watch('customMessage')}
            {form.watch('includeContact') && payloadPreview.contact && (
              <div className="mt-1">
                Contact: {payloadPreview.contact.name || "Unknown"} 
                {payloadPreview.contact.phone && ` (${payloadPreview.contact.phone})`}
              </div>
            )}
            {form.watch('includeLocation') && payloadPreview.lead && payloadPreview.lead.location && (
              <div>Location: {payloadPreview.lead.location}</div>
            )}
            {form.watch('includeTimestamp') && payloadPreview.lead && payloadPreview.lead.timestamp && (
              <div>Time: {new Date(payloadPreview.lead.timestamp).toLocaleString()}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </Button>
          <h1 className="text-3xl font-bold">Add New Client</h1>
        </div>
        
        {success ? (
          <div className="space-y-6">
            <Alert className="bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                Client "{clientName}" has been created successfully with all Dialpad integrations.
              </AlertDescription>
            </Alert>
            
            <Tabs defaultValue="webhook" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="webhook">
                  <div className="flex items-center gap-2">
                    <Webhook size={16} />
                    <span>Inbound Webhook</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <div className="flex items-center gap-2">
                    <BellRing size={16} />
                    <span>Notifications</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="webhook" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Webhook Integration</CardTitle>
                    <CardDescription>
                      Use this unique webhook URL to send lead data to the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url" className="font-medium">
                        Inbound Webhook URL
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-grow">
                          <Input 
                            id="webhook-url" 
                            value={webhookUrl || ""} 
                            readOnly 
                            className="pr-10 bg-white"
                          />
                          <LinkIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                        <Button onClick={copyToClipboard} className="flex items-center gap-2">
                          <Copy size={16} />
                          <span>Copy</span>
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Send POST requests to this URL with lead data in the format shown below.
                      </p>
                    </div>
                    
                    <div className="space-y-2 mt-6">
                      <Label htmlFor="test-payload" className="font-medium">
                        Example Payload
                      </Label>
                      <Textarea 
                        id="test-payload" 
                        value={testPayload} 
                        onChange={(e) => setTestPayload(e.target.value)}
                        className="font-mono text-sm h-64"
                      />
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleTestPayload}
                        >
                          Preview Notification
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>
                      Configure how Dialpad notifications will appear when a lead comes in
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(saveNotificationSettings)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Enable Notifications
                                </FormLabel>
                                <FormDescription>
                                  Send notifications to Dialpad when a lead comes in
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="notificationTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notification Title</FormLabel>
                              <FormControl>
                                <Input placeholder="New Lead Notification" {...field} />
                              </FormControl>
                              <FormDescription>
                                This will appear as the title of the notification in Dialpad
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="customMessage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Custom Message</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="New lead received!" 
                                  className="resize-none"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                This message will be included in the notification
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Include in Notification</h3>
                          
                          <FormField
                            control={form.control}
                            name="includeContact"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel>
                                  Include contact information
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="includeLocation"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel>
                                  Include location information
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="includeTimestamp"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel>
                                  Include timestamp
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {renderPayloadPreview()}
                        
                        <Button type="submit" className="w-full">
                          Save Notification Settings
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="flex gap-4 mt-8">
              <Button onClick={() => setSuccess(false)}>Add Another Client</Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <ClientForm onSuccess={handleSuccess} />
        )}
      </div>
    </Layout>
  );
};

// Protect this route for admin users only
const ProtectedAddClientPage = () => (
  <ProtectedRoute allowedRoles={["admin"]}>
    <AddClientPage />
  </ProtectedRoute>
);

export default ProtectedAddClientPage;
