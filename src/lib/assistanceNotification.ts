import type { SupabaseClient } from '@supabase/supabase-js'
import { sendAssistanceAssignmentNotification } from './email'

export async function notifyConseillerForAssistanceRequest(
  supabase: SupabaseClient,
  input: {
    id: string
    nom: string
    prenom: string
    telephone: string
    type_assistance: string
    conseiller_id: string
    pole_id?: string
    filiere_id?: string
    statut?: string
  }
) {
  if (!input.conseiller_id?.trim()) {
    return { success: false, reason: 'no_conseiller' as const }
  }

  const [{ data: profile }, poleRes, filiereRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('nom, prenom, email, role')
      .eq('id', input.conseiller_id)
      .maybeSingle(),
    input.pole_id
      ? supabase.from('poles').select('nom, code').eq('id', input.pole_id).maybeSingle()
      : Promise.resolve({ data: null }),
    input.filiere_id
      ? supabase.from('filieres').select('nom, code').eq('id', input.filiere_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return sendAssistanceAssignmentNotification({
    id: input.id,
    nom: input.nom,
    prenom: input.prenom,
    telephone: input.telephone,
    type_assistance: input.type_assistance,
    statut: input.statut || 'en_attente',
    conseiller_id: input.conseiller_id,
    profiles: profile || undefined,
    poles: poleRes.data || undefined,
    filieres: filiereRes.data || undefined,
  })
}
