
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-brand-blue/5">
      <div className="text-center max-w-3xl px-4">
        <div className="flex justify-center mb-8">
          <img
            src="/lovable-uploads/253971c8-5094-4170-b201-fd5350d6d5e1.png"
            alt="Lead Activators"
            className="h-20"
          />
        </div>
        <h1 className="text-5xl font-bold mb-6 text-brand-blue">Lead Activators Dashboard</h1>
        <p className="text-xl text-gray-600 mb-8 font-inter">
          Track call center performance, analyze leads, and measure agent productivity
          with our comprehensive dashboard solution.
        </p>
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={() => navigate("/login")}
            className="bg-brand-blue hover:bg-brand-blue/90 text-white"
          >
            Log in
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
          >
            View Demo
          </Button>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-brand-green mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-xl">1</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-brand-blue">Real-time Metrics</h3>
            <p className="text-gray-600">Monitor key performance indicators in real-time to optimize call center operations.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-brand-yellow mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-xl">2</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-brand-blue">Lead Tracking</h3>
            <p className="text-gray-600">Track leads from initial contact through conversion with detailed analytics.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-brand-orange mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-xl">3</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-brand-blue">Call Analytics</h3>
            <p className="text-gray-600">Analyze call dispositions, durations, and outcomes to improve agent performance.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
