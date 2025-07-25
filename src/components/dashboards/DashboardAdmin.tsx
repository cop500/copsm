"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import { useUser } from '@/contexts/UserContext';

interface DemandeEntreprise {
  id: string;
  entreprise_nom: string;
  poste_intitule: string;
  created_at: string;
  traite_par?: string | null;
  // Ajoute d'autres champs utiles si besoin
}

const DashboardAdmin = () => {
  const [demandes, setDemandes] = useState<DemandeEntreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'business_developer';

  // Charger les demandes entreprises
  const loadDemandes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("demandes_entreprises")
      .select("id, entreprise_nom, poste_intitule, created_at, traite_par");
    if (!error) setDemandes(data || []);
    setLoading(false);
  };

  // Charger les membres de l'équipe (tous profils)
  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nom, prenom, role"); // plus de filtre sur le rôle
    if (!error) setProfiles(data || []);
  };

  // Supprimer une demande
  const handleDelete = async (demandeId: string) => {
    if (!window.confirm("Confirmer la suppression de cette demande ?")) return;
    const { error } = await supabase
      .from("demandes_entreprises")
      .delete()
      .eq("id", demandeId);
    if (!error) {
      setMessage("Demande supprimée avec succès !");
      loadDemandes();
    } else {
      setMessage("Erreur lors de la suppression.");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  useEffect(() => {
    loadDemandes();
    loadProfiles();
  }, []);

  // Assigner une demande à un membre
  const handleAssign = async (demandeId: string, userId: string) => {
    setAssigning(demandeId);
    const { error } = await supabase
      .from("demandes_entreprises")
      .update({ traite_par: userId })
      .eq("id", demandeId);
    if (!error) {
      setMessage("Demande assignée avec succès !");
      loadDemandes();
    } else {
      setMessage("Erreur lors de l'assignation.");
    }
    setAssigning(null);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-[#004080]">Gestion des demandes entreprises</h1>
      {message && <div className="mb-4 text-green-600">{message}</div>}
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <table className="w-full border bg-white rounded-xl shadow">
          <thead>
            <tr className="bg-[#f4f4f4] text-[#004080]">
              <th className="p-3 text-left">Entreprise</th>
              <th className="p-3 text-left">Poste</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Assigné à</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {demandes.map((demande) => {
              const assignedProfile = profiles.find((p) => p.id === demande.traite_par);
              return (
                <tr key={demande.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium align-top">
                    <div className="font-semibold text-base">{demande.entreprise_nom}</div>
                    <div className="text-xs text-gray-600">
                      <div><b>Poste :</b> {demande.poste_intitule}</div>
                      {demande.entreprise_ville && <div><b>Ville :</b> {demande.entreprise_ville}</div>}
                      {demande.contact_nom && <div><b>Contact :</b> {demande.contact_nom}</div>}
                      {demande.contact_email && <div><b>Email :</b> {demande.contact_email}</div>}
                      {demande.profils && Array.isArray(demande.profils) && (
                        <div className="mt-1">
                          <b>Profils :</b>
                          <ul className="list-disc ml-4">
                            {demande.profils.map((p, idx) => (
                              <li key={idx}>
                                {p.poste_intitule} | {p.pole_id} | {p.filiere_id} | {p.nb_profils} profils | {p.type_contrat} | {p.salaire}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {demande.evenement_type && <div><b>Type :</b> {demande.evenement_type}</div>}
                      {demande.evenement_date && <div><b>Date événement :</b> {demande.evenement_date}</div>}
                      {demande.fichier_url && (
                        <div><a href={demande.fichier_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Fiche de poste (PDF)</a></div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{new Date(demande.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="p-3">
                    {assignedProfile ? (
                      <span className="text-green-700 font-semibold">
                        {assignedProfile.prenom} {assignedProfile.nom}
                      </span>
                    ) : (
                      <span className="text-gray-500">Non assigné</span>
                    )}
                  </td>
                  <td className="p-3 flex gap-2 items-center">
                    {isAdmin ? (
                      <>
                        <select
                          className="border rounded px-2 py-1"
                          value={demande.traite_par || ""}
                          onChange={(e) => handleAssign(demande.id, e.target.value)}
                          disabled={assigning === demande.id}
                        >
                          <option value="">Assigner à...</option>
                          {profiles.map((profile) => (
                            <option key={profile.id} value={profile.id}>
                              {profile.prenom} {profile.nom} ({profile.role})
                            </option>
                          ))}
                        </select>
                        <button
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          onClick={() => handleDelete(demande.id)}
                          disabled={assigning === demande.id}
                        >
                          Supprimer
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400 italic">Aucune action</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DashboardAdmin;
