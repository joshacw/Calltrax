
import { GraphDataPoint } from "@/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { format, addDays, startOfWeek, endOfWeek, isAfter, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface PerformanceChartProps {
  data: GraphDataPoint[];
}

export const PerformanceChart = ({ data }: PerformanceChartProps) => {
  const [timeRange, setTimeRange] = useState<"week" | "7days" | "30days" | "90days">("week");
  const [isCumulative, setIsCumulative] = useState(true);
  const [chartData, setChartData] = useState<GraphDataPoint[]>([]);
  
  // Generate week data (Monday to Sunday)
  useEffect(() => {
    if (timeRange === "week") {
      const weekData = getFullWeekData(isCumulative);
      setChartData(weekData);
    } else if (timeRange === "7days") {
      // This would fetch last 7 days in a real app
      setChartData(getFullWeekData(isCumulative));
    } else if (timeRange === "30days") {
      // This would fetch last 30 days in a real app
      setChartData(getFullWeekData(isCumulative));
    } else if (timeRange === "90days") {
      // This would fetch last 90 days in a real app
      setChartData(getFullWeekData(isCumulative));
    }
  }, [timeRange, isCumulative]);
  
  // Get current day for reference line
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Performance Trends</h2>
        <div className="flex items-center gap-4">
          <ToggleGroup type="single" value={timeRange} onValueChange={(value) => value && setTimeRange(value as any)}>
            <ToggleGroupItem value="week" aria-label="Week to date">
              Week to date
            </ToggleGroupItem>
            <ToggleGroupItem value="7days" aria-label="7 days">
              7 days
            </ToggleGroupItem>
            <ToggleGroupItem value="30days" aria-label="30 days">
              30 days
            </ToggleGroupItem>
            <ToggleGroupItem value="90days" aria-label="90 days">
              90 days
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
      
      <div className="w-full h-96"> {/* Increased height */}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 30, // Increased top margin to prevent "Today" label from being cut off
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => format(parseISO(date), 'EEE')}
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
            
            {/* Historical data (solid with fill) */}
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
            
            {/* Projected data (dotted lines, no fill) */}
            <Area 
              type="monotone" 
              dataKey={isCumulative ? "leadsProjectedCumulative" : "leadsProjected"} 
              name="Leads (Projected)" 
              stroke="#ff8042" 
              strokeDasharray="5 5"
              fill="none"
              connectNulls
              isAnimationActive={false}
              activeDot={{ r: 6 }}
              dot={{ strokeWidth: 2 }}
            />
            <Area 
              type="monotone" 
              dataKey={isCumulative ? "callsProjectedCumulative" : "callsProjected"} 
              name="Calls (Projected)" 
              stroke="#8884d8" 
              strokeDasharray="5 5"
              fill="none"
              connectNulls
              isAnimationActive={false}
              activeDot={{ r: 6 }}
              dot={{ strokeWidth: 2 }}
            />
            <Area 
              type="monotone" 
              dataKey={isCumulative ? "connectionsProjectedCumulative" : "connectionsProjected"} 
              name="Connections (Projected)" 
              stroke="#82ca9d" 
              strokeDasharray="5 5"
              fill="none"
              connectNulls
              isAnimationActive={false}
              activeDot={{ r: 6 }}
              dot={{ strokeWidth: 2 }}
            />
            <Area 
              type="monotone" 
              dataKey={isCumulative ? "appointmentsProjectedCumulative" : "appointmentsProjected"} 
              name="Appointments (Projected)" 
              stroke="#ffc658" 
              strokeDasharray="5 5"
              fill="none"
              connectNulls
              isAnimationActive={false}
              activeDot={{ r: 6 }}
              dot={{ strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Generate full week (Monday to Sunday) data with projections and cumulative values
const getFullWeekData = (isCumulative: boolean): GraphDataPoint[] => {
  const data: GraphDataPoint[] = [];
  const today = new Date();
  
  // Get the start of the current week (Monday)
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  // Get the end of the current week (Sunday)
  const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });
  
  // Daily benchmarks
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
    { leads: 0.85, calls: 0.9, connections: 0.85, appointments: 0.85 },  // Friday
    { leads: 0.7, calls: 0.65, connections: 0.6, appointments: 0.7 },    // Saturday
    { leads: 0.5, calls: 0.45, connections: 0.4, appointments: 0.5 },    // Sunday
  ];
  
  // For cumulative calculations
  let cumulativeLeads = 0;
  let cumulativeCalls = 0;
  let cumulativeConnections = 0;
  let cumulativeAppointments = 0;
  
  // Generate data for each day of the week (Mon-Sun)
  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(startOfCurrentWeek, i);
    const variation = dailyVariations[i];
    const isPastToday = isAfter(currentDate, today);
    
    // Calculate actual/projected values
    const leads = Math.round(dailyBenchmarks.leads * variation.leads);
    const calls = Math.round(dailyBenchmarks.calls * variation.calls);
    const connections = Math.round(dailyBenchmarks.connections * variation.connections);
    const appointments = Math.round(dailyBenchmarks.appointments * variation.appointments);
    
    // Update cumulative values
    cumulativeLeads += leads;
    cumulativeCalls += calls;
    cumulativeConnections += connections;
    cumulativeAppointments += appointments;
    
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    
    if (isPastToday) {
      // For projected dates (after today), use separate properties with null for actual
      data.push({
        date: dateStr,
        leads: null,
        calls: null,
        connections: null,
        appointments: null,
        leadsProjected: leads,
        callsProjected: calls,
        connectionsProjected: connections,
        appointmentsProjected: appointments,
        leadsCumulative: null,
        callsCumulative: null,
        connectionsCumulative: null,
        appointmentsCumulative: null,
        leadsProjectedCumulative: cumulativeLeads,
        callsProjectedCumulative: cumulativeCalls,
        connectionsProjectedCumulative: cumulativeConnections,
        appointmentsProjectedCumulative: cumulativeAppointments
      });
    } else {
      // For past dates (up to today), use actual values and null for projected
      data.push({
        date: dateStr,
        leads: leads,
        calls: calls,
        connections: connections,
        appointments: appointments,
        leadsProjected: null,
        callsProjected: null,
        connectionsProjected: null,
        appointmentsProjected: null,
        leadsCumulative: cumulativeLeads,
        callsCumulative: cumulativeCalls,
        connectionsCumulative: cumulativeConnections,
        appointmentsCumulative: cumulativeAppointments,
        leadsProjectedCumulative: null,
        callsProjectedCumulative: null,
        connectionsProjectedCumulative: null,
        appointmentsProjectedCumulative: null
      });
    }
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
