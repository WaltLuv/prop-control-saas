-- Migration: Kimi 2.5 Agent Swarm Engine
-- Replacing legacy single-agent logic with PARL-driven Swarm architecture.

-- 1. Create an Enum for Distress Types (Idempotent check)
DO $$ BEGIN
    CREATE TYPE public.distress_type AS ENUM ('Tax Lien', 'Pre-Foreclosure', 'Probate', 'Vacant', 'None');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create/Update the 'leads' table
-- We rename moltbot_status to swarm_status
DROP TABLE IF EXISTS public.leads CASCADE;
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    distress_indicator public.distress_type DEFAULT 'None',
    total_liabilities NUMERIC(12, 2) DEFAULT 0,
    estimated_value NUMERIC(12, 2) DEFAULT 0,
    swarm_status TEXT DEFAULT 'Queued', -- 'Queued', 'Deploying', 'Researching', 'Completed'
    owner_phone TEXT,
    vision_analysis JSONB,
    condition_score NUMERIC(3, 1),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Update the Dashboard View
CREATE OR REPLACE VIEW public.investment_ideas_dashboard AS
SELECT 
    l.id AS lead_id,
    l.asset_id,
    a.address,
    a.name AS property_name,
    l.distress_indicator,
    l.total_liabilities,
    l.estimated_value,
    ((l.estimated_value - l.total_liabilities) / NULLIF(l.estimated_value, 0)) AS equity_pct,
    CASE 
        WHEN ((l.estimated_value - l.total_liabilities) / NULLIF(l.estimated_value, 0)) >= 0.5 THEN 'High'
        WHEN ((l.estimated_value - l.total_liabilities) / NULLIF(l.estimated_value, 0)) >= 0.2 THEN 'Medium'
        ELSE 'Low'
    END AS equity_level,
    l.swarm_status,
    l.owner_phone,
    l.vision_analysis,
    l.condition_score,
    l.image_url,
    l.created_at
FROM public.leads l
JOIN public.assets a ON l.asset_id = a.id
WHERE l.distress_indicator != 'None';

-- 4. RLS and Realtime
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own leads" ON public.leads FOR ALL USING (
    EXISTS (SELECT 1 FROM public.assets WHERE assets.id = leads.asset_id AND assets.user_id = auth.uid())
);

ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;

-- 5. Swarm Triggers (PARL Orchestration)
CREATE OR REPLACE FUNCTION public.notify_swarm_orchestrator()
RETURNS TRIGGER AS $$
BEGIN
  -- Manual trigger for Kimi Swarm
  IF (NEW.swarm_status = 'Deploying' AND OLD.swarm_status != 'Deploying') THEN
    -- Trigger the Kimi Swarm via MCP hook (Placeholder)
    NULL; 
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_swarm_triggered ON public.leads;
CREATE TRIGGER on_swarm_triggered
AFTER UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.notify_swarm_orchestrator();

-- 6. Swarm Seed Data
DO $$
DECLARE
    a1 UUID := gen_random_uuid();
    a2 UUID := gen_random_uuid();
    a3 UUID := gen_random_uuid();
BEGIN
    INSERT INTO public.assets (id, address, city, state, zip_code, status) VALUES
    (a1, '432 Tech Dr', 'Gahanna', 'OH', '43230', 'sourcing'),
    (a2, '99 Innovation Way', 'Gahanna', 'OH', '43230', 'sourcing'),
    (a3, '777 Wealth Blvd', 'Columbus', 'OH', '43215', 'sourcing')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.leads (asset_id, distress_indicator, estimated_value, total_liabilities, swarm_status)
    VALUES 
    (a1, 'Tax Lien', 350000, 45000, 'Queued'),
    (a2, 'Probate', 520000, 120000, 'Queued'),
    (a3, 'Vacant', 210000, 15000, 'Queued');
END $$;

COMMIT;
