const TOKEN_STORAGE_KEY = 'scouting-app.auth.tokens';

const isBrowser = typeof window !== 'undefined';

type StoredTokens = {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  providerToken?: string;
  expiresAt?: number;
};

const readStoredTokens = (): StoredTokens | null => {
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

  window.sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(storedValue));

  window.history.replaceState(null, document.title, `${pathname}${search}`);
};

export const getStoredAccessToken = () => readStoredTokens()?.accessToken ?? null;

export const clearStoredTokens = () => {
  if (!isBrowser) {
    return;
  }

  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
};
