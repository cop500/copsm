// Endpoint de diagnostic pour CV Connect
export async function POST(request: Request) {
  try {
    console.log('=== Debug CV Upload ===')
    
    const formData = await request.formData()
    console.log('FormData reçu:', Object.fromEntries(formData.entries()))
    
    // Test des variables d'environnement
    const envCheck = {
      google_drive_folder_id: process.env.GOOGLE_DRIVE_FOLDER_ID ? 'Défini' : 'Non défini',
      google_service_account_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Défini' : 'Non défini',
      google_private_key: process.env.GOOGLE_PRIVATE_KEY ? 'Défini' : 'Non défini',
    }
    console.log('Variables d\'environnement:', envCheck)
    
    // Test de l'import Google Drive
    try {
      const { uploadCV } = await import('@/lib/google-drive')
      console.log('✅ Import Google Drive réussi')
      
      // Test avec un buffer factice
      const testBuffer = Buffer.from('Test PDF content')
      const testResult = await uploadCV(testBuffer, 'test.pdf', 'Test Pole', 'Test Filiere')
      console.log('✅ Test upload Google Drive réussi:', testResult)
      
      return Response.json({
        success: true,
        message: 'Tous les tests sont passés',
        envCheck,
        testResult
      })
      
    } catch (googleDriveError) {
      console.error('❌ Erreur Google Drive:', googleDriveError)
      return Response.json({
        success: false,
        message: 'Erreur Google Drive',
        error: googleDriveError.message,
        envCheck
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('❌ Erreur générale:', error)
    return Response.json({
      success: false,
      message: 'Erreur générale',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
