import { createClient } from '@supabase/supabase-js'

// Client Supabase en mode service (serveur uniquement)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceRoleKey) {
  // On évite de lancer une erreur ici pour ne pas casser le build,
  // mais les routes qui l'utilisent vérifieront sa présence.
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY manquant : les routes admin ne pourront pas fonctionner.')
}

export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

