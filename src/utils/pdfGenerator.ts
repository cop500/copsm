import jsPDF from 'jspdf';

// Palette de couleurs simplifiée
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
    
    // Configuration simple
    doc.setFont('helvetica');
    
    // Page de couverture
    generateCoverPage(doc);
    
    // Résumé exécutif simplifié
    generateExecutiveSummary(doc, data);
    
    // Graphiques simplifiés
    generateChartsPage(doc, data);
    
    // Données détaillées
    generateDetailedData(doc, data);
    
    // Métriques par pôles
    generatePoleMetrics(doc, data);
    
    // Conclusion
    generateConclusion(doc, data);
    
    return doc;
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw new Error('Erreur lors de la génération du PDF');
  }
};

const generateCoverPage = (doc: jsPDF) => {
  try {
    // Fond simple
    doc.setFillColor(COLORS.primary);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Titre principal
    doc.setTextColor(COLORS.white);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('BILAN D\'EMPLOYABILITÉ', 105, 80, { align: 'center' });
    
    // Sous-titre
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.text('Centre d\'Orientation Professionnelle CMC SM', 105, 100, { align: 'center' });
    
    // Date
    doc.setFontSize(14);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 105, 120, { align: 'center' });
    
    // Slogan
    doc.setFontSize(12);
    doc.setTextColor(COLORS.light);
    doc.text('Transformer les compétences en opportunités', 105, 140, { align: 'center' });
    
    // Ligne décorative
    doc.setDrawColor(COLORS.white);
    doc.setLineWidth(3);
    doc.line(50, 160, 160, 160);
    
    // Informations
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
    // Titre
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Résumé Exécutif', 20, 30);
    
    // Ligne de séparation
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(2);
    doc.line(20, 35, 190, 35);
    
    // KPIs en format simple
    const kpis = [
      {
        label: 'Taux de conversion global',
        value: `${data.eventMetrics?.conversionRate || 0}%`,
        color: getConversionColor(data.eventMetrics?.conversionRate || 0)
      },
      {
        label: 'Stagiaires bénéficiaires',
        value: data.eventMetrics?.totalBeneficiaries || 0,
        color: COLORS.info
      },
      {
        label: 'Entreprises partenaires',
        value: data.enterpriseMetrics?.partners || 0,
        color: COLORS.secondary
      },
      {
        label: 'Demandes actives',
        value: data.demandMetrics?.activeDemands || 0,
        color: COLORS.warning
      }
    ];
    
    // Disposition simple
    let y = 50;
    kpis.forEach((kpi, index) => {
      const x = 20 + (index % 2) * 85;
      const yPos = y + Math.floor(index / 2) * 40;
      
      // Boîte simple
      doc.setFillColor(COLORS.white);
      doc.rect(x, yPos, 80, 30, 'F');
      
      // Bordure
      doc.setDrawColor(kpi.color);
      doc.setLineWidth(1);
      doc.rect(x, yPos, 80, 30, 'S');
      
      // Valeur
      doc.setTextColor(kpi.color);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.value.toString(), x + 5, yPos + 10);
      
      // Label
      doc.setTextColor(COLORS.dark);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(kpi.label, x + 5, yPos + 20);
    });
    
    // Description
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Ce rapport présente un aperçu complet des activités d\'employabilité', 20, 170);
    doc.text('du Centre d\'Orientation Professionnelle CMC SM, incluant les métriques', 20, 180);
    doc.text('de performance, les événements organisés et les partenariats établis.', 20, 190);
    
    doc.addPage();
  } catch (error) {
    console.error('Erreur dans generateExecutiveSummary:', error);
  }
};

const generateChartsPage = (doc: jsPDF, data: PDFData) => {
  try {
    // Titre
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Graphiques et Analyses', 20, 30);
    
    // Ligne de séparation
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(2);
    doc.line(20, 35, 190, 35);
    
    // Événements par volet - format simple
    if (data.eventMetrics?.eventsByVolet) {
      doc.setTextColor(COLORS.dark);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Répartition des événements par volet', 20, 50);
      
      const voletData = Object.entries(data.eventMetrics.eventsByVolet);
      let y = 70;
      
      voletData.forEach(([volet, count], index) => {
        const voletLabel = getVoletLabel(volet);
        const percentage = Math.round((count as number / data.eventMetrics.totalEvents) * 100);
        
        // Barre simple
        const barWidth = (count as number / Math.max(...Object.values(data.eventMetrics.eventsByVolet))) * 100;
        
        doc.setFillColor(COLORS.light);
        doc.rect(20, y, 150, 8, 'F');
        
        doc.setFillColor(COLORS.primary);
        doc.rect(20, y, barWidth * 1.5, 8, 'F');
        
        // Texte
        doc.setTextColor(COLORS.dark);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(voletLabel, 20, y - 2);
        doc.text(`${count} événements (${percentage}%)`, 175, y + 5, { align: 'right' });
        
        y += 20;
      });
    }
    
    // Entreprises par secteur - format simple
    if (data.enterpriseMetrics?.sectors) {
      doc.setTextColor(COLORS.dark);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Répartition des entreprises par secteur', 20, 160);
      
      const sectorData = Object.entries(data.enterpriseMetrics.sectors);
      let y = 180;
      
      sectorData.slice(0, 5).forEach(([sector, count], index) => {
        const percentage = Math.round((count as number / data.enterpriseMetrics.totalEnterprises) * 100);
        
        // Barre simple
        const barWidth = (count as number / Math.max(...Object.values(data.enterpriseMetrics.sectors))) * 100;
        
        doc.setFillColor(COLORS.light);
        doc.rect(20, y, 150, 8, 'F');
        
        doc.setFillColor(COLORS.info);
        doc.rect(20, y, barWidth * 1.5, 8, 'F');
        
        // Texte
        doc.setTextColor(COLORS.dark);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(sector, 20, y - 2);
        doc.text(`${count} entreprises (${percentage}%)`, 175, y + 5, { align: 'right' });
        
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
    // Titre
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Données Détaillées', 20, 30);
    
    // Ligne de séparation
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(2);
    doc.line(20, 35, 190, 35);
    
    // Tableau des événements
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Événements Récents', 20, 50);
    
    // En-têtes du tableau
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
    
    // Données du tableau
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    let y = headerY + 15;
    data.evenements.slice(0, 8).forEach((event, index) => {
      if (y > 250) {
        doc.addPage();
        y = 30;
      }
      
      // Fond alterné
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
    // Titre
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
        
        // Boîte simple
        doc.setFillColor(COLORS.white);
        doc.rect(20, y, 170, 25, 'F');
        
        // Bordure
        doc.setDrawColor(getConversionColor(conversionRate));
        doc.setLineWidth(1);
        doc.rect(20, y, 170, 25, 'S');
        
        // Données
        doc.setTextColor(COLORS.primary);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(poleName, 25, y + 8);
        
        doc.setTextColor(COLORS.dark);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${eventCount} événements`, 25, y + 18);
        doc.text(`Taux de conversion: ${conversionRate}%`, 120, y + 18);
        
        y += 35;
      });
    }
    
    doc.addPage();
  } catch (error) {
    console.error('Erreur dans generatePoleMetrics:', error);
  }
};

const generateConclusion = (doc: jsPDF, data: PDFData) => {
  try {
    // Titre
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Conclusion et Recommandations', 20, 30);
    
    // Ligne de séparation
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(2);
    doc.line(20, 35, 190, 35);
    
    // Contenu simple
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const conclusions = [
      `Le COP CMC SM a organisé ${data.eventMetrics?.totalEvents || 0} événements cette période,`,
      `touchant ${data.eventMetrics?.totalBeneficiaries || 0} stagiaires bénéficiaires.`,
      '',
      `Avec un taux de conversion global de ${data.eventMetrics?.conversionRate || 0}%,`,
      'les activités d\'employabilité montrent des résultats prometteurs.',
      '',
      `Le partenariat avec ${data.enterpriseMetrics?.partners || 0} entreprises`,
      'démontre l\'engagement du secteur privé dans l\'insertion professionnelle.',
      '',
      'Recommandations :',
      '• Maintenir la diversification des volets d\'activité',
      '• Renforcer les partenariats avec les entreprises',
      '• Optimiser les taux de conversion par pôle',
      '• Développer de nouveaux événements innovants'
    ];
    
    let y = 50;
    conclusions.forEach((line) => {
      if (y > 250) {
        doc.addPage();
        y = 30;
      }
      doc.text(line, 20, y);
      y += 8;
    });
    
    // Signature
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
  if (rate >= 40) return COLORS.secondary;
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
