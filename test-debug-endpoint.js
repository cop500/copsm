// Test de l'endpoint de diagnostic
const FormData = require('form-data')

async function testDebugEndpoint() {
  console.log('=== Test Endpoint de Diagnostic ===')
  
  try {
    const formData = new FormData()
    formData.append('test', 'debug')
    
    const response = await fetch('https://copsm.space/api/debug-cv-upload', {
      method: 'POST',
      body: formData
    })
    
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    
    const responseData = await response.text()
    console.log('Response:', responseData)
    
    if (response.ok) {
      try {
        const jsonData = JSON.parse(responseData)
        console.log('\n=== Résultat du diagnostic ===')
        console.log('Success:', jsonData.success)
        console.log('Message:', jsonData.message)
        
        if (jsonData.envCheck) {
          console.log('\nVariables d\'environnement:')
          Object.entries(jsonData.envCheck).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`)
          })
        }
        
        if (jsonData.testResult) {
          console.log('\nTest Google Drive:')
          console.log('  File ID:', jsonData.testResult.fileId)
          console.log('  Web View Link:', jsonData.testResult.webViewLink)
          console.log('  Folder Path:', jsonData.testResult.folderPath)
        }
        
        if (jsonData.error) {
          console.log('\nErreur détectée:')
          console.log('  Message:', jsonData.error)
        }
        
      } catch (parseError) {
        console.log('Erreur parsing JSON:', parseError.message)
      }
    } else {
      console.log('❌ Endpoint de diagnostic échoué')
    }
    
  } catch (error) {
    console.log('❌ Erreur:', error.message)
  }
}

testDebugEndpoint()
