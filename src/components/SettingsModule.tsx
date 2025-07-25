// ========================================
// src/components/SettingsModule.tsx - Version personnalisée COP
// ========================================

'use client'

import React, { useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { 
  Settings, Plus, Edit3, Trash2, Save, Check, X, Eye, EyeOff,
  GraduationCap, Building2, Calendar, FileText, AlertCircle,
  Loader2, ChevronRight
} from 'lucide-react'

export const SettingsModule = () => {
  const {
    poles, filieres, eventTypes, cvStatus, loading, error,
    savePole, saveFiliere, deleteItem, toggleActive
  } = useSettings()

  const [activeTab, setActiveTab] = useState('poles')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)

  // Niveaux personnalisés
  const niveauxCOP = [
    'Technicien Spécialisé',
    'Technicien', 
    'Qualification',
    'Spécialisation'
  ]

  // Afficher un message temporaire
  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // Générer un code automatique basé sur le nom
  const generateCode = (nom: string) => {
    return nom
      .toUpperCase()
      .replace(/[ÀÁÂÃÄÅ]/g, 'A')
      .replace(/[ÈÉÊË]/g, 'E')
      .replace(/[ÌÍÎÏ]/g, 'I')
      .replace(/[ÒÓÔÕÖ]/g, 'O')
      .replace(/[ÙÚÛÜ]/g, 'U')
      .replace(/[ÇÑ]/g, 'C')
      .replace(/[^A-Z0-9]/g, '_')
      .substring(0, 20)
  }

  // Formulaire d'ajout/édition
  const ItemForm = ({ category, item = null, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState(item || {
      nom: '',
      description: '',
      couleur: '#1E3A8A',
      actif: true,
      ...(category === 'filieres' && { pole_id: '', level: 'Technicien Spécialisé' })
    })

    const handleSubmit = () => {
      if (!formData.nom) {
        showMessage('Le nom est obligatoire', 'error')
        return
      }

      // Générer automatiquement le code basé sur le nom
      const dataToSave = {
        ...formData,
        code: generateCode(formData.nom)
      }

      onSave(dataToSave)
    }

    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
        <h4 className="font-medium text-gray-900 mb-4">
          {item ? 'Modifier' : 'Ajouter'} {getCategoryLabel(category)}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nom de l'élément"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Description optionnelle"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.couleur || formData.color || '#1E3A8A'}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  couleur: e.target.value,
                  color: e.target.value 
                }))}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={formData.couleur || formData.color || '#1E3A8A'}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  couleur: e.target.value,
                  color: e.target.value 
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="#1E3A8A"
              />
            </div>
          </div>

          {category === 'filieres' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pôle <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.pole_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, pole_id: e.target.value }))}
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
                  Niveau
                </label>
                <select
                  value={formData.level || 'Technicien Spécialisé'}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {niveauxCOP.map(niveau => (
                    <option key={niveau} value={niveau}>{niveau}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
            disabled={saving}
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {item ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </div>
    )
  }

  // Carte d'élément (sans affichage du code)
  const ItemCard = ({ category, item, onEdit, onDelete, onToggle }: any) => (
    <div className={`p-4 rounded-lg border transition-all ${
      item.actif ? 'bg-white border-gray-200 hover:shadow-md' : 'bg-gray-50 border-gray-200 opacity-60'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div 
            className="w-4 h-4 rounded-full mt-1 flex-shrink-0" 
            style={{ backgroundColor: item.couleur || item.color }}
          ></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900 truncate">{item.nom}</h4>
              {/* Code supprimé de l'affichage */}
            </div>
            {item.description && (
              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
            )}
            {category === 'filieres' && (
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>Pôle: {item.pole_name}</span>
                {item.level && <span>Niveau: {item.level}</span>}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onToggle(item.id, item.actif, item.nom)}
            className={`p-1 rounded ${item.actif ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
            title={item.actif ? 'Désactiver' : 'Activer'}
          >
            {item.actif ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Modifier"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item.id, item.nom)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  // Actions de sauvegarde
  const handleSave = async (category: string, data: any) => {
    setSaving(true)
    
    try {
      let result
      switch (category) {
        case 'poles':
          result = await savePole(data)
          break
        case 'filieres':
          result = await saveFiliere(data)
          break
        default:
          throw new Error('Catégorie non supportée')
      }

      if (result.success) {
        showMessage(editingItem ? 'Modification sauvegardée !' : 'Élément ajouté avec succès !')
        setShowAddForm(false)
        setEditingItem(null)
      } else {
        showMessage(result.error, 'error')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showMessage('Erreur lors de la sauvegarde', 'error')
      } else {
        showMessage('Erreur inconnue lors de la sauvegarde', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  // Actions de suppression
  const handleDelete = async (table: string, itemId: string, itemName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${itemName}" ?`)) {
      return
    }

    const result = await deleteItem(table, itemId)
    if (result.success) {
      showMessage('Élément supprimé avec succès !')
    } else {
      showMessage(result.error, 'error')
    }
  }

  // Changer le statut actif/inactif
  const handleToggleActive = async (table: string, itemId: string, currentActive: boolean, itemName: string) => {
    const result = await toggleActive(table, itemId, currentActive)
    if (result.success) {
      showMessage(`${itemName} ${currentActive ? 'désactivé' : 'activé'} !`)
    } else {
      showMessage(result.error, 'error')
    }
  }

  // Obtenir le label de catégorie
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'poles': return 'un pôle'
      case 'filieres': return 'une filière'
      default: return 'un élément'
    }
  }

  // Obtenir les données selon la catégorie
  const getCategoryData = (category: string) => {
    switch (category) {
      case 'poles': return poles
      case 'filieres': return filieres
      default: return []
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Recharger la page
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'poles', label: 'Pôles', icon: GraduationCap, color: 'blue' },
    { id: 'filieres', label: 'Filières', icon: Building2, color: 'green' }
  ]

  const currentData = getCategoryData(activeTab)
  const currentTable = activeTab

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Paramètres COP</h1>
              <p className="text-gray-600">Configuration des pôles et filières de formation</p>
            </div>
            <div className="flex items-center space-x-3">
              {message && (
                <div className={`px-4 py-2 rounded-md flex items-center ${
                  message.type === 'error' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  <Check className="w-4 h-4 mr-2" />
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200">
          <div className="p-4">
            <nav className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon
                const data = getCategoryData(tab.id)
                const activeCount = data.filter((item: any) => item.actif).length
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setShowAddForm(false)
                      setEditingItem(null)
                    }}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="flex-1 text-left">{tab.label}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {activeCount}
                    </span>
                  </button>
                )
              })}
            </nav>

            {/* Info niveaux */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Niveaux disponibles :</h4>
              <div className="space-y-1 text-sm text-blue-700">
                {niveauxCOP.map((niveau, index) => (
                  <div key={niveau} className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    {niveau}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            {/* En-tête de section */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h3>
                <p className="text-sm text-gray-600">
                  Gérez les {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} de votre COP
                </p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </button>
            </div>

            {/* Formulaire d'ajout */}
            {showAddForm && (
              <ItemForm
                category={activeTab}
                onSave={(data: any) => handleSave(activeTab, data)}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            {/* Formulaire de modification */}
            {editingItem && (
              <ItemForm
                category={activeTab}
                item={editingItem}
                onSave={(data: any) => handleSave(activeTab, { ...data, id: editingItem.id })}
                onCancel={() => setEditingItem(null)}
              />
            )}

            {/* Liste des éléments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {currentData.map((item: any) => (
                <ItemCard
                  key={item.id}
                  category={activeTab}
                  item={item}
                  onEdit={setEditingItem}
                  onDelete={(id: string, name: string) => handleDelete(currentTable, id, name)}
                  onToggle={(id: string, active: boolean, name: string) => handleToggleActive(currentTable, id, active, name)}
                />
              ))}
            </div>

            {currentData.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Settings className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun élément configuré
                </h3>
                <p className="text-gray-600 mb-4">
                  Commencez par ajouter {getCategoryLabel(activeTab)} pour votre COP
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Ajouter le premier élément
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}