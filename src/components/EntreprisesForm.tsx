import React, { useState, useMemo } from 'react';
import { useEntreprises } from '@/hooks/useEntreprises';
import { Plus, Edit, Trash2, Building, Phone, Mail, MapPin, Search, Filter, Paperclip, Download, Calendar, Upload, FileSpreadsheet } from 'lucide-react';
import type { Entreprise } from '@/types';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { useUser } from '@/contexts/UserContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Pagination } from '@/components/Pagination';

const EntreprisesForm = () => {
  const { 
    entreprises, 
    loading, 
    saveEntreprise, 
    deleteEntreprise 
  } = useEntreprises();
  const { currentUser } = useUser();
  
  // Vérifier si l'utilisateur est admin
  const isAdmin = currentUser?.role === 'business_developer';

  const [showForm, setShowForm] = useState(false);
  const [editingEntreprise, setEditingEntreprise] = useState<Entreprise | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSecteur, setFilterSecteur] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [contratFile, setContratFile] = useState<File | null>(null);
  const [uploadingContrat, setUploadingContrat] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [selectedEntreprises, setSelectedEntreprises] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Nombre d'entreprises par page
  
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

  // Fonction pour télécharger le template Excel
  const downloadTemplate = () => {
    const template = [
      {
        'Nom de l\'entreprise': 'Exemple SARL',
        'Secteur': 'Informatique',
        'Adresse': '123 Rue de la Paix, 75001 Paris',
        'Téléphone': '01 23 45 67 89',
        'Email': 'contact@exemple.fr',
        'Personne de contact': 'Jean Dupont',
        'Statut': 'prospect',
        'Niveau d\'intérêt': 'moyen',
        'Notes': 'Notes sur l\'entreprise'
      }
    ];

    // Feuille avec les valeurs autorisées
    const valeursAutorisees = [
      { 'Champ': 'Statut', 'Valeurs autorisées': 'prospect, partenaire, actif, inactif' },
      { 'Champ': 'Niveau d\'intérêt', 'Valeurs autorisées': 'faible, moyen, fort (ou: Faible, Moyen, Fort)' },
      { 'Champ': 'Secteur', 'Exemples': 'Informatique, Industrie, Commerce, Services, BTP, Tourisme, Agriculture, Finance, Santé, Éducation' }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wsValeurs = XLSX.utils.json_to_sheet(valeursAutorisees);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entreprises');
    XLSX.utils.book_append_sheet(wb, wsValeurs, 'Valeurs autorisées');
    
    XLSX.writeFile(wb, 'template_entreprises.xlsx');
  };

  // Fonction pour lire le fichier Excel
  const handleFileUpload = (file: File) => {
    console.log('📁 Début lecture fichier Excel:', file.name, 'Taille:', file.size, 'Type:', file.type);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        console.log('📖 Fichier lu avec succès, début traitement...');
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        console.log('📊 Données binaires récupérées, taille:', data.length);
        
        const workbook = XLSX.read(data, { type: 'array' });
        console.log('📋 Workbook créé, feuilles disponibles:', workbook.SheetNames);
        
        const sheetName = workbook.SheetNames[0];
        console.log('📄 Utilisation de la feuille:', sheetName);
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log('📊 Données JSON extraites:', jsonData.length, 'lignes');
        console.log('📋 Première ligne (exemple):', jsonData[0]);
        
        // Fonction pour normaliser le niveau d'intérêt
        const normalizeNiveauInteret = (value: string): string => {
          const normalized = value.toLowerCase().trim();
          console.log(`🔄 Normalisation niveau d'intérêt: "${value}" -> "${normalized}"`);
          
          // Mapping des variations possibles
          const mapping: { [key: string]: string } = {
            'faible': 'faible',
            'moyen': 'moyen',
            'fort': 'fort',
            'low': 'faible',
            'medium': 'moyen',
            'high': 'fort',
            'bas': 'faible',
            'élevé': 'fort',
            'eleve': 'fort'
          };
          
          const result = mapping[normalized] || 'moyen'; // Valeur par défaut
          console.log(`✅ Niveau d'intérêt normalisé: "${normalized}" -> "${result}"`);
          return result;
        };

        // Mapper les colonnes Excel vers nos champs
        const mappedData = jsonData.map((row: any, index: number) => {
          console.log(`🔄 Mapping ligne ${index + 1}:`, row);
          
          const mapped = {
            nom: row['Nom de l\'entreprise'] || row['Nom'] || '',
            secteur: row['Secteur'] || '',
            adresse: row['Adresse'] || '',
            telephone: row['Téléphone'] || row['Telephone'] || '',
            email: row['Email'] || '',
            contact_personne: row['Personne de contact'] || row['Contact'] || '',
            statut: (row['Statut'] || 'prospect').toLowerCase(),
            niveau_interet: normalizeNiveauInteret(row['Niveau d\'intérêt'] || row['Niveau interet'] || 'moyen'),
            notes_bd: row['Notes'] || ''
          };
          
          console.log(`✅ Ligne ${index + 1} mappée:`, mapped);
          return mapped;
        }).filter(item => {
          const hasName = item.nom && item.nom.trim() !== '';
          if (!hasName) {
            console.log('⚠️ Ligne filtrée (nom vide):', item);
          }
          return hasName;
        });

        console.log('📊 Données finales après mapping:', mappedData.length, 'entreprises');
        console.log('📋 Aperçu des données mappées:', mappedData.slice(0, 3));

        setImportPreview(mappedData);
        setImportFile(file);
        console.log('✅ Import preview mis à jour avec succès');
      } catch (error) {
        console.error('❌ Erreur lecture Excel:', error);
        console.error('❌ Détails de l\'erreur:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        alert('Erreur lors de la lecture du fichier Excel: ' + error.message);
      }
    };
    
    reader.onerror = (error) => {
      console.error('❌ Erreur FileReader:', error);
      alert('Erreur lors de la lecture du fichier');
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Fonction pour importer les entreprises
  const handleImport = async () => {
    console.log('🚀 Début importation des entreprises...');
    console.log('📊 Nombre d\'entreprises à importer:', importPreview.length);
    
    if (!importPreview.length) {
      console.log('⚠️ Aucune entreprise à importer');
      return;
    }
    
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    console.log('📋 Données à importer:', importPreview);

    for (let i = 0; i < importPreview.length; i++) {
      const entreprise = importPreview[i];
      console.log(`🔄 Importation entreprise ${i + 1}/${importPreview.length}:`, entreprise.nom);
      
      try {
        const entrepriseData = {
          nom: entreprise.nom,
          secteur: entreprise.secteur,
          adresse: entreprise.adresse,
          statut: entreprise.statut,
          contact_principal_nom: entreprise.contact_personne,
          contact_principal_email: entreprise.email,
          contact_principal_telephone: entreprise.telephone,
          description: '',
          niveau_interet: entreprise.niveau_interet,
          notes_bd: entreprise.notes_bd
        };
        
        console.log(`📝 Données préparées pour ${entreprise.nom}:`, entrepriseData);
        
        const result = await saveEntreprise(entrepriseData);
        console.log(`📊 Résultat pour ${entreprise.nom}:`, result);
        
        if (result.success) {
          successCount++;
          console.log(`✅ ${entreprise.nom} importée avec succès`);
        } else {
          errorCount++;
          const errorMsg = `Erreur pour ${entreprise.nom}: ${result.error || 'Erreur inconnue'}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      } catch (error: any) {
        errorCount++;
        const errorMsg = `Exception pour ${entreprise.nom}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`, error);
        console.error('❌ Stack trace:', error.stack);
      }
    }

    console.log('📊 Résumé importation:', {
      total: importPreview.length,
      success: successCount,
      errors: errorCount,
      errorDetails: errors
    });

    setImporting(false);
    setShowImportModal(false);
    setImportFile(null);
    setImportPreview([]);
    
    const message = `Import terminé : ${successCount} entreprises ajoutées, ${errorCount} erreurs`;
    console.log('📢 Message final:', message);
    
    if (errors.length > 0) {
      console.log('❌ Détails des erreurs:', errors);
      alert(`${message}\n\nErreurs détaillées:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`);
    } else {
      alert(message);
    }
  };

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

  // Fonctions pour la sélection multiple
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEntreprises([]);
      setSelectAll(false);
    } else {
      setSelectedEntreprises(entreprisesFiltrees.map(ent => ent.id));
      setSelectAll(true);
    }
  };

  const handleSelectEntreprise = (id: string) => {
    if (selectedEntreprises.includes(id)) {
      setSelectedEntreprises(selectedEntreprises.filter(entId => entId !== id));
      setSelectAll(false);
    } else {
      const newSelected = [...selectedEntreprises, id];
      setSelectedEntreprises(newSelected);
      if (newSelected.length === entreprisesFiltrees.length) {
        setSelectAll(true);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedEntreprises.length === 0) return;
    
    const confirmMessage = selectedEntreprises.length === 1 
      ? 'Êtes-vous sûr de vouloir supprimer cette entreprise ?'
      : `Êtes-vous sûr de vouloir supprimer ${selectedEntreprises.length} entreprises ?`;
    
    if (window.confirm(confirmMessage)) {
      let successCount = 0;
      let errorCount = 0;
      
      for (const id of selectedEntreprises) {
        const result = await deleteEntreprise(id);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }
      
      setSelectedEntreprises([]);
      setSelectAll(false);
      
      if (errorCount === 0) {
        alert(`${successCount} entreprise(s) supprimée(s) avec succès !`);
      } else {
        alert(`${successCount} entreprise(s) supprimée(s), ${errorCount} erreur(s)`);
      }
    }
  };

  // Debounce pour la recherche
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtrage des entreprises - optimisé avec useMemo
  const entreprisesFiltrees = useMemo(() => {
    return entreprises.filter(ent => {
      const matchSearch = ent.nom.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         (ent.contact_principal_nom || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         (ent.secteur || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchSecteur = filterSecteur === '' || ent.secteur === filterSecteur;
      const statutVal = ((ent.statut || '') as string).toLowerCase();
      const matchStatut = filterStatut === '' || statutVal === filterStatut;
      return matchSearch && matchSecteur && matchStatut;
    });
  }, [entreprises, debouncedSearchTerm, filterSecteur, filterStatut]);

  // Pagination des entreprises
  const totalPages = Math.ceil(entreprisesFiltrees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const entreprisesPaginees = entreprisesFiltrees.slice(startIndex, endIndex);

  // Réinitialiser la page quand les filtres changent
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterSecteur, filterStatut]);

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
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter Entreprise
              </button>
            </div>
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
                  onPaste={(e) => setFormData({...formData, nom: e.currentTarget.value})}
                  onInput={(e) => setFormData({...formData, nom: e.currentTarget.value})}
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
                  onPaste={(e) => setFormData({...formData, telephone: e.currentTarget.value})}
                  onInput={(e) => setFormData({...formData, telephone: e.currentTarget.value})}
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
                  onPaste={(e) => setFormData({...formData, email: e.currentTarget.value})}
                  onInput={(e) => setFormData({...formData, email: e.currentTarget.value})}
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
                  onPaste={(e) => setFormData({...formData, contact_personne: e.currentTarget.value})}
                  onInput={(e) => setFormData({...formData, contact_personne: e.currentTarget.value})}
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
                  onPaste={(e) => setFormData({...formData, adresse: e.currentTarget.value})}
                  onInput={(e) => setFormData({...formData, adresse: e.currentTarget.value})}
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
          {entreprisesFiltrees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune entreprise trouvée
            </div>
          ) : (
            <>
              {/* Barre d'actions pour sélection multiple - Admin uniquement */}
              {isAdmin && (
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Tout sélectionner ({entreprisesFiltrees.length})
                      </span>
                    </label>
                    {selectedEntreprises.length > 0 && (
                      <span className="text-sm text-gray-600">
                        {selectedEntreprises.length} entreprise(s) sélectionnée(s)
                      </span>
                    )}
                                    </div>
                  {selectedEntreprises.length > 0 && isAdmin && (
                    <button
                      onClick={handleDeleteSelected}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer la sélection ({selectedEntreprises.length})
                    </button>
                  )}
                </div>
              )}
              
              <div className="grid gap-4">
              {entreprisesPaginees.map(entreprise => (
                <div key={entreprise.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    {isAdmin && (
                      <div className="flex items-center gap-3 mr-3">
                        <input
                          type="checkbox"
                          checked={selectedEntreprises.includes(entreprise.id)}
                          onChange={() => handleSelectEntreprise(entreprise.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    )}
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
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(entreprise.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={entreprisesFiltrees.length}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Import Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Importer des entreprises depuis Excel</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Télécharger template */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">1. Télécharger le template</h4>
                <button
                  onClick={downloadTemplate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger template Excel
                </button>
                <p className="text-sm text-blue-700 mt-2">
                  Téléchargez le fichier modèle, remplissez-le avec vos données, puis importez-le.
                </p>
              </div>

              {/* Upload fichier */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">2. Importer votre fichier Excel</h4>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="w-full"
                />
              </div>

              {/* Aperçu des données */}
              {importPreview.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    3. Aperçu ({importPreview.length} entreprises)
                  </h4>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-green-100">
                        <tr>
                          <th className="text-left p-2">Nom</th>
                          <th className="text-left p-2">Secteur</th>
                          <th className="text-left p-2">Contact</th>
                          <th className="text-left p-2">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 10).map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{item.nom}</td>
                            <td className="p-2">{item.secteur}</td>
                            <td className="p-2">{item.contact_personne}</td>
                            <td className="p-2">{item.statut}</td>
                          </tr>
                        ))}
                        {importPreview.length > 10 && (
                          <tr>
                            <td colSpan={4} className="p-2 text-center text-gray-500">
                              ... et {importPreview.length - 10} autres
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Annuler
                </button>
                {importPreview.length > 0 && (
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {importing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Import en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Importer {importPreview.length} entreprises
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntreprisesForm;