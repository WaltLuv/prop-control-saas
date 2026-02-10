import React, { useState, useMemo, useEffect } from 'react';
import {
  Asset,
  KPIEntry,
  KPIStatus,
  Direction,
  AssetHealth,
  KPIName,
  AppTab,
  Tenant,
  Contractor,
  Job,
  JobStatus,
  Message,
  UserProfile,
  InvestmentLead,
  DistressDetail,
  PlanTier
} from './types';
import {
  BENCHMARKS,
  INITIAL_ASSETS,
  INITIAL_KPI_ENTRIES,
  INITIAL_TENANTS,
  INITIAL_CONTRACTORS,
  INITIAL_JOBS
} from './constants';
import { fetchPortfolioData, savePortfolioData } from './persistenceService'; // persistenceService is now updated
import { placeActualPhoneCall } from './communicationService';
import { supabase } from './lib/supabase';
import { PLANS } from './constants/plans'; // Import Plan Logic
import Dashboard from './components/Dashboard';
import AssetTable from './components/AssetTable';
import Sidebar from './components/Sidebar';
import { createCheckoutSession, redirectToCustomerPortal } from './lib/stripe';
import AssetDetail from './components/AssetDetail';
import TenantInbox from './components/TenantInbox';
import WorkOrderManager from './components/WorkOrderManager';
import ContractorRegistry from './components/ContractorRegistry';
import TurnCostCalculator from './components/TurnCostCalculator';
import OpsAudit from './components/OpsAudit';
import KPILogger from './components/KPILogger';
import MakeReadyChecklist from './components/MakeReadyChecklist';
import VendorScorecard from './components/VendorScorecard';
import ServiceEstimator from './components/ServiceEstimator';
import InstantTurnCalculator from './components/InstantTurnCalculator';
import ResidentManager from './components/ResidentManager';

import MaintenancePredictor from './components/MaintenancePredictor';
import InteriorDesigner from './components/InteriorDesigner';
import InvestmentModule from './components/InvestmentModule';
import InstitutionalModule from './components/InstitutionalModule';
import AuthOverlay from './components/auth/AuthOverlay';
import UpgradeModal from './components/subscription/UpgradeModal'; // Import Modal
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import { Menu, RefreshCw, Sparkles, Loader2, Crown, Settings as SettingsIcon } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Store Profile (Plan)
  const [loading, setLoading] = useState(true);

  // Initialize with empty first, populate after fetch
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [kpiEntries, setKpiEntries] = useState<KPIEntry[]>([]);
  const [agentMessages, setAgentMessages] = useState<Message[]>([]);
  const [investmentLeads, setInvestmentLeads] = useState<InvestmentLead[]>([]);
  const [distressDetails, setDistressDetails] = useState<DistressDetail[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false); // Modal State

  // Check Auth & Load Data
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const data = await fetchPortfolioData();
        if (data) {
          // PRO_MAX is forced by persistenceService if applicable, so we just trust the data
          setUserProfile(data.userProfile || { id: session.user.id, email: session.user.email!, plan: 'FREE', stripeCustomerId: undefined, subscriptionStatus: undefined });
          if (data.assets.length > 0) {
            setAssets(data.assets);
            setTenants(data.tenants);
            setContractors(data.contractors);
            setJobs(data.jobs);
            setKpiEntries(data.kpiEntries);
            setInvestmentLeads(data.investmentLeads || []);
            setDistressDetails(data.distressDetails || []);
          } else {
            // Seed Data for new users
            setAssets(INITIAL_ASSETS);
            setTenants(INITIAL_TENANTS);
            setContractors(INITIAL_CONTRACTORS);
            setJobs(INITIAL_JOBS);
            setKpiEntries(INITIAL_KPI_ENTRIES);
          }
        }
      }
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save on Change (Debounced by service)
  useEffect(() => {
    if (user && !loading) {
      savePortfolioData({
        assets, tenants, contractors, jobs, kpiEntries, agentMessages, investmentLeads, distressDetails,
        userProfile: userProfile! // Pass userProfile to ensure alignment, though sync relies on DB profile table
      });
    }
  }, [assets, tenants, contractors, jobs, kpiEntries, agentMessages, investmentLeads, distressDetails, user, loading, userProfile]);

  // --- LIMIT ENFORCEMENT ---

  const handleTabChange = (tab: AppTab) => {
    const planRank: Record<PlanTier, number> = { 'FREE': 0, 'GROWTH': 1, 'PRO': 2, 'PRO_MAX': 3 };
    const currentRank = planRank[userProfile?.plan || 'FREE'];

    const growthTabs: AppTab[] = ['audit', 'estimator'];
    const proTabs: AppTab[] = ['predictor', 'instant-calculator', 'interior-design', 'inbox', 'work-orders'];
    const proMaxTabs: AppTab[] = ['market-intel', 'jv-payout', 'underwriting', 'rehab-studio', 'loan-pitch', 'inst-dashboard' as any];

    // Debug log to trace plan mismatch
    if (userProfile?.plan === 'FREE') console.log('Current plan is FREE. Access to', tab, 'denied.');

    if (growthTabs.includes(tab) && currentRank < 1) { setShowUpgradeModal(true); return; }
    if (proTabs.includes(tab) && currentRank < 2) { setShowUpgradeModal(true); return; }
    if (proMaxTabs.includes(tab) && currentRank < 3) { setShowUpgradeModal(true); return; }

    setActiveTab(tab);
  };

  const checkAssetLimit = (): boolean => {
    const maxAssets = PLANS[userProfile?.plan || 'FREE'].maxAssets;
    if (assets.length >= maxAssets) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  const handleAddAsset = (asset: any) => {
    if (!checkAssetLimit()) return;
    setAssets(prev => [{ ...asset, id: `a-${Date.now()}`, lastUpdated: new Date().toISOString() }, ...prev]);
  };

  const handleAddTenant = (tenant: any) => {
    // UNLOCKED FOR TESTING: Limits removed
    setTenants(prev => [{ ...tenant, id: `t-${Date.now()}` }, ...prev]);
  };
  const handleExport = () => {
    alert("Export feature coming to cloud soon.");
    // exportPortfolioData({ assets, tenants, contractors, jobs, kpiEntries, agentMessages });
  };

  const handleImport = async (file: File) => {
    alert("Import disabled in cloud mode.");
  };

  const handleDispatch = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || !job.contractorId) return;

    const vendor = contractors.find(c => c.id === job.contractorId);
    const asset = assets.find(a => a.id === job.propertyId);
    if (!vendor || !asset) return;

    const script = `Hello ${vendor.name}, this is the PropControl Autonomous Dispatcher. We have a ${job.issueType} work order at ${asset.name}, ${asset.address}. Description: ${job.description}. Please confirm receipt via our portal.`;

    try {
      await placeActualPhoneCall(vendor.phone, vendor.name, script);

      const updatedJob = {
        ...job,
        status: JobStatus.IN_PROGRESS,
        updatedAt: new Date().toISOString(),
        communicationLog: [
          ...job.communicationLog,
          { id: `dispatch-${Date.now()}`, timestamp: new Date().toISOString(), sender: 'System', message: `Automated Twilio Dispatch call placed to ${vendor.name}.`, type: 'notification' } as any
        ]
      };

      setJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
      alert(`Twilio Dispatch successful for ${vendor.name}. Job set to In Progress.`);
    } catch (err: any) {
      console.error(err);
      throw new Error(`Twilio Dispatch Error: ${err.message}`);
    }
  };

  const handleNotify = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const tenant = tenants.find(t => t.id === job.tenantId);
    const asset = assets.find(a => a.id === job.propertyId);
    if (!tenant || !asset) return;

    const script = `Hello ${tenant.name}, this is your Resident Concierge from ${asset.name}. We wanted to inform you that your ${job.issueType} maintenance request is now being actively handled. A contractor has been dispatched. Thank you for your patience.`;

    try {
      await placeActualPhoneCall(tenant.phone, tenant.name, script);
      const updatedJob = {
        ...job,
        communicationLog: [
          ...job.communicationLog,
          { id: `notify-${Date.now()}`, timestamp: new Date().toISOString(), sender: 'System', message: `Automated Twilio Notification call placed to resident ${tenant.name}.`, type: 'notification' } as any
        ]
      };
      setJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
      alert(`Resident notification call successful for ${tenant.name}.`);
    } catch (err: any) {
      console.error(err);
      throw new Error(`Twilio Notification Error: ${err.message}`);
    }
  };

  const onUpdateJob = (updatedJob: Job) => {
    const oldJob = jobs.find(j => j.id === updatedJob.id);
    setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));

    if (oldJob && oldJob.status !== JobStatus.IN_PROGRESS && updatedJob.status === JobStatus.IN_PROGRESS) {
      handleNotify(updatedJob.id).catch(e => console.error("Auto-notify failed", e));
    }
  };

  const getKPIStatus = (kpiName: KPIName, value: number): KPIStatus => {
    const benchmark = BENCHMARKS.find(b => b.name === kpiName);
    if (!benchmark) return KPIStatus.GREEN;
    if (benchmark.higherIsBetter) {
      if (value >= benchmark.greenThreshold) return KPIStatus.GREEN;
      if (value >= benchmark.yellowThreshold) return KPIStatus.YELLOW;
      return KPIStatus.RED;
    } else {
      if (value <= benchmark.greenThreshold) return KPIStatus.GREEN;
      if (value <= benchmark.yellowThreshold) return KPIStatus.YELLOW;
      return KPIStatus.RED;
    }
  };

  const assetHealthMap = useMemo(() => {
    const map: Record<string, AssetHealth> = {};
    assets.forEach(asset => {
      const assetKPIs = kpiEntries.filter(e => e.assetId === asset.id);
      const uniqueDates: string[] = (Array.from(new Set(assetKPIs.map(e => e.date))) as string[])
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      const calculateScoreSummary = (date: string | null) => {
        const assetJobs = jobs.filter(j => j.propertyId === asset.id);
        const openJobsCount = assetJobs.filter(j => j.status !== JobStatus.COMPLETED && j.status !== JobStatus.CANCELLED).length;

        const targetDate = date || (uniqueDates.length > 0 ? uniqueDates[0] : null);
        const activeLoggedKPIs = targetDate
          ? assetKPIs.filter(e => e.date === targetDate && e.kpiName !== 'Maintenance Backlog')
          : [];

        const consolidatedMetrics = [
          ...activeLoggedKPIs,
          { kpiName: 'Maintenance Backlog' as KPIName, value: openJobsCount }
        ];

        let red = 0, yellow = 0;
        consolidatedMetrics.forEach(m => {
          const s = getKPIStatus(m.kpiName, m.value);
          if (s === KPIStatus.RED) red++;
          if (s === KPIStatus.YELLOW) yellow++;
        });

        const score = Math.max(0, 100 - (red * 15) - (yellow * 5));
        return { score, red, yellow };
      };

      const current = calculateScoreSummary(null);
      const baseline = uniqueDates.length > 1 ? calculateScoreSummary(uniqueDates[1]) : current;

      let direction = Direction.STABLE;
      if (current.score > baseline.score + 0.1) {
        direction = Direction.IMPROVING;
      } else if (current.score < 80 || current.score < baseline.score - 0.1) {
        direction = Direction.WATCH;
      } else {
        direction = Direction.STABLE;
      }

      map[asset.id] = {
        assetId: asset.id,
        healthScore: current.score,
        redCount: current.red,
        yellowCount: current.yellow,
        statusBand: current.score < 60 ? KPIStatus.RED : current.score < 80 ? KPIStatus.YELLOW : KPIStatus.GREEN,
        direction: direction
      };
    });
    return map;
  }, [assets, kpiEntries, jobs]);

  if (loading) {
    return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-indigo-500"><Loader2 className="animate-spin w-10 h-10" /></div>;
  }

  if (!user) {
    return <AuthOverlay onAuthSuccess={setUser} />;
  }

  // NOTE: Swapped logic - if trying to access InteriorDesign, logic is handled in handleTabChange.
  // If activeTab IS interior-design, it means they are allowed.
  if (activeTab === 'interior-design') {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onExport={handleExport}
          onImport={handleImport}
          onShowUpgradeModal={() => setShowUpgradeModal(true)}
          onManageSubscription={redirectToCustomerPortal}
          currentPlan={userProfile?.plan || 'FREE'}
          assetCount={assets.length}
          maxAssets={PLANS[userProfile?.plan || 'FREE'].maxAssets}
          planName={PLANS[userProfile?.plan || 'FREE'].name}
        />
        <main className="flex-1 relative overflow-y-auto">
          <div className="absolute top-4 left-4 z-50 md:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white/20 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>
          <InteriorDesigner />
        </main>
      </div>
    );
  }

  const investmentTabs: AppTab[] = ['market-intel', 'jv-payout', 'underwriting', 'rehab-studio', 'loan-pitch'];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#020617] text-slate-100 font-sans overflow-x-hidden selection:bg-indigo-500/30">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onExport={handleExport}
        onImport={handleImport}
        onShowUpgradeModal={() => setShowUpgradeModal(true)}
        onManageSubscription={redirectToCustomerPortal}
        currentPlan={userProfile?.plan || 'FREE'}
        assetCount={assets.length}
        maxAssets={PLANS[userProfile?.plan || 'FREE'].maxAssets}
        planName={PLANS[userProfile?.plan || 'FREE'].name}
      />

      <main className="flex-1 p-6 md:p-12 overflow-y-auto relative">
        <header className="mb-12 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-black text-white capitalize tracking-tighter leading-none mb-2">
                {activeTab === 'inst-dashboard' ? 'Investment Ideas' : activeTab.replace('-', ' ')}
              </h1>
              <div className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest text-[10px]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> {investmentTabs.includes(activeTab) ? 'Capital Allocation Suite' : 'AI Managed Portfolio'}
                <span className="text-slate-600">|</span>
                <span className="text-amber-500 flex items-center gap-1"><Crown className="w-3 h-3" /> {PLANS[userProfile?.plan || 'FREE'].name} Plan</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowUpgradeModal(true)} className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform">
              Upgrade
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-2 px-3 py-2 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-[10px] font-black uppercase tracking-widest"
              title="Account Settings"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Account</span>
            </button>
            <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5">Sign Out</button>
          </div>
        </header>

        {showUpgradeModal && (
          <UpgradeModal currentPlan={userProfile?.plan || 'FREE'} onClose={() => setShowUpgradeModal(false)} />
        )}



        <div className="max-w-full h-full">
          {activeTab === 'dashboard' && <Dashboard assets={assets} tenants={tenants} contractors={contractors} jobs={jobs} kpiEntries={kpiEntries} healthMap={assetHealthMap} onSelectAsset={(id) => { setSelectedAssetId(id); setActiveTab('assets'); }} onDeleteAsset={(id) => setAssets(a => a.filter(x => x.id !== id))} onAddAsset={handleAddAsset} />}
          {activeTab === 'assets' && (selectedAssetId ? <AssetDetail asset={assets.find(a => a.id === selectedAssetId)!} kpiEntries={kpiEntries.filter(e => e.assetId === selectedAssetId)} health={assetHealthMap[selectedAssetId] || { healthScore: 100, statusBand: KPIStatus.GREEN, redCount: 0, yellowCount: 0 }} onBack={() => setSelectedAssetId(null)} onDelete={() => setAssets(prev => prev.filter(a => a.id !== selectedAssetId))} onUpdateAsset={(u) => setAssets(prev => prev.map(a => a.id === u.id ? u : a))} /> : <AssetTable assets={assets} healthMap={assetHealthMap} onViewAsset={setSelectedAssetId} onAddAsset={handleAddAsset} onUpdateAsset={(u) => setAssets(prev => prev.map(a => a.id === u.id ? u : a))} onDeleteAsset={(id) => setAssets(prev => prev.filter(a => a.id !== id))} />)}
          {activeTab === 'tenants' && <ResidentManager tenants={tenants} assets={assets} jobs={jobs} onAddTenant={handleAddTenant} onUpdateTenant={(u) => setTenants(prev => prev.map(t => t.id === u.id ? u : t))} onDeleteTenant={(id) => setTenants(prev => prev.filter(t => t.id !== id))} />}
          {activeTab === 'inbox' && <TenantInbox tenants={tenants} assets={assets} jobs={jobs} onReportIssue={(j) => setJobs(prev => [j, ...prev])} />}
          {activeTab === 'work-orders' && (
            <WorkOrderManager
              jobs={jobs}
              assets={assets}
              tenants={tenants}
              contractors={contractors}
              onUpdateJob={onUpdateJob}
              onDeleteJob={(id) => setJobs(prev => prev.filter(j => j.id !== id))}
              onAddJob={(j) => setJobs(prev => [j, ...prev])}
              onDispatch={handleDispatch}
              onNotify={handleNotify}
            />
          )}
          <ErrorBoundary fallbackMessage="This page encountered an error">
            {activeTab === 'contractors' && <ContractorRegistry contractors={contractors} jobs={jobs} onUpdateContractor={(u) => setContractors(prev => prev.map(c => c.id === u.id ? u : c))} onAddContractor={(c) => setContractors(prev => [...prev, c])} />}
            {activeTab === 'kpis' && <KPILogger assets={assets} benchmarks={BENCHMARKS} kpiEntries={kpiEntries} onSubmit={(e) => setKpiEntries(prev => [...prev, { ...e, id: `k-${Date.now()}` }])} getKPIStatus={getKPIStatus} />}
            {activeTab === 'calculator' && <TurnCostCalculator />}
            {activeTab === 'checklist' && <MakeReadyChecklist />}
            {activeTab === 'vendors' && <VendorScorecard contractors={contractors} jobs={jobs} onUpdateContractor={(u) => setContractors(prev => prev.map(c => c.id === u.id ? u : c))} onAddContractor={(c) => setContractors(prev => [...prev, c])} />}
            {activeTab === 'audit' && <OpsAudit />}
            {activeTab === 'estimator' && <ServiceEstimator />}
            {activeTab === 'instant-calculator' && <InstantTurnCalculator />}
            {activeTab === 'settings' && <Settings userProfile={userProfile} onShowUpgrade={() => setShowUpgradeModal(true)} />}
            {activeTab === 'predictor' && <MaintenancePredictor assets={assets} jobs={jobs} kpiEntries={kpiEntries} />}
            {activeTab === 'interior-design' && <InteriorDesigner />}

            {investmentTabs.includes(activeTab) && <InvestmentModule activeTab={activeTab} selectedLeadId={selectedLeadId} investmentLeads={investmentLeads} />}
            {activeTab === 'inst-dashboard' && (
              <InstitutionalModule
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                leads={investmentLeads}
                setLeads={setInvestmentLeads}
                details={distressDetails}
                setDetails={setDistressDetails}
                selectedLeadId={selectedLeadId}
                setSelectedLeadId={setSelectedLeadId}
                assets={assets}
                onUpdateAssets={setAssets}
              />
            )}



          </ErrorBoundary>
        </div>
      </main >
    </div >
  );
};

export default App;
