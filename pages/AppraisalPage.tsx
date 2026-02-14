import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Asset } from '../types';
import { supabase } from '../lib/supabase';
import { Loader2, TrendingUp, Calculator, ShieldCheck, ArrowRight, PenTool, Coins } from 'lucide-react';

interface PropertyContextType {
    property: Asset;
}

const AppraisalPage: React.FC = () => {
    const { property } = useOutletContext<PropertyContextType>();

    // State
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null); // AVM Data
    const [arvData, setArvData] = useState<any>(null); // ARV Data
    const [finishLevel, setFinishLevel] = useState<'standard' | 'high-end' | 'luxury'>('high-end');
    const [rehabScope, setRehabScope] = useState<'light' | 'medium' | 'heavy'>('medium');

    const fetchAppraisal = async () => {
        setLoading(true);
        try {
            // 1. Fetch AVM
            const { data: avmRes, error: avmError } = await supabase.functions.invoke('appraisal-bundle', {
                body: {
                    address: property.address,
                    propertyId: property.id,
                    beds: property.beds,
                    baths: property.baths,
                    sqft: property.sqft,
                    propertyType: 'Single Family'
                }
            });
            if (avmError) throw avmError;
            setData(avmRes);

            // 2. Compute ARV (Chained for smooth UX)
            // Note: ARV Compute usually takes a *list* of comps.
            // appraisal-bundle returns 'comparables'. We use those as the baseline "As-Is" set.
            if (avmRes.comparables && avmRes.comparables.length > 0) {
                const { data: arvRes, error: arvError } = await supabase.functions.invoke('arv-compute', {
                    body: {
                        comparables: avmRes.comparables,
                        subjectSqft: property.sqft,
                        finishLevel,
                        rehabScope
                    }
                });
                if (arvError) throw arvError;
                setArvData(arvRes);
            }

        } catch (err: any) {
            console.error('Appraisal Error:', err);
            let msg = 'Unknown error occurred';

            if (err.context && typeof err.context.json === 'function') {
                try {
                    const body = await err.context.json();
                    msg = body.error || body.message || msg;
                } catch (e) {
                    console.error('Failed to parse error body:', e);
                }
            } else if (err.message) {
                msg = err.message;
            }

            alert(`Appraisal failed: ${msg}. \n\nNote: If this is a 401 error, your RENTCAST_API_KEY is invalid. If it's a 400 error, please check Supabase logs.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white">Financials & ARV</h2>
                    <p className="text-slate-400 mt-1">Instant Valuation and After Repair Value Analysis</p>
                </div>
                <button
                    onClick={fetchAppraisal}
                    disabled={loading}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-emerald-900/20"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Calculator className="w-5 h-5" />}
                    {data ? 'Recalculate Value' : 'Run Valuation'}
                </button>
            </div>

            {loading && !data && (
                <div className="text-center py-24 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30 animate-pulse">
                    <Loader2 className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-spin" />
                    <div className="text-slate-500 font-medium">Analyzing Local Market...</div>
                </div>
            )}

            {!loading && !data && (
                <div className="text-center py-24 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                    <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-300">Ready to Analyze</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">Click "Run Valuation" to pull live AVM data and calculate a custom ARV based on your rehab scope.</p>
                </div>
            )}

            {data && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* AVM Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-blue-900/30 text-blue-400 rounded-xl">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">As-Is Valuation</h3>
                                    <p className="text-xs text-slate-500">Current Market Value (AVM)</p>
                                </div>
                            </div>

                            <div className="text-center py-8">
                                <div className="text-5xl font-black text-white mb-2 tracking-tight">
                                    ${data.valuation?.price?.toLocaleString()}
                                </div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-slate-400 text-xs font-mono">
                                    <span>Range: ${data.valuation?.rangeLow?.toLocaleString()} - ${data.valuation?.rangeHigh?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-800">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Market Context</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3 bg-slate-950 rounded-lg">
                                    <div className="text-slate-400 text-xs">Comps Used</div>
                                    <div className="text-white font-bold">{data.comparables?.length || 0}</div>
                                </div>
                                <div className="p-3 bg-slate-950 rounded-lg">
                                    <div className="text-slate-400 text-xs">Confidence</div>
                                    <div className="text-emerald-400 font-bold">High (AI)</div>
                                </div>
                                <div className="p-3 bg-purple-900/20 border border-purple-500/20 rounded-lg">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <Coins className="w-3 h-3 text-purple-400" />
                                        <div className="text-purple-300 text-[10px] font-black uppercase tracking-widest">Est. Rent</div>
                                    </div>
                                    <div className="text-white font-bold">${data.rent?.toLocaleString() || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ARV Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-emerald-900/30 text-emerald-400 rounded-xl">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Projected ARV</h3>
                                    <p className="text-xs text-slate-500">After Repair Value</p>
                                </div>
                            </div>

                            {/* Inputs for Recalc */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Finish Level</label>
                                    <select
                                        value={finishLevel}
                                        onChange={(e) => setFinishLevel(e.target.value as any)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
                                    >
                                        <option value="standard">Standard</option>
                                        <option value="high-end">High-End</option>
                                        <option value="luxury">Luxury</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Rehab Scope</label>
                                    <select
                                        value={rehabScope}
                                        onChange={(e) => setRehabScope(e.target.value as any)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
                                    >
                                        <option value="light">Light (Cosmetic)</option>
                                        <option value="medium">Medium</option>
                                        <option value="heavy">Heavy (Gut)</option>
                                    </select>
                                </div>
                            </div>

                            {arvData ? (
                                <div className="flex-1 flex flex-col justify-center text-center">
                                    <div className="text-6xl font-black text-emerald-400 mb-2 tracking-tighter">
                                        ${arvData.arvEstimate?.toLocaleString()}
                                    </div>
                                    <div className="flex flex-col gap-1 text-slate-400 text-sm">
                                        <span>Based on Median PPSF: <span className="text-white">${arvData.medianPPSF}</span></span>
                                        <span>Adj. Factor: <span className="text-emerald-400">+{((arvData.adjustmentFactor - 1) * 100).toFixed(0)}% Premium</span></span>
                                    </div>

                                    <div className="mt-8">
                                        <Link
                                            to="../comps"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-all border border-slate-700 hover:border-slate-600"
                                        >
                                            <PenTool className="w-4 h-4" /> Refine Comp Set
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-500 italic text-center py-10">Select parameters and click Run Calculation...</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppraisalPage;

