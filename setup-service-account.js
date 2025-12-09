#!/usr/bin/env node

/**
 * Script simple pour configurer Service Account Google Drive
 * Usage: node setup-service-account.js chemin/vers/service-account-key.json
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Configuration Service Account Google Drive\n');

// Vérifier les arguments
if (process.argv.length < 3) {
  console.error('❌ Erreur: Spécifiez le chemin vers le fichier JSON du Service Account');
  console.log('\nUsage:');
  console.log('  node setup-service-account.js chemin/vers/service-account-key.json\n');
  console.log('Exemple:');
  console.log('  node setup-service-account.js ./cv-connect-service-key.json\n');
  process.exit(1);
}

const jsonPath = process.argv[2];

// Lire le fichier JSON
let serviceAccountData;
try {
  const jsonContent = fs.readFileSync(jsonPath, 'utf8');
  serviceAccountData = JSON.parse(jsonContent);
} catch (error) {
  console.error('❌ Erreur lors de la lecture du fichier JSON:', error.message);
  process.exit(1);
}

// Extraire les informations
const clientEmail = serviceAccountData.client_email;
const privateKey = serviceAccountData.private_key;

if (!clientEmail || !privateKey) {
  console.error('❌ Le fichier JSON ne contient pas les informations nécessaires');
  console.error('   Assurez-vous que le fichier contient "client_email" et "private_key"');
  process.exit(1);
}

console.log('✅ Fichier JSON lu avec succès\n');
console.log('📋 Variables d\'environnement à ajouter:\n');
console.log('─'.repeat(60));
console.log('\n# Service Account Google Drive');
console.log(`GOOGLE_SERVICE_ACCOUNT_EMAIL=${clientEmail}`);
console.log(`GOOGLE_PRIVATE_KEY="${privateKey}"`);
console.log(`GOOGLE_DRIVE_FOLDER_ID=VOTRE_ID_DOSSIER_ICI`);
console.log('\n─'.repeat(60));

console.log('\n📝 Instructions:');
console.log('1. Copiez les 3 variables ci-dessus');
console.log('2. Ajoutez-les à votre fichier .env.local');
console.log('3. Remplacez VOTRE_ID_DOSSIER_ICI par l\'ID de votre dossier Google Drive');
console.log('4. Partagez votre dossier Google Drive avec:', clientEmail);
console.log('5. Redémarrez votre serveur: npm run dev\n');

// Optionnel: Créer un fichier .env.example
const envExamplePath = '.env.service-account.example';
try {
  const envContent = `# Service Account Google Drive
GOOGLE_SERVICE_ACCOUNT_EMAIL=${clientEmail}
GOOGLE_PRIVATE_KEY="${privateKey}"
GOOGLE_DRIVE_FOLDER_ID=VOTRE_ID_DOSSIER_ICI
`;
  fs.writeFileSync(envExamplePath, envContent);
  console.log(`✅ Fichier exemple créé: ${envExamplePath}`);
  console.log('   Vous pouvez le copier vers .env.local et remplir GOOGLE_DRIVE_FOLDER_ID\n');
} catch (error) {
  console.warn('⚠️  Impossible de créer le fichier exemple:', error.message);
}

console.log('✨ Configuration terminée!\n');

