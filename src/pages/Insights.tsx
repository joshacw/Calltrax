
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getAgenciesByClientId, 
  getClientById, 
  getDashboardMetrics 
} from "@/services/mockData";
import { CalendarRange, TrendingDown, TrendingUp, AlertTriangle, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface InsightItem {
  type: "warning" | "success" | "info";
  title: string;
  description: string;
  source?: string;
  metric?: string;
  change?: number;
}

const Insights = () => {
  const { user } = useAuth();
  const [clientInsights, setClientInsights] = useState<{
    clientName: string;
    insights: InsightItem[];
  }[]>([]);

  useEffect(() => {
    // Fetch insights based on user role
    if (user?.role === "admin") {
      // For admin, get insights for all clients
      const allClients = [
        { id: "1", name: "ABC Company" },
        { id: "2", name: "XYZ Corp" }
      ];
      
      const allInsights = allClients.map(client => {
        const clientAgencies = getAgenciesByClientId(client.id);
        const insights = generateInsightsForClient(client.id, clientAgencies);
        
        return {
          clientName: client.name,
          insights
        };
      });
      
      setClientInsights(allInsights);
    } else if (user?.role === "client" && user.clientId) {
      // For client, get insights only for their account
      const client = getClientById(user.clientId);
      if (client) {
        const clientAgencies = getAgenciesByClientId(client.id);
        const insights = generateInsightsForClient(client.id, clientAgencies);
        
        setClientInsights([{
          clientName: client.name,
          insights
        }]);
      }
    }
  }, [user]);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Performance Insights</h1>
        <p className="text-muted-foreground">
          AI-powered analysis of call center performance metrics across accounts and locations.
        </p>
        
        {clientInsights.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              No insights available for your account at this time.
            </div>
          </Card>
        ) : (
          clientInsights.map((clientData, index) => (
            <ClientInsightSection 
              key={index} 
              clientName={clientData.clientName} 
              insights={clientData.insights} 
            />
          ))
        )}
      </div>
    </Layout>
  );
};

const ClientInsightSection = ({ 
  clientName, 
  insights 
}: { 
  clientName: string, 
  insights: InsightItem[] 
}) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <CardTitle>{clientName}</CardTitle>
        <CardDescription>
          Performance insights for all locations and agencies
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <InsightItem key={index} insight={insight} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const InsightItem = ({ insight }: { insight: InsightItem }) => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
      {insight.type === "warning" && (
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
      )}
      {insight.type === "success" && (
        <TrendingUp className="h-5 w-5 text-emerald-500 mt-0.5" />
      )}
      {insight.type === "info" && (
        <TrendingDown className="h-5 w-5 text-blue-500 mt-0.5" />
      )}
      <div className="flex-1">
        <div className="font-medium mb-1 flex items-center gap-2">
          {insight.title}
          <Badge variant={
            insight.type === "warning" ? "destructive" : 
            insight.type === "success" ? "default" : "secondary"
          }>
            {insight.type === "warning" ? "Needs Attention" : 
             insight.type === "success" ? "Outstanding" : "Improving"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{insight.description}</p>
        {(insight.source || insight.metric) && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
            {insight.source && (
              <span className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {insight.source}
              </span>
            )}
            {insight.metric && (
              <span className="flex items-center">
                <Award className="h-3 w-3 mr-1" />
                {insight.metric}
              </span>
            )}
            {insight.change !== undefined && (
              <span className={`flex items-center ${insight.change > 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {insight.change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {insight.change > 0 ? '+' : ''}{insight.change.toFixed(1)}%
              </span>
            )}
            <span className="flex items-center">
              <CalendarRange className="h-3 w-3 mr-1" />
              Last 7 days
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for the source icon
const MapPin = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// Function to generate insights for a client
const generateInsightsForClient = (clientId: string, agencies: any[]): InsightItem[] => {
  const insights: InsightItem[] = [];
  
  // Get metrics for comparison
  const currentMetrics = getDashboardMetrics();
  const previousMetrics = getDashboardMetrics([], [], {
    start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  
  // Add insights for each agency
  agencies.forEach(agency => {
    // Connection rate insight based on location
    agency.locations.forEach((location: string) => {
      // Simulate varying connection rates for different locations
      const connectionRate = Math.round(Math.random() * 30 + 40); // 40-70%
      const prevConnectionRate = connectionRate + (Math.random() > 0.5 ? -1 : 1) * Math.round(Math.random() * 15); // +/- 15%
      const connectionRateDiff = connectionRate - prevConnectionRate;
      
      if (Math.abs(connectionRateDiff) > 5) {
        insights.push({
          type: connectionRateDiff > 0 ? "success" : "warning",
          title: `${location} Connection Rate ${connectionRateDiff > 0 ? "Improving" : "Declining"}`,
          description: `Connection rate ${connectionRateDiff > 0 ? "increased" : "decreased"} by ${Math.abs(connectionRateDiff).toFixed(1)}% compared to previous period.`,
          source: location,
          metric: "Connection Rate",
          change: connectionRateDiff
        });
      }
      
      // Booking rate insight
      const bookingRate = Math.round(Math.random() * 20 + 20); // 20-40%
      const prevBookingRate = bookingRate + (Math.random() > 0.6 ? -1 : 1) * Math.round(Math.random() * 10); // +/- 10%
      const bookingRateDiff = bookingRate - prevBookingRate;
      
      if (Math.abs(bookingRateDiff) > 3) {
        insights.push({
          type: bookingRateDiff > 0 ? "success" : "warning",
          title: `${location} Booking Rate ${bookingRateDiff > 0 ? "Improving" : "Declining"}`,
          description: `Booking rate ${bookingRateDiff > 0 ? "increased" : "decreased"} by ${Math.abs(bookingRateDiff).toFixed(1)}% compared to previous period.`,
          source: location,
          metric: "Booking Rate",
          change: bookingRateDiff
        });
      }
    });
    
    // Agency-level insights
    const agencyPerformance = Math.random();
    if (agencyPerformance > 0.7) {
      insights.push({
        type: "success",
        title: `${agency.name} Exceeding Targets`,
        description: `Overall performance is exceeding targets. Connection rate is 12% above average and booking rate is 8% above target.`,
        source: agency.name
      });
    } else if (agencyPerformance < 0.3) {
      insights.push({
        type: "warning",
        title: `${agency.name} Performance Issues`,
        description: `Overall performance is below target. Consider reviewing team training and call scripts.`,
        source: agency.name
      });
    }
    
    // Speed to lead insights
    const randomLocation = agency.locations[Math.floor(Math.random() * agency.locations.length)];
    const speedToLeadImprovement = Math.random() > 0.5;
    
    insights.push({
      type: speedToLeadImprovement ? "success" : "warning",
      title: `${randomLocation} Speed to Lead ${speedToLeadImprovement ? "Improving" : "Declining"}`,
      description: `Average speed to lead ${speedToLeadImprovement ? "decreased" : "increased"} by ${(Math.random() * 2 + 1).toFixed(1)} minutes compared to previous week.`,
      source: randomLocation,
      metric: "Speed to Lead",
      change: speedToLeadImprovement ? (Math.random() * 15 + 5) : -(Math.random() * 15 + 5)
    });
  });
  
  // Client-level insights
  insights.push({
    type: "info",
    title: `${clientId === "1" ? "ABC Company" : "XYZ Corp"} Weekly Summary`,
    description: `Overall call volume increased by ${Math.floor(Math.random() * 20 + 5)}% this week with ${Math.floor(Math.random() * 10 + 40)}% connection rate.`,
  });
  
  return insights;
};

export default Insights;
