const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testCVUpload() {
  try {
    console.log('🔍 Test de l\'upload CV...');
    
    const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
      ?.replace(/\\n/g, '\n')
      ?.replace(/^"/, '')
      ?.replace(/"$/, '')
      ?.trim();

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

    // Test 2: Créer un dossier de pôle
    console.log('\n🔍 Test 2: Création d\'un dossier de pôle...');
    try {
      const poleFolder = await drive.files.create({
        requestBody: {
          name: 'INDUSTRIE',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [GOOGLE_DRIVE_FOLDER_ID],
        },
        fields: 'id,name',
      });
      console.log('✅ Dossier pôle créé:', poleFolder.data.name, 'ID:', poleFolder.data.id);
      
      // Test 3: Créer un dossier de filière dans le pôle
      console.log('\n🔍 Test 3: Création d\'un dossier de filière...');
      const filiereFolder = await drive.files.create({
        requestBody: {
          name: 'PM option Construction Métal',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [poleFolder.data.id],
        },
        fields: 'id,name',
      });
      console.log('✅ Dossier filière créé:', filiereFolder.data.name, 'ID:', filiereFolder.data.id);
      
      // Test 4: Uploader un fichier de test
      console.log('\n🔍 Test 4: Upload d\'un fichier de test...');
      const testContent = Buffer.from('Test CV content');
      
      // Créer un fichier temporaire
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      const tempFilePath = path.join(os.tmpdir(), `test_${Date.now()}_cv.pdf`);
      fs.writeFileSync(tempFilePath, testContent);
      
      try {
        const uploadResult = await drive.files.create({
          requestBody: {
            name: 'test_cv.pdf',
            parents: [filiereFolder.data.id],
          },
          media: fs.createReadStream(tempFilePath),
          fields: 'id,webViewLink',
        });
        console.log('✅ Fichier uploadé:', uploadResult.data.id);
        console.log('🔗 Lien:', uploadResult.data.webViewLink);
        
        // Nettoyer les fichiers de test
        console.log('\n🧹 Nettoyage...');
        await drive.files.delete({ fileId: uploadResult.data.id });
        await drive.files.delete({ fileId: filiereFolder.data.id });
        await drive.files.delete({ fileId: poleFolder.data.id });
        console.log('✅ Nettoyage terminé');
      } finally {
        // Supprimer le fichier temporaire
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
      
    } catch (error) {
      console.log('❌ Erreur création dossier:', error.message);
      console.log('📋 Détails:', error);
    }

    console.log('\n🎉 Test terminé !');
  } catch (error) {
    console.log('❌ Erreur générale:', error.message);
    console.log('📋 Détails:', error);
  }
}

testCVUpload();
