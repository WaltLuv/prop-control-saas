
import { supabase } from './lib/supabase';
import { Asset, Tenant, Contractor, Job, KPIEntry, Message, InvestmentLead, DistressDetail } from './types';


import { UserProfile } from './types';

export interface PersistentState {
  userProfile?: UserProfile; // Added profile to state
  assets: Asset[];
  tenants: Tenant[];
  contractors: Contractor[];
  jobs: Job[];
  kpiEntries: KPIEntry[];
  agentMessages: Message[];
  investmentLeads: InvestmentLead[];
  distressDetails: DistressDetail[];
}

/**
 * Mappers to convert between Frontend (camelCase) and Backend (snake_case)
 * This ensures the exact PropControl logic remains untouched in the frontend.
 */
const mapLeadFromDB = (l: any): InvestmentLead => ({
  id: l.lead_id || l.id,
  assetId: l.asset_id,
  propertyAddress: l.address || '',
  propertyName: l.property_name,
  distressIndicator: l.distress_indicator as any,
  recordedDate: l.created_at || new Date().toISOString(),
  marketValue: Number(l.estimated_value || 0),
  totalLiabilities: Number(l.total_liabilities || 0),
  equityPct: Number(l.equity_pct || 0),
  equityLevel: l.equity_level as any,
  swarmStatus: (l.swarm_status || l.moltbot_status || 'Queued') as any,
  ownerPhone: l.owner_phone || '',
  ownerEmail: l.owner_email || '',
  relativesContact: l.relatives_contact || '',
  visionAnalysis: l.vision_analysis,
  conditionScore: l.condition_score,
  image: l.image_url || ''
});

const mapLeadToDB = (l: InvestmentLead) => ({
  id: l.id,
  asset_id: l.assetId || null,
  distress_indicator: l.distressIndicator,
  estimated_value: l.marketValue,
  total_liabilities: l.totalLiabilities,
  swarm_status: l.swarmStatus,
  owner_phone: l.ownerPhone,
  owner_email: l.ownerEmail,
  relatives_contact: l.relativesContact,
  vision_analysis: l.visionAnalysis,
  condition_score: l.conditionScore,
  image_url: l.image,
  created_at: l.recordedDate
});

const mapDistressDetailFromDB = (d: any): DistressDetail => ({
  id: d.id,
  leadId: d.lead_id,
  lienAmount: Number(d.lien_amount || 0),
  legalDescription: d.legal_description || '',
  auctionDate: d.auction_date
});

const mapDistressDetailToDB = (d: DistressDetail, userId: string) => ({
  id: d.id,
  user_id: userId,
  lead_id: d.leadId,
  lien_amount: d.lienAmount,
  legal_description: d.legalDescription,
  auction_date: d.auctionDate
});

/**
 * Mappers to convert between Frontend (camelCase) and Backend (snake_case)
 * This ensures the exact PropControl logic remains untouched in the frontend.
 */
const mapAssetToDB = (a: Asset, userId: string) => ({
  id: a.id,
  user_id: userId,
  name: a.name,
  address: a.address,
  city: a.city,
  state: a.state,
  zip: a.zip,
  units: a.units,
  manager: a.manager,
  status: a.status,
  property_type: a.propertyType,
  last_updated: a.lastUpdated
});
const mapAssetFromDB = (a: any): Asset => ({
  id: a.id,
  name: a.name || 'Unknown Asset',
  address: a.address || '',
  city: a.city || '',
  state: a.state || '',
  zip: a.zip || '',
  units: Number(a.units || 1),
  manager: a.manager || '',
  status: a.status || 'STABILIZED',
  propertyType: a.property_type || 'MULTIFAMILY',
  lastUpdated: a.last_updated || new Date().toISOString()
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
    // Fetch core data first (guaranteed to exist)
    const [profile, assets, tenants, contractors, jobs, kpis] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('assets').select('*'),
      supabase.from('tenants').select('*'),
      supabase.from('contractors').select('*'),
      supabase.from('jobs').select('*'),
      supabase.from('kpi_entries').select('*')
    ]);

    // Fetch investment data separately with error handling (may not exist yet)
    let leads = { data: null, error: null };
    let details = { data: null, error: null };
    
    try {
      leads = await supabase.from('investment_ideas_dashboard').select('*');
    } catch (err) {
      console.warn('investment_ideas_dashboard view not found - run migrations');
    }
    
    try {
      details = await supabase.from('distress_details').select('*');
    } catch (err) {
      console.warn('distress_details table not found - run migrations');
    }

    // Logic: Admin gets PRO_MAX forever. Everyone else uses their DB plan (SaaS).
    const isSuperUser = user.email?.toLowerCase() === 'newmoney2217@gmail.com';
    const dbPlan = profile.data?.plan || 'FREE';
    // Default subscription status to 'active' if plan is FREE, otherwise check DB
    const dbStatus = profile.data?.subscription_status || (dbPlan === 'FREE' ? 'active' : 'inactive');


    // Trial Logic: Check if within 7 days of trial_start (or creation if null for new users)
    const now = new Date();
    const trialStart = profile.data?.trial_start ? new Date(profile.data.trial_start) : null;
    const trialEnd = profile.data?.trial_end ? new Date(profile.data.trial_end) : (
      // Fallback: if no trial_end but created_at is within 7 days, treat as trial
      profile.data?.created_at && (now.getTime() - new Date(profile.data.created_at).getTime() < 7 * 24 * 60 * 60 * 1000)
        ? new Date(new Date(profile.data.created_at).getTime() + 7 * 24 * 60 * 60 * 1000)
        : null
    );

    const isTrialActive = trialEnd && now < trialEnd;

    // Override plan if trial is active
    const effectivePlan = isSuperUser ? 'PRO_MAX' : (isTrialActive ? 'PRO_MAX' : (dbPlan as any));

    const userProfile: UserProfile = {
      id: profile.data?.id || user.id,
      email: profile.data?.email || user.email!,
      plan: effectivePlan,
      stripeCustomerId: profile.data?.stripe_customer_id,
      subscriptionStatus: isSuperUser ? 'active' : dbStatus,
      usageMetadata: profile.data?.usage_metadata || {},
      trialStart: trialStart?.toISOString(),
      trialEnd: trialEnd?.toISOString()
    };

    return {
      userProfile,
      assets: assets.data?.map(mapAssetFromDB) || [],
      tenants: tenants.data?.map(mapTenantFromDB) || [],
      contractors: contractors.data?.map(mapContractorFromDB) || [],
      jobs: jobs.data?.map(mapJobFromDB) || [],
      kpiEntries: kpis.data?.map(mapKPIFromDB) || [],
      agentMessages: [],
      investmentLeads: leads.data?.map(mapLeadFromDB) || [],
      distressDetails: details.data?.map(mapDistressDetailFromDB) || []
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
      // Upsert Leads - Filter out those without assetId if RLS requires it, 
      // but we try to save all and let the DB handle it.
      if (state.investmentLeads.length > 0) {
        const validLeads = state.investmentLeads.filter(l => l.assetId && l.assetId !== '');
        if (validLeads.length > 0) {
          await supabase.from('leads').upsert(validLeads.map(l => mapLeadToDB(l)));
        }
      }
      // Upsert Distress Details (if table exists)
      if (state.distressDetails && state.distressDetails.length > 0) {
        try {
          await supabase.from('distress_details').upsert(state.distressDetails.map(d => mapDistressDetailToDB(d, user.id)));
        } catch (err) {
          console.warn('distress_details table not found - skipping sync');
        }
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
export const updateLeadMarketValue = async (leadId: string, newValue: number) => {
  const { error } = await supabase
    .from('leads')
    .update({ estimated_value: newValue })
    .eq('id', leadId);

  if (error) throw error;
};

export const updateSwarmStatus = async (leadId: string, status: string) => {
  const { error } = await supabase
    .from('leads')
    .update({ swarm_status: status })
    .eq('id', leadId);

  if (error) throw error;
};

/**
 * Increments the usage count for a specific feature.
 */
export const incrementUsage = async (userId: string, featureKey: string) => {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('usage_metadata')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) return;

  const currentUsage = profile.usage_metadata || {};
  const currentCount = (currentUsage as any)[featureKey] || 0;

  const newUsage = {
    ...currentUsage,
    [featureKey]: currentCount + 1,
    last_updated: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ usage_metadata: newUsage })
    .eq('id', userId);

  if (updateError) console.error("Failed to update usage metadata", updateError);
};

