
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getClientById, updateClient } from "@/services/mockData";
import { Link, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

const GohighlevelIntegration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("");
  const [locationId, setLocationId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.clientId) return;
    
    const client = getClientById(user.clientId);
    if (client) {
      setApiKey(client.gohighlevelApiKey || "");
      setLocationId(client.gohighlevelLocationId || "");
      setIsConnected(client.gohighlevelIntegrated || false);
    }
  }, [user]);

  const handleSaveIntegration = async () => {
    if (!user?.clientId) return;
    
    if (!apiKey.trim()) {
      toast.error("API Key is required");
      return;
    }
    
    if (!locationId.trim()) {
      toast.error("Location ID is required");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Simulate API verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update client with integration details
      updateClient(user.clientId, {
        gohighlevelApiKey: apiKey,
        gohighlevelLocationId: locationId,
        gohighlevelIntegrated: true
      });
      
      setIsConnected(true);
      toast.success("GoHighLevel integration configured successfully");
    } catch (error) {
      console.error("Error saving GoHighLevel integration:", error);
      toast.error("Failed to save integration settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">GoHighLevel Integration</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connect to GoHighLevel</CardTitle>
            <CardDescription>
              Link your GoHighLevel account to automatically sync leads and calls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected && (
              <Alert className="bg-green-50 text-green-800 border-green-200 mb-4">
                <Link className="h-4 w-4 text-green-800" />
                <AlertTitle>Connected to GoHighLevel</AlertTitle>
                <AlertDescription>
                  Your account is successfully connected to GoHighLevel. Leads and calls will sync automatically.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="ghl-api-key">GoHighLevel API Key</Label>
              <Input 
                id="ghl-api-key"
                type="password" 
                placeholder="Enter your GoHighLevel API key" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You can find your API key in the GoHighLevel Developer Settings.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ghl-location">Location ID</Label>
              <Input 
                id="ghl-location"
                placeholder="Enter your location ID" 
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The location ID can be found in your GoHighLevel account settings.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveIntegration} 
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? "Connecting..." : (
                  <>
                    <Save size={16} />
                    <span>Save Integration</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-sm text-muted-foreground">
          <p className="mb-2 font-medium">What data will be synced:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Lead information and contact details</li>
            <li>Call records and recordings</li>
            <li>Appointment bookings</li>
            <li>Conversation details and outcomes</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default GohighlevelIntegration;
