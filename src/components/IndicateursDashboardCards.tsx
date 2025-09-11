'use client'

import React, { useState } from 'react';
import { TrendingUp, Users, Building2, Mail, PlusCircle, Settings } from 'lucide-react';
import { useIndicateursDashboard } from '@/hooks/useIndicateursDashboard';
import { useRole } from '@/hooks/useRole';

export default function IndicateursDashboardCards() {
  const { indicateurs, loading, error, updateIndicateur, reload } = useIndicateursDashboard();
  const { isAdmin } = useRole();
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editData, setEditData] = useState<unknown[]>([]);
  const [addData, setAddData] = useState({ titre: '', valeur: '', trend: '', couleur: 'blue', icone: 'TrendingUp' });

  // Icônes disponibles
  const iconMap = {
    TrendingUp: <TrendingUp className="w-7 h-7" />,
    Users: <Users className="w-7 h-7" />,
    Building2: <Building2 className="w-7 h-7" />,
    Mail: <Mail className="w-7 h-7" />,
  };

  // Ouvre la modale d'édition avec les valeurs actuelles
  const handleEdit = () => {
    setEditData(indicateurs.map(i => ({ ...i })));
    setEditOpen(true);
  };
  
  // Gère la modification locale
  const handleChange = (idx: number, field: string, value: string) => {
    setEditData(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  
  // Sauvegarde toutes les modifs
  const handleSave = async () => {
    for (const ind of editData) {
      await updateIndicateur(ind.id, {
        titre: ind.titre,
        valeur: ind.valeur,
        trend: ind.trend,
        couleur: ind.couleur,
        icone: ind.icone,
      });
    }
    setEditOpen(false);
    reload();
  };
  
  // Ajout d'un indicateur
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { supabase } = await import('@/lib/supabase');
    await supabase.from('indicateurs_dashboard').insert([
      { ...addData, ordre: indicateurs.length }
    ]);
    setAddOpen(false);
    setAddData({ titre: '', valeur: '', trend: '', couleur: 'blue', icone: 'TrendingUp' });
    reload();
  };

  if (loading) return <div>Chargement…</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-xl border-2 border-black/30">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
          Indicateurs clés
        </h2>
        {isAdmin && (
          <div className="flex gap-3">
            <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 border-2 border-dashed border-blue-300 rounded-xl px-4 py-2 text-blue-600 hover:bg-blue-50 transition-all duration-300 hover:scale-105">
              <PlusCircle className="w-5 h-5" /> Ajouter un indicateur
            </button>
            <button onClick={handleEdit} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-semibold transition-all duration-300 hover:scale-105 shadow-lg">Modifier</button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {indicateurs.map((ind, idx) => (
          <div key={ind.id} className={`bg-white/30 backdrop-blur-sm rounded-2xl p-6 border-l-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group border-${ind.couleur || 'blue'}-500 hover:scale-105 border-2 border-black/20`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">{ind.titre}</p>
                <p className={`text-3xl font-bold text-${ind.couleur || 'blue'}-600 mb-1`}>{ind.valeur}</p>
                <p className={`text-sm font-medium text-${ind.couleur || 'blue'}-600`}>{ind.trend}</p>
              </div>
              <div className={`rounded-xl p-3 bg-${ind.couleur || 'blue'}-100 group-hover:scale-110 transition-transform duration-300`}>
                {iconMap[ind.icone as keyof typeof iconMap] || <TrendingUp className="w-6 h-6 text-${ind.couleur || 'blue'}-600" />}
              </div>
            </div>
          </div>
        ))}
        {isAdmin && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex flex-col items-center justify-center border-2 border-dashed border-black/40 rounded-2xl p-6 text-gray-700 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg bg-white/10 backdrop-blur-sm"
          >
            <PlusCircle className="w-8 h-8 mb-2" />
            <span className="font-semibold">Ajouter un indicateur</span>
          </button>
        )}
      </div>
      
      {/* Modale édition admin */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl max-h-[90vh] flex flex-col border border-blue-100/50">
            <div className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center">
                <Settings className="w-6 h-6 text-blue-600 mr-3" />
                Modifier les indicateurs
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fermer"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valeur</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tendance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Couleur</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {editData.map((ind, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={ind.titre}
                            onChange={(e) => handleChange(idx, 'titre', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={ind.valeur}
                            onChange={(e) => handleChange(idx, 'valeur', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={ind.trend}
                            onChange={(e) => handleChange(idx, 'trend', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={ind.couleur}
                            onChange={(e) => handleChange(idx, 'couleur', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="blue">Bleu</option>
                            <option value="green">Vert</option>
                            <option value="purple">Violet</option>
                            <option value="orange">Orange</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 flex-shrink-0 mt-4 bg-white">
              <button
                onClick={() => setEditOpen(false)}
                className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale ajout admin */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[85vh] flex flex-col border border-blue-100/50">
            <div className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center">
                <PlusCircle className="w-6 h-6 text-blue-600 mr-3" />
                Ajouter un indicateur
              </div>
              <button
                onClick={() => setAddOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fermer"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="flex flex-col flex-1 min-h-0">
              <div className="space-y-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                    <input
                      type="text"
                      value={addData.titre}
                      onChange={(e) => setAddData({ ...addData, titre: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valeur</label>
                    <input
                      type="text"
                      value={addData.valeur}
                      onChange={(e) => setAddData({ ...addData, valeur: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tendance</label>
                    <input
                      type="text"
                      value={addData.trend}
                      onChange={(e) => setAddData({ ...addData, trend: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                    <select
                      value={addData.couleur}
                      onChange={(e) => setAddData({ ...addData, couleur: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="blue">Bleu</option>
                      <option value="green">Vert</option>
                      <option value="purple">Violet</option>
                      <option value="orange">Orange</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 flex-shrink-0 mt-4 bg-white">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
