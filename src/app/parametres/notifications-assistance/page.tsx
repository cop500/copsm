'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Mail, 
  Save, 
  Send, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  User,
  X
} from 'lucide-react'

export default function NotificationsAssistancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [config, setConfig] = useState({
    enabled: true,
    subject: 'Nouvelle demande d\'assistance vous a été assignée',
    message: `Bonjour {conseiller_nom},

Une nouvelle demande d'assistance vous a été assignée dans le système COP.

Détails de la demande :
- Stagiaire : {nom_stagiaire}
- Téléphone : {telephone_stagiaire}
- Type d'assistance : {type_assistance}
- Statut : {statut}

Lien pour accéder à la demande : {lien}

Cordialement,
Notification automatique - Système COP`,
    recipient_emails: {} as Record<string, string>
  })

  const [conseillers, setConseillers] = useState<Array<{
    id: string
    nom: string
    prenom: string
    email: string
    role: string
  }>>([])

  useEffect(() => {
    loadConfig()
    loadConseillers()
  }, [])

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('email_notifications_assistance_config')
        .select('*')
        .single()

      // Si la table n'existe pas (code 42P01) ou aucune ligne (PGRST116), utiliser les valeurs par défaut
      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.log('⚠️ Table non trouvée ou vide, utilisation des valeurs par défaut')
          // Garder les valeurs par défaut déjà définies dans useState
        } else {
          console.error('Erreur chargement config:', error)
        }
      } else if (data) {
        setConfig({
          enabled: Boolean(data.enabled),
          subject: String(data.subject || ''),
          message: String(data.message || ''),
          recipient_emails: (data.recipient_emails || {}) as Record<string, string>
        })
      }
    } catch (error) {
      console.error('Erreur chargement config:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConseillers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nom, prenom, email, role')
        .in('role', ['conseiller_cop', 'conseillere_carriere'])
        .eq('actif', true)
        .order('nom')

      if (error) {
        console.error('Erreur chargement conseillers:', error)
      } else if (data) {
        setConseillers(data.map((c: any) => ({
          id: String(c.id),
          nom: String(c.nom || ''),
          prenom: String(c.prenom || ''),
          email: String(c.email || ''),
          role: String(c.role || '')
        })))
      }
    } catch (error) {
      console.error('Erreur chargement conseillers:', error)
    }
  }

  const updateRecipientEmail = (conseillerId: string, email: string) => {
    setConfig({
      ...config,
      recipient_emails: {
        ...config.recipient_emails,
        [conseillerId]: email.trim()
      }
    })
  }

  const removeRecipientEmail = (conseillerId: string) => {
    const newRecipients = { ...config.recipient_emails }
    delete newRecipients[conseillerId]
    setConfig({
      ...config,
      recipient_emails: newRecipients
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('email_notifications_assistance_config')
        .upsert({
          id: '00000000-0000-0000-0000-000000000002',
          enabled: config.enabled,
          subject: config.subject,
          message: config.message,
          recipient_emails: config.recipient_emails,
          updated_at: new Date().toISOString()
        })

      if (error) {
        if (error.code === '42P01') {
          setMessage({ 
            type: 'error', 
            text: 'La table n\'existe pas encore. Veuillez exécuter la migration SQL dans Supabase.' 
          })
        } else {
          throw error
        }
        return
      }

      setMessage({ type: 'success', text: 'Configuration sauvegardée avec succès !' })
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erreur lors de la sauvegarde. Vérifiez que la migration SQL a été exécutée.' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setMessage(null)

    try {
      const { sendAssistanceAssignmentNotification } = await import('@/lib/email')
      
      // Récupérer le premier conseiller disponible pour le test
      const { data: conseillerData } = await supabase
        .from('profiles')
        .select('id, email, nom, prenom, role')
        .in('role', ['conseiller_cop', 'conseillere_carriere'])
        .eq('actif', true)
        .limit(1)
        .single()
      
      if (!conseillerData) {
        setMessage({ type: 'error', text: 'Aucun conseiller trouvé pour le test' })
        return
      }
      
      // Vérifier si un email est configuré manuellement pour ce conseiller
      const conseillerId = String(conseillerData.id)
      const emailConfigure = config.recipient_emails[conseillerId]
      const emailTest = emailConfigure || String(conseillerData.email || '')
      
      console.log('🧪 Test email - Conseiller ID:', conseillerData.id)
      console.log('🧪 Test email - Email configuré manuellement:', emailConfigure || 'Aucun')
      console.log('🧪 Test email - Email du profil:', conseillerData.email)
      console.log('🧪 Test email - Email final utilisé:', emailTest)
      
      // Créer une demande de test avec le vrai conseiller
      const demandeTest = {
        id: 'test-' + Date.now(),
        nom: 'Test',
        prenom: 'Stagiaire',
        telephone: '0612345678',
        type_assistance: 'orientation',
        statut: 'en_attente',
        conseiller_id: conseillerId, // Utiliser le vrai ID du conseiller
        profiles: {
          nom: String(conseillerData.nom || ''),
          prenom: String(conseillerData.prenom || ''),
          email: String(conseillerData.email || ''), // Email du profil (sera remplacé par l'email configuré si disponible)
          role: String(conseillerData.role || '')
        }
      }

      await sendAssistanceAssignmentNotification(demandeTest)

      setMessage({ 
        type: 'success', 
        text: `Email de test envoyé avec succès à ${emailTest} !` 
      })
    } catch (error: any) {
      console.error('Erreur test:', error)
      setMessage({ 
        type: 'error', 
        text: `Erreur lors de l'envoi de l'email de test: ${error.message || 'Erreur inconnue'}` 
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications Email - Demandes d'Assistance</h1>
        <p className="text-gray-600">Configurez les notifications automatiques pour les demandes d'assistance assignées aux conseillers</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Activer/Désactiver */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-semibold text-gray-900">Activer les notifications</h3>
            <p className="text-sm text-gray-600">Envoyer des emails automatiques aux conseillers lorsqu'une demande leur est assignée</p>
          </div>
          <button
            onClick={() => setConfig({ ...config, enabled: !config.enabled })}
            className="flex items-center gap-2"
          >
            {config.enabled ? (
              <ToggleRight className="w-12 h-12 text-green-600" />
            ) : (
              <ToggleLeft className="w-12 h-12 text-gray-400" />
            )}
          </button>
        </div>

        {/* Sujet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sujet de l'email
          </label>
          <input
            type="text"
            value={config.subject}
            onChange={(e) => setConfig({ ...config, subject: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Nouvelle demande d'assistance vous a été assignée"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message de l'email
          </label>
          <textarea
            value={config.message}
            onChange={(e) => setConfig({ ...config, message: e.target.value })}
            rows={15}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="Contenu de l'email..."
          />
          <p className="mt-2 text-xs text-gray-500">
            Variables disponibles : {'{conseiller_nom}'}, {'{nom_stagiaire}'}, {'{telephone_stagiaire}'}, {'{type_assistance}'}, {'{statut}'}, {'{lien}'}
          </p>
        </div>

        {/* Configuration des emails des destinataires */}
        <div className="border-t border-gray-200 pt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuration des emails des destinataires</h3>
            <p className="text-sm text-gray-600">
              Configurez manuellement l'adresse email de chaque conseiller pour les notifications. 
              Si aucun email n'est configuré, l'email du profil sera utilisé.
            </p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {conseillers.map((conseiller) => {
              const configuredEmail = config.recipient_emails[conseiller.id] || ''
              const displayEmail = configuredEmail || conseiller.email || 'Non configuré'
              const isConfigured = !!config.recipient_emails[conseiller.id]

              return (
                <div
                  key={conseiller.id}
                  className={`p-4 rounded-lg border ${
                    isConfigured
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {conseiller.prenom} {conseiller.nom}
                          </h4>
                          <p className="text-xs text-gray-500 capitalize">
                            {conseiller.role.replace('_', ' ')}
                          </p>
                        </div>
                        {isConfigured && (
                          <button
                            onClick={() => removeRecipientEmail(conseiller.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Supprimer l'email configuré"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Email du profil
                          </label>
                          <p className="text-sm text-gray-600 bg-white px-3 py-2 rounded border border-gray-200">
                            {conseiller.email || 'Non défini'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Email configuré manuellement
                          </label>
                          <input
                            type="email"
                            value={configuredEmail}
                            onChange={(e) => updateRecipientEmail(conseiller.id, e.target.value)}
                            placeholder="Entrez l'email à utiliser pour les notifications"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                          {isConfigured && (
                            <p className="mt-1 text-xs text-blue-600">
                              ✓ Email personnalisé configuré
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {conseillers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Aucun conseiller trouvé</p>
            </div>
          )}
        </div>

        {/* Info importante */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Note importante</h4>
              <p className="text-sm text-blue-800">
                Si un email est configuré manuellement pour un conseiller, cet email sera utilisé pour les notifications. 
                Sinon, l'email du profil du conseiller sera utilisé automatiquement.
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Enregistrer
              </>
            )}
          </button>

          <button
            onClick={handleTest}
            disabled={testing || !config.enabled}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Tester l'envoi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

