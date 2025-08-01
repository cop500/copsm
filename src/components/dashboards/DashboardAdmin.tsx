"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import { useUser } from '@/contexts/UserContext';
import { useSettings } from '@/hooks/useSettings';
import { MessageSquare, Send, User, Calendar, Download, Printer } from 'lucide-react';
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
  statut?: string; // Ajout du statut
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
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'business_developer';
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
    loadNotifications();
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

  const handleStatutChange = async (demandeId: string, newStatut: string) => {
    const { error } = await supabase
      .from('demandes_entreprises')
      .update({ statut: newStatut })
      .eq('id', demandeId);
    if (!error) {
      setMessage('Statut mis à jour !');
      loadDemandes();
    } else {
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
          console.log('Aucune statistique trouvée pour la demande:', demandeId);
          return;
        }
        throw error;
      }
      
      if (data) {
        setStatistiques(prev => ({ ...prev, [demandeId]: data }));
        console.log('Statistiques chargées:', data);
      }
    } catch (err: any) {
      console.error('Erreur chargement statistiques:', err);
    }
  };

  // Mettre à jour les statistiques
  const updateStatistiques = async (demandeId: string, stats: any) => {
    setUpdatingStats(demandeId);
    try {
      const { error } = await supabase
        .from('statistiques_demandes')
        .upsert({
          demande_id: demandeId,
          ...stats
        });
      
      if (error) throw error;
      
      setStatistiques(prev => ({ ...prev, [demandeId]: { demande_id: demandeId, ...stats } }));
      setEditingStats(null);
      setTempStats(prev => ({ ...prev, [demandeId]: {} }));
      setMessage('Statistiques mises à jour !');
    } catch (err: any) {
      console.error('Erreur mise à jour statistiques:', err);
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
      
      await downloadDemandePDF(demande, commentairesDemande, statistiquesDemande);
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
      
      printDemande(demande, commentairesDemande, statistiquesDemande);
      setMessage('Impression lancée !');
    } catch (error) {
      console.error('Erreur impression:', error);
      setMessage('Erreur lors de l\'impression');
    }
    setTimeout(() => setMessage(""), 3000);
  };

  // Charger les nouvelles demandes




  const [selectedDemande, setSelectedDemande] = useState<DemandeEntreprise | null>(null);

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-0">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-[#004080]">Gestion des demandes entreprises</h1>
      {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{message}</div>}
      
      {/* Section Notifications */}
      {notifications.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
              {notifications.length}
            </span>
            Nouvelles demandes entreprises
          </h2>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div key={notification.id} className="bg-white p-3 rounded border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {notification.demande?.entreprise_nom || 'Entreprise inconnue'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Nouvelle demande reçue le {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => supprimerNotification(notification.id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Marquer comme vue
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      

      
      {/* Filtres */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par statut</label>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004080] focus:border-transparent"
          >
            <option value="tous">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="refusee">Refusée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>
      </div>
      
      {loading || loadingSettings ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004080] mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des demandes...</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {demandes
            .filter(demande => filterStatut === 'tous' || demande.statut === filterStatut)
            .map((demande) => {
            const assignedProfile = profiles.find((p) => p.id === demande.traite_par);
            const isExpanded = selectedDemande?.id === demande.id;
            const statutObj = STATUTS.find(s => s.value === demande.statut) || STATUTS[0];
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
                            onClick={async () => {
                              if (isExpanded) {
                                setSelectedDemande(null);
                              } else {
                                setSelectedDemande(demande);
                                await loadCommentaires(demande.id);
                                await loadStatistiques(demande.id);
                              }
                            }}
                            className="px-4 py-2 bg-[#004080] text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                          >
                            {isExpanded ? "Masquer détails" : "Voir détails"}
                          </button>
                          
                          {/* Boutons PDF et Impression */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownloadPDF(demande)}
                              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-1"
                              title="Télécharger PDF"
                            >
                              <Download className="w-4 h-4" />
                              PDF
                            </button>
                            <button
                              onClick={() => handlePrint(demande)}
                              className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm flex items-center gap-1"
                              title="Imprimer"
                            >
                              <Printer className="w-4 h-4" />
                              Imprimer
                            </button>
                          </div>
                          
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
                        {/* Statut de la demande */}
                        <div className="mb-6 flex items-center gap-4">
                          <span className="font-medium">Statut :</span>
                          {isAdmin ? (
                            <select
                              value={demande.statut || 'en_attente'}
                              onChange={e => handleStatutChange(demande.id, e.target.value)}
                              className="border rounded px-3 py-2 text-sm"
                            >
                              {STATUTS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${statutObj.color}`}>{statutObj.label}</span>
                          )}
                        </div>
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

                        {/* Profils demandés et Commentaires */}
                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Profils demandés */}
                          <div>
                            <h4 className="text-lg font-semibold text-[#004080] mb-4">Profils demandés</h4>
                            <div className="space-y-4">
                              {demande.profils && demande.profils.map((profil: any, index: number) => {
                                const pole = poles.find(p => p.id === profil.pole_id);
                                const filiere = filieres.find(f => f.id === profil.filiere_id);
                                return (
                                  <div key={index} className="bg-white p-4 rounded-lg border">
                                    <h5 className="font-semibold text-[#004080] mb-2">Profil {index + 1}</h5>
                                    <div className="space-y-2 text-sm">
                                      <p><span className="font-medium">Pôle :</span> {pole ? pole.nom : <span className="text-gray-400">Non renseigné</span>}</p>
                                      <p><span className="font-medium">Filière :</span> {filiere ? filiere.nom : <span className="text-gray-400">Non renseignée</span>}</p>
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
                                );
                              })}
                            </div>
                          </div>

                          {/* Section Commentaires */}
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
                                <div className="text-center py-8 text-gray-500">
                                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                  <p className="text-sm">Aucun commentaire pour le moment</p>
                                </div>
                              ) : (
                                commentaires.map((commentaire, index) => (
                                  <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center">
                                        <User className="w-4 h-4 text-gray-500 mr-2" />
                                        <span className="font-medium text-sm text-gray-700">{commentaire.auteur}</span>
                                      </div>
                                      <div className="flex items-center text-xs text-gray-500">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(commentaire.created_at).toLocaleDateString('fr-FR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-800">{commentaire.contenu}</p>
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
                        </div>

                        {/* Section Statistiques */}
                        <div className="mt-8">
                          <h4 className="text-lg font-semibold text-[#004080] mb-4">Statistiques</h4>
                          <div className="bg-white p-6 rounded-lg border border-gray-200">
                            {editingStats === demande.id ? (
                              // Mode édition
                              <>
                                {demande.evenement_type === 'jobday' ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        placeholder="0"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre de candidats retenus
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
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Nombre de CV envoyés
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={tempStats[demande.id]?.nombre_cv_envoyes || ''}
                                      onChange={(e) => {
                                        const newStats = { ...tempStats[demande.id], nombre_cv_envoyes: parseInt(e.target.value) || 0 };
                                        setTempStats(prev => ({ ...prev, [demande.id]: newStats }));
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004080] focus:border-transparent"
                                      placeholder="0"
                                    />
                                  </div>
                                )}
                                
                                {/* Boutons d'édition */}
                                <div className="mt-4 flex justify-end gap-2">
                                  <button
                                    onClick={() => cancelEditStatistiques(demande.id)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    onClick={() => updateStatistiques(demande.id, tempStats[demande.id] || {})}
                                    disabled={updatingStats === demande.id}
                                    className="px-4 py-2 bg-[#004080] text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                                  >
                                    {updatingStats === demande.id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Sauvegarde...
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Valider
                                      </>
                                    )}
                                  </button>
                                </div>
                              </>
                            ) : (
                              // Mode affichage
                              <>
                                {statistiques[demande.id] && Object.keys(statistiques[demande.id]).length > 0 ? (
                                  <div className="space-y-3">
                                    {demande.evenement_type === 'jobday' ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                          <span className="text-sm font-medium text-gray-700">Nombre de candidats :</span>
                                          <span className="ml-2 text-lg font-semibold text-[#004080]">{statistiques[demande.id].nombre_candidats || 0}</span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                          <span className="text-sm font-medium text-gray-700">Nombre de candidats retenus :</span>
                                          <span className="ml-2 text-lg font-semibold text-[#004080]">{statistiques[demande.id].nombre_candidats_retenus || 0}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-gray-50 p-3 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">Nombre de CV envoyés :</span>
                                        <span className="ml-2 text-lg font-semibold text-[#004080]">{statistiques[demande.id].nombre_cv_envoyes || 0}</span>
                                      </div>
                                    )}
                                    
                                    {/* Boutons d'action */}
                                    <div className="flex justify-end gap-2 pt-2">
                                      <button
                                        onClick={() => editStatistiques(demande.id)}
                                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                      >
                                        Modifier
                                      </button>
                                      {isAdmin && (
                                        <button
                                          onClick={() => deleteStatistiques(demande.id)}
                                          disabled={updatingStats === demande.id}
                                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:bg-gray-300"
                                        >
                                          {updatingStats === demande.id ? 'Suppression...' : 'Supprimer'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  // Pas de statistiques - mode saisie initiale
                                  <>
                                    {demande.evenement_type === 'jobday' ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            placeholder="0"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre de candidats retenus
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
                                            placeholder="0"
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Nombre de CV envoyés
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={tempStats[demande.id]?.nombre_cv_envoyes || ''}
                                          onChange={(e) => {
                                            const newStats = { ...tempStats[demande.id], nombre_cv_envoyes: parseInt(e.target.value) || 0 };
                                            setTempStats(prev => ({ ...prev, [demande.id]: newStats }));
                                          }}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004080] focus:border-transparent"
                                          placeholder="0"
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Bouton de validation initiale */}
                                    <div className="mt-4 flex justify-end">
                                      <button
                                        onClick={() => updateStatistiques(demande.id, statistiques[demande.id] || {})}
                                        disabled={updatingStats === demande.id}
                                        className="px-4 py-2 bg-[#004080] text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                                      >
                                        {updatingStats === demande.id ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Sauvegarde...
                                          </>
                                        ) : (
                                          <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Valider les statistiques
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </>
                                )}
                              </>
                            )}
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
                        {isAdmin ? (
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
                        ) : (
                          <div className="mt-8 pt-6 border-t border-gray-200">
                            <h4 className="text-lg font-semibold text-[#004080] mb-4">Suivi du dossier</h4>
                            <div className="flex items-center gap-4">
                              <span className="font-medium">Suivi par :</span>
                              <span className="text-gray-800 font-semibold">
                                {assignedProfile ? `${assignedProfile.prenom} ${assignedProfile.nom}` : <span className="text-gray-400">Non suivi</span>}
                              </span>
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
