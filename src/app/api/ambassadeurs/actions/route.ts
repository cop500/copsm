import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { joindreActionsCochees, TYPES_ACTION_AMBASSADEUR } from '@/lib/ambassadeursActions'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const type = body?.type === 'collective' ? 'collective' : body?.type === 'individuelle' ? 'individuelle' : ''
    const stagiaireId = typeof body?.stagiaire_id === 'string' ? body.stagiaire_id.trim() : ''
    const coequipiersIds = Array.isArray(body?.coequipiers_ids)
      ? body.coequipiers_ids.filter((id: unknown) => typeof id === 'string' && id.trim())
      : []
    const actionIds = Array.isArray(body?.actions)
      ? body.actions.filter((id: unknown) =>
          TYPES_ACTION_AMBASSADEUR.some((a) => a.id === id)
        )
      : []
    const detailsBruts =
      body?.details && typeof body.details === 'object' && !Array.isArray(body.details)
        ? (body.details as Record<string, unknown>)
        : {}
    const details: Record<string, string> = {}
    for (const id of actionIds) {
      const raw = detailsBruts[id]
      details[id] = typeof raw === 'string' ? raw.trim() : ''
    }
    const sansDetail = actionIds.find((id) => !details[id])
    if (sansDetail) {
      const meta = TYPES_ACTION_AMBASSADEUR.find((a) => a.id === sansDetail)
      return NextResponse.json(
        { error: `Précisez : ${meta?.detailLabel || 'l’intitulé de l’action'}.` },
        { status: 400 }
      )
    }
    const dateAction = typeof body?.date_action === 'string' ? body.date_action.trim() : ''
    const lieu =
      typeof body?.lieu_realisation === 'string' && body.lieu_realisation.trim()
        ? body.lieu_realisation.trim()
        : 'COP CMC Souss-Massa'

    if (!type) {
      return NextResponse.json({ error: 'Indiquez si l’action est individuelle ou collective.' }, { status: 400 })
    }
    if (!stagiaireId) {
      return NextResponse.json({ error: 'Choisissez votre nom dans la liste.' }, { status: 400 })
    }
    if (actionIds.length === 0) {
      return NextResponse.json({ error: 'Cochez au moins une action.' }, { status: 400 })
    }
    if (!dateAction) {
      return NextResponse.json({ error: 'Indiquez la date.' }, { status: 400 })
    }
    if (type === 'collective' && coequipiersIds.length === 0) {
      return NextResponse.json(
        { error: 'Pour une action collective, cochez au moins un autre ambassadeur du groupe.' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const ids = Array.from(new Set([stagiaireId, ...coequipiersIds]))
    const { data: stagiaires, error: stErr } = await supabase
      .from('stagiaires')
      .select('id, prenom, nom')
      .in('id', ids)
    if (stErr) throw stErr
    if (!stagiaires || stagiaires.length === 0) {
      return NextResponse.json({ error: 'Stagiaire introuvable dans la liste ambassadeurs.' }, { status: 404 })
    }

    const nomDe = (row: { prenom?: string | null; nom?: string | null }) =>
      `${String(row.prenom || '').trim()} ${String(row.nom || '').trim()}`.trim()

    const nomsGroupe = stagiaires.map(nomDe).filter(Boolean).join(', ')
    const intitule = joindreActionsCochees(actionIds, details)

    const lignes = stagiaires.map((row) => ({
      nom_prenom_stagiaire: nomDe(row),
      equipe_participante: type === 'collective' ? nomsGroupe : null,
      volet_action: type,
      responsable_action: intitule,
      lieu_realisation: lieu,
      date_action: dateAction,
      nombre_participants: type === 'collective' ? stagiaires.length : 1,
    }))

    const { error } = await supabase.from('actions_ambassadeurs').insert(lignes)
    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Action enregistrée.',
    })
  } catch (e) {
    console.error('enregistrement action ambassadeur', e)
    return NextResponse.json({ error: 'Enregistrement impossible. Réessayez.' }, { status: 500 })
  }
}
