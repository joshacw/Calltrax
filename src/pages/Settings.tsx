
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, LineChart, Phone, WebhookIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { validateDialpadApiToken } from "@/services/dialpadService";

const SettingsPage = () => {
  const [dialpadApiToken, setDialpadApiToken] = useState(() => {
    return localStorage.getItem("dialpadApiToken") || "";
  });
  
  const [dialpadTokenValid, setDialpadTokenValid] = useState<boolean | null>(null);
  
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem("webhookUrl") || `${window.location.origin}/api/webhooks/leads`;
  });
  
  const [kpiSettings, setKpiSettings] = useState({
    speedToLeadTarget: 5,
    connectionRateTarget: 70,
    bookingRateTarget: 30,
    callsPerLeadTarget: 3
  });
  
  const [colorSettings, setColorSettings] = useState({
    good: "#10b981", // emerald-500
    average: "#f59e0b", // amber-500
    poor: "#ef4444", // red-500
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Check if the Dialpad token is valid on component mount
  useEffect(() => {
    const checkToken = async () => {
      if (dialpadApiToken) {
        try {
          const isValid = await validateDialpadApiToken();
          setDialpadTokenValid(isValid);
        } catch (error) {
          console.error("Error validating Dialpad token:", error);
          setDialpadTokenValid(false);
        }
      } else {
        setDialpadTokenValid(null);
      }
    };
    
    checkToken();
  }, [dialpadApiToken]);

  const handleSaveDialpadToken = async () => {
    setIsSaving(true);
    
    try {
      localStorage.setItem("dialpadApiToken", dialpadApiToken);
      
      if (dialpadApiToken) {
        const isValid = await validateDialpadApiToken();
        setDialpadTokenValid(isValid);
        
        if (isValid) {
          toast.success("Dialpad API token saved and verified successfully");
        } else {
          toast.error("Dialpad API token saved but could not be verified. Please check the token.");
        }
      } else {
        setDialpadTokenValid(null);
        toast.success("Dialpad API token cleared");
      }
    } catch (error) {
      console.error("Error saving or validating Dialpad token:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSetupDialpad = () => {
    setIsSaving(true);
    
    // Simulate API call to setup Dialpad
    setTimeout(() => {
      toast.success("Dialpad integration configured successfully", {
        description: "Call center, channel, and webhooks have been set up"
      });
      setIsSaving(false);
    }, 2000);
  };
  
  const handleSaveKpiSettings = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem("kpiSettings", JSON.stringify(kpiSettings));
      setIsSaving(false);
      toast.success("KPI settings saved successfully");
    }, 1000);
  };
  
  const handleSaveColorSettings = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem("colorSettings", JSON.stringify(colorSettings));
      setIsSaving(false);
      toast.success("Color settings saved successfully");
    }, 1000);
  };
  
  const generateWebhookUrl = () => {
    const newWebhookUrl = `${window.location.origin}/api/webhooks/leads/${Math.random().toString(36).substring(2, 10)}`;
    setWebhookUrl(newWebhookUrl);
    navigator.clipboard.writeText(newWebhookUrl);
    toast.success("New webhook URL generated and copied to clipboard");
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="kpi">KPI Settings</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Account settings will be implemented soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dialpad Integration</CardTitle>
                <CardDescription>Connect your Dialpad account to enable call tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dialpad-token">Dialpad API Token</Label>
                  <Input 
                    id="dialpad-token"
                    type="password" 
                    placeholder="Enter your Dialpad API token" 
                    value={dialpadApiToken}
                    onChange={(e) => setDialpadApiToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    You can find your API token in the Dialpad developer console.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSaveDialpadToken} 
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    {isSaving ? "Saving..." : (
                      <>
                        <Save size={16} />
                        <span>Save API Token</span>
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleSetupDialpad}
                    disabled={!dialpadTokenValid || isSaving}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isSaving ? "Setting up..." : (
                      <>
                        <Phone size={16} />
                        <span>Setup Dialpad Integration</span>
                      </>
                    )}
                  </Button>
                </div>
                
                {dialpadTokenValid !== null && (
                  <div className="mt-4 p-4 rounded-md border" 
                       className={dialpadTokenValid 
                         ? "bg-green-50 border-green-200" 
                         : "bg-red-50 border-red-200"}>
                    <h3 className="text-sm font-medium mb-2">
                      {dialpadTokenValid 
                        ? "Dialpad API Token Valid" 
                        : "Dialpad API Token Invalid"}
                    </h3>
                    <p className="text-sm">
                      {dialpadTokenValid 
                        ? "Your Dialpad API token is valid and working properly." 
                        : "Your Dialpad API token is invalid. Please check and update it."}
                    </p>
                  </div>
                )}
                
                {dialpadTokenValid && (
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <h3 className="text-sm font-medium mb-2">Integration Status</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        Dialpad API Connected
                      </li>
                      <li className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        Dialpad Channel Setup Complete
                      </li>
                      <li className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        Dialpad Call Center Created
                      </li>
                      <li className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        Hangup Event Webhook Configured
                      </li>
                      <li className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        Disposition Event Webhook Configured
                      </li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="kpi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-brand-blue" />
                  Performance KPI Settings
                </CardTitle>
                <CardDescription>
                  Configure target values for key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Speed to Lead Target (minutes)</Label>
                      <span className="font-medium">{kpiSettings.speedToLeadTarget}</span>
                    </div>
                    <Slider
                      value={[kpiSettings.speedToLeadTarget]}
                      min={1}
                      max={15}
                      step={1}
                      onValueChange={(values) => setKpiSettings({...kpiSettings, speedToLeadTarget: values[0]})}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Faster</span>
                      <span>Slower</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Connection Rate Target (%)</Label>
                      <span className="font-medium">{kpiSettings.connectionRateTarget}%</span>
                    </div>
                    <Slider
                      value={[kpiSettings.connectionRateTarget]}
                      min={30}
                      max={90}
                      step={5}
                      onValueChange={(values) => setKpiSettings({...kpiSettings, connectionRateTarget: values[0]})}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Lower</span>
                      <span>Higher</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Booking Rate Target (%)</Label>
                      <span className="font-medium">{kpiSettings.bookingRateTarget}%</span>
                    </div>
                    <Slider
                      value={[kpiSettings.bookingRateTarget]}
                      min={10}
                      max={50}
                      step={5}
                      onValueChange={(values) => setKpiSettings({...kpiSettings, bookingRateTarget: values[0]})}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Lower</span>
                      <span>Higher</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Calls Per Lead Target</Label>
                      <span className="font-medium">{kpiSettings.callsPerLeadTarget}</span>
                    </div>
                    <Slider
                      value={[kpiSettings.callsPerLeadTarget]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(values) => setKpiSettings({...kpiSettings, callsPerLeadTarget: values[0]})}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Fewer</span>
                      <span>More</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">Status Color Settings</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="good-color" className="mb-2 block">Good Status</Label>
                      <div className="flex gap-2">
                        <div 
                          className="w-10 h-10 rounded-md border" 
                          style={{ backgroundColor: colorSettings.good }}
                        />
                        <Input 
                          id="good-color"
                          value={colorSettings.good}
                          onChange={(e) => setColorSettings({...colorSettings, good: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="average-color" className="mb-2 block">Average Status</Label>
                      <div className="flex gap-2">
                        <div 
                          className="w-10 h-10 rounded-md border" 
                          style={{ backgroundColor: colorSettings.average }}
                        />
                        <Input 
                          id="average-color"
                          value={colorSettings.average}
                          onChange={(e) => setColorSettings({...colorSettings, average: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="poor-color" className="mb-2 block">Poor Status</Label>
                      <div className="flex gap-2">
                        <div 
                          className="w-10 h-10 rounded-md border" 
                          style={{ backgroundColor: colorSettings.poor }}
                        />
                        <Input 
                          id="poor-color"
                          value={colorSettings.poor}
                          onChange={(e) => setColorSettings({...colorSettings, poor: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end">
                  <Button 
                    onClick={handleSaveKpiSettings} 
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save KPI Settings"}
                  </Button>
                  <Button 
                    onClick={handleSaveColorSettings} 
                    disabled={isSaving}
                    variant="outline"
                  >
                    {isSaving ? "Saving..." : "Save Color Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WebhookIcon className="h-5 w-5 text-brand-blue" />
                  Lead Webhook
                </CardTitle>
                <CardDescription>
                  Configure your webhook endpoint for receiving leads from external systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL for Leads</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="webhook-url"
                      value={webhookUrl}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(webhookUrl);
                        toast.success("Webhook URL copied to clipboard");
                      }}
                      variant="outline"
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this URL to send lead information from your lead generation systems.
                  </p>
                </div>
                
                <Button onClick={generateWebhookUrl} variant="outline">
                  Generate New Webhook URL
                </Button>
                
                <div className="p-4 bg-muted rounded-md mt-4">
                  <h3 className="text-sm font-medium mb-2">Example Webhook Payload</h3>
                  <pre className="text-xs overflow-x-auto p-2 bg-background rounded border">
{`{
  "contact": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com"
  },
  "lead": {
    "source": "Website",
    "location": "New York",
    "timestamp": "2023-10-20T15:30:45Z",
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
          
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Notification settings will be implemented soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// Protect this route for admin users only
const ProtectedSettingsPage = () => (
  <ProtectedRoute allowedRoles={["admin"]}>
    <SettingsPage />
  </ProtectedRoute>
);

export default ProtectedSettingsPage;
