'use client'

import React, { useState } from 'react'
import { UserCheck, Plus, X } from 'lucide-react'

export default function EntretiensPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-4">Module Entretiens</h1>
          <p className="text-gray-600">Module en développement...</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvel Entretien
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nouvel Entretien</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center py-8">
              <UserCheck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Module en développement</h3>
              <p className="text-gray-600 mb-4">La gestion des entretiens sera développée prochainement.</p>
              <button onClick={() => setShowForm(false)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}