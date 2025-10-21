require('dotenv').config({ path: '.env.local' });

const key = process.env.GOOGLE_PRIVATE_KEY
  ?.replace(/\\n/g, '\n')
  ?.replace(/^"/, '')
  ?.replace(/"$/, '')
  ?.trim();

console.log('Clé formatée (derniers 50 caractères):', key?.substring(key.length - 50));
console.log('Se termine par END:', key?.endsWith('-----END PRIVATE KEY-----'));
console.log('Longueur totale:', key?.length);
