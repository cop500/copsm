import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Utiliser la clé de service pour contourner RLS, fallback sur clé anon
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données requises
    const requiredFields = ['nom', 'prenom', 'telephone', 'pole_id', 'filiere_id', 'type_assistance', 'conseiller_id']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Champs manquants: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validation du type d'assistance
    const validTypes = ['orientation', 'strategie', 'entretiens', 'developpement']
    if (!validTypes.includes(body.type_assistance)) {
      return NextResponse.json(
        { error: 'Type d\'assistance invalide' },
        { status: 400 }
      )
    }

    // Validation du statut
    const validStatuts = ['en_attente', 'en_cours', 'terminee']
    if (body.statut && !validStatuts.includes(body.statut)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      )
    }

    // Préparer les données pour l'insertion
    const demandeData = {
      nom: body.nom.trim(),
      prenom: body.prenom.trim(),
      telephone: body.telephone.trim(),
      pole_id: body.pole_id,
      filiere_id: body.filiere_id,
      type_assistance: body.type_assistance,
      conseiller_id: body.conseiller_id,
      statut: body.statut || 'en_attente'
    }

    console.log('Tentative d\'insertion avec données:', demandeData)

    // Essayer d'abord l'insertion directe avec la clé de service
    console.log('Tentative d\'insertion directe avec clé de service...')
    const { data: insertData, error: insertError } = await supabase
      .from('demandes_assistance_stagiaires')
      .insert([demandeData])
      .select()
      .single()

    if (insertError) {
      console.error('Erreur insertion directe:', insertError)
      
      // Si l'insertion directe échoue, essayer avec la fonction RPC
      console.log('Tentative avec fonction RPC...')
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('insert_assistance_request', {
          p_nom: demandeData.nom,
          p_prenom: demandeData.prenom,
          p_telephone: demandeData.telephone,
          p_pole_id: demandeData.pole_id,
          p_filiere_id: demandeData.filiere_id,
          p_type_assistance: demandeData.type_assistance,
          p_conseiller_id: demandeData.conseiller_id,
          p_statut: demandeData.statut
        })

      if (rpcError) {
        console.error('Erreur fonction RPC:', rpcError)
        return NextResponse.json(
          { error: 'Erreur lors de l\'enregistrement de votre demande. Veuillez réessayer.' },
          { status: 500 }
        )
      }

      const rpcInsertData = rpcData[0]

      // Envoyer une notification par email si un conseiller a été assigné
      if (demandeData.conseiller_id && rpcInsertData?.id) {
        try {
          console.log('📧 Tentative d\'envoi de notification email pour nouvelle demande (RPC):', rpcInsertData.id)
          console.log('📧 Conseiller assigné:', demandeData.conseiller_id)
          
          // Récupérer les données complètes avec les relations
          const { data: demandeComplete, error: fetchError } = await supabase
            .from('demandes_assistance_stagiaires')
            .select(`
              *,
              poles(nom, code, couleur),
              filieres(nom, code, color),
              profiles!conseiller_id(nom, prenom, email, role)
            `)
            .eq('id', rpcInsertData.id)
            .single()

          if (!fetchError && demandeComplete) {
            const { sendAssistanceAssignmentNotification } = await import('@/lib/email')
            const result = await sendAssistanceAssignmentNotification({
              id: demandeComplete.id,
              nom: demandeComplete.nom || '',
              prenom: demandeComplete.prenom || '',
              telephone: demandeComplete.telephone || '',
              type_assistance: demandeComplete.type_assistance || '',
              statut: demandeComplete.statut || 'en_attente',
              conseiller_id: demandeComplete.conseiller_id || '',
              profiles: demandeComplete.profiles,
              poles: demandeComplete.poles,
              filieres: demandeComplete.filieres
            })
            
            if (result.success) {
              console.log('✅ Email de notification envoyé avec succès pour nouvelle demande (RPC)')
            } else {
              console.warn('⚠️ Email non envoyé pour nouvelle demande (RPC), raison:', result.reason)
            }
          } else {
            console.warn('⚠️ Impossible de récupérer les données complètes pour l\'envoi d\'email (RPC):', fetchError)
          }
        } catch (emailError: any) {
          console.error('❌ Erreur envoi email notification pour nouvelle demande RPC (non bloquant):', {
            message: emailError.message,
            stack: emailError.stack
          })
          // On continue même si l'email échoue
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Votre demande d\'assistance a été soumise avec succès !',
        data: {
          id: rpcInsertData.id,
          statut: rpcInsertData.statut
        }
      }, { status: 201 })
    }

    // Log pour le suivi
    console.log('Nouvelle demande d\'assistance créée:', insertData)

    // Envoyer une notification par email si un conseiller a été assigné
    if (demandeData.conseiller_id) {
      try {
        console.log('📧 Tentative d\'envoi de notification email pour nouvelle demande:', insertData.id)
        console.log('📧 Conseiller assigné:', demandeData.conseiller_id)
        
        // Récupérer les données complètes avec les relations
        const { data: demandeComplete, error: fetchError } = await supabase
          .from('demandes_assistance_stagiaires')
          .select(`
            *,
            poles(nom, code, couleur),
            filieres(nom, code, color),
            profiles!conseiller_id(nom, prenom, email, role)
          `)
          .eq('id', insertData.id)
          .single()

        if (!fetchError && demandeComplete) {
          const { sendAssistanceAssignmentNotification } = await import('@/lib/email')
          const result = await sendAssistanceAssignmentNotification({
            id: demandeComplete.id,
            nom: demandeComplete.nom || '',
            prenom: demandeComplete.prenom || '',
            telephone: demandeComplete.telephone || '',
            type_assistance: demandeComplete.type_assistance || '',
            statut: demandeComplete.statut || 'en_attente',
            conseiller_id: demandeComplete.conseiller_id || '',
            profiles: demandeComplete.profiles,
            poles: demandeComplete.poles,
            filieres: demandeComplete.filieres
          })
          
          if (result.success) {
            console.log('✅ Email de notification envoyé avec succès pour nouvelle demande')
          } else {
            console.warn('⚠️ Email non envoyé pour nouvelle demande, raison:', result.reason)
          }
        } else {
          console.warn('⚠️ Impossible de récupérer les données complètes pour l\'envoi d\'email:', fetchError)
        }
      } catch (emailError: any) {
        console.error('❌ Erreur envoi email notification pour nouvelle demande (non bloquant):', {
          message: emailError.message,
          stack: emailError.stack
        })
        // On continue même si l'email échoue
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Votre demande d\'assistance a été soumise avec succès !',
      data: {
        id: insertData.id,
        statut: insertData.statut
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur API assistance-stagiaires:', error)
    return NextResponse.json(
      { error: 'Une erreur inattendue est survenue. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statut = searchParams.get('statut')
    const conseiller_id = searchParams.get('conseiller_id')
    const type_assistance = searchParams.get('type_assistance')

    // Construire la requête avec filtres optionnels
    let query = supabase
      .from('demandes_assistance_stagiaires')
      .select(`
        *,
        poles(nom, code, couleur),
        filieres(nom, code, color),
        profiles!conseiller_id(nom, prenom, email, role)
      `)
      .order('created_at', { ascending: false })

    // Appliquer les filtres
    if (statut) {
      query = query.eq('statut', statut)
    }
    if (conseiller_id) {
      query = query.eq('conseiller_id', conseiller_id)
    }
    if (type_assistance) {
      query = query.eq('type_assistance', type_assistance)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur récupération demandes assistance:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des demandes' },
        { status: 500 }
      )
    }

    // Récupérer aussi les conseillers disponibles
    const { data: conseillersData, error: conseillersError } = await supabase
      .from('profiles')
      .select('id, nom, prenom, email, role, telephone, poste')
      .in('role', ['conseiller_cop', 'conseillere_carriere'])
      .eq('actif', true)
      .order('nom')

    if (conseillersError) {
      console.error('Erreur récupération conseillers:', conseillersError)
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      conseillers: conseillersData || [],
      count: data?.length || 0
    }, { status: 200 })

  } catch (error) {
    console.error('Erreur API GET assistance-stagiaires:', error)
    return NextResponse.json(
      { error: 'Une erreur inattendue est survenue.' },
      { status: 500 }
    )
  }
}
