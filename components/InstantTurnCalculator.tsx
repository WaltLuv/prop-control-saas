
import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Video, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Building2, 
  ArrowRight,
  Zap,
  Trash2,
  FileVideo,
  FileImage,
  Sparkles,
  X
} from 'lucide-react';
import { generateInstantTurnEstimate } from '../geminiService';

interface EstimateLineItem {
  Item: string;
  Quantity: string;
  Estimated_Unit_Cost: number;
  Total: number;
}

interface RoomEstimate {
  name: string;
  estimates: EstimateLineItem[];
}

interface PredictionResult {
  rooms: RoomEstimate[];
  executiveSummary?: string;
  grandTotal: number;
}

const InstantTurnCalculator: React.FC = () => {
  const [files, setFiles] = useState<{ file: File; preview: string; base64: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []) as File[];
    const newFiles = await Promise.all(
      selectedFiles.map(async (file) => ({
        file,
        preview: URL.createObjectURL(file),
        base64: await fileToBase64(file)
      }))
    );
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const runAnalysis = async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const mediaParts = files.map(f => ({
        data: f.base64,
        mimeType: f.file.type
      }));

      const estimate = await generateInstantTurnEstimate(mediaParts);
      setResult(estimate);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Visual analysis failed. Please ensure files are clear and under size limits.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Camera className="w-64 h-64" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Instant AI Estimator</h2>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">Visual Turn Scoping</h1>
              <p className="text-slate-400 font-medium mt-4 max-w-xl">
                Upload room-by-room walk-through photos or video. Our AI identifies maintenance needs and generates a line-item SOW based on 2026 national averages.
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full md:w-auto">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-slate-100 transition shadow-2xl"
              >
                <Upload className="w-4 h-4" /> Select Media
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                accept="image/*,video/*"
                className="hidden" 
                onChange={handleFileChange}
              />
              {files.length > 0 && (
                <button 
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition shadow-2xl disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Analyze & Generate SOW
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {files.length > 0 && !result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 animate-in slide-in-from-bottom-4 duration-500">
          {files.map((file, i) => (
            <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden border border-white/10 bg-white/5">
              {file.file.type.startsWith('video') ? (
                <div className="w-full h-full flex items-center justify-center text-indigo-400">
                  <FileVideo className="w-8 h-8" />
                </div>
              ) : (
                <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
              )}
              <button 
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isAnalyzing && (
        <div className="py-32 flex flex-col items-center justify-center space-y-10">
           <div className="relative">
             <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20" />
             <div className="w-24 h-24 bg-slate-900 border-4 border-indigo-500 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-10 h-10 text-indigo-500" />
             </div>
           </div>
           <div className="text-center">
             <h3 className="text-2xl font-black text-white tracking-widest animate-bounce">Scanning Unit Defects...</h3>
             <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] mt-2">Processing {files.length} Visual Samples</p>
           </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl flex items-center gap-4 text-rose-400 font-bold max-w-2xl mx-auto">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                 <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Turn Budget Estimate</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-slate-900 tracking-tighter">${result.grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                      Calculated
                    </div>
                 </div>
                 <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-black text-indigo-900">AI-Validated Pricing Model</span>
                 </div>
              </div>

              {result.executiveSummary && (
                <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white border border-white/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-5">
                     <AlertCircle className="w-24 h-24" />
                   </div>
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 flex items-center gap-2">
                     <Sparkles className="w-4 h-4" /> SOW Executive Summary
                   </h3>
                   <p className="text-lg font-medium leading-relaxed italic text-indigo-100">
                     "{result.executiveSummary}"
                   </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-8 space-y-8">
              {result.rooms.map((room, idx) => (
                <div key={idx} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-6 h-6 text-indigo-600" />
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{room.name}</h3>
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{room.estimates.length} Items</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/30 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th className="px-8 py-4">Repair Item</th>
                          <th className="px-8 py-4">Quantity</th>
                          <th className="px-8 py-4">Unit Cost</th>
                          <th className="px-8 py-4 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {room.estimates.map((item, iIdx) => (
                          <tr key={iIdx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-4 font-black text-slate-900 text-sm">{item.Item}</td>
                            <td className="px-8 py-4 text-slate-500 font-bold text-sm">{item.Quantity}</td>
                            <td className="px-8 py-4 text-slate-500 font-bold text-sm">${item.Estimated_Unit_Cost.toLocaleString()}</td>
                            <td className="px-8 py-4 text-right font-black text-slate-900 text-sm">${item.Total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center shadow-xl backdrop-blur-md border border-white/20">
                     <DollarSign className="w-8 h-8 text-white" />
                   </div>
                   <div>
                     <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-1">Gross Project Estimate</p>
                     <h4 className="text-4xl font-black tracking-tight">${result.grandTotal.toLocaleString()}</h4>
                   </div>
                </div>
                <button className="w-full md:w-auto bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-50 transition shadow-xl flex items-center justify-center gap-3 active:scale-95">
                  Export to Pro-SOW <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstantTurnCalculator;
