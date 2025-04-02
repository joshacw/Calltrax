
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterOptions } from "@/types";
import { getAgenciesByClientId, getLocationsByClientId, getTeamMembers } from "@/services/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

interface DashboardFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export const DashboardFilter = ({ onFilterChange }: DashboardFilterProps) => {
  const { user } = useAuth();
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  });

  useEffect(() => {
    // Load available filter options
    if (user && user.clientId) {
      const clientAgencies = getAgenciesByClientId(user.clientId);
      setAgencies(clientAgencies.map(a => ({ id: a.id, name: a.name })));
      
      const clientLocations = getLocationsByClientId(user.clientId);
      setLocations(clientLocations);
    } else {
      // Admin can see all agencies and locations
      // In a real app, this would load from a service
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
    }
    
    setTeamMembers(getTeamMembers());
  }, [user]);

  useEffect(() => {
    // Update filters when selections change
    onFilterChange({
      agencies: selectedAgencies,
      locations: selectedLocations,
      teamMembers: selectedTeamMembers,
      dateRange,
    });
  }, [selectedAgencies, selectedLocations, selectedTeamMembers, dateRange, onFilterChange]);

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
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
      <div className="font-medium">Filters</div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          className={allAgencies ? "bg-secondary" : ""}
          onClick={() => setSelectedAgencies([])}
        >
          All Agencies
        </Button>
        
        <Button 
          variant="outline" 
          className={allLocations ? "bg-secondary" : ""}
          onClick={() => setSelectedLocations([])}
        >
          All Locations
        </Button>
        
        <Button 
          variant="outline" 
          className={allTeamMembers ? "bg-secondary" : ""}
          onClick={() => setSelectedTeamMembers([])}
        >
          All Team Members
        </Button>
        
        <Button 
          variant="outline" 
          className={dateRange.start === new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() ? "bg-secondary" : ""}
          onClick={() => handleDateRangeChange(7)}
        >
          Last 7 Days
        </Button>
      </div>
    </div>
  );
};
