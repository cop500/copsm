import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealTime } from './useRealTime';

export interface ActionAmbassadeur {
  id: string;
  nom_prenom_stagiaire: string;
  equipe_participante?: string;
  volet_action: string;
  responsable_action: string;
  lieu_realisation: string;
  date_action: string;
  nombre_participants: number;
  created_at: string;
  updated_at: string;
  actif: boolean;
}

export interface ActionAmbassadeurFormData {
  nom_prenom_stagiaire: string;
  equipe_participante?: string;
  volet_action?: string; // Optionnel maintenant
  responsable_action: string;
  lieu_realisation: string;
  date_action: string;
  nombre_participants: number;
}

export const useActionsAmbassadeurs = () => {
  const [actions, setActions] = useState<ActionAmbassadeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('actions_ambassadeurs')
        .select('*')
        .eq('actif', true)
        .order('date_action', { ascending: false });

      if (error) throw error;
      setActions(data || []);
    } catch (err: any) {
      console.error('Erreur chargement actions ambassadeurs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAction = async (actionData: ActionAmbassadeurFormData) => {
    try {
      // Ajouter une valeur par défaut pour le volet si non fourni
      const dataToSave = {
        ...actionData,
        volet_action: actionData.volet_action || 'information_communication'
      };

      const { data, error } = await supabase
        .from('actions_ambassadeurs')
        .insert([dataToSave])
        .select()
        .single();

      if (error) throw error;
      await fetchActions();
      return { success: true, data };
    } catch (err: any) {
      console.error('Erreur sauvegarde action ambassadeur:', err);
      return { success: false, error: err.message };
    }
  };

  const updateAction = async (id: string, actionData: Partial<ActionAmbassadeurFormData>) => {
    try {
      const { error } = await supabase
        .from('actions_ambassadeurs')
        .update(actionData)
        .eq('id', id);

      if (error) throw error;
      await fetchActions();
      return { success: true };
    } catch (err: any) {
      console.error('Erreur mise à jour action ambassadeur:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteAction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('actions_ambassadeurs')
        .update({ actif: false })
        .eq('id', id);

      if (error) throw error;
      await fetchActions();
      return { success: true };
    } catch (err: any) {
      console.error('Erreur suppression action ambassadeur:', err);
      return { success: false, error: err.message };
    }
  };

  // Statistiques pour le dashboard
  const getStats = useCallback(() => {
    const totalActions = actions.length;
    const totalParticipants = actions.reduce((sum, action) => sum + action.nombre_participants, 0);
    
    const actionsByVolet = actions.reduce((acc, action) => {
      const volet = action.volet_action;
      acc[volet] = (acc[volet] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const actionsByMonth = actions.reduce((acc, action) => {
      const month = new Date(action.date_action).toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long' 
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActions,
      totalParticipants,
      actionsByVolet,
      actionsByMonth
    };
  }, [actions]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  // Écouter les changements en temps réel
  useRealTime('actions_ambassadeurs', ({ eventType, new: newRow, old: oldRow }) => {
    fetchActions();
  });

  return {
    actions,
    loading,
    error,
    fetchActions,
    saveAction,
    updateAction,
    deleteAction,
    getStats
  };
};
