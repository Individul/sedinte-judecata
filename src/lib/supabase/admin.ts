import { createClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client using the `service_role` key.
 * SERVER-ONLY — never import this from a Client Component. Used strictly for
 * admin operations such as creating users and assigning roles.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
