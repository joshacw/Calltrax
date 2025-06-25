
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
  const [insights, setInsights] = useState<InsightItem[]>([]);

  useEffect(() => {
    const allInsights: InsightItem[] = [];

    // Fetch insights based on user role
    if (user?.role === "admin") {
      // For admin, get insights for 5 clients
      const allClients = [
        { id: "1", name: "ABC Company" },
        { id: "2", name: "XYZ Corp" },
        { id: "3", name: "Tech Solutions Inc" },
        { id: "4", name: "Global Marketing" },
        { id: "5", name: "Premier Services" }
      ];
      
      allClients.forEach(client => {
        const clientAgencies = getAgenciesByClientId(client.id);
        const clientInsights = generateInsightsForClient(client.id, client.name, clientAgencies);
        allInsights.push(...clientInsights.slice(0, 1)); // Only take 1 insight per client
      });
      
    } else if (user?.role === "client" && user.clientId) {
      // For client, get insights only for their account
      const client = getClientById(user.clientId);
      if (client) {
        const clientAgencies = getAgenciesByClientId(client.id);
        const clientInsights = generateInsightsForClient(client.id, client.name, clientAgencies);
        allInsights.push(...clientInsights.slice(0, 5)); // Show up to 5 insights for client view
      }
    }

    // Limit to exactly 5 insights
    setInsights(allInsights.slice(0, 5));
  }, [user]);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Performance Insights</h1>
        <p className="text-muted-foreground">
          AI-powered analysis of call center performance metrics across accounts and agencies.
        </p>
        
        {insights.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              No insights available for your account at this time.
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>
                Key insights across all accounts and agencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, index) => (
                  <InsightItem key={index} insight={insight} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
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
                <Award className="h-3 w-3 mr-1" />
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

// Function to generate insights for a client
const generateInsightsForClient = (clientId: string, clientName: string, agencies: any[]): InsightItem[] => {
  const insights: InsightItem[] = [];
  
  // Get metrics for comparison
  const currentMetrics = getDashboardMetrics();
  const previousMetrics = getDashboardMetrics([], [], {
    start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  
  // Add insights for each agency
  agencies.forEach(agency => {
    // Connection rate insight
    const connectionRate = Math.round(Math.random() * 30 + 40); // 40-70%
    const prevConnectionRate = connectionRate + (Math.random() > 0.5 ? -1 : 1) * Math.round(Math.random() * 15); // +/- 15%
    const connectionRateDiff = connectionRate - prevConnectionRate;
    
    if (Math.abs(connectionRateDiff) > 5) {
      insights.push({
        type: connectionRateDiff > 0 ? "success" : "warning",
        title: `${agency.name} Connection Rate ${connectionRateDiff > 0 ? "Improving" : "Declining"}`,
        description: `Connection rate ${connectionRateDiff > 0 ? "increased" : "decreased"} by ${Math.abs(connectionRateDiff).toFixed(1)}% compared to previous period.`,
        source: agency.name,
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
        title: `${agency.name} Booking Rate ${bookingRateDiff > 0 ? "Improving" : "Declining"}`,
        description: `Booking rate ${bookingRateDiff > 0 ? "increased" : "decreased"} by ${Math.abs(bookingRateDiff).toFixed(1)}% compared to previous period.`,
        source: agency.name,
        metric: "Booking Rate",
        change: bookingRateDiff
      });
    }
    
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
    const speedToLeadImprovement = Math.random() > 0.5;
    
    insights.push({
      type: speedToLeadImprovement ? "success" : "warning",
      title: `${agency.name} Speed to Lead ${speedToLeadImprovement ? "Improving" : "Declining"}`,
      description: `Average speed to lead ${speedToLeadImprovement ? "decreased" : "increased"} by ${(Math.random() * 2 + 1).toFixed(1)} minutes compared to previous week.`,
      source: agency.name,
      metric: "Speed to Lead",
      change: speedToLeadImprovement ? (Math.random() * 15 + 5) : -(Math.random() * 15 + 5)
    });
  });
  
  // Client-level insights
  insights.push({
    type: "info",
    title: `${clientName} Weekly Summary`,
    description: `Overall call volume increased by ${Math.floor(Math.random() * 20 + 5)}% this week with ${Math.floor(Math.random() * 10 + 40)}% connection rate.`,
    source: clientName
  });
  
  return insights;
};

export default Insights;
