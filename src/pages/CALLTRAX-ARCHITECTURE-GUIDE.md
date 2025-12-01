# CallTrax Dashboard - Architecture & Developer Onboarding Guide

**Version:** 1.0  
**Last Updated:** November 29, 2025  
**Project:** CallTrax - Multi-Tenant Contact Center Analytics Platform  
**Tech Stack:** React + TypeScript + Supabase + Dialpad API Integration

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Core Workflows](#core-workflows)
6. [API Integrations](#api-integrations)
7. [Frontend Structure](#frontend-structure)
8. [Backend Services](#backend-services)
9. [Deployment & Infrastructure](#deployment--infrastructure)
10. [Development Setup](#development-setup)

---

## 🎯 Executive Summary

CallTrax is a **multi-tenant contact center analytics platform** that automates client onboarding, tracks inbound leads, monitors call performance, and provides real-time metrics for speed-to-lead, connection rates, and booking rates.

### What CallTrax Does:

1. **Automated Client Provisioning** - Creates Dialpad contact centers via API
2. **Lead Ingestion** - Unique webhook per client captures inbound leads
3. **Call Tracking** - Real-time call events (ringing, connected, hangup, dispositions)
4. **Analytics Dashboard** - Speed-to-lead, connection rate, booking rate metrics
5. **Lead Management** - Kanban-style pipeline for lead follow-up
6. **Multi-Tenant Access** - Admin, agent, and client portals with role-based permissions

### Key Metrics Tracked:

- **Speed-to-Lead:** Time from lead received → first call attempt
- **Connection Rate:** % of calls that connect vs attempted
- **Booking Rate:** % of connected calls resulting in appointments
- **Lead Response Rate:** % of leads contacted within SLA

---

## 🏗️ System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SYSTEMS                         │
├─────────────────────────────────────────────────────────────────┤
│  Dialpad API          │  Lead Sources (GHL, Websites, Ads)      │
│  - Contact Centers    │  - Send leads via webhook                │
│  - Call Events        │  - POST to /api/webhooks/lead/{id}       │
│  - Agent Management   │                                           │
└──────────┬────────────┴──────────────────┬───────────────────────┘
           │                               │
           ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS                       │
├─────────────────────────────────────────────────────────────────┤
│  provision-client     │  inbound-lead    │  dialpad-events      │
│  - Creates Dialpad CC │  - Creates lead  │  - Processes calls   │
│  - Sets up webhooks   │  - Links contact │  - Updates status    │
│  - Stores tenant      │  - Timestamps    │  - Tracks metrics    │
└──────────┬────────────┴──────────┬───────┴──────────┬───────────┘
           │                       │                   │
           ▼                       ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE POSTGRESQL                         │
├─────────────────────────────────────────────────────────────────┤
│  tenants    │  contacts   │  leads      │  calls    │  webhooks │
│  - Clients  │  - People   │  - Inquiries│  - Events │  - Configs│
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (VITE)                         │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard  │  Leads Pipeline  │  Call Logs  │  Settings        │
│  - Metrics  │  - Kanban board  │  - History  │  - Clients       │
│  - Charts   │  - Lead details  │  - Filters  │  - Webhooks      │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         END USERS                                │
├─────────────────────────────────────────────────────────────────┤
│  CallTrax Admin  │  CallTrax Agents  │  Client Portal Users     │
│  - Full access   │  - Assigned CCs   │  - Own data only         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   tenants    │◄────────│   contacts   │────────►│    leads     │
├──────────────┤  1:N    ├──────────────┤  1:N    ├──────────────┤
│ id (PK)      │         │ id (PK)      │         │ id (PK)      │
│ name         │         │ tenant_id FK │         │ tenant_id FK │
│ slug         │         │ name         │         │ contact_id FK│
│ dialpad_cc_id│         │ phone        │         │ source       │
│ timezone     │         │ email        │         │ status       │
│ status       │         │ metadata     │         │ created_at   │
│ metadata     │         └──────┬───────┘         │ raw_data     │
└──────┬───────┘                │                 └──────┬───────┘
       │                        │                        │
       │                        │                        │
       │                        │                        │
       │                        ▼                        │
       │                 ┌──────────────┐               │
       │                 │    calls     │◄──────────────┘
       │                 ├──────────────┤
       │                 │ id (PK)      │
       │                 │ tenant_id FK │
       │                 │ contact_id FK│
       │                 │ lead_id FK   │
       │                 │ external_id  │
       │                 │ direction    │
       │                 │ status       │
       │                 │ disposition  │
       │                 │ started_at   │
       │                 │ connected_at │
       │                 │ ended_at     │
       │                 │ duration     │
       │                 │ recording_url│
       │                 └──────────────┘
       │
       ▼
┌──────────────┐
│   webhooks   │
├──────────────┤
│ id (PK)      │
│ client_id FK │
│ type         │
│ url          │
│ secret       │
│ active       │
└──────────────┘
```

### Key Tables Explained

#### **tenants** (Clients)
- Each client/company using CallTrax
- One tenant = One Dialpad contact center
- Contains Dialpad CC ID and metadata

#### **contacts** (People)
- Unique individuals (identified by phone number)
- One person can have multiple leads
- Permanent record - never deleted

#### **leads** (Opportunities)
- Sales inquiries/opportunities
- References a contact
- Tracks source, status, timestamps
- **Purpose:** Track where leads came from, when, and conversion status

#### **calls** (Call Events)
- Individual call records
- Links to both contact and lead
- Tracks status progression: ringing → connected → completed
- Stores disposition (booked, not_interested, etc.)
- Used for metrics calculation

#### **webhooks** (Integration Config)
- Per-client webhook URLs
- Stores secrets for validation
- Type: 'lead' for inbound leads

---

## 👥 User Roles & Permissions

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    CALLTRAX ADMIN                            │
│  - Full system access                                        │
│  - Can provision new clients                                 │
│  - View all tenants, leads, calls                           │
│  - Manage webhooks and integrations                         │
│  - Access: All dashboards, all data                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   CALLTRAX AGENTS                            │
│  - Access to assigned contact centers only                   │
│  - View leads and calls for their CCs                       │
│  - Make calls via Dialpad                                    │
│  - Add dispositions and notes                               │
│  - Access: Filtered dashboards, assigned tenant data        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  CLIENT PORTAL USERS                         │
│  - View own tenant data only                                 │
│  - Public dashboard URL (unauthenticated)                   │
│  - Or authenticated login for detailed access               │
│  - Access: Own leads, own calls, own metrics                │
└─────────────────────────────────────────────────────────────┘
```

### Permission Matrix

| Feature | Admin | Agent | Client |
|---------|-------|-------|--------|
| Provision Clients | ✅ | ❌ | ❌ |
| View All Tenants | ✅ | ❌ | ❌ |
| View Assigned CCs | ✅ | ✅ | ❌ |
| View Own Data | ✅ | ✅ | ✅ |
| Manage Webhooks | ✅ | ❌ | ❌ |
| Add Dispositions | ✅ | ✅ | ❌ |
| Public Dashboard | ✅ | ✅ | ✅ |

---

## 🔄 Core Workflows

### Workflow 1: Client Provisioning

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Admin clicks "Add Client"                                  │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Form Input                                                 │
│    - Client Name: "Acme Solar"                               │
│    - Timezone: "Australia/Perth"                             │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Edge Function: provision-client                           │
│    a) POST to Dialpad API                                    │
│       - Create contact center "Acme Solar"                   │
│       - Set business hours (9am-5pm Mon-Fri)                │
│       - Returns: dialpad_cc_id: 5129196827320320            │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│    b) POST to Dialpad API                                    │
│       - Create webhook endpoint                              │
│       - URL: {supabase}/functions/v1/dialpad-events/acme-solar│
│       - Secret: generated UUID                               │
│       - Returns: webhook_id: 5402113544822784               │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│    c) POST to Dialpad API                                    │
│       - Subscribe to call events                             │
│       - Events: ringing, connected, hangup, dispositions     │
│       - Target: callcenter ID                                │
│       - Returns: subscription_id: 6455618288230400          │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│    d) INSERT into tenants table                              │
│       - name: "Acme Solar"                                   │
│       - slug: "acme-solar"                                   │
│       - dialpad_cc_id: 5129196827320320                     │
│       - metadata: {webhook_id, subscription_id, secret}     │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│    e) INSERT into webhooks table                             │
│       - type: "lead"                                         │
│       - url: {supabase}/functions/v1/inbound-lead/{uuid}    │
│       - secret: generated UUID                               │
│       - active: true                                         │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Success Response                                           │
│    {                                                          │
│      "tenant_id": "fed3b9c0-1c18-4f78-82b2-6cd0ce54f63a",   │
│      "webhooks": {                                           │
│        "dialpad_events": "https://...dialpad-events/acme-solar",│
│        "inbound_leads": "https://...inbound-lead/abc123"    │
│      }                                                        │
│    }                                                          │
└──────────────────────────────────────────────────────────────┘
```

**File:** `supabase/functions/provision-client/index.ts`

---

### Workflow 2: Inbound Lead Processing

```
┌──────────────────────────────────────────────────────────────┐
│ 1. External System (GHL, Website, Ad Platform)               │
│    POST to webhook URL                                        │
│    https://.../inbound-lead/5ebfd11140c84854afb5ddd0a50129f2│
│                                                               │
│    Payload:                                                   │
│    {                                                          │
│      "contact": {                                            │
│        "name": "John Smith",                                 │
│        "phone": "+61430363930",                             │
│        "email": "john@example.com",                         │
│        "city": "Perth"                                       │
│      },                                                       │
│      "lead": {                                               │
│        "source": "Google Ads",                              │
│        "notes": "Interested in solar"                       │
│      }                                                        │
│    }                                                          │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Edge Function: inbound-lead                               │
│    a) Lookup webhook by secret in URL                       │
│       - Find tenant_id from webhooks table                   │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│    b) Check if contact exists                                │
│       SELECT * FROM contacts                                  │
│       WHERE tenant_id = ? AND phone = '+61430363930'         │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│    c) If EXISTS: Use existing contact_id                     │
│       If NOT EXISTS: INSERT new contact                      │
│       {                                                       │
│         tenant_id, name, phone, email,                       │
│         metadata: {source, received_at}                      │
│       }                                                       │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│    d) INSERT new lead                                        │
│       {                                                       │
│         tenant_id, contact_id,                               │
│         source: "Google Ads",                                │
│         status: "new",                                       │
│         created_at: NOW(),  ← Critical for speed-to-lead    │
│         city: "Perth",                                       │
│         raw_data: {original payload}                         │
│       }                                                       │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Response                                                   │
│    {                                                          │
│      "success": true,                                        │
│      "lead_id": "040df793-08e1-43e5-8827-7d33ed818e75",    │
│      "contact_id": "0cd6dc12-46b0-4fa6-9d65-38a5d599a4f1"  │
│    }                                                          │
└──────────────────────────────────────────────────────────────┘
```

**File:** `supabase/functions/inbound-lead/index.ts`

---

### Workflow 3: Call Event Processing

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Agent makes call in Dialpad                               │
│    - Agent in "Acme Solar" contact center                    │
│    - Dials: +61430363930                                     │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Dialpad sends webhook event: "ringing"                    │
│    POST to: https://.../dialpad-events/acme-solar           │
│                                                               │
│    Payload (JWT signed):                                     │
│    {                                                          │
│      "event_type": "ringing",                               │
│      "call_id": "dialpad_123456",                           │
│      "call_center_id": 5129196827320320,                    │
│      "from_number": "+61485986529",                         │
│      "to_number": "+61430363930",                           │
│      "user_id": 9876543,  ← Agent                           │
│      "start_time": 1732874400                               │
│    }                                                          │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Edge Function: dialpad-events                            │
│    a) Extract slug from URL: "acme-solar"                   │
│    b) Lookup tenant by slug                                  │
│    c) Verify JWT signature using webhook_secret             │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│    d) Check if call record exists                            │
│       SELECT * FROM calls                                     │
│       WHERE external_id = 'dialpad_123456'                   │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│    e) If NOT EXISTS: INSERT new call                         │
│       {                                                       │
│         external_id: "dialpad_123456",                      │
│         tenant_id, contact_id, lead_id,                     │
│         status: "ringing",                                   │
│         started_at: 2025-11-29T09:00:00Z,  ← For metrics   │
│         from_number, to_number,                             │
│         metadata: {agent_id, call_center_id}                │
│       }                                                       │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Call connects - Dialpad sends "connected" event          │
│    UPDATE calls                                               │
│    SET status = 'connected',                                 │
│        connected_at = NOW()                                  │
│    WHERE external_id = 'dialpad_123456'                     │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Call ends - Dialpad sends "hangup" event                 │
│    {                                                          │
│      "event_type": "hangup",                                │
│      "call_id": "dialpad_123456",                           │
│      "duration": 245  ← seconds                             │
│    }                                                          │
│                                                               │
│    UPDATE calls                                               │
│    SET status = 'completed',                                 │
│        ended_at = NOW(),                                     │
│        duration = 245                                        │
│    WHERE external_id = 'dialpad_123456'                     │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Agent adds disposition - "dispositions" event             │
│    {                                                          │
│      "event_type": "dispositions",                          │
│      "call_id": "dialpad_123456",                           │
│      "disposition": "Booked"                                │
│    }                                                          │
│                                                               │
│    UPDATE calls                                               │
│    SET disposition = 'booked'                                │
│    WHERE external_id = 'dialpad_123456'                     │
└──────────────────────────────────────────────────────────────┘
```

**File:** `supabase/functions/dialpad-events/index.ts`

---

### Workflow 4: Metrics Calculation

#### Speed-to-Lead Calculation

```sql
-- For each lead, calculate time from creation to first call
SELECT 
  l.id as lead_id,
  l.created_at as lead_received_time,
  MIN(c.started_at) as first_call_time,
  EXTRACT(EPOCH FROM (MIN(c.started_at) - l.created_at))/60 
    as speed_to_lead_minutes
FROM leads l
LEFT JOIN calls c ON c.lead_id = l.id
WHERE l.tenant_id = 'acme-solar-tenant-id'
  AND l.created_at >= NOW() - INTERVAL '30 days'
GROUP BY l.id, l.created_at
ORDER BY speed_to_lead_minutes ASC;
```

#### Connection Rate Calculation

```sql
-- Percentage of calls that connected vs attempted
SELECT 
  tenant_id,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE status = 'connected') as connected_calls,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'connected') * 100.0 / COUNT(*), 
    2
  ) as connection_rate_percent
FROM calls
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY tenant_id;
```

#### Booking Rate Calculation

```sql
-- Percentage of connected calls that resulted in bookings
SELECT 
  tenant_id,
  COUNT(*) FILTER (WHERE status = 'connected') as connected_calls,
  COUNT(*) FILTER (WHERE disposition = 'booked') as booked_calls,
  ROUND(
    COUNT(*) FILTER (WHERE disposition = 'booked') * 100.0 / 
    COUNT(*) FILTER (WHERE status = 'connected'),
    2
  ) as booking_rate_percent
FROM calls
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY tenant_id;
```

---

## 🔌 API Integrations

### Dialpad API

**Base URL:** `https://dialpad.com/api/v2`

**Authentication:** Bearer token in headers
```
Authorization: Bearer {DIALPAD_API_KEY}
```

**Key Endpoints Used:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/callcenters` | POST | Create contact center |
| `/webhooks` | POST | Register webhook endpoint |
| `/subscriptions/call` | POST | Subscribe to call events |

**Event Types:**
- `ringing` - Call is ringing
- `connected` - Call answered
- `hangup` - Call ended
- `dispositions` - Agent added outcome
- `voicemail` - Went to voicemail

**Rate Limits:**
- Contact Centers: 100/min
- Webhooks: 100/min
- Subscriptions: 1200/min

---

### Supabase Edge Functions

**Base URL:** `https://{project-ref}.supabase.co/functions/v1`

**Functions:**

1. **provision-client**
   - Method: POST
   - Auth: Anon key required
   - Purpose: Automate client onboarding
   - Returns: Tenant ID, webhook URLs

2. **inbound-lead**
   - Method: POST
   - Auth: Anon key required (webhook secret validated internally)
   - Purpose: Process incoming leads
   - Returns: Lead ID, Contact ID

3. **dialpad-events**
   - Method: POST
   - Auth: Anon key required (JWT validated internally)
   - Purpose: Process call events from Dialpad
   - Returns: Success confirmation

**Environment Variables:**
```env
DIALPAD_API_KEY=your_dialpad_key
DIALPAD_OFFICE_ID=5886934402416640
SUPABASE_URL=auto-provided
SUPABASE_SERVICE_ROLE_KEY=auto-provided
```

---

## 🎨 Frontend Structure

### Technology Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **UI Components:** shadcn/ui (Radix UI + Tailwind CSS)
- **Routing:** React Router v6
- **State Management:** React hooks (useState, useEffect)
- **Database Client:** @supabase/supabase-js
- **Date Handling:** date-fns

### Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── Layout.tsx       # Main app layout with sidebar
│   ├── ProtectedRoute.tsx  # Role-based route protection
│   ├── LeadInfoPanel.tsx
│   ├── LeadTimeline.tsx
│   └── LeadActionPanel.tsx
│
├── pages/               # Route pages
│   ├── Dashboard.tsx    # Main metrics dashboard
│   ├── Leads.tsx        # Lead pipeline (Kanban)
│   ├── LeadDetails.tsx  # Individual lead view
│   ├── Calls.tsx        # Call history log
│   ├── AddClient.tsx    # Client provisioning form
│   ├── Settings.tsx     # System settings
│   └── Login.tsx        # Authentication
│
├── integrations/
│   └── supabase/
│       └── client.ts    # Supabase client config
│
├── services/            # API service layers
│   └── mockData.ts      # (Being phased out)
│
├── types/               # TypeScript type definitions
│   └── index.ts
│
├── hooks/               # Custom React hooks
│   └── use-toast.ts
│
├── App.tsx              # Root component & routing
└── main.tsx             # Entry point
```

### Key Pages

#### Dashboard (`/`)
- Overview metrics for selected tenant
- Speed-to-lead chart
- Connection rate gauge
- Booking rate trends
- Recent leads table
- Filters: Date range, tenant selector

#### Leads Pipeline (`/leads`)
- Kanban board (4 columns: Follow Up 1-4)
- Grouped by time since lead created
- Clickable cards navigate to details
- Client filter dropdown
- Real-time updates from database

#### Lead Details (`/lead/:id`)
- Contact information panel
- Call timeline/history
- Add call button (opens Dialpad)
- Add notes/activities
- Disposition tracking

#### Add Client (`/add-client`)
- Client name input
- Timezone selector
- Triggers provision-client edge function
- Shows webhook URLs on success

---

## 🔐 Authentication & Authorization

### Current Setup

**Protected Routes:**
```typescript
<ProtectedRoute allowedRoles={["admin"]}>
  <Component />
</ProtectedRoute>
```

### Row Level Security (RLS)

**Status:** Currently DISABLED for development

**Production RLS Policies Needed:**

```sql
-- Tenants: Admins see all, agents see assigned, clients see own
CREATE POLICY tenant_access ON tenants
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR id IN (
      SELECT tenant_id FROM user_tenant_assignments
      WHERE user_id = auth.uid()
    )
  );

-- Leads: Scoped by tenant access
CREATE POLICY lead_access ON leads
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE -- same logic as above
    )
  );

-- Similar for contacts, calls, webhooks
```

---

## 🚀 Deployment & Infrastructure

### Current Stack

- **Frontend Hosting:** Vercel (planned) / Local dev
- **Backend:** Supabase (Postgres + Edge Functions)
- **Database:** Supabase Postgres
- **Project ID:** sdcnxajrlmssfqccwfyc
- **Region:** ap-southeast-2 (Sydney)

### Environment Configuration

**Local Development:**
```env
# .env file
VITE_SUPABASE_URL=https://sdcnxajrlmssfqccwfyc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Supabase Secrets:**
```bash
# Set via CLI or dashboard
supabase secrets set DIALPAD_API_KEY=your_key
supabase secrets set DIALPAD_OFFICE_ID=5886934402416640
```

### Deployment Commands

**Edge Functions:**
```bash
# Deploy single function
supabase functions deploy provision-client

# Deploy all functions
supabase functions deploy
```

**Frontend:**
```bash
# Build
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to other hosting
```

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase CLI
- Git
- Dialpad API key (from Dialpad account)

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/joshacw/calltrax-dashboard.git
cd calltrax-dashboard

# 2. Install dependencies
npm install

# 3. Install Supabase CLI (macOS)
brew install supabase/tap/supabase

# 4. Login to Supabase
supabase login

# 5. Link to project
supabase link --project-ref sdcnxajrlmssfqccwfyc

# 6. Set environment variables
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# 7. Set Supabase secrets
supabase secrets set DIALPAD_API_KEY=your_dialpad_api_key
supabase secrets set DIALPAD_OFFICE_ID=your_office_id

# 8. Deploy edge functions
supabase functions deploy provision-client
supabase functions deploy inbound-lead
supabase functions deploy dialpad-events

# 9. Start dev server
npm run dev
```

### Database Setup

```sql
-- Run in Supabase SQL Editor
-- All tables already exist, but ensure RLS is disabled for dev:

ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks DISABLE ROW LEVEL SECURITY;
```

### Testing the Flow

**1. Provision a test client:**
```bash
curl -X POST http://localhost:8080/add-client
# Or use the UI
```

**2. Send a test lead:**
```bash
curl -X POST https://sdcnxajrlmssfqccwfyc.supabase.co/functions/v1/inbound-lead/{webhook-id} \
  -H "Authorization: Bearer {anon-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "contact": {"name": "Test Lead", "phone": "+61412345678"},
    "lead": {"source": "Website"}
  }'
```

**3. Check database:**
```sql
SELECT * FROM tenants ORDER BY created_at DESC LIMIT 5;
SELECT * FROM leads ORDER BY created_at DESC LIMIT 5;
SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5;
```

**4. Make a test call in Dialpad:**
- Login to Dialpad
- Switch to the test contact center
- Call the test lead's number
- Check `calls` table for new record

---

## 📊 Key Metrics & Queries

### Dashboard Queries

**Average Speed-to-Lead (Last 30 Days):**
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (first_call - created_at))/60) as avg_minutes
FROM (
  SELECT 
    l.created_at,
    MIN(c.started_at) as first_call
  FROM leads l
  LEFT JOIN calls c ON c.lead_id = l.id
  WHERE l.tenant_id = ?
    AND l.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY l.id, l.created_at
) subquery
WHERE first_call IS NOT NULL;
```

**Lead Response Rate:**
```sql
SELECT 
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE contacted = true) as contacted_leads,
  ROUND(
    COUNT(*) FILTER (WHERE contacted = true) * 100.0 / COUNT(*),
    2
  ) as response_rate
FROM (
  SELECT 
    l.id,
    EXISTS(
      SELECT 1 FROM calls c 
      WHERE c.lead_id = l.id 
      AND c.status IN ('connected', 'completed')
    ) as contacted
  FROM leads l
  WHERE l.tenant_id = ?
    AND l.created_at >= NOW() - INTERVAL '30 days'
) subquery;
```

---

## 🐛 Common Issues & Troubleshooting

### Issue: "Lead Not Found" on Details Page
**Cause:** LeadDetails was using mock data  
**Fix:** Updated to query Supabase database directly

### Issue: Leads Not Showing in Pipeline
**Cause:** Row Level Security blocking queries  
**Fix:** Disable RLS for development:
```sql
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
```

### Issue: Webhook Returns 401 Unauthorized
**Cause:** Edge functions require auth by default  
**Fix:** Created `.well-known/supabase/jwt.json` with `verify_jwt: false`

### Issue: Edge Function Can't Find Columns
**Cause:** Database schema missing expected columns  
**Fix:** Run ALTER TABLE to add missing columns

### Issue: Duplicate Data in Leads/Contacts
**Cause:** Both tables storing same info  
**Fix:** Remove duplicate columns from leads table (planned)

---

## 📝 TODO & Roadmap

### Immediate Priorities

- [ ] Enable RLS with proper policies for production
- [ ] Remove duplicate columns from leads table
- [ ] Add user authentication flow
- [ ] Implement agent assignment logic
- [ ] Create public dashboard for clients
- [ ] Add email notifications for new leads
- [ ] Implement SLA alerts (speed-to-lead > 5 min)

### Future Enhancements

- [ ] SMS notifications via Twilio
- [ ] Automated lead scoring
- [ ] AI-powered call transcription analysis
- [ ] Multi-channel lead sources (email, chat, etc.)
- [ ] Advanced reporting with custom date ranges
- [ ] Export to CSV functionality
- [ ] Webhook retry logic with exponential backoff
- [ ] Real-time dashboard updates via Supabase Realtime

---

## 📚 Resources & Documentation

### Internal Documentation
- Database Schema: See schema diagrams above
- API Endpoints: See API Integrations section
- Deployment Guide: See Deployment section

### External Resources
- [Dialpad API Docs](https://developers.dialpad.com/)
- [Supabase Docs](https://supabase.com/docs)
- [React Router v6](https://reactrouter.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

### Support Contacts
- **System Admin:** Josh Williams
- **Dialpad Support:** support.dialpad.com
- **Supabase Support:** support.supabase.com

---

## 🎓 Onboarding Checklist for New Developers

- [ ] Read this entire document
- [ ] Set up local development environment
- [ ] Successfully run `npm run dev`
- [ ] Provision a test client via UI
- [ ] Send a test lead via curl
- [ ] View the lead in the pipeline
- [ ] Click through to lead details
- [ ] Review all edge function code
- [ ] Understand the database schema
- [ ] Make a test code change and see it live
- [ ] Deploy an edge function update
- [ ] Review role-based access control logic
- [ ] Understand metrics calculation queries

---

**Document Version:** 1.0  
**Last Updated:** November 29, 2025  
**Maintained By:** CallTrax Development Team  
**Next Review:** December 15, 2025

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│ CALLTRAX QUICK REFERENCE                                     │
├─────────────────────────────────────────────────────────────┤
│ Supabase Project: sdcnxajrlmssfqccwfyc                      │
│ Region: ap-southeast-2 (Sydney)                             │
│ Frontend: http://localhost:8080                             │
│                                                              │
│ Key Tables:                                                  │
│  • tenants   → Clients                                      │
│  • contacts  → People (unique by phone)                     │
│  • leads     → Opportunities (many per contact)             │
│  • calls     → Call events & metrics                        │
│  • webhooks  → Integration configs                          │
│                                                              │
│ Edge Functions:                                              │
│  • provision-client  → Automate onboarding                  │
│  • inbound-lead      → Process new leads                    │
│  • dialpad-events    → Track call lifecycle                 │
│                                                              │
│ Key Metrics:                                                 │
│  • Speed-to-Lead: created_at → first started_at            │
│  • Connection Rate: connected / total calls                 │
│  • Booking Rate: booked / connected calls                   │
└─────────────────────────────────────────────────────────────┘
```
