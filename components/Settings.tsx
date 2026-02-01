
import React from 'react';
import { PLANS } from '../constants/plans';
import { PlanTier, UserProfile } from '../types';
import { redirectToCustomerPortal } from '../lib/stripe';
import { Crown, CreditCard, Shield, Zap, Sparkles, LogOut, ArrowRight, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SettingsProps {
    userProfile: UserProfile | null;
    onShowUpgrade: () => void;
}

const Settings: React.FC<SettingsProps> = ({ userProfile, onShowUpgrade }) => {
    const currentTier = userProfile?.plan || 'FREE';
    const plan = PLANS[currentTier];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Account & Billing</h2>
                    <p className="text-slate-400 mt-1">Manage your subscription, payments, and account status.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Plan Overview Card */}
                <div className={`md:col-span-2 p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900/50 to-slate-900 border border-white/5 relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        {currentTier === 'PRO' ? <Crown className="w-32 h-32" /> : currentTier === 'GROWTH' ? <Sparkles className="w-32 h-32" /> : <Zap className="w-32 h-32" />}
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-${plan.color}-500/20 text-${plan.color}-400 border border-${plan.color}-500/30`}>
                                Current Plan: {plan.name}
                            </span>
                        </div>

                        <h3 className="text-4xl font-black text-white mb-2 tracking-tighter">
                            {plan.price}<span className="text-lg text-slate-500 font-bold">/mo</span>
                        </h3>
                        <p className="text-slate-400 font-medium mb-8 max-w-md">
                            Your account is currently active. Your next billing date and details can be managed in your secure Stripe portal.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            {currentTier !== 'FREE' ? (
                                <>
                                    <button
                                        onClick={redirectToCustomerPortal}
                                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                                    >
                                        <CreditCard className="w-4 h-4" /> Manage Payments & Invoices
                                    </button>
                                    {currentTier !== 'PRO' && (
                                        <button
                                            onClick={onShowUpgrade}
                                            className="px-6 py-3 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-white/5 transition-all flex items-center gap-2"
                                        >
                                            <ArrowRight className="w-4 h-4" /> Change Plan
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button
                                    onClick={onShowUpgrade}
                                    className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all flex items-center gap-3 shadow-xl shadow-amber-500/20"
                                >
                                    <Crown className="w-4 h-4" /> Upgrade to Pro
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Account Actions */}
                <div className="p-8 rounded-[2.5rem] bg-slate-900/30 border border-white/5 flex flex-col justify-between">
                    <div>
                        <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-6 opacity-40">Privacy & Security</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                                <Shield className="w-4 h-4 text-emerald-500" /> Data is Encrypted
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="mt-8 px-6 py-4 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold flex items-center justify-between group"
                    >
                        Sign Out <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Explicit Cancellation Section */}
            {currentTier !== 'FREE' && (
                <div className="p-8 rounded-[2.5rem] border-2 border-red-500/20 bg-red-500/5 mt-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <XCircle className="w-24 h-24 text-red-500" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                        <div>
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <XCircle className="w-6 h-6 text-red-500" /> Cancel Subscription
                            </h3>
                            <p className="text-slate-400 text-sm mt-2 max-w-xl font-medium">
                                We're sorry to see you go. You can cancel your subscription instantly. You will retain access to your {plan.name} features until the end of your billing cycle. No hidden fees, no phone calls required.
                            </p>
                        </div>
                        <button
                            onClick={redirectToCustomerPortal}
                            className="px-8 py-4 bg-red-500 text-white hover:bg-red-600 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95 shrink-0"
                        >
                            Cancel My Plan Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
