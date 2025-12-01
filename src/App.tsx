
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Calls from "./pages/Calls";
import AddClient from "./pages/AddClient";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import ApiEndpoints from "./pages/ApiEndpoints";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import TeamMembers from "./pages/TeamMembers";
import EmailReports from "./pages/EmailReports";
import ClientAccount from "./pages/ClientAccount";
import GohighlevelIntegration from "./pages/GohighlevelIntegration";
import SubAccounts from "./pages/SubAccounts";
import PublicDashboard from "./pages/PublicDashboard";
import Insights from "./pages/Insights";
import LeadDetails from "./pages/LeadDetails";
import Tasks from "./pages/Tasks";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TenantProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/api-docs" element={<ApiEndpoints />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route path="/dashboard/public/:dashboardId" element={<PublicDashboard />} />

            <Route path="/leads" element={
              <ProtectedRoute allowedRoles={["admin", "operator"]}>
                <Leads />
              </ProtectedRoute>
            } />

            <Route path="/lead/:leadId" element={
              <ProtectedRoute allowedRoles={["admin", "operator"]}>
                <LeadDetails />
              </ProtectedRoute>
            } />

            <Route path="/calls" element={
              <ProtectedRoute allowedRoles={["admin", "operator"]}>
                <Calls />
              </ProtectedRoute>
            } />

            <Route path="/add-client" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AddClient />
              </ProtectedRoute>
            } />

            <Route path="/insights" element={
              <ProtectedRoute>
                <Insights />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Settings />
              </ProtectedRoute>
            } />

            <Route path="/team-members" element={
              <ProtectedRoute allowedRoles={["client"]}>
                <TeamMembers />
              </ProtectedRoute>
            } />

            <Route path="/email-reports" element={
              <ProtectedRoute allowedRoles={["client"]}>
                <EmailReports />
              </ProtectedRoute>
            } />

            <Route path="/account" element={
              <ProtectedRoute allowedRoles={["client"]}>
                <ClientAccount />
              </ProtectedRoute>
            } />

            <Route path="/gohighlevel-integration" element={
              <ProtectedRoute allowedRoles={["client"]}>
                <GohighlevelIntegration />
              </ProtectedRoute>
            } />

            <Route path="/subaccounts" element={
              <ProtectedRoute allowedRoles={["agency"]}>
                <SubAccounts />
              </ProtectedRoute>
            } />
            <Route path="/tasks" element={
              <ProtectedRoute allowedRoles={["admin", "operator"]}>
                <Tasks />
              </ProtectedRoute>
            } />

            <Route path="/tasks" element={
              <ProtectedRoute allowedRoles={['admin', 'operator']}>
                <Tasks />
              </ProtectedRoute>
            } />

            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </TooltipProvider>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
