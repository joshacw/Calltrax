// src/contexts/TenantContext.tsx
// Universal tenant selector context - manages tenant selection across all pages

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  timezone: string;
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

  // Fetch tenants from database with access filtering
  useEffect(() => {
    async function fetchTenants() {
      if (authLoading || !profile) {
        return;
      }

      try {
        // Get all tenants
        const { data: allTenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('id, name, slug, timezone')
          .order('name');

        if (tenantsError) {
          console.error('Error fetching tenants:', tenantsError);
          return;
        }

        if (!allTenants) {
          return;
        }

        // Get user's session to access user ID
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        // Query user_tenant_access table
        const { data: accessData } = await supabase
          .from('user_tenant_access')
          .select('tenant_id')
          .eq('user_id', user.id);

        const accessibleTenantIds = accessData?.map(a => a.tenant_id) || [];

        // Filter tenants based on access rules
        let filteredTenants = allTenants;

        if (profile.is_demo_account) {
          // Demo accounts: only show accessible tenants
          filteredTenants = allTenants.filter(t => accessibleTenantIds.includes(t.id));
        } else if (profile.role === 'admin') {
          // Non-demo admin: show all tenants
          filteredTenants = allTenants;
        } else if (profile.role === 'operator') {
          // Operators: only show accessible tenants
          filteredTenants = allTenants.filter(t => accessibleTenantIds.includes(t.id));
        } else if (profile.role === 'client') {
          // Clients: only their assigned tenant
          filteredTenants = allTenants.filter(t => t.id === profile.tenant_id);
        }

        setTenants(filteredTenants);
      } catch (err) {
        console.error('Error in fetchTenants:', err);
      }
    }

    fetchTenants();
  }, [profile, authLoading]);

  // Initialize selected tenant based on role and localStorage
  useEffect(() => {
    if (authLoading || tenants.length === 0) {
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

      // Only allow Global View if user has access to more than 1 tenant
      if ((stored === GLOBAL_VIEW_VALUE || !stored) && tenants.length > 1) {
        // Global View
        setSelectedTenantIdState(null);
      } else if (tenants.length === 1) {
        // Only one tenant - auto-select it
        setSelectedTenantIdState(tenants[0].id);
      } else {
        // Specific tenant from localStorage
        setSelectedTenantIdState(stored);
      }
    } catch (err) {
      console.error('Error reading from localStorage:', err);
      // Default to Global View if multiple tenants, otherwise first tenant
      if (tenants.length > 1) {
        setSelectedTenantIdState(null);
      } else if (tenants.length === 1) {
        setSelectedTenantIdState(tenants[0].id);
      }
    }

    setLoading(false);
  }, [profile, authLoading, tenants]);

  // Update localStorage when selection changes (except for client role)
  const setSelectedTenantId = (id: string | null) => {
    // Prevent client role from changing tenant
    if (profile?.role === 'client') {
      return;
    }

    // Prevent Global View if user only has access to 1 tenant
    if (id === null && tenants.length <= 1) {
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
