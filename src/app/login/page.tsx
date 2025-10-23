// ========================================
// src/app/login/page.tsx - Page de connexion
// ========================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, LogIn, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { signIn, loading: authLoading } = useAuth()
  const router = useRouter()

  // Afficher un spinner si en cours de chargement
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)

    try {
      await signIn(email, password)
      toast.success('Connexion réussie !')
      
      // Rediriger selon le rôle
      if (email.toLowerCase() === 'directeurcmc@cop.com') {
        router.push('/dashboard-full')
      } else if (email.toLowerCase() === 'badr@cop.com') {
        router.push('/dashboard-full')
      } else {
        router.push('/dashboard-full')
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur de connexion'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Image de fond sans overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/login-bg.jpg"
          alt="Contexte professionnel"
          fill
          className="object-cover"
          priority
          quality={85}
        />
        {/* Overlay supprimé pour tester la photo en arrière-plan pur */}
      </div>

      {/* Contenu principal avec animations d'entrée */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* En-tête avec titre principal - Animation fade-in */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 drop-shadow-lg leading-tight">
              Centre d&apos;Orientation Professionnelle CMC SM
            </h1>
          </div>
          
          {/* Formulaire avec effet de transparence, contour renforcé et animation slide-up */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl border-2 border-emerald-300/40 shadow-2xl p-6 md:p-8 transition-all duration-500 hover:bg-white/20 hover:border-emerald-300/60 animate-slide-up">
            <h2 className="text-xl md:text-2xl font-semibold text-emerald-300 mb-6 text-center drop-shadow-md animate-glow">
              Connectez-vous à votre espace COP
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200 font-medium text-sm md:text-base">
                  Email
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@cop.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 md:h-12 bg-white/25 border-2 border-emerald-300/30 text-white placeholder-gray-300 backdrop-blur-sm transition-all duration-300 focus:bg-white/35 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/40 group-hover:bg-white/30 group-hover:border-emerald-300/50 text-sm md:text-base"
                    disabled={loading || authLoading}
                  />
                  <div className="absolute inset-0 rounded-md transition-all duration-300 group-hover:ring-2 group-hover:ring-emerald-300/30 pointer-events-none"></div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200 font-medium text-sm md:text-base">
                  Mot de passe
                </Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 md:h-12 bg-white/25 border-2 border-emerald-300/30 text-white placeholder-gray-300 backdrop-blur-sm transition-all duration-300 focus:bg-white/35 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/40 group-hover:bg-white/30 group-hover:border-emerald-300/50 pr-12 text-sm md:text-base"
                    disabled={loading || authLoading}
                  />
                  <div className="absolute inset-0 rounded-md transition-all duration-300 group-hover:ring-2 group-hover:ring-emerald-300/30 pointer-events-none"></div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-emerald-300 transition-colors duration-200"
                    disabled={loading || authLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 md:h-5 md:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 md:h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] shadow-lg animate-pulse text-sm md:text-base"
                disabled={loading || authLoading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
                    <span>Connexion...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <LogIn className="h-4 w-4 md:h-5 md:w-5" />
                    <span>Se connecter</span>
                  </div>
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs md:text-sm text-gray-200">
                  Problème de connexion ?{' '}
                  <a
                    href="mailto:admin@cop.com"
                    className="text-emerald-300 font-medium hover:text-emerald-200 transition-colors duration-200 underline decoration-emerald-300/50 hover:decoration-emerald-200"
                  >
                    Contactez l&apos;administrateur
                  </a>
                </p>
              </div>
            </form>
          </div>
          
          {/* Footer avec copyright - Animation fade-in */}
          <div className="text-center mt-6 md:mt-8 animate-fade-in-delayed">
            <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-full px-4 md:px-6 py-2 md:py-3 border border-emerald-300/30">
              <Users className="w-3 h-3 md:w-4 md:h-4 text-gray-300" />
              <p className="text-xs md:text-sm text-gray-200 font-medium">
                © 2025 COP - Centre d&apos;Orientation Professionnelle
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Styles CSS personnalisés pour les animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 5px rgba(16, 185, 129, 0.5); }
          50% { text-shadow: 0 0 20px rgba(16, 185, 129, 0.8), 0 0 30px rgba(16, 185, 129, 0.6); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 1.2s ease-out 0.3s both;
        }
        
        .animate-fade-in-delayed {
          animation: fade-in 1s ease-out 0.8s both;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}