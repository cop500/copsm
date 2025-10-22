// Test de la configuration Google Drive
require('dotenv').config({ path: '.env.local' })

console.log('=== Test Configuration Google Drive ===')
console.log('GOOGLE_DRIVE_FOLDER_ID:', process.env.GOOGLE_DRIVE_FOLDER_ID ? 'Défini' : 'Non défini')
console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Défini' : 'Non défini')
console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'Défini' : 'Non défini')

if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
  console.log('GOOGLE_DRIVE_FOLDER_ID value:', process.env.GOOGLE_DRIVE_FOLDER_ID)
}

if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
  console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL value:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)
}

if (process.env.GOOGLE_PRIVATE_KEY) {
  console.log('GOOGLE_PRIVATE_KEY length:', process.env.GOOGLE_PRIVATE_KEY.length)
  console.log('GOOGLE_PRIVATE_KEY starts with:', process.env.GOOGLE_PRIVATE_KEY.substring(0, 50) + '...')
}
