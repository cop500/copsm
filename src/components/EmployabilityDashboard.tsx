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
  partners: number;
  sectors: { [key: string]: number };
  // Métriques des visites
  totalVisites: number;
  visitesPlanifiees: number;
  entreprisesPrioritaires: number;
  // Champs supprimés : visitesEffectuees, actionsEnRetard, tauxVisitesParEntreprise
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

    // Calculer les métriques des événements
  useEffect(() => {
    if (evenements) {
      const metrics: EventMetrics = {
        totalEvents: evenements.length,
        totalBeneficiaries: evenements.reduce((sum, event) => sum + (event.nombre_beneficiaires || 0), 0),
        totalCandidates: evenements.reduce((sum, event) => sum + (event.nombre_candidats || 0), 0),
        totalRetained: evenements.reduce((sum, event) => sum + (event.nombre_candidats_retenus || 0), 0),
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
      evenements.forEach(event => {
        const volet = event.volet || 'non_defini';
        metrics.eventsByVolet[volet] = (metrics.eventsByVolet[volet] || 0) + 1;
      });

      // Répartition par pôle et calcul des taux de conversion
      const poleStats: { [key: string]: { count: number; candidates: number; retained: number } } = {};
      
      evenements.forEach(event => {
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
  }, [evenements, poles]);

  // Calculer les métriques des entreprises
  useEffect(() => {
    if (entreprises) {
      // Calculer les métriques des visites
      const visitesStats = getStats();
      
      const metrics: EnterpriseMetrics = {
        totalEnterprises: entreprises.length,
        prospects: entreprises.filter(e => e.statut === 'prospect').length,
        partners: entreprises.filter(e => e.statut === 'partenaire').length,
        sectors: {},
        // Métriques des visites
        totalVisites: visites.length,
        visitesPlanifiees: visitesStats.visitesPlanifiees,
        entreprisesPrioritaires: visitesStats.entreprisesPrioritaires
      };

      // Répartition par secteur
      entreprises.forEach(entreprise => {
        const secteur = entreprise.secteur || 'Non défini';
        metrics.sectors[secteur] = (metrics.sectors[secteur] || 0) + 1;
      });

      setEnterpriseMetrics(metrics);
    }
  }, [entreprises, visites, getStats]);

  // Calculer les métriques des demandes
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
            profils
          `);

        if (error) throw error;

        console.log('📋 Demandes récupérées:', demandes);
        console.log('📊 Statuts des demandes:', demandes?.map(d => ({ id: d.id, statut: d.statut, entreprise: d.entreprise_nom })));

        const metrics: DemandMetrics = {
          totalDemands: demandes?.length || 0,
          activeDemands: demandes?.filter(d => d.statut === 'en_attente' || d.statut === 'en_cours').length || 0,
          totalProfiles: demandes?.reduce((sum, d) => sum + (d.profils?.length || 0), 0) || 0,
          topEnterprises: []
        };

        console.log('📈 Métriques calculées:', metrics);
        console.log('🎯 Total des demandes:', metrics.totalDemands);
        console.log('🎯 Demandes actives:', metrics.activeDemands);

        // Calculer les entreprises les plus actives
        const enterpriseDemands: { [key: string]: number } = {};
        demandes?.forEach(demande => {
          const entrepriseName = demande.entreprise_nom || 'Inconnue';
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
  }, []);

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
        ['Entreprises partenaires', enterpriseMetrics.partners, 'Nombre d\'entreprises avec statut partenaire'],
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
        ...evenements.map(event => {
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
          demande.profils?.map((p: any) => p.titre).join(', ') || 'N/A',
          demande.created_at ? new Date(demande.created_at).toLocaleDateString('fr-FR') : 'N/A'
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
        ['Entreprises partenaires', enterpriseMetrics.partners],
        ['Taux de partenariat', `${Math.round((enterpriseMetrics.partners / enterpriseMetrics.totalEnterprises) * 100)}%`],
        [''],
        ['Métriques Visites Entreprises'],
        ['Total visites', enterpriseMetrics.totalVisites],
        ['Visites planifiées', enterpriseMetrics.visitesPlanifiees],
        ['Entreprises prioritaires', enterpriseMetrics.entreprisesPrioritaires],
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
      label: 'Entreprises partenaires',
      value: enterpriseMetrics?.partners || 0,
      trend: '+3 cette semaine',
      trendValue: 3,
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

  // Debug: Afficher l'état des métriques au moment du rendu:
  console.log('🔍 État des métriques au moment du rendu:');
  console.log('📊 demandMetrics:', demandMetrics);
  console.log('📈 eventMetrics:', eventMetrics);
  console.log('🏢 enterpriseMetrics:', enterpriseMetrics);
  console.log('🎯 KPI Demandes actives:', (demandMetrics || { activeDemands: 0 }).activeDemands);

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
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'],
      borderColor: ['#2563EB', '#059669', '#D97706', '#DC2626', '#4B5563']
    }]
  };

  const sectorChartData: ChartData = {
    labels: enterpriseMetrics ? Object.keys(enterpriseMetrics.sectors) : [],
    datasets: [{
      label: 'Entreprises par secteur',
      data: enterpriseMetrics ? Object.values(enterpriseMetrics.sectors) : [],
      backgroundColor: ['#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899'],
      borderColor: ['#7C3AED', '#0891B2', '#65A30D', '#EA580C', '#DB2777']
    }]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Chargement des métriques...</span>
        <div className="mt-2 text-xs text-gray-500">
          {entreprisesLoading && 'Chargement des entreprises...'}
          {evenementsLoading && 'Chargement des événements...'}
          {demandMetrics === null && 'Chargement des demandes...'}
        </div>
        
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header simplifié */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Métriques d'employabilité</h2>
          <p className="text-sm text-gray-600">Vue d'ensemble des performances</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="current_month">Ce mois</option>
            <option value="current_year">Cette année</option>
            <option value="all_time">Tout le temps</option>
          </select>
          
                       <button 
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Activity className="w-3 h-3" />
              )}
              Actualiser
            </button>
            
                         {(isAdmin || isManager || isDirecteur || isConseiller) && (
               <>
                 <button 
                   onClick={handleExport}
                   disabled={exporting}
                   className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   {exporting ? (
                     <>
                       <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       Export Excel...
                     </>
                   ) : (
                     <>
                       <Download className="w-3 h-3" />
                       Excel
                     </>
                   )}
                 </button>
                 
                 <button 
                   onClick={handleExportPDF}
                   disabled={exportingPDF}
                   className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   {exportingPDF ? (
                     <>
                       <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       Export PDF...
                     </>
                   ) : (
                     <>
                       <FileDown className="w-3 h-3" />
                       PDF
                     </>
                   )}
                 </button>
                 
                 <button 
                   onClick={handleExportPPTX}
                   disabled={exportingPPTX}
                   className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   {exportingPPTX ? (
                     <>
                       <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       Export PPTX...
                     </>
                   ) : (
                     <>
                       <Presentation className="w-3 h-3" />
                       PowerPoint
                     </>
                   )}
                 </button>
               </>
             )}
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <div key={index} className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-black/20 p-4 relative overflow-hidden">
            {/* Motifs décoratifs */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.4) 2px, transparent 2px),
                  radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.4) 2px, transparent 2px),
                  linear-gradient(45deg, transparent 48%, rgba(156, 163, 175, 0.2) 49%, rgba(156, 163, 175, 0.2) 51%, transparent 52%),
                  linear-gradient(-45deg, transparent 48%, rgba(156, 163, 175, 0.2) 49%, rgba(156, 163, 175, 0.2) 51%, transparent 52%)
                `,
                backgroundSize: '30px 30px, 40px 40px, 20px 20px, 20px 20px',
                backgroundPosition: '0 0, 15px 15px, 0 0, 10px 10px'
              }}
            ></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-medium text-gray-600">{kpi.label}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {kpi.trendValue > 0 ? (
                    <ArrowUpRight className="w-3 h-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-xs ${kpi.trendValue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.trend}
                  </span>
                </div>
              </div>
              <div className={`p-2 rounded-lg bg-${kpi.color}-100`}>
                <kpi.icon className={`w-5 h-5 text-${kpi.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques et métriques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Événements par volet */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-black/20 p-4 relative overflow-hidden">
          {/* Motifs décoratifs */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                radial-gradient(circle at 70% 70%, rgba(16, 185, 129, 0.3) 1px, transparent 1px),
                linear-gradient(45deg, transparent 48%, rgba(156, 163, 175, 0.1) 49%, rgba(156, 163, 175, 0.1) 51%, transparent 52%)
              `,
              backgroundSize: '25px 25px, 35px 35px, 15px 15px',
              backgroundPosition: '0 0, 12px 12px, 0 0'
            }}
          ></div>
          
          <h3 className="text-sm font-semibold text-gray-900 mb-3 relative z-10">Événements par volet</h3>
          <div className="space-y-2 relative z-10">
            {voletChartData.labels.map((label, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 truncate">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full"
                      style={{ 
                        width: `${(voletChartData.datasets[0].data[index] / Math.max(...voletChartData.datasets[0].data)) * 100}%`,
                        backgroundColor: voletChartData.datasets[0].backgroundColor[index]
                      }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-900">
                    {voletChartData.datasets[0].data[index]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Entreprises par secteur */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-black/20 p-4 relative overflow-hidden">
          {/* Motifs décoratifs */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                radial-gradient(circle at 70% 70%, rgba(16, 185, 129, 0.3) 1px, transparent 1px),
                linear-gradient(45deg, transparent 48%, rgba(156, 163, 175, 0.1) 49%, rgba(156, 163, 175, 0.1) 51%, transparent 52%)
              `,
              backgroundSize: '25px 25px, 35px 35px, 15px 15px',
              backgroundPosition: '0 0, 12px 12px, 0 0'
            }}
          ></div>
          
          <h3 className="text-sm font-semibold text-gray-900 mb-3 relative z-10">Entreprises par secteur</h3>
          <div className="space-y-2 relative z-10">
            {sectorChartData.labels.map((label, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 truncate">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full"
                      style={{ 
                        width: `${(sectorChartData.datasets[0].data[index] / Math.max(...sectorChartData.datasets[0].data)) * 100}%`,
                        backgroundColor: sectorChartData.datasets[0].backgroundColor[index]
                      }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-900">
                    {sectorChartData.datasets[0].data[index]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Métriques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Métriques des événements */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-black/20 p-4 relative overflow-hidden">
          {/* Motifs décoratifs */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.3) 1px, transparent 1px),
                linear-gradient(45deg, transparent 48%, rgba(156, 163, 175, 0.1) 49%, rgba(156, 163, 175, 0.1) 51%, transparent 52%)
              `,
              backgroundSize: '20px 20px, 30px 30px, 12px 12px',
              backgroundPosition: '0 0, 10px 10px, 0 0'
            }}
          ></div>
          
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 relative z-10">
            <Calendar className="w-4 h-4 text-blue-600" />
            Événements
          </h3>
          <div className="space-y-2 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Total</span>
              <span className="text-sm font-semibold">{eventMetrics?.totalEvents}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Bénéficiaires</span>
              <span className="text-sm font-semibold">{eventMetrics?.totalBeneficiaries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Candidats reçus</span>
              <span className="text-sm font-semibold">{eventMetrics?.totalCandidates}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Candidats retenus</span>
              <span className="text-sm font-semibold">{eventMetrics?.totalRetained}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Taux de conversion</span>
              <span className="text-sm font-semibold text-green-600">{eventMetrics?.conversionRate}%</span>
            </div>
          </div>
        </div>

        {/* Métriques des entreprises */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-black/20 p-4 relative overflow-hidden">
          {/* Motifs décoratifs */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.3) 1px, transparent 1px),
                linear-gradient(45deg, transparent 48%, rgba(156, 163, 175, 0.1) 49%, rgba(156, 163, 175, 0.1) 51%, transparent 52%)
              `,
              backgroundSize: '20px 20px, 30px 30px, 12px 12px',
              backgroundPosition: '0 0, 10px 10px, 0 0'
            }}
          ></div>
          
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 relative z-10">
            <Building2 className="w-4 h-4 text-purple-600" />
            Entreprises
          </h3>
          <div className="space-y-2 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Total</span>
              <span className="text-sm font-semibold">{enterpriseMetrics?.totalEnterprises}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Prospects</span>
              <span className="text-sm font-semibold text-orange-600">{enterpriseMetrics?.prospects}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Partenaires</span>
              <span className="text-sm font-semibold text-green-600">{enterpriseMetrics?.partners}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Taux partenariat</span>
              <span className="text-sm font-semibold">
                {enterpriseMetrics ? Math.round((enterpriseMetrics.partners / enterpriseMetrics.totalEnterprises) * 100) : 0}%
              </span>
            </div>
            {/* Séparateur pour les métriques de visites */}
            <div className="border-t border-gray-300 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Total visites
              </span>
              <span className="text-sm font-semibold text-purple-600">{enterpriseMetrics?.totalVisites || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Visites planifiées</span>
              <span className="text-sm font-semibold text-orange-600">{enterpriseMetrics?.visitesPlanifiees || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Entreprises prioritaires</span>
              <span className="text-sm font-semibold text-red-600">{enterpriseMetrics?.entreprisesPrioritaires || 0}</span>
            </div>
          </div>
        </div>

                {/* Top entreprises */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-black/20 p-4 relative overflow-hidden">
          {/* Motifs décoratifs */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.3) 1px, transparent 1px),
                linear-gradient(45deg, transparent 48%, rgba(156, 163, 175, 0.1) 49%, rgba(156, 163, 175, 0.1) 51%, transparent 52%)
              `,
              backgroundSize: '20px 20px, 30px 30px, 12px 12px',
              backgroundPosition: '0 0, 10px 10px, 0 0'
            }}
          ></div>
          
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 relative z-10">
            <Target className="w-4 h-4 text-red-600" />
            Top entreprises
          </h3>
          <div className="space-y-2 relative z-10">
            {entreprises && entreprises.filter(e => e.partenaire_privilegie).length > 0 ? (
              entreprises
                .filter(e => e.partenaire_privilegie)
                .slice(0, 5)
                .map((entreprise, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 truncate">{entreprise.nom}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Partenaire privilégié
                    </span>
                  </div>
                ))
            ) : (
              <div className="text-xs text-gray-500 text-center py-2">
                Aucune entreprise marquée comme partenaire privilégié
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Métriques par pôles */}
      {eventMetrics && Object.keys(eventMetrics.eventsByPole).length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Métriques par Pôles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(eventMetrics.eventsByPole).map(([poleName, eventCount]) => (
              <div key={poleName} className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-black/20 p-4 relative overflow-hidden">
                {/* Motifs décoratifs */}
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                      radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.3) 1px, transparent 1px),
                      linear-gradient(45deg, transparent 48%, rgba(156, 163, 175, 0.1) 49%, rgba(156, 163, 175, 0.1) 51%, transparent 52%)
                    `,
                    backgroundSize: '20px 20px, 30px 30px, 12px 12px',
                    backgroundPosition: '0 0, 10px 10px, 0 0'
                  }}
                ></div>
                
                <h4 className="text-sm font-semibold text-gray-900 mb-3 relative z-10">{poleName}</h4>
                <div className="space-y-2 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Événements</span>
                    <span className="text-sm font-semibold">{eventCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Taux de conversion</span>
                    <span className="text-sm font-semibold text-green-600">
                      {eventMetrics.conversionRateByPole[poleName] || 0}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
