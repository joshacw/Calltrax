
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
            
            <Route path="/leads" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Leads />
              </ProtectedRoute>
            } />
            
            <Route path="/calls" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Calls />
              </ProtectedRoute>
            } />
            
            <Route path="/add-client" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AddClient />
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
            
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
