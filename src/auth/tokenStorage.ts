import { loadSupabaseClient } from './supabaseClient';
import { SUPABASE_CUSTOM_STORAGE_KEY, SUPABASE_STORAGE_KEY_SUFFIX } from './supabaseConfig';

const TOKEN_STORAGE_KEY = 'scouting-app.auth.tokens';
const USER_STORAGE_KEY = 'scouting-app.auth.user';
const SUPABASE_STORAGE_PREFIX = 'sb-';
const TOKEN_EXPIRATION_BUFFER_MS = 60_000;

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

type SupabaseAuthLike = {
  refreshSession: (input: { refresh_token?: string | null }) => Promise<{
    data: { session?: unknown } | null;
    error: unknown;
  }>;
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

const persistStoredTokens = (tokens: StoredTokens) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
};

const syncTokensFromSupabaseStorage = (): StoredTokens | null => {
  const supabaseTokens = readSupabaseStoredTokens();
  if (!supabaseTokens) {
    return null;
  }

  if (supabaseTokens.expiresAt && Date.now() >= supabaseTokens.expiresAt) {
    return null;
  }

  persistStoredTokens(supabaseTokens);

  return supabaseTokens;
};

const readPersistedTokens = (): StoredTokens | null => {
  if (!isBrowser) {
    return null;
  }

  const rawValue = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as StoredTokens;

    if (!parsedValue?.accessToken) {
      return null;
    }

    if (parsedValue.expiresAt && Date.now() >= parsedValue.expiresAt) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }

    return parsedValue;
  } catch (error) {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
};

const readStoredTokens = (): StoredTokens | null =>
  syncTokensFromSupabaseStorage() ?? readPersistedTokens();

const shouldRefreshTokens = (tokens: StoredTokens) => {
  if (!tokens.expiresAt) {
    return false;
  }

  return Date.now() >= tokens.expiresAt - TOKEN_EXPIRATION_BUFFER_MS;
};

const refreshSupabaseTokens = async (tokens: StoredTokens): Promise<StoredTokens | null> => {
  const supabaseClient = await loadSupabaseClient();
  if (!supabaseClient) {
    return null;
  }

  if (!tokens.refreshToken) {
    return syncTokensFromSupabaseStorage();
  }

  const authClient = supabaseClient.auth as SupabaseAuthLike | undefined;
  if (!authClient) {
    return null;
  }

  const { data, error } = await authClient.refreshSession({
    refresh_token: tokens.refreshToken,
  });

  if (error) {
    return null;
  }

  const refreshedTokens =
    syncTokensFromSupabaseStorage() ??
    toStoredTokens((data?.session as SupabaseSessionPayload | null) ?? null) ??
    toStoredTokens((data?.session as SupabaseSessionPayload | null)?.currentSession);

  if (!refreshedTokens) {
    return null;
  }

  persistStoredTokens(refreshedTokens);

  return refreshedTokens;
};

type StoredAuthUser = {
  displayName: string;
  email: string;
};

const readStoredAuthUser = (): StoredAuthUser | null => {
  if (!isBrowser) {
    return null;
  }

  const rawValue = window.localStorage.getItem(USER_STORAGE_KEY);
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
    window.localStorage.removeItem(USER_STORAGE_KEY);
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

      persistStoredTokens(storedValue);
    }

    window.history.replaceState(null, document.title, `${pathname}${search}`);
  }

  syncTokensFromSupabaseStorage();
};

export const ensureValidAccessToken = async (): Promise<string | null> => {
  const storedTokens = readStoredTokens();
  if (!storedTokens) {
    return null;
  }

  if (!shouldRefreshTokens(storedTokens)) {
    return storedTokens.accessToken;
  }

  const refreshedTokens = await refreshSupabaseTokens(storedTokens);
  const nextTokens = refreshedTokens ?? storedTokens;

  return nextTokens.accessToken;
};

export const getStoredAccessToken = () => readStoredTokens()?.accessToken ?? null;

export const getStoredAuthUser = () => readStoredAuthUser();

export const clearStoredTokens = () => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const persistAuthUser = (user: StoredAuthUser) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearStoredAuthUser = () => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.removeItem(USER_STORAGE_KEY);
};
