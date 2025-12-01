// src/pages/Tasks.tsx
// Task management page with comprehensive admin filters

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Check, Clock, AlertCircle, Calendar, Phone,
  MessageSquare, Mail, Users, ExternalLink, Bell, BellOff, User,
  Filter, X, ListFilter, LayoutGrid
} from 'lucide-react';

interface Task {
  id: string;
  tenant_id: string;
  lead_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  title: string;
  description: string | null;
  task_type: string;
  priority: string;
  status: string;
  due_date: string | null;
  reminder_at: string | null;
  created_at: string;
  completed_at: string | null;
  lead?: {
    id: string;
    name: string | null;
    phone: string | null;
  } | null;
  tenant?: {
    id: string;
    name: string;
  } | null;
  assignee?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  creator?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
}

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface Notification {
  id: string;
  title: string;
  message: string | null;
  notification_type: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

type DueDateFilter = 'all' | 'overdue' | 'today' | 'this_week' | 'next_week' | 'no_date';
type ViewMode = 'list' | 'cards';

function safeFormatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  } catch { return '-'; }
}

function formatDateOnly(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch { return '-'; }
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function isDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  return due.toDateString() === today.toDateString();
}

function isDueThisWeek(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  return due >= today && due <= endOfWeek;
}

function isDueNextWeek(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  const startOfNextWeek = new Date(today);
  startOfNextWeek.setDate(today.getDate() + (7 - today.getDay()) + 1);
  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
  return due >= startOfNextWeek && due <= endOfNextWeek;
}

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '??';
}

function getUserDisplayName(user: { email: string; full_name: string | null } | null | undefined): string {
  if (!user) return 'Unassigned';
  return user.full_name || user.email.split('@')[0];
}

export default function Tasks() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUserId !== null) {
      fetchTasks();
      fetchNotifications();
    }
  }, [statusFilter, assigneeFilter, tenantFilter, dueDateFilter, priorityFilter, currentUserId]);

  async function initializeUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);

        // Check if admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const userIsAdmin = profile?.role === 'admin';
        setIsAdmin(userIsAdmin);

        // Fetch team members and tenants for filters
        if (userIsAdmin) {
          fetchTeamMembers();
          fetchTenants();
        }
      }
    } catch (err) {
      console.error('Error initializing user:', err);
    }
  }

  async function fetchTeamMembers() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .in('role', ['admin', 'operator']);

      if (data) {
        setTeamMembers(data);
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  }

  async function fetchTenants() {
    try {
      const { data } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .order('name');

      if (data) {
        setTenants(data);
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
    }
  }

  async function fetchTasks() {
    try {
      setLoading(true);

      let query = supabase
        .from('tasks')
        .select(`
          *,
          lead:leads!lead_id (id, name, phone),
          tenant:tenants!tenant_id (id, name)
        `)
        .order('due_date', { ascending: true, nullsFirst: false });

      // Status filter
      if (statusFilter === 'pending') {
        query = query.in('status', ['pending', 'in_progress']);
      } else if (statusFilter === 'completed') {
        query = query.eq('status', 'completed');
      }

      // Tenant filter
      if (tenantFilter !== 'all') {
        query = query.eq('tenant_id', tenantFilter);
      }

      // Assignee filter
      if (assigneeFilter === 'unassigned') {
        query = query.is('assigned_to', null);
      } else if (assigneeFilter === 'mine') {
        query = query.eq('assigned_to', currentUserId);
      } else if (assigneeFilter !== 'all') {
        query = query.eq('assigned_to', assigneeFilter);
      }

      // Priority filter
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user details for assignee and creator
      let tasksWithUsers: Task[] = data || [];

      if (data && data.length > 0) {
        const userIds = [...new Set([
          ...data.map(t => t.assigned_to).filter(Boolean),
          ...data.map(t => t.created_by).filter(Boolean)
        ])];

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', userIds);

          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

          tasksWithUsers = data.map(task => ({
            ...task,
            assignee: task.assigned_to ? profileMap.get(task.assigned_to) || null : null,
            creator: task.created_by ? profileMap.get(task.created_by) || null : null
          }));
        }
      }

      // Apply due date filter (client-side for flexibility)
      if (dueDateFilter !== 'all') {
        tasksWithUsers = tasksWithUsers.filter(task => {
          switch (dueDateFilter) {
            case 'overdue':
              return task.status !== 'completed' && isOverdue(task.due_date);
            case 'today':
              return isDueToday(task.due_date);
            case 'this_week':
              return isDueThisWeek(task.due_date);
            case 'next_week':
              return isDueNextWeek(task.due_date);
            case 'no_date':
              return !task.due_date;
            default:
              return true;
          }
        });
      }

      setTasks(tasksWithUsers);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function fetchNotifications() {
    try {
      if (!currentUserId) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({ title: 'Task Completed' });
      fetchTasks();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  async function handleReassignTask(taskId: string, newAssigneeId: string | null) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ assigned_to: newAssigneeId })
        .eq('id', taskId);

      if (error) throw error;

      // Create notification for new assignee
      if (newAssigneeId) {
        const task = tasks.find(t => t.id === taskId);
        await supabase
          .from('notifications')
          .insert({
            user_id: newAssigneeId,
            title: 'Task Assigned',
            message: `You have been assigned: ${task?.title}`,
            notification_type: 'task_assigned',
            related_type: 'task',
            related_id: taskId
          });
      }

      toast({ title: 'Task Reassigned' });
      fetchTasks();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  async function handleMarkAllNotificationsRead() {
    try {
      const ids = notifications.map(n => n.id);
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', ids);

      setNotifications([]);
      toast({ title: 'All notifications marked as read' });
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  }

  function clearFilters() {
    setStatusFilter('pending');
    setPriorityFilter('all');
    setAssigneeFilter('all');
    setTenantFilter('all');
    setDueDateFilter('all');
  }

  function getTaskIcon(taskType: string) {
    switch (taskType) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const hasActiveFilters = priorityFilter !== 'all' || assigneeFilter !== 'all' ||
    tenantFilter !== 'all' || dueDateFilter !== 'all';

  // Stats
  const pendingCount = tasks.filter(t => t.status !== 'completed').length;
  const overdueCount = tasks.filter(t => t.status !== 'completed' && isOverdue(t.due_date)).length;
  const dueTodayCount = tasks.filter(t => t.status !== 'completed' && isDueToday(t.due_date)).length;

  return (
    <Layout>
      <PageHeader
        title="Tasks"
        description={isAdmin ? 'Manage all team tasks' : 'Your assigned tasks'}
      >
        <div className="flex items-center gap-2">
            {/* Notifications */}
            {notifications.length > 0 && (
              <Button variant="outline" size="icon" className="relative" onClick={handleMarkAllNotificationsRead}>
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {notifications.length}
                </span>
              </Button>
            )}

            {/* Toggle Filters */}
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-2 bg-white text-primary">Active</Badge>
              )}
            </Button>

            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode('list')}
              >
                <ListFilter className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-800">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-800">Overdue</p>
                  <p className="text-2xl font-bold text-red-900">{overdueCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-800">Due Today</p>
                  <p className="text-2xl font-bold text-orange-900">{dueTodayCount}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4 items-end">
                {/* Status Filter */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Filter */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Client/Tenant Filter */}
                {isAdmin && tenants.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Client</Label>
                    <Select value={tenantFilter} onValueChange={setTenantFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Clients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {tenants.map(tenant => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Assignee Filter */}
                {isAdmin && teamMembers.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Assigned To</Label>
                    <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Operators" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Operators</SelectItem>
                        <SelectItem value="mine">My Tasks</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {teamMembers.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name || member.email.split('@')[0]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Due Date Filter */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <Select value={dueDateFilter} onValueChange={(v) => setDueDateFilter(v as DueDateFilter)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="today">Due Today</SelectItem>
                      <SelectItem value="this_week">This Week</SelectItem>
                      <SelectItem value="next_week">Next Week</SelectItem>
                      <SelectItem value="no_date">No Due Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasks Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No tasks found matching your filters
            </CardContent>
          </Card>
        ) : viewMode === 'list' ? (
          /* List View */
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map(task => (
                  <TableRow
                    key={task.id}
                    className={`
                      ${task.status === 'completed' ? 'opacity-50' : ''}
                      ${task.status !== 'completed' && isOverdue(task.due_date) ? 'bg-red-50' : ''}
                    `}
                  >
                    <TableCell>
                      <div className={`p-1.5 rounded ${getPriorityColor(task.priority)}`}>
                        {getTaskIcon(task.task_type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className={`font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{task.tenant?.name || '-'}</span>
                    </TableCell>
                    <TableCell>
                      {task.lead ? (
                        <Button
                          variant="link"
                          className="p-0 h-auto text-sm"
                          onClick={() => navigate(`/lead/${task.lead!.id}`)}
                        >
                          {task.lead.name || task.lead.phone || 'View Lead'}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Select
                          value={task.assigned_to || 'unassigned'}
                          onValueChange={(value) => handleReassignTask(task.id, value === 'unassigned' ? null : value)}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {teamMembers.map(member => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.full_name || member.email.split('@')[0]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px]">
                              {getInitials(task.assignee?.full_name, task.assignee?.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{getUserDisplayName(task.assignee)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm ${task.status !== 'completed' && isOverdue(task.due_date)
                          ? 'text-red-600 font-medium'
                          : isDueToday(task.due_date)
                            ? 'text-orange-600 font-medium'
                            : ''
                        }`}>
                        {formatDateOnly(task.due_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {task.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompleteTask(task.id)}
                            title="Mark Complete"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {task.lead_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/lead/${task.lead_id}`)}
                            title="View Lead"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          /* Card View */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map(task => (
              <Card
                key={task.id}
                className={`
                  ${task.status !== 'completed' && isOverdue(task.due_date) ? 'border-red-200 bg-red-50' : ''}
                  ${task.status !== 'completed' && isDueToday(task.due_date) ? 'border-orange-200 bg-orange-50' : ''}
                  ${task.status === 'completed' ? 'opacity-60' : ''}
                `}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded ${getPriorityColor(task.priority)}`}>
                        {getTaskIcon(task.task_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="outline" className="text-xs">
                            {task.tenant?.name || 'No Client'}
                          </Badge>
                          {task.lead && (
                            <Badge variant="outline" className="text-xs">
                              {task.lead.name || task.lead.phone}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px]">
                                {getInitials(task.assignee?.full_name, task.assignee?.email)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {getUserDisplayName(task.assignee)}
                            </span>
                          </div>
                          {task.due_date && (
                            <span className={`text-xs ${isOverdue(task.due_date) ? 'text-red-600 font-medium' : 'text-muted-foreground'
                              }`}>
                              {formatDateOnly(task.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      {task.status !== 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompleteTask(task.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}