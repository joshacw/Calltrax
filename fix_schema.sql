-- Add missing columns to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS dialpad_cc_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS dialpad_cc_phone TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Australia/Perth',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index
CREATE INDEX IF NOT EXISTS idx_tenants_dialpad_cc_id ON tenants(dialpad_cc_id);
