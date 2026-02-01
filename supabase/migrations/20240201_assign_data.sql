
-- Assignment Script: Link orphan data to newmoney2217@gmail.com
-- Includes Schema patches for missing columns

DO $$
DECLARE
  target_user_id UUID;
  target_email TEXT := 'newmoney2217@gmail.com';
BEGIN
  -- 1. Find the User ID
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User % not found. Please ensure the user has signed up.', target_email;
    RETURN;
  END IF;

  RAISE NOTICE 'Assigning data to User ID: %', target_user_id;

  -- 2. Ensure Profile Exists & is synced
  INSERT INTO public.profiles (id, email, plan, subscription_status)
  VALUES (target_user_id, target_email, 'FREE', 'active')
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  -- 3. Update Assets (Add column if missing, then assign)
  -- Check if user_id exists in assets
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='user_id') THEN
      RAISE NOTICE 'Adding user_id to assets table...';
      ALTER TABLE public.assets ADD COLUMN user_id UUID REFERENCES public.profiles(id);
  END IF;

  UPDATE public.assets 
  SET user_id = target_user_id 
  WHERE user_id != target_user_id OR user_id IS NULL;

  -- 4. Update Tenants
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='user_id') THEN
      RAISE NOTICE 'Adding user_id to tenants table...';
      ALTER TABLE public.tenants ADD COLUMN user_id UUID REFERENCES public.profiles(id);
  END IF;

  UPDATE public.tenants 
  SET user_id = target_user_id 
  WHERE user_id != target_user_id OR user_id IS NULL;

  -- 5. Update Contractors
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contractors' AND column_name='user_id') THEN
      RAISE NOTICE 'Adding user_id to contractors table...';
      ALTER TABLE public.contractors ADD COLUMN user_id UUID REFERENCES public.profiles(id);
  END IF;

  UPDATE public.contractors 
  SET user_id = target_user_id 
  WHERE user_id != target_user_id OR user_id IS NULL;

  -- 6. Update Jobs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='user_id') THEN
      RAISE NOTICE 'Adding user_id to jobs table...';
      ALTER TABLE public.jobs ADD COLUMN user_id UUID REFERENCES public.profiles(id);
  END IF;

  UPDATE public.jobs 
  SET user_id = target_user_id 
  WHERE user_id != target_user_id OR user_id IS NULL;

  -- 7. Update KPI Entries
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kpi_entries' AND column_name='user_id') THEN
      RAISE NOTICE 'Adding user_id to kpi_entries table...';
      ALTER TABLE public.kpi_entries ADD COLUMN user_id UUID REFERENCES public.profiles(id);
  END IF;

  UPDATE public.kpi_entries 
  SET user_id = target_user_id 
  WHERE user_id != target_user_id OR user_id IS NULL;

  RAISE NOTICE 'Data assignment complete.';
END $$;
