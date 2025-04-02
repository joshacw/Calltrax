
import { Layout } from "@/components/Layout";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Call, FilterOptions } from "@/types";
import { useEffect, useState } from "react";
import { DashboardFilter } from "@/components/DashboardFilter";
import { Button } from "@/components/ui/button";
import { ExternalLink, Phone, Loader2, CheckCircle, XCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CallsPage = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    agencies: [],
    locations: [],
    teamMembers: [],
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
  });

  useEffect(() => {
    fetchCalls();
  }, [filters]);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      // Base query
      let query = supabase
        .from('calls')
        .select(`
          id,
          lead_id,
          contact_number,
          direction,
          duration,
          public_share_link,
          disposition,
          notes,
          timestamp,
          agent_connected,
          leads!inner(agency_id)
        `)
        .gte('timestamp', filters.dateRange.start)
        .lte('timestamp', filters.dateRange.end)
        .order('timestamp', { ascending: false });
      
      // Apply agency filter if selected
      if (filters.agencies && filters.agencies.length > 0) {
        query = query.in('leads.agency_id', filters.agencies);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching calls:", error);
        toast.error("Failed to fetch calls");
        setLoading(false);
        return;
      }
      
      // Format the data to match our Call type
      const formattedCalls: Call[] = data.map(item => ({
        id: item.id,
        leadId: item.lead_id,
        contactNumber: item.contact_number,
        direction: item.direction as 'inbound' | 'outbound',
        duration: item.duration,
        publicShareLink: item.public_share_link,
        disposition: item.disposition || 'Not Set',
        notes: item.notes || '',
        timestamp: item.timestamp,
        agentConnected: item.agent_connected
      }));
      
      setCalls(formattedCalls);
    } catch (err) {
      console.error("Error in fetchCalls:", err);
      toast.error("Failed to load call data");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Call Activity</h1>
        
        <DashboardFilter onFilterChange={handleFilterChange} />
        
        <div className="rounded-md border">
          <Table>
            <TableCaption>Call data for the selected filters</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Call ID</TableHead>
                <TableHead>Contact Number</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Agent Connected</TableHead>
                <TableHead>Disposition</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Recording</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading call data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : calls.length > 0 ? (
                calls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-mono text-xs">{call.id.substring(0, 8)}...</TableCell>
                    <TableCell>{call.contactNumber}</TableCell>
                    <TableCell className="capitalize">{call.direction}</TableCell>
                    <TableCell>{formatDuration(call.duration)}</TableCell>
                    <TableCell>{formatTime(call.timestamp)}</TableCell>
                    <TableCell>
                      {call.agentConnected ? 
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span>Yes</span>
                        </div> : 
                        <div className="flex items-center text-gray-400">
                          <XCircle className="h-4 w-4 mr-1" />
                          <span>No</span>
                        </div>
                      }
                    </TableCell>
                    <TableCell>{call.disposition}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{call.notes}</TableCell>
                    <TableCell>
                      {call.publicShareLink ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a 
                            href={call.publicShareLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink size={14} />
                            <span>Play</span>
                          </a>
                        </Button>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6">
                    No calls found for the selected filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

const ProtectedCallsPage = () => (
  <ProtectedRoute allowedRoles={["admin"]}>
    <CallsPage />
  </ProtectedRoute>
);

export default ProtectedCallsPage;
