import type { Session, SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js';
import {
  SUPABASE_AUTH_OPTIONS,
  SUPABASE_SESSION_STORAGE_KEY,
  SUPABASE_URL,
} from './supabaseConfig';

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

let cachedClient: SupabaseClient | null | undefined;
let authListenerInitialized = false;

const isBrowser = typeof window !== 'undefined';

const getClientOptions = (): SupabaseClientOptions => {
  const authOptions: SupabaseClientOptions['auth'] = {
    ...SUPABASE_AUTH_OPTIONS,
    ...(isBrowser ? { storage: window.localStorage } : {}),
  };

  return {
    auth: authOptions,
  } satisfies SupabaseClientOptions;
};

const persistSupabaseSession = (session: Session | null) => {
  if (!isBrowser) {
    return;
  }

  try {
    if (session) {
      window.localStorage.setItem(SUPABASE_SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SUPABASE_SESSION_STORAGE_KEY);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('Failed to persist Supabase session.', error);
    }
  }
};

const ensureAuthPersistence = async (client: SupabaseClient) => {
  if (!isBrowser) {
    return;
  }

  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      throw error;
    }

    persistSupabaseSession(data?.session ?? null);
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('Failed to restore Supabase session.', error);
    }
  }

  if (authListenerInitialized) {
    return;
  }

  authListenerInitialized = true;

  client.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      persistSupabaseSession(null);
      return;
    }

    persistSupabaseSession(session);
  });
};

export const loadSupabaseClient = async (): Promise<SupabaseClient | null> => {
  if (cachedClient !== undefined) {
    if (cachedClient) {
      const existingClient = cachedClient;
      await ensureAuthPersistence(existingClient);
      return existingClient;
    }
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
    const supabaseModule = await import('@supabase/supabase-js');
    if (typeof supabaseModule.createClient !== 'function') {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('Supabase module does not expose a createClient factory.');
      }
      cachedClient = null;
      return cachedClient;
    }
    const nextClient = supabaseModule.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      getClientOptions(),
    );
    cachedClient = nextClient;
    await ensureAuthPersistence(nextClient);
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('Failed to initialize Supabase client.', error);
    }
    cachedClient = null;
  }

  return cachedClient ?? null;
};
