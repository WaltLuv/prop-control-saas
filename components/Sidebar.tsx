
import React, { useState, useMemo } from 'react';
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
  Bot,
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
  ChevronRight,
  TrendingUp,
  BarChart4,
  Coins,
  Crown,
  Lock, // Import Lock
  Sparkles,
  Settings as SettingsIcon,
  XCircle,
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
}

type Module = 'operations' | 'investment';

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose, onShowUpgradeModal, onManageSubscription, currentPlan, assetCount, maxAssets, planName }) => {
  const [activeModule, setActiveModule] = useState<Module>(
    ['market-intel', 'jv-payout', 'underwriting', 'rehab-studio', 'loan-pitch'].includes(activeTab)
      ? 'investment'
      : 'operations'
  );

  const opsItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'assets', label: 'Properties', icon: Building2 },
    { id: 'tenants', label: 'Residents', icon: UserCircle },
    { id: 'tenant-agent', label: 'Alex A.I', icon: Bot }, // Growth
    { id: 'predictor', label: 'Neural Predictor', icon: BrainCircuit }, // Pro
    { id: 'instant-calculator', label: 'Visual SOW', icon: Camera }, // Pro
    { id: 'interior-design', label: 'AI Interior Design', icon: Palette }, // Pro
    { id: 'inbox', label: 'Manual Inbox', icon: MessageSquare }, // Pro
    { id: 'work-orders', label: 'Work Orders', icon: Wrench }, // Pro
    { id: 'contractors', label: 'Vendor Grid', icon: Users },
    { id: 'kpis', label: 'Performance', icon: ClipboardList },
    { id: 'calculator', label: 'Turn Analysis', icon: Calculator },
    { id: 'checklist', label: 'Make-Ready SOP', icon: CheckSquare },
    { id: 'vendors', label: 'Scorecards', icon: Star },
    { id: 'audit', label: 'Operations Audit', icon: ShieldAlert }, // Growth
    { id: 'estimator', label: 'Service SOW', icon: FileText }, // Growth
  ];

  /* ... investmentItems ... */
  const investmentItems = [
    { id: 'market-intel', label: 'Market Intel', icon: Globe },
    { id: 'jv-payout', label: 'JV Payout Engine', icon: Coins },
    { id: 'underwriting', label: 'Underwriting', icon: Table },
    { id: 'rehab-studio', label: 'Rehab Studio', icon: Hammer },
    { id: 'loan-pitch', label: 'Loan Pitch', icon: FileCheck },
  ];

  const currentItems = activeModule === 'operations' ? opsItems : investmentItems;

  const isLocked = (item: { id: string }) => {
    // Investment Tab is exclusive to PRO_MAX
    if (activeModule === 'investment' && currentPlan !== 'PRO_MAX') {
      return true;
    }

    // Check Ops items restrictions
    if (currentPlan === 'FREE') {
      if (['tenant-agent', 'predictor', 'instant-calculator', 'interior-design', 'inbox', 'work-orders', 'audit', 'estimator'].includes(item.id)) return true;
    }
    if (currentPlan === 'GROWTH') {
      if (['predictor', 'instant-calculator', 'interior-design', 'inbox', 'work-orders'].includes(item.id)) return true;
    }

    return false;
  };

  const planColor = PLANS[currentPlan].color; // 'slate', 'amber', 'indigo', 'emerald'
  const badgeColors = {
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  };

  return (
    <aside className={`
      fixed md:sticky top-0 left-0 bottom-0 w-64 bg-slate-950 text-white flex flex-col p-6 shadow-2xl overflow-hidden border-r border-slate-900 transition-transform duration-500 ease-in-out z-50
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* ... Header ... */}
      <div className="flex items-center justify-between mb-8 px-2">
        {/* Same header content */}
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

      {/* Module Switcher - Keep as is */}
      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5 mb-8">
        {/* ... (Keep existing module switcher code) ... */}
        <button onClick={() => setActiveModule('operations')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeModule === 'operations' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
          <BarChart4 className="w-3.5 h-3.5" /> Ops
        </button>
        <button onClick={() => { setActiveModule('investment'); if (!investmentItems.some(i => i.id === activeTab)) setActiveTab('market-intel'); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeModule === 'investment' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
          <TrendingUp className="w-3.5 h-3.5" /> Investment
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
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

      {/* Global Actions (Settings, etc) */}
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

      {/* Subscription Badge */}
      <div className="pt-4 border-t border-white/5">
        <div
          onClick={() => currentPlan === 'FREE' ? onShowUpgradeModal?.() : onManageSubscription?.()}
          className={`p-4 rounded-2xl bg-gradient-to-br from-${PLANS[currentPlan].color}-500/10 to-${PLANS[currentPlan].color}-600/5 border border-${PLANS[currentPlan].color}-500/20 cursor-pointer group transition-all hover:scale-[1.02] active:scale-95`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-black uppercase tracking-widest text-${PLANS[currentPlan].color}-400`}>
              {PLANS[currentPlan].name} Plan
            </span>
            <div className={`p-1.5 rounded-lg bg-${PLANS[currentPlan].color}-500/20`}>
              <Crown className={`w-3.5 h-3.5 text-${PLANS[currentPlan].color}-400`} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-xs">
              {currentPlan === 'FREE' ? 'Upgrade Now' : 'Manage Billing'}
            </span>
            <ArrowRight className={`w-3.5 h-3.5 text-${PLANS[currentPlan].color}-400 group-hover:translate-x-1 transition-transform`} />
          </div>
          {currentPlan !== 'FREE' && (
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

        <div className="flex items-center gap-4 px-3 hover:bg-white/5 p-3 rounded-[1.5rem] transition-all cursor-pointer border border-transparent hover:border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-black text-xs text-white shadow-2xl shadow-indigo-600/20 relative shrink-0">
            AL
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black text-white uppercase tracking-tight truncate">Alex A.I</p>
            <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1 truncate">Synchronized</p>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
      <div className="mt-auto px-6 pb-6">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{planName} Plan</span>
            <span className="text-[10px] font-bold text-white">
              {maxAssets > 1000 ? '∞' : `${assetCount} / ${maxAssets}`}
            </span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${(assetCount / maxAssets) > 0.9 ? 'bg-rose-500' : 'bg-indigo-500'
                }`}
              style={{ width: `${maxAssets > 1000 ? 100 : Math.min((assetCount / maxAssets) * 100, 100)}%` }}
            />
          </div>
          {maxAssets < 1000 && (assetCount / maxAssets) >= 0.8 && (
            <p className="text-[9px] text-rose-400 font-bold mt-2 text-center animate-pulse">
              Approaching Limit
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
