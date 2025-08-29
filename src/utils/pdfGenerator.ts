import jsPDF from 'jspdf';

// Nouvelle palette de couleurs cohérente
const COLORS = {
  primary: '#003366',      // Bleu foncé pour titres/fonds
  secondary: '#4CAF50',    // Vert pour succès (taux >40%)
  danger: '#F44336',       // Rouge pour alertes (taux <20%)
  warning: '#FF9800',      // Orange pour avertissements
  info: '#2196F3',         // Bleu clair pour info
  dark: '#757575',         // Gris pour texte secondaire
  light: '#F5F5F5',        // Gris très clair pour fonds
  white: '#FFFFFF',        // Blanc
  success: '#4CAF50',      // Vert succès
  purple: '#9C27B0'        // Violet pour entreprises
};

interface PDFData {
  eventMetrics: any;
  enterpriseMetrics: any;
  demandMetrics: any;
  evenements: any[];
  entreprises: any[];
  poles: any[];
  filieres: any[];
}

export const generateEmployabilityPDF = async (data: PDFData) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Configuration des polices
    doc.setFont('helvetica');
    
    // Page de couverture avec gradient et design moderne
    generateCoverPage(doc);
    
    // Résumé exécutif avec KPI en cartes arrondies
    generateExecutiveSummary(doc, data);
    
    // Graphiques et analyses avec vrais charts
    generateChartsPage(doc, data);
    
    // Données détaillées avec tableau professionnel
    generateDetailedData(doc, data);
    
    // Métriques par pôles avec heatmap
    generatePoleMetrics(doc, data);
    
    // Conclusion avec funnel chart et recommandations
    generateConclusion(doc, data);
    
    return doc;
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw new Error('Erreur lors de la génération du PDF');
  }
};

const generateCoverPage = (doc: jsPDF) => {
  try {
    // Fond avec gradient bleu-vert
    doc.setFillColor(COLORS.primary);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Overlay gradient
    doc.setFillColor(COLORS.secondary + '20');
    doc.rect(0, 0, 210, 297, 'F');
    
    // Titre principal avec typographie moderne
    doc.setTextColor(COLORS.white);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('BILAN D\'EMPLOYABILITÉ', 105, 80, { align: 'center' });
    
    // Sous-titre
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.text('Centre d\'Orientation Professionnelle CMC SM', 105, 100, { align: 'center' });
    
    // Date avec style moderne
    doc.setFontSize(14);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, 105, 120, { align: 'center' });
    
    // Slogan motivant
    doc.setFontSize(12);
    doc.setTextColor(COLORS.light);
    doc.text('Transformer les compétences en opportunités', 105, 140, { align: 'center' });
    
    // Éléments décoratifs
    doc.setDrawColor(COLORS.white);
    doc.setLineWidth(3);
    doc.line(50, 160, 160, 160);
    
    // Cercles décoratifs
    doc.setFillColor(COLORS.secondary + '40');
    doc.circle(40, 200, 15, 'F');
    doc.circle(170, 200, 15, 'F');
    doc.circle(105, 220, 20, 'F');
    
    // Informations de contact
    doc.setTextColor(COLORS.white);
    doc.setFontSize(10);
    doc.text('Rapport d\'activité et de performance', 105, 250, { align: 'center' });
    doc.text('Données consolidées et analyses détaillées', 105, 260, { align: 'center' });
    
    doc.addPage();
  } catch (error) {
    console.error('Erreur dans generateCoverPage:', error);
  }
};

const generateExecutiveSummary = (doc: jsPDF, data: PDFData) => {
  try {
    // Header avec titre moderne
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Résumé Exécutif', 20, 30);
    
    // Ligne de séparation moderne
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(2);
    doc.line(20, 35, 190, 35);
    
    // KPIs en cartes arrondies avec icônes
    const kpis = [
      {
        label: 'Taux de conversion global',
        value: `${data.eventMetrics?.conversionRate || 0}%`,
        color: getConversionColor(data.eventMetrics?.conversionRate || 0),
        icon: '📊',
        description: 'Pourcentage de candidats retenus'
      },
      {
        label: 'Stagiaires bénéficiaires',
        value: data.eventMetrics?.totalBeneficiaries || 0,
        color: COLORS.info,
        icon: '👥',
        description: 'Nombre total de participants'
      },
      {
        label: 'Entreprises partenaires',
        value: data.enterpriseMetrics?.partners || 0,
        color: COLORS.purple,
        icon: '🏢',
        description: 'Partenariats actifs'
      },
      {
        label: 'Demandes actives',
        value: data.demandMetrics?.activeDemands || 0,
        color: COLORS.warning,
        icon: '📋',
        description: 'Opportunités en cours'
      }
    ];
    
    // Disposition en grille 2x2
    let y = 50;
    kpis.forEach((kpi, index) => {
      const x = 20 + (index % 2) * 85;
      const yPos = y + Math.floor(index / 2) * 45;
      
      // Carte arrondie avec ombre
      doc.setFillColor(COLORS.white);
      doc.roundedRect(x, yPos, 80, 35, 5, 5, 'F');
      
      // Bordure colorée
      doc.setDrawColor(kpi.color);
      doc.setLineWidth(1);
      doc.roundedRect(x, yPos, 80, 35, 5, 5, 'S');
      
      // Icône
      doc.setTextColor(kpi.color);
      doc.setFontSize(16);
      doc.text(kpi.icon, x + 5, yPos + 8);
      
      // Valeur principale
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.value.toString(), x + 25, yPos + 8);
      
      // Label
      doc.setTextColor(COLORS.dark);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(kpi.label, x + 5, yPos + 18);
      
      // Description
      doc.setFontSize(7);
      doc.setTextColor(COLORS.dark);
      doc.text(kpi.description, x + 5, yPos + 25);
    });
    
    // Donut chart pour taux de conversion
    const conversionRate = data.eventMetrics?.conversionRate || 0;
    const centerX = 105;
    const centerY = 180;
    const radius = 25;
    
    // Cercle de fond
    doc.setDrawColor(COLORS.light);
    doc.setLineWidth(8);
    doc.circle(centerX, centerY, radius, 'S');
    
    // Arc de progression
    const angle = (conversionRate / 100) * 360;
    doc.setDrawColor(getConversionColor(conversionRate));
    doc.setLineWidth(8);
    doc.arc(centerX, centerY, radius, 0, angle, 'S');
    
    // Texte central
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${conversionRate}%`, centerX, centerY + 2, { align: 'center' });
    
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Taux de', centerX, centerY + 8, { align: 'center' });
    doc.text('conversion', centerX, centerY + 12, { align: 'center' });
    
    // Description du rapport
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Ce rapport présente un aperçu complet des activités d\'employabilité', 20, 220);
    doc.text('du Centre d\'Orientation Professionnelle CMC SM, incluant les métriques', 20, 230);
    doc.text('de performance, les événements organisés et les partenariats établis.', 20, 240);
    
    doc.addPage();
  } catch (error) {
    console.error('Erreur dans generateExecutiveSummary:', error);
  }
};

const generateChartsPage = (doc: jsPDF, data: PDFData) => {
  try {
    // Titre moderne
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Graphiques et Analyses', 20, 30);
    
    // Ligne de séparation
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(2);
    doc.line(20, 35, 190, 35);
    
    // Pie chart pour événements par volet
    if (data.eventMetrics?.eventsByVolet) {
      doc.setTextColor(COLORS.dark);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 Répartition des événements par volet', 20, 50);
      
      const voletData = Object.entries(data.eventMetrics.eventsByVolet);
      const totalEvents = data.eventMetrics.totalEvents;
      
      // Dessiner le pie chart
      const centerX = 60;
      const centerY = 100;
      const radius = 30;
      let currentAngle = 0;
      
      const colors = [COLORS.primary, COLORS.secondary, COLORS.warning, COLORS.info, COLORS.purple];
      
      voletData.forEach(([volet, count], index) => {
        const percentage = (count as number / totalEvents) * 100;
        const angle = (percentage / 100) * 360;
        
        // Arc du pie chart
        doc.setFillColor(colors[index % colors.length]);
        doc.arc(centerX, centerY, radius, currentAngle, currentAngle + angle, 'F');
        
        currentAngle += angle;
      });
      
      // Légende
      let legendY = 80;
      voletData.forEach(([volet, count], index) => {
        const voletLabel = getVoletLabel(volet);
        const percentage = Math.round((count as number / totalEvents) * 100);
        
        // Carré de couleur
        doc.setFillColor(colors[index % colors.length]);
        doc.rect(120, legendY, 8, 8, 'F');
        
        // Texte
        doc.setTextColor(COLORS.dark);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${voletLabel} (${percentage}%)`, 135, legendY + 6);
        
        legendY += 15;
      });
    }
    
    // Bar chart horizontal pour entreprises par secteur
    if (data.enterpriseMetrics?.sectors) {
      doc.setTextColor(COLORS.dark);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('🏢 Répartition des entreprises par secteur', 20, 160);
      
      const sectorData = Object.entries(data.enterpriseMetrics.sectors);
      const maxCount = Math.max(...Object.values(data.enterpriseMetrics.sectors));
      
      let y = 180;
      sectorData.slice(0, 5).forEach(([sector, count], index) => {
        const percentage = Math.round((count as number / data.enterpriseMetrics.totalEnterprises) * 100);
        const barWidth = (count as number / maxCount) * 80;
        
        // Barre de fond
        doc.setFillColor(COLORS.light);
        doc.rect(20, y, 80, 8, 'F');
        
        // Barre de progression
        doc.setFillColor(COLORS.info);
        doc.rect(20, y, barWidth, 8, 'F');
        
        // Texte
        doc.setTextColor(COLORS.dark);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(sector, 20, y - 2);
        doc.text(`${count} (${percentage}%)`, 105, y + 5);
        
        y += 20;
      });
    }
    
    doc.addPage();
  } catch (error) {
    console.error('Erreur dans generateChartsPage:', error);
  }
};

const generateDetailedData = (doc: jsPDF, data: PDFData) => {
  try {
    // Titre moderne
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Données Détaillées', 20, 30);
    
    // Ligne de séparation
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(2);
    doc.line(20, 35, 190, 35);
    
    // Tableau des événements récents avec design professionnel
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('📅 Événements Récents', 20, 50);
    
    // En-têtes du tableau avec fond coloré
    const headers = ['Événement', 'Date', 'Volet', 'Bénéficiaires'];
    const headerY = 65;
    
    doc.setFillColor(COLORS.primary);
    doc.rect(20, headerY - 5, 170, 10, 'F');
    
    doc.setTextColor(COLORS.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    headers.forEach((header, index) => {
      const x = 20 + index * 42.5;
      doc.text(header, x + 2, headerY);
    });
    
    // Données du tableau avec lignes alternées
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    let y = headerY + 15;
    data.evenements.slice(0, 8).forEach((event, index) => {
      if (y > 250) {
        doc.addPage();
        y = 30;
      }
      
      // Fond alterné pour les lignes
      if (index % 2 === 0) {
        doc.setFillColor(COLORS.light);
        doc.rect(20, y - 3, 170, 8, 'F');
      }
      
      const rowData = [
        event.titre?.substring(0, 20) + (event.titre?.length > 20 ? '...' : ''),
        event.date_debut ? new Date(event.date_debut).toLocaleDateString('fr-FR') : 'N/A',
        getVoletLabel(event.volet || 'non_defini'),
        event.nombre_beneficiaires || 0
      ];
      
      rowData.forEach((cell, cellIndex) => {
        const x = 20 + cellIndex * 42.5;
        doc.text(cell.toString(), x + 2, y);
      });
      
      y += 8;
    });
    
    doc.addPage();
  } catch (error) {
    console.error('Erreur dans generateDetailedData:', error);
  }
};

const generatePoleMetrics = (doc: jsPDF, data: PDFData) => {
  try {
    // Titre moderne
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Métriques par Pôles', 20, 30);
    
    // Ligne de séparation
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(2);
    doc.line(20, 35, 190, 35);
    
    if (data.eventMetrics?.eventsByPole) {
      const poleData = Object.entries(data.eventMetrics.eventsByPole);
      let y = 50;
      
      poleData.forEach(([poleName, eventCount], index) => {
        if (y > 250) {
          doc.addPage();
          y = 30;
        }
        
        const conversionRate = data.eventMetrics.conversionRateByPole[poleName] || 0;
        
        // Carte métrique moderne
        doc.setFillColor(COLORS.white);
        doc.roundedRect(20, y, 170, 30, 5, 5, 'F');
        
        // Bordure colorée selon le taux de conversion
        doc.setDrawColor(getConversionColor(conversionRate));
        doc.setLineWidth(1);
        doc.roundedRect(20, y, 170, 30, 5, 5, 'S');
        
        // Icône selon le pôle
        const icon = getPoleIcon(poleName);
        doc.setTextColor(getConversionColor(conversionRate));
        doc.setFontSize(16);
        doc.text(icon, 25, y + 8);
        
        // Données
        doc.setTextColor(COLORS.primary);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(poleName, 40, y + 8);
        
        doc.setTextColor(COLORS.dark);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${eventCount} événements`, 40, y + 18);
        doc.text(`Taux de conversion: ${conversionRate}%`, 120, y + 18);
        
        // Barre de progression pour le taux
        const barWidth = (conversionRate / 100) * 60;
        doc.setFillColor(COLORS.light);
        doc.rect(120, y + 20, 60, 4, 'F');
        doc.setFillColor(getConversionColor(conversionRate));
        doc.rect(120, y + 20, barWidth, 4, 'F');
        
        y += 40;
      });
    }
    
    doc.addPage();
  } catch (error) {
    console.error('Erreur dans generatePoleMetrics:', error);
  }
};

const generateConclusion = (doc: jsPDF, data: PDFData) => {
  try {
    // Titre moderne
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Conclusion et Recommandations', 20, 30);
    
    // Ligne de séparation
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(2);
    doc.line(20, 35, 190, 35);
    
    // Funnel chart pour le processus de conversion
    const totalCandidates = data.eventMetrics?.totalCandidates || 0;
    const totalRetained = data.eventMetrics?.totalRetained || 0;
    const totalBeneficiaries = data.eventMetrics?.totalBeneficiaries || 0;
    
    // Dessiner le funnel
    const funnelX = 105;
    const funnelY = 80;
    
    // Niveau 1: Candidats reçus
    doc.setFillColor(COLORS.primary);
    doc.rect(funnelX - 40, funnelY, 80, 20, 'F');
    doc.setTextColor(COLORS.white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totalCandidates}`, funnelX, funnelY + 8, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Candidats reçus', funnelX, funnelY + 15, { align: 'center' });
    
    // Niveau 2: Candidats retenus
    doc.setFillColor(COLORS.secondary);
    doc.rect(funnelX - 30, funnelY + 30, 60, 15, 'F');
    doc.setTextColor(COLORS.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totalRetained}`, funnelX, funnelY + 38, { align: 'center' });
    doc.setFontSize(7);
    doc.text('Candidats retenus', funnelX, funnelY + 43, { align: 'center' });
    
    // Niveau 3: Bénéficiaires
    doc.setFillColor(COLORS.success);
    doc.rect(funnelX - 20, funnelY + 55, 40, 10, 'F');
    doc.setTextColor(COLORS.white);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totalBeneficiaries}`, funnelX, funnelY + 62, { align: 'center' });
    doc.setFontSize(6);
    doc.text('Bénéficiaires', funnelX, funnelY + 66, { align: 'center' });
    
    // Contenu avec bullets et icônes
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const conclusions = [
      `✅ Le COP CMC SM a organisé ${data.eventMetrics?.totalEvents || 0} événements cette période,`,
      `touchant ${data.eventMetrics?.totalBeneficiaries || 0} stagiaires bénéficiaires.`,
      '',
      `📈 Avec un taux de conversion global de ${data.eventMetrics?.conversionRate || 0}%,`,
      'les activités d\'employabilité montrent des résultats prometteurs.',
      '',
      `🤝 Le partenariat avec ${data.enterpriseMetrics?.partners || 0} entreprises`,
      'démontre l\'engagement du secteur privé dans l\'insertion professionnelle.',
      '',
      '💡 Recommandations :',
      '• 🎯 Maintenir la diversification des volets d\'activité',
      '• 🤝 Renforcer les partenariats avec les entreprises',
      '• 📊 Optimiser les taux de conversion par pôle',
      '• 🚀 Développer de nouveaux événements innovants'
    ];
    
    let y = 120;
    conclusions.forEach((line) => {
      if (y > 250) {
        doc.addPage();
        y = 30;
      }
      doc.text(line, 20, y);
      y += 8;
    });
    
    // Signature moderne
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('COP CMC SM', 20, 250);
    doc.text('Centre d\'Orientation Professionnelle', 20, 260);
  } catch (error) {
    console.error('Erreur dans generateConclusion:', error);
  }
};

// Fonctions utilitaires
const getConversionColor = (rate: number): string => {
  if (rate >= 40) return COLORS.success;
  if (rate >= 20) return COLORS.warning;
  return COLORS.danger;
};

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

const getPoleIcon = (poleName: string): string => {
  const icons: { [key: string]: string } = {
    'AGRICULTURE': '🌾',
    'INDUSTRIE': '🏭',
    'SERVICES': '💼',
    'COMMERCE': '🛒',
    'Tous les pôles confondus': '🌍'
  };
  return icons[poleName] || '📊';
};
