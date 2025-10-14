'use client'

import React, { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useEvenements } from '@/hooks/useEvenements'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, Plus, Search, Filter, Grid, List, 
  Clock, CheckCircle, AlertTriangle, XCircle,
  TrendingUp, Users, MapPin, FileText, Zap, Edit3,
  BookOpen, Eye, Trash2, Upload, FileSpreadsheet, Download, X
} from 'lucide-react'
import { NewEventForm } from './NewEventForm'
import { EventCard } from './EventCard'
import AIContentGenerator from './AIContentGenerator'
import { RapportsList } from './RapportsList'
import AtelierForm from './AtelierForm'
import AtelierInscriptionsManager from './AtelierInscriptionsManager'
import * as XLSX from 'xlsx'
import { useUser } from '@/contexts/UserContext'
import { useRole } from '@/hooks/useRole'

export const ModernEvenementsModule = () => {
  const { eventTypes } = useSettings()
  const { saveEvenement, ensureDataFresh } = useEvenements()
  const { currentUser } = useUser()
  const { isAdmin, isDirecteur } = useRole()
  
  // Debug logs
  console.log('🔍 === DEBUG MODERN EVENEMENTS ===')
  console.log('🔍 Current user:', currentUser)
  console.log('🔍 User role:', currentUser?.role)
  console.log('🔍 Is admin:', isAdmin)
  
  const [showForm, setShowForm] = useState(false)
  const [evenements, setEvenements] = useState<any[]>([])
  const [ateliers, setAteliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('tous')
  const [typeFilter, setTypeFilter] = useState('tous') // 'tous', 'evenements', 'ateliers'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedAtelier, setSelectedAtelier] = useState<any>(null)
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [showEventDetail, setShowEventDetail] = useState(false)
  const [showAtelierDetail, setShowAtelierDetail] = useState(false)
  const [eventDetailTab, setEventDetailTab] = useState<'details' | 'rapports'>('details')
  const [activeTab, setActiveTab] = useState<'evenements' | 'ateliers' | 'enquete'>('evenements')
  const [showAtelierForm, setShowAtelierForm] = useState(false)
  const [editingAtelier, setEditingAtelier] = useState<any>(null)
  const [showInscriptionsManager, setShowInscriptionsManager] = useState(false)
  
  // États pour l'import Excel
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importPreview, setImportPreview] = useState<any[]>([])
  
  // États pour la suppression multiple
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Filtre par volet
  const [voletFilter, setVoletFilter] = useState('tous')
  
  // Liste des volets
  const volets = [
    { value: 'information_communication', label: 'Information/Communication' },
    { value: 'accompagnement_projets', label: 'Accompagnement des stagiaires dans la réalisation de leur Projets Professionnels' },
    { value: 'assistance_carriere', label: 'Assistance au choix de carrière' },
    { value: 'assistance_filiere', label: 'Assistance au choix de filière' }
  ]

  // Charger les événements et ateliers
  const loadEvenements = async () => {
    try {
      setLoading(true)
      
      // Charger les événements
      const { data: evenementsData, error: evenementsError } = await supabase
        .from('evenements')
        .select(`
          *,
          event_types(nom, couleur)
        `)
        .order('date_debut', { ascending: false })

      if (evenementsError) throw evenementsError
      
      // Charger les ateliers
      const { data: ateliersData, error: ateliersError } = await supabase
        .from('ateliers')
        .select('*')
        .order('date_debut', { ascending: false })

      if (ateliersError) throw ateliersError
      

      
      setEvenements(evenementsData || [])
      setAteliers(ateliersData || [])
    } catch (err: any) {
      console.error('Erreur chargement:', err)
      showMessage('Erreur lors du chargement des données', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Afficher un message
  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // Sauvegarder un événement
  const handleSaveEvent = async (eventData: any) => {
    try {
      showMessage('Événement sauvegardé avec succès !')
      setShowForm(false)
      await loadEvenements()
    } catch (error: any) {
      showMessage('Erreur lors de la sauvegarde', 'error')
    }
  }

  // Supprimer un événement
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return

    try {
      const { error } = await supabase
        .from('evenements')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      showMessage('Événement supprimé avec succès')
      await loadEvenements()
    } catch (error: any) {
      showMessage('Erreur lors de la suppression', 'error')
    }
  }

  // Modifier un événement
  const handleEditEvent = async (event: any) => {
    // Vérifier et recharger les données si nécessaire avant modification
    await ensureDataFresh()
    setSelectedEvent(event)
    setShowForm(true)
  }

  // Voir les détails d'un événement
  const handleViewEvent = (event: any) => {
    setSelectedEvent(event)
    setShowEventDetail(true)
  }

  // Voir les détails d'un atelier
  const handleViewAtelier = (atelier: any) => {
    setSelectedAtelier(atelier)
    setShowAtelierDetail(true)
  }

  // Supprimer un atelier
  const handleDeleteAtelier = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet atelier ?')) return

    try {
      console.log('🔄 Suppression de l\'atelier:', id)
      
      // D'abord, supprimer toutes les inscriptions liées
      const { error: deleteInscriptionsError } = await supabase
        .from('inscriptions_ateliers')
        .delete()
        .eq('atelier_id', id)

      if (deleteInscriptionsError) {
        console.error('❌ Erreur suppression inscriptions:', deleteInscriptionsError)
        // Continuer même si la suppression des inscriptions échoue
        console.log('⚠️ Continuation malgré l\'erreur inscriptions...')
      }

      // Ensuite, supprimer l'atelier
      const { error } = await supabase
        .from('ateliers')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ Erreur suppression atelier:', error)
        throw error
      }
      
      console.log('✅ Atelier supprimé avec succès')
      showMessage('Atelier supprimé avec succès')
      await loadEvenements()
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression:', error)
      showMessage(`Erreur lors de la suppression: ${error.message}`, 'error')
    }
  }

  // Gérer la sauvegarde d'un atelier
  const handleSaveAtelier = async (atelierData: any) => {
    try {
      if (atelierData === null) {
        // Suppression
        showMessage('Atelier supprimé avec succès')
      } else {
        // Création ou modification
        showMessage(editingAtelier ? 'Atelier modifié avec succès' : 'Atelier créé avec succès')
      }
      setShowAtelierForm(false)
      setEditingAtelier(null)
      await loadEvenements()
    } catch (error: any) {
      showMessage('Erreur lors de la sauvegarde', 'error')
    }
  }

  // Ouvrir le formulaire d'atelier
  const handleCreateAtelier = () => {
    setEditingAtelier(null)
    setShowAtelierForm(true)
  }

  // Modifier un atelier
  const handleEditAtelier = (atelier: any) => {
    setEditingAtelier(atelier)
    setShowAtelierForm(true)
  }

  // Gérer la génération de contenu IA
  const handleContentGenerated = (content: string) => {
    console.log('🔄 Contenu généré reçu:', content.substring(0, 100) + '...')
    setGeneratedContent(content)
    showMessage('Contenu généré avec succès !')
    // Ne pas fermer le modal du générateur ici, laisser l'utilisateur voir le résultat
    // Le modal de contenu généré s'affichera automatiquement grâce à la condition {generatedContent && ...}
  }

  // Fermer le modal de contenu généré
  const closeGeneratedContent = () => {
    setGeneratedContent('')
    setShowAIGenerator(false) // Fermer aussi le générateur
  }

  // Réinitialiser tous les états des modals (en cas de problème)
  const resetModalStates = () => {
    setShowAIGenerator(false)
    setGeneratedContent('')
    setShowEventDetail(false)
    setShowAtelierDetail(false)
    setShowAtelierForm(false)
    setShowInscriptionsManager(false)
    setShowImportModal(false)
    setSelectedEvent(null)
    setSelectedAtelier(null)
    setEditingAtelier(null)
  }

  // Fonction pour télécharger le template Excel
  const downloadTemplate = () => {
    const template = [
      {
        'Titre': 'Exemple événement',
        'Type d\'événement': 'Job Day',
        'Date de début': '2024-01-15T09:00',
        'Lieu': 'Salle de conférence',
        'Description': 'Description de l\'événement',
        'Responsable COP': 'Jean Dupont',
        'Statut': 'planifie',
        'Volet': 'information_communication',
        'Nombre bénéficiaires': 50,
        'Nombre candidats': 25,
        'Nombre candidats retenus': 8
      },
      {
        'Titre': 'Exemple atelier',
        'Type d\'événement': 'Séminaire',
        'Date de début': '2024-01-20T14:00',
        'Lieu': 'Salle de formation',
        'Description': 'Atelier de préparation CV',
        'Responsable COP': 'Marie Martin',
        'Statut': 'planifie',
        'Volet': 'accompagnement_projets',
        'Nombre bénéficiaires': 30,
        'Nombre candidats': 0,
        'Nombre candidats retenus': 0
      },
      {
        'Titre': 'Exemple séance',
        'Type d\'événement': 'Séance',
        'Date de début': '2024-01-25T10:00',
        'Lieu': 'Bureau COP',
        'Description': 'Séance de coaching individuel',
        'Responsable COP': 'Sophie Durand',
        'Statut': 'planifie',
        'Volet': 'assistance_carriere',
        'Nombre bénéficiaires': 1,
        'Nombre candidats': 0,
        'Nombre candidats retenus': 0
      },
      {
        'Titre': 'Exemple forum orientation',
        'Type d\'événement': 'Forum d\'orientation',
        'Date de début': '2024-02-15T09:00',
        'Lieu': 'Centre de conférences',
        'Description': 'Forum d\'orientation professionnelle',
        'Responsable COP': 'Pierre Moreau',
        'Statut': 'planifie',
        'Volet': 'information_communication',
        'Nombre bénéficiaires': 200,
        'Nombre candidats': 0,
        'Nombre candidats retenus': 0
      },
      {
        'Titre': 'Exemple campagne',
        'Type d\'événement': 'Campagne',
        'Date de début': '2024-02-01T08:00',
        'Lieu': 'Multi-sites',
        'Description': 'Campagne de sensibilisation aux métiers',
        'Responsable COP': 'Claire Dubois',
        'Statut': 'planifie',
        'Volet': 'information_communication',
        'Nombre bénéficiaires': 500,
        'Nombre candidats': 0,
        'Nombre candidats retenus': 0
      }
    ];

    // Ajouter une feuille avec les valeurs autorisées
    const valeursAutorisees = [
      { 'Champ': 'Volet', 'Valeurs autorisées': 'information_communication, accompagnement_projets, assistance_carriere, assistance_filiere' },
      { 'Champ': 'Statut', 'Valeurs autorisées': 'planifie, en_cours, termine, annule' },
      { 'Champ': 'Type d\'événement', 'Valeurs autorisées': 'Job Day, Salon, Séminaire, Simulation Entretien, Visite d\'Entreprise, Talent Acquisition, Sourcing, HIRING DRIVE, Speed Hiring, Séance, Forum d\'orientation, Campagne' },
      { 'Champ': 'Métriques', 'Description': 'Nombre bénéficiaires, candidats et candidats retenus (optionnel)' }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wsValeurs = XLSX.utils.json_to_sheet(valeursAutorisees);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Événements');
    XLSX.utils.book_append_sheet(wb, wsValeurs, 'Valeurs autorisées');
    
    XLSX.writeFile(wb, 'template_evenements.xlsx');
  };

  // Fonction pour lire le fichier Excel
  const handleFileUpload = (file: File) => {
    console.log('📁 Fichier sélectionné:', file.name, file.size, 'bytes');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        console.log('📊 Données Excel brutes:', data.length, 'bytes');
        
        const workbook = XLSX.read(data, { type: 'array' });
        console.log('📋 Feuilles disponibles:', workbook.SheetNames);
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('📄 Données JSON extraites:', jsonData);
        
        if (!jsonData || jsonData.length === 0) {
          throw new Error('Le fichier Excel ne contient aucune donnée');
        }
        
        // Utiliser la fonction normalizeVolet définie au niveau du composant

        // Mapper les colonnes Excel vers nos champs
        const mappedData = jsonData.map((row: any, index: number) => {
          console.log(`📝 Ligne ${index + 1}:`, row);
          
          const voletValue = row['Volet'] || row['volet'] || '';
          const normalizedVolet = normalizeVolet(voletValue);
          
          console.log(`🔍 Volet original: "${voletValue}" → Normalisé: "${normalizedVolet}"`);
          
          const mapped = {
            titre: row['Titre'] || row['titre'] || '',
            type_evenement: row['Type d\'événement'] || row['Type'] || row['type_evenement'] || '',
            date_debut: row['Date de début'] || row['Date'] || row['date_debut'] || '',
            lieu: row['Lieu'] || row['lieu'] || '',
            description: row['Description'] || row['description'] || '',
            responsable_cop: row['Responsable COP'] || row['Responsable'] || row['responsable_cop'] || '',
            statut: (row['Statut'] || row['statut'] || 'planifie').toLowerCase(),
            volet: normalizedVolet,
            nombre_beneficiaires: parseInt(row['Nombre bénéficiaires'] || row['nombre_beneficiaires'] || '0') || 0,
            nombre_candidats: parseInt(row['Nombre candidats'] || row['nombre_candidats'] || '0') || 0,
            nombre_candidats_retenus: parseInt(row['Nombre candidats retenus'] || row['nombre_candidats_retenus'] || '0') || 0
          };
          
          console.log(`✅ Ligne ${index + 1} mappée:`, mapped);
          return mapped;
        }).filter(item => item.titre && item.titre.trim() !== ''); // Filtrer les lignes vides

        console.log('🎯 Données finales mappées:', mappedData);
        
        if (mappedData.length === 0) {
          throw new Error('Aucune ligne valide trouvée dans le fichier Excel');
        }

        setImportPreview(mappedData);
        setImportFile(file);
        showMessage(`✅ Fichier lu avec succès : ${mappedData.length} événements détectés`, 'success');
      } catch (error: any) {
        console.error('❌ Erreur lecture Excel:', error);
        showMessage(`Erreur lors de la lecture du fichier Excel : ${error.message}`, 'error');
      }
    };
    
    reader.onerror = () => {
      console.error('❌ Erreur lors de la lecture du fichier');
      showMessage('Erreur lors de la lecture du fichier', 'error');
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Fonctions de gestion de la suppression multiple
  const handleSelectEvent = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSelectAllEvents = () => {
    if (selectedEvents.length === evenements.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(evenements.map(e => e.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEvents.length === 0) return;
    
    setDeleting(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const eventId of selectedEvents) {
        try {
          const { error } = await supabase
            .from('evenements')
            .delete()
            .eq('id', eventId);
          
          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error(`Erreur suppression événement ${eventId}:`, error);
          errorCount++;
        }
      }
      
      // Recharger les événements
      await loadEvenements();
      
      // Afficher le résultat
      const message = `Suppression terminée : ${successCount} événements supprimés`;
      if (errorCount > 0) {
        alert(`${message}, ${errorCount} erreurs`);
      } else {
        alert(message);
      }
      
      // Réinitialiser
      setSelectedEvents([]);
      setShowBulkDeleteModal(false);
      
    } catch (error) {
      console.error('Erreur suppression multiple:', error);
      alert('Erreur lors de la suppression multiple');
    } finally {
      setDeleting(false);
    }
  };

  // Fonction de normalisation des volets (définie au niveau du composant)
  const normalizeVolet = (voletValue: string): string => {
    if (!voletValue) return 'information_communication';
    
    const voletLower = voletValue.toLowerCase().trim();
    
    // Mapping des variations possibles vers les valeurs autorisées
    const voletMapping: { [key: string]: string } = {
      'information/communication': 'information_communication',
      'information_communication': 'information_communication',
      'information': 'information_communication',
      'communication': 'information_communication',
      
      'accompagnement des stagiaires dans la réalisation de leur projets professionnels': 'accompagnement_projets',
      'accompagnement_projets': 'accompagnement_projets',
      'accompagnement': 'accompagnement_projets',
      'projets professionnels': 'accompagnement_projets',
      
      'assistance au choix de carrière': 'assistance_carriere',
      'assistance_carriere': 'assistance_carriere',
      'carrière': 'assistance_carriere',
      'carriere': 'assistance_carriere',
      'carrière': 'assistance_carriere',
      
      'assistance au choix de filière': 'assistance_filiere',
      'assistance_filiere': 'assistance_filiere',
      'filière': 'assistance_filiere',
      'filiere': 'assistance_filiere',
      'filière': 'assistance_filiere'
    };
    
    return voletMapping[voletLower] || 'information_communication';
  };

  // Fonction d'import Excel
  const handleImport = async () => {
    if (!importFile) {
      alert('Veuillez sélectionner un fichier Excel');
      return;
    }

    setImporting(true);
    try {
      console.log('🔍 Début de l\'import Excel...');
      console.log('🔍 Taille du fichier:', importFile.size, 'bytes');
      
      // Vérifier la taille du fichier (limite à 10MB)
      if (importFile.size > 10 * 1024 * 1024) {
        throw new Error('Fichier trop volumineux. Taille maximale : 10MB');
      }

      // Utiliser une approche plus robuste pour lire le fichier Excel
      const arrayBuffer = await importFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false,
        raw: false,
        dateNF: 'yyyy-mm-dd'
      });
      
      console.log('🔍 Noms des feuilles:', workbook.SheetNames);
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Aucune feuille trouvée dans le fichier Excel');
      }
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        throw new Error('Impossible de lire la feuille Excel');
      }
      
      // Convertir en JSON avec options sécurisées et gestion d'erreurs
      let data: any[] = [];
      
      try {
        // Essayer d'abord avec header: 1 (array de arrays)
        data = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false,
          raw: false
        });
      } catch (error) {
        console.warn('⚠️ Échec avec header: 1, tentative avec header: "A"');
        try {
          // Fallback avec header: "A" (colonnes nommées)
          data = XLSX.utils.sheet_to_json(worksheet, {
            header: "A",
            defval: '',
            blankrows: false,
            raw: false
          });
        } catch (error2) {
          console.warn('⚠️ Échec avec header: "A", tentative avec header: true');
          // Dernier recours avec header: true
          data = XLSX.utils.sheet_to_json(worksheet, {
            header: true,
            defval: '',
            blankrows: false,
            raw: false
          });
        }
      }
      
      console.log('🔍 Nombre de lignes:', data.length);
      
      if (!data || data.length === 0) {
        throw new Error('Aucune donnée trouvée dans le fichier Excel');
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Traiter ligne par ligne avec validation
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        try {
          // Vérifier que la ligne n'est pas vide
          if (!row || row.length === 0) {
            continue;
          }
          
          // Fonction sécurisée pour parser les nombres
          const safeParseInt = (value: any, defaultValue: number = 0): number => {
            if (value === null || value === undefined || value === '') {
              return defaultValue;
            }
            const parsed = parseInt(String(value).replace(/[^\d-]/g, ''), 10);
            return isNaN(parsed) ? defaultValue : Math.max(0, Math.min(parsed, 999999)); // Limite entre 0 et 999999
          };

          // Fonction pour extraire une valeur de manière sécurisée
          const getValue = (row: any, ...keys: string[]): string => {
            for (const key of keys) {
              if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                return String(row[key]).trim();
              }
            }
            return '';
          };

          // Debug: Afficher la structure de la ligne
          console.log(`🔍 Structure ligne ${i + 1}:`, Object.keys(row));
          console.log(`🔍 Valeurs ligne ${i + 1}:`, row);

          // Fonction intelligente pour détecter le titre
          const detectTitre = (row: any): string => {
            // Essayer d'abord les noms de colonnes les plus courants
            const titreKeys = [
              'Titre', 'titre', 'TITRE', 'Titres', 'titres',
              'Nom', 'nom', 'NOM', 'Noms', 'noms',
              'Nom de l\'événement', 'nom_evenement', 'nom_evenement',
              'Event Name', 'event_name', 'EVENT_NAME',
              'Intitulé', 'intitule', 'INTITULE',
              'Libellé', 'libelle', 'LIBELLE',
              'Description', 'description', 'DESCRIPTION'
            ];
            
            // Chercher dans les noms de colonnes
            for (const key of titreKeys) {
              if (row[key] && String(row[key]).trim() !== '') {
                console.log(`✅ Titre trouvé avec clé "${key}":`, row[key]);
                return String(row[key]).trim();
              }
            }
            
            // Si pas trouvé, chercher dans les colonnes A, B, C, etc.
            const columnKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
            for (const key of columnKeys) {
              if (row[key] && String(row[key]).trim() !== '') {
                console.log(`✅ Titre trouvé avec colonne "${key}":`, row[key]);
                return String(row[key]).trim();
              }
            }
            
            // Si toujours pas trouvé, chercher la première valeur non-vide
            for (const [key, value] of Object.entries(row)) {
              if (value && String(value).trim() !== '') {
                console.log(`✅ Titre trouvé avec première valeur "${key}":`, value);
                return String(value).trim();
              }
            }
            
            console.log(`❌ Aucun titre trouvé pour la ligne ${i + 1}`);
            return '';
          };

          const titre = detectTitre(row);

          // Fonction intelligente pour détecter d'autres champs
          const detectField = (row: any, fieldKeys: string[], defaultValue: string = ''): string => {
            for (const key of fieldKeys) {
              if (row[key] && String(row[key]).trim() !== '') {
                return String(row[key]).trim();
              }
            }
            return defaultValue;
          };

          // Fonction pour formater les dates
          const formatDate = (dateStr: string): string | null => {
            if (!dateStr || dateStr.trim() === '') return null;
            
            try {
              // Essayer de parser la date
              const date = new Date(dateStr);
              if (isNaN(date.getTime())) return null;
              
              // Retourner au format ISO
              return date.toISOString().split('T')[0];
            } catch {
              return null;
            }
          };

          const eventData = {
            titre: titre,
            description: detectField(row, [
              'Description', 'description', 'DESCRIPTION', 'desc', 'DESC',
              'Description de l\'événement', 'description_evenement', 'DESCRIPTION_EVENEMENT',
              'Détails', 'details', 'DETAILS', 'Detail', 'detail', 'DETAIL'
            ], 'Description par défaut'),
            date_debut: formatDate(getValue(row, 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
              'Date de début', 'Date de début', 'date_debut', 'date', 'DATE',
              'Start Date', 'start_date', 'Date début'
            )) || new Date().toISOString().split('T')[0],
            date_fin: formatDate(getValue(row, 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
              'Date de fin', 'Date de fin', 'date_fin', 'DATE_FIN',
              'End Date', 'end_date', 'Date fin'
            )),
            lieu: getValue(row, 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
              'Lieu', 'lieu', 'location', 'LIEU', 'LOCATION',
              'Place', 'place', 'PLACE'
            ) || 'Lieu non spécifié',
            volet: normalizeVolet(getValue(row, 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
              'Volet', 'volet', 'VOLET', 'Type', 'type', 'TYPE'
            )),
            pole_id: row['G'] || row['H'] || row['I'] || row['J'] || row['K'] || row['L'] || row['M'] || row['N'] || row['O'] || row['P'] || row['Q'] || row['R'] || row['S'] || row['T'] || row['U'] || row['V'] || row['W'] || row['X'] || row['Y'] || row['Z'] || 
              row['Pôle ID'] || row['pole_id'] || row['POLE_ID'] || null,
            filiere_id: row['H'] || row['I'] || row['J'] || row['K'] || row['L'] || row['M'] || row['N'] || row['O'] || row['P'] || row['Q'] || row['R'] || row['S'] || row['T'] || row['U'] || row['V'] || row['W'] || row['X'] || row['Y'] || row['Z'] || 
              row['Filière ID'] || row['filiere_id'] || row['FILIERE_ID'] || null,
            nombre_beneficiaires: safeParseInt(row['I'] || row['J'] || row['K'] || row['L'] || row['M'] || row['N'] || row['O'] || row['P'] || row['Q'] || row['R'] || row['S'] || row['T'] || row['U'] || row['V'] || row['W'] || row['X'] || row['Y'] || row['Z'] || 
              row['Nombre de bénéficiaires'] || row['nombre_beneficiaires'] || row['NOMBRE_BENEFICIAIRES']),
            nombre_candidats: safeParseInt(row['J'] || row['K'] || row['L'] || row['M'] || row['N'] || row['O'] || row['P'] || row['Q'] || row['R'] || row['S'] || row['T'] || row['U'] || row['V'] || row['W'] || row['X'] || row['Y'] || row['Z'] || 
              row['Nombre de candidats'] || row['nombre_candidats'] || row['NOMBRE_CANDIDATS']),
            nombre_candidats_retenus: safeParseInt(row['K'] || row['L'] || row['M'] || row['N'] || row['O'] || row['P'] || row['Q'] || row['R'] || row['S'] || row['T'] || row['U'] || row['V'] || row['W'] || row['X'] || row['Y'] || row['Z'] || 
              row['Nombre de candidats retenus'] || row['nombre_candidats_retenus'] || row['NOMBRE_CANDIDATS_RETENUS']),
            statut: 'planifie',
            actif: true,
            responsable_cop: 'Import Excel',
            type_evenement_id: null
          };

          // Validation des données obligatoires - plus flexible
          if (!eventData.titre) {
            console.warn(`⚠️ Ligne ${i + 1}: Titre manquant, utilisation d'un titre par défaut`);
            eventData.titre = `Événement ${i + 1} - ${new Date().toLocaleDateString()}`;
          }

          console.log(`🔍 Traitement ligne ${i + 1}:`, eventData);

          try {
            console.log(`🔍 Appel saveEvenement pour ligne ${i + 1}:`, eventData);
            const result = await saveEvenement(eventData);
            console.log(`🔍 Résultat saveEvenement ligne ${i + 1}:`, result);
            
            // Vérifier si result existe et a la propriété success
            if (result && typeof result === 'object' && result.success) {
              successCount++;
              console.log(`✅ Ligne ${i + 1} sauvegardée avec succès`);
            } else if (result && typeof result === 'object' && result.error) {
              errorCount++;
              const errorMsg = `Ligne ${i + 1}: ${result.error}`;
              errors.push(errorMsg);
              console.error(`❌ Erreur sauvegarde ligne ${i + 1}:`, result.error);
            } else {
              // Si result est undefined ou n'a pas la structure attendue
              errorCount++;
              const errorMsg = `Ligne ${i + 1}: Erreur - résultat inattendu de saveEvenement`;
              errors.push(errorMsg);
              console.error(`❌ Résultat inattendu ligne ${i + 1}:`, result);
            }
          } catch (saveError: any) {
            errorCount++;
            const errorMsg = `Ligne ${i + 1}: Erreur sauvegarde - ${saveError.message || saveError}`;
            errors.push(errorMsg);
            console.error(`❌ Erreur sauvegarde ligne ${i + 1}:`, saveError);
          }
        } catch (error: any) {
          errorCount++;
          errors.push(`Ligne ${i + 1}: ${error.message || 'Erreur inconnue'}`);
          console.error(`❌ Erreur ligne ${i + 1}:`, error);
        }
      }

      console.log(`✅ Import terminé: ${successCount} succès, ${errorCount} erreurs`);
      
      let message = `Import terminé : ${successCount} événements ajoutés`;
      if (errorCount > 0) {
        message += `, ${errorCount} erreurs`;
        if (errors.length > 0) {
          console.log('❌ Détails des erreurs:', errors);
        }
      }
      
      alert(message);
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview([]);
      
      // Recharger les événements
      loadEvenements();
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import : ' + (error.message || error));
    } finally {
      setImporting(false);
    }
  };

  // Ouvrir le générateur IA pour un événement spécifique
  const handleGenerateContent = (event: any) => {
    setSelectedEvent(event)
    setShowAIGenerator(true)
  }



  // Statistiques
  const getStatusCount = (status: string) => 
    evenements.filter(e => e.statut === status).length

  const getTypeCount = (typeId: string) => 
    evenements.filter(e => e.type_evenement_id === typeId).length

  // Fonctions utilitaires pour les ateliers
  const getAtelierStatusLabel = (status: string) => {
    switch (status) {
      case 'planifie': return 'Planifié'
      case 'en_cours': return 'En cours'
      case 'termine': return 'Terminé'
      case 'annule': return 'Annulé'
      default: return status
    }
  }

  const getAtelierStatusColor = (status: string) => {
    switch (status) {
      case 'planifie': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'en_cours': return 'bg-green-100 text-green-800 border-green-200'
      case 'termine': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'annule': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDuration = (dateDebut: string, dateFin: string) => {
    const debut = new Date(dateDebut)
    const fin = new Date(dateFin)
    const diffMs = fin.getTime() - debut.getTime()
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))
    return `${diffHours}h`
  }

  // Filtrer selon l'onglet actif avec optimisation
  const filteredEvenements = React.useMemo(() => {
    return evenements.filter(event => {
      const matchesSearch = searchTerm === '' || 
        event.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.lieu && event.lieu.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === 'tous' || event.statut === statusFilter
      const matchesType = typeFilter === 'tous' || event.type_evenement_id === typeFilter
      const matchesVolet = voletFilter === 'tous' || event.volet === voletFilter
      
      return matchesSearch && matchesStatus && matchesType && matchesVolet
    })
  }, [evenements, searchTerm, statusFilter, typeFilter, voletFilter])

  const filteredAteliers = React.useMemo(() => {
    return ateliers.filter(atelier => {
      const matchesSearch = searchTerm === '' || 
        atelier.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (atelier.description && atelier.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (atelier.lieu && atelier.lieu.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === 'tous' || atelier.statut === statusFilter
      const matchesType = typeFilter === 'tous' || typeFilter === 'atelier'
      
      return matchesSearch && matchesStatus && matchesType
    })
  }, [ateliers, searchTerm, statusFilter, typeFilter])

  // Obtenir les éléments à afficher selon l'onglet actif avec optimisation
  const displayItems = React.useMemo(() => {
    if (activeTab === 'evenements') {
      return filteredEvenements.sort((a, b) => 
        new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime()
      )
    } else if (activeTab === 'ateliers') {
      return filteredAteliers.sort((a, b) => 
        new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime()
      )
    }
    return []
  }, [activeTab, filteredEvenements, filteredAteliers])

  // Charger au démarrage
  useEffect(() => {
    loadEvenements()
  }, [])

  // Effet pour fermer automatiquement le générateur quand le contenu est généré
  useEffect(() => {
    if (generatedContent) {
      console.log('🔒 Fermeture automatique du générateur')
      setShowAIGenerator(false)
    }
  }, [generatedContent])

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Messages */}
      {message && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-md flex items-center z-50 ${
          message.type === 'error' 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          <CheckCircle className="w-4 h-4 mr-2" />
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              Gestion des Événements
            </h1>
            <p className="text-gray-600 mt-2">
              Organisez et gérez vos événements et ateliers d'insertion professionnelle
            </p>
            {isAdmin && activeTab === 'evenements' && selectedEvents.length > 0 && (
              <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium inline-block">
                {selectedEvents.length} événement(s) sélectionné(s)
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && activeTab === 'evenements' && (
              <>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  Importer Excel
                </button>
                
                <button
                  onClick={handleSelectAllEvents}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                >
                  {selectedEvents.length === evenements.length ? (
                    <>
                      <X className="w-5 h-5" />
                      Tout désélectionner
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Tout sélectionner
                    </>
                  )}
                </button>
                
                {selectedEvents.length > 0 && !isDirecteur && (
                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                    Supprimer ({selectedEvents.length})
                  </button>
                )}
              </>
            )}
            {!isDirecteur && activeTab !== 'enquete' && (
              <button
                onClick={() => {
                  if (activeTab === 'evenements') {
                    setSelectedEvent(null)
                    setShowForm(true)
                  } else {
                    handleCreateAtelier()
                  }
                }}
                className={`${
                  activeTab === 'evenements' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-lg`}
              >
                <Plus className="w-5 h-5" />
                {activeTab === 'evenements' ? 'Nouvel Événement' : 'Nouvel Atelier'}
              </button>
            )}
            {activeTab === 'ateliers' && (
              <button
                onClick={() => setShowInscriptionsManager(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                title="Gérer les inscriptions"
              >
                <Users className="w-4 h-4" />
                Gérer Inscriptions
              </button>
            )}
            {(showAIGenerator || generatedContent || showEventDetail || showAtelierDetail || showInscriptionsManager) && (
              <button
                onClick={resetModalStates}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                title="Fermer tous les modals"
              >
                <XCircle className="w-4 h-4" />
                Fermer tout
              </button>
            )}
          </div>
        </div>

        {/* Onglets */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('evenements')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'evenements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Événements
            </button>
            {!isDirecteur && (
              <button
                onClick={() => setActiveTab('ateliers')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'ateliers'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Ateliers
              </button>
            )}
            {(isAdmin || currentUser?.email === 'siham.elomari@example.com') && (
              <button
                onClick={() => setActiveTab('enquete')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'enquete'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Enquête d'Insertion
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Statistiques */}
      {activeTab !== 'enquete' && activeTab === 'evenements' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{evenements.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Planifiés</p>
                <p className="text-3xl font-bold text-blue-600">{getStatusCount('planifie')}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-3xl font-bold text-yellow-600">{getStatusCount('en_cours')}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminés</p>
                <p className="text-3xl font-bold text-green-600">{getStatusCount('termine')}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        activeTab === 'ateliers' && !isDirecteur && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-3xl font-bold text-gray-900">{ateliers.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Planifiés</p>
                  <p className="text-3xl font-bold text-blue-600">{ateliers.filter(a => a.statut === 'planifie').length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En cours</p>
                  <p className="text-3xl font-bold text-yellow-600">{ateliers.filter(a => a.statut === 'en_cours').length}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Terminés</p>
                  <p className="text-3xl font-bold text-green-600">{ateliers.filter(a => a.statut === 'termine').length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Filtres et recherche */}
      {activeTab !== 'enquete' && (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Recherche */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par titre, lieu, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Filtre statut */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="tous">Tous les statuts</option>
              <option value="planifie">Planifiés</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminés</option>
              <option value="annule">Annulés</option>
            </select>
          </div>

          {/* Filtre type */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="tous">Tous les types</option>
              {activeTab === 'evenements' ? (
                eventTypes.filter(t => t.actif && t.nom !== 'Atelier').map(type => (
                  <option key={type.id} value={type.id}>
                    {type.nom}
                  </option>
                ))
              ) : (
                <option value="atelier">Atelier</option>
              )}
            </select>
          </div>

          {/* Filtre volet - visible seulement pour les événements */}
          {activeTab === 'evenements' && (
            <div>
              <select
                value={voletFilter}
                onChange={(e) => setVoletFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="tous">Tous les volets</option>
                {volets.map(volet => (
                  <option key={volet.value} value={volet.value}>
                    {volet.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Mode d'affichage */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Affichage :</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {displayItems.length} {activeTab === 'evenements' ? 'événement(s)' : 'atelier(s)'} trouvé(s)
          </div>
        </div>
      </div>
      )}

      {/* Liste des éléments selon l'onglet actif */}
      {activeTab !== 'enquete' && loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        </div>
      ) : activeTab !== 'enquete' && displayItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            {activeTab === 'evenements' ? (
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            ) : (
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun {activeTab === 'evenements' ? 'événement' : 'atelier'} trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'evenements' 
                ? (evenements.length === 0 ? 'Créez votre premier événement pour commencer' : 'Ajustez vos filtres pour voir plus de résultats')
                : (ateliers.length === 0 ? 'Créez votre premier atelier pour commencer' : 'Ajustez vos filtres pour voir plus de résultats')
              }
            </p>
            {((activeTab === 'evenements' && evenements.length === 0) || (activeTab === 'ateliers' && ateliers.length === 0)) && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer un {activeTab === 'evenements' ? 'événement' : 'atelier'}
              </button>
            )}
          </div>
        </div>
      ) : activeTab !== 'enquete' ? (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {activeTab === 'evenements' ? (
            // Affichage des événements
            displayItems.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={!isDirecteur ? handleEditEvent : undefined}
                onDelete={!isDirecteur ? handleDeleteEvent : undefined}
                onView={handleViewEvent}
                isSelected={selectedEvents.includes(event.id)}
                onSelect={() => handleSelectEvent(event.id)}
                showSelection={isAdmin && !isDirecteur}
                onGenerateContent={!isDirecteur ? handleGenerateContent : undefined}
              />
            ))
          ) : (
            // Affichage des ateliers
            displayItems.map(atelier => (
              <div key={atelier.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header de la carte */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {atelier.titre}
                        </h3>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAtelierStatusColor(atelier.statut)}`}>
                        {getAtelierStatusLabel(atelier.statut)}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewAtelier(atelier)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!isDirecteur && (
                        <>
                          <button
                            onClick={() => handleEditAtelier(atelier)}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAtelier(atelier.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {atelier.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {atelier.description}
                    </p>
                  )}

                  {/* Informations */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(atelier.date_debut)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Durée: {getDuration(atelier.date_debut, atelier.date_fin)}</span>
                    </div>
                    
                    {atelier.lieu && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{atelier.lieu}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{atelier.capacite_actuelle || 0}/{atelier.capacite_max} participants</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* Formulaire modal */}
      {showForm && (
        <NewEventForm
          onSave={handleSaveEvent}
          onCancel={() => {
            setShowForm(false)
            setSelectedEvent(null)
          }}
          initialData={selectedEvent}
        />
      )}

      {/* Modal Générateur IA - Masqué pour le directeur */}
      {showAIGenerator && !isDirecteur && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  Générateur de contenu IA
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAIGenerator(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Fermer le générateur"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <AIContentGenerator
                eventId={selectedEvent?.id || ''}
                eventTitle={selectedEvent?.titre || 'Nouvel événement'}
                eventData={selectedEvent}
                onContentGenerated={handleContentGenerated}
              />
            </div>
          </div>
        </div>
      )}

      {/* Affichage du contenu généré - Masqué pour le directeur */}
      {generatedContent && !isDirecteur && (
        <>
          {console.log('📄 Affichage du modal de contenu généré')}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Contenu généré par IA
                </h2>
                <button
                  onClick={() => {
                    closeGeneratedContent()
                    setShowAIGenerator(false) // Fermer aussi le générateur
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6 whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                {generatedContent}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedContent);
                    showMessage('Contenu copié dans le presse-papiers !');
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Copier
                </button>
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Contenu généré - ${selectedEvent?.titre || 'Événement'}</title>
                            <style>
                              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
                              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                              .content { white-space: pre-wrap; }
                              @media print { body { margin: 0; } }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <h1>Contenu généré par IA</h1>
                              <p><strong>Événement:</strong> ${selectedEvent?.titre || 'N/A'}</p>
                              <p><strong>Date de génération:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                            </div>
                            <div class="content">${generatedContent}</div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Imprimer
                </button>
                <button
                  onClick={() => {
                    setGeneratedContent('')
                    setShowAIGenerator(false) // Fermer aussi le générateur
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Modal de détails d'événement */}
      {showEventDetail && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Détails de l'événement
                </h2>
                <button
                  onClick={() => setShowEventDetail(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Onglets */}
              <div className="border-b border-gray-200 mb-6">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setEventDetailTab('details')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      eventDetailTab === 'details'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Détails
                  </button>
                  <button
                    onClick={() => setEventDetailTab('rapports')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      eventDetailTab === 'rapports'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Rapports
                  </button>
                </div>
              </div>

              {/* Contenu des onglets */}
              {eventDetailTab === 'details' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Informations principales */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations générales</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                          <p className="text-gray-900 font-medium">{selectedEvent.titre}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type d'événement</label>
                          <p className="text-gray-900">{selectedEvent.event_types?.nom || 'Non spécifié'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            selectedEvent.statut === 'planifie' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            selectedEvent.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            selectedEvent.statut === 'termine' ? 'bg-green-100 text-green-800 border-green-200' :
                            selectedEvent.statut === 'annule' ? 'bg-red-100 text-red-800 border-red-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {selectedEvent.statut === 'planifie' ? 'Planifié' :
                             selectedEvent.statut === 'en_cours' ? 'En cours' :
                             selectedEvent.statut === 'termine' ? 'Terminé' :
                             selectedEvent.statut === 'annule' ? 'Annulé' :
                             selectedEvent.statut}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                          <p className="text-gray-900">{selectedEvent.lieu}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                          <p className="text-gray-900">{selectedEvent.responsable_cop || 'Non spécifié'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Dates et horaires</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Début :</span>
                          <span className="text-sm font-medium">{new Date(selectedEvent.date_debut).toLocaleString('fr-FR')}</span>
                        </div>
                        {selectedEvent.date_fin && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Fin :</span>
                            <span className="text-sm font-medium">{new Date(selectedEvent.date_fin).toLocaleString('fr-FR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description et photos */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                    </div>

                    {selectedEvent.photos_urls && selectedEvent.photos_urls.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Photos ({selectedEvent.photos_urls.length})</h3>
                        {console.log('📸 Photos URLs:', selectedEvent.photos_urls)}
                        <div className="grid grid-cols-2 gap-2">
                          {selectedEvent.photos_urls.map((photo: string, index: number) => (
                            <div key={index} className="relative group">
                              <img
                                src={photo}
                                alt={`Photo ${index + 1} - ${selectedEvent.titre}`}
                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(photo, '_blank')}
                                onError={(e) => {
                                  console.error('❌ Erreur chargement image:', photo)
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCAxMDBDNjAgODguOTU0MyA2OC45NTQzIDgwIDgwIDgwQzgxLjA5MDkgODAgODIuMTY2NyA4MC4wMzQ3IDgzLjIyNzMgODAuMTAyN0M4NC4yODc5IDgwLjE3MDcgODUuMzI5MiA4MC4yNzE3IDg2LjM0NzcgODAuNDA0N0M4Ny4zNjYyIDgwLjUzNzcgODguMzU5NyA4MC43MDI3IDg5LjMyNTcgODAuODk5N0M5MC4yOTE3IDgxLjA5NjcgOTEuMjI4NyA4MS4zMjU3IDkyLjEzNTcgODEuNTg2N0M5My4wNDI3IDgxLjg0NzcgOTMuOTIwNyA4Mi4xNDA3IDk0Ljc2NTcgODIuNDY1N0M5NS42MTA3IDgyLjc5MDcgOTYuNDIxNyA4My4xNDc3IDk3LjE5NzcgODMuNTM2N0M5Ny45NzM3IDgzLjkyNTcgOTguNzEzNyA4NC4zNDY3IDk5LjQxNTcgODQuNzk5N0MxMDAuMTE3NyA4NS4yNTI3IDEwMC43ODU3IDg1LjczNzcgMTAxLjQxOTcgODYuMjU0N0MxMDIuMDUzNyA4Ni43NzE3IDEwMi42NTM3IDg3LjMyMDcgMTAzLjIxOTcgODcuODk5N0MxMDMuNzg1NyA4OC40Nzg3IDEwNC4zMTc3IDg5LjA4ODcgMTA0LjgxNTcgODkuNzI5N0MxMDUuMzEzNyA5MC4zNzA3IDEwNS43Nzc3IDkxLjA0MjcgMTA2LjIwNTcgOTEuNzM1N0MxMDYuNjMzNyA5Mi40Mjg3IDEwNy4wMjU3IDkzLjE0MTcgMTA3LjM4MTcgOTMuODc0N0MxMDcuNzM3NyA5NC42MDc3IDEwOC4wNTc3IDk1LjM2MDcgMTA4LjM0MTcgOTYuMTMzN0MxMDguNjI1NyA5Ni45MDY3IDEwOC44NzM3IDk3LjY5OTcgMTA5LjA4NTcgOTguNTAyN0MxMDkuMjk3NyA5OS4zMDU3IDEwOS40NzM3IDEwMC4xMjg3IDEwOS42MTM3IDEwMC45NzE3QzEwOS43NTM3IDEwMS44MTQ3IDEwOS44NTc3IDEwMi42Njc3IDEwOS45MjU3IDEwMy41MzA3QzEwOS45OTM3IDEwNC4zOTM3IDExMC4wMjU3IDEwNS4yNjY3IDExMC4wMjE3IDEwNi4xNDk3QzExMC4wMTc3IDEwNy4wMzI3IDEwOS45Nzc3IDEwNy45MTU3IDEwOS45MDE3IDEwOC43ODg3QzEwOS44MjU3IDEwOS42NjE3IDEwOS43MTM3IDExMC41MjQ3IDEwOS41NjU3IDExMS4zNjc3QzEwOS40MTc3IDExMi4yMTA3IDEwOS4yMzM3IDExMy4wNDM3IDEwOS4wMTM3IDExMy44NTY3QzEwOC43OTM3IDExNC42Njk3IDEwOC41Mzc3IDExNS40NjI3IDEwOC4yNDU3IDExNi4yMzU3QzEwNy45NTM3IDExNy4wMDg3IDEwNy42MjU3IDExNy43NjE3IDEwNy4yNjE3IDExOC40OTQ3QzEwNi44OTc3IDExOS4yMjc3IDEwNi40OTc3IDExOS45NDA3IDEwNi4wNjE3IDEyMC42MzM3QzEwNS42MjU3IDEyMS4zMjY3IDEwNS4xNjM3IDEyMS45OTk3IDEwNC42NzU3IDEyMi42NTI3QzEwNC4xODc3IDEyMy4zMDU3IDEwMy42NzM3IDEyMy45Mzg3IDEwMy4xMzM3IDEyNC41NTE3QzEwMi41OTM3IDEyNS4xNjQ3IDEwMi4wMjc3IDEyNS43NTc3IDEwMS40MzU3IDEyNi4zMzA3QzEwMC44NDM3IDEyNi45MDM3IDEwMC4yMjU3IDEyNy40NTY3IDk5LjU4MTcgMTI3Ljk4OTdDOTguOTM3NyAxMjguNTIyNyA5OC4yNjc3IDEyOS4wMzQ3IDk3LjU3MTcgMTI5LjUyNjdDOTYuODc1NyAxMzAuMDE4NyA5Ni4xNTM3IDEzMC40OTA3IDk1LjQwNTcgMTMwLjk0MjdDOTQuNjU3NyAxMzEuMzk0NyA5My44ODM3IDEzMS44MjU3IDkzLjA4MzcgMTMyLjIzNTdDOTIuMjgzNyAxMzIuNjQ1NyA5MS40NTc3IDEzMy4wMzU3IDkwLjYwNTcgMTMzLjQwNTdDODkuNzUzNyAxMzMuNzc1NyA4OC44NzU3IDEzNC4xMjU3IDg3Ljk3MTcgMTM0LjQ1NTdDODcuMDY3NyAxMzQuNzg1NyA4Ni4xMzc3IDEzNS4wOTU3IDg1LjE4MTcgMTM1LjM4NTdDODQuMjI1NyAxMzUuNjc1NyA4My4yNDM3IDEzNS45NDU3IDgyLjIzNTcgMTM2LjE5NTdDODEuMjI3NyAxMzYuNDQ1NyA4MC4xOTM3IDEzNi42NzU3IDc5LjEzMzcgMTM2Ljg4NTdDNzguMDczNyAxMzcuMDk1NyA3Ni45ODc3IDEzNy4yODU3IDc1Ljg3NTcgMTM3LjQ1NTdDNzQuNzYzNyAxMzcuNjI1NyA3My42MjU3IDEzNy43NzU3IDcyLjQ2MTcgMTM3LjkwNTdDNzEuMjk3NyAxMzguMDM1NyA3MC4xMDc3IDEzOC4xNDU3IDY4Ljg5MTcgMTM4LjIzNTdDNjcuNjc1NyAxMzguMzI1NyA2Ni40MzM3IDEzOC4zOTU3IDY1LjE2NTcgMTM4LjQ0NTdDNjMuODk3NyAxMzguNDk1NyA2Mi42MDc3IDEzOC41MjU3IDYxLjI5NTcgMTM4LjUzNTdDNjAuNTM5NyAxMzguNTQwNyA1OS43ODM3IDEzOC41NDA3IDU5LjAyNzcgMTM4LjUzMDdDNTEuNDY3NyAxMzguMzIwNyA1MC43MTE3IDEzOC4yODA3IDQ5Ljk1NTcgMTM4LjIzNTdDNDkuMTk5NyAxMzguMTkwNyA0OC40NDM3IDEzOC4xNDA3IDQ3LjY4NzcgMTM4LjA4NTdDNDYuOTMxNyAxMzguMDMwNyA0Ni4xNzU3IDEzNy45NzA3IDQ1LjQxOTcgMTM3LjkwNTdDNDQuNjYzNyAxMzcuODQwNyA0My45MDc3IDEzNy43NzA3IDQzLjE1MTcgMTM3LjY5NTdDNDIuMzk1NyAxMzcuNjIwNyA0MS42Mzk3IDEzNy41NDA3IDQwLjg4MzcgMTM3LjQ1NTdDNDAuMTI3NyAxMzcuMzcwNyAzOS4zNzE3IDEzNy4yODA3IDM4LjYxNTcgMTM3LjE4NTdDMzcuODU5NyAxMzcuMDkwNyAzNy4xMDM3IDEzNi45OTA3IDM2LjM0NzcgMTM2Ljg4NTdDMzUuNTkxNyAxMzYuNzgwNyAzNC44MzU3IDEzNi42NzA3IDM0LjA3OTcgMTM2LjU1NTdDMzMuMzIzNyAxMzYuNDQwNyAzMi41Njc3IDEzNi4zMjA3IDMxLjgxMTcgMTM2LjE5NTdDMzEuMDU1NyAxMzYuMDcwNyAzMC4yOTk3IDEzNS45NDA3IDI5LjU0MzcgMTM1LjgwNTdDMjguNzg3NyAxMzUuNjcwNyAyOC4wMzE3IDEzNS41MzA3IDI3LjI3NTcgMTM1LjM4NTdDMjYuNTE5NyAxMzUuMjQwNyAyNS43NjM3IDEzNS4wOTA3IDI1LjAwNzcgMTM0LjkzNTdDMjQuMjUxNyAxMzQuNzgwNyAyMy40OTU3IDEzNC42MjA3IDIyLjczOTcgMTM0LjQ1NTdDMjEuOTgzNyAxMzQuMjkwNyAyMS4yMjc3IDEzNC4xMjA3IDIwLjQ3MTcgMTMzLjk0NTdDMTkuNzE1NyAxMzMuNzcwNyAxOC45NTk3IDEzMy41OTA3IDE4LjIwMzcgMTMzLjQwNTdDMTcuNDQ3NyAxMzMuMjIwNyAxNi42OTE3IDEzMy4wMzA3IDE1LjkzNTcgMTMyLjgzNTdDMTUuMTc5NyAxMzIuNjQwNyAxNC40MjM3IDEzMi40NDA3IDEzLjY2NzcgMTMyLjIzNTdDMTIuOTExNyAxMzIuMDMwNyAxMi4xNTU3IDEzMS44MjA3IDExLjM5OTcgMTMxLjYwNTdDMTAuNjQzNyAxMzEuMzkwNyA5Ljg4NzcgMTMxLjE3MDcgOS4xMzE3IDEzMC45NDU3QzguMzc1NyAxMzAuNzIwNyA3LjYxOTcgMTMwLjQ5MDcgNi44NjM3IDEzMC4yNTU3QzYuMTA3NyAxMzAuMDIwNyA1LjM1MTcgMTI5Ljc4MDcgNC41OTU3IDEyOS41MzU3QzMuODM5NyAxMjkuMjkwNyAzLjA4MzcgMTI5LjA0MDcgMi4zMjc3IDEyOC43ODU3QzEuNTcxNyAxMjguNTMwNyAwLjgxNTcgMTI4LjI3MDcgMC4wNTk3IDEyOC4wMDU3QzAuMDM5NyAxMjcuOTk1NyAwLjAxOTcgMTI3Ljk4NTcgMCAxMjcuOTc1N1YxMDBDMCA4OC45NTQzIDguOTU0MyA4MCAyMCA4MEgxNDBDMTUxLjA0NiA4MCAxNjAgODguOTU0MyAxNjAgMTAwVjEyOEMxNjAgMTM5LjA0NiAxNTEuMDQ2IDE0OCAxNDAgMTQ4SDIwQzguOTU0MyAxNDggMCAxMzkuMDQ2IDAgMTI4VjEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTYwIDEwMEM2MCA4OC45NTQzIDY4Ljk1NDMgODAgODAgODBDODEuMDkwOSA4MCA4Mi4xNjY3IDgwLjAzNDcgODMuMjI3MyA4MC4xMDI3Qzg0LjI4NzkgODAuMTcwNyA4NS4zMjkyIDgwLjI3MTcgODYuMzQ3NyA4MC40MDQ3Qzg3LjM2NjIgODAuNTM3NyA4OC4zNTk3IDgwLjcwMjcgODkuMzI1NyA4MC44OTk3QzkwLjI5MTcgODEuMDk2NyA5MS4yMjg3IDgxLjMyNTcgOTIuMTM1NyA4MS41ODY3QzkzLjA0MjcgODEuODQ3NyA5My45MjA3IDgyLjE0MDcgOTQuNzY1NyA4Mi40NjU3Qzk1LjYxMDcgODIuNzkwNyA5Ni40MjE3IDgzLjE0NzcgOTcuMTk3NyA4My41MzY3Qzk3Ljk3MzcgODMuOTI1NyA5OC43MTM3IDg0LjM0NjcgOTkuNDE1NyA4NC43OTk3QzEwMC4xMTc3IDg1LjI1MjcgMTAwLjc4NTcgODUuNzM3NyAxMDEuNDE5NyA4Ni4yNTQ3QzEwMi4wNTM3IDg2Ljc3MTcgMTAyLjY1MzcgODcuMzIwNyAxMDMuMjE5NyA4Ny44OTk3QzEwMy43ODU3IDg4LjQ3ODcgMTA0LjMxNzcgODkuMDg4NyAxMDQuODE1NyA4OS43Mjk3QzEwNS4zMTM3IDkwLjM3MDcgMTA1Ljc3NzcgOTEuMDQyNyAxMDYuMjA1NyA5MS43MzU3QzEwNi42MzM3IDkyLjQyODcgMTA3LjAyNTcgOTMuMTQxNyAxMDcuMzgxNyA5My44NzQ3QzEwNy43Mzc3IDk0LjYwNzcgMTA4LjA1NzcgOTUuMzYwNyAxMDguMzQxNyA5Ni4xMzM3QzEwOC42MjU3IDk2LjkwNjcgMTA4Ljg3MzcgOTcuNjk5NyAxMDkuMDg1NyA5OC41MDI3QzEwOS4yOTc3IDk5LjMwNTcgMTA5LjQ3MzcgMTAwLjEyODcgMTA5LjYxMzcgMTAwLjk3MTdDMTA5Ljc1MzcgMTAxLjgxNDcgMTA5Ljg1NzcgMTAyLjY2NzcgMTA5LjkyNTcgMTAzLjUzMDdDMTA5Ljk5MzcgMTA0LjM5MzcgMTEwLjAyNTcgMTA1LjI2NjcgMTEwLjAyMTcgMTA2LjE0OTdDMTEwLjAxNzcgMTA3LjAzMjcgMTA5Ljk3NzcgMTA3LjkxNTcgMTA5LjkwMTcgMTA4Ljc4ODdDMTA5LjgyNTcgMTA5LjY2MTcgMTA5LjcxMzcgMTEwLjUyNDcgMTA5LjU2NTcgMTExLjM2NzdDMTA5LjQxNzcgMTEyLjIxMDcgMTA5LjIzMzcgMTEzLjA0MzcgMTA5LjAxMzcgMTEzLjg1NjdDMTA4Ljc5MzcgMTE0LjY2OTcgMTA4LjUzNzcgMTE1LjQ2MjcgMTA4LjI0NTcgMTE2LjIzNTdDMTA3Ljk1MzcgMTE3LjAwODcgMTA3LjYyNTcgMTE3Ljc2MTcgMTA3LjI2MTcgMTE4LjQ5NDdDMTA2Ljg5NzcgMTE5LjIyNzcgMTA2LjQ5NzcgMTE5Ljk0MDcgMTA2LjA2MTcgMTIwLjYzMzdDMTA1LjYyNTcgMTIxLjMyNjcgMTA1LjE2MzcgMTIxLjk5OTcgMTA0LjY3NTcgMTIyLjY1MjdDMTA0LjE4NzcgMTIzLjMwNTcgMTAzLjY3MzcgMTIzLjkzODcgMTAzLjEzMzcgMTI0LjU1MTdDMTAyLjU5MzcgMTI1LjE2NDcgMTAyLjAyNzcgMTI1Ljc1NzcgMTAxLjQzNTcgMTI2LjMzMDdDMTAwLjg0MzcgMTI2LjkwMzcgMTAwLjIyNTcgMTI3LjQ1NjcgOTkuNTgxNyAxMjcuOTg5N0M5OC45Mzc3IDEyOC41MjI3IDk4LjI2NzcgMTI5LjAzNDcgOTcuNTcxNyAxMjkuNTI2N0M5Ni44NzU3IDEzMC4wMTg3IDk2LjE1MzcgMTMwLjQ5MDcgOTUuNDA1NyAxMzAuOTQyN0M5NC42NTc3IDEzMS4zOTQ3IDkzLjg4MzcgMTMxLjgyNTcgOTMuMDgzNyAxMzIuMjM1N0M5Mi4yODM3IDEzMi42NDU3IDkxLjQ1NzcgMTMzLjAzNTcgOTAuNjA1NyAxMzMuNDA1N0M4OS43NTM3IDEzMy43NzU3IDg4Ljg3NTcgMTM0LjEyNTcgODcuOTcxNyAxMzQuNDU1N0M4Ny4wNjc3IDEzNC43ODU3IDg2LjEzNzcgMTM1LjA5NTcgODUuMTgxNyAxMzUuMzg1N0M4NC4yMjU3IDEzNS42NzU3IDgzLjI0MzcgMTM1Ljk0NTcgODIuMjM1NyAxMzYuMTk1N0M4MS4yMjc3IDEzNi40NDU3IDgwLjE5MzcgMTM2LjY3NTcgNzkuMTMzNyAxMzYuODg1N0M3OC4wNzM3IDEzNy4wOTU3IDc2Ljk4NzcgMTM3LjI4NTcgNzUuODc1NyAxMzcuNDU1N0M3NC43NjM3IDEzNy42MjU3IDczLjYyNTcgMTM3Ljc3NTcgNzIuNDYxNyAxMzcuOTA1N0M3MS4yOTc3IDEzOC4wMzU3IDcwLjEwNzcgMTM4LjE0NTcgNjguODkxNyAxMzguMjM1N0M2Ny42NzU3IDEzOC4zMjU3IDY2LjQzMzcgMTM4LjM5NTcgNjUuMTY1NyAxMzguNDQ1N0M2My44OTc3IDEzOC40OTU3IDYyLjYwNzcgMTM4LjUyNTcgNjEuMjk1NyAxMzguNTM1N0M2MC41Mzk3IDEzOC41NDA3IDU5Ljc4MzcgMTM4LjU0MDcgNTkuMDI3NyAxMzguNTMwN0M1OC4yNzE3IDEzOC41MzA3IDU3LjUxNTcgMTM4LjUyMDcgNTYuNzU5NyAxMzguNTA1N0M1Ni4wMDM3IDEzOC40OTA3IDU1LjI0NzcgMTM4LjQ3MDcgNTQuNDkxNyAxMzguNDQ1N0M1My43MzU3IDEzOC40MjA3IDUyLjk3OTcgMTM4LjM5MDcgNTEuNDY3NyAxMzguMzIwNyA1MC43MTE3IDEzOC4yODA3IDQ5Ljk1NTcgMTM4LjIzNTdDNDkuMTk5NyAxMzguMTkwNyA0OC40NDM3IDEzOC4xNDA3IDQ3LjY4NzcgMTM4LjA4NTdDNDYuOTMxNyAxMzguMDMwNyA0Ni4xNzU3IDEzNy45NzA3IDQ1LjQxOTcgMTM3LjkwNTdDNDQuNjYzNyAxMzcuODQwNyA0My45MDc3IDEzNy43NzA3IDQzLjE1MTcgMTM3LjY5NTdDNDIuMzk1NyAxMzcuNjIwNyA0MS42Mzk3IDEzNy41NDA3IDQwLjg4MzcgMTM3LjQ1NTdDNDAuMTI3NyAxMzcuMzcwNyAzOS4zNzE3IDEzNy4yODA3IDM4LjYxNTcgMTM3LjE4NTdDMzcuODU5NyAxMzcuMDkwNyAzNy4xMDM3IDEzNi45OTA3IDM2LjM0NzcgMTM2Ljg4NTdDMzUuNTkxNyAxMzYuNzgwNyAzNC44MzU3IDEzNi42NzA3IDM0LjA3OTcgMTM2LjU1NTdDMzMuMzIzNyAxMzYuNDQwNyAzMi41Njc3IDEzNi4zMjA3IDMxLjgxMTcgMTM2LjE5NTdDMzEuMDU1NyAxMzYuMDcwNyAzMC4yOTk3IDEzNS45NDA3IDI5LjU0MzcgMTM1LjgwNTdDMjguNzg3NyAxMzUuNjcwNyAyOC4wMzE3IDEzNS41MzA3IDI3LjI3NTcgMTM1LjM4NTdDMjYuNTE5NyAxMzUuMjQwNyAyNS43NjM3IDEzNS4wOTA3IDI1LjAwNzcgMTM0LjkzNTdDMjQuMjUxNyAxMzQuNzgwNyAyMy40OTU3IDEzNC42MjA3IDIyLjczOTcgMTM0LjQ1NTdDMjEuOTgzNyAxMzQuMjkwNyAyMS4yMjc3IDEzNC4xMjA3IDIwLjQ3MTcgMTMzLjk0NTdDMTkuNzE1NyAxMzMuNzcwNyAxOC45NTk3IDEzMy41OTA3IDE4LjIwMzcgMTMzLjQwNTdDMTcuNDQ3NyAxMzMuMjIwNyAxNi42OTE3IDEzMy4wMzA3IDE1LjkzNTcgMTMyLjgzNTdDMTUuMTc5NyAxMzIuNjQwNyAxNC40MjM3IDEzMi40NDA3IDEzLjY2NzcgMTMyLjIzNTdDMTIuOTExNyAxMzIuMDMwNyAxMi4xNTU3IDEzMS44MjA3IDExLjM5OTcgMTMxLjYwNTdDMTAuNjQzNyAxMzEuMzkwNyA5Ljg4NzcgMTMxLjE3MDcgOS4xMzE3IDEzMC45NDU3QzguMzc1NyAxMzAuNzIwNyA3LjYxOTcgMTMwLjQ5MDcgNi44NjM3IDEzMC4yNTU3QzYuMTA3NyAxMzAuMDIwNyA1LjM1MTcgMTI5Ljc4MDcgNC41OTU3IDEyOS41MzU3QzMuODM5NyAxMjkuMjkwNyAzLjA4MzcgMTI5LjA0MDcgMi4zMjc3IDEyOC43ODU3QzEuNTcxNyAxMjguNTMwNyAwLjgxNTcgMTI4LjI3MDcgMC4wNTk3IDEyOC4wMDU3QzAuMDM5NyAxMjcuOTk1NyAwLjAxOTcgMTI3Ljk4NTcgMCAxMjcuOTc1N1YxMDBDMCA4OC45NTQzIDguOTU0MyA4MCAyMCA4MEgxNDBDMTUxLjA0NiA4MCAxNjAgODguOTU0MyAxNjAgMTAwVjEyOEMxNjAgMTM5LjA0NiAxNTEuMDQ2IDE0OCAxNDAgMTQ4SDIwQzguOTU0MyAxNDggMCAxMzkuMDQ2IDAgMTI4VjEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                                  Cliquer pour agrandir
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <RapportsList 
                  evenementId={selectedEvent.id} 
                  evenementTitre={selectedEvent.titre} 
                />
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowEventDetail(false)
                    handleGenerateContent(selectedEvent)
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Générer contenu IA
                </button>
                {!isDirecteur && (
                  <button
                    onClick={() => {
                      setShowEventDetail(false)
                      handleEditEvent(selectedEvent)
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Modifier
                  </button>
                )}
                <button
                  onClick={() => setShowEventDetail(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails d'atelier */}
      {showAtelierDetail && selectedAtelier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">{selectedAtelier.titre}</h2>
                </div>
                <button
                  onClick={() => setShowAtelierDetail(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations principales */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations générales</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                        <p className="text-gray-900 font-medium">{selectedAtelier.titre}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getAtelierStatusColor(selectedAtelier.statut)}`}>
                          {getAtelierStatusLabel(selectedAtelier.statut)}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                        <p className="text-gray-900">{selectedAtelier.lieu || 'Non spécifié'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacité</label>
                        <p className="text-gray-900">
                          {selectedAtelier.capacite_actuelle || 0} / {selectedAtelier.capacite_max} participants
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Dates et horaires</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Début :</span>
                        <span className="text-sm font-medium">{formatDate(selectedAtelier.date_debut)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Fin :</span>
                        <span className="text-sm font-medium">{formatDate(selectedAtelier.date_fin)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Durée :</span>
                        <span className="text-sm font-medium">{getDuration(selectedAtelier.date_debut, selectedAtelier.date_fin)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedAtelier.description || 'Aucune description disponible'}
                    </p>
                  </div>

                  {selectedAtelier.pole && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Pôle</h3>
                      <p className="text-gray-700">{selectedAtelier.pole}</p>
                    </div>
                  )}

                  {selectedAtelier.filliere && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Filière</h3>
                      <p className="text-gray-700">{selectedAtelier.filliere}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setEditingAtelier(selectedAtelier)
                  setShowAtelierForm(true)
                  setShowAtelierDetail(false)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => setShowAtelierDetail(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulaire Atelier */}
      {showAtelierForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AtelierForm
              atelier={editingAtelier}
              onSave={handleSaveAtelier}
              onCancel={() => {
                setShowAtelierForm(false)
                setEditingAtelier(null)
              }}
              isAdmin={true} // TODO: Récupérer le rôle de l'utilisateur
            />
          </div>
        </div>
      )}

      {/* Modal Gestionnaire d'Inscriptions */}
      {showInscriptionsManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <AtelierInscriptionsManager />
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowInscriptionsManager(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression multiple */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer {selectedEvents.length} événement(s) ? 
              Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'import Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Importer des événements depuis Excel</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Section 1: Télécharger le template */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">1. Télécharger le template</h3>
                <p className="text-gray-600 mb-3">
                  Téléchargez le fichier template pour voir le format attendu
                </p>
                {!isDirecteur && (
                  <button
                    onClick={downloadTemplate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger template_evenements.xlsx
                  </button>
                )}
              </div>

              {/* Section 2: Upload du fichier */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">2. Importer votre fichier Excel</h3>
                <p className="text-gray-600 mb-3">
                  Sélectionnez votre fichier Excel rempli avec les données
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Section 3: Aperçu des données */}
              {importPreview.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">
                    3. Aperçu des données ({importPreview.length} événements)
                  </h3>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2">Titre</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Lieu</th>
                          <th className="text-left p-2">Volet</th>
                          <th className="text-left p-2">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 10).map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{item.titre}</td>
                            <td className="p-2">{item.type_evenement}</td>
                            <td className="p-2">{item.date_debut}</td>
                            <td className="p-2">{item.lieu}</td>
                            <td className="p-2">{volets.find(v => v.value === item.volet)?.label || item.volet}</td>
                            <td className="p-2">{item.statut}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importPreview.length > 10 && (
                      <p className="text-gray-500 text-sm mt-2">
                        ... et {importPreview.length - 10} autres événements
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importPreview.length || importing}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {importing ? 'Import en cours...' : 'Importer les événements'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onglet Enquête d'Insertion */}
      {activeTab === 'enquete' && (
        <div className="min-h-screen bg-gray-50">
          <iframe 
            src="/enquete-insertion"
            className="w-full border-0"
            style={{ height: 'calc(100vh - 200px)' }}
            title="Enquête d'Insertion"
          />
        </div>
      )}
    </div>
  )
} 