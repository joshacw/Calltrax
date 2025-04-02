
import { GraphDataPoint } from "@/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO } from "date-fns";

interface PerformanceChartProps {
  data: GraphDataPoint[];
}

export const PerformanceChart = ({ data }: PerformanceChartProps) => {
  // If no data is provided, generate demo data
  const chartData = data.length > 0 ? data : generateDemoData();
  
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

// Generate demo data when real data isn't available
const generateDemoData = (): GraphDataPoint[] => {
  const data: GraphDataPoint[] = [];
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate some realistic-looking data
    const calls = Math.floor(Math.random() * 30) + 20;
    const connections = Math.floor(calls * (Math.random() * 0.3 + 0.4)); // 40-70% connection rate
    const appointments = Math.floor(connections * (Math.random() * 0.2 + 0.1)); // 10-30% booking rate
    
    data.push({
      date: date.toISOString(),
      calls,
      connections,
      appointments
    });
  }
  
  return data;
};
