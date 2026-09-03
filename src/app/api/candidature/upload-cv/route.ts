import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('cv')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier CV requis' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 })
    }

    const fileName = file.name || 'cv.pdf'
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Format PDF uniquement' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const filePath = `candidatures/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('cv-stagiaires')
      .upload(filePath, buffer, { contentType: 'application/pdf', upsert: false })

    if (uploadError) {
      console.error('Erreur upload CV kiosk:', uploadError)
      return NextResponse.json({ error: 'Échec upload du CV' }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage.from('cv-stagiaires').getPublicUrl(filePath)

    return NextResponse.json({ success: true, cv_url: publicUrlData.publicUrl })
  } catch (error) {
    console.error('Erreur API upload-cv:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
