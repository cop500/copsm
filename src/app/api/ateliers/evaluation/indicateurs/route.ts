import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { calculerIndicateurs, type NotesAtelier } from '@/lib/atelierEvaluation'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration serveur incomplète' },
        { status: 500 }
      )
    }

    const idsParam = request.nextUrl.searchParams.get('ids') || ''
    const ids = [...new Set(idsParam.split(',').map((id) => id.trim()).filter(Boolean))]

    if (ids.length === 0) {
      return NextResponse.json({ indicateurs: {} })
    }

    const { data: inscriptions, error: insErr } = await supabaseAdmin
      .from('inscriptions_ateliers')
      .select('atelier_id, present, statut')
      .in('atelier_id', ids)

    if (insErr) {
      console.error('indicateurs inscriptions', insErr)
      return NextResponse.json({ error: 'Lecture des inscriptions impossible' }, { status: 500 })
    }

    const withDetails = request.nextUrl.searchParams.get('details') === '1'

    const { data: evaluations, error: evErr } = await supabaseAdmin
      .from('evaluations_ateliers')
      .select(
        withDetails
          ? 'atelier_id, inscription_id, clarte, utilite, animation, organisation, recommandation, commentaire, created_at'
          : 'atelier_id, clarte, utilite, animation, organisation, recommandation'
      )
      .in('atelier_id', ids)

    if (evErr) {
      console.error('indicateurs evaluations', evErr)
      return NextResponse.json({ error: 'Lecture des notes impossible' }, { status: 500 })
    }

    const indicateurs: Record<string, ReturnType<typeof calculerIndicateurs>> = {}
    for (const atelierId of ids) {
      indicateurs[atelierId] = calculerIndicateurs({
        atelierId,
        inscriptions: (inscriptions || []).filter((i) => i.atelier_id === atelierId),
        evaluations: (evaluations || []).filter((e) => e.atelier_id === atelierId) as NotesAtelier[],
      })
    }

    if (!withDetails) {
      return NextResponse.json({ indicateurs })
    }

    const notesParInscription: Record<
      string,
      {
        inscription_id: string
        clarte: number
        utilite: number
        animation: number
        organisation: number
        recommandation: number
        commentaire?: string | null
        created_at?: string
      }
    > = {}
    for (const row of evaluations || []) {
      if (row.inscription_id) {
        notesParInscription[row.inscription_id] = row
      }
    }

    return NextResponse.json({ indicateurs, notesParInscription })
  } catch (e) {
    console.error('indicateurs GET', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
