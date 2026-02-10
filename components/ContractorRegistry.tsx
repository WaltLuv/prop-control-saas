
import React, { useState } from 'react';
import { Users, Phone, Mail, Award, TrendingUp, ShieldCheck, Edit2, X, Star } from 'lucide-react';
import { Contractor, Job, JobStatus } from '../types';
import AddContractorModal from './AddContractorModal';

interface ContractorRegistryProps {
  contractors: Contractor[];
  jobs: Job[];
  onUpdateContractor: (contractor: Contractor) => void;
  onAddContractor: (contractor: Contractor) => void;
}

const ContractorRegistry: React.FC<ContractorRegistryProps> = ({ contractors, jobs, onUpdateContractor, onAddContractor }) => {
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContractor) return;
    onUpdateContractor(editingContractor);
    setEditingContractor(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Contractor Directory</h2>
          <p className="text-slate-500 font-medium">Performance-weighted registry for autonomous assignment.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition shadow-lg"
        >
          Onboard New Vendor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(contractors || []).map((c, idx) => {
          if (!c) return null; // Skip null entries
          const completedJobs = (jobs || []).filter(j => j && j.contractorId === c.id && j.status === JobStatus.COMPLETED);
          const safeSpecialties = Array.isArray(c.specialty) ? c.specialty : [];
          const safeRating = typeof c.rating === 'number' ? c.rating : Number(c.rating || 0);

          return (
            <div key={c.id || idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition relative group">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-indigo-50 p-3 rounded-2xl">
                  <Award className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingContractor(c)}
                    className="p-1.5 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                    title="Edit Vendor"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${c.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                    {c.status || 'UNKNOWN'}
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-1">{c.name || 'Unknown Vendor'}</h3>
              <div className="flex gap-2 flex-wrap mb-6">
                {safeSpecialties.map((s, i) => (
                  <span key={i} className="bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-100 capitalize">
                    {s}
                  </span>
                ))}
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                  <Phone className="w-4 h-4 text-slate-300" /> {c.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                  <Mail className="w-4 h-4 text-slate-300" /> {c.email || 'N/A'}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rating</p>
                  <div className="flex items-center gap-1 font-black text-indigo-600">
                    <TrendingUp className="w-4 h-4" /> {safeRating.toFixed(1)} / 5
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                  <div className="flex items-center gap-1 font-black text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-slate-400" /> {completedJobs.length} Jobs
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Contractor Modal */}
      {editingContractor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Edit Vendor</h3>
                <p className="text-slate-400 text-sm font-medium">Update profile for {editingContractor.name}</p>
              </div>
              <button onClick={() => setEditingContractor(null)} className="p-2 hover:bg-slate-100 rounded-full transition">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Company Name</label>
                <input
                  type="text"
                  value={editingContractor.name}
                  onChange={(e) => setEditingContractor({ ...editingContractor, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Availability</label>
                  <select
                    value={editingContractor.status}
                    onChange={(e) => setEditingContractor({ ...editingContractor, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="BUSY">Busy</option>
                    <option value="OFFBOARDED">Offboarded</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Performance Rating</label>
                  <div className="relative">
                    <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={editingContractor.rating}
                      onChange={(e) => setEditingContractor({ ...editingContractor, rating: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Contact Details</label>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={editingContractor.email}
                    onChange={(e) => setEditingContractor({ ...editingContractor, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-black"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={editingContractor.phone}
                    onChange={(e) => setEditingContractor({ ...editingContractor, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-black"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setEditingContractor(null)} className="flex-1 px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition">Update Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contractor Modal */}
      <AddContractorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={(newContractor) => {
          onAddContractor(newContractor);
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
};

export default ContractorRegistry;
