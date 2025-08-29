// Import conditionnel pour éviter les erreurs côté client
let PptxGenJS: any = null;

// Vérifier si nous sommes côté serveur
if (typeof window === 'undefined') {
  try {
    PptxGenJS = require('pptxgenjs');
  } catch (error) {
    console.warn('PptxGenJS non disponible côté serveur');
  }
}

// Même palette de couleurs que le PDF
const COLORS = {
  primary: '#003366',      // Bleu foncé
  secondary: '#4CAF50',    // Vert
  danger: '#F44336',       // Rouge
  warning: '#FF9800',      // Orange
  info: '#2196F3',         // Bleu clair
  dark: '#757575',         // Gris
  light: '#F5F5F5',        // Gris clair
  white: '#FFFFFF'         // Blanc
};

interface PPTXData {
  eventMetrics: any;
  enterpriseMetrics: any;
  demandMetrics: any;
  evenements: any[];
  entreprises: any[];
  poles: any[];
  filieres: any[];
}

export const generateEmployabilityPPTX = async (data: PPTXData) => {
  // Vérifier si PptxGenJS est disponible
  if (!PptxGenJS) {
    throw new Error('PptxGenJS n\'est pas disponible dans cet environnement');
  }

  try {
    const pptx = new PptxGenJS();
    
    // Configuration de la présentation
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'COP CMC SM';
    pptx.company = 'Centre d\'Orientation Professionnelle';
    pptx.title = 'Bilan d\'Employabilité';
    pptx.subject = 'Rapport d\'activité et de performance';
    
    // Définition des couleurs du thème
    pptx.defineLayout({ name: 'LAYOUT_16x9', width: 13.33, height: 7.5 });
    
    // Page de couverture
    generateCoverSlide(pptx);
    
    // Résumé exécutif
    generateExecutiveSummarySlide(pptx, data);
    
    // Graphiques
    generateChartsSlide(pptx, data);
    
    // Données détaillées
    generateDetailedDataSlide(pptx, data);
    
    // Métriques par pôles
    generatePoleMetricsSlide(pptx, data);
    
    // Conclusion
    generateConclusionSlide(pptx, data);
    
    return pptx;
  } catch (error) {
    console.error('Erreur lors de la génération du PPTX:', error);
    throw new Error('Erreur lors de la génération du PPTX');
  }
};

const generateCoverSlide = (pptx: any) => {
  const slide = pptx.addSlide();
  
  // Fond avec couleur primaire
  slide.background = { color: COLORS.primary };
  
  // Titre principal
  slide.addText('BILAN D\'EMPLOYABILITÉ', {
    x: 0.5,
    y: 2,
    w: 12.33,
    h: 1.5,
    fontSize: 44,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.white,
    align: 'center',
    valign: 'middle'
  });
  
  // Sous-titre
  slide.addText('Centre d\'Orientation Professionnelle CMC SM', {
    x: 0.5,
    y: 3.5,
    w: 12.33,
    h: 0.8,
    fontSize: 24,
    fontFace: 'Arial',
    color: COLORS.white,
    align: 'center',
    valign: 'middle'
  });
  
  // Date
  slide.addText(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, {
    x: 0.5,
    y: 4.5,
    w: 12.33,
    h: 0.5,
    fontSize: 16,
    fontFace: 'Arial',
    color: COLORS.white,
    align: 'center',
    valign: 'middle'
  });
  
  // Slogan
  slide.addText('Transformer les compétences en opportunités', {
    x: 0.5,
    y: 5.5,
    w: 12.33,
    h: 0.5,
    fontSize: 14,
    fontFace: 'Arial',
    color: COLORS.light,
    align: 'center',
    valign: 'middle'
  });
  
  // Ligne décorative
  slide.addShape('line', {
    x: 2,
    y: 6.2,
    w: 9.33,
    h: 0.1,
    line: { color: COLORS.white, width: 3 }
  });
};

const generateExecutiveSummarySlide = (pptx: any, data: PPTXData) => {
  const slide = pptx.addSlide();
  
  // Titre
  slide.addText('Résumé Exécutif', {
    x: 0.5,
    y: 0.3,
    w: 12.33,
    h: 0.8,
    fontSize: 32,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.primary,
    align: 'left'
  });
  
  // KPIs en format tableau
  const kpiData = [
    ['Métrique', 'Valeur', 'Description'],
    [
      'Taux de conversion global',
      `${data.eventMetrics?.conversionRate || 0}%`,
      'Pourcentage de candidats retenus'
    ],
    [
      'Stagiaires bénéficiaires',
      data.eventMetrics?.totalBeneficiaries || 0,
      'Nombre total de participants'
    ],
    [
      'Entreprises partenaires',
      data.enterpriseMetrics?.partners || 0,
      'Partenariats actifs'
    ],
    [
      'Demandes actives',
      data.demandMetrics?.activeDemands || 0,
      'Opportunités en cours'
    ]
  ];
  
  slide.addTable(kpiData, {
    x: 0.5,
    y: 1.5,
    w: 12.33,
    h: 3,
    colW: [4, 2, 6.33],
    fontSize: 14,
    fontFace: 'Arial',
    color: COLORS.dark,
    border: { type: 'solid', color: COLORS.primary, pt: 1 },
    headerRow: {
      fill: { color: COLORS.primary },
      color: COLORS.white,
      fontSize: 16,
      fontFace: 'Arial',
      bold: true
    },
    align: 'left',
    valign: 'middle'
  });
  
  // Description
  slide.addText('Ce rapport présente un aperçu complet des activités d\'employabilité du Centre d\'Orientation Professionnelle CMC SM, incluant les métriques de performance, les événements organisés et les partenariats établis.', {
    x: 0.5,
    y: 5,
    w: 12.33,
    h: 1.5,
    fontSize: 12,
    fontFace: 'Arial',
    color: COLORS.dark,
    align: 'left',
    valign: 'top'
  });
};

const generateChartsSlide = (pptx: any, data: PPTXData) => {
  const slide = pptx.addSlide();
  
  // Titre
  slide.addText('Graphiques et Analyses', {
    x: 0.5,
    y: 0.3,
    w: 12.33,
    h: 0.8,
    fontSize: 32,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.primary,
    align: 'left'
  });
  
  // Événements par volet - Graphique en secteurs
  if (data.eventMetrics?.eventsByVolet) {
    const voletData = Object.entries(data.eventMetrics.eventsByVolet).map(([volet, count]) => ({
      name: getVoletLabel(volet),
      labels: [getVoletLabel(volet)],
      values: [count as number]
    }));
    
    slide.addChart(pptx.ChartType.PIE, voletData, {
      x: 0.5,
      y: 1.5,
      w: 5.5,
      h: 4,
      chartColors: [COLORS.primary, COLORS.secondary, COLORS.warning, COLORS.info],
      showLegend: true,
      legendPos: 'b',
      showTitle: true,
      title: 'Événements par volet',
      titleColor: COLORS.primary,
      titleFontSize: 16,
      titleFontFace: 'Arial',
      titleFontBold: true
    });
  }
  
  // Entreprises par secteur - Graphique en barres
  if (data.enterpriseMetrics?.sectors) {
    const sectorData = Object.entries(data.enterpriseMetrics.sectors).map(([sector, count]) => ({
      name: sector,
      labels: [sector],
      values: [count as number]
    }));
    
    slide.addChart(pptx.ChartType.BAR, sectorData, {
      x: 7,
      y: 1.5,
      w: 5.83,
      h: 4,
      chartColors: [COLORS.info],
      showLegend: false,
      showTitle: true,
      title: 'Entreprises par secteur',
      titleColor: COLORS.primary,
      titleFontSize: 16,
      titleFontFace: 'Arial',
      titleFontBold: true,
      catAxisLineColor: COLORS.dark,
      valAxisLineColor: COLORS.dark,
      catAxisLabelColor: COLORS.dark,
      valAxisLabelColor: COLORS.dark
    });
  }
};

const generateDetailedDataSlide = (pptx: any, data: PPTXData) => {
  const slide = pptx.addSlide();
  
  // Titre
  slide.addText('Données Détaillées', {
    x: 0.5,
    y: 0.3,
    w: 12.33,
    h: 0.8,
    fontSize: 32,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.primary,
    align: 'left'
  });
  
  // Tableau des événements récents
  const eventData = [
    ['Événement', 'Date', 'Volet', 'Bénéficiaires']
  ];
  
  data.evenements.slice(0, 8).forEach(event => {
    eventData.push([
      event.titre?.substring(0, 30) + (event.titre?.length > 30 ? '...' : ''),
      event.date_debut ? new Date(event.date_debut).toLocaleDateString('fr-FR') : 'N/A',
      getVoletLabel(event.volet || 'non_defini'),
      (event.nombre_beneficiaires || 0).toString()
    ]);
  });
  
  slide.addTable(eventData, {
    x: 0.5,
    y: 1.5,
    w: 12.33,
    h: 4.5,
    colW: [4, 2, 3, 3.33],
    fontSize: 10,
    fontFace: 'Arial',
    color: COLORS.dark,
    border: { type: 'solid', color: COLORS.primary, pt: 1 },
    headerRow: {
      fill: { color: COLORS.primary },
      color: COLORS.white,
      fontSize: 12,
      fontFace: 'Arial',
      bold: true
    },
    align: 'left',
    valign: 'middle',
    alternateRows: {
      fill: { color: COLORS.light }
    }
  });
};

const generatePoleMetricsSlide = (pptx: any, data: PPTXData) => {
  const slide = pptx.addSlide();
  
  // Titre
  slide.addText('Métriques par Pôles', {
    x: 0.5,
    y: 0.3,
    w: 12.33,
    h: 0.8,
    fontSize: 32,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.primary,
    align: 'left'
  });
  
  if (data.eventMetrics?.eventsByPole) {
    const poleData = [
      ['Pôle', 'Événements', 'Taux de conversion', 'Performance']
    ];
    
    Object.entries(data.eventMetrics.eventsByPole).forEach(([poleName, eventCount]) => {
      const conversionRate = data.eventMetrics.conversionRateByPole[poleName] || 0;
      const performance = getPerformanceLabel(conversionRate);
      
      poleData.push([
        poleName,
        eventCount.toString(),
        `${conversionRate}%`,
        performance
      ]);
    });
    
    slide.addTable(poleData, {
      x: 0.5,
      y: 1.5,
      w: 12.33,
      h: 4.5,
      colW: [4, 2, 3, 3.33],
      fontSize: 12,
      fontFace: 'Arial',
      color: COLORS.dark,
      border: { type: 'solid', color: COLORS.primary, pt: 1 },
      headerRow: {
        fill: { color: COLORS.primary },
        color: COLORS.white,
        fontSize: 14,
        fontFace: 'Arial',
        bold: true
      },
      align: 'left',
      valign: 'middle',
      alternateRows: {
        fill: { color: COLORS.light }
      }
    });
  }
};

const generateConclusionSlide = (pptx: any, data: PPTXData) => {
  const slide = pptx.addSlide();
  
  // Titre
  slide.addText('Conclusion et Recommandations', {
    x: 0.5,
    y: 0.3,
    w: 12.33,
    h: 0.8,
    fontSize: 32,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.primary,
    align: 'left'
  });
  
  // Contenu
  const content = [
    `Le COP CMC SM a organisé ${data.eventMetrics?.totalEvents || 0} événements cette période, touchant ${data.eventMetrics?.totalBeneficiaries || 0} stagiaires bénéficiaires.`,
    '',
    `Avec un taux de conversion global de ${data.eventMetrics?.conversionRate || 0}%, les activités d'employabilité montrent des résultats prometteurs.`,
    '',
    `Le partenariat avec ${data.enterpriseMetrics?.partners || 0} entreprises démontre l'engagement du secteur privé dans l'insertion professionnelle.`,
    '',
    'Recommandations :',
    '• Maintenir la diversification des volets d\'activité',
    '• Renforcer les partenariats avec les entreprises',
    '• Optimiser les taux de conversion par pôle',
    '• Développer de nouveaux événements innovants'
  ];
  
  slide.addText(content.join('\n'), {
    x: 0.5,
    y: 1.5,
    w: 12.33,
    h: 4.5,
    fontSize: 14,
    fontFace: 'Arial',
    color: COLORS.dark,
    align: 'left',
    valign: 'top',
    lineSpacing: 1.2
  });
  
  // Signature
  slide.addText('COP CMC SM\nCentre d\'Orientation Professionnelle', {
    x: 0.5,
    y: 6,
    w: 6,
    h: 1,
    fontSize: 16,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.primary,
    align: 'left',
    valign: 'bottom'
  });
};

// Fonctions utilitaires
const getVoletLabel = (volet: string): string => {
  const labels: { [key: string]: string } = {
    'information_communication': 'Information/Communication',
    'accompagnement_projets': 'Accompagnement Projets',
    'assistance_carriere': 'Assistance Carrière',
    'assistance_filiere': 'Assistance Filière',
    'non_defini': 'Non défini'
  };
  return labels[volet] || volet;
};

const getPerformanceLabel = (rate: number): string => {
  if (rate >= 40) return 'Excellent';
  if (rate >= 20) return 'Bon';
  return 'À améliorer';
};
