
import { useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardMetrics } from "@/types";
import { getDashboardMetrics, getMonthToDateData, getWeekToDateData } from "@/services/mockData";
import { MetricCard, StatCard } from "@/components/MetricCard";
import { PerformanceChart } from "@/components/PerformanceChart";

const PublicDashboard = () => {
  const { dashboardId } = useParams();
  const [metrics] = useState<DashboardMetrics>(getDashboardMetrics());
  const [weekData] = useState(getWeekToDateData());
  const [monthData] = useState(getMonthToDateData());
  
  // In a real app, we would use the dashboardId to fetch the saved dashboard config
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <p className="text-muted-foreground">Public view - Read only</p>
      </div>
      
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

export default PublicDashboard;
