"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import { useUser } from '@/contexts/UserContext';

interface DemandeEntreprise {
  id: string;
  secteur: string;
  entreprise_nom: string;
  entreprise_adresse: string;
  entreprise_ville: string;
  entreprise_email: string;
  contact_nom: string;
  contact_email: string;
  contact_tel: string;
  profils: any[];
  evenement_type: string;
  evenement_date?: string;
  fichier_url?: string;
  type_demande: string;
  created_at: string;
  traite_par?: string | null;
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
      .select("*")
      .order("created_at", { ascending: false });
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

  const [selectedDemande, setSelectedDemande] = useState<DemandeEntreprise | null>(null);

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-0">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-[#004080]">Gestion des demandes entreprises</h1>
      {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{message}</div>}
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004080] mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des demandes...</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {demandes.map((demande) => {
            const assignedProfile = profiles.find((p) => p.id === demande.traite_par);
            const isExpanded = selectedDemande?.id === demande.id;
                return (
                  <div key={demande.id} className="bg-white rounded-xl shadow-lg border border-gray-200">
                    {/* En-tête de la demande */}
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
                        <div>
                          <h3 className="text-xl font-bold text-[#004080]">{demande.entreprise_nom}</h3>
                          <p className="text-gray-600 mt-1">{demande.secteur}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Demande reçue le {new Date(demande.created_at).toLocaleDateString("fr-FR", {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => setSelectedDemande(isExpanded ? null : demande)}
                            className="px-4 py-2 bg-[#004080] text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                          >
                            {isExpanded ? "Masquer détails" : "Voir détails"}
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(demande.id)}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm sm:text-base"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Détails de la demande */}
                    {isExpanded && (
                      <div className="p-4 sm:p-6 bg-gray-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                          {/* Informations entreprise */}
                          <div>
                            <h4 className="text-lg font-semibold text-[#004080] mb-4">Informations entreprise</h4>
                            <div className="space-y-3">
                              <div>
                                <span className="font-medium">Adresse :</span>
                                <p className="text-gray-700">{demande.entreprise_adresse}</p>
                              </div>
                              <div>
                                <span className="font-medium">Ville :</span>
                                <p className="text-gray-700">{demande.entreprise_ville}</p>
                              </div>
                              <div>
                                <span className="font-medium">Email :</span>
                                <p className="text-gray-700">{demande.entreprise_email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Contact */}
                          <div>
                            <h4 className="text-lg font-semibold text-[#004080] mb-4">Contact</h4>
                            <div className="space-y-3">
                              <div>
                                <span className="font-medium">Nom :</span>
                                <p className="text-gray-700">{demande.contact_nom}</p>
                              </div>
                              <div>
                                <span className="font-medium">Email :</span>
                                <p className="text-gray-700">{demande.contact_email}</p>
                              </div>
                              <div>
                                <span className="font-medium">Téléphone :</span>
                                <p className="text-gray-700">{demande.contact_tel}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Profils demandés */}
                        <div className="mt-8">
                          <h4 className="text-lg font-semibold text-[#004080] mb-4">Profils demandés</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {demande.profils && demande.profils.map((profil: any, index: number) => (
                              <div key={index} className="bg-white p-4 rounded-lg border">
                                <h5 className="font-semibold text-[#004080] mb-2">Profil {index + 1}</h5>
                                <div className="space-y-2 text-sm">
                                  <p><span className="font-medium">Poste :</span> {profil.poste_intitule}</p>
                                  <p><span className="font-medium">Description :</span> {profil.poste_description}</p>
                                  <p><span className="font-medium">Nombre :</span> {profil.nb_profils}</p>
                                  <p><span className="font-medium">Type contrat :</span> {profil.type_contrat}</p>
                                  <p><span className="font-medium">Salaire :</span> {profil.salaire}</p>
                                  <p><span className="font-medium">Durée :</span> {profil.duree}</p>
                                  <p><span className="font-medium">Compétences :</span> {profil.competences}</p>
                                  <p><span className="font-medium">Date début :</span> {profil.date_debut}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Événement et fichier */}
                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div>
                            <h4 className="text-lg font-semibold text-[#004080] mb-4">Événement</h4>
                            <div className="space-y-3">
                              <div>
                                <span className="font-medium">Type :</span>
                                <p className="text-gray-700">
                                  {demande.evenement_type === 'jobday' ? 'Job Day' : 'Demande de CV'}
                                </p>
                              </div>
                              {demande.evenement_date && (
                                <div>
                                  <span className="font-medium">Date souhaitée :</span>
                                  <p className="text-gray-700">{new Date(demande.evenement_date).toLocaleDateString("fr-FR")}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {demande.fichier_url && (
                            <div>
                              <h4 className="text-lg font-semibold text-[#004080] mb-4">Fichier joint</h4>
                              <a
                                href={demande.fichier_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              >
                                📎 Voir le fichier
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Assignation (admin seulement) */}
                        {isAdmin && (
                          <div className="mt-8 pt-6 border-t border-gray-200">
                            <h4 className="text-lg font-semibold text-[#004080] mb-4">Assignation</h4>
                            <div className="flex items-center gap-4">
                              <span className="font-medium">Assigné à :</span>
                              <select
                                value={demande.traite_par || ""}
                                onChange={(e) => handleAssign(demande.id, e.target.value)}
                                disabled={assigning === demande.id}
                                className="border rounded-lg px-3 py-2"
                              >
                                <option value="">Non assigné</option>
                                {profiles.map((profile) => (
                                  <option key={profile.id} value={profile.id}>
                                    {profile.prenom} {profile.nom} ({profile.role})
                                  </option>
                                ))}
                              </select>
                              {assigning === demande.id && (
                                <span className="text-sm text-gray-500">Assignation en cours...</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
            })}
          </div>
        )}
      </div>
    );
};

export default DashboardAdmin;
