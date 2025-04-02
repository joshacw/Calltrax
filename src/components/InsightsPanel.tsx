
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, AlertTriangle, Award, BarChart3, CalendarRange, ChevronRight } from "lucide-react";
import { getDashboardMetrics } from "@/services/mockData";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InsightItem {
  type: "warning" | "success" | "info";
  title: string;
  description: string;
  source?: string;
  metric?: string;
  change?: number;
}

export const InsightsPanel = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [animationState, setAnimationState] = useState<"fade-in" | "fade-out" | "visible">("visible");
  
  useEffect(() => {
    // In a real app, these insights would be calculated from real data
    // For now we'll simulate some insights based on time periods
    const currentMetrics = getDashboardMetrics();
    const previousMetrics = getDashboardMetrics([], [], {
      start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    
    // Generate insights based on comparison
    const generatedInsights: InsightItem[] = [];
    
    // Connection rate insight
    const connectionRateDiff = currentMetrics.connectionRate - previousMetrics.connectionRate;
    if (Math.abs(connectionRateDiff) > 5) {
      generatedInsights.push({
        type: connectionRateDiff > 0 ? "success" : "warning",
        title: connectionRateDiff > 0 
          ? "Connection Rate Improving" 
          : "Connection Rate Declining",
        description: `Connection rate ${connectionRateDiff > 0 ? "increased" : "decreased"} by ${Math.abs(connectionRateDiff).toFixed(1)}% compared to previous period.`,
        metric: "Connection Rate",
        change: connectionRateDiff
      });
    }
    
    // Booking rate insight
    const bookingRateDiff = currentMetrics.bookingRate - previousMetrics.bookingRate;
    if (Math.abs(bookingRateDiff) > 3) {
      generatedInsights.push({
        type: bookingRateDiff > 0 ? "success" : "warning",
        title: bookingRateDiff > 0 
          ? "Booking Rate Trending Up" 
          : "Booking Rate Trending Down",
        description: `Booking rate ${bookingRateDiff > 0 ? "improved" : "declined"} by ${Math.abs(bookingRateDiff).toFixed(1)}% compared to previous period.`,
        metric: "Booking Rate",
        change: bookingRateDiff
      });
    }
    
    // Speed to lead insight
    const speedToLeadDiff = currentMetrics.averageSpeedToLead - previousMetrics.averageSpeedToLead;
    if (Math.abs(speedToLeadDiff) > 1) {
      generatedInsights.push({
        type: speedToLeadDiff < 0 ? "success" : "warning", // Lower is better for speed to lead
        title: speedToLeadDiff < 0 
          ? "Speed to Lead Improving" 
          : "Speed to Lead Declining",
        description: `Average speed to lead ${speedToLeadDiff < 0 ? "decreased" : "increased"} by ${Math.abs(speedToLeadDiff).toFixed(1)} minutes compared to previous period.`,
        metric: "Speed to Lead",
        change: -speedToLeadDiff // Invert so positive means improvement
      });
    }
    
    // Add preset insights for demo purposes
    generatedInsights.push(
      {
        type: "warning",
        title: "ABC North Connection Rate Declining",
        description: "Connection rate dropped 12% compared to previous period. Consider reviewing team training and call scripts.",
        source: "ABC North"
      },
      {
        type: "success",
        title: "XYZ East Exceeding Targets",
        description: "Booking rate is 18% above target. Team performance is exceptional with 84% connection rate.",
        source: "XYZ East"
      },
      {
        type: "info",
        title: "Miami Location Showing Improvement",
        description: "Speed to lead improved by 24% in the last 7 days after process changes.",
        source: "Miami"
      },
      {
        type: "warning",
        title: "Chicago Team Performance",
        description: "Average call duration is below the recommended minimum. Recommend quality review.",
        source: "Chicago"
      }
    );
    
    setInsights(generatedInsights);
  }, []);
  
  // Effect to handle the rotation of insights
  useEffect(() => {
    if (showAllInsights || insights.length === 0) return;
    
    const rotateInsight = () => {
      // Start fade out animation
      setAnimationState("fade-out");
      
      // After fade out completes, change insight and fade in
      const fadeOutTimer = setTimeout(() => {
        // Get next pair of indices (ensuring we don't go out of bounds)
        setCurrentInsightIndex((prevIndex) => {
          const newIndex = (prevIndex + 2) % insights.length;
          // If we're at the end with an odd number of insights, go back to the start
          return newIndex === insights.length - 1 ? 0 : newIndex;
        });
        setAnimationState("fade-in");
        
        // After fade in completes, set to visible
        const fadeInTimer = setTimeout(() => {
          setAnimationState("visible");
        }, 300); // Duration of fade in animation
        
        return () => clearTimeout(fadeInTimer);
      }, 300); // Duration of fade out animation
      
      return () => clearTimeout(fadeOutTimer);
    };
    
    // Set the interval for rotating insights (6 seconds instead of 12)
    const intervalId = setInterval(rotateInsight, 6000);
    
    // Initial fade in
    setAnimationState("fade-in");
    const initialFadeInTimer = setTimeout(() => {
      setAnimationState("visible");
    }, 300);
    
    // Clean up
    return () => {
      clearInterval(intervalId);
      clearTimeout(initialFadeInTimer);
    };
  }, [showAllInsights, insights.length]);
  
  // Only admins should see the insights panel
  if (user?.role !== "admin") {
    return null;
  }
  
  // If no insights, don't render anything
  if (insights.length === 0) {
    return null;
  }
  
  // Animation classes
  const getAnimationClass = () => {
    switch (animationState) {
      case "fade-in":
        return "opacity-0 translate-y-2 animate-in";
      case "fade-out":
        return "opacity-100 translate-y-0 animate-out";
      case "visible":
        return "opacity-100 translate-y-0";
      default:
        return "";
    }
  };
  
  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-blue" />
            Performance Insights
          </CardTitle>
          <CardDescription>
            AI-powered analysis of your call center performance metrics
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowAllInsights(!showAllInsights)}
          className="flex items-center gap-1"
        >
          {showAllInsights ? "Show Rotating" : "View All"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {showAllInsights ? (
            // Show all insights in a grid
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, index) => (
                <InsightItem key={index} insight={insight} />
              ))}
            </div>
          ) : (
            // Show two insights at a time in columns
            <div 
              className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ease-out",
                getAnimationClass()
              )}
            >
              {/* First insight */}
              {insights.length > 0 && <InsightItem insight={insights[currentInsightIndex]} />}
              
              {/* Second insight (if available) */}
              {insights.length > 1 && (
                <InsightItem 
                  insight={insights[(currentInsightIndex + 1) % insights.length]} 
                />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Extracted InsightItem component for better organization
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
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
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
