
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Lead } from "@/types";
import { getLeadById } from "@/services/mockData";
import { LeadInfoPanel } from "@/components/LeadInfoPanel";
import { LeadTimeline } from "@/components/LeadTimeline";
import { LeadActionPanel } from "@/components/LeadActionPanel";

const LeadDetailsPage = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activities, setActivities] = useState<Array<any>>([]);

  useEffect(() => {
    const fetchLead = async () => {
      if (!leadId) return;
      
      try {
        setLoading(true);
        const leadData = await getLeadById(leadId);
        setLead(leadData);
        
        // Mock timeline activities - in a real app, these would come from an API
        setActivities([
          {
            id: '1',
            type: 'call',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            duration: 205, // seconds
            content: 'Call for 3.45mins',
            status: 'completed'
          },
          {
            id: '2',
            type: 'note',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            content: 'Josh wants to meet with Adrian in mid May'
          },
          {
            id: '3',
            type: 'call',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            content: 'Call attempt - no answer',
            status: 'missed'
          },
          {
            id: '4',
            type: 'note',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            content: 'Josh wants to meet with Adrian in mid May'
          },
          {
            id: '5',
            type: 'callback',
            timestamp: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            content: 'Call back scheduled for May 12',
            status: 'scheduled'
          }
        ]);
      } catch (error) {
        console.error("Error fetching lead: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [leadId]);

  const handleAddActivity = (activity: any) => {
    setActivities(prev => [activity, ...prev]);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (!lead) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Lead Not Found</h1>
          <p>The requested lead could not be found. Please return to the leads page.</p>
        </div>
      </Layout>
    );
  }

  // Create display name using first and last name if available
  const displayName = lead.firstName && lead.lastName 
    ? `${lead.firstName} ${lead.lastName}` 
    : lead.contactId || `Lead-${lead.id.substring(0, 8)}`;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{displayName}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Info Panel */}
          <div className="lg:col-span-1">
            <LeadInfoPanel lead={lead} />
          </div>
          
          {/* Timeline and Action Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Alert for upcoming callback if exists */}
            {activities.find(a => a.type === 'callback' && a.status === 'scheduled' && new Date(a.timestamp) > new Date()) && (
              <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                {activities.find(a => a.type === 'callback' && a.status === 'scheduled')?.content}
              </div>
            )}
            
            <LeadTimeline activities={activities} />
            <LeadActionPanel onAddActivity={handleAddActivity} lead={lead} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

const ProtectedLeadDetailsPage = () => (
  <ProtectedRoute allowedRoles={["admin"]}>
    <LeadDetailsPage />
  </ProtectedRoute>
);

export default ProtectedLeadDetailsPage;
