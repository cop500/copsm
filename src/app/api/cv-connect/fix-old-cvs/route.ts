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

    console.log('[Fix Old CVs] Début de la correction des anciens CV...')

    // Récupérer tous les CVs de la base de données
    const { data: submissions, error: fetchError } = await supabase
      .from('cv_connect_submissions')
      .select('*')

    if (fetchError) {
      throw new Error(`Erreur récupération CVs: ${fetchError.message}`)
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({
        message: 'Aucun CV à corriger',
        fixed: 0,
        total: 0
      })
    }

    const drive = getDriveServiceInstance()
    let fixedCount = 0
    let errorCount = 0
    const results: any[] = []

    // Traiter chaque CV
    for (const submission of submissions) {
      try {
        console.log(`[Fix Old CVs] Traitement CV ${submission.id} (${submission.cv_filename})`)

        // Vérifier si le fichier existe sur Google Drive
        if (!submission.cv_google_drive_id) {
          console.warn(`[Fix Old CVs] ⚠️ CV ${submission.id} n'a pas d'ID Google Drive`)
          results.push({
            id: submission.id,
            filename: submission.cv_filename,
            status: 'skipped',
            reason: 'Pas d\'ID Google Drive'
          })
          continue
        }

        // Récupérer les informations du fichier
        const fileInfo = await drive.files.get({
          fileId: submission.cv_google_drive_id,
          fields: 'id, name, size, webViewLink, permissions',
        })

        const fileSize = fileInfo.data.size ? parseInt(fileInfo.data.size) : 0

        // Vérifier la taille du fichier
        if (fileSize === 0) {
          console.warn(`[Fix Old CVs] ⚠️ CV ${submission.id} est vide (0 KB)`)
          results.push({
            id: submission.id,
            filename: submission.cv_filename,
            status: 'error',
            reason: 'Fichier vide (0 KB)'
          })
          errorCount++
          continue
        }

        // Vérifier les permissions
        let needsPermissionFix = false
        const permissions = fileInfo.data.permissions || []
        const hasPublicAccess = permissions.some((p: any) => p.type === 'anyone')

        if (!hasPublicAccess) {
          console.log(`[Fix Old CVs] Correction des permissions pour CV ${submission.id}`)
          try {
            await drive.permissions.create({
              fileId: submission.cv_google_drive_id,
              requestBody: {
                role: 'reader',
                type: 'anyone',
              },
            })
            needsPermissionFix = true
            console.log(`[Fix Old CVs] ✅ Permissions corrigées pour CV ${submission.id}`)
          } catch (permError: any) {
            console.error(`[Fix Old CVs] ❌ Erreur permissions CV ${submission.id}:`, permError.message)
          }
        }

        // Vérifier/générer l'URL
        let webViewLink = fileInfo.data.webViewLink
        if (!webViewLink) {
          webViewLink = `https://drive.google.com/file/d/${submission.cv_google_drive_id}/view`
          console.log(`[Fix Old CVs] Génération URL alternative pour CV ${submission.id}`)
        }

        // Mettre à jour en base de données si nécessaire
        const updateData: any = {}
        if (needsPermissionFix || webViewLink !== submission.cv_google_drive_url) {
          updateData.cv_google_drive_url = webViewLink
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('cv_connect_submissions')
            .update(updateData)
            .eq('id', submission.id)

          if (updateError) {
            console.error(`[Fix Old CVs] ❌ Erreur mise à jour CV ${submission.id}:`, updateError.message)
            results.push({
              id: submission.id,
              filename: submission.cv_filename,
              status: 'error',
              reason: `Erreur mise à jour: ${updateError.message}`
            })
            errorCount++
          } else {
            console.log(`[Fix Old CVs] ✅ CV ${submission.id} corrigé avec succès`)
            results.push({
              id: submission.id,
              filename: submission.cv_filename,
              status: 'fixed',
              fixes: {
                permissions: needsPermissionFix,
                url: webViewLink !== submission.cv_google_drive_url
              }
            })
            fixedCount++
          }
        } else {
          console.log(`[Fix Old CVs] ✅ CV ${submission.id} est déjà correct`)
          results.push({
            id: submission.id,
            filename: submission.cv_filename,
            status: 'ok',
            reason: 'Aucune correction nécessaire'
          })
        }

      } catch (error: any) {
        console.error(`[Fix Old CVs] ❌ Erreur traitement CV ${submission.id}:`, error.message)
        results.push({
          id: submission.id,
          filename: submission.cv_filename,
          status: 'error',
          reason: error.message
        })
        errorCount++
      }
    }

    return NextResponse.json({
      message: `Correction terminée: ${fixedCount} corrigé(s), ${errorCount} erreur(s)`,
      total: submissions.length,
      fixed: fixedCount,
      errors: errorCount,
      ok: submissions.length - fixedCount - errorCount,
      details: results
    })

  } catch (error: any) {
    console.error('[Fix Old CVs] ❌ Erreur générale:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la correction des CVs',
        details: error.message
      },
      { status: 500 }
    )
  }
}

