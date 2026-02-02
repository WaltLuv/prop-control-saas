-- Migration: Swarm Sourcing View (Discovery Engine)
-- Updating legacy tables to match Kimi 2.5 Swarm Paradigm.

-- Update Table Column
ALTER TABLE IF EXISTS public.investment_leads 
RENAME COLUMN moltbot_status TO swarm_status;

-- Update View
CREATE OR REPLACE VIEW public.investment_ideas_view AS
SELECT 
    id,
    user_id,
    property_address,
    distress_indicator,
    estimated_market_value,
    total_liabilities,
    swarm_status,
    image_url,
    (estimated_market_value - total_liabilities) / NULLIF(estimated_market_value, 0) AS equity_pct,
    CASE 
        WHEN (estimated_market_value - total_liabilities) / NULLIF(estimated_market_value, 0) >= 0.50 THEN 'High'
        WHEN (estimated_market_value - total_liabilities) / NULLIF(estimated_market_value, 0) BETWEEN 0.20 AND 0.49 THEN 'Medium'
        ELSE 'Low'
    END AS equity_level
FROM public.investment_leads
WHERE distress_indicator != 'None';
