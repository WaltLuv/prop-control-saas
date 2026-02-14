import React from 'react';
import { Asset, UserProfile, AppTab, Tenant, Contractor, Job, KPIEntry, InvestmentLead, DistressDetail, AssetHealth, PlanTier, KPIStatus, Direction, JobStatus } from '../types';
import { PLANS } from '../constants/plans';
import { BENCHMARKS } from '../constants';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import AssetTable from './AssetTable';
import AssetDetail from './AssetDetail';
import ResidentManager from './ResidentManager';
import TenantInbox from './TenantInbox';
import WorkOrderManager from './WorkOrderManager';
import ContractorRegistry from './ContractorRegistry';
import KPILogger from './KPILogger';
import TurnCostCalculator from './TurnCostCalculator';
import MakeReadyChecklist from './MakeReadyChecklist';
import VendorScorecard from './VendorScorecard';
import OpsAudit from './OpsAudit';
import ServiceEstimator from './ServiceEstimator';
import InstantTurnCalculator from './InstantTurnCalculator';
import Settings from './Settings';
import MaintenancePredictor from './MaintenancePredictor';
import InteriorDesigner from './InteriorDesigner';
import InvestmentModule from './InvestmentModule';
import InstitutionalModule from './InstitutionalModule';
import RehabAnalyzerPage from './RehabAnalyzerPage';
import UpgradeModal from './subscription/UpgradeModal';
import ErrorBoundary from './ErrorBoundary';
import { Menu, RefreshCw, Crown, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { redirectToCustomerPortal } from '../lib/stripe'; // Added import

interface MainAppViewProps {
    userProfile: UserProfile | null;
    assets: Asset[];
    tenants: Tenant[];
    contractors: Contractor[];
    jobs: Job[];
    kpiEntries: KPIEntry[];
    investmentLeads: InvestmentLead[];
    distressDetails: DistressDetail[];
    activeTab: AppTab;
    setActiveTab: (tab: AppTab) => void;
    selectedAssetId: string | null;
    setSelectedAssetId: (id: string | null) => void;
    selectedLeadId: string | null;
    setSelectedLeadId: (id: string | null) => void;
    assetHealthMap: Record<string, AssetHealth>;
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
    setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
    setContractors: React.Dispatch<React.SetStateAction<Contractor[]>>;
    setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
    setKpiEntries: React.Dispatch<React.SetStateAction<KPIEntry[]>>;
    setInvestmentLeads: React.Dispatch<React.SetStateAction<InvestmentLead[]>>;
    setDistressDetails: React.Dispatch<React.SetStateAction<DistressDetail[]>>;
    showUpgradeModal: boolean;
    setShowUpgradeModal: (show: boolean) => void;
    setUserProfile: (profile: UserProfile) => void;
    incrementUsage: (userId: string, feature: string) => void; // Passed from App
    onImport: (file: File) => void;
    onExport: () => void;
    onDispatch: (jobId: string) => Promise<void>;
    onNotify: (jobId: string) => Promise<void>;
    onUpdateJob: (job: Job) => void;
    getKPIStatus: (name: any, val: number) => any;
    trialDaysLeft?: number;
}

const MainAppView: React.FC<MainAppViewProps> = ({
    userProfile, assets, tenants, contractors, jobs, kpiEntries, investmentLeads, distressDetails,
    activeTab, setActiveTab, selectedAssetId, setSelectedAssetId, selectedLeadId, setSelectedLeadId,
    assetHealthMap, setAssets, setTenants, setContractors, setJobs, setKpiEntries, setInvestmentLeads, setDistressDetails,
    showUpgradeModal, setShowUpgradeModal, setUserProfile, incrementUsage,
    onImport, onExport, onDispatch, onNotify, onUpdateJob, getKPIStatus, trialDaysLeft
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const handleTabChange = (tab: AppTab) => {
        setActiveTab(tab);
        // Note: Plan checking logic remains in App or can be moved here if we pass the checker function
        // For now assuming App handles the validity before passing activeTab or we move `handleTabChange` logic here?
        // Let's assume the parent `setActiveTab` is the *raw* setter, so we should implement the check here?
        // Actually, to keep it simple, we'll implement the UI part here.
    };

    const investmentTabs: AppTab[] = ['market-intel', 'jv-payout', 'underwriting', 'rehab-studio', 'loan-pitch'];

    // Special Case: Interior Designer full screen
    if (activeTab === 'interior-design') {
        return (
            <div className="flex min-h-screen bg-slate-950">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    onExport={onExport}
                    onImport={onImport}
                    onShowUpgradeModal={() => setShowUpgradeModal(true)}
                    onManageSubscription={redirectToCustomerPortal}
                    currentPlan={userProfile?.plan || 'FREE'}
                    assetCount={assets.length}
                    maxAssets={PLANS[userProfile?.plan || 'FREE'].maxAssets}
                    planName={PLANS[userProfile?.plan || 'FREE'].name}
                    trialDaysLeft={trialDaysLeft}
                />
                <main className="flex-1 relative overflow-y-auto">
                    <div className="absolute top-4 left-4 z-50 md:hidden">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white/20 transition-colors">
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                    <InteriorDesigner
                        userProfile={userProfile}
                        onIncrementUsage={() => {
                            if (userProfile && userProfile.usageMetadata) {
                                const newCount = (userProfile.usageMetadata.visual_sow_generated_count || 0) + 1;
                                setUserProfile({
                                    ...userProfile,
                                    usageMetadata: {
                                        ...userProfile.usageMetadata,
                                        visual_sow_generated_count: newCount
                                    }
                                });
                                incrementUsage(userProfile.id, 'visual_sow_generated_count');
                            }
                        }}
                    />
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[#020617] text-slate-100 font-sans overflow-x-hidden selection:bg-indigo-500/30">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onExport={onExport}
                onImport={onImport}
                onShowUpgradeModal={() => setShowUpgradeModal(true)}
                onManageSubscription={redirectToCustomerPortal}
                currentPlan={userProfile?.plan || 'FREE'}
                assetCount={assets.length}
                maxAssets={PLANS[userProfile?.plan || 'FREE'].maxAssets}
                planName={PLANS[userProfile?.plan || 'FREE'].name}
                trialDaysLeft={trialDaysLeft}
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

                {/* --- MAIN CONTENT SWITCHER --- */}
                <div className="max-w-full h-full">
                    {activeTab === 'dashboard' && <Dashboard assets={assets} tenants={tenants} contractors={contractors} jobs={jobs} kpiEntries={kpiEntries} healthMap={assetHealthMap} onSelectAsset={setSelectedAssetId} onDeleteAsset={(id) => setAssets(prev => prev.filter(a => a.id !== id))} onAddAsset={(a) => setAssets(prev => [{ ...a, id: `a-${Date.now()}`, lastUpdated: new Date().toISOString() }, ...prev])} />}
                    {activeTab === 'assets' && (selectedAssetId ? <AssetDetail asset={assets.find(a => a.id === selectedAssetId)!} kpiEntries={kpiEntries.filter(e => e.assetId === selectedAssetId)} health={assetHealthMap[selectedAssetId] || { assetId: selectedAssetId, healthScore: 100, statusBand: KPIStatus.GREEN, redCount: 0, yellowCount: 0, direction: Direction.STABLE }} onBack={() => setSelectedAssetId(null)} onDelete={() => setAssets(prev => prev.filter(a => a.id !== selectedAssetId))} onUpdateAsset={(u) => setAssets(prev => prev.map(a => a.id === u.id ? u : a))} /> : <AssetTable assets={assets} healthMap={assetHealthMap} onViewAsset={setSelectedAssetId} onAddAsset={(a) => setAssets(prev => [{ ...a, id: `a-${Date.now()}`, lastUpdated: new Date().toISOString() }, ...prev])} onUpdateAsset={(u) => setAssets(prev => prev.map(a => a.id === u.id ? u : a))} onDeleteAsset={(id) => setAssets(prev => prev.filter(a => a.id !== id))} />)}
                    {activeTab === 'tenants' && <ResidentManager tenants={tenants} assets={assets} jobs={jobs} onAddTenant={(t) => setTenants(prev => [t, ...prev])} onUpdateTenant={(u) => setTenants(prev => prev.map(t => t.id === u.id ? u : t))} onDeleteTenant={(id) => setTenants(prev => prev.filter(t => t.id !== id))} />}
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
                            onDispatch={onDispatch}
                            onNotify={onNotify}
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


                        {investmentTabs.includes(activeTab) && <InvestmentModule activeTab={activeTab} selectedLeadId={selectedLeadId} investmentLeads={investmentLeads} />}
                        {activeTab === 'inst-dashboard' && (
                            <InstitutionalModule
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
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
                        {activeTab === 'rehab-analyzer' && <RehabAnalyzerPage />}

                    </ErrorBoundary>
                </div>
            </main >
        </div >
    );
};

export default MainAppView;
