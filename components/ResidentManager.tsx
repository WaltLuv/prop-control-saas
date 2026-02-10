import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Phone,
  Mail,
  Building2,
  Calendar,
  Filter,
  History,
  X,
  MessageSquare,
  Wrench,
  Bot,
  User as UserIcon,
  ShieldCheck,
  ChevronRight,
  Edit2
} from 'lucide-react';
import { Tenant, Asset, Job, CommunicationEntry } from '../types';
import AddTenantModal from './AddTenantModal';
import EditTenantModal from './EditTenantModal';

interface ResidentManagerProps {
  tenants: Tenant[];
  assets: Asset[];
  jobs: Job[];
  onAddTenant: (tenant: Tenant) => void;
  onUpdateTenant: (tenant: Tenant) => void;
  onDeleteTenant: (id: string) => void;
}

const ResidentManager: React.FC<ResidentManagerProps> = ({ tenants, assets, jobs, onAddTenant, onUpdateTenant, onDeleteTenant }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [historyTenantId, setHistoryTenantId] = useState<string | null>(null);

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assets.find(a => a.id === t.propertyId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const historyTenant = tenants.find(t => t.id === historyTenantId);
  const tenantJobs = jobs.filter(j => j.tenantId === historyTenantId).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Resident Directory</h2>
          <p className="text-sm text-slate-500 font-medium">Managing {tenants.length} active residents across portfolio.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg flex items-center gap-2 shrink-0"
          >
            <Plus className="w-5 h-5" /> Add Resident
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Resident Name</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Property</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Info</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Lease End</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTenants.map((tenant) => {
              const asset = assets.find(a => a.id === tenant.propertyId);
              return (
                <tr key={tenant.id} className="hover:bg-slate-50/50 transition group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">{(tenant.name || 'Unknown').split(' ').map(n => n[0]).join('')}</div>
                      <div>
                        <div className="font-bold text-slate-900">{tenant.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {tenant.id.split('-').pop()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm"><Building2 className="w-4 h-4 text-slate-300" />{asset?.name || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Mail className="w-3.5 h-3.5 text-slate-300" /> {tenant.email}</div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Phone className="w-3.5 h-3.5 text-slate-300" /> {tenant.phone}</div>
                  </td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2 text-slate-700 font-bold text-sm"><Calendar className="w-4 h-4 text-slate-300" />{tenant.leaseEnd}</div></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setHistoryTenantId(tenant.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View History"><History className="w-4 h-4" /></button>
                      <button onClick={() => setEditingTenant(tenant)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit Resident"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => {
                        if (window.confirm(`Are you sure you want to remove "${tenant.name}"? This action cannot be undone.`)) {
                          onDeleteTenant(tenant.id);
                        }
                      }} className="p-2 text-slate-300 hover:text-rose-600 transition-colors" title="Remove Resident"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AddTenantModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} assets={assets} onSave={(newTenant) => { onAddTenant(newTenant); setIsAddModalOpen(false); }} />
      {editingTenant && <EditTenantModal isOpen={!!editingTenant} onClose={() => setEditingTenant(null)} tenant={editingTenant} assets={assets} onSave={(updated) => { onUpdateTenant(updated); setEditingTenant(null); }} />}

      {historyTenantId && historyTenant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-50 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-8 bg-white border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">{(historyTenant.name || 'Unknown').split(' ').map(n => n[0]).join('')}</div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{historyTenant.name}</h3>
                  <div className="flex items-center gap-3 mt-1"><span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Building2 className="w-3 h-3" /> {assets.find(a => a.id === historyTenant.propertyId)?.name}</span></div>
                </div>
              </div>
              <button onClick={() => setHistoryTenantId(null)} className="p-3 hover:bg-slate-100 rounded-full transition text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Unified Communication Log</h4>
                {tenantJobs.length > 0 ? (
                  <div className="space-y-8 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                    {tenantJobs.map((job) => (
                      <div key={job.id} className="relative pl-12">
                        <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-slate-900 border-4 border-white z-10" />
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-indigo-600" /><span className="font-black text-sm text-slate-900">{job.issueType} Work Order</span></div>
                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded">#{job.id.split('-').pop()}</span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">"{job.description}"</p>
                          <div className="space-y-3 pt-4 border-t border-slate-50">
                            {job.communicationLog.map((log) => (
                              <div key={log.id} className="flex gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${log.type === 'chat' ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                                <div className="flex-1">
                                  <div className="flex justify-between items-baseline gap-4"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">{log.sender}</span><span className="text-[9px] font-bold text-slate-300">{new Date(log.timestamp).toLocaleDateString()}</span></div>
                                  <p className="text-xs text-slate-600 font-semibold">{log.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center flex flex-col items-center bg-white rounded-3xl border border-dashed border-slate-200"><MessageSquare className="w-12 h-12 text-slate-100 mb-4" /><p className="text-slate-400 font-bold">No historical communication logs found.</p></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentManager;