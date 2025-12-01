import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  source: string;
  created_at: string;
  contact: Contact;
  tenant_id: string;
}

const Leads = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { selectedTenantId, isGlobalView } = useTenant();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentsOnly, setShowAppointmentsOnly] = useState(false);

  // Fetch leads
  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);

      let query = supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          email,
          city,
          source,
          created_at,
          tenant_id,
          contact:contacts(
            id,
            name,
            phone,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by tenant if not in global view
      if (!isGlobalView && selectedTenantId) {
        query = query.eq('tenant_id', selectedTenantId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching leads:', error);
        toast({
          title: "Error",
          description: "Failed to load leads",
          variant: "destructive",
        });
        setLeads([]);
      } else {
        setLeads(data || []);
      }

      setLoading(false);
    };

    fetchLeads();
  }, [selectedTenantId, isGlobalView, toast]);

  // Group leads by follow-up stage (simple example)
  const groupLeadsByStage = () => {
    const now = new Date();
    const stages = {
      followUp1: [] as Lead[],
      followUp2: [] as Lead[],
      followUp3: [] as Lead[],
      followUp4: [] as Lead[],
    };

    leads.forEach((lead) => {
      const createdAt = new Date(lead.created_at);
      const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceCreated < 24) {
        stages.followUp1.push(lead);
      } else if (hoursSinceCreated < 48) {
        stages.followUp2.push(lead);
      } else if (hoursSinceCreated < 72) {
        stages.followUp3.push(lead);
      } else {
        stages.followUp4.push(lead);
      }
    });

    return stages;
  };

  const stages = groupLeadsByStage();

  const LeadCard = ({ lead }: { lead: Lead }) => (
    <Card
      className="mb-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/lead/${lead.id}`)}
    >
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">{lead.name}</h3>
        <div className="space-y-1 text-sm text-gray-600">
          {lead.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.city && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{lead.city}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Last contact: {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Source: {lead.source}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <PageHeader title="Lead Pipeline">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="appointments-only"
            checked={showAppointmentsOnly}
            onCheckedChange={(checked) => setShowAppointmentsOnly(checked as boolean)}
          />
          <Label htmlFor="appointments-only" className="cursor-pointer">
            Show only appointments
          </Label>
        </div>
      </PageHeader>

      <div className="space-y-6">

        {/* Pipeline Columns */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No leads found. {!isGlobalView ? 'Try selecting a different client from the sidebar.' : 'Send a test lead via the webhook to see it here.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Follow Up 1 */}
            <div>
              <h2 className="font-semibold text-lg mb-4 text-gray-700">
                Follow Up 1
                <span className="ml-2 text-sm text-gray-500">({stages.followUp1.length})</span>
              </h2>
              <div className="space-y-3">
                {stages.followUp1.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
                {stages.followUp1.length === 0 && (
                  <div className="text-sm text-gray-400 text-center py-8">No leads</div>
                )}
              </div>
            </div>

            {/* Follow Up 2 */}
            <div>
              <h2 className="font-semibold text-lg mb-4 text-gray-700">
                Follow Up 2
                <span className="ml-2 text-sm text-gray-500">({stages.followUp2.length})</span>
              </h2>
              <div className="space-y-3">
                {stages.followUp2.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
                {stages.followUp2.length === 0 && (
                  <div className="text-sm text-gray-400 text-center py-8">No leads</div>
                )}
              </div>
            </div>

            {/* Follow Up 3 */}
            <div>
              <h2 className="font-semibold text-lg mb-4 text-gray-700">
                Follow Up 3
                <span className="ml-2 text-sm text-gray-500">({stages.followUp3.length})</span>
              </h2>
              <div className="space-y-3">
                {stages.followUp3.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
                {stages.followUp3.length === 0 && (
                  <div className="text-sm text-gray-400 text-center py-8">No leads</div>
                )}
              </div>
            </div>

            {/* Follow Up 4 */}
            <div>
              <h2 className="font-semibold text-lg mb-4 text-gray-700">
                Follow Up 4
                <span className="ml-2 text-sm text-gray-500">({stages.followUp4.length})</span>
              </h2>
              <div className="space-y-3">
                {stages.followUp4.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
                {stages.followUp4.length === 0 && (
                  <div className="text-sm text-gray-400 text-center py-8">No leads</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
export default Leads;
