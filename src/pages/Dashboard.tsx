
import { DashboardFilter } from "@/components/DashboardFilter";
import { Layout } from "@/components/Layout";
import { MetricCard, StatCard } from "@/components/MetricCard";
import { InsightsPanel } from "@/components/InsightsPanel";
import { getDashboardMetrics } from "@/services/mockData";
import { FilterOptions } from "@/types";
import { useState } from "react";

const Dashboard = () => {
  const [metrics, setMetrics] = useState(getDashboardMetrics());
  
  const handleFilterChange = (filters: FilterOptions) => {
    // In a real app, this would fetch updated metrics based on filters
    console.log("Filters changed:", filters);
    
    // For demo purposes, we'll just use the mock data
    setMetrics(getDashboardMetrics(
      filters.agencies,
      filters.locations,
      filters.dateRange
    ));
  };
  
  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Performance Dashboard</h1>
        
        <DashboardFilter onFilterChange={handleFilterChange} />
        
        <InsightsPanel />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            title="Average Speed to Lead" 
            value={`${metrics.averageSpeedToLead} mins`} 
          />
          <MetricCard 
            title="Connection Rate" 
            value={`${metrics.connectionRate}%`} 
          />
          <MetricCard 
            title="Booking Rate" 
            value={`${metrics.bookingRate}%`} 
          />
          <MetricCard 
            title="Team Performance" 
            value={metrics.teamPerformance} 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

export default Dashboard;
