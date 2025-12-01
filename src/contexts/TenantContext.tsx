// src/contexts/TenantContext.tsx
// Universal tenant selector context - manages tenant selection across all pages

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface TenantContextType {
  tenants: Tenant[];
  selectedTenant: Tenant | null;  // null = Global View
  selectedTenantId: string | null;
  isGlobalView: boolean;
  setSelectedTenantId: (id: string | null) => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const STORAGE_KEY = 'calltrax_selected_tenant';
const GLOBAL_VIEW_VALUE = 'global';

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { profile, loading: authLoading } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch tenants from database
  useEffect(() => {
    async function fetchTenants() {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('id, name, slug')
          .order('name');

        if (error) {
          console.error('Error fetching tenants:', error);
          return;
        }

        if (data) {
          setTenants(data);
        }
      } catch (err) {
        console.error('Error in fetchTenants:', err);
      }
    }

    fetchTenants();
  }, []);

  // Initialize selected tenant based on role and localStorage
  useEffect(() => {
    if (authLoading) {
      return;
    }

    // For client role: auto-select their tenant and don't allow changes
    if (profile?.role === 'client' && profile.tenant_id) {
      setSelectedTenantIdState(profile.tenant_id);
      setLoading(false);
      return;
    }

    // For admin/operator: check localStorage or default to Global View
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored === GLOBAL_VIEW_VALUE || !stored) {
        // Global View
        setSelectedTenantIdState(null);
      } else {
        // Specific tenant
        setSelectedTenantIdState(stored);
      }
    } catch (err) {
      console.error('Error reading from localStorage:', err);
      // Default to Global View on error
      setSelectedTenantIdState(null);
    }

    setLoading(false);
  }, [profile, authLoading]);

  // Update localStorage when selection changes (except for client role)
  const setSelectedTenantId = (id: string | null) => {
    // Prevent client role from changing tenant
    if (profile?.role === 'client') {
      return;
    }

    setSelectedTenantIdState(id);

    try {
      if (id === null) {
        localStorage.setItem(STORAGE_KEY, GLOBAL_VIEW_VALUE);
      } else {
        localStorage.setItem(STORAGE_KEY, id);
      }
    } catch (err) {
      console.error('Error writing to localStorage:', err);
    }
  };

  // Compute derived values
  const selectedTenant = selectedTenantId
    ? tenants.find(t => t.id === selectedTenantId) || null
    : null;

  const isGlobalView = selectedTenantId === null;

  const value: TenantContextType = {
    tenants,
    selectedTenant,
    selectedTenantId,
    isGlobalView,
    setSelectedTenantId,
    loading,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
