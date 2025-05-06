
import { Lead } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Info } from "lucide-react";

interface LeadInfoPanelProps {
  lead: Lead;
}

export const LeadInfoPanel = ({ lead }: LeadInfoPanelProps) => {
  return (
    <Card>
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5 text-muted-foreground" />
          Lead Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {(lead.firstName || lead.lastName) && (
            <div className="px-4 py-3">
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p className="text-sm mt-1">{`${lead.firstName || ''} ${lead.lastName || ''}`}</p>
            </div>
          )}
          
          <div className="px-4 py-3">
            <h3 className="text-sm font-medium text-muted-foreground">Contact ID</h3>
            <p className="text-sm mt-1">{lead.contactId || `Lead-${lead.id.substring(0, 8)}`}</p>
          </div>
          
          <div className="px-4 py-3">
            <h3 className="text-sm font-medium text-muted-foreground">Contact Number</h3>
            <p className="text-sm mt-1">{lead.contactNumber}</p>
          </div>
          
          <div className="px-4 py-3">
            <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
            <p className="text-sm mt-1">{lead.location}</p>
          </div>
          
          <div className="px-4 py-3">
            <h3 className="text-sm font-medium text-muted-foreground">Time of Notification</h3>
            <p className="text-sm mt-1">
              {new Date(lead.timeOfNotification).toLocaleString()}
              <span className="text-xs text-muted-foreground ml-2">
                ({formatDistanceToNow(new Date(lead.timeOfNotification))} ago)
              </span>
            </p>
          </div>
          
          {lead.timeOfFirstCall && (
            <div className="px-4 py-3">
              <h3 className="text-sm font-medium text-muted-foreground">First Response</h3>
              <p className="text-sm mt-1">
                {new Date(lead.timeOfFirstCall).toLocaleString()}
                <span className="text-xs text-muted-foreground ml-2">
                  ({formatDistanceToNow(new Date(lead.timeOfFirstCall))} ago)
                </span>
              </p>
            </div>
          )}
          
          {lead.speedToLead !== null && (
            <div className="px-4 py-3">
              <h3 className="text-sm font-medium text-muted-foreground">Speed to Lead</h3>
              <p className="text-sm mt-1">{lead.speedToLead} minutes</p>
            </div>
          )}
          
          <div className="px-4 py-3">
            <h3 className="text-sm font-medium text-muted-foreground">Number of Calls</h3>
            <p className="text-sm mt-1">{lead.numberOfCalls}</p>
          </div>
          
          <div className="px-4 py-3">
            <h3 className="text-sm font-medium text-muted-foreground">Connected</h3>
            <p className="text-sm mt-1">{lead.connected ? "Yes" : "No"}</p>
          </div>
          
          <div className="px-4 py-3">
            <h3 className="text-sm font-medium text-muted-foreground">Appointment Booked</h3>
            <p className="text-sm mt-1">{lead.appointmentBooked ? "Yes" : "No"}</p>
          </div>
          
          {lead.appointmentBooked && (
            <div className="px-4 py-3">
              <h3 className="text-sm font-medium text-muted-foreground">Booking Link</h3>
              <a 
                href="#" 
                className="text-sm mt-1 text-primary hover:underline block"
                onClick={(e) => {
                  e.preventDefault();
                  // In a real app, this would link to the booking page
                  alert("In a real app, this would link to the meeting booking page");
                }}
              >
                Book meeting
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
