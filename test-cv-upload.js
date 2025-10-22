// Test d'upload CV
const FormData = require('form-data')
const fs = require('fs')

async function testCVUpload() {
  console.log('=== Test Upload CV ===')
  
  try {
    // Créer un fichier PDF de test
    const testPDFContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test CV) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF')
    
    // Créer le FormData
    const formData = new FormData()
    formData.append('nom', 'Test')
    formData.append('prenom', 'User')
    formData.append('email', 'test@example.com')
    formData.append('telephone', '06 12 34 56 78')
    formData.append('pole_id', 'test-pole-id')
    formData.append('filiere_id', 'test-filiere-id')
    formData.append('cv_file', testPDFContent, {
      filename: 'test_cv.pdf',
      contentType: 'application/pdf'
    })
    
    console.log('Envoi de la requête...')
    
    const response = await fetch('https://copsm.space/api/cv-connect/upload', {
      method: 'POST',
      body: formData
    })
    
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    
    const responseData = await response.text()
    console.log('Response:', responseData)
    
    if (response.ok) {
      console.log('✅ Upload réussi!')
    } else {
      console.log('❌ Upload échoué')
    }
    
  } catch (error) {
    console.log('❌ Erreur:', error.message)
  }
}

testCVUpload()
