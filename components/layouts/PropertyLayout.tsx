import React from 'react';
import { NavLink, Outlet, useParams, Link, useLocation, Navigate } from 'react-router-dom';
import { ArrowLeft, Crown, Lock } from 'lucide-react';
import { Asset, UserProfile, InvestmentLead } from '../../types';

interface PropertyLayoutProps {
    assets: Asset[];
    leads?: InvestmentLead[];
    userProfile: UserProfile | null;
    showUpgradeModal: boolean;
    setShowUpgradeModal: (show: boolean) => void;
}

export default function PropertyLayout({ assets, leads = [], userProfile, setShowUpgradeModal }: PropertyLayoutProps) {
    const { propertyId } = useParams<{ propertyId: string }>();

    // Search in Assets first, then Leads
    const assetMatch = assets.find(a => a.id === propertyId);

    const leadMatch = !assetMatch && leads ? leads.find(l => l.id === propertyId) : null;

    // Normalize Lead to Property/Asset shape if needed, or just use common fields
    const property = assetMatch || (leadMatch ? {
        id: leadMatch.id,
        address: leadMatch.propertyAddress,
        city: leadMatch.propertyAddress.split(',')[1]?.trim() || '',
        state: leadMatch.propertyAddress.split(',')[2]?.trim().split(' ')[0] || '',
        zip: leadMatch.propertyAddress.split(',')[2]?.trim().split(' ')[1] || '',
        beds: leadMatch.bedrooms || 0,
        baths: leadMatch.bathrooms || 0,
        sqft: leadMatch.squareFeet || 0,
        status: 'Lead',
        name: leadMatch.propertyName || leadMatch.propertyAddress,
        propertyType: 'SINGLE_FAMILY', // Default or derived
        units: 1,
        manager: 'Unassigned',
        lastUpdated: leadMatch.recordedDate || new Date().toISOString()
    } as unknown as Asset : null);

    const location = useLocation();

    // Pro Max Check
    const isProMax = userProfile?.plan === 'PRO_MAX';

    // Redirect if trying to access locked route
    React.useEffect(() => {
        if (!isProMax && (location.pathname.endsWith('/financials') || location.pathname.endsWith('/rent') || location.pathname.endsWith('/comps'))) {
            setShowUpgradeModal(true);
        }
        // Redirect Leads to Financials (skip Overview)
        if (leadMatch && location.pathname.endsWith(`/${propertyId}`)) {
            // We can't easily use navigate here without hook, but we can return <Navigate> in render
        }
    }, [location.pathname, isProMax, setShowUpgradeModal, leadMatch, propertyId]);

    // Redirect Leads from Overview to Financials
    if (leadMatch && location.pathname.endsWith(`/${propertyId}`)) {
        return <Navigate to={`/properties/${propertyId}/financials`} replace />;
    }

    if (!property) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-slate-400">
                <h2 className="text-xl font-bold mb-4">Property Not Found</h2>
                <Link to="/" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Return to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            {/* --- Sticky Property Header --- */}
            <div className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Top Row: Basic Info */}
                    <div className="py-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link to="/" className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Back to Dashboard">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-white">{property.address}</h1>
                                <div className="text-sm text-slate-400 flex gap-3">
                                    <span>{property.city}, {property.state} {property.zip}</span>
                                    <span className="text-slate-600">•</span>
                                    <span>{property.beds}bd / {property.baths}ba</span>
                                    <span className="text-slate-600">•</span>
                                    <span>{property.sqft?.toLocaleString()} sqft</span>
                                </div>
                            </div>
                        </div>
                        {/* Quick Actions (e.g., Status Badge) */}
                        <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 text-xs font-bold rounded border uppercase tracking-wider ${property.status === 'Active' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' :
                                property.status === 'Vacancy' ? 'bg-amber-900/30 text-amber-400 border-amber-800' :
                                    'bg-blue-900/30 text-blue-400 border-blue-800'
                                }`}>
                                {property.status || 'New Lead'}
                            </div>
                        </div>
                    </div>


                    <nav className="flex space-x-8 -mb-px overflow-x-auto">
                        {!leadMatch && <TabLink to="" end label="Overview" icon="🏠" />}

                        <div className="relative group">
                            <TabLink to="financials" label="Financials & ARV" icon="💰" locked={!isProMax} />
                            {!isProMax && <LockBadge />}
                        </div>

                        <div className="relative group">
                            <TabLink to="rent" label="Rental Analysis" icon="📈" locked={!isProMax} />
                            {!isProMax && <LockBadge />}
                        </div>

                        <div className="relative group">
                            <TabLink to="comps" label="Comps Explorer" icon="🔍" locked={!isProMax} />
                            {!isProMax && <LockBadge />}
                        </div>
                    </nav>
                </div>
            </div>

            {/* --- Main Content Area --- */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Check again for rendering safety */}
                {(!isProMax && (location.pathname.includes('/financials') || location.pathname.includes('/rent') || location.pathname.includes('/comps'))) ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <Lock className="w-16 h-16 text-slate-600 mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Pro Max Feature</h2>
                        <p className="text-slate-400 mb-6">Upgrade your plan to access advanced Financials, Rent Analysis, and Comps Explorer.</p>
                        <button onClick={() => setShowUpgradeModal(true)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors">
                            Unlock Pro Max
                        </button>
                    </div>
                ) : (
                    <Outlet context={{ property }} />
                )}
            </main>
        </div>
    );
}

function LockBadge() {
    return (
        <div className="absolute top-0 right-0 -mt-1 -mr-2">
            <Lock className="w-3 h-3 text-amber-500" />
        </div>
    )
}

// Helper for consistent Tab Styling
function TabLink({ to, label, icon, end = false, locked = false }: { to: string, label: string, icon: string, end?: boolean, locked?: boolean }) {
    if (locked) {
        return (
            <span className="cursor-not-allowed whitespace-nowrap pb-4 px-1 border-b-2 border-transparent font-medium text-sm flex items-center gap-2 text-slate-600">
                <span>{icon}</span>
                <span>{label}</span>
            </span>
        )
    }
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${isActive
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`
            }
        >
            <span>{icon}</span>
            <span>{label}</span>
        </NavLink>
    );
}

