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
  ArrowLeft
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
Notification automatique - Système COP`
  })

  useEffect(() => {
    loadConfig()
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
          enabled: data.enabled,
          subject: data.subject,
          message: data.message
        })
      }
    } catch (error) {
      console.error('Erreur chargement config:', error)
    } finally {
      setLoading(false)
    }
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
      
      // Récupérer un email de conseiller pour le test
      let testEmail = 'test@example.com'
      if (config.enabled) {
        const { data } = await supabase
          .from('profiles')
          .select('email, nom, prenom')
          .in('role', ['conseiller_cop', 'conseillere_carriere'])
          .limit(1)
          .single()
        
        if (data?.email) {
          testEmail = data.email
        }
      }
      
      // Créer une demande de test
      const demandeTest = {
        id: 'test',
        nom: 'Test',
        prenom: 'Stagiaire',
        telephone: '0612345678',
        type_assistance: 'orientation',
        statut: 'en_attente',
        conseiller_id: 'test',
        profiles: {
          nom: 'Test',
          prenom: 'Conseiller',
          email: testEmail,
          role: 'conseiller_cop'
        }
      }

      await sendAssistanceAssignmentNotification(demandeTest)

      setMessage({ type: 'success', text: 'Email de test envoyé avec succès !' })
    } catch (error) {
      console.error('Erreur test:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'envoi de l\'email de test' })
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

        {/* Info importante */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Note importante</h4>
              <p className="text-sm text-blue-800">
                Les emails sont envoyés automatiquement au conseiller assigné (l'email est récupéré depuis son profil). 
                Vous n'avez pas besoin de configurer une liste de destinataires ici.
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

