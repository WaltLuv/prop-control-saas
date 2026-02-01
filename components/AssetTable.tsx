
import React, { useState } from 'react';
import { Asset, AssetHealth, KPIStatus } from '../types';
import { Eye, MapPin, Plus, Trash2, Edit2 } from 'lucide-react';
import AddAssetModal from './AddAssetModal';
import EditAssetModal from './EditAssetModal';

interface AssetTableProps {
  assets: Asset[];
  healthMap: Record<string, AssetHealth>;
  onViewAsset: (id: string) => void;
  onAddAsset: (asset: Omit<Asset, 'id' | 'lastUpdated'>) => void;
  onUpdateAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
}

const AssetTable: React.FC<AssetTableProps> = ({ assets, healthMap, onViewAsset, onAddAsset, onUpdateAsset, onDeleteAsset }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Portfolio Assets</h2>
          <p className="text-sm text-slate-500 font-medium">Managing {assets.length} properties across regions</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200"
        >
          <Plus className="w-5 h-5" />
          Add Property
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600">Asset Name & Location</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600">Units</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600">Manager</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600">Health Score</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((asset) => {
                const health = healthMap[asset.id] || { healthScore: 0, statusBand: KPIStatus.GREEN, redCount: 0, yellowCount: 0 };
                return (
                  <tr key={asset.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{asset.name}</div>
                      <div className="text-sm text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {asset.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {asset.units}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {(asset.manager || 'Unassigned').split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="truncate max-w-[100px]">{asset.manager}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{health.healthScore}</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${health.statusBand === KPIStatus.GREEN ? 'bg-green-500' :
                                health.statusBand === KPIStatus.YELLOW ? 'bg-yellow-500' :
                                  'bg-red-500'
                              }`}
                            style={{ width: `${health.healthScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${health.statusBand === KPIStatus.GREEN ? 'bg-green-100 text-green-700' :
                          health.statusBand === KPIStatus.YELLOW ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {health.statusBand}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewAsset(asset.id)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setEditingAsset(asset)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Property"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDeleteAsset(asset.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={(data) => {
          onAddAsset(data);
          setIsAddModalOpen(false);
        }}
      />

      {editingAsset && (
        <EditAssetModal
          isOpen={!!editingAsset}
          onClose={() => setEditingAsset(null)}
          asset={editingAsset}
          onSave={(data) => {
            onUpdateAsset(data);
            setEditingAsset(null);
          }}
        />
      )}
    </div>
  );
};

export default AssetTable;
