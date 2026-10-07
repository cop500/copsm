import type { FicheDonnees, FicheSourcing, FicheSourcingType } from '@/lib/fichesSourcing'
import {
  ETAPES_CV,
  ETAPES_PREP,
  ETAPES_SUIVI,
  PIECES_CV_KEYS,
  PIECES_JOB_KEYS,
  STATUT_ACTION_KEYS,
} from '@/lib/fichesSourcing'

export { isJobDayDemande } from '@/lib/fichesSourcing'

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function cell(value: unknown): string {
  return esc(value || '')
}

function cb(label: string, on: boolean): string {
  return `<label class="chk"><input type="checkbox" ${on ? 'checked' : ''} disabled /> ${esc(label)}</label>`
}

function fmtDate(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const PRINT_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 10mm; color: #111; font-size: 11px; }
  .fs-toolbar {
    position: sticky; top: 0; z-index: 5;
    display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
    background: #0f3d6c; color: #fff; padding: 10px 12px; margin: -10mm -10mm 10px;
    font-size: 13px;
  }
  .fs-toolbar button {
    background: #f97316; color: #fff; border: none; border-radius: 8px;
    padding: 8px 16px; font-weight: 700; cursor: pointer;
  }
  .stamp {
    border: 2px solid #15803d; color: #15803d; font-weight: 700;
    padding: 4px 10px; border-radius: 6px; text-transform: uppercase; font-size: 11px;
  }
  .fs-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
  .fs-header img { height: 48px; width: auto; object-fit: contain; }
  .fs-org { text-align: center; flex: 1; font-size: 10px; line-height: 1.4; color: #1e3a5f; }
  h1 { text-align: center; font-size: 16px; margin: 8px 0 10px; color: #0f3d6c; }
  h2 { font-size: 12px; background: #0f3d6c; color: #fff; padding: 5px 8px; margin: 12px 0 0; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #1e3a5f; padding: 4px 5px; vertical-align: middle; }
  th { background: #e8eef5; font-size: 10px; text-align: left; }
  .checks { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; padding: 8px; border: 1px solid #1e3a5f; border-top: none; }
  .chk { display: flex; gap: 6px; align-items: center; }
  .totals { display: flex; gap: 24px; margin: 6px 0 0; font-weight: bold; }
  .obs { width: 100%; min-height: 64px; border: 1px solid #1e3a5f; border-top: none; padding: 8px; white-space: pre-wrap; }
  .footer { margin-top: 10px; font-size: 8px; color: #444; text-align: center; border-top: 1px solid #999; padding-top: 6px; line-height: 1.4; }
  @media print {
    body { padding: 8mm; }
    @page { size: A4 portrait; margin: 8mm; }
    .fs-toolbar { display: none !important; }
    h2, th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`

function profilsTable(d: FicheDonnees): string {
  const rows = (d.profils || []).map(
    (p, i) => `<tr>
      <td style="width:26px;text-align:center">${i + 1}</td>
      <td>${cell(p.poste)}</td>
      <td>${cell(p.pole)}</td>
      <td>${cell(p.filiere)}</td>
      <td>${cell(p.niveau)}</td>
      <td style="width:64px">${cell(p.nb_postes)}</td>
    </tr>`
  )
  return `
    <table>
      <tr>
        <th>N°</th><th>Poste recherché</th><th>Pôle</th><th>Filière</th><th>Niveau / contrat</th><th>Nb. postes</th>
      </tr>
      ${rows.join('')}
    </table>
    <p class="totals">
      <span>Nombre total de profils recherchés : ${cell(d.total_profils)}</span>
      <span>Nombre total de postes à pourvoir : ${cell(d.total_postes)}</span>
    </p>`
}

function etapesTable(
  keys: { key: string; label: string }[],
  map: Record<string, { date?: string; info?: string }> | undefined
): string {
  const rows = keys.map((k) => {
    const e = map?.[k.key] || {}
    return `<tr><td>${esc(k.label)}</td><td>${cell(e.date)}</td><td>${cell(e.info)}</td></tr>`
  })
  return `<table>
    <tr><th style="width:36%">Étape</th><th style="width:16%">Date</th><th>Informations / observations</th></tr>
    ${rows.join('')}
  </table>`
}

function buildCvHtml(d: FicheDonnees): string {
  return `
    <h1>FICHE DE SUIVI – ACTION DE SOURCING (CV)</h1>
    <h2>1. IDENTIFICATION DE L'ACTION</h2>
    <table>
      <tr><th>Référence de l'action</th><th>Date d'ouverture</th><th>Conseiller(ère) responsable</th></tr>
      <tr><td>${cell(d.reference)}</td><td>${cell(d.date_ouverture)}</td><td>${cell(d.conseiller)}</td></tr>
      <tr><th colspan="2">Entreprise / Partenaire</th><th>Date limite de candidature</th></tr>
      <tr><td colspan="2">${cell(d.entreprise)}</td><td>${cell(d.date_action)}</td></tr>
    </table>
    <h2>2. BESOINS EN RECRUTEMENT</h2>
    ${profilsTable(d)}
    <h2>3. DÉROULEMENT DE L'ACTION</h2>
    ${etapesTable(ETAPES_CV, d.etapes_cv)}
    <h2>4. BILAN DU SOURCING</h2>
    <table>
      <tr><th>Indicateur</th><th style="width:120px">Nombre</th></tr>
      <tr><td>CV reçus</td><td>${cell(d.bilan?.cv_recus)}</td></tr>
      <tr><td>CV présélectionnés</td><td>${cell(d.bilan?.cv_preselectionnes)}</td></tr>
      <tr><td>CV transmis à l'entreprise</td><td>${cell(d.bilan?.cv_transmis)}</td></tr>
      <tr><td>Candidats retenus par l'entreprise</td><td>${cell(d.bilan?.candidats_retenus)}</td></tr>
      <tr><td>Entretiens réalisés</td><td>${cell(d.bilan?.entretiens)}</td></tr>
      <tr><td>Recrutements réalisés</td><td>${cell(d.bilan?.recrutements)}</td></tr>
    </table>
    <h2>5. STATUT DE L'ACTION</h2>
    <div class="checks">
      ${STATUT_ACTION_KEYS.map((k) => cb(k.label, Boolean(d.statut_action?.[k.key]))).join('')}
    </div>
    <table>
      <tr><th>Date de dernière mise à jour</th><td>${cell(d.date_maj)}</td></tr>
      <tr><th>Prochaine action / relance prévue</th><td>${cell(d.prochaine_action)}</td></tr>
    </table>
    <h2>6. PIÈCES DU DOSSIER</h2>
    <div class="checks">
      ${PIECES_CV_KEYS.map((k) => cb(k.label, Boolean(d.pieces_cv?.[k.key]))).join('')}
      ${d.pieces_autre ? `<span>${cell(d.pieces_autre)}</span>` : ''}
    </div>
    <h2>7. OBSERVATIONS</h2>
    <div class="obs">${cell(d.observations)}</div>
    <table>
      <tr>
        <th>Conseiller(ère) chargé(e) de l'action</th>
        <td>Nom &amp; signature : ${cell(d.conseiller)}</td>
      </tr>
    </table>
  `
}

function buildJobDayHtml(d: FicheDonnees): string {
  const postes = (d.postes_job || []).map(
    (p) => `<tr>
      <td>${cell(p.poste)}</td>
      <td>${cell(p.recus)}</td>
      <td>${cell(p.retenus)}</td>
      <td>${cell(p.attente)}</td>
      <td>${cell(p.recrutes)}</td>
    </tr>`
  )
  return `
    <h1>FICHE DE SUIVI – JOB DAY</h1>
    <h2>1. IDENTIFICATION DE L'ACTION</h2>
    <table>
      <tr><th>Référence de l'action</th><th>Date d'ouverture</th><th>Responsable du dossier</th></tr>
      <tr><td>${cell(d.reference)}</td><td>${cell(d.date_ouverture)}</td><td>${cell(d.conseiller)}</td></tr>
      <tr><th colspan="2">Entreprise / Partenaire</th><th>Date du Job Day</th></tr>
      <tr><td colspan="2">${cell(d.entreprise)}</td><td>${cell(d.date_action)}</td></tr>
    </table>
    <h2>2. BESOINS EN RECRUTEMENT</h2>
    ${profilsTable(d)}
    <h2>3. PRÉPARATION DU JOB DAY</h2>
    ${etapesTable(ETAPES_PREP, d.etapes_prep)}
    <h2>4. RÉALISATION DU JOB DAY</h2>
    <table>
      <tr><th>Indicateur</th><th style="width:120px">Nombre</th></tr>
      <tr><td>Candidats contactés</td><td>${cell(d.realisation?.contactes)}</td></tr>
      <tr><td>Candidats convoqués</td><td>${cell(d.realisation?.convoques)}</td></tr>
      <tr><td>Candidats confirmés</td><td>${cell(d.realisation?.confirmes)}</td></tr>
      <tr><td>Candidats présents</td><td>${cell(d.realisation?.presents)}</td></tr>
      <tr><td>Candidats absents</td><td>${cell(d.realisation?.absents)}</td></tr>
      <tr><td>Taux de présence</td><td>${cell(d.realisation?.taux_presence)} %</td></tr>
    </table>
    <h2>5. RÉSULTATS DE L'ACTION</h2>
    <table>
      <tr><th>Poste</th><th>Candidats reçus</th><th>Candidats retenus</th><th>En attente</th><th>Recrutés</th></tr>
      ${postes.join('')}
    </table>
    <p class="totals">
      <span>Total candidats retenus : ${cell(d.total_retenus)}</span>
      <span>Total recrutements confirmés : ${cell(d.total_recrutements)}</span>
    </p>
    <h2>6. SUIVI POST JOB DAY</h2>
    ${etapesTable(ETAPES_SUIVI, d.etapes_suivi)}
    <h2>7. PIÈCES CONSTITUTIVES DU DOSSIER</h2>
    <div class="checks">
      ${PIECES_JOB_KEYS.map((k) => cb(k.label, Boolean(d.pieces_job?.[k.key]))).join('')}
    </div>
    <table>
      <tr><th colspan="2">RESPONSABLE DU DOSSIER / PROJET</th></tr>
      <tr><td style="width:30%">Nom</td><td>${cell(d.conseiller)}</td></tr>
      <tr><td>Fonction</td><td>${cell(d.fonction_responsable)}</td></tr>
      <tr><td>Signature</td><td>${cell(d.signature)}</td></tr>
      <tr><td>Date</td><td>${cell(d.date_signature)}</td></tr>
    </table>
  `
}

export function openFicheSourcingValideePrint(
  fiche: FicheSourcing,
  typeFiche?: FicheSourcingType
) {
  if (fiche.statut !== 'validee') {
    alert('La fiche doit être validée par l’administrateur avant impression pour le dossier.')
    return
  }
  const d = fiche.donnees
  const type = typeFiche || fiche.type_fiche
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const title = `Fiche sourcing — ${d.entreprise || ''}`
  const stamp = `Validée COP Space le ${esc(fmtDate(fiche.validee_le))}`
  const html = `<!DOCTYPE html><html lang="fr"><head>
    <meta charset="utf-8" />
    <title>${esc(title)}</title>
    <style>${PRINT_STYLES}</style>
  </head><body>
    <div class="fs-toolbar">
      <button type="button" onclick="window.print()">Imprimer / PDF</button>
      <span class="stamp">${stamp}</span>
    </div>
    <div class="fs-header">
      <img src="${origin}/logo%20CMC-01.png" alt="CMC" />
      <div class="fs-org">
        <strong>OFPPT — CMC Souss-Massa</strong><br/>
        Centre d'Orientation Professionnelle (COP)<br/>
        Fiche imprimée via COP Space — document à usage administratif
      </div>
      <img src="${origin}/LOGO%20CMC%20COP-01.png" alt="COP" />
    </div>
    ${type === 'job_day' ? buildJobDayHtml(d) : buildCvHtml(d)}
    <div class="footer">
      Fiche validée dans COP Space le ${esc(fmtDate(fiche.validee_le))}
      — document à classer dans le dossier papier.
    </div>
  </body></html>`
  const win = window.open('', '_blank', 'width=980,height=760')
  if (!win) {
    alert("Impossible d'ouvrir la fenêtre d'impression. Autorisez les pop-ups pour ce site.")
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
}
