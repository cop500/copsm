'use client'

import React, { useState } from 'react'
import { Send, FileText } from 'lucide-react'

export default function TestOngletsPage() {
  const [activeTab, setActiveTab] = useState('candidatures')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test des Onglets</h1>
        
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('candidatures')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'candidatures'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5" />
                <span>Candidatures reçues</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('cv-connect')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cv-connect'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>CV Connect</span>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  Nouveau
                </span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'candidatures' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Candidatures reçues</h2>
            <p className="text-gray-600">Contenu de l'onglet Candidatures reçues</p>
          </div>
        )}

        {activeTab === 'cv-connect' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">CV Connect</h2>
            <p className="text-gray-600">Contenu de l'onglet CV Connect</p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">✅ Les onglets fonctionnent !</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
