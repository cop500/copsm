import React, { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

const GeneralSettingsModule = () => {
  const { poles, filieres, savePole, saveFiliere, deleteItem, loading, error } = useSettings();
  const [activeTab, setActiveTab] = useState<'poles' | 'filieres'>('poles');
  const [selectedPoleId, setSelectedPoleId] = useState<string | null>(null);
  const [showPoleModal, setShowPoleModal] = useState(false);
  const [showFiliereModal, setShowFiliereModal] = useState(false);
  const [editPole, setEditPole] = useState<unknown>(null);
  const [editFiliere, setEditFiliere] = useState<unknown>(null);
  const [poleForm, setPoleForm] = useState({ nom: '', code: '', description: '', couleur: '#1D3557' });
  const [filiereForm, setFiliereForm] = useState({ nom: '', code: '', description: '', color: '#457B9D', pole_id: '' });
  const [feedback, setFeedback] = useState<string | null>(null);

  // Gestion modale pôle
  const openPoleModal = (pole?: unknown) => {
    setEditPole(pole || null);
    setPoleForm(pole ? { ...pole } : { nom: '', code: '', description: '', couleur: '#1D3557' });
    setShowPoleModal(true);
  };
  const closePoleModal = () => setShowPoleModal(false);

  // Gestion modale filière
  const openFiliereModal = (filiere?: unknown) => {
    if (!selectedPoleId && activeTab === 'filieres') {
      setFeedback('Veuillez sélectionner un pôle pour ajouter une filière.');
      return;
    }
    setEditFiliere(filiere || null);
    setFiliereForm(filiere ? { ...filiere } : { nom: '', code: '', description: '', color: '#457B9D', pole_id: selectedPoleId || '' });
    setShowFiliereModal(true);
  };
  const closeFiliereModal = () => setShowFiliereModal(false);

  // Soumission pôle
  const handlePoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await savePole(editPole ? { ...poleForm, id: (editPole as any).id } : poleForm);
    if (res.success) {
      setFeedback('Pôle enregistré avec succès');
      closePoleModal();
    } else {
      setFeedback(res.error || 'Erreur lors de la sauvegarde');
    }
  };

  // Soumission filière
  const handleFiliereSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filiereData = { ...filiereForm, pole_id: selectedPoleId };
    const res = await saveFiliere(editFiliere ? { ...filiereData, id: (editFiliere as any).id } : filiereData);
    if (res.success) {
      setFeedback('Filière enregistrée avec succès');
      closeFiliereModal();
    } else {
      setFeedback(res.error || 'Erreur lors de la sauvegarde');
    }
  };

  // Suppression
  const handleDelete = async (table: string, id: string) => {
    if (window.confirm('Confirmer la suppression ?')) {
      const res = await deleteItem(table, id);
      setFeedback(res.success ? 'Suppression réussie' : res.error);
    }
  };

  // Filtrage filières par pôle sélectionné
  const filieresFiltered = selectedPoleId ? filieres.filter(f => f.pole_id === selectedPoleId) : [];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-4xl mx-auto">
      {/* Onglets */}
      <div className="flex border-b mb-6">
        <button
          className={`px-6 py-2 font-semibold border-b-2 transition-all ${activeTab === 'poles' ? 'border-[#1D3557] text-[#1D3557] bg-gray-50' : 'border-transparent text-gray-400'}`}
          onClick={() => setActiveTab('poles')}
        >
          Pôles
        </button>
        <button
          className={`px-6 py-2 font-semibold border-b-2 transition-all ${activeTab === 'filieres' ? 'border-[#1D3557] text-[#1D3557] bg-gray-50' : 'border-transparent text-gray-400'}`}
          onClick={() => setActiveTab('filieres')}
        >
          Filières
        </button>
      </div>

      {/* Contenu Onglet Pôles */}
      {activeTab === 'poles' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#1D3557]">Liste des pôles</h2>
            <Button onClick={() => openPoleModal()} size="sm">Ajouter</Button>
          </div>
          <div className="space-y-3">
            {poles.length === 0 && <div className="text-gray-400 italic">Aucun pôle enregistré.</div>}
            {poles.map(pole => (
              <Card key={pole.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full" style={{ background: pole.couleur || '#1D3557' }} />
                  <span className="font-semibold text-[#1D3557]">{pole.nom}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openPoleModal(pole)}><span className="sr-only">Modifier</span>✏️</Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete('poles', pole.id)}><span className="sr-only">Supprimer</span>🗑️</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Contenu Onglet Filières */}
      {activeTab === 'filieres' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#1D3557]">Liste des filières</h2>
              <select
                className="ml-4 px-2 py-1 border rounded text-sm"
                value={selectedPoleId || ''}
                onChange={e => setSelectedPoleId(e.target.value || null)}
              >
                <option value="">-- Filtrer par pôle --</option>
                {poles.map(pole => (
                  <option key={pole.id} value={pole.id}>{pole.nom}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => openFiliereModal()} size="sm" disabled={!selectedPoleId}>Ajouter</Button>
          </div>
          <div className="space-y-3">
            {selectedPoleId && filieresFiltered.length === 0 && <div className="text-gray-400 italic">Aucune filière pour ce pôle.</div>}
            {!selectedPoleId && <div className="text-gray-400 italic">Sélectionnez un pôle pour afficher ses filières.</div>}
            {filieresFiltered.map(filiere => (
              <Card key={filiere.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full" style={{ background: filiere.color || '#457B9D' }} />
                  <span className="font-semibold text-[#222222]">{filiere.nom || filiere.name || JSON.stringify(filiere)}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openFiliereModal(filiere)}><span className="sr-only">Modifier</span>✏️</Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete('filieres', filiere.id)}><span className="sr-only">Supprimer</span>🗑️</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modale Pôle */}
      {showPoleModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form onSubmit={handlePoleSubmit} className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold text-[#1D3557] mb-2">{editPole ? 'Modifier le pôle' : 'Ajouter un pôle'}</h3>
            <Input placeholder="Nom du pôle" value={poleForm.nom} onChange={e => setPoleForm(f => ({ ...f, nom: e.target.value }))} required />
            <Input placeholder="Code" value={poleForm.code} onChange={e => setPoleForm(f => ({ ...f, code: e.target.value }))} />
            <Input placeholder="Description" value={poleForm.description} onChange={e => setPoleForm(f => ({ ...f, description: e.target.value }))} />
            <Input type="color" value={poleForm.couleur} onChange={e => setPoleForm(f => ({ ...f, couleur: e.target.value }))} />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={closePoleModal}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </div>
      )}
      {/* Modale Filière */}
      {showFiliereModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form onSubmit={handleFiliereSubmit} className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold text-[#1D3557] mb-2">{editFiliere ? 'Modifier la filière' : 'Ajouter une filière'}</h3>
            <Input placeholder="Nom de la filière" value={filiereForm.nom} onChange={e => setFiliereForm(f => ({ ...f, nom: e.target.value }))} required />
            <Input placeholder="Code" value={filiereForm.code} onChange={e => setFiliereForm(f => ({ ...f, code: e.target.value }))} />
            <Input placeholder="Description" value={filiereForm.description} onChange={e => setFiliereForm(f => ({ ...f, description: e.target.value }))} />
            <Input type="color" value={filiereForm.color} onChange={e => setFiliereForm(f => ({ ...f, color: e.target.value }))} />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={closeFiliereModal}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </div>
      )}
      {/* Feedback utilisateur */}
      {feedback && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-[#1D3557] text-[#1D3557] px-6 py-3 rounded-xl shadow-xl z-50">
          {feedback}
          <button className="ml-4 text-sm text-gray-400" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}
      {/* Loading */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl">Chargement...</div>
        </div>
      )}
      {/* Erreur */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-xl shadow-xl z-50">
          {error}
          <button className="ml-4 text-sm text-gray-400" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}
    </div>
  );
};

export default GeneralSettingsModule;