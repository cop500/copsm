'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/hooks/useSettings'
// import './styles.css' // Fichier supprimé pour éviter les erreurs CSS
import { 
  Calendar, Clock, MapPin, Users, BookOpen, CheckCircle, XCircle,
  AlertCircle, Loader2, ArrowRight, Star, Zap, Target, Award, Search
} from 'lucide-react'

interface Atelier {
  id: string
  titre: string
  description: string
  date_debut: string
  date_fin: string
  capacite_max: number
  capacite_actuelle: number
  pole: string | null
  filliere: string | null
  lieu: string
  statut: string
}

interface InscriptionForm {
  nom: string
  email: string
  pole: string
  filliere: string
  telephone?: string
}

export default function InscriptionAteliersPage() {
  const { poles, filieres } = useSettings()
  const [ateliers, setAteliers] = useState<Atelier[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAtelier, setSelectedAtelier] = useState<Atelier | null>(null)
  const [showInscriptionForm, setShowInscriptionForm] = useState(false)
  const [inscriptionSuccess, setInscriptionSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filtres
  const [filterPole, setFilterPole] = useState('')
  const [filterFiliere, setFilterFiliere] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Formulaire d'inscription
  const [formData, setFormData] = useState<InscriptionForm>({
    nom: '',
    email: '',
    pole: '',
    filliere: '',
    telephone: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Charger les ateliers disponibles
  const loadAteliers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Chargement des ateliers...')
      
      // Utiliser une requête publique sans authentification
      const { data, error } = await supabase
        .from('ateliers')
        .select('*')
        .eq('actif', true)
        .gte('date_debut', new Date().toISOString())
        .order('date_debut', { ascending: true })

      if (error) {
        console.error('❌ Erreur chargement ateliers:', error)
        // Si erreur de permission, essayer sans authentification
        if (error.message.includes('permission') || error.message.includes('auth')) {
          console.log('🔄 Tentative sans authentification...')
          const { data: publicData, error: publicError } = await supabase
            .from('ateliers')
            .select('*')
            .eq('actif', true)
            .gte('date_debut', new Date().toISOString())
            .order('date_debut', { ascending: true })
          
          if (publicError) {
            console.error('❌ Erreur même sans auth:', publicError)
            throw publicError
          }
          
          console.log('✅ Ateliers chargés (public):', publicData?.length || 0)
          setAteliers(publicData || [])
          return
        }
        throw error
      }
      
             console.log('✅ Ateliers chargés:', data?.length || 0)
       console.log('📋 Liste des ateliers:', data)
       console.log('🔍 Détails des ateliers:')
       if (data && data.length > 0) {
         data.forEach((atelier, index) => {
           console.log(`  Atelier ${index + 1}:`, {
             id: atelier.id,
             titre: atelier.titre,
             date_debut: atelier.date_debut,
             capacite_actuelle: atelier.capacite_actuelle,
             capacite_max: atelier.capacite_max,
             actif: atelier.actif,
             statut: atelier.statut
           })
         })
       }
       setAteliers(data || [])
    } catch (err: any) {
      console.error('❌ Erreur chargement ateliers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les filières selon le pôle sélectionné avec optimisation
  const filieresFiltered = React.useMemo(() => {
    if (!formData.pole) return []
    
    const pole = poles.find(p => p.nom === formData.pole)
    return pole ? filieres.filter(f => f.pole_id === pole.id) : []
  }, [formData.pole, poles, filieres])

  // Filtrer les ateliers avec optimisation
  const filteredAteliers = React.useMemo(() => {
    console.log('🔍 Début du filtrage des ateliers...')
    console.log('🔍 Ateliers totaux:', ateliers.length)
    
    const filtered = ateliers.filter(atelier => {
      const matchesSearch = searchTerm === '' || 
        atelier.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (atelier.description && atelier.description.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesPole = !filterPole || atelier.pole === filterPole
      const matchesFiliere = !filterFiliere || atelier.filliere === filterFiliere
             const hasCapacity = true // Temporairement désactivé pour tester

       console.log(`🔍 Atelier "${atelier.titre}":`, {
         matchesSearch,
         matchesPole,
         matchesFiliere,
         hasCapacity,
         capacite_actuelle: atelier.capacite_actuelle,
         capacite_max: atelier.capacite_max
       })

       return matchesSearch && matchesPole && matchesFiliere && hasCapacity
    })
    
    console.log('🔍 Ateliers filtrés:', filtered.length, 'sur', ateliers.length)
    return filtered
  }, [ateliers, searchTerm, filterPole, filterFiliere])

  // S'inscrire à un atelier
  const handleInscription = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Valider les données
      if (!formData.nom || !formData.email || !formData.pole || !formData.filliere) {
        throw new Error('Veuillez remplir tous les champs obligatoires')
      }

      // Vérifier si l'utilisateur n'est pas déjà inscrit
      const { data: existingInscription, error: checkError } = await supabase
        .from('inscriptions_ateliers')
        .select('*')
        .eq('atelier_id', selectedAtelier!.id)
        .eq('stagiaire_email', formData.email)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingInscription) {
        throw new Error('Vous êtes déjà inscrit à cet atelier')
      }

      // Vérifier la capacité
      if (selectedAtelier!.capacite_actuelle >= selectedAtelier!.capacite_max) {
        throw new Error('Cet atelier est complet')
      }

      // Créer l'inscription
      const { error: insertError } = await supabase
        .from('inscriptions_ateliers')
        .insert([{
          atelier_id: selectedAtelier!.id,
          stagiaire_nom: formData.nom,
          stagiaire_email: formData.email,
          pole: formData.pole,
          filliere: formData.filliere,
          stagiaire_telephone: formData.telephone,
          statut: 'en_attente',
          date_inscription: new Date().toISOString()
        }])

      if (insertError) throw insertError

      // Mettre à jour la capacité de l'atelier
      const { error: updateError } = await supabase
        .from('ateliers')
        .update({ capacite_actuelle: selectedAtelier!.capacite_actuelle + 1 })
        .eq('id', selectedAtelier!.id)

      if (updateError) throw updateError

      // Succès
      setInscriptionSuccess(true)
      setFormData({
        nom: '',
        email: '',
        pole: '',
        filliere: '',
        telephone: ''
      })
      
      // Recharger les ateliers
      await loadAteliers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Ouvrir le formulaire d'inscription
  const openInscriptionForm = (atelier: Atelier) => {
    console.log('🔵 Clic sur le bouton S\'inscrire pour l\'atelier:', atelier.titre)
    console.log('🔵 Données de l\'atelier:', atelier)
    setSelectedAtelier(atelier)
    setShowInscriptionForm(true)
    setInscriptionSuccess(false)
    setError(null)
  }

  // Fermer le formulaire
  const closeInscriptionForm = () => {
    setShowInscriptionForm(false)
    setSelectedAtelier(null)
    setInscriptionSuccess(false)
    setError(null)
  }

  useEffect(() => {
    console.log('🚀 Initialisation de la page d\'inscription aux ateliers')
    loadAteliers()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Chargement des ateliers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Background avec image et overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-blue-900/90">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: "url('/bg-entreprise.jpg')"
          }}
        ></div>
      </div>
        
      {/* Contenu principal */}
      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header avec carreau central - Design moderne */}
          <div className="text-center mb-8 sm:mb-16">
            <div className="inline-block p-6 sm:p-10 bg-gradient-to-br from-blue-900/90 via-blue-800/85 to-indigo-900/90 backdrop-blur-md rounded-3xl sm:rounded-[2rem] border border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] mb-4 sm:mb-8 relative overflow-hidden">
              {/* Effet de brillance subtil */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
              
              {/* Contenu principal */}
              <div className="relative z-10">
                                 {/* Titre principal avec typographie moderne */}
                 <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-6 tracking-tight leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                   <span className="text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] font-black">
                     ESPACE Ateliers
                   </span>
                 </h1>
                
                {/* Séparateur élégant avec icône */}
                <div className="flex items-center justify-center mb-4">
                  <div className="w-8 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                  <div className="w-3 h-3 bg-blue-300 rounded-full mx-3 shadow-lg"></div>
                  <div className="w-8 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                </div>
                
                                 {/* Sous-titre institutionnel */}
                 <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 tracking-wide" style={{ fontFamily: 'Lora, serif' }}>
                   <span className="text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-bold">
                     COP CMC SM
                   </span>
                 </h2>
                
                {/* Ligne de séparation avec dégradé */}
                <div className="w-20 sm:w-28 h-0.5 bg-gradient-to-r from-yellow-400 via-yellow-300 to-green-400 mx-auto mb-4 shadow-sm"></div>
                
                                 {/* Call-to-action */}
                 <p className="text-base sm:text-lg lg:text-xl font-medium tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                   <span className="text-green-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-bold">
                     DÉVELOPPEZ VOS COMPÉTENCES
                   </span>
                 </p>
                
                {/* Éléments décoratifs subtils */}
                <div className="flex justify-center mt-4 space-x-2">
                  <div className="w-1 h-1 bg-blue-300 rounded-full opacity-60"></div>
                  <div className="w-1 h-1 bg-blue-200 rounded-full opacity-40"></div>
                  <div className="w-1 h-1 bg-blue-300 rounded-full opacity-60"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

             {/* Liste des ateliers */}
       <div className="relative bg-transparent backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border-2 border-white/30 overflow-hidden hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
         <div className="relative z-10">
                     <div className="mb-6 sm:mb-8 text-center">
             <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4 drop-shadow-[0_4px_8px_rgba(255,255,255,0.8)]">Ateliers Disponibles</h2>
             <p className="text-gray-800 text-lg sm:text-xl mb-6 drop-shadow-[0_2px_4px_rgba(255,255,255,0.6)]">Découvrez nos ateliers spécialisés et inscrivez-vous aux sessions qui vous intéressent</p>
             <div className="w-20 h-1 bg-gradient-to-r from-yellow-400 to-green-400 mt-6 mx-auto shadow-lg"></div>
           </div>
   
                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredAteliers.length === 0 ? (
               <div className="col-span-full bg-white rounded-xl shadow-sm border border-blue-100 p-16 text-center">
                 <BookOpen className="w-20 h-20 text-blue-300 mx-auto mb-6" />
                 <h3 className="text-2xl font-bold text-blue-900 mb-4">Aucun atelier disponible</h3>
                 <p className="text-gray-600 text-lg">
                   {searchTerm || filterPole || filterFiliere 
                     ? 'Aucun atelier ne correspond à vos critères de recherche.'
                     : 'Aucun atelier n\'est actuellement disponible pour inscription.'
                   }
                 </p>
               </div>
                           ) : (
                               (() => {
                  console.log('📊 Affichage de', filteredAteliers.length, 'ateliers')
                  console.log('📊 Données des ateliers:', filteredAteliers)
                  return filteredAteliers.map(atelier => (
                                 <div key={atelier.id} className="relative bg-white/20 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-white/40 overflow-hidden hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
                  
                  <div className="relative z-10 p-6 sm:p-8">
                    <div className="text-center mb-6">
                                             <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{atelier.titre}</h3>
                       <p className="text-white/90 text-base sm:text-lg leading-relaxed line-clamp-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{atelier.description}</p>
                    </div>
                    <div className="ml-6">
                      <span className={`px-3 py-2 rounded-full text-sm font-semibold ${
                        atelier.statut === 'planifie' ? 'bg-blue-200 text-blue-800 border border-blue-300' :
                        atelier.statut === 'en_cours' ? 'bg-green-200 text-green-800 border border-green-300' :
                        'bg-gray-200 text-gray-800 border border-gray-300'
                      }`}>
                        {atelier.statut === 'planifie' ? 'Planifié' :
                         atelier.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                      </span>
                    </div>
                  </div>

                                       <div className="space-y-4 mb-8 text-center">
                       <div className="border-b border-white/30 pb-4">
                         <div className="flex items-center justify-center gap-3 text-white font-medium">
                           <Calendar className="w-6 h-6 text-yellow-300" />
                           <span className="text-lg font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{new Date(atelier.date_debut).toLocaleDateString('fr-FR')}</span>
                         </div>
                       </div>
                       
                       <div className="flex items-center justify-center gap-3 text-white font-medium">
                         <Clock className="w-6 h-6 text-yellow-300" />
                         <span className="text-lg font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                           {new Date(atelier.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - 
                           {new Date(atelier.date_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                         </span>
                       </div>
                       
                       <div className="flex items-center justify-center gap-3 text-white font-medium">
                         <MapPin className="w-6 h-6 text-yellow-300" />
                         <span className="text-lg font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{atelier.lieu}</span>
                       </div>
                       
                       <div className="flex items-center justify-center gap-3 text-white font-medium">
                         <Users className="w-6 h-6 text-yellow-300" />
                         <span className="text-lg font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{atelier.capacite_actuelle} / {atelier.capacite_max} places</span>
                       </div>

                       {atelier.pole && (
                         <div className="flex items-center justify-center gap-3 text-white font-medium">
                           <Target className="w-6 h-6 text-yellow-300" />
                           <span className="text-lg font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{atelier.pole} - {atelier.filliere}</span>
                         </div>
                       )}
                     </div>

                                     <div className="flex items-center justify-between pt-6 border-t border-white/30">
                     <div className="flex items-center gap-3">
                       {atelier.capacite_actuelle < atelier.capacite_max ? (
                         <CheckCircle className="w-6 h-6 text-green-400" />
                       ) : (
                         <XCircle className="w-6 h-6 text-red-400" />
                       )}
                       <span className={`text-lg font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] ${
                         atelier.capacite_actuelle < atelier.capacite_max ? 'text-green-300' : 'text-red-300'
                       }`}>
                         {atelier.capacite_actuelle < atelier.capacite_max ? 'Places disponibles' : 'Complet'}
                       </span>
                     </div>
                    
                                         <div className="space-y-2">
                       
                       
                                               {/* Bouton S'inscrire */}
                        <button
                          onClick={() => openInscriptionForm(atelier)}
                          disabled={atelier.capacite_actuelle >= atelier.capacite_max}
                          className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                            atelier.capacite_actuelle < atelier.capacite_max
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 border-2 border-blue-400 hover:border-blue-500 cursor-pointer drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]'
                              : 'bg-gray-500/50 text-gray-300 cursor-not-allowed border-2 border-gray-400/50'
                          }`}
                        >
                          <ArrowRight className="w-5 h-5" />
                          <span className="text-lg font-bold">S'inscrire</span>
                        </button>
                     </div>
                                     </div>
                 </div>
               ))
               })()
             )}
          </div>
        </div>
      </div>

             {/* Modal Formulaire d'inscription - Plein écran avec défilement */}
       {showInscriptionForm && selectedAtelier && (
         <div className="fixed inset-0 bg-gradient-to-br from-indigo-900/95 to-blue-900/95 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
           <div className="relative bg-white/20 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] border-2 border-white/40 overflow-hidden hover:shadow-3xl transition-all duration-300 flex flex-col">
            {/* Background avec image */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
              style={{
                backgroundImage: "url('/bg-entreprise.jpg')"
              }}
            ></div>
                         <div className="relative z-10 p-6 sm:p-8 flex-1 overflow-y-auto">
               {inscriptionSuccess ? (
                 <div className="text-center">
                   <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                     <CheckCircle className="w-12 h-12 text-white" />
                   </div>
                   <h3 className="text-3xl font-bold text-white mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Inscription réussie !</h3>
                   <p className="text-white/90 mb-10 text-xl leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                     Votre inscription à l'atelier <strong className="text-yellow-300">"{selectedAtelier.titre}"</strong> a été confirmée.
                     <br />Vous recevrez un email de confirmation.
                   </p>
                   <button
                     onClick={closeInscriptionForm}
                     className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-10 py-4 rounded-2xl hover:from-blue-600 hover:to-blue-700 border-2 border-blue-400 hover:border-blue-500 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                   >
                     Fermer
                   </button>
                 </div>
              ) : (
                <>
                                     <div className="flex items-center justify-between mb-8">
                     <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Inscription à l'atelier</h2>
                     <button
                       onClick={closeInscriptionForm}
                       className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                     >
                       <XCircle className="w-8 h-8" />
                     </button>
                   </div>

                   <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
                     <h3 className="font-bold text-white mb-4 text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{selectedAtelier.titre}</h3>
                     <div className="text-white/90 space-y-2 text-lg">
                       <p className="flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">📅 {new Date(selectedAtelier.date_debut).toLocaleDateString('fr-FR')}</p>
                       <p className="flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">🕐 {new Date(selectedAtelier.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedAtelier.date_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                       <p className="flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">📍 {selectedAtelier.lieu}</p>
                       <p className="flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">👥 {selectedAtelier.capacite_actuelle} / {selectedAtelier.capacite_max} places</p>
                     </div>
                   </div>

                   {error && (
                      <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-lg">
                        <p className="text-red-200 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{error}</p>
                      </div>
                    )}

                    <form onSubmit={handleInscription} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                            Nom complet <span className="text-red-300">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.nom}
                            onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white placeholder-white/60"
                            placeholder="Votre nom complet"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-white mb-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                            Email <span className="text-red-300">*</span>
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white placeholder-white/60"
                            placeholder="votre.email@exemple.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                            Téléphone
                          </label>
                          <input
                            type="tel"
                            value={formData.telephone}
                            onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white placeholder-white/60"
                            placeholder="06 12 34 56 78"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-white mb-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                            Pôle <span className="text-red-300">*</span>
                          </label>
                          <select
                            value={formData.pole}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              pole: e.target.value,
                              filliere: ''
                            }))}
                            className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white"
                            required
                          >
                            <option value="" className="text-gray-800">Sélectionnez un pôle</option>
                            {poles.filter(p => p.actif).map(pole => (
                              <option key={pole.id} value={pole.nom} className="text-gray-800">{pole.nom}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-white mb-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                          Filière <span className="text-red-300">*</span>
                        </label>
                        <select
                          value={formData.filliere}
                          onChange={(e) => setFormData(prev => ({ ...prev, filliere: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white disabled:bg-gray-500/20"
                          disabled={!formData.pole}
                          required
                        >
                          <option value="" className="text-gray-800">
                            {formData.pole ? 'Sélectionnez une filière' : 'Sélectionnez d\'abord un pôle'}
                          </option>
                          {filieresFiltered.map(filiere => (
                            <option key={filiere.id} value={filiere.nom} className="text-gray-800">{filiere.nom}</option>
                          ))}
                        </select>
                      </div>

                      {/* Boutons à la fin du formulaire */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <button
                          type="button"
                          onClick={closeInscriptionForm}
                          className="flex-1 px-6 py-4 text-white bg-white/20 backdrop-blur-sm rounded-2xl hover:bg-white/30 border border-white/40 transition-all duration-300 font-semibold"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 border-2 border-blue-400 hover:border-blue-500 disabled:opacity-50 flex items-center justify-center gap-3 font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                              <span className="text-lg">Inscription...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-6 h-6" />
                              <span className="text-lg">Confirmer l'inscription</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                 </>
               )}
             </div>
           </div>
         </div>
       )}
     </div>
   )
}