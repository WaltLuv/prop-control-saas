
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie
} from 'recharts';
import { Asset, KPIEntry, AssetHealth, KPIStatus, Job, JobStatus, Contractor, Tenant, Direction } from '../types';
import { 
  Wrench,
  Zap,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  Target,
  FileText
} from 'lucide-react';
import AddAssetModal from './AddAssetModal';
import { generatePortfolioStrategy } from '../geminiService';

interface DashboardProps {
  assets: Asset[];
  tenants: Tenant[];
  contractors: Contractor[];
  jobs: Job[];
  kpiEntries: KPIEntry[];
  healthMap: Record<string, AssetHealth>;
  onSelectAsset: (id: string) => void;
  onDeleteAsset: (id: string) => void;
  onAddAsset: (asset: Omit<Asset, 'id' | 'lastUpdated'>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ assets, tenants, contractors, jobs, kpiEntries, healthMap, onSelectAsset, onDeleteAsset, onAddAsset }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [strategyReport, setStrategyReport] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const activeJobs = jobs.filter(j => j.status !== JobStatus.COMPLETED && j.status !== JobStatus.CANCELLED).length;
    const workHoursSaved = jobs.length * 2.5;
    
    // Calculate Portfolio Occupancy based on LATEST KPI LOGS
    // We prioritize the logged 'Occupancy Level' KPI over raw tenant counts for accuracy
    let totalPortfolioUnits = 0;
    let totalOccupiedUnitsWeighted = 0;

    assets.forEach(asset => {
      // Find latest Occupancy KPI for this asset
      const latestOccupancyEntry = kpiEntries
        .filter(e => e.assetId === asset.id && e.kpiName === 'Occupancy Level')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      // Use KPI value (0.0 - 1.0) if exists, otherwise default to 0
      const occValue = latestOccupancyEntry ? latestOccupancyEntry.value : 0;
      
      totalPortfolioUnits += asset.units;
      totalOccupiedUnitsWeighted += (asset.units * occValue);
    });

    const occupancyRate = totalPortfolioUnits > 0 
      ? (totalOccupiedUnitsWeighted / totalPortfolioUnits) * 100 
      : 0;

    return { activeJobs, workHoursSaved, occupancyRate };
  }, [assets, tenants, jobs, kpiEntries]);

  const stats = useMemo(() => {
    return Object.values(healthMap).reduce((acc: { green: number; yellow: number; red: number; totalScore: number }, health: AssetHealth) => {
      if (health.statusBand === KPIStatus.GREEN) acc.green++;
      else if (health.statusBand === KPIStatus.YELLOW) acc.yellow++;
      else acc.red++;
      acc.totalScore += health.healthScore;
      return acc;
    }, { green: 0, yellow: 0, red: 0, totalScore: 0 });
  }, [healthMap]);

  const avgPortfolioHealth = assets.length > 0 ? Math.round(stats.totalScore / assets.length) : 0;

  const pieData = [
    { name: 'On Track', value: stats.green, color: '#10b981' },
    { name: 'Warning', value: stats.yellow, color: '#f59e0b' },
    { name: 'Critical', value: stats.red, color: '#ef4444' },
  ];

  const barData = assets.map(asset => ({
    name: asset.name.split(' ')[0],
    score: healthMap[asset.id]?.healthScore || 0
  }));

  const handleGenerateStrategy = async () => {
    setIsGeneratingStrategy(true);
    setStrategyReport(null);
    try {
      // Build a granular breakdown for the AI using strictly KPI data
      const assetBreakdown = assets.map(asset => {
        const latestOccupancyEntry = kpiEntries
          .filter(e => e.assetId === asset.id && e.kpiName === 'Occupancy Level')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        return {
          name: asset.name,
          units: asset.units,
          // Explicitly tell AI if data is missing or what the specific log says
          occupancyRate: latestOccupancyEntry 
            ? `${(latestOccupancyEntry.value * 100).toFixed(1)}%` 
            : "0% (No KPI Logged)",
          kpiDate: latestOccupancyEntry ? latestOccupancyEntry.date : 'N/A'
        };
      });

      const report = await generatePortfolioStrategy({
        portfolioSummary: {
          calculatedOccupancy: `${metrics.occupancyRate.toFixed(1)}%`,
          activeBacklog: metrics.activeJobs,
          avgHealthScore: avgPortfolioHealth,
          note: "Occupancy derived from 'Occupancy Level' KPI logs."
        },
        detailedBreakdown: assetBreakdown
      });
      setStrategyReport(report);
    } catch (err) {
      console.error(err);
      alert("Failed to generate strategy report.");
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
          <div className="flex justify-between items-start mb-6">
             <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Wrench className="w-5 h-5" /></div>
             <div className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Active</div>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Maintenance Backlog</p>
            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mt-1">{metrics.activeJobs} Units</h4>
          </div>
        </div>

        <div className="bg-indigo-600 p-7 rounded-[2rem] shadow-2xl shadow-indigo-200 border border-white/10 flex flex-col justify-between group hover:scale-[1.02] transition-all relative overflow-hidden">
          <div className="relative z-10 text-white">
            <div className="flex justify-between items-start mb-6">
               <div className="p-3 bg-white/20 text-white rounded-2xl backdrop-blur-md"><Zap className="w-5 h-5" /></div>
               <div className="bg-black/40 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">Efficiency</div>
            </div>
            <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em]">Labor Hours Saved</p>
            <h4 className="text-4xl font-black tracking-tighter mt-1">{metrics.workHoursSaved.toFixed(0)}h</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Health Distribution</h3>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Score</p>
                <p className="text-3xl font-black text-indigo-600 tracking-tighter">{avgPortfolioHealth}</p>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }} />
                  <Tooltip cursor={{ fill: '#f8fafc', radius: 12 }} />
                  <Bar dataKey="score" radius={[12, 12, 12, 12]} barSize={48}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score > 80 ? '#6366f1' : entry.score > 60 ? '#f59e0b' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Portfolio Status</h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={12} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-slate-300 uppercase">Assets</span>
              <span className="text-4xl font-black text-slate-900">{assets.length}</span>
            </div>
          </div>
          <div className="space-y-4 mt-10">
            {pieData.map(d => (
              <div key={d.name} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs font-black text-slate-500 uppercase">{d.name}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Executive Strategy Engine</h3>
              <p className="text-indigo-300 text-sm font-medium mt-1">AI-driven NOI optimization and asset health analysis.</p>
            </div>
            <button 
              onClick={handleGenerateStrategy}
              disabled={isGeneratingStrategy}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition shadow-2xl"
            >
              {isGeneratingStrategy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              Generate 90-Day Strategy
            </button>
          </div>

          {strategyReport ? (
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] animate-in slide-in-from-top-4 duration-500">
               <div className="flex items-center gap-3 mb-6 text-indigo-400">
                 <FileText className="w-5 h-5" />
                 <span className="text-xs font-black uppercase tracking-widest">Tactical Directives for {new Date().toLocaleDateString()}</span>
               </div>
               <div className="prose prose-invert prose-slate max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                 {strategyReport}
               </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 italic">
              Awaiting operational synthesis...
            </div>
          )}
        </div>
      </div>

      <div className="pt-4">
        <div className="flex justify-between items-end mb-8 px-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Asset Grid</h3>
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition"><Plus className="w-4 h-4" /> New Asset</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {assets.map(asset => {
            const health = healthMap[asset.id];
            if (!health) return null;
            return (
              <div key={asset.id} onClick={() => onSelectAsset(asset.id)} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl transition-all group cursor-pointer active:scale-[0.98]">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h4 className="font-black text-xl text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{asset.name}</h4>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1.5">{asset.units} Units</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteAsset(asset.id); }} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Health Score</span>
                    <span className={`text-3xl font-black tracking-tighter ${health.statusBand === KPIStatus.GREEN ? 'text-emerald-600' : health.statusBand === KPIStatus.YELLOW ? 'text-amber-500' : 'text-rose-600'}`}>{health.healthScore}</span>
                  </div>
                  <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100">
                    <div className={`h-full rounded-full transition-all duration-1000 ${health.statusBand === KPIStatus.GREEN ? 'bg-emerald-500' : health.statusBand === KPIStatus.YELLOW ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${health.healthScore}%` }} />
                  </div>
                  <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
                     <div className="flex items-center gap-2 font-black text-[11px] uppercase tracking-wider">
                       {health.direction === Direction.IMPROVING ? (
                         <><ArrowUpRight className="w-4 h-4 text-emerald-500" /> <span className="text-emerald-600">Improving</span></>
                       ) : health.direction === Direction.WATCH ? (
                         <><ArrowDownRight className="w-4 h-4 text-rose-500" /> <span className="text-rose-600">Watch</span></>
                       ) : (
                         <><Minus className="w-4 h-4 text-slate-300" /> <span className="text-slate-400">Stable</span></>
                       )}
                     </div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{asset.manager}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <AddAssetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={(data) => { onAddAsset(data); setIsModalOpen(false); }} />
    </div>
  );
};

export default Dashboard;
