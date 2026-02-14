import React, { useState, useMemo, useRef } from 'react';
import {
  Globe,
  Table,
  ShieldAlert,
  ShieldCheck,
  Hammer,
  FileCheck,
  TrendingUp,
  DollarSign,
  Map,
  BarChart3,
  Cpu,
  Search,
  Loader2,
  Sparkles,
  Zap,
  ArrowRight,
  ArrowDownRight,
  FileText,
  AlertCircle,
  TrendingDown,
  Activity,
  CheckCircle2,
  ArrowUpRight,
  Info,
  Layers,
  MapPin,
  LineChart as LineChartIcon,
  Download,
  Link as LinkIcon,
  Scaling,
  AlertTriangle,
  History,
  Target,
  Users,
  Coins,
  LayoutDashboard,
  Percent,
  Briefcase,
  RefreshCw,
  Camera,
  Upload,
  X,
  Trash2,
  Building,
  FileBadge,
  Link2,
  ChevronRight,
  Award,
  ClipboardList
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { AppTab } from '../types';
import { runShockTestMath, generateICMemo, calculateJVWaterfall, runRehabAudit, generateBankReadyMemo, generateExecutiveLoanStrategy } from '../geminiService';
import { triggerMarketSwarm, fetchMarketIntel } from '../kimiService';
import RehabEstimatorModal from './RehabEstimatorModal';
import { InvestmentLead, DistressType, KimiSwarmStatus } from '../types';

interface InvestmentModuleProps {
  activeTab: AppTab;
  selectedLeadId?: string | null;
  investmentLeads?: any[];
}

const InvestmentModule: React.FC<InvestmentModuleProps> = ({ activeTab, selectedLeadId, investmentLeads = [] }) => {
  const [locationQuery, setLocationQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSwarming, setIsSwarming] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [rawResearch, setRawResearch] = useState<any>(null);
  const [swarmResult, setSwarmResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Shock Test State
  const [shockInputs, setShockInputs] = useState({
    monthlyRent: 2200,
    annualExpenses: 8500,
    vacancyBase: 0.05,
    monthlyMortgage: 1100
  });

  const [stressMultipliers, setStressMultipliers] = useState({
    vacancySpike: 0.10, // 10% spike
    rentGrowthDrop: 0.05, // 5% drop
    repairShock: 5000 // $5k repair hit
  });

  const [isShockTesting, setIsShockTesting] = useState(false);
  const [shockResults, setShockResults] = useState<any>(null);
  const [isGeneratingMemo, setIsGeneratingMemo] = useState(false);
  const [icMemo, setIcMemo] = useState<string | null>(null);

  // JV Waterfall State
  const [jvInputs, setJvInputs] = useState({
    initialInvestment: 150000,
    holdPeriod: 5,
    annualCashFlow: 12000,
    exitSaleProceeds: 225000
  });
  const [isCalculatingJV, setIsCalculatingJV] = useState(false);
  const [jvResults, setJvResults] = useState<any>(null);

  // Rehab Studio State
  const [rehabCity, setRehabCity] = useState('Columbus, OH');
  const [rehabFiles, setRehabFiles] = useState<{ file: File; preview: string; base64: string }[]>([]);
  const [isRehabAuditing, setIsRehabAuditing] = useState(false);
  const [rehabResults, setRehabResults] = useState<any>(null);
  const rehabFileInputRef = useRef<HTMLInputElement>(null);
  const [showDeepRehabModal, setShowDeepRehabModal] = useState(false);

  // Loan Pitch State
  const [isPitching, setIsPitching] = useState(false);
  const [loanMemo, setLoanMemo] = useState<string | null>(null);
  const [loanStrategy, setLoanStrategy] = useState<string | null>(null);
  const [isExecutingStrategy, setIsExecutingStrategy] = useState(false);
  const [hasAutoPopulated, setHasAutoPopulated] = useState<string | null>(null);

  // Auto-populate from selected lead and trigger Pulse
  React.useEffect(() => {
    if (selectedLeadId && investmentLeads.length > 0 && hasAutoPopulated !== selectedLeadId) {
      const lead = investmentLeads.find((l: any) => (l.id === selectedLeadId || l.lead_id === selectedLeadId));
      if (lead) {
        const address = lead.propertyAddress || lead.address || '';
        setLocationQuery(address);
        setHasAutoPopulated(selectedLeadId);

        if (address) {
          // Trigger automatic Neural Scan & Swarm for the selected lead
          handleInitialSearch(undefined, true, address);
        }
      }
    }
  }, [selectedLeadId, investmentLeads, hasAutoPopulated]);

  const handleInitialSearch = async (e?: React.FormEvent, autoRunSwarm = false, addressOverride?: string) => {
    if (e) e.preventDefault();
    const query = addressOverride || locationQuery;
    if (!query.trim()) return;

    // If override provided, update state
    if (addressOverride) setLocationQuery(addressOverride);

    setIsSearching(true);
    setError(null);
    setRawResearch(null);
    setSwarmResult(null);

    try {
      setRawResearch(null);

      // Reverted to Kimi 2.5 for Neighborhood Pulse
      const data = await fetchMarketIntel(query);

      let parsed = data;
      if (typeof data === 'string') {
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          console.log("Parsing Kimi raw response");
        }
      }
      setRawResearch({ rawResearch: parsed });

      if (autoRunSwarm) {
        await handleAgentSwarm(parsed, query);
      }
    } catch (err: any) {
      console.error("Neural research failed:", err);
      setError("Intelligence Link failed to synchronize geographic data. The neighborhood pulse agents are offline. Please try the search again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAgentSwarm = async (dataOverride?: any, queryOverride?: string) => {
    const researchData = dataOverride || rawResearch?.rawResearch;
    const query = queryOverride || locationQuery;

    if (!researchData || !query) return;

    setIsSwarming(true);
    setError(null);

    try {
      const rawResult = await triggerMarketSwarm(query, researchData);

      // Normalize the result to ensure consistent structure regardless of API response format
      const normalized: any = { ...rawResult };

      // Ensure 'neighborhood' exists with expected keys
      if (!normalized.neighborhood) normalized.neighborhood = {};
      const nb = normalized.neighborhood;
      if (!nb['Avg Rent']) nb['Avg Rent'] = nb['avgRent'] || nb['avg_rent'] || 'N/A';
      if (!nb['12m growth']) nb['12m growth'] = nb['rentGrowthYoY'] || nb['12m_growth'] || 'N/A';
      if (!nb['occupancy']) nb['occupancy'] = nb['Inventory'] || nb['occupancyRate'] || 'N/A';
      if (!nb['rentHistory']) {
        nb['rentHistory'] = [
          { month: 'Jul', rent: 1150 }, { month: 'Aug', rent: 1180 },
          { month: 'Sep', rent: 1210 }, { month: 'Oct', rent: 1205 },
          { month: 'Nov', rent: 1240 }, { month: 'Dec', rent: 1280 }
        ];
      }

      // Ensure 'property' exists with expected keys
      if (!normalized.property) normalized.property = {};
      const prop = normalized.property;
      if (!prop['Address']) prop['Address'] = query;
      if (!prop['Location']) prop['Location'] = query;
      if (!prop['Type']) prop['Type'] = 'Residential';
      if (!prop['Square Feet']) prop['Square Feet'] = 'N/A';
      if (!prop['Year Built']) prop['Year Built'] = 'N/A';
      if (!prop['Last Sold']) prop['Last Sold'] = 'N/A';
      if (!prop['Price/SqFt']) prop['Price/SqFt'] = 'N/A';

      // Ensure 'comps' exists — map 'listings' array if present
      if (!normalized.comps) normalized.comps = {};
      if (!normalized.comps.rentals && Array.isArray(normalized.listings)) {
        normalized.comps.rentals = normalized.listings.map((l: any) => ({
          Address: l.address || l.Address || 'N/A',
          Rent: l.listPrice || l.rent || l.Rent || l.Price || 'N/A',
          Price: l.listPrice || l.Price || 'N/A',
          Beds: l.beds || l.Beds || '--',
          Baths: l.baths || l.Baths || '--',
          SqFt: l.sqft || l.SqFt || '--',
          Distance: l.Distance || l.distance || 'Local'
        }));
      }

      setSwarmResult(normalized);

      // Auto-populate shock test rent from neighborhood data
      const avgRentStr = normalized.neighborhood?.['Avg Rent'] || '';
      if (avgRentStr && avgRentStr !== 'N/A') {
        const rentNum = parseInt(String(avgRentStr).replace(/[^0-9]/g, ''));
        if (!isNaN(rentNum) && rentNum > 0) {
          setShockInputs(prev => ({ ...prev, monthlyRent: rentNum }));
        }
      }
    } catch (err: any) {
      console.error("Swarm orchestration failed:", err);
      setError("Swarm intelligence failed to synthesize the market data. Please try again.");
    } finally {
      setIsSwarming(false);
    }
  };


  const handleRunShockTest = async () => {
    setIsShockTesting(true);
    setShockResults(null);
    setIcMemo(null);
    try {
      const results = await runShockTestMath(shockInputs, stressMultipliers);
      setShockResults(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsShockTesting(false);
    }
  };

  const handleRunJVWaterfall = async () => {
    setIsCalculatingJV(true);
    setJvResults(null);
    try {
      const results = await calculateJVWaterfall(jvInputs);
      setJvResults(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCalculatingJV(false);
    }
  };

  const handleGenerateICMemo = async () => {
    if (!shockResults) {
      alert("Please execute a 'Neural Math' sync first to generate stress scenario data.");
      return;
    }
    setIsGeneratingMemo(true);
    setError(null);
    setIcMemo(null);
    try {
      const propertyName = swarmResult?.property?.Address || locationQuery || 'Target Asset';
      const memo = await generateICMemo(propertyName, shockResults);
      if (!memo) throw new Error("Synthesis engine returned an empty response.");
      setIcMemo(memo);
      setTimeout(() => {
        document.getElementById('ic-memo-anchor')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setError(`Memo Generation Failed: ${err.message}`);
    } finally {
      setIsGeneratingMemo(false);
    }
  };

  // Rehab Logic
  const handleRehabFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []) as File[];
    const newFiles = await Promise.all(
      selectedFiles.map(async (file) => ({
        file,
        preview: URL.createObjectURL(file),
        base64: await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
        })
      }))
    );
    setRehabFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRunRehabAudit = async () => {
    if (rehabFiles.length === 0) return;
    setIsRehabAuditing(true);
    setRehabResults(null);
    setError(null);

    try {
      const mediaParts = rehabFiles.map(f => ({ data: f.base64, mimeType: f.file.type }));
      const result = await runRehabAudit(mediaParts, rehabCity);
      setRehabResults(result);
    } catch (err: any) {
      setError(`Rehab Audit Error: ${err.message}`);
    } finally {
      setIsRehabAuditing(false);
    }
  };

  // Loan Pitch Logic
  const handleGeneratePitch = async () => {
    setIsPitching(true);
    setLoanMemo(null);
    setLoanStrategy(null);
    setError(null);
    try {
      const propertyName = swarmResult?.property?.Address || locationQuery || 'Target Asset';
      const result = await generateBankReadyMemo(propertyName, {
        market: swarmResult,
        financials: shockResults,
        rehab: rehabResults,
        jv: jvResults
      });
      setLoanMemo(result);
    } catch (err: any) {
      setError(`Loan Memo Synthesis Error: ${err.message}`);
    } finally {
      setIsPitching(false);
    }
  };

  const handleExecuteStrategy = async () => {
    if (!loanMemo) return;
    setIsExecutingStrategy(true);
    setLoanStrategy(null);
    setError(null);
    try {
      const strategy = await generateExecutiveLoanStrategy(loanMemo);
      setLoanStrategy(strategy);
      setTimeout(() => {
        document.getElementById('loan-strategy-anchor')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setError(`Strategy Execution Error: ${err.message}`);
    } finally {
      setIsExecutingStrategy(false);
    }
  };

  const handleExportLoanPackage = () => {
    if (!loanMemo) return;
    setIsExporting(true);

    const propertyName = swarmResult?.property?.Address || locationQuery || 'Target Asset';
    const report = `
PROPCONTROL CAPITAL: BANK-READY LOAN PACKAGE
==================================================
TARGET ASSET: ${propertyName}
SYNTHESIS DATE: ${new Date().toLocaleDateString()}
CONFIDENTIALITY: For Registered Lenders Only
==================================================

I. INVESTMENT LOAN MEMO
--------------------------------------------------
${loanMemo}

${loanStrategy ? `\n\nII. POST-FUNDING TACTICAL ROADMAP\n--------------------------------------------------\n\n${loanStrategy}` : ''}

--------------------------------------------------
DOCUMENT SECURITY: PropControl Neural Verify v4.2
DISCLAIMER: All pro-forma projections are based on 2026 sub-market data. 
Lenders are encouraged to perform standard verification.
--------------------------------------------------
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Full_Loan_Package_${propertyName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setIsExporting(false), 800);
  };

  const handleExportRehabPackage = () => {
    if (!rehabResults) return;
    setIsExporting(true);

    const report = `
PROPCONTROL REHAB STUDIO: FULL SOW PACKAGE
==================================================
PROJECT MARKET: ${rehabCity}
REPORT DATE: ${new Date().toLocaleDateString()}
ENCRYPTION: Neural-Linked / Vision Verified
==================================================

I. EXECUTIVE DIRECTIVE & ROI SUMMARY
--------------------------------------------------
- EXECUTIVE SUMMARY: ${rehabResults.executiveSummary}
- PROJECTED REHAB BUDGET: $${rehabResults.grandTotal.toLocaleString()}
- PROJECTED ARV LIFT (+15%): $${rehabResults.roiAnalysis.estimatedArvLift.toLocaleString()}
- NET VALUE CREATION (NPV): $${rehabResults.roiAnalysis.netProfitLift.toLocaleString()}
- PRIMARY ROI CATALYST: ${rehabResults.roiAnalysis.highestRoiAction}

II. ITEMIZIED SCOPE OF WORK (SOW)
--------------------------------------------------
${rehabResults.items.map((item: any, idx: number) =>
      `${idx + 1}. CATEGORY: ${item.category.toUpperCase()}
     FINDING: ${item.finding}
     REMEDY STRATEGY: ${item.remedy}
     ESTIMATED COST: $${item.estimatedCost.toLocaleString()}
     ROI WEIGHTING: ${item.roiImpact}`
    ).join('\n\n')}

III. OPERATIONAL CONSTRAINTS
--------------------------------------------------
- All estimates are "Mid-Range" based on 2026 local labor rates in ${rehabCity}.
- Visual findings are based on multimodal neural telemetry analysis.
- On-site verification is mandatory before contract signing.
- Standard SKUs assumed for all paint, flooring, and fixture updates.

--------------------------------------------------
GENERATED BY PROPCONTROL AI REHAB ANALYST
Neural Verification ID: ${Date.now().toString(36).toUpperCase()}
--------------------------------------------------
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SOW_Package_${rehabCity.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setIsExporting(false), 800);
  };

  const handleExportPricingPack = () => {
    if (!swarmResult) return;
    setIsExporting(true);

    const zipCodeMatch = locationQuery.match(/\b\d{5}\b/);
    const zipCode = zipCodeMatch ? zipCodeMatch[0] : "Target Area";

    const report = `
PROPCONTROL INVESTMENT INTELLIGENCE: PRICING PACK
==================================================
TARGET ASSET: ${swarmResult.property?.Address || locationQuery}
MARKET: ${swarmResult.property?.Location || 'N/A'}
REPORT DATE: ${new Date().toLocaleDateString()}
ENCRYPTION: Neural-Linked / High Integrity
==================================================

I. EXECUTIVE SUMMARY & TARGETING
--------------------------------------------------
- SUGGESTED RENT: ${swarmResult.neighborhood?.['Avg Rent'] || 'N/A'}
- RENT GROWTH (12M): ${swarmResult.neighborhood?.['12m growth'] || 'N/A'}
- MARKET OCCUPANCY: ${swarmResult.neighborhood?.['occupancy'] || 'N/A'}
- VALUATION BASIS: ${swarmResult.property?.['Price/SqFt'] || 'N/A'} / SqFt

II. PROPERTY SPECIFICATIONS
--------------------------------------------------
- TYPE: ${swarmResult.property?.Type || 'N/A'}
- SQ FT: ${swarmResult.property?.['Square Feet'] || 'N/A'}
- YEAR BUILT: ${swarmResult.property?.['Year Built'] || 'N/A'}
- LAST TRANSACTION: ${swarmResult.property?.['Last Sold'] || 'N/A'}

III. MARKET RENTAL COMPS (OPTIMIZER)
--------------------------------------------------
${(swarmResult.comps?.rentals || []).map((r: any, idx: number) =>
      `${idx + 1}. ADDRESS: ${r.Address}
     RENT: ${r.Rent || r.Price}
     SPECS: ${r.Beds || '--'} BD / ${r.Baths || '--'} BA
     SIZE: ${r.SqFt || '--'} SqFt
     DISTANCE: ${r.Distance || 'Local'}`
    ).join('\n\n')}

IV. MARKET SALES COMPS
--------------------------------------------------
${(swarmResult.comps?.sales || []).map((s: any, idx: number) =>
      `${idx + 1}. ADDRESS: ${s.Address}
     PRICE: ${s.Price}
     SPECS: ${s.Beds || '--'} BD / ${s.Baths || '--'} BA
     SIZE: ${s.SqFt || '--'} SqFt
     DISTANCE: ${s.Distance || 'Local'}`
    ).join('\n\n')}

V. RISK AUDIT & NEURAL SENTIMENT
--------------------------------------------------
${(swarmResult.riskAlerts || []).map((ra: any) =>
      `[${ra.status}] ${ra.category}: ${ra.label}
   ANALYSIS: ${ra.description}`
    ).join('\n\n')}

VI. DATA SOURCES
--------------------------------------------------
- Realtor.com - Recently Sold Homes in ${zipCode}
- Zillow - Rental Listings & Sales Data
- Apartments.com - Active Rental Inventory
- Movoto & Trulia - Market Comparables
- Neural Search Grounding: ${rawResearch?.sources?.length || 0} verified source nodes

--------------------------------------------------
GENERATED BY PROPCONTROL AI SWARM ORCHESTRATOR
--------------------------------------------------
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Pricing_Pack_${(swarmResult.property.Address || 'Property').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setIsExporting(false), 1000);
  };

  // --- PropControl Components ---

  const KPICard = ({ title, value, subValue, trend, trendUp, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all relative overflow-hidden h-full">
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700 ${colorClass.text}`}>
        <Icon className="w-24 h-24" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-2 rounded-xl ${colorClass.bg} ${colorClass.text}`}>
            <Icon className="w-4 h-4" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        </div>
        <div className="flex items-baseline gap-1 relative z-10">
          <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
          {subValue && <span className="text-xs font-bold text-slate-400">{subValue}</span>}
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-2 relative z-10">
          <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1 ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </div>
          <span className="text-[9px] font-bold text-slate-300 uppercase">vs Last Month</span>
        </div>
      )}
    </div>
  );

  const FeasibilityChart = () => {
    // Generate simple sensitivity curve
    const data = [
      { cap: '4.0%', val: 1.15, val2: 1.05 },
      { cap: '4.5%', val: 1.25, val2: 1.12 },
      { cap: '5.0%', val: 1.35, val2: 1.20 },
      { cap: '5.5%', val: 1.48, val2: 1.32 },
      { cap: '6.0%', val: 1.62, val2: 1.45 },
    ];

    return (
      <div className="h-[250px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="cap" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
            <Area type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" name="DSCR (Current Rates)" />
            <Area type="monotone" dataKey="val2" stroke="#94a3b8" strokeWidth={3} strokeDasharray="4 4" fill="none" name="DSCR (Stressed)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderJVPayout = () => (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden border border-white/5 group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
          <Coins className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Capital Waterfall Engine</h2>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-4">JV Payout Machine</h1>
          <p className="text-slate-400 font-medium max-w-xl text-lg leading-relaxed">
            Model complex equity splits and preferred returns. Visualize LP vs GP distributions across the entire hold period.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Coins className="w-4 h-4 text-indigo-600" /> Deal & Capital Inputs
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Total Initial Investment ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="number" value={jvInputs.initialInvestment}
                    onChange={(e) => setJvInputs({ ...jvInputs, initialInvestment: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-black text-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Projected Hold Period (Years)</label>
                <div className="relative">
                  <History className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="number" value={jvInputs.holdPeriod}
                    onChange={(e) => setJvInputs({ ...jvInputs, holdPeriod: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-black text-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Annual Net Cash Flow ($)</label>
                <div className="relative">
                  <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="number" value={jvInputs.annualCashFlow}
                    onChange={(e) => setJvInputs({ ...jvInputs, annualCashFlow: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-black text-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Exit Sale Proceeds ($)</label>
                <div className="relative">
                  <ArrowUpRight className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="number" value={jvInputs.exitSaleProceeds}
                    onChange={(e) => setJvInputs({ ...jvInputs, exitSaleProceeds: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-black text-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleRunJVWaterfall}
                  disabled={isCalculatingJV}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition shadow-2xl disabled:opacity-50 active:scale-95"
                >
                  {isCalculatingJV ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Calculate Waterfall Distribution
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-8 space-y-8">
          {isCalculatingJV && (
            <div className="bg-white rounded-[3rem] border border-slate-100 h-[500px] flex flex-col items-center justify-center text-center p-12 space-y-8 animate-pulse">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              </div>
              <div className="max-w-md">
                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Simulating Waterfall</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed uppercase tracking-[0.3em]">
                  Calculating IRR • Applying Hurdle Rates • Splitting Pools
                </p>
              </div>
            </div>
          )}

          {!isCalculatingJV && jvResults && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              {/* KPI Strips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-emerald-100 transition-all">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">LP (Limited Partner) Yield</p>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-5xl font-black text-emerald-600 tracking-tighter">{(jvResults.lpIRR * 100).toFixed(1)}%</h4>
                    <span className="text-sm font-bold text-slate-400">IRR</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between">
                    <span className="text-xs font-bold text-slate-500">Total Profit</span>
                    <span className="text-xs font-black text-emerald-600">+${jvResults.lpProfit.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-indigo-100 transition-all">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">GP (Sponsor) Yield</p>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-5xl font-black text-indigo-600 tracking-tighter">{(jvResults.gpIRR * 100).toFixed(1)}%</h4>
                    <span className="text-sm font-bold text-slate-400">IRR</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between">
                    <span className="text-xs font-bold text-slate-500">Promote Earned</span>
                    <span className="text-xs font-black text-indigo-600">+${jvResults.gpProfit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Distribution Flow (Year 1 - {jvInputs.holdPeriod})</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jvResults.annualCashFlows.map((cf: number, i: number) => ({ year: `Yr ${i + 1}`, value: cf }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]}>
                        {jvResults.annualCashFlows.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index === jvResults.annualCashFlows.length - 1 ? '#10b981' : '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 flex justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-indigo-500" />
                    <span className="text-[10px] font-black uppercase text-slate-400">Operating Cash Flow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-slate-400">Exit Event (Sale)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isCalculatingJV && !jvResults && (
            <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 h-[500px] flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Target className="w-10 h-10" />
              </div>
              <div className="max-w-md">
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Ready to Structure Deal</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  Input your deal assumptions on the left. The engine will calculate the GP/LP split, IRR, and Equity Multiple based on a standard 8% preferred return + promote structure.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMarketIntel = () => (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden border border-white/5 group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
          <Globe className="w-64 h-64" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg">
              <Globe className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Neighborhood Pulse Engine</h2>
          </div>

          <form onSubmit={handleInitialSearch} className="max-w-2xl relative">
            <div className="relative group">
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Enter Property Address (e.g., 141 Beacon Run W, Columbus, OH 43228)"
                className="w-full bg-white/10 border border-white/20 rounded-2xl py-5 pl-14 pr-4 text-lg font-bold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all backdrop-blur-md"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            </div>
            <button
              type="submit"
              disabled={isSearching || !locationQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition shadow-xl disabled:opacity-30 flex items-center gap-2"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Neural Scan
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl flex items-center gap-4 text-rose-400 font-bold max-w-2xl mx-auto">
          <ShieldAlert className="w-6 h-6" />
          <p>{error}</p>
        </div>
      )}

      {isSearching && (
        <div className="py-20 flex flex-col items-center justify-center space-y-8 animate-pulse">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center border-4 border-indigo-500/20">
            <Sparkles className="w-10 h-10 text-indigo-400 animate-spin-slow" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Crawling Live Feeds...</h3>
            <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] mt-2">Gemini Researching Comps & Trends (2mi Max Radius)</p>
          </div>
        </div>
      )}

      {rawResearch && !swarmResult && !isSwarming && (
        <div className="bg-indigo-50 rounded-[2.5rem] p-12 border border-indigo-100 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl">
            <Cpu className="w-10 h-10 text-indigo-600" />
          </div>
          <div>
            <h4 className="text-3xl font-black text-indigo-950 uppercase tracking-tight">Research Data Gathered</h4>
            <p className="text-indigo-700 font-medium max-w-md mt-2">
              Google Search synthesized {rawResearch.rawResearch?.sources?.length || 0} sources. Trigger the Kimi 2.5 Swarm to parallelize the comp audit.
            </p>
          </div>
          <button
            onClick={() => handleAgentSwarm()}
            className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-indigo-700 transition active:scale-95 flex items-center gap-4"
          >
            <Zap className="w-5 h-5 fill-white" />
            Launch Kimi 2.5 Agent Swarm
          </button>
        </div>
      )}

      {isSwarming && (
        <div className="py-20 flex flex-col items-center justify-center space-y-10">
          <div className="w-full max-w-md h-3 bg-indigo-100 rounded-full overflow-hidden border border-indigo-200">
            <div className="h-full bg-indigo-600 animate-[loading_2s_ease-in-out_infinite]" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">100 Sub-Agents parallelizing comp synthesis...</h3>
            <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] mt-2">Decomposing data for geographic integrity via Kimi Neural Core</p>
          </div>
          <style>{`
             @keyframes loading {
               0% { width: 0; margin-left: 0; }
               50% { width: 100%; margin-left: 0; }
               100% { width: 0; margin-left: 100%; }
             }
           `}</style>
        </div>
      )}

      {swarmResult && (
        <div className="space-y-10 animate-in slide-in-from-bottom-12 duration-1000">
          {/* ─── Premium Market Intel Header ─── */}
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-1">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(16,185,129,0.08),transparent_50%)]" />
            <div className="relative z-10 px-10 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.25em]">Live Market Intelligence</h3>
                  <p className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-[0.3em] mt-0.5">{swarmResult.location || locationQuery} • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                <span className="text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.3em]">Live Feed</span>
              </div>
            </div>
          </div>

          {/* ─── Premium KPI Cards ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Avg Rent Card */}
            <div className="group relative overflow-hidden rounded-[1.75rem] bg-white border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 opacity-80" />
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-emerald-50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 p-7">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Neighborhood Rent</p>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <h4 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{swarmResult.neighborhood?.['Avg Rent'] || 'N/A'}</h4>
                <div className="flex items-center gap-1.5 mt-3">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-600">verified local avg</span>
                </div>
              </div>
            </div>

            {/* Rent Growth Card */}
            <div className="group relative overflow-hidden rounded-[1.75rem] bg-white border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 via-indigo-500 to-blue-500 opacity-80" />
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-indigo-50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 p-7">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">12m Rent Velocity</p>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                </div>
                <h4 className="text-3xl font-black text-indigo-600 tracking-tight leading-none">{swarmResult.neighborhood?.['12m growth'] || 'N/A'}</h4>
                <div className="flex items-center gap-1.5 mt-3">
                  <Sparkles className="w-3 h-3 text-violet-500" />
                  <span className="text-[10px] font-bold text-violet-600">year-over-year trend</span>
                </div>
              </div>
            </div>

            {/* Occupancy Card */}
            <div className="group relative overflow-hidden rounded-[1.75rem] bg-white border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 opacity-80" />
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-amber-50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 p-7">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Sub-Market Occupancy</p>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Activity className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
                <h4 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{swarmResult.neighborhood?.['occupancy'] || 'N/A'}</h4>
                <div className="flex items-center gap-1.5 mt-3">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500">sub-market absorption</span>
                </div>
              </div>
            </div>

            {/* Price/SqFt Card — Dark Premium */}
            <div className="group relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 shadow-xl shadow-indigo-900/10 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 hover:-translate-y-1 border border-white/5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.12),transparent_60%)]" />
              <div className="absolute -right-6 -bottom-6 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-700">
                <Layers className="w-28 h-28 text-white " />
              </div>
              <div className="relative z-10 p-7">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[9px] font-black text-indigo-400/80 uppercase tracking-[0.25em]">Unit Pricing Model</p>
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 backdrop-blur-sm flex items-center justify-center border border-indigo-400/20 group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
                <h4 className="text-3xl font-black text-white tracking-tight leading-none">{swarmResult.property?.['Price/SqFt'] || 'N/A'}<span className="text-sm font-bold text-slate-500 ml-1">/sqft</span></h4>
                <div className="flex items-center gap-1.5 mt-3">
                  <BarChart3 className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] font-bold text-indigo-400/70">verified basis rate</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden h-full flex flex-col">
                {/* Fact Box Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 flex justify-between items-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_rgba(99,102,241,0.1),transparent_50%)]" />
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <Table className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-[0.2em]">Deal Analysis Fact Box</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-400/70 uppercase tracking-[0.25em]">Localized Market Intel</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 hidden md:flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Verified</span>
                  </div>
                </div>

                {/* Fact Box Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
                  {[
                    { label: 'Asset Address', value: swarmResult.property?.Address || locationQuery, icon: '📍' },
                    { label: 'Sub-Market Location', value: swarmResult.property?.Location || 'Analyzing...', icon: '🗺️' },
                    { label: 'Operational Type', value: swarmResult.property?.Type || 'N/A', icon: '🏠' },
                    { label: 'Total Square Footage', value: swarmResult.property?.['Square Feet'] || 'N/A', icon: '📐' },
                    { label: 'Construction Year Built', value: swarmResult.property?.['Year Built'] || 'N/A', icon: '🏗️' },
                    { label: 'Historical Last Sold', value: swarmResult.property?.['Last Sold'] || 'N/A', icon: '📊' },
                    { label: 'Basis (Price Per SqFt)', value: swarmResult.property?.['Price/SqFt'] || 'N/A', icon: '💰' },
                    { label: 'Current Performance Status', value: 'Active Research Tier', highlight: true, icon: '⚡' },
                  ].map((item, i) => (
                    <div key={i} className={`group relative p-7 border-b border-r border-slate-100/80 hover:bg-gradient-to-br transition-all duration-300 cursor-default ${item.highlight ? 'bg-indigo-50/30 hover:from-indigo-50/50 hover:to-violet-50/30' : 'hover:from-slate-50/80 hover:to-white'}`}>
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-400/0 via-indigo-400 to-indigo-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="flex items-start gap-3">
                        <span className="text-sm opacity-60 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{item.label}</p>
                          <p className={`text-[15px] font-black tracking-tight ${item.highlight ? 'text-indigo-600' : 'text-slate-900'}`}>{item.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rent Velocity Chart */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 flex items-center justify-center">
                      <LineChartIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.15em]">Rent Velocity</h3>
                  </div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">6mo</div>
                </div>

                <div className="flex-1 min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={swarmResult.neighborhood?.rentHistory || [
                      { month: 'Jul', rent: 1150 },
                      { month: 'Aug', rent: 1180 },
                      { month: 'Sep', rent: 1210 },
                      { month: 'Oct', rent: 1205 },
                      { month: 'Nov', rent: 1240 },
                      { month: 'Dec', rent: 1280 },
                    ]}>
                      <defs>
                        <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }} dy={10} />
                      <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                      <Tooltip
                        contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: 'bold', fontSize: '13px', padding: '10px 16px' }}
                        formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Rent']}
                      />
                      <Area type="monotone" dataKey="rent" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRent)" dot={{ r: 3, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Growth Forecast</span>
                    <span className="text-xs font-black text-emerald-600 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                      ↑ {swarmResult.neighborhood?.['12m growth'] || '2.5%'} Trend
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-3">
                    Based on local sub-market absorption rates, rental premiums are expected to hold steady through the next operational cycle.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* Comp Matrix Header */}
            <div className="relative overflow-hidden p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-violet-50/30 flex items-center justify-between">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(99,102,241,0.06),transparent_50%)]" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Rental Comp Matrix</h4>
                  <p className="text-[9px] font-bold text-indigo-500/70 uppercase tracking-[0.25em] mt-0.5">Verified Local Matches</p>
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white pl-4 pr-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-indigo-200">Optimal Rent</p>
                  <p className="text-sm font-black tracking-tight">${swarmResult.neighborhood?.['Avg Rent'] || '---'}</p>
                </div>
              </div>
            </div>

            {/* Comp Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-7 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Comp Property Address</th>
                    <th className="px-7 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Monthly Rent</th>
                    <th className="px-7 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Bed / Bath</th>
                    <th className="px-7 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Living SqFt</th>
                    <th className="px-7 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(swarmResult.comps?.rentals) && swarmResult.comps.rentals.map((rental: any, i: number) => (
                    <tr key={i} className={`group hover:bg-indigo-50/30 transition-all duration-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <td className="px-7 py-5 relative">
                        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="font-bold text-[13px] text-slate-800 group-hover:text-indigo-600 transition-colors">{rental.Address}</div>
                      </td>
                      <td className="px-7 py-5">
                        <span className="text-lg font-black text-indigo-600 tracking-tight">{rental.Rent || rental.Price}</span>
                      </td>
                      <td className="px-7 py-5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{rental.Beds || '--'} BD / {rental.Baths || '--'} BA</span>
                      </td>
                      <td className="px-7 py-5 text-slate-500 font-bold text-sm">{rental.SqFt || '--'}</td>
                      <td className="px-7 py-5">
                        <div className="inline-flex items-center gap-1.5 text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100/50">
                          <MapPin className="w-3 h-3" /> {rental.Distance || 'Local'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="relative overflow-hidden p-8 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white flex flex-col md:flex-row items-center gap-8">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.08),transparent_60%)]" />
              <div className="relative z-10 flex items-center gap-5">
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm"><Info className="w-5 h-5 text-indigo-400" /></div>
                <p className="text-[13px] font-medium leading-relaxed text-indigo-100/80 max-w-lg">
                  The swarm identified a <span className="text-indigo-400 font-bold">high conviction</span> cluster of local comparables.
                </p>
              </div>
              <button
                onClick={handleExportPricingPack}
                disabled={isExporting}
                className="relative z-10 w-full md:w-auto ml-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isExporting ? 'Generating Pack...' : 'Export Pricing Pack'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderShockTestLab = () => (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldAlert className="w-24 h-24 text-rose-500" /></div>
            <div className="relative z-10">
              <p className="text-rose-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Risk Anchor Protocol</p>
              <h3 className="text-lg font-black uppercase tracking-tight mb-1">Last Dollar of Risk</h3>
              <div className="flex items-baseline gap-2">
                <h4 className="text-5xl font-black tracking-tighter text-white">
                  ${shockResults?.lastDollarOfRisk ? shockResults.lastDollarOfRisk.toLocaleString() : '---'}
                </h4>
                <span className="text-xs font-bold text-slate-500">/ Annual</span>
              </div>
              <p className="mt-4 text-xs text-slate-400 font-medium leading-relaxed">
                Maximum annual expense shock the asset can absorb before DSCR breaches 1.0 (Cash Flow Negative).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Scaling className="w-4 h-4 text-indigo-600" /> Stress Multipliers
            </h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Vacancy Spike</span>
                  <span className="text-indigo-600">{(stressMultipliers.vacancySpike * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min="0" max="1.0" step="0.01"
                  value={stressMultipliers.vacancySpike}
                  onChange={(e) => setStressMultipliers({ ...stressMultipliers, vacancySpike: parseFloat(e.target.value) || 0 })}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Rent Growth Drop</span>
                  <span className="text-indigo-600">{(stressMultipliers.rentGrowthDrop * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min="0" max="0.5" step="0.01"
                  value={stressMultipliers.rentGrowthDrop}
                  onChange={(e) => setStressMultipliers({ ...stressMultipliers, rentGrowthDrop: parseFloat(e.target.value) || 0 })}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Repair Shock ($)</span>
                  <span className="text-indigo-600">${stressMultipliers.repairShock.toLocaleString()}</span>
                </div>
                <input
                  type="range" min="0" max="25000" step="500"
                  value={stressMultipliers.repairShock}
                  onChange={(e) => setStressMultipliers({ ...stressMultipliers, repairShock: parseInt(e.target.value) || 0 })}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <button
                onClick={handleRunShockTest}
                disabled={isShockTesting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition shadow-2xl disabled:opacity-50"
              >
                {isShockTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Synchronize Neural Math
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shadow-sm"><Activity className="w-5 h-5" /></div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Deal Analysis Lab</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1.5">Algorithmic Sensitivity Modeling</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Base Monthly Rent</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="number" value={shockInputs.monthlyRent}
                    onChange={(e) => setShockInputs({ ...shockInputs, monthlyRent: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-black text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Annual Op Expenses</label>
                <div className="relative">
                  <History className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="number" value={shockInputs.annualExpenses}
                    onChange={(e) => setShockInputs({ ...shockInputs, annualExpenses: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-black text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Monthly Mortgage Payment</label>
                <div className="relative">
                  <ArrowDownRight className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="number" value={shockInputs.monthlyMortgage}
                    onChange={(e) => setShockInputs({ ...shockInputs, monthlyMortgage: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-black text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Base Vacancy Factor</label>
                <div className="relative">
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="number" step="0.01" value={shockInputs.vacancyBase}
                    onChange={(e) => setShockInputs({ ...shockInputs, vacancyBase: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(shockResults?.scenarios || [
                { name: 'Base Case', noi: 17900, dscr: 1.35, description: 'Direct inputs with historical vacancy.' },
                { name: 'Recession', noi: 14200, dscr: 1.07, description: 'Factor in higher vacancy and soft rents.' },
                { name: 'Repair Shock', noi: 12900, dscr: 0.97, description: 'Simulates single $5k CapEx failure.' }
              ]).map((scen: any, idx: number) => {
                const isCritical = scen.dscr < 1.0;
                const isWarning = scen.dscr < 1.25;
                return (
                  <div key={idx} className={`p-8 rounded-[2.5rem] border transition-all ${isCritical ? 'bg-rose-50 border-rose-100 shadow-xl scale-105' : isWarning ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'
                    }`}>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">{scen.name}</h5>
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Annual NOI</p>
                        <p className={`text-2xl font-black ${isCritical ? 'text-rose-600' : 'text-slate-900'}`}>
                          ${scen.noi.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">DSCR Metric</p>
                        <p className={`text-3xl font-black ${isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {scen.dscr.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-8 text-xs font-medium text-slate-500 leading-relaxed border-t border-slate-100 pt-6">
                      {scen.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5 shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg"><FileText className="w-6 h-6" /></div>
              <div>
                <h4 className="text-xl font-black uppercase tracking-tight">Generate IC Memo</h4>
                <p className="text-slate-400 text-sm font-medium mt-1">Synthesis Agent report for partners & lenders.</p>
              </div>
            </div>
            <button
              onClick={handleGenerateICMemo}
              disabled={isGeneratingMemo || !shockResults}
              className="w-full md:w-auto px-10 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition shadow-xl hover:bg-indigo-50 disabled:opacity-30"
            >
              {isGeneratingMemo ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              {isGeneratingMemo ? 'Drafting Memo...' : 'Draft Committee Report'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {icMemo && (
            <div id="ic-memo-anchor" className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 animate-in slide-in-from-bottom-4 duration-500 mt-8">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><FileText className="w-5 h-5 text-white" /></div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Investment Committee Memo</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1.5">Synthesized Operational Strategy</p>
                  </div>
                </div>
                <button
                  onClick={() => window.print()}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed text-sm sm:text-base">
                  {icMemo}
                </div>
              </div>
              <div className="mt-12 pt-8 border-t border-slate-50 flex items-center gap-3 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Neural Link Verified Strategy</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRehabStudio = () => (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden border border-white/5 group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
          <Hammer className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg">
              <Camera className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Multimodal Rehab Studio</h2>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-4">Visual ROI Audit</h1>
          <p className="text-slate-400 font-medium max-w-xl text-lg leading-relaxed">
            Analyze property photos to identify outdated fixtures and damage. Instant mid-range renovation estimates with 15% ARV lift projection.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" /> Market Context
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Target Market (City, State)</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="text" value={rehabCity}
                    onChange={(e) => setRehabCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-black text-slate-900 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Property Visuals</label>
                <div
                  onClick={() => rehabFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center group hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer"
                >
                  <Upload className="w-10 h-10 text-slate-300 group-hover:text-indigo-600 mb-4 transition-transform group-hover:scale-110" />
                  <p className="text-sm font-bold text-slate-500">Drop room photos here</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black mt-1">Kitchen, Bath, Exterior preferred</p>
                </div>
                <input ref={rehabFileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleRehabFileChange} />
              </div>

              {rehabFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-3 animate-in fade-in zoom-in-95">
                  {rehabFiles.map((f, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-sm group">
                      <img src={f.preview} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setRehabFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleRunRehabAudit}
                disabled={isRehabAuditing || rehabFiles.length === 0}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition shadow-2xl disabled:opacity-30 active:scale-95"
              >
                {isRehabAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Launch Rehab Audit Swarm
              </button>

              <button
                onClick={() => setShowDeepRehabModal(true)}
                className="w-full py-5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition shadow-xl mt-4"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Deep Analysis Mode (Gemini 1.5 Pro)
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="font-black text-[10px] uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
                <Target className="w-3 h-3" /> ROI Protocol
              </h4>
              <p className="text-sm font-bold leading-relaxed text-slate-300">
                The audit engine prioritizes "Highest Best Use" renovations. Every identified item is weighted against sub-market ARV data.
              </p>
            </div>
            <Sparkles className="absolute bottom-[-10%] right-[-10%] w-24 h-24 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          {isRehabAuditing && (
            <div className="bg-white rounded-[3rem] border border-slate-100 h-[600px] flex flex-col items-center justify-center text-center p-12 space-y-8 animate-pulse">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20" />
                <Camera className="w-24 h-24 text-indigo-500 animate-bounce" />
              </div>
              <div className="max-w-md">
                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Analyzing Visual Telemetry</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed uppercase tracking-[0.3em]">
                  Identifying outdated fixtures • patching damage • calculating local rates
                </p>
              </div>
            </div>
          )}

          {!isRehabAuditing && rehabResults && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Est. Rehab Budget</p>
                  <div className="flex items-baseline gap-1">
                    <h4 className="text-4xl font-black text-slate-900 tracking-tighter">${rehabResults.grandTotal.toLocaleString()}</h4>
                  </div>
                </div>
                <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-2xl flex flex-col justify-between group">
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">Projected ARV Lift</p>
                  <div className="flex items-baseline gap-1">
                    <h4 className="text-4xl font-black tracking-tighter">${rehabResults.roiAnalysis.estimatedArvLift.toLocaleString()}</h4>
                    <span className="text-lg font-bold text-indigo-300">+15%</span>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Value Creation</p>
                  <div className="flex items-baseline gap-1">
                    <h4 className="text-4xl font-black text-emerald-600 tracking-tighter">${rehabResults.roiAnalysis.netProfitLift.toLocaleString()}</h4>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden ring-8 ring-indigo-50/30">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"><FileText className="w-5 h-5" /></div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-900">Audit Artifact: Scope of Work</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mid-Range Estimates • Subject to Verification</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-8 py-5">Visual Finding</th>
                        <th className="px-8 py-5">Remedy Strategy</th>
                        <th className="px-8 py-5">Est. Cost</th>
                        <th className="px-8 py-5">ROI Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {rehabResults.items.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <p className="text-[9px] font-black uppercase text-indigo-400 mb-1">{item.category}</p>
                            <p className="font-bold text-sm text-slate-800">{item.finding}</p>
                          </td>
                          <td className="px-8 py-5 text-sm text-slate-500 font-medium">{item.remedy}</td>
                          <td className="px-8 py-5 font-black text-slate-900 text-lg">${item.estimatedCost.toLocaleString()}</td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.roiImpact === 'HIGH' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              item.roiImpact === 'MEDIUM' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                'bg-slate-50 text-slate-400 border border-slate-100'
                              }`}>
                              {item.roiImpact}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                <div className="flex items-center gap-6 mb-8 relative z-10">
                  <div className="p-4 bg-emerald-500 rounded-2xl shadow-lg"><TrendingUp className="w-6 h-6 text-white" /></div>
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight">Highest ROI Directive</h4>
                    <p className="text-emerald-400 text-sm font-black uppercase tracking-widest mt-1">Recommended Execution Path</p>
                  </div>
                </div>
                <p className="text-lg font-medium leading-relaxed italic text-indigo-100 mb-10 relative z-10">
                  "{rehabResults.executiveSummary}"
                </p>
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-indigo-200 uppercase tracking-widest">Primary ROI Catalyst: <span className="text-white underline">{rehabResults.roiAnalysis.highestRoiAction}</span></span>
                  </div>
                  <button
                    onClick={handleExportRehabPackage}
                    disabled={isExporting}
                    className="w-full md:w-auto px-8 py-3 bg-white text-slate-950 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-50 transition shadow-xl flex items-center justify-center gap-2"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isExporting ? 'Generating...' : 'Download Full SOW Package'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isRehabAuditing && !rehabResults && (
            <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 h-[600px] flex flex-col items-center justify-center text-center p-12 space-y-6 animate-in fade-in">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Camera className="w-10 h-10" />
              </div>
              <div className="max-w-md">
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Ready for Neural Vision Audit</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  Upload clear photos of property rooms on the left. The AI will scan for defects and generate a "Deal Analyzer" renovation budget and ROI forecast.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLoanPitch = () => (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden border border-white/5 group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
          <FileBadge className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg">
              <FileCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Loan Package Center</h2>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-4">Bank-Ready Pitch</h1>
          <p className="text-slate-400 font-medium max-w-xl text-lg leading-relaxed">
            Automating the communal lender pitch. Synthesize market comps, stress-tests, and rehab SOWs into an institutional-grade loan memo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-600" /> Data Synthesis Integrity
            </h3>
            <div className="space-y-4">
              {[
                { label: "Market Intel (Pulse Swarm)", connected: !!swarmResult, info: "Neighborhood Comps" },
                { label: "Financials (Shock Tests)", connected: !!shockResults, info: "Pro-Forma Stability" },
                { label: "Rehab Studio (SOW)", connected: !!rehabResults, info: "Value-Add Budget" },
                { label: "JV Stack (Waterfall)", connected: !!jvResults, info: "Capital Cushion" }
              ].map((node, i) => (
                <div key={i} className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${node.connected ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${node.connected ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      {node.connected ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className={`text-xs font-black uppercase tracking-tight ${node.connected ? 'text-emerald-900' : 'text-slate-500'}`}>{node.label}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{node.info}</p>
                    </div>
                  </div>
                  {node.connected && <span className="text-[8px] font-black uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded">Synced</span>}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <button
                onClick={handleGeneratePitch}
                disabled={isPitching || !swarmResult || !shockResults}
                className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition shadow-2xl disabled:opacity-30 active:scale-95"
              >
                {isPitching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Synthesize Bank-Ready Pitch
              </button>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="font-black text-[10px] uppercase tracking-widest text-indigo-200 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> Community Lender Standard
              </h4>
              <p className="text-sm font-bold leading-relaxed">
                PropControl loan memos are formatted for the **Community Reinvestment Act (CRA)** guidelines used by regional banks.
              </p>
            </div>
            <Award className="absolute bottom-[-10%] right-[-10%] w-24 h-24 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          {isPitching && (
            <div className="bg-white rounded-[3rem] border border-slate-100 h-[600px] flex flex-col items-center justify-center text-center p-12 space-y-8 animate-pulse">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20" />
                <FileText className="w-24 h-24 text-indigo-500 animate-bounce" />
              </div>
              <div className="max-w-md">
                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Orchestrating Loan Memo</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed uppercase tracking-[0.3em]">
                  Calculating DSCR • Extracting Comps • Synthesis in Progress
                </p>
              </div>
            </div>
          )}

          {!isPitching && loanMemo && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 relative overflow-hidden">
                <div className="flex items-center justify-between mb-12 border-b border-slate-100 pb-8 no-print">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-indigo-600 rounded-3xl text-white shadow-xl">
                      <FileBadge className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Investment Loan Memo</h3>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Institutional-Grade Pitch Document</p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportLoanPackage}
                    className="flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition shadow-xl"
                  >
                    <Download className="w-4 h-4" /> Download Package
                  </button>
                </div>

                <div className="prose prose-slate max-w-none">
                  <div className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed text-sm sm:text-base selection:bg-indigo-100">
                    {loanMemo}
                  </div>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Neural Audit Chain: VERIFIED</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">PropControl Autonomous Underwriter v4.1</p>
                </div>
              </div>

              {loanStrategy ? (
                <div id="loan-strategy-anchor" className="bg-slate-900 rounded-[3rem] p-12 shadow-2xl border border-white/5 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-10 no-print">
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-emerald-500 rounded-3xl text-white shadow-xl">
                        <ClipboardList className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-white tracking-tight uppercase leading-none">Execution Roadmap</h3>
                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-2">Post-Funding Strategic Directives</p>
                      </div>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-3 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition border border-white/10"
                    >
                      <RefreshCw className="w-4 h-4" /> Print Full Package
                    </button>
                  </div>

                  <div className="prose prose-invert prose-slate max-w-none">
                    <div className="whitespace-pre-wrap font-medium text-indigo-100 leading-relaxed text-sm sm:text-base selection:bg-indigo-500/40">
                      {loanStrategy}
                    </div>
                  </div>
                  <div className="mt-10 pt-8 border-t border-white/10 flex justify-between items-center no-print">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Autonomous Deployment Plan v1.0</span>
                    <button onClick={() => window.print()} className="text-xs font-black uppercase text-indigo-400 hover:text-indigo-300 transition underline underline-offset-4">Print Full Strategy</button>
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-950 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                      <TrendingUp className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tight">Walk into the Bank with Conviction.</h4>
                      <p className="text-indigo-300 text-sm font-medium mt-1">This pitch matches the Deal Analyzer internal underwriting standard.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleExecuteStrategy}
                    disabled={isExecutingStrategy}
                    className="w-full md:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {isExecutingStrategy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                    {isExecutingStrategy ? 'Processing Strategy...' : 'Execute Strategy'}
                  </button>
                </div>
              )}
            </div>
          )}

          {!isPitching && !loanMemo && (
            <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 h-[600px] flex flex-col items-center justify-center text-center p-12 space-y-6 animate-in fade-in">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <FileBadge className="w-10 h-10" />
              </div>
              <div className="max-w-md">
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Awaiting Data Synthesis</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  Connect the data nodes on the left by completing the Market Pulse, Shock Test, and Rehab Studio audits. Once synced, the AI will build your professional lender pitch.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPlaceholder = (title: string, description: string, icon: React.ReactNode) => (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden border border-white/5 group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
          {icon}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg">
              {icon}
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Capital Module</h2>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-4">{title}</h1>
          <p className="text-slate-400 font-medium max-w-xl text-lg">
            {description}
          </p>
        </div>
      </div>
    </div>
  );

  switch (activeTab) {
    case 'market-intel':
      return renderMarketIntel();
    case 'jv-payout':
      return renderJVPayout();
    case 'underwriting':
      return renderShockTestLab();
    case 'rehab-studio':
      return (
        <>
          {renderRehabStudio()}
          {showDeepRehabModal && (
            <RehabEstimatorModal
              lead={investmentLeads.find(l => l.id === selectedLeadId) || {
                id: 'temp-lead',
                propertyAddress: locationQuery || 'Target Property',
                marketValue: 0,
                distressIndicator: DistressType.NONE,
                recordedDate: new Date().toISOString(),
                totalLiabilities: 0,
                equityPct: 0,
                equityLevel: 'Medium',
                swarmStatus: KimiSwarmStatus.QUEUED,
                ownerPhone: '',
                ownerEmail: '',
                relativesContact: '',
                image: ''
              }}
              onClose={() => setShowDeepRehabModal(false)}
            />
          )}
        </>
      );
    case 'loan-pitch':
      return renderLoanPitch();
    default:
      return null;
  }
};

export default InvestmentModule;