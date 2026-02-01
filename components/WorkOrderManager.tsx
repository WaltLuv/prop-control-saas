
import React, { useState } from 'react';
import {
  Wrench,
  Bot,
  Trash2,
  Edit2,
  Plus,
  Zap,
  Loader2,
  BellRing,
  Activity,
  UserPlus,
  AlertCircle,
  PhoneCall,
  CheckCircle2,
  Clock,
  Building2,
  User,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Job, Asset, Contractor, JobStatus, Tenant } from '../types';
import { suggestContractor } from '../geminiService';
import CreateWorkOrderModal from './CreateWorkOrderModal';
import EditWorkOrderModal from './EditWorkOrderModal';

interface WorkOrderManagerProps {
  jobs: Job[];
  assets: Asset[];
  tenants: Tenant[];
  contractors: Contractor[];
  onUpdateJob: (job: Job) => void;
  onDeleteJob: (id: string) => void;
  onAddJob: (job: Job) => void;
  onDispatch: (jobId: string) => Promise<void>;
  onNotify: (jobId: string) => Promise<void>;
}

const WorkOrderManager: React.FC<WorkOrderManagerProps> = ({
  jobs,
  assets,
  tenants,
  contractors,
  onUpdateJob,
  onDeleteJob,
  onAddJob,
  onDispatch,
  onNotify
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isSuggesting, setIsSuggesting] = useState<string | null>(null);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getStatusStyle = (status: JobStatus) => {
    switch (status) {
      case JobStatus.REPORTED: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case JobStatus.AI_CLASSIFIED: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case JobStatus.CONTRACTOR_ASSIGNED: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case JobStatus.IN_PROGRESS: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case JobStatus.COMPLETED: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const handleAutoAssign = async (job: Job) => {
    if (contractors.length === 0) {
      setError("Contractor pool is empty. Please register vendors first.");
      return;
    }
    setIsSuggesting(job.id);
    setError(null);
    try {
      const result = await suggestContractor(job, contractors);
      if (result && result.suggestedContractorId) {
        const vendor = contractors.find(c => c.id === result.suggestedContractorId);
        if (vendor) {
          const updatedJob: Job = {
            ...job,
            contractorId: vendor.id,
            status: JobStatus.CONTRACTOR_ASSIGNED,
            updatedAt: new Date().toISOString(),
            communicationLog: [
              ...job.communicationLog,
              { id: `log-${Date.now()}`, timestamp: new Date().toISOString(), sender: 'AI Agent', message: `Matched with ${vendor.name}. AI Reasoning: ${result.reasoning}`, type: 'status_change' }
            ]
          };
          onUpdateJob(updatedJob);
        }
      }
    } catch (err: any) {
      setError("AI Match Engine timed out. Attempting fallback parse...");
      console.error(err);
    } finally {
      setIsSuggesting(null);
    }
  };

  const handleDispatchAction = async (jobId: string) => {
    setBusyJobId(jobId);
    setError(null);
    try {
      await onDispatch(jobId);
    } catch (err: any) {
      setError(`Dispatch failed: ${err.message}`);
    } finally {
      setBusyJobId(null);
    }
  };

  const handleNotifyAction = async (jobId: string) => {
    setBusyJobId(jobId);
    setError(null);
    try {
      await onNotify(jobId);
    } catch (err: any) {
      setError(`Notification failed: ${err.message}`);
    } finally {
      setBusyJobId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Action Header */}
      <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-2">Service Command</h2>
            <p className="text-slate-400 font-medium text-sm">Managing {jobs.length} tickets with autonomous dispatch active.</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full md:w-auto bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition shadow-2xl flex items-center justify-center gap-3 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Open New Ticket
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-400 font-bold animate-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Kanban-style Card View */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
        {jobs.map(job => {
          const asset = assets.find(a => a.id === job.propertyId);
          const tenant = tenants.find(t => t.id === job.tenantId);
          const contractor = contractors.find(c => c.id === job.contractorId);
          const isBusy = busyJobId === job.id;

          return (
            <div key={job.id} className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-8 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <Bot className="w-32 h-32 text-indigo-400" />
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(job.status)}`}>
                    {job.status.replace('_', ' ')}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingJob(job)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeleteJob(job.id)} className="p-2.5 bg-white/5 hover:bg-rose-500/20 rounded-xl text-slate-400 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Asset Location</p>
                        <p className="text-sm font-black text-white leading-tight">{asset?.name || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg">
                        <User className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Resident</p>
                        <p className="text-sm font-black text-white leading-tight">{tenant?.name || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg">
                        <Activity className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Issue Category</p>
                        <p className="text-sm font-black text-white leading-tight">{job.issueType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg">
                        <Clock className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Logged At</p>
                        <p className="text-sm font-black text-white leading-tight">{new Date(job.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/20 rounded-2xl p-6 border border-white/5 mb-8">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Scope Description</p>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium italic">"{job.description}"</p>
                </div>

                {/* AI & Dispatch Controls */}
                <div className="pt-6 border-t border-white/5 flex flex-wrap items-center gap-4">
                  {!contractor ? (
                    <button
                      onClick={() => handleAutoAssign(job)}
                      disabled={isSuggesting === job.id}
                      className="flex-1 min-w-[200px] bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-2xl transition disabled:opacity-50"
                    >
                      {isSuggesting === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                      {isSuggesting === job.id ? "Analyzing Pool..." : "AI Auto-Match"}
                    </button>
                  ) : (
                    <div className="flex-1 min-w-[200px] flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10 group/vendor">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                        {(contractor.name || "?")[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Assigned Vendor</p>
                        <p className="text-sm font-black text-white">{contractor.name}</p>
                      </div>
                      <button onClick={() => handleAutoAssign(job)} className="p-2 text-slate-500 hover:text-white transition-colors">
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDispatchAction(job.id)}
                      disabled={!contractor || isBusy}
                      className={`px-5 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all ${contractor ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xl' : 'bg-white/5 text-slate-600 cursor-not-allowed opacity-30'}`}
                      title="Dispatch call to vendor via Twilio bridge"
                    >
                      {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
                      {isBusy ? 'Calling...' : 'Dispatch'}
                    </button>
                    <button
                      onClick={() => handleNotifyAction(job.id)}
                      disabled={isBusy}
                      className={`px-5 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all ${job.status === JobStatus.IN_PROGRESS ? 'bg-amber-600 text-white hover:bg-amber-500 shadow-xl' : 'bg-white/5 text-slate-600 opacity-30'}`}
                      title="Send voice notification to resident"
                    >
                      {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
                      Notify Resident
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isAddModalOpen && (
        <CreateWorkOrderModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          assets={assets}
          tenants={tenants}
          onSave={(job) => {
            onAddJob(job);
            setIsAddModalOpen(false);
          }}
        />
      )}

      {editingJob && (
        <EditWorkOrderModal
          isOpen={!!editingJob}
          onClose={() => setEditingJob(null)}
          job={editingJob}
          assets={assets}
          tenants={tenants}
          onSave={(updated) => {
            onUpdateJob(updated);
            setEditingJob(null);
          }}
        />
      )}
    </div>
  );
};

export default WorkOrderManager;
