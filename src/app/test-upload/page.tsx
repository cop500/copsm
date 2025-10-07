'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testUpload = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🔍 Test upload - Fichier:', file.name, file.size, file.type)
      
      // Test 1: Vérifier la connexion Supabase
      console.log('🔍 Test 1: Vérification connexion Supabase...')
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      console.log('Session:', sessionData, sessionError)

      // Test 2: Lister les buckets disponibles
      console.log('🔍 Test 2: Liste des buckets...')
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      console.log('Buckets disponibles:', buckets, bucketsError)

      // Test 3: Essayer upload vers cv-stagiaires
      console.log('🔍 Test 3: Upload vers cv-stagiaires...')
      const fileName = `test_${Date.now()}.pdf`
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cv-stagiaires')
          .upload(fileName, file)
        
        console.log('Upload cv-stagiaires:', uploadData, uploadError)
        
        if (uploadError) {
          throw uploadError
        }
        
        // Récupérer l'URL publique
        const { data: urlData } = supabase.storage
          .from('cv-stagiaires')
          .getPublicUrl(fileName)
        
        setResult({
          success: true,
          bucket: 'cv-stagiaires',
          fileName,
          url: urlData.publicUrl,
          message: 'Upload réussi vers cv-stagiaires'
        })
        
      } catch (cvError: any) {
        console.log('❌ Échec cv-stagiaires:', cvError.message)
        
        // Test 4: Essayer upload vers fichiers
        console.log('🔍 Test 4: Upload vers fichiers...')
        const fallbackFileName = `cv_stagiaires/test_${Date.now()}.pdf`
        
        const { data: uploadData2, error: uploadError2 } = await supabase.storage
          .from('fichiers')
          .upload(fallbackFileName, file)
        
        console.log('Upload fichiers:', uploadData2, uploadError2)
        
        if (uploadError2) {
          throw uploadError2
        }
        
        // Récupérer l'URL publique
        const { data: urlData2 } = supabase.storage
          .from('fichiers')
          .getPublicUrl(fallbackFileName)
        
        setResult({
          success: true,
          bucket: 'fichiers',
          fileName: fallbackFileName,
          url: urlData2.publicUrl,
          message: 'Upload réussi vers fichiers (fallback)'
        })
      }

    } catch (err: any) {
      console.error('❌ Erreur complète:', err)
      setError(`Erreur: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔍 Test Upload CV - Diagnostic
          </h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un fichier PDF de test
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {file && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p><strong>Fichier sélectionné:</strong> {file.name}</p>
                <p><strong>Taille:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p><strong>Type:</strong> {file.type}</p>
              </div>
            )}

            <button
              onClick={testUpload}
              disabled={!file || uploading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {uploading ? 'Test en cours...' : 'Lancer le test'}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-red-800 font-medium">❌ Erreur</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-green-800 font-medium">✅ Résultat</h3>
                <p className="text-green-700">{result.message}</p>
                <div className="mt-2 text-sm">
                  <p><strong>Bucket:</strong> {result.bucket}</p>
                  <p><strong>Nom fichier:</strong> {result.fileName}</p>
                  <p><strong>URL:</strong> <a href={result.url} target="_blank" className="text-blue-600 underline">Voir le fichier</a></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
