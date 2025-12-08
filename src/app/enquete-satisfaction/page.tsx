'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EnqueteSatisfactionForm } from '@/components/EnqueteSatisfactionForm'
import { Building2, CheckCircle } from 'lucide-react'
import type { EnqueteSatisfactionFormData } from '@/hooks/useEnqueteSatisfaction'

export default function EnqueteSatisfactionPage() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: EnqueteSatisfactionFormData) => {
    try {
      setError(null)
      
      const { data: newEnquete, error: insertError } = await supabase
        .from('satisfaction_entreprises_jobdating')
        .insert([data])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      setSubmitted(true)
      return { success: true, data: newEnquete }
    } catch (err: any) {
      console.error('Erreur lors de la soumission de l\'enquête:', err)
      const errorMessage = err.message || 'Erreur lors de la soumission de l\'enquête'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const handleSuccess = () => {
    // Optionnel : rediriger ou réinitialiser
    window.location.href = '/enquete-satisfaction?success=true'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            COP CMC SM – Enquête de Satisfaction Entreprises
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            Améliorons Ensemble Nos Services
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-semibold">Erreur</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Message d'information sur la sauvegarde automatique */}
        {!submitted && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-700">
              💾 <strong>Vos données sont sauvegardées automatiquement</strong> - Vous pouvez fermer cette page et revenir plus tard pour continuer
            </p>
          </div>
        )}

        {/* Formulaire */}
        {!submitted && (
          <EnqueteSatisfactionForm
            onSubmit={handleSubmit}
            onSuccess={handleSuccess}
            isPublic={true}
          />
        )}

        {/* Message de succès */}
        {submitted && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-green-900 mb-2">
              Merci pour votre participation !
            </h2>
            <p className="text-green-700">
              Votre enquête a été enregistrée avec succès. Nous apprécions votre retour.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Centre d'Orientation Professionnelle - CMC SM</p>
          <p className="mt-1">Toutes vos réponses sont confidentielles</p>
        </div>
      </div>
    </div>
  )
}

