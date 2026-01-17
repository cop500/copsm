import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST: Activer un template (désactive automatiquement les autres)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const templateId = resolvedParams.id

    // Vérifier que le template existe
    const { data: template, error: templateError } = await supabase
      .from('certificat_templates')
      .select('id, nom')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template non trouvé' },
        { status: 404 }
      )
    }

    // Désactiver tous les autres templates
    const { error: deactivateError } = await supabase
      .from('certificat_templates')
      .update({ active: false })
      .neq('id', templateId)

    if (deactivateError) {
      console.error('Erreur désactivation autres templates:', deactivateError)
      return NextResponse.json(
        { error: 'Erreur lors de la désactivation des autres templates', details: deactivateError.message },
        { status: 500 }
      )
    }

    // Activer le template sélectionné
    const { data, error } = await supabase
      .from('certificat_templates')
      .update({ active: true })
      .eq('id', templateId)
      .select()
      .single()

    if (error) {
      console.error('Erreur activation template:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'activation du template', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Template "${template.nom}" activé avec succès`,
      template: data
    })
  } catch (error: any) {
    console.error('Erreur API activation template:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'activation du template', details: error.message },
      { status: 500 }
    )
  }
}

