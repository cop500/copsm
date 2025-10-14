'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function EnqueteInsertionPublic() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    genre: '',
    pole_id: '',
    filiere_id: '',
    poursuite_etudes: false,
    type_formation: '',
    option_specialite: '',
    ville_formation: '',
    etablissement: '',
    en_activite: false,
    type_activite: '',
    entreprise_nom: '',
    poste_occupe: '',
    brand_activite: '',
    type_stage: '',
    organisme_nom: '',
  })

  const [poles, setPoles] = useState<any[]>([])
  const [filieres, setFilieres] = useState<any[]>([])

  useEffect(() => {
    loadPolesFilieres()
  }, [])

  const loadPolesFilieres = async () => {
    try {
      const [polesRes, filieresRes] = await Promise.all([
        supabase.from('poles').select('*').order('nom'),
        supabase.from('filieres').select('*').order('nom'),
      ])

      if (polesRes.data) setPoles(polesRes.data)
      if (filieresRes.data) setFilieres(filieresRes.data)
    } catch (err) {
      console.error('Erreur chargement pôles/filières:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const startTime = Date.now()

      if (!formData.nom || !formData.prenom || !formData.genre) {
        throw new Error('Veuillez remplir tous les champs obligatoires')
      }

      if (!formData.pole_id || !formData.filiere_id) {
        throw new Error('Veuillez sélectionner un pôle et une filière')
      }

      if (formData.poursuite_etudes) {
        if (!formData.type_formation || !formData.option_specialite || !formData.ville_formation || !formData.etablissement) {
          throw new Error('Veuillez remplir tous les champs de poursuite d\'études')
        }
      }

      if (formData.en_activite) {
        if (!formData.type_activite) {
          throw new Error('Veuillez sélectionner un type d\'activité')
        }

        if (formData.type_activite === 'emploi_salarie') {
          if (!formData.entreprise_nom || !formData.poste_occupe) {
            throw new Error('Veuillez remplir les informations de l\'emploi')
          }
        } else if (formData.type_activite === 'travail_independant') {
          if (!formData.brand_activite) {
            throw new Error('Veuillez remplir le nom de votre activité')
          }
        } else if (formData.type_activite === 'stage') {
          if (!formData.type_stage || !formData.organisme_nom) {
            throw new Error('Veuillez remplir les informations du stage')
          }
        }
      }

      const pole = poles.find(p => p.id === formData.pole_id)
      const filiere = filieres.find(f => f.id === formData.filiere_id)

      const { data: reponse, error: insertError } = await supabase
        .from('enquete_reponses')
        .insert({
          nom: formData.nom,
          prenom: formData.prenom,
          genre: formData.genre,
          pole_id: formData.pole_id,
          pole_nom: pole?.nom,
          filiere_id: formData.filiere_id,
          filiere_nom: filiere?.nom,
          poursuite_etudes: formData.poursuite_etudes,
          type_formation: formData.poursuite_etudes ? formData.type_formation : null,
          option_specialite: formData.poursuite_etudes ? formData.option_specialite : null,
          ville_formation: formData.poursuite_etudes ? formData.ville_formation : null,
          etablissement: formData.poursuite_etudes ? formData.etablissement : null,
          en_activite: formData.en_activite,
          type_activite: formData.en_activite ? formData.type_activite : null,
          entreprise_nom: formData.type_activite === 'emploi_salarie' ? formData.entreprise_nom : null,
          poste_occupe: formData.type_activite === 'emploi_salarie' ? formData.poste_occupe : null,
          brand_activite: formData.type_activite === 'travail_independant' ? formData.brand_activite : null,
          type_stage: formData.type_activite === 'stage' ? formData.type_stage : null,
          organisme_nom: formData.type_activite === 'stage' ? formData.organisme_nom : null,
          duree_remplissage: Math.floor((Date.now() - startTime) / 1000),
        })
        .select()
        .single()

      if (insertError) throw insertError

      setSuccess(true)

      setTimeout(() => {
        router.push('/enquete-insertion/merci')
      }, 3000)
    } catch (err: any) {
      console.error('Erreur soumission:', err)
      setError(err.message || 'Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Merci !</h1>
          <p className="text-gray-600 mb-4">Votre réponse a été enregistrée avec succès.</p>
          <p className="text-sm text-gray-500">Redirection en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100 py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-slate-900/10 to-gray-900/10"></div>
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1920&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-slate-900/20"></div>
      
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-2xl p-8 mb-6 relative overflow-hidden border border-blue-500/20">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          <div className="relative z-10 text-center">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-3">
              <span className="text-white text-sm font-semibold">📊 ENQUÊTE</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Enquête d'Insertion Professionnelle
            </h1>
            <p className="text-blue-100 text-lg font-medium">
              Votre avis nous intéresse !
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom * <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom * <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Genre * <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              {['homme', 'femme'].map((genre) => (
                <label key={genre} className="flex items-center space-x-2 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="genre"
                    value={genre}
                    checked={formData.genre === genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                    required
                  />
                  <span className="text-gray-700 capitalize font-medium">{genre}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pôle * <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.pole_id}
                onChange={(e) => setFormData({ ...formData, pole_id: e.target.value, filiere_id: '' })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              >
                <option value="">Sélectionner un pôle</option>
                {poles.map((pole) => (
                  <option key={pole.id} value={pole.id}>
                    {pole.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filière * <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.filiere_id}
                onChange={(e) => setFormData({ ...formData, filiere_id: e.target.value })}
                disabled={!formData.pole_id}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {formData.pole_id ? 'Sélectionner une filière' : 'Sélectionnez d\'abord un pôle'}
                </option>
                {filieres
                  .filter(f => f.pole_id === formData.pole_id)
                  .map((filiere) => (
                    <option key={filiere.id} value={filiere.id}>
                      {filiere.nom}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Poursuivez-vous actuellement vos études ? * <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
                <input
                  type="radio"
                  name="poursuite_etudes"
                  value="oui"
                  checked={formData.poursuite_etudes === true}
                  onChange={() => setFormData({ ...formData, poursuite_etudes: true })}
                  className="w-4 h-4 text-blue-600"
                  required
                />
                <span className="text-gray-700 font-medium">Oui</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
                <input
                  type="radio"
                  name="poursuite_etudes"
                  value="non"
                  checked={formData.poursuite_etudes === false}
                  onChange={() => setFormData({ ...formData, poursuite_etudes: false })}
                  className="w-4 h-4 text-blue-600"
                  required
                />
                <span className="text-gray-700 font-medium">Non</span>
              </label>
            </div>
          </div>

          {formData.poursuite_etudes && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de formation * <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.type_formation}
                  onChange={(e) => setFormData({ ...formData, type_formation: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                >
                  <option value="">Sélectionner un type</option>
                  <option value="passerelle">Passerelle</option>
                  <option value="licence_pro">Licence professionnelle</option>
                  <option value="licence_excellence">Licence d'excellence</option>
                  <option value="cycle_ingenieur">Cycle d'ingénieur</option>
                  <option value="formation_qualifiante">Formation qualifiante</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Option/Spécialité * <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.option_specialite}
                  onChange={(e) => setFormData({ ...formData, option_specialite: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                  placeholder="Ex: Marketing Digital"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville * <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ville_formation}
                    onChange={(e) => setFormData({ ...formData, ville_formation: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                    placeholder="Ex: Casablanca"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Établissement * <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.etablissement || ''}
                    onChange={(e) => setFormData({ ...formData, etablissement: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                    placeholder="Ex: Université Hassan II"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Êtes-vous actuellement en activité ? * <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
                <input
                  type="radio"
                  name="en_activite"
                  value="oui"
                  checked={formData.en_activite === true}
                  onChange={() => setFormData({ ...formData, en_activite: true })}
                  className="w-4 h-4 text-blue-600"
                  required
                />
                <span className="text-gray-700 font-medium">Oui</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
                <input
                  type="radio"
                  name="en_activite"
                  value="non"
                  checked={formData.en_activite === false}
                  onChange={() => setFormData({ ...formData, en_activite: false })}
                  className="w-4 h-4 text-blue-600"
                  required
                />
                <span className="text-gray-700 font-medium">Non</span>
              </label>
            </div>
          </div>

          {formData.en_activite && (
            <div className="bg-green-50 p-4 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'activité * <span className="text-red-500">*</span>
                </label>
                <select
                  required={formData.en_activite}
                  value={formData.type_activite}
                  onChange={(e) => setFormData({ ...formData, type_activite: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                >
                  <option value="">Sélectionner un type</option>
                  <option value="emploi_salarie">Emploi salarié</option>
                  <option value="travail_independant">Travail indépendant / Auto-entrepreneur</option>
                  <option value="stage">Stage</option>
                </select>
              </div>

              {formData.type_activite === 'emploi_salarie' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intitulé de l'entreprise * <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.entreprise_nom}
                      onChange={(e) => setFormData({ ...formData, entreprise_nom: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                      placeholder="Ex: Google Morocco"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Poste occupé * <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.poste_occupe}
                      onChange={(e) => setFormData({ ...formData, poste_occupe: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                      placeholder="Ex: Développeur Full Stack"
                    />
                  </div>
                </div>
              )}

              {formData.type_activite === 'travail_independant' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du brand/activité * <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand_activite}
                    onChange={(e) => setFormData({ ...formData, brand_activite: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                    placeholder="Ex: Mon Agence Web"
                  />
                </div>
              )}

              {formData.type_activite === 'stage' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de stage * <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.type_stage}
                      onChange={(e) => setFormData({ ...formData, type_stage: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                    >
                      <option value="">Sélectionner un type</option>
                      <option value="insertion">Stage d'insertion</option>
                      <option value="perfectionnement">Stage de perfectionnement</option>
                      <option value="professionnel">Stage professionnel</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intitulé de l'organisme * <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.organisme_nom}
                      onChange={(e) => setFormData({ ...formData, organisme_nom: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                      placeholder="Ex: Ministère de l'Éducation"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Soumettre l'enquête
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </form>

        <div className="text-center text-sm text-gray-600 mt-6 bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
          <p className="font-medium">🔒 Vos données sont confidentielles et seront utilisées uniquement à des fins statistiques.</p>
        </div>
      </div>
    </div>
  )
}

