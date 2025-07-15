"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { User, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

const AVATARS = [
  "/avatars/fem1.png",
  "/avatars/fem2.png",
  "/avatars/masc1.png",
  "/avatars/masc2.png",
  "/avatars/masc3.png",
];

export default function ProfilPage() {
  const { user, profile, signOut } = useAuth();
  const [nom, setNom] = useState(profile?.nom || "");
  const [prenom, setPrenom] = useState(profile?.prenom || "");
  const [avatar_url, setAvatarUrl] = useState(profile?.avatar_url || AVATARS[0]);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!profile) throw new Error("Profil non chargé");
      const { error } = await supabase
        .from("profiles")
        .update({ nom, prenom, avatar_url })
        .eq("id", profile.id);
      if (error) throw error;
      toast.success("Profil mis à jour !");
      // Forcer le rechargement de la page
      router.refresh && router.refresh();
    } catch (err) {
      toast.error("Erreur lors de la mise à jour : " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Changer le mot de passe dans Supabase
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Mot de passe modifié !");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error("Erreur lors du changement de mot de passe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <User className="w-6 h-6 text-blue-600" />
        Mon Profil
      </h2>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="prenom">Prénom</Label>
            <Input id="prenom" value={prenom} onChange={e => setPrenom(e.target.value)} required disabled={loading} />
          </div>
          <div>
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" value={nom} onChange={e => setNom(e.target.value)} required disabled={loading} />
          </div>
        </div>
        <div>
          <Label>Avatar</Label>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          )}
        </div>
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </form>
      <hr className="my-8" />
      <form onSubmit={handleChangePassword} className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-600" />
          Changer le mot de passe
        </h3>
        <div>
          <Label htmlFor="oldPassword">Mot de passe actuel</Label>
          <Input id="oldPassword" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required disabled={loading} />
        </div>
        <div>
          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
          <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required disabled={loading} />
        </div>
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
          {loading ? "Modification..." : "Modifier le mot de passe"}
        </Button>
      </form>
      <Button onClick={signOut} className="w-full mt-8 bg-red-600 hover:bg-red-700">Déconnexion</Button>
    </div>
  );
} 