// ========================================
// src/hooks/useCVConnect.ts - Hook pour CV Connect
// ========================================

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CVConnectPermission, CVConnectSubmission, CVConnectRole } from '@/types'

export function useCVConnect() {
  const [permissions, setPermissions] = useState<CVConnectPermission[]>([])
  const [submissions, setSubmissions] = useState<CVConnectSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les permissions
  const loadPermissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cv_connect_permissions')
        .select(`
          *,
          user:profiles!cv_connect_permissions_user_id_fkey(email, nom, prenom),
          granted_by_user:profiles!cv_connect_permissions_granted_by_fkey(email, nom, prenom)
        `)
        .order('granted_at', { ascending: false })

      if (error) throw error
      setPermissions(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Erreur chargement permissions CV Connect:', err)
    }
  }, [])

  // Charger les soumissions
  const loadSubmissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cv_connect_submissions')
        .select(`
          *,
          pole:poles(*),
          filiere:filieres(*)
        `)
        .order('submitted_at', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Erreur chargement soumissions CV Connect:', err)
    }
  }, [])

  // Vérifier si l'utilisateur a accès à CV Connect
  const hasCVConnectAccess = useCallback((userId: string): boolean => {
    const userPermission = permissions.find(p => p.user_id === userId)
    if (!userPermission) return false
    
    // Vérifier si la permission n'a pas expiré
    if (userPermission.expires_at && new Date(userPermission.expires_at) < new Date()) {
      return false
    }
    
    return true
  }, [permissions])

  // Vérifier le rôle de l'utilisateur
  const getUserRole = useCallback((userId: string): CVConnectRole | null => {
    const userPermission = permissions.find(p => p.user_id === userId)
    if (!userPermission) return null
    
    // Vérifier si la permission n'a pas expiré
    if (userPermission.expires_at && new Date(userPermission.expires_at) < new Date()) {
      return null
    }
    
    return userPermission.role
  }, [permissions])

  // Accorder une permission
  const grantPermission = async (
    userEmail: string, 
    role: CVConnectRole, 
    grantedBy: string,
    expiresAt?: string
  ) => {
    try {
      // D'abord, récupérer l'UUID de l'utilisateur à partir de son email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .single()

      if (userError || !userData) {
        throw new Error(`Utilisateur avec l'email ${userEmail} non trouvé`)
      }

      const userId = userData.id

      // Vérifier si l'utilisateur a déjà une permission
      const { data: existingPermission } = await supabase
        .from('cv_connect_permissions')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (existingPermission) {
        throw new Error('Cet utilisateur a déjà une permission CV Connect')
      }

      // Insérer la nouvelle permission
      const { error } = await supabase
        .from('cv_connect_permissions')
        .insert([{
          user_id: userId,
          role,
          granted_by: grantedBy,
          expires_at: expiresAt
        }])

      if (error) throw error
      await loadPermissions()
      return { success: true }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Révoquer une permission
  const revokePermission = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('cv_connect_permissions')
        .delete()
        .eq('id', permissionId)

      if (error) throw error
      await loadPermissions()
      return { success: true }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Mettre à jour le statut d'une soumission
  const updateSubmissionStatus = async (
    submissionId: string, 
    statut: 'nouveau' | 'traite' | 'archive',
    notes?: string,
    processedBy?: string
  ) => {
    try {
      const updateData: any = {
        statut,
        processed_at: new Date().toISOString()
      }
      
      if (notes) updateData.notes = notes
      if (processedBy) updateData.processed_by = processedBy

      const { error } = await supabase
        .from('cv_connect_submissions')
        .update(updateData)
        .eq('id', submissionId)

      if (error) throw error
      await loadSubmissions()
      return { success: true }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Soumettre un CV (formulaire public)
  const submitCV = async (submissionData: {
    nom: string
    prenom: string
    email: string
    telephone?: string
    pole_id?: string
    filiere_id?: string
    cv_filename: string
    cv_google_drive_id: string
    cv_google_drive_url: string
  }) => {
    try {
      const { error } = await supabase
        .from('cv_connect_submissions')
        .insert([submissionData])

      if (error) throw error
      await loadSubmissions()
      return { success: true }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Charger les données au montage
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadPermissions(), loadSubmissions()])
      setLoading(false)
    }
    
    loadData()
  }, [loadPermissions, loadSubmissions])

  return {
    permissions,
    submissions,
    loading,
    error,
    hasCVConnectAccess,
    getUserRole,
    grantPermission,
    revokePermission,
    updateSubmissionStatus,
    submitCV,
    loadPermissions,
    loadSubmissions
  }
}
