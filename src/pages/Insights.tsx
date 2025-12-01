import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { CalendarRange, TrendingDown, TrendingUp, AlertTriangle, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface InsightItem {
  type: "warning" | "success" | "info";
  title: string;
  description: string;
  source?: string;
  metric?: string;
  change?: number;
}

interface PeriodMetrics {
  totalCalls: number;
  connectedCalls: number;
  bookedCalls: number;
  connectionRate: number;
  bookingRate: number;
  totalLeads: number;
  avgSpeedToLead: number;
}

const Insights = () => {
  const { profile } = useAuth();
  const { selectedTenantId, isGlobalView, selectedTenant } = useTenant();
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchInsights();
    }
  }, [profile, selectedTenantId, isGlobalView]);

  async function fetchInsights() {
    try {
      setLoading(true);

      // Calculate date ranges for current and previous 7-day periods
      const now = new Date();
      const currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      currentEnd.setHours(23, 59, 59, 999);
      const currentStart = new Date(currentEnd);
      currentStart.setDate(currentEnd.getDate() - 6); // Last 7 days including today
      currentStart.setHours(0, 0, 0, 0);

      const previousEnd = new Date(currentStart);
      previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);
      const previousStart = new Date(previousEnd);
      previousStart.setDate(previousEnd.getDate() - 6);
      previousStart.setHours(0, 0, 0, 0);

      // Fetch metrics for both periods
      const currentMetrics = await fetchPeriodMetrics(currentStart, currentEnd, selectedTenantId);
      const previousMetrics = await fetchPeriodMetrics(previousStart, previousEnd, selectedTenantId);

      // Generate insights based on metric changes
      const generatedInsights = generateInsights(currentMetrics, previousMetrics);

      setInsights(generatedInsights.slice(0, 5)); // Show top 5 insights
    } catch (err) {
      console.error('Error fetching insights:', err);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPeriodMetrics(
    start: Date,
    end: Date,
    tenantId: string | null
  ): Promise<PeriodMetrics> {
    // Fetch calls
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

    // Connection rate = calls with (talk_time_seconds > 0 OR state IN ['hangup','completed','dispositions','connected'])
    const connectedCalls = callsData?.filter(
      call => call.talk_time_seconds > 0 ||
        ['hangup', 'completed', 'dispositions', 'connected'].includes(call.state)
    ).length || 0;

    // Booking rate = calls with disposition containing 'appointment' or 'booked'
    const bookedCalls = callsData?.filter(call => {
      const disp = call.disposition?.toLowerCase() || '';
      return disp.includes('appointment') || disp.includes('booked');
    }).length || 0;

    const connectionRate = totalCalls > 0 ? (connectedCalls / totalCalls) * 100 : 0;
    const bookingRate = connectedCalls > 0 ? (bookedCalls / connectedCalls) * 100 : 0;

    // Fetch leads
    let leadsQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (tenantId) {
      leadsQuery = leadsQuery.eq('tenant_id', tenantId);
    }

    const { count: leadsCount } = await leadsQuery;

    // Calculate speed to lead
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

    return {
      totalCalls,
      connectedCalls,
      bookedCalls,
      connectionRate,
      bookingRate,
      totalLeads: leadsCount || 0,
      avgSpeedToLead,
    };
  }

  function generateInsights(current: PeriodMetrics, previous: PeriodMetrics): InsightItem[] {
    const insights: InsightItem[] = [];
    const sourceName = isGlobalView ? "All Tenants" : (selectedTenant?.name || "Tenant");

    // Connection rate insight (threshold: 5%)
    const connectionRateChange = current.connectionRate - previous.connectionRate;
    if (Math.abs(connectionRateChange) > 5 && previous.totalCalls > 0) {
      insights.push({
        type: connectionRateChange > 0 ? "success" : "warning",
        title: `Connection Rate ${connectionRateChange > 0 ? "Improving" : "Declining"}`,
        description: `Connection rate ${connectionRateChange > 0 ? "increased" : "decreased"} from ${previous.connectionRate.toFixed(1)}% to ${current.connectionRate.toFixed(1)}% compared to previous period.`,
        source: sourceName,
        metric: "Connection Rate",
        change: connectionRateChange
      });
    }

    // Booking rate insight (threshold: 3%)
    const bookingRateChange = current.bookingRate - previous.bookingRate;
    if (Math.abs(bookingRateChange) > 3 && previous.connectedCalls > 0) {
      insights.push({
        type: bookingRateChange > 0 ? "success" : "warning",
        title: `Booking Rate ${bookingRateChange > 0 ? "Improving" : "Declining"}`,
        description: `Booking rate ${bookingRateChange > 0 ? "increased" : "decreased"} from ${previous.bookingRate.toFixed(1)}% to ${current.bookingRate.toFixed(1)}% compared to previous period.`,
        source: sourceName,
        metric: "Booking Rate",
        change: bookingRateChange
      });
    }

    // Lead volume insight (threshold: 10%)
    if (previous.totalLeads > 0) {
      const leadVolumeChangePercent = ((current.totalLeads - previous.totalLeads) / previous.totalLeads) * 100;
      if (Math.abs(leadVolumeChangePercent) > 10) {
        insights.push({
          type: leadVolumeChangePercent > 0 ? "success" : "warning",
          title: `Lead Volume ${leadVolumeChangePercent > 0 ? "Increasing" : "Decreasing"}`,
          description: `Lead volume changed from ${previous.totalLeads} to ${current.totalLeads} leads (${leadVolumeChangePercent > 0 ? '+' : ''}${leadVolumeChangePercent.toFixed(1)}%).`,
          source: sourceName,
          metric: "Lead Volume",
          change: leadVolumeChangePercent
        });
      }
    }

    // Speed to lead insight
    if (previous.avgSpeedToLead > 0 && current.avgSpeedToLead > 0) {
      const speedChange = current.avgSpeedToLead - previous.avgSpeedToLead;
      const speedChangePercent = (speedChange / previous.avgSpeedToLead) * 100;

      if (Math.abs(speedChangePercent) > 10) {
        // Note: Lower speed to lead is better, so signs are inverted
        insights.push({
          type: speedChange < 0 ? "success" : "warning",
          title: `Speed to Lead ${speedChange < 0 ? "Improving" : "Declining"}`,
          description: `Average speed to lead changed from ${previous.avgSpeedToLead.toFixed(1)} to ${current.avgSpeedToLead.toFixed(1)} minutes (${speedChange < 0 ? '' : '+'}${speedChange.toFixed(1)} min).`,
          source: sourceName,
          metric: "Speed to Lead",
          change: -speedChangePercent // Invert so improvement shows positive
        });
      }
    }

    // Overall performance insight
    if (current.totalCalls > 0) {
      const callVolumeChange = previous.totalCalls > 0
        ? ((current.totalCalls - previous.totalCalls) / previous.totalCalls) * 100
        : 0;

      if (current.connectionRate >= 60 && current.bookingRate >= 30) {
        insights.push({
          type: "success",
          title: "Strong Performance Metrics",
          description: `Excellent performance with ${current.connectionRate.toFixed(1)}% connection rate and ${current.bookingRate.toFixed(1)}% booking rate across ${current.totalCalls} calls.`,
          source: sourceName
        });
      } else if (current.connectionRate < 40 || current.bookingRate < 20) {
        insights.push({
          type: "warning",
          title: "Performance Below Target",
          description: `Performance metrics need attention. Connection rate: ${current.connectionRate.toFixed(1)}%, Booking rate: ${current.bookingRate.toFixed(1)}%. Consider reviewing call strategies.`,
          source: sourceName
        });
      }
    }

    // No data insight
    if (current.totalCalls === 0 && current.totalLeads === 0) {
      insights.push({
        type: "info",
        title: "No Activity This Period",
        description: "No calls or leads recorded in the last 7 days. This may be normal for new tenants or indicate a setup issue.",
        source: sourceName
      });
    }

    return insights;
  }

  if (loading) {
    return (
      <Layout>
        <PageHeader
          title="Performance Insights"
          description="AI-powered analysis of call center performance metrics"
        />
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Performance Insights"
        description={`AI-powered analysis comparing the last 7 days vs the previous 7 days${isGlobalView ? " across all tenants" : selectedTenant ? ` for ${selectedTenant.name}` : ""}`}
      />

      <div className="space-y-6">

        {insights.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              No significant insights detected for the current period. Insights are generated when metrics change by more than the threshold (Connection Rate: 5%, Booking Rate: 3%, Lead Volume: 10%).
            </div>
          </Card>
        ) : (
          <Card>
            <CardContent className="my-0 py-[20px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, index) => (
                  <InsightItem key={index} insight={insight} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

const InsightItem = ({ insight }: { insight: InsightItem }) => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
      {insight.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />}
      {insight.type === "success" && <TrendingUp className="h-5 w-5 text-emerald-500 mt-0.5" />}
      {insight.type === "info" && <TrendingDown className="h-5 w-5 text-blue-500 mt-0.5" />}
      <div className="flex-1">
        <div className="font-medium mb-1 flex items-center gap-2">
          {insight.title}
          <Badge variant={insight.type === "warning" ? "destructive" : insight.type === "success" ? "default" : "secondary"}>
            {insight.type === "warning" ? "Needs Attention" : insight.type === "success" ? "Outstanding" : "Improving"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{insight.description}</p>
        {(insight.source || insight.metric) && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
            {insight.source && (
              <span className="flex items-center">
                <Award className="h-3 w-3 mr-1" />
                {insight.source}
              </span>
            )}
            {insight.metric && (
              <span className="flex items-center">
                <Award className="h-3 w-3 mr-1" />
                {insight.metric}
              </span>
            )}
            {insight.change !== undefined && (
              <span className={`flex items-center ${insight.change > 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {insight.change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {insight.change > 0 ? '+' : ''}{insight.change.toFixed(1)}%
              </span>
            )}
            <span className="flex items-center">
              <CalendarRange className="h-3 w-3 mr-1" />
              Last 7 days vs Previous 7 days
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Insights;
