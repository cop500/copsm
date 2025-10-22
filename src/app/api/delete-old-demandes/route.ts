import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // IDs des demandes à supprimer (d'après les données de diagnostic)
    const idsToDelete = [
      '08dec3a9-968e-4e92-a292-0cd60dd77744', // AKO TECHNOLOGIE INDUSTRIEL
      '1c85245b-7ba8-4f58-99a9-6bc4ff2758b8', // TESTE1
      '4704b933-f27e-437d-98b8-03922cc6090b'  // fiecora
    ]

    // Supprimer les demandes CV
    const { data, error } = await supabase
      .from('demandes_cv')
      .delete()
      .in('id', idsToDelete)
      .select()

    if (error) {
      console.error('Erreur suppression demandes CV:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Demandes supprimées avec succès',
      deleted_count: data?.length || 0,
      deleted_ids: idsToDelete
    })

  } catch (error) {
    console.error('Erreur suppression demandes:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
