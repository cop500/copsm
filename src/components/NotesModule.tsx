import React, { useState } from 'react';
import { useRappels } from '@/hooks/useRappels';
import { Info } from 'lucide-react';

export default function NotesModule() {
  const { rappels, addRappel, deleteRappel, loading, error } = useRappels();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ titre: '', contenu: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAddOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre) return setFeedback('Le titre est obligatoire');
    if (editId) {
      // Edition (optionnel, à implémenter si besoin)
      setFeedback('Modification non implémentée');
      setShowModal(false);
      setEditId(null);
      setForm({ titre: '', contenu: '' });
      return;
    }
    const res = await addRappel({ titre: form.titre, contenu: form.contenu, type: 'note' });
    if (res.success) {
      setFeedback('Note ajoutée !');
      setShowModal(false);
      setForm({ titre: '', contenu: '' });
    } else {
      setFeedback(res.error || 'Erreur lors de l’ajout');
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold text-[#1D3557] tracking-wide uppercase">
          <Info className="text-blue-500 w-8 h-8" />
          Informations & Notes d’équipe
        </h2>
        <button
          onClick={() => { setShowModal(true); setEditId(null); setForm({ titre: '', contenu: '' }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold transition"
        >
          Nouvelle note
        </button>
      </div>
      {loading && <div>Chargement…</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="space-y-4">
        {rappels.length === 0 && <div className="text-gray-400 italic">Aucune note pour l’instant.</div>}
        {rappels.map(note => (
          <div key={note.id} className="bg-white border-l-4 border-blue-400 rounded-xl p-4 shadow flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Info className="text-blue-400 w-6 h-6 flex-shrink-0" />
              <div>
                <div className="font-bold text-[#1D3557] text-lg mb-1">{note.titre}</div>
                <div className="text-gray-700 whitespace-pre-line">{note.contenu}</div>
                <div className="text-xs text-gray-400 mt-2">Ajouté le {new Date(note.created_at).toLocaleDateString()}</div>
              </div>
            </div>
            <button onClick={() => deleteRappel(note.id)} className="text-gray-400 hover:text-red-600 text-xl ml-4">🗑️</button>
          </div>
        ))}
      </div>
      {/* Modale ajout/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form onSubmit={handleAddOrEdit} className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold text-[#1D3557] mb-2">{editId ? 'Modifier la note' : 'Nouvelle note'}</h3>
            <input className="border rounded p-2" placeholder="Titre" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} required />
            <textarea className="border rounded p-2" placeholder="Contenu" value={form.contenu} onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))} rows={3} />
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setShowModal(false)}>Annuler</button>
              <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Enregistrer</button>
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
    </div>
  );
} 