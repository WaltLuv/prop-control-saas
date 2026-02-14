-- Property Analysis Suite Migration
-- Adds caching and snapshot tables for RentCast data integration

-- 1. Rent Estimates Cache
create table if not exists public.property_rent_cache (
    id uuid default gen_random_uuid() primary key,
    property_id text not null, -- Can be internal UUID or external ID
    address_hash text not null, -- SHA256 of normalized address for lookup
    payload jsonb not null, -- Full API response
    created_at timestamptz default now() not null,
    expires_at timestamptz not null
);

create index if not exists idx_rent_cache_address on public.property_rent_cache(address_hash);
create index if not exists idx_rent_cache_expires on public.property_rent_cache(expires_at);

-- 2. Rent Snapshots (User Saved)
create table if not exists public.property_rent_snapshots (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    property_id text not null,
    snapshot_name text,
    rent_estimate numeric,
    rent_range_low numeric,
    rent_range_high numeric,
    confidence_score numeric,
    payload jsonb not null,
    created_at timestamptz default now() not null
);

create index if not exists idx_rent_snapshots_user on public.property_rent_snapshots(user_id);
create index if not exists idx_rent_snapshots_property on public.property_rent_snapshots(property_id);

-- 3. Appraisal & ARV Cache
create table if not exists public.property_appraisal_cache (
    id uuid default gen_random_uuid() primary key,
    property_id text not null,
    address_hash text not null,
    payload jsonb not null, -- AVM + Comps
    created_at timestamptz default now() not null,
    expires_at timestamptz not null
);

create index if not exists idx_appraisal_cache_address on public.property_appraisal_cache(address_hash);

-- 4. Appraisal Snapshots (User Saved ARV)
create table if not exists public.property_appraisal_snapshots (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    property_id text not null,
    arv_estimate numeric,
    avm_estimate numeric,
    selected_comps jsonb, -- Array of comp IDs used
    adjustments jsonb, -- User applied adjustments
    created_at timestamptz default now() not null
);

create index if not exists idx_appraisal_snapshots_user on public.property_appraisal_snapshots(user_id);

-- 5. Comps Cache (Shared for deep dive)
create table if not exists public.property_comps_cache (
    id uuid default gen_random_uuid() primary key,
    property_id text not null,
    filters_hash text not null, -- Hash of search filters (radius, beds, baths)
    payload jsonb not null,
    created_at timestamptz default now() not null,
    expires_at timestamptz not null
);

create index if not exists idx_comps_cache_filters on public.property_comps_cache(filters_hash);

-- 6. Comp Sets (Saved Searches)
create table if not exists public.property_comp_sets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    property_id text not null,
    name text default 'Saved Comp Set',
    filters jsonb not null,
    selected_comp_ids jsonb,
    created_at timestamptz default now() not null
);

create index if not exists idx_comp_sets_user on public.property_comp_sets(user_id);

-- RLS Policies

-- Enable RLS
alter table public.property_rent_cache enable row level security;
alter table public.property_rent_snapshots enable row level security;
alter table public.property_appraisal_cache enable row level security;
alter table public.property_appraisal_snapshots enable row level security;
alter table public.property_comps_cache enable row level security;
alter table public.property_comp_sets enable row level security;

-- Cache Tables: readable by authenticated users (shared cache), writable only by service role (Edge Functions)
create policy "Authenticated users can read rent cache"
    on public.property_rent_cache for select
    to authenticated
    using (true);

create policy "Authenticated users can read appraisal cache"
    on public.property_appraisal_cache for select
    to authenticated
    using (true);

create policy "Authenticated users can read comps cache"
    on public.property_comps_cache for select
    to authenticated
    using (true);

-- Snapshots & Sets: Users manage their own data
create policy "Users can manage own rent snapshots"
    on public.property_rent_snapshots for all
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can manage own appraisal snapshots"
    on public.property_appraisal_snapshots for all
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can manage own comp sets"
    on public.property_comp_sets for all
    to authenticated
    using (auth.uid() = user_id);
