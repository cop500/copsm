import { supabase } from '@/lib/supabase'
import { sendNewDemandeNotification } from '@/lib/email'

function normalizeProfils(profils: unknown): Record<string, unknown>[] {
  if (!profils) return []
  if (typeof profils === 'string') {
    try {
      const parsed = JSON.parse(profils)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return Array.isArray(profils) ? profils : []
}

export async function duplicateDemandeEntreprise(
  source: Record<string, unknown>,
  nombreParProfil: number[]
) {
  const profils = normalizeProfils(source.profils).map((profil, index) => {
    const next = Number(nombreParProfil[index])
    return {
      ...profil,
      nb_profils: Number.isFinite(next) && next > 0 ? Math.round(next) : Number(profil.nb_profils) || 1,
    }
  })

  const payload = {
    secteur: source.secteur || null,
    entreprise_nom: source.entreprise_nom,
    entreprise_adresse: source.entreprise_adresse || null,
    entreprise_ville: source.entreprise_ville || null,
    entreprise_email: source.entreprise_email || null,
    contact_nom: source.contact_nom || null,
    contact_email: source.contact_email || null,
    contact_tel: source.contact_tel || null,
    profils,
    evenement_type: source.evenement_type || null,
    evenement_date: source.evenement_date || null,
    fichier_url: source.fichier_url || null,
    type_demande: source.type_demande || 'cv',
    statut: 'en_attente',
  }

  const { data, error } = await supabase
    .from('demandes_entreprises')
    .insert([payload])
    .select()
    .single()

  if (error || !data) {
    throw new Error(error?.message || "Impossible de dupliquer la demande")
  }

  const typeLabel = data.type_demande === 'evenement' ? 'Événement' : 'CV'
  void Promise.race([
    sendNewDemandeNotification({
      id: data.id,
      nom_entreprise: String(data.entreprise_nom || source.entreprise_nom || ''),
      nom_contact: String(data.contact_nom || source.contact_nom || ''),
      email: String(data.contact_email || source.contact_email || ''),
      telephone: String(data.contact_tel || source.contact_tel || ''),
      type_demande: typeLabel,
      message: `Demande dupliquée${data.reference ? ` — nouvelle référence ${data.reference}` : ''}`,
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout envoi email')), 8000)),
  ]).catch((emailError) => {
    console.error('⚠️ Erreur envoi email (non bloquant):', emailError)
  })

  return data as { id: string; reference?: string; entreprise_nom?: string }
}
