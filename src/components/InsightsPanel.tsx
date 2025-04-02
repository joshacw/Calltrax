
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, AlertTriangle, Award } from "lucide-react";

interface InsightItem {
  type: "warning" | "success" | "info";
  title: string;
  description: string;
}

export const InsightsPanel = () => {
  const { user } = useAuth();
  
  // In a real app, these insights would be calculated from real data
  const insights: InsightItem[] = [
    {
      type: "warning",
      title: "ABC North Connection Rate Declining",
      description: "Connection rate dropped 12% compared to previous period. Consider reviewing team training and call scripts."
    },
    {
      type: "success",
      title: "XYZ East Exceeding Targets",
      description: "Booking rate is 18% above target. Team performance is exceptional with 84% connection rate."
    },
    {
      type: "info",
      title: "Miami Location Showing Improvement",
      description: "Speed to lead improved by 24% in the last 7 days after process changes."
    },
    {
      type: "warning",
      title: "Chicago Team Performance",
      description: "Average call duration is below the recommended minimum. Recommend quality review."
    }
  ];
  
  // Only admins should see the insights panel
  if (user?.role !== "admin") {
    return null;
  }
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-brand-blue" />
          Performance Insights
        </CardTitle>
        <CardDescription>
          AI-powered analysis of your call center performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
              {insight.type === "warning" && (
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              )}
              {insight.type === "success" && (
                <TrendingUp className="h-5 w-5 text-emerald-500 mt-0.5" />
              )}
              {insight.type === "info" && (
                <TrendingDown className="h-5 w-5 text-blue-500 mt-0.5" />
              )}
              <div>
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
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
