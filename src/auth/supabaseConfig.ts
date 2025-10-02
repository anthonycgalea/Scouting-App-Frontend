export const SUPABASE_PROJECT_ID = 'vjrtjqnvatjfokogdhej';
export const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

export const SUPABASE_CUSTOM_STORAGE_KEY = 'sb-auth';
export const SUPABASE_STORAGE_KEY_SUFFIX = '-auth-token';

export const SUPABASE_AUTH_OPTIONS = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  storageKey: SUPABASE_CUSTOM_STORAGE_KEY,
} as const;
