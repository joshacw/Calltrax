
import { useState, useEffect } from "react";
import { getDialpadCallCenters } from "@/services/dialpadService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Phone, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DialpadCallCenter {
  id: string;
  name: string;
  channel_id: string;
  created_at: string;
}

interface DialpadCallCentersProps {
  onCreateAgencies: () => void;
}

export const DialpadCallCenters = ({ onCreateAgencies }: DialpadCallCentersProps) => {
  const [callCenters, setCallCenters] = useState<DialpadCallCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCallCenters, setSelectedCallCenters] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCallCenters();
  }, []);

  const fetchCallCenters = async () => {
    setLoading(true);
    try {
      // Get all call centers from Dialpad
      const dialpadCallCenters = await getDialpadCallCenters();
      
      // Get all existing call center IDs from our database
      const { data: existingSettings } = await supabase
        .from('integration_settings')
        .select('settings')
        .eq('integration_type', 'dialpad');
      
      // Create a set of existing call center IDs for quick lookup
      const existingCallCenterIds = new Set(
        existingSettings?.map(setting => {
          // Handle the type more carefully
          const settings = setting.settings;
          if (typeof settings === 'object' && settings !== null && 'call_center_id' in settings) {
            return settings.call_center_id;
          }
          return null;
        }).filter(Boolean) || []
      );
      
      // Filter out call centers that already exist in our system
      const filteredCallCenters = dialpadCallCenters.filter(
        center => !existingCallCenterIds.has(center.id)
      );
      
      setCallCenters(filteredCallCenters);
      
      // Initialize selected state with all call centers selected by default
      const initialSelected: Record<string, boolean> = {};
      filteredCallCenters.forEach(center => {
        initialSelected[center.id] = true;
      });
      setSelectedCallCenters(initialSelected);
    } catch (error) {
      console.error("Error fetching call centers:", error);
      toast.error("Failed to fetch Dialpad call centers", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllChange = (checked: boolean) => {
    const newSelected = { ...selectedCallCenters };
    callCenters.forEach(center => {
      newSelected[center.id] = checked;
    });
    setSelectedCallCenters(newSelected);
  };

  const handleCallCenterChange = (callCenterId: string, checked: boolean) => {
    setSelectedCallCenters(prev => ({
      ...prev,
      [callCenterId]: checked,
    }));
  };

  const createAgenciesForSelectedCallCenters = async () => {
    setCreating(true);
    try {
      // Get selected call centers
      const selectedCenters = callCenters.filter(center => selectedCallCenters[center.id]);
      
      if (selectedCenters.length === 0) {
        toast.info("No call centers selected");
        setCreating(false);
        return;
      }
      
      // Create clients and agencies for each selected call center
      for (const center of selectedCenters) {
        // Create a client
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: center.name,
          })
          .select('id')
          .single();
          
        if (clientError) {
          console.error(`Error creating client for ${center.name}:`, clientError);
          continue;
        }
        
        // Create agency for the client
        const { error: agencyError } = await supabase
          .from('agencies')
          .insert({
            name: `${center.name} Agency`,
            client_id: clientData.id,
          });
          
        if (agencyError) {
          console.error(`Error creating agency for ${center.name}:`, agencyError);
          continue;
        }
        
        // Add integration settings
        const { error: settingsError } = await supabase
          .from('integration_settings')
          .insert({
            client_id: clientData.id,
            integration_type: 'dialpad',
            settings: {
              call_center_id: center.id,
              channel_id: center.channel_id,
            },
          });
          
        if (settingsError) {
          console.error(`Error creating integration settings for ${center.name}:`, settingsError);
          continue;
        }
      }
      
      toast.success(`Created ${selectedCenters.length} new agencies`, {
        description: "Call centers have been imported successfully",
      });
      
      // Refresh the list
      fetchCallCenters();
      
      // Notify parent component
      onCreateAgencies();
    } catch (error) {
      console.error("Error creating agencies:", error);
      toast.error("Failed to create agencies", {
        description: error.message,
      });
    } finally {
      setCreating(false);
    }
  };

  const allSelected = callCenters.length > 0 && 
    callCenters.every(center => selectedCallCenters[center.id]);
  const someSelected = callCenters.some(center => selectedCallCenters[center.id]) && !allSelected;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Available Dialpad Call Centers
        </CardTitle>
        <CardDescription>
          Import existing call centers from your Dialpad account to create agencies
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : callCenters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No new call centers found in your Dialpad account.</p>
            <p className="text-sm mt-2">All existing call centers have already been imported.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2 mb-4 pb-2 border-b">
              <Checkbox 
                id="select-all" 
                checked={allSelected} 
                // Remove the indeterminate property as it's not supported
                onCheckedChange={handleSelectAllChange}
              />
              <label htmlFor="select-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Select All ({callCenters.length})
              </label>
            </div>
            
            <div className="space-y-2">
              {callCenters.map(center => (
                <div key={center.id} className="flex items-center space-x-2 border-b pb-2">
                  <Checkbox 
                    id={`call-center-${center.id}`} 
                    checked={selectedCallCenters[center.id] || false}
                    onCheckedChange={(checked) => handleCallCenterChange(center.id, !!checked)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={`call-center-${center.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {center.name}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      ID: {center.id}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
      {callCenters.length > 0 && (
        <CardFooter>
          <Button 
            onClick={createAgenciesForSelectedCallCenters} 
            disabled={loading || creating || !callCenters.some(center => selectedCallCenters[center.id])}
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Agencies...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Agencies for Selected Call Centers
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
