'use client'

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Building2, Calendar, FileText, Download, 
  Target, Activity, BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  CheckCircle, AlertCircle, Clock, UserCheck, Briefcase, GraduationCap
} from 'lucide-react';
import { useEntreprises } from '@/hooks/useEntreprises';
import { useEvenements } from '@/hooks/useEvenements';
import { supabase } from '@/lib/supabase';

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
}

interface EnterpriseMetrics {
  totalEnterprises: number;
  prospects: number;
  partners: number;
  withContracts: number;
  sectors: { [key: string]: number };
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

  const { entreprises } = useEntreprises();
  const { evenements } = useEvenements();

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
        eventsByType: {}
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

      setEventMetrics(metrics);
    }
  }, [evenements]);

  // Calculer les métriques des entreprises
  useEffect(() => {
    if (entreprises) {
      const metrics: EnterpriseMetrics = {
        totalEnterprises: entreprises.length,
        prospects: entreprises.filter(e => e.statut === 'prospect').length,
        partners: entreprises.filter(e => e.statut === 'partenaire').length,
        withContracts: entreprises.filter(e => e.contrat_url).length,
        sectors: {}
      };

      // Répartition par secteur
      entreprises.forEach(entreprise => {
        const secteur = entreprise.secteur || 'Non défini';
        metrics.sectors[secteur] = (metrics.sectors[secteur] || 0) + 1;
      });

      setEnterpriseMetrics(metrics);
    }
  }, [entreprises]);

  // Calculer les métriques des demandes
  useEffect(() => {
    const fetchDemandMetrics = async () => {
      try {
        const { data: demandes, error } = await supabase
          .from('demandes_entreprises')
          .select(`
            id,
            statut,
            entreprises!inner(nom),
            profiles(id)
          `);

        if (error) throw error;

        const metrics: DemandMetrics = {
          totalDemands: demandes?.length || 0,
          activeDemands: demandes?.filter(d => d.statut === 'active').length || 0,
          totalProfiles: demandes?.reduce((sum, d) => sum + (d.profiles?.length || 0), 0) || 0,
          topEnterprises: []
        };

        // Calculer les entreprises les plus actives
        const enterpriseDemands: { [key: string]: number } = {};
        demandes?.forEach(demande => {
          const entrepriseName = demande.entreprises?.nom || 'Inconnue';
          enterpriseDemands[entrepriseName] = (enterpriseDemands[entrepriseName] || 0) + 1;
        });

        metrics.topEnterprises = Object.entries(enterpriseDemands)
          .map(([name, demands]) => ({ name, demands }))
          .sort((a, b) => b.demands - a.demands)
          .slice(0, 5);

        setDemandMetrics(metrics);
      } catch (error) {
        console.error('Erreur lors du chargement des métriques de demandes:', error);
      }
    };

    fetchDemandMetrics();
  }, []);

  useEffect(() => {
    if (eventMetrics && enterpriseMetrics && demandMetrics) {
      setLoading(false);
    }
  }, [eventMetrics, enterpriseMetrics, demandMetrics]);

  // KPIs principaux
  const kpiCards: KPICard[] = [
    {
      label: 'Taux de conversion global',
      value: eventMetrics ? `${eventMetrics.conversionRate}%` : '0%',
      trend: eventMetrics && eventMetrics.conversionRate > 0 ? '+2.5% ce mois' : 'Nouveau',
      trendValue: 2.5,
      color: 'green',
      icon: TrendingUp
    },
    {
      label: 'Stagiaires bénéficiaires',
      value: eventMetrics?.totalBeneficiaries || 0,
      trend: '+15 ce mois',
      trendValue: 15,
      color: 'blue',
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
      label: 'Demandes actives',
      value: demandMetrics?.activeDemands || 0,
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bilan d'Employabilité</h1>
          <p className="text-gray-600 mt-1">Tableau de bord complet des métriques d'employabilité</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="current_month">Ce mois</option>
            <option value="current_year">Cette année</option>
            <option value="all_time">Tout le temps</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Exporter le rapport
          </button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {kpi.trendValue > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm ${kpi.trendValue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.trend}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg bg-${kpi.color}-100`}>
                <kpi.icon className={`w-6 h-6 text-${kpi.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques et métriques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Événements par volet */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Événements par volet</h3>
          <div className="space-y-3">
            {voletChartData.labels.map((label, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${(voletChartData.datasets[0].data[index] / Math.max(...voletChartData.datasets[0].data)) * 100}%`,
                        backgroundColor: voletChartData.datasets[0].backgroundColor[index]
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {voletChartData.datasets[0].data[index]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Entreprises par secteur */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Entreprises par secteur</h3>
          <div className="space-y-3">
            {sectorChartData.labels.map((label, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${(sectorChartData.datasets[0].data[index] / Math.max(...sectorChartData.datasets[0].data)) * 100}%`,
                        backgroundColor: sectorChartData.datasets[0].backgroundColor[index]
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {sectorChartData.datasets[0].data[index]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Métriques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Métriques des événements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Métriques des événements
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total événements</span>
              <span className="font-semibold">{eventMetrics?.totalEvents}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bénéficiaires</span>
              <span className="font-semibold">{eventMetrics?.totalBeneficiaries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Candidats reçus</span>
              <span className="font-semibold">{eventMetrics?.totalCandidates}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Candidats retenus</span>
              <span className="font-semibold">{eventMetrics?.totalRetained}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Taux de conversion</span>
              <span className="font-semibold text-green-600">{eventMetrics?.conversionRate}%</span>
            </div>
          </div>
        </div>

        {/* Métriques des entreprises */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            Métriques des entreprises
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total entreprises</span>
              <span className="font-semibold">{enterpriseMetrics?.totalEnterprises}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Prospects</span>
              <span className="font-semibold text-orange-600">{enterpriseMetrics?.prospects}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Partenaires</span>
              <span className="font-semibold text-green-600">{enterpriseMetrics?.partners}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avec contrats</span>
              <span className="font-semibold text-blue-600">{enterpriseMetrics?.withContracts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Taux de partenariat</span>
              <span className="font-semibold">
                {enterpriseMetrics ? Math.round((enterpriseMetrics.partners / enterpriseMetrics.totalEnterprises) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Top entreprises */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-600" />
            Top entreprises actives
          </h3>
          <div className="space-y-3">
            {demandMetrics?.topEnterprises.map((entreprise, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 truncate">{entreprise.name}</span>
                <span className="font-semibold text-sm">{entreprise.demands} demandes</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
