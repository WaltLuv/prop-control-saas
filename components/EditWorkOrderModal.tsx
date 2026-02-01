
import React, { useState, useMemo } from 'react';
import { X, Wrench, Building2, User, FileText, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Asset, Tenant, Job, JobStatus } from '../types';

interface EditWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  assets: Asset[];
  tenants: Tenant[];
  onSave: (job: Job) => void;
}

const EditWorkOrderModal: React.FC<EditWorkOrderModalProps> = ({ isOpen, onClose, job, assets, tenants, onSave }) => {
  const [propertyId, setPropertyId] = useState(job.propertyId);
  const [tenantId, setTenantId] = useState(job.tenantId);
  const [issueType, setIssueType] = useState(job.issueType);
  const [description, setDescription] = useState(job.description);
  const [status, setStatus] = useState<JobStatus>(job.status);

  // Filter tenants based on selected property
  const filteredTenants = useMemo(() => {
    if (!propertyId) return [];
    return tenants.filter(t => t.propertyId === propertyId);
  }, [propertyId, tenants]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !tenantId || !description) return;

    onSave({
      ...job,
      propertyId,
      tenantId,
      issueType,
      description,
      status,
      updatedAt: new Date().toISOString()
    });
  };

  const getStatusIcon = (s: JobStatus) => {
    switch (s) {
      case JobStatus.COMPLETED: return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case JobStatus.IN_PROGRESS: return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Wrench className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Refine Details</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Edit Work Order #{job.id.split('-').pop()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Target Property</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <select 
                required
                value={propertyId}
                onChange={(e) => {
                  setPropertyId(e.target.value);
                  setTenantId(''); // Reset tenant on property change
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
              >
                <option value="">Select Property...</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Resident / Caller</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <select 
                required
                disabled={!propertyId}
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 disabled:opacity-50"
              >
                <option value="">{propertyId ? 'Select Resident...' : 'Select Property First'}</option>
                {filteredTenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Issue Type</label>
              <select 
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="HVAC">HVAC</option>
                <option value="Appliance">Appliance</option>
                <option value="General">General</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Current Status</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  {getStatusIcon(status)}
                </div>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as JobStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                >
                  {Object.values(JobStatus).map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Work Description</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-4 h-4 text-slate-300" />
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to be fixed?"
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 text-sm"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWorkOrderModal;
