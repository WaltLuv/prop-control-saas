-- Migration: Advanced Investment Engine (Relational & Relational)
-- This implements the full Postgres-side logic for PropControl.

-- 1. Create an Enum for Distress Types (Idempotent check)
DO $$ BEGIN
    CREATE TYPE public.distress_type AS ENUM ('Tax Lien', 'Pre-Foreclosure', 'Probate', 'Vacant', 'None');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create the relational 'leads' table
-- Note: It references 'assets' (the existing property table in PropControl)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    distress_indicator public.distress_type DEFAULT 'None',
    total_liabilities NUMERIC(12, 2) DEFAULT 0,
    estimated_value NUMERIC(12, 2) DEFAULT 0,
    moltbot_status TEXT DEFAULT 'queued', -- 'queued', 'skip-tracing', 'contacted'
    owner_phone TEXT,
    vision_analysis JSONB,
    condition_score NUMERIC(3, 1),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create the "Investment Ideas" View (The Logic Engine)
-- This view allows the frontend to simply "Select *" and get all calculated metrics.
CREATE OR REPLACE VIEW public.investment_ideas_dashboard AS
SELECT 
    l.id AS lead_id,
    l.asset_id,
    a.address,
    a.name AS property_name,
    l.distress_indicator,
    l.total_liabilities,
    l.estimated_value,
    -- Calculate Equity % (Safe divide)
    ((l.estimated_value - l.total_liabilities) / NULLIF(l.estimated_value, 0)) AS equity_pct,
    -- Define Equity Level Bucket
    CASE 
        WHEN ((l.estimated_value - l.total_liabilities) / NULLIF(l.estimated_value, 0)) >= 0.5 THEN 'High'
        WHEN ((l.estimated_value - l.total_liabilities) / NULLIF(l.estimated_value, 0)) >= 0.2 THEN 'Medium'
        ELSE 'Low'
    END AS equity_level,
    l.moltbot_status,
    l.owner_phone,
    l.vision_analysis,
    l.condition_score,
    l.image_url,
    l.created_at
FROM public.leads l
JOIN public.assets a ON l.asset_id = a.id
WHERE l.distress_indicator != 'None';

-- 4. Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Users can manage their own leads" ON public.leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.assets 
            WHERE assets.id = leads.asset_id 
            AND assets.user_id = auth.uid()
        )
    );

-- 6. Comprehensive Seed Data (Distress & Equity Scenarios)
DO $$
DECLARE
    asset_1_id UUID := gen_random_uuid();
    asset_2_id UUID := gen_random_uuid();
    asset_3_id UUID := gen_random_uuid();
    asset_4_id UUID := gen_random_uuid();
    asset_5_id UUID := gen_random_uuid();
    asset_6_id UUID := gen_random_uuid();
BEGIN
    -- Insert Assets (Portfolio/Sourcing Props)
    INSERT INTO public.assets (id, address, city, state, zip_code, status) VALUES
    (asset_1_id, '482 Oak St', 'Columbus', 'OH', '43215', 'sourcing'),
    (asset_2_id, '1202 Dublin Rd', 'Columbus', 'OH', '43215', 'sourcing'),
    (asset_3_id, '75 High St', 'Dublin', 'OH', '43017', 'sourcing'),
    (asset_4_id, '15 E Broad St', 'Columbus', 'OH', '43215', 'sourcing'),
    (asset_5_id, '88 Riverside Dr', 'Dublin', 'OH', '43017', 'sourcing'),
    (asset_6_id, '222 Market St', 'Columbus', 'OH', '43201', 'sourcing')
    ON CONFLICT (id) DO NOTHING;

    -- 1. High Equity, Tax Lien (Hot Lead / Alpha Target)
    INSERT INTO public.leads (asset_id, distress_indicator, estimated_value, total_liabilities, moltbot_status, vision_analysis, condition_score)
    VALUES (asset_1_id, 'Tax Lien', 245000, 45000, 'queued', '{"roof": 4, "windows": 3, "lawn": 2, "summary": "Visible roof distress and overgrown lawn."}', 3.0);

    -- 2. High Equity, Probate (Hot Lead)
    INSERT INTO public.leads (asset_id, distress_indicator, estimated_value, total_liabilities, moltbot_status)
    VALUES (asset_2_id, 'Probate', 420000, 110000, 'queued');

    -- 3. Medium Equity, Pre-Foreclosure
    INSERT INTO public.leads (asset_id, distress_indicator, estimated_value, total_liabilities, moltbot_status)
    VALUES (asset_3_id, 'Pre-Foreclosure', 310000, 195000, 'queued');

    -- 4. Low Equity, Vacant
    INSERT INTO public.leads (asset_id, distress_indicator, estimated_value, total_liabilities, moltbot_status)
    VALUES (asset_4_id, 'Vacant', 185000, 165000, 'queued');

    -- 5. High Equity, Vacant (Ugly House / Moltbot Researching)
    INSERT INTO public.leads (asset_id, distress_indicator, estimated_value, total_liabilities, moltbot_status, vision_analysis, condition_score)
    VALUES (asset_5_id, 'Vacant', 290000, 25000, 'skip-tracing', '{"roof": 2, "windows": 2, "lawn": 1, "summary": "Boarded up windows, major roof tarping."}', 1.7);

    -- 6. High Equity, Tax Lien (Contacted / Live Lead)
    INSERT INTO public.leads (asset_id, distress_indicator, estimated_value, total_liabilities, moltbot_status, owner_phone)
    VALUES (asset_6_id, 'Tax Lien', 550000, 85000, 'contacted', '(614) 555-0921');

END $$;

-- 7. Enable Realtime Replication for this table
-- This allows the React frontend to receive live updates when Moltbot modifies a lead.
BEGIN;
  -- Remove the table from publication first if it exists to avoid errors (idempotency)
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.leads;
  -- Add the table to the publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
-- 8. Database Triggers for Agentic Automation
-- This function sends a POST request to your Edge Function for Hot Leads
CREATE OR REPLACE FUNCTION public.notify_moltbot_of_hot_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- We use the View's logic here: Check if it's High equity and has distress
  -- Note: In a real environment, you'd calculate this or use the view values
  IF (NEW.moltbot_status = 'queued' AND NEW.distress_indicator != 'None') THEN
    -- PERFORMS the webhook call (Requires pg_net extension in Supabase)
    -- PERFORM net.http_post(...); 
    NULL; -- Placeholder as exact URL/Key depends on deployment
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- This function triggers the Skip-Trace Processor
CREATE OR REPLACE FUNCTION public.notify_skip_trace_processor()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.moltbot_status = 'skip-tracing' AND OLD.moltbot_status != 'skip-tracing') THEN
    -- Trigger the researcher brain
    -- PERFORM net.http_post(...);
    NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- This function triggers the Property Vision Analyzer
CREATE OR REPLACE FUNCTION public.notify_vision_analyzer()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger inspection for every new lead automatically
  -- PERFORM net.http_post(...);
  NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach Triggers (Only for Manual Actions initiated by the User)
-- Note: We REMOVE on_hot_lead_found and on_new_lead_vision 
-- to ensure Moltbot ONLY acts when the user clicks a button.

DROP TRIGGER IF EXISTS on_hot_lead_found ON public.leads;
DROP TRIGGER IF EXISTS on_new_lead_vision ON public.leads;

DROP TRIGGER IF EXISTS on_skip_trace_triggered ON public.leads;
CREATE TRIGGER on_skip_trace_triggered
AFTER UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.notify_skip_trace_processor();

COMMIT;
