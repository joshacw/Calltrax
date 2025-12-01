import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClientCreationResult {
  tenant_id: string;
  tenant_slug: string;
  webhook_url: string;
  public_dashboard_url: string;
  dialpad_cc_id?: string;
}

const TIMEZONES = [
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'Australia/Adelaide', label: 'Adelaide (ACST)' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST)' },
  { value: 'Australia/Hobart', label: 'Hobart (AEST)' },
  { value: 'Australia/Darwin', label: 'Darwin (ACST)' },
];

export default function AddClient() {
  const [clientName, setClientName] = useState('');
  const [timezone, setTimezone] = useState('Australia/Perth');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClientCreationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate slug from client name
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Get base URL for webhooks and dashboard
  function getBaseUrl(): string {
    // In production, use your actual domain
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://calltrax.leadactivators.com.au';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!clientName.trim()) {
      setError('Client name is required');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const slug = generateSlug(clientName);
      const webhookSecret = crypto.randomUUID();
      const baseUrl = getBaseUrl();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sdcnxajrlmssfqccwfyc.supabase.co';

      // Create the tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: clientName.trim(),
          slug: slug,
          timezone: timezone,
          status: 'active',
          metadata: {
            contact_email: contactEmail || null,
            contact_phone: contactPhone || null,
            created_via: 'dashboard'
          }
        })
        .select()
        .single();

      if (tenantError) {
        if (tenantError.code === '23505') {
          throw new Error('A client with this name already exists');
        }
        throw tenantError;
      }

      // Create the webhook record
      const { error: webhookError } = await supabase
        .from('webhooks')
        .insert({
          tenant_id: tenant.id,
          type: 'lead',
          url: `${supabaseUrl}/functions/v1/inbound_lead/${webhookSecret}`,
          secret: webhookSecret,
          active: true,
          metadata: {
            created_via: 'dashboard'
          }
        });

      if (webhookError) {
        console.error('Webhook creation error:', webhookError);
        // Don't fail the whole operation, just log it
      }

      // Generate URLs
      const webhookUrl = `${supabaseUrl}/functions/v1/inbound_lead/${webhookSecret}`;
      const publicDashboardUrl = `${baseUrl}/dashboard/${slug}`;

      const creationResult: ClientCreationResult = {
        tenant_id: tenant.id,
        tenant_slug: slug,
        webhook_url: webhookUrl,
        public_dashboard_url: publicDashboardUrl,
      };

      setResult(creationResult);

      toast({
        title: 'Client Created Successfully',
        description: `${clientName} has been added to CallTrax`,
      });

      // Clear form
      setClientName('');
      setContactEmail('');
      setContactPhone('');

    } catch (err: any) {
      console.error('Error creating client:', err);
      setError(err.message || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  }

  return (
    <Layout>
      <PageHeader
        title="Add New Client"
        description="Create a new client account and get their webhook URL for lead integration"
      />

      <div className="max-w-2xl mx-auto space-y-6">

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
            <CardDescription>
              Enter the client's information to create their account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  placeholder="e.g., Acme Solar"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  disabled={loading}
                />
                {clientName && (
                  <p className="text-xs text-muted-foreground">
                    Slug: {generateSlug(clientName)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email (optional)</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="client@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone (optional)</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="+61 400 000 000"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Client...
                  </>
                ) : (
                  'Create Client'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Success Result */}
        {result && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Client Created Successfully!
              </CardTitle>
              <CardDescription className="text-green-700">
                Share these details with the client for their welcome email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Webhook URL */}
              <div className="space-y-2">
                <Label className="text-green-800 font-medium">
                  Inbound Lead Webhook URL
                </Label>
                <p className="text-xs text-green-700 mb-1">
                  Use this URL in GoHighLevel or other CRM to send leads to CallTrax
                </p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={result.webhook_url}
                    className="font-mono text-sm bg-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(result.webhook_url, 'Webhook URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Public Dashboard URL */}
              <div className="space-y-2">
                <Label className="text-green-800 font-medium">
                  Public Dashboard URL
                </Label>
                <p className="text-xs text-green-700 mb-1">
                  Share this URL with the client to view their call metrics
                </p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={result.public_dashboard_url}
                    className="font-mono text-sm bg-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(result.public_dashboard_url, 'Dashboard URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    asChild
                  >
                    <a href={result.public_dashboard_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Copy All Button */}
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  const text = `
Welcome to CallTrax!

Your Inbound Lead Webhook URL:
${result.webhook_url}

Your Public Dashboard URL:
${result.public_dashboard_url}

Configure your CRM to send leads to the webhook URL above.
View your call metrics anytime at the dashboard URL.
                  `.trim();
                  copyToClipboard(text, 'All details');
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy All for Welcome Email
              </Button>

              {/* JSON Response Preview */}
              <details className="mt-4">
                <summary className="text-sm text-green-700 cursor-pointer hover:text-green-900">
                  View API Response (for automation)
                </summary>
                <pre className="mt-2 p-3 bg-white rounded border text-xs overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        )}

        {/* API Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">API Endpoint</CardTitle>
            <CardDescription>
              Create clients programmatically via API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <div className="text-green-400">POST /functions/v1/provision_client</div>
              <div className="text-slate-400 mt-2">Content-Type: application/json</div>
              <div className="text-slate-400">Authorization: Bearer {'<anon_key>'}</div>
              <pre className="mt-3 text-yellow-300">{`{
  "name": "Acme Solar",
  "timezone": "Australia/Perth",
  "contact_email": "client@example.com"
}`}</pre>
              <div className="mt-4 text-slate-400">Response:</div>
              <pre className="mt-1 text-blue-300">{`{
  "success": true,
  "tenant_id": "uuid",
  "tenant_slug": "acme-solar",
  "webhook_url": "https://.../inbound_lead/secret",
  "public_dashboard_url": "https://.../dashboard/acme-solar"
}`}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}