import { SUPABASE_AUTH_BASE_URL } from './supabaseConfig';

const TOKEN_STORAGE_KEY = 'scouting-app.auth.tokens';
const USER_STORAGE_KEY = 'scouting-app.auth.user';
export const TOKEN_REFRESH_BUFFER_MS = 60 * 1000;
export const TOKENS_CHANGED_EVENT = 'scouting-app.auth.tokens-changed';

const isBrowser = typeof window !== 'undefined';

export type StoredTokens = {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  providerToken?: string;
  expiresAt?: number;
};

type SupabaseSessionResponse = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  provider_token?: string;
  expires_in?: number;
};

type StoredAuthUser = {
  displayName: string;
  email: string;
};

const getStorage = () => (isBrowser ? window.localStorage : undefined);

const dispatchTokensChangedEvent = () => {
  if (!isBrowser) {
    return;
  }

  window.dispatchEvent(new Event(TOKENS_CHANGED_EVENT));
};

const readStoredTokens = (): StoredTokens | null => {
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
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }

    return parsedValue;
  } catch (error) {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
};

const writeStoredTokens = (tokens: StoredTokens | null) => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  if (!tokens) {
    storage.removeItem(TOKEN_STORAGE_KEY);
    dispatchTokensChangedEvent();
    return;
  }

  storage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  dispatchTokensChangedEvent();
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
      window.localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }

    return parsedValue;
  } catch (error) {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

const isTokenExpiring = (tokens: StoredTokens) =>
  typeof tokens.expiresAt === 'number' && tokens.expiresAt - TOKEN_REFRESH_BUFFER_MS <= Date.now();

let refreshPromise: Promise<StoredTokens | null> | null = null;

const refreshTokens = async (): Promise<StoredTokens | null> => {
  if (!isBrowser) {
    return null;
  }

  const tokens = readStoredTokens();

  if (!tokens?.refreshToken) {
    writeStoredTokens(null);
    return null;
  }

  try {
    const response = await fetch(`${SUPABASE_AUTH_BASE_URL}/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: tokens.refreshToken }),
    });

    if (!response.ok) {
      writeStoredTokens(null);
      return null;
    }

    const data = (await response.json()) as SupabaseSessionResponse;

    const nextTokens: StoredTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? tokens.refreshToken,
      tokenType: data.token_type ?? tokens.tokenType,
      providerToken: data.provider_token ?? tokens.providerToken,
      expiresAt: typeof data.expires_in === 'number' ? Date.now() + data.expires_in * 1000 : tokens.expiresAt,
    };

    writeStoredTokens(nextTokens);

    return nextTokens;
  } catch (error) {
    writeStoredTokens(null);
    return null;
  }
};

const getRefreshPromise = () => {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

export const persistTokens = (tokens: StoredTokens) => {
  writeStoredTokens(tokens);
};

export const persistTokensFromUrl = () => {
  if (!isBrowser) {
    return;
  }

  const { hash, pathname, search } = window.location;
  if (!hash || !hash.includes('access_token')) {
    return;
  }

  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const accessToken = params.get('access_token');
  if (!accessToken) {
    return;
  }

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
  };

  writeStoredTokens(storedValue);

  window.history.replaceState(null, document.title, `${pathname}${search}`);
};

export const getStoredTokens = () => readStoredTokens();

export const getStoredAccessToken = () => readStoredTokens()?.accessToken ?? null;

export const getStoredAuthUser = () => readStoredAuthUser();

export const clearStoredTokens = () => {
  writeStoredTokens(null);
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

export const ensureValidAccessToken = async ({ forceRefresh = false } = {}) => {
  if (!isBrowser) {
    return null;
  }

  const tokens = readStoredTokens();

  if (!tokens?.accessToken) {
    return null;
  }

  if (!forceRefresh && !isTokenExpiring(tokens)) {
    return tokens.accessToken;
  }

  if (!tokens.refreshToken) {
    writeStoredTokens(null);
    return null;
  }

  const refreshedTokens = await getRefreshPromise();

  return refreshedTokens?.accessToken ?? null;
};
