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
    
    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const fileName = `${nom}_${prenom}_${timestamp}.pdf`

    // Uploader sur Google Drive (avec fallback)
    let uploadResult
    try {
      uploadResult = await uploadCV(
        fileBuffer,
        fileName,
        pole.nom,
        filiere.nom
      )
    } catch (googleDriveError) {
      console.error('Erreur Google Drive, utilisation du mode fallback:', googleDriveError)
      
      // Mode fallback : stocker le fichier localement
      try {
        const fs = require('fs')
        const path = require('path')
        const os = require('os')
        
        // Créer un dossier de fallback
        const fallbackDir = path.join(os.tmpdir(), 'cv-connect-fallback')
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true })
        }
        
        // Sauvegarder le fichier
        const fallbackFilePath = path.join(fallbackDir, fileName)
        fs.writeFileSync(fallbackFilePath, fileBuffer)
        
        uploadResult = {
          fileId: `fallback_${Date.now()}`,
          webViewLink: `Fichier stocké localement: ${fallbackFilePath}`,
          folderPath: `${pole.nom}/${filiere.nom}`
        }
      } catch (fallbackError) {
        console.error('Erreur mode fallback:', fallbackError)
        throw new Error('Impossible de sauvegarder le CV')
      }
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
    console.error('Erreur upload CV:', error)
    
    // Gérer les erreurs spécifiques avec des messages conviviaux
    if (error.message.includes('Configuration Google Drive manquante')) {
      return NextResponse.json(
        { error: 'Service temporairement indisponible. Veuillez réessayer plus tard.' },
        { status: 503 }
      )
    }
    
    if (error.message.includes('Impossible de créer le dossier') || error.message.includes('Impossible d\'uploader le fichier')) {
      return NextResponse.json(
        { error: 'Une erreur est survenue lors de l\'enregistrement de votre CV. Veuillez réessayer ou contacter notre équipe.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Une erreur inattendue est survenue. Veuillez réessayer ou contacter notre équipe si le problème persiste.' },
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
