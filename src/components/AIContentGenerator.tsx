'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  FileText, 
  MessageSquare, 
  Zap, 
  Users, 
  Clock, 
  Target, 
  ThumbsUp, 
  AlertTriangle,
  CheckCircle,
  Star,
  Hash,
  Send,
  Save
} from 'lucide-react';
import { useRapports } from '@/hooks/useRapports';

interface AIContentFields {
  // Champs communs
  participants: number;
  duree: string;
  objectifs: boolean;
  retourParticipants: 'excellent' | 'bon' | 'moyen' | 'faible';
  problemes: string;
  succes: string;
  
  // Champs spécifiques au compte-rendu
  pointsCles: string;
  intervenants: string;
  decisions: string;
  actionsSuivantes: string;
  
  // Champs spécifiques au flash-info
  titreAccrocheur: string;
  messagePrincipal: string;
  hashtags: string;
  callToAction: string;
  publicCible: string;
}

interface AIContentGeneratorProps {
  eventId: string;
  eventTitle: string;
  eventData?: {
    titre: string;
    description: string;
    lieu: string;
    date_debut: string;
    date_fin?: string;
    responsable_cop?: string;
    statut: string;
    photos_urls?: string[];
    event_types?: {
      nom: string;
      couleur: string;
    };
  };
  onContentGenerated: (content: string) => void;
}

export default function AIContentGenerator({ 
  eventId, 
  eventTitle, 
  eventData,
  onContentGenerated 
}: AIContentGeneratorProps) {
  const [contentType, setContentType] = useState<'rapport' | 'compte-rendu' | 'flash-info'>('rapport');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [titreRapport, setTitreRapport] = useState('');
  const [fields, setFields] = useState<AIContentFields>({
    participants: 0,
    duree: '',
    objectifs: false,
    retourParticipants: 'bon',
    problemes: '',
    succes: '',
    pointsCles: '',
    intervenants: '',
    decisions: '',
    actionsSuivantes: '',
    titreAccrocheur: '',
    messagePrincipal: '',
    hashtags: '',
    callToAction: '',
    publicCible: ''
  });

  // Hook pour gérer les rapports
  const { saveRapport } = useRapports(eventId);

  const handleFieldChange = (field: keyof AIContentFields, value: any) => {
    setFields(prev => ({ ...prev, [field]: value }));
  };

  const generateContent = async () => {
    console.log('🚀 Début de la génération de contenu');
    setIsGenerating(true);
    
    try {
      // Simulation de génération IA (à remplacer par l'appel réel à Claude)
      const prompt = buildPrompt();
      console.log('📝 Prompt généré:', prompt);
      
      // TODO: Intégrer l'API Claude ici
      console.log('🤖 Début de la simulation IA...');
      const generatedContent = await simulateAIGeneration(prompt);
      console.log('✅ Contenu généré avec succès, longueur:', generatedContent.length);
      
      // Afficher le contenu généré immédiatement
      console.log('📤 Envoi du contenu au parent...');
      onContentGenerated(generatedContent);
      
      // Sauvegarder automatiquement le rapport (en arrière-plan)
      try {
        console.log('💾 Début de la sauvegarde...');
        await saveGeneratedRapport(generatedContent);
        console.log('✅ Sauvegarde terminée');
      } catch (saveError) {
        console.error('❌ Erreur lors de la sauvegarde:', saveError);
        // La sauvegarde a échoué mais le contenu est déjà affiché
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération:', error);
      // En cas d'erreur, on ne ferme pas le modal pour permettre à l'utilisateur de réessayer
    } finally {
      console.log('🏁 Fin de la génération, isGenerating = false');
      setIsGenerating(false);
    }
  };

  const saveGeneratedRapport = async (content: string) => {
    if (!eventId) return;

    setIsSaving(true);
    try {
      const titre = titreRapport || `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} - ${eventTitle}`;
      
      const result = await saveRapport({
        evenement_id: eventId,
        type_rapport: contentType,
        contenu: content,
        titre_rapport: titre
      });

      if (result.success) {
        console.log('Rapport sauvegardé avec succès');
      } else {
        console.error('Erreur sauvegarde rapport:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const buildPrompt = () => {
    const basePrompt = `Génère un ${contentType} pour l'événement "${eventTitle}" avec les informations suivantes:`;
    
    switch (contentType) {
      case 'rapport':
        return `${basePrompt}
- Nombre de participants: ${fields.participants}
- Durée: ${fields.duree}
- Objectifs atteints: ${fields.objectifs ? 'Oui' : 'Non'}
- Retour participants: ${fields.retourParticipants}
- Problèmes rencontrés: ${fields.problemes}
- Succès: ${fields.succes}`;
      
      case 'compte-rendu':
        return `${basePrompt}
- Points clés: ${fields.pointsCles}
- Intervenants: ${fields.intervenants}
- Décisions prises: ${fields.decisions}
- Actions à suivre: ${fields.actionsSuivantes}`;
      
      case 'flash-info':
        return `${basePrompt}
- Titre accrocheur: ${fields.titreAccrocheur}
- Message principal: ${fields.messagePrincipal}
- Hashtags: ${fields.hashtags}
- Call-to-action: ${fields.callToAction}
- Public cible: ${fields.publicCible}`;
    }
  };

  const simulateAIGeneration = async (prompt: string): Promise<string> => {
    console.log('⏳ Début de la simulation IA (2 secondes)...');
    
    // Simulation - à remplacer par l'appel réel à Claude
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('⏳ Simulation terminée, génération du contenu...');
    
    // Générer du contenu réaliste basé sur les données de l'événement
    const eventInfo = eventData ? `
Événement: ${eventData.titre}
Description: ${eventData.description}
Lieu: ${eventData.lieu}
Date: ${new Date(eventData.date_debut).toLocaleDateString('fr-FR')}
Responsable: ${eventData.responsable_cop || 'Non spécifié'}
Type: ${eventData.event_types?.nom || 'Non spécifié'}
Statut: ${eventData.statut}
Photos: ${eventData.photos_urls?.length || 0} photo(s)
` : '';

    const baseContent = `${eventInfo}\n\nInformations fournies:\n${prompt}`;
    
    let result: string;
    switch (contentType) {
      case 'rapport':
        result = generateRapportContent(baseContent);
        break;
      case 'compte-rendu':
        result = generateCompteRenduContent(baseContent);
        break;
      case 'flash-info':
        result = generateFlashInfoContent(baseContent);
        break;
      default:
        result = baseContent;
    }
    
    console.log('✅ Contenu généré, type:', contentType, 'longueur:', result.length);
    return result;
  };

  const generateRapportContent = (baseContent: string): string => {
    const rapport = `📊 RAPPORT DÉTAILLÉ - ${eventData?.titre || eventTitle}

${baseContent}

📈 ANALYSE DE L'ÉVÉNEMENT

🎯 Objectifs et résultats:
• Objectifs atteints: ${fields.objectifs ? '✅ Oui' : '❌ Non'}
• Nombre de participants: ${fields.participants} personne(s)
• Durée de l'événement: ${fields.duree}

📊 Évaluation des participants:
• Retour global: ${fields.retourParticipants.toUpperCase()}
• Satisfaction: ${getSatisfactionLevel(fields.retourParticipants)}

📝 Points forts:
${fields.succes || '• Événement bien organisé\n• Participation active\n• Objectifs atteints'}

⚠️ Problèmes rencontrés:
${fields.problemes || '• Aucun problème majeur signalé'}

💡 Recommandations:
• Maintenir le niveau de qualité
• Améliorer la communication pré-événement
• Planifier des événements similaires

📸 Photos: ${eventData?.photos_urls?.length || 0} photo(s) disponibles
`;

    return rapport;
  };

  const generateCompteRenduContent = (baseContent: string): string => {
    const compteRendu = `📋 COMPTE-RENDU - ${eventData?.titre || eventTitle}

${baseContent}

📌 POINTS CLÉS ABORDÉS:
${fields.pointsCles || '• Présentation du projet\n• Échanges avec les participants\n• Questions et réponses'}

👥 INTERVENANTS PRÉSENTS:
${fields.intervenants || eventData?.responsable_cop || '• Responsable COP\n• Participants'}

✅ DÉCISIONS PRISES:
${fields.decisions || '• Validation du projet\n• Planification des prochaines étapes'}

📅 ACTIONS À SUIVRE:
${fields.actionsSuivantes || '• Suivi des décisions\n• Communication des résultats\n• Préparation du prochain événement'}

📸 Documentation: ${eventData?.photos_urls?.length || 0} photo(s) prises
`;

    return compteRendu;
  };

  const generateFlashInfoContent = (baseContent: string): string => {
    const flashInfo = `⚡ FLASH INFO - ${eventData?.titre || eventTitle}

${baseContent}

🎯 TITRE ACCROCHEUR:
${fields.titreAccrocheur || `"${eventData?.titre || eventTitle} - Un succès !"`}

📢 MESSAGE PRINCIPAL:
${fields.messagePrincipal || `L'événement "${eventData?.titre || eventTitle}" s'est déroulé avec succès avec ${fields.participants} participants.`}

🏷️ HASHTAGS:
${fields.hashtags || '#COP #CMC #Événement #Succès'}

📞 CALL-TO-ACTION:
${fields.callToAction || 'Inscrivez-vous au prochain événement !'}

🎯 PUBLIC CIBLE:
${fields.publicCible || 'Étudiants, professionnels, entreprises'}

📸 Photos disponibles: ${eventData?.photos_urls?.length || 0} cliché(s)
`;

    return flashInfo;
  };

  const getSatisfactionLevel = (level: string): string => {
    switch (level) {
      case 'excellent': return '⭐⭐⭐⭐⭐ (5/5)';
      case 'bon': return '⭐⭐⭐⭐ (4/5)';
      case 'moyen': return '⭐⭐⭐ (3/5)';
      case 'faible': return '⭐⭐ (2/5)';
      default: return '⭐⭐⭐ (3/5)';
    }
  };

  const renderCommonFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="participants">Nombre de participants</Label>
          <Input
            id="participants"
            type="number"
            value={fields.participants}
            onChange={(e) => handleFieldChange('participants', parseInt(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="duree">Durée de l'événement</Label>
          <Input
            id="duree"
            value={fields.duree}
            onChange={(e) => handleFieldChange('duree', e.target.value)}
            placeholder="ex: 2h30"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="objectifs">Objectifs atteints</Label>
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="checkbox"
              id="objectifs"
              checked={fields.objectifs}
              onChange={(e) => handleFieldChange('objectifs', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="objectifs" className="text-sm">Les objectifs ont été atteints</Label>
          </div>
        </div>
        <div>
          <Label htmlFor="retourParticipants">Retour des participants</Label>
          <select
            id="retourParticipants"
            value={fields.retourParticipants}
            onChange={(e) => handleFieldChange('retourParticipants', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="excellent">Excellent</option>
            <option value="bon">Bon</option>
            <option value="moyen">Moyen</option>
            <option value="faible">Faible</option>
          </select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="problemes">Problèmes rencontrés</Label>
        <Textarea
          id="problemes"
          value={fields.problemes}
          onChange={(e) => handleFieldChange('problemes', e.target.value)}
          placeholder="Décrivez les problèmes rencontrés..."
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor="succes">Succès de l'événement</Label>
        <Textarea
          id="succes"
          value={fields.succes}
          onChange={(e) => handleFieldChange('succes', e.target.value)}
          placeholder="Décrivez les succès de l'événement..."
          rows={3}
        />
      </div>
    </div>
  );

  const renderCompteRenduFields = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="pointsCles">Points clés abordés</Label>
        <Textarea
          id="pointsCles"
          value={fields.pointsCles}
          onChange={(e) => handleFieldChange('pointsCles', e.target.value)}
          placeholder="Listez les points clés abordés..."
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor="intervenants">Intervenants présents</Label>
        <Textarea
          id="intervenants"
          value={fields.intervenants}
          onChange={(e) => handleFieldChange('intervenants', e.target.value)}
          placeholder="Listez les intervenants..."
          rows={2}
        />
      </div>
      
      <div>
        <Label htmlFor="decisions">Décisions prises</Label>
        <Textarea
          id="decisions"
          value={fields.decisions}
          onChange={(e) => handleFieldChange('decisions', e.target.value)}
          placeholder="Listez les décisions prises..."
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor="actionsSuivantes">Actions à suivre</Label>
        <Textarea
          id="actionsSuivantes"
          value={fields.actionsSuivantes}
          onChange={(e) => handleFieldChange('actionsSuivantes', e.target.value)}
          placeholder="Listez les actions à suivre..."
          rows={3}
        />
      </div>
    </div>
  );

  const renderFlashInfoFields = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="titreAccrocheur">Titre accrocheur</Label>
        <Input
          id="titreAccrocheur"
          value={fields.titreAccrocheur}
          onChange={(e) => handleFieldChange('titreAccrocheur', e.target.value)}
          placeholder="Titre court et percutant..."
        />
      </div>
      
      <div>
        <Label htmlFor="messagePrincipal">Message principal (max 140 caractères)</Label>
        <Textarea
          id="messagePrincipal"
          value={fields.messagePrincipal}
          onChange={(e) => handleFieldChange('messagePrincipal', e.target.value)}
          placeholder="Message principal de l'événement..."
          rows={2}
          maxLength={140}
        />
        <div className="text-sm text-gray-500 mt-1">
          {fields.messagePrincipal.length}/140 caractères
        </div>
      </div>
      
      <div>
        <Label htmlFor="hashtags">Hashtags pertinents</Label>
        <Input
          id="hashtags"
          value={fields.hashtags}
          onChange={(e) => handleFieldChange('hashtags', e.target.value)}
          placeholder="#COP #CMC #Événement..."
        />
      </div>
      
      <div>
        <Label htmlFor="callToAction">Call-to-action</Label>
        <Input
          id="callToAction"
          value={fields.callToAction}
          onChange={(e) => handleFieldChange('callToAction', e.target.value)}
          placeholder="ex: Inscrivez-vous au prochain événement..."
        />
      </div>
      
      <div>
        <Label htmlFor="publicCible">Public cible</Label>
        <Input
          id="publicCible"
          value={fields.publicCible}
          onChange={(e) => handleFieldChange('publicCible', e.target.value)}
          placeholder="ex: Étudiants, Professionnels, Entreprises..."
        />
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Générateur de contenu IA
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Sélection du type de contenu */}
        <div>
          <Label className="text-base font-medium">Type de contenu à générer</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <Button
              variant={contentType === 'rapport' ? 'default' : 'outline'}
              onClick={() => setContentType('rapport')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Rapport détaillé
            </Button>
            <Button
              variant={contentType === 'compte-rendu' ? 'default' : 'outline'}
              onClick={() => setContentType('compte-rendu')}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Compte-rendu
            </Button>
            <Button
              variant={contentType === 'flash-info' ? 'default' : 'outline'}
              onClick={() => setContentType('flash-info')}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Flash info
            </Button>
          </div>
        </div>

        {/* Titre du rapport */}
        <div className="border-t pt-6">
          <div className="mb-4">
            <Label htmlFor="titreRapport">Titre du rapport (optionnel)</Label>
            <Input
              id="titreRapport"
              value={titreRapport}
              onChange={(e) => setTitreRapport(e.target.value)}
              placeholder={`ex: ${contentType.charAt(0).toUpperCase() + contentType.slice(1)} - ${eventTitle}`}
            />
          </div>
        </div>

        {/* Champs dynamiques selon le type */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">
            {contentType === 'rapport' && 'Informations pour le rapport'}
            {contentType === 'compte-rendu' && 'Informations pour le compte-rendu'}
            {contentType === 'flash-info' && 'Informations pour le flash info'}
          </h3>
          
          {renderCommonFields()}
          
          {contentType === 'compte-rendu' && renderCompteRenduFields()}
          {contentType === 'flash-info' && renderFlashInfoFields()}
        </div>

        {/* Bouton de génération */}
        <div className="flex justify-end">
          <Button
            onClick={generateContent}
            disabled={isGenerating || isSaving}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Génération en cours...
              </>
            ) : isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sauvegarde en cours...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Générer et sauvegarder
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 