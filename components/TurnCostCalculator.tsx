
import React, { useState, useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  Clock,
  TrendingDown,
  ArrowRight,
  Info,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const TurnCostCalculator: React.FC = () => {
  // Inputs
  const [unitsTurned, setUnitsTurned] = useState(6);
  const [avgMarketRent, setAvgMarketRent] = useState(1200);
  const [avgTurnDays, setAvgTurnDays] = useState(18);
  const [targetTurnDays, setTargetTurnDays] = useState(12);
  const [laborCost, setLaborCost] = useState(950);
  const [materialsCost, setMaterialsCost] = useState(1100);
  const [leasingCost, setLeasingCost] = useState(300);

  // Calculations
  const calculations = useMemo(() => {
    const dailyRent = avgMarketRent / 30;
    const vacancyLoss = dailyRent * avgTurnDays;
    const excessDays = Math.max(0, avgTurnDays - targetTurnDays);
    const excessVacancyCost = excessDays * dailyRent;
    const allInTurnCost = laborCost + materialsCost + leasingCost + vacancyLoss;
    const totalPortfolioImpact = allInTurnCost * unitsTurned;
    const totalPotentialSavings = (excessVacancyCost * unitsTurned);

    return {
      dailyRent,
      vacancyLoss,
      excessVacancyCost,
      allInTurnCost,
      totalPortfolioImpact,
      totalPotentialSavings,
      breakdown: [
        { name: 'Labor', value: laborCost, color: '#6366f1' },
        { name: 'Materials', value: materialsCost, color: '#818cf8' },
        { name: 'Leasing', value: leasingCost, color: '#a5b4fc' },
        { name: 'Vacancy Loss', value: vacancyLoss, color: '#ef4444' }
      ]
    };
  }, [unitsTurned, avgMarketRent, avgTurnDays, targetTurnDays, laborCost, materialsCost, leasingCost]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Input Section */}
      <div className="xl:col-span-4 space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-full">
          <div className="flex items-center gap-2 mb-8">
            <Calculator className="w-5 h-5 text-black" />
            <h3 className="text-xl font-black text-black uppercase tracking-tight">Analysis Inputs</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Units Turned (Period)</label>
              <input
                type="number"
                value={unitsTurned}
                onChange={(e) => setUnitsTurned(Number(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-black text-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Avg Market Rent</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                  <input
                    type="number"
                    value={avgMarketRent}
                    onChange={(e) => setAvgMarketRent(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-black text-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Daily Rent</label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-black font-black">
                  ${calculations.dailyRent.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Avg Turn Days</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                  <input
                    type="number"
                    value={avgTurnDays}
                    onChange={(e) => setAvgTurnDays(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-black text-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Target Days</label>
                <input
                  type="number"
                  value={targetTurnDays}
                  onChange={(e) => setTargetTurnDays(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-black text-black"
                />
              </div>
            </div>

            <hr className="border-slate-200 my-2" />

            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Direct Labor / Unit</label>
              <input
                type="number"
                value={laborCost}
                onChange={(e) => setLaborCost(Number(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-black text-black"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Materials / Unit</label>
              <input
                type="number"
                value={materialsCost}
                onChange={(e) => setMaterialsCost(Number(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-black text-black"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Leasing & Admin / Unit</label>
              <input
                type="number"
                value={leasingCost}
                onChange={(e) => setLeasingCost(Number(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-black text-black"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="xl:col-span-8 space-y-8">
        {/* Main Scorecards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingDown className="w-24 h-24" />
            </div>
            <p className="text-white font-black uppercase tracking-widest text-[10px] mb-2 opacity-80">All-In True Turn Cost (Per Unit)</p>
            <h4 className="text-5xl font-black tracking-tight mb-4">
              ${calculations.allInTurnCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h4>
            <div className="flex items-center gap-2 text-white text-xs font-black">
              Includes ${calculations.vacancyLoss.toLocaleString()} in realized vacancy loss
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <p className="text-black font-black uppercase tracking-widest text-[10px] mb-2">Total Portfolio Bleed (Period)</p>
              <h4 className="text-5xl font-black text-black tracking-tighter">
                ${calculations.totalPortfolioImpact.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h4>
            </div>
            <div className="mt-6 flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100">
              <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                <ArrowRight className="w-4 h-4" />
              </div>
              <p className="text-black text-sm font-black">
                ${calculations.totalPotentialSavings.toLocaleString()} lost to excess turn time
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Analysis Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-black flex items-center gap-2 uppercase tracking-widest">
                <PieChartIcon className="w-4 h-4 text-black" /> Cost Attribution
              </h3>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={calculations.breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {calculations.breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', color: '#000', fontWeight: '900' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 mt-4">
              {calculations.breakdown.map((item) => (
                <div key={item.name} className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-black text-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-black">${item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-black mb-8 flex items-center gap-2 uppercase tracking-widest">
              <BarChart3 className="w-4 h-4 text-black" /> Impact Analysis
            </h3>

            <div className="space-y-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-[10px] font-black text-black uppercase tracking-widest mb-2">Vacancy Loss (Per Unit)</p>
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-black text-black">${calculations.vacancyLoss.toLocaleString()}</p>
                  <span className="text-[10px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-lg">{((calculations.vacancyLoss / calculations.allInTurnCost) * 100).toFixed(1)}% of total</span>
                </div>
              </div>

              <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-black uppercase tracking-widest mb-2">Excess Vacancy Over Target</p>
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-black text-black">${calculations.excessVacancyCost.toLocaleString()}</p>
                  <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-lg">Bleed per turn</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-black font-black text-[10px] uppercase tracking-widest mb-4">
                  <Info className="w-4 h-4 text-indigo-600" /> Strategic Advice
                </div>
                <p className="text-black text-sm leading-relaxed italic font-black">
                  Reducing turn time from <span className="text-indigo-700 underline font-black">{avgTurnDays}</span> to <span className="text-indigo-700 underline font-black">{targetTurnDays}</span> days would increase portfolio revenue by <span className="text-indigo-700 font-black text-lg">${calculations.totalPotentialSavings.toLocaleString()}</span> for this period without raising a single rent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurnCostCalculator;
