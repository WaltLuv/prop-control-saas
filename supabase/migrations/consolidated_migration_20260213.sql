-- ==========================================
-- CONSOLIDATED MIGRATION SCRIPT FOR DEEP REHAB ANALYZER
-- ==========================================


-- 0. Ensure Base Tables Exist (Idempotent)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    units INTEGER DEFAULT 1,
    manager TEXT,
    status TEXT DEFAULT 'active',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enum for Distress (if missing)
DO $$ BEGIN
    CREATE TYPE public.distress_type AS ENUM ('Tax Lien', 'Pre-Foreclosure', 'Probate', 'Vacant', 'None');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    distress_indicator public.distress_type DEFAULT 'None',
    total_liabilities NUMERIC(12, 2) DEFAULT 0,
    estimated_value NUMERIC(12, 2) DEFAULT 0,
    moltbot_status TEXT DEFAULT 'queued',
    owner_phone TEXT,
    owner_email TEXT,
    vision_analysis JSONB,
    condition_score NUMERIC(3, 1),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Add the new column here directly if creating fresh, or ALTER below if exists
    detailed_rehab_budget JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on these if just created
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 1. Add Trial Columns (from 20260213_add_trial_columns.sql)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE;

-- 2. Add Usage Tracking (from 20260213_add_usage_tracking.sql)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS usage_metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Add Rehab Budget (Idempotent check in case table existed but col didn't)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS detailed_rehab_budget JSONB DEFAULT '{}'::jsonb;

-- Create storage bucket for property images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('prop-images', 'prop-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated uploads to prop-images
DO
$$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated uploads' AND tablename = 'objects' AND schemaname = 'storage' 
    ) THEN
        CREATE POLICY "Allow authenticated uploads"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK ( bucket_id = 'prop-images' );
    END IF;
END
$$;

-- Policy to allow public read access
DO
$$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Allow public read access"
        ON storage.objects
        FOR SELECT
        TO public
        USING ( bucket_id = 'prop-images' );
    END IF;
END
$$;
