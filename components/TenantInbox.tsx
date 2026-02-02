import React, { useState } from 'react';
import { Mail, Send, Bot, AlertCircle, CheckCircle2, Search, Info, Loader2 } from 'lucide-react';
import { Tenant, Asset, Job, JobStatus } from '../types';
import { classifyTenantMessage } from '../geminiService';

interface TenantInboxProps {
  tenants: Tenant[];
  assets: Asset[];
  jobs: Job[];
  onReportIssue: (job: Job) => void;
}

const TenantInbox: React.FC<TenantInboxProps> = ({ tenants, assets, jobs, onReportIssue }) => {
  const [inputText, setInputText] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState(tenants[0]?.id || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const handleProcess = async () => {
    if (!inputText) return;
    setIsProcessing(true);
    try {
      const analysis = await classifyTenantMessage(inputText);
      setAiAnalysis(analysis);
    } catch (err) {
      console.error(err);
      alert("AI interpretation failed. Please check your message or connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateJob = () => {
    if (!aiAnalysis || !selectedTenantId) return;

    const tenant = tenants.find(t => t.id === selectedTenantId);
    const asset = assets.find(a => a.id === tenant?.propertyId);

    const existingJob = jobs.find(j =>
      j.propertyId === asset?.id &&
      j.issueType === aiAnalysis.category &&
      [JobStatus.REPORTED, JobStatus.IN_PROGRESS].includes(j.status)
    );

    if (existingJob) {
      alert(`DUPLICATE DETECTED: There is already an open ${aiAnalysis.category} job for this property. Message added to existing Job ID: ${existingJob.id}`);
      return;
    }

    const newJob: Job = {
      id: `j-${Date.now()}`,
      propertyId: asset?.id || '',
      tenantId: selectedTenantId,
      issueType: aiAnalysis.category,
      description: aiAnalysis.summary,
      status: JobStatus.REPORTED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      communicationLog: [
        {
          id: `init-${Date.now()}`,
          timestamp: new Date().toISOString(),
          sender: 'System',
          message: `Work order initialized via manual message intake analysis.`,
          type: 'status_change'
        }
      ]
    };

    onReportIssue(newJob);
    setAiAnalysis(null);
    setInputText('');
    alert("New Job successfully created and added to the Work Order queue.");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <Mail className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Message Intake</h3>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Simulate Incoming From:</label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({assets.find(a => a.id === t.propertyId)?.name})</option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Message Content</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ex: My dishwasher is leaking all over the kitchen floor..."
                className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            onClick={handleProcess}
            disabled={isProcessing || !inputText}
            className={`mt-6 w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isProcessing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200'
              }`}
          >
            {/* Added missing Loader2 from lucide-react */}
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            AI Process Message
          </button>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-6">
        {aiAnalysis ? (
          <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 mb-6">
              <Bot className="w-6 h-6" />
              <h4 className="text-xl font-black uppercase tracking-tight">Agent Interpretation</h4>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Issue Category</p>
                <p className="text-xl font-bold">{aiAnalysis.category}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Priority Level</p>
                <div className="flex items-center gap-2">
                  <AlertCircle className={`w-4 h-4 ${aiAnalysis.priority === 'High' || aiAnalysis.priority === 'Emergency' ? 'text-rose-400' : 'text-emerald-400'}`} />
                  <span className="text-xl font-bold">{aiAnalysis.priority}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 p-6 rounded-2xl border border-white/10 mb-8">
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-2">Automated Summary</p>
              <p className="text-lg font-medium italic">"{aiAnalysis.summary}"</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCreateJob}
                className="flex-1 bg-white text-indigo-600 font-black py-4 rounded-2xl uppercase tracking-widest text-sm hover:bg-indigo-50 transition active:scale-95 shadow-lg"
              >
                Confirm & Open Work Order
              </button>
              <button
                onClick={() => setAiAnalysis(null)}
                className="px-8 py-4 bg-transparent border border-white/30 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition"
              >
                Discard
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
            <Search className="w-16 h-16 opacity-10 mb-4" />
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm mb-2">Awaiting Intake</h4>
            <p className="max-w-xs text-sm font-medium leading-relaxed">
              Messages processed here will use Google Gemini to automatically identify contractors and prevent duplicate job logs.
            </p>
          </div>
        )}

        <div className="bg-slate-900 rounded-3xl p-6 text-white border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-indigo-400" />
            <h5 className="font-black text-xs uppercase tracking-widest">Duplicate Prevention Active</h5>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            PropControl checks the **Jobs Table** for open tickets at the same address before creating new entries. This prevents double-billing and operational confusion.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenantInbox;
