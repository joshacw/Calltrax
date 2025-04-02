
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save } from "lucide-react";

const SettingsPage = () => {
  const [dialpadApiToken, setDialpadApiToken] = useState(() => {
    return localStorage.getItem("dialpadApiToken") || "";
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveDialpadToken = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem("dialpadApiToken", dialpadApiToken);
      setIsSaving(false);
      toast.success("Dialpad API token saved successfully");
    }, 1000);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
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
