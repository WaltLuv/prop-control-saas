
import React from 'react';
import { PLANS } from '../../constants/plans';
import { PlanTier } from '../../types';
import { createCheckoutSession, redirectToCustomerPortal } from '../../lib/stripe';
import { Check, X, Sparkles, Zap, Shield } from 'lucide-react';

interface UpgradeModalProps {
    currentPlan: PlanTier;
    onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ currentPlan, onClose }) => {
    const handleUpgrade = async (tier: PlanTier) => {
        const plan = PLANS[tier];
        if (tier === currentPlan) return;

        try {
            await createCheckoutSession(plan.priceId);
        } catch (err: any) {
            alert("Upgrade failed: " + err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900/90 border border-white/10 rounded-3xl shadow-2xl w-full max-w-[90vw] overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-white/10 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-amber-500/5 pointer-events-none" />

                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Upgrade Your Portfolio</h2>
                        <p className="text-slate-400 mt-1 font-medium">Unlock full power with our premium tiers.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
                </div>

                <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 relative z-0">
                    {(Object.keys(PLANS) as PlanTier[]).map((tierKey) => {
                        const plan = PLANS[tierKey];
                        const isCurrent = currentPlan === tierKey;
                        const isGrowth = tierKey === 'GROWTH';
                        const isProMax = tierKey === 'PRO_MAX';
                        const isPro = tierKey === 'PRO';

                        return (
                            <div
                                key={tierKey}
                                className={`relative rounded-3xl p-6 border flex flex-col transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl ${isCurrent
                                    ? 'border-indigo-500/30 bg-indigo-500/5 shadow-indigo-500/10 ring-1 ring-indigo-500/20'
                                    : isGrowth
                                        ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-slate-900 shadow-amber-500/10 ring-1 ring-amber-500/20'
                                        : isPro
                                            ? 'border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 to-slate-900 shadow-indigo-500/10'
                                            : isProMax
                                                ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-slate-900 shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                                                : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/50'
                                    }`}
                            >
                                {isGrowth && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-amber-500/20 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Best Value
                                    </div>
                                )}
                                {isPro && !isCurrent && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-slate-700">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-8 text-center">
                                    <h3 className={`text-sm font-black uppercase tracking-widest mb-4 ${isGrowth ? 'text-amber-400' : isPro ? 'text-indigo-400' : 'text-slate-500'}`}>{plan.name}</h3>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{plan.price}</span>
                                        {tierKey !== 'FREE' && <span className="text-slate-500 text-sm font-bold">/mo</span>}
                                    </div>
                                    <p className="text-slate-400 text-xs mt-3 font-medium px-4">
                                        {isGrowth ? 'For scaling portfolios' : isPro ? 'For serious investors' : isProMax ? 'For empire builders' : 'For getting started'}
                                    </p>
                                </div>

                                <div className="space-y-4 flex-1 mb-8">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isGrowth ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                            <Shield className="w-3 h-3" />
                                        </div>
                                        <span className="text-slate-200 text-sm font-semibold">
                                            {plan.maxAssets >= 9999 ? 'Unlimited' : plan.maxAssets} Units
                                        </span>
                                    </div>
                                    {plan.features.map((feat, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isGrowth ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
                                                <Check className="w-3 h-3" />
                                            </div>
                                            <span className="text-slate-300 text-sm leading-tight">{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleUpgrade(tierKey)}
                                    disabled={isCurrent}
                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${isCurrent
                                        ? 'bg-slate-800 text-slate-500 cursor-default border border-slate-700'
                                        : isGrowth
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/20 active:scale-95 group-hover:scale-105'
                                            : isProMax
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 group-hover:scale-105'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 hover:shadow-lg hover:shadow-indigo-600/20'
                                        }`}
                                >
                                    {isCurrent ? (
                                        <>Current Plan</>
                                    ) : (
                                        <>
                                            Upgrade to {plan.name} {isGrowth && <Zap className="w-3 h-3" />}
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="p-6 bg-slate-900/80 border-t border-white/5 text-center">
                    <p className="text-slate-500 text-xs">Secure payments processed by Stripe. You can cancel at any time.</p>
                </div>
            </div>

            {/* Footer Info */}
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
                {currentPlan !== 'FREE' ? (
                    <button
                        onClick={redirectToCustomerPortal}
                        className="text-slate-500 hover:text-white text-xs font-medium transition-colors"
                    >
                        Looking to cancel or change your plan? <span className="underline">Manage your subscription here</span>
                    </button>
                ) : (
                    <p className="text-slate-500 text-xs">
                        Trusted by the world's most sophisticated residential portfolios.
                    </p>
                )}
            </div>
        </div>
    );
};

export default UpgradeModal;
