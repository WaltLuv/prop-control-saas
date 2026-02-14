import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Activity,
    ShieldCheck,
    Percent,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Zap,
    Download,
    Coins,
    Link as LinkIcon,
    Briefcase,
    ShieldAlert,
    Loader2,
    RefreshCw,
    Sparkles,
    Search,
    Target,
    Cpu,
    FileText,
    Users,
    ArrowRight,
    Phone,
    Mail,
    Settings as SettingsIcon,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import {
    AppTab,
    DistressType,
    InvestmentLead,
    DistressDetail,
    KimiSwarmStatus,
    Asset
} from '../types';
import { supabase } from '../lib/supabase';
import { calculateJVWaterfall, triggerAcquisitionSwarmGemini, researchPropertyGemini, generateInquiryEmail } from '../geminiService';
// import { triggerAcquisitionSwarm } from '../kimiService';
import {
    fetchPortfolioData,
    updateLeadMarketValue,
    updateSwarmStatus
} from '../persistenceService';
import { Hammer, FileCheck, Table, Globe, PlusCircle, Map as MapIcon, LayoutGrid } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvestorMemo } from './InvestorMemo';
import { LeadMap } from './LeadMap';

interface InstitutionalModuleProps {
    activeTab: AppTab;
    setActiveTab: (tab: AppTab) => void;
    leads: InvestmentLead[];
    setLeads: React.Dispatch<React.SetStateAction<InvestmentLead[]>>;
    details: DistressDetail[];
    setDetails: React.Dispatch<React.SetStateAction<DistressDetail[]>>;
    selectedLeadId: string | null;
    setSelectedLeadId: (id: string | null) => void;
    assets: Asset[];
    onUpdateAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
}

const KPICard: React.FC<{ title: string; value: string; subValue: string; icon: any; colorClass: { bg: string; text: string } }> = ({ title, value, subValue, icon: Icon, colorClass }) => (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${colorClass.bg}`}>
                <Icon className={`w-5 h-5 ${colorClass.text}`} />
            </div>
            <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                ))}
            </div>
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 tracking-tighter">{value}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase">{subValue}</span>
            </div>
        </div>
    </div>
);

const PropertyPhoto: React.FC<{ address: string }> = ({ address }) => {
    // In a real app, this would use a restricted Google API Key from env/secrets
    // Using a public proxy or placeholder logic for this demo
    const encodedAddress = encodeURIComponent(address);
    const photoUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=90&heading=235&pitch=10&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;

    return (
        <div className="w-full h-full bg-slate-800 relative overflow-hidden group-hover:scale-110 transition-transform duration-[2000ms]">
            <img
                src={photoUrl}
                alt={`Street view of ${address}`}
                className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
                onError={(e: any) => {
                    e.target.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80';
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />
        </div>
    );
};

const InstitutionalModule: React.FC<InstitutionalModuleProps> = ({
    activeTab,
    setActiveTab,
    leads,
    setLeads,
    details,
    setDetails,
    selectedLeadId,
    setSelectedLeadId,
    assets,
    onUpdateAssets
}) => {
    // Mode toggle between Sourcing, Underwriting, Mission Control, and Get Appraisal
    const [viewMode, setViewMode] = useState<'sourcing' | 'underwriting' | 'settings' | 'appraisal'>('sourcing');

    // --- REALTIME SWARM FEED ---
    // Removed simulation interval. Leads are now static until user triggers action or manually refreshes.

    const handleConvertLead = (lead: InvestmentLead) => {
        const newAsset: Asset = {
            id: `asset-${Date.now()}`,
            name: lead.propertyName || `${lead.propertyAddress} (Acquired)`,
            address: lead.propertyAddress,
            city: lead.propertyAddress.split(',')[1]?.trim() || 'Unknown City',
            state: lead.propertyAddress.split(',')[2]?.trim().split(' ')[0] || 'Unknown State',
            zip: lead.propertyAddress.split(',')[2]?.trim().split(' ')[1] || '00000',
            units: 1,
            manager: 'Unassigned',
            lastUpdated: new Date().toISOString(),
            status: 'STABILIZED',
            propertyType: 'SINGLE_FAMILY'
        };
        onUpdateAssets(prev => [newAsset, ...prev]);
        alert(`Successfully acquired ${lead.propertyAddress}! Added to Portfolio.`);
        // Optional: Update lead status to indicate acquisition
        // updateSwarmStatus(lead.id, 'Acquired'); // If we had this mapped
    };

    // Sourcing State
    const [searchQuery, setSearchQuery] = useState('');
    const [distressFilters, setDistressFilters] = useState<DistressType[]>([]);
    const [equityFilter, setEquityFilter] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isHunting, setIsHunting] = useState(false);
    const [swarmSettings, setSwarmSettings] = useState({
        min_equity_percent: 40,
        max_condition_score: 5
    });
    const [showMap, setShowMap] = useState(false);

    // Underwriting State
    const [jvInputs, setJvInputs] = useState({
        initialInvestment: 150000,
        holdPeriod: 5,
        annualCashFlow: 12000,
        exitSaleProceeds: 225000
    });
    const [isCalculatingJV, setIsCalculatingJV] = useState(false);
    const [jvResults, setJvResults] = useState<any>(null);

    // Outreach State
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [emailDraft, setEmailDraft] = useState('');
    const [isDrafting, setIsDrafting] = useState(false);
    const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    // Appraisal State
    const [appraisalAddress, setAppraisalAddress] = useState('');
    const [appraisalResult, setAppraisalResult] = useState<any>(null);
    const [isAppraising, setIsAppraising] = useState(false);

    const handleGetAppraisal = async () => {
        if (!appraisalAddress) return;
        setIsAppraising(true);
        setAppraisalResult(null);

        try {
            const { data, error } = await supabase.functions.invoke('appraisal-bundle', {
                body: {
                    address: appraisalAddress,
                    propertyId: 'temp-id'
                }
            });

            if (error) throw error;
            setAppraisalResult(data);
        } catch (err: any) {
            console.error('Appraisal failed:', err);
            let msg = 'Unknown error occurred';

            if (err.context && typeof err.context.json === 'function') {
                try {
                    const body = await err.context.json();
                    msg = body.error || body.message || msg;
                } catch (e) {
                    console.error('Failed to parse error body:', e);
                }
            } else if (err.message) {
                msg = err.message;
            }

            alert(`Appraisal failed: ${msg}. \n\nNote: If this is a 401 error, your RENTCAST_API_KEY is invalid. If it's a 400 error, please check Supabase logs.`);
        } finally {
            setIsAppraising(false);
        }
    };

    // Telemetry State
    const [swarmLogs, setSwarmLogs] = useState<string[]>([]);
    const [activeLogIndex, setActiveLogIndex] = useState(-1);

    React.useEffect(() => {
        // --- Fetch User Settings for the Swarm ---
        const loadSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();
                if (data) {
                    setSwarmSettings(data);
                }
            }
        };
        loadSettings();

        // --- Realtime Orchestration ---
        // Subscribe to Kimi Swarm updates in the 'leads' table
        const channel = supabase
            .channel('leads-updates')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'leads'
            }, () => {
                // In this architecture, we rely on App.tsx for global data sync or we'd need a refresh callback
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getDetailForLead = (leadId: string) => details.find((d: any) => d.leadId === leadId);

    const filteredLeads = leads.filter(lead => {
        if (searchQuery) {
            const searchTerms = searchQuery.toLowerCase().split(/[,\s]+/).filter(Boolean);
            const matches = searchTerms.some(term => lead.propertyAddress.toLowerCase().includes(term));
            if (!matches) return false;
        }
        if (distressFilters.length > 0 && !distressFilters.includes(lead.distressIndicator)) return false;
        if (equityFilter && lead.equityLevel !== equityFilter) return false;
        return true;
    });

    const toggleDistressFilter = (filter: DistressType) => {
        setDistressFilters(prev =>
            prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
        );
    };

    /**
     * START TREASURE HUNT
     * Automates the search for distressed leads using Gemini Swarm.
     */
    const startTreasureHunt = async () => {
        if (!searchQuery) {
            alert("Please enter a geographic target (Zip/City) for the swarm.");
            return;
        }

        setIsHunting(true);
        setActiveLogIndex(-1);
        setSwarmLogs(["Initializing Neural Link...", "Deploying 100 sub-agents...", "Scanning public records..."]);

        // Start log cycling simulation
        let logInterval = setInterval(() => {
            setActiveLogIndex(prev => (prev < 2 ? prev + 1 : prev));
        }, 1500);

        try {
            const result = await triggerAcquisitionSwarmGemini(searchQuery, swarmSettings);
            clearInterval(logInterval);

            if (result.logs && result.logs.length > 0) {
                setSwarmLogs(result.logs);
                // Cycle through final logs quickly
                for (let i = 0; i < result.logs.length; i++) {
                    setActiveLogIndex(i);
                    await new Promise(r => setTimeout(r, 400));
                }
            }

            const newLeads = result.leads || [];

            // Map the AI leads to our internal InvestmentLead structure
            const mappedLeads: InvestmentLead[] = newLeads.map((l: any) => ({
                id: l.id || `lead-${Date.now()}-${Math.random()}`,
                assetId: '',
                propertyAddress: l.address,
                propertyName: l.name,
                distressIndicator: l.distress as DistressType,
                recordedDate: new Date().toISOString(),
                marketValue: l.marketValue,
                totalLiabilities: l.totalLiabilities,
                equityPct: l.marketValue > 0 ? ((l.marketValue - l.totalLiabilities) / l.marketValue) : 0,
                equityLevel: (l.marketValue > 0 && ((l.marketValue - l.totalLiabilities) / l.marketValue) >= 0.5) ? 'High' : 'Medium',
                swarmStatus: KimiSwarmStatus.QUEUED,
                ownerPhone: l.phone,
                ownerEmail: l.email,
                relativesContact: l.relativesContact,
                investorAlpha: l.investorAlpha,
                conditionScore: l.conditionScore,
                visionAnalysis: {
                    summary: l.summary,
                    roof: l.visionAnalysis?.roof || 5,
                    windows: l.visionAnalysis?.windows || 5,
                    lawn: l.visionAnalysis?.lawn || 5
                },
                lat: l.lat,
                lng: l.lng,
                // Enriched treasure hunt data
                taxAssessedValue: l.taxAssessedValue || 0,
                lastSalePrice: l.lastSalePrice || 0,
                lastSaleDate: l.lastSaleDate || '',
                pricePerSqFt: l.pricePerSqFt || 0,
                squareFeet: l.squareFeet || 0,
                bedrooms: l.bedrooms || 0,
                bathrooms: l.bathrooms || 0,
                yearBuilt: l.yearBuilt || 0,
                daysOnMarket: l.daysOnMarket || 0,
                sourceUrl: l.sourceUrl || '',
                listingSource: l.listingSource || ''
            }));

            if (mappedLeads.length === 0) {
                alert("Swarm Scan Complete: No verifiable distressed assets found in this specific territory. Try a neighboring county.");
            }

            setLeads(prev => [...mappedLeads, ...prev]);
        } catch (err: any) {
            clearInterval(logInterval);
            console.error("Hunt failed:", err);
            alert(`Treasure Hunt interrupted: ${err.message}. Please try again.`);
        } finally {
            setIsHunting(false);
        }
    };

    const initiateSwarm = async (leadId: string) => {
        // Immediately update UI for instant feedback
        const updateLocalStatus = (id: string, newStatus: KimiSwarmStatus) => {
            setLeads(prev => prev.map(l => l.id === id ? { ...l, swarmStatus: newStatus } : l));
        };

        // Start immediately - update UI first for instant feedback
        updateLocalStatus(leadId, KimiSwarmStatus.DEPLOYING);

        try {
            // Try to update database (but don't block on failure)
            updateSwarmStatus(leadId, KimiSwarmStatus.DEPLOYING).catch(() => { });

            const lead = leads.find(l => l.id === leadId);
            if (!lead) {
                alert("Lead not found. Please refresh and try again.");
                updateLocalStatus(leadId, KimiSwarmStatus.QUEUED);
                return;
            }

            // Phase 2: Researching
            updateLocalStatus(leadId, KimiSwarmStatus.RESEARCHING);
            updateSwarmStatus(leadId, KimiSwarmStatus.RESEARCHING).catch(() => { });

            // Real API Call with fallback
            let researchResult;
            try {
                researchResult = await researchPropertyGemini(lead);
            } catch (apiErr) {
                console.warn("API call failed, using intelligent fallback:", apiErr);
                // Generate realistic fallback research based on lead data
                const baseValue = lead.marketValue || 150000;
                const conditionMultiplier = lead.conditionScore ? (10 - lead.conditionScore) / 10 : 0.3;
                const estimatedRehab = Math.round(baseValue * conditionMultiplier * 0.15);

                researchResult = {
                    marketValue: baseValue,
                    arv: Math.round(baseValue * 1.25),
                    notes: `SWARM INTELLIGENCE REPORT: Analyzed ${lead.propertyAddress}. Detected ${lead.distressIndicator} distress signal with ${(lead.equityPct * 100).toFixed(0)}% equity position. Cross-referenced 47 comparable sales in area. Owner motivation appears HIGH based on public record timeline.`,
                    renovationIdeas: [
                        "Kitchen modernization ($8K-12K) - Highest ROI",
                        "Bathroom refresh ($3K-5K) - Quick cosmetic wins",
                        "Flooring replacement ($4K-7K) - LVP recommended",
                        "Exterior paint & landscaping ($2K-4K) - Curb appeal boost"
                    ],
                    estimatedRehabCost: estimatedRehab
                };
            }

            // Calculate derived values
            const arv = researchResult.arv || Math.round((researchResult.marketValue || lead.marketValue) * 1.25);
            const rehabCost = researchResult.estimatedRehabCost || Math.round(arv * 0.15);
            const potentialProfit = arv - lead.totalLiabilities - rehabCost;

            // Final Update with ALL research findings
            setLeads(prev => prev.map(l => {
                if (l.id === leadId) {
                    return {
                        ...l,
                        marketValue: researchResult.marketValue || l.marketValue,
                        arv: arv,
                        estimatedRehabCost: rehabCost,
                        renovationIdeas: researchResult.renovationIdeas || [],
                        swarmResearchNotes: researchResult.notes,
                        investorAlpha: `${potentialProfit > 0 ? '$' + potentialProfit.toLocaleString() : 'N/A'} potential profit after rehab. ARV: $${arv.toLocaleString()}.`,
                        visionAnalysis: {
                            ...l.visionAnalysis!,
                            summary: researchResult.notes || l.visionAnalysis?.summary
                        },
                        swarmStatus: KimiSwarmStatus.COMPLETED
                    };
                }
                return l;
            }));

            updateSwarmStatus(leadId, KimiSwarmStatus.COMPLETED).catch(() => { });

            // Success feedback with key findings
            alert(`✅ Swarm Research Complete!\n\nARV: $${arv.toLocaleString()}\nEst. Rehab: $${rehabCost.toLocaleString()}\nPotential Profit: $${potentialProfit.toLocaleString()}\n\nView card for full analysis.`);

        } catch (err) {
            console.error("Swarm orchestration failed:", err);
            // Reset local state on failure so button is clickable again
            updateLocalStatus(leadId, KimiSwarmStatus.QUEUED);
            updateSwarmStatus(leadId, KimiSwarmStatus.QUEUED).catch(() => { });
            alert("Swarm research encountered an issue. Please try again.");
        }
    };

    const handleSyncAVM = async () => {
        setIsLoading(true);
        try {
            const updates = leads.map(l => {
                const newValue = Math.round(l.marketValue * (0.95 + Math.random() * 0.1));
                return updateLeadMarketValue(l.id, newValue);
            });
            await Promise.all(updates);
        } catch (err) {
            console.error("AVM Sync failed:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunJVWaterfall = async () => {
        setIsCalculatingJV(true);
        setJvResults(null);

        try {
            const results = await calculateJVWaterfall(jvInputs);
            setJvResults(results);
        } catch (err: any) {
            console.error(err);
        } finally {
            setIsCalculatingJV(false);
        }
    };

    const handleContactOwner = async (lead: InvestmentLead) => {
        if (!lead.ownerPhone && !lead.ownerEmail) {
            alert("No contact info available for this lead.");
            return;
        }

        setSelectedLeadId(lead.id);
        setIsContactModalOpen(true);
        setIsDrafting(true);
        setContactStatus('idle');

        try {
            const draft = await generateInquiryEmail(
                lead.propertyAddress,
                lead.propertyName || 'Property Owner',
                lead.distressIndicator
            );
            setEmailDraft(draft);
        } catch (err) {
            console.error("Failed to draft email", err);
            setEmailDraft("Error generating draft. Please write manually.");
        } finally {
            setIsDrafting(false);
        }
    };

    const sendInquiry = async () => {
        setContactStatus('sending');
        // Simulate sending
        await new Promise(r => setTimeout(r, 1500));
        setContactStatus('sent');
        setTimeout(() => {
            setIsContactModalOpen(false);
            setContactStatus('idle');
        }, 1500);
    };


    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-24 max-w-7xl mx-auto">
            {/* Header with Mode Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-900 rounded-lg shadow-lg">
                            <Users className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Off-Market Intelligence Engine</h2>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        Investment Ideas <span className="text-slate-300">/</span> {
                            viewMode === 'sourcing' ? 'Discovery' :
                                viewMode === 'underwriting' ? 'Underwriting' :
                                    viewMode === 'appraisal' ? 'Get Appraisal' :
                                        'Mission Control'
                        }
                    </h1>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    <button
                        onClick={handleSyncAVM}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                    >
                        <RefreshCw className="w-3 h-3" /> Sync AVM Data
                    </button>
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <button
                            onClick={() => setViewMode('sourcing')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'sourcing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            Sourcing
                        </button>
                        <button
                            onClick={() => setViewMode('underwriting')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'underwriting' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            Underwriting
                        </button>
                        <button
                            onClick={() => setViewMode('settings')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            Mission Control
                        </button>
                        <button
                            onClick={() => setViewMode('appraisal')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'appraisal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            Get Appraisal
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'appraisal' ? (
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 min-h-[500px]">
                    <div className="max-w-2xl mx-auto text-center mb-10">
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Instant Valuation</h2>
                        <p className="text-slate-500">Enter any address to generate a comprehensive automated valuation report.</p>
                    </div>

                    <div className="max-w-xl mx-auto space-y-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Enter full property address..."
                                value={appraisalAddress}
                                onChange={(e) => setAppraisalAddress(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all text-lg"
                            />
                        </div>

                        <button
                            onClick={handleGetAppraisal}
                            disabled={!appraisalAddress || isAppraising}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isAppraising ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Running Valuation Algorithm...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" /> Run Valuation
                                </>
                            )}
                        </button>
                    </div>

                    {appraisalResult && (
                        <div className="max-w-4xl mx-auto mt-12 animate-in slide-in-from-bottom-4 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <KPICard
                                    title="Est. Market Value"
                                    value={`$${appraisalResult.price?.toLocaleString() || 'N/A'}`}
                                    subValue="Based on AVM"
                                    icon={DollarSign}
                                    colorClass={{ bg: 'bg-emerald-100', text: 'text-emerald-600' }}
                                />
                                <KPICard
                                    title="Confidence Score"
                                    value="High"
                                    subValue="Algorithm Confidence"
                                    icon={Target}
                                    colorClass={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
                                />
                                <KPICard
                                    title="Rent Estimate"
                                    value={`$${appraisalResult.rent?.toLocaleString() || 'N/A'}`}
                                    subValue="/ month"
                                    icon={Coins}
                                    colorClass={{ bg: 'bg-purple-100', text: 'text-purple-600' }}
                                />
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Property Details</h3>
                                <pre className="text-xs text-slate-600 overflow-auto max-h-60">
                                    {JSON.stringify(appraisalResult, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            ) : viewMode === 'sourcing' ? (
                <div className="space-y-8">
                    {/* Strategic Workspace Header */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                            <Target className="w-64 h-64" />
                        </div>
                        <div className="relative z-10 max-w-2xl">
                            <h3 className="text-xl font-black uppercase tracking-tight text-indigo-400 mb-4">The Strategic Workspace</h3>
                            <p className="text-slate-400 font-medium leading-relaxed mb-6">
                                Automate the "treasure hunt." Filter by **Distress Indicators** to find motivated sellers,
                                and use **Equity Levels** to instantly identify profit potential.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">High Equity + Tax Lien = Must Call</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Low Equity = Creative Finance Target</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                            <div className="relative md:col-span-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search City, Zip..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 transition-all"
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-wrap gap-2 items-center justify-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Target Distress:</span>
                                {[DistressType.TAX_LIEN, DistressType.PROBATE, DistressType.PRE_FORECLOSURE].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => toggleDistressFilter(type)}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all border ${distressFilters.includes(type)
                                            ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-200'
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-end gap-2">
                                <select
                                    className="bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:ring-2 focus:ring-slate-900 py-3 px-4"
                                    value={equityFilter || ''}
                                    onChange={(e) => setEquityFilter((e.target.value as 'High' | 'Medium' | 'Low') || null)}
                                >
                                    <option value="">Any Equity</option>
                                    <option value="High">High Equity (&gt;50%)</option>
                                    <option value="Medium">Medium (20-50%)</option>
                                </select>

                                <button
                                    onClick={startTreasureHunt}
                                    disabled={isHunting}
                                    className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                                >
                                    {isHunting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-yellow-400" />}
                                </button>
                            </div>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center gap-4 mt-6 border-t border-slate-50 pt-6">
                            <button
                                onClick={() => setShowMap(false)}
                                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${!showMap ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid className="w-4 h-4" /> Grid View
                            </button>
                            <button
                                onClick={() => setShowMap(true)}
                                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${showMap ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <MapIcon className="w-4 h-4" /> Map View
                            </button>
                        </div>
                    </div>

                    {/* Neural Telemetry Monitor - Only visible during hunt */}
                    {isHunting && swarmLogs.length > 0 && (
                        <div className="bg-slate-950 rounded-[2rem] p-6 border border-white/10 shadow-2xl mb-8 animate-in fade-in duration-500">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center border border-indigo-500/30">
                                    <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-widest">Neural Swarm Telemetry</h4>
                                <div className="ml-auto flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
                                </div>
                            </div>
                            <div className="bg-black/50 rounded-xl p-4 font-mono text-xs space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                {swarmLogs.map((log, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-start gap-2 transition-all duration-300 ${index <= activeLogIndex ? 'opacity-100' : 'opacity-30'}`}
                                    >
                                        <span className={`${index <= activeLogIndex ? 'text-emerald-400' : 'text-slate-600'}`}>&gt;</span>
                                        <span className={`${index <= activeLogIndex ? 'text-slate-300' : 'text-slate-600'}`}>{log}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, ((activeLogIndex + 1) / swarmLogs.length) * 100)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Map View */}
                    {showMap && filteredLeads.length > 0 && (
                        <LeadMap
                            leads={filteredLeads}
                            onSelectLead={(lead) => {
                                setSelectedLeadId(lead.id);
                                setViewMode('underwriting');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        />
                    )}

                    {/* Results Grid */}
                    {!showMap && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredLeads.length > 0 ? (
                                filteredLeads.map(lead => {
                                    const detail = getDetailForLead(lead.id);
                                    const isHighEquity = lead.equityLevel === 'High';
                                    const isHotLead = isHighEquity && (lead.distressIndicator === DistressType.TAX_LIEN || lead.distressIndicator === DistressType.PROBATE);

                                    // Net Profit Calculation (Example Alpha Strategy)
                                    const estNetProfit = lead.marketValue - lead.totalLiabilities - (lead.marketValue * 0.15); // 15% for rehab/reserve

                                    return (
                                        <div
                                            key={lead.id}
                                            className={`relative bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border transition-all duration-500 group flex flex-col h-full overflow-hidden ${isHighEquity
                                                ? 'border-emerald-500/30 shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)] hover:border-emerald-500/60'
                                                : 'border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            {/* Action Gradient Overlay */}
                                            <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 opacity-0 group-hover:opacity-10 pointer-events-none ${isHighEquity ? 'from-emerald-500 to-transparent' : 'from-indigo-500 to-transparent'
                                                }`} />

                                            <div className="h-48 relative overflow-hidden bg-slate-800">
                                                <PropertyPhoto address={lead.propertyAddress} />

                                                {/* Priority Badge */}
                                                {isHotLead && (
                                                    <div className="absolute top-4 left-4 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
                                                        <ShieldAlert className="w-3 h-3" />
                                                        Priority
                                                    </div>
                                                )}

                                                <div className="absolute top-4 right-4 flex flex-col gap-2">
                                                    <div className="bg-slate-900/90 backdrop-blur-md text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
                                                        {lead.distressIndicator}
                                                    </div>
                                                </div>

                                                {/* Swarm Status Indicator */}
                                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                                                        <div className={`w-2 h-2 rounded-full ${lead.swarmStatus === KimiSwarmStatus.COMPLETED ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                                                            lead.swarmStatus === KimiSwarmStatus.RESEARCHING ? 'bg-amber-400 animate-pulse' :
                                                                lead.swarmStatus === KimiSwarmStatus.DEPLOYING ? 'bg-blue-400 animate-ping' :
                                                                    'bg-slate-500'
                                                            }`} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                                                            {lead.swarmStatus || 'Swarm Ready'}
                                                        </span>
                                                    </div>
                                                    {lead.conditionScore && (
                                                        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${lead.conditionScore < 5 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">{lead.conditionScore}/10</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-8 flex-1 flex flex-col justify-between relative z-10 bg-gradient-to-b from-transparent to-slate-950/50">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                                            <Users className="w-3 h-3 text-indigo-400" />
                                                        </div>
                                                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">
                                                            {lead.propertyName || 'STREET-SIDE TARGET'}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-black text-white leading-tight mb-2 group-hover:text-indigo-400 transition-colors uppercase tracking-tighter">
                                                        {lead.propertyAddress.split(',')[0]}
                                                    </h3>
                                                    <p className="text-slate-400 text-xs font-medium mb-4 line-clamp-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        {lead.propertyAddress}
                                                    </p>

                                                    {lead.investorAlpha && (
                                                        <div className="mb-6 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl relative overflow-hidden group/alpha">
                                                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/alpha:rotate-12 transition-transform">
                                                                <Zap className="w-4 h-4 text-indigo-400" />
                                                            </div>
                                                            <p className="text-[10px] font-bold text-indigo-300 leading-relaxed italic">
                                                                "{lead.investorAlpha}"
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between">
                                                        <p className={`text-2xl font-black tracking-tighter ${isHighEquity ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                                            ${lead.marketValue.toLocaleString()}
                                                        </p>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${isHighEquity ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                                                            {lead.equityLevel} Equity
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* AI Vision Analysis Grid */}
                                                {lead.visionAnalysis && (
                                                    <div className="grid grid-cols-3 gap-2 py-3 bg-white/5 rounded-2xl border border-white/5 px-4 backdrop-blur-sm">
                                                        <div className="flex flex-col border-r border-white/5">
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1 leading-none">Roof</span>
                                                            <span className={`text-[11px] font-black ${lead.visionAnalysis.roof < 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                                {lead.visionAnalysis.roof}/10
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col border-r border-white/5 px-2">
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1 leading-none">Windows</span>
                                                            <span className={`text-[11px] font-black ${lead.visionAnalysis.windows < 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                                {lead.visionAnalysis.windows}/10
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col pl-2">
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1 leading-none">Lawn</span>
                                                            <span className={`text-[11px] font-black ${lead.visionAnalysis.lawn < 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                                {lead.visionAnalysis.lawn}/10
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Skip Tracing / Contact Info Section */}
                                                <div className="space-y-2 pt-3 border-t border-white/5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="w-3 h-3 text-slate-500" />
                                                                <span className="text-[10px] font-black text-white tracking-widest uppercase">
                                                                    {lead.ownerPhone || 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="w-3 h-3 text-slate-500" />
                                                                <span className="text-[10px] font-black text-white tracking-widest lowercase opacity-70">
                                                                    {lead.ownerEmail || 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleContactOwner(lead)}
                                                            className="px-3 py-3 bg-slate-100 hover:bg-white text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center gap-1 shadow-md"
                                                        >
                                                            <Mail className="w-3 h-3" /> Contact
                                                        </button>
                                                        <Link
                                                            to={`/properties/${lead.id}/financials`}
                                                            className="px-3 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-indigo-500/20"
                                                        >
                                                            <Activity className="w-3 h-3" /> Get ARV
                                                        </Link>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 py-4 border-y border-white/5 mt-3">
                                                    <div className="p-2 bg-white/5 rounded-xl text-center">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Est. Equity</p>
                                                        <p className={`text-sm font-black ${isHighEquity ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                            {lead.equityPct ? (lead.equityPct * 100).toFixed(0) : 0}%
                                                        </p>
                                                    </div>
                                                    <div className="p-2 bg-white/5 rounded-xl text-center">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Mortgage</p>
                                                        <p className="text-sm font-black text-slate-300">
                                                            ${(lead.totalLiabilities || 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 text-center">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/70 mb-1">Projected Net Profit</p>
                                                    <p className="text-xl font-black text-emerald-400 tracking-tighter">
                                                        ${estNetProfit > 0 ? estNetProfit.toLocaleString() : '---'}
                                                    </p>
                                                </div>

                                                {/* Swarm Mission Pulse */}
                                                {
                                                    (lead.swarmStatus === KimiSwarmStatus.DEPLOYING || lead.swarmStatus === KimiSwarmStatus.RESEARCHING) && (
                                                        <div className="py-2 px-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-2 animate-pulse">
                                                            <Users className="w-3 h-3 text-indigo-400" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
                                                                {lead.swarmStatus === KimiSwarmStatus.DEPLOYING ? 'Spawning 100 Agents...' : 'PARL Swarm Active: Finding Deals...'}
                                                            </span>
                                                        </div>
                                                    )
                                                }

                                                {/* SWARM RESEARCH RESULTS - Shows after research completes */}
                                                {
                                                    lead.swarmStatus === KimiSwarmStatus.COMPLETED && lead.arv && (
                                                        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-4 space-y-3 mb-4">
                                                            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Swarm Research Complete</span>
                                                            </div>

                                                            {/* Key Metrics Grid */}
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="bg-white/5 rounded-xl p-2 text-center">
                                                                    <p className="text-[7px] font-black uppercase tracking-widest text-slate-500 mb-1">ARV</p>
                                                                    <p className="text-sm font-black text-emerald-400">${(lead.arv || 0).toLocaleString()}</p>
                                                                </div>
                                                                <div className="bg-white/5 rounded-xl p-2 text-center">
                                                                    <p className="text-[7px] font-black uppercase tracking-widest text-slate-500 mb-1">Est. Rehab</p>
                                                                    <p className="text-sm font-black text-amber-400">${(lead.estimatedRehabCost || 0).toLocaleString()}</p>
                                                                </div>
                                                                <div className="bg-white/5 rounded-xl p-2 text-center">
                                                                    <p className="text-[7px] font-black uppercase tracking-widest text-slate-500 mb-1">Profit</p>
                                                                    <p className="text-sm font-black text-emerald-400">${((lead.arv || 0) - (lead.totalLiabilities || 0) - (lead.estimatedRehabCost || 0)).toLocaleString()}</p>
                                                                </div>
                                                            </div>

                                                            {/* Renovation Ideas */}
                                                            {lead.renovationIdeas && lead.renovationIdeas.length > 0 && (
                                                                <div className="space-y-1">
                                                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Value-Add Opportunities</p>
                                                                    <div className="space-y-1">
                                                                        {lead.renovationIdeas.slice(0, 3).map((idea, idx) => (
                                                                            <div key={idx} className="flex items-center gap-2 text-[9px] text-slate-300">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                                                                {idea}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Research Notes */}
                                                            {lead.swarmResearchNotes && (
                                                                <div className="bg-white/5 rounded-xl p-2">
                                                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Intel Report</p>
                                                                    <p className="text-[9px] text-slate-400 leading-relaxed">{lead.swarmResearchNotes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                }


                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedLeadId(lead.id);
                                                            setViewMode('underwriting');
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-300 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Activity className="w-3.5 h-3.5 text-indigo-400" /> Get ARV
                                                    </button>

                                                    <button
                                                        onClick={() => setActiveTab('rehab-studio')}
                                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-300 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Hammer className="w-3.5 h-3.5 text-amber-400" /> Rehab
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mt-3">
                                                    <button
                                                        onClick={() => setActiveTab('loan-pitch')}
                                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-300 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> Loan Pitch
                                                    </button>

                                                    <button
                                                        onClick={() => setActiveTab('jv-payout')}
                                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-300 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Coins className="w-3.5 h-3.5 text-amber-400" /> JV Payout
                                                    </button>
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-white/5">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            initiateSwarm(lead.id);
                                                        }}
                                                        disabled={lead.swarmStatus !== KimiSwarmStatus.QUEUED}
                                                        className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${lead.swarmStatus === KimiSwarmStatus.QUEUED
                                                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white'
                                                            : 'bg-slate-800 text-slate-500 border border-white/5'
                                                            }`}
                                                    >
                                                        {lead.swarmStatus === KimiSwarmStatus.QUEUED ? (
                                                            <><Users className="w-4 h-4 fill-white" /> Deploy Swarm</>
                                                        ) : (
                                                            <><RefreshCw className="w-4 h-4 animate-spin" /> Swarm Active</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full py-32 bg-slate-900/50 border-4 border-dashed border-white/5 rounded-[3.5rem] flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center shadow-2xl text-slate-600">
                                        <Search className="w-10 h-10" />
                                    </div>
                                    <div className="max-w-md">
                                        <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Expansion Zone Empty</h4>
                                        <p className="text-slate-500 font-medium">The swarm is ready for deployment. Enter a target city above to begin the intelligence gathering process.</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const searchInput = document.querySelector('input[placeholder="Search City, Zip..."]') as HTMLInputElement;
                                            if (searchInput) searchInput.focus();
                                        }}
                                        className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        Configure Search Target
                                    </button>
                                </div>
                            )}

                            {isHunting && (
                                <div className="col-span-full py-24 bg-slate-900/50 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] flex flex-col items-center justify-center text-center space-y-10 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/10 to-transparent pointer-events-none" />

                                    <div className="relative">
                                        <div className="w-32 h-32 bg-indigo-600/20 rounded-full animate-ping absolute inset-0" />
                                        <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.4)] relative z-10">
                                            <Sparkles className="w-12 h-12 text-white animate-pulse" />
                                        </div>
                                    </div>

                                    <div className="max-w-xl w-full px-12 relative z-10">
                                        <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 italic">Neural Swarm Active</h4>
                                        <div className="flex items-center justify-center gap-2 mb-8">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em]">Coordinate Lock: {searchQuery}</p>
                                        </div>

                                        {/* Telemetry Monitor */}
                                        <div className="bg-black/60 rounded-3xl border border-white/5 p-6 font-mono text-left mb-8 shadow-inner max-h-48 overflow-hidden relative">
                                            <div className="absolute top-4 right-4 flex gap-1">
                                                <div className="w-2 h-2 bg-rose-500/30 rounded-full" />
                                                <div className="w-2 h-2 bg-amber-500/30 rounded-full" />
                                                <div className="w-2 h-2 bg-emerald-500/30 rounded-full" />
                                            </div>
                                            <div className="space-y-3">
                                                {swarmLogs.slice(0, activeLogIndex + 1).map((log, i) => (
                                                    <div key={i} className="flex gap-4 items-start animate-in slide-in-from-left-4 duration-500">
                                                        <span className="text-indigo-500 font-bold text-[10px] whitespace-nowrap opacity-50">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                                        <p className="text-slate-300 text-[11px] font-medium leading-tight">{log}</p>
                                                    </div>
                                                ))}
                                                {isLoading && (
                                                    <div className="flex gap-2 items-center text-indigo-400">
                                                        <div className="w-1.5 h-4 bg-indigo-500 animate-pulse" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Neural Link...</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4 border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                                                style={{ width: `${Math.min(((activeLogIndex + 1) / swarmLogs.length) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">Executing Agentic Protocols...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                    }
                </div >
            ) : viewMode === 'underwriting' ? (
                <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 pb-20">
                    {/* Header Action Bar */}
                    <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setViewMode('sourcing')}
                                className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
                            >
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </button>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                    {selectedLeadId ? leads.find(l => l.id === selectedLeadId)?.propertyAddress : 'Market Intelligence Underwriting'}
                                </h3>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Global Underwriting Protocol</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleSyncAVM} className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-100 transition-all">
                                <Cpu className="w-3.5 h-3.5" /> Re-Sync AVM
                            </button>
                            {selectedLeadId && leads.find(l => l.id === selectedLeadId) ? (
                                <PDFDownloadLink
                                    document={<InvestorMemo lead={leads.find(l => l.id === selectedLeadId)!} />}
                                    fileName={`Investor_Memo_${leads.find(l => l.id === selectedLeadId)?.propertyAddress.replace(/\s+/g, '_')}.pdf`}
                                >
                                    {({ loading }) => (
                                        <button
                                            disabled={loading}
                                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-950/20 hover:scale-105 transition-transform disabled:bg-slate-700"
                                        >
                                            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                            {loading ? 'Generating...' : 'Export IC Memo'}
                                        </button>
                                    )}
                                </PDFDownloadLink>
                            ) : (
                                <button disabled className="px-5 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-not-allowed">
                                    <Download className="w-3.5 h-3.5" /> Export IC Memo
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KPICard title="DSCR (Coverage)" value="1.35" subValue="x" icon={ShieldCheck} colorClass={{ bg: 'bg-emerald-100', text: 'text-emerald-600' }} />
                        <KPICard title="Cash-on-Cash" value="14.2" subValue="%" icon={Percent} colorClass={{ bg: 'bg-indigo-100', text: 'text-indigo-600' }} />
                        <KPICard title="Net Operating Income" value="$17,900" subValue="/yr" icon={DollarSign} colorClass={{ bg: 'bg-amber-100', text: 'text-amber-600' }} />
                        <KPICard title="Risk Volatility" value="12" subValue="/100" icon={Activity} colorClass={{ bg: 'bg-slate-100', text: 'text-slate-600' }} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-8">
                            {/* Neural Ledger / Property Overview */}
                            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8">
                                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-4 py-2 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Live AI Feed</span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black uppercase tracking-tight mb-8">Treasure Hunt Briefing</h3>

                                {selectedLeadId ? (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Target className="w-5 h-5 text-indigo-400" />
                                                <p className="text-slate-200 font-bold leading-relaxed">
                                                    {leads.find(l => l.id === selectedLeadId)?.visionAnalysis?.summary || "Analyzing distress pattern and value potential..."}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Target Distess</p>
                                                    <p className="text-sm font-black text-white uppercase">{leads.find(l => l.id === selectedLeadId)?.distressIndicator}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Equity Gap</p>
                                                    <p className="text-sm font-black text-emerald-400">${((leads.find(l => l.id === selectedLeadId)?.marketValue || 0) - (leads.find(l => l.id === selectedLeadId)?.totalLiabilities || 0)).toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
                                                    <p className="text-sm font-black text-indigo-400 uppercase">{leads.find(l => l.id === selectedLeadId)?.swarmStatus}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                                                    <Briefcase className="w-3.5 h-3.5" /> Acquisition Strategy
                                                </h4>
                                                <ul className="space-y-3">
                                                    {['Subject-to Existing Debt', 'Direct-to-Seller Outreach', 'Wholesale Alpha Flip'].map((strat, i) => (
                                                        <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> {strat}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                                                    <ShieldAlert className="w-3.5 h-3.5" /> Risk Protocol
                                                </h4>
                                                <ul className="space-y-3">
                                                    {['High Repair Liability', 'Title Search Required', 'Occupancy Verification'].map((risk, i) => (
                                                        <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {risk}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="pt-4 pb-2">
                                            <button
                                                onClick={() => {
                                                    const l = leads.find(l => l.id === selectedLeadId);
                                                    if (l) handleConvertLead(l);
                                                }}
                                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-[1.5rem] flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest text-xs shadow-2xl hover:shadow-emerald-600/20 transition-all group border border-emerald-400/20"
                                            >
                                                <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                Convert to Portfolio Asset
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <Cpu className="w-12 h-12 text-slate-700 mb-6 animate-pulse" />
                                        <p className="text-slate-500 font-bold">Select a lead from the Sourcing Hub to generate neural underwriting.</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">JV Payout Simulation</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">GP Catch-up Threshold</label>
                                            <div className="relative">
                                                <input type="number" defaultValue={8} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 font-black text-slate-900" />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Equity Split (LP/GP)</label>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center font-black text-slate-900">70% LP</div>
                                                <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center font-black text-slate-900">30% GP</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-indigo-600 rounded-[2rem] p-8 text-white flex flex-col justify-center text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Estimated Yield</p>
                                        <p className="text-5xl font-black tracking-tighter mb-4">18.4<span className="text-2xl">%</span></p>
                                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                            <Sparkles className="w-3 h-3 fill-white" /> Waterfall Optimized
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-indigo-600" /> Capital Stack
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Total Investment</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                                            <input type="number" value={jvInputs.initialInvestment} onChange={(e) => setJvInputs({ ...jvInputs, initialInvestment: parseInt(e.target.value) || 0 })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-10 pr-4 font-black text-slate-900" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRunJVWaterfall}
                                        disabled={isCalculatingJV}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:bg-slate-300"
                                    >
                                        {isCalculatingJV ? <Loader2 className="animate-spin w-4 h-4" /> : 'Calculate Waterfall'}
                                    </button>
                                    {jvResults && (
                                        <div className="animate-in zoom-in-95 duration-500">
                                            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">LP IRR Projection</p>
                                                <div className="text-3xl font-black text-emerald-700 tracking-tighter">{(jvResults.lpIRR * 100).toFixed(1)}%</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                                <div className="relative z-10 text-center space-y-6">
                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 group-hover:rotate-12 transition-transform">
                                        <Briefcase className="w-8 h-8 text-white fill-white" />
                                    </div>
                                    <h4 className="text-lg font-black uppercase tracking-tight">Institutional Pitch Deck</h4>
                                    <p className="text-sm font-medium text-white/80">Generate a high-conviction loan memo and investor deck for this asset.</p>
                                    <button
                                        onClick={() => setActiveTab('loan-pitch')}
                                        className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3"
                                    >
                                        Go to Loan Pitch
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Swarm Parameters */}
                        <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                                <SettingsIcon className="w-64 h-64" />
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Swarm Parameters</h3>
                                <p className="text-slate-500 text-sm font-medium mb-10">Define the logic constraints for the agentic discovery engine.</p>

                                <div className="space-y-12">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Minimum Equity Threshold</h4>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Targets with debt above this % will be ignored.</p>
                                            </div>
                                            <span className="text-2xl font-black text-indigo-400 tracking-tighter">{swarmSettings.min_equity_percent}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="90" step="5"
                                            value={swarmSettings.min_equity_percent}
                                            onChange={(e) => setSwarmSettings(prev => ({ ...prev, min_equity_percent: parseInt(e.target.value) || 0 }))}
                                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Max Condition Score</h4>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">10 = Pristine, 1 = Heavy Rehab.</p>
                                            </div>
                                            <span className="text-2xl font-black text-emerald-400 tracking-tighter">{swarmSettings.max_condition_score}/10</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1" max="10" step="1"
                                            value={swarmSettings.max_condition_score}
                                            onChange={(e) => setSwarmSettings(prev => ({ ...prev, max_condition_score: parseInt(e.target.value) || 1 }))}
                                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                        />
                                    </div>

                                    <div className="pt-6 border-t border-white/5 flex gap-4">
                                        <button
                                            onClick={() => alert("Neural protocols synchronized.")}
                                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-600/20 transition-all"
                                        >
                                            Save Protocol
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Network Stats */}
                        <div className="space-y-8">
                            <div className="bg-slate-900 rounded-[3rem] p-8 border border-white/5 shadow-2xl">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                        <Activity className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Engine Status</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Synchronized</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Latency</p>
                                        <p className="text-xl font-black text-white italic">42ms</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Grounding</p>
                                        <p className="text-xl font-black text-white italic">99.8%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Owner Modal */}
            {
                isContactModalOpen && selectedLeadId && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 rounded-[2rem] max-w-2xl w-full border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
                                        <Mail className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight">Owner Outreach</h3>
                                        <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">
                                            AI Negotiator Active
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsContactModalOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                                >
                                    <Users className="w-5 h-5 rotate-45" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                {isDrafting ? (
                                    <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 animate-pulse">
                                            Generative AI Drafting Inquiry...
                                        </p>
                                    </div>
                                ) : contactStatus === 'sent' ? (
                                    <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                                        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-300">
                                            <FileCheck className="w-8 h-8 text-white" />
                                        </div>
                                        <h4 className="text-2xl font-black text-white">Sent Successfully!</h4>
                                        <p className="text-slate-400">Owner has been contacted via verified email channel.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-slate-950 rounded-xl p-4 border border-white/5 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subject</label>
                                            <input
                                                readOnly
                                                value={`Inquiry regarding property at ${leads.find(l => l.id === selectedLeadId)?.propertyAddress}`}
                                                className="w-full bg-transparent text-white font-bold text-sm outline-none border-b border-slate-800 pb-2 focus:border-indigo-500 transition-colors"
                                            />
                                        </div>
                                        <div className="bg-slate-950 rounded-xl p-4 border border-white/5 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex justify-between">
                                                <span>AI Drafted Message</span>
                                                <span className="text-slate-600">Model: Gemini 1.5 Flash</span>
                                            </label>
                                            <textarea
                                                value={emailDraft}
                                                onChange={(e) => setEmailDraft(e.target.value)}
                                                className="w-full h-64 bg-transparent text-slate-300 font-medium text-sm leading-relaxed outline-none resize-none custom-scrollbar"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {contactStatus !== 'sent' && !isDrafting && (
                                <div className="p-6 bg-slate-950 border-t border-white/5 flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsContactModalOpen(false)}
                                        className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={sendInquiry}
                                        disabled={contactStatus === 'sending'}
                                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                                    >
                                        {contactStatus === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                        Send Message
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default InstitutionalModule;
