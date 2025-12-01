// src/components/TenantSelector.tsx
// Universal tenant selector for the sidebar

import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Globe, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TenantSelector = () => {
  const { tenants, selectedTenantId, selectedTenant, isGlobalView, setSelectedTenantId, loading } = useTenant();
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Don't show selector for client role users
  if (profile?.role === 'client') {
    return null;
  }

  if (loading) {
    return (
      <div className="px-3 py-2">
        <div className="h-10 bg-slate-800 rounded-md animate-pulse" />
      </div>
    );
  }

  const handleValueChange = (value: string) => {
    if (value === 'global') {
      setSelectedTenantId(null);
    } else if (value === 'add-client') {
      navigate('/add-client');
    } else {
      setSelectedTenantId(value);
    }
  };

  const displayValue = isGlobalView
    ? 'global'
    : selectedTenantId || 'global';

  return (
    <div className="px-3 py-2">
      <Select value={displayValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700 focus:ring-slate-600">
          <SelectValue>
            {isGlobalView ? (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>Global View</span>
              </div>
            ) : (
              <span>{selectedTenant?.name || 'Select Client'}</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700">
          {/* Global View Option */}
          <SelectItem
            value="global"
            className="text-white hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Global View</span>
            </div>
          </SelectItem>

          <Separator className="my-1 bg-slate-700" />

          {/* Tenant List */}
          {tenants.map((tenant) => (
            <SelectItem
              key={tenant.id}
              value={tenant.id}
              className="text-white hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
            >
              {tenant.name}
            </SelectItem>
          ))}

          <Separator className="my-1 bg-slate-700" />

          {/* Add New Client */}
          <SelectItem
            value="add-client"
            className="text-white hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add New Client</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
