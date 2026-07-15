'use client'

import { useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Play,
  User,
} from 'lucide-react'
import VideoPortalLayout from './VideoPortalLayout'

interface FormateurLoginScreenProps {
  login: string
  password: string
  loginError: string
  loginLoading: boolean
  onLoginChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export default function FormateurLoginScreen({
  login,
  password,
  loginError,
  loginLoading,
  onLoginChange,
  onPasswordChange,
  onSubmit,
}: FormateurLoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <VideoPortalLayout
      variant="formateur"
      badge="Accès formateur"
      title="Évaluation des vidéos"
      subtitle="Connectez-vous pour noter les vidéos qui vous ont été affectées."
    >
      <div className="flex justify-center">
        <div className="relative w-full max-w-md">
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1a6bb5] to-[#0f3d6c] flex items-center justify-center shadow-xl shadow-blue-900/40 ring-4 ring-white/90">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/25 border border-white/60 px-8 pt-12 pb-8 space-y-5"
          >
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-blue-50/80 to-transparent rounded-t-3xl pointer-events-none" />

            <div className="relative">
              <label className="sr-only">Identifiant</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0f3d6c]/50" />
                <input
                  required
                  placeholder="Identifiant"
                  value={login}
                  onChange={(e) => onLoginChange(e.target.value)}
                  className="w-full border border-slate-200/80 bg-white rounded-2xl pl-11 pr-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f3d6c]/25 focus:border-[#0f3d6c]/40 transition-shadow"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="relative">
              <label className="sr-only">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0f3d6c]/50" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  className="w-full border border-slate-200/80 bg-white rounded-2xl pl-11 pr-12 py-3.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f3d6c]/25 focus:border-[#0f3d6c]/40 transition-shadow"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0f3d6c] transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <p className="text-sm text-red-600 flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-[#0f3d6c] to-[#1a5a96] text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:from-[#0d3359] hover:to-[#164a7d] disabled:opacity-60 shadow-lg shadow-[#0f3d6c]/30 transition-all hover:shadow-xl hover:shadow-[#0f3d6c]/35 hover:-translate-y-0.5"
            >
              {loginLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </VideoPortalLayout>
  )
}
