// Endpoint de test pour vérifier les variables d'environnement
export async function GET() {
  return Response.json({
    google_drive_folder_id: process.env.GOOGLE_DRIVE_FOLDER_ID ? 'Défini' : 'Non défini',
    google_service_account_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Défini' : 'Non défini',
    google_private_key: process.env.GOOGLE_PRIVATE_KEY ? 'Défini' : 'Non défini',
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Défini' : 'Non défini',
    supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Défini' : 'Non défini'
  })
}
