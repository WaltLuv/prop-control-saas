
import { supabase } from './lib/supabase';
import { Asset, Tenant, Contractor, Job, KPIEntry, Message } from './types';


import { UserProfile } from './types';

export interface PersistentState {
  userProfile?: UserProfile; // Added profile to state
  assets: Asset[];
  tenants: Tenant[];
  contractors: Contractor[];
  jobs: Job[];
  kpiEntries: KPIEntry[];
  agentMessages: Message[];
}

/**
 * Mappers to convert between Frontend (camelCase) and Backend (snake_case)
 * This ensures the exact PropControl logic remains untouched in the frontend.
 */
const mapAssetToDB = (a: Asset, userId: string) => ({
  id: a.id, user_id: userId, name: a.name, address: a.address, units: a.units, manager: a.manager, last_updated: a.lastUpdated
});
const mapAssetFromDB = (a: any): Asset => ({
  id: a.id, name: a.name || 'Unknown Asset', address: a.address || '', units: Number(a.units || 1), manager: a.manager || '', lastUpdated: a.last_updated || new Date().toISOString()
});

const mapTenantToDB = (t: Tenant, userId: string) => ({
  id: t.id, user_id: userId, name: t.name, email: t.email, phone: t.phone, property_id: t.propertyId, lease_end: t.leaseEnd
});
const mapTenantFromDB = (t: any): Tenant => ({
  id: t.id, name: t.name || 'Unknown Tenant', email: t.email || '', phone: t.phone || '', propertyId: t.property_id || '', leaseEnd: t.lease_end || ''
});

const mapContractorToDB = (c: Contractor, userId: string) => ({
  id: c.id, user_id: userId, name: c.name, specialty: c.specialty, email: c.email, phone: c.phone, rating: c.rating, status: c.status
});
const mapContractorFromDB = (c: any): Contractor => ({
  id: c.id, name: c.name || 'Unknown Vendor', specialty: Array.isArray(c.specialty) ? c.specialty : [], email: c.email || '', phone: c.phone || '', rating: Number(c.rating || 0), status: c.status || 'AVAILABLE'
});

const mapJobToDB = (j: Job, userId: string) => ({
  id: j.id, user_id: userId, property_id: j.propertyId, tenant_id: j.tenantId, contractor_id: j.contractorId,
  issue_type: j.issueType, description: j.description, status: j.status, cost_estimate: j.costEstimate, final_cost: j.finalCost,
  communication_log: j.communicationLog, created_at: j.createdAt, updated_at: j.updatedAt
});
const mapJobFromDB = (j: any): Job => ({
  id: j.id, propertyId: j.property_id || '', tenantId: j.tenant_id || '', issueType: j.issue_type || 'General', description: j.description || '',
  status: j.status as any || 'REPORTED', contractorId: j.contractor_id, costEstimate: Number(j.cost_estimate || 0), finalCost: Number(j.final_cost || 0),
  createdAt: j.created_at || new Date().toISOString(), updatedAt: j.updated_at || new Date().toISOString(), communicationLog: Array.isArray(j.communication_log) ? j.communication_log : []
});

const mapKPIToDB = (k: KPIEntry, userId: string) => ({
  id: k.id, user_id: userId, asset_id: k.assetId, kpi_name: k.kpiName, value: k.value, date: k.date, commentary: k.commentary
});
const mapKPIFromDB = (k: any): KPIEntry => ({
  id: k.id, assetId: k.asset_id || '', kpiName: k.kpi_name || '', value: Number(k.value || 0), date: k.date || new Date().toISOString(), commentary: k.commentary || ''
});

// --- API ---

let syncTimeout: any = null;

/**
 * Fetches all portfolio data for the authenticated user.
 */
export const fetchPortfolioData = async (): Promise<PersistentState | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const [profile, assets, tenants, contractors, jobs, kpis] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('assets').select('*'),
      supabase.from('tenants').select('*'),
      supabase.from('contractors').select('*'),
      supabase.from('jobs').select('*'),
      supabase.from('kpi_entries').select('*')
    ]);

    // Default to FREE if no profile found (rare, but handle safely)
    const userProfile: UserProfile = profile.data ? {
      id: profile.data.id,
      email: profile.data.email,
      plan: (profile.data.plan as any) || 'FREE',
      stripeCustomerId: profile.data.stripe_customer_id,
      subscriptionStatus: profile.data.subscription_status
    } : { id: user.id, email: user.email!, plan: 'FREE' };

    // If fetching failed, or data is empty, return defaults or empty
    // NOTE: If new user, this returns empty arrays, which is correct.

    return {
      userProfile,
      assets: assets.data?.map(mapAssetFromDB) || [],
      tenants: tenants.data?.map(mapTenantFromDB) || [],
      contractors: contractors.data?.map(mapContractorFromDB) || [],
      jobs: jobs.data?.map(mapJobFromDB) || [],
      kpiEntries: kpis.data?.map(mapKPIFromDB) || [],
      agentMessages: [] // Chat history not persisted in DB for this scope
    };

  } catch (err) {
    console.error("Supabase Fetch Error:", err);
    return null;
  }
};

/**
 * Saves (Upserts) data to Supabase.
 * DEBOUNCED: Only runs 2 seconds after the last call to prevent spamming the API.
 */
export const syncPortfolioData = (state: PersistentState) => {
  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Upsert Assets
      if (state.assets.length > 0) {
        await supabase.from('assets').upsert(state.assets.map(a => mapAssetToDB(a, user.id)));
      }
      // Upsert Tenants
      if (state.tenants.length > 0) {
        await supabase.from('tenants').upsert(state.tenants.map(t => mapTenantToDB(t, user.id)));
      }
      // Upsert Contractors
      if (state.contractors.length > 0) {
        await supabase.from('contractors').upsert(state.contractors.map(c => mapContractorToDB(c, user.id)));
      }
      // Upsert Jobs
      if (state.jobs.length > 0) {
        await supabase.from('jobs').upsert(state.jobs.map(j => mapJobToDB(j, user.id)));
      }
      // Upsert KPIs
      if (state.kpiEntries.length > 0) {
        await supabase.from('kpi_entries').upsert(state.kpiEntries.map(k => mapKPIToDB(k, user.id)));
      }
      console.log("Supabase Sync Complete");
    } catch (err) {
      console.error("Supabase Sync Failed:", err);
    }
  }, 2000);
};

// Legacy LocalStorage wrapper for backward compat if needed (deprecated)
export const savePortfolioData = (state: PersistentState) => {
  // Pass through to sync
  syncPortfolioData(state);
};

export const loadPortfolioData = (): PersistentState | null => {
  // This is synchronous, but Supabase is async.
  // We return null here to force App.tsx to wait/load via useEffect.
  return null;
};
