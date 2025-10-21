const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testGoogleDrive() {
  try {
    console.log('🔍 Test de la configuration Google Drive...');
    
    const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    console.log('📁 Folder ID:', GOOGLE_DRIVE_FOLDER_ID);
    console.log('📧 Service Account:', GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('🔑 Private Key:', GOOGLE_PRIVATE_KEY ? 'Défini' : 'MANQUANT');

    // Initialiser l'authentification
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Test 1: Vérifier l'accès au dossier parent
    console.log('\n🔍 Test 1: Vérification du dossier parent...');
    try {
      const folder = await drive.files.get({
        fileId: GOOGLE_DRIVE_FOLDER_ID,
        fields: 'id,name,permissions'
      });
      console.log('✅ Dossier parent trouvé:', folder.data.name);
    } catch (error) {
      console.log('❌ Erreur accès dossier parent:', error.message);
      return;
    }

    // Test 2: Créer un dossier de test
    console.log('\n🔍 Test 2: Création d\'un dossier de test...');
    try {
      const testFolder = await drive.files.create({
        requestBody: {
          name: 'Test_CV_Connect_' + Date.now(),
          mimeType: 'application/vnd.google-apps.folder',
          parents: [GOOGLE_DRIVE_FOLDER_ID],
        },
        fields: 'id,name',
      });
      console.log('✅ Dossier de test créé:', testFolder.data.name, 'ID:', testFolder.data.id);
      
      // Supprimer le dossier de test
      await drive.files.delete({ fileId: testFolder.data.id });
      console.log('✅ Dossier de test supprimé');
    } catch (error) {
      console.log('❌ Erreur création dossier:', error.message);
    }

    console.log('\n🎉 Test terminé !');
  } catch (error) {
    console.log('❌ Erreur générale:', error.message);
  }
}

testGoogleDrive();
