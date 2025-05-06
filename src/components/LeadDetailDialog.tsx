
import { useState } from "react";
import { Lead } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { PhoneCall, Calendar, ArrowRight, X } from "lucide-react";

interface LeadDetailDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LeadDetailDialog = ({ lead, open, onOpenChange }: LeadDetailDialogProps) => {
  const [loading, setLoading] = useState(false);
  
  const handleBookAppointment = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {lead.firstName && lead.lastName 
              ? `${lead.firstName} ${lead.lastName}`
              : lead.contactId}
          </DialogTitle>
          <DialogDescription>
            {lead.contactNumber}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Notification Time</h4>
              <p className="text-sm">{format(new Date(lead.timeOfNotification), "PPpp")}</p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(lead.timeOfNotification))} ago
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Location</h4>
              <p className="text-sm">{lead.location}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Speed to Lead</h4>
              <p className="text-sm">
                {lead.speedToLead !== null
                  ? `${lead.speedToLead} seconds`
                  : "Not contacted yet"}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <p className="text-sm">
                {lead.appointmentBooked
                  ? "Appointment Booked"
                  : lead.connected
                  ? "Connected"
                  : lead.numberOfCalls > 0
                  ? "Attempted Contact"
                  : "New Lead"}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Calls</h4>
              <p className="text-sm">{lead.numberOfCalls}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Conversations</h4>
              <p className="text-sm">{lead.numberOfConversations}</p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex sm:justify-between">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2"
          >
            <X size={16} />
            <span>Close</span>
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <PhoneCall size={16} />
              <span>Call Lead</span>
            </Button>
            
            <Button 
              onClick={handleBookAppointment} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Calendar size={16} />
              <span>Book Appointment</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
