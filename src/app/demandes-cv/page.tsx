'use client';

import React from 'react';
import { useDemandesCV } from '@/hooks/useDemandesCV';
import DemandeCVForm from '@/components/DemandeCVForm';
import { useEntreprises } from '@/hooks/useEntreprises';
import { useSettings } from '@/hooks/useSettings';

export default function DemandesCVPage() {
  const { demandes, loading, addDemande } = useDemandesCV();
  const { entreprises, loading: loadingEntreprises } = useEntreprises();
  const { filieres, loading: loadingFilieres } = useSettings();

  const handleSave = async (formData: any) => {
    const dataToSave = { ...formData };
    if (!dataToSave.filiere_id) {
      delete dataToSave.filiere_id;
    }
    // Ajouter le nom de l'entreprise à partir de la liste des entreprises
    const selectedEntreprise = entreprises.find(e => e.id === dataToSave.entreprise_id);
    dataToSave.nom_entreprise = selectedEntreprise ? selectedEntreprise.nom : '';
    const result = await addDemande(dataToSave);
    if (result.success) {
      alert('Demande enregistrée !');
    } else {
      alert('Erreur : ' + (result.error?.message || JSON.stringify(result.error)));
    }
  };

  return (
    <div>
      <DemandeCVForm
        entreprises={entreprises.map(e => ({ id: e.id, nom: e.nom }))}
        filieres={filieres.map(f => ({ id: f.id, nom: f.nom }))}
        onSave={handleSave}
      />
      <h2 className="text-xl font-bold mt-8 mb-4">Liste des demandes de CV</h2>
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <ul>
          {demandes.map(demande => (
            <li key={demande.id}>
              {demande.entreprise_nom} – {demande.poste_recherche} ({demande.nombre_cv_souhaite} CV)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}