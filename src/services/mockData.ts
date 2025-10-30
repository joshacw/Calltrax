import { Agency, Call, Client, DashboardMetrics, GraphDataPoint, Lead, SubAccount, User } from "@/types";
import { format, addDays, startOfMonth, subDays } from "date-fns";

// Mock Users
export const users: User[] = [
  { id: "1", email: "admin@calltrax.com", name: "Admin User", role: "admin" },
  { id: "2", email: "client1@example.com", name: "Client 1", role: "client", clientId: "1" },
  { id: "3", email: "client2@example.com", name: "Client 2", role: "client", clientId: "2" },
  { id: "4", email: "agency1@example.com", name: "Agency User", role: "agency", agencyId: "1" },
];

// Mock Clients
export const clients: Client[] = [
  { 
    id: "1", 
    name: "ABC Company",
    gohighlevelApiKey: "",
    gohighlevelLocationId: "",
    gohighlevelIntegrated: false,
    agencies: [
      { id: "1", name: "ABC North", clientId: "1", locations: ["New York", "Boston"], subAccounts: [] },
      { id: "2", name: "ABC South", clientId: "1", locations: ["Miami", "Atlanta"], subAccounts: [] },
    ]
  },
  { 
    id: "2", 
    name: "XYZ Corp",
    gohighlevelApiKey: "",
    gohighlevelLocationId: "",
    gohighlevelIntegrated: false,
    agencies: [
      { id: "3", name: "XYZ West", clientId: "2", locations: ["Los Angeles", "San Francisco"], subAccounts: [] },
      { id: "4", name: "XYZ East", clientId: "2", locations: ["Chicago", "Philadelphia"], subAccounts: [] },
    ]
  },
];

// Mock SubAccounts
export const subAccounts: SubAccount[] = [
  {
    id: "sub1",
    name: "New York Office",
    email: "ny@abcnorth.com",
    password: "password123",
    agencyId: "1",
    locationId: "loc1",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "sub2",
    name: "Boston Office",
    email: "boston@abcnorth.com",
    password: "password123",
    agencyId: "1",
    locationId: "loc2",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

// Mock Leads
export const leads: Lead[] = [
  {
    id: "1",
    agencyId: "1",
    contactId: "C1001",
    firstName: "John",
    lastName: "Smith",
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
    firstName: "Emily",
    lastName: "Johnson",
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
    firstName: "Michael",
    lastName: "Davis",
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
    firstName: "Sarah",
    lastName: "Wilson",
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
    firstName: "Robert",
    lastName: "Brown",
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
  dateRangeFilter?: { start: string; end: string },
  teamMemberFilter?: string[]
): DashboardMetrics => {
  // In a real app, you would filter the data based on the provided filters
  return {
    averageSpeedToLead: 4.8,
    connectionRate: 55, // 22/40 * 100 = ~55%
    bookingRate: 41,    // 9/22 * 100 = ~41%
    teamPerformance: "On Target",
    numberOfLeads: 125, // 25 * 5 days = 125
    numberOfCalls: 200, // 40 * 5 days = 200
    numberOfConversations: 110, // 22 * 5 days = 110
    numberOfAppointments: 45,  // 9 * 5 days = 45
    graphData: getWeekToDateData()
  };
};

// Helper function to get week-to-date data for the dashboard
export const getWeekToDateData = (): GraphDataPoint[] => {
  const data: GraphDataPoint[] = [];
  const today = new Date();
  
  // Get the start of the current week (Monday)
  const startOfCurrentWeek = new Date(today);
  startOfCurrentWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Start on Monday
  
  // Get end of week (Sunday)
  const endOfCurrentWeek = new Date(startOfCurrentWeek);
  endOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 6);
  
  // Daily benchmarks
  const dailyBenchmarks = {
    leads: 25,
    calls: 40,
    connections: 22,
    appointments: 9
  };

  // Slight variations for different days
  const dailyVariations = [
    { leads: 0.9, calls: 0.85, connections: 0.8, appointments: 0.75 },   // Monday
    { leads: 1.1, calls: 1.05, connections: 1.1, appointments: 0.9 },    // Tuesday
    { leads: 1.0, calls: 1.15, connections: 1.05, appointments: 1.2 },   // Wednesday
    { leads: 0.95, calls: 1.0, connections: 0.95, appointments: 1.1 },   // Thursday
    { leads: 0.85, calls: 0.9, connections: 0.85, appointments: 0.85 },  // Friday
    { leads: 0.7, calls: 0.65, connections: 0.6, appointments: 0.7 },    // Saturday
    { leads: 0.5, calls: 0.45, connections: 0.4, appointments: 0.5 },    // Sunday
  ];
  
  // For cumulative calculations
  let cumulativeLeads = 0;
  let cumulativeCalls = 0;
  let cumulativeConnections = 0;
  let cumulativeAppointments = 0;
  
  // Generate data for each day of the week (Mon-Sun)
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startOfCurrentWeek);
    currentDate.setDate(startOfCurrentWeek.getDate() + i);
    const variation = dailyVariations[i];
    
    // Calculate actual values
    const leads = Math.round(dailyBenchmarks.leads * variation.leads);
    const calls = Math.round(dailyBenchmarks.calls * variation.calls);
    const connections = Math.round(dailyBenchmarks.connections * variation.connections);
    const appointments = Math.round(dailyBenchmarks.appointments * variation.appointments);
    
    // Update cumulative values
    cumulativeLeads += leads;
    cumulativeCalls += calls;
    cumulativeConnections += connections;
    cumulativeAppointments += appointments;
    
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // For past dates (up to today)
    data.push({
      date: dateStr,
      leads: leads,
      calls: calls,
      connections: connections,
      appointments: appointments,
      leadsCumulative: cumulativeLeads,
      callsCumulative: cumulativeCalls,
      connectionsCumulative: cumulativeConnections,
      appointmentsCumulative: cumulativeAppointments
    });
  }
  
  return data;
};

// Helper function to get month-to-date data for the dashboard
export const getMonthToDateData = (): GraphDataPoint[] => {
  const data: GraphDataPoint[] = [];
  const today = new Date();
  
  // Get the start of the current month
  const startOfCurrentMonth = startOfMonth(today);
  
  // Daily benchmarks - slightly different for month view
  const dailyBenchmarks = {
    leads: 20,
    calls: 35,
    connections: 18,
    appointments: 7
  };

  // For cumulative calculations
  let cumulativeLeads = 0;
  let cumulativeCalls = 0;
  let cumulativeConnections = 0;
  let cumulativeAppointments = 0;
  
  // Generate data for each day of the month up to today
  const daysInMonth = today.getDate();
  
  for (let i = 0; i < daysInMonth; i++) {
    const currentDate = addDays(startOfCurrentMonth, i);
    
    // Add some randomness to make the data look more realistic
    const randomFactor = 0.7 + Math.random() * 0.6; // Random between 0.7 and 1.3
    
    // Weekend adjustment - less activity on weekends
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendFactor = isWeekend ? 0.4 : 1;
    
    // Calculate actual values with randomness and weekend adjustment
    const leads = Math.round(dailyBenchmarks.leads * randomFactor * weekendFactor);
    const calls = Math.round(dailyBenchmarks.calls * randomFactor * weekendFactor);
    const connections = Math.round(dailyBenchmarks.connections * randomFactor * weekendFactor);
    const appointments = Math.round(dailyBenchmarks.appointments * randomFactor * weekendFactor);
    
    // Update cumulative values
    cumulativeLeads += leads;
    cumulativeCalls += calls;
    cumulativeConnections += connections;
    cumulativeAppointments += appointments;
    
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    
    data.push({
      date: dateStr,
      leads: leads,
      calls: calls,
      connections: connections,
      appointments: appointments,
      leadsCumulative: cumulativeLeads,
      callsCumulative: cumulativeCalls,
      connectionsCumulative: cumulativeConnections,
      appointmentsCumulative: cumulativeAppointments
    });
  }
  
  return data;
};

// Helper function to get today's data
export const getTodayData = (): GraphDataPoint[] => {
  const today = new Date();
  const dateStr = format(today, 'yyyy-MM-dd');
  
  const dailyBenchmarks = {
    leads: 25,
    calls: 40,
    connections: 22,
    appointments: 9
  };
  
  return [{
    date: dateStr,
    leads: dailyBenchmarks.leads,
    calls: dailyBenchmarks.calls,
    connections: dailyBenchmarks.connections,
    appointments: dailyBenchmarks.appointments,
    leadsCumulative: dailyBenchmarks.leads,
    callsCumulative: dailyBenchmarks.calls,
    connectionsCumulative: dailyBenchmarks.connections,
    appointmentsCumulative: dailyBenchmarks.appointments
  }];
};

// Helper function to get yesterday's data
export const getYesterdayData = (): GraphDataPoint[] => {
  const yesterday = subDays(new Date(), 1);
  const dateStr = format(yesterday, 'yyyy-MM-dd');
  
  const dailyBenchmarks = {
    leads: 22,
    calls: 38,
    connections: 20,
    appointments: 8
  };
  
  return [{
    date: dateStr,
    leads: dailyBenchmarks.leads,
    calls: dailyBenchmarks.calls,
    connections: dailyBenchmarks.connections,
    appointments: dailyBenchmarks.appointments,
    leadsCumulative: dailyBenchmarks.leads,
    callsCumulative: dailyBenchmarks.calls,
    connectionsCumulative: dailyBenchmarks.connections,
    appointmentsCumulative: dailyBenchmarks.appointments
  }];
};

// Helper function to get all-time data (last 30 days)
export const getAllData = (): GraphDataPoint[] => {
  const data: GraphDataPoint[] = [];
  const today = new Date();
  
  const dailyBenchmarks = {
    leads: 20,
    calls: 35,
    connections: 18,
    appointments: 7
  };

  let cumulativeLeads = 0;
  let cumulativeCalls = 0;
  let cumulativeConnections = 0;
  let cumulativeAppointments = 0;
  
  // Generate data for last 30 days
  for (let i = 29; i >= 0; i--) {
    const currentDate = subDays(today, i);
    
    const randomFactor = 0.7 + Math.random() * 0.6;
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendFactor = isWeekend ? 0.4 : 1;
    
    const leads = Math.round(dailyBenchmarks.leads * randomFactor * weekendFactor);
    const calls = Math.round(dailyBenchmarks.calls * randomFactor * weekendFactor);
    const connections = Math.round(dailyBenchmarks.connections * randomFactor * weekendFactor);
    const appointments = Math.round(dailyBenchmarks.appointments * randomFactor * weekendFactor);
    
    cumulativeLeads += leads;
    cumulativeCalls += calls;
    cumulativeConnections += connections;
    cumulativeAppointments += appointments;
    
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    
    data.push({
      date: dateStr,
      leads: leads,
      calls: calls,
      connections: connections,
      appointments: appointments,
      leadsCumulative: cumulativeLeads,
      callsCumulative: cumulativeCalls,
      connectionsCumulative: cumulativeConnections,
      appointmentsCumulative: cumulativeAppointments
    });
  }
  
  return data;
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

// Get agency by ID
export const getAgencyById = (agencyId: string): Agency | undefined => {
  for (const client of clients) {
    const agency = client.agencies.find(a => a.id === agencyId);
    if (agency) return agency;
  }
  return undefined;
};

// Get agency locations as location objects
export const getAgencyLocations = (locations: string[]): { id: string; name: string }[] => {
  return locations.map((location, index) => ({
    id: `loc${index + 1}`,
    name: location
  }));
};

// Get subaccounts for an agency
export const getSubAccounts = (agencyId: string): SubAccount[] => {
  return subAccounts.filter(account => account.agencyId === agencyId);
};

// Save a new subaccount
export const saveSubAccount = (agencyId: string, accountData: Omit<SubAccount, 'id' | 'createdAt'>): SubAccount => {
  const newAccount: SubAccount = {
    id: `sub${subAccounts.length + 1}`,
    ...accountData,
    agencyId,
    createdAt: new Date().toISOString()
  };
  
  subAccounts.push(newAccount);
  return newAccount;
};

// Remove a subaccount
export const removeSubAccount = (agencyId: string, accountId: string): void => {
  const index = subAccounts.findIndex(
    account => account.id === accountId && account.agencyId === agencyId
  );
  
  if (index !== -1) {
    subAccounts.splice(index, 1);
  }
};

// Update client information
export const updateClient = (clientId: string, updates: Partial<Client>): Client | undefined => {
  const clientIndex = clients.findIndex(client => client.id === clientId);
  
  if (clientIndex === -1) return undefined;
  
  // Update the client with the new values
  clients[clientIndex] = {
    ...clients[clientIndex],
    ...updates
  };
  
  return clients[clientIndex];
};

// Get all dispositions (this would be more complex in a real app)
export const getDispositions = (): string[] => {
  return [
    "Appointment Scheduled",
    "Appointment Booked",
    "Set Appointment",
    "Information Provided",
    "Not Interested",
    "Follow Up",
    "No Answer",
    "Left Voicemail",
    "Wrong Number",
    "Do Not Call"
  ];
};

// Function to authenticate user (mock version)
export const getResendApiKey = (): string => {
  return localStorage.getItem("resendApiKey") || "";
};

export const authenticateUser = (email: string, password: string) => {
  if (email === "admin@calltrax.com" && password === "password") {
    return {
      id: "1",
      email: "admin@calltrax.com",
      name: "Admin User",
      role: "admin" as const
    };
  } else if (email === "client1@example.com" && password === "password") {
    return {
      id: "2",
      email: "client1@example.com",
      name: "Example Client",
      role: "client" as const,
      clientId: "client_123" // Added clientId for client users
    };
  }
  return null;
};

// Get lead by ID
export const getLeadById = async (leadId: string): Promise<Lead | null> => {
  // In a real app, this would make an API call to get lead details
  const allLeads = getFilteredLeads([], [], {
    start: new Date(0).toISOString(),
    end: new Date().toISOString(),
  });
  
  return allLeads.find(lead => lead.id === leadId) || null;
};
