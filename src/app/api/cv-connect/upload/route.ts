import { NextRequest, NextResponse } from 'next/server'
import { uploadCV } from '@/lib/google-drive'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extraire les données du formulaire
    const nom = formData.get('nom') as string
    const prenom = formData.get('prenom') as string
    const email = formData.get('email') as string
    const telephone = formData.get('telephone') as string
    const pole_id = formData.get('pole_id') as string
    const filiere_id = formData.get('filiere_id') as string
    const cv_file = formData.get('cv_file') as File

    // Validation des données
    if (!nom || !prenom || !email || !pole_id || !filiere_id || !cv_file) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Validation du fichier
    if (cv_file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Seuls les fichiers PDF sont acceptés' },
        { status: 400 }
      )
    }

    if (cv_file.size > 5 * 1024 * 1024) { // 5MB max
      return NextResponse.json(
        { error: 'Le fichier ne doit pas dépasser 5MB' },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur a déjà déposé un CV
    const { data: existingSubmission } = await supabase
      .from('cv_connect_submissions')
      .select('id, nom, prenom, submitted_at')
      .eq('email', email)
      .single()

    if (existingSubmission) {
      return NextResponse.json(
        { error: `Vous avez déjà déposé un CV le ${new Date(existingSubmission.submitted_at).toLocaleDateString('fr-FR')}. Un seul CV par personne est autorisé.` },
        { status: 400 }
      )
    }

    // Récupérer les informations du pôle et de la filière
    const { data: pole } = await supabase
      .from('poles')
      .select('nom')
      .eq('id', pole_id)
      .single()

    const { data: filiere } = await supabase
      .from('filieres')
      .select('nom')
      .eq('id', filiere_id)
      .single()

    if (!pole || !filiere) {
      return NextResponse.json(
        { error: 'Pôle ou filière introuvable' },
        { status: 400 }
      )
    }

    // Convertir le fichier en buffer
    const fileBuffer = Buffer.from(await cv_file.arrayBuffer())
    
    // Validation supplémentaire du buffer
    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json(
        { error: 'Le fichier PDF est vide ou invalide' },
        { status: 400 }
      )
    }

    // Vérifier que la taille du buffer correspond à la taille du fichier
    if (fileBuffer.length !== cv_file.size) {
      console.warn(`Taille du buffer (${fileBuffer.length}) différente de la taille du fichier (${cv_file.size})`)
    }
    
    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const fileName = `${nom}_${prenom}_${timestamp}.pdf`

    // Uploader sur Google Drive
    let uploadResult
    try {
      console.log(`[CV Upload] ========================================`)
      console.log(`[CV Upload] Tentative d'upload vers Google Drive`)
      console.log(`[CV Upload] Nom: ${nom} ${prenom}`)
      console.log(`[CV Upload] Fichier: ${fileName} (${fileBuffer.length} bytes)`)
      console.log(`[CV Upload] Pôle: ${pole.nom}`)
      console.log(`[CV Upload] Filière: ${filiere.nom}`)
      console.log(`[CV Upload] ========================================`)
      
      uploadResult = await uploadCV(
        fileBuffer,
        fileName,
        pole.nom,
        filiere.nom
      )
      
      console.log(`[CV Upload] ✅ Upload réussi:`, {
        fileId: uploadResult.fileId,
        webViewLink: uploadResult.webViewLink,
        folderPath: uploadResult.folderPath
      })
    } catch (googleDriveError: any) {
      console.error(`[CV Upload] ❌ ERREUR GOOGLE DRIVE ========================================`)
      console.error('[CV Upload] Message:', googleDriveError.message)
      console.error('[CV Upload] Code:', googleDriveError.code)
      console.error('[CV Upload] Errors:', JSON.stringify(googleDriveError.errors, null, 2))
      console.error('[CV Upload] Stack:', googleDriveError.stack)
      console.error(`[CV Upload] ========================================`)
      
      // En production, retourner des détails utiles mais sécurisés
      const errorDetails: any = {
        message: googleDriveError.message,
        code: googleDriveError.code
      }

      // Ajouter les erreurs si elles existent (sans informations sensibles)
      if (googleDriveError.errors && Array.isArray(googleDriveError.errors)) {
        errorDetails.errors = googleDriveError.errors.map((err: any) => ({
          domain: err.domain,
          reason: err.reason,
          message: err.message
        }))
      }

      // Toujours retourner les détails pour diagnostic (même en production)
      return NextResponse.json(
        { 
          error: 'Impossible d\'uploader le CV sur Google Drive. Veuillez réessayer ou contacter l\'administrateur.',
          details: errorDetails
        },
        { status: 500 }
      )
    }

    // Sauvegarder en base de données
    const { data: submission, error: insertError } = await supabase
      .from('cv_connect_submissions')
      .insert([{
        nom,
        prenom,
        email,
        telephone: telephone || null,
        pole_id,
        filiere_id,
        cv_filename: fileName,
        cv_google_drive_id: uploadResult.fileId,
        cv_google_drive_url: uploadResult.webViewLink,
        statut: 'nouveau'
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Erreur insertion base de données:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        fileName,
        folderPath: uploadResult.folderPath,
        webViewLink: uploadResult.webViewLink
      }
    })

  } catch (error: any) {
    console.error('[CV Upload] ❌ ERREUR GÉNÉRALE ========================================')
    console.error('[CV Upload] Type:', error.constructor.name)
    console.error('[CV Upload] Message:', error.message)
    console.error('[CV Upload] Code:', error.code)
    console.error('[CV Upload] Stack:', error.stack)
    console.error(`[CV Upload] ========================================`)
    
    // Construire les détails d'erreur
    const errorDetails: any = {
      message: error.message || 'Erreur inconnue',
      type: error.constructor.name || 'Error'
    }
    
    if (error.code) {
      errorDetails.code = error.code
    }
    
    if (error.errors) {
      errorDetails.errors = error.errors
    }

    // Gérer les erreurs spécifiques avec des messages conviviaux
    if (error.message?.includes('Configuration Google Drive manquante')) {
      return NextResponse.json(
        { 
          error: 'Service temporairement indisponible. Veuillez réessayer plus tard.',
          details: {
            ...errorDetails,
            reason: 'Configuration Google Drive manquante'
          }
        },
        { status: 503 }
      )
    }
    
    if (error.message?.includes('Impossible de créer le dossier') || error.message?.includes('Impossible d\'uploader le fichier')) {
      return NextResponse.json(
        { 
          error: 'Une erreur est survenue lors de l\'enregistrement de votre CV. Veuillez réessayer ou contacter notre équipe.',
          details: {
            ...errorDetails,
            reason: 'Erreur Google Drive (création/upload)'
          }
        },
        { status: 500 }
      )
    }

    // Toujours retourner les détails pour diagnostic
    return NextResponse.json(
      { 
        error: 'Une erreur inattendue est survenue. Veuillez réessayer ou contacter notre équipe si le problème persiste.',
        details: errorDetails
      },
      { status: 500 }
    )
  }
}

// Gérer les requêtes OPTIONS pour CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
