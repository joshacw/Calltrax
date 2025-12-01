// src/contexts/AuthContext.tsx
// Fixed auth context with persistent sessions

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'operator' | 'client' | 'agency';
  tenant_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  login: (email: string, password: string) => Promise<{ error: Error | null }>; // Alias for signIn
  signOut: () => Promise<void>;
  logout: () => Promise<void>; // Alias for signOut
  isAdmin: boolean;
  isOperator: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize: Check for existing session
    const initializeAuth = async () => {
      try {
        // Get the current session from Supabase
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchProfile(currentSession.user.id);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Use setTimeout to avoid potential race conditions with Supabase
          setTimeout(() => {
            fetchProfile(newSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }

        // Handle specific events
        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, tenant_id')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        // Don't throw - just use default profile
        setProfile({
          id: userId,
          email: user?.email || null,
          full_name: user?.user_metadata?.full_name || null,
          role: 'operator',
          tenant_id: null,
        });
        return;
      }

      if (data) {
        setProfile(data);
      } else {
        // Profile doesn't exist - create a default one
        console.log('Profile not found, creating default profile');
        const { data: userData } = await supabase.auth.getUser();

        const newProfile: Profile = {
          id: userId,
          email: userData.user?.email || null,
          full_name: userData.user?.user_metadata?.full_name || null,
          role: 'operator',
          tenant_id: null,
        };

        // Try to insert the profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile);

        if (insertError) {
          console.log('Could not create profile:', insertError.message);
        }

        setProfile(newProfile);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      // Use a default profile on error
      setProfile({
        id: userId,
        email: user?.email || null,
        full_name: null,
        role: 'operator',
        tenant_id: null,
      });
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Session will be set by onAuthStateChange listener
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signIn,
    login: signIn, // Alias for backwards compatibility
    signOut,
    logout: signOut, // Alias for backwards compatibility
    isAdmin: profile?.role === 'admin',
    isOperator: profile?.role === 'operator',
    isClient: profile?.role === 'client',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}