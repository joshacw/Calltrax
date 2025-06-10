import { User } from "@/types";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { authenticateUser } from "@/services/mockData";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session?.user) {
          // Convert Supabase user to our app's User type
          // We'll fetch the user's profile in a separate call
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Query the profiles table directly with proper typing
      const { data, error } = await supabase
        .from('profiles' as any)
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        // If profile doesn't exist, create a basic user object
        setUser({
          id: userId,
          email: session?.user?.email || '',
          name: session?.user?.email?.split('@')[0] || 'User',
          role: 'client',
          clientId: undefined,
          agencyId: undefined
        });
      } else if (data) {
        setUser({
          id: userId,
          email: session?.user?.email || '',
          name: data.name || session?.user?.email?.split('@')[0] || 'User',
          role: (data.role as 'admin' | 'client' | 'agency') || 'client',
          clientId: data.client_id || undefined,
          agencyId: data.agency_id || undefined
        });
      } else {
        // No profile found, create a basic user object
        setUser({
          id: userId,
          email: session?.user?.email || '',
          name: session?.user?.email?.split('@')[0] || 'User',
          role: 'client',
          clientId: undefined,
          agencyId: undefined
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to basic user object
      setUser({
        id: userId,
        email: session?.user?.email || '',
        name: session?.user?.email?.split('@')[0] || 'User',
        role: 'client',
        clientId: undefined,
        agencyId: undefined
      });
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // First check if using demo credentials
      if ((email === "admin@calltrax.com" || email === "client1@example.com") && password === "password") {
        // Use mock authentication for demo accounts
        const mockUser = authenticateUser(email, password);
        
        if (mockUser) {
          setUser(mockUser);
          setLoading(false);
          navigate("/dashboard");
          toast.success("Successfully logged in with demo account!");
          return;
        }
      }

      // Otherwise, use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        // The user profile will be set by the onAuthStateChange listener
        navigate("/dashboard");
        toast.success("Successfully logged in!");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    }
  };

  const logout = async () => {
    try {
      // Check if using a mock user
      if (user && !session) {
        setUser(null);
        navigate("/login");
        toast.success("Successfully logged out");
        return;
      }

      // Otherwise, use Supabase logout
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      navigate("/login");
      toast.success("Successfully logged out");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An error occurred during logout");
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
