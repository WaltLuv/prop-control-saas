
import React from 'react';
import { 
  ClipboardCheck, 
  CalendarClock, 
  Hammer, 
  ShieldCheck, 
  AlertOctagon, 
  Zap,
  CheckCircle2
} from 'lucide-react';

const MakeReadyChecklist: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ClipboardCheck className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black tracking-tight mb-2">Turn Standard Operating Procedure</h2>
          <p className="text-indigo-100 font-medium max-w-lg">
            Operationalizing the "Speed without Chaos" protocol. Use this checklist for every unit vacancy to maintain portfolio health and reduce turn days.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section A */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CalendarClock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">A. Pre-Move-Out</h3>
            <span className="text-xs font-bold text-slate-400 ml-auto">10–14 DAYS PRIOR</span>
          </div>
          
          <ul className="space-y-4">
            {[
              "Pre-inspection completed",
              "Scope drafted & approved",
              "Vendors scheduled",
              "Materials ordered"
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 group cursor-pointer">
                <div className="w-6 h-6 rounded border-2 border-slate-200 flex items-center justify-center group-hover:border-indigo-400 transition shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-white group-hover:text-indigo-100" />
                </div>
                <span className="text-slate-600 font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section B */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Hammer className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">B. Turn Day 1–X</h3>
            <span className="text-xs font-bold text-slate-400 ml-auto">LOCKED SCOPE</span>
          </div>
          
          <ul className="space-y-4">
            {[
              "Demo/repairs",
              "Paint (standard SKU only)",
              "Flooring (standard SKU only)",
              "Fixtures & hardware",
              "Deep Cleaning"
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 group cursor-pointer">
                <div className="w-6 h-6 rounded border-2 border-slate-200 flex items-center justify-center group-hover:border-amber-400 transition shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-white group-hover:text-amber-100" />
                </div>
                <span className="text-slate-600 font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Restricted Section */}
        <div className="bg-red-50 p-8 rounded-2xl border border-red-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-red-900">🚫 Explicitly Not Allowed</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-red-700/80 text-sm font-medium italic">Scope creep is the enemy of turn time. These items require Regional Manager override:</p>
            <div className="grid grid-cols-1 gap-3">
              {["Custom Upgrades", "Design Changes", '"While we’re here" work'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-red-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="font-bold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section C */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">C. QA Before Leasing</h3>
            <span className="text-xs font-bold text-slate-400 ml-auto">FINAL SIGN-OFF</span>
          </div>
          
          <ul className="space-y-4">
            {[
              "Punch list cleared",
              "Photos complete (Marketing)",
              "Leasing approved"
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 group cursor-pointer">
                <div className="w-6 h-6 rounded border-2 border-slate-200 flex items-center justify-center group-hover:border-green-400 transition shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-white group-hover:text-green-100" />
                </div>
                <span className="text-slate-600 font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-3xl text-center shadow-inner">
        <div className="inline-flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full mb-6">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Turn Philosophy</span>
        </div>
        <h4 className="text-2xl font-black text-white italic mb-4">
          "Fast and repeatable beats fancy and slow."
        </h4>
        <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
          Standardization creates bandwidth. Deviations create delays. Stick to the SKU list and maintain the rhythm.
        </p>
      </div>
    </div>
  );
};

export default MakeReadyChecklist;
