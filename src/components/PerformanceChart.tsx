
import { GraphDataPoint } from "@/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

interface PerformanceChartProps {
  data: GraphDataPoint[];
}

export const PerformanceChart = ({ data }: PerformanceChartProps) => {
  // Use static data instead of generating random data
  const staticChartData = getStaticChartData();
  
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={staticChartData}
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
            tickFormatter={(date) => format(new Date(date), 'MMM dd')}
          />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [`${value}`, '']}
            labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="leads" 
            name="Leads" 
            stackId="1"
            stroke="#ff8042" 
            fill="#ff8042" 
            fillOpacity={0.6}
          />
          <Area 
            type="monotone" 
            dataKey="calls" 
            name="Calls" 
            stackId="1"
            stroke="#8884d8" 
            fill="#8884d8" 
            fillOpacity={0.6}
          />
          <Area 
            type="monotone" 
            dataKey="connections" 
            name="Connections" 
            stackId="1"
            stroke="#82ca9d" 
            fill="#82ca9d" 
            fillOpacity={0.6}
          />
          <Area 
            type="monotone" 
            dataKey="appointments" 
            name="Appointments" 
            stackId="1"
            stroke="#ffc658" 
            fill="#ffc658" 
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Static data for the chart
const getStaticChartData = (): GraphDataPoint[] => {
  const data: GraphDataPoint[] = [
    { date: "2023-05-01", leads: 40, calls: 30, connections: 18, appointments: 5 },
    { date: "2023-05-02", leads: 35, calls: 25, connections: 15, appointments: 4 },
    { date: "2023-05-03", leads: 45, calls: 35, connections: 22, appointments: 7 },
    { date: "2023-05-04", leads: 50, calls: 40, connections: 28, appointments: 9 },
    { date: "2023-05-05", leads: 38, calls: 28, connections: 17, appointments: 5 },
    { date: "2023-05-06", leads: 32, calls: 22, connections: 13, appointments: 3 },
    { date: "2023-05-07", leads: 28, calls: 18, connections: 10, appointments: 2 },
    { date: "2023-05-08", leads: 52, calls: 42, connections: 30, appointments: 10 },
    { date: "2023-05-09", leads: 48, calls: 38, connections: 25, appointments: 8 },
    { date: "2023-05-10", leads: 42, calls: 32, connections: 20, appointments: 6 },
    { date: "2023-05-11", leads: 37, calls: 27, connections: 16, appointments: 4 },
    { date: "2023-05-12", leads: 43, calls: 33, connections: 21, appointments: 7 },
    { date: "2023-05-13", leads: 55, calls: 45, connections: 32, appointments: 12 },
    { date: "2023-05-14", leads: 46, calls: 36, connections: 24, appointments: 9 },
    { date: "2023-05-15", leads: 41, calls: 31, connections: 19, appointments: 6 },
    { date: "2023-05-16", leads: 39, calls: 29, connections: 18, appointments: 5 },
    { date: "2023-05-17", leads: 47, calls: 37, connections: 25, appointments: 8 },
    { date: "2023-05-18", leads: 44, calls: 34, connections: 22, appointments: 7 },
    { date: "2023-05-19", leads: 49, calls: 39, connections: 26, appointments: 9 },
    { date: "2023-05-20", leads: 53, calls: 43, connections: 30, appointments: 10 },
    { date: "2023-05-21", leads: 51, calls: 41, connections: 28, appointments: 9 },
    { date: "2023-05-22", leads: 46, calls: 36, connections: 24, appointments: 8 },
    { date: "2023-05-23", leads: 40, calls: 30, connections: 19, appointments: 6 },
    { date: "2023-05-24", leads: 42, calls: 32, connections: 21, appointments: 7 },
    { date: "2023-05-25", leads: 38, calls: 28, connections: 17, appointments: 5 },
    { date: "2023-05-26", leads: 36, calls: 26, connections: 16, appointments: 4 },
    { date: "2023-05-27", leads: 34, calls: 24, connections: 14, appointments: 3 },
    { date: "2023-05-28", leads: 45, calls: 35, connections: 23, appointments: 8 },
    { date: "2023-05-29", leads: 48, calls: 38, connections: 26, appointments: 9 },
    { date: "2023-05-30", leads: 43, calls: 33, connections: 22, appointments: 7 },
  ];
  
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
