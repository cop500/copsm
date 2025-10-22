// Test de l'endpoint de diagnostic
const https = require('https')

function testEndpoint() {
  console.log('=== Test Endpoint de Diagnostic ===')
  
  const options = {
    hostname: 'copsm.space',
    port: 443,
    path: '/api/test-env/',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }

  const req = https.request(options, (res) => {
    console.log('Status:', res.statusCode)
    console.log('Headers:', res.headers)
    
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      console.log('Response:', data)
      
      try {
        const jsonData = JSON.parse(data)
        console.log('\n=== Variables d\'environnement ===')
        Object.entries(jsonData).forEach(([key, value]) => {
          console.log(`${key}: ${value}`)
        })
      } catch (e) {
        console.log('Réponse non-JSON:', data)
      }
    })
  })

  req.on('error', (error) => {
    console.log('Erreur:', error.message)
  })

  req.end()
}

testEndpoint()
