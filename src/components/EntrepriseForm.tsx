import React, { useState } from 'react';
import { useEntreprises } from '@/hooks/useEntreprises';
import { Plus, Edit, Trash2, Building, Phone, Mail, MapPin, Search, Filter } from 'lucide-react';

const EntreprisesForm = () => {
  const { 
    entreprises, 
    loading, 
    error, 
    saveEntreprise, 
    deleteEntreprise 
  } = useEntreprises();

  const [showForm, setShowForm] = useState(false);
  const [editingEntreprise, setEditingEntreprise] = useState<unknown>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSecteur, setFilterSecteur] = useState('');
  
  // Formulaire d'entreprise
  const [formData, setFormData] = useState({
    nom: '',
    secteur: '',
    adresse: '',
    telephone: '',
    email: '',
    contact_personne: '',
    description: '',
    statut: 'Actif'
  });

  const secteurs = [
    'Informatique', 'Industrie', 'Commerce', 'Services', 
    'BTP', 'Tourisme', 'Agriculture', 'Finance', 'Santé', 'Éducation'
  ];

  const handleSubmit = async () => {
    // Validation simple
    if (!formData.nom || !formData.secteur || !formData.telephone || !formData.email || !formData.contact_personne || !formData.adresse) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (editingEntreprise) {
      // Modifier entreprise existante
      const mappedData = {
        id: (editingEntreprise as any).id,
        nom: formData.nom,
        secteur: formData.secteur,
        adresse: formData.adresse,
        statut: formData.statut,
        contact_principal_nom: formData.contact_personne,
        contact_principal_email: formData.email,
        contact_principal_telephone: formData.telephone,
        description: formData.description
      };
      console.log('FormData envoyé à Supabase :', mappedData);
      const result = await saveEntreprise(mappedData);
      if (result.success) {
        alert('Entreprise modifiée avec succès !');
      } else {
        console.log('Erreur détaillée lors de la modification :', result.error);
        alert('Erreur lors de la modification : ' + JSON.stringify(result.error));
      }
    } else {
      // Ajouter nouvelle entreprise
      const mappedData = {
        nom: formData.nom,
        secteur: formData.secteur,
        adresse: formData.adresse,
        statut: formData.statut,
        contact_principal_nom: formData.contact_personne,
        contact_principal_email: formData.email,
        contact_principal_telephone: formData.telephone,
        description: formData.description
      };
      console.log('FormData envoyé à Supabase :', mappedData);
      const result = await saveEntreprise(mappedData);
      if (result.success) {
        alert('Entreprise ajoutée avec succès !');
      } else {
        console.log('Erreur détaillée lors de l\'ajout :', result.error);
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
      statut: 'Actif'
    });
    setShowForm(false);
    setEditingEntreprise(null);
  };

  const handleEdit = (entreprise: unknown) => {
    setFormData({
      nom: (entreprise as any).nom,
      secteur: (entreprise as any).secteur,
      adresse: (entreprise as any).adresse,
      telephone: (entreprise as any).telephone,
      email: (entreprise as any).email,
      contact_personne: (entreprise as any).contact_personne,
      description: (entreprise as any).description || '',
      statut: (entreprise as any).statut
    });
    setEditingEntreprise(entreprise);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      const result = await deleteEntreprise(id);
      if (result.success) {
        alert('Entreprise supprimée avec succès !');
      } else {
        alert('Erreur lors de la suppression');
      }
    }
  };

  // Filtrage des entreprises
  const entreprisesFiltrees = entreprises.filter(ent => {
    const matchSearch = ent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       ent.contact_personne.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       ent.secteur.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSecteur = filterSecteur === '' || ent.secteur === filterSecteur;
    return matchSearch && matchSecteur;
  });

  if (loading) return <div className="p-6">Chargement...</div>;
  if (error) return <div className="p-6 text-red-600">Erreur: {error}</div>;

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
              <p className="text-gray-600 mt-1">Gérez les entreprises partenaires pour les stages</p>
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
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
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
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          entreprise.statut === 'Actif' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {entreprise.statut}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{entreprise.secteur}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{entreprise.telephone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{entreprise.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{entreprise.adresse}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm"><strong>Contact:</strong> {entreprise.contact_personne}</p>
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