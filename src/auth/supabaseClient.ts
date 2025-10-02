import type { SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js';
import { SUPABASE_AUTH_OPTIONS, SUPABASE_URL } from './supabaseConfig';

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
const SUPABASE_MODULE_ID = '@supabase/supabase-js';

let cachedClient: SupabaseClient | null | undefined;

const getClientOptions = (): SupabaseClientOptions => ({
  auth: SUPABASE_AUTH_OPTIONS,
});

export const loadSupabaseClient = async (): Promise<SupabaseClient | null> => {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  if (!SUPABASE_ANON_KEY) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('Supabase anon key is not configured. Skipping Supabase client initialization.');
    }
    cachedClient = null;
    return cachedClient;
  }

  try {
    const supabaseModule = await import(/* @vite-ignore */ SUPABASE_MODULE_ID);
    if (typeof supabaseModule.createClient !== 'function') {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('Supabase module does not expose a createClient factory.');
      }
      cachedClient = null;
      return cachedClient;
    }

    cachedClient = supabaseModule.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, getClientOptions());
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('Failed to initialize Supabase client.', error);
    }
    cachedClient = null;
  }

  return cachedClient ?? null;
};
