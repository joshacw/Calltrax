// src/pages/Dashboard.tsx
// Dashboard with public view handling - modals require sign-in

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, Phone, CalendarCheck, BarChart3, ExternalLink, LogIn } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DashboardMetrics {
  avgSpeedToLead: number;
  connectionRate: number;
  bookingRate: number;
  totalLeads: number;
  totalCalls: number;
  totalAppointments: number;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  leads: number;
  calls: number;
  connections: number;
  appointments: number;
  isToday?: boolean;
}

interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  created_at: string;
}

interface Call {
  id: string;
  lead_id: string | null;
  state: string | null;
  disposition: string | null;
  direction: string | null;
  external_number: string | null;
  duration_seconds: number | null;
  created_at: string;
  lead?: {
    name: string | null;
    phone: string | null;
  } | null;
}

type DateRangeOption = 'week_to_date' | 'month_to_date' | 'this_week' | 'this_month' | 'last_7_days' | 'last_30_days' | 'all_time';
type ModalType = 'leads' | 'calls' | 'appointments' | null;

const DATE_RANGE_OPTIONS: { value: DateRangeOption; label: string }[] = [
  { value: 'week_to_date', label: 'Week to Date' },
  { value: 'month_to_date', label: 'Month to Date' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'all_time', label: 'All Time' },
];

function getDateRange(option: DateRangeOption): { start: Date; end: Date; label: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  switch (option) {
    case 'week_to_date': {
      const dayOfWeek = today.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - daysFromMonday);
      return { start: startOfWeek, end: endOfToday, label: 'Week to Date' };
    }
    case 'month_to_date': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: startOfMonth, end: endOfToday, label: 'Month to Date' };
    }
    case 'this_week': {
      const dayOfWeek = today.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - daysFromMonday);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return { start: startOfWeek, end: endOfWeek, label: 'This Week' };
    }
    case 'this_month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return { start: startOfMonth, end: endOfMonth, label: 'This Month' };
    }
    case 'last_7_days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { start, end: endOfToday, label: 'Last 7 Days' };
    }
    case 'last_30_days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      return { start, end: endOfToday, label: 'Last 30 Days' };
    }
    case 'all_time': {
      const start = new Date(today);
      start.setDate(today.getDate() - 90);
      return { start, end: endOfToday, label: 'All Time' };
    }
    default:
      const defaultStart = new Date(today);
      defaultStart.setDate(today.getDate() - 29);
      return { start: defaultStart, end: endOfToday, label: 'Last 30 Days' };
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { selectedTenantId, isGlobalView, loading: tenantLoading } = useTenant();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangeOption>('last_30_days');
  const [chartMode, setChartMode] = useState<'daily' | 'cumulative'>('cumulative');
  const [todayIndex, setTodayIndex] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<Lead[] | Call[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Sign-in prompt modal
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);

  useEffect(() => {
    if (selectedTenantId && !isGlobalView) {
      fetchMetrics(selectedTenantId);
      fetchChartData(selectedTenantId);
    } else if (isGlobalView) {
      fetchMetrics(null);
      fetchChartData(null);
    }
  }, [selectedTenantId, isGlobalView, dateRange]);

  async function fetchMetrics(tenantId: string | null) {
    try {
      setLoading(true);

      const { start, end } = getDateRange(dateRange);

      let leadsQuery = supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (tenantId) {
        leadsQuery = leadsQuery.eq('tenant_id', tenantId);
      }

      const { count: leadsCount } = await leadsQuery;

      let callsQuery = supabase
        .from('calls')
        .select('id, state, disposition, started_at, lead_id, created_at, talk_time_seconds')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (tenantId) {
        callsQuery = callsQuery.eq('tenant_id', tenantId);
      }

      const { data: callsData } = await callsQuery;

      const totalCalls = callsData?.length || 0;

      const connectedCalls = callsData?.filter(
        call => call.talk_time_seconds > 0 ||
          ['hangup', 'completed', 'dispositions', 'connected'].includes(call.state)
      ).length || 0;

      const bookedCalls = callsData?.filter(call => {
        const disp = call.disposition?.toLowerCase() || '';
        return disp.includes('appointment') || disp.includes('booked');
      }).length || 0;

      const connectionRate = totalCalls > 0 ? (connectedCalls / totalCalls) * 100 : 0;
      const bookingRate = connectedCalls > 0 ? (bookedCalls / connectedCalls) * 100 : 0;

      let avgSpeedToLead = 0;

      let leadsDetailQuery = supabase
        .from('leads')
        .select('id, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .limit(100);

      if (tenantId) {
        leadsDetailQuery = leadsDetailQuery.eq('tenant_id', tenantId);
      }

      const { data: leads } = await leadsDetailQuery;

      if (leads && leads.length > 0 && callsData && callsData.length > 0) {
        const speeds: number[] = [];
        for (const lead of leads) {
          const leadCalls = callsData
            .filter(call => call.lead_id === lead.id && call.started_at)
            .sort((a, b) => new Date(a.started_at!).getTime() - new Date(b.started_at!).getTime());

          if (leadCalls.length > 0) {
            const speedMinutes = (new Date(leadCalls[0].started_at!).getTime() - new Date(lead.created_at).getTime()) / 1000 / 60;
            if (speedMinutes >= 0 && speedMinutes < 60 * 24) {
              speeds.push(speedMinutes);
            }
          }
        }
        if (speeds.length > 0) {
          avgSpeedToLead = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        }
      }

      setMetrics({
        avgSpeedToLead: Math.round(avgSpeedToLead * 10) / 10,
        connectionRate: Math.round(connectionRate * 10) / 10,
        bookingRate: Math.round(bookingRate * 10) / 10,
        totalLeads: leadsCount || 0,
        totalCalls: totalCalls,
        totalAppointments: bookedCalls,
      });
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setMetrics({
        avgSpeedToLead: 0,
        connectionRate: 0,
        bookingRate: 0,
        totalLeads: 0,
        totalCalls: 0,
        totalAppointments: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchChartData(tenantId: string | null) {
    try {
      const { start, end } = getDateRange(dateRange);
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      let leadsChartQuery = supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at');

      if (tenantId) {
        leadsChartQuery = leadsChartQuery.eq('tenant_id', tenantId);
      }

      const { data: leads } = await leadsChartQuery;

      let callsChartQuery = supabase
        .from('calls')
        .select('created_at, state, disposition, talk_time_seconds')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at');

      if (tenantId) {
        callsChartQuery = callsChartQuery.eq('tenant_id', tenantId);
      }

      const { data: calls } = await callsChartQuery;

      const dataByDate: Record<string, ChartDataPoint> = {};
      const currentDate = new Date(start);
      let foundTodayIndex: string | null = null;

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isToday = dateStr === todayStr;
        const displayDate = currentDate.toLocaleDateString('en-AU', {
          month: 'short',
          day: 'numeric'
        });

        if (isToday) {
          foundTodayIndex = displayDate;
        }

        dataByDate[dateStr] = {
          date: dateStr,
          displayDate,
          leads: 0,
          calls: 0,
          connections: 0,
          appointments: 0,
          isToday
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setTodayIndex(foundTodayIndex);

      leads?.forEach(lead => {
        const date = new Date(lead.created_at).toISOString().split('T')[0];
        if (dataByDate[date]) {
          dataByDate[date].leads++;
        }
      });

      calls?.forEach(call => {
        const date = new Date(call.created_at).toISOString().split('T')[0];
        if (dataByDate[date]) {
          dataByDate[date].calls++;
          if (call.talk_time_seconds > 0 ||
              ['hangup', 'completed', 'dispositions', 'connected'].includes(call.state)) {
            dataByDate[date].connections++;
          }
          const disp = call.disposition?.toLowerCase() || '';
          if (disp.includes('appointment') || disp.includes('booked')) {
            dataByDate[date].appointments++;
          }
        }
      });

      const chartArray = Object.values(dataByDate)
        .sort((a, b) => a.date.localeCompare(b.date));

      setChartData(chartArray);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setChartData([]);
    }
  }

  // Handle card click - check authentication
  function handleCardClick(type: ModalType) {
    // If user is not authenticated, show sign-in prompt
    if (!user) {
      setModalType(type);
      setSignInPromptOpen(true);
      return;
    }

    // User is authenticated - open data modal
    openModal(type);
  }

  // Modal data fetching (only for authenticated users)
  async function openModal(type: ModalType) {
    if (!type) return;

    setModalType(type);
    setModalOpen(true);
    setModalLoading(true);
    setModalData([]);

    const { start, end } = getDateRange(dateRange);

    try {
      if (type === 'leads') {
        let query = supabase
          .from('leads')
          .select('id, name, phone, email, source, created_at')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: false })
          .limit(50);

        if (selectedTenantId && !isGlobalView) {
          query = query.eq('tenant_id', selectedTenantId);
        }

        const { data } = await query;
        setModalData(data || []);
      } else if (type === 'calls') {
        let query = supabase
          .from('calls')
          .select(`
            id, lead_id, state, disposition, direction, external_number, duration_seconds, created_at,
            lead:leads!lead_id (name, phone)
          `)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: false })
          .limit(50);

        if (selectedTenantId && !isGlobalView) {
          query = query.eq('tenant_id', selectedTenantId);
        }

        const { data } = await query;
        setModalData(data || []);
      } else if (type === 'appointments') {
        let query = supabase
          .from('calls')
          .select(`
            id, lead_id, state, disposition, direction, external_number, duration_seconds, created_at,
            lead:leads!lead_id (name, phone)
          `)
          .or('disposition.ilike.%appointment%,disposition.ilike.%booked%')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: false })
          .limit(50);

        if (selectedTenantId && !isGlobalView) {
          query = query.eq('tenant_id', selectedTenantId);
        }

        const { data } = await query;
        setModalData(data || []);
      }
    } catch (err) {
      console.error('Error fetching modal data:', err);
    } finally {
      setModalLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  const getDisplayData = () => {
    if (chartMode === 'daily') {
      return chartData.map(item => ({
        ...item,
        date: item.displayDate
      }));
    }

    let cumLeads = 0;
    let cumCalls = 0;
    let cumConnections = 0;
    let cumAppointments = 0;

    return chartData.map(item => {
      cumLeads += item.leads;
      cumCalls += item.calls;
      cumConnections += item.connections;
      cumAppointments += item.appointments;

      return {
        date: item.displayDate,
        leads: cumLeads,
        calls: cumCalls,
        connections: cumConnections,
        appointments: cumAppointments,
        isToday: item.isToday
      };
    });
  };

  const getPerformanceColor = (value: number, type: 'speed' | 'rate') => {
    if (type === 'speed') {
      if (value <= 5) return 'text-green-600';
      if (value <= 15) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (value >= 50) return 'text-green-600';
    if (value >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (value: number, type: 'speed' | 'rate') => {
    if (type === 'speed') {
      if (value <= 5) return { text: 'Good', color: 'bg-green-100 text-green-800' };
      if (value <= 15) return { text: 'Average', color: 'bg-yellow-100 text-yellow-800' };
      return { text: 'Poor', color: 'bg-red-100 text-red-800' };
    }
    if (value >= 50) return { text: 'Good', color: 'bg-green-100 text-green-800' };
    if (value >= 25) return { text: 'Average', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Poor', color: 'bg-red-100 text-red-800' };
  };

  const { label: dateRangeLabel } = getDateRange(dateRange);

  const getXAxisInterval = () => {
    const len = chartData.length;
    if (len <= 7) return 0;
    if (len <= 14) return 1;
    if (len <= 31) return 4;
    return Math.floor(len / 10);
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'leads': return 'Leads';
      case 'calls': return 'Calls';
      case 'appointments': return 'Appointments';
      default: return '';
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        description={`Performance overview - ${dateRangeLabel}`}
      >
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeOption)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="space-y-6">

        {loading && (tenantLoading || selectedTenantId) && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading metrics...</span>
          </div>
        )}

        {metrics && !loading && (
          <>
            {/* Metrics Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Speed-to-Lead</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPerformanceBadge(metrics.avgSpeedToLead, 'speed').color}`}>
                    {getPerformanceBadge(metrics.avgSpeedToLead, 'speed').text}
                  </span>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getPerformanceColor(metrics.avgSpeedToLead, 'speed')}`}>
                    {metrics.avgSpeedToLead > 60
                      ? `${(metrics.avgSpeedToLead / 60).toFixed(1)} hrs`
                      : `${metrics.avgSpeedToLead} mins`
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Connection Rate</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPerformanceBadge(metrics.connectionRate, 'rate').color}`}>
                    {getPerformanceBadge(metrics.connectionRate, 'rate').text}
                  </span>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getPerformanceColor(metrics.connectionRate, 'rate')}`}>
                    {metrics.connectionRate}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Booking Rate</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPerformanceBadge(metrics.bookingRate, 'rate').color}`}>
                    {getPerformanceBadge(metrics.bookingRate, 'rate').text}
                  </span>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getPerformanceColor(metrics.bookingRate, 'rate')}`}>
                    {metrics.bookingRate}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalLeads}</div>
                  <p className="text-xs text-muted-foreground mt-1">{dateRangeLabel}</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Performance Overview
                    </CardTitle>
                    <CardDescription>
                      {chartMode === 'cumulative' ? 'Cumulative totals over time' : 'Daily metrics'}
                      {todayIndex && ' • Vertical line marks today'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={chartMode === 'cumulative' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartMode('cumulative')}
                    >
                      Cumulative
                    </Button>
                    <Button
                      variant={chartMode === 'daily' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartMode('daily')}
                    >
                      Daily
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={getDisplayData()}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        className="text-xs"
                        tick={{ fill: 'currentColor', fontSize: 11 }}
                        interval={getXAxisInterval()}
                        angle={chartData.length > 14 ? -45 : 0}
                        textAnchor={chartData.length > 14 ? 'end' : 'middle'}
                        height={chartData.length > 14 ? 60 : 30}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fill: 'currentColor', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      {todayIndex && (
                        <ReferenceLine
                          x={todayIndex}
                          stroke="#ef4444"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          label={{
                            value: 'Today',
                            position: 'top',
                            fill: '#ef4444',
                            fontSize: 12
                          }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="leads"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={{ fill: '#f97316', r: 3 }}
                        name="Leads"
                      />
                      <Line
                        type="monotone"
                        dataKey="calls"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }}
                        name="Calls"
                      />
                      <Line
                        type="monotone"
                        dataKey="connections"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: '#22c55e', r: 3 }}
                        name="Connections"
                      />
                      <Line
                        type="monotone"
                        dataKey="appointments"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={{ fill: '#a855f7', r: 3 }}
                        name="Appointments"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                    No data available for the selected period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bottom Stats - Clickable cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card
                className="cursor-pointer hover:border-orange-300 hover:shadow-md transition-all"
                onClick={() => handleCardClick('leads')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Leads</CardTitle>
                  <Users className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{metrics.totalLeads}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {dateRangeLabel}
                    <ExternalLink className="h-3 w-3" />
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                onClick={() => handleCardClick('calls')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Calls</CardTitle>
                  <Phone className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{metrics.totalCalls}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {dateRangeLabel}
                    <ExternalLink className="h-3 w-3" />
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
                onClick={() => handleCardClick('appointments')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                  <CalendarCheck className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{metrics.totalAppointments}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {dateRangeLabel}
                    <ExternalLink className="h-3 w-3" />
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Sign-In Prompt Modal (for unauthenticated users) */}
        <Dialog open={signInPromptOpen} onOpenChange={setSignInPromptOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Sign In Required
              </DialogTitle>
              <DialogDescription>
                To view detailed {modalType} data, please sign in to your account.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <p className="text-sm text-muted-foreground">
                Sign in to access:
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  Detailed lead information
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-500" />
                  Call history and recordings
                </li>
                <li className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-purple-500" />
                  Appointment details
                </li>
              </ul>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSignInPromptOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => navigate('/login')}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Detail Modal (for authenticated users) */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {modalType === 'leads' && <Users className="h-5 w-5 text-orange-500" />}
                {modalType === 'calls' && <Phone className="h-5 w-5 text-blue-500" />}
                {modalType === 'appointments' && <CalendarCheck className="h-5 w-5 text-purple-500" />}
                {getModalTitle()} - {dateRangeLabel}
              </DialogTitle>
              <DialogDescription>
                {modalType === 'leads' && 'All leads received during this period'}
                {modalType === 'calls' && 'All calls made during this period'}
                {modalType === 'appointments' && 'All booked appointments during this period'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-auto">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading...</span>
                </div>
              ) : modalData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No records found for this period
                </div>
              ) : modalType === 'leads' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(modalData as Lead[]).map(lead => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name || '-'}</TableCell>
                        <TableCell>{lead.phone || '-'}</TableCell>
                        <TableCell>{lead.email || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{lead.source || 'Unknown'}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(lead.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setModalOpen(false);
                              navigate(`/lead/${lead.id}`);
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Disposition</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(modalData as Call[]).map(call => (
                      <TableRow key={call.id}>
                        <TableCell className="font-medium">
                          {call.lead?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>{call.external_number || call.lead?.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              call.state === 'completed' ? 'bg-green-100 text-green-800' :
                                call.state === 'no_answer' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                            }
                          >
                            {call.state === 'completed' ? 'Connected' : call.state || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {call.disposition ? (
                            <Badge
                              className={
                                call.disposition === 'booked' ? 'bg-purple-100 text-purple-800' :
                                  call.disposition === 'callback' ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                              }
                            >
                              {call.disposition}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{formatDuration(call.duration_seconds)}</TableCell>
                        <TableCell>{formatDate(call.created_at)}</TableCell>
                        <TableCell>
                          {call.lead_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setModalOpen(false);
                                navigate(`/lead/${call.lead_id}`);
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}