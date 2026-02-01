
import React, { useState } from 'react';
import { X, UserPlus, Mail, Phone, ShieldCheck, Hammer } from 'lucide-react';
import { Contractor } from '../types';

interface AddContractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contractor: Contractor) => void;
}

const AddContractorModal: React.FC<AddContractorModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.specialties) return;

    const newContractor: Contractor = {
      id: `c-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      specialty: formData.specialties.split(',').map(s => s.trim()).filter(s => s),
      rating: 5.0, // Default for new vendors
      status: 'AVAILABLE',
    };

    onSave(newContractor);
    setFormData({ name: '', email: '', phone: '', specialties: '' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Onboard Vendor</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Register New Contractor</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Company Name</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                required
                type="text"
                placeholder="Ex: Precision Plumbing Solutions"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Trades / Specialties (Comma Separated)</label>
            <div className="relative">
              <Hammer className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                required
                type="text"
                placeholder="Plumbing, Water Heaters, Rooter Service"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-900 text-sm"
                value={formData.specialties}
                onChange={(e) => setFormData({...formData, specialties: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Primary Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  required
                  type="email"
                  placeholder="service@vendor.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-900 text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Main Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  required
                  type="tel"
                  placeholder="555-123-4567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-900 text-sm"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
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
              className="flex-1 px-6 py-3.5 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200"
            >
              Complete Onboarding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContractorModal;
