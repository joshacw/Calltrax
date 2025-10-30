
import { GraphDataPoint } from "@/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PerformanceChartProps {
  data: GraphDataPoint[];
  title?: string;
  isActive?: boolean;
}

export const PerformanceChart = ({ data, title = "Performance Trends", isActive = false }: PerformanceChartProps) => {
  const [isCumulative, setIsCumulative] = useState(true);
  const [chartData, setChartData] = useState<GraphDataPoint[]>([]);
  
  // Update chart data when cumulative setting changes
  useEffect(() => {
    setChartData(data);
  }, [data, isCumulative]);
  
  // Get current day for reference line
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  return (
    <div className={cn(
      "w-full transition-all",
      isActive && "ring-2 ring-primary rounded-lg p-2"
    )}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
          <Button
            variant={isCumulative ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsCumulative(true)}
            className="h-8 px-3"
          >
            Cumulative
          </Button>
          <Button
            variant={!isCumulative ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsCumulative(false)}
            className="h-8 px-3"
          >
            Daily
          </Button>
        </div>
      </div>
      
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 30,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
            />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => [`${value}`, '']}
              labelFormatter={(label) => format(parseISO(label), 'EEEE, MMM dd')}
            />
            <Legend />
            <ReferenceLine 
              x={todayStr} 
              stroke="#ff0000" 
              strokeDasharray="3 3" 
              label={{ value: "Today", position: "top" }} 
            />
            
            {/* Actual data with fill */}
            <Area 
              type="monotone" 
              dataKey={isCumulative ? "leadsCumulative" : "leads"} 
              name="Leads" 
              stroke="#ff8042" 
              fill="#ff8042" 
              fillOpacity={0.6}
              activeDot={{ r: 8 }}
              isAnimationActive={false}
              connectNulls
            />
            <Area 
              type="monotone" 
              dataKey={isCumulative ? "callsCumulative" : "calls"} 
              name="Calls" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.6}
              activeDot={{ r: 8 }}
              isAnimationActive={false}
              connectNulls
            />
            <Area 
              type="monotone" 
              dataKey={isCumulative ? "connectionsCumulative" : "connections"} 
              name="Connections" 
              stroke="#82ca9d" 
              fill="#82ca9d" 
              fillOpacity={0.6}
              activeDot={{ r: 8 }}
              isAnimationActive={false}
              connectNulls
            />
            <Area 
              type="monotone" 
              dataKey={isCumulative ? "appointmentsCumulative" : "appointments"} 
              name="Appointments" 
              stroke="#ffc658" 
              fill="#ffc658" 
              fillOpacity={0.6}
              activeDot={{ r: 8 }}
              isAnimationActive={false}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
