// src/pages/Settings.tsx
// Admin-only settings page with KPI threshold configuration

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Save, Settings as SettingsIcon, Gauge, Clock,
  Phone, CalendarCheck, AlertTriangle, CheckCircle, Info
} from 'lucide-react';

interface KpiThresholds {
  speed_to_lead: {
    good: number;
    average: number;
    unit: string;
    description: string;
  };
  connection_rate: {
    good: number;
    average: number;
    unit: string;
    description: string;
  };
  booking_rate: {
    good: number;
    average: number;
    unit: string;
    description: string;
  };
}

const DEFAULT_THRESHOLDS: KpiThresholds = {
  speed_to_lead: {
    good: 5,
    average: 15,
    unit: 'minutes',
    description: 'Time from lead received to first call attempt'
  },
  connection_rate: {
    good: 50,
    average: 25,
    unit: 'percent',
    description: 'Percentage of calls that connect'
  },
  booking_rate: {
    good: 30,
    average: 15,
    unit: 'percent',
    description: 'Percentage of connected calls resulting in bookings'
  }
};

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [thresholds, setThresholds] = useState<KpiThresholds>(DEFAULT_THRESHOLDS);

  useEffect(() => {
    checkAdminAndLoadSettings();
  }, []);

  async function checkAdminAndLoadSettings() {
    try {
      setLoading(true);

      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'Settings are only available to administrators',
          variant: 'destructive'
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);

      // Load KPI thresholds
      const { data: settings } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'kpi_thresholds')
        .single();

      if (settings?.value) {
        setThresholds(settings.value as KpiThresholds);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'kpi_thresholds',
          value: thresholds,
          description: 'KPI threshold settings for dashboard performance indicators',
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: 'KPI thresholds have been updated. Dashboard will reflect changes immediately.'
      });
    } catch (err: any) {
      console.error('Error saving settings:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }

  function updateThreshold(
    metric: keyof KpiThresholds,
    level: 'good' | 'average',
    value: number
  ) {
    setThresholds(prev => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [level]: value
      }
    }));
  }

  function resetToDefaults() {
    setThresholds(DEFAULT_THRESHOLDS);
    toast({ title: 'Reset to Defaults', description: 'Click Save to apply changes' });
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading settings...</span>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <Layout>
      <PageHeader
        title="Settings"
        description="Configure KPI thresholds and performance indicators"
      >
        <Button variant="outline" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </PageHeader>

      <div className="space-y-6 max-w-4xl">

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            These thresholds determine the color coding and performance grades shown on the dashboard.
            Values at or better than "Good" show green, between "Good" and "Average" show yellow,
            and worse than "Average" show red.
          </AlertDescription>
        </Alert>

        {/* Speed to Lead */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Speed to Lead
            </CardTitle>
            <CardDescription>
              {thresholds.speed_to_lead.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Good (Green) - Up to
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={thresholds.speed_to_lead.good}
                    onChange={(e) => updateThreshold('speed_to_lead', 'good', Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">minutes</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Calls made within this time are rated excellent
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Average (Yellow) - Up to
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={thresholds.speed_to_lead.average}
                    onChange={(e) => updateThreshold('speed_to_lead', 'average', Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">minutes</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Calls above this threshold are rated poor (red)
                </p>
              </div>
            </div>

            {/* Preview */}
            <Separator />
            <div className="pt-2">
              <p className="text-sm font-medium mb-3">Preview:</p>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span>≤ {thresholds.speed_to_lead.good} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span>{thresholds.speed_to_lead.good + 1} - {thresholds.speed_to_lead.average} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span>&gt; {thresholds.speed_to_lead.average} min</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-500" />
              Connection Rate
            </CardTitle>
            <CardDescription>
              {thresholds.connection_rate.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Good (Green) - At least
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={thresholds.connection_rate.good}
                    onChange={(e) => updateThreshold('connection_rate', 'good', Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Connection rates at or above this are excellent
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Average (Yellow) - At least
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={thresholds.connection_rate.average}
                    onChange={(e) => updateThreshold('connection_rate', 'average', Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Rates below this threshold are rated poor (red)
                </p>
              </div>
            </div>

            {/* Preview */}
            <Separator />
            <div className="pt-2">
              <p className="text-sm font-medium mb-3">Preview:</p>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span>≥ {thresholds.connection_rate.good}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span>{thresholds.connection_rate.average}% - {thresholds.connection_rate.good - 1}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span>&lt; {thresholds.connection_rate.average}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-purple-500" />
              Booking Rate
            </CardTitle>
            <CardDescription>
              {thresholds.booking_rate.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Good (Green) - At least
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={thresholds.booking_rate.good}
                    onChange={(e) => updateThreshold('booking_rate', 'good', Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Booking rates at or above this are excellent
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Average (Yellow) - At least
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={thresholds.booking_rate.average}
                    onChange={(e) => updateThreshold('booking_rate', 'average', Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Rates below this threshold are rated poor (red)
                </p>
              </div>
            </div>

            {/* Preview */}
            <Separator />
            <div className="pt-2">
              <p className="text-sm font-medium mb-3">Preview:</p>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span>≥ {thresholds.booking_rate.good}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span>{thresholds.booking_rate.average}% - {thresholds.booking_rate.good - 1}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span>&lt; {thresholds.booking_rate.average}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button (bottom) */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </Layout>
  );
}