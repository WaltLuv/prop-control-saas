import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { InvestmentLead } from '../types';
import { Loader2, Upload, X, Sparkles, AlertTriangle, CheckCircle2, Image as ImageIcon, RefreshCw } from 'lucide-react';

interface RehabEstimatorModalProps {
    lead: InvestmentLead;
    onClose: () => void;
    onUpdateLead?: (updatedLead: InvestmentLead) => void;
}

export default function RehabEstimatorModal({ lead, onClose, onUpdateLead }: RehabEstimatorModalProps) {
    const [photos, setPhotos] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [budget, setBudget] = useState<any>(lead.detailed_rehab_budget || null);
    const [sqft, setSqft] = useState<string>('');

    // Visualizer State
    const [visualizingRoom, setVisualizingRoom] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
    const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

    // Advanced Design Controls
    const [designOptions, setDesignOptions] = useState({
        furnitureStyle: 'Modern Luxury', // Changed default to match old 'selectedStyle'
        wallColor: 'Warm White',
        flooring: 'Light Wood',
        curtains: 'Sheer White',
        decorItems: ['Indoor Plants', 'Rug'] as string[]
    });

    const isOptionSelected = (category: keyof typeof designOptions, value: string) => {
        if (category === 'decorItems') {
            return (designOptions.decorItems as string[]).includes(value);
        }
        return designOptions[category] === value;
    };

    const toggleOption = (category: keyof typeof designOptions, value: string) => {
        setDesignOptions(prev => {
            if (category === 'decorItems') {
                const current = prev.decorItems as string[];
                const updated = current.includes(value)
                    ? current.filter(item => item !== value)
                    : [...current, value];
                return { ...prev, decorItems: updated };
            }
            return { ...prev, [category]: value };
        });
    };

    const runAnalysis = async () => {
        if (photos.length === 0) return;
        setLoading(true);

        try {
            // 1. Upload photos to Supabase Storage
            const uploadedUrls: string[] = [];
            for (const photo of photos) {
                const fileName = `${lead.id}/${Date.now()}_${photo.name}`;
                const { data, error } = await supabase.storage.from('prop-images').upload(fileName, photo);
                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage.from('prop-images').getPublicUrl(fileName);
                uploadedUrls.push(publicUrl);
            }
            setUploadedImageUrls(uploadedUrls);


            // 2. Trigger the Edge Function
            let resultAnalysis;
            try {
                const { data, error } = await supabase.functions.invoke('rehab-estimator', {
                    body: { propertyId: lead.id, imageUrls: uploadedUrls, sqft: sqft ? parseInt(sqft) : undefined }
                });
                if (error) throw error;
                resultAnalysis = data.analysis;

            } catch (invokeError) {
                console.error("Edge Function failed", invokeError);
                throw invokeError;
            }

            if (resultAnalysis) {
                setBudget(resultAnalysis);
                if (onUpdateLead) {
                    onUpdateLead({ ...lead, detailed_rehab_budget: resultAnalysis });
                }
            }

        } catch (err: any) {
            console.error("Analysis failed:", err);
            // Enhanced Error Reporting for "Real AI" Mode
            let errorMessage = err.message || "An unexpected error occurred.";
            if (err.context && err.context.json) {
                // Supabase Edge Function error structure often hides details in context
                try {
                    const errorBody = await err.context.json();
                    if (errorBody.error) errorMessage = errorBody.error;
                } catch (e) { /* ignore json parse error */ }
            }
            alert(`Analysis failed: ${errorMessage}. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const generateMockup = async (roomName: string) => {
        setVisualizingRoom(roomName);
        try {
            let resultUrl;
            try {
                // Determine which image to send based on the estimator's mapping
                const roomData = budget?.room_breakdowns?.find((r: any) => r.room === roomName);
                const specificImageIndex = roomData?.source_image_index;

                // If we have a specific index, use ONLY that image. Otherwise fall back to sending all (AI picks first).
                // We wrap it in an array because the backend expects 'imageUrls' array.
                const targetImages = (typeof specificImageIndex === 'number' && uploadedImageUrls[specificImageIndex])
                    ? [uploadedImageUrls[specificImageIndex]]
                    : uploadedImageUrls;

                // Try Edge Function with detailed params
                const { data, error } = await supabase.functions.invoke('rehab-visualizer', {
                    body: {
                        roomName,
                        style: designOptions.furnitureStyle, // Map furniture style to general style
                        propertyId: lead.id,
                        imageUrls: targetImages,
                        // Pass specific design choices
                        // Pass specific design choices & CONTEXT
                        furnitureStyle: designOptions.furnitureStyle,
                        wallColor: designOptions.wallColor,
                        flooring: designOptions.flooring,
                        curtains: designOptions.curtains,
                        decorItems: designOptions.decorItems,
                        observations: roomData?.observations,
                        recommendedAction: roomData?.recommended_action
                    }
                });
                if (error) throw error;
                if (data?.success && data.imageUrl) {
                    resultUrl = data.imageUrl;
                } else {
                    throw new Error("Failed to generate image.");
                }
            } catch (invokeError) {
                console.error("Visualizer failed", invokeError);
                throw invokeError;
            }

            if (resultUrl) {
                setGeneratedImages(prev => ({ ...prev, [roomName]: resultUrl }));
            }
        } catch (err: any) {
            console.error("Visualization failed:", err);
            let errorMessage = err.message || "An unexpected error occurred.";
            if (err.context && err.context.json) {
                try {
                    const errorBody = await err.context.json();
                    if (errorBody.error) errorMessage = errorBody.error;
                } catch (e) { /* ignore */ }
            }
            alert(`Visualization failed: ${errorMessage}. Please try again.`);
        } finally {
            setVisualizingRoom(null);
        }
    };

    // Helper for zoom (simplified for this modal)
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-[60]">
            {zoomedImage && (
                <div
                    className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setZoomedImage(null)}
                >
                    <img src={zoomedImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                </div>
            )}

            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl p-0 overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">Deep Rehab Analyzer</h2>
                            <p className="text-xs text-slate-400 font-medium">Powered by Gemini 1.5 Pro Vision</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                    {!budget ? (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-700 rounded-3xl bg-slate-800/20">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                <Upload className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Upload Interior Photos</h3>
                            <p className="text-slate-400 mb-8 max-w-sm text-center text-sm">
                                Upload photos from Zillow, the MLS, or your wholesaler. Gemini will analyze them room-by-room.
                            </p>

                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                                className="hidden"
                                id="photo-upload"
                            />
                            <label
                                htmlFor="photo-upload"
                                className="cursor-pointer px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition mb-4 block w-fit mx-auto"
                            >
                                {photos.length > 0 ? `${photos.length} Photos Selected` : 'Select Photos'}
                            </label>

                            <div className="w-full max-w-xs mb-6">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="sqft-input">
                                    Total Square Footage (Optional)
                                </label>
                                <input
                                    type="number"
                                    id="sqft-input"
                                    placeholder="e.g. 2500"
                                    value={sqft}
                                    onChange={(e) => setSqft(e.target.value)}
                                    className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none font-mono placeholder:text-slate-600"
                                />
                            </div>

                            {photos.length > 0 && (
                                <button
                                    onClick={runAnalysis}
                                    disabled={loading}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {loading ? 'Analyzing Structure...' : 'Run Deep Analysis'}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Estimated Rehab</p>
                                    <p className="text-4xl font-black text-emerald-400 tracking-tighter">${budget.total_estimated_cost ? budget.total_estimated_cost.toLocaleString() : '0'}</p>
                                </div>
                                <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Project Difficulty</p>
                                        <div className="flex gap-1 mt-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <div key={s} className={`h-2 w-8 rounded-full ${s <= parseInt(budget.overall_difficulty) ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-2xl font-black text-white">{budget.overall_difficulty}/5</span>
                                </div>
                            </div>

                            {/* Strategy & Analysis Section */}
                            {budget.strategy_analysis && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl">
                                        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3">Strategy: BRRRR vs Flip</p>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-indigo-200 font-bold mb-1">BRRRR View</p>
                                                <p className="text-sm text-indigo-100/80 leading-snug">{budget.strategy_analysis.brrrr_strategy}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-indigo-200 font-bold mb-1">Flip View</p>
                                                <p className="text-sm text-indigo-100/80 leading-snug">{budget.strategy_analysis.flip_strategy}</p>
                                            </div>
                                            <div className="pt-2 border-t border-indigo-500/20 mt-2">
                                                <span className="text-xs font-bold text-indigo-300">Recommendation: </span>
                                                <span className="font-black text-white">{budget.strategy_analysis.recommendation}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/50 border border-white/5 p-6 rounded-2xl flex flex-col">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Market Positioning</p>
                                        <p className="text-sm text-slate-300 leading-relaxed italic">"{budget.strategy_analysis.market_positioning}"</p>

                                        {budget.assumptions_and_notes && budget.assumptions_and_notes.length > 0 && (
                                            <div className="mt-auto pt-4">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Assumptions & Unknowns</p>
                                                <ul className="space-y-1">
                                                    {budget.assumptions_and_notes.map((note: string, i: number) => (
                                                        <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                                                            <span className="mt-1 w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                                                            {note}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Warnings */}
                            {budget.hidden_damage_warnings?.length > 0 && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                                        <h4 className="font-bold text-rose-400">Potential Hidden Damage Detected</h4>
                                    </div>
                                    <ul className="space-y-2">
                                        {budget.hidden_damage_warnings.map((warning: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-rose-200/80">
                                                <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                                {warning}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Advanced Design Visualizer Controls */}
                            <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 space-y-6">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-400" /> Customize Visualizer
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Furniture Style */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Furniture Style</label>
                                        <select
                                            value={designOptions.furnitureStyle}
                                            onChange={(e) => toggleOption('furnitureStyle', e.target.value)}
                                            className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none"
                                        >
                                            {['Modern', 'Minimalist', 'Scandinavian', 'Industrial', 'Vintage', 'Bohemian', 'Modern Luxury', 'Rustic Farmhouse'].map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>

                                    {/* Wall Color */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Wall Color</label>
                                        <select
                                            value={designOptions.wallColor}
                                            onChange={(e) => toggleOption('wallColor', e.target.value)}
                                            className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none"
                                        >
                                            {['Warm White', 'Cool Grey', 'Sage Green', 'Navy', 'Sand Beige', 'Charcoal'].map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>

                                    {/* Flooring */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Flooring</label>
                                        <select
                                            value={designOptions.flooring}
                                            onChange={(e) => toggleOption('flooring', e.target.value)}
                                            className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none"
                                        >
                                            {['Light Wood', 'Dark Wood', 'Concrete', 'Marble', 'Patterned Tile', 'Carpet'].map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>

                                    {/* Curtains */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Curtains</label>
                                        <select
                                            value={designOptions.curtains}
                                            onChange={(e) => toggleOption('curtains', e.target.value)}
                                            className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none"
                                        >
                                            {['Sheer White', 'Blackout Dark', 'Linen Beige', 'Velvet Emerald', 'None'].map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Decor Items (Multi-select) */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Decor Elements</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Indoor Plants', 'Floor Lamp', 'Wall Art', 'Throw Pillows', 'Rug', 'Books', 'Vases'].map(item => (
                                            <button
                                                key={item}
                                                onClick={() => toggleOption('decorItems', item)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${isOptionSelected('decorItems', item)
                                                    ? 'bg-indigo-500 text-white border-indigo-500'
                                                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-indigo-500/50'
                                                    }`}
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Room Breakdown */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-white mb-2 ml-1">Room-by-Room Breakdown</h3>
                                {budget.room_breakdowns.map((room: any, i: number) => (
                                    <div key={i} className="bg-slate-800/30 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h4 className="text-lg font-black text-white">{room.room}</h4>
                                                <p className="text-emerald-400 font-bold font-mono">${room.estimated_cost ? room.estimated_cost.toLocaleString() : '0'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {/* Status Tags */}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">AI Observations</p>
                                                <p className="text-sm text-slate-300 leading-relaxed">{room.observations}</p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Recommended Action</p>
                                                <p className="text-sm text-slate-300 leading-relaxed">{room.recommended_action}</p>
                                            </div>
                                        </div>

                                        {/* SOW Line Items Table */}
                                        {room.line_items && room.line_items.length > 0 && (
                                            <div className="mb-6 bg-slate-900/50 rounded-xl overflow-hidden border border-white/5">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-xs uppercase bg-slate-800/80 text-slate-400">
                                                        <tr>
                                                            <th className="px-4 py-2 font-bold">Item</th>
                                                            <th className="px-4 py-2 font-bold text-right">Unit</th>
                                                            <th className="px-4 py-2 font-bold text-right">Cost</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {room.line_items.map((item: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-4 py-2 text-slate-300">{item.item}</td>
                                                                <td className="px-4 py-2 text-right text-slate-500 text-xs">{item.unit}</td>
                                                                <td className="px-4 py-2 text-right font-mono text-emerald-400/90">${item.cost ? item.cost.toLocaleString() : '0'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* Visualizer Section */}
                                        <div className="mt-4 pt-4 border-t border-white/5">

                                            {/* Source Photo Selection */}
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Source Photo</p>
                                                    <div className="flex gap-1">
                                                        {uploadedImageUrls.map((url, imgIdx) => (
                                                            <button
                                                                key={imgIdx}
                                                                onClick={() => {
                                                                    const updatedBudget = { ...budget };
                                                                    updatedBudget.room_breakdowns[i].source_image_index = imgIdx;
                                                                    setBudget(updatedBudget);
                                                                }}
                                                                className={`w-6 h-6 rounded-md overflow-hidden border-2 transition ${imgIdx === room.source_image_index
                                                                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                                                                    : 'border-slate-700 opacity-50 hover:opacity-100 hover:border-slate-500'
                                                                    }`}
                                                                title={`Select Photo ${imgIdx + 1}`}
                                                            >
                                                                <img src={url} className="w-full h-full object-cover" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                {typeof room.source_image_index === 'number' && uploadedImageUrls[room.source_image_index] && (
                                                    <div className="w-full h-32 rounded-lg overflow-hidden border border-slate-700/50 relative group">
                                                        <img
                                                            src={uploadedImageUrls[room.source_image_index]}
                                                            className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition"
                                                            alt="Source for visualization"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <span className="bg-black/50 text-white text-[10px] uppercase font-bold px-2 py-1 rounded backdrop-blur-sm">
                                                                Target for AI
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {generatedImages[room.room] ? (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {/* BEFORE (Source) */}
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Original</p>
                                                            <div
                                                                className="relative w-full h-48 rounded-xl overflow-hidden group border border-slate-700 cursor-zoom-in"
                                                                onClick={() => setZoomedImage(
                                                                    (typeof room.source_image_index === 'number' && uploadedImageUrls[room.source_image_index])
                                                                        ? uploadedImageUrls[room.source_image_index]
                                                                        : uploadedImageUrls[0]
                                                                )}
                                                            >
                                                                <img
                                                                    src={(typeof room.source_image_index === 'number' && uploadedImageUrls[room.source_image_index]) ? uploadedImageUrls[room.source_image_index] : uploadedImageUrls[0]}
                                                                    alt="Original"
                                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                                />
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                            </div>
                                                        </div>

                                                        {/* AFTER (Generated) */}
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1">After Renovation</p>
                                                            <div
                                                                className="relative w-full h-48 rounded-xl overflow-hidden group border border-indigo-500/30 cursor-zoom-in"
                                                                onClick={() => setZoomedImage(generatedImages[room.room])}
                                                            >
                                                                <img
                                                                    src={generatedImages[room.room]}
                                                                    alt="After Preview"
                                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                                />
                                                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-indigo-900/90 to-transparent">
                                                                    <span className="text-[10px] font-bold text-white flex items-center gap-1">
                                                                        <Sparkles className="w-3 h-3 text-indigo-400" /> {designOptions.furnitureStyle}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => generateMockup(room.room)}
                                                        disabled={visualizingRoom === room.room}
                                                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest flex justify-center items-center gap-2 transition disabled:opacity-50"
                                                    >
                                                        {visualizingRoom === room.room ? (
                                                            <>
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                Regenerating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <RefreshCw className="w-3 h-3" />
                                                                Update Design (Regenerate)
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => generateMockup(room.room)}
                                                    disabled={visualizingRoom === room.room}
                                                    className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 transition disabled:opacity-50"
                                                >
                                                    {visualizingRoom === room.room ? (
                                                        <>
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            Dreaming up new design...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ImageIcon className="w-3 h-3" />
                                                            Visualize {designOptions.furnitureStyle} Renovation
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                    </div>
                                ))}
                            </div>

                            {/* Start Over Action */}
                            <div className="flex justify-center pt-8 border-t border-white/5">
                                <button
                                    onClick={() => {
                                        setBudget(null);
                                        setPhotos([]);
                                        setGeneratedImages({});
                                        setUploadedImageUrls([]);
                                    }}
                                    className="px-6 py-2 text-xs font-bold text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition flex items-center gap-2"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Start Over / New Analysis
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
