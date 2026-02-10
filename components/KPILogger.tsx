
import React, { useState, useMemo, useEffect } from 'react';
import { Asset, Benchmark, KPIEntry, KPIName, KPIStatus } from '../types';
import { Save, Info, History, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

interface KPILoggerProps {
  assets: Asset[];
  benchmarks: Benchmark[];
  kpiEntries: KPIEntry[];
  onSubmit: (entry: Omit<KPIEntry, 'id'>) => void;
  getKPIStatus: (kpiName: KPIName, value: number) => KPIStatus;
}

const KPILogger: React.FC<KPILoggerProps> = ({ assets, benchmarks, kpiEntries, onSubmit, getKPIStatus }) => {
  const [assetId, setAssetId] = useState(assets[0]?.id || '');
  const [kpiName, setKpiName] = useState<KPIName>(benchmarks[0]?.name);
  const [value, setValue] = useState('');
  const [commentary, setCommentary] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);

  const benchmark = benchmarks.find(b => b.name === kpiName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !kpiName || value === '') return;

    const tempId = `new-${Date.now()}`;
    setLastSubmittedId(tempId);

    onSubmit({
      assetId,
      kpiName,
      value: parseFloat(value) || 0,
      date,
      commentary
    });

    setValue('');
    setCommentary('');

    // Clear the highlight after a few seconds
    setTimeout(() => setLastSubmittedId(null), 3000);
  };

  // Enhanced sorting: Date first, then ID (creation order) as tie-breaker
  const recentLogs = useMemo(() => {
    return [...kpiEntries].sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      // If dates match, use ID comparison (lexicographical or timestamp based)
      return b.id.localeCompare(a.id);
    }).slice(0, 8);
  }, [kpiEntries]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700">
      <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-12">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4 tracking-tight uppercase">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
              <Save className="w-6 h-6 text-white" />
            </div>
            Operational Intake
          </h3>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Benchmarks</p>
            <p className="text-lg font-black text-indigo-600 tracking-tighter">{benchmarks.length} Metrics</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Target Asset</label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-black text-slate-900 appearance-none shadow-sm"
              >
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Benchmark Category</label>
              <select
                value={kpiName}
                onChange={(e) => setKpiName(e.target.value as KPIName)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-black text-slate-900 appearance-none shadow-sm"
              >
                {benchmarks.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                Measured Value ({benchmark?.unit === 'percentage' ? '0.00 to 1.00' : benchmark?.unit})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={benchmark?.unit === 'percentage' ? '0.95' : 'Enter value'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-black text-slate-900 shadow-sm"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400 uppercase tracking-widest pointer-events-none">
                  {benchmark?.unit}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Logging Period (Week Ending)</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-black text-slate-900 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Contextual Commentary</label>
            <textarea
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              placeholder="Explain variances or operational wins..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-slate-900 font-semibold"
            />
          </div>

          <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex items-start gap-5 shadow-inner">
            <div className="p-2.5 bg-white rounded-xl shadow-sm">
              <Info className="w-5 h-5 text-indigo-600 shrink-0" />
            </div>
            <div className="text-sm">
              <p className="font-black text-indigo-950 uppercase tracking-tight mb-1">Impact Preview</p>
              <div className="flex items-center gap-3">
                <span className="text-indigo-700/70 font-medium">Metric will be classified as:</span>
                <span className={`px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm ${value ? (
                    getKPIStatus(kpiName, parseFloat(value)) === KPIStatus.GREEN ? 'bg-emerald-500 text-white' :
                      getKPIStatus(kpiName, parseFloat(value)) === KPIStatus.YELLOW ? 'bg-amber-500 text-white' :
                        'bg-rose-500 text-white'
                  ) : 'bg-slate-200 text-slate-400'
                  }`}>
                  {value ? getKPIStatus(kpiName, parseFloat(value)) : 'Awaiting Input'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 transition shadow-2xl shadow-indigo-100 uppercase tracking-widest text-xs active:scale-[0.98] group"
          >
            <span className="flex items-center justify-center gap-3">
              Commit Performance Log <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </span>
          </button>
        </form>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
            <History className="w-32 h-32" />
          </div>
          <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tight relative z-10">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/20">
              <Clock className="w-5 h-5 text-indigo-400" />
            </div>
            Live Performance Feed
          </h3>

          <div className="space-y-4 relative z-10 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {recentLogs.length > 0 ? recentLogs.map((log, index) => {
              const status = getKPIStatus(log.kpiName, log.value);
              const asset = assets.find(a => a.id === log.assetId);
              const isJustAdded = index === 0 && (lastSubmittedId || Date.now() - new Date(log.id.replace('k-', '')).getTime() < 10000);

              return (
                <div
                  key={log.id}
                  className={`p-5 rounded-2xl border transition-all duration-500 group/log ${isJustAdded
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-black text-white text-[11px] uppercase tracking-tight mb-1">{asset?.name}</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status === KPIStatus.GREEN ? 'bg-emerald-500' :
                            status === KPIStatus.YELLOW ? 'bg-amber-500' :
                              'bg-rose-500'
                          }`} />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{log.kpiName}</span>
                      </div>
                    </div>
                    {isJustAdded && (
                      <div className="flex items-center gap-1.5 bg-indigo-500/20 px-2 py-0.5 rounded-lg border border-indigo-500/30 animate-pulse">
                        <Sparkles className="w-2.5 h-2.5 text-indigo-300" />
                        <span className="text-[8px] font-black text-indigo-300 uppercase tracking-tighter">New Entry</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-white tracking-tighter">
                      {log.kpiName === 'Rent Collected %' ? `${(log.value * 100).toFixed(1)}%` : log.value}
                    </span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center opacity-20">
                <History className="w-12 h-12 mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">Awaiting Logs</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="font-black uppercase tracking-tight text-sm mb-2">Neural Synchronization</h4>
            <p className="text-xs text-indigo-100 leading-relaxed font-medium">
              Metric logs are processed through the global health engine in real-time. Any entry above or below benchmark triggers immediate portfolio re-scoring.
            </p>
          </div>
          <div className="absolute bottom-[-20%] right-[-10%] p-10 opacity-10 pointer-events-none">
            <Sparkles className="w-32 h-32" />
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default KPILogger;
