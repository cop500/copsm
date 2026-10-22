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
  ToggleRight,
  ArrowLeft,
} from 'lucide-react'
import {
  DEFAULT_JPO_EMAIL_MESSAGE,
  DEFAULT_JPO_EMAIL_SUBJECT,
  JPO_EMAIL_CONFIG_ID,
} from '@/lib/email-config'

export default function NotificationsJpoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [config, setConfig] = useState({
    enabled: true,
    subject: DEFAULT_JPO_EMAIL_SUBJECT,
    message: DEFAULT_JPO_EMAIL_MESSAGE,
    recipient_emails: [
      'omar.oumouzoune@ofppt.ma',
      'abdelhamid.inajjaren@ofppt.ma',
      'sara.hanzaze@ofppt.ma',
    ],
  })

  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('email_notifications_jpo_config')
        .select('*')
        .eq('id', JPO_EMAIL_CONFIG_ID)
        .maybeSingle()

      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        throw error
      }

      if (data) {
        const recipients = Array.isArray(data.recipient_emails)
          ? data.recipient_emails
          : []
        setConfig({
          enabled: Boolean(data.enabled),
          subject: String(data.subject || DEFAULT_JPO_EMAIL_SUBJECT),
          message: String(data.message || DEFAULT_JPO_EMAIL_MESSAGE),
          recipient_emails: recipients.map((email: string) => String(email)),
        })
      }
    } catch (error) {
      console.error('Erreur chargement config JPO:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase.from('email_notifications_jpo_config').upsert({
        id: JPO_EMAIL_CONFIG_ID,
        enabled: config.enabled,
        subject: config.subject,
        message: config.message,
        recipient_emails: config.recipient_emails,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Configuration JPO sauvegardée avec succès !' })
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      setMessage({
        type: 'error',
        text: 'Erreur lors de la sauvegarde. Exécutez d’abord le script SQL de la table JPO.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setMessage(null)

    try {
      const { sendTestJpoEmail } = await import('@/lib/email')
      const result = await sendTestJpoEmail({
        nom_prenom: 'TEST Contact',
        telephone: '0612345678',
        email: 'test@example.com',
        fonction: 'Conseiller orientation',
        etablissement: 'Lycée de test',
        date_visite: '2027-04-15',
        creneau: '09:00-12:00',
        nombre_participants: 25,
        nombre_accompagnateurs: 2,
        config: {
          id: JPO_EMAIL_CONFIG_ID,
          enabled: config.enabled,
          subject: config.subject,
          message: config.message,
          recipient_emails: config.recipient_emails,
        },
      })

      if (!result.success) {
        throw new Error(result.reason)
      }

      setMessage({ type: 'success', text: 'Email de test envoyé aux conseillers configurés !' })
    } catch (error) {
      console.error('Erreur test:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l’envoi de l’email de test' })
    } finally {
      setTesting(false)
    }
  }

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase()
    if (email && email.includes('@') && !config.recipient_emails.includes(email)) {
      setConfig({
        ...config,
        recipient_emails: [...config.recipient_emails, email],
      })
      setNewEmail('')
    }
  }

  const removeEmail = (email: string) => {
    setConfig({
      ...config,
      recipient_emails: config.recipient_emails.filter((item) => item !== email),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <button
        type="button"
        onClick={() => router.push('/parametres')}
        className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux paramètres
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications visites JPO</h1>
        <p className="text-gray-600">
          Emails envoyés uniquement aux conseillers COP lorsqu’une demande de visite est déposée. Le lycée ne reçoit pas d’email.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-semibold text-gray-900">Activer les notifications</h3>
            <p className="text-sm text-gray-600">Envoyer un email aux conseillers pour chaque nouvelle demande JPO</p>
          </div>
          <button type="button" onClick={() => setConfig({ ...config, enabled: !config.enabled })} className="flex items-center gap-2">
            {config.enabled ? (
              <ToggleRight className="w-12 h-12 text-green-600" />
            ) : (
              <ToggleLeft className="w-12 h-12 text-gray-400" />
            )}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sujet de l&apos;email</label>
          <input
            type="text"
            value={config.subject}
            onChange={(e) => setConfig({ ...config, subject: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Message de l&apos;email</label>
          <textarea
            value={config.message}
            onChange={(e) => setConfig({ ...config, message: e.target.value })}
            rows={14}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
          />
          <p className="mt-2 text-xs text-gray-500">
            Variables : {'{etablissement}'}, {'{nom_prenom}'}, {'{fonction}'}, {'{email}'}, {'{telephone}'},{' '}
            {'{date_visite}'}, {'{creneau}'}, {'{nombre_participants}'}, {'{nombre_accompagnateurs}'}, {'{lien}'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Emails des conseillers destinataires</label>
          <div className="space-y-2 mb-3">
            {config.recipient_emails.map((email) => (
              <div key={email} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="flex-1 text-sm">{email}</span>
                <button type="button" onClick={() => removeEmail(email)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addEmail()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="email.conseiller@ofppt.ma"
            />
            <button
              type="button"
              onClick={addEmail}
              className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-teal-700 text-white rounded-lg hover:bg-teal-800 flex items-center justify-center gap-2 disabled:opacity-50"
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
            type="button"
            onClick={handleTest}
            disabled={testing || !config.enabled}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Tester l&apos;envoi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
