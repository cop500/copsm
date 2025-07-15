import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { User } from 'lucide-react';

export default function MonProfil() {
  const { currentUser, refreshUser } = useUser();
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Upload photo de profil
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(`public/${currentUser.id}`, file, { upsert: true });
    if (!error) {
      const url = supabase.storage.from('avatars').getPublicUrl(`public/${currentUser.id}`).data.publicUrl;
      setAvatarUrl(url);
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', currentUser.id);
      refreshUser();
      setMessage('Photo de profil mise à jour !');
    } else {
      setMessage('Erreur lors de l’upload');
    }
    setLoading(false);
  };

  // Changement de mot de passe
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    setMessage(error ? 'Erreur lors du changement de mot de passe' : 'Mot de passe modifié !');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-8 mt-8">
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-24 h-24 mb-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="rounded-full border-4 border-blue-200 w-24 h-24 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <User className="w-16 h-16 text-white" />
            </div>
          )}
          <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-md">
            <Camera className="w-5 h-5 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mt-2">{currentUser?.prenom} {currentUser?.nom}</h2>
        <p className="text-blue-600 font-medium text-sm">{currentUser?.role}</p>
      </div>
      <div className="mb-4 space-y-1">
        <p className="text-gray-700"><b>Email :</b> {currentUser?.email}</p>
        <p className="text-gray-700"><b>Poste :</b> {currentUser?.poste || '—'}</p>
      </div>
      <form onSubmit={handlePasswordChange} className="space-y-4 mt-6">
        <h3 className="font-semibold text-gray-900 mb-2">Changer le mot de passe</h3>
        <Input
          type="password"
          placeholder="Nouveau mot de passe"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </form>
      {message && <div className="mt-4 text-center text-blue-600">{message}</div>}
    </div>
  );
} 