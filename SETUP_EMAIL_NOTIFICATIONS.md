# Configuration des Notifications Email

## 📧 Configuration de Resend (Gratuit)

### 1. Créer un compte Resend

1. Allez sur https://resend.com
2. Créez un compte gratuit
3. Vérifiez votre email

### 2. Obtenir la clé API

1. Dans le dashboard Resend, allez dans "API Keys"
2. Cliquez sur "Create API Key"
3. Donnez un nom (ex: "COP System")
4. Copiez la clé API générée

### 3. Configurer les variables d'environnement

Ajoutez ces lignes dans votre fichier `.env.local` :

```env
# Resend (Email)
RESEND_API_KEY=re_votre_cle_api_ici
RESEND_FROM_EMAIL=COP System <noreply@votre-domaine.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note:** Pour la production, changez `NEXT_PUBLIC_APP_URL` vers votre URL de production.

### 4. Vérifier le domaine (Optionnel mais recommandé)

Pour utiliser votre propre domaine d'email :

1. Dans Resend, allez dans "Domains"
2. Ajoutez votre domaine
3. Suivez les instructions pour configurer les DNS
4. Une fois vérifié, utilisez votre domaine dans `RESEND_FROM_EMAIL`

**Alternative:** Vous pouvez utiliser le domaine par défaut de Resend : `onboarding@resend.dev`

## 🧪 Test en local

1. Démarrez le serveur de développement :
```bash
npm run dev
```

2. Allez sur http://localhost:3000/demande-entreprise

3. Remplissez le formulaire de demande d'entreprise

4. Soumettez le formulaire

5. Vérifiez les emails des destinataires :
   - omar.oumouzoune@ofppt.ma
   - ABDELHAMID.INAJJAREN@ofppt.ma
   - SIHAME.ELOMARI@ofppt.ma
   - IMANE.IDRISSI@ofppt.ma
   - BADR.IJJAALI@ofppt.ma

## 📧 Contenu de l'email

**Sujet:** Nouvelle demande entreprise à traiter

**Corps:**
```
Bonjour,

Une nouvelle demande d'entreprise a été enregistrée dans le système COP.

Entreprise : [Nom Entreprise]
Contact : [Nom Contact]
Email : [Email]
Téléphone : [Téléphone]
Type de demande : [Type]

Lien : [Lien vers la demande]

Cordialement,
Notification automatique - Système COP
```

## 🔧 Configuration des destinataires

Pour modifier la liste des destinataires, éditez le fichier `src/lib/email.ts` :

```typescript
const RECIPIENT_EMAILS = [
  'email1@example.com',
  'email2@example.com',
  // Ajoutez d'autres emails ici
]
```

## ✅ Vérification

- ✅ Resend installé
- ✅ Fonction d'envoi d'email créée
- ✅ Notification déclenchée lors de la création d'une demande
- ✅ Emails envoyés à tous les destinataires
- ✅ Erreur non bloquante (continue même si l'email échoue)

## 🚀 Déploiement

Pour le déploiement en production :

1. Ajoutez les variables d'environnement dans Netlify/Vercel
2. Changez `NEXT_PUBLIC_APP_URL` vers votre URL de production
3. Testez avec une vraie demande

## 📊 Limites gratuites Resend

- **100 emails/jour** (gratuit)
- **3,000 emails/mois** (gratuit)
- **Illimité de destinataires** par email

Ces limites sont largement suffisantes pour votre usage.

