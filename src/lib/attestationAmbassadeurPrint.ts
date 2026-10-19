function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const STYLES = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #eef2f6; }
  body { font-family: Georgia, 'Times New Roman', Times, serif; color: #1d4f8a; overflow: auto; }
  p { margin: 0; }
  .bar {
    position: sticky; top: 0; z-index: 3;
    display: flex; gap: 10px; align-items: center;
    background: #0f3d6c; color: #fff; padding: 10px 14px; font-family: Arial, sans-serif;
  }
  .bar button {
    background: #f97316; color: #fff; border: none; border-radius: 8px;
    padding: 8px 16px; font-weight: 700; cursor: pointer;
  }
  .sheet {
    width: 297mm; height: 210mm; max-height: 210mm; overflow: hidden;
    margin: 0 auto 8mm; padding: 5mm; background: #fff;
    break-inside: avoid; page-break-inside: avoid;
    page-break-after: always; break-after: page;
  }
  .sheet:last-of-type { page-break-after: auto; break-after: auto; margin-bottom: 0; }
  .lace {
    height: 100%;
    padding: 4.2mm;
    background:
      repeating-radial-gradient(circle at 4mm 4mm, #7a9bbd 0 1.1mm, transparent 1.1mm 5.5mm),
      repeating-radial-gradient(circle at 4mm 4mm, transparent 0 2.4mm, #c5d4e4 2.4mm 2.8mm, transparent 2.8mm 5.5mm);
    background-color: #5d82a8;
  }
  .inner {
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: #fff;
    border: 1.4mm double #4d7399;
    padding: 4.5mm 12mm 3.5mm;
    display: flex;
    flex-direction: column;
  }
  .head {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    flex-shrink: 0;
  }
  .head img { width: auto; object-fit: contain; }
  .head .logo-cmc { height: 78px; }
  .head .logo-cop { height: 46px; }
  .content {
    flex: 0 0 auto;
    display: flex; flex-direction: column; justify-content: flex-start; gap: 4mm;
    padding-top: 2mm;
    text-align: center; font-size: 15px; line-height: 1.42; color: #1e3a5f;
  }
  h1 {
    text-align: center; margin: 0; font-size: 26px; letter-spacing: 0.8px;
    color: #1d4f8a; font-weight: 800; font-family: Arial, Helvetica, sans-serif;
  }
  h2 {
    text-align: center; margin: 1.5mm 0 0; font-size: 15px; letter-spacing: 0.6px;
    color: #1d4f8a; font-weight: 800; font-family: Arial, Helvetica, sans-serif;
  }
  .intro { max-width: 220mm; margin: 5mm auto 0; }
  .reco { max-width: 220mm; margin: 0 auto; }
  .name {
    font-size: 24px; font-weight: 800; color: #0f3d6c; margin: 0;
    font-family: Arial, Helvetica, sans-serif; letter-spacing: 0.3px;
    text-transform: uppercase;
  }
  .missions {
    display: grid; grid-template-columns: 1fr 1fr; gap: 1.2mm 10mm;
    list-style: none; padding: 0; margin: 0 auto; max-width: 210mm; text-align: left;
  }
  .missions li { padding: 0.5mm 0 0.5mm 8mm; position: relative; }
  .missions li:before {
    content: '•'; position: absolute; left: 1mm; top: 0.2mm;
    color: #1d4f8a; font-size: 16px; font-weight: 700;
  }
  .period { font-weight: 700; margin: 0 0 1.5mm; }
  .legal { font-style: italic; margin: 0; }
  .footer {
    flex: 1 1 auto;
    min-height: 34mm;
    display: flex; align-items: flex-end; justify-content: space-between;
    padding-top: 6mm;
    font-family: Arial, Helvetica, sans-serif;
  }
  .serial { font-size: 11px; color: #4a6580; letter-spacing: 0.4px; align-self: flex-end; }
  .sign, .cachet { width: 52mm; height: 32mm; }
  @media print {
    html, body {
      background: #fff; width: 297mm; height: auto;
      overflow: visible; margin: 0;
    }
    .bar { display: none !important; }
    .sheet {
      width: 297mm; height: 210mm; max-height: 210mm;
      overflow: hidden; margin: 0;
    }
    @page { size: A4 landscape; margin: 0; }
    .lace, .inner, h1, h2 { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`

function serialFromStagiaire(id?: string, prenom?: string, nom?: string): string {
  const raw = `${id || ''}${prenom || ''}${nom || 'AMB'}`
  let hash = 0
  for (let i = 0; i < raw.length; i += 1) hash = (hash * 31 + raw.charCodeAt(i)) >>> 0
  const n = String(hash % 1000000).padStart(6, '0')
  return `COP-AMB-2026-${n}`
}

type StagiaireAttestation = {
  id?: string
  prenom?: string
  nom?: string
}

function fullNameOf(stagiaire: StagiaireAttestation): string {
  const raw = `${stagiaire.prenom || ''} ${stagiaire.nom || ''}`.trim()
  return raw ? raw.toLocaleUpperCase('fr-FR') : '________________'
}

function sheetMarkup(stagiaire: StagiaireAttestation, origin: string): string {
  const fullName = fullNameOf(stagiaire)
  const serial = serialFromStagiaire(stagiaire.id, stagiaire.prenom, stagiaire.nom)
  return `<div class="sheet">
      <div class="lace">
        <div class="inner">
          <div class="head">
            <img class="logo-cmc" src="${origin}/logo%20CMC-01.png" alt="CMC Souss-Massa OFPPT" />
            <img class="logo-cop" src="${origin}/logo%20attestation.png" alt="Centre d'Orientation Professionnelle COP" />
          </div>
          <div class="content">
            <div class="titles">
              <h1>ATTESTATION DE PARTICIPATION</h1>
              <h2>AU PROGRAMME AMBASSADEURS</h2>
            </div>
            <p class="intro">
              Le Centre d'Orientation Professionnelle de la Cité des Métiers et des Compétences
              Souss-Massa (COP-CMC SM) a l'honneur de délivrer la présente attestation à :
            </p>
            <p class="name">${esc(fullName)}</p>
            <p class="reco">
              En reconnaissance de sa participation au programme « Stagiaires Ambassadeurs »
              et de son engagement actif ayant contribué à la réussite des missions suivantes :
            </p>
            <ul class="missions">
              <li>Animation de l'OPEN SPACE ;</li>
              <li>Participation aux forums d'orientation ;</li>
              <li>Promotion de la plateforme d'orientation My Way ;</li>
              <li>Organisation d'événements para-formation.</li>
            </ul>
            <div class="closing">
              <p class="period">Cette attestation couvre la période allant d'octobre 2025 à octobre 2026.</p>
              <p class="legal">Elle est délivrée à l'intéressé pour servir et valoir ce que de droit.</p>
            </div>
          </div>
          <div class="footer">
            <div class="serial">N° ${esc(serial)}</div>
            <div class="sign" aria-hidden="true"></div>
            <div class="cachet" aria-hidden="true"></div>
          </div>
        </div>
      </div>
    </div>`
}

function openAttestationsWindow(title: string, barLabel: string, sheetsHtml: string) {
  const html = `<!DOCTYPE html><html lang="fr"><head>
    <meta charset="utf-8" />
    <title>${esc(title)}</title>
    <style>${STYLES}</style>
  </head><body>
    <div class="bar">
      <button type="button" onclick="window.print()">Imprimer / PDF</button>
      <span>${esc(barLabel)}</span>
    </div>
    ${sheetsHtml}
  </body></html>`

  const win = window.open('', '_blank', 'width=1100,height=780')
  if (!win) {
    alert("Impossible d'ouvrir les attestations. Autorisez les pop-ups pour ce site.")
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
}

export function printAttestationAmbassadeur(stagiaire: StagiaireAttestation) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const fullName = fullNameOf(stagiaire)
  openAttestationsWindow(
    `Attestation — ${fullName}`,
    `Attestation de participation — ${fullName}`,
    sheetMarkup(stagiaire, origin)
  )
}

export function printAllAttestationsAmbassadeurs(stagiaires: StagiaireAttestation[]) {
  const list = [...stagiaires].sort((a, b) => {
    const an = `${a.nom || ''} ${a.prenom || ''}`.localeCompare(`${b.nom || ''} ${b.prenom || ''}`, 'fr')
    return an
  })
  if (list.length === 0) {
    alert("Aucun stagiaire ambassadeur à imprimer.")
    return
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const sheets = list.map((s) => sheetMarkup(s, origin)).join('')
  openAttestationsWindow(
    `Attestations ambassadeurs (${list.length})`,
    `${list.length} attestation${list.length > 1 ? 's' : ''} — Imprimer / enregistrer en PDF`,
    sheets
  )
}
