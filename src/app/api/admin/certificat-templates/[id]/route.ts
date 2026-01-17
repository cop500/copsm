import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: Récupérer un template par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const templateId = resolvedParams.id

    const { data, error } = await supabase
      .from('certificat_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Template non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      template: data
    })
  } catch (error: any) {
    console.error('Erreur API template:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT: Mettre à jour un template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const templateId = resolvedParams.id

    const body = await request.json()
    const { nom, template_html, styles_css, active } = body

    // Si on active ce template, désactiver les autres d'abord
    if (active === true) {
      const { error: deactivateError } = await supabase
        .from('certificat_templates')
        .update({ active: false })
        .eq('active', true)
        .neq('id', templateId) // Ne pas désactiver le template qu'on est en train de modifier

      if (deactivateError) {
        console.error('Erreur désactivation templates:', deactivateError)
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    if (nom !== undefined) updateData.nom = nom
    if (template_html !== undefined) updateData.template_html = template_html
    if (styles_css !== undefined) updateData.styles_css = styles_css
    if (active !== undefined) updateData.active = active === true

    // Mettre à jour le template
    const { data, error } = await supabase
      .from('certificat_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single()

    if (error) {
      console.error('Erreur mise à jour template:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du template', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Template mis à jour avec succès',
      template: data
    })
  } catch (error: any) {
    console.error('Erreur API mise à jour template:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour du template', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Supprimer un template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const templateId = resolvedParams.id

    // Vérifier si le template est actif
    const { data: template } = await supabase
      .from('certificat_templates')
      .select('active')
      .eq('id', templateId)
      .single()

    if (template?.active) {
      return NextResponse.json(
        { error: 'Impossible de supprimer le template actif. Veuillez d\'abord activer un autre template.' },
        { status: 400 }
      )
    }

    // Supprimer le template
    const { error } = await supabase
      .from('certificat_templates')
      .delete()
      .eq('id', templateId)

    if (error) {
      console.error('Erreur suppression template:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du template', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Template supprimé avec succès'
    })
  } catch (error: any) {
    console.error('Erreur API suppression template:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression du template', details: error.message },
      { status: 500 }
    )
  }
}

