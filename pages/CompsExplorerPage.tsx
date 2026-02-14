import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Asset } from '../types';
import { supabase } from '../lib/supabase';
import { Search, Save, Filter, Loader2, DollarSign, MapPin, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface PropertyContextType {
    property: Asset;
}

interface Comp {
    id: string;
    address: string;
    formattedAddress: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    yearBuilt: number;
    distance?: number;
    listedDate?: string;
    lastSeenDate?: string;
    propertyType?: string;
    listingType?: string;
}

const CompsExplorerPage: React.FC = () => {
    const { property } = useOutletContext<PropertyContextType>();

    // Filters
    const [mode, setMode] = useState<'sale' | 'rent'>('sale');
    const [radius, setRadius] = useState(1);
    const [daysOld, setDaysOld] = useState(180);
    const [bedRange, setBedRange] = useState<[number, number]>([property.beds - 1, property.beds + 1]);

    // Data
    const [comps, setComps] = useState<Comp[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCompIds, setSelectedCompIds] = useState<Set<string>>(new Set());
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Fetch Comps
    const fetchComps = async () => {
        setLoading(true);
        setError(null);
        setComps([]);
        setSelectedCompIds(new Set());
        setSaveStatus('idle');

        try {
            const { data, error } = await supabase.functions.invoke('comps-explorer-search', {
                body: {
                    address: property.address,
                    radius,
                    daysOld,
                    mode,
                    propertyType: 'Single Family', // Could allow filter
                    beds: property.beds // Optional soft filter
                }
            });

            if (error) throw error;

            // Transform results if needed (API structure varies)
            const results = data.results || data; // Handle direct array or payload wrapper
            setComps(results);

            // Auto-select top 3 by default
            const initialSelection = new Set<string>();
            results.slice(0, 3).forEach((c: Comp) => initialSelection.add(c.id));
            setSelectedCompIds(initialSelection);

        } catch (err: any) {
            console.error('Comps Search Error:', err);
            setError(err.message || 'Failed to search comps');
        } finally {
            setLoading(false);
        }
    };

    // Save Comp Set
    const saveCompSet = async () => {
        if (selectedCompIds.size === 0) return;
        setSaveStatus('saving');

        try {
            const { error } = await supabase.functions.invoke('comps-explorer-save-set', {
                body: {
                    propertyId: property.id,
                    name: `Saved ${mode === 'sale' ? 'Sale' : 'Rent'} Comps - ${new Date().toLocaleDateString()}`,
                    filterCriteria: { mode, radius, daysOld },
                    selectedCompIds: Array.from(selectedCompIds)
                }
            });

            if (error) throw error;
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);

        } catch (err) {
            console.error('Save Error:', err);
            setSaveStatus('error');
        }
    };

    const toggleCompSelection = (id: string) => {
        const newSet = new Set(selectedCompIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedCompIds(newSet);
    };

    // Calculate Stats for Selected
    const selectedKPIs = React.useMemo(() => {
        const selected = comps.filter(c => selectedCompIds.has(c.id));
        if (selected.length === 0) return null;

        const avgPrice = selected.reduce((acc, c) => acc + (c.price || 0), 0) / selected.length;
        const avgSqft = selected.reduce((acc, c) => acc + (c.squareFootage || 0), 0) / selected.length;
        const avgPPSF = selected.reduce((acc, c) => acc + (c.squareFootage > 0 ? (c.price || 0) / c.squareFootage : 0), 0) / selected.length;

        return { avgPrice, avgSqft, avgPPSF, count: selected.length };
    }, [comps, selectedCompIds]);

    return (
        <div className="h-[calc(100vh-200px)] flex flex-col">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Comparable Properties Explorer</h2>
                    <p className="text-slate-400">Deep dive into market data. Filter, select, and export comps.</p>
                </div>
                {selectedKPIs && (
                    <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg flex items-center gap-6">
                        <div>
                            <div className="text-xs text-slate-500 uppercase font-bold">Selected Count</div>
                            <div className="font-bold text-white text-lg">{selectedKPIs.count}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 uppercase font-bold">Avg Price</div>
                            <div className="font-bold text-emerald-400 text-lg">${Math.round(selectedKPIs.avgPrice).toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 uppercase font-bold">Avg PPSF</div>
                            <div className="font-bold text-indigo-400 text-lg">${Math.round(selectedKPIs.avgPPSF)}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Explorer Layout */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex overflow-hidden">
                {/* Filters Sidebar */}
                <div className="w-80 border-r border-slate-800 p-6 overflow-y-auto bg-slate-950/50 flex flex-col">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Filters
                    </h3>

                    <div className="space-y-6 flex-1">
                        {/* Mode */}
                        <div className="p-1 bg-slate-800 rounded-lg flex">
                            <button
                                onClick={() => setMode('sale')}
                                className={`flex-1 py-2 text-xs font-bold rounded shadow-sm transition-colors ${mode === 'sale' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >Sale</button>
                            <button
                                onClick={() => setMode('rent')}
                                className={`flex-1 py-2 text-xs font-bold rounded shadow-sm transition-colors ${mode === 'rent' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >Rent</button>
                        </div>

                        {/* Radius */}
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase">Radius (Miles)</label>
                            <select
                                value={radius}
                                onChange={(e) => setRadius(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                            >
                                <option value={0.5}>0.5 Miles</option>
                                <option value={1}>1 Mile</option>
                                <option value={3}>3 Miles</option>
                                <option value={5}>5 Miles</option>
                            </select>
                        </div>

                        {/* Date Range */}
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase">Listed/Sold Within</label>
                            <select
                                value={daysOld}
                                onChange={(e) => setDaysOld(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                            >
                                <option value={90}>3 Months</option>
                                <option value={180}>6 Months</option>
                                <option value={365}>12 Months</option>
                            </select>
                        </div>

                        {/* Bed Logic (Simplified UI for now) */}
                    </div>

                    <button
                        onClick={fetchComps}
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                        {loading ? 'Searching...' : 'Search Comps'}
                    </button>
                </div>

                {/* Results Area */}
                <div className="flex-1 bg-slate-900 flex flex-col relative">
                    {error && (
                        <div className="absolute top-4 left-4 right-4 z-10 p-3 bg-red-900/50 border border-red-800 text-red-200 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    {comps.length === 0 && !loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                            <div className="mb-4 inline-block p-4 bg-slate-800 rounded-full">
                                <Search className="w-8 h-8 text-slate-400" />
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2">Ready to Search</h4>
                            <p className="mb-6 max-w-sm text-center">Use the filters on the left to find properties comparable to <span className="text-indigo-400">{property.address}</span>.</p>
                        </div>
                    ) : (
                        <>
                            {/* Toolbar */}
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/90 backdrop-blur z-10">
                                <span className="text-sm font-bold text-slate-300">{comps.length} Results Found</span>
                                <div className="flex gap-3">
                                    <button
                                        className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-lg transition-colors"
                                        onClick={() => {
                                            alert("CSV Export Coming Soon");
                                        }}
                                    >
                                        Export CSV
                                    </button>
                                    <button
                                        disabled={saveStatus === 'saving' || selectedCompIds.size === 0}
                                        onClick={saveCompSet}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${saveStatus === 'saved' ? 'bg-emerald-600 text-white' :
                                            selectedCompIds.size > 0 ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                            }`}
                                    >
                                        {saveStatus === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
                                        {saveStatus === 'saved' && <CheckCircle className="w-3 h-3" />}
                                        {saveStatus === 'saved' ? 'Saved!' : 'Save Comp Set'}
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {comps.map((comp) => (
                                    <div
                                        key={comp.id}
                                        onClick={() => toggleCompSelection(comp.id)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center group ${selectedCompIds.has(comp.id)
                                            ? 'bg-indigo-900/10 border-indigo-500/50'
                                            : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCompIds.has(comp.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600 group-hover:border-slate-500'
                                                }`}>
                                                {selectedCompIds.has(comp.id) && <CheckCircle className="w-3 h-3 text-white" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{comp.formattedAddress || comp.address}</div>
                                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {comp.distance?.toFixed(2)} mi</span>
                                                    <span>•</span>
                                                    <span>{comp.bedrooms}bd / {comp.bathrooms}ba</span>
                                                    <span>•</span>
                                                    <span>{comp.squareFootage} sqft</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-white text-lg">${comp.price?.toLocaleString()}</div>
                                            <div className="text-xs text-slate-500 mt-1 flex items-center justify-end gap-1">
                                                <Calendar className="w-3 h-3" /> {new Date(comp.listedDate || comp.lastSeenDate || '').toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompsExplorerPage;

