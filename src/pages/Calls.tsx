
import { Layout } from "@/components/Layout";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFilteredCalls } from "@/services/mockData";
import { Call, FilterOptions } from "@/types";
import { useEffect, useState } from "react";
import { DashboardFilter } from "@/components/DashboardFilter";
import { Button } from "@/components/ui/button";
import { ExternalLink, Phone } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const CallsPage = () => {
  const [calls, setCalls] = useState<Call[]>([]);
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
    // In a real app, this would fetch calls based on filters
    const filteredCalls = getFilteredCalls(
      undefined, // leadIds - we would derive this from other filters
      filters.dateRange
    );
    setCalls(filteredCalls);
  }, [filters]);

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
                <TableHead>Disposition</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Recording</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell>{call.id}</TableCell>
                  <TableCell>{call.contactNumber}</TableCell>
                  <TableCell className="capitalize">{call.direction}</TableCell>
                  <TableCell>{formatDuration(call.duration)}</TableCell>
                  <TableCell>{formatTime(call.timestamp)}</TableCell>
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
              ))}
              {calls.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">No calls found</TableCell>
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
