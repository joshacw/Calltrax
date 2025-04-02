import { GraphDataPoint } from "@/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { format, addDays, startOfWeek, isAfter } from "date-fns";

interface PerformanceChartProps {
  data: GraphDataPoint[];
}

export const PerformanceChart = ({ data }: PerformanceChartProps) => {
  // Generate more accurate data with projections
  const chartData = getWeekToDateData();
  
  // Get current day for reference line
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => format(new Date(date), 'EEE')}
          />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [`${value}`, '']}
            labelFormatter={(label) => format(new Date(label), 'EEEE, MMM dd')}
          />
          <Legend />
          <ReferenceLine 
            x={todayStr} 
            stroke="#ff0000" 
            strokeDasharray="3 3" 
            label={{ value: "Today", position: "top" }} 
          />
          <Area 
            type="monotone" 
            dataKey="leads" 
            name="Leads" 
            stroke="#ff8042" 
            fill="#ff8042" 
            fillOpacity={0.6}
          />
          <Area 
            type="monotone" 
            dataKey="calls" 
            name="Calls" 
            stroke="#8884d8" 
            fill="#8884d8" 
            fillOpacity={0.6}
          />
          <Area 
            type="monotone" 
            dataKey="connections" 
            name="Connections" 
            stroke="#82ca9d" 
            fill="#82ca9d" 
            fillOpacity={0.6}
          />
          <Area 
            type="monotone" 
            dataKey="appointments" 
            name="Appointments" 
            stroke="#ffc658" 
            fill="#ffc658" 
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Generate week-to-date data with projections
const getWeekToDateData = (): GraphDataPoint[] => {
  const data: GraphDataPoint[] = [];
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
  
  // Daily benchmarks (actual values for weekdays)
  const dailyBenchmarks = {
    leads: 25,
    calls: 40,
    connections: 22,
    appointments: 9
  };

  // Slight variations for different days
  const dailyVariations = [
    { leads: 0.9, calls: 0.85, connections: 0.8, appointments: 0.75 },   // Monday
    { leads: 1.1, calls: 1.05, connections: 1.1, appointments: 0.9 },    // Tuesday
    { leads: 1.0, calls: 1.15, connections: 1.05, appointments: 1.2 },   // Wednesday
    { leads: 0.95, calls: 1.0, connections: 0.95, appointments: 1.1 },   // Thursday
    { leads: 0.85, calls: 0.9, connections: 0.85, appointments: 0.85 }   // Friday
  ];
  
  // Projection factor (values get less certain for future days)
  const projectionStyles = (dayDate: Date) => {
    const isProjected = isAfter(dayDate, today);
    return isProjected ? "dashed" : "solid";
  };
  
  // Generate data for each weekday (Mon-Fri)
  for (let i = 0; i < 5; i++) {
    const currentDate = addDays(startOfCurrentWeek, i);
    const variation = dailyVariations[i];
    
    const dayData: GraphDataPoint = {
      date: format(currentDate, 'yyyy-MM-dd'),
      leads: Math.round(dailyBenchmarks.leads * variation.leads),
      calls: Math.round(dailyBenchmarks.calls * variation.calls),
      connections: Math.round(dailyBenchmarks.connections * variation.connections),
      appointments: Math.round(dailyBenchmarks.appointments * variation.appointments)
    };
    
    data.push(dayData);
  }
  
  return data;
};

// Keep the original demo data generation function as a fallback
const generateDemoData = (): GraphDataPoint[] => {
  const data: GraphDataPoint[] = [];
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate some realistic-looking data
    const leads = Math.floor(Math.random() * 30) + 30; // 30-60 leads
    const calls = Math.floor(Math.random() * 30) + 20;
    const connections = Math.floor(calls * (Math.random() * 0.3 + 0.4)); // 40-70% connection rate
    const appointments = Math.floor(connections * (Math.random() * 0.2 + 0.1)); // 10-30% booking rate
    
    data.push({
      date: date.toISOString(),
      leads,
      calls,
      connections,
      appointments
    });
  }
  
  return data;
};
