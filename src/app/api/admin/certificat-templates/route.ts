import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: Récupérer tous les templates
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('certificat_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération templates:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      templates: data || []
    })
  } catch (error: any) {
    console.error('Erreur API templates:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST: Créer un nouveau template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nom, template_html, styles_css, active } = body

    if (!nom || !template_html) {
      return NextResponse.json(
        { error: 'Le nom et le template HTML sont requis' },
        { status: 400 }
      )
    }

    // Si on active ce template, désactiver les autres d'abord
    if (active === true) {
      const { error: deactivateError } = await supabase
        .from('certificat_templates')
        .update({ active: false })
        .eq('active', true)

      if (deactivateError) {
        console.error('Erreur désactivation templates:', deactivateError)
      }
    }

    // Créer le nouveau template
    const { data, error } = await supabase
      .from('certificat_templates')
      .insert([{
        nom,
        template_html,
        styles_css: styles_css || '',
        active: active === true
      }])
      .select()
      .single()

    if (error) {
      console.error('Erreur création template:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création du template', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Template créé avec succès',
      template: data
    })
  } catch (error: any) {
    console.error('Erreur API création template:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du template', details: error.message },
      { status: 500 }
    )
  }
}

