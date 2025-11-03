import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { google } from 'googleapis'

// Fonction pour obtenir le service Drive
function getDriveServiceInstance() {
  const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
    ?.replace(/\\n/g, '\n')
    ?.replace(/^"/, '')
    ?.replace(/"$/, '')
    ?.trim()

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Configuration Google Drive manquante')
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return google.drive({ version: 'v3', auth })
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier que c'est un admin qui appelle
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.ADMIN_FIX_TOKEN || 'admin-fix-2025'}`) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    console.log('[Cleanup Invalid CVs] Début du nettoyage des CV invalides...')

    // Récupérer tous les CVs de la base de données
    const { data: submissions, error: fetchError } = await supabase
      .from('cv_connect_submissions')
      .select('*')

    if (fetchError) {
      throw new Error(`Erreur récupération CVs: ${fetchError.message}`)
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({
        message: 'Aucun CV à vérifier',
        total: 0,
        deleted: 0,
        kept: 0
      })
    }

    const drive = getDriveServiceInstance()
    let deletedCount = 0
    let keptCount = 0
    const deletedDetails: any[] = []

    // Traiter chaque CV
    for (const submission of submissions) {
      try {
        // Cas 1: Pas d'ID Google Drive
        if (!submission.cv_google_drive_id) {
          console.log(`[Cleanup] ❌ CV ${submission.id} supprimé: Pas d'ID Google Drive`)
          deletedDetails.push({
            id: submission.id,
            filename: submission.cv_filename,
            email: submission.email,
            reason: 'Pas d\'ID Google Drive'
          })
          
          const { error: deleteError } = await supabase
            .from('cv_connect_submissions')
            .delete()
            .eq('id', submission.id)

          if (deleteError) {
            console.error(`[Cleanup] ❌ Erreur suppression CV ${submission.id}:`, deleteError.message)
          } else {
            deletedCount++
          }
          continue
        }

        // Cas 2: ID invalide (contient "fallback" ou autres patterns suspects)
        if (submission.cv_google_drive_id.includes('fallback') || 
            submission.cv_google_drive_id.length < 10) {
          console.log(`[Cleanup] ❌ CV ${submission.id} supprimé: ID invalide (${submission.cv_google_drive_id})`)
          deletedDetails.push({
            id: submission.id,
            filename: submission.cv_filename,
            email: submission.email,
            reason: `ID Google Drive invalide: ${submission.cv_google_drive_id}`
          })
          
          const { error: deleteError } = await supabase
            .from('cv_connect_submissions')
            .delete()
            .eq('id', submission.id)

          if (deleteError) {
            console.error(`[Cleanup] ❌ Erreur suppression CV ${submission.id}:`, deleteError.message)
          } else {
            deletedCount++
          }
          continue
        }

        // Cas 3: Vérifier si le fichier existe et sa taille
        try {
          const fileInfo = await drive.files.get({
            fileId: submission.cv_google_drive_id,
            fields: 'id, name, size',
          })

          const fileSize = fileInfo.data.size ? parseInt(fileInfo.data.size) : 0

          // Si le fichier est vide (0 KB), le supprimer
          if (fileSize === 0) {
            console.log(`[Cleanup] ❌ CV ${submission.id} supprimé: Fichier vide (0 KB)`)
            deletedDetails.push({
              id: submission.id,
              filename: submission.cv_filename,
              email: submission.email,
              reason: 'Fichier vide (0 KB) sur Google Drive'
            })
            
            const { error: deleteError } = await supabase
              .from('cv_connect_submissions')
              .delete()
              .eq('id', submission.id)

            if (deleteError) {
              console.error(`[Cleanup] ❌ Erreur suppression CV ${submission.id}:`, deleteError.message)
            } else {
              deletedCount++
            }
            continue
          }

          // Le fichier est valide
          console.log(`[Cleanup] ✅ CV ${submission.id} valide: ${fileSize} bytes`)
          keptCount++

        } catch (fileError: any) {
          // Le fichier n'existe pas sur Google Drive
          if (fileError.code === 404 || fileError.message?.includes('File not found')) {
            console.log(`[Cleanup] ❌ CV ${submission.id} supprimé: Fichier introuvable sur Google Drive`)
            deletedDetails.push({
              id: submission.id,
              filename: submission.cv_filename,
              email: submission.email,
              reason: 'Fichier introuvable sur Google Drive'
            })
            
            const { error: deleteError } = await supabase
              .from('cv_connect_submissions')
              .delete()
              .eq('id', submission.id)

            if (deleteError) {
              console.error(`[Cleanup] ❌ Erreur suppression CV ${submission.id}:`, deleteError.message)
            } else {
              deletedCount++
            }
          } else {
            // Autre erreur - conserver le CV pour investigation
            console.warn(`[Cleanup] ⚠️ Erreur vérification CV ${submission.id}:`, fileError.message)
            keptCount++
          }
        }

      } catch (error: any) {
        console.error(`[Cleanup] ❌ Erreur traitement CV ${submission.id}:`, error.message)
        // En cas d'erreur, conserver le CV pour éviter de supprimer par erreur
        keptCount++
      }
    }

    return NextResponse.json({
      message: `Nettoyage terminé: ${deletedCount} CV(s) supprimé(s), ${keptCount} CV(s) conservé(s)`,
      total: submissions.length,
      deleted: deletedCount,
      kept: keptCount,
      deletedDetails: deletedDetails
    })

  } catch (error: any) {
    console.error('[Cleanup Invalid CVs] ❌ Erreur générale:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors du nettoyage des CVs',
        details: error.message
      },
      { status: 500 }
    )
  }
}

