"use client";
import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/lib/supabase';

const BLEU_FONCE = "#004080";
const dureesContrat = ["1 mois", "3 mois", "6 mois", "12 mois", "Autre"];
const secteurs = [
  "Administration & Gestion",
  "Agriculture & Agroalimentaire",
  "Artisanat & Métiers d'art",
  "Automobile & Transport",
  "Banque & Assurance",
  "BTP & Construction",
  "Commerce & Distribution",
  "Communication & Marketing",
  "Conseil & Services aux entreprises",
  "Éducation & Formation",
  "Énergie & Environnement",
  "Hôtellerie & Restauration",
  "Industrie manufacturière",
  "Informatique & Digital",
  "Logistique & Transport",
  "Médical & Paramédical",
  "Métallurgie & Mécanique",
  "Services à la personne",
  "Textile & Habillement",
  "Tourisme & Loisirs",
  "Autre"
];
type FormData = {
  secteur: string;
  secteur_autre?: string;
  entreprise_nom: string;
  entreprise_adresse: string;
  entreprise_ville: string;
  entreprise_email: string;
  contact_nom: string;
  contact_email: string;
  contact_tel: string;
  evenement_date: string;
  evenement_type: "cv" | "jobday";
  fichier: File | null;
};

const defaultProfil = {
  pole_id: "",
  filiere_id: "",
  poste_intitule: "",
  poste_description: "",
  competences: "",
  nb_profils: 1,
  type_contrat: "Stage",
  salaire: "",
  date_debut: "",
  duree: "1 mois"
};

export default function DemandeEntreprisePage() {
  const { poles, filieres, loading, error } = useSettings();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    secteur: "",
    secteur_autre: "",
    entreprise_nom: "",
    entreprise_adresse: "",
    entreprise_ville: "",
    entreprise_email: "",
    contact_nom: "",
    contact_email: "",
    contact_tel: "",
    evenement_date: "",
    evenement_type: "cv",
    fichier: null,
  });
  const [fileName, setFileName] = useState("");
  const [profils, setProfils] = useState([ { ...defaultProfil } ]);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Gestion multi-profils
  const addProfil = () => setProfils([...profils, { ...defaultProfil }]);
  const removeProfil = (idx: number) => setProfils(profils.filter((_, i) => i !== idx));
  const handleProfilChange = (idx: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfils(prev => prev.map((p, i) => i === idx ? { ...p, [name]: value, ...(name === "pole_id" ? { filiere_id: "" } : {}) } : p));
  };
  const getFilieresForPole = (pole_id: string) => {
    // Filtrer directement par pole_id
    const filieresFiltrees = filieres.filter(f => f.pole_id === pole_id);
    
    return filieresFiltrees;
  };

  const steps = [
    "Informations entreprise",
    "Informations sur le(s) poste(s)",
    "Événement & fichiers"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Vérifier si c'est un input de type file
    if (e.target instanceof HTMLInputElement && e.target.type === "file") {
      const files = e.target.files;
      setForm(prev => ({ ...prev, fichier: files ? files[0] : null }));
      setFileName(files && files[0] ? files[0].name : "");
    } else {
      setForm(prev => ({ ...prev, [name]: value } as FormData));
    }
  };

  const handleReset = () => {
    setForm({
      secteur: "",
      secteur_autre: "",
      entreprise_nom: "",
      entreprise_adresse: "",
      entreprise_ville: "",
      entreprise_email: "",
      contact_nom: "",
      contact_email: "",
      contact_tel: "",
      evenement_date: "",
      evenement_type: "cv",
      fichier: null,
    });
    setFileName("");
    setProfils([ { ...defaultProfil } ]);
    setStep(1);
  };

  const validateStep = () => {
    if (step === 1) {
      return (
        form.secteur &&
        form.entreprise_nom &&
        form.entreprise_adresse &&
        form.contact_nom &&
        form.contact_email &&
        form.contact_tel
      );
    }
    if (step === 2) {
      return profils.every(p =>
        p.poste_intitule &&
        p.poste_description &&
        p.pole_id &&
        p.filiere_id &&
        p.nb_profils > 0 &&
        p.type_contrat &&
        p.duree &&
        p.competences &&
        p.date_debut
      );
    }
    return true;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setSuccess("");
    setErrorMsg("");
    let fichier_url = null;
    try {
      // 1. Upload du fichier PDF si présent
      if (form.fichier) {
        const filePath = `fiches_poste/${Date.now()}_${form.fichier.name}`;
        const uploadResult = await supabase.storage.from('fichiers').upload(filePath, form.fichier);
        if (uploadResult.error) throw new Error("Erreur lors de l'upload du fichier PDF");
        const { data: publicUrlData } = supabase.storage.from('fichiers').getPublicUrl(filePath);
        fichier_url = publicUrlData.publicUrl;
      }
      // 2. Insertion dans la table demandes_entreprises
      const { error: insertError } = await supabase.from('demandes_entreprises').insert([
        {
          secteur: form.secteur === "Autre" ? form.secteur_autre : form.secteur,
          entreprise_nom: form.entreprise_nom,
          entreprise_adresse: form.entreprise_adresse,
          entreprise_ville: form.entreprise_ville,
          entreprise_email: form.entreprise_email,
          contact_nom: form.contact_nom,
          contact_email: form.contact_email,
          contact_tel: form.contact_tel,
          profils: profils, // JSON des profils
          evenement_type: form.evenement_type,
          evenement_date: form.evenement_type === 'jobday' ? form.evenement_date : null,
          fichier_url,
          type_demande: form.evenement_type === 'jobday' ? 'evenement' : 'cv',
        }
      ]);
      if (insertError) {
        console.error('Erreur Supabase:', JSON.stringify(insertError, null, 2));
        throw new Error("Erreur lors de l'enregistrement de la demande");
      }
      setSuccess("Votre demande a bien été envoyée !");
      handleReset();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Erreur inconnue");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 px-4 sm:px-0">
      <div className="flex flex-col items-center pb-6">
        <div className="text-center text-lg font-semibold text-[#004080]">
          Bienvenue sur l’espace de gestion des demandes entreprises du COP Souss Massa
        </div>
      </div>
      <div className="w-full flex items-center justify-center gap-2 mb-2">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center">
            <div
              className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-white ${i + 1 <= step ? "bg-[#004080]" : "bg-gray-300"}`}
            >
              {i + 1}
            </div>
            <span className="text-xs mt-1 text-center" style={{ color: BLEU_FONCE }}>{s}</span>
          </div>
        ))}
      </div>
      <div className="w-full h-1 bg-gray-200 rounded mb-6">
        <div
          className="h-1 rounded bg-[#004080] transition-all"
          style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>
      {loading && <div className="text-gray-500">Chargement des pôles et filières...</div>}
      {error && <div className="text-red-600">Erreur : {error}</div>}
      {success && <div className="mb-4 text-green-700 font-semibold">{success}</div>}
      {errorMsg && <div className="mb-4 text-red-600 font-semibold">{errorMsg}</div>}
      {!loading && !error && (
        <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
          {/* Section 1 */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-8 border border-gray-100">
                              <h2 className="text-xl font-bold mb-4 sm:mb-6" style={{ color: BLEU_FONCE }}>1. Informations entreprise</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block font-medium mb-1">Secteur d’activité *</label>
                  <select name="secteur" value={form.secteur} onChange={handleChange} className="input input-bordered w-full" required>
                    <option value="">Sélectionner...</option>
                    {secteurs.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {form.secteur === "Autre" && (
                  <div>
                    <label className="block font-medium mb-1">Préciser le secteur *</label>
                    <input 
                      type="text" 
                      name="secteur_autre" 
                      value={form.secteur_autre || ""} 
                      onChange={handleChange} 
                      className="input input-bordered w-full bg-gray-50 border border-gray-300" 
                      required 
                      placeholder="Ex: Immobilier, Événementiel, etc." 
                    />
                  </div>
                )}
                <div>
                  <label className="block font-medium mb-1">Nom de l’entreprise *</label>
                  <input type="text" name="entreprise_nom" value={form.entreprise_nom} onChange={handleChange} className="input input-bordered w-full bg-gray-50 border border-gray-300" required placeholder="Saisir le nom de l’entreprise" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Email de l’entreprise *</label>
                  <input type="email" name="entreprise_email" value={form.entreprise_email} onChange={handleChange} className="input input-bordered w-full bg-gray-50 border border-gray-300" required placeholder="exemple@entreprise.com" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-medium mb-1">Adresse complète *</label>
                  <input type="text" name="entreprise_adresse" value={form.entreprise_adresse} onChange={handleChange} className="input input-bordered w-full bg-gray-50 border border-gray-300" required placeholder="Saisir l’adresse complète de l’entreprise" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Ville</label>
                  <input type="text" name="entreprise_ville" value={form.entreprise_ville} onChange={handleChange} className="input input-bordered w-full bg-gray-50 border border-gray-300" placeholder="Saisir la ville" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Nom du contact *</label>
                  <input type="text" name="contact_nom" value={form.contact_nom} onChange={handleChange} className="input input-bordered w-full bg-gray-50 border border-gray-300" required placeholder="Saisir le nom du contact" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Email *</label>
                  <input type="email" name="contact_email" value={form.contact_email} onChange={handleChange} className="input input-bordered w-full bg-gray-50 border border-gray-300" required placeholder="exemple@entreprise.com" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Téléphone *</label>
                  <input type="tel" name="contact_tel" value={form.contact_tel} onChange={handleChange} className="input input-bordered w-full bg-gray-50 border border-gray-300" required placeholder="Saisir le numéro de téléphone" />
                </div>
              </div>
            </div>
          )}
          {/* Section 2 : multi-profils */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <h2 className="text-xl font-bold mb-6" style={{ color: BLEU_FONCE }}>2. Informations sur le(s) poste(s)</h2>
              {profils.map((profil, idx) => (
                <div key={idx} className="bg-[#f4f4f4] rounded-lg p-6 mb-6 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-bold" style={{ color: BLEU_FONCE }}>
                      Profil {idx + 1}
                    </h3>
                    {profils.length > 1 && (
                      <button type="button" onClick={() => removeProfil(idx)} className="text-red-600 font-bold">Supprimer</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-medium mb-1">Intitulé du poste *</label>
                      <input type="text" name="poste_intitule" value={profil.poste_intitule} onChange={e => handleProfilChange(idx, e)} className="input input-bordered w-full" required placeholder="Ex : Technicien de maintenance" />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Pôle concerné *</label>
                      <select name="pole_id" value={profil.pole_id} onChange={e => handleProfilChange(idx, e)} className="input input-bordered w-full" required>
                        <option value="">Sélectionner...</option>
                        {poles.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Filière *</label>
                      <select name="filiere_id" value={profil.filiere_id} onChange={e => handleProfilChange(idx, e)} className="input input-bordered w-full bg-gray-50 border border-gray-300" required disabled={!profil.pole_id}>
                        <option value="">Sélectionner...</option>
                        {getFilieresForPole(profil.pole_id).map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Nombre de profils *</label>
                      <input type="number" name="nb_profils" value={profil.nb_profils} onChange={e => handleProfilChange(idx, e)} className="input input-bordered w-full" min={1} required placeholder="Ex : 2" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-medium mb-1">Description du poste *</label>
                      <textarea name="poste_description" value={profil.poste_description} onChange={e => handleProfilChange(idx, e)} className="input input-bordered w-full" rows={2} required placeholder="Décrivez brièvement les missions principales..." />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-medium mb-1">Compétences techniques *</label>
                      <input type="text" name="competences" value={profil.competences} onChange={e => handleProfilChange(idx, e)} className="input input-bordered w-full" required placeholder="Ex : Pack Office, soudure, gestion d'équipe..." />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Type de contrat *</label>
                      <select name="type_contrat" value={profil.type_contrat} onChange={e => handleProfilChange(idx, e)} className="input input-bordered w-full" required>
                        <option value="Stage">Stage</option>
                        <option value="CDD">CDD</option>
                        <option value="CDI">CDI</option>
                        <option value="Alternance">Alternance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Salaire ou indemnité</label>
                      <input type="text" name="salaire" value={profil.salaire} onChange={e => handleProfilChange(idx, e)} className="input input-bordered w-full" placeholder="Ex : 3000 MAD/mois ou Indemnité selon profil" />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Date de début souhaitée *</label>
                      <input type="date" name="date_debut" value={profil.date_debut} onChange={e => handleProfilChange(idx, e)} className="input input-bordered w-full" required />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Durée du contrat *</label>
                      <select name="duree" value={profil.duree} onChange={e => handleProfilChange(idx, e)} className="input input-bordered w-full" required>
                        {dureesContrat.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addProfil} className="mt-2 px-4 py-2 rounded bg-[#004080] text-white font-semibold">
                Ajouter un profil
              </button>
            </div>
          )}
          {/* Section 3 */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <h2 className="text-xl font-bold mb-6" style={{ color: BLEU_FONCE }}>3. Événement & fichiers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 mb-4">
                  <label className="block font-medium mb-1">Souhaitez-vous organiser un Job Day (journée de recrutement) au COP ?</label>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="evenement_type" value="jobday" checked={form.evenement_type === 'jobday'} onChange={e => setForm(prev => ({ ...prev, evenement_type: e.target.value }))} className="w-4 h-4" />
                      <span className="text-sm sm:text-base">Oui, je souhaite organiser un Job Day</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="evenement_type" value="cv" checked={form.evenement_type === 'cv'} onChange={e => setForm(prev => ({ ...prev, evenement_type: e.target.value }))} className="w-4 h-4" />
                      <span className="text-sm sm:text-base">Non, je souhaite seulement recevoir des CV ciblés</span>
                    </label>
                  </div>
                </div>
                {form.evenement_type === 'jobday' && (
                  <div className="md:col-span-2 mb-4">
                    <label className="block font-medium mb-1">Date souhaitée pour l’événement</label>
                    <input type="date" name="evenement_date" value={form.evenement_date} onChange={handleChange} className="input input-bordered w-full" />
                    <div className="text-xs text-gray-500 mt-1">La date sera confirmée par le COP</div>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block font-medium mb-1">Fiche de poste (PDF)</label>
                  <input type="file" accept=".pdf" name="fichier" onChange={handleChange} className="block mt-1" />
                  {fileName && <span className="text-sm text-gray-600">{fileName}</span>}
                </div>
              </div>
            </div>
          )}
          {/* Navigation boutons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-2 mt-6 sm:mt-8">
                          {step > 1 && (
                <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-3 sm:px-4 sm:py-2 rounded bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400 text-base sm:text-sm">Précédent</button>
              )}
            <div className="flex-1 hidden sm:block" />
            {step < 3 && (
              <button
                type="button"
                onClick={() => validateStep() && setStep(step + 1)}
                className="px-4 py-2 rounded font-semibold"
                style={{ background: BLEU_FONCE, color: "white" }}
              >
                Suivant
              </button>
            )}
            {step === 3 && (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 mr-2"
                  disabled={sending}
                >
                  Réinitialiser
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded font-semibold"
                  style={{ background: BLEU_FONCE, color: "white" }}
                  disabled={sending}
                >
                  {sending ? "Envoi en cours..." : "Envoyer ma demande"}
                </button>
              </>
            )}
          </div>
        </form>
      )}
    </div>
  );
} 