"use client";
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { sendNewDemandeNotification } from '@/lib/email';

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

type Pole = {
  id: string;
  nom: string;
};

type Filiere = {
  id: string;
  nom: string;
  pole_id: string;
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

// Hook pour debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function DemandeEntreprisePage() {
  const [poles, setPoles] = useState<Pole[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [isFormDirty, setIsFormDirty] = useState(false);
  
  // Debounced form pour éviter les re-renders excessifs
  const debouncedForm = useDebounce(form, 300);
  const debouncedProfils = useDebounce(profils, 300);
  
  // Refs pour éviter les re-renders inutiles
  const formRef = useRef<HTMLFormElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Chargement dédié pour cette page (évite les dépendances inutiles)
  useEffect(() => {
    const loadPolesAndFilieres = async () => {
      try {
        setLoading(true);
        setError(null);
        const [polesRes, filieresRes] = await Promise.all([
          fetch('/api/poles'),
          fetch('/api/filieres'),
        ]);

        if (!polesRes.ok) {
          throw new Error('Impossible de charger les pôles');
        }
        if (!filieresRes.ok) {
          throw new Error('Impossible de charger les filières');
        }

        const polesData = await polesRes.json();
        const filieresData = await filieresRes.json();

        setPoles(Array.isArray(polesData) ? polesData : []);
        setFilieres(Array.isArray(filieresData) ? filieresData : []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Erreur de chargement';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadPolesAndFilieres();
  }, []);

  // Sauvegarde automatique dans localStorage
  useEffect(() => {
    if (isFormDirty) {
      const formData = {
        form,
        profils,
        step,
        timestamp: Date.now()
      };
      localStorage.setItem('demande-entreprise-draft', JSON.stringify(formData));
    }
  }, [form, profils, step, isFormDirty]);

  // Restauration automatique au chargement
  useEffect(() => {
    const savedData = localStorage.getItem('demande-entreprise-draft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Vérifier que les données ne sont pas trop anciennes (24h)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setForm(parsed.form);
          setProfils(parsed.profils);
          setStep(parsed.step);
          setIsFormDirty(true);
        }
      } catch (e) {
        console.warn('Erreur lors de la restauration des données:', e);
      }
    }
  }, []);

  // Gestion multi-profils optimisée
  const addProfil = useCallback(() => {
    setProfils(prev => [...prev, { ...defaultProfil }]);
    setIsFormDirty(true);
  }, []);

  const removeProfil = useCallback((idx: number) => {
    setProfils(prev => prev.filter((_, i) => i !== idx));
    setIsFormDirty(true);
  }, []);

  const handleProfilChange = useCallback((idx: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfils(prev => prev.map((p, i) => 
      i === idx ? { 
        ...p, 
        [name]: value, 
        ...(name === "pole_id" ? { filiere_id: "" } : {}) 
      } : p
    ));
    setIsFormDirty(true);
  }, []);

  const getFilieresForPole = useCallback((pole_id: string) => {
    return filieres.filter(f => f.pole_id === pole_id);
  }, [filieres]);

  const steps = [
    { title: "Détails entreprise", icon: "🏢", description: "Informations de l'entreprise" },
    { title: "Détails des postes", icon: "👤", description: "Description des postes" },
    { title: "Événement & fichiers", icon: "📁", description: "Job Day et documents" }
  ];

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Vérifier si c'est un input de type file
    if (e.target instanceof HTMLInputElement && e.target.type === "file") {
      const files = e.target.files;
      setForm(prev => ({ ...prev, fichier: files ? files[0] : null }));
      setFileName(files && files[0] ? files[0].name : "");
    } else {
      setForm(prev => ({ ...prev, [name]: value } as FormData));
    }
    setIsFormDirty(true);
  }, []);

  // Gestion spéciale pour le copier-coller
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    // Délai pour permettre au paste de se terminer
    setTimeout(() => {
      setIsFormDirty(true);
    }, 100);
  }, []);

  const handleReset = useCallback(() => {
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
    setIsFormDirty(false);
    // Supprimer les données sauvegardées
    localStorage.removeItem('demande-entreprise-draft');
  }, []);

  const validateStep = useCallback(() => {
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
  }, [step, form, profils]);

  // Soumission du formulaire optimisée
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
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
      const { data: insertedData, error: insertError } = await supabase.from('demandes_entreprises').insert([
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
          statut: 'en_attente', // Statut par défaut pour les nouvelles demandes
        }
      ]).select();
      
      if (insertError) {
        console.error('Erreur Supabase:', JSON.stringify(insertError, null, 2));
        throw new Error("Erreur lors de l'enregistrement de la demande");
      }

      // 3. Envoyer la notification par email
      if (insertedData && insertedData[0]) {
        try {
          // L'email ne doit jamais bloquer la validation de la demande.
          await Promise.race([
            sendNewDemandeNotification({
              id: insertedData[0].id,
              nom_entreprise: form.entreprise_nom,
              nom_contact: form.contact_nom,
              email: form.contact_email,
              telephone: form.contact_tel,
              type_demande: form.evenement_type === 'jobday' ? 'Événement' : 'CV',
              message: `Demande de ${form.evenement_type === 'jobday' ? 'Job Day' : 'CV'}`
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout envoi email")), 8000)
            )
          ]);
          console.log('✅ Email de notification traité');
        } catch (emailError) {
          console.error('⚠️ Erreur envoi email (non bloquant):', emailError);
          // On continue même si l'email échoue
        }
      }

      setSuccess("Votre demande a bien été envoyée !");
      // Supprimer les données sauvegardées après succès
      localStorage.removeItem('demande-entreprise-draft');
      handleReset();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Erreur inconnue");
    } finally {
      setSending(false);
    }
  }, [form, profils, handleReset]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto py-6 sm:py-12 px-4 sm:px-6">
        {/* Header avec design moderne */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Espace de gestion des demandes entreprises
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Centre d'Orientation Professionnelle Souss Massa
          </p>
          
          {isFormDirty && (
            <div className="inline-flex items-center gap-2 text-sm text-green-700 bg-green-100 px-4 py-2 rounded-full mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Données sauvegardées automatiquement
            </div>
          )}
          
          <div className="max-w-2xl mx-auto text-sm text-gray-600 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl border border-blue-200">
            <strong className="text-blue-700">💡 Conseil :</strong> Vous pouvez copier-coller vos informations sans problème. 
            Vos données sont sauvegardées automatiquement et restaurées si vous actualisez la page.
        </div>
      </div>
        {/* Barre de progression moderne avec icônes */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between relative">
            {/* Ligne de progression */}
            <div className="absolute top-8 left-8 right-8 h-1 bg-gray-200 rounded-full">
              <div
                className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
            
        {steps.map((s, i) => (
              <div key={s.title} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-16 h-16 rounded-full flex flex-col items-center justify-center font-bold text-white shadow-lg transition-all duration-300 ${
                    i + 1 <= step 
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 scale-110" 
                      : "bg-gray-300 scale-100"
                  }`}
                >
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-xs font-semibold">{i + 1}</span>
                </div>
                <div className="mt-3 text-center">
                  <h3 className={`text-sm font-semibold ${i + 1 <= step ? "text-blue-700" : "text-gray-500"}`}>
                    {s.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{s.description}</p>
            </div>
          </div>
        ))}
      </div>
      </div>
      {loading && <div className="text-gray-500">Chargement des pôles et filières...</div>}
      {error && <div className="text-red-600">Erreur : {error}</div>}
        {success && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Demande envoyée avec succès !</h3>
                <p className="text-green-700">
                  Votre demande a bien été enregistrée. Vous recevrez un e-mail de suivi sous 24h.
                </p>
              </div>
            </div>
          </div>
        )}
        {errorMsg && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">Erreur lors de l'envoi</h3>
                <p className="text-red-700">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}
      {!loading && !error && (
          <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Section 1 */}
          {step === 1 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">🏢</span>
                  </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Détails entreprise</h2>
                    <p className="text-gray-600">Informations sur votre entreprise</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Secteur d'activité <span className="text-red-500">*</span>
                    </label>
                    <select 
                      name="secteur" 
                      value={form.secteur} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                      required
                    >
                      <option value="">Sélectionner un secteur...</option>
                    {secteurs.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {form.secteur === "Autre" && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Préciser le secteur <span className="text-red-500">*</span>
                      </label>
                    <input 
                      type="text" 
                      name="secteur_autre" 
                      value={form.secteur_autre || ""} 
                      onChange={handleChange} 
                        onPaste={handlePaste}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                      required 
                      placeholder="Ex: Immobilier, Événementiel, etc." 
                    />
                  </div>
                )}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Nom de l'entreprise <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="entreprise_nom" 
                      value={form.entreprise_nom} 
                      onChange={handleChange} 
                      onPaste={handlePaste}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                      required 
                      placeholder="Saisir le nom de l'entreprise"
                      autoComplete="organization"
                    />
                </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Email de l'entreprise <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      name="entreprise_email" 
                      value={form.entreprise_email} 
                      onChange={handleChange} 
                      onPaste={handlePaste}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                      required 
                      placeholder="exemple@entreprise.com"
                      autoComplete="email"
                    />
                </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Adresse complète <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="entreprise_adresse" 
                      value={form.entreprise_adresse} 
                      onChange={handleChange} 
                      onPaste={handlePaste}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                      required 
                      placeholder="Saisir l'adresse complète de l'entreprise"
                      autoComplete="street-address"
                    />
                </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Ville
                    </label>
                    <input 
                      type="text" 
                      name="entreprise_ville" 
                      value={form.entreprise_ville} 
                      onChange={handleChange} 
                      onPaste={handlePaste}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                      placeholder="Saisir la ville"
                      autoComplete="address-level2"
                    />
                </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Nom du contact <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="contact_nom" 
                      value={form.contact_nom} 
                      onChange={handleChange} 
                      onPaste={handlePaste}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                      required 
                      placeholder="Saisir le nom du contact"
                      autoComplete="name"
                    />
                </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Email du contact <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      name="contact_email" 
                      value={form.contact_email} 
                      onChange={handleChange} 
                      onPaste={handlePaste}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                      required 
                      placeholder="exemple@entreprise.com"
                      autoComplete="email"
                    />
                </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Téléphone <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="tel" 
                      name="contact_tel" 
                      value={form.contact_tel} 
                      onChange={handleChange} 
                      onPaste={handlePaste}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                      required 
                      placeholder="Ex: 05 12 34 56 78"
                      autoComplete="tel"
                    />
                </div>
              </div>
            </div>
          )}
          {/* Section 2 : multi-profils */}
          {step === 2 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">👤</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Détails des postes</h2>
                    <p className="text-gray-600">Description des postes à pourvoir</p>
                  </div>
                </div>
              {profils.map((profil, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{idx + 1}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                      Profil {idx + 1}
                    </h3>
                      </div>
                    {profils.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeProfil(idx)} 
                          className="px-3 py-1 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          Supprimer
                        </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Intitulé du poste <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          name="poste_intitule" 
                          value={profil.poste_intitule} 
                          onChange={e => handleProfilChange(idx, e)} 
                          onPaste={handlePaste}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                          required 
                          placeholder="Ex : Technicien de maintenance" 
                        />
                    </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Pôle concerné <span className="text-red-500">*</span>
                        </label>
                        <select 
                          name="pole_id" 
                          value={profil.pole_id} 
                          onChange={e => handleProfilChange(idx, e)} 
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                          required
                        >
                          <option value="">Sélectionner un pôle...</option>
                        {poles.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                      </select>
                    </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Filière <span className="text-red-500">*</span>
                        </label>
                        <select 
                          name="filiere_id" 
                          value={profil.filiere_id} 
                          onChange={e => handleProfilChange(idx, e)} 
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                          required 
                          disabled={!profil.pole_id}
                        >
                          <option value="">Sélectionner une filière...</option>
                        {getFilieresForPole(profil.pole_id).map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                      </select>
                    </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Nombre de profils <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="number" 
                          name="nb_profils" 
                          value={profil.nb_profils} 
                          onChange={e => handleProfilChange(idx, e)} 
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                          min={1} 
                          required 
                          placeholder="Ex : 2" 
                        />
                    </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Description du poste <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                          name="poste_description" 
                          value={profil.poste_description} 
                          onChange={e => handleProfilChange(idx, e)} 
                          onPaste={handlePaste}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm resize-none" 
                          rows={3} 
                          required 
                          placeholder="Décrivez brièvement les missions principales..."
                          style={{ minHeight: '100px' }}
                        />
                    </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Compétences techniques <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          name="competences" 
                          value={profil.competences} 
                          onChange={e => handleProfilChange(idx, e)} 
                          onPaste={handlePaste}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                          required 
                          placeholder="Ex : Pack Office, soudure, gestion d'équipe..." 
                        />
                    </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Type de contrat <span className="text-red-500">*</span>
                        </label>
                        <select 
                          name="type_contrat" 
                          value={profil.type_contrat} 
                          onChange={e => handleProfilChange(idx, e)} 
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                          required
                        >
                        <option value="Stage">Stage</option>
                        <option value="CDD">CDD</option>
                        <option value="CDI">CDI</option>
                        <option value="Alternance">Alternance</option>
                      </select>
                    </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Salaire ou indemnité
                        </label>
                        <input 
                          type="text" 
                          name="salaire" 
                          value={profil.salaire} 
                          onChange={e => handleProfilChange(idx, e)} 
                          onPaste={handlePaste}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                          placeholder="Ex : 3000 MAD/mois ou Indemnité selon profil" 
                        />
                        <p className="text-xs text-gray-500">Ex. 3000 MAD/mois</p>
                    </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Date de début souhaitée <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="date" 
                          name="date_debut" 
                          value={profil.date_debut} 
                          onChange={e => handleProfilChange(idx, e)} 
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                          required 
                        />
                    </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Durée du contrat <span className="text-red-500">*</span>
                        </label>
                        <select 
                          name="duree" 
                          value={profil.duree} 
                          onChange={e => handleProfilChange(idx, e)} 
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                          required
                        >
                        {dureesContrat.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
                <button 
                  type="button" 
                  onClick={addProfil} 
                  className="mt-6 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  + Ajouter un profil
              </button>
            </div>
          )}
          {/* Section 3 */}
          {step === 3 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">📁</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Événement & fichiers</h2>
                    <p className="text-gray-600">Job Day et documents</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Souhaitez-vous organiser un Job Day (journée de recrutement) au COP ?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                        <input 
                          type="radio" 
                          name="evenement_type" 
                          value="jobday" 
                          checked={form.evenement_type === 'jobday'} 
                          onChange={e => setForm(prev => ({ ...prev, evenement_type: e.target.value }))} 
                          className="w-5 h-5 text-blue-600" 
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Oui, organiser un Job Day</span>
                          <p className="text-xs text-gray-500">Journée de recrutement au COP</p>
                        </div>
                    </label>
                      <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                        <input 
                          type="radio" 
                          name="evenement_type" 
                          value="cv" 
                          checked={form.evenement_type === 'cv'} 
                          onChange={e => setForm(prev => ({ ...prev, evenement_type: e.target.value }))} 
                          className="w-5 h-5 text-blue-600" 
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Non, recevoir des CV ciblés</span>
                          <p className="text-xs text-gray-500">Candidatures directes</p>
                        </div>
                    </label>
                  </div>
                </div>
                  
                {form.evenement_type === 'jobday' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Date souhaitée pour l'événement
                      </label>
                      <input 
                        type="date" 
                        name="evenement_date" 
                        value={form.evenement_date} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm" 
                      />
                      <p className="text-xs text-gray-500">La date sera confirmée par le COP</p>
                  </div>
                )}
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Fiche de poste (PDF)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                      <input 
                        type="file" 
                        accept=".pdf" 
                        name="fichier" 
                        onChange={handleChange} 
                        className="hidden" 
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="text-gray-400 mb-2">
                          <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-600">
                          {fileName ? fileName : "Cliquez pour sélectionner un fichier PDF"}
                        </span>
                      </label>
                    </div>
                    {fileName && (
                      <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        ✓ Fichier sélectionné : {fileName}
                      </p>
                    )}
                </div>
              </div>
            </div>
          )}
            {/* Navigation boutons modernes */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
                          {step > 1 && (
                <button 
                  type="button" 
                  onClick={() => setStep(step - 1)} 
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                >
                  ← Précédent
                </button>
              )}
              
            <div className="flex-1 hidden sm:block" />
              
            {step < 3 && (
              <button
                type="button"
                  onClick={() => {
                    if (validateStep()) {
                      setStep(step + 1);
                    } else {
                      alert('Veuillez remplir tous les champs obligatoires avant de continuer.');
                    }
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Suivant →
              </button>
            )}
              
            {step === 3 && (
                <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                  disabled={sending}
                >
                  Réinitialiser
                </button>
                <button
                  type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={sending}
                >
                    {sending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Envoi en cours...
                      </span>
                    ) : (
                      "✓ Envoyer ma demande"
                    )}
                </button>
                </div>
            )}
          </div>
        </form>
      )}
      </div>
    </div>
  );
} 