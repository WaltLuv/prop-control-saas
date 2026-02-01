
import React, { useState, useMemo } from 'react';
import { 
  BrainCircuit, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Loader2, 
  Zap, 
  History, 
  Target, 
  DollarSign,
  AlertCircle,
  ArrowRight,
  Clock,
  Sparkles,
  // Added RefreshCcw to fix "Cannot find name 'RefreshCcw'" error
  RefreshCcw
} from 'lucide-react';
import { Asset, Job, KPIEntry, MaintenancePrediction } from '../types';
import { predictMaintenance } from '../geminiService';

interface MaintenancePredictorProps {
  assets: Asset[];
  jobs: Job[];
  kpiEntries: KPIEntry[];
}

const MaintenancePredictor: React.FC<MaintenancePredictorProps> = ({ assets, jobs, kpiEntries }) => {
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<MaintenancePrediction | null>(null);

  const selectedAsset = useMemo(() => assets.find(a => a.id === selectedAssetId), [assets, selectedAssetId]);

  const handleRunPredictiveAudit = async () => {
    if (!selectedAsset) return;
    setIsAnalyzing(true);
    setPrediction(null);
    try {
      const assetJobs = jobs.filter(j => j.propertyId === selectedAssetId);
      const assetKPIs = kpiEntries.filter(e => e.assetId === selectedAssetId);
      const result = await predictMaintenance(selectedAsset.name, assetJobs, assetKPIs);
      setPrediction(result);
    } catch (err) {
      console.error(err);
      alert("Failed to synchronize with Neural Prediction core.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'MEDIUM': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
          <BrainCircuit className="w-64 h-64" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                  <BrainCircuit className="w-6 h-6 text-indigo-400" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Neural Maintenance Predictor</h2>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">Forecasting Asset Fatigue</h1>
              <p className="text-slate-400 font-medium mt-4 max-w-xl">
                Correlating historical job frequency with financial KPI drift to predict major system failures before they occur.
              </p>
            </div>
            
            <div className="w-full md:w-80 bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-sm">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-300 block mb-3">Target Asset</label>
              <select 
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button 
                onClick={handleRunPredictiveAudit}
                disabled={isAnalyzing}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition shadow-2xl disabled:opacity-30"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                Run Predictive Audit
              </button>
            </div>
          </div>
        </div>
      </div>

      {!prediction && !isAnalyzing && (
        <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
           <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
             <Activity className="w-10 h-10" />
           </div>
           <div>
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">System Ready</h3>
             <p className="text-slate-400 font-medium mt-1">Select an asset and execute a neural audit to begin forecasting.</p>
           </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="py-32 flex flex-col items-center justify-center space-y-10 animate-pulse">
           <div className="relative">
             <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20" />
             <RefreshCcw className="w-20 h-20 text-indigo-500 animate-spin" />
           </div>
           <div className="text-center">
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest animate-bounce">Synthesizing Telemetry...</h3>
             <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] mt-2">Correlating ${jobs.filter(j => j.propertyId === selectedAssetId).length} Historical Job Samples</p>
           </div>
        </div>
      )}

      {prediction && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-6 duration-700">
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Failure Probability</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{prediction.riskScore}</span>
                    <span className="text-lg font-bold text-slate-300">%</span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border ${getRiskColor(prediction.riskLevel)}`}>
                  {prediction.riskLevel} Risk
                </div>
              </div>
              <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    prediction.riskScore > 75 ? 'bg-rose-500' : prediction.riskScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} 
                  style={{ width: `${prediction.riskScore}%` }} 
                />
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 left-0 p-8 opacity-5">
                 <ShieldAlert className="w-24 h-24" />
               </div>
               <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 flex items-center gap-2">
                 <Sparkles className="w-4 h-4" /> Chief Operations Audit
               </h3>
               <p className="text-lg font-medium leading-relaxed italic text-indigo-100">
                 "{prediction.executiveSummary}"
               </p>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center gap-3">
                <Activity className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Predicted System Vulnerabilities</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {prediction.predictedIssues.map((issue, idx) => (
                  <div key={idx} className="p-8 hover:bg-slate-50 transition-colors group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                      <div className="flex items-center gap-5">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black border ${
                           issue.probability > 0.7 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                         }`}>
                           {Math.round(issue.probability * 100)}%
                         </div>
                         <div>
                           <h4 className="text-xl font-black text-slate-900 tracking-tight">{issue.system}</h4>
                           <div className="flex items-center gap-4 mt-1">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                               <Clock className="w-3 h-3" /> {issue.timeframe}
                             </span>
                             <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1.5">
                               <DollarSign className="w-3 h-3" /> Est. ${issue.estimatedCost.toLocaleString()}
                             </span>
                           </div>
                         </div>
                      </div>
                      <div className="hidden group-hover:block animate-in fade-in slide-in-from-right-4 duration-300">
                        <button className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-[10px] bg-indigo-50 px-4 py-2 rounded-xl">
                          Queue PM Job <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
                      {issue.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50 rounded-[2.5rem] p-10 border border-indigo-100">
              <h3 className="text-sm font-black text-indigo-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                <Target className="w-5 h-5" /> Recommended Preventative Strategy
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prediction.suggestedPMPlan.map((action, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm transition hover:shadow-md">
                     <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                       {idx + 1}
                     </div>
                     <span className="text-sm font-bold text-slate-700">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePredictor;
