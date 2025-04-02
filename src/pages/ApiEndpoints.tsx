
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code } from "@/components/ui/code";

const ApiEndpoints = () => {
  const [host, setHost] = useState<string>("");

  useEffect(() => {
    setHost(window.location.origin);
  }, []);

  const leadEndpoint = `${host}/api/leads`;
  const callEndpoint = `${host}/api/calls`;

  const leadSamplePayload = {
    agencyId: "agency_123",
    contactId: "contact_456",
    location: "New York",
    contactNumber: "+12125551234",
    timeOfNotification: new Date().toISOString(),
  };

  const callSamplePayload = {
    leadId: "lead_123",
    contactNumber: "+12125551234",
    direction: "outbound",
    duration: 240,
    publicShareLink: "https://calls.example.com/recording/123",
    disposition: "Appointment Scheduled",
    notes: "Customer was interested in our premium package",
    timestamp: new Date().toISOString(),
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">API Documentation</h1>
      <p className="text-gray-700 mb-6">
        Use these endpoints to integrate CallTrax with your existing systems for leads and call management.
      </p>

      <Tabs defaultValue="leads">
        <TabsList className="mb-4">
          <TabsTrigger value="leads">Leads API</TabsTrigger>
          <TabsTrigger value="calls">Calls API</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle>Leads API</CardTitle>
              <CardDescription>
                Endpoint for adding new leads to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Endpoint:</h3>
                <div className="bg-gray-100 p-3 rounded">
                  <code>POST {leadEndpoint}</code>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Authentication:</h3>
                <p>Required API Key in header:</p>
                <div className="bg-gray-100 p-3 rounded">
                  <code>X-API-Key: your_api_key</code>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Sample Payload:</h3>
                <pre className="bg-gray-100 p-3 rounded overflow-auto">
                  <code>{JSON.stringify(leadSamplePayload, null, 2)}</code>
                </pre>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Response:</h3>
                <pre className="bg-gray-100 p-3 rounded overflow-auto">
                  <code>{JSON.stringify({ success: true, leadId: "lead_789" }, null, 2)}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle>Calls API</CardTitle>
              <CardDescription>
                Endpoint for adding new call records to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Endpoint:</h3>
                <div className="bg-gray-100 p-3 rounded">
                  <code>POST {callEndpoint}</code>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Authentication:</h3>
                <p>Required API Key in header:</p>
                <div className="bg-gray-100 p-3 rounded">
                  <code>X-API-Key: your_api_key</code>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Sample Payload:</h3>
                <pre className="bg-gray-100 p-3 rounded overflow-auto">
                  <code>{JSON.stringify(callSamplePayload, null, 2)}</code>
                </pre>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Response:</h3>
                <pre className="bg-gray-100 p-3 rounded overflow-auto">
                  <code>{JSON.stringify({ success: true, callId: "call_789" }, null, 2)}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiEndpoints;
