-- Create Cache Tables (Store API responses to save costs/latency)
-- RLS: Readable by authenticated users (for now, or restriced to owner if property_id link is strong)
-- Using address_hash for lookups to avoid issues with formatting

-- 1. Rent Estimate Cache
create table if not exists property_rent_cache (
  id uuid default uuid_generate_v4() primary key,
  property_id text, -- Loose link to assets table, can be updated
  address_hash text not null,
  payload jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);

create index if not exists idx_rent_cache_address_hash on property_rent_cache(address_hash);
create index if not exists idx_rent_cache_expires_at on property_rent_cache(expires_at);

alter table property_rent_cache enable row level security;

create policy "Authenticated users can read rent cache"
  on property_rent_cache for select
  to authenticated
  using (true);
  
create policy "Service role can manage rent cache"
  on property_rent_cache for all
  to service_role
  using (true)
  with check (true);


-- 2. Appraisal Cache
create table if not exists property_appraisal_cache (
  id uuid default uuid_generate_v4() primary key,
  property_id text,
  address_hash text not null,
  payload jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);

create index if not exists idx_appraisal_cache_address_hash on property_appraisal_cache(address_hash);
create index if not exists idx_appraisal_cache_expires_at on property_appraisal_cache(expires_at);

alter table property_appraisal_cache enable row level security;

create policy "Authenticated users can read appraisal cache"
  on property_appraisal_cache for select
  to authenticated
  using (true);

create policy "Service role can manage appraisal cache"
  on property_appraisal_cache for all
  to service_role
  using (true)
  with check (true);


-- 3. Comps Cache (Stores search results from RentCast)
create table if not exists property_comps_cache (
  id uuid default uuid_generate_v4() primary key,
  search_hash text not null, -- Hash of search params (radius, bed/bath filters, address)
  payload jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);

create index if not exists idx_comps_cache_search_hash on property_comps_cache(search_hash);

alter table property_comps_cache enable row level security;

create policy "Authenticated users can read comps cache"
  on property_comps_cache for select
  to authenticated
  using (true);

create policy "Service role can manage comps cache"
  on property_comps_cache for all
  to service_role
  using (true)
  with check (true);


-- 4. Rent Snapshots (User saves a specific estimate for a property)
create table if not exists property_rent_snapshots (
  id uuid default uuid_generate_v4() primary key,
  property_id text not null, -- Links to asset.id (string based in this app)
  user_id uuid references auth.users(id) not null,
  payload jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table property_rent_snapshots enable row level security;

create policy "Users can manage their own rent snapshots"
  on property_rent_snapshots for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 5. Appraisal Snapshots (User saves a specific valuation)
create table if not exists property_appraisal_snapshots (
  id uuid default uuid_generate_v4() primary key,
  property_id text not null,
  user_id uuid references auth.users(id) not null,
  payload jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table property_appraisal_snapshots enable row level security;

create policy "Users can manage their own appraisal snapshots"
  on property_appraisal_snapshots for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 6. Comp Sets (User saves a specific set of comps for ARV)
create table if not exists property_comp_sets (
  id uuid default uuid_generate_v4() primary key,
  property_id text not null,
  user_id uuid references auth.users(id) not null,
  name text default 'Saved Comp Set',
  filter_criteria jsonb, -- The filters used (radius, etc)
  selected_comp_ids jsonb, -- Array of comp IDs or objects that were 'checked'
  arv_result_snapshot jsonb, -- Optional: snapshot of the ARV calc at that time
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table property_comp_sets enable row level security;

create policy "Users can manage their own comp sets"
  on property_comp_sets for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
