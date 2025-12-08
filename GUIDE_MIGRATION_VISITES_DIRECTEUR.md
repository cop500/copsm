# 🔧 Guide : Résoudre l'affichage des visites pour le directeur

## ❌ Problème
Le directeur ne voit pas les métriques de visites (Total visites, Visites planifiées, Entreprises prioritaires) dans le bilan d'employabilité car il n'a pas les permissions RLS pour lire la table `visites_entreprises`.

## ✅ Solution : Exécuter la migration SQL

### Étape 1 : Accéder à Supabase SQL Editor

1. Connectez-vous à votre projet Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (dans le menu de gauche)

### Étape 2 : Exécuter la migration

1. Cliquez sur **"New query"** (Nouvelle requête)
2. Copiez-collez le contenu du fichier `supabase_migrations/add_directeur_policy_visites_entreprises.sql`
3. Cliquez sur **"Run"** (Exécuter) ou appuyez sur `Ctrl+Enter`

### Étape 3 : Vérifier le résultat

Après l'exécution, vous devriez voir :
- Un message de succès pour la création de la politique

### Étape 4 : Tester dans l'application

1. Rafraîchissez la page du dashboard en tant que directeur
2. Les métriques de visites devraient maintenant s'afficher correctement ✅

## 📋 Fichier de migration

Le fichier à exécuter est : `supabase_migrations/add_directeur_policy_visites_entreprises.sql`

## ⚠️ Note importante

- Cette migration est **idempotente** (peut être exécutée plusieurs fois sans problème)
- La politique permet au directeur de **lire** toutes les visites (pas de modifier/supprimer)
- Les visites seront maintenant visibles dans le bilan d'employabilité pour le directeur

