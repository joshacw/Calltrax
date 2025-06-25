
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterOptions } from "@/types";
import { getAgenciesByClientId, getTeamMembers, getDispositions } from "@/services/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Filter, Users, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DashboardFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export const DashboardFilter = ({ onFilterChange }: DashboardFilterProps) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [dispositions, setDispositions] = useState<string[]>([]);
  
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [selectedDispositions, setSelectedDispositions] = useState<string[]>([]);
  const [showAppointmentOnly, setShowAppointmentOnly] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  });

  useEffect(() => {
    // Load available filter options
    if (user) {
      if (user.role === 'admin') {
        // Admin can see all clients
        setClients([
          { id: "1", name: "ABC Company" },
          { id: "2", name: "XYZ Corp" },
        ]);
      } else if (user.clientId) {
        // Client users can only see their own company
        const clientName = user.clientId === "1" ? "ABC Company" : "XYZ Corp";
        setClients([{ id: user.clientId, name: clientName }]);
      }
      
      // Load team members and dispositions
      setTeamMembers(getTeamMembers());
      setDispositions(getDispositions());
    }
  }, [user]);

  useEffect(() => {
    // Update filters when selections change
    onFilterChange({
      agencies: selectedClients, // Keep the same property name for backend compatibility
      locations: [], // Remove locations from filtering
      teamMembers: selectedTeamMembers,
      dateRange,
      dispositions: showAppointmentOnly 
        ? ["Appointment Booked", "Appointment Scheduled", "Set Appointment"] 
        : selectedDispositions,
    });
  }, [
    selectedClients, 
    selectedTeamMembers, 
    selectedDispositions,
    showAppointmentOnly,
    dateRange, 
    onFilterChange
  ]);

  const handleDateRangeChange = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    
    setDateRange({
      start: start.toISOString(),
      end: end.toISOString(),
    });
  };

  const allClients = selectedClients.length === 0 || selectedClients.length === clients.length;
  const allTeamMembers = selectedTeamMembers.length === 0 || selectedTeamMembers.length === teamMembers.length;
  
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-5 h-5 text-muted-foreground" />
        <div className="font-medium">Filters</div>
      </div>
      
      {/* Modified layout: Using a 2-column grid for all filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          {/* Left Column */}
          <div className="grid grid-cols-1 gap-4">
            {/* Show client filter only for admin users */}
            {user?.role === "admin" && (
              <div>
                <Label className="mb-1 block">Client</Label>
                <Select
                  onValueChange={(value) => setSelectedClients(value ? [value] : [])}
                  defaultValue="all">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Right Column */}
          <div className="grid grid-cols-1 gap-4">
            {/* Team Member filter for admin only */}
            {user?.role === "admin" && (
              <div>
                <Label className="mb-1 block">Team Member</Label>
                <Select
                  onValueChange={(value) => setSelectedTeamMembers(value ? [value] : [])}
                  defaultValue="all">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Team Members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Team Members</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Appointment filter for all user types */}
            <div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="appointment-filter" 
                  checked={showAppointmentOnly} 
                  onCheckedChange={(checked) => setShowAppointmentOnly(checked === true)}
                />
                <Label htmlFor="appointment-filter" className="font-medium cursor-pointer">
                  <span className="flex items-center">
                    <CheckSquare className="w-4 h-4 mr-1 text-brand-blue" />
                    Show only appointments
                  </span>
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6 mt-1">
                Filter results to show only calls with "Appointment" in the disposition
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
