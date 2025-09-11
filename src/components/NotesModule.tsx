import React, { useState, useEffect } from 'react';
import { useRappels } from '@/hooks/useRappels';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/lib/supabase';
import { Send, Trash2, User, Calendar, MessageSquare, MoreVertical } from 'lucide-react';

export default function NotesModule() {
  const { rappels, addRappel, deleteRappel, loading, error } = useRappels();
  const { profile } = useAuth();
  const { isAdmin } = useRole();
  const [newMessage, setNewMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [authors, setAuthors] = useState<Record<string, any>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Charger les informations des auteurs
  useEffect(() => {
    const loadAuthors = async () => {
      const uniqueAuthors = [...new Set(rappels.map(r => r.created_by))];
      const authorsData: Record<string, any> = {};
      
      for (const authorId of uniqueAuthors) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('id, nom, prenom, role')
            .eq('id', authorId)
            .single();
          if (data) {
            authorsData[authorId] = data;
          }
        } catch (err) {
          // Ignorer les erreurs
        }
      }
      setAuthors(authorsData);
    };

    if (rappels.length > 0) {
      loadAuthors();
    }
  }, [rappels]);

  const handlePostMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;
    
    setIsPosting(true);
    const res = await addRappel({ 
      titre: 'Message d\'équipe', 
      contenu: newMessage.trim(), 
      type: 'note' 
    });
    
    if (res.success) {
      setNewMessage('');
      setFeedback('Message publié !');
      setTimeout(() => setFeedback(null), 2000);
    } else {
      setFeedback('Erreur lors de la publication');
      setTimeout(() => setFeedback(null), 3000);
    }
    setIsPosting(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostMessage();
    }
  };

  const getAuthorName = (authorId: string) => {
    const author = authors[authorId];
    if (!author) return 'U.I'; // Utilisateur Inconnu
    const prenom = author.prenom || '';
    const nom = author.nom || '';
    if (prenom && nom) {
      return `${prenom[0].toUpperCase()}${nom[0].toUpperCase()}`;
    }
    return 'U'; // Utilisateur
  };

  const getAuthorRole = (authorId: string) => {
    const author = authors[authorId];
    return author?.role || 'Membre';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'business_developer': return 'bg-blue-100 text-blue-800';
      case 'coordinateur': return 'bg-green-100 text-green-800';
      case 'conseiller': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'business_developer': return 'Admin';
      case 'coordinateur': return 'Coordinateur';
      case 'conseiller': return 'Conseiller';
      default: return 'Membre';
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return messageDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-4">
      {/* En-tête compact */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-xl">
          <MessageSquare className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Informations & Notes d'équipe</h3>
          <p className="text-sm text-gray-500">Partagez des informations avec l'équipe</p>
        </div>
      </div>

      {/* Zone de saisie compacte */}
      <div className="bg-white/20 backdrop-blur-sm border-2 border-black/30 rounded-xl p-3 shadow-lg">
        <div className="flex items-start gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
            {profile?.prenom?.[0] && profile?.nom?.[0] 
              ? `${profile.prenom[0]}${profile.nom[0]}`.toUpperCase()
              : profile?.prenom?.[0] || profile?.nom?.[0] || 'U'
            }
          </div>
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Quoi de neuf dans l'équipe ?"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 resize-none text-sm"
              rows={2}
              disabled={isPosting}
            />
          </div>
        </div>
        
        {/* Bouton compact et visible */}
        <div className="flex justify-end">
          <button
            onClick={handlePostMessage}
            disabled={!newMessage.trim() || isPosting}
            className={`px-4 py-2 rounded-lg font-medium text-white transition-all duration-300 text-sm ${
              newMessage.trim() && !isPosting
                ? 'bg-blue-600 hover:bg-blue-700 shadow-md'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isPosting ? (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Publication...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Send className="w-3 h-3" />
                <span>Publier</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Messages de feedback */}
      {feedback && (
        <div className={`p-3 rounded-xl border-l-4 ${
          feedback.includes('publié') 
            ? 'bg-green-50 border-green-400 text-green-800' 
            : 'bg-red-50 border-red-400 text-red-800'
        }`}>
          <span className="font-medium text-sm">{feedback}</span>
        </div>
      )}

      {/* État de chargement */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Chargement des messages...</span>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-800 font-medium">Erreur: {error}</p>
        </div>
      )}

      {/* Feed des messages - Design compact et professionnel */}
      <div className="space-y-3">
        {rappels.map(note => (
          <div key={note.id} className="bg-white/20 backdrop-blur-sm border-2 border-black/20 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 group">
            {/* En-tête du message compact */}
            <div className="flex items-start gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {getAuthorName(note.created_by)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm truncate">{getAuthorName(note.created_by)}</h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(getAuthorRole(note.created_by))}`}>
                    {getRoleLabel(getAuthorRole(note.created_by))}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{getTimeAgo(note.created_at)}</span>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setShowDeleteConfirm(note.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300"
                    title="Supprimer ce message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Contenu du message */}
            <div className="text-gray-800 leading-relaxed whitespace-pre-line text-sm ml-11">
              {note.contenu}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-red-100/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-xl">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Supprimer le message</h3>
            </div>
            <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-all duration-300 text-sm font-medium"
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  deleteRappel(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-300 text-sm font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}