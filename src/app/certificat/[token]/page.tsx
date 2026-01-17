'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import { generateCertificatPDF } from '@/components/CertificatGenerator'
import { supabase } from '@/lib/supabase'

interface InscriptionData {
  id: string
  stagiaire_nom: string
  certificat_token: string
  present: boolean
  atelier_id: string
  evenements?: {
    titre: string
    date_debut: string
    animateur_nom?: string
  }
}

export default function CertificatPage() {
  const params = useParams()
  const token = params.token as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inscription, setInscription] = useState<InscriptionData | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Token manquant')
      setLoading(false)
      return
    }

    loadInscriptionData()
  }, [token])

  const loadInscriptionData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Charger l'inscription avec les données de l'atelier
      const { data, error: supabaseError } = await supabase
        .from('inscriptions_ateliers')
        .select(`
          id,
          stagiaire_nom,
          certificat_token,
          present,
          atelier_id,
          evenements!atelier_id (
            titre,
            date_debut,
            animateur_nom
          )
        `)
        .eq('certificat_token', token)
        .single()

      if (supabaseError || !data) {
        setError('Certificat non trouvé. Le lien peut être invalide ou expiré.')
        return
      }

      // Vérifier que la présence est validée
      if (!data.present) {
        setError('Votre présence n\'a pas encore été validée pour cet atelier.')
        return
      }

      setInscription(data as unknown as InscriptionData)
    } catch (err: any) {
      console.error('Erreur chargement certificat:', err)
      setError('Une erreur est survenue lors du chargement du certificat.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCertificat = async () => {
    if (!inscription || !inscription.evenements) {
      setError('Données incomplètes pour générer le certificat')
      return
    }

    try {
      setGenerating(true)

      // Générer le PDF
      const pdf = await generateCertificatPDF(
        {
          stagiaire_nom: inscription.stagiaire_nom,
          certificat_token: inscription.certificat_token
        },
        {
          titre: inscription.evenements.titre,
          date_debut: inscription.evenements.date_debut,
          animateur_nom: inscription.evenements.animateur_nom
        }
      )

      if (!pdf) {
        throw new Error('Erreur lors de la génération du certificat')
      }

      // Générer le nom du fichier
      const fileName = `Certificat_${inscription.stagiaire_nom.replace(/\s+/g, '_')}_${inscription.evenements.titre.replace(/\s+/g, '_')}.pdf`

      // Télécharger le PDF
      pdf.save(fileName)
    } catch (err: any) {
      console.error('Erreur génération certificat:', err)
      setError('Erreur lors de la génération du certificat. Veuillez réessayer.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Chargement du certificat...</h2>
          <p className="text-gray-600">Vérification de votre lien de certificat</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  if (!inscription || !inscription.evenements) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Certificat de Participation
          </h1>
          <p className="text-gray-600">
            Votre certificat est prêt à être téléchargé
          </p>
        </div>

        {/* Informations */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informations du certificat
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Participant :</span>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {inscription.stagiaire_nom}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Atelier :</span>
              <p className="text-lg text-gray-900 mt-1">
                {inscription.evenements.titre}
              </p>
            </div>
            {inscription.evenements.date_debut && (
              <div>
                <span className="text-sm font-medium text-gray-600">Date de l'atelier :</span>
                <p className="text-gray-900 mt-1">
                  {new Date(inscription.evenements.date_debut).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
            {inscription.evenements.animateur_nom && (
              <div>
                <span className="text-sm font-medium text-gray-600">Animateur :</span>
                <p className="text-gray-900 mt-1">
                  {inscription.evenements.animateur_nom}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bouton de téléchargement */}
        <div className="text-center">
          <button
            onClick={handleDownloadCertificat}
            disabled={generating}
            className="bg-gradient-to-r from-blue-600 to-orange-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto text-lg font-semibold"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Télécharger mon certificat
              </>
            )}
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Vous pourrez télécharger votre certificat autant de fois que nécessaire
          </p>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Ce certificat est délivré par le Centre d'Orientation Professionnelle CMC SM
          </p>
        </div>
      </div>
    </div>
  )
}

