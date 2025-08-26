'use client'

import React, { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { supabase } from '@/lib/supabase'
import { Calendar, Plus, X, Save, Edit3, Trash2, Eye, MapPin, Clock, Upload, FileSpreadsheet, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useUser } from '@/contexts/UserContext'

export const EvenementsModule = () => {
  const { eventTypes } = useSettings()
  const { currentUser } = useUser()
  
  // Vérifier si l'utilisateur est admin
  const isAdmin = currentUser?.role === 'business_developer'
  
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [evenements, setEvenements] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  
  // États pour l'import Excel
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importPreview, setImportPreview] = useState<any[]>([])

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
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Erreur chargement:', err)
      }
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('💥 Erreur:', err)
        alert('Erreur: ' + err.message)
      }
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Erreur: ' + err.message)
      }
    }
  }

  // Fonction pour télécharger le template Excel
  const downloadTemplate = () => {
    const template = [
      {
        'Titre': 'Exemple événement',
        'Type d\'événement': 'Job Day',
        'Date de début': '2024-01-15T09:00',
        'Lieu': 'Salle de conférence',
        'Description': 'Description de l\'événement',
        'Responsable COP': 'Jean Dupont',
        'Statut': 'planifie'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Événements');
    XLSX.writeFile(wb, 'template_evenements.xlsx');
  };

  // Fonction pour lire le fichier Excel
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Mapper les colonnes Excel vers nos champs
        const mappedData = jsonData.map((row: any) => ({
          titre: row['Titre'] || '',
          type_evenement: row['Type d\'événement'] || row['Type'] || '',
          date_debut: row['Date de début'] || row['Date'] || '',
          lieu: row['Lieu'] || '',
          description: row['Description'] || '',
          responsable_cop: row['Responsable COP'] || row['Responsable'] || '',
          statut: (row['Statut'] || 'planifie').toLowerCase()
        })).filter(item => item.titre); // Filtrer les lignes vides

        setImportPreview(mappedData);
        setImportFile(file);
      } catch (error) {
        console.error('Erreur lecture Excel:', error);
        alert('Erreur lors de la lecture du fichier Excel');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Fonction pour importer les événements
  const handleImport = async () => {
    if (!importPreview.length) return;
    
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const evenement of importPreview) {
      try {
        // Trouver le type d'événement par nom
        const eventType = eventTypes.find(et => 
          et.nom.toLowerCase() === evenement.type_evenement.toLowerCase()
        );

        const dataToSave = {
          titre: evenement.titre,
          type_evenement_id: eventType?.id || null,
          date_debut: evenement.date_debut,
          lieu: evenement.lieu,
          description: evenement.description,
          statut: evenement.statut,
          responsable_cop: evenement.responsable_cop,
          actif: true
        };

        const { error } = await supabase
          .from('evenements')
          .insert([dataToSave]);

        if (error) {
          errorCount++;
          console.error('Erreur import événement:', error);
        } else {
          successCount++;
        }
      } catch (error) {
        errorCount++;
        console.error('Erreur import événement:', error);
      }
    }

    setImporting(false);
    setShowImportModal(false);
    setImportFile(null);
    setImportPreview([]);
    
    await loadEvenements(); // Recharger la liste
    alert(`Import terminé : ${successCount} événements ajoutés, ${errorCount} erreurs`);
  };

  // Modifier un événement
  const handleEdit = (evenement: Record<string, unknown>) => {
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
              <div className="flex gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Importer Excel
                  </button>
                )}
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Créer un événement
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {evenements.map(evenement => (
                <div key={evenement.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{evenement.titre}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(evenement.statut as string)}`}>
                          {getStatutLabel(evenement.statut as string)}
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
                          {new Date(evenement.date_debut as string).toLocaleDateString('fr-FR', {
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
                        onClick={() => handleDelete(evenement.id as string, evenement.titre as string)}
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

      {/* Modal d'import Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Importer des événements depuis Excel</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Section 1: Télécharger le template */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">1. Télécharger le template</h3>
                <p className="text-gray-600 mb-3">
                  Téléchargez le fichier template pour voir le format attendu
                </p>
                <button
                  onClick={downloadTemplate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger template_evenements.xlsx
                </button>
              </div>

              {/* Section 2: Upload du fichier */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">2. Importer votre fichier Excel</h3>
                <p className="text-gray-600 mb-3">
                  Sélectionnez votre fichier Excel rempli avec les données
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Section 3: Aperçu des données */}
              {importPreview.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">
                    3. Aperçu des données ({importPreview.length} événements)
                  </h3>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2">Titre</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Lieu</th>
                          <th className="text-left p-2">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 10).map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{item.titre}</td>
                            <td className="p-2">{item.type_evenement}</td>
                            <td className="p-2">{item.date_debut}</td>
                            <td className="p-2">{item.lieu}</td>
                            <td className="p-2">{item.statut}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importPreview.length > 10 && (
                      <p className="text-gray-500 text-sm mt-2">
                        ... et {importPreview.length - 10} autres événements
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importPreview.length || importing}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {importing ? 'Import en cours...' : 'Importer les événements'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}