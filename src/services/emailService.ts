import { Resend } from 'resend';
import { DashboardMetrics, FilterOptions } from '@/types';
import { getDashboardMetrics } from './mockData';

// Initialize Resend with API key from localStorage
export const getResendApiKey = (): string | null => {
  return localStorage.getItem('resendApiKey');
};

// Initialize Resend with API key
const initResend = (): Resend | null => {
  const apiKey = getResendApiKey();
  if (!apiKey) return null;
  
  return new Resend(apiKey);
};

// Types for email preferences
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'viewer' | 'editor';
  addedAt: string;
}

export interface EmailReportPreference {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  timeOfDay?: string; // Format: HH:MM
  dayOfWeek?: number; // 0 (Sunday) to 6 (Saturday)
  dayOfMonth?: number; // 1-31
}

// Mock functions to get and set team members
export const getTeamMembers = (clientId: string): TeamMember[] => {
  const storedMembers = localStorage.getItem(`teamMembers_${clientId}`);
  if (storedMembers) {
    return JSON.parse(storedMembers);
  }
  return [];
};

export const saveTeamMember = (clientId: string, member: Omit<TeamMember, 'id' | 'addedAt'>): TeamMember => {
  const members = getTeamMembers(clientId);
  
  const newMember: TeamMember = {
    ...member,
    id: `tm_${Math.random().toString(36).substring(2, 10)}`,
    addedAt: new Date().toISOString()
  };
  
  const updatedMembers = [...members, newMember];
  localStorage.setItem(`teamMembers_${clientId}`, JSON.stringify(updatedMembers));
  
  return newMember;
};

export const removeTeamMember = (clientId: string, memberId: string): void => {
  const members = getTeamMembers(clientId);
  const updatedMembers = members.filter(member => member.id !== memberId);
  localStorage.setItem(`teamMembers_${clientId}`, JSON.stringify(updatedMembers));
};

// Email report preferences management
export const getEmailReportPreferences = (clientId: string): EmailReportPreference => {
  const storedPrefs = localStorage.getItem(`emailPrefs_${clientId}`);
  if (storedPrefs) {
    return JSON.parse(storedPrefs);
  }
  
  // Default preferences
  return {
    enabled: false,
    frequency: 'weekly',
    recipients: [],
    timeOfDay: '08:00',
    dayOfWeek: 1, // Monday
  };
};

export const saveEmailReportPreferences = (clientId: string, prefs: EmailReportPreference): void => {
  localStorage.setItem(`emailPrefs_${clientId}`, JSON.stringify(prefs));
};

// Email sending functions
export const sendInvitationEmail = async (email: string, clientName: string): Promise<boolean> => {
  const resend = initResend();
  if (!resend) {
    console.error("Resend API key not configured");
    return false;
  }
  
  try {
    await resend.emails.send({
      from: 'CallTrax <noreply@calltrax.com>',
      to: email,
      subject: `You've been invited to join ${clientName} on CallTrax`,
      html: `
        <h1>Welcome to CallTrax!</h1>
        <p>You've been invited to join ${clientName}'s team on CallTrax.</p>
        <p>Click the link below to create your account and get started:</p>
        <a href="https://app.calltrax.com/accept-invite?email=${encodeURIComponent(email)}">
          Accept Invitation
        </a>
      `
    });
    return true;
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    return false;
  }
};

export const sendPerformanceReport = async (
  recipients: string[],
  clientName: string,
  metrics: DashboardMetrics,
  reportType: 'daily' | 'weekly'
): Promise<boolean> => {
  const resend = initResend();
  if (!resend) {
    console.error("Resend API key not configured");
    return false;
  }
  
  const subject = reportType === 'daily' 
    ? `${clientName} - Daily Performance Report` 
    : `${clientName} - Weekly Performance Report`;
  
  const periodText = reportType === 'daily' 
    ? 'Today' 
    : 'This week';
  
  try {
    await resend.emails.send({
      from: 'CallTrax <reports@calltrax.com>',
      to: recipients,
      subject,
      html: `
        <h1>${subject}</h1>
        <p>${periodText}'s performance summary for ${clientName}:</p>
        
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2>Key Metrics</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Average Speed to Lead:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${metrics.averageSpeedToLead} mins</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Connection Rate:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${metrics.connectionRate}%</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Booking Rate:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${metrics.bookingRate}%</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Team Performance:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${metrics.teamPerformance}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Number of Leads:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${metrics.numberOfLeads}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Number of Calls:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${metrics.numberOfCalls}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Number of Conversations:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${metrics.numberOfConversations}</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong>Number of Appointments:</strong></td>
              <td style="padding: 10px;">${metrics.numberOfAppointments}</td>
            </tr>
          </table>
        </div>
        
        <p>
          <a href="https://app.calltrax.com/dashboard" style="padding: 10px 15px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">
            View Full Dashboard
          </a>
        </p>
      `
    });
    
    return true;
  } catch (error) {
    console.error(`Failed to send ${reportType} report:`, error);
    return false;
  }
};

// Simulate scheduled reports (in a real app, this would be done by a server)
export const simulateReportSchedule = (clientId: string): void => {
  const prefs = getEmailReportPreferences(clientId);
  
  if (!prefs.enabled || prefs.recipients.length === 0) {
    return;
  }
  
  // For demonstration purposes, we're using a mock timer
  // In a real app, this would be handled by a server-side scheduler
  console.log(`Email reports scheduled for client ${clientId}`);
  console.log(`Frequency: ${prefs.frequency}`);
  console.log(`Recipients: ${prefs.recipients.join(', ')}`);
  
  // Simulate metrics data
  const metrics = getDashboardMetrics([], [], {
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // For demo purposes, we'll just log the configuration
  console.log('Report would be sent with these metrics:', metrics);
};
