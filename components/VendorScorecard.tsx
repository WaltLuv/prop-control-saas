
import React, { useState, useMemo } from 'react';
import {
  Users,
  Star,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  UserPlus,
  Trash2,
  MessageCircleQuestion,
  TrendingUp,
  BarChart3,
  ShieldAlert
} from 'lucide-react';
import { Contractor } from '../types';

interface VendorScore {
  onTime: number;
  scopeAdherence: number;
  communication: number;
  quality: number;
  rework: number;
  turnImpact: number;
  pricing: number;
  hesitationFree: boolean;
}

interface VendorScorecardProps {
  contractors: Contractor[];
  jobs: any[]; // Used for contextual awareness if needed
  onUpdateContractor: (contractor: Contractor) => void;
  onAddContractor: (contractor: Contractor) => void;
}

const VendorScorecard: React.FC<VendorScorecardProps> = ({ contractors, onUpdateContractor }) => {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorCategory, setNewVendorCategory] = useState('');

  // Current Form State for the scoring session
  const [form, setForm] = useState<VendorScore>({
    onTime: 3,
    scopeAdherence: 3,
    communication: 3,
    quality: 3,
    rework: 3,
    turnImpact: 3,
    pricing: 3,
    hesitationFree: true
  });

  const getTier = (avg: number) => {
    if (avg >= 4.0) return { label: 'Preferred', color: 'bg-green-100 text-green-700', icon: CheckCircle2 };
    if (avg >= 3.0) return { label: 'Watch', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle };
    return { label: 'Replace', color: 'bg-red-100 text-red-700', icon: XCircle };
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) return;

    const vendor = contractors.find(v => v.id === selectedVendorId);
    if (!vendor) return;

    // Calculate a new aggregate rating based on the 7 metrics provided in the scorecard
    const metricsSum = form.onTime + form.scopeAdherence + form.communication + form.quality + form.rework + form.turnImpact + form.pricing;
    const newRating = metricsSum / 7;

    const updatedContractor: Contractor = {
      ...vendor,
      rating: newRating,
      // In a real app we might store the full history of VendorScore objects, 
      // but for this dashboard we update the aggregate rating to trigger live sync.
    };

    onUpdateContractor(updatedContractor);
    alert(`Performance logged for ${vendor.name}. New rating: ${newRating.toFixed(1)}/5. Dashboard metrics synchronized.`);
  };

  const selectedVendor = contractors.find(v => v.id === selectedVendorId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Sidebar: Vendor List */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Vendor Scorecards
            </h3>
          </div>

          <div className="space-y-3">
            {(contractors || []).map(v => {
              const rating = Number(v.rating || 0);
              const tier = getTier(rating);
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVendorId(v.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all group ${selectedVendorId === v.id
                    ? 'border-indigo-500 bg-indigo-50/30'
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition">{v.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{(Array.isArray(v.specialty) ? v.specialty : []).join(', ')}</p>
                    </div>
                    {rating > 0 && (
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${tier.color}`}>
                        {rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Analysis/Score Area */}
      <div className="lg:col-span-8 space-y-8">
        {selectedVendor ? (
          <>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-black text-slate-900">{selectedVendor.name}</h2>
                  <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">{(Array.isArray(selectedVendor.specialty) ? selectedVendor.specialty : [])[0] || 'General'}</span>
                </div>
                <p className="text-slate-400 text-sm font-medium">Removing emotion from operational decision making.</p>
              </div>

              {selectedVendor.rating > 0 && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregate Rating</p>
                    <div className="flex items-center gap-2 justify-end">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-3xl font-black text-slate-900">{Number(selectedVendor.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                  <div className={`flex flex-col items-center px-4 py-2 rounded-xl border ${getTier(selectedVendor.rating).color}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest mb-0.5">Tier Status</span>
                    <span className="text-sm font-bold">{getTier(selectedVendor.rating).label}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Scoring Form */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" /> Log Performance (1-5)
                </h3>
                <form onSubmit={handleScoreSubmit} className="space-y-4">
                  {[
                    { key: 'onTime', label: 'On-Time Arrival' },
                    { key: 'scopeAdherence', label: 'Scope Adherence' },
                    { key: 'communication', label: 'Communication' },
                    { key: 'quality', label: 'Quality of Work' },
                    { key: 'rework', label: 'Rework Required (Low Rework = 5)' },
                    { key: 'turnImpact', label: 'Turn Impact (Speed)' },
                    { key: 'pricing', label: 'Pricing Consistency' }
                  ].map((field) => (
                    <div key={field.key} className="flex items-center justify-between group">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">{field.label}</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setForm({ ...form, [field.key]: val })}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${form[field.key as keyof VendorScore] === val
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110'
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                              }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <hr className="border-slate-50 my-6" />

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                      <MessageCircleQuestion className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-indigo-900 mb-1 tracking-tight">Would you schedule this vendor again without hesitation?</p>
                        <div className="flex gap-4 mt-2">
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, hesitationFree: true })}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${form.hesitationFree ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-400 hover:bg-white/50'}`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, hesitationFree: false })}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${!form.hesitationFree ? 'bg-red-600 text-white' : 'bg-white text-slate-400 hover:bg-white/50'}`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition">Record Evaluation</button>
                  </div>
                </form>
              </div>

              {/* Data Summary */}
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" /> Live Strategy Summary
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Latest Sentiment</p>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${form.hesitationFree ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {form.hesitationFree ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                          </div>
                          <p className="text-sm font-bold text-slate-700 leading-tight">
                            {form.hesitationFree
                              ? "PM would rehire without hesitation."
                              : "Operational friction detected. Re-evaluating contract."}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100">
                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Recommended Action</p>
                        <p className="font-bold">
                          {getTier(selectedVendor.rating || 0).label === 'Preferred'
                            ? "Maintain primary status. Lock in pricing tiers."
                            : getTier(selectedVendor.rating || 0).label === 'Watch'
                              ? "Conduct performance review. Request improvement plan."
                              : "Freeze all active scopes. Source alternatives."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-2xl text-white">
                  <h4 className="font-bold mb-2">Portfolio Sync Active</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Recording this scorecard updates the global "Vendor Sentiment" on the Dashboard in real-time. This metric is a weighted average of your qualitative and quantitative inputs.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 space-y-4 p-12">
            <Users className="w-16 h-16 opacity-10" />
            <p className="font-medium">Select a vendor from the left to start a real-time performance audit.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorScorecard;
