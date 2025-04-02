
import { Agency, Call, Client, DashboardMetrics, Lead, User } from "@/types";

// Mock Users
export const users: User[] = [
  { id: "1", email: "admin@calltrax.com", name: "Admin User", role: "admin" },
  { id: "2", email: "client1@example.com", name: "Client 1", role: "client", clientId: "1" },
  { id: "3", email: "client2@example.com", name: "Client 2", role: "client", clientId: "2" },
];

// Mock Clients
export const clients: Client[] = [
  { 
    id: "1", 
    name: "ABC Company", 
    agencies: [
      { id: "1", name: "ABC North", clientId: "1", locations: ["New York", "Boston"] },
      { id: "2", name: "ABC South", clientId: "1", locations: ["Miami", "Atlanta"] },
    ]
  },
  { 
    id: "2", 
    name: "XYZ Corp", 
    agencies: [
      { id: "3", name: "XYZ West", clientId: "2", locations: ["Los Angeles", "San Francisco"] },
      { id: "4", name: "XYZ East", clientId: "2", locations: ["Chicago", "Philadelphia"] },
    ]
  },
];

// Mock Leads
export const leads: Lead[] = [
  {
    id: "1",
    agencyId: "1",
    contactId: "C1001",
    location: "New York",
    contactNumber: "+12125551234",
    timeOfNotification: "2023-09-01T09:30:00Z",
    timeOfFirstCall: "2023-09-01T09:35:00Z",
    speedToLead: 5,
    numberOfCalls: 2,
    numberOfConversations: 1,
    connected: true,
    appointmentBooked: true,
    timeOfLastCall: "2023-09-01T10:05:00Z",
  },
  {
    id: "2",
    agencyId: "1",
    contactId: "C1002",
    location: "Boston",
    contactNumber: "+16175551234",
    timeOfNotification: "2023-09-01T10:15:00Z",
    timeOfFirstCall: "2023-09-01T10:21:00Z",
    speedToLead: 6,
    numberOfCalls: 1,
    numberOfConversations: 1,
    connected: true,
    appointmentBooked: false,
    timeOfLastCall: "2023-09-01T10:21:00Z",
  },
  {
    id: "3",
    agencyId: "2",
    contactId: "C1003",
    location: "Miami",
    contactNumber: "+13055551234",
    timeOfNotification: "2023-09-01T11:00:00Z",
    timeOfFirstCall: "2023-09-01T11:03:00Z",
    speedToLead: 3,
    numberOfCalls: 3,
    numberOfConversations: 2,
    connected: true,
    appointmentBooked: true,
    timeOfLastCall: "2023-09-01T14:30:00Z",
  },
  {
    id: "4",
    agencyId: "3",
    contactId: "C1004",
    location: "Los Angeles",
    contactNumber: "+12135551234",
    timeOfNotification: "2023-09-01T13:45:00Z",
    timeOfFirstCall: "2023-09-01T13:50:00Z",
    speedToLead: 5,
    numberOfCalls: 1,
    numberOfConversations: 0,
    connected: false,
    appointmentBooked: false,
    timeOfLastCall: "2023-09-01T13:50:00Z",
  },
  {
    id: "5",
    agencyId: "4",
    contactId: "C1005",
    location: "Chicago",
    contactNumber: "+17735551234",
    timeOfNotification: "2023-09-01T15:30:00Z",
    timeOfFirstCall: null,
    speedToLead: null,
    numberOfCalls: 0,
    numberOfConversations: 0,
    connected: false,
    appointmentBooked: false,
    timeOfLastCall: null,
  },
];

// Mock Calls
export const calls: Call[] = [
  {
    id: "1",
    leadId: "1",
    contactNumber: "+12125551234",
    direction: "outbound",
    duration: 180,
    publicShareLink: "https://calls.example.com/recording/1",
    disposition: "Appointment Scheduled",
    notes: "Client interested in premium package",
    timestamp: "2023-09-01T09:35:00Z",
  },
  {
    id: "2",
    leadId: "1",
    contactNumber: "+12125551234",
    direction: "outbound",
    duration: 120,
    publicShareLink: "https://calls.example.com/recording/2",
    disposition: "Follow Up",
    notes: "Confirmed appointment details",
    timestamp: "2023-09-01T10:05:00Z",
  },
  {
    id: "3",
    leadId: "2",
    contactNumber: "+16175551234",
    direction: "outbound",
    duration: 240,
    publicShareLink: "https://calls.example.com/recording/3",
    disposition: "Not Interested",
    notes: "Client will consider options and call back",
    timestamp: "2023-09-01T10:21:00Z",
  },
  {
    id: "4",
    leadId: "3",
    contactNumber: "+13055551234",
    direction: "outbound",
    duration: 300,
    publicShareLink: "https://calls.example.com/recording/4",
    disposition: "Information Provided",
    notes: "Detailed discussion about services",
    timestamp: "2023-09-01T11:03:00Z",
  },
  {
    id: "5",
    leadId: "3",
    contactNumber: "+13055551234",
    direction: "inbound",
    duration: 180,
    publicShareLink: "https://calls.example.com/recording/5",
    disposition: "Appointment Scheduled",
    notes: "Client called back to schedule appointment",
    timestamp: "2023-09-01T13:15:00Z",
  },
  {
    id: "6",
    leadId: "3",
    contactNumber: "+13055551234",
    direction: "outbound",
    duration: 120,
    publicShareLink: "https://calls.example.com/recording/6",
    disposition: "Follow Up",
    notes: "Confirmed appointment details",
    timestamp: "2023-09-01T14:30:00Z",
  },
  {
    id: "7",
    leadId: "4",
    contactNumber: "+12135551234",
    direction: "outbound",
    duration: 30,
    publicShareLink: "https://calls.example.com/recording/7",
    disposition: "No Answer",
    notes: "Left voicemail",
    timestamp: "2023-09-01T13:50:00Z",
  },
];

// Generate mock dashboard metrics
export const getDashboardMetrics = (
  agencyFilter?: string[],
  locationFilter?: string[],
  dateRangeFilter?: { start: string; end: string }
): DashboardMetrics => {
  // In a real app, you would filter the data based on the provided filters
  // For now, we'll return static data
  
  return {
    averageSpeedToLead: 4.8,
    connectionRate: 54,
    bookingRate: 38,
    teamPerformance: "On Target",
    numberOfLeads: 100,
    numberOfCalls: 165,
    numberOfConversations: 90,
    numberOfAppointments: 35,
  };
};

// Get filtered leads
export const getFilteredLeads = (
  agencyIds?: string[],
  locations?: string[],
  dateRange?: { start: string; end: string }
): Lead[] => {
  // In a real app, you would filter the leads based on the provided filters
  // For now, we'll return all leads
  return leads;
};

// Get filtered calls
export const getFilteredCalls = (
  leadIds?: string[],
  dateRange?: { start: string; end: string }
): Call[] => {
  // In a real app, you would filter the calls based on the provided filters
  // For now, we'll return all calls
  return calls;
};

// Get client by ID
export const getClientById = (clientId: string): Client | undefined => {
  return clients.find(client => client.id === clientId);
};

// Get agencies by client ID
export const getAgenciesByClientId = (clientId: string): Agency[] => {
  const client = clients.find(c => c.id === clientId);
  return client ? client.agencies : [];
};

// Get all locations for a client
export const getLocationsByClientId = (clientId: string): string[] => {
  const client = clients.find(c => c.id === clientId);
  if (!client) return [];
  
  return client.agencies.flatMap(agency => agency.locations);
};

// Get all team members (this would be more complex in a real app)
export const getTeamMembers = (): { id: string; name: string }[] => {
  return [
    { id: "tm1", name: "John Smith" },
    { id: "tm2", name: "Jane Doe" },
    { id: "tm3", name: "Michael Johnson" },
    { id: "tm4", name: "Emily Williams" },
  ];
};

// Function to authenticate user (mock version)
export const authenticateUser = (email: string, password: string): User | null => {
  // In a real app, you would validate the password
  const user = users.find(u => u.email === email);
  return user || null;
};
