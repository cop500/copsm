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
  
  // États pour les filtres
  const [filterStatut, setFilterStatut] = useState<string>('tous');
  
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
      
      await downloadDemandePDF(demandeTraitee, commentairesDemande, null);
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
      
      printDemande(demandeTraitee, commentairesDemande, null);
      setMessage('Impression lancée !');
    } catch (error) {
      console.error('Erreur impression:', error);
      setMessage('Erreur lors de l\'impression');
    }
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="min-h-screen bg-white">
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-[#1E40AF] mb-2">
            Gestion des Demandes Entreprises
          </h1>
          <p className="text-[#64748B] text-lg">
            Suivi et gestion des partenariats professionnels
          </p>
        </div>
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
                <div key={demande.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* En-tête de la carte avec gradient */}
                  <div className="p-6 text-[#1E40AF]" style={{background: 'linear-gradient(to right, #F1F5F9, #E2E8F0)'}}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h3 className="text-2xl font-bold text-[#1E40AF]">{demande.entreprise_nom}</h3>
                          {currentStatut && (
                            <span className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${currentStatut.color} shadow-lg`}>
                              {currentStatut.label}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[#64748B]">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">{demande.secteur}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            <span className="font-medium">{demande.contact_nom}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">{new Date(demande.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
                          <button
                          onClick={() => {
                            if (selectedDemande?.id === demande.id) {
                                setSelectedDemande(null);
                              } else {
                                setSelectedDemande(demande);
                          loadCommentaires(demande.id);
                        }
                          }}
                          className="px-6 py-3 bg-white text-[#1E40AF] rounded-xl hover:bg-blue-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {selectedDemande?.id === demande.id ? 'Masquer détails' : 'Voir détails'}
                          </button>
                          
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(demande.id)}
                            className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                  {selectedDemande?.id === demande.id && (
                    <div className="p-6 bg-gray-50">
                      {/* Informations détaillées améliorées */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                          <h4 className="text-xl font-bold text-[#1E40AF] mb-4 flex items-center">
                            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                            </svg>
                            Informations entreprise
                          </h4>
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <div>
                                <p className="font-semibold text-gray-700">Adresse</p>
                                <p className="text-gray-600">{demande.entreprise_adresse}</p>
                        </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                          <div>
                                <p className="font-semibold text-gray-700">Ville</p>
                                <p className="text-gray-600">{demande.entreprise_ville}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                              <div>
                                <p className="font-semibold text-gray-700">Email</p>
                                <p className="text-gray-600">{demande.entreprise_email}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                              </svg>
                              <div>
                                <p className="font-semibold text-gray-700">Téléphone</p>
                                <p className="text-gray-600">{demande.contact_tel}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                          <h4 className="text-xl font-bold text-[#1E40AF] mb-4 flex items-center">
                            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            Détails de la demande
                          </h4>
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                              <div>
                                <p className="font-semibold text-gray-700">Type</p>
                                <p className="text-gray-600">{demande.type_demande}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              <div>
                                <p className="font-semibold text-gray-700">Événement</p>
                                <p className="text-gray-600">{demande.evenement_type}</p>
                              </div>
                            </div>
                            {demande.evenement_date && (
                              <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                <div>
                                  <p className="font-semibold text-gray-700">Date événement</p>
                                  <p className="text-gray-600">{new Date(demande.evenement_date).toLocaleDateString('fr-FR')}</p>
                                </div>
                              </div>
                            )}
                              </div>
                            </div>
                          </div>

                      {/* Profils demandés */}
                      <div className="mt-8">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                          <h4 className="text-xl font-bold text-[#1E40AF] mb-6 flex items-center">
                            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                            Profils demandés
                          </h4>
                          <div className="space-y-4">
                            {demande.profils.map((profil, index) => (
                              <div key={index} className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                  {/* Pôle */}
                                  {profil.pole_id && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-[#1E40AF]" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                      </svg>
                          <div>
                                        <p className="text-xs font-semibold text-[#1E40AF] uppercase tracking-wide">Pôle</p>
                                        <p className="text-sm font-medium text-gray-700">{poles?.find(p => p.id === profil.pole_id)?.nom || `Pôle ${profil.pole_id}`}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Filière */}
                                  {(profil.filiere || profil.filiere_id) && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-[#1E40AF]" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                      </svg>
                              <div>
                                        <p className="text-xs font-semibold text-[#1E40AF] uppercase tracking-wide">Filière</p>
                                        <p className="text-sm font-medium text-gray-700">
                                          {profil.filiere_id 
                                            ? (filieres?.find(f => f.id === profil.filiere_id)?.nom || `Filière ${profil.filiere_id}`)
                                            : profil.filiere
                                          }
                                        </p>
                              </div>
                                    </div>
                                  )}
                                  
                                  {/* Poste/Titre/Fonction */}
                                  {(profil.poste || profil.titre || profil.fonction) && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-[#1E40AF]" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm3-2a1 1 0 00-1 1v1h2V5a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                              <div>
                                        <p className="text-xs font-semibold text-[#1E40AF] uppercase tracking-wide">Poste</p>
                                        <p className="text-sm font-medium text-gray-700">{profil.poste || profil.titre || profil.fonction}</p>
                              </div>
                                    </div>
                                  )}
                                  
                                  {/* Durée */}
                                  {profil.duree && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-[#1E40AF]" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                      </svg>
                              <div>
                                        <p className="text-xs font-semibold text-[#1E40AF] uppercase tracking-wide">Durée</p>
                                        <p className="text-sm font-medium text-gray-700">{profil.duree}</p>
                              </div>
                            </div>
                                  )}
                                  
                                  {/* Salaire */}
                                  {profil.salaire && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-[#1E40AF]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                      </svg>
                                      <div>
                                        <p className="text-xs font-semibold text-[#1E40AF] uppercase tracking-wide">Salaire</p>
                                        <p className="text-sm font-medium text-gray-700">{profil.salaire}</p>
                          </div>
                        </div>
                                  )}
                                  
                                  {/* Nombre de postes */}
                                  {profil.nombre_poste && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-[#1E40AF]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                          <div>
                                        <p className="text-xs font-semibold text-[#1E40AF] uppercase tracking-wide">Nombre de postes</p>
                                        <p className="text-sm font-medium text-gray-700">{profil.nombre_poste}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Type de contrat */}
                                  {profil.type_contrat && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-[#1E40AF]" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                      </svg>
                                      <div>
                                        <p className="text-xs font-semibold text-[#1E40AF] uppercase tracking-wide">Type de contrat</p>
                                        <p className="text-sm font-medium text-gray-700">{profil.type_contrat}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Niveau d'expérience */}
                                  {profil.niveau_experience && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                      <div>
                                        <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">Niveau d'expérience</p>
                                        <p className="text-sm font-medium text-gray-700">{profil.niveau_experience}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Compétences requises */}
                                  {profil.competences && (
                                    <div className="flex items-start gap-2 md:col-span-2 lg:col-span-3">
                                      <svg className="w-4 h-4 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                      </svg>
                                      <div className="flex-1">
                                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Compétences requises</p>
                                        <p className="text-sm font-medium text-gray-700">{profil.competences}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Description du poste */}
                                  {profil.description && (
                                    <div className="flex items-start gap-2 md:col-span-2 lg:col-span-3">
                                      <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                      </svg>
                                      <div className="flex-1">
                                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description du poste</p>
                                        <p className="text-sm font-medium text-gray-700">{profil.description}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Autres champs dynamiques */}
                                  {Object.entries(profil).map(([key, value]) => {
                                    // Ignorer les champs déjà affichés
                                    const displayedFields = ['pole_id', 'filiere', 'filiere_id', 'poste', 'titre', 'fonction', 'duree', 'salaire', 'nombre_poste', 'type_contrat', 'niveau_experience', 'competences', 'description'];
                                    if (displayedFields.includes(key) || !value || value === '' || value === null) {
                                      return null;
                                    }
                                    
                              return (
                                      <div key={key} className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{key.replace(/_/g, ' ')}</p>
                                          <p className="text-sm font-medium text-gray-700">{String(value)}</p>
                                  </div>
                                </div>
                              );
                            })}
                                </div>
                              </div>
                            ))}
                            </div>
                          </div>

                      </div>

                      {/* Section Commentaires - Masquée pour le directeur */}
                      {!isDirecteur && (
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                          <h4 className="text-xl font-bold text-[#1E40AF] mb-6 flex items-center">
                            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                              Commentaires
                            </h4>
                            
                            {/* Liste des commentaires */}
                          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                              {loadingCommentaires ? (
                                <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                                  <p className="text-sm text-gray-500 mt-2">Chargement des commentaires...</p>
                                </div>
                              ) : commentaires.length === 0 ? (
                              <p className="text-gray-500 text-sm text-center py-4">Aucun commentaire pour le moment</p>
                            ) : (
                              commentaires.map((commentaire) => (
                                <div key={commentaire.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-semibold text-gray-700">{commentaire.auteur}</span>
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
                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Supprimer ce commentaire"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Formulaire d'ajout de commentaire */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-end gap-3">
                                <div className="flex-1">
                                  <textarea
                                    value={nouveauCommentaire}
                                    onChange={(e) => setNouveauCommentaire(e.target.value)}
                                    placeholder="Ajouter un commentaire..."
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                                    rows={3}
                                  />
                                </div>
                                <button
                                  onClick={() => ajouterCommentaire(demande.id)}
                                  disabled={!nouveauCommentaire.trim()}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                                >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Publier
                                </button>
                              </div>
                            </div>
                                  </div>
                                )}
                                
                      {/* Actions */}
                      <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Actions</h4>
                        <div className="flex flex-wrap gap-4">
                          {isAdmin ? (
                            <div className="flex-1 min-w-[200px]">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Changer le statut</label>
                              <select
                                value={demande.statut || 'en_attente'}
                                onChange={(e) => handleStatutChange(demande.id, e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                              >
                                {STATUTS.map((statut) => (
                                  <option key={statut.value} value={statut.value}>
                                    {statut.label}
                                  </option>
                                ))}
                              </select>
                                </div>
                          ) : (
                            <div className="flex-1 min-w-[200px]">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Statut actuel</label>
                              <div className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg border">
                                <span className="font-semibold">{currentStatut?.label || 'En attente'}</span>
                                        </div>
                                      </div>
                                    )}
                                    
                          <div className="flex gap-3">
                            {!isDirecteur && (
                                      <button
                                onClick={() => handleDownloadPDF(demande)}
                                className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                                title="Télécharger PDF"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                PDF
                                        </button>
                            )}
                            
                                      <button
                              onClick={() => handlePrint(demande)}
                              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                              title="Imprimer"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            </svg>
                              Imprimer
                                      </button>
                          </div>
                        </div>

                        {/* Section Suivi du dossier - Masquée pour le directeur */}
                        {!isDirecteur && (
                          <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">Suivi du dossier</h4>
                            {demande.traite_par ? (
                              <div className="flex items-center gap-4">
                                <span className="font-medium text-gray-700">Suivi par :</span>
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-gray-800 font-semibold">
                                    {assignedProfile ? `${assignedProfile.prenom} ${assignedProfile.nom}` : <span className="text-gray-400">Non suivi</span>}
                                  </span>
                              </div>
                                </div>
                            ) : (
                            <div className="flex items-center gap-4">
                                <span className="font-medium text-gray-700">Assigner à :</span>
                              <select
                                value={demande.traite_par || ""}
                                onChange={(e) => handleAssign(demande.id, e.target.value)}
                                disabled={assigning === demande.id}
                                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                              >
                                <option value="">Non suivi</option>
                                {profiles.map((profile) => (
                                  <option key={profile.id} value={profile.id}>
                                    {profile.prenom} {profile.nom} ({profile.role})
                                  </option>
                                ))}
                              </select>
                              {assigning === demande.id && (
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"></div>
                                    Mise à jour...
                                  </div>
                              )}
                            </div>
                            )}
                          </div>
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
      </div>
    );
};

export default DashboardAdmin;