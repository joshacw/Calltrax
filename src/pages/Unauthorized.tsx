
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">403</h1>
        <h2 className="text-2xl font-semibold mb-6">Unauthorized Access</h2>
        <p className="text-gray-600 mb-8">
          You do not have permission to access this page.
        </p>
        <Button onClick={() => navigate(user ? "/dashboard" : "/login")}>
          {user ? "Return to Dashboard" : "Go to Login"}
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;
