'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Mail, 
  Save, 
  Send, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

export default function NotificationsEmailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [config, setConfig] = useState({
    enabled: true,
    subject: 'Nouvelle demande entreprise à traiter',
    message: `Bonjour,

Une nouvelle demande d'entreprise a été enregistrée dans le système COP.

Entreprise : {nom_entreprise}
Contact : {nom_contact}
Email : {email}
Téléphone : {telephone}
Type de demande : {type_demande}

Lien : {lien}

Cordialement,
Notification automatique - Système COP`,
    recipient_emails: ['omar.oumouzoune@ofppt.ma']
  })

  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('email_notifications_config')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setConfig({
          enabled: data.enabled,
          subject: data.subject,
          message: data.message,
          recipient_emails: data.recipient_emails || []
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
        .from('email_notifications_config')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001',
          enabled: config.enabled,
          subject: config.subject,
          message: config.message,
          recipient_emails: config.recipient_emails,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'Configuration sauvegardée avec succès !' })
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setMessage(null)

    try {
      const { sendTestEmail } = await import('@/lib/email')
      
      await sendTestEmail({
        id: 'test',
        nom_entreprise: 'TEST - Entreprise de test',
        nom_contact: 'TEST - Contact test',
        email: 'test@example.com',
        telephone: '0612345678',
        type_demande: 'CV',
        config: {
          enabled: config.enabled,
          subject: config.subject,
          message: config.message,
          recipient_emails: config.recipient_emails
        }
      })

      setMessage({ type: 'success', text: 'Email de test envoyé avec succès !' })
    } catch (error) {
      console.error('Erreur test:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'envoi de l\'email de test' })
    } finally {
      setTesting(false)
    }
  }

  const addEmail = () => {
    if (newEmail && !config.recipient_emails.includes(newEmail)) {
      setConfig({
        ...config,
        recipient_emails: [...config.recipient_emails, newEmail]
      })
      setNewEmail('')
    }
  }

  const removeEmail = (email: string) => {
    setConfig({
      ...config,
      recipient_emails: config.recipient_emails.filter(e => e !== email)
    })
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications Email</h1>
        <p className="text-gray-600">Configurez les notifications automatiques pour les nouvelles demandes d'entreprises</p>
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
            <p className="text-sm text-gray-600">Envoyer des emails automatiques pour les nouvelles demandes</p>
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
            placeholder="Ex: Nouvelle demande entreprise à traiter"
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
            rows={12}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="Contenu de l'email..."
          />
          <p className="mt-2 text-xs text-gray-500">
            Variables disponibles : {'{nom_entreprise}'}, {'{nom_contact}'}, {'{email}'}, {'{telephone}'}, {'{type_demande}'}, {'{lien}'}
          </p>
        </div>

        {/* Emails destinataires */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emails destinataires
          </label>
          
          {/* Liste des emails */}
          <div className="space-y-2 mb-3">
            {config.recipient_emails.map((email, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="flex-1 text-sm">{email}</span>
                <button
                  onClick={() => removeEmail(email)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Ajouter un email */}
          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addEmail()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="email@example.com"
            />
            <button
              onClick={addEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
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

