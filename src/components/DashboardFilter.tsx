
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterOptions } from "@/types";
import { getAgenciesByClientId, getLocationsByClientId, getTeamMembers, getDispositions } from "@/services/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { CalendarRange, Filter, MapPin, Users, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DashboardFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export const DashboardFilter = ({ onFilterChange }: DashboardFilterProps) => {
  const { user } = useAuth();
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [dispositions, setDispositions] = useState<string[]>([]);
  
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
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
      if (user.clientId) {
        const clientAgencies = getAgenciesByClientId(user.clientId);
        setAgencies(clientAgencies.map(a => ({ id: a.id, name: a.name })));
        
        const clientLocations = getLocationsByClientId(user.clientId);
        setLocations(clientLocations);
      } else if (user.role === 'admin') {
        // Admin can see all agencies and locations
        setAgencies([
          { id: "1", name: "ABC North" },
          { id: "2", name: "ABC South" },
          { id: "3", name: "XYZ West" },
          { id: "4", name: "XYZ East" },
        ]);
        
        setLocations([
          "New York", "Boston", "Miami", "Atlanta", 
          "Los Angeles", "San Francisco", "Chicago", "Philadelphia"
        ]);
      } else if (user.role === 'agency' && user.agencyId) {
        // Agency users can only see their own locations
        const agency = getAgenciesByClientId(user.agencyId)[0];
        if (agency) {
          setLocations(agency.locations);
        }
      }
      
      // Load team members and dispositions
      setTeamMembers(getTeamMembers());
      setDispositions(getDispositions());
    }
  }, [user]);

  useEffect(() => {
    // Update filters when selections change
    onFilterChange({
      agencies: selectedAgencies,
      locations: selectedLocations,
      teamMembers: selectedTeamMembers,
      dateRange,
      dispositions: showAppointmentOnly 
        ? ["Appointment Booked", "Appointment Scheduled", "Set Appointment"] 
        : selectedDispositions,
    });
  }, [
    selectedAgencies, 
    selectedLocations, 
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

  const allAgencies = selectedAgencies.length === 0 || selectedAgencies.length === agencies.length;
  const allLocations = selectedLocations.length === 0 || selectedLocations.length === locations.length;
  const allTeamMembers = selectedTeamMembers.length === 0 || selectedTeamMembers.length === teamMembers.length;
  
  return (
    <div className="flex flex-col mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-5 h-5 text-muted-foreground" />
        <div className="font-medium">Filters</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Show agency filter only for admin users */}
        {user?.role === "admin" && (
          <div>
            <Label className="mb-1 block">Agency</Label>
            <Select
              onValueChange={(value) => setSelectedAgencies(value ? [value] : [])}
              defaultValue="all">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Agencies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agencies</SelectItem>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Location filter for all user types */}
        <div>
          <Label className="mb-1 block">Location</Label>
          <Select
            onValueChange={(value) => setSelectedLocations(value ? [value] : [])}
            defaultValue="all">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
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
      </div>
      
      {/* Disposition filter for all user types */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
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
        <p className="text-xs text-muted-foreground ml-6">
          Filter results to show only calls with "Appointment" in the disposition
        </p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline"
          className={dateRange.start === new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() ? "bg-secondary" : ""}
          onClick={() => handleDateRangeChange(7)}
          size="sm"
        >
          <CalendarRange className="mr-2 h-4 w-4" />
          Last 7 Days
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => handleDateRangeChange(30)}
          size="sm"
        >
          <CalendarRange className="mr-2 h-4 w-4" />
          Last 30 Days
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => handleDateRangeChange(90)}
          size="sm"
        >
          <CalendarRange className="mr-2 h-4 w-4" />
          Last 90 Days
        </Button>
      </div>
    </div>
  );
};
