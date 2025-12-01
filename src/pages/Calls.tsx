import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Loader2, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Voicemail,
  Sparkles, MessageSquare, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Call {
  id: string;
  tenant_id: string;
  lead_id: string | null;
  contact_center_id: string | null;
  dialpad_call_id: string | null;
  direction: string | null;
  state: string | null;
  external_number: string | null;
  internal_number: string | null;
  started_at: string | null;
  connected_at: string | null;
  ended_at: string | null;
  talk_time_seconds: number | null;
  duration_seconds: number | null;
  disposition: string | null;
  ai_summary: string | null;
  ai_outcome: string | null;
  ai_purpose: string | null;
  transcript_lines: any[] | null;
  transcript_url: string | null;
  recording_url: string | null;
  mos_score: number | null;
  created_at: string;
  lead?: {
    id: string;
    name: string | null;
    phone: string | null;
  } | null;
  tenant?: {
    name: string | null;
  } | null;
}

export default function Calls() {
  const navigate = useNavigate();
  const { selectedTenantId, isGlobalView } = useTenant();
  const [calls, setCalls] = useState<Call[]>([]);
  const [showOnlyAppointments, setShowOnlyAppointments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  useEffect(() => {
    fetchCalls();
  }, [selectedTenantId, isGlobalView, showOnlyAppointments]);

  async function fetchCalls() {
    try {
      setLoading(true);

      let query = supabase
        .from('calls')
        .select(`
          id,
          tenant_id,
          lead_id,
          contact_center_id,
          dialpad_call_id,
          direction,
          state,
          external_number,
          internal_number,
          started_at,
          connected_at,
          ended_at,
          talk_time_seconds,
          duration_seconds,
          disposition,
          ai_summary,
          ai_outcome,
          ai_purpose,
          transcript_lines,
          transcript_url,
          recording_url,
          mos_score,
          created_at,
          lead:leads!lead_id (
            id,
            name,
            phone
          ),
          tenant:tenants!tenant_id (
            name
          )
        `)
        .order('started_at', { ascending: false, nullsFirst: false })
        .limit(100);

      if (!isGlobalView && selectedTenantId) {
        query = query.eq('tenant_id', selectedTenantId);
      }

      if (showOnlyAppointments) {
        query = query.eq('disposition', 'booked');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching calls:', error);
        throw error;
      }

      setCalls(data || []);
    } catch (err) {
      console.error('Error fetching calls:', err);
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  }

  function formatTimestamp(timestamp: string | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatPhoneNumber(phone: string | null): string {
    if (!phone) return '-';
    // Format Australian numbers
    if (phone.startsWith('+61')) {
      const local = phone.slice(3);
      if (local.length === 9) {
        return `0${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
      }
    }
    return phone;
  }

  function getStateIcon(state: string | null, direction: string | null) {
    switch (state) {
      case 'voicemail':
        return <Voicemail className="h-4 w-4 text-amber-500" />;
      case 'missed':
        return <PhoneMissed className="h-4 w-4 text-red-500" />;
      case 'hangup':
      case 'completed':
      case 'dispositions':
        return direction === 'inbound'
          ? <PhoneIncoming className="h-4 w-4 text-green-500" />
          : <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
      case 'ringing':
      case 'connected':
        return <Phone className="h-4 w-4 text-green-500 animate-pulse" />;
      default:
        return <Phone className="h-4 w-4 text-gray-400" />;
    }
  }

  function getStateBadge(state: string | null) {
    switch (state) {
      case 'hangup':
      case 'completed':
      case 'dispositions':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Connected</Badge>;
      case 'missed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Missed</Badge>;
      case 'voicemail':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Voicemail</Badge>;
      case 'ringing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Ringing</Badge>;
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 animate-pulse">On Call</Badge>;
      default:
        return <Badge variant="secondary">{state || 'Unknown'}</Badge>;
    }
  }

  function getOutcomeBadge(outcome: string | null) {
    if (!outcome) return null;
    const lower = outcome.toLowerCase();
    if (lower.includes('interested') && !lower.includes('not')) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{outcome}</Badge>;
    }
    if (lower.includes('not interested') || lower.includes('declined')) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{outcome}</Badge>;
    }
    if (lower.includes('voicemail') || lower.includes('callback')) {
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{outcome}</Badge>;
    }
    return <Badge variant="outline">{outcome}</Badge>;
  }

  function getDispositionBadge(disposition: string | null) {
    if (!disposition) return null;

    switch (disposition.toLowerCase()) {
      case 'booked':
      case 'appointment':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Booked</Badge>;
      case 'callback':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Callback</Badge>;
      case 'not_interested':
      case 'not interested':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Not Interested</Badge>;
      default:
        return <Badge variant="outline">{disposition}</Badge>;
    }
  }

  // Transcript Modal Component
  function TranscriptModal({ call }: { call: Call }) {
    if (!call.transcript_lines?.length) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No transcript available for this call.
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {call.transcript_lines.map((line: any, i: number) => (
          <div
            key={i}
            className={`p-3 rounded-lg ${line.name === call.lead?.name
                ? "bg-muted ml-0 mr-8"
                : "bg-primary/10 ml-8 mr-0"
              }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{line.name}</span>
              {line.time && (
                <span className="text-xs text-muted-foreground">
                  {new Date(line.time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
            <p className="text-sm">{line.content}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Layout>
      <TooltipProvider>
        <PageHeader
          title="Call Activity"
          description="View and filter call history across all clients"
        >
          <div className="flex items-center space-x-2">
            <Checkbox
              id="appointments"
              checked={showOnlyAppointments}
              onCheckedChange={(checked) => setShowOnlyAppointments(checked as boolean)}
            />
            <Label htmlFor="appointments" className="cursor-pointer">
              Show only appointments
            </Label>
          </div>
        </PageHeader>

        <div className="space-y-6">

          {/* Calls Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Call data {calls.length > 0 && `(${calls.length} calls)`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading calls...</span>
                </div>
              ) : calls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No calls found for the selected filters
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Type</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead className="text-right">Duration</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead className="min-w-[250px]">AI Summary</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calls.map(call => (
                        <TableRow
                          key={call.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => call.lead_id && navigate(`/lead/${call.lead_id}`)}
                        >
                          {/* Type Icon */}
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-2">
                                  {getStateIcon(call.state, call.direction)}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {call.direction === 'inbound' ? 'Inbound' : 'Outbound'} - {call.state}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>

                          {/* Contact */}
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {call.lead?.name || 'Unknown'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatPhoneNumber(call.external_number || call.lead?.phone)}
                              </div>
                            </div>
                          </TableCell>

                          {/* Client/Tenant */}
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {call.tenant?.name || '-'}
                            </span>
                          </TableCell>

                          {/* Timestamp */}
                          <TableCell>
                            <div className="text-sm">
                              {formatTimestamp(call.started_at || call.created_at)}
                            </div>
                          </TableCell>

                          {/* Duration */}
                          <TableCell className="text-right font-mono text-sm">
                            {formatDuration(call.talk_time_seconds || call.duration_seconds)}
                          </TableCell>

                          {/* Outcome */}
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {getStateBadge(call.state)}
                              {call.ai_outcome && getOutcomeBadge(call.ai_outcome)}
                              {call.disposition && !call.ai_outcome && getDispositionBadge(call.disposition)}
                            </div>
                          </TableCell>

                          {/* AI Summary */}
                          <TableCell>
                            {call.ai_summary ? (
                              <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <p className="text-sm text-muted-foreground line-clamp-2 cursor-help">
                                      {call.ai_summary}
                                    </p>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-md">
                                    <p>{call.ai_summary}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground/50">
                                No AI summary
                              </span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {call.transcript_lines && call.transcript_lines.length > 0 && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Call Transcript</DialogTitle>
                                    </DialogHeader>
                                    <TranscriptModal call={call} />
                                  </DialogContent>
                                </Dialog>
                              )}

                              {call.transcript_url && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => window.open(call.transcript_url!, '_blank')}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View in Dialpad</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    </Layout>
  );
}