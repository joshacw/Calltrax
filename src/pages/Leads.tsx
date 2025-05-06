
import { Layout } from "@/components/Layout";
import { getFilteredLeads } from "@/services/mockData";
import { FilterOptions, Lead } from "@/types";
import { useEffect, useState } from "react";
import { DashboardFilter } from "@/components/DashboardFilter";
import { PipelineCard } from "@/components/PipelineCard";

// Define the pipeline stages
enum PipelineStage {
  FU1 = "FU1",
  FU2 = "FU2",
  FU3 = "FU3",
  FU4 = "FU4",
}

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    agencies: [],
    locations: [],
    teamMembers: [],
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
  });

  // For demo purposes, we'll distribute leads into different follow-up stages
  const getPipelineLeads = (leads: Lead[], stage: PipelineStage) => {
    // In a real application, you would have a field to determine the stage
    // Here we're using a simple distribution based on array index for demo
    const stageMapping = {
      [PipelineStage.FU1]: leads.filter((_, idx) => idx % 4 === 0),
      [PipelineStage.FU2]: leads.filter((_, idx) => idx % 4 === 1),
      [PipelineStage.FU3]: leads.filter((_, idx) => idx % 4 === 2),
      [PipelineStage.FU4]: leads.filter((_, idx) => idx % 4 === 3),
    };

    return stageMapping[stage];
  };

  useEffect(() => {
    // In a real app, this would fetch leads based on filters
    const filteredLeads = getFilteredLeads(
      filters.agencies,
      filters.locations,
      filters.dateRange
    );
    setLeads(filteredLeads);
  }, [filters]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Lead Pipeline</h1>
        
        <DashboardFilter onFilterChange={handleFilterChange} />
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* FU1 Pipeline Stage */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="font-semibold mb-4 pb-2 border-b text-lg">Follow Up 1</h2>
            <div className="space-y-3">
              {getPipelineLeads(leads, PipelineStage.FU1).length > 0 ? (
                getPipelineLeads(leads, PipelineStage.FU1).map((lead) => (
                  <PipelineCard
                    key={lead.id}
                    leadId={lead.id}
                    contactId={lead.contactId || `Lead-${lead.id.substring(0,8)}`}
                    firstName={lead.firstName}
                    lastName={lead.lastName}
                    contactNumber={lead.contactNumber}
                    lastContactDate={lead.timeOfLastCall || lead.timeOfFirstCall}
                    notes="Needs first follow-up call"
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No leads in this stage</p>
              )}
            </div>
          </div>

          {/* FU2 Pipeline Stage */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="font-semibold mb-4 pb-2 border-b text-lg">Follow Up 2</h2>
            <div className="space-y-3">
              {getPipelineLeads(leads, PipelineStage.FU2).length > 0 ? (
                getPipelineLeads(leads, PipelineStage.FU2).map((lead) => (
                  <PipelineCard
                    key={lead.id}
                    leadId={lead.id}
                    contactId={lead.contactId || `Lead-${lead.id.substring(0,8)}`}
                    firstName={lead.firstName}
                    lastName={lead.lastName}
                    contactNumber={lead.contactNumber}
                    lastContactDate={lead.timeOfLastCall || lead.timeOfFirstCall}
                    notes="Second follow-up required"
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No leads in this stage</p>
              )}
            </div>
          </div>

          {/* FU3 Pipeline Stage */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="font-semibold mb-4 pb-2 border-b text-lg">Follow Up 3</h2>
            <div className="space-y-3">
              {getPipelineLeads(leads, PipelineStage.FU3).length > 0 ? (
                getPipelineLeads(leads, PipelineStage.FU3).map((lead) => (
                  <PipelineCard
                    key={lead.id}
                    leadId={lead.id}
                    contactId={lead.contactId || `Lead-${lead.id.substring(0,8)}`}
                    firstName={lead.firstName}
                    lastName={lead.lastName}
                    contactNumber={lead.contactNumber}
                    lastContactDate={lead.timeOfLastCall || lead.timeOfFirstCall}
                    notes="Third follow-up pending"
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No leads in this stage</p>
              )}
            </div>
          </div>

          {/* FU4 Pipeline Stage */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="font-semibold mb-4 pb-2 border-b text-lg">Follow Up 4</h2>
            <div className="space-y-3">
              {getPipelineLeads(leads, PipelineStage.FU4).length > 0 ? (
                getPipelineLeads(leads, PipelineStage.FU4).map((lead) => (
                  <PipelineCard
                    key={lead.id}
                    leadId={lead.id}
                    contactId={lead.contactId || `Lead-${lead.id.substring(0,8)}`}
                    firstName={lead.firstName}
                    lastName={lead.lastName}
                    contactNumber={lead.contactNumber}
                    lastContactDate={lead.timeOfLastCall || lead.timeOfFirstCall}
                    notes="Final follow-up stage"
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No leads in this stage</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Leads;
