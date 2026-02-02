-- Migration: Swarm Mission Control Settings
-- This table stores user-specific thresholds for the Kimi 2.5 Agent Swarm.

CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    auto_skip_trace BOOLEAN DEFAULT false,
    auto_mail_distress BOOLEAN DEFAULT false,
    enable_sms_alerts BOOLEAN DEFAULT true,
    min_equity_percent INTEGER DEFAULT 40,
    max_condition_score INTEGER DEFAULT 5,
    daily_budget_limit_cents INTEGER DEFAULT 500,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
