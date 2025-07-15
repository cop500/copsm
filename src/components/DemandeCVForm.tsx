import React, { useState } from 'react';

interface DemandeCVFormProps {
  entreprises: Array<{ id: string; nom: string }>;
  filieres: Array<{ id: string; nom: string }>;
  onSave: (data: any) => void;
}

const DemandeCVForm: React.FC<DemandeCVFormProps> = ({ entreprises, filieres, onSave }) => {
  const [formData, setFormData] = useState({
    entreprise_id: '',
    entreprise_nom: '',
    contact_nom: '',
    contact_email: '',
    contact_telephone: '',
    poste_recherche: '',
    filiere_id: '',
    niveau_requis: '',
    nombre_cv_souhaite: 1,
    competences_requises: '',
    description_poste: '',
    lieu_travail: '',
    type_contrat: '', // Ajout du champ obligatoire
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEntrepriseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = entreprises.find(ent => ent.id === e.target.value);
    setFormData(f => ({
      ...f,
      entreprise_id: e.target.value,
      entreprise_nom: selected ? selected.nom : ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.entreprise_id || !formData.contact_nom || !formData.poste_recherche || !formData.type_contrat) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Nouvelle demande de CV</h2>
      <div className="mb-3">
        <label className="block mb-1">Entreprise *</label>
        <select
          value={formData.entreprise_id}
          onChange={handleEntrepriseChange}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Sélectionner une entreprise</option>
          {entreprises.map(ent => (
            <option key={ent.id} value={ent.id}>{ent.nom}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="block mb-1">Nom du contact *</label>
        <input
          type="text"
          value={formData.contact_nom}
          onChange={e => handleChange('contact_nom', e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="mb-3">
        <label className="block mb-1">Email du contact</label>
        <input
          type="email"
          value={formData.contact_email}
          onChange={e => handleChange('contact_email', e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="mb-3">
        <label className="block mb-1">Téléphone du contact</label>
        <input
          type="text"
          value={formData.contact_telephone}
          onChange={e => handleChange('contact_telephone', e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="mb-3">
        <label className="block mb-1">Poste recherché *</label>
        <input
          type="text"
          value={formData.poste_recherche}
          onChange={e => handleChange('poste_recherche', e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="mb-3">
        <label className="block mb-1">Filière souhaitée</label>
        <select
          value={formData.filiere_id}
          onChange={e => handleChange('filiere_id', e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Aucune</option>
          {filieres.map(fil => (
            <option key={fil.id} value={fil.id}>{fil.nom}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="block mb-1">Niveau requis</label>
        <input
          type="text"
          value={formData.niveau_requis}
          onChange={e => handleChange('niveau_requis', e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="mb-3">
        <label className="block mb-1">Nombre de CV souhaités</label>
        <input
          type="number"
          min={1}
          value={formData.nombre_cv_souhaite}
          onChange={e => handleChange('nombre_cv_souhaite', Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="mb-3">
        <label className="block mb-1">Compétences requises</label>
        <textarea
          value={formData.competences_requises}
          onChange={e => handleChange('competences_requises', e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="mb-3">
        <label className="block mb-1">Description du poste</label>
        <textarea
          value={formData.description_poste}
          onChange={e => handleChange('description_poste', e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="mb-3">
        <label className="block mb-1">Lieu de travail</label>
        <input
          type="text"
          value={formData.lieu_travail}
          onChange={e => handleChange('lieu_travail', e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="mb-3">
        <label className="block mb-1">Type de contrat *</label>
        <select
          value={formData.type_contrat}
          onChange={e => handleChange('type_contrat', e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="">Sélectionner</option>
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
          <option value="Stage">Stage</option>
          <option value="Alternance">Alternance</option>
          <option value="Freelance">Freelance</option>
          <option value="Interim">Intérim</option>
        </select>
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Enregistrer la demande</button>
    </form>
  );
};

export default DemandeCVForm; 