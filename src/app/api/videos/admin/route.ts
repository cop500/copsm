import { NextResponse } from 'next/server'
import { verifyVideoNotesAdminFromRequest } from '@/lib/verifyAdminRequest'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { hashFormateurPassword } from '@/lib/formateurAuth'
import { VIDEO_FILIERES } from '@/lib/videoPreselectionConstants'
import { deleteVideoFile } from '@/lib/videoStorage'
import {
  EVALUATION_ALL_CRITERIA,
  type GrilleEvaluationData,
} from '@/lib/videoEvaluationGrid'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = await verifyVideoNotesAdminFromRequest(request)
  if (auth.error) return auth.error
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
  }

  const url = new URL(request.url)
  const exportExcel = url.searchParams.get('export') === 'excel'

  const { data: videos, error: vErr } = await supabaseAdmin
    .from('videos_preselection')
    .select(
      `id, nom, prenom, cine, filiere, statut, note, commentaire, grille_notes, evalue_le, created_at,
       formateur_id, formateurs_video ( id, nom, login )`
    )
    .order('created_at', { ascending: false })

  if (vErr) {
    return NextResponse.json({ error: vErr.message }, { status: 500 })
  }

  const { data: formateurs, error: fErr } = await supabaseAdmin
    .from('formateurs_video')
    .select('id, nom, login, filiere, actif, created_at')
    .order('nom')

  if (fErr) {
    return NextResponse.json({ error: fErr.message }, { status: 500 })
  }

  if (exportExcel) {
    const rows = (videos ?? []).map((v) => {
      const f = v.formateurs_video as { nom?: string } | null
      const grille = v.grille_notes as GrilleEvaluationData | null
      const base: Record<string, string | number> = {
        Nom: v.nom,
        Prénom: v.prenom,
        CINE: v.cine,
        Filière: v.filiere,
        Statut: v.statut,
        'Note contenu /20': grille?.note_contenu ?? '',
        'Note forme /10': grille?.note_forme ?? '',
        'Note totale /30': v.note ?? '',
        Commentaire: v.commentaire ?? '',
        Formateur: f?.nom ?? '',
        'Évalué le': v.evalue_le ?? '',
        'Déposé le': v.created_at,
      }
      for (const c of EVALUATION_ALL_CRITERIA) {
        base[`${c.label} (/ ${c.maxPoints})`] = grille?.scores?.[c.id] ?? ''
        const obs = grille?.observations?.[c.id]
        if (obs) base[`Obs. ${c.label}`] = obs
      }
      return base
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Vidéos')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="videos_preselection_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  }

  return NextResponse.json({ videos: videos ?? [], formateurs: formateurs ?? [] })
}

export async function POST(request: Request) {
  const auth = await verifyVideoNotesAdminFromRequest(request)
  if (auth.error) return auth.error
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
  }

  const body = await request.json()
  const action = body.action as string

  if (action === 'create_formateur') {
    const { nom, login, password, filiere } = body
    if (!nom?.trim() || !login?.trim() || !password || password.length < 6) {
      return NextResponse.json({ error: 'Nom, login et mot de passe (6+ car.) requis.' }, { status: 400 })
    }
    if (!VIDEO_FILIERES.some((f) => f.id === filiere)) {
      return NextResponse.json({ error: 'Filière invalide.' }, { status: 400 })
    }
    const password_hash = await hashFormateurPassword(password)
    const { data, error } = await supabaseAdmin
      .from('formateurs_video')
      .insert({
        nom: nom.trim(),
        login: login.trim().toLowerCase(),
        password_hash,
        filiere,
        actif: true,
      })
      .select('id, nom, login, filiere, actif, created_at')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ formateur: data })
  }

  if (action === 'toggle_formateur') {
    const { id, actif } = body
    const { error } = await supabaseAdmin
      .from('formateurs_video')
      .update({ actif: !!actif })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'reset_formateur_password') {
    const { id, password } = body
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Mot de passe min. 6 caractères.' }, { status: 400 })
    }
    const password_hash = await hashFormateurPassword(password)
    const { error } = await supabaseAdmin
      .from('formateurs_video')
      .update({ password_hash })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, message: 'Mot de passe mis à jour.' })
  }

  if (action === 'delete_formateur') {
    const { id } = body as { id?: string }
    if (!id) {
      return NextResponse.json({ error: 'Formateur requis.' }, { status: 400 })
    }

    const { data: assigned } = await supabaseAdmin
      .from('videos_preselection')
      .select('id')
      .eq('formateur_id', id)
      .eq('statut', 'affectee')

    if ((assigned ?? []).length > 0) {
      return NextResponse.json(
        {
          error:
            'Ce formateur a encore des vidéos en cours d\'évaluation. Réaffectez-les ou attendez la fin des évaluations avant suppression.',
        },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin.from('formateurs_video').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, message: 'Formateur supprimé.' })
  }

  if (action === 'assign_videos') {
    const { videoIds, formateurId } = body as { videoIds: string[]; formateurId: string }
    if (!Array.isArray(videoIds) || !videoIds.length || !formateurId) {
      return NextResponse.json({ error: 'Sélection et formateur requis.' }, { status: 400 })
    }

    const { data: formateur } = await supabaseAdmin
      .from('formateurs_video')
      .select('id, filiere, actif')
      .eq('id', formateurId)
      .single()

    if (!formateur?.actif) {
      return NextResponse.json({ error: 'Formateur introuvable ou inactif.' }, { status: 400 })
    }

    const { data: toAssign } = await supabaseAdmin
      .from('videos_preselection')
      .select('id, filiere, statut')
      .in('id', videoIds)
      .eq('statut', 'en_attente_affectation')

    const invalid = (toAssign ?? []).filter((v) => v.filiere !== formateur.filiere)
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: 'Certaines vidéos ne correspondent pas à la filière du formateur.' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('videos_preselection')
      .update({
        formateur_id: formateurId,
        statut: 'affectee',
        updated_at: new Date().toISOString(),
      })
      .in('id', videoIds)
      .eq('statut', 'en_attente_affectation')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, assigned: videoIds.length })
  }

  if (action === 'purge_evaluated') {
    const { data: evaluated } = await supabaseAdmin
      .from('videos_preselection')
      .select('id, storage_bucket, storage_path')
      .eq('statut', 'evaluee')

    for (const v of evaluated ?? []) {
      await deleteVideoFile(v.storage_bucket, v.storage_path)
    }

    return NextResponse.json({
      success: true,
      purged: evaluated?.length ?? 0,
      message: 'Fichiers vidéo des entrées déjà évaluées supprimés du stockage.',
    })
  }

  return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 })
}
