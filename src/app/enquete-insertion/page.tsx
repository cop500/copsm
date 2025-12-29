'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import EnqueteInsertionDashboard from '@/components/EnqueteInsertionDashboard'
import { RefreshCw } from 'lucide-react'

export default function EnqueteInsertionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single()

    // Autoriser admin, manager COP et conseillères carrière
    const isAuthorized = profile?.role === 'business_developer' || profile?.role === 'manager_cop' || profile?.role === 'conseillere_carriere'

    if (!isAuthorized) {
      router.push('/dashboard')
      return
    }

    setUser(profile)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    )
  }

  return <EnqueteInsertionDashboard />
}
