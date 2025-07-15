'use client'

import React, { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { supabase } from '@/lib/supabase'
import { Calendar, Plus, X, Save, Edit3, Trash2, Eye, MapPin, Clock } from 'lucide-react'

export const EvenementsModule = () => {
  const { eventTypes } = useSettings()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [evenements, setEvenements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // Charger les événements
  const loadEvenements = async () => {
    try {
      const { data, error } = await supabase
        .from('evenements')
        .select(`
          *,
          event_types(nom, couleur)
        `)
        .order('date_debut', { ascending: false })

      if (error) throw error
      setEvenements(data || [])
    } catch (err: any) {
      console.error('Erreur chargement:', err)
    } finally {
      setLoading(false)
    }
  }

  // Sauvegarder un événement
  const handleSave = async () => {
    console.log('🔥 SAUVEGARDE DÉCLENCHÉE!')
    console.log('📝 Données:', formData)
    
    if (!formData.titre) {
      alert('Titre obligatoire!')
      return
    }

    try {
      const dataToSave = {
        titre: formData.titre,
        type_evenement_id: formData.type_evenement_id,
        date_debut: formData.date_debut,
        lieu: formData.lieu,
        description: formData.description,
        statut: formData.statut || 'planifie',
        responsable_cop: formData.responsable_cop,
        actif: true
      }

      if (formData.id) {
        // Modification
        const { data, error } = await supabase
          .from('evenements')
          .update(dataToSave)
          .eq('id', formData.id)
          .select()

        if (error) throw error
      } else {
        // Création
        const { data, error } = await supabase
          .from('evenements')
          .insert([dataToSave])
          .select()

        if (error) throw error
      }

      alert('Événement sauvegardé!')
      setShowForm(false)
      setFormData({})
      await loadEvenements() // Recharger la liste
    } catch (err: any) {
      console.error('💥 Erreur:', err)
      alert('Erreur: ' + err.message)
    }
  }

  // Supprimer un événement
  const handleDelete = async (id: string, titre: string) => {
    if (!confirm(`Supprimer "${titre}" ?`)) return

    try {
      const { error } = await supabase
        .from('evenements')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      alert('Événement supprimé!')
      await loadEvenements()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  // Modifier un événement
  const handleEdit = (evenement: any) => {
    setFormData(evenement)
    setShowForm(true)
  }

  // Charger au démarrage
  useEffect(() => {
    loadEvenements()
  }, [])

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'planifie': return 'bg-blue-100 text-blue-800'
      case 'en_cours': return 'bg-yellow-100 text-yellow-800'
      case 'termine': return 'bg-green-100 text-green-800'
      case 'annule': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'planifie': return 'Planifié'
      case 'en_cours': return 'En cours'
      case 'termine': return 'Terminé'
      case 'annule': return 'Annulé'
      default: return statut
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Événements</h1>
          <p className="text-gray-600">Organisez vos événements d'insertion professionnelle</p>
        </div>
        <button
          onClick={() => {
            setFormData({})
            setShowForm(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvel Événement
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">{evenements.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Planifiés</p>
              <p className="text-2xl font-bold">{evenements.filter(e => e.statut === 'planifie').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Terminés</p>
              <p className="text-2xl font-bold">{evenements.filter(e => e.statut === 'termine').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-orange-600 text-sm">▶</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">En cours</p>
              <p className="text-2xl font-bold">{evenements.filter(e => e.statut === 'en_cours').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des événements */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Événements récents</h2>
          
          {loading ? (
            <p className="text-center py-8 text-gray-500">Chargement...</p>
          ) : evenements.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun événement</h3>
              <p className="text-gray-600 mb-4">Créez votre premier événement</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Créer un événement
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {evenements.map(evenement => (
                <div key={evenement.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{evenement.titre}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(evenement.statut)}`}>
                          {getStatutLabel(evenement.statut)}
                        </span>
                        {evenement.event_types?.nom && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {evenement.event_types.nom}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(evenement.date_debut).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                        {evenement.lieu && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {evenement.lieu}
                          </div>
                        )}
                        {evenement.responsable_cop && (
                          <div className="flex items-center">
                            <span>Responsable: {evenement.responsable_cop}</span>
                          </div>
                        )}
                      </div>
                      
                      {evenement.description && (
                        <p className="text-sm text-gray-600">{evenement.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(evenement)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(evenement.id, evenement.titre)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {formData.id ? 'Modifier l\'événement' : 'Nouvel événement'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Titre *</label>
                <input
                  type="text"
                  value={formData.titre || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Titre de l'événement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type d'événement</label>
                <select
                  value={formData.type_evenement_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, type_evenement_id: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un type</option>
                  {eventTypes.filter(t => t.actif).map(type => (
                    <option key={type.id} value={type.id}>{type.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date de début</label>
                <input
                  type="datetime-local"
                  value={formData.date_debut || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_debut: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Lieu</label>
                <input
                  type="text"
                  value={formData.lieu || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, lieu: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Lieu de l'événement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Responsable COP</label>
                <input
                  type="text"
                  value={formData.responsable_cop || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsable_cop: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom du responsable"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Statut</label>
                <select
                  value={formData.statut || 'planifie'}
                  onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="planifie">Planifié</option>
                  <option value="en_cours">En cours</option>
                  <option value="termine">Terminé</option>
                  <option value="annule">Annulé</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {formData.id ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}