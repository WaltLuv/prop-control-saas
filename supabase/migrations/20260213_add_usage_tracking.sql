-- Add usage_metadata column to profiles table to track feature usage (e.g., turn scopes)
-- This is a JSONB column to be flexible for future limits.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS usage_metadata JSONB DEFAULT '{}'::jsonb;

-- Example structure of usage_metadata:
-- {
--   "visual_sow_generated_count": 5,
--   "last_reset_date": "2024-02-01T00:00:00Z"
-- }
