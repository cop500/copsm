'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugRealtimePage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Vérification...')
  const [candidatures, setCandidatures] = useState<any[]>([])
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testRealtime = async () => {
      try {
        console.log('🔍 Test de diagnostic Supabase Realtime...')
        
        // Test 1: Vérifier la connexion Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        console.log('👤 Utilisateur:', user)
        
        if (authError) {
          setError(`Erreur auth: ${authError.message}`)
          return
        }

        // Test 2: Vérifier l'accès à la table
        const { data, error: tableError } = await supabase
          .from('candidatures_stagiaires')
          .select('*')
          .limit(3)
        
        if (tableError) {
          setError(`Erreur table: ${tableError.message}`)
          return
        }
        
        console.log('📊 Candidatures trouvées:', data?.length || 0)
        setCandidatures(data || [])
        setConnectionStatus('✅ Connexion Supabase OK')

        // Test 3: Tester Realtime
        const channel = supabase
          .channel('debug-realtime')
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'candidatures_stagiaires' 
            },
            (payload) => {
              console.log('🔄 Événement Realtime reçu:', payload)
              setRealtimeEvents(prev => [payload, ...prev.slice(0, 9)]) // Garder les 10 derniers
            }
          )
          .subscribe((status) => {
            console.log('📡 Statut Realtime:', status)
            if (status === 'SUBSCRIBED') {
              setConnectionStatus('✅ Realtime connecté')
            } else if (status === 'CHANNEL_ERROR') {
              setConnectionStatus('❌ Erreur Realtime')
              setError('Erreur de connexion Realtime')
            } else if (status === 'TIMED_OUT') {
              setConnectionStatus('⏰ Timeout Realtime')
              setError('Timeout de connexion Realtime')
            } else {
              setConnectionStatus(`📡 Statut: ${status}`)
            }
          })

        // Nettoyage
        return () => {
          supabase.removeChannel(channel)
        }

      } catch (err: any) {
        console.error('❌ Erreur diagnostic:', err)
        setError(`Erreur: ${err.message}`)
        setConnectionStatus('❌ Erreur de diagnostic')
      }
    }

    testRealtime()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Diagnostic Supabase Realtime</h1>
      
      {/* Statut de connexion */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">📡 Statut de connexion</h2>
        <div className={`p-4 rounded-lg ${connectionStatus.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <strong>Statut:</strong> {connectionStatus}
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg">
            <strong>Erreur:</strong> {error}
          </div>
        )}
      </div>

      {/* Candidatures existantes */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">📊 Candidatures existantes</h2>
        <div className="text-sm text-gray-600 mb-2">
          Nombre: {candidatures.length}
        </div>
        {candidatures.length > 0 ? (
          <div className="space-y-2">
            {candidatures.map((candidature, index) => (
              <div key={candidature.id || index} className="p-3 bg-gray-50 rounded border">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>ID:</strong> {candidature.id}</div>
                  <div><strong>Nom:</strong> {candidature.nom} {candidature.prenom}</div>
                  <div><strong>Entreprise:</strong> {candidature.entreprise_nom}</div>
                  <div><strong>Créé:</strong> {new Date(candidature.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">Aucune candidature trouvée</div>
        )}
      </div>

      {/* Événements Realtime */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">🔄 Événements Realtime</h2>
        <div className="text-sm text-gray-600 mb-2">
          Derniers événements reçus: {realtimeEvents.length}
        </div>
        {realtimeEvents.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {realtimeEvents.map((event, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded border">
                <div className="text-sm">
                  <div><strong>Type:</strong> {event.eventType}</div>
                  <div><strong>Heure:</strong> {new Date().toLocaleTimeString()}</div>
                  {event.new && (
                    <div><strong>Nouveau:</strong> {JSON.stringify(event.new, null, 2)}</div>
                  )}
                  {event.old && (
                    <div><strong>Ancien:</strong> {JSON.stringify(event.old, null, 2)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">
            Aucun événement Realtime reçu. 
            <br />
            <strong>Test:</strong> Soumettez une candidature via <code>copsm.space/candidature</code> pour voir les événements.
          </div>
        )}
      </div>
    </div>
  )
}
