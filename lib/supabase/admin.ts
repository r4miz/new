import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Service-role client. Never expose to the browser.
 * Used only in server-side API routes for operations that require
 * bypassing RLS: creating workspace schemas, ingesting CSV data.
 * Lazy singleton so it isn't instantiated at build time.
 */
let _adminClient: SupabaseClient | null = null

export function getAdminClient(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }
  return _adminClient
}

// Convenience re-export for callers that already imported adminClient
export const adminClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getAdminClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
