import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { InvestmentLead, DistressType } from '../types';

// Fix for default marker icons in Leaflet + Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LeadMapProps {
    leads: InvestmentLead[];
    onSelectLead: (lead: InvestmentLead) => void;
}

const getMarkerColor = (distress: DistressType) => {
    switch (distress) {
        case DistressType.TAX_LIEN: return '#ef4444'; // rose-500
        case DistressType.PROBATE: return '#f59e0b'; // amber-500
        case DistressType.PRE_FORECLOSURE: return '#8b5cf6'; // violet-500
        case DistressType.VACANT: return '#10b981'; // emerald-500
        default: return '#64748b'; // slate-500
    }
};

export const LeadMap: React.FC<LeadMapProps> = ({ leads, onSelectLead }) => {
    const validLeads = leads.filter(l => l.lat && l.lng);

    // Default to the first lead or center of USA
    const center: [number, number] = validLeads.length > 0
        ? [validLeads[0].lat!, validLeads[0].lng!]
        : [37.0902, -95.7129];

    return (
        <div className="w-full h-[600px] rounded-[3.5rem] overflow-hidden border-4 border-white shadow-2xl relative z-0 mb-12">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {validLeads.map(lead => (
                    <React.Fragment key={lead.id}>
                        <Marker position={[lead.lat!, lead.lng!]}>
                            <Popup>
                                <div className="p-2 min-w-[200px] font-sans">
                                    <h4 className="font-black text-slate-900 mb-1">{lead.propertyAddress}</h4>
                                    <p className="text-[10px] font-bold text-rose-500 uppercase mb-2">{lead.distressIndicator}</p>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-black text-slate-500">${lead.marketValue.toLocaleString()}</span>
                                        <span className="text-xs font-black text-emerald-500">{((lead.equityPct || 0) * 100).toFixed(0)}% Equity</span>
                                    </div>
                                    <button
                                        onClick={() => onSelectLead(lead)}
                                        className="w-full py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-colors"
                                    >
                                        Analyze Lead
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                        {/* Heatmap/Distress Pulse effect using Circle */}
                        <Circle
                            center={[lead.lat!, lead.lng!]}
                            radius={300}
                            pathOptions={{
                                fillColor: getMarkerColor(lead.distressIndicator),
                                fillOpacity: 0.15,
                                color: getMarkerColor(lead.distressIndicator),
                                weight: 1,
                                opacity: 0.3
                            }}
                        />
                    </React.Fragment>
                ))}
            </MapContainer>
        </div>
    );
};
