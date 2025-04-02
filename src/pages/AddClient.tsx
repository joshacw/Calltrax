
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ClientForm } from "@/components/ClientForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AddClientPage = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [clientName, setClientName] = useState("");

  const handleSuccess = (name: string) => {
    setClientName(name);
    setSuccess(true);
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
