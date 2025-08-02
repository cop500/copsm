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
  const margin = 25;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = 30;

  // Couleurs
  const primaryColor = [0, 64, 128]; // Bleu COP
  const textColor = [0, 0, 0]; // Noir

  // En-tête simple
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...primaryColor);
  pdf.text('COP - Centre d\'Orientation Professionnelle', margin, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...textColor);
  pdf.text('Détail de la demande entreprise', margin, yPosition);
  
  yPosition += 15;

  // Informations entreprise
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...primaryColor);
  pdf.text('Informations entreprise', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...textColor);
  
  const entrepriseInfo = [
    { label: 'Nom de l\'entreprise', value: demande.entreprise_nom },
    { label: 'Secteur d\'activité', value: demande.secteur },
    { label: 'Adresse', value: demande.entreprise_adresse },
    { label: 'Ville', value: demande.entreprise_ville },
    { label: 'Email', value: demande.entreprise_email }
  ];

  entrepriseInfo.forEach(info => {
    pdf.text(`${info.label} : ${info.value}`, margin, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Informations contact
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...primaryColor);
  pdf.text('Informations contact', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...textColor);
  
  const contactInfo = [
    { label: 'Nom du contact', value: demande.contact_nom },
    { label: 'Email', value: demande.contact_email },
    { label: 'Téléphone', value: demande.contact_tel }
  ];

  contactInfo.forEach(info => {
    pdf.text(`${info.label} : ${info.value}`, margin, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Détails de la demande
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...primaryColor);
  pdf.text('Détails de la demande', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...textColor);
  
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
    pdf.text(`${info.label} : ${info.value}`, margin, yPosition);
    yPosition += 6;
  });

  // Profils demandés
  if (demande.profils && demande.profils.length > 0) {
    yPosition += 10;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text('Profils demandés', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);
    
    demande.profils.forEach((profil: any, index: number) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Profil ${index + 1} :`, margin, yPosition);
      yPosition += 6;
      
      pdf.setFont('helvetica', 'normal');
      
      // Informations du profil
      const profilDetails = [];
      if (profil.nom) profilDetails.push(`Pôle : ${profil.nom}`);
      if (profil.filiere) profilDetails.push(`Filière : ${profil.filiere}`);
      if (profil.poste) profilDetails.push(`Poste : ${profil.poste}`);
      if (profil.duree) profilDetails.push(`Durée : ${profil.duree}`);
      if (profil.salaire) profilDetails.push(`Salaire : ${profil.salaire}`);

      profilDetails.forEach(detail => {
        pdf.text(`  ${detail}`, margin + 5, yPosition);
        yPosition += 5;
      });
      
      yPosition += 6;
    });
  }

  // Statistiques si disponibles
  if (statistiques) {
    yPosition += 8;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text('Statistiques', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);

    if (demande.evenement_type === 'Job Day') {
      if (statistiques.nombre_candidats) {
        pdf.text(`Nombre de candidats : ${statistiques.nombre_candidats}`, margin, yPosition);
        yPosition += 6;
      }
      if (statistiques.nombre_candidats_retenus) {
        pdf.text(`Nombre de candidats retenus : ${statistiques.nombre_candidats_retenus}`, margin, yPosition);
        yPosition += 6;
      }
    } else if (demande.evenement_type === 'CV seulement') {
      if (statistiques.nombre_cv_envoyes) {
        pdf.text(`Nombre de CV envoyés : ${statistiques.nombre_cv_envoyes}`, margin, yPosition);
        yPosition += 6;
      }
    }
  }

  // Commentaires si disponibles
  if (commentaires && commentaires.length > 0) {
    yPosition += 10;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text('Commentaires', margin, yPosition);
    yPosition += 8;

    commentaires.forEach((commentaire: any) => {
      const date = new Date(commentaire.created_at).toLocaleDateString('fr-FR');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text(`${commentaire.auteur} - ${date}`, margin, yPosition);
      yPosition += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textColor);
      
      const lines = pdf.splitTextToSize(commentaire.contenu, contentWidth);
      lines.forEach((line: string) => {
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      yPosition += 8;
    });
  }

  return pdf;
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
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          line-height: 1.4;
          color: #333;
        }
        
        .header {
          color: #004080;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .subtitle {
          color: #333;
          font-size: 14px;
          margin-bottom: 30px;
        }
        
        .section {
          margin-bottom: 15px;
        }
        
        .section-title {
          color: #004080;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 12px;
        }
        
        .info-line {
          margin-bottom: 5px;
          font-size: 12px;
        }
        
        .profil {
          margin-bottom: 10px;
          padding-left: 15px;
        }
        
        .profil-title {
          font-weight: bold;
          margin-bottom: 8px;
          font-size: 12px;
        }
        
        .profil-detail {
          margin-bottom: 6px;
          padding-left: 10px;
          font-size: 12px;
        }
        
        .comment {
          margin-bottom: 10px;
          padding: 8px;
          background: #f9f9f9;
          border-left: 3px solid #004080;
        }
        
        .comment-header {
          font-weight: bold;
          color: #004080;
          margin-bottom: 5px;
          font-size: 12px;
        }
        
        .comment-content {
          font-size: 12px;
        }
        
        .footer {
          display: none;
        }
        
        @media print {
          body { margin: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">COP - Centre d'Orientation Professionnelle</div>
      <div class="subtitle">Détail de la demande entreprise</div>
      
      <div class="section">
        <div class="section-title">Informations entreprise</div>
        <div class="info-line">Nom de l'entreprise : ${demande.entreprise_nom}</div>
        <div class="info-line">Secteur d'activité : ${demande.secteur}</div>
        <div class="info-line">Adresse : ${demande.entreprise_adresse}</div>
        <div class="info-line">Ville : ${demande.entreprise_ville}</div>
        <div class="info-line">Email : ${demande.entreprise_email}</div>
      </div>
      
      <div class="section">
        <div class="section-title">Informations contact</div>
        <div class="info-line">Nom du contact : ${demande.contact_nom}</div>
        <div class="info-line">Email : ${demande.contact_email}</div>
        <div class="info-line">Téléphone : ${demande.contact_tel}</div>
      </div>
      
      <div class="section">
        <div class="section-title">Détails de la demande</div>
        <div class="info-line">Type de demande : ${demande.type_demande}</div>
        <div class="info-line">Type d'événement : ${demande.evenement_type}</div>
        ${demande.evenement_date ? `<div class="info-line">Date de l'événement : ${new Date(demande.evenement_date).toLocaleDateString('fr-FR')}</div>` : ''}
      </div>
      
      ${demande.profils && demande.profils.length > 0 ? `
        <div class="section">
          <div class="section-title">Profils demandés</div>
          ${demande.profils.map((profil: any, index: number) => {
            let nomProfil = '';
            if (typeof profil === 'string') {
              nomProfil = profil;
            } else if (profil && typeof profil === 'object') {
              nomProfil = profil.nom || profil.name || profil.libelle || profil.label || 'Profil non spécifié';
            } else {
              nomProfil = String(profil);
            }
            
            return `
              <div class="profil">
                <div class="profil-title">Profil ${index + 1} :</div>
                ${profil.nom ? `<div class="profil-detail">Pôle : ${profil.nom}</div>` : ''}
                ${profil.filiere ? `<div class="profil-detail">Filière : ${profil.filiere}</div>` : ''}
                ${profil.poste ? `<div class="profil-detail">Poste : ${profil.poste}</div>` : ''}
                ${profil.duree ? `<div class="profil-detail">Durée : ${profil.duree}</div>` : ''}
                ${profil.salaire ? `<div class="profil-detail">Salaire : ${profil.salaire}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
      
      ${statistiques ? `
        <div class="section">
          <div class="section-title">Statistiques</div>
          ${demande.evenement_type === 'Job Day' ? `
            ${statistiques.nombre_candidats ? `<div class="info-line">Nombre de candidats : ${statistiques.nombre_candidats}</div>` : ''}
            ${statistiques.nombre_candidats_retenus ? `<div class="info-line">Nombre de candidats retenus : ${statistiques.nombre_candidats_retenus}</div>` : ''}
          ` : ''}
          ${demande.evenement_type === 'CV seulement' ? `
            ${statistiques.nombre_cv_envoyes ? `<div class="info-line">Nombre de CV envoyés : ${statistiques.nombre_cv_envoyes}</div>` : ''}
          ` : ''}
        </div>
      ` : ''}
      
      ${commentaires && commentaires.length > 0 ? `
        <div class="section">
          <div class="section-title">Commentaires</div>
          ${commentaires.map((commentaire: any) => `
            <div class="comment">
              <div class="comment-header">
                ${commentaire.auteur} - ${new Date(commentaire.created_at).toLocaleDateString('fr-FR')}
              </div>
              <div class="comment-content">${commentaire.contenu}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="footer">
        <div>Demande créée le : ${new Date(demande.created_at).toLocaleDateString('fr-FR')}</div>
        <div>Statut : ${demande.statut || 'Non défini'}</div>
        <div>Document généré automatiquement par COP</div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
}; 