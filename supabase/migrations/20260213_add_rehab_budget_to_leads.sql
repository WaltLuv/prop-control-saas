-- Add detailed_rehab_budget JSONB column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS detailed_rehab_budget JSONB DEFAULT '{}'::jsonb;

-- Create storage bucket for property images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('prop-images', 'prop-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated uploads to prop-images
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'prop-images' );

-- Policy to allow public read access
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING ( bucket_id = 'prop-images' );
