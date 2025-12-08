'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Plus, Edit2, Trash2, Clock, User, ChevronLeft, ChevronRight, Users, Grid, CalendarDays, Search, X, MapPin } from 'lucide-react'
import { useCalendrierCollaboratif, CalendrierEvent } from '@/hooks/useCalendrierCollaboratif'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

type ViewMode = 'month' | 'week'

interface UserProfile {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
}

const CalendrierCollaboratif: React.FC = () => {
  const { events, loading, createEvent, updateEvent, deleteEvent, loadEvents } = useCalendrierCollaboratif()
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendrierEvent | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [animateurSearch, setAnimateurSearch] = useState('')
  const [showAnimateurDropdown, setShowAnimateurDropdown] = useState(false)
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    date_debut: '',
    date_fin: '',
    heure_debut: '',
    heure_fin: '',
    couleur: '#3B82F6',
    animateur_id: '',
    salle: ''
  })

  // Charger les utilisateurs pour le sélecteur d'animateur
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nom, prenom, email, role')
          .eq('actif', true)
          .order('nom')

        if (error) throw error
        setUsers(data || [])
      } catch (err) {
        console.error('Erreur chargement utilisateurs:', err)
      }
    }
    loadUsers()
  }, [])

  // Navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setDate(newDate.getDate() - 7)
    }
    setCurrentDate(newDate)
    loadEventsForPeriod(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setCurrentDate(newDate)
    loadEventsForPeriod(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    loadEventsForPeriod(today)
  }

  const loadEventsForPeriod = (date: Date) => {
    if (viewMode === 'month') {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
      loadEvents(startOfMonth, endOfMonth)
    } else {
      const startOfWeek = getStartOfWeek(date)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)
      loadEvents(startOfWeek, endOfWeek)
    }
  }

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Lundi = 1
    return new Date(d.setDate(diff))
  }

  // Charger les événements au changement de vue ou de date
  useEffect(() => {
    loadEventsForPeriod(currentDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, currentDate])

  // Générer les jours du mois (sans samedi/dimanche)
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Jours du mois précédent pour compléter la première semaine (seulement lundi-vendredi)
    const prevMonth = new Date(year, month - 1, 0)
    let prevDaysToAdd = startingDayOfWeek === 0 ? 5 : startingDayOfWeek - 1 // Si dimanche, on commence lundi
    for (let i = prevDaysToAdd - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i)
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Exclure samedi et dimanche
        days.push({
          date,
          isCurrentMonth: false
        })
      }
    }

    // Jours du mois actuel (seulement lundi-vendredi)
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Exclure samedi et dimanche
        days.push({
          date,
          isCurrentMonth: true
        })
      }
    }

    // Jours du mois suivant pour compléter (seulement lundi-vendredi)
    let nextDay = 1
    while (days.length < 25) { // Environ 5 semaines * 5 jours
      const date = new Date(year, month + 1, nextDay)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        days.push({
          date,
          isCurrentMonth: false
        })
      }
      nextDay++
    }

    return days
  }

  // Générer les jours de la semaine (lundi-vendredi)
  const getDaysInWeek = () => {
    const startOfWeek = getStartOfWeek(currentDate)
    const days = []
    
    for (let i = 0; i < 5; i++) { // Lundi à Vendredi
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push({
        date,
        isCurrentMonth: true
      })
    }
    
    return days
  }

  // Obtenir les événements d'un jour
  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date_debut)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const openModal = (date?: Date, event?: CalendrierEvent) => {
    if (event) {
      const dateDebut = new Date(event.date_debut)
      const dateFin = new Date(event.date_fin)
      setEditingEvent(event)
      setSelectedDate(null)
      setFormData({
        titre: event.titre,
        description: event.description || '',
        date_debut: dateDebut.toISOString().split('T')[0],
        date_fin: dateFin.toISOString().split('T')[0],
        heure_debut: dateDebut.toTimeString().slice(0, 5),
        heure_fin: dateFin.toTimeString().slice(0, 5),
        couleur: event.couleur,
        animateur_id: event.animateur_id || '',
        salle: event.salle || ''
      })
    } else if (date) {
      setSelectedDate(date)
      setEditingEvent(null)
      const dateStr = date.toISOString().split('T')[0]
      setFormData({
        titre: '',
        description: '',
        date_debut: dateStr,
        date_fin: dateStr,
        heure_debut: '09:00',
        heure_fin: '10:00',
        couleur: '#3B82F6',
        animateur_id: '',
        salle: ''
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingEvent(null)
    setSelectedDate(null)
    setAnimateurSearch('')
    setShowAnimateurDropdown(false)
    setFormData({
      titre: '',
      description: '',
      date_debut: '',
      date_fin: '',
      heure_debut: '09:00',
      heure_fin: '10:00',
      couleur: '#3B82F6',
      animateur_id: '',
      salle: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const dateDebut = new Date(`${formData.date_debut}T${formData.heure_debut}`)
    const dateFin = new Date(`${formData.date_fin}T${formData.heure_fin}`)

    // Vérifier que ce n'est pas un samedi ou dimanche
    if (dateDebut.getDay() === 0 || dateDebut.getDay() === 6) {
      alert('Les événements ne peuvent pas être créés le samedi ou le dimanche')
      return
    }

    if (dateFin <= dateDebut) {
      alert('L\'heure de fin doit être après l\'heure de début')
      return
    }

    if (editingEvent) {
      const result = await updateEvent(editingEvent.id, {
        titre: formData.titre,
        description: formData.description || undefined,
        date_debut: dateDebut.toISOString(),
        date_fin: dateFin.toISOString(),
        couleur: formData.couleur,
        animateur_id: formData.animateur_id || undefined,
        salle: formData.salle || undefined
      })

      if (result.success) {
        closeModal()
      } else {
        alert(result.error || 'Erreur lors de la modification')
      }
    } else {
      const result = await createEvent({
        titre: formData.titre,
        description: formData.description || undefined,
        date_debut: dateDebut.toISOString(),
        date_fin: dateFin.toISOString(),
        couleur: formData.couleur,
        animateur_id: formData.animateur_id || undefined,
        salle: formData.salle || undefined
      })

      if (result.success) {
        closeModal()
      } else {
        alert(result.error || 'Erreur lors de la création')
      }
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return

    const result = await deleteEvent(eventId)
    if (!result.success) {
      alert(result.error || 'Erreur lors de la suppression')
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const isMyEvent = (event: CalendrierEvent) => event.user_id === user?.id
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']

  // Filtrer les utilisateurs pour le dropdown
  const filteredUsers = users.filter(user => {
    const searchLower = animateurSearch.toLowerCase()
    const fullName = `${user.prenom} ${user.nom}`.toLowerCase()
    return fullName.includes(searchLower) || user.email.toLowerCase().includes(searchLower)
  })

  const selectAnimateur = (selectedUser: UserProfile) => {
    setFormData({ ...formData, animateur_id: selectedUser.id })
    setAnimateurSearch(`${selectedUser.prenom} ${selectedUser.nom}`)
    setShowAnimateurDropdown(false)
  }

  const getSelectedAnimateur = () => {
    if (!formData.animateur_id) return null
    return users.find(u => u.id === formData.animateur_id)
  }

  const getRoleLabel = (role: string, prenom?: string) => {
    if (prenom?.toUpperCase().includes('SARA')) {
      return 'Conseillère d\'orientation'
    }
    const roleLabels: Record<string, string> = {
      'conseiller_cop': 'Conseiller Cop',
      'conseillere_carriere': 'Conseillère de carrière',
      'business_developer': 'Business Developer',
      'manager_cop': 'Manager Cop',
      'directeur': 'Directeur'
    }
    return roleLabels[role] || role
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement du calendrier...</div>
      </div>
    )
  }

  const days = viewMode === 'month' ? getDaysInMonth() : getDaysInWeek()
  const selectedAnimateur = getSelectedAnimateur()

  return (
    <div className="space-y-4">
      {/* En-tête avec navigation et sélecteur de vue */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevious}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={viewMode === 'month' ? 'Mois précédent' : 'Semaine précédente'}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 min-w-[200px]">
            {viewMode === 'month' 
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Semaine du ${getStartOfWeek(currentDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
            }
          </h2>
          <button
            onClick={goToNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={viewMode === 'month' ? 'Mois suivant' : 'Semaine suivante'}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {/* Sélecteur de vue */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'month'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Mois
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'week'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              Semaine
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvel événement
          </button>
        </div>
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        {/* En-tête des jours de la semaine */}
        <div className={`grid ${viewMode === 'month' ? 'grid-cols-5' : 'grid-cols-5'} bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200`}>
          {weekDays.map((day) => (
            <div key={day} className="p-4 text-center text-sm font-bold text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className={`grid ${viewMode === 'month' ? 'grid-cols-5' : 'grid-cols-5'}`}>
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day.date)
            const today = isToday(day.date)
            const dayOfWeek = day.date.getDay()

            return (
              <div
                key={index}
                className={`min-h-[140px] border-r border-b border-gray-200 p-3 ${
                  !day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } ${today ? 'bg-blue-50 ring-2 ring-blue-400' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}
                onClick={() => openModal(day.date)}
              >
                <div
                  className={`text-base font-semibold mb-2 ${
                    today
                      ? 'text-blue-600'
                      : day.isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {day.date.getDate()}
                </div>
                <div className="space-y-1.5">
                  {dayEvents.slice(0, viewMode === 'week' ? 10 : 4).map((event) => {
                    const animateur = event.animateur
                    return (
                      <div
                        key={event.id}
                        className="text-xs p-2 rounded-md cursor-pointer hover:opacity-90 transition-all shadow-sm"
                        style={{
                          backgroundColor: isMyEvent(event) ? `${event.couleur}25` : '#f3f4f625',
                          border: `2px solid ${isMyEvent(event) ? event.couleur : '#d1d5db'}`,
                          color: isMyEvent(event) ? event.couleur : '#6b7280'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          openModal(undefined, event)
                        }}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span className="font-semibold">{formatTime(event.date_debut)}</span>
                        </div>
                        <div className="font-medium truncate mb-1">{event.titre}</div>
                        {animateur && (
                          <div className="flex items-center gap-1 text-[10px] opacity-75 mb-0.5">
                            <User className="w-2.5 h-2.5" />
                            <span className="truncate">{animateur.prenom} {animateur.nom}</span>
                          </div>
                        )}
                        {event.salle && (
                          <div className="flex items-center gap-1 text-[10px] opacity-75">
                            <MapPin className="w-2.5 h-2.5" />
                            <span className="truncate">{event.salle}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {dayEvents.length > (viewMode === 'week' ? 10 : 4) && (
                    <div className="text-xs text-gray-500 text-center font-medium py-1">
                      +{dayEvents.length - (viewMode === 'week' ? 10 : 4)} autre(s)
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-6 text-sm bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border-2 border-blue-500 bg-blue-100"></div>
          <span className="font-medium">Mes événements</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border-2 border-gray-300 bg-gray-100"></div>
          <span className="font-medium">Événements des autres</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <User className="w-4 h-4" />
          <span>Animateur</span>
        </div>
      </div>

      {/* Modal pour créer/modifier un événement */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Sélecteur d'animateur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Animateur
                </label>
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={animateurSearch}
                      onChange={(e) => {
                        setAnimateurSearch(e.target.value)
                        setShowAnimateurDropdown(true)
                      }}
                      onFocus={() => setShowAnimateurDropdown(true)}
                      placeholder="Rechercher un animateur..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {selectedAnimateur && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, animateur_id: '' })
                          setAnimateurSearch('')
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                  
                  {showAnimateurDropdown && filteredUsers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredUsers.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => selectAnimateur(user)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-600" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {user.prenom} {user.nom}
                                </p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                              </div>
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {getRoleLabel(user.role, user.prenom)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedAnimateur && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {selectedAnimateur.prenom} {selectedAnimateur.nom}
                    </span>
                    <span className="text-xs text-gray-600">
                      ({getRoleLabel(selectedAnimateur.role, selectedAnimateur.prenom)})
                    </span>
                  </div>
                )}
              </div>

              {/* Champ Salle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Salle
                </label>
                <input
                  type="text"
                  value={formData.salle}
                  onChange={(e) => setFormData({ ...formData, salle: e.target.value })}
                  placeholder="Ex: Salle 1, Amphi A, etc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date début *
                  </label>
                  <input
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure début *
                  </label>
                  <input
                    type="time"
                    value={formData.heure_debut}
                    onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date fin *
                  </label>
                  <input
                    type="date"
                    value={formData.date_fin}
                    onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure fin *
                  </label>
                  <input
                    type="time"
                    value={formData.heure_fin}
                    onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur
                </label>
                <input
                  type="color"
                  value={formData.couleur}
                  onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>

              {editingEvent && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(editingEvent.id)}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingEvent ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendrierCollaboratif
