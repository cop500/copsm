'use client'

import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MerciEnquete() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Merci !</h1>
        <p className="text-gray-600 mb-6">
          Votre réponse a été enregistrée avec succès. Votre avis nous aide à améliorer nos formations.
        </p>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  )
}

