
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center max-w-3xl px-4">
        <h1 className="text-5xl font-bold mb-6">CallTrax Dashboard</h1>
        <p className="text-xl text-gray-600 mb-8">
          Track call center performance, analyze leads, and measure agent productivity
          with our comprehensive dashboard solution.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate("/login")}>
            Log in
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            View Demo
          </Button>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Real-time Metrics</h3>
            <p className="text-gray-600">Monitor key performance indicators in real-time to optimize call center operations.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Lead Tracking</h3>
            <p className="text-gray-600">Track leads from initial contact through conversion with detailed analytics.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Call Analytics</h3>
            <p className="text-gray-600">Analyze call dispositions, durations, and outcomes to improve agent performance.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
