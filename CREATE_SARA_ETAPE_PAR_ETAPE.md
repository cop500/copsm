# Création SARA HANZAZE - Guide Étape par Étape

## 📋 Informations du compte

- **Nom** : HANZAZE
- **Prénom** : SARA
- **Email** : `sara@cop.com`
- **Mot de passe** : `sara123`
- **Rôle** : `conseiller_cop` (même que Abdelhamid Inajjaren)

## ✅ Solution : Création via Script Node.js

Puisque l'interface Supabase ne fonctionne pas et que l'email n'existe pas réellement, nous allons créer l'utilisateur directement via l'API Supabase avec un script.

### ÉTAPE 1 : Vérifier les variables d'environnement

Assurez-vous que votre fichier `.env.local` contient :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

⚠️ **Important** : La `SUPABASE_SERVICE_ROLE_KEY` est nécessaire pour créer des utilisateurs via l'API Admin.

### ÉTAPE 2 : Exécuter le script

Dans le terminal, à la racine du projet :

```bash
node create_sara_via_api.js
```

Le script va :
1. ✅ Vérifier si l'utilisateur existe déjà
2. ✅ Créer l'utilisateur dans Supabase Auth
3. ✅ Créer le profil dans la table `profiles`
4. ✅ Vérifier que tout est correct

### ÉTAPE 3 : Vérifier la création

Après l'exécution du script, vérifiez dans Supabase :

```sql
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.nom,
  p.prenom,
  p.role,
  p.actif
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'sara@cop.com';
```

### ÉTAPE 4 : Tester la connexion

1. Allez sur votre application en local : `http://localhost:3000/login`
2. Connectez-vous avec :
   - Email : `sara@cop.com`
   - Mot de passe : `sara123`
3. Vérifiez que les permissions sont correctes (même que Abdelhamid Inajjaren)

## 🔍 Si le script échoue

### Erreur : "Variables d'environnement manquantes"
- Vérifiez que `.env.local` contient bien `SUPABASE_SERVICE_ROLE_KEY`
- Cette clé se trouve dans : Supabase Dashboard → Settings → API → Service Role Key

### Erreur : "Erreur lors de la création de l'utilisateur Auth"
- Vérifiez que la Service Role Key est correcte
- Vérifiez que l'utilisateur n'existe pas déjà

### Erreur : "Erreur lors de la création du profil"
- Vérifiez que le rôle `conseiller_cop` est bien dans la contrainte `profiles_role_check`
- Vérifiez les logs Supabase pour plus de détails

## 📝 Notes importantes

- Le script utilise la **Service Role Key** qui a tous les droits
- L'utilisateur sera créé avec l'email confirmé automatiquement
- Le profil sera créé avec le rôle `conseiller_cop`
- Les permissions seront automatiquement appliquées (même que Abdelhamid Inajjaren)

