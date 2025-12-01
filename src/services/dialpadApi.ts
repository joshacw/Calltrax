/**
 * Dialpad API Integration using Supabase
 * Replaces mock API calls with real Supabase queries
 */

import { supabase } from '@/integrations/supabase/client';

export interface DashboardData {
  avgSpeedToLead: number;
  connectionRate: number;
  bookingRate: number;
  teamPerformance: string;
  totalLeads: number;
  totalCalls: number;
  totalConversations: number;
}

export interface ChartDataPoint {
  date: string;
  leads: number;
  calls: number;
  connections: number;
  appointments: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  dialpad_cc_id: string;
  status: string;
  timezone: string;
  metadata: any;
  created_at: string;
}

/**
 * Fetch dashboard metrics for a specific tenant
 */
export async function getDashboardData(
  dateRange: string,
  contactCenterId?: string,
  tenantId?: string
): Promise<DashboardData> {
  try {
    // If no tenantId provided, get first active tenant
    let activeTenantId = tenantId;
    if (!activeTenantId) {
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('status', 'active')
        .limit(1)
        .single();

      if (tenants) activeTenantId = tenants.id;
    }

    if (!activeTenantId) {
      throw new Error('No active tenant found');
    }

    // Calculate date range
    const daysAgo = dateRange === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Fetch leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', activeTenantId)
      .gte('created_at', startDate.toISOString());

    // Fetch calls
    const { data: calls } = await supabase
      .from('calls')
      .select('status, disposition, started_at, connected_at, lead_id, created_at')
      .eq('tenant_id', activeTenantId)
      .gte('created_at', startDate.toISOString());

    // Fetch leads with first call for speed-to-lead
    const { data: leadsWithCalls } = await supabase
      .from('leads')
      .select(`
        id,
        created_at,
        calls!inner(started_at)
      `)
      .eq('tenant_id', activeTenantId)
      .gte('created_at', startDate.toISOString())
      .not('calls.started_at', 'is', null);

    // Calculate speed-to-lead
    let avgSpeedToLead = 0;
    if (leadsWithCalls && leadsWithCalls.length > 0) {
      const speeds = leadsWithCalls
        .map(lead => {
          const firstCall = lead.calls?.[0];
          if (!firstCall?.started_at) return null;
          const leadTime = new Date(lead.created_at).getTime();
          const callTime = new Date(firstCall.started_at).getTime();
          return (callTime - leadTime) / 1000 / 60; // minutes
        })
        .filter(speed => speed !== null && speed >= 0) as number[];

      if (speeds.length > 0) {
        avgSpeedToLead = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      }
    }

    // Calculate connection rate
    const totalCalls = calls?.length || 0;
    const connectedCalls = calls?.filter(
      call => call.status === 'connected' || call.status === 'completed'
    ).length || 0;
    const connectionRate = totalCalls > 0 ? (connectedCalls / totalCalls) * 100 : 0;

    // Calculate booking rate
    const bookedCalls = calls?.filter(call => call.disposition === 'booked').length || 0;
    const bookingRate = connectedCalls > 0 ? (bookedCalls / connectedCalls) * 100 : 0;

    // Determine team performance
    let teamPerformance = 'On Target';
    if (connectionRate < 50 || bookingRate < 20) {
      teamPerformance = 'Poor';
    } else if (connectionRate < 70 || bookingRate < 30) {
      teamPerformance = 'Average';
    } else if (connectionRate >= 80 && bookingRate >= 40) {
      teamPerformance = 'Good';
    }

    // Count unique conversations (leads that have at least one call)
    const leadsWithCallsSet = new Set(calls?.map(call => call.lead_id).filter(Boolean));

    return {
      avgSpeedToLead: Math.round(avgSpeedToLead * 10) / 10,
      connectionRate: Math.round(connectionRate * 10) / 10,
      bookingRate: Math.round(bookingRate * 10) / 10,
      teamPerformance,
      totalLeads: totalLeads || 0,
      totalCalls: totalCalls,
      totalConversations: leadsWithCallsSet.size,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

/**
 * Fetch chart data for trends
 */
export async function getChartData(
  dateRange: string,
  contactCenterId?: string,
  tenantId?: string
): Promise<ChartDataPoint[]> {
  try {
    // If no tenantId provided, get first active tenant
    let activeTenantId = tenantId;
    if (!activeTenantId) {
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('status', 'active')
        .limit(1)
        .single();

      if (tenants) activeTenantId = tenants.id;
    }

    if (!activeTenantId) {
      return [];
    }

    const daysAgo = dateRange === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Fetch leads by date
    const { data: leads } = await supabase
      .from('leads')
      .select('created_at')
      .eq('tenant_id', activeTenantId)
      .gte('created_at', startDate.toISOString())
      .order('created_at');

    // Fetch calls by date
    const { data: calls } = await supabase
      .from('calls')
      .select('created_at, status, disposition')
      .eq('tenant_id', activeTenantId)
      .gte('created_at', startDate.toISOString())
      .order('created_at');

    // Group by date
    const dataByDate: Record<string, ChartDataPoint> = {};

    leads?.forEach(lead => {
      const date = new Date(lead.created_at).toISOString().split('T')[0];
      if (!dataByDate[date]) {
        dataByDate[date] = { date, leads: 0, calls: 0, connections: 0, appointments: 0 };
      }
      dataByDate[date].leads++;
    });

    calls?.forEach(call => {
      const date = new Date(call.created_at).toISOString().split('T')[0];
      if (!dataByDate[date]) {
        dataByDate[date] = { date, leads: 0, calls: 0, connections: 0, appointments: 0 };
      }
      dataByDate[date].calls++;

      if (call.status === 'connected' || call.status === 'completed') {
        dataByDate[date].connections++;
      }

      if (call.disposition === 'booked') {
        dataByDate[date].appointments++;
      }
    });

    return Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return [];
  }
}

/**
 * Fetch all active tenants
 */
export async function getTenants(): Promise<Tenant[]> {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tenants:', error);
    throw error;
  }
}

/**
 * Fetch metrics for specific tenant
 */
export async function getMetrics(
  dateRange: { start: Date; end: Date },
  contactCenterId?: string,
  tenantId?: string
) {
  try {
    // If no tenantId provided, get first active tenant
    let activeTenantId = tenantId;
    if (!activeTenantId) {
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('status', 'active')
        .limit(1)
        .single();

      if (tenants) activeTenantId = tenants.id;
    }

    if (!activeTenantId) {
      throw new Error('No active tenant found');
    }

    const { data: calls } = await supabase
      .from('calls')
      .select('*')
      .eq('tenant_id', activeTenantId)
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString());

    const totalCalls = calls?.length || 0;
    const connectedCalls = calls?.filter(
      call => call.status === 'connected' || call.status === 'completed'
    ).length || 0;

    return {
      totalCalls,
      connectedCalls,
      connectionRate: totalCalls > 0 ? (connectedCalls / totalCalls) * 100 : 0,
    };
  } catch (error) {
    console.error('Error fetching metrics:', error);
    throw error;
  }
}