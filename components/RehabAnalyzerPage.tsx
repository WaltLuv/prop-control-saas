import React, { useState } from 'react';
import { InvestmentLead, DistressType, KimiSwarmStatus } from '../types';
import RehabEstimatorModal from './RehabEstimatorModal';
import { Search, Home, Upload, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';

const RehabAnalyzerPage: React.FC = () => {
    const [address, setAddress] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [manualLead, setManualLead] = useState<InvestmentLead | null>(null);

    const handleStartAnalysis = (e: React.FormEvent) => {
        e.preventDefault();
        if (!address.trim()) return;

        // Create a temporary lead object to drive the modal
        const tempLead: InvestmentLead = {
            id: `manual - ${Date.now()} `,
            assetId: '',
            propertyAddress: address,
            distressIndicator: DistressType.NONE,
            recordedDate: new Date().toISOString(),
            marketValue: 0,
            totalLiabilities: 0,
            equityPct: 0,
            equityLevel: 'Medium',
            swarmStatus: KimiSwarmStatus.QUEUED,
            ownerPhone: '',
            ownerEmail: '',
            relativesContact: '',
            image: ''
        };

        setManualLead(tempLead);
        setIsAnalyzing(true);
    };

    return (
        <div className="p-6 md:p-12 max-w-7xl mx-auto min-h-screen">
            <div className="mb-12">
                <h1 className="text-4xl font-black text-white tracking-tighter mb-4 flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-xl">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    Deep Rehab Analyzer
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl">
                    Upload interior photos of any property to get a room-by-room renovation budget,
                    detect hidden damage, and generate "After" visualizations using Gemini 1.5 Pro.
                </p>
            </div>

            {!isAnalyzing ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Input Form */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
                        <form onSubmit={handleStartAnalysis} className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Property Address</label>
                                <div className="relative group">
                                    <Home className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="e.g. 123 Main St, Columbus, OH"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-3xl py-6 pl-16 pr-6 text-xl font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-700"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!address.trim()}
                                className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black uppercase tracking-widest text-lg shadow-2xl shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 group"
                            >
                                Start Analysis <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    </div>

                    {/* Feature Highlight */}
                    <div className="space-y-8 opacity-80">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                                <Search className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Detailed Line-Item Budgets</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Stop guessing repair costs. Our AI itemizes every visible issue, from "dated cabinets" to "water stains on ceiling," with local pricing.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Hidden Damage Detection</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    The vision model spots subtle red flags like mold patterns, sagging subfloors, or unauthorized electrical work that humans miss.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-pink-500/10 rounded-2xl text-pink-400">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Instant Renovation Visualization</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    See the potential. Generate photorealistic "After" mockups for any room in styles like Modern Luxury or Rustic Farmhouse.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="animate-in fade-in duration-500">
                    {/* When analyzing, we show the modal. 
               The standalone page wrapper can act as the 'background' 
               while the modal takes focus. 
           */}
                    <div className="text-center py-20">
                        <h2 className="text-3xl font-black text-slate-700">Analysis Session Active</h2>
                        <p className="text-slate-600">Reviewing {address}...</p>
                        <button
                            onClick={() => { setIsAnalyzing(false); setManualLead(null); setAddress(''); }}
                            className="mt-8 text-indigo-400 hover:text-indigo-300 font-bold underline"
                        >
                            Start New Analysis
                        </button>
                    </div>
                </div>
            )}

            {/* Render Modal if Active */}
            {isAnalyzing && manualLead && (
                <RehabEstimatorModal
                    lead={manualLead}
                    onClose={() => setIsAnalyzing(false)}
                    onUpdateLead={(updated) => setManualLead(updated)}
                />
            )}
        </div>
    );
};

export default RehabAnalyzerPage;
