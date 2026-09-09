import { supabase } from '@/lib/supabase'

export async function getAssistanceAuthHeaders(
  withJson = false
): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Session expirée — reconnectez-vous.')
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
  }
  if (withJson) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}
