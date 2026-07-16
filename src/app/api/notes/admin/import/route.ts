import { NextResponse } from 'next/server'
import { verifyAdminFromRequest } from '@/lib/verifyAdminRequest'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { importCandidatsRows } from '@/lib/notesConcoursImportServer'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const auth = await verifyAdminFromRequest(request)
  if (auth.error) return auth.error
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
  }

  let body: { action?: string; rows?: Record<string, string | number | null>[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 })
  }

  const action = body.action as string

  if (action === 'import_rows') {
    const rows = body.rows
    if (!Array.isArray(rows) || !rows.length) {
      return NextResponse.json({ error: 'Aucune ligne à importer.' }, { status: 400 })
    }
    try {
      const { inserted, total, errors } = await importCandidatsRows(rows, true)
      if (!inserted && errors.length) {
        return NextResponse.json({ error: errors.join(' ') }, { status: 500 })
      }
      return NextResponse.json({
        success: true,
        inserted,
        total,
        errors: errors.length ? errors : undefined,
        message: `Import terminé : ${inserted} candidat(s) importé(s).`,
      })
    } catch (e: unknown) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Erreur import' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    {
      error:
        'Import via fichier : utilisez l\'interface admin (onglet Import). Cette route est obsolète.',
    },
    { status: 410 }
  )
}
