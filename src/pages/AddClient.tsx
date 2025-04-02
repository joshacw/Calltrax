
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ClientForm } from "@/components/ClientForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Copy, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AddClientPage = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);

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
            
            <div className="bg-gray-50 border rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold">Webhook Integration</h2>
              <p className="text-gray-600">
                Use this unique webhook URL to send lead data to the platform:
              </p>
              
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
                  Send POST requests to this URL with lead data in the format described in the documentation.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
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
