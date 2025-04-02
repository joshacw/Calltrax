
import { Layout } from "@/components/Layout";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFilteredLeads } from "@/services/mockData";
import { FilterOptions, Lead } from "@/types";
import { useEffect, useState } from "react";
import { DashboardFilter } from "@/components/DashboardFilter";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const LeadsPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
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
    // In a real app, this would fetch leads based on filters
    const filteredLeads = getFilteredLeads(
      filters.agencies,
      filters.locations,
      filters.dateRange
    );
    setLeads(filteredLeads);
  }, [filters]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "N/A";
    return new Date(timeStr).toLocaleString();
  };

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Leads Information</h1>
        
        <DashboardFilter onFilterChange={handleFilterChange} />
        
        <div className="rounded-md border">
          <Table>
            <TableCaption>Leads data for the selected filters</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Contact ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact Number</TableHead>
                <TableHead>Notification Time</TableHead>
                <TableHead>First Call Time</TableHead>
                <TableHead>Speed to Lead</TableHead>
                <TableHead># of Calls</TableHead>
                <TableHead># of Conversations</TableHead>
                <TableHead>Connected</TableHead>
                <TableHead>Appointment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.contactId}</TableCell>
                  <TableCell>{lead.location}</TableCell>
                  <TableCell>{lead.contactNumber}</TableCell>
                  <TableCell>{formatTime(lead.timeOfNotification)}</TableCell>
                  <TableCell>{formatTime(lead.timeOfFirstCall)}</TableCell>
                  <TableCell>{lead.speedToLead ? `${lead.speedToLead} mins` : "N/A"}</TableCell>
                  <TableCell>{lead.numberOfCalls}</TableCell>
                  <TableCell>{lead.numberOfConversations}</TableCell>
                  <TableCell>{lead.connected ? "Yes" : "No"}</TableCell>
                  <TableCell>{lead.appointmentBooked ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">No leads found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

const ProtectedLeadsPage = () => (
  <ProtectedRoute allowedRoles={["admin"]}>
    <LeadsPage />
  </ProtectedRoute>
);

export default ProtectedLeadsPage;
