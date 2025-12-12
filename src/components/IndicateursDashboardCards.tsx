'use client'

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Users, Building2, Mail, PlusCircle, Settings, CheckCircle2 } from 'lucide-react';
import { useIndicateursDashboard } from '@/hooks/useIndicateursDashboard';
import { useRole } from '@/hooks/useRole';

export default function IndicateursDashboardCards() {
  const { indicateurs, loading, error, updateIndicateur, reload } = useIndicateursDashboard();
  const { isAdmin, isDirecteur } = useRole();
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

  // Fonction pour obtenir les couleurs selon la recommandation
  const getColorClasses = (couleur: string) => {
    const colors: Record<string, { 
      border: string; 
      text: string; 
      bg: string; 
      iconBg: string;
      cardBg: string; // Nouvelle propriété pour le fond de la carte
      cardBgGradient: string; // Dégradé pour le fond
    }> = {
      blue: {
        border: 'border-blue-500',
        text: 'text-blue-600',
        bg: 'bg-blue-50',
        iconBg: 'bg-blue-100',
        cardBg: 'bg-gradient-to-br from-blue-50/60 via-blue-50/40 to-blue-100/30',
        cardBgGradient: 'from-blue-50/80 via-blue-50/50 to-indigo-50/40'
      },
      orange: {
        border: 'border-orange-500',
        text: 'text-orange-600',
        bg: 'bg-orange-50',
        iconBg: 'bg-orange-100',
        cardBg: 'bg-gradient-to-br from-orange-50/60 via-orange-50/40 to-amber-50/30',
        cardBgGradient: 'from-orange-50/80 via-orange-50/50 to-amber-50/40'
      },
      green: {
        border: 'border-green-500',
        text: 'text-green-600',
        bg: 'bg-green-50',
        iconBg: 'bg-green-100',
        cardBg: 'bg-gradient-to-br from-green-50/60 via-green-50/40 to-emerald-50/30',
        cardBgGradient: 'from-green-50/80 via-green-50/50 to-emerald-50/40'
      },
      purple: {
        border: 'border-purple-500',
        text: 'text-purple-600',
        bg: 'bg-purple-50',
        iconBg: 'bg-purple-100',
        cardBg: 'bg-gradient-to-br from-purple-50/60 via-purple-50/40 to-violet-50/30',
        cardBgGradient: 'from-purple-50/80 via-purple-50/50 to-violet-50/40'
      }
    };
    return colors[couleur] || colors.blue;
  };

  return (
    <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
      {/* Motifs décoratifs subtils en arrière-plan */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        {/* Grille de points subtile */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, #2563eb 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0'
          }}
        />
        {/* Lignes diagonales très subtiles */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 20px,
              rgba(37, 99, 235, 0.02) 20px,
              rgba(37, 99, 235, 0.02) 21px
            )`
          }}
        />
        {/* Cercles concentriques subtils */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>
      
      <div className="relative z-10 flex items-center justify-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
          Indicateurs clés
        </h2>
        {isAdmin && !isDirecteur && (
          <div className="absolute right-0 flex gap-3">
            <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 border-2 border-dashed border-blue-300 rounded-lg px-4 py-2 text-blue-600 hover:bg-blue-50 transition-all duration-200 text-sm">
              <PlusCircle className="w-4 h-4" /> Ajouter
            </button>
            <button onClick={handleEdit} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-all duration-200 text-sm shadow-sm">Modifier</button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {indicateurs.map((ind, idx) => {
          const colors = getColorClasses(ind.couleur || 'blue');
          // Détecter les tendances et statuts
          const trendLower = ind.trend?.toLowerCase() || '';
          const isVeryGood = trendLower.includes('très bon') || trendLower.includes('excellent');
          const isRising = trendLower.includes('hausse') || trendLower.includes('en hausse') || trendLower.includes('↑') || trendLower.includes('augmentation');
          const isFalling = trendLower.includes('baisse') || trendLower.includes('en baisse') || trendLower.includes('↓') || trendLower.includes('diminution');
          const isPercentage = ind.valeur?.includes('%');
          
          // Calculer la largeur de la jauge (pour les pourcentages, utiliser la valeur, sinon 75%)
          const gaugeWidth = isPercentage 
            ? parseInt(ind.valeur.replace('%', '').replace(/\s/g, '')) || 75 
            : 75;
          
          return (
            <div 
              key={ind.id} 
              className={`bg-gradient-to-br ${colors.cardBgGradient} rounded-xl border ${colors.border}/30 p-4 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group relative overflow-hidden min-h-[160px] flex flex-col backdrop-blur-sm`}
              role="article"
              aria-label={`Indicateur: ${ind.titre}, valeur: ${ind.valeur}`}
              title={ind.titre}
            >
              {/* Motifs décoratifs subtils par carte */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                {/* Pattern de points selon la couleur */}
                {(() => {
                  const colorMap: Record<string, string> = {
                    blue: '#2563eb',
                    orange: '#ea580c',
                    green: '#16a34a',
                    purple: '#9333ea'
                  };
                  const dotColor = colorMap[ind.couleur || 'blue'] || '#2563eb';
                  return (
                    <div 
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0'
                      }}
                    />
                  );
                })()}
                {/* Lignes diagonales subtiles */}
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 15px,
                      rgba(0, 0, 0, 0.01) 15px,
                      rgba(0, 0, 0, 0.01) 16px
                    )`
                  }}
                />
              </div>
              
              {/* Overlay blanc très léger pour adoucir */}
              <div className="absolute inset-0 bg-white/30 pointer-events-none rounded-xl" />
              
              {/* Effet de brillance subtil au survol */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out z-20"></div>
              
              <div className="relative z-30 flex flex-col h-full">
                {/* En-tête avec icône - Positionnée en haut à droite, plus discrète */}
                <div className="flex justify-end items-start mb-2">
                  <div className={`rounded-lg p-1.5 ${colors.iconBg} flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    {iconMap[ind.icone as keyof typeof iconMap] || <TrendingUp className={`w-4 h-4 ${colors.text}`} />}
                  </div>
                </div>

                {/* Valeur principale - Mise en avant, plus grande */}
                <div className="flex items-baseline gap-2 mb-2 flex-grow justify-center">
                  <p className={`text-6xl font-bold ${colors.text} leading-none tracking-tight`}>{ind.valeur}</p>
                  {/* Icône de tendance compacte */}
                  {isRising && (
                    <ArrowUp className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                  {isFalling && (
                    <ArrowDown className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                </div>

                {/* Titre - En dessous du chiffre, avec tooltip au survol */}
                <div className="mb-2 text-center">
                  <p 
                    className="text-xs font-semibold text-gray-700 leading-tight line-clamp-2 cursor-help" 
                    title={ind.titre}
                  >
                    {ind.titre}
                  </p>
                </div>

                {/* Badge et tendance - Version compacte */}
                <div className="flex items-center justify-center gap-2 mt-auto mb-2">
                  {isVeryGood && (
                    <div className="flex items-center gap-1 bg-green-50 text-green-700 rounded-full px-2 py-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="text-xs font-medium">Très bon</span>
                    </div>
                  )}
                  {ind.trend && !isVeryGood && (
                    <div className="flex items-center gap-1">
                      {isRising ? (
                        <>
                          <ArrowUp className="w-3 h-3 text-green-600" />
                          <p className="text-xs font-medium text-green-600">
                            {ind.trend.replace(/en hausse|hausse/gi, '').trim() || 'En hausse'}
                          </p>
                        </>
                      ) : isFalling ? (
                        <>
                          <ArrowDown className="w-3 h-3 text-red-600" />
                          <p className="text-xs font-medium text-red-600">
                            {ind.trend.replace(/en baisse|baisse|diminution/gi, '').trim() || 'En baisse'}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs font-medium text-gray-600">{ind.trend}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Sparkline/Jauge miniature - Plus fine */}
                <div className="mt-auto h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(gaugeWidth, 100)}%` }}
                    aria-hidden="true"
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
        {isAdmin && !isDirecteur && (
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
