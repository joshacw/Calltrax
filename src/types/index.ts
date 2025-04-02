
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'client' | 'agency';
  clientId?: string;
  agencyId?: string;
}

export interface Client {
  id: string;
  name: string;
  agencies: Agency[];
  gohighlevelApiKey?: string;
  gohighlevelLocationId?: string;
  gohighlevelIntegrated: boolean;
}

export interface Agency {
  id: string;
  name: string;
  clientId: string;
  locations: string[];
  subAccounts: SubAccount[];
}

export interface SubAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  agencyId: string;
  locationId: string;
  active: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  agencyId: string;
  contactId: string;
  location: string;
  contactNumber: string;
  timeOfNotification: string;
  timeOfFirstCall: string | null;
  speedToLead: number | null;
  numberOfCalls: number;
  numberOfConversations: number;
  connected: boolean;
  appointmentBooked: boolean;
  timeOfLastCall: string | null;
}

export interface Call {
  id: string;
  leadId: string;
  contactNumber: string;
  direction: 'inbound' | 'outbound';
  duration: number;
  publicShareLink: string | null;
  disposition: string;
  notes: string;
  timestamp: string;
  agentConnected?: boolean;
}

export interface DashboardMetrics {
  averageSpeedToLead: number;
  connectionRate: number;
  bookingRate: number;
  teamPerformance: 'Below Target' | 'On Target' | 'Above Target';
  numberOfLeads: number;
  numberOfCalls: number;
  numberOfConversations: number;
  numberOfAppointments: number;
  performanceKPIs?: PerformanceKPIs;
  averageCallDuration?: number;
  graphData?: GraphDataPoint[];
}

export interface PerformanceKPIs {
  speedToLeadTarget: number;
  connectionRateTarget: number;
  bookingRateTarget: number;
  callsPerLeadTarget: number;
}

export interface GraphDataPoint {
  date: string;
  calls: number | null;
  connections: number | null;
  appointments: number | null;
  leads: number | null;
  callsProjected?: number | null;
  connectionsProjected?: number | null;
  appointmentsProjected?: number | null;
  leadsProjected?: number | null;
  callsCumulative?: number | null;
  connectionsCumulative?: number | null;
  appointmentsCumulative?: number | null;
  leadsCumulative?: number | null;
  callsProjectedCumulative?: number | null;
  connectionsProjectedCumulative?: number | null;
  appointmentsProjectedCumulative?: number | null;
  leadsProjectedCumulative?: number | null;
}

export interface FilterOptions {
  agencies: string[];
  locations: string[];
  teamMembers: string[];
  dispositions?: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

export interface DialpadSettings {
  apiToken: string;
  webhookUrl: string;
  colorGrading: {
    good: string;
    average: string;
    poor: string;
  };
  kpiTargets: {
    speedToLead: number;
    connectionRate: number;
    bookingRate: number;
    callsPerLead: number;
  };
}

export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface AccountHealth {
  status: HealthStatus;
  metrics: {
    speedToLead: HealthStatus;
    connectionRate: HealthStatus;
    bookingRate: HealthStatus;
    callsPerLead: HealthStatus;
  };
  recommendations: string[];
}
