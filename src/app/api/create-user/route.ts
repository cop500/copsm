import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ 
        success: true, 
        userId: existingUser.id,
        message: 'Utilisateur existe déjà'
      })
    }

    // Créer l'utilisateur dans auth.users via l'API admin
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: 'temp_password_123!',
      email_confirm: true,
      user_metadata: {
        nom: email.split('@')[0].split('.')[0] || 'Utilisateur',
        prenom: email.split('@')[0].split('.')[1] || 'CV Connect'
      }
    })

    if (authError || !authUser.user) {
      return NextResponse.json({ 
        error: `Erreur création auth: ${authError?.message}` 
      }, { status: 500 })
    }

    const authUserId = authUser.user.id

    // Créer le profil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authUserId,
        email: email,
        nom: email.split('@')[0].split('.')[0] || 'Utilisateur',
        prenom: email.split('@')[0].split('.')[1] || 'CV Connect',
        role: 'conseillere_carriere',
        actif: true
      }])
      .select('id')
      .single()

    if (profileError || !profileData) {
      return NextResponse.json({ 
        error: `Erreur création profil: ${profileError?.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      userId: profileData.id,
      message: 'Utilisateur créé avec succès'
    })

  } catch (error: any) {
    console.error('Erreur création utilisateur:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
