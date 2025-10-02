import { SUPABASE_CUSTOM_STORAGE_KEY, SUPABASE_STORAGE_KEY_SUFFIX } from './supabaseConfig';

const TOKEN_STORAGE_KEY = 'scouting-app.auth.tokens';
const USER_STORAGE_KEY = 'scouting-app.auth.user';
const SUPABASE_STORAGE_PREFIX = 'sb-';

const isBrowser = typeof window !== 'undefined';

export type StoredTokens = {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  providerToken?: string;
  expiresAt?: number;
};

type SupabaseSessionPayload = {
  access_token?: string;
  refresh_token?: string | null;
  token_type?: string | null;
  provider_token?: string | null;
  expires_at?: number | null;
  expires_in?: number | null;
  currentSession?: SupabaseSessionPayload | null;
  session?: SupabaseSessionPayload | null;
};

const isSupabaseStorageKey = (key: string) =>
  key.startsWith(SUPABASE_STORAGE_PREFIX) &&
  (key.includes(SUPABASE_STORAGE_KEY_SUFFIX) ||
    key.startsWith(`${SUPABASE_STORAGE_PREFIX}${SUPABASE_CUSTOM_STORAGE_KEY}`));

const toStoredTokens = (payload: SupabaseSessionPayload | null | undefined): StoredTokens | null => {
  if (!payload?.access_token) {
    return null;
  }

  let expiresAtValue: number | undefined;
  if (typeof payload.expires_at === 'number') {
    expiresAtValue = payload.expires_at > 1e12 ? payload.expires_at : payload.expires_at * 1000;
  } else if (typeof payload.expires_in === 'number') {
    expiresAtValue = Date.now() + payload.expires_in * 1000;
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? undefined,
    tokenType: payload.token_type ?? undefined,
    providerToken: payload.provider_token ?? undefined,
    expiresAt: expiresAtValue,
  } satisfies StoredTokens;
};

const readSupabaseStoredTokens = (): StoredTokens | null => {
  if (!isBrowser) {
    return null;
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !isSupabaseStorageKey(key)) {
      continue;
    }

    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      continue;
    }

    try {
      const parsedValue = JSON.parse(rawValue) as SupabaseSessionPayload;

      const directTokens = toStoredTokens(parsedValue);
      if (directTokens) {
        return directTokens;
      }

      const nestedTokens =
        toStoredTokens(parsedValue.currentSession) ?? toStoredTokens(parsedValue.session);
      if (nestedTokens) {
        return nestedTokens;
      }
    } catch (error) {
      // Ignore malformed values and continue searching other keys.
    }
  }

  return null;
};

const syncTokensFromSupabaseStorage = (): StoredTokens | null => {
  const supabaseTokens = readSupabaseStoredTokens();
  if (!supabaseTokens) {
    return null;
  }

  if (supabaseTokens.expiresAt && Date.now() >= supabaseTokens.expiresAt) {
    return null;
  }

  if (isBrowser) {
    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(supabaseTokens));
  }

  return supabaseTokens;
};

const readSessionTokens = (): StoredTokens | null => {
  if (!isBrowser) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as StoredTokens;

    if (!parsedValue?.accessToken) {
      return null;
    }

    if (parsedValue.expiresAt && Date.now() >= parsedValue.expiresAt) {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }

    return parsedValue;
  } catch (error) {
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
};

const readStoredTokens = (): StoredTokens | null => syncTokensFromSupabaseStorage() ?? readSessionTokens();

type StoredAuthUser = {
  displayName: string;
  email: string;
};

const readStoredAuthUser = (): StoredAuthUser | null => {
  if (!isBrowser) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(USER_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as StoredAuthUser;

    if (!parsedValue?.displayName && !parsedValue?.email) {
      return null;
    }

    return parsedValue;
  } catch (error) {
    window.sessionStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

export const persistTokensFromUrl = () => {
  if (!isBrowser) {
    return;
  }

  const { hash, pathname, search } = window.location;
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    if (accessToken) {
      const refreshToken = params.get('refresh_token') ?? undefined;
      const tokenType = params.get('token_type') ?? undefined;
      const providerToken = params.get('provider_token') ?? undefined;
      const expiresIn = params.get('expires_in');

      const expiresAt = expiresIn ? Date.now() + Number.parseInt(expiresIn, 10) * 1000 : undefined;

      const storedValue: StoredTokens = {
        accessToken,
        refreshToken,
        tokenType,
        providerToken,
        expiresAt,
      } satisfies StoredTokens;

      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(storedValue));
    }

    window.history.replaceState(null, document.title, `${pathname}${search}`);
  }

  syncTokensFromSupabaseStorage();
};

export const getStoredAccessToken = () => readStoredTokens()?.accessToken ?? null;

export const getStoredAuthUser = () => readStoredAuthUser();

export const clearStoredTokens = () => {
  if (!isBrowser) {
    return;
  }

  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const persistAuthUser = (user: StoredAuthUser) => {
  if (!isBrowser) {
    return;
  }

  window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearStoredAuthUser = () => {
  if (!isBrowser) {
    return;
  }

  window.sessionStorage.removeItem(USER_STORAGE_KEY);
};
