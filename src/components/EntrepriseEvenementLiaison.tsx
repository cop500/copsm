"use client";

import React, { useState, useEffect } from 'react';
import { useEntreprises } from '@/hooks/useEntreprises';
import { useEvenements } from '@/hooks/useEvenements';
import { useEntrepriseEvenements } from '@/hooks/useEntrepriseEvenements';
import { Plus, Users, Calendar, Building, X, Check, AlertCircle } from 'lucide-react';

const EntrepriseEvenementLiaison = () => {
  const { entreprises } = useEntreprises();
  const { evenements } = useEvenements();
  const {
    liaisons,
    loading,
    inscrireEntreprise,
    getEntreprisesParEvenement,
    modifierStatutInteret,
    supprimerLiaison,
    verifierInscription
  } = useEntrepriseEvenements();

  const [showForm, setShowForm] = useState(false);
  const [selectedEntreprise, setSelectedEntreprise] = useState('');
  const [selectedEvenement, setSelectedEvenement] = useState('');
  const [notes, setNotes] = useState('');
  const [statutInteret, setStatutInteret] = useState('Intéressé');
  const [viewMode, setViewMode] = useState<'par_evenement' | 'par_entreprise'>('par_evenement');
  const [selectedItem, setSelectedItem] = useState('');

  const statutsOptions = [
    'Intéressé',
    'Confirmé',
    'En attente',
    'Refusé',
    'Annulé'
  ];

  // Charger les liaisons selon le mode de vue
  useEffect(() => {
    if (selectedItem) {
      if (viewMode === 'par_evenement') {
        getEntreprisesParEvenement(parseInt(selectedItem));
      }
    }
  }, [selectedItem, viewMode]);

  const handleInscription = async () => {
    if (!selectedEntreprise || !selectedEvenement) {
      alert('Veuillez sélectionner une entreprise et un événement');
      return;
    }

    // Vérifier si déjà inscrit
    const verification = await verifierInscription(
      parseInt(selectedEntreprise),
      parseInt(selectedEvenement)
    );

    if (verification.success && verification.existe) {
      alert('Cette entreprise est déjà inscrite à cet événement');
      return;
    }

    const result = await inscrireEntreprise(
      parseInt(selectedEntreprise),
      parseInt(selectedEvenement),
      notes,
      statutInteret
    );

    if (result.success) {
      alert('Inscription réussie !');
      resetForm();
      // Recharger les liaisons si on visualise cet événement
      if (viewMode === 'par_evenement' && selectedItem === selectedEvenement) {
        getEntreprisesParEvenement(parseInt(selectedItem));
      }
    } else {
      alert('Erreur lors de l\'inscription');
    }
  };

  const resetForm = () => {
    setSelectedEntreprise('');
    setSelectedEvenement('');
    setNotes('');
    setStatutInteret('Intéressé');
    setShowForm(false);
  };

  const handleModifierStatut = async (liaisonId: number, nouveauStatut: string) => {
    const result = await modifierStatutInteret(liaisonId, nouveauStatut);
    
    if (result.success) {
      alert('Statut modifié avec succès !');
      // Recharger les données
      if (selectedItem) {
        getEntreprisesParEvenement(parseInt(selectedItem));
      }
    } else {
      alert('Erreur lors de la modification');
    }
  };

  const handleSupprimerLiaison = async (liaisonId: number) => {
    if (window.confirm('Supprimer cette inscription ?')) {
      const result = await supprimerLiaison(liaisonId);
      
      if (result.success) {
        alert('Inscription supprimée !');
        // Recharger les données
        if (selectedItem) {
          getEntreprisesParEvenement(parseInt(selectedItem));
        }
      } else {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'Confirmé': return 'bg-green-100 text-green-800';
      case 'Intéressé': return 'bg-blue-100 text-blue-800';
      case 'En attente': return 'bg-yellow-100 text-yellow-800';
      case 'Refusé': return 'bg-red-100 text-red-800';
      case 'Annulé': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* En-tête */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Liaisons Entreprises ↔ Événements
              </h1>
              <p className="text-gray-600 mt-1">Gérez les inscriptions des entreprises aux événements</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Inscription
            </button>
          </div>
        </div>

        {/* Formulaire d'inscription */}
        {showForm && (
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Inscrire une entreprise à un événement</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entreprise *
                </label>
                <select
                  value={selectedEntreprise}
                  onChange={(e) => setSelectedEntreprise(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une entreprise</option>
                  {entreprises.map(entreprise => (
                    <option key={entreprise.id} value={entreprise.id}>
                      {entreprise.nom} - {entreprise.contact_personne}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Événement *
                </label>
                <select
                  value={selectedEvenement}
                  onChange={(e) => setSelectedEvenement(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un événement</option>
                  {evenements.map(evenement => (
                    <option key={evenement.id} value={evenement.id}>
                      {evenement.titre} - {new Date(evenement.date_debut).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut d'intérêt
                </label>
                <select
                  value={statutInteret}
                  onChange={(e) => setStatutInteret(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {statutsOptions.map(statut => (
                    <option key={statut} value={statut}>{statut}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Notes optionnelles..."
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  onClick={handleInscription}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Inscrire
                </button>
                <button
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode de visualisation */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4 items-center">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('par_evenement')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'par_evenement'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Par Événement
              </button>
              <button
                onClick={() => setViewMode('par_entreprise')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'par_entreprise'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Par Entreprise
              </button>
            </div>

            <div className="flex-1">
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {viewMode === 'par_evenement' ? 'Sélectionner un événement' : 'Sélectionner une entreprise'}
                </option>
                {viewMode === 'par_evenement'
                  ? evenements.map(evenement => (
                      <option key={evenement.id} value={evenement.id}>
                        {evenement.titre}
                      </option>
                    ))
                  : entreprises.map(entreprise => (
                      <option key={entreprise.id} value={entreprise.id}>
                        {entreprise.nom}
                      </option>
                    ))
                }
              </select>
            </div>
          </div>
        </div>

        {/* Liste des liaisons */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : liaisons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedItem 
                ? 'Aucune inscription trouvée'
                : 'Sélectionnez un élément pour voir les inscriptions'
              }
            </div>
          ) : (
            <div className="space-y-4">
              {liaisons.map(liaison => (
                <div key={liaison.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <h4 className="font-semibold">
                          {liaison.entreprises?.nom || 'Entreprise inconnue'}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatutColor(liaison.statut_interet)}`}>
                          {liaison.statut_interet}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Contact:</strong> {liaison.entreprises?.contact_personne}</p>
                        <p><strong>Inscrit le:</strong> {new Date(liaison.date_inscription).toLocaleDateString()}</p>
                        {liaison.notes && <p><strong>Notes:</strong> {liaison.notes}</p>}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <select
                        value={liaison.statut_interet}
                        onChange={(e) => handleModifierStatut(liaison.id, e.target.value)}
                        className="text-sm px-2 py-1 border border-gray-300 rounded"
                      >
                        {statutsOptions.map(statut => (
                          <option key={statut} value={statut}>{statut}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => handleSupprimerLiaison(liaison.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntrepriseEvenementLiaison;