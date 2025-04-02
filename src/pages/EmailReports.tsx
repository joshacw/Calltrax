
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { EmailReportPreference, getEmailReportPreferences, getTeamMembers, saveEmailReportPreferences, sendPerformanceReport, TeamMember } from "@/services/emailService";
import { getDashboardMetrics } from "@/services/mockData";
import { Calendar, Clock, Mail, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  timeOfDay: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Please enter a valid time in 24-hour format (e.g., 08:00)"),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  recipients: z.array(z.string()),
});

const EmailReportsPage = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enabled: false,
      frequency: "weekly",
      timeOfDay: "08:00",
      dayOfWeek: 1, // Monday
      recipients: [],
    },
  });
  
  useEffect(() => {
    if (user?.clientId) {
      // Load team members
      const members = getTeamMembers(user.clientId);
      setTeamMembers(members);
      
      // Load email preferences
      const prefs = getEmailReportPreferences(user.clientId);
      form.reset({
        enabled: prefs.enabled,
        frequency: prefs.frequency,
        timeOfDay: prefs.timeOfDay || "08:00",
        dayOfWeek: prefs.dayOfWeek || 1,
        dayOfMonth: prefs.dayOfMonth || 1,
        recipients: prefs.recipients || [],
      });
    }
  }, [user, form]);
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!user?.clientId) return;
    
    // Save preferences
    const prefs: EmailReportPreference = {
      enabled: values.enabled,
      frequency: values.frequency,
      recipients: values.recipients,
      timeOfDay: values.timeOfDay,
    };
    
    if (values.frequency === "weekly") {
      prefs.dayOfWeek = values.dayOfWeek;
    }
    
    if (values.frequency === "monthly") {
      prefs.dayOfMonth = values.dayOfMonth;
    }
    
    saveEmailReportPreferences(user.clientId, prefs);
    toast.success("Email report preferences saved successfully");
  };
  
  const handleToggleRecipient = (email: string) => {
    const currentRecipients = form.getValues("recipients");
    
    if (currentRecipients.includes(email)) {
      form.setValue("recipients", currentRecipients.filter(r => r !== email));
    } else {
      form.setValue("recipients", [...currentRecipients, email]);
    }
  };
  
  const handleSendTestEmail = async () => {
    if (!user?.clientId) return;
    
    const recipients = form.getValues("recipients");
    if (recipients.length === 0) {
      toast.error("Please select at least one recipient for the test email");
      return;
    }
    
    setIsSending(true);
    
    try {
      // Get mock metrics data
      const metrics = getDashboardMetrics();
      
      // Send test email
      const success = await sendPerformanceReport(
        recipients,
        user.name,
        metrics,
        form.getValues("frequency") === "daily" ? "daily" : "weekly"
      );
      
      if (success) {
        toast.success("Test email sent successfully");
      } else {
        toast.error("Failed to send test email");
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      toast.error("There was an error sending the test email");
    } finally {
      setIsSending(false);
    }
  };
  
  const getScheduleDescription = () => {
    const frequency = form.watch("frequency");
    const timeOfDay = form.watch("timeOfDay");
    const dayOfWeek = form.watch("dayOfWeek");
    const dayOfMonth = form.watch("dayOfMonth");
    
    if (frequency === "daily") {
      return `Daily at ${timeOfDay}`;
    } else if (frequency === "weekly") {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return `Every ${days[dayOfWeek || 0]} at ${timeOfDay}`;
    } else {
      return `Monthly on day ${dayOfMonth} at ${timeOfDay}`;
    }
  };
  
  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Email Reports</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Email Report Settings</CardTitle>
            <CardDescription>
              Configure automated performance reports to be sent to your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-semibold">
                          Enable Email Reports
                        </FormLabel>
                        <FormDescription>
                          Automatically send performance reports to your team
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Frequency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How often you want to receive reports
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="timeOfDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time of Day</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              {...field} 
                              placeholder="HH:MM" 
                              className="pl-10"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          The time when reports will be sent (24-hour format)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("frequency") === "weekly" && (
                    <FormField
                      control={form.control}
                      name="dayOfWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day of Week</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Sunday</SelectItem>
                              <SelectItem value="1">Monday</SelectItem>
                              <SelectItem value="2">Tuesday</SelectItem>
                              <SelectItem value="3">Wednesday</SelectItem>
                              <SelectItem value="4">Thursday</SelectItem>
                              <SelectItem value="5">Friday</SelectItem>
                              <SelectItem value="6">Saturday</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The day of the week when reports will be sent
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {form.watch("frequency") === "monthly" && (
                    <FormField
                      control={form.control}
                      name="dayOfMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day of Month</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 31 }, (_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                  {i + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The day of the month when reports will be sent
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <div>
                  <div className="font-medium mb-2">Recipients</div>
                  <div className="border rounded-md p-4">
                    {teamMembers.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <Mail className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p>No team members yet. Add team members to send reports.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {teamMembers.map((member) => (
                          <div 
                            key={member.id} 
                            className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md"
                          >
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-muted-foreground">{member.email}</div>
                            </div>
                            <Switch
                              checked={form.watch("recipients").includes(member.email)}
                              onCheckedChange={() => handleToggleRecipient(member.email)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <h3 className="text-lg font-medium">Report Schedule Summary</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span>{getScheduleDescription()}</span>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline" className="px-3 py-1">
                      Monday to Sunday reporting period
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                      {form.watch("recipients").length} recipient(s)
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <Button type="submit">Save Settings</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleSendTestEmail}
                    disabled={isSending || form.watch("recipients").length === 0}
                  >
                    <Send size={16} />
                    <span>{isSending ? "Sending..." : "Send Test Email"}</span>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EmailReportsPage;
