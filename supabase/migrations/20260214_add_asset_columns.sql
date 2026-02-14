-- Add new columns to assets table
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS city text DEFAULT '',
ADD COLUMN IF NOT EXISTS state text DEFAULT '',
ADD COLUMN IF NOT EXISTS zip text DEFAULT '',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'STABILIZED',
ADD COLUMN IF NOT EXISTS property_type text DEFAULT 'MULTIFAMILY';

-- Update existing rows to have default values if they are null
UPDATE public.assets SET city = '' WHERE city IS NULL;
UPDATE public.assets SET state = '' WHERE state IS NULL;
UPDATE public.assets SET zip = '' WHERE zip IS NULL;
UPDATE public.assets SET status = 'STABILIZED' WHERE status IS NULL;
UPDATE public.assets SET property_type = 'MULTIFAMILY' WHERE property_type IS NULL;
