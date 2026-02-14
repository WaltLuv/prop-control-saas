import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Wrench,
  Users,
  Calculator,
  ShieldAlert,
  Zap,
  ClipboardList,
  CheckSquare,
  Star,
  FileText,
  UserCircle,
  Database,
  X,
  BrainCircuit,
  Camera,
  Palette,
  Globe,
  Table,
  Hammer,
  FileCheck,
  ArrowRight,
  TrendingUp,
  BarChart4,
  Coins,
  Crown,
  Lock,
  Sparkles,
  Settings as SettingsIcon,
  XCircle,
  Activity,
} from 'lucide-react';
import { AppTab, PlanTier } from '../types';
import { PLANS } from '../constants/plans';
import { redirectToCustomerPortal } from '../lib/stripe';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onShowUpgradeModal?: () => void;
  onManageSubscription?: () => void;
  assetCount: number;
  maxAssets: number;
  planName: string;
  currentPlan: PlanTier;
  trialDaysLeft?: number;
}

type Module = 'operations' | 'investment' | 'institutional';

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose, onShowUpgradeModal, onManageSubscription, currentPlan, assetCount, maxAssets, planName, trialDaysLeft }) => {
  const [activeModule, setActiveModule] = useState<Module>(
    ['market-intel', 'jv-payout', 'underwriting', 'rehab-studio', 'loan-pitch'].includes(activeTab)
      ? 'investment'
      : ['inst-dashboard'].includes(activeTab) ? 'institutional' : 'operations'
  );

  const opsItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'kpis', label: 'Performance', icon: ClipboardList },
    { id: 'assets', label: 'Properties', icon: Building2 },
    { id: 'tenants', label: 'Residents', icon: UserCircle },
    { id: 'predictor', label: 'Neural Predictor', icon: BrainCircuit },
    { id: 'estimator', label: 'Service SOW', icon: FileText },
    { id: 'instant-calculator', label: 'Visual SOW', icon: Camera },
    { id: 'interior-design', label: 'AI Interior Design', icon: Palette },
    { id: 'inbox', label: 'Manual Inbox', icon: MessageSquare },
    { id: 'work-orders', label: 'Work Orders', icon: Wrench },
    { id: 'contractors', label: 'Vendor Grid', icon: Users },
    { id: 'calculator', label: 'Turn Analysis', icon: Calculator },
    { id: 'checklist', label: 'Make-Ready SOP', icon: CheckSquare },
    { id: 'vendors', label: 'Scorecards', icon: Star },
    { id: 'audit', label: 'Operations Audit', icon: ShieldAlert },
  ];

  const investmentItems = [
    { id: 'market-intel', label: 'Market Intel', icon: Globe },
    { id: 'jv-payout', label: 'JV Payout Engine', icon: Coins },
    { id: 'underwriting', label: 'Deal Analysis', icon: Table },
    { id: 'rehab-studio', label: 'Rehab Studio', icon: Hammer },
    { id: 'loan-pitch', label: 'Loan Pitch', icon: FileCheck },
    { id: 'rehab-analyzer', label: 'Deep Rehab Analyzer', icon: Sparkles },
  ];

  const institutionalItems = [
    { id: 'inst-dashboard', label: 'Investment Ideas', icon: Activity },
  ];

  const currentItems = activeModule === 'operations' ? opsItems : activeModule === 'investment' ? investmentItems : institutionalItems;

  const isLocked = (item: { id: string }) => {
    const planRank: Record<PlanTier, number> = { 'FREE': 0, 'GROWTH': 1, 'PRO': 2, 'PRO_MAX': 3 };
    const currentRank = planRank[currentPlan];

    const growthTabs = ['audit', 'estimator', 'inbox', 'work-orders'];
    if (growthTabs.includes(item.id) && currentRank < 1) return true;

    const proTabs = ['predictor', 'instant-calculator', 'interior-design'];
    if (proTabs.includes(item.id) && currentRank < 2) return true;

    const proMaxTabs = ['market-intel', 'jv-payout', 'underwriting', 'rehab-studio', 'loan-pitch', 'inst-dashboard'];
    if (proMaxTabs.includes(item.id) && currentRank < 3) return true;

    return false;
  };

  return (
    <aside className={`
      fixed md:sticky top-0 left-0 bottom-0 w-64 bg-slate-950 text-white flex flex-col p-6 shadow-2xl overflow-hidden border-r border-slate-900 transition-transform duration-500 ease-in-out z-50
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-2xl shadow-indigo-600/30 group-hover:rotate-12 transition-transform duration-500 border border-white/10">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tighter block leading-none">PropControl</span>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] block mt-1.5 opacity-60">Portfolio OS</span>
          </div>
        </div>
        <button onClick={onClose} className="md:hidden p-2.5 hover:bg-white/5 rounded-2xl transition text-slate-500"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5 mb-8">
        <button onClick={() => setActiveModule('operations')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeModule === 'operations' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
          <BarChart4 className="w-3.5 h-3.5" /> Ops
        </button>
        <button onClick={() => { setActiveModule('investment'); if (!investmentItems.some(i => i.id === activeTab)) setActiveTab('market-intel'); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeModule === 'investment' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
          <TrendingUp className="w-3.5 h-3.5" /> Inv
        </button>
        <button onClick={() => { setActiveModule('institutional'); setActiveTab('inst-dashboard'); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeModule === 'institutional' ? 'bg-slate-100 text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
          <Crown className="w-3.5 h-3.5" /> Pro
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
        {/* Trial Badge */}
        {trialDaysLeft !== undefined && trialDaysLeft >= 0 && (
          <div className="mb-4 mx-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">Free Trial</span>
            </div>
            <div className="text-white text-xs font-bold mb-2">
              {trialDaysLeft} Days Remaining
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="bg-pink-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(trialDaysLeft / 7) * 100}%` }} />
            </div>
          </div>
        )}

        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 px-4">
          {activeModule === 'operations' ? 'Operations Core' : 'Investment Lifecycle'}
        </p>

        {currentItems.map((item) => {
          const locked = isLocked(item);
          return (
            <button
              key={item.id}
              onClick={() => {
                if (locked) {
                  onShowUpgradeModal?.();
                  return;
                }
                setActiveTab(item.id as AppTab);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[1.25rem] transition-all duration-300 relative group ${activeTab === item.id
                ? 'bg-white/10 text-white shadow-lg border border-white/5'
                : 'text-slate-500 hover:text-white hover:bg-white/5'
                } ${locked ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}`}
            >
              <div className="relative">
                <item.icon className={`w-4.5 h-4.5 shrink-0 transition-colors duration-300 ${activeTab === item.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                {locked && (
                  <div className="absolute -top-1 -right-1 bg-slate-950 rounded-full p-0.5 border border-slate-800">
                    <Lock className="w-2 h-2 text-slate-500" />
                  </div>
                )}
              </div>
              <span className="font-black text-[10px] uppercase tracking-[0.15em] text-left">{item.label}</span>
              {activeTab === item.id && (
                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="py-4 border-t border-white/5 space-y-2">
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-4 px-6 py-3 rounded-2xl transition-all duration-300 group relative ${activeTab === 'settings' ? 'bg-indigo-500/10 text-white border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 border border-transparent'}`}
        >
          <SettingsIcon className={`w-4.5 h-4.5 shrink-0 ${activeTab === 'settings' ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
          <span className="font-black text-[10px] uppercase tracking-[0.15em]">Admin Settings</span>
          {activeTab === 'settings' && (
            <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]" />
          )}
        </button>
      </div>

      <div className="pt-4 border-t border-white/5">
        {(() => {
          const colorMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
            slate: { bg: 'from-slate-500/10 to-slate-600/5', text: 'text-slate-400', border: 'border-slate-500/20', iconBg: 'bg-slate-500/20' },
            indigo: { bg: 'from-indigo-500/10 to-indigo-600/5', text: 'text-indigo-400', border: 'border-indigo-500/20', iconBg: 'bg-indigo-500/20' },
            violet: { bg: 'from-violet-500/10 to-violet-600/5', text: 'text-violet-400', border: 'border-violet-500/20', iconBg: 'bg-violet-500/20' },
            amber: { bg: 'from-amber-500/10 to-amber-600/5', text: 'text-amber-400', border: 'border-amber-500/20', iconBg: 'bg-amber-500/20' },
          };
          const colors = colorMap[PLANS[currentPlan].color] || colorMap.slate;
          const isSuperUser = currentPlan === 'PRO_MAX';
          return (
            <div
              onClick={() => isSuperUser ? undefined : (currentPlan === 'FREE' ? onShowUpgradeModal?.() : onManageSubscription?.())}
              className={`p-4 rounded-2xl bg-gradient-to-br ${colors.bg} border ${colors.border} ${isSuperUser ? '' : 'cursor-pointer'} group transition-all hover:scale-[1.02] active:scale-95`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${colors.text}`}>
                  {PLANS[currentPlan].name} Plan
                </span>
                <div className={`p-1.5 rounded-lg ${colors.iconBg}`}>
                  <Crown className={`w-3.5 h-3.5 ${colors.text}`} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-xs">
                  {isSuperUser ? 'Owner Access' : currentPlan === 'FREE' ? 'Upgrade Now' : 'Manage Billing'}
                </span>
                {!isSuperUser && <ArrowRight className={`w-3.5 h-3.5 ${colors.text} group-hover:translate-x-1 transition-transform`} />}
              </div>
              {currentPlan !== 'FREE' && !isSuperUser && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <button
                    onClick={(e) => { e.stopPropagation(); onManageSubscription?.(); }}
                    className="text-red-400 hover:text-red-300 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
                    title="Cancel your subscription"
                  >
                    <XCircle className="w-3 h-3" /> Cancel Subscription
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <div className="mt-auto pt-8 border-t border-white/5 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-3 bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-indigo-500" />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Network</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
              <span className="text-[10px] font-black uppercase text-emerald-500">Live</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </aside>
  );
};

export default Sidebar;
