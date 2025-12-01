// src/pages/LeadDetails.tsx
// Full lead details with SMS, Notes, Tasks, and enhanced Call history with AI summaries

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, ArrowLeft, Phone, Mail, Building, MapPin, User,
  MessageSquare, StickyNote, CalendarClock, Send, Plus, Check, Clock, UserPlus,
  PhoneIncoming, PhoneOutgoing, PhoneMissed, Voicemail, Sparkles,
  ListChecks, Target, ExternalLink, Play, ClipboardCheck, Calendar, Activity as ActivityIcon
} from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
}

interface Lead {
  id: string;
  tenant_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  organisation_name: string | null;
  city: string | null;
  state: string | null;
  source: string | null;
  metadata: Record<string, any> | null;
  created_at: string | null;
}

interface Call {
  id: string;
  dialpad_call_id: string | null;
  state: string | null;
  disposition: string | null;
  direction: string | null;
  started_at: string | null;
  connected_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  talk_time_seconds: number | null;
  mos_score: number | null;
  ai_summary: string | null;
  ai_outcome: string | null;
  ai_purpose: string | null;
  ai_action_items: string[] | null;
  transcript_lines: Array<{ name: string; content: string; time: string }> | null;
  transcript_url: string | null;
  recording_url: string | null;
  created_at: string | null;
}

interface Note {
  id: string;
  content: string;
  note_type: string;
  created_at: string;
  metadata: Record<string, any> | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  priority: string;
  status: string;
  due_date: string | null;
  created_at: string;
  assigned_to: string | null;
  created_by: string | null;
  assignee_name?: string | null;
}

interface SmsLog {
  id: string;
  to_number: string;
  message: string;
  status: string;
  created_at: string;
}

interface Activity {
  id: string;
  event_type: string;
  event_data: Record<string, any>;
  created_at: string;
}

// Helper functions
function safeFormatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch { return '-'; }
}

function safeTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  } catch { return '-'; }
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function getCallIcon(state: string | null, direction: string | null) {
  const iconClass = "h-4 w-4";
  switch (state) {
    case 'voicemail':
      return <Voicemail className={`${iconClass} text-amber-500`} />;
    case 'missed':
      return <PhoneMissed className={`${iconClass} text-red-500`} />;
    default:
      return direction === 'inbound'
        ? <PhoneIncoming className={`${iconClass} text-green-500`} />
        : <PhoneOutgoing className={`${iconClass} text-blue-500`} />;
  }
}

function getOutcomeColor(outcome: string | null): string {
  if (!outcome) return 'text-muted-foreground';
  const lower = outcome.toLowerCase();
  if (lower.includes('interested') && !lower.includes('not')) return 'text-green-600';
  if (lower.includes('not interested') || lower.includes('declined')) return 'text-red-600';
  if (lower.includes('voicemail') || lower.includes('callback')) return 'text-amber-600';
  return 'text-muted-foreground';
}

export default function LeadDetails() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Current user state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [lead, setLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SMS Dialog State
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSending, setSmsSending] = useState(false);

  // Note Dialog State
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Task Dialog State
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState('follow_up');
  const [taskPriority, setTaskPriority] = useState('normal');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState<string>('self');
  const [taskSaving, setTaskSaving] = useState(false);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (leadId) {
      fetchAllData(leadId);
    } else {
      setError('No lead ID provided');
      setLoading(false);
    }
  }, [leadId]);

  async function initializeUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        setTaskAssignee(user.id);
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .in('role', ['admin', 'operator']);

      if (profiles) {
        setTeamMembers(profiles.map(p => ({
          id: p.id,
          email: p.email || '',
          full_name: p.full_name
        })));
      }
    } catch (err) {
      console.error('Error initializing user:', err);
    }
  }

  async function fetchAllData(id: string) {
    try {
      setLoading(true);
      setError(null);

      // Fetch lead
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (leadError) throw new Error(leadError.message);
      if (!leadData) throw new Error('Lead not found');
      setLead(leadData);

      // Fetch calls with AI data
      const { data: callsData } = await supabase
        .from('calls')
        .select(`
          id, 
          dialpad_call_id,
          state, 
          disposition, 
          direction, 
          started_at, 
          connected_at,
          ended_at,
          duration_seconds, 
          talk_time_seconds,
          mos_score,
          ai_summary,
          ai_outcome,
          ai_purpose,
          ai_action_items,
          transcript_lines,
          transcript_url,
          recording_url,
          created_at
        `)
        .eq('lead_id', id)
        .order('started_at', { ascending: false, nullsFirst: false });
      setCalls(callsData || []);

      // Fetch notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('id, content, note_type, created_at, metadata')
        .eq('lead_id', id)
        .order('created_at', { ascending: false });
      setNotes(notesData || []);

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, title, description, task_type, priority, status, due_date, created_at')
        .eq('lead_id', id)
        .order('due_date', { ascending: true });
      setTasks(tasksData || []);

      // Fetch SMS logs
      const { data: smsData } = await supabase
        .from('sms_logs')
        .select('id, to_number, message, status, created_at')
        .eq('lead_id', id)
        .order('created_at', { ascending: false });
      setSmsLogs(smsData || []);

      // Fetch activities
      const { data: activitiesData } = await supabase
        .from('lead_activities')
        .select('id, event_type, event_data, created_at')
        .eq('lead_id', id)
        .order('created_at', { ascending: false });
      setActivities(activitiesData || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendSms() {
    if (!lead || !smsMessage.trim()) return;

    setSmsSending(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send_sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          tenant_id: lead.tenant_id,
          lead_id: lead.id,
          to_number: lead.phone,
          message: smsMessage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({ title: 'SMS Sent', description: 'Message sent successfully' });
        setSmsDialogOpen(false);
        setSmsMessage('');
        fetchAllData(leadId!);
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to send SMS', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSmsSending(false);
    }
  }

  async function handleAddNote() {
    if (!lead || !noteContent.trim()) return;

    setNoteSaving(true);
    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          lead_id: lead.id,
          tenant_id: lead.tenant_id,
          content: noteContent,
          note_type: 'general',
          created_by: currentUserId,
        });

      if (error) throw error;

      toast({ title: 'Note Added', description: 'Note saved successfully' });
      setNoteDialogOpen(false);
      setNoteContent('');
      fetchAllData(leadId!);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleAddTask() {
    if (!lead || !taskTitle.trim()) return;

    setTaskSaving(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          lead_id: lead.id,
          tenant_id: lead.tenant_id,
          title: taskTitle,
          description: taskDescription || null,
          task_type: taskType,
          priority: taskPriority,
          status: 'pending',
          due_date: taskDueDate || null,
          assigned_to: taskAssignee === 'self' ? currentUserId : taskAssignee,
          created_by: currentUserId,
        });

      if (error) throw error;

      toast({ title: 'Task Created', description: 'Task scheduled successfully' });
      setTaskDialogOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      setTaskType('follow_up');
      setTaskPriority('normal');
      setTaskDueDate('');
      fetchAllData(leadId!);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setTaskSaving(false);
    }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);

      if (error) throw error;

      toast({ title: 'Task Completed' });
      fetchAllData(leadId!);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  // Calculate call stats
  const callStats = {
    total: calls.length,
    connected: calls.filter(c => c.state === 'hangup' || c.state === 'completed' || c.state === 'dispositions').length,
    voicemails: calls.filter(c => c.state === 'voicemail').length,
    totalTalkTime: calls.reduce((sum, c) => sum + (c.talk_time_seconds || c.duration_seconds || 0), 0),
  };

  // Render activity card based on event type
  function ActivityCard({ activity }: { activity: Activity }) {
    const { event_type, event_data, created_at } = activity;

    const getActivityIcon = () => {
      switch (event_type) {
        case 'survey_completed':
          return <ClipboardCheck className="h-5 w-5 text-purple-500" />;
        case 'appointment_booked':
          return <Calendar className="h-5 w-5 text-green-500" />;
        case 'activity':
          return <ActivityIcon className="h-5 w-5 text-blue-500" />;
        default:
          return <ActivityIcon className="h-5 w-5 text-gray-500" />;
      }
    };

    const getActivityTitle = () => {
      switch (event_type) {
        case 'survey_completed':
          return event_data.survey_name || 'Survey Completed';
        case 'appointment_booked':
          return `Appointment: ${event_data.type || 'Meeting'}`;
        case 'activity':
          return event_data.type || 'Activity';
        default:
          return 'Activity';
      }
    };

    return (
      <div className="border rounded-lg p-4 mb-3">
        <div className="flex items-start gap-3">
          {getActivityIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{getActivityTitle()}</h4>
              <span className="text-xs text-muted-foreground">{safeFormatDate(created_at)}</span>
            </div>

            {/* Survey content */}
            {event_type === 'survey_completed' && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Completed: {new Date(event_data.completed_at).toLocaleString('en-AU')}
                </div>
                {event_data.answers && event_data.answers.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {event_data.answers.map((answer: any, index: number) => (
                      <div key={index} className="bg-muted/50 rounded p-2">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          {answer.question}
                        </div>
                        <div className="text-sm">{answer.answer}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Appointment content */}
            {event_type === 'appointment_booked' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-xs text-muted-foreground">Scheduled</div>
                    <div className="text-sm font-medium">
                      {new Date(event_data.scheduled_at).toLocaleString('en-AU')}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-xs text-muted-foreground">Duration</div>
                    <div className="text-sm font-medium">{event_data.duration_minutes} min</div>
                  </div>
                </div>
                {event_data.location && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Location:</span> {event_data.location}
                  </div>
                )}
                {event_data.notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Notes:</span> {event_data.notes}
                  </div>
                )}
              </div>
            )}

            {/* Generic activity content */}
            {event_type === 'activity' && (
              <div>
                {event_data.description && (
                  <p className="text-sm text-muted-foreground">{event_data.description}</p>
                )}
                {event_data.metadata && Object.keys(event_data.metadata).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {Object.entries(event_data.metadata).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="text-muted-foreground">{key}:</span>{' '}
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render call card with AI data
  function CallCard({ call }: { call: Call }) {
    const [expanded, setExpanded] = useState(false);

    return (
      <div className="border rounded-lg mb-3 overflow-hidden">
        {/* Call Header */}
        <div
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            {getCallIcon(call.state, call.direction)}
            <div>
              <div className="font-medium text-sm">
                {safeFormatDate(call.started_at || call.created_at)}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {formatDuration(call.talk_time_seconds || call.duration_seconds)}
                <span className="text-muted-foreground/50">•</span>
                {call.direction === 'inbound' ? 'Inbound' : 'Outbound'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {call.ai_outcome ? (
              <Badge variant="outline" className={getOutcomeColor(call.ai_outcome)}>
                {call.ai_outcome}
              </Badge>
            ) : call.disposition ? (
              <Badge variant="secondary">{call.disposition}</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                {call.state === 'hangup' || call.state === 'dispositions' ? 'Connected' : call.state}
              </Badge>
            )}
            {call.ai_summary && (
              <Sparkles className="h-4 w-4 text-purple-500" />
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="border-t p-4 space-y-4 bg-muted/30">
            {/* AI Summary */}
            {call.ai_summary && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-2 text-sm">AI Summary</h4>
                    <p className="text-sm text-muted-foreground">{call.ai_summary}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Purpose & Outcome */}
            {(call.ai_purpose || call.ai_outcome) && (
              <div className="grid grid-cols-2 gap-4">
                {call.ai_purpose && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Purpose</div>
                    <div className="font-medium text-sm">{call.ai_purpose}</div>
                  </div>
                )}
                {call.ai_outcome && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Outcome</div>
                    <div className={`font-medium text-sm ${getOutcomeColor(call.ai_outcome)}`}>
                      {call.ai_outcome}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Items */}
            {call.ai_action_items && call.ai_action_items.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ListChecks className="h-4 w-4 text-amber-600" />
                  <h4 className="font-medium text-sm">Action Items</h4>
                </div>
                <ul className="space-y-1">
                  {call.ai_action_items.map((item, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Transcript */}
            {call.transcript_lines && call.transcript_lines.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Transcript
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {call.transcript_lines.map((line, i) => {
                    const isLead = line.name === lead?.name;
                    return (
                      <div
                        key={i}
                        className={`p-2 rounded-lg text-sm ${isLead ? "bg-muted mr-8" : "bg-primary/10 ml-8"
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-xs">{line.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(line.time).toLocaleTimeString('en-AU', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                        <p>{line.content}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Call Details */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Duration</div>
                <div className="font-medium">{formatDuration(call.duration_seconds)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Talk Time</div>
                <div className="font-medium">{formatDuration(call.talk_time_seconds)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Quality (MOS)</div>
                <div className="font-medium">
                  {call.mos_score ? `${call.mos_score.toFixed(2)} / 5.0` : '-'}
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="flex gap-2">
              {call.recording_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(call.recording_url!, '_blank')}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Play Recording
                </Button>
              )}
              {call.transcript_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(call.transcript_url!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in Dialpad
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !lead) {
    return (
      <Layout>
        <div>
          <Button variant="ghost" onClick={() => navigate('/leads')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads
          </Button>
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {error || 'Lead not found'}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <TooltipProvider>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>

        <PageHeader
          title={lead.name || 'Lead Details'}
          description={lead.phone || 'No phone'}
        >
          <div className="flex gap-2">
              {/* SMS Dialog */}
              <Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4 mr-2" /> SMS
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send SMS</DialogTitle>
                    <DialogDescription>Send an SMS to {lead.phone}</DialogDescription>
                  </DialogHeader>
                  <Textarea
                    placeholder="Type your message..."
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    rows={4}
                  />
                  <DialogFooter>
                    <Button onClick={handleSendSms} disabled={smsSending || !smsMessage.trim()}>
                      {smsSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Send
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Note Dialog */}
              <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <StickyNote className="h-4 w-4 mr-2" /> Note
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Note</DialogTitle>
                  </DialogHeader>
                  <Textarea
                    placeholder="Type your note..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={4}
                  />
                  <DialogFooter>
                    <Button onClick={handleAddNote} disabled={noteSaving || !noteContent.trim()}>
                      {noteSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Save Note
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Task Dialog */}
              <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarClock className="h-4 w-4 mr-2" /> Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title" />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Optional description" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Type</Label>
                        <Select value={taskType} onValueChange={setTaskType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="follow_up">Follow Up</SelectItem>
                            <SelectItem value="callback">Callback</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <Select value={taskPriority} onValueChange={setTaskPriority}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input type="datetime-local" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>Assign To</Label>
                      <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self">Myself</SelectItem>
                          {teamMembers.filter(m => m.id !== currentUserId).map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddTask} disabled={taskSaving || !taskTitle.trim()}>
                      {taskSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Create Task
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          </div>
        </PageHeader>

        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{lead.phone || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{lead.email || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Organisation</p>
                      <p className="font-medium">{lead.organisation_name || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{[lead.city, lead.state].filter(Boolean).join(', ') || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Tabs */}
              <Card>
                <Tabs defaultValue="calls" className="w-full">
                  <CardHeader className="pb-0">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="calls">Calls ({calls.length})</TabsTrigger>
                      <TabsTrigger value="sms">SMS ({smsLogs.length})</TabsTrigger>
                      <TabsTrigger value="activities">Activities ({activities.length})</TabsTrigger>
                      <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
                      <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {/* Calls Tab - Enhanced with AI */}
                    <TabsContent value="calls" className="mt-0">
                      {/* Call Stats */}
                      {calls.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-green-600">{callStats.connected}</div>
                            <div className="text-xs text-muted-foreground">Connected</div>
                          </div>
                          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-amber-600">{callStats.voicemails}</div>
                            <div className="text-xs text-muted-foreground">Voicemails</div>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-blue-600">{formatDuration(callStats.totalTalkTime)}</div>
                            <div className="text-xs text-muted-foreground">Talk Time</div>
                          </div>
                        </div>
                      )}

                      {calls.length === 0 ? (
                        <p className="text-center py-4 text-muted-foreground">No calls recorded</p>
                      ) : (
                        <div>
                          {calls.map(call => (
                            <CallCard key={call.id} call={call} />
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* SMS Tab */}
                    <TabsContent value="sms" className="mt-0">
                      {smsLogs.length === 0 ? (
                        <p className="text-center py-4 text-muted-foreground">No SMS messages</p>
                      ) : (
                        <div className="space-y-2">
                          {smsLogs.map(sms => (
                            <div key={sms.id} className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline">{sms.status}</Badge>
                                <span className="text-xs text-muted-foreground">{safeFormatDate(sms.created_at)}</span>
                              </div>
                              <p className="text-sm">{sms.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Activities Tab */}
                    <TabsContent value="activities" className="mt-0">
                      {activities.length === 0 ? (
                        <p className="text-center py-4 text-muted-foreground">No activities recorded</p>
                      ) : (
                        <div>
                          {activities.map(activity => (
                            <ActivityCard key={activity.id} activity={activity} />
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Notes Tab */}
                    <TabsContent value="notes" className="mt-0">
                      {notes.length === 0 ? (
                        <p className="text-center py-4 text-muted-foreground">No notes yet</p>
                      ) : (
                        <div className="space-y-2">
                          {notes.map(note => (
                            <div key={note.id} className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline" className="capitalize">{note.note_type}</Badge>
                                <span className="text-xs text-muted-foreground">{safeTimeAgo(note.created_at)}</span>
                              </div>
                              <p className="text-sm">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Tasks Tab */}
                    <TabsContent value="tasks" className="mt-0">
                      {tasks.length === 0 ? (
                        <p className="text-center py-4 text-muted-foreground">No tasks scheduled</p>
                      ) : (
                        <div className="space-y-2">
                          {tasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-3">
                                {task.status === 'completed' ? (
                                  <Check className="h-5 w-5 text-green-600" />
                                ) : (
                                  <Clock className="h-5 w-5 text-orange-500" />
                                )}
                                <div>
                                  <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.title}
                                  </p>
                                  {task.due_date && (
                                    <p className="text-xs text-muted-foreground">
                                      Due: {safeFormatDate(task.due_date)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={
                                  task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                    task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                      'bg-gray-100 text-gray-800'
                                }>
                                  {task.priority}
                                </Badge>
                                {task.status !== 'completed' && (
                                  <Button size="sm" variant="ghost" onClick={() => handleCompleteTask(task.id)}>
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lead Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Source</p>
                    <Badge>{lead.source || 'Unknown'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge variant="outline">{(lead.metadata as any)?.status || 'New'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Created</p>
                    <p className="text-sm">{safeFormatDate(lead.created_at)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Tasks Quick View */}
              {tasks.filter(t => t.status === 'pending').length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-orange-800">Pending Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {tasks.filter(t => t.status === 'pending').slice(0, 3).map(task => (
                        <div key={task.id} className="text-sm">
                          <p className="font-medium">{task.title}</p>
                          {task.due_date && (
                            <p className="text-xs text-orange-700">Due: {safeFormatDate(task.due_date)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </Layout>
  );
}