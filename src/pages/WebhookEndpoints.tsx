
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, RefreshCw } from "lucide-react";

const WebhookEndpoints = () => {
  const [host, setHost] = useState<string>("");
  const [webhookKey, setWebhookKey] = useState<string>(() => {
    return localStorage.getItem("webhookKey") || generateWebhookKey();
  });

  useEffect(() => {
    setHost(window.location.origin);
  }, []);

  const generateWebhookKey = (): string => {
    const key = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
    localStorage.setItem("webhookKey", key);
    return key;
  };

  const refreshWebhookKey = () => {
    const newKey = generateWebhookKey();
    setWebhookKey(newKey);
    toast.success("Webhook key refreshed", {
      description: "All webhook URLs have been updated with the new key",
    });
  };

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard", {
      description,
    });
  };

  const leadWebhookUrl = `${host}/api/webhooks/leads/${webhookKey}`;
  const hangupWebhookUrl = `${host}/api/webhooks/dialpad/hangup/${webhookKey}`;
  const dispositionWebhookUrl = `${host}/api/webhooks/dialpad/disposition/${webhookKey}`;
  const connectedWebhookUrl = `${host}/api/webhooks/dialpad/connected/${webhookKey}`;

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Webhook Endpoints</h1>
        <p className="text-gray-700 mb-6">
          Configure and manage webhook endpoints for integrating with external services.
        </p>

        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            onClick={refreshWebhookKey}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Webhook Key
          </Button>
        </div>

        <Tabs defaultValue="lead">
          <TabsList className="mb-4">
            <TabsTrigger value="lead">Lead Webhooks</TabsTrigger>
            <TabsTrigger value="dialpad">Dialpad Webhooks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lead">
            <Card>
              <CardHeader>
                <CardTitle>Lead Webhook</CardTitle>
                <CardDescription>
                  Endpoint for receiving new leads from external systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium mb-1">Webhook URL</div>
                  <div className="flex gap-2">
                    <Input 
                      value={leadWebhookUrl}
                      readOnly
                      className="font-mono text-sm flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(leadWebhookUrl, "Lead webhook URL copied")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this URL in your lead generation systems to send lead data to CallTrax.
                  </p>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="text-sm font-medium">Sample Payload</div>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`{
  "contact": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com"
  },
  "lead": {
    "source": "Website",
    "location": "New York",
    "timestamp": "${new Date().toISOString()}",
    "notes": "Interested in service X"
  },
  "agency": {
    "id": "agency_123"
  }
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="dialpad">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Connected Event Webhook</CardTitle>
                  <CardDescription>
                    Endpoint for receiving call connected events from Dialpad
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium mb-1">Webhook URL</div>
                    <div className="flex gap-2">
                      <Input 
                        value={connectedWebhookUrl}
                        readOnly
                        className="font-mono text-sm flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(connectedWebhookUrl, "Connected webhook URL copied")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This endpoint receives connected events and marks calls as connected immediately.
                    </p>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="text-sm font-medium">Dialpad Configuration</div>
                    <div className="bg-gray-100 p-3 rounded text-xs">
                      <p className="font-medium mb-2">Event Subscription Payload:</p>
                      <pre className="overflow-auto">
{`{
  "enabled": true,
  "call_states": [
    "connected"
  ],
  "endpoint_id": "endpoint_id_from_dialpad",
  "target_type": "callcenter",
  "target_id": "call_center_id_from_dialpad"
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hangup Event Webhook</CardTitle>
                  <CardDescription>
                    Endpoint for receiving call hangup events from Dialpad
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium mb-1">Webhook URL</div>
                    <div className="flex gap-2">
                      <Input 
                        value={hangupWebhookUrl}
                        readOnly
                        className="font-mono text-sm flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(hangupWebhookUrl, "Hangup webhook URL copied")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This endpoint receives hangup events and processes call data after a 60-second delay.
                    </p>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="text-sm font-medium">Dialpad Configuration</div>
                    <div className="bg-gray-100 p-3 rounded text-xs">
                      <p className="font-medium mb-2">Event Subscription Payload:</p>
                      <pre className="overflow-auto">
{`{
  "enabled": true,
  "call_states": [
    "hangup"
  ],
  "endpoint_id": "endpoint_id_from_dialpad",
  "target_type": "callcenter",
  "target_id": "call_center_id_from_dialpad"
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Disposition Event Webhook</CardTitle>
                  <CardDescription>
                    Endpoint for receiving call disposition events from Dialpad
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium mb-1">Webhook URL</div>
                    <div className="flex gap-2">
                      <Input 
                        value={dispositionWebhookUrl}
                        readOnly
                        className="font-mono text-sm flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(dispositionWebhookUrl, "Disposition webhook URL copied")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This endpoint receives disposition events and updates call records after a 5-minute delay.
                    </p>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="text-sm font-medium">Dialpad Configuration</div>
                    <div className="bg-gray-100 p-3 rounded text-xs">
                      <p className="font-medium mb-2">Event Subscription Payload:</p>
                      <pre className="overflow-auto">
{`{
  "enabled": true,
  "call_states": [
    "disposition"
  ],
  "endpoint_id": "endpoint_id_from_dialpad",
  "target_type": "callcenter",
  "target_id": "call_center_id_from_dialpad"
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// Protect this route for admin users only
const ProtectedWebhookEndpoints = () => (
  <ProtectedRoute allowedRoles={["admin"]}>
    <WebhookEndpoints />
  </ProtectedRoute>
);

export default ProtectedWebhookEndpoints;
