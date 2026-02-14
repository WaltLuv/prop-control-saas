-- Add trial columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE;
