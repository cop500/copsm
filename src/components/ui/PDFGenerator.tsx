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
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = 30;

  // En-tête avec logo
  pdf.setFontSize(20);
  pdf.setTextColor(0, 64, 128); // Couleur COP
  pdf.text('COP - Centre d\'Orientation Professionnelle', margin, yPosition);
  
  yPosition += 15;
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Détail de la demande entreprise', margin, yPosition);
  
  yPosition += 20;

  // Informations entreprise
  pdf.setFontSize(14);
  pdf.setTextColor(0, 64, 128);
  pdf.text('Informations entreprise', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Nom de l'entreprise: ${demande.entreprise_nom}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Secteur: ${demande.secteur}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Adresse: ${demande.entreprise_adresse}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Ville: ${demande.entreprise_ville}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Email: ${demande.entreprise_email}`, margin, yPosition);
  yPosition += 15;

  // Informations contact
  pdf.setFontSize(14);
  pdf.setTextColor(0, 64, 128);
  pdf.text('Informations contact', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Nom: ${demande.contact_nom}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Email: ${demande.contact_email}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Téléphone: ${demande.contact_tel}`, margin, yPosition);
  yPosition += 15;

  // Type de demande et événement
  pdf.setFontSize(14);
  pdf.setTextColor(0, 64, 128);
  pdf.text('Détails de la demande', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Type de demande: ${demande.type_demande}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Type d'événement: ${demande.evenement_type}`, margin, yPosition);
  yPosition += 8;
  
  if (demande.evenement_date) {
    pdf.text(`Date de l'événement: ${new Date(demande.evenement_date).toLocaleDateString('fr-FR')}`, margin, yPosition);
    yPosition += 8;
  }

  // Profils demandés
  if (demande.profils && demande.profils.length > 0) {
    yPosition += 5;
    pdf.setFontSize(14);
    pdf.setTextColor(0, 64, 128);
    pdf.text('Profils demandés', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    demande.profils.forEach((profil: any) => {
      // Gérer différents formats de profils
      let nomProfil = '';
      let detailsProfil = '';
      
      if (typeof profil === 'string') {
        nomProfil = profil;
      } else if (profil && typeof profil === 'object') {
        nomProfil = profil.nom || profil.name || profil.libelle || profil.label || 'Profil non spécifié';
        
        // Ajouter les détails si disponibles
        const details = [];
        if (profil.duree) details.push(`Durée: ${profil.duree}`);
        if (profil.salaire) details.push(`Salaire: ${profil.salaire}`);
        if (details.length > 0) {
          detailsProfil = ` (${details.join(', ')})`;
        }
      } else {
        nomProfil = String(profil);
      }
      
      pdf.text(`• ${nomProfil}${detailsProfil}`, margin + 5, yPosition);
      yPosition += 6;
    });
  }

  // Statistiques si disponibles
  if (statistiques) {
    yPosition += 10;
    pdf.setFontSize(14);
    pdf.setTextColor(0, 64, 128);
    pdf.text('Statistiques', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
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
    pdf.setFontSize(14);
    pdf.setTextColor(0, 64, 128);
    pdf.text('Commentaires', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    commentaires.forEach((commentaire: any) => {
      const date = new Date(commentaire.created_at).toLocaleDateString('fr-FR');
      pdf.text(`${commentaire.auteur} (${date}):`, margin, yPosition);
      yPosition += 6;
      
      // Gérer le texte long
      const lines = pdf.splitTextToSize(commentaire.contenu, contentWidth - 10);
      lines.forEach((line: string) => {
        pdf.text(line, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    });
  }

  // Informations système
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setTextColor(128, 128, 128);
  pdf.text(`Demande créée le: ${new Date(demande.created_at).toLocaleDateString('fr-FR')}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Statut: ${demande.statut || 'Non défini'}`, margin, yPosition);

  // Pied de page
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(10);
  pdf.setTextColor(128, 128, 128);
  pdf.text('Document généré automatiquement par COP', margin, pageHeight - 20);

  return pdf;
};

export const downloadDemandePDF = async (demande: DemandeEntreprise, commentaires: any[] = [], statistiques: any = null) => {
  try {
    const pdf = await generateDemandePDF(demande, commentaires, statistiques);
    const fileName = `demande_${demande.entreprise_nom}_${new Date().toISOString().split('T')[0]}.pdf`;
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
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { color: #004080; font-size: 20px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .section-title { color: #004080; font-size: 16px; font-weight: bold; margin-bottom: 10px; }
        .info { margin-bottom: 5px; }
        .comment { margin-bottom: 10px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">COP - Centre d'Orientation Professionnelle</div>
      <div class="header">Détail de la demande entreprise</div>
      
      <div class="section">
        <div class="section-title">Informations entreprise</div>
        <div class="info">Nom: ${demande.entreprise_nom}</div>
        <div class="info">Secteur: ${demande.secteur}</div>
        <div class="info">Adresse: ${demande.entreprise_adresse}</div>
        <div class="info">Ville: ${demande.entreprise_ville}</div>
        <div class="info">Email: ${demande.entreprise_email}</div>
      </div>
      
      <div class="section">
        <div class="section-title">Informations contact</div>
        <div class="info">Nom: ${demande.contact_nom}</div>
        <div class="info">Email: ${demande.contact_email}</div>
        <div class="info">Téléphone: ${demande.contact_tel}</div>
      </div>
      
      <div class="section">
        <div class="section-title">Détails de la demande</div>
        <div class="info">Type: ${demande.type_demande}</div>
        <div class="info">Événement: ${demande.evenement_type}</div>
        ${demande.evenement_date ? `<div class="info">Date: ${new Date(demande.evenement_date).toLocaleDateString('fr-FR')}</div>` : ''}
      </div>
      
      ${demande.profils && demande.profils.length > 0 ? `
        <div class="section">
          <div class="section-title">Profils demandés</div>
          ${demande.profils.map((profil: any) => {
            let nomProfil = '';
            let detailsProfil = '';
            
            if (typeof profil === 'string') {
              nomProfil = profil;
            } else if (profil && typeof profil === 'object') {
              nomProfil = profil.nom || profil.name || profil.libelle || profil.label || 'Profil non spécifié';
              
              // Ajouter les détails si disponibles
              const details = [];
              if (profil.duree) details.push(`Durée: ${profil.duree}`);
              if (profil.salaire) details.push(`Salaire: ${profil.salaire}`);
              if (details.length > 0) {
                detailsProfil = ` (${details.join(', ')})`;
              }
            } else {
              nomProfil = String(profil);
            }
            
            return `<div class="info">• ${nomProfil}${detailsProfil}</div>`;
          }).join('')}
        </div>
      ` : ''}
      
      ${statistiques ? `
        <div class="section">
          <div class="section-title">Statistiques</div>
          ${demande.evenement_type === 'Job Day' ? `
            ${statistiques.nombre_candidats ? `<div class="info">Candidats: ${statistiques.nombre_candidats}</div>` : ''}
            ${statistiques.nombre_candidats_retenus ? `<div class="info">Candidats retenus: ${statistiques.nombre_candidats_retenus}</div>` : ''}
          ` : ''}
          ${demande.evenement_type === 'CV seulement' ? `
            ${statistiques.nombre_cv_envoyes ? `<div class="info">CV envoyés: ${statistiques.nombre_cv_envoyes}</div>` : ''}
          ` : ''}
        </div>
      ` : ''}
      
      ${commentaires && commentaires.length > 0 ? `
        <div class="section">
          <div class="section-title">Commentaires</div>
          ${commentaires.map((commentaire: any) => `
            <div class="comment">
              <strong>${commentaire.auteur}</strong> (${new Date(commentaire.created_at).toLocaleDateString('fr-FR')})
              <div>${commentaire.contenu}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="footer">
        Demande créée le: ${new Date(demande.created_at).toLocaleDateString('fr-FR')}<br>
        Statut: ${demande.statut || 'Non défini'}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
}; 