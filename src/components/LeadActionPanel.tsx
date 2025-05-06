
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Calendar as CalendarIcon, MessageSquare, FileText, PhoneCall } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Lead } from "@/types";
import { Badge } from "./ui/badge";

interface LeadActionPanelProps {
  onAddActivity: (activity: any) => void;
  lead: Lead;
}

export const LeadActionPanel = ({ onAddActivity, lead }: LeadActionPanelProps) => {
  const [activeTab, setActiveTab] = useState("note");
  const [noteContent, setNoteContent] = useState("");
  const [smsContent, setSmsContent] = useState("");
  const [callbackDate, setCallbackDate] = useState<Date | undefined>(undefined);
  const [callbackNotes, setCallbackNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = () => {
    if (!noteContent.trim()) {
      toast.error("Please enter a note");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newActivity = {
        id: Date.now().toString(),
        type: 'note',
        timestamp: new Date().toISOString(),
        content: noteContent
      };
      
      onAddActivity(newActivity);
      setNoteContent("");
      setIsSubmitting(false);
      toast.success("Note added successfully");
    }, 500);
  };

  const handleSendSMS = () => {
    if (!smsContent.trim()) {
      toast.error("Please enter an SMS message");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newActivity = {
        id: Date.now().toString(),
        type: 'sms',
        timestamp: new Date().toISOString(),
        content: `SMS sent: "${smsContent}"`
      };
      
      onAddActivity(newActivity);
      setSmsContent("");
      setIsSubmitting(false);
      toast.success("SMS sent successfully", {
        description: `Message sent to ${lead.contactNumber}`
      });
    }, 800);
  };

  const handleScheduleCallback = () => {
    if (!callbackDate) {
      toast.error("Please select a callback date");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const formattedDate = format(callbackDate, "MMMM dd");
      const newActivity = {
        id: Date.now().toString(),
        type: 'callback',
        timestamp: callbackDate.toISOString(),
        content: `Call back scheduled for ${formattedDate}${callbackNotes ? `: ${callbackNotes}` : ''}`,
        status: 'scheduled'
      };
      
      onAddActivity(newActivity);
      setCallbackDate(undefined);
      setCallbackNotes("");
      setIsSubmitting(false);
      toast.success("Callback scheduled successfully", {
        description: `Scheduled for ${formattedDate}`
      });
    }, 800);
  };

  const handleMakeCall = () => {
    toast.info("Call functionality", {
      description: "In a real app, this would initiate a call to the lead"
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <Tabs defaultValue="note" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="note" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Add Note</span>
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Send SMS</span>
              </TabsTrigger>
              <TabsTrigger value="callback" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Schedule Callback</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="note" className="space-y-4">
              <Textarea 
                placeholder="Add a note about this lead..." 
                className="min-h-[120px]"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleAddNote} 
                  disabled={isSubmitting || !noteContent.trim()}
                >
                  {isSubmitting ? "Adding note..." : "Add note"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="sms" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>To: {lead.contactNumber}</Label>
                  <Badge variant="outline" className="text-xs">SMS</Badge>
                </div>
                <Textarea 
                  placeholder="Type your SMS message..." 
                  className="min-h-[120px]"
                  value={smsContent}
                  onChange={(e) => setSmsContent(e.target.value)}
                />
                {smsContent && (
                  <div className="text-xs text-muted-foreground text-right">
                    {smsContent.length} characters
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handleSendSMS} 
                  disabled={isSubmitting || !smsContent.trim()}
                >
                  {isSubmitting ? "Sending..." : "Send SMS"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="callback" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Callback Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !callbackDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {callbackDate ? format(callbackDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={callbackDate}
                        onSelect={setCallbackDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea 
                    placeholder="Add notes about this callback..." 
                    value={callbackNotes}
                    onChange={(e) => setCallbackNotes(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleScheduleCallback} 
                  disabled={isSubmitting || !callbackDate}
                >
                  {isSubmitting ? "Scheduling..." : "Schedule Callback"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex justify-between pt-4 border-t mt-4">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleMakeCall}
          >
            <PhoneCall className="h-4 w-4" />
            Call Lead
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            Back to Leads
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
