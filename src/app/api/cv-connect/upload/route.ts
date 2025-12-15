import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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

    // Vérifier si l'utilisateur a déjà déposé un CV (utiliser admin pour bypasser RLS)
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    const { data: existingSubmission } = await supabaseAdmin
      .from('cv_connect_submissions')
      .select('id, nom, prenom, submitted_at')
      .eq('email', email)
      .single()

    if (existingSubmission) {
      const submittedDate = existingSubmission.submitted_at 
        ? new Date(existingSubmission.submitted_at as string).toLocaleDateString('fr-FR')
        : 'récemment'
      return NextResponse.json(
        { error: `Vous avez déjà déposé un CV le ${submittedDate}. Un seul CV par personne est autorisé.` },
        { status: 400 }
      )
    }

    // Récupérer les informations du pôle et de la filière
    const { data: pole, error: poleError } = await supabase
      .from('poles')
      .select('nom')
      .eq('id', pole_id)
      .single()

    const { data: filiere, error: filiereError } = await supabase
      .from('filieres')
      .select('nom')
      .eq('id', filiere_id)
      .single()

    if (poleError || filiereError || !pole || !filiere) {
      return NextResponse.json(
        { error: 'Pôle ou filière introuvable' },
        { status: 400 }
      )
    }

    const poleNom = (pole as { nom: string }).nom
    const filiereNom = (filiere as { nom: string }).nom

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
    const sanitizedNom = nom.replace(/[^a-zA-Z0-9]/g, '_')
    const sanitizedPrenom = prenom.replace(/[^a-zA-Z0-9]/g, '_')
    const fileName = `${sanitizedNom}_${sanitizedPrenom}_${timestamp}.pdf`
    
    // Chemin dans Supabase Storage (organisé par pôle/filière)
    const sanitizedPole = poleNom.replace(/[^a-zA-Z0-9]/g, '_')
    const sanitizedFiliere = filiereNom.replace(/[^a-zA-Z0-9]/g, '_')
    const storagePath = `cv-connect/${sanitizedPole}/${sanitizedFiliere}/${fileName}`

    // Uploader sur Supabase Storage
    console.log(`[CV Upload] ========================================`)
    console.log(`[CV Upload] Tentative d'upload vers Supabase Storage`)
    console.log(`[CV Upload] Nom: ${nom} ${prenom}`)
    console.log(`[CV Upload] Fichier: ${fileName} (${fileBuffer.length} bytes)`)
    console.log(`[CV Upload] Pôle: ${poleNom}`)
    console.log(`[CV Upload] Filière: ${filiereNom}`)
    console.log(`[CV Upload] Chemin Storage: ${storagePath}`)
    console.log(`[CV Upload] ========================================`)

    try {
      // Uploader le fichier dans Supabase Storage (utiliser admin pour bypasser RLS)
      if (!supabaseAdmin) {
        throw new Error('Configuration serveur manquante pour l\'upload Storage')
      }

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('cv-connect')
        .upload(storagePath, fileBuffer, {
          contentType: 'application/pdf',
          upsert: false // Ne pas écraser si le fichier existe déjà
        })

      if (uploadError) {
        console.error('[CV Upload] ❌ Erreur upload Supabase Storage:', uploadError)
        console.error('[CV Upload] Détails erreur Storage:', {
          message: uploadError.message,
          name: uploadError.name
        })
        
        // Vérifier si le bucket existe
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          throw new Error(`Le bucket 'cv-connect' n'existe pas. Veuillez exécuter la migration SQL pour créer le bucket.`)
        }
        
        throw new Error(`Erreur lors de l'upload: ${uploadError.message}`)
      }

      console.log(`[CV Upload] ✅ Upload réussi vers Supabase Storage:`, {
        path: uploadData.path,
        fullPath: uploadData.fullPath
      })

      // Obtenir l'URL publique du fichier
      const { data: urlData } = supabaseAdmin.storage
        .from('cv-connect')
        .getPublicUrl(storagePath)

      console.log(`[CV Upload] ✅ URL publique générée:`, urlData.publicUrl)

      // Sauvegarder en base de données (utiliser admin pour bypasser RLS)
      const { data: submission, error: insertError } = await supabaseAdmin
        .from('cv_connect_submissions')
        .insert([{
          nom,
          prenom,
          email,
          telephone: telephone || null,
          pole_id,
          filiere_id,
          cv_filename: fileName,
          cv_storage_path: storagePath,
          cv_storage_url: urlData.publicUrl,
          cv_google_drive_id: null, // Explicitement null car on n'utilise plus Google Drive
          cv_google_drive_url: null, // Explicitement null car on n'utilise plus Google Drive
          statut: 'nouveau'
        }])
        .select()
        .single()

      if (insertError) {
        console.error('[CV Upload] ❌ Erreur insertion base de données:', insertError)
        console.error('[CV Upload] Détails erreur:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        })
        
        // Essayer de supprimer le fichier uploadé en cas d'erreur
        if (supabaseAdmin) {
          await supabaseAdmin.storage
            .from('cv-connect')
            .remove([storagePath])
            .catch(err => console.error('Erreur suppression fichier après erreur DB:', err))
        }
        
        return NextResponse.json(
          { 
            error: 'Erreur lors de la sauvegarde',
            details: insertError.message || 'Erreur inconnue lors de l\'insertion en base de données'
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        submission: {
          id: submission.id,
          fileName,
          storagePath,
          publicUrl: urlData.publicUrl
        }
      })
    } catch (storageError: any) {
      console.error('[CV Upload] ❌ ERREUR STOCKAGE ========================================')
      console.error('[CV Upload] Message:', storageError.message)
      console.error('[CV Upload] Stack:', storageError.stack)
      console.error(`[CV Upload] ========================================`)
      
      return NextResponse.json(
        { 
          error: 'Impossible d\'uploader le CV. Veuillez réessayer ou contacter l\'administrateur.',
          details: {
            message: storageError.message
          }
        },
        { status: 500 }
      )
    }

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
