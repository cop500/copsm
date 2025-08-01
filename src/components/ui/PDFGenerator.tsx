import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

interface PDFGeneratorProps {
  demande: DemandeEntreprise;
  commentaires?: any[];
  statistiques?: any;
}

export const generateDemandePDF = async (demande: DemandeEntreprise, commentaires: any[] = [], statistiques: any = null) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = 30;

  // Couleurs COP
  const primaryColor = [0, 64, 128]; // Bleu COP
  const secondaryColor = [128, 128, 128]; // Gris
  const accentColor = [255, 255, 255]; // Blanc

  // En-tête avec design professionnel
  pdf.setFillColor(...primaryColor);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  // Logo/texte COP
  pdf.setTextColor(...accentColor);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('COP', margin, 25);
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Centre d\'Orientation Professionnelle', margin + 35, 25);
  
  // Ligne de séparation
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.5);
  pdf.line(margin, 45, pageWidth - margin, 45);
  
  yPosition = 60;

  // Titre principal
  pdf.setTextColor(...primaryColor);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Détail de la demande entreprise', margin, yPosition);
  yPosition += 20;

  // Informations entreprise avec design
  drawSectionHeader(pdf, 'Informations entreprise', margin, yPosition);
  yPosition += 15;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  const entrepriseInfo = [
    { label: 'Nom de l\'entreprise', value: demande.entreprise_nom },
    { label: 'Secteur d\'activité', value: demande.secteur },
    { label: 'Adresse', value: demande.entreprise_adresse },
    { label: 'Ville', value: demande.entreprise_ville },
    { label: 'Email', value: demande.entreprise_email }
  ];

  entrepriseInfo.forEach(info => {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text(`${info.label} :`, margin, yPosition);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const textWidth = pdf.getTextWidth(info.value);
    if (textWidth > contentWidth - 60) {
      const lines = pdf.splitTextToSize(info.value, contentWidth - 60);
      lines.forEach((line: string, index: number) => {
        pdf.text(line, margin + 50, yPosition + (index * 5));
      });
      yPosition += lines.length * 5 + 8;
    } else {
      pdf.text(info.value, margin + 50, yPosition);
      yPosition += 8;
    }
  });

  yPosition += 10;

  // Informations contact
  drawSectionHeader(pdf, 'Informations contact', margin, yPosition);
  yPosition += 15;

  const contactInfo = [
    { label: 'Nom du contact', value: demande.contact_nom },
    { label: 'Email', value: demande.contact_email },
    { label: 'Téléphone', value: demande.contact_tel }
  ];

  contactInfo.forEach(info => {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text(`${info.label} :`, margin, yPosition);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(info.value, margin + 50, yPosition);
    yPosition += 8;
  });

  yPosition += 10;

  // Détails de la demande
  drawSectionHeader(pdf, 'Détails de la demande', margin, yPosition);
  yPosition += 15;

  const demandeInfo = [
    { label: 'Type de demande', value: demande.type_demande },
    { label: 'Type d\'événement', value: demande.evenement_type }
  ];

  if (demande.evenement_date) {
    demandeInfo.push({
      label: 'Date de l\'événement',
      value: new Date(demande.evenement_date).toLocaleDateString('fr-FR')
    });
  }

  demandeInfo.forEach(info => {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text(`${info.label} :`, margin, yPosition);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(info.value, margin + 50, yPosition);
    yPosition += 8;
  });

  // Profils demandés avec design amélioré
  if (demande.profils && demande.profils.length > 0) {
    yPosition += 10;
    drawSectionHeader(pdf, 'Profils demandés', margin, yPosition);
    yPosition += 15;

    demande.profils.forEach((profil: any, index: number) => {
      // Encadré pour chaque profil
      const profilHeight = 25;
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, yPosition - 5, contentWidth, profilHeight, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, yPosition - 5, contentWidth, profilHeight, 'S');

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text(`Profil ${index + 1}`, margin + 5, yPosition + 3);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      // Informations du profil
      const profilDetails = [];
      if (profil.nom) profilDetails.push(`Pôle: ${profil.nom}`);
      if (profil.filiere) profilDetails.push(`Filière: ${profil.filiere}`);
      if (profil.poste) profilDetails.push(`Poste: ${profil.poste}`);
      if (profil.duree) profilDetails.push(`Durée: ${profil.duree}`);
      if (profil.salaire) profilDetails.push(`Salaire: ${profil.salaire}`);

      profilDetails.forEach((detail, detailIndex) => {
        pdf.text(detail, margin + 5, yPosition + 12 + (detailIndex * 5));
      });

      yPosition += profilHeight + 5;
    });
  }

  // Statistiques si disponibles
  if (statistiques) {
    yPosition += 10;
    drawSectionHeader(pdf, 'Statistiques', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    if (demande.evenement_type === 'Job Day') {
      if (statistiques.nombre_candidats) {
        pdf.text(`Nombre de candidats: ${statistiques.nombre_candidats}`, margin, yPosition);
        yPosition += 8;
      }
      if (statistiques.nombre_candidats_retenus) {
        pdf.text(`Nombre de candidats retenus: ${statistiques.nombre_candidats_retenus}`, margin, yPosition);
        yPosition += 8;
      }
    } else if (demande.evenement_type === 'CV seulement') {
      if (statistiques.nombre_cv_envoyes) {
        pdf.text(`Nombre de CV envoyés: ${statistiques.nombre_cv_envoyes}`, margin, yPosition);
        yPosition += 8;
      }
    }
  }

  // Commentaires si disponibles
  if (commentaires && commentaires.length > 0) {
    yPosition += 10;
    drawSectionHeader(pdf, 'Commentaires', margin, yPosition);
    yPosition += 15;

    commentaires.forEach((commentaire: any) => {
      // Encadré pour chaque commentaire
      const commentHeight = 30;
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, yPosition - 5, contentWidth, commentHeight, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, yPosition - 5, contentWidth, commentHeight, 'S');

      const date = new Date(commentaire.created_at).toLocaleDateString('fr-FR');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text(`${commentaire.auteur} - ${date}`, margin + 5, yPosition + 3);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      const lines = pdf.splitTextToSize(commentaire.contenu, contentWidth - 10);
      lines.forEach((line: string, index: number) => {
        pdf.text(line, margin + 5, yPosition + 12 + (index * 4));
      });

      yPosition += commentHeight + 5;
    });
  }

  // Pied de page
  const footerY = pageHeight - 30;
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY, pageWidth - margin, footerY);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...secondaryColor);
  pdf.text(`Demande créée le: ${new Date(demande.created_at).toLocaleDateString('fr-FR')}`, margin, footerY + 8);
  pdf.text(`Statut: ${demande.statut || 'Non défini'}`, margin + 80, footerY + 8);
  pdf.text('Document généré automatiquement par COP', pageWidth - margin - 80, footerY + 8);

  return pdf;
};

// Fonction pour dessiner les en-têtes de section
const drawSectionHeader = (pdf: jsPDF, title: string, x: number, y: number) => {
  pdf.setFillColor(0, 64, 128);
  pdf.rect(x, y - 2, 5, 15, 'F');
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 64, 128);
  pdf.text(title, x + 10, y + 8);
};

export const downloadDemandePDF = async (demande: DemandeEntreprise, commentaires: any[] = [], statistiques: any = null) => {
  try {
    const pdf = await generateDemandePDF(demande, commentaires, statistiques);
    const fileName = `demande_${demande.entreprise_nom.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw error;
  }
};

export const printDemande = (demande: DemandeEntreprise, commentaires: any[] = [], statistiques: any = null) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Détail de la demande - ${demande.entreprise_nom}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          font-family: 'Inter', Arial, sans-serif; 
          margin: 20px; 
          background: #f8fafc;
          color: #1e293b;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #004080 0%, #1e40af 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .header p {
          font-size: 16px;
          opacity: 0.9;
        }
        
        .content {
          padding: 30px;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section-title {
          color: #004080;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 15px;
          padding-left: 15px;
          border-left: 4px solid #004080;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        .info-item {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .info-label {
          font-weight: 600;
          color: #004080;
          font-size: 14px;
          margin-bottom: 5px;
        }
        
        .info-value {
          color: #1e293b;
          font-size: 14px;
        }
        
        .profils-grid {
          display: grid;
          gap: 15px;
        }
        
        .profil-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
        }
        
        .profil-title {
          font-weight: 600;
          color: #004080;
          margin-bottom: 10px;
        }
        
        .profil-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }
        
        .comment-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }
        
        .comment-header {
          font-weight: 600;
          color: #004080;
          margin-bottom: 8px;
        }
        
        .comment-content {
          color: #475569;
          line-height: 1.5;
        }
        
        .footer {
          background: #f1f5f9;
          padding: 20px 30px;
          border-top: 1px solid #e2e8f0;
          font-size: 12px;
          color: #64748b;
          display: flex;
          justify-content: space-between;
        }
        
        @media print {
          body { margin: 0; background: white; }
          .container { box-shadow: none; border-radius: 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>COP</h1>
          <p>Centre d'Orientation Professionnelle</p>
          <h2 style="margin-top: 20px; font-size: 20px; font-weight: 500;">Détail de la demande entreprise</h2>
        </div>
        
        <div class="content">
          <div class="section">
            <h3 class="section-title">Informations entreprise</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Nom de l'entreprise</div>
                <div class="info-value">${demande.entreprise_nom}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Secteur d'activité</div>
                <div class="info-value">${demande.secteur}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Adresse</div>
                <div class="info-value">${demande.entreprise_adresse}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Ville</div>
                <div class="info-value">${demande.entreprise_ville}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${demande.entreprise_email}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h3 class="section-title">Informations contact</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Nom du contact</div>
                <div class="info-value">${demande.contact_nom}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${demande.contact_email}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Téléphone</div>
                <div class="info-value">${demande.contact_tel}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h3 class="section-title">Détails de la demande</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Type de demande</div>
                <div class="info-value">${demande.type_demande}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Type d'événement</div>
                <div class="info-value">${demande.evenement_type}</div>
              </div>
              ${demande.evenement_date ? `
                <div class="info-item">
                  <div class="info-label">Date de l'événement</div>
                  <div class="info-value">${new Date(demande.evenement_date).toLocaleDateString('fr-FR')}</div>
                </div>
              ` : ''}
            </div>
          </div>
          
          ${demande.profils && demande.profils.length > 0 ? `
            <div class="section">
              <h3 class="section-title">Profils demandés</h3>
              <div class="profils-grid">
                ${demande.profils.map((profil: any, index: number) => {
                  let nomProfil = '';
                  let detailsProfil = '';
                  
                  if (typeof profil === 'string') {
                    nomProfil = profil;
                  } else if (profil && typeof profil === 'object') {
                    nomProfil = profil.nom || profil.name || profil.libelle || profil.label || 'Profil non spécifié';
                    
                    const details = [];
                    if (profil.filiere) details.push(`Filière: ${profil.filiere}`);
                    if (profil.poste) details.push(`Poste: ${profil.poste}`);
                    if (profil.duree) details.push(`Durée: ${profil.duree}`);
                    if (profil.salaire) details.push(`Salaire: ${profil.salaire}`);
                    if (details.length > 0) {
                      detailsProfil = details.join(', ');
                    }
                  } else {
                    nomProfil = String(profil);
                  }
                  
                  return `
                    <div class="profil-card">
                      <div class="profil-title">Profil ${index + 1}: ${nomProfil}</div>
                      ${detailsProfil ? `<div class="profil-details">${detailsProfil}</div>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
          
          ${statistiques ? `
            <div class="section">
              <h3 class="section-title">Statistiques</h3>
              <div class="info-grid">
                ${demande.evenement_type === 'Job Day' ? `
                  ${statistiques.nombre_candidats ? `
                    <div class="info-item">
                      <div class="info-label">Nombre de candidats</div>
                      <div class="info-value">${statistiques.nombre_candidats}</div>
                    </div>
                  ` : ''}
                  ${statistiques.nombre_candidats_retenus ? `
                    <div class="info-item">
                      <div class="info-label">Nombre de candidats retenus</div>
                      <div class="info-value">${statistiques.nombre_candidats_retenus}</div>
                    </div>
                  ` : ''}
                ` : ''}
                ${demande.evenement_type === 'CV seulement' ? `
                  ${statistiques.nombre_cv_envoyes ? `
                    <div class="info-item">
                      <div class="info-label">Nombre de CV envoyés</div>
                      <div class="info-value">${statistiques.nombre_cv_envoyes}</div>
                    </div>
                  ` : ''}
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          ${commentaires && commentaires.length > 0 ? `
            <div class="section">
              <h3 class="section-title">Commentaires</h3>
              ${commentaires.map((commentaire: any) => `
                <div class="comment-card">
                  <div class="comment-header">
                    ${commentaire.auteur} - ${new Date(commentaire.created_at).toLocaleDateString('fr-FR')}
                  </div>
                  <div class="comment-content">${commentaire.contenu}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <div>Demande créée le: ${new Date(demande.created_at).toLocaleDateString('fr-FR')}</div>
          <div>Statut: ${demande.statut || 'Non défini'}</div>
          <div>Document généré automatiquement par COP</div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
}; 