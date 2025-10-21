'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Send, FileText, Users, Upload, 
  CheckCircle, Clock, AlertCircle,
  Plus, Search, Filter, Download
} from 'lucide-react'

export default function CandidaturePage() {
  const [activeTab, setActiveTab] = useState('demandes')

    return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Candidatures</h1>
            <p className="mt-2 text-gray-600">
              Gestion des demandes d'emploi et des CV des stagiaires
            </p>
          </div>
      </div>
        </div>
        
      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('demandes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'demandes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5" />
                <span>Demandes d'emploi</span>
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
              </div>
              </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-8">
          {activeTab === 'demandes' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Send className="w-6 h-6 text-blue-600" />
            </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total demandes</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>
      </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Traitées</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                  </div>
      </div>
      
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">En attente</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Urgentes</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>
          </div>

              {/* Actions */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Demandes d'emploi</h2>
                  <div className="flex space-x-3">
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <Search className="w-4 h-4 mr-2" />
                      Rechercher
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtrer
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle demande
                    </button>
              </div>
            </div>

                <div className="mt-6 text-center py-12">
                  <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande d'emploi</h3>
                  <p className="text-gray-500 mb-4">Les demandes d'emploi des entreprises apparaîtront ici.</p>
                  <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une demande
                  </button>
                      </div>
                    </div>
                  </div>
                )}

          {activeTab === 'cv-connect' && (
            <div className="space-y-6">
              {/* CV Connect Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Permissions actives</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total soumissions</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Nouvelles soumissions</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Traitées</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                    </div>
                  </div>
                </div>

              {/* CV Connect Actions */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">CV Connect</h2>
                  <div className="flex space-x-3">
                    <Link
                      href="/cv-connect/admin"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Gérer les permissions
                    </Link>
                    <Link
                      href="/cv-connect/public"
                      target="_blank"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Formulaire public
                    </Link>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Gestion des permissions */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Users className="w-6 h-6 text-blue-600 mr-3" />
                        <h3 className="text-lg font-medium text-gray-900">Gestion des permissions</h3>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Accordez des permissions aux utilisateurs pour qu'ils puissent consulter les CV des stagiaires.
                      </p>
                      <Link
                        href="/cv-connect/admin"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Accéder à l'administration
                      </Link>
                    </div>

                    {/* Formulaire public */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Upload className="w-6 h-6 text-green-600 mr-3" />
                        <h3 className="text-lg font-medium text-gray-900">Formulaire public</h3>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Lien public pour que les stagiaires puissent déposer leur CV.
                      </p>
                      <Link
                        href="/cv-connect/public"
                        target="_blank"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Voir le formulaire
                      </Link>
              </div>
            </div>
          </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
