import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Asset } from '../types';
import { supabase } from '../lib/supabase';
import { Loader2, TrendingUp, Search, MapPin } from 'lucide-react';

interface PropertyContextType {
    property: Asset;
}

const RentEstimatesPage: React.FC = () => {
    const { property } = useOutletContext<PropertyContextType>();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    const fetchRentEstimate = async () => {
        setLoading(true);
        try {
            const { data: resData, error: resError } = await supabase.functions.invoke('rent-estimate-bundle', {
                body: {
                    address: property.address,
                    propertyId: property.id,
                    beds: property.beds,
                    baths: property.baths,
                    sqft: property.sqft,
                    propertyType: 'Single Family'
                }
            });
            if (resError) throw resError;
            setData(resData);
        } catch (err: any) {
            console.error('Rent Estimate Error:', err);
            let msg = 'Unknown error occurred';

            if (err.context === 'functions' && err.status) {
                msg = `Edge Function Error (${err.status}): ${err.message}`;
            } else if (err.message) {
                msg = err.message;
            }

            alert(`Rent Estimate failed: ${msg}. \n\nNote: If this is a 401 error, your RENTCAST_API_KEY is invalid. If it's a 400 error, please check Supabase logs.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white">Rental Analysis</h2>
                    <p className="text-slate-400 mt-1">Market Rent Estimates & Comparables</p>
                </div>
                <button
                    onClick={fetchRentEstimate}
                    disabled={loading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-indigo-900/20"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    {data ? 'Update Estimate' : 'Get Rent Estimate'}
                </button>
            </div>

            {loading && !data && (
                <div className="text-center py-24 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30 animate-pulse">
                    <Loader2 className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-spin" />
                    <div className="text-slate-500 font-medium">Analyzing Rental Market...</div>
                </div>
            )}

            {!loading && !data && (
                <div className="text-center py-24 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                    <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-300">No Data Yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">Click "Get Rent Estimate" to see current market rates and nearby rental comps.</p>
                </div>
            )}

            {data && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Primary Estimate Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-8 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp className="w-32 h-32 text-indigo-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="text-indigo-400 font-bold uppercase tracking-widest text-sm mb-2">Estimated Monthly Rent</div>
                                <div className="text-5xl font-black text-white mb-2">
                                    ${data.rent?.toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <span className="px-2 py-1 bg-slate-800 rounded text-xs font-mono">Range: ${data.rentRangeLow?.toLocaleString()} - ${data.rentRangeHigh?.toLocaleString()}</span>
                                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                    <span className="text-sm">Confidence: High</span>
                                </div>
                            </div>
                        </div>

                        {/* Comps List */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-indigo-400" /> Market Comparables
                                </h3>
                                <span className="text-xs font-mono text-slate-500">{data.comparables?.length || 0} Found</span>
                                <Link to="../comps" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
                                    <Search className="w-3 h-3" /> Explorer
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-800">
                                {data.comparables?.map((comp: any, i: number) => (
                                    <div key={i} className="p-4 hover:bg-slate-800/50 transition-colors flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold text-slate-200">{comp.formattedAddress || comp.address}</div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                {comp.bedrooms}bd / {comp.bathrooms}ba • {comp.squareFootage} sqft
                                                {comp.distance !== undefined && ` • ${comp.distance.toFixed(2)} mi`}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-emerald-400">${comp.price?.toLocaleString()}</div>
                                            <div className="text-xs text-slate-500">{new Date(comp.listedDate || comp.lastSeenDate || '').toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                            <h4 className="text-slate-400 font-bold uppercase text-xs tracking-wider mb-4">Market Stats</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-slate-500 text-sm">Average Rent</span>
                                    <span className="font-bold text-white">${Math.round(data.marketStats?.average || data.rent || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-slate-500 text-sm">Median Rent</span>
                                    <span className="font-bold text-white">${Math.round(data.rent || 0).toLocaleString()}</span>
                                </div>
                                <div className="w-full h-px bg-slate-800 my-2"></div>
                                <div className="flex justify-between items-end">
                                    <span className="text-slate-500 text-sm">Rent / SqFt</span>
                                    <span className="font-bold text-indigo-400">${(data.rent / (property.sqft || 1)).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RentEstimatesPage;
