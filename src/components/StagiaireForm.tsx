// ========================================
// src/components/StagiaireForm.tsx - Formulaire Stagiaires
// ========================================

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Stagiaire, Filiere, Entreprise } from '@/types'
import toast from 'react-hot-toast'

interface StagiaireFormProps {
  stagiaire?: Stagiaire | null
  onSuccess: () => void
  onCancel: () => void
}

export default function StagiaireForm({ stagiaire, onSuccess, onCancel }: StagiaireFormProps) {
  const [formData, setFormData] = useState({
    nom: stagiaire?.nom || '',
    prenom: stagiaire?.prenom || '',
    email: stagiaire?.email || '',
    telephone: stagiaire?.telephone || '',
    filiere_id: stagiaire?.filiere_id || '',
    niveau_etude: stagiaire?.niveau_etude || '',
    entreprise_accueil_id: stagiaire?.entreprise_accueil_id || '',
    insere: stagiaire?.insere || false,
    entreprise_insertion_id: stagiaire?.entreprise_insertion_id || '',
    poste_insertion: stagiaire?.poste_insertion || ''
  })
  const [loading, setLoading] = useState(false)
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [entreprises, setEntreprises] = useState<Entreprise[]>([])
  const { profile } = useAuth()

  useEffect(() => {
    const loadData = async () => {
      // Charger filières
      const { data: filieresData } = await supabase
        .from('filieres')
        .select('*')
        .order('nom')
      
      // Charger entreprises
      const { data: entreprisesData } = await supabase
        .from('entreprises')
        .select('id, nom')
        .eq('statut', 'actif')
        .order('nom')

      setFilieres(filieresData || [])
      setEntreprises(entreprisesData || [])
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nom.trim() || !formData.prenom.trim()) {
      toast.error('Le nom et prénom sont requis')
      return
    }

    setLoading(true)
    try {
      const dataToSave = {
        ...formData,
        updated_by: profile?.id,
        ...(stagiaire ? {} : { created_by: profile?.id })
      }

      if (stagiaire) {
        const { error } = await supabase
          .from('stagiaires')
          .update(dataToSave)
          .eq('id', stagiaire.id)

        if (error) throw error
        toast.success('Stagiaire modifié avec succès')
      } else {
        const { error } = await supabase
          .from('stagiaires')
          .insert([dataToSave])

        if (error) throw error
        toast.success('Stagiaire créé avec succès')
      }

      onSuccess()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nom">Nom *</Label>
          <Input
            id="nom"
            value={formData.nom}
            onChange={(e) => handleChange('nom', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="prenom">Prénom *</Label>
          <Input
            id="prenom"
            value={formData.prenom}
            onChange={(e) => handleChange('prenom', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="telephone">Téléphone</Label>
          <Input
            id="telephone"
            value={formData.telephone}
            onChange={(e) => handleChange('telephone', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="filiere">Filière</Label>
          <select
            value={formData.filiere_id}
            onChange={(e) => handleChange('filiere_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Sélectionner</option>
            {filieres.map(filiere => (
              <option key={filiere.id} value={filiere.id}>{filiere.nom}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="niveau">Niveau d'étude</Label>
          <select
            value={formData.niveau_etude}
            onChange={(e) => handleChange('niveau_etude', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Sélectionner</option>
            <option value="bac">Bac</option>
            <option value="bac+2">Bac+2</option>
            <option value="bac+3">Bac+3</option>
            <option value="bac+5">Bac+5</option>
          </select>
        </div>

        <div>
          <Label htmlFor="entreprise_accueil">Entreprise de stage</Label>
          <select
            value={formData.entreprise_accueil_id}
            onChange={(e) => handleChange('entreprise_accueil_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Sélectionner</option>
            {entreprises.map(entreprise => (
              <option key={entreprise.id} value={entreprise.id}>{entreprise.nom}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="insere"
            checked={formData.insere}
            onChange={(e) => handleChange('insere', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="insere">Stagiaire inséré</Label>
        </div>

        {formData.insere && (
          <>
            <div>
              <Label htmlFor="entreprise_insertion">Entreprise d'insertion</Label>
              <select
                value={formData.entreprise_insertion_id}
                onChange={(e) => handleChange('entreprise_insertion_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Sélectionner</option>
                {entreprises.map(entreprise => (
                  <option key={entreprise.id} value={entreprise.id}>{entreprise.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="poste">Poste</Label>
              <Input
                id="poste"
                value={formData.poste_insertion}
                onChange={(e) => handleChange('poste_insertion', e.target.value)}
                placeholder="Intitulé du poste"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading} className="bg-blue-600">
          {loading ? 'Sauvegarde...' : (stagiaire ? 'Modifier' : 'Créer')}
        </Button>
      </div>
    </form>
  )
}