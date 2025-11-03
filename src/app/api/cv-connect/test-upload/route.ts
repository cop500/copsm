import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  try {
    const diagnostics: any = {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      checks: {}
    }

    // Vérifier les variables d'environnement
    diagnostics.checks.env = {
      GOOGLE_DRIVE_FOLDER_ID: {
        exists: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
        value: process.env.GOOGLE_DRIVE_FOLDER_ID ? `${process.env.GOOGLE_DRIVE_FOLDER_ID.substring(0, 20)}...` : 'NON DÉFINI',
        length: process.env.GOOGLE_DRIVE_FOLDER_ID?.length || 0
      },
      GOOGLE_SERVICE_ACCOUNT_EMAIL: {
        exists: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        value: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'NON DÉFINI',
        length: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.length || 0
      },
      GOOGLE_PRIVATE_KEY: {
        exists: !!process.env.GOOGLE_PRIVATE_KEY,
        value: process.env.GOOGLE_PRIVATE_KEY ? `${process.env.GOOGLE_PRIVATE_KEY.substring(0, 30)}...` : 'NON DÉFINI',
        length: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
        startsWithBEGIN: process.env.GOOGLE_PRIVATE_KEY?.startsWith('-----BEGIN') || false,
        hasLiteralNewlines: process.env.GOOGLE_PRIVATE_KEY?.includes('\\n') || false
      }
    }

    // Tester l'authentification Google Drive
    try {
      const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
        ?.replace(/\\n/g, '\n')
        ?.replace(/^"/, '')
        ?.replace(/"$/, '')
        ?.trim()

      if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
        diagnostics.checks.auth = {
          success: false,
          error: 'Variables d\'environnement manquantes'
        }
      } else {
        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: GOOGLE_PRIVATE_KEY,
          },
          scopes: ['https://www.googleapis.com/auth/drive'],
        })

        const drive = google.drive({ version: 'v3', auth })
        
        // Tester l'accès à Google Drive en listant le dossier racine
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
        if (folderId) {
          try {
            const folderInfo = await drive.files.get({
              fileId: folderId,
              fields: 'id, name, mimeType'
            })
            
            diagnostics.checks.auth = {
              success: true,
              message: 'Authentification réussie',
              folderAccess: {
                success: true,
                folderId: folderId,
                folderName: folderInfo.data.name
              }
            }
          } catch (folderError: any) {
            diagnostics.checks.auth = {
              success: true,
              message: 'Authentification réussie mais accès dossier échoué',
              folderAccess: {
                success: false,
                error: folderError.message,
                code: folderError.code
              }
            }
          }
        } else {
          diagnostics.checks.auth = {
            success: true,
            message: 'Authentification réussie',
            folderAccess: {
              success: false,
              error: 'GOOGLE_DRIVE_FOLDER_ID non défini'
            }
          }
        }
      }
    } catch (authError: any) {
      diagnostics.checks.auth = {
        success: false,
        error: authError.message,
        code: authError.code,
        stack: process.env.NODE_ENV === 'development' ? authError.stack : undefined
      }
    }

    // Vérifier les permissions du dossier
    if (diagnostics.checks.auth?.success && diagnostics.checks.auth?.folderAccess?.success) {
      try {
        const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
        const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
          ?.replace(/\\n/g, '\n')
          ?.replace(/^"/, '')
          ?.replace(/"$/, '')
          ?.trim()

        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL!,
            private_key: GOOGLE_PRIVATE_KEY!,
          },
          scopes: ['https://www.googleapis.com/auth/drive'],
        })

        const drive = google.drive({ version: 'v3', auth })
        
        // Tester la création d'un fichier test
        const testFileName = `test_${Date.now()}.txt`
        const testFile = await drive.files.create({
          requestBody: {
            name: testFileName,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
          },
          media: {
            mimeType: 'text/plain',
            body: Buffer.from('Test upload'),
          },
        })

        // Supprimer le fichier test immédiatement
        if (testFile.data.id) {
          await drive.files.delete({ fileId: testFile.data.id })
        }

        diagnostics.checks.write = {
          success: true,
          message: 'Écriture dans Google Drive réussie'
        }
      } catch (writeError: any) {
        diagnostics.checks.write = {
          success: false,
          error: writeError.message,
          code: writeError.code
        }
      }
    }

    const allChecksPassed = 
      diagnostics.checks.env.GOOGLE_DRIVE_FOLDER_ID.exists &&
      diagnostics.checks.env.GOOGLE_SERVICE_ACCOUNT_EMAIL.exists &&
      diagnostics.checks.env.GOOGLE_PRIVATE_KEY.exists &&
      diagnostics.checks.env.GOOGLE_PRIVATE_KEY.startsWithBEGIN &&
      diagnostics.checks.auth?.success &&
      diagnostics.checks.write?.success

    diagnostics.status = allChecksPassed ? 'OK' : 'ERROR'
    diagnostics.summary = {
      envConfigured: diagnostics.checks.env.GOOGLE_DRIVE_FOLDER_ID.exists &&
                      diagnostics.checks.env.GOOGLE_SERVICE_ACCOUNT_EMAIL.exists &&
                      diagnostics.checks.env.GOOGLE_PRIVATE_KEY.exists,
      authWorking: diagnostics.checks.auth?.success || false,
      writeWorking: diagnostics.checks.write?.success || false,
      readyForUpload: allChecksPassed
    }

    return NextResponse.json(diagnostics, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Erreur lors du diagnostic',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

