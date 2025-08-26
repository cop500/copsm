import React, { useState } from 'react';
import { useEntreprises } from '@/hooks/useEntreprises';
import { Plus, Edit, Trash2, Building, Phone, Mail, MapPin, Search, Filter, Paperclip, Download, Calendar } from 'lucide-react';
import type { Entreprise } from '@/types';
import { supabase } from '@/lib/supabase';

const EntreprisesForm = () => {
  const { 
    entreprises, 
    loading, 
    saveEntreprise, 
    deleteEntreprise 
  } = useEntreprises();

  const [showForm, setShowForm] = useState(false);
  const [editingEntreprise, setEditingEntreprise] = useState<Entreprise | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSecteur, setFilterSecteur] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [contratFile, setContratFile] = useState<File | null>(null);
  const [uploadingContrat, setUploadingContrat] = useState(false);
  
  // Formulaire d'entreprise - adapté à vos champs existants
  const [formData, setFormData] = useState({
    nom: '',
    secteur: '',
    adresse: '',
    telephone: '',
    email: '',
    contact_personne: '',
    description: '',
    statut: 'prospect',
    niveau_interet: 'moyen' as 'faible' | 'moyen' | 'fort',
    notes_bd: ''
  });

  const secteurs = [
    'Informatique', 'Industrie', 'Commerce', 'Services', 
    'BTP', 'Tourisme', 'Agriculture', 'Finance', 'Santé', 'Éducation'
  ];

  const uploadContrat = async (file: File): Promise<string | null> => {
    try {
      setUploadingContrat(true);
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `contrats-partenariats/${Date.now()}_${cleanName}`;
      const { error } = await supabase.storage
        .from('contrats-partenariats')
        .upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('contrats-partenariats')
        .getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Erreur upload contrat:', err);
      alert("Erreur lors de l'upload du contrat de partenariat");
      return null;
    } finally {
      setUploadingContrat(false);
    }
  };

  const handleSubmit = async () => {
    // Validation simple
    if (!formData.nom || !formData.secteur || !formData.telephone || !formData.email || !formData.contact_personne || !formData.adresse) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const commonData: any = {
      nom: formData.nom,
      secteur: formData.secteur,
      adresse: formData.adresse,
      statut: (formData.statut || '').toLowerCase(),
      contact_principal_nom: formData.contact_personne,
      contact_principal_email: formData.email,
      contact_principal_telephone: formData.telephone,
      description: formData.description,
      niveau_interet: formData.niveau_interet,
      notes_bd: formData.notes_bd
    };

    let contratUrl: string | null = null;
    if (contratFile) {
      const url = await uploadContrat(contratFile);
      if (url) contratUrl = url;
    }

    if (editingEntreprise) {
      // Modifier entreprise existante
      const mappedData: any = { id: editingEntreprise.id, ...commonData };
      if (contratUrl) mappedData.contrat_url = contratUrl;
      console.log('FormData envoyé à Supabase :', mappedData);
      const result = await saveEntreprise(mappedData);
      if (result.success) {
        alert('Entreprise modifiée avec succès !');
      } else {
        alert('Erreur lors de la modification : ' + JSON.stringify(result.error));
      }
    } else {
      // Ajouter nouvelle entreprise
      const mappedData: any = { ...commonData };
      if (contratUrl) mappedData.contrat_url = contratUrl;
      console.log('FormData envoyé à Supabase :', mappedData);
      const result = await saveEntreprise(mappedData);
      if (result.success) {
        alert('Entreprise ajoutée avec succès !');
      } else {
        alert('Erreur lors de l\'ajout : ' + JSON.stringify(result.error));
      }
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      secteur: '',
      adresse: '',
      telephone: '',
      email: '',
      contact_personne: '',
      description: '',
      statut: 'prospect',
      niveau_interet: 'moyen',
      notes_bd: ''
    });
    setShowForm(false);
    setEditingEntreprise(null);
    setContratFile(null);
  };

  const handleEdit = (entreprise: Entreprise) => {
    setFormData({
      nom: entreprise.nom,
      secteur: entreprise.secteur || '',
      adresse: entreprise.adresse || '',
      telephone: entreprise.contact_principal_telephone || (entreprise as any).telephone || '',
      email: entreprise.contact_principal_email || (entreprise as any).email || '',
      contact_personne: entreprise.contact_principal_nom || (entreprise as any).contact_personne || '',
      description: entreprise.description || '',
      statut: (entreprise.statut || 'prospect'),
      niveau_interet: (entreprise as any).niveau_interet || 'moyen',
      notes_bd: (entreprise as any).notes_bd || ''
    });
    setEditingEntreprise(entreprise);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      const result = await deleteEntreprise(id);
      if (result.success) {
        alert('Entreprise supprimée avec succès !');
      } else {
        alert('Erreur lors de la suppression');
      }
    }
  };

  // Filtrage des entreprises - adapté à vos champs
  const entreprisesFiltrees = entreprises.filter(ent => {
    const matchSearch = ent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (ent.contact_principal_nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (ent.secteur || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchSecteur = filterSecteur === '' || ent.secteur === filterSecteur;
    const statutVal = ((ent.statut || '') as string).toLowerCase();
    const matchStatut = filterStatut === '' || statutVal === filterStatut;
    return matchSearch && matchSecteur && matchStatut;
  });

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* En-tête */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building className="w-6 h-6 text-blue-600" />
                Gestion des Entreprises
              </h1>
              <p className="text-gray-600 mt-1">Gérez les entreprises partenaires</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter Entreprise
            </button>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, contact ou secteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <select
                value={filterSecteur}
                onChange={(e) => setFilterSecteur(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les secteurs</option>
                {secteurs.map(secteur => (
                  <option key={secteur} value={secteur}>{secteur}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous statuts</option>
                <option value="prospect">Prospects</option>
                <option value="partenaire">Partenaires</option>
                <option value="actif">Actifs</option>
                <option value="inactif">Inactifs</option>
              </select>
            </div>
          </div>
        </div>

        {/* Formulaire d'ajout/modification */}
        {showForm && (
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4">
              {editingEntreprise ? 'Modifier l\'entreprise' : 'Ajouter une nouvelle entreprise'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secteur d'activité *
                </label>
                <select
                  value={formData.secteur}
                  onChange={(e) => setFormData({...formData, secteur: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner un secteur</option>
                  {secteurs.map(secteur => (
                    <option key={secteur} value={secteur}>{secteur}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personne de contact *
                </label>
                <input
                  type="text"
                  value={formData.contact_personne}
                  onChange={(e) => setFormData({...formData, contact_personne: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={formData.statut}
                  onChange={(e) => setFormData({...formData, statut: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="prospect">Prospect</option>
                  <option value="partenaire">Partenaire</option>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse complète *
                </label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Suivi prospection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau d'intérêt</label>
                <select
                  value={formData.niveau_interet}
                  onChange={(e) => setFormData({ ...formData, niveau_interet: e.target.value as 'faible' | 'moyen' | 'fort' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="faible">Faible</option>
                  <option value="moyen">Moyen</option>
                  <option value="fort">Fort</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (BD)</label>
                <textarea
                  value={formData.notes_bd}
                  onChange={(e) => setFormData({ ...formData, notes_bd: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Contrat de partenariat */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> Contrat de partenariat (PDF)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setContratFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                  className="w-full"
                />
                {uploadingContrat && (
                  <p className="text-sm text-gray-500 mt-1">Upload du contrat en cours...</p>
                )}
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingEntreprise ? 'Modifier' : 'Ajouter'}
                </button>
                <button
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des entreprises */}
        <div className="p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Liste des entreprises ({entreprisesFiltrees.length})
            </h3>
          </div>

          {entreprisesFiltrees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune entreprise trouvée
            </div>
          ) : (
            <div className="grid gap-4">
              {entreprisesFiltrees.map(entreprise => (
                <div key={entreprise.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{entreprise.nom}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${(() => {
                          const s = (entreprise.statut || '').toLowerCase();
                          if (s === 'prospect') return 'bg-yellow-100 text-yellow-800';
                          if (s === 'partenaire') return 'bg-green-100 text-green-800';
                          if (s === 'inactif') return 'bg-red-100 text-red-800';
                          return 'bg-blue-100 text-blue-800';
                        })()}`}>
                          {(() => {
                            const s = (entreprise.statut || '').toLowerCase();
                            if (s === 'prospect') return 'Prospect';
                            if (s === 'partenaire') return 'Partenaire';
                            if (s === 'inactif') return 'Inactif';
                            return 'Actif';
                          })()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{entreprise.secteur || 'Non spécifié'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{entreprise.contact_principal_telephone || 'Non spécifié'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{entreprise.contact_principal_email || 'Non spécifié'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{entreprise.adresse || 'Non spécifiée'}</span>
                        </div>
                        {(entreprise as any).contrat_url && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <Download className="w-4 h-4" />
                            <a href={(entreprise as any).contrat_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Contrat de partenariat</a>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm"><strong>Contact:</strong> {entreprise.contact_principal_nom || 'Non spécifié'}</p>
                        {((entreprise as any).niveau_interet || (entreprise as any).prochaine_relance_at) && (
                          <div className="text-xs text-gray-500 mt-1 flex gap-3">
                            {(entreprise as any).niveau_interet && <span>Niveau intérêt: {(entreprise as any).niveau_interet}</span>}
                            {(entreprise as any).prochaine_relance_at && <span>Relance: {(entreprise as any).prochaine_relance_at}</span>}
                          </div>
                        )}
                        {entreprise.description && (
                          <p className="text-sm text-gray-600 mt-1">{entreprise.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(entreprise)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entreprise.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
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
    </div>
  );
};

export default EntreprisesForm;