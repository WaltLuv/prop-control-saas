import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Asset } from '../types';
import AssetDetail from '../components/AssetDetail'; // Re-use existing component logic if possible, or wrap it

// Interface for the context passed by PropertyLayout
interface PropertyContextType {
    property: Asset;
}

const PropertyOverview: React.FC = () => {
    const { property } = useOutletContext<PropertyContextType>();

    // For now, we reuse the existing AssetDetail component but strictly for its "Overview" content
    // We might need to mock or pass "onBack"/etc if AssetDetail requires props that don't make sense here
    // But given the redesign, AssetDetail might need refactoring. 

    // Strategy: Render a simplified dashboard for this property
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* KPI Summary Cards */}
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
                    <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Occupancy</h3>
                    <div className="text-3xl font-black text-white">100%</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
                    <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Net Cash Flow</h3>
                    <div className="text-3xl font-black text-emerald-400">$1,250<span className="text-sm text-slate-500 font-normal">/mo</span></div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
                    <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Maintenance</h3>
                    <div className="text-3xl font-black text-blue-400">0 <span className="text-sm text-slate-500 font-normal">Active</span></div>
                </div>
            </div>

            {/* Main Content reusing AssetDetail or custom content */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 min-h-[400px]">
                <h2 className="text-2xl font-bold mb-4">Property Overview</h2>
                <p className="text-slate-400">
                    This is the main dashboard for <span className="text-white font-semibold">{property.address}</span>.
                    From here you can manage tenants, work orders, and view historical performance.
                </p>

                {/* Placeholder for future "Widget" grid */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-slate-950 rounded-lg border border-slate-800 hover:border-indigo-500/50 transition-colors cursor-pointer">
                        <h4 className="font-bold text-white mb-2">Tenant Roster</h4>
                        <p className="text-sm text-slate-400">View lease details and contact info.</p>
                    </div>
                    <div className="p-6 bg-slate-950 rounded-lg border border-slate-800 hover:border-indigo-500/50 transition-colors cursor-pointer">
                        <h4 className="font-bold text-white mb-2">Maintenance Log</h4>
                        <p className="text-sm text-slate-400">Track repairs and capital expenditures.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyOverview;
