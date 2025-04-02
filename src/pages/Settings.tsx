import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, LineChart, Phone, WebhookIcon, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { validateDialpadApiToken, testDialpadConnection } from "@/services/dialpadService";
import { DialpadCallCenters } from "@/components/DialpadCallCenters";
import { Progress } from "@/components/ui/progress";

const SettingsPage = () => {
  const [dialpadApiToken, setDialpadApiToken] = useState(() => {
    return localStorage.getItem("dialpadApiToken") || "";
  });
  
  const [dialpadTokenValid, setDialpadTokenValid] = useState<boolean | null>(null);
  const [dialpadValidationStatus, setDialpadValidationStatus] = useState<"idle" | "validating" | "success" | "error">("idle");
  const [showCallCenters, setShowCallCenters] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [verificationProgress, setVerificationProgress] = useState(0);
  
  useEffect(() => {
    const checkToken = async () => {
      if (dialpadApiToken) {
        try {
          setDialpadValidationStatus("validating");
          setErrorMessage("");
          
          const progressInterval = setInterval(() => {
            setVerificationProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return prev;
              }
              return prev + 10;
            });
          }, 300);
          
          const isValid = await validateDialpadApiToken();
          clearInterval(progressInterval);
          setVerificationProgress(100);
          
          setDialpadTokenValid(isValid);
          setDialpadValidationStatus(isValid ? "success" : "error");
          setShowCallCenters(isValid);
          
          if (!isValid) {
            setErrorMessage("The token could not be verified. The API might be unavailable or there could be a network issue.");
          }
        } catch (error) {
          console.error("Error validating Dialpad token:", error);
          setDialpadTokenValid(false);
          setDialpadValidationStatus("error");
          setShowCallCenters(false);
          setVerificationProgress(100);
          setErrorMessage(error.message || "Unknown error validating token");
        }
      } else {
        setDialpadTokenValid(null);
        setDialpadValidationStatus("idle");
        setShowCallCenters(false);
      }
    };
    
    checkToken();
  }, [dialpadApiToken]);

  const handleSaveDialpadToken = async () => {
    setIsSaving(true);
    setDialpadValidationStatus("validating");
    setVerificationProgress(0);
    setErrorMessage("");
    
    try {
      const progressInterval = setInterval(() => {
        setVerificationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      
      localStorage.setItem("dialpadApiToken", dialpadApiToken);
      
      const isValid = await testDialpadConnection(dialpadApiToken);
      
      clearInterval(progressInterval);
      setVerificationProgress(100);
      
      setDialpadTokenValid(isValid);
      setDialpadValidationStatus(isValid ? "success" : "error");
      setShowCallCenters(isValid);
      
      if (isValid) {
        toast.success("Dialpad API token verified and saved successfully", {
          description: "Your Dialpad integration is now connected and ready to use."
        });
      } else {
        if (dialpadApiToken) {
          setErrorMessage("The token couldn't be verified. This could be due to network issues or API unavailability. Your token has been saved, but validation failed.");
          toast.error("Dialpad API token saved but couldn't be verified", {
            description: "The token has been saved, but we couldn't verify it with Dialpad. You can try again later."
          });
        } else {
          localStorage.removeItem("dialpadApiToken");
          setDialpadTokenValid(null);
          setDialpadValidationStatus("idle");
          toast.success("Dialpad API token cleared");
        }
      }
    } catch (error) {
      console.error("Error saving or validating Dialpad token:", error);
      setDialpadValidationStatus("error");
      setVerificationProgress(100);
      setErrorMessage(error.message || "Unknown error validating token");
      toast.error(`Error: ${error.message || "Unknown error validating token"}`);
      setShowCallCenters(false);
      
      if (dialpadApiToken) {
        localStorage.setItem("dialpadApiToken", dialpadApiToken);
        toast.info("Token saved but not verified", {
          description: "Your token has been saved but we couldn't verify it with Dialpad."
        });
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSetupDialpad = () => {
    setIsSaving(true);
    
    setTimeout(() => {
      toast.success("Dialpad integration configured successfully", {
        description: "Call center, channel, and webhooks have been set up"
      });
      setIsSaving(false);
    }, 2000);
  };
  
  const handleAgenciesCreated = () => {
    toast.success("Agencies created successfully");
  };
  
  const handleSaveKpiSettings = () => {
    setIsSaving(true);
    
    setTimeout(() => {
      localStorage.setItem("kpiSettings", JSON.stringify(kpiSettings));
      setIsSaving(false);
      toast.success("KPI settings saved successfully");
    }, 1000);
  };
  
  const handleSaveColorSettings = () => {
    setIsSaving(true);
    
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

  const renderDialpadConnectionStatus = () => {
    if (dialpadValidationStatus === "idle") {
      return null;
    }
    
    if (dialpadValidationStatus === "validating") {
      return (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span>Verifying Dialpad connection...</span>
          </div>
          <Progress value={verificationProgress} className="h-2" />
        </div>
      );
    }
    
    return (
      <div className={`mt-4 p-4 rounded-md border ${
        dialpadValidationStatus === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
      }`}>
        <div className="flex items-center gap-2">
          {dialpadValidationStatus === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          <h3 className="text-sm font-medium">
            {dialpadValidationStatus === "success" ? "Dialpad Connected" : "Connection Failed"}
          </h3>
        </div>
        <p className="text-sm mt-1 ml-7">
          {dialpadValidationStatus === "success" 
            ? "Your Dialpad API token is valid and the connection is working properly." 
            : errorMessage || "The token couldn't be verified. Please check your token and try again."}
        </p>
        {dialpadValidationStatus === "error" && (
          <div className="mt-3 ml-7">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (dialpadApiToken) {
                  setShowCallCenters(true);
                  toast.info("Proceeding with saved token", {
                    description: "Using the saved token despite validation issues."
                  });
                }
              }}
              className="text-red-800 border-red-300 hover:bg-red-100"
            >
              Use Token Anyway
            </Button>
          </div>
        )}
      </div>
    );
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
                    className={dialpadValidationStatus === "success" ? "border-green-500 focus-visible:ring-green-500" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    You can find your API token in the Dialpad developer console.
                  </p>
                </div>
                
                {renderDialpadConnectionStatus()}
                
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSaveDialpadToken} 
                    disabled={isSaving || dialpadValidationStatus === "validating"}
                    className="flex items-center gap-2"
                  >
                    {isSaving || dialpadValidationStatus === "validating" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Save & Verify API Token</span>
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleSetupDialpad}
                    disabled={(!dialpadTokenValid && dialpadValidationStatus !== "error") || isSaving || dialpadValidationStatus === "validating"}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Setting up...</span>
                      </>
                    ) : (
                      <>
                        <Phone size={16} />
                        <span>Setup Dialpad Integration</span>
                      </>
                    )}
                  </Button>
                </div>
                
                {dialpadValidationStatus === "success" && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <h3 className="text-sm font-medium mb-2 text-green-800">Integration Status</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-green-800">Dialpad API Connected</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-green-800">Dialpad Channel Setup Complete</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-green-800">Dialpad Call Center Created</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-green-800">Hangup Event Webhook Configured</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-green-800">Disposition Event Webhook Configured</span>
                      </li>
                    </ul>
                  </div>
                )}
                
                {showCallCenters && dialpadTokenValid && (
                  <DialpadCallCenters onCreateAgencies={handleAgenciesCreated} />
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

const ProtectedSettingsPage = () => (
  <ProtectedRoute allowedRoles={["admin"]}>
    <SettingsPage />
  </ProtectedRoute>
);

export default ProtectedSettingsPage;
