'use client'

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Building2, Calendar, FileText, Download, 
  Target, Activity, BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  CheckCircle, AlertCircle, Clock, UserCheck, Briefcase, GraduationCap,
  FileDown, Presentation
} from 'lucide-react';
import { useEntreprises } from '@/hooks/useEntreprises';
import { useEvenements } from '@/hooks/useEvenements';
import { useVisitesEntreprises } from '@/hooks/useVisitesEntreprises';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { generateEmployabilityPDF } from '@/utils/pdfGenerator';

interface KPICard {
  label: string;
  value: string | number;
  trend: string;
  trendValue: number;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  icon: React.ComponentType<unknown>;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
  }[];
}

interface EventMetrics {
  totalEvents: number;
  totalBeneficiaries: number;
  totalCandidates: number;
  totalRetained: number;
  conversionRate: number;
  eventsByVolet: { [key: string]: number };
  eventsByType: { [key: string]: number };
  eventsByPole: { [key: string]: number };
  conversionRateByPole: { [key: string]: number };
}

interface EnterpriseMetrics {
  totalEnterprises: number;
  prospects: number;
  /** Nombre d’entreprises du module Partenariats (table partenaires_entreprises) */
  partners: number;
  sectors: { [key: string]: number };
  // Métriques des visites
  totalVisites: number;
  visitesPlanifiees: number;
  // Statut BD
  statutBD: {
    label: string;
    date?: string;
    color: string;
    icon: string;
  };
  // Champs supprimés : visitesEffectuees, actionsEnRetard, tauxVisitesParEntreprise, entreprisesPrioritaires
}

interface DemandMetrics {
  totalDemands: number;
  activeDemands: number;
  totalProfiles: number;
  topEnterprises: { name: string; demands: number }[];
}

export const EmployabilityDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [eventMetrics, setEventMetrics] = useState<EventMetrics | null>(null);
  const [enterpriseMetrics, setEnterpriseMetrics] = useState<EnterpriseMetrics | null>(null);
  const [demandMetrics, setDemandMetrics] = useState<DemandMetrics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_year');
  const [exporting, setExporting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingPPTX, setExportingPPTX] = useState(false);

  const { entreprises, loading: entreprisesLoading, refresh: refreshEntreprises } = useEntreprises();
  const { evenements, loading: evenementsLoading, refresh: refreshEvenements } = useEvenements();
  const { visites, loading: visitesLoading, getStats } = useVisitesEntreprises();

  // Fonction pour rafraîchir toutes les données
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshEntreprises(),
        refreshEvenements()
      ]);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setLoading(false);
    }
  };
  const { poles, filieres } = useSettings();
  const { user: currentUser } = useAuth();
  const { isAdmin, isDirecteur, isManager, isConseiller } = useRole();

  // Fonction pour filtrer les données selon la période sélectionnée
  const filterByPeriod = <T extends Record<string, any>>(
    items: T[],
    dateField: 'date_debut' | 'created_at' | 'date_visite' = 'date_debut'
  ): T[] => {
    if (!items || items.length === 0) return [];
    if (selectedPeriod === 'all_time') return items;

    const now = new Date();
    let startDate: Date;

    if (selectedPeriod === 'current_month') {
      // Ce mois : du 1er du mois actuel jusqu'à aujourd'hui
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (selectedPeriod === 'current_year') {
      // Cette année : du 1er janvier jusqu'à aujourd'hui
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      return items;
    }

    return items.filter(item => {
      const itemDate = item[dateField] as string | undefined;
      if (!itemDate) return false;
      
      try {
        const date = new Date(itemDate);
        return date >= startDate && date <= now;
      } catch {
        return false;
      }
    });
  };

  // Fonction pour obtenir la couleur de fond selon le pôle
  const getPoleBackgroundColor = (poleName: string): string => {
    // Normaliser le nom du pôle (minuscules, sans accents, sans espaces multiples)
    const normalizedName = poleName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ');

    // Mapping des couleurs pastel/vives par pôle
    const poleColorMap: { [key: string]: string } = {
      'btp': '#FFD700',                    // Jaune vif - couleur construction
      'artisanat': '#E8D5B7',              // Beige chaud - couleur artisanale
      'industrie': '#B0C4DE',              // Gris bleuté pastel - harmonieux avec la palette
      'sante': '#FFE5F1',                  // Rose pâle - doux et apaisant
      'peche aqua': '#87CEEB',             // Bleu ciel - couleur eau/ciel
      'peche aquacole': '#87CEEB',         // Bleu ciel - couleur eau/ciel
      'peche maintenance': '#87CEEB',      // Bleu ciel - couleur eau/ciel
      'agriculture': '#B8E6B8',            // Vert nature pastel - couleur nature
      'agc': '#7FCDCD',                    // Turquoise pastel - créatif et moderne
      'arts et industries graphiques': '#7FCDCD', // Turquoise pastel - créatif et moderne
      'ev': '#FFE0A8',                     // Jaune/ambre pastel - énergique
      'digital & ag': '#FFB88C',           // Orange pastel - tech/innovation
      'digitale et ia': '#FFB88C',         // Orange pastel - tech/innovation
      'digitale et ag': '#FFB88C',         // Orange pastel - tech/innovation
      'hotellerie & tourisme': '#FFA07A',   // Corail pastel - chaleureux et accueillant
      'tourisme & hotellerie & restauration': '#FFA07A', // Corail pastel - chaleureux et accueillant
      'gestion & commerce': '#DDA0DD',     // Mauve pastel - professionnel
    };

    // Recherche exacte d'abord
    if (poleColorMap[normalizedName]) {
      return poleColorMap[normalizedName];
    }

    // Recherche partielle (pour gérer les variations)
    for (const [key, color] of Object.entries(poleColorMap)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return color;
      }
    }

    // Couleur par défaut (bleu ciel pastel) si non trouvé
    return '#A8D0E0';
  };

    // Calculer les métriques des événements (filtrées par période)
  useEffect(() => {
    if (evenements) {
      // Filtrer les événements selon la période sélectionnée
      const filteredEvenements = filterByPeriod(evenements, 'date_debut');
      
      const metrics: EventMetrics = {
        totalEvents: filteredEvenements.length,
        totalBeneficiaries: filteredEvenements.reduce((sum, event) => sum + (event.nombre_beneficiaires || 0), 0),
        totalCandidates: filteredEvenements.reduce((sum, event) => sum + (event.nombre_candidats || 0), 0),
        totalRetained: filteredEvenements.reduce((sum, event) => sum + (event.nombre_candidats_retenus || 0), 0),
        conversionRate: 0,
        eventsByVolet: {},
        eventsByType: {},
        eventsByPole: {},
        conversionRateByPole: {}
      };

      // Calculer le taux de conversion global
      if (metrics.totalCandidates > 0) {
        metrics.conversionRate = Math.round((metrics.totalRetained / metrics.totalCandidates) * 100 * 100) / 100;
      }

      // Répartition par volet
      filteredEvenements.forEach(event => {
        const volet = event.volet || 'non_defini';
        metrics.eventsByVolet[volet] = (metrics.eventsByVolet[volet] || 0) + 1;
      });

      // Répartition par pôle et calcul des taux de conversion
      const poleStats: { [key: string]: { count: number; candidates: number; retained: number } } = {};
      
      filteredEvenements.forEach(event => {
        if (event.pole_id) {
          const pole = poles.find(p => p.id === event.pole_id);
          const poleName = pole ? pole.nom : `Pôle ID: ${event.pole_id} (à corriger)`;
          
          if (!poleStats[poleName]) {
            poleStats[poleName] = { count: 0, candidates: 0, retained: 0 };
          }
          
          poleStats[poleName].count += 1;
          poleStats[poleName].candidates += (event.nombre_candidats || 0);
          poleStats[poleName].retained += (event.nombre_candidats_retenus || 0);
        }
        // Les événements sans pôle assigné ne sont pas inclus dans les métriques par pôles
      });
     
      // Convertir les statistiques en métriques
      Object.entries(poleStats).forEach(([poleName, stats]) => {
        metrics.eventsByPole[poleName] = stats.count;
        if (stats.candidates > 0) {
          metrics.conversionRateByPole[poleName] = Math.round((stats.retained / stats.candidates) * 100 * 100) / 100;
        } else {
          metrics.conversionRateByPole[poleName] = 0;
        }
      });

      setEventMetrics(metrics);
    }
  }, [evenements, poles, selectedPeriod]);

  // Calculer les métriques des entreprises et des visites (filtrées par période)
  useEffect(() => {
    let cancelled = false;

    const loadEnterpriseMetrics = async () => {
    // S'assurer que visites est défini (peut être un tableau vide)
    const visitesArray = visites || [];
    
    // Filtrer les visites selon la période sélectionnée
    const filteredVisites = filterByPeriod(visitesArray, 'date_visite');
    
    // Calculer les métriques des visites filtrées
    const visitesStats = getStats();
    
    // Déterminer le statut BD basé sur les visites planifiées (pour tous les utilisateurs)
    // Note: Le statut BD utilise toutes les visites, pas seulement celles filtrées
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Trouver les visites planifiées pour aujourd'hui
    const visitesAujourdhui = visitesArray.filter(v => {
      if (!v.date_visite) return false;
      try {
        const dateVisite = new Date(v.date_visite);
        dateVisite.setHours(0, 0, 0, 0);
        return dateVisite.getTime() === today.getTime();
      } catch (e) {
        return false;
      }
    });
    
    // Trouver la prochaine visite planifiée
    const prochaineVisite = visitesArray
      .filter(v => {
        if (!v.date_visite) return false;
        try {
          const dateVisite = new Date(v.date_visite);
          dateVisite.setHours(0, 0, 0, 0);
          return dateVisite.getTime() >= today.getTime();
        } catch (e) {
          return false;
        }
      })
      .sort((a, b) => {
        try {
          return new Date(a.date_visite).getTime() - new Date(b.date_visite).getTime();
        } catch (e) {
          return 0;
        }
      })[0];
    
    let statutBD: EnterpriseMetrics['statutBD'];
    
    if (visitesAujourdhui.length > 0) {
      // BD EN DÉPLACEMENT : visite planifiée aujourd'hui
      const visite = visitesAujourdhui[0];
      const dateVisite = new Date(visite.date_visite);
      statutBD = {
        label: `BD EN DÉPLACEMENT`,
        date: dateVisite.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
        color: 'text-blue-600 bg-blue-50',
        icon: '🚗'
      };
    } else if (prochaineVisite) {
      // BD EN VISITE : pas de visite aujourd'hui mais visite planifiée
      const dateVisite = new Date(prochaineVisite.date_visite);
      const joursRestants = Math.ceil((dateVisite.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      statutBD = {
        label: `BD EN VISITE`,
        date: joursRestants === 1 
          ? 'Demain' 
          : `Dans ${joursRestants} jours (${dateVisite.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })})`,
        color: 'text-orange-600 bg-orange-50',
        icon: '📅'
      };
    } else {
      // BD EN CMC : pas de visite planifiée
      statutBD = {
        label: 'BD EN CMC',
        color: 'text-gray-600 bg-gray-50',
        icon: '🏢'
      };
    }
    
    // Filtrer les entreprises selon la période (basé sur created_at)
    const filteredEntreprises = entreprises ? filterByPeriod(entreprises, 'created_at') : [];

    // Partenaires = référentiel onglet Partenariats (pas le statut CRM « partenaire »)
    let partnersCount = 0;
    try {
      const { data: partenairesRows, error: partenairesError } = await supabase
        .from('partenaires_entreprises')
        .select('id, created_at');
      if (partenairesError) {
        console.error('Erreur chargement partenaires_entreprises:', partenairesError);
      } else {
        partnersCount = filterByPeriod(partenairesRows || [], 'created_at').length;
      }
    } catch (err) {
      console.error('Erreur partenaires_entreprises:', err);
    }
    
    // Créer les métriques (toujours, même si entreprises n'est pas chargé)
    const metrics: EnterpriseMetrics = {
      totalEnterprises: filteredEntreprises.length,
      prospects: filteredEntreprises.filter(e => e.statut === 'prospect').length,
      partners: partnersCount,
      sectors: {},
      // Métriques des visites filtrées
      totalVisites: filteredVisites.length,
      visitesPlanifiees: visitesStats.visitesPlanifiees || 0,
      statutBD
    };

    // Répartition par secteur (si entreprises est chargé)
    if (filteredEntreprises.length > 0) {
      filteredEntreprises.forEach(entreprise => {
        const secteur = entreprise.secteur || 'Non défini';
        metrics.sectors[secteur] = (metrics.sectors[secteur] || 0) + 1;
      });
    }

    if (!cancelled) setEnterpriseMetrics(metrics);
    };

    void loadEnterpriseMetrics();
    return () => {
      cancelled = true;
    };
  }, [entreprises, visites, getStats, selectedPeriod]);

  // Calculer les métriques des demandes (filtrées par période)
  useEffect(() => {
    const fetchDemandMetrics = async () => {
      try {
        // Requête corrigée selon la structure réelle de la table
        const { data: demandes, error } = await supabase
          .from('demandes_entreprises')
          .select(`
            id,
            statut,
            entreprise_nom,
            profils,
            created_at
          `);

        if (error) throw error;

        // Filtrer les demandes selon la période sélectionnée
        const filteredDemandes = filterByPeriod(demandes || [], 'created_at');

        console.log('📋 Demandes récupérées:', filteredDemandes);
        console.log('📊 Statuts des demandes:', filteredDemandes?.map(d => ({ id: d.id, statut: d.statut, entreprise: d.entreprise_nom })));

        const metrics: DemandMetrics = {
          totalDemands: filteredDemandes.length,
          activeDemands: filteredDemandes.filter(d => d.statut === 'en_attente' || d.statut === 'en_cours').length,
          totalProfiles: filteredDemandes.reduce((sum, d) => {
            const profils = d.profils;
            if (Array.isArray(profils)) {
              return sum + profils.length;
            }
            return sum;
          }, 0),
          topEnterprises: []
        };

        console.log('📈 Métriques calculées:', metrics);
        console.log('🎯 Total des demandes:', metrics.totalDemands);
        console.log('🎯 Demandes actives:', metrics.activeDemands);

        // Calculer les entreprises les plus actives
        const enterpriseDemands: { [key: string]: number } = {};
        filteredDemandes.forEach(demande => {
          const entrepriseName = (typeof demande.entreprise_nom === 'string' ? demande.entreprise_nom : 'Inconnue') || 'Inconnue';
          enterpriseDemands[entrepriseName] = (enterpriseDemands[entrepriseName] || 0) + 1;
        });

        metrics.topEnterprises = Object.entries(enterpriseDemands)
          .map(([name, demands]) => ({ name, demands }))
          .sort((a, b) => b.demands - a.demands)
          .slice(0, 5);

        setDemandMetrics(metrics);
        
        // Forcer la mise à jour de l'interface
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des métriques de demandes:', error);
        // En cas d'erreur, on définit quand même des métriques par défaut
        setDemandMetrics({
          totalDemands: 0,
          activeDemands: 0,
          totalProfiles: 0,
          topEnterprises: []
        });
        setLoading(false);
      }
    };

    fetchDemandMetrics();
  }, [selectedPeriod]);

  useEffect(() => {
    // Arrêter le chargement quand toutes les données sont chargées
    const allDataLoaded = !entreprisesLoading && !evenementsLoading && demandMetrics !== null;
    
    if (allDataLoaded) {
      setLoading(false);
    }
  }, [entreprisesLoading, evenementsLoading, demandMetrics, entreprises, evenements]);

  // Timeout de sécurité pour éviter le chargement infini
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 10000); // 10 secondes

    return () => clearTimeout(timeout);
  }, [loading]);

    // Fonction d'export du rapport
  const handleExport = async () => {
    // Vérifier si les données sont encore en cours de chargement
    if (entreprisesLoading || evenementsLoading) {
      alert('Veuillez attendre le chargement complet des données');
      return;
    }

    // Vérifier si les données de base sont disponibles (même si vides)
    if (!evenements || !entreprises) {
      alert('Aucune donnée disponible pour l\'export');
      return;
    }

    // Vérifier si les métriques calculées sont disponibles (même si vides)
    if (!eventMetrics || !enterpriseMetrics) {
      alert('Calcul des métriques en cours, veuillez patienter...');
      return;
    }

    // Utiliser des métriques par défaut si demandMetrics est null
    const finalDemandMetrics = demandMetrics || {
      totalDemands: 0,
      activeDemands: 0,
      totalProfiles: 0,
      topEnterprises: []
    };

    setExporting(true);
    try {
      // Créer le fichier Excel
      const workbook = XLSX.utils.book_new();

      // ========================================
      // FEUILLE 1: RÉSUMÉ EXÉCUTIF
      // ========================================
      const resumeData = [
        ['BILAN D\'EMPLOYABILITÉ - COP CMC SM'],
        [''],
        ['Métadonnées'],
        ['Date d\'export', new Date().toLocaleDateString('fr-FR')],
        ['Période', selectedPeriod === 'current_month' ? 'Ce mois' : 
                   selectedPeriod === 'current_year' ? 'Cette année' : 'Tout le temps'],
        ['Générateur', 'Système COP'],
        [''],
        ['Indicateurs Clés de Performance'],
        ['Indicateur', 'Valeur', 'Description'],
        ['Taux d\'insertion global', `${eventMetrics.conversionRate}%`, 'Pourcentage de candidats retenus sur le total des candidats'],
        ['Stagiaires bénéficiaires', eventMetrics.totalBeneficiaries, 'Nombre total de stagiaires ayant participé aux événements'],
        ['Entreprises partenaires', enterpriseMetrics.partners, 'Nombre d\'entreprises enregistrées dans l\'onglet Partenariats (conventions)'],
        ['Demandes actives', finalDemandMetrics.activeDemands, 'Nombre de demandes de stages actuellement actives'],
        [''],
        ['Répartition par volet'],
        ['Volet', 'Nombre d\'événements'],
        ...Object.entries(eventMetrics.eventsByVolet).map(([volet, count]) => [
          volet === 'information_communication' ? 'Information/Communication' :
          volet === 'accompagnement_projets' ? 'Accompagnement Projets' :
          volet === 'assistance_carriere' ? 'Assistance Carrière' :
          volet === 'assistance_filiere' ? 'Assistance Filière' : volet,
          count
        ]),
        [''],
        ['Répartition par secteur'],
        ['Secteur', 'Nombre d\'entreprises'],
        ...Object.entries(enterpriseMetrics.sectors).map(([secteur, count]) => [secteur, count])
      ];

      const wsResume = XLSX.utils.aoa_to_sheet(resumeData);
      XLSX.utils.book_append_sheet(workbook, wsResume, 'Résumé');

      // ========================================
      // FEUILLE 2: ÉVÉNEMENTS DÉTAILLÉS
      // ========================================
      const evenementsDetailData = [
        ['ÉVÉNEMENTS DÉTAILLÉS - COP CMC SM'],
        [''],
        ['Nom de l\'événement', 'Date de début', 'Date de fin', 'Lieu', 'Volet', 'Pôle concerné', 'Filière concernée', 'Statut', 'Type d\'événement', 'Stagiaires bénéficiaires', 'Candidats reçus', 'Candidats retenus', 'Taux de conversion (%)', 'Description'],
        ...(selectedPeriod === 'all_time' ? evenements : filterByPeriod(evenements, 'date_debut')).map(event => {
          const pole = poles.find(p => p.id === event.pole_id);
          const filiere = filieres.find(f => f.id === event.filiere_id);
          
          return [
            event.titre || 'N/A',
            event.date_debut ? new Date(event.date_debut).toLocaleDateString('fr-FR') : 'N/A',
            event.date_fin ? new Date(event.date_fin).toLocaleDateString('fr-FR') : 'N/A',
            event.lieu || 'N/A',
            event.volet === 'information_communication' ? 'Information/Communication' :
            event.volet === 'accompagnement_projets' ? 'Accompagnement Projets' :
            event.volet === 'assistance_carriere' ? 'Assistance Carrière' :
            event.volet === 'assistance_filiere' ? 'Assistance Filière' : (event.volet || 'Non défini'),
            pole ? pole.nom : 'N/A',
            filiere ? filiere.nom : 'N/A',
            event.statut || 'N/A',
            event.type_evenement_id || 'N/A',
            event.nombre_beneficiaires || 0,
            event.nombre_candidats || 0,
            event.nombre_candidats_retenus || 0,
            event.taux_conversion ? `${event.taux_conversion}%` : '0%',
            event.description || 'N/A'
          ];
        })
      ];

      const wsEvenementsDetail = XLSX.utils.aoa_to_sheet(evenementsDetailData);
      XLSX.utils.book_append_sheet(workbook, wsEvenementsDetail, 'Événements Détaillés');

      // ========================================
      // FEUILLE 3: ENTREPRISES DÉTAILLÉES
      // ========================================
      const entreprisesDetailData = [
        ['ENTREPRISES DÉTAILLÉES - COP CMC SM'],
        [''],
        ['Nom de l\'entreprise', 'Secteur d\'activité', 'Statut', 'Contact principal', 'Email', 'Téléphone', 'Adresse', 'Niveau d\'intérêt', 'Contrat de partenariat', 'Date de création'],
        ...entreprises.map(entreprise => [
          entreprise.nom || 'N/A',
          entreprise.secteur || 'N/A',
          entreprise.statut === 'prospect' ? 'Prospect' : 
          entreprise.statut === 'partenaire' ? 'Partenaire' : (entreprise.statut || 'N/A'),
          entreprise.contact_principal_nom || 'N/A',
          entreprise.contact_principal_email || 'N/A',
          entreprise.contact_principal_telephone || 'N/A',
          entreprise.adresse || 'N/A',
          entreprise.niveau_interet === 'faible' ? 'Faible' :
          entreprise.niveau_interet === 'moyen' ? 'Moyen' :
          entreprise.niveau_interet === 'fort' ? 'Fort' : (entreprise.niveau_interet || 'N/A'),
          entreprise.contrat_url ? 'Oui' : 'Non',
          entreprise.created_at ? new Date(entreprise.created_at).toLocaleDateString('fr-FR') : 'N/A'
        ])
      ];

      const wsEntreprisesDetail = XLSX.utils.aoa_to_sheet(entreprisesDetailData);
      XLSX.utils.book_append_sheet(workbook, wsEntreprisesDetail, 'Entreprises Détaillées');

      // ========================================
      // FEUILLE 4: DEMANDES DÉTAILLÉES
      // ========================================
      // Récupérer les demandes détaillées
      const { data: demandesDetail, error: demandesError } = await supabase
        .from('demandes_entreprises')
        .select(`
          id,
          statut,
          created_at,
          entreprise_nom,
          profils
        `);

      const demandesDetailData = [
        ['DEMANDES DÉTAILLÉES - COP CMC SM'],
        [''],
        ['ID Demande', 'Entreprise demandeur', 'Statut', 'Profils demandés', 'Date de création'],
        ...(demandesDetail || []).map(demande => [
          demande.id || 'N/A',
          demande.entreprise_nom || 'N/A',
          demande.statut === 'active' ? 'Active' : 
          demande.statut === 'inactive' ? 'Inactive' : (demande.statut || 'N/A'),
          (Array.isArray(demande.profils) ? demande.profils.map((p: any) => p.titre).join(', ') : 'N/A'),
          (demande.created_at && typeof demande.created_at === 'string') ? new Date(demande.created_at).toLocaleDateString('fr-FR') : 'N/A'
        ])
      ];

      const wsDemandesDetail = XLSX.utils.aoa_to_sheet(demandesDetailData);
      XLSX.utils.book_append_sheet(workbook, wsDemandesDetail, 'Demandes Détaillées');

      // ========================================
      // FEUILLE 5: ANALYSES ET TENDANCES
      // ========================================
      const analysesData = [
        ['ANALYSES ET TENDANCES - COP CMC SM'],
        [''],
        ['Métriques Globales'],
        ['Indicateur', 'Valeur'],
        ['Total événements organisés', eventMetrics.totalEvents],
        ['Total stagiaires bénéficiaires', eventMetrics.totalBeneficiaries],
        ['Total candidats reçus', eventMetrics.totalCandidates],
        ['Total candidats retenus', eventMetrics.totalRetained],
        ['Taux d\'insertion global', `${eventMetrics.conversionRate}%`],
        [''],
        ['Métriques Entreprises'],
        ['Total entreprises', enterpriseMetrics.totalEnterprises],
        ['Entreprises prospects', enterpriseMetrics.prospects],
        ['Entreprises partenaires (onglet Partenariats)', enterpriseMetrics.partners],
        [
          'Entreprises référencées (visites / CRM)',
          enterpriseMetrics.totalEnterprises,
          'Total fiches entreprises hors module Partenariats',
        ],
        [''],
        ['Métriques Visites Entreprises'],
        ['Total visites', enterpriseMetrics.totalVisites],
        ['Visites planifiées', enterpriseMetrics.visitesPlanifiees],
        ['Statut BD', `${enterpriseMetrics.statutBD.label}${enterpriseMetrics.statutBD.date ? ` - ${enterpriseMetrics.statutBD.date}` : ''}`],
        [''],
        ['Métriques Demandes'],
        ['Total demandes', finalDemandMetrics.totalDemands],
        ['Demandes actives', finalDemandMetrics.activeDemands],
        ['Total profils demandés', finalDemandMetrics.totalProfiles],
        [''],
        ['Top 5 Entreprises Actives'],
        ['Entreprise', 'Nombre de demandes'],
        ...(finalDemandMetrics.topEnterprises.length > 0 
          ? finalDemandMetrics.topEnterprises.map(item => [item.name, item.demands])
          : [['Aucune donnée', 0]]),
        [''],
        ['Métriques par Pôles'],
        ['Pôle', 'Nombre d\'événements', 'Taux d\'insertion (%)'],
        ...Object.entries(eventMetrics.eventsByPole).map(([poleName, eventCount]) => [
          poleName,
          eventCount,
          `${eventMetrics.conversionRateByPole[poleName] || 0}%`
        ])
      ];

      const wsAnalyses = XLSX.utils.aoa_to_sheet(analysesData);
      XLSX.utils.book_append_sheet(workbook, wsAnalyses, 'Analyses et Tendances');

      // Générer le nom du fichier
      const fileName = `Bilan_Employabilite_COP_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Télécharger le fichier
      XLSX.writeFile(workbook, fileName);

      // Message de succès
      alert(`Rapport exporté avec succès : ${fileName}`);

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export du rapport. Veuillez réessayer.');
         } finally {
       setExporting(false);
     }
   };

   // Fonction d'export PDF
   const handleExportPDF = async () => {
     // Vérifier si les données sont encore en cours de chargement
     if (entreprisesLoading || evenementsLoading) {
       alert('Veuillez attendre le chargement complet des données');
       return;
     }

     // Vérifier si les données de base sont disponibles
     if (!evenements || !entreprises) {
       alert('Aucune donnée disponible pour l\'export');
       return;
     }

     // Vérifier si les métriques calculées sont disponibles
     if (!eventMetrics || !enterpriseMetrics) {
       alert('Calcul des métriques en cours, veuillez patienter...');
       return;
     }

     setExportingPDF(true);
     try {
       const pdfData = {
         eventMetrics,
         enterpriseMetrics,
         demandMetrics: demandMetrics || {
           totalDemands: 0,
           activeDemands: 0,
           totalProfiles: 0,
           topEnterprises: []
         },
         evenements,
         entreprises,
         poles,
         filieres
       };

       const doc = await generateEmployabilityPDF(pdfData);
       
       // Générer le nom du fichier
       const fileName = `Bilan_Employabilite_COP_${new Date().toISOString().split('T')[0]}.pdf`;
       
       // Télécharger le fichier
       doc.save(fileName);
       
       // Message de succès
       alert(`Rapport PDF exporté avec succès : ${fileName}`);
       
     } catch (error) {
       console.error('Erreur lors de l\'export PDF:', error);
       alert('Erreur lors de l\'export du rapport PDF. Veuillez réessayer.');
     } finally {
       setExportingPDF(false);
     }
   };

   // Fonction d'export PowerPoint
   const handleExportPPTX = async () => {
     // Vérifier si les données sont encore en cours de chargement
     if (entreprisesLoading || evenementsLoading) {
       alert('Veuillez attendre le chargement complet des données');
       return;
     }

     // Vérifier si les données de base sont disponibles
     if (!evenements || !entreprises) {
       alert('Aucune donnée disponible pour l\'export');
       return;
     }

     // Vérifier si les métriques calculées sont disponibles
     if (!eventMetrics || !enterpriseMetrics) {
       alert('Calcul des métriques en cours, veuillez patienter...');
       return;
     }

     setExportingPPTX(true);
     try {
       const pptxData = {
         eventMetrics,
         enterpriseMetrics,
         demandMetrics: demandMetrics || {
           totalDemands: 0,
           activeDemands: 0,
           totalProfiles: 0,
           topEnterprises: []
         },
         evenements,
         entreprises,
         poles,
         filieres
       };

       // Appeler l'API pour générer le PowerPoint
       const response = await fetch('/api/export-pptx', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(pptxData),
       });

       if (!response.ok) {
         throw new Error('Erreur lors de la génération du PowerPoint');
       }

       // Télécharger le fichier
       const blob = await response.blob();
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `Bilan_Employabilite_COP_${new Date().toISOString().split('T')[0]}.pptx`;
       document.body.appendChild(a);
       a.click();
       window.URL.revokeObjectURL(url);
       document.body.removeChild(a);
       
       // Message de succès
       alert('Présentation PowerPoint exportée avec succès !');
       
     } catch (error) {
       console.error('Erreur lors de l\'export PowerPoint:', error);
       alert('Erreur lors de l\'export de la présentation PowerPoint. Veuillez réessayer.');
     } finally {
       setExportingPPTX(false);
     }
   };

  // Données pour les cartes KPI
  const kpiCards: KPICard[] = [
    {
      label: 'Événements organisés',
      value: eventMetrics?.totalEvents || 0,
      trend: '+12 ce mois',
      trendValue: 12,
      color: 'blue',
      icon: Calendar
    },
    {
      label: 'Stagiaires bénéficiaires',
      value: eventMetrics?.totalBeneficiaries || 0,
      trend: '+25 ce mois',
      trendValue: 25,
      color: 'green',
      icon: Users
    },
    {
      label: 'Entreprises partenaires (Partenariats)',
      value: enterpriseMetrics?.partners || 0,
      trend: 'Onglet Partenariats',
      trendValue: 0,
      color: 'purple',
      icon: Building2
    },
    {
      label: 'Total des demandes',
      value: (demandMetrics || { totalDemands: 0 }).totalDemands,
      trend: '+8 cette semaine',
      trendValue: 8,
      color: 'orange',
      icon: FileText
    }
  ];

  // Données pour les graphiques
  const voletChartData: ChartData = {
    labels: eventMetrics ? Object.keys(eventMetrics.eventsByVolet).map(volet => {
      const labels: { [key: string]: string } = {
        'information_communication': 'Information/Communication',
        'accompagnement_projets': 'Accompagnement Projets',
        'assistance_carriere': 'Assistance Carrière',
        'assistance_filiere': 'Assistance Filière',
        'non_defini': 'Non défini'
      };
      return labels[volet] || volet;
    }) : [],
    datasets: [{
      label: 'Événements par volet',
      data: eventMetrics ? Object.values(eventMetrics.eventsByVolet) : [],
      backgroundColor: ['#0f3d6c', '#0f3d6c', '#0f3d6c', '#0f3d6c', '#0f3d6c'],
      borderColor: ['#0f3d6c', '#0f3d6c', '#0f3d6c', '#0f3d6c', '#0f3d6c']
    }]
  };

  const sectorChartData: ChartData = {
    labels: enterpriseMetrics ? Object.keys(enterpriseMetrics.sectors) : [],
    datasets: [{
      label: 'Entreprises par secteur',
      data: enterpriseMetrics ? Object.values(enterpriseMetrics.sectors) : [],
      backgroundColor: ['#0f3d6c', '#0f3d6c', '#0f3d6c', '#0f3d6c', '#0f3d6c'],
      borderColor: ['#0f3d6c', '#0f3d6c', '#0f3d6c', '#0f3d6c', '#0f3d6c']
    }]
  };

  const panel = 'rounded-xl border border-[#0f3d6c]/10 bg-[#f8f6f1] p-4'
  const btn =
    'inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-white disabled:opacity-50'
  const row = 'flex justify-between items-center text-xs'
  const rowVal = 'tabular-nums font-semibold text-[#0f3d6c]'

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-slate-500">
        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-[#0f3d6c] border-t-transparent" />
        Chargement des métriques…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0f3d6c]">Métriques d’employabilité</h2>
          <p className="text-xs text-slate-500">Vue d’ensemble des performances</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
          >
            <option value="current_month">Ce mois</option>
            <option value="current_year">Cette année</option>
            <option value="all_time">Tout le temps</option>
          </select>
          <button type="button" onClick={handleRefresh} disabled={loading} className={btn}>
            <Activity className="h-3 w-3" />
            Actualiser
          </button>
          {(isAdmin || isManager || isDirecteur || isConseiller) && (
            <>
              <button type="button" onClick={handleExport} disabled={exporting} className={btn}>
                <Download className="h-3 w-3" />
                Excel
              </button>
              <button type="button" onClick={handleExportPDF} disabled={exportingPDF} className={btn}>
                <FileDown className="h-3 w-3" />
                PDF
              </button>
              <button type="button" onClick={handleExportPPTX} disabled={exportingPPTX} className={btn}>
                <Presentation className="h-3 w-3" />
                PowerPoint
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <div key={index} className={panel}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 leading-snug">{kpi.label}</p>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0f3d6c] text-white">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="font-serif text-2xl tabular-nums text-[#0f3d6c]">{kpi.value}</p>
              <p className={`mt-1 inline-flex items-center gap-0.5 text-[11px] ${kpi.trendValue > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {kpi.trendValue > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {kpi.trend}
              </p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className={panel}>
          <h3 className="mb-3 text-sm font-semibold text-[#0f3d6c]">Événements par volet</h3>
          <div className="space-y-2">
            {voletChartData.labels.map((label, index) => (
              <div key={index} className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-slate-600">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#0f3d6c]/10">
                    <div
                      className="h-1.5 rounded-full bg-[#0f3d6c]"
                      style={{
                        width: `${(voletChartData.datasets[0].data[index] / Math.max(...voletChartData.datasets[0].data, 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-semibold tabular-nums text-[#0f3d6c]">
                    {voletChartData.datasets[0].data[index]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={panel}>
          <h3 className="mb-3 text-sm font-semibold text-[#0f3d6c]">Entreprises par secteur</h3>
          <div className="space-y-2">
            {sectorChartData.labels.map((label, index) => (
              <div key={index} className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-slate-600">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#0f3d6c]/10">
                    <div
                      className="h-1.5 rounded-full bg-[#0f3d6c]"
                      style={{
                        width: `${(sectorChartData.datasets[0].data[index] / Math.max(...sectorChartData.datasets[0].data, 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-semibold tabular-nums text-[#0f3d6c]">
                    {sectorChartData.datasets[0].data[index]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className={panel}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0f3d6c]">
            <Calendar className="h-4 w-4" />
            Événements
          </h3>
          <div className="space-y-2">
            <div className={row}><span className="text-slate-500">Total</span><span className={rowVal}>{eventMetrics?.totalEvents}</span></div>
            <div className={row}><span className="text-slate-500">Bénéficiaires</span><span className={rowVal}>{eventMetrics?.totalBeneficiaries}</span></div>
            <div className={row}><span className="text-slate-500">Candidats reçus</span><span className={rowVal}>{eventMetrics?.totalCandidates}</span></div>
            <div className={row}><span className="text-slate-500">Candidats retenus</span><span className={rowVal}>{eventMetrics?.totalRetained}</span></div>
            <div className={row}><span className="text-slate-500">Taux de conversion</span><span className={rowVal}>{eventMetrics?.conversionRate}%</span></div>
          </div>
        </div>

        <div className={panel}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0f3d6c]">
            <Building2 className="h-4 w-4" />
            Entreprises
          </h3>
          <div className="space-y-2">
            <div className={row}><span className="text-slate-500">Total</span><span className={rowVal}>{enterpriseMetrics?.totalEnterprises}</span></div>
            <div className={row}><span className="text-slate-500">Prospects</span><span className={rowVal}>{enterpriseMetrics?.prospects}</span></div>
            <div className={row}><span className="text-slate-500">Partenaires (conventions)</span><span className={rowVal}>{enterpriseMetrics?.partners}</span></div>
            <div className="my-1 border-t border-[#0f3d6c]/10" />
            <div className={row}><span className="text-slate-500">Total visites</span><span className={rowVal}>{enterpriseMetrics?.totalVisites || 0}</span></div>
            <div className={row}><span className="text-slate-500">Visites planifiées</span><span className={rowVal}>{enterpriseMetrics?.visitesPlanifiees || 0}</span></div>
            <div className="mt-2 rounded-lg border border-[#0f3d6c]/15 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0f3d6c]">
                {enterpriseMetrics?.statutBD.label || 'BD EN CMC'}
              </p>
              {enterpriseMetrics?.statutBD.date && (
                <p className="mt-1 text-[11px] text-slate-500">{enterpriseMetrics.statutBD.date}</p>
              )}
            </div>
          </div>
        </div>

        <div className={panel}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0f3d6c]">
            <Target className="h-4 w-4" />
            Top entreprises
          </h3>
          <div className="space-y-2">
            {entreprises && entreprises.filter((e) => e.partenaire_privilegie).length > 0 ? (
              entreprises
                .filter((e) => e.partenaire_privilegie)
                .slice(0, 5)
                .map((entreprise, index) => (
                  <div key={index} className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-slate-700">{entreprise.nom}</span>
                    <span className="shrink-0 rounded-full bg-[#0f3d6c]/10 px-2 py-0.5 text-[10px] font-medium text-[#0f3d6c]">
                      Privilégié
                    </span>
                  </div>
                ))
            ) : (
              <p className="py-2 text-center text-xs text-slate-500">Aucun partenaire privilégié</p>
            )}
          </div>
        </div>
      </div>

      {eventMetrics && Object.keys(eventMetrics.eventsByPole).length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[#0f3d6c]">Métriques par pôles</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(eventMetrics.eventsByPole).map(([poleName, eventCount]) => (
              <div
                key={poleName}
                className="rounded-xl border border-[#0f3d6c]/10 bg-[#f8f6f1] p-4"
                style={{ borderLeftWidth: 3, borderLeftColor: getPoleBackgroundColor(poleName) }}
              >
                <h4 className="mb-2 text-sm font-semibold text-[#0f3d6c]">{poleName}</h4>
                <div className="space-y-1.5">
                  <div className={row}>
                    <span className="text-slate-500">Événements</span>
                    <span className={rowVal}>{eventCount}</span>
                  </div>
                  <div className={row}>
                    <span className="text-slate-500">Conversion</span>
                    <span className={rowVal}>{eventMetrics.conversionRateByPole[poleName] || 0}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
