
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Asset, KPIEntry, AssetHealth, KPIStatus, KPIName, Benchmark } from '../types';
import { BENCHMARKS } from '../constants';
import {
  ChevronLeft,
  BrainCircuit,
  Activity,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  History,
  Scale,
  MessageSquareQuote,
  Clock,
  Trash2,
  RefreshCcw,
  Loader2,
  Edit2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateAssetAudit } from '../geminiService';
import EditAssetModal from './EditAssetModal';

interface AssetDetailProps {
  asset: Asset;
  kpiEntries: KPIEntry[];
  health: AssetHealth;
  onBack: () => void;
  onDelete: () => void;
  onUpdateAsset: (asset: Asset) => void;
}

const AssetDetail: React.FC<AssetDetailProps> = ({ asset, kpiEntries, health, onBack, onDelete, onUpdateAsset }) => {
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchInsight = async () => {
    setIsSyncing(true);
    const latestMetrics = kpiEntries.slice(0, 10).map(e => ({ name: e.kpiName, value: e.value, date: e.date }));
    const insight = await generateAssetAudit(asset.name, health, latestMetrics);
    setAiInsight(insight || "System error generating audit.");
    setIsSyncing(false);
  };

  useEffect(() => {
    fetchInsight();
  }, [asset.id, kpiEntries.length]);

  const getKPIStatus = (kpiName: KPIName, value: number): KPIStatus => {
    const benchmark = BENCHMARKS.find(b => b.name === kpiName);
    if (!benchmark) return KPIStatus.GREEN;

    if (benchmark.higherIsBetter) {
      if (value >= benchmark.greenThreshold) return KPIStatus.GREEN;
      if (value >= benchmark.yellowThreshold) return KPIStatus.YELLOW;
      return KPIStatus.RED;
    } else {
      if (value <= benchmark.greenThreshold) return KPIStatus.GREEN;
      if (value <= benchmark.yellowThreshold) return KPIStatus.YELLOW;
      return KPIStatus.RED;
    }
  };

  const formatValue = (value: number, unit: Benchmark['unit']) => {
    if (unit === 'percentage') return `${(value * 100).toFixed(1)}%`;
    if (unit === 'currency') return `$${value.toLocaleString()}`;
    return value.toString();
  };

  const kpiHistoryMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    BENCHMARKS.forEach(benchmark => {
      map[benchmark.name] = kpiEntries
        .filter(e => e.kpiName === benchmark.name)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(e => ({
          date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          displayValue: benchmark.unit === 'percentage' ? e.value * 100 : e.value,
          originalValue: e.value,
          unit: benchmark.unit
        }));
    });
    return map;
  }, [kpiEntries]);

  const sortedLogs = useMemo(() => {
    return [...kpiEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [kpiEntries]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-3 text-slate-400 hover:text-indigo-600 font-black uppercase tracking-[0.2em] text-[11px] transition-all group"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
          Back to Portfolio
        </button>
        <div className="flex gap-3">
          <Link
            to={`/properties/${asset.id}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Activity className="w-3.5 h-3.5" /> Open Pro Workspace
          </Link>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-all active:scale-95"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Asset
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-100 transition-all active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" /> Offboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Activity className="w-64 h-64" />
            </div>
            <div className="relative z-10">
              <div className="flex flex-col justify-between items-start gap-8">
                <div className="w-full">
                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">{asset.name}</h2>
                    <div className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${health.statusBand === KPIStatus.GREEN ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                      health.statusBand === KPIStatus.YELLOW ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                      {health.statusBand}
                    </div>
                  </div>
                  <p className="text-slate-400 font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
                    <Activity className="w-4 h-4 text-indigo-400" /> {asset.address}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-10 pt-10 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Units in Portfolio</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tighter">{asset.units} Units</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Assigned Lead</p>
                      <p className="text-xl font-black text-slate-900 truncate">{asset.manager}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Property Health</p>
                      <p className="text-4xl font-black text-indigo-600 tracking-tighter">{health.healthScore}<span className="text-lg font-bold text-slate-300 ml-1">/100</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-10 flex items-center gap-3 uppercase tracking-tight">
              <Scale className="w-6 h-6 text-indigo-600" /> Scoring Engine Audit
            </h3>
            <div className="flex flex-wrap items-center gap-5 md:gap-10">
              <div className="flex flex-col items-center p-6 bg-slate-50 rounded-3xl min-w-[120px] md:min-w-[150px] border border-slate-100 shadow-inner">
                <span className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em]">Baseline</span>
                <span className="text-3xl font-black text-slate-900 tracking-tighter">100</span>
              </div>

              <div className="text-slate-200 text-3xl font-light">−</div>

              <div className={`flex flex-col items-center p-6 rounded-3xl min-w-[120px] md:min-w-[150px] border transition-all ${health.redCount > 0 ? 'bg-rose-50 text-rose-700 border-rose-100 shadow-sm' : 'bg-slate-50 text-slate-300 opacity-30 border-slate-100 shadow-inner'}`}>
                <span className="text-[10px] font-black uppercase mb-2 tracking-[0.2em]">Red Breach</span>
                <span className="text-3xl font-black tracking-tighter">{health.redCount * 15}</span>
                <span className="text-[9px] mt-1 font-black opacity-60">({health.redCount} × 15)</span>
              </div>

              <div className="text-slate-200 text-3xl font-light">−</div>

              <div className={`flex flex-col items-center p-6 rounded-3xl min-w-[120px] md:min-w-[150px] border transition-all ${health.yellowCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-100 shadow-sm' : 'bg-slate-50 text-slate-300 opacity-30 border-slate-100 shadow-inner'}`}>
                <span className="text-[10px] font-black uppercase mb-2 tracking-[0.2em]">Yellow Drift</span>
                <span className="text-3xl font-black tracking-tighter">{health.yellowCount * 5}</span>
                <span className="text-[9px] mt-1 font-black opacity-60">({health.yellowCount} × 5)</span>
              </div>

              <div className="text-slate-200 text-3xl font-light">=</div>

              <div className="flex flex-col items-center p-7 bg-indigo-600 text-white rounded-[2.5rem] min-w-[140px] md:min-w-[180px] shadow-2xl shadow-indigo-200 relative overflow-hidden transition-transform hover:scale-105 duration-300">
                <div className="absolute top-0 right-0 p-5 opacity-20">
                  <Activity className="w-14 h-14" />
                </div>
                <span className="text-[10px] font-black uppercase mb-2 tracking-[0.2em] opacity-80">Property Health Score</span>
                <span className="text-4xl md:text-5xl font-black tracking-tighter">{health.healthScore}</span>
              </div>
            </div>
          </div>

          <div className="space-y-8 pt-4">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 px-2 uppercase tracking-tight">
              <History className="w-6 h-6 text-indigo-600" /> Operational Momentum
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {BENCHMARKS.map(benchmark => {
                const data = kpiHistoryMap[benchmark.name] || [];
                if (data.length === 0) return null;

                return (
                  <div key={benchmark.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-widest text-[11px] group-hover:text-indigo-600 transition-colors">{benchmark.name}</h4>
                        <p className="text-[9px] text-slate-300 uppercase font-black tracking-[0.2em] mt-1">Variance Audit</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                          {formatValue(data[data.length - 1].originalValue, benchmark.unit)}
                        </p>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Last Log</p>
                      </div>
                    </div>

                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#cbd5e1', fontWeight: 700 }}
                            dy={10}
                          />
                          <YAxis
                            hide
                            domain={['auto', 'auto']}
                          />
                          <Tooltip
                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontSize: '11px', fontWeight: 800, padding: '12px' }}
                            formatter={(value: any, name: any, props: any) => [
                              formatValue(props.payload.originalValue, benchmark.unit),
                              benchmark.name
                            ]}
                          />
                          <Line
                            type="monotone"
                            dataKey="displayValue"
                            stroke="#6366f1"
                            strokeWidth={4}
                            dot={{ fill: '#6366f1', r: 5, strokeWidth: 3, stroke: '#fff' }}
                            activeDot={{ r: 7, strokeWidth: 0, fill: '#4338ca' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl text-white relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
              <BrainCircuit className="w-32 h-32 md:w-48 md:h-48" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                    <BrainCircuit className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight">AI Asset Audit</h3>
                </div>
                <button
                  onClick={fetchInsight}
                  disabled={isSyncing}
                  className="p-2.5 hover:bg-white/10 rounded-2xl transition-all active:scale-90 disabled:opacity-30 border border-white/10"
                  title="Force Audit Refresh"
                >
                  <RefreshCcw className={`w-4.5 h-4.5 text-indigo-300 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isSyncing && !aiInsight ? (
                <div className="py-16 flex flex-col items-center justify-center text-indigo-300 space-y-6">
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Running Pro-Tier Audit...</p>
                </div>
              ) : (
                <div className="bg-white/5 p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-inner backdrop-blur-sm">
                  <p className="text-indigo-100 text-sm md:text-base leading-relaxed italic font-medium">
                    "{aiInsight}"
                  </p>
                </div>
              )}

              <div className="pt-8 mt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em]">Gemini Intelligence v3.1</span>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl self-start sm:self-auto">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Verified Analysis</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tight">
              <AlertCircle className="w-6 h-6 text-rose-500" /> Risk Exposure
            </h3>
            {health.redCount > 0 || health.yellowCount > 0 ? (
              <div className="space-y-5">
                {health.redCount > 0 && (
                  <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 shadow-sm transition-all hover:bg-rose-100/50">
                    <div className="flex items-center gap-2 text-rose-700 font-black text-[11px] uppercase tracking-widest mb-3">
                      <AlertCircle className="w-4.5 h-4.5" /> High Risk Breach
                    </div>
                    <p className="text-xs md:text-sm text-rose-800/80 leading-relaxed font-bold">
                      {health.redCount} critical indicators identified outside of standard tolerance thresholds.
                    </p>
                  </div>
                )}
                {health.yellowCount > 0 && (
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 shadow-sm transition-all hover:bg-amber-100/50">
                    <div className="flex items-center gap-2 text-amber-700 font-black text-[11px] uppercase tracking-widest mb-3">
                      <AlertTriangle className="w-4.5 h-4.5" /> Trending Alert
                    </div>
                    <p className="text-xs md:text-sm text-amber-800/80 leading-relaxed font-bold">
                      {health.yellowCount} metrics exhibit negative drift trends. Immediate monitoring required.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-10 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 text-center shadow-inner group">
                <CheckCircle2 className="w-14 h-14 text-indigo-500 mx-auto mb-6 group-hover:scale-110 transition-transform duration-500" />
                <p className="text-base md:text-lg text-indigo-900 font-black uppercase tracking-tight">Operational Excellence</p>
                <p className="text-[10px] text-indigo-500/60 mt-2 font-black uppercase tracking-widest">All Performance Targets Met</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <EditAssetModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          asset={asset}
          onSave={(data) => {
            onUpdateAsset(data);
            setIsEditModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default AssetDetail;
