
import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Zap, 
  Calendar, 
  ArrowRight, 
  AlertCircle,
  Activity,
  Trophy,
  Hammer,
  Loader2,
  ListChecks,
  Target,
  RefreshCw
} from 'lucide-react';
import { generateOpsGamePlan } from '../geminiService';

const OpsAudit: React.FC = () => {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [leaks, setLeaks] = useState('');
  const [systems, setSystems] = useState('');
  const [fixes, setFixes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [gamePlan, setGamePlan] = useState<string | null>(null);
  
  const toggleItem = (id: string) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFinalize = async () => {
    if (!leaks || !systems || !fixes) {
      alert("Please fill in all analysis fields before finalizing the report.");
      return;
    }

    setIsGenerating(true);
    setGamePlan(null);
    try {
      const plan = await generateOpsGamePlan(leaks, systems, fixes);
      setGamePlan(plan || "Failed to generate plan.");
    } catch (err) {
      console.error(err);
      alert("Error generating recovery strategy. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetAudit = () => {
    if (window.confirm("Start a new audit? This will clear current inputs.")) {
      setLeaks('');
      setSystems('');
      setFixes('');
      setGamePlan(null);
    }
  };

  const phases = [
    {
      title: "Days 1–10 — Visibility",
      icon: Search,
      color: "indigo",
      items: [
        { id: "v1", label: "Weekly KPI dashboard implemented" },
        { id: "v2", label: "Open work orders reviewed & aged" },
        { id: "v3", label: "Turn days + costs trended" },
        { id: "v4", label: "Vendor list reviewed" }
      ]
    },
    {
      title: "Days 11–20 — Discipline",
      icon: Hammer,
      color: "amber",
      items: [
        { id: "d1", label: "Turn scopes standardized" },
        { id: "d2", label: "Vendor scorecards launched" },
        { id: "d3", label: "PM weekly cadence enforced" },
        { id: "d4", label: "Non-essential CapEx frozen" }
      ]
    },
    {
      title: "Days 21–30 — Stabilization",
      icon: Activity,
      color: "green",
      items: [
        { id: "s1", label: "Vendor cleanup executed" },
        { id: "s2", label: "Backlog reduction plan live" },
        { id: "s3", label: "KPI trends stabilized or improving" },
        { id: "s4", label: "90-day ops priorities set" }
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">30-Day Operational Reset</h2>
          <p className="text-slate-500 font-medium mt-1">Identify NOI leaks and regain portfolio control.</p>
        </div>
        <div className="flex items-center gap-4">
          {gamePlan && (
            <button 
              onClick={resetAudit}
              className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition text-sm"
            >
              <RefreshCw className="w-4 h-4" /> New Analysis
            </button>
          )}
          <div className="flex items-center gap-3 bg-red-100 px-4 py-2 rounded-xl text-red-700 border border-red-200">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-sm font-black uppercase tracking-widest">High Intensity Period</span>
          </div>
        </div>
      </div>

      {!gamePlan ? (
        <>
          {/* Checklist Phases */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {phases.map((phase, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
                <div className={`absolute -top-6 -right-6 p-8 opacity-5 group-hover:scale-110 transition-transform text-${phase.color}-600`}>
                  <phase.icon className="w-24 h-24" />
                </div>
                
                <div className="relative z-10 flex-1">
                  <div className="flex items-center gap-3 mb-8">
                    <div className={`p-2 rounded-xl bg-${phase.color}-50 text-${phase.color}-600`}>
                      <phase.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">{phase.title}</h3>
                  </div>

                  <div className="space-y-4">
                    {phase.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className="w-full flex items-center gap-4 text-left group/item"
                      >
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          checklist[item.id] 
                          ? `bg-${phase.color}-600 border-${phase.color}-600` 
                          : 'bg-white border-slate-200'
                        }`}>
                          {checklist[item.id] && <Trophy className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-sm font-semibold transition-all ${
                          checklist[item.id] ? 'text-slate-400 line-through' : 'text-slate-700 group-hover/item:text-slate-900'
                        }`}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Audit Input Section */}
          <div className="bg-slate-900 p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <Zap className="w-48 h-48" />
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                 <AlertCircle className="w-6 h-6 text-indigo-400" /> Operational Leak Identification
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Top 3 NOI Leaks</label>
                  <textarea 
                    value={leaks}
                    onChange={(e) => setLeaks(e.target.value)}
                    placeholder="1. High vacancy in asset A..." 
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 font-medium"
                    rows={4}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Systems Broken (vs People)</label>
                  <textarea 
                    value={systems}
                    onChange={(e) => setSystems(e.target.value)}
                    placeholder="Lack of standardized turn scope..." 
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 font-medium"
                    rows={4}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Immediate Fixes vs Deferred</label>
                  <textarea 
                    value={fixes}
                    onChange={(e) => setFixes(e.target.value)}
                    placeholder="Immediate: Vendor freeze. Deferred: Kitchen upgrades." 
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 font-medium"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-slate-800 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black text-xl">
                    !
                  </div>
                  <div>
                    <p className="text-xl font-black italic">"Stabilize first. Optimize second. Renovate last."</p>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Foundational Control Protocol</p>
                  </div>
                </div>
                <button 
                  onClick={handleFinalize}
                  disabled={isGenerating}
                  className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition flex items-center justify-center gap-3 group disabled:opacity-50"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Exposure...</>
                  ) : (
                    <>Finalize Audit Report <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Generated Game Plan Section */
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
           <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-16 text-white shadow-2xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                 <Target className="w-64 h-64" />
              </div>
              
              <div className="relative z-10">
                 <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
                   <div>
                     <div className="flex items-center gap-3 mb-2">
                       <ShieldAlert className="w-6 h-6 text-indigo-400" />
                       <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Chief Operations Officer Ledger</span>
                     </div>
                     <h3 className="text-4xl font-black tracking-tight">Portfolio Recovery Roadmap</h3>
                   </div>
                   <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
                     <ListChecks className="w-5 h-5 text-indigo-400" />
                     <span className="text-sm font-bold">Audit Ref: #{Date.now().toString().slice(-6)}</span>
                   </div>
                 </div>

                 <div className="prose prose-invert prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-headings:uppercase prose-headings:text-indigo-300 prose-p:text-slate-300 prose-p:leading-relaxed prose-strong:text-white">
                    <div className="whitespace-pre-wrap font-medium text-lg leading-relaxed">
                      {gamePlan}
                    </div>
                 </div>

                 <div className="mt-16 pt-10 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-4">
                       <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                          <Trophy className="w-6 h-6 text-green-500" />
                       </div>
                       <div>
                          <p className="font-black text-sm uppercase tracking-widest text-green-500">Stability Achieved</p>
                          <p className="text-xs text-slate-400 font-medium">Proceed to execution phase immediately.</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => window.print()}
                      className="px-8 py-4 bg-white text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition shadow-xl"
                    >
                      Export Full PDF Report
                    </button>
                 </div>
              </div>
           </div>
           
           <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 flex items-center gap-6">
              <div className="bg-indigo-600 p-4 rounded-2xl text-white">
                <Target className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-slate-900 uppercase tracking-tight">Executive Directive</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  This game plan has been synthesized based on your specific audit inputs. Implementing Phase 1 within the next 48 hours is critical to stopping current capital erosion.
                </p>
              </div>
              <button 
                onClick={resetAudit}
                className="hidden md:block px-6 py-2.5 rounded-xl border border-indigo-200 text-indigo-600 text-xs font-black uppercase hover:bg-white transition"
              >
                Start New Audit
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default OpsAudit;
