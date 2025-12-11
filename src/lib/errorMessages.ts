/**
 * Fonction utilitaire pour traduire les erreurs Supabase en messages utilisateur compréhensibles
 */

export interface SupabaseError {
  message?: string
  code?: string
  details?: string
  hint?: string
}

/**
 * Traduit une erreur Supabase en message utilisateur compréhensible
 */
export function getErrorMessage(error: any): string {
  // Si c'est déjà une string, on la retourne
  if (typeof error === 'string') {
    return error
  }

  // Extraire le message, code, details et hint
  const message = error?.message || error?.error?.message || ''
  const code = error?.code || error?.error?.code || ''
  const details = error?.details || error?.error?.details || ''
  const hint = error?.hint || error?.error?.hint || ''

  // Log détaillé pour le débogage (uniquement en développement)
  if (process.env.NODE_ENV === 'development') {
    console.group('🔍 Détails de l\'erreur Supabase')
    console.error('Message:', message)
    console.error('Code:', code)
    console.error('Details:', details)
    console.error('Hint:', hint)
    console.error('Erreur complète:', error)
    console.groupEnd()
  }

  // Messages d'erreur spécifiques selon le type d'erreur
  if (message.includes('row-level security policy') || message.includes('RLS')) {
    return 'Une erreur de sécurité est survenue. Veuillez réessayer ou contacter le support si le problème persiste.'
  }

  if (message.includes('duplicate key') || message.includes('unique constraint')) {
    return 'Cette information existe déjà dans notre base de données. Veuillez vérifier vos données.'
  }

  if (message.includes('foreign key constraint') || message.includes('violates foreign key')) {
    return 'Une référence invalide a été détectée. Veuillez vérifier vos données.'
  }

  if (message.includes('not null constraint') || message.includes('null value')) {
    return 'Certains champs obligatoires sont manquants. Veuillez remplir tous les champs requis.'
  }

  if (message.includes('invalid input') || message.includes('invalid value')) {
    return 'Certaines valeurs saisies sont invalides. Veuillez vérifier vos données.'
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return 'Une erreur de connexion est survenue. Vérifiez votre connexion internet et réessayez.'
  }

  if (message.includes('JWT') || message.includes('token') || message.includes('authentication')) {
    return 'Une erreur d\'authentification est survenue. Veuillez rafraîchir la page et réessayer.'
  }

  // Si on a un message mais qu'il est trop technique, on le simplifie
  if (message && message.length > 0) {
    // Si le message contient des codes techniques, on le remplace
    if (message.includes('PGRST') || message.includes('PostgREST')) {
      return 'Une erreur de communication avec le serveur est survenue. Veuillez réessayer dans quelques instants.'
    }

    // Si le message est trop long ou technique, on le simplifie
    if (message.length > 150 || message.includes('ERROR:') || message.includes('SQLSTATE')) {
      return 'Une erreur technique est survenue. Veuillez réessayer ou contacter le support si le problème persiste.'
    }

    // Sinon, on retourne le message tel quel (mais on peut le nettoyer un peu)
    return message
      .replace(/^Error: /i, '')
      .replace(/^ERROR: /i, '')
      .trim()
  }

  // Message par défaut si on ne peut pas identifier l'erreur
  return 'Une erreur inattendue est survenue. Veuillez réessayer ou contacter le support si le problème persiste.'
}

/**
 * Extrait les détails techniques d'une erreur pour le débogage
 */
export function getErrorDetails(error: any): {
  message: string
  code?: string
  details?: string
  hint?: string
  fullError: any
} {
  return {
    message: error?.message || error?.error?.message || 'Erreur inconnue',
    code: error?.code || error?.error?.code,
    details: error?.details || error?.error?.details,
    hint: error?.hint || error?.error?.hint,
    fullError: error
  }
}

