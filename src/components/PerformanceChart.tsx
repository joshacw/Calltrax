
import { GraphDataPoint } from "@/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Toggle } from "@/components/ui/toggle";

interface PerformanceChartProps {
  data: GraphDataPoint[];
  title?: string;
}

export const PerformanceChart = ({ data, title = "Performance Trends" }: PerformanceChartProps) => {
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");
  const [isCumulative, setIsCumulative] = useState(true);
  const [chartData, setChartData] = useState<GraphDataPoint[]>([]);
  
  // Update chart data when time range or cumulative setting changes
  useEffect(() => {
    // Filter data based on timeRange
    setChartData(data);
  }, [data, timeRange, isCumulative]);
  
  // Get current day for reference line
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-4">
          <ToggleGroup type="single" value={timeRange} onValueChange={(value) => value && setTimeRange(value as any)}>
            <ToggleGroupItem value="week" aria-label="Week">
              Week
            </ToggleGroupItem>
            <ToggleGroupItem value="month" aria-label="Month">
              Month
            </ToggleGroupItem>
          </ToggleGroup>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Cumulative</span>
            <Toggle 
              pressed={isCumulative} 
              onPressedChange={setIsCumulative}
              aria-label="Toggle cumulative view"
            />
          </div>
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
