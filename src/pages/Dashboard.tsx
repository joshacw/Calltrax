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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Users, Phone, CalendarCheck, BarChart3, ExternalLink, LogIn, CalendarIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import {
  getDateRangeForTenant,
  getLocalDateKey,
  formatInTenantTime,
  getDateKeysInRange
} from '@/utils/timezone';

interface DashboardMetrics {
  avgSpeedToLead: number;
  connectionRate: number;
  bookingRate: number;
  callsToday: number;
  leadsContacted: number;
  responseRate: number;
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

type DateRangeOption = 'today' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';
type ModalType = 'leads' | 'calls' | 'appointments' | null;

const DATE_RANGE_OPTIONS: { value: DateRangeOption; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { selectedTenantId, selectedTenant, isGlobalView, loading: tenantLoading } = useTenant();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangeOption>('last_30_days');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [chartMode, setChartMode] = useState<'daily' | 'cumulative'>('cumulative');
  const [todayIndex, setTodayIndex] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<Lead[] | Call[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Sign-in prompt modal
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);

  // Calendar popover state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Current time state for timezone display
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Don't fetch while tenants are still loading
    if (tenantLoading) {
      return;
    }

    // Fetch data based on tenant selection
    if (isGlobalView) {
      // Global view - fetch all data
      fetchMetrics(null);
      fetchChartData(null);
    } else if (selectedTenantId) {
      // Specific tenant selected
      fetchMetrics(selectedTenantId);
      fetchChartData(selectedTenantId);
    }
    // If neither condition is true, we're in a loading/initialization state
  }, [selectedTenantId, isGlobalView, dateRange, customDateRange, tenantLoading]);

  async function fetchMetrics(tenantId: string | null) {
    try {
      setLoading(true);

      // Get tenant timezone or default to Sydney
      const tenantTimezone = selectedTenant?.timezone || 'Australia/Sydney';

      const { start, end } = getDateRangeForTenant(
        dateRange === 'today' ? 'today' :
        dateRange === 'last_7_days' ? '7days' :
        dateRange === 'last_30_days' ? '30days' :
        dateRange === 'last_90_days' ? '90days' :
        'custom',
        tenantTimezone,
        customDateRange
      );

      // Get today's date range for callsToday metric in tenant timezone
      const todayRange = getDateRangeForTenant('today', tenantTimezone);
      const todayStart = todayRange.start;
      const todayEnd = todayRange.end;

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

      // Get calls today
      let callsTodayQuery = supabase
        .from('calls')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      if (tenantId) {
        callsTodayQuery = callsTodayQuery.eq('tenant_id', tenantId);
      }

      const { count: callsTodayCount } = await callsTodayQuery;

      const totalCalls = callsData?.length || 0;
      const callsToday = callsTodayCount || 0;

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

      // Calculate leads contacted (unique lead_ids with at least one call)
      const uniqueLeadIds = new Set(callsData?.map(call => call.lead_id).filter(id => id !== null) || []);
      const leadsContacted = uniqueLeadIds.size;

      // Calculate response rate (leads contacted / total leads)
      const responseRate = leadsCount && leadsCount > 0 ? (leadsContacted / leadsCount) * 100 : 0;

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
        callsToday,
        leadsContacted,
        responseRate: Math.round(responseRate * 10) / 10,
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
        callsToday: 0,
        leadsContacted: 0,
        responseRate: 0,
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
      // Get tenant timezone or default to Sydney
      const tenantTimezone = selectedTenant?.timezone || 'Australia/Sydney';

      const { start, end } = getDateRangeForTenant(
        dateRange === 'today' ? 'today' :
        dateRange === 'last_7_days' ? '7days' :
        dateRange === 'last_30_days' ? '30days' :
        dateRange === 'last_90_days' ? '90days' :
        'custom',
        tenantTimezone,
        customDateRange
      );

      const today = new Date();
      const todayStr = getLocalDateKey(today, tenantTimezone);

      console.log('=== TIMEZONE-AWARE DATE RANGE ===');
      console.log('Tenant timezone:', tenantTimezone);
      console.log('Query range (UTC):', { start: start.toISOString(), end: end.toISOString() });
      console.log('Display range (local):', {
        start: formatInTenantTime(start, tenantTimezone, 'yyyy-MM-dd HH:mm'),
        end: formatInTenantTime(end, tenantTimezone, 'yyyy-MM-dd HH:mm')
      });
      console.log('Selected tenant ID:', tenantId);
      console.log('Today string (tenant local):', todayStr);

      let leadsChartQuery = supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at');

      if (tenantId) {
        leadsChartQuery = leadsChartQuery.eq('tenant_id', tenantId);
      }

      const { data: leads, error: leadsError } = await leadsChartQuery;

      console.log('Leads query result:', { count: leads?.length, error: leadsError, data: leads });

      let callsChartQuery = supabase
        .from('calls')
        .select('created_at, state, disposition, talk_time_seconds')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at');

      if (tenantId) {
        callsChartQuery = callsChartQuery.eq('tenant_id', tenantId);
      }

      const { data: calls, error: callsError } = await callsChartQuery;

      console.log('Calls query result:', { count: calls?.length, error: callsError, data: calls });

      const dataByDate: Record<string, ChartDataPoint> = {};
      let foundTodayIndex: string | null = null;

      // Create date buckets using TENANT timezone
      const dateKeys = getDateKeysInRange(start, end, tenantTimezone);

      dateKeys.forEach(dateStr => {
        const isToday = dateStr === todayStr;
        // Parse the date string and format for display in tenant timezone
        const displayDate = formatInTenantTime(dateStr + 'T00:00:00', tenantTimezone, 'MMM d');

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
      });

      setTodayIndex(foundTodayIndex);

      console.log('Date buckets created (tenant TZ):', Object.keys(dataByDate));

      // Match leads using TENANT timezone
      leads?.forEach(lead => {
        const date = getLocalDateKey(lead.created_at, tenantTimezone);
        console.log('Lead created_at:', lead.created_at, '-> Tenant local date:', date);
        if (dataByDate[date]) {
          dataByDate[date].leads++;
        } else {
          console.warn('Lead date not in buckets:', date);
        }
      });

      // Match calls using TENANT timezone
      calls?.forEach(call => {
        const date = getLocalDateKey(call.created_at, tenantTimezone);
        console.log('Call created_at:', call.created_at, '-> Tenant local date:', date);
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
        } else {
          console.warn('Call date not in buckets:', date);
        }
      });

      const chartArray = Object.values(dataByDate)
        .sort((a, b) => a.date.localeCompare(b.date));

      console.log('Final chart data:', chartArray);
      console.log('Chart data summary:', {
        totalDays: chartArray.length,
        totalLeads: chartArray.reduce((sum, d) => sum + d.leads, 0),
        totalCalls: chartArray.reduce((sum, d) => sum + d.calls, 0),
        totalConnections: chartArray.reduce((sum, d) => sum + d.connections, 0),
        totalAppointments: chartArray.reduce((sum, d) => sum + d.appointments, 0),
      });

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

    // Get tenant timezone or default to Sydney
    const tenantTimezone = selectedTenant?.timezone || 'Australia/Sydney';

    const { start, end } = getDateRangeForTenant(
      dateRange === 'today' ? 'today' :
      dateRange === 'last_7_days' ? '7days' :
      dateRange === 'last_30_days' ? '30days' :
      dateRange === 'last_90_days' ? '90days' :
      'custom',
      tenantTimezone,
      customDateRange
    );

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
      const tenantTimezone = selectedTenant?.timezone || 'Australia/Sydney';
      return formatInTenantTime(dateString, tenantTimezone, 'd MMM, h:mm a');
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
    console.log('getDisplayData called:', { chartMode, chartDataLength: chartData.length });

    if (chartMode === 'daily') {
      const dailyData = chartData.map(item => ({
        ...item,
        date: item.displayDate
      }));
      console.log('Returning daily data (first 3 items):', dailyData.slice(0, 3));
      return dailyData;
    }

    let cumLeads = 0;
    let cumCalls = 0;
    let cumConnections = 0;
    let cumAppointments = 0;

    const cumulativeData = chartData.map(item => {
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

    console.log('Returning cumulative data (first 3 items):', cumulativeData.slice(0, 3));
    return cumulativeData;
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

  // Calculate date range label
  const dateRangeLabel = dateRange === 'today' ? 'Today' :
    dateRange === 'last_7_days' ? 'Last 7 Days' :
    dateRange === 'last_30_days' ? 'Last 30 Days' :
    dateRange === 'last_90_days' ? 'Last 90 Days' :
    dateRange === 'custom' && customDateRange ?
      `${customDateRange.from.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - ${customDateRange.to.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}` :
      'Last 30 Days';

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

  const handleDateRangeChange = (value: DateRangeOption) => {
    if (value === 'custom') {
      // Set to custom mode and open calendar
      setDateRange('custom');
      setIsCalendarOpen(true);
      // Initialize temp range with existing custom range if available
      if (customDateRange) {
        setTempDateRange({ from: customDateRange.from, to: customDateRange.to });
      } else {
        setTempDateRange({});
      }
    } else {
      setDateRange(value);
      setCustomDateRange(undefined);
      setIsCalendarOpen(false);
    }
  };

  const handleApplyCustomRange = () => {
    if (tempDateRange.from && tempDateRange.to) {
      setCustomDateRange({ from: tempDateRange.from, to: tempDateRange.to });
      setIsCalendarOpen(false);
    }
  };

  const handleCancelCustomRange = () => {
    setIsCalendarOpen(false);
    setTempDateRange({});
    // If no custom range was set, revert to last 30 days
    if (!customDateRange) {
      setDateRange('last_30_days');
    }
  };

  // Get current local time in tenant timezone
  const tenantTimezone = selectedTenant?.timezone || 'Australia/Sydney';
  const currentLocalTime = formatInTenantTime(currentTime, tenantTimezone, 'h:mm:ss a, MMM d');

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        description={`Performance overview - ${dateRangeLabel}`}
      >
        <div className="flex gap-4 items-center">
          {/* Current Local Time Display */}
          <div className="text-sm text-muted-foreground">
            Current local time: <span className="font-medium text-foreground">{currentLocalTime}</span>
            <span className="ml-1 text-xs">({tenantTimezone})</span>
          </div>

          {/* Date Range Selector or Custom Range Display */}
          {dateRange === 'custom' && customDateRange ? (
            <Button
              variant="outline"
              className="w-[280px] justify-start text-left font-normal"
              onClick={() => setIsCalendarOpen(true)}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(customDateRange.from, 'MMM d, yyyy')} - {format(customDateRange.to, 'MMM d, yyyy')}
            </Button>
          ) : (
            <Select value={dateRange} onValueChange={(v) => handleDateRangeChange(v as DateRangeOption)}>
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
          )}

          {/* Custom Date Range Popover */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <div style={{ display: 'none' }} />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: tempDateRange.from, to: tempDateRange.to }}
                onSelect={(range) => setTempDateRange(range || {})}
                numberOfMonths={2}
                initialFocus
              />
              <div className="p-3 border-t flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelCustomRange}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyCustomRange}
                  disabled={!tempDateRange.from || !tempDateRange.to}
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
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
            {/* Performance Chart - NOW AT TOP */}
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

            {/* Metric Cards Grid - NOW BELOW CHART */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Speed to Lead</CardTitle>
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
            </div>

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