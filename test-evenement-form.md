# Test du nouveau formulaire d'événement

## 🎯 Fonctionnalités à tester

### ✅ Design et UX
- [ ] Palette de couleurs bleu/gris/jaune respectée
- [ ] Interface moderne avec coins arrondis et ombres
- [ ] Hiérarchie visuelle claire avec sections
- [ ] Icônes contextuelles (📅, 🕓, 👤, etc.)
- [ ] Responsive design (desktop/mobile)

### ✅ Autosave
- [ ] Sauvegarde automatique dans localStorage
- [ ] Message de statut "Données enregistrées automatiquement"
- [ ] Restauration du brouillon au rechargement
- [ ] Barre de progression du formulaire

### ✅ Validation
- [ ] Validation en temps réel des champs
- [ ] Messages d'erreur clairs
- [ ] Validation progressive (non bloquante)
- [ ] Bouton de sauvegarde désactivé si erreurs

### ✅ Fonctionnalités avancées
- [ ] Recherche d'animateur avec autocomplétion
- [ ] Sections organisées (Informations principales, Détails logistiques, Communication)
- [ ] Champs pour médias (image, vidéo, lien)
- [ ] Notes internes
- [ ] Gestion des capacités et visibilité

### ✅ Accessibilité
- [ ] Navigation clavier fluide
- [ ] Contrastes WCAG AA
- [ ] Labels et descriptions clairs
- [ ] Focus visible

## 🧪 Tests à effectuer

1. **Création d'événement** :
   - Aller sur `/evenements`
   - Cliquer sur "Créer un événement"
   - Remplir le formulaire progressivement
   - Vérifier l'autosave et la barre de progression

2. **Modification d'événement** :
   - Cliquer sur "Modifier" sur un événement existant
   - Vérifier que les données sont pré-remplies
   - Modifier et sauvegarder

3. **Test d'autosave** :
   - Commencer à remplir le formulaire
   - Fermer le navigateur sans sauvegarder
   - Rouvrir et vérifier la restauration du brouillon

4. **Test responsive** :
   - Tester sur différentes tailles d'écran
   - Vérifier l'adaptation mobile

## 🎨 Couleurs utilisées
- Bleu principal : #2563EB
- Bleu foncé : #1E3A8A  
- Gris clair : #E5E7EB
- Jaune accent : #FACC15
- Fond gris : #F5F7FA
