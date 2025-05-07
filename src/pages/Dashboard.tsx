
import { DashboardFilter } from "@/components/DashboardFilter";
import { Layout } from "@/components/Layout";
import { MetricCard, StatCard } from "@/components/MetricCard";
import { InsightsPanel } from "@/components/InsightsPanel";
import { getDashboardMetrics, getMonthToDateData, getWeekToDateData } from "@/services/mockData";
import { FilterOptions } from "@/types";
import { useState } from "react";
import { PerformanceChart } from "@/components/PerformanceChart";
import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(getDashboardMetrics());
  const [weekData] = useState(getWeekToDateData());
  const [monthData] = useState(getMonthToDateData());
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({
    agencies: [],
    locations: [],
    teamMembers: [],
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
  });
  
  const handleFilterChange = (filters: FilterOptions) => {
    // In a real app, this would fetch updated metrics based on filters
    console.log("Filters changed:", filters);
    setCurrentFilters(filters);
    
    // For demo purposes, we'll just use the mock data
    setMetrics(getDashboardMetrics(
      filters.agencies,
      filters.locations,
      filters.dateRange,
      filters.teamMembers
    ));
  };
  
  const handleCreatePublicView = () => {
    // In a real app, this would create a shareable public link
    const dashboardId = Math.random().toString(36).substring(2, 10);
    const publicUrl = `${window.location.origin}/dashboard/public/${dashboardId}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(publicUrl).then(() => {
      toast.success("Public dashboard link copied to clipboard", {
        description: "Share this link to allow public viewing of this dashboard configuration"
      });
    });
  };
  
  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          
          {(user?.role === "admin" || user?.role === "agency") && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleCreatePublicView}
            >
              <Share className="h-4 w-4" />
              Create Public View
            </Button>
          )}
        </div>
        
        <DashboardFilter onFilterChange={handleFilterChange} />
        
        {user?.role === "admin" && <InsightsPanel />}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Week to date chart */}
          <div className="bg-white p-4 rounded-md border border-gray-100">
            <PerformanceChart data={weekData} title="Week to Date Performance" />
          </div>
          
          {/* Month to date chart */}
          <div className="bg-white p-4 rounded-md border border-gray-100">
            <PerformanceChart data={monthData} title="Month to Date Performance" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            title="Average Speed to Lead" 
            value={`${metrics.averageSpeedToLead} mins`} 
            status={getMetricStatus(metrics.averageSpeedToLead, 5, 10, true)}
          />
          <MetricCard 
            title="Connection Rate" 
            value={`${metrics.connectionRate}%`} 
            status={getMetricStatus(metrics.connectionRate, 70, 50)}
          />
          <MetricCard 
            title="Booking Rate" 
            value={`${metrics.bookingRate}%`} 
            status={getMetricStatus(metrics.bookingRate, 30, 15)}
          />
          <MetricCard 
            title="Team Performance" 
            value={metrics.teamPerformance} 
            status={metrics.teamPerformance === "Above Target" ? "good" : 
                   metrics.teamPerformance === "On Target" ? "average" : "poor"}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Number of Leads" 
            value={metrics.numberOfLeads} 
          />
          <StatCard 
            title="Number of Calls" 
            value={metrics.numberOfCalls} 
          />
          <StatCard 
            title="Number of Conversations" 
            value={metrics.numberOfConversations} 
          />
          <StatCard 
            title="Number of Appointments" 
            value={metrics.numberOfAppointments} 
          />
        </div>
      </div>
    </Layout>
  );
};

// Helper function to determine metric status
const getMetricStatus = (value: number, goodThreshold: number, poorThreshold: number, isReversed = false) => {
  if (isReversed) {
    return value <= goodThreshold ? "good" : 
           value <= poorThreshold ? "average" : "poor";
  } else {
    return value >= goodThreshold ? "good" : 
           value >= poorThreshold ? "average" : "poor";
  }
};

export default Dashboard;
