import React, { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, Clock, Users, MapPin, BookOpen, 
  Save, X, Edit3, Trash2, Loader2 
} from 'lucide-react'

interface AtelierFormData {
  id?: string
  titre: string
  description: string
  date_debut: string
  heure_debut: string
  date_fin: string
  heure_fin: string
  capacite_max: number
  pole_id: string
  filiere_id: string
  lieu: string
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
}

interface AtelierFormProps {
  atelier?: any
  onSave: (atelier: any) => void
  onCancel: () => void
  isAdmin?: boolean
}

export default function AtelierForm({ atelier, onSave, onCancel, isAdmin = false }: AtelierFormProps) {
  const { poles, filieres } = useSettings()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<AtelierFormData>({
    titre: '',
    description: '',
    date_debut: '',
    heure_debut: '',
    date_fin: '',
    heure_fin: '',
    capacite_max: 20,
    pole_id: '',
    filiere_id: '',
    lieu: '',
    statut: 'planifie'
  })

  // Initialiser le formulaire avec les données de l'atelier existant
  useEffect(() => {
    if (atelier) {
      const dateDebut = new Date(atelier.date_debut)
      const dateFin = new Date(atelier.date_fin)
      
      setFormData({
        id: atelier.id,
        titre: atelier.titre || '',
        description: atelier.description || '',
        date_debut: dateDebut.toISOString().split('T')[0],
        heure_debut: dateDebut.toTimeString().slice(0, 5),
        date_fin: dateFin.toISOString().split('T')[0],
        heure_fin: dateFin.toTimeString().slice(0, 5),
        capacite_max: atelier.capacite_max || 20,
        pole_id: atelier.pole_id || '',
        filiere_id: atelier.filiere_id || '',
        lieu: atelier.lieu || '',
        statut: atelier.statut || 'planifie'
      })
    }
  }, [atelier])

  // Filtrer les filières selon le pôle sélectionné
  const filieresFiltered = formData.pole_id 
    ? filieres.filter(f => f.pole_id === formData.pole_id)
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Valider les données
      if (!formData.titre || !formData.date_debut || !formData.heure_debut || 
          !formData.date_fin || !formData.heure_fin || !formData.pole_id || 
          !formData.filiere_id || !formData.lieu) {
        throw new Error('Veuillez remplir tous les champs obligatoires')
      }

      // Créer les dates complètes
      const dateDebut = new Date(`${formData.date_debut}T${formData.heure_debut}`)
      const dateFin = new Date(`${formData.date_fin}T${formData.heure_fin}`)

      if (dateDebut >= dateFin) {
        throw new Error('La date de fin doit être postérieure à la date de début')
      }

      const atelierData = {
        titre: formData.titre,
        description: formData.description,
        date_debut: dateDebut.toISOString(),
        date_fin: dateFin.toISOString(),
        capacite_max: formData.capacite_max,
        pole_id: formData.pole_id,
        filiere_id: formData.filiere_id,
        lieu: formData.lieu,
        statut: formData.statut,
        capacite_actuelle: atelier?.capacite_actuelle || 0
      }

      let result
      if (atelier?.id) {
        // Modification
        const { data, error } = await supabase
          .from('ateliers')
          .update(atelierData)
          .eq('id', atelier.id)
          .select()
        
        if (error) throw error
        result = data[0]
      } else {
        // Création
        const { data, error } = await supabase
          .from('ateliers')
          .insert([atelierData])
          .select()
        
        if (error) throw error
        result = data[0]
      }

      onSave(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!atelier?.id || !isAdmin) return
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet atelier ?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('ateliers')
        .delete()
        .eq('id', atelier.id)
      
      if (error) throw error
      
      onSave(null) // Indiquer la suppression
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          {atelier ? 'Modifier l\'atelier' : 'Créer un nouvel atelier'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titre et Description */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre de l'atelier <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Développement Web avec React"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Description détaillée de l'atelier..."
            />
          </div>
        </div>

        {/* Dates et heures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={formData.date_debut}
                onChange={(e) => setFormData(prev => ({ ...prev, date_debut: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="time"
                value={formData.heure_debut}
                onChange={(e) => setFormData(prev => ({ ...prev, heure_debut: e.target.value }))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={formData.date_fin}
                onChange={(e) => setFormData(prev => ({ ...prev, date_fin: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="time"
                value={formData.heure_fin}
                onChange={(e) => setFormData(prev => ({ ...prev, heure_fin: e.target.value }))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Pôle et Filière */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pôle <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.pole_id}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                pole_id: e.target.value,
                filiere_id: '' // Réinitialiser la filière
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sélectionner un pôle</option>
              {poles.filter(p => p.actif).map(pole => (
                <option key={pole.id} value={pole.id}>{pole.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filière <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.filiere_id}
              onChange={(e) => setFormData(prev => ({ ...prev, filiere_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!formData.pole_id}
            >
              <option value="">
                {formData.pole_id ? 'Sélectionner une filière' : 'Sélectionnez d\'abord un pôle'}
              </option>
              {filieresFiltered.map(filiere => (
                <option key={filiere.id} value={filiere.id}>{filiere.nom}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Capacité et Lieu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacité maximale <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                min="1"
                value={formData.capacite_max}
                onChange={(e) => setFormData(prev => ({ ...prev, capacite_max: parseInt(e.target.value) || 1 }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lieu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={formData.lieu}
                onChange={(e) => setFormData(prev => ({ ...prev, lieu: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Salle 101 ou En ligne"
              />
            </div>
          </div>
        </div>

        {/* Statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statut
          </label>
          <select
            value={formData.statut}
            onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="planifie">Planifié</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Annuler
          </button>

          {atelier?.id && isAdmin && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {atelier ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  )
} 