declare module '@supabase/supabase-js' {
  export interface SupabaseAuthOptions {
    persistSession?: boolean;
    autoRefreshToken?: boolean;
    detectSessionInUrl?: boolean;
    storageKey?: string;
    storage?: Storage;
  }

  export interface SupabaseClientOptions {
    auth?: SupabaseAuthOptions;
  }

  export type AuthChangeEvent =
    | 'INITIAL_SESSION'
    | 'SIGNED_IN'
    | 'SIGNED_OUT'
    | 'TOKEN_REFRESHED'
    | 'USER_UPDATED'
    | 'PASSWORD_RECOVERY';

  export interface Session {
    access_token: string;
    refresh_token: string | null;
    expires_at?: number | null;
    expires_in?: number | null;
    provider_token?: string | null;
    token_type?: string | null;
  }

  export interface AuthSubscription {
    unsubscribe: () => void;
  }

  export interface SupabaseAuthSessionResponse {
    data: { session: Session | null } | null;
    error: unknown;
  }

  export interface SupabaseAuthClient {
    getSession: () => Promise<SupabaseAuthSessionResponse>;
    onAuthStateChange: (
      callback: (event: AuthChangeEvent, session: Session | null) => void,
    ) => { data: { subscription: AuthSubscription } | null; error: unknown };
    refreshSession: (input: { refresh_token?: string | null }) => Promise<SupabaseAuthSessionResponse>;
  }

  export interface SupabaseClient {
    auth: SupabaseAuthClient;
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions,
  ): SupabaseClient;
}
