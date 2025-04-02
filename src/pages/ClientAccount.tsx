
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, User as UserIcon } from "lucide-react";
import { getResendApiKey } from "@/services/emailService";

const ClientAccountPage = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
    
    // Get saved Resend API key if exists
    const savedKey = localStorage.getItem("resendApiKey") || "";
    setResendApiKey(savedKey);
  }, [user]);

  const handleSaveProfile = () => {
    if (!user) return;
    
    setIsSaving(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // In a real app, this would update the user profile on the server
      const updatedUser: User = {
        ...user,
        name,
        email,
      };
      
      // Update in local storage
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      setIsSaving(false);
      toast.success("Profile updated successfully");
    }, 1000);
  };
  
  const handleSaveResendKey = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem("resendApiKey", resendApiKey);
      setIsSaving(false);
      toast.success("Resend API key saved successfully");
    }, 1000);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Your name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? "Saving..." : (
                    <>
                      <UserIcon size={16} />
                      <span>Save Profile</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resend Integration</CardTitle>
                <CardDescription>Connect Resend to send email reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resend-token">Resend API Key</Label>
                  <Input 
                    id="resend-token"
                    type="password" 
                    placeholder="Enter your Resend API key" 
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    You can find your API key in the Resend dashboard.
                  </p>
                </div>
                
                <Button 
                  onClick={handleSaveResendKey} 
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? "Saving..." : (
                    <>
                      <Save size={16} />
                      <span>Save API Key</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="password" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Password change functionality will be implemented soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ClientAccountPage;
