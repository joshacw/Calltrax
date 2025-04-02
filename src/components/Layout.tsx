
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, Phone, Home, LogOut, Settings, Users, UserPlus, Mail, User } from "lucide-react";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col w-full">
          <header className="h-16 px-6 border-b flex items-center justify-between">
            <div className="flex items-center">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold ml-4">Lead Activators Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {user.name} ({user.role})
                  </span>
                  <button 
                    onClick={logout}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const AppSidebar = () => {
  const { user } = useAuth();
  
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-4">
          <img 
            src="/lovable-uploads/004d9328-a886-4a3e-bf4a-3a1c292cc0c5.png" 
            alt="Lead Activators Logo" 
            className="h-8 w-8"
          />
          <span className="text-xl font-bold">Lead Activators</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/dashboard">
                    <Home size={18} />
                    <span>Dashboard</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {user && user.role === "admin" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/leads">
                        <Users size={18} />
                        <span>Leads</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/calls">
                        <Phone size={18} />
                        <span>Calls</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/add-client">
                        <UserPlus size={18} />
                        <span>Add Client</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/reports">
                        <BarChart3 size={18} />
                        <span>Reports</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/settings">
                        <Settings size={18} />
                        <span>Settings</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
              
              {user && user.role === "client" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/team-members">
                        <Users size={18} />
                        <span>Team Members</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/email-reports">
                        <Mail size={18} />
                        <span>Email Reports</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/reports">
                        <BarChart3 size={18} />
                        <span>Reports</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/account">
                        <User size={18} />
                        <span>Account</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
              
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 text-xs text-muted-foreground">
          &copy; Lead Activators {new Date().getFullYear()}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
