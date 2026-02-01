
import React, { useState } from 'react';
import { 
  FileText, 
  Send, 
  Zap, 
  DollarSign, 
  CheckCircle, 
  Loader2, 
  ClipboardList,
  Mail,
  ArrowRight,
  BookOpen,
  AlertCircle,
  Copy,
  RotateCcw,
  Check,
  Percent,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { generateServiceProposal } from '../geminiService';

interface SOWItem {
  task: string;
  description: string;
  unitCost: string;
  baseSubtotal: number;
}

const ServiceEstimator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState({ name: '', address: '' });
  const [notes, setNotes] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  const MARKUP_PERCENT = 0.15;

  const [proposal, setProposal] = useState<{
    detailedSow: SOWItem[];
    finalEmailToOwner: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!notes.trim() || !project.name.trim()) {
      setError("Project Name and Scope Notes are required.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setProposal(null);
    
    try {
      const result = await generateServiceProposal(notes, project);
      if (result && result.detailedSow && Array.isArray(result.detailedSow)) {
        setProposal(result);
      } else {
        throw new Error("Received malformed response from the analysis engine.");
      }
    } catch (err: any) {
      console.error("SOW Generation Error:", err);
      setError(err.message || "Analysis failed. Please try again with more detailed scope notes.");
    } finally {
      setLoading(false);
    }
  };

  const fillExample = () => {
    setProject({ name: 'Unit 402 Turn', address: 'Riverside Apartments, 123 River Rd' });
    setNotes("Full interior repaint (Standard Gray SKU). Replace damaged laminate with LVP in living room. Repair leaking master bath faucet. Professional deep clean after construction.");
  };

  const resetForm = () => {
    setProject({ name: '', address: '' });
    setNotes('');
    setProposal(null);
    setError(null);
  };

  const copyEmail = () => {
    if (proposal) {
      navigator.clipboard.writeText(proposal.finalEmailToOwner);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const totals = proposal ? proposal.detailedSow.reduce((acc, item) => {
    const markup = item.baseSubtotal * MARKUP_PERCENT;
    return {
      base: acc.base + item.baseSubtotal,
      fee: acc.fee + markup,
      grand: acc.grand + item.baseSubtotal + markup
    };
  }, { base: 0, fee: 0, grand: 0 }) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">SOW Proposal Builder</h3>
            </div>
            <button onClick={resetForm} className="p-2 text-slate-400 hover:text-indigo-600 transition"><RotateCcw className="w-4 h-4" /></button>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Project Reference</label>
                <input 
                  type="text" placeholder="e.g. Unit 402 Renovations"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                  value={project.name} onChange={(e) => setProject({...project, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Asset Location</label>
                <input 
                  type="text" placeholder="Street, City, Zip"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                  value={project.address} onChange={(e) => setProject({...project, address: e.target.value})}
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-[250px]">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Detailed Scope Notes</label>
                <button onClick={fillExample} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-tight">Load Example</button>
              </div>
              <textarea 
                placeholder="List tasks here. Be specific for better accuracy..."
                className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-6 focus:ring-2 focus:ring-indigo-500 outline-none text-sm leading-relaxed text-slate-900 font-medium"
                value={notes} onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-rose-700">{error}</p>
            </div>
          )}

          <button 
            onClick={handleGenerate}
            disabled={loading || !notes.trim() || !project.name.trim()}
            className={`mt-6 w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
              loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100'
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            {loading ? 'Synthesizing Proposal...' : 'Generate SOW Package'}
          </button>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-8">
        {proposal && totals ? (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-white/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><DollarSign className="w-32 h-32" /></div>
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-6">
                   <div>
                     <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Gross Project Quote (Internal)</span>
                     <h4 className="text-5xl font-black tracking-tighter">${totals.grand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                   </div>
                   <div className="bg-emerald-500/20 px-4 py-2 rounded-xl border border-emerald-500/30 flex items-center gap-2">
                     <ShieldCheck className="w-4 h-4 text-emerald-400" />
                     <span className="text-xs font-bold uppercase tracking-widest">Market Verified</span>
                   </div>
                 </div>
                 <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                    <div><p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Vendor Subtotal</p><p className="font-bold text-white/90">${totals.base.toLocaleString()}</p></div>
                    <div><p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Mgmt Fee (15%)</p><p className="font-bold text-indigo-400">${totals.fee.toLocaleString()}</p></div>
                    <div className="text-right"><p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Final Status</p><p className="font-bold text-white/90">Quote Ready</p></div>
                 </div>
               </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider">Internal Quote Analysis</h4>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {proposal.detailedSow.map((item, i) => {
                  const markup = item.baseSubtotal * MARKUP_PERCENT;
                  return (
                    <div key={i} className="p-6 hover:bg-slate-50 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-black text-slate-900 uppercase tracking-tight">{item.task}</h5>
                        <span className="text-sm font-black text-slate-900">${(item.baseSubtotal + markup).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed mb-4">{item.description}</p>
                      <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Direct Cost</span><span className="text-xs font-black text-black">${item.baseSubtotal.toLocaleString()}</span></div>
                        <div className="flex flex-col"><span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Mgmt Fee (15%)</span><span className="text-xs font-black text-indigo-600">${markup.toLocaleString()}</span></div>
                        <div className="ml-auto text-[10px] font-black text-slate-400 italic">Reference: {item.unitCost}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2"><Mail className="w-5 h-5 text-indigo-600" /><h4 className="font-black text-slate-900 text-sm uppercase tracking-wider">Owner Approval Email (Integrated Pricing)</h4></div>
                 <button onClick={copyEmail} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${copySuccess ? 'bg-emerald-600 text-white' : 'text-indigo-600 hover:bg-indigo-100'}`}>
                   {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copySuccess ? 'Copied!' : 'Copy Email Body'}
                 </button>
               </div>
               <div className="bg-white p-8 rounded-2xl text-slate-900 text-sm leading-relaxed border border-indigo-200 whitespace-pre-wrap font-bold shadow-inner max-h-[500px] overflow-y-auto custom-scrollbar">
                 {proposal.finalEmailToOwner}
               </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 space-y-6 p-12 text-center">
            <BookOpen className="w-12 h-12 opacity-20" />
            <div className="max-w-sm"><p className="font-black text-slate-900 text-sm uppercase tracking-widest mb-2">Analysis Engine Standby</p><p className="text-sm font-medium leading-relaxed">Provide project context to generate an internal quote with explicit fees and a separate all-in email for the owner.</p></div>
            <button onClick={fillExample} className="px-6 py-2.5 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition">Load Sample Case</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceEstimator;
