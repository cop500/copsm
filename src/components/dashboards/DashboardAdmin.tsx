"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import { useUser } from '@/contexts/UserContext';
import { useSettings } from '@/hooks/useSettings';
import { MessageSquare, Send, User, Calendar, Download, Printer, Trash2 } from 'lucide-react';
import { downloadDemandePDF, printDemande } from '@/components/ui/PDFGenerator';

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
  statut?: string;
}

const STATUTS = [
  { value: 'en_attente', label: 'En attente', color: 'bg-gray-400' },
  { value: 'en_cours', label: 'En cours', color: 'bg-blue-500' },
  { value: 'terminee', label: 'Terminée', color: 'bg-green-500' },
  { value: 'refusee', label: 'Refusée', color: 'bg-red-500' },
  { value: 'annulee', label: 'Annulée', color: 'bg-yellow-500' },
];

const DashboardAdmin = () => {
  const [demandes, setDemandes] = useState<DemandeEntreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [selectedDemande, setSelectedDemande] = useState<DemandeEntreprise | null>(null);
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'business_developer';
  const isDirecteur = currentUser?.role === 'directeur';
  const { poles, filieres, loading: loadingSettings } = useSettings();
  
  // États pour les commentaires
  const [commentaires, setCommentaires] = useState<any[]>([]);
  const [nouveauCommentaire, setNouveauCommentaire] = useState('');
  const [loadingCommentaires, setLoadingCommentaires] = useState(false);
  
  // États pour les filtres et statistiques
  const [filterStatut, setFilterStatut] = useState<string>('tous');
  const [statistiques, setStatistiques] = useState<{[key: string]: any}>({});
  const [updatingStats, setUpdatingStats] = useState<string | null>(null);
  const [editingStats, setEditingStats] = useState<string | null>(null);
  const [tempStats, setTempStats] = useState<{[key: string]: any}>({});
  
  // États pour les notifications
  const [notifications, setNotifications] = useState<any[]>([]);

  // Charger les demandes entreprises
  const loadDemandes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("demandes_entreprises")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error) {
      setDemandes(data || []);
    }
    setLoading(false);
  };

  // Charger les membres de l'équipe (tous profils)
  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nom, prenom, role");
    
    if (!error) {
      setProfiles(data || []);
    }
  };

  // Supprimer une demande
  const handleDelete = async (demandeId: string) => {
    if (!window.confirm("Confirmer la suppression de cette demande ?")) return;
    
    try {
      const { error } = await supabase
        .from("demandes_entreprises")
        .delete()
        .eq("id", demandeId);
      
      if (!error) {
        setDemandes(prev => prev.filter(d => d.id !== demandeId));
        setMessage("Demande supprimée avec succès.");
      } else {
        setMessage("Erreur lors de la suppression.");
      }
    } catch (error) {
      setMessage("Erreur lors de la suppression.");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  useEffect(() => {
    // Charger toutes les données en parallèle pour améliorer les performances
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [demandesResult, profilesResult, notificationsResult] = await Promise.all([
          supabase.from("demandes_entreprises").select("*").order("created_at", { ascending: false }),
          supabase.from("profiles").select("id, nom, prenom, role"),
          supabase.from('notifications_demandes').select(`
            *,
            demande:demandes_entreprises(entreprise_nom, statut)
          `).order('created_at', { ascending: false })
        ]);

        if (!demandesResult.error) setDemandes(demandesResult.data || []);
        if (!profilesResult.error) setProfiles(profilesResult.data || []);
        if (!notificationsResult.error) setNotifications(notificationsResult.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Assigner une demande à un membre
  const handleAssign = async (demandeId: string, userId: string) => {
    setAssigning(demandeId);
    
    // Mise à jour optimiste
    setDemandes(prev => prev.map(d => 
      d.id === demandeId ? { ...d, traite_par: userId } : d
    ));
    
    try {
      const { error } = await supabase
        .from("demandes_entreprises")
        .update({ traite_par: userId })
        .eq("id", demandeId);
      
      if (!error) {
        setMessage("Demande assignée avec succès.");
      } else {
        setMessage("Erreur lors de l'assignation.");
      }
    } catch (error) {
      setMessage("Erreur lors de l'assignation.");
    }
    setAssigning(null);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleStatutChange = async (demandeId: string, newStatut: string) => {
    // Mise à jour optimiste
    setDemandes(prev => prev.map(d => 
      d.id === demandeId ? { ...d, statut: newStatut } : d
    ));
    
    try {
      const { error } = await supabase
        .from("demandes_entreprises")
        .update({ statut: newStatut })
        .eq("id", demandeId);
      
      if (!error) {
        setMessage("Statut mis à jour avec succès.");
      } else {
        setMessage("Erreur lors de la mise à jour du statut.");
      }
    } catch (error) {
      setMessage("Erreur lors de la mise à jour du statut.");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  // Charger les commentaires d'une demande
  const loadCommentaires = async (demandeId: string) => {
    try {
      setLoadingCommentaires(true);
      
      const { data, error } = await supabase
        .from('commentaires_demandes_entreprises')
        .select('*')
        .eq('demande_id', demandeId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setCommentaires(data || []);
    } catch (err: any) {
      console.error('Erreur chargement commentaires:', err);
      setMessage('Erreur lors du chargement des commentaires');
    } finally {
      setLoadingCommentaires(false);
    }
  };

  // Ajouter un commentaire
  const ajouterCommentaire = async (demandeId: string) => {
    if (!nouveauCommentaire.trim()) return;

    try {
      const { error } = await supabase
        .from('commentaires_demandes_entreprises')
        .insert([{
          demande_id: demandeId,
          contenu: nouveauCommentaire.trim(),
          auteur: currentUser?.email || 'Utilisateur COP',
          auteur_id: currentUser?.id
        }]);
      
      if (error) throw error;
      
      setNouveauCommentaire('');
      await loadCommentaires(demandeId);
      setMessage('Commentaire ajouté avec succès!');
    } catch (err: any) {
      console.error('Erreur ajout commentaire:', err);
      setMessage('Erreur lors de l\'ajout du commentaire');
    }
    setTimeout(() => setMessage(""), 3000);
  };

  // Supprimer un commentaire
  const supprimerCommentaire = async (commentaireId: string, demandeId: string) => {
    if (!isAdmin) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;

    try {
      const { error } = await supabase
        .from('commentaires_demandes_entreprises')
        .delete()
        .eq('id', commentaireId);
      
      if (error) throw error;
      
      await loadCommentaires(demandeId);
      setMessage('Commentaire supprimé avec succès !');
    } catch (err: any) {
      console.error('Erreur suppression commentaire:', err);
      setMessage('Erreur lors de la suppression du commentaire');
    }
    setTimeout(() => setMessage(""), 3000);
  };

  // Charger les statistiques d'une demande
  const loadStatistiques = async (demandeId: string) => {
    try {
      const { data, error } = await supabase
        .from('statistiques_demandes')
        .select('*')
        .eq('demande_id', demandeId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Pas de données trouvées - c'est normal pour une nouvelle demande
          return;
        }
        console.error('❌ Erreur lors du chargement des statistiques:', error);
        throw error;
      }
      
      if (data) {
        setStatistiques(prev => ({ ...prev, [demandeId]: data }));
      }
    } catch (err: any) {
      console.error('💥 Erreur chargement statistiques:', err);
    }
  };

  // Mettre à jour les statistiques
  const updateStatistiques = async (demandeId: string, stats: any) => {
    setUpdatingStats(demandeId);
    try {
      // Vérifier d'abord si des statistiques existent déjà
      const { data: existingStats, error: checkError } = await supabase
        .from('statistiques_demandes')
        .select('*')
        .eq('demande_id', demandeId)
        .maybeSingle();
      
      let result;
      if (existingStats) {
        // Mettre à jour les statistiques existantes
        result = await supabase
          .from('statistiques_demandes')
          .update({
            nombre_candidats: stats.nombre_candidats || 0,
            nombre_candidats_retenus: stats.nombre_candidats_retenus || 0,
            nombre_candidats_embauches: stats.nombre_candidats_embauches || 0,
            updated_at: new Date().toISOString()
          })
          .eq('demande_id', demandeId)
          .select();
      } else {
        // Insérer de nouvelles statistiques
        result = await supabase
          .from('statistiques_demandes')
          .insert({
            demande_id: demandeId,
            nombre_candidats: stats.nombre_candidats || 0,
            nombre_candidats_retenus: stats.nombre_candidats_retenus || 0,
            nombre_candidats_embauches: stats.nombre_candidats_embauches || 0
          })
          .select();
      }
      
      if (result.error) {
        console.error('❌ Erreur lors de l\'opération:', result.error);
        throw result.error;
      }
      
      setStatistiques(prev => ({ ...prev, [demandeId]: { demande_id: demandeId, ...stats } }));
      setEditingStats(null);
      setTempStats(prev => ({ ...prev, [demandeId]: {} }));
      setMessage('Statistiques mises à jour !');
    } catch (err: any) {
      console.error('💥 Erreur mise à jour statistiques:', err);
      setMessage('Erreur lors de la mise à jour des statistiques');
    }
    setUpdatingStats(null);
    setTimeout(() => setMessage(""), 3000);
  };

  // Modifier les statistiques
  const editStatistiques = (demandeId: string) => {
    setEditingStats(demandeId);
    setTempStats(prev => ({ ...prev, [demandeId]: { ...statistiques[demandeId] } }));
  };

  // Annuler la modification
  const cancelEditStatistiques = (demandeId: string) => {
    setEditingStats(null);
    setTempStats(prev => ({ ...prev, [demandeId]: {} }));
  };

  // Supprimer les statistiques (admin seulement)
  const deleteStatistiques = async (demandeId: string) => {
    if (!isAdmin) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ces statistiques ?')) return;
    
    setUpdatingStats(demandeId);
    try {
      const { error } = await supabase
        .from('statistiques_demandes')
        .delete()
        .eq('demande_id', demandeId);
      
      if (error) throw error;
      
      setStatistiques(prev => {
        const newStats = { ...prev };
        delete newStats[demandeId];
        return newStats;
      });
      setMessage('Statistiques supprimées !');
    } catch (err: any) {
      console.error('Erreur suppression statistiques:', err);
      setMessage('Erreur lors de la suppression des statistiques');
    }
    setUpdatingStats(null);
    setTimeout(() => setMessage(""), 3000);
  };

  // Charger les notifications
  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications_demandes')
        .select(`
          *,
          demande:demandes_entreprises(entreprise_nom, statut)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (err: any) {
      console.error('Erreur chargement notifications:', err);
    }
  };

  // Supprimer une notification
  const supprimerNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications_demandes')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
      await loadNotifications();
    } catch (err: any) {
      console.error('Erreur suppression notification:', err);
    }
  };

  // Télécharger PDF de la demande
  const handleDownloadPDF = async (demande: DemandeEntreprise) => {
    try {
      const commentairesDemande = commentaires.filter(c => c.demande_id === demande.id);
      const statistiquesDemande = statistiques[demande.id] || null;
      
      // Traiter les profils pour récupérer les noms
      const profilsTraites = demande.profils.map((profil: any) => {
        if (profil && typeof profil === 'object' && profil.pole_id) {
          // Chercher le nom du pôle dans les settings
          const pole = poles?.find((p: any) => p.id === profil.pole_id);
          // Chercher la filière si disponible
          const filiere = filieres?.find((f: any) => f.id === profil.filiere_id);
          // Chercher le poste si disponible
          const poste = profil.poste || profil.titre || profil.fonction || '';
          
          return {
            ...profil,
            nom: pole?.nom || `Pôle ${profil.pole_id}`,
            filiere: filiere?.nom || profil.filiere || 'Non spécifiée',
            poste: poste,
            duree: profil.duree || 'Non spécifiée',
            salaire: profil.salaire || 'Non spécifié'
          };
        }
        return profil;
      });
      
      // Créer une copie de la demande avec les profils traités
      const demandeTraitee = {
        ...demande,
        profils: profilsTraites
      };
      
      await downloadDemandePDF(demandeTraitee, commentairesDemande, statistiquesDemande);
      setMessage('PDF téléchargé avec succès !');
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      setMessage('Erreur lors du téléchargement du PDF');
    }
    setTimeout(() => setMessage(""), 3000);
  };

  // Imprimer la demande
  const handlePrint = (demande: DemandeEntreprise) => {
    try {
      const commentairesDemande = commentaires.filter(c => c.demande_id === demande.id);
      const statistiquesDemande = statistiques[demande.id] || null;
      
      // Traiter les profils pour récupérer les noms
      const profilsTraites = demande.profils.map((profil: any) => {
        if (profil && typeof profil === 'object' && profil.pole_id) {
          // Chercher le nom du pôle dans les settings
          const pole = poles?.find((p: any) => p.id === profil.pole_id);
          // Chercher la filière si disponible
          const filiere = filieres?.find((f: any) => f.id === profil.filiere_id);
          // Chercher le poste si disponible
          const poste = profil.poste || profil.titre || profil.fonction || '';
          
          return {
            ...profil,
            nom: pole?.nom || `Pôle ${profil.pole_id}`,
            filiere: filiere?.nom || profil.filiere || 'Non spécifiée',
            poste: poste,
            duree: profil.duree || 'Non spécifiée',
            salaire: profil.salaire || 'Non spécifié'
          };
        }
        return profil;
      });
      
      // Créer une copie de la demande avec les profils traités
      const demandeTraitee = {
        ...demande,
        profils: profilsTraites
      };
      
      printDemande(demandeTraitee, commentairesDemande, statistiquesDemande);
      setMessage('Impression lancée !');
    } catch (error) {
      console.error('Erreur impression:', error);
      setMessage('Erreur lors de l\'impression');
    }
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-0">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-[#004080]">Gestion des demandes entreprises</h1>
      {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{message}</div>}
      
      {/* Section Notifications */}
      {notifications.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Notifications récentes
          </h2>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="flex items-center justify-between bg-white p-3 rounded border">
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{notification.demande?.entreprise_nom}</span> - {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => supprimerNotification(notification.id)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Supprimer la notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004080] focus:border-transparent"
        >
          <option value="tous">Tous les statuts</option>
          {STATUTS.map((statut) => (
            <option key={statut.value} value={statut.value}>
              {statut.label}
            </option>
          ))}
        </select>
      </div>

      {/* Liste des demandes */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004080] mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des demandes...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {demandes
            .filter(demande => filterStatut === 'tous' || demande.statut === filterStatut)
            .map((demande) => {
              const assignedProfile = profiles.find(p => p.id === demande.traite_par);
              const currentStatut = STATUTS.find(s => s.value === demande.statut);
              
              return (
                <div key={demande.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{demande.entreprise_nom}</h3>
                        {currentStatut && (
                          <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${currentStatut.color}`}>
                            {currentStatut.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Secteur:</strong> {demande.secteur}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Contact:</strong> {demande.contact_nom} ({demande.contact_email})
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Date:</strong> {new Date(demande.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
                      <button
                        onClick={() => {
                          if (selectedDemande?.id === demande.id) {
                            setSelectedDemande(null);
                          } else {
                            setSelectedDemande(demande);
                            loadCommentaires(demande.id);
                            loadStatistiques(demande.id);
                          }
                        }}
                        className="px-4 py-2 bg-[#004080] text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                      >
                        {selectedDemande?.id === demande.id ? 'Masquer détails' : 'Voir détails'}
                      </button>
                      
                      {!isDirecteur && (
                        <button
                          onClick={() => handleDelete(demande.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm sm:text-base"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedDemande?.id === demande.id && (
                    <div className="border-t border-gray-200 pt-6">
                      {/* Informations détaillées */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="text-md font-semibold text-[#004080] mb-3">Informations entreprise</h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>Adresse:</strong> {demande.entreprise_adresse}</p>
                            <p><strong>Ville:</strong> {demande.entreprise_ville}</p>
                            <p><strong>Email:</strong> {demande.entreprise_email}</p>
                            <p><strong>Téléphone:</strong> {demande.contact_tel}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-md font-semibold text-[#004080] mb-3">Détails de la demande</h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>Type:</strong> {demande.type_demande}</p>
                            <p><strong>Événement:</strong> {demande.evenement_type}</p>
                            {demande.evenement_date && (
                              <p><strong>Date événement:</strong> {new Date(demande.evenement_date).toLocaleDateString('fr-FR')}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Profils demandés et Commentaires */}
                      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Profils demandés */}
                        <div>
                          <h4 className="text-lg font-semibold text-[#004080] mb-4 flex items-center">
                            <User className="w-5 h-5 mr-2" />
                            Profils demandés
                          </h4>
                          <div className="space-y-3">
                            {demande.profils.map((profil, index) => (
                              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                                  {profil.pole_id && (
                                    <div>
                                      <strong>Pôle:</strong> {poles?.find(p => p.id === profil.pole_id)?.nom || `Pôle ${profil.pole_id}`}
                                    </div>
                                  )}
                                  {profil.filiere && (
                                    <div>
                                      <strong>Filière:</strong> {profil.filiere}
                                    </div>
                                  )}
                                  {profil.poste && (
                                    <div>
                                      <strong>Poste:</strong> {profil.poste}
                                    </div>
                                  )}
                                </div>
                                {(profil.duree || profil.salaire) && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                    {profil.duree && (
                                      <div>
                                        <strong>Durée:</strong> {profil.duree}
                                      </div>
                                    )}
                                    {profil.salaire && (
                                      <div>
                                        <strong>Salaire:</strong> {profil.salaire}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Section Commentaires - Masquée pour le directeur */}
                        {!isDirecteur && (
                          <div>
                            <h4 className="text-lg font-semibold text-[#004080] mb-4 flex items-center">
                              <MessageSquare className="w-5 h-5 mr-2" />
                              Commentaires
                            </h4>
                            
                            {/* Liste des commentaires */}
                            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                              {loadingCommentaires ? (
                                <div className="text-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#004080] mx-auto"></div>
                                  <p className="text-sm text-gray-500 mt-2">Chargement des commentaires...</p>
                                </div>
                              ) : commentaires.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">Aucun commentaire pour le moment</p>
                              ) : (
                                commentaires.map((commentaire) => (
                                  <div key={commentaire.id} className="bg-white border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm font-medium text-gray-700">{commentaire.auteur}</span>
                                          <span className="text-xs text-gray-500">
                                            {new Date(commentaire.created_at).toLocaleDateString('fr-FR', {
                                              day: '2-digit',
                                              month: '2-digit',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-600">{commentaire.contenu}</p>
                                      </div>
                                      {isAdmin && !isDirecteur && (
                                        <button
                                          onClick={() => supprimerCommentaire(commentaire.id, demande.id)}
                                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                          title="Supprimer ce commentaire"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                            
                            {/* Formulaire d'ajout de commentaire */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="flex items-end gap-2">
                                <div className="flex-1">
                                  <textarea
                                    value={nouveauCommentaire}
                                    onChange={(e) => setNouveauCommentaire(e.target.value)}
                                    placeholder="Ajouter un commentaire..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004080] focus:border-transparent resize-none"
                                    rows={3}
                                  />
                                </div>
                                <button
                                  onClick={() => ajouterCommentaire(demande.id)}
                                  disabled={!nouveauCommentaire.trim()}
                                  className="px-4 py-2 bg-[#004080] text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Section Statistiques - Masquée pour le directeur */}
                      {!isDirecteur && (
                        <div className="mt-8">
                          <h4 className="text-lg font-semibold text-[#004080] mb-4">
                            Statistiques
                            {process.env.NODE_ENV === 'development' && (
                              <span className="text-xs text-gray-500 ml-2">
                                (Debug: {statistiques[demande.id] ? 'Avec données' : 'Sans données'})
                              </span>
                            )}
                          </h4>
                          <div className="bg-white p-6 rounded-lg border border-gray-200">
                            {editingStats === demande.id ? (
                              // Mode édition
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Nombre de candidats
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={tempStats[demande.id]?.nombre_candidats || ''}
                                      onChange={(e) => {
                                        const newStats = { ...tempStats[demande.id], nombre_candidats: parseInt(e.target.value) || 0 };
                                        setTempStats(prev => ({ ...prev, [demande.id]: newStats }));
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004080] focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Candidats retenus
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={tempStats[demande.id]?.nombre_candidats_retenus || ''}
                                      onChange={(e) => {
                                        const newStats = { ...tempStats[demande.id], nombre_candidats_retenus: parseInt(e.target.value) || 0 };
                                        setTempStats(prev => ({ ...prev, [demande.id]: newStats }));
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004080] focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Candidats embauchés
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={tempStats[demande.id]?.nombre_candidats_embauches || ''}
                                      onChange={(e) => {
                                        const newStats = { ...tempStats[demande.id], nombre_candidats_embauches: parseInt(e.target.value) || 0 };
                                        setTempStats(prev => ({ ...prev, [demande.id]: newStats }));
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004080] focus:border-transparent"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => updateStatistiques(demande.id, tempStats[demande.id])}
                                    disabled={updatingStats === demande.id}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                                  >
                                    {updatingStats === demande.id ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Sauvegarde...
                                      </>
                                    ) : (
                                      'Sauvegarder'
                                    )}
                                  </button>
                                  <button
                                    onClick={() => cancelEditStatistiques(demande.id)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Mode affichage
                              <div className="space-y-4">
                                {statistiques[demande.id] ? (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-blue-600">
                                        {statistiques[demande.id].nombre_candidats || 0}
                                      </div>
                                      <div className="text-sm text-gray-600">Candidats</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-yellow-600">
                                        {statistiques[demande.id].nombre_candidats_retenus || 0}
                                      </div>
                                      <div className="text-sm text-gray-600">Retenus</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-green-600">
                                        {statistiques[demande.id].nombre_candidats_embauches || 0}
                                      </div>
                                      <div className="text-sm text-gray-600">Embauchés</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-4">
                                    <p className="text-gray-500 mb-4">Aucune statistique disponible</p>
                                    <button
                                      onClick={() => editStatistiques(demande.id)}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                      Ajouter des statistiques
                                    </button>
                                  </div>
                                )}
                                
                                {statistiques[demande.id] && (
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => editStatistiques(demande.id)}
                                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                    >
                                      Modifier
                                    </button>
                                    {isAdmin && !isDirecteur && (
                                      <button
                                        onClick={() => deleteStatistiques(demande.id)}
                                        disabled={updatingStats === demande.id}
                                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:bg-gray-300"
                                      >
                                        {updatingStats === demande.id ? 'Suppression...' : 'Supprimer'}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex flex-wrap gap-3">
                          {!isDirecteur ? (
                            <select
                              value={demande.statut || 'en_attente'}
                              onChange={(e) => handleStatutChange(demande.id, e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004080] focus:border-transparent"
                            >
                              {STATUTS.map((statut) => (
                                <option key={statut.value} value={statut.value}>
                                  {statut.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg">
                              <span className="font-medium">Statut :</span> {currentStatut?.label || 'En attente'}
                            </div>
                          )}
                          
                          {!isDirecteur && (
                            <button
                              onClick={() => handleDownloadPDF(demande)}
                              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-1"
                              title="Télécharger PDF"
                            >
                              <Download className="w-4 h-4" />
                              PDF
                            </button>
                          )}
                          
                          <button
                            onClick={() => handlePrint(demande)}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-1"
                            title="Imprimer"
                          >
                            <Printer className="w-4 h-4" />
                            Imprimer
                          </button>
                        </div>
                        
                        {/* Section Suivi du dossier - Masquée pour le directeur */}
                        {!isDirecteur && (
                          <>
                            {demande.traite_par ? (
                              <div className="mt-8 pt-6 border-t border-gray-200">
                                <h4 className="text-lg font-semibold text-[#004080] mb-4">Suivi du dossier</h4>
                                <div className="flex items-center gap-4">
                                  <span className="font-medium">Suivi par :</span>
                                  <span className="text-gray-800 font-semibold">
                                    {assignedProfile ? `${assignedProfile.prenom} ${assignedProfile.nom}` : <span className="text-gray-400">Non suivi</span>}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-8 pt-6 border-t border-gray-200">
                                <h4 className="text-lg font-semibold text-[#004080] mb-4">Suivi du dossier</h4>
                                <div className="flex items-center gap-4">
                                  <span className="font-medium">Suivi par :</span>
                                  <select
                                    value={demande.traite_par || ""}
                                    onChange={(e) => handleAssign(demande.id, e.target.value)}
                                    disabled={assigning === demande.id}
                                    className="border rounded-lg px-3 py-2"
                                  >
                                    <option value="">Non suivi</option>
                                    {profiles.map((profile) => (
                                      <option key={profile.id} value={profile.id}>
                                        {profile.prenom} {profile.nom} ({profile.role})
                                      </option>
                                    ))}
                                  </select>
                                  {assigning === demande.id && (
                                    <span className="text-sm text-gray-500">Mise à jour...</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
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