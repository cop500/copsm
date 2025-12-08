# 🔧 Guide : Exécuter les migrations pour le calendrier collaboratif

## ❌ Problème
L'erreur `Could not find the 'animateur_id' column` indique que les colonnes `animateur_id` et `salle` n'ont pas été ajoutées à la table `calendrier_collaboratif` dans Supabase.

## ✅ Solution : Exécuter la migration SQL

### Étape 1 : Accéder à Supabase SQL Editor

1. Connectez-vous à votre projet Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (dans le menu de gauche)

### Étape 2 : Exécuter la migration

1. Cliquez sur **"New query"** (Nouvelle requête)
2. Copiez-collez le contenu du fichier `supabase_migrations/add_animateur_and_salle_to_calendrier.sql`
3. Cliquez sur **"Run"** (Exécuter) ou appuyez sur `Ctrl+Enter`

### Étape 3 : Vérifier le résultat

Après l'exécution, vous devriez voir :
- Un message de succès pour chaque commande `ALTER TABLE`
- Un tableau avec les colonnes `animateur_id` et `salle` dans les résultats de la requête de vérification

### Étape 4 : Tester dans l'application

1. Rafraîchissez la page du calendrier dans votre application
2. Essayez de créer un nouvel événement
3. L'erreur devrait être résolue ✅

## 📋 Fichier de migration

Le fichier à exécuter est : `supabase_migrations/add_animateur_and_salle_to_calendrier.sql`

## ⚠️ Note importante

- Cette migration est **idempotente** (peut être exécutée plusieurs fois sans problème)
- Les colonnes sont **optionnelles** (peuvent être NULL)
- Les index sont créés automatiquement pour améliorer les performances

## 🔍 Vérification manuelle (optionnel)

Si vous voulez vérifier manuellement que les colonnes existent :

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'calendrier_collaboratif'
  AND column_name IN ('animateur_id', 'salle');
```

Vous devriez voir :
- `animateur_id` (type: uuid, nullable: YES)
- `salle` (type: text, nullable: YES)

