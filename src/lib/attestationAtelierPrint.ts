import { esc, openAttestationsWindow } from '@/lib/attestationAmbassadeurPrint'

export type AtelierAttestation = {
  inscriptionId?: string
  stagiaireNom: string
  titreAtelier: string
  dateDebut?: string | null
  dateFin?: string | null
  animateurNom?: string | null
  animateurRole?: string | null
}

const TZ_MAROC = 'Africa/Casablanca'

function formatDateLong(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', {
    timeZone: TZ_MAROC,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatHeure(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: TZ_MAROC,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const h = parts.find((p) => p.type === 'hour')?.value || '00'
  const m = parts.find((p) => p.type === 'minute')?.value || '00'
  return `${h}h${m}`
}

const PRENOMS_FEMININS = new Set([
  'sihame', 'sara', 'fatima', 'kenza', 'hasnae', 'hasna', 'nadia', 'souad',
  'aicha', 'khadija', 'imane', 'iman', 'salma', 'nora', 'norah', 'maria',
  'meriem', 'myriam', 'houda', 'wafa', 'wiam', 'yasmina', 'zineb', 'asmae', 'asmaa',
])

function normalizeNomPart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function partiesNom(nom: string): string[] {
  return nom
    .trim()
    .split(/[\s-]+/)
    .filter((p) => p && !['el', 'al', 'ben', 'ibn', 'de', 'du', 'la', 'le'].includes(normalizeNomPart(p)))
}

export function initialesSignature(nom: string): string {
  const parts = partiesNom(nom)
  if (parts.length === 0) return ''
  return parts.map((p) => `${p[0].toUpperCase()}.`).join('')
}

export function estAnimatrice(nom: string, role?: string | null): boolean {
  const r = (role || '').toLowerCase()
  if (r.includes('conseillere') || r.includes('conseillère')) return true
  const prenom = partiesNom(nom)[0]
  return Boolean(prenom && PRENOMS_FEMININS.has(normalizeNomPart(prenom)))
}

function libelleRole(role: string, feminine: boolean): string {
  const r = (role || '').trim()
  if (!r) return ''
  if (r === 'conseiller_cop' || r.toLowerCase().includes('orientation')) {
    return feminine ? "Conseillère d'orientation" : "Conseiller d'orientation"
  }
  if (r === 'conseillere_carriere' || r.toLowerCase().includes('carriere') || r.toLowerCase().includes('carrière')) {
    return 'Conseillère Carrière'
  }
  if (r === 'manager_cop') return 'Manager COP'
  if (r === 'business_developer') return 'Administrateur'
  if (r === 'directeur') return feminine ? 'Directrice' : 'Directeur'
  if (r.includes('_')) return ''
  return r
}

function serialFromInscription(id?: string, nom?: string): string {
  const raw = `${id || ''}${nom || 'ATL'}`
  let hash = 0
  for (let i = 0; i < raw.length; i += 1) hash = (hash * 31 + raw.charCodeAt(i)) >>> 0
  const n = String(hash % 1000000).padStart(6, '0')
  return `COP-ATL-2026-${n}`
}

function sheetMarkup(data: AtelierAttestation, origin: string): string {
  const fullName = (data.stagiaireNom || '').trim().toLocaleUpperCase('fr-FR') || '________________'
  const serial = serialFromInscription(data.inscriptionId, data.stagiaireNom)
  const dateLabel = formatDateLong(data.dateDebut)
  const hDebut = formatHeure(data.dateDebut)
  const hFin = formatHeure(data.dateFin)
  const horaire =
    hDebut && hFin && hDebut !== hFin ? ` de ${hDebut} à ${hFin}` : hDebut ? ` à ${hDebut}` : ''
  const animateur = (data.animateurNom || '').trim()
  const feminine = estAnimatrice(animateur, data.animateurRole)
  const titrePoste = feminine ? "L'animatrice" : "L'animateur"
  const animePar = feminine ? 'Animée par' : 'Animé par'
  const roleAnimateur = libelleRole(data.animateurRole || '', feminine)
  const signature = initialesSignature(animateur)
  const periodLine = dateLabel ? `Organisé le ${dateLabel}${horaire}.` : ''

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
              <h2>À UN ATELIER DU COP</h2>
            </div>
            <p class="intro">
              Le Centre d'Orientation Professionnelle de la Cité des Métiers et des Compétences
              Souss-Massa (COP-CMC SM) a l'honneur de délivrer la présente attestation à :
            </p>
            <p class="name">${esc(fullName)}</p>
            <p class="reco">
              En reconnaissance de sa participation à l'atelier :
            </p>
            <p class="name" style="font-size:20px;text-transform:none;">« ${esc(data.titreAtelier || '________________')} »</p>
            ${periodLine ? `<p class="period">${esc(periodLine)}</p>` : ''}
            <p class="period">${esc(animePar)} ${esc(animateur || '________________')}</p>
            <div class="closing">
              <p class="legal">Elle est délivrée à l'intéressé pour servir et valoir ce que de droit.</p>
            </div>
          </div>
          <div class="footer">
            <div class="serial">N° ${esc(serial)}</div>
            <div class="sign" style="text-align:center;align-self:flex-end;">
              ${
                animateur
                  ? `<div style="font-size:12px;color:#4a6580;letter-spacing:0.4px;">${esc(titrePoste)}</div>
              <div style="font-size:14px;font-weight:800;color:#0f3d6c;margin-top:4px;text-transform:uppercase;">${esc(animateur)}</div>
              ${signature ? `<div class="sig-script">${esc(signature)}</div>` : ''}
              ${roleAnimateur ? `<div style="font-size:11px;color:#4a6580;">${esc(roleAnimateur)}</div>` : ''}`
                  : ''
              }
            </div>
            <div class="cachet">
              <img src="${origin}/cachet%20COP.png" alt="Cachet COP" />
            </div>
          </div>
        </div>
      </div>
    </div>`
}

export function printAttestationAtelier(data: AtelierAttestation) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const fullName = (data.stagiaireNom || '').trim().toLocaleUpperCase('fr-FR') || 'Stagiaire'
  openAttestationsWindow(
    `Attestation atelier — ${fullName}`,
    `Attestation de participation à l'atelier — ${fullName}`,
    sheetMarkup(data, origin)
  )
}

export function printAllAttestationsAtelier(items: AtelierAttestation[]) {
  const list = [...items].sort((a, b) =>
    (a.stagiaireNom || '').localeCompare(b.stagiaireNom || '', 'fr', { sensitivity: 'base' })
  )
  if (list.length === 0) {
    alert('Aucun présent à imprimer. Validez d’abord les présences.')
    return
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const sheets = list.map((item) => sheetMarkup(item, origin)).join('')
  openAttestationsWindow(
    `Attestations atelier (${list.length})`,
    `${list.length} attestation${list.length > 1 ? 's' : ''} — Imprimer / enregistrer en PDF`,
    sheets
  )
}
