// src/pages/TenantsAdmin.tsx
// Admin page for managing tenant settings including timezones

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  timezone: string;
}

const AUSTRALIAN_TIMEZONES = [
  { value: 'Australia/Perth', label: 'Perth (AWST, UTC+8)' },
  { value: 'Australia/Darwin', label: 'Darwin (ACST, UTC+9:30, no DST)' },
  { value: 'Australia/Adelaide', label: 'Adelaide (ACST/ACDT, UTC+9:30/+10:30)' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST, UTC+10, no DST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT, UTC+10/+11)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT, UTC+10/+11)' },
  { value: 'Australia/Hobart', label: 'Hobart (AEST/AEDT, UTC+10/+11)' },
];

export default function TenantsAdmin() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, timezone')
        .order('name');

      if (error) throw error;
      setTenants(data || []);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      toast({
        title: 'Error',
        description: 'Failed to load tenants',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateTimezone(tenantId: string, newTimezone: string) {
    try {
      setSavingId(tenantId);
      const { error } = await supabase
        .from('tenants')
        .update({ timezone: newTimezone })
        .eq('id', tenantId);

      if (error) throw error;

      // Update local state
      setTenants(prev => prev.map(t =>
        t.id === tenantId ? { ...t, timezone: newTimezone } : t
      ));

      toast({
        title: 'Success',
        description: 'Timezone updated successfully',
      });

      setEditingId(null);
    } catch (err) {
      console.error('Error updating timezone:', err);
      toast({
        title: 'Error',
        description: 'Failed to update timezone',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  }

  // Check if user is admin
  if (profile && profile.role !== 'admin') {
    return (
      <Layout>
        <PageHeader title="Access Denied" />
        <Alert variant="destructive">
          <AlertDescription>
            You don't have permission to access this page. Only administrators can manage tenant settings.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Tenant Management"
        description="Configure timezone settings for each tenant"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Tenants
          </CardTitle>
          <CardDescription>
            Set the timezone for each tenant to ensure data is displayed in their local time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading tenants...</span>
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tenants found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map(tenant => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="text-muted-foreground">{tenant.slug}</TableCell>
                    <TableCell>
                      {editingId === tenant.id ? (
                        <Select
                          value={tenant.timezone}
                          onValueChange={(value) => updateTimezone(tenant.id, value)}
                          disabled={savingId === tenant.id}
                        >
                          <SelectTrigger className="w-[300px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AUSTRALIAN_TIMEZONES.map(tz => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm">
                          {AUSTRALIAN_TIMEZONES.find(tz => tz.value === tenant.timezone)?.label || tenant.timezone}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === tenant.id ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                            disabled={savingId === tenant.id}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(tenant.id)}
                        >
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
