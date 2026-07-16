'use client'

import { useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  PenLine,
  User,
} from 'lucide-react'
import VideoPortalLayout from '@/components/video/VideoPortalLayout'

interface AgentLoginScreenProps {
  login: string
  password: string
  loginError: string
  loginLoading: boolean
  onLoginChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export default function AgentLoginScreen({
  login,
  password,
  loginError,
  loginLoading,
  onLoginChange,
  onPasswordChange,
  onSubmit,
}: AgentLoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <VideoPortalLayout
      variant="formateur"
      badge="Accès agent de saisie"
      title="Saisie des notes"
      showHero
    >
      <div className="max-w-md mx-auto">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl shadow-black/20 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0a3560] to-[#0f4c81] px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/15 rounded-xl">
                <PenLine className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Connexion agent</h2>
                <p className="text-blue-100/80 text-sm">Identifiant et mot de passe</p>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-4">
            {loginError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Identifiant
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={login}
                  onChange={(e) => onLoginChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Votre identifiant"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[#0a3560] to-[#0f4c81] text-white font-semibold rounded-xl hover:opacity-95 disabled:opacity-60 transition-opacity"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion…
                </>
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
