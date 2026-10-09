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
  body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #111; font-size: 11px; }
  .fs-toolbar {
    position: sticky; top: 0; z-index: 5;
    display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
    background: #0f3d6c; color: #fff; padding: 10px 12px;
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
  .fs-cover {
    position: relative;
    overflow: hidden;
    min-height: 190mm;
    padding: 14mm 16mm 22mm;
    background: #fff;
    page-break-after: always;
    break-after: page;
  }
  .fs-cover-top {
    display: flex; align-items: center; gap: 16px; margin-bottom: 18mm;
  }
  .fs-cover-top img { height: 58px; width: auto; object-fit: contain; }
  .fs-cover-brand { display: flex; align-items: center; gap: 14px; }
  .fs-myway {
    border: 2px solid #0f3d6c; border-radius: 8px; padding: 6px 10px;
    font-weight: 900; letter-spacing: 0.5px; color: #0f3d6c; font-size: 16px; line-height: 1.1;
  }
  .fs-myway span { color: #0aa3a8; }
  .fs-cover-title { color: #0f3d6c; font-size: 22px; font-weight: 800; line-height: 1.15; }
  .fs-cover-title em { color: #0aa3a8; font-style: normal; }
  .fs-cover-hero { display: flex; align-items: center; gap: 16px; margin: 8mm 0 8mm; }
  .fs-folder {
    width: 86px; height: 72px; background: #163a73; border-radius: 8px 8px 10px 10px;
    position: relative; flex-shrink: 0;
  }
  .fs-folder:before {
    content: ''; position: absolute; left: 10px; top: -10px; width: 28px; height: 14px;
    background: #163a73; border-radius: 4px 8px 0 0;
  }
  .fs-folder svg { position: absolute; inset: 18px 0 0; margin: auto; }
  .fs-cover-h1 { font-size: 42px; line-height: 0.95; font-weight: 900; color: #0aa3a8; margin: 0; letter-spacing: -0.5px; text-align: left; }
  .fs-cover-steps { color: #5b6b7c; font-size: 15px; margin: 4mm 0 8mm; letter-spacing: 0.2px; }
  .fs-cover-steps b { color: #0aa3a8; }
  .fs-resp {
    display: flex; align-items: center; gap: 14px;
    background: #e7f6f8; border-radius: 10px; padding: 12px 16px; max-width: 62%;
  }
  .fs-resp-ico {
    width: 44px; height: 44px; border-radius: 50%; border: 2px solid #0aa3a8;
    display: flex; align-items: center; justify-content: center; color: #0aa3a8; flex-shrink: 0;
  }
  .fs-resp label { display: block; font-size: 13px; color: #4b5b6b; margin-bottom: 4px; }
  .fs-resp .name {
    border-bottom: 1px solid #9aa8b5; min-height: 22px; font-size: 16px; font-weight: 700;
    color: #0f3d6c; padding-bottom: 2px;
  }
  .fs-cover-tag {
    margin-top: 14mm; font-family: Georgia, 'Times New Roman', serif;
    font-style: italic; font-size: 22px; color: #163a73; line-height: 1.15;
  }
  .fs-cover-tag u { text-decoration: none; border-bottom: 3px solid #f97316; }
  .fs-waves { position: absolute; left: 0; right: 0; bottom: 0; height: 78px; }
  .fs-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
  .fs-header img { height: 48px; width: auto; object-fit: contain; }
  .fs-org { text-align: center; flex: 1; font-size: 10px; line-height: 1.4; color: #1e3a5f; }
  .fs-body { padding: 10mm; }
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
    .fs-toolbar { display: none !important; }
    .fs-cover, .fs-waves, h2, th, .fs-myway, .fs-folder { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .fs-cover { min-height: 277mm; }
    .fs-body { padding: 8mm; }
    @page { size: A4 portrait; margin: 0; }
    @page :first { margin: 0; }
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

function buildCoverHtml(origin: string, conseiller: string): string {
  return `
    <section class="fs-cover">
      <div class="fs-cover-top">
        <img src="${origin}/logo%20CMC-01.png" alt="CMC Souss-Massa" />
        <div class="fs-cover-brand">
          <div class="fs-myway">MY<span>&gt;</span>WAY</div>
          <div class="fs-cover-title">Centre d’Orientation<br/>Professionnelle.<em>COP</em></div>
        </div>
      </div>
      <div class="fs-cover-hero">
        <div class="fs-folder" aria-hidden="true">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
            <circle cx="9" cy="8" r="2.2"/><circle cx="15" cy="8" r="2.2"/>
            <path d="M5.5 17c.4-2.2 2.3-3.6 4.5-3.6s4.1 1.4 4.5 3.6"/>
            <path d="M13.2 13.6c.7-.4 1.6-.6 2.5-.6 2.1 0 3.9 1.2 4.3 3.2"/>
          </svg>
        </div>
        <h1 class="fs-cover-h1">DOSSIER<br/>SOURCING</h1>
      </div>
      <p class="fs-cover-steps">Identifier <b>•</b> Mobiliser <b>•</b> Sélectionner <b>•</b> Accompagner</p>
      <div class="fs-resp">
        <div class="fs-resp-ico">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="8" r="3"/><path d="M5 19c.8-3.2 3.4-5 7-5s6.2 1.8 7 5"/>
          </svg>
        </div>
        <div style="flex:1">
          <label>Responsable du dossier / projet :</label>
          <div class="name">${cell(conseiller)}</div>
        </div>
      </div>
      <p class="fs-cover-tag">Ensemble pour<br/><u>les talents de demain</u></p>
      <svg class="fs-waves" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,80 C240,20 420,110 700,55 C920,12 1080,70 1200,30 L1200,120 L0,120 Z" fill="#163a73"/>
        <path d="M0,95 C280,50 520,115 780,70 C980,35 1100,85 1200,55 L1200,120 L0,120 Z" fill="#0aa3a8"/>
        <path d="M620,90 C820,40 980,95 1200,48 L1200,120 L620,120 Z" fill="#f97316"/>
      </svg>
    </section>
  `
}

export function openFicheSourcingValideePrint(
  fiche: FicheSourcing,
  typeFiche?: FicheSourcingType,
  options?: { allowDraft?: boolean }
) {
  if (fiche.statut !== 'validee' && !options?.allowDraft) {
    alert('La fiche doit être validée par l’administrateur avant impression pour le dossier.')
    return
  }
  const d = fiche.donnees
  const type = typeFiche || fiche.type_fiche
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const title = `Fiche sourcing — ${d.entreprise || ''}`
  const stamp =
    fiche.statut === 'validee'
      ? `Validée COP Space le ${esc(fmtDate(fiche.validee_le))}`
      : 'Document interne — non validé (admin)'
  const html = `<!DOCTYPE html><html lang="fr"><head>
    <meta charset="utf-8" />
    <title>${esc(title)}</title>
    <style>${PRINT_STYLES}</style>
  </head><body>
    <div class="fs-toolbar">
      <button type="button" onclick="window.print()">Imprimer / PDF</button>
      <span class="stamp">${stamp}</span>
    </div>
    ${buildCoverHtml(origin, d.conseiller)}
    <div class="fs-body">
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
      ${
        fiche.statut === 'validee'
          ? `Fiche validée dans COP Space le ${esc(fmtDate(fiche.validee_le))} — document à classer dans le dossier papier.`
          : 'Impression interne COP Space (admin) — fiche non encore validée, ne pas classer au dossier officiel.'
      }
    </div>
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
