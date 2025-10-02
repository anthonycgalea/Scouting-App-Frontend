declare module '@supabase/supabase-js' {
  export interface SupabaseAuthOptions {
    persistSession?: boolean;
    autoRefreshToken?: boolean;
    detectSessionInUrl?: boolean;
    storageKey?: string;
  }

  export interface SupabaseClientOptions {
    auth?: SupabaseAuthOptions;
  }

  export interface SupabaseClient {
    auth: unknown;
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions,
  ): SupabaseClient;
}
