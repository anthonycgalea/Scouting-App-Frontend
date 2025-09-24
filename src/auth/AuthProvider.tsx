import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type SupabaseSessionUserMetadata = {
  email?: string;
  full_name?: string;
  name?: string;
  preferred_username?: string;
  user_name?: string;
};

type SupabaseSessionUser = {
  email?: string;
  user_metadata?: SupabaseSessionUserMetadata;
};

type SupabaseStoredSession = {
  currentSession?: {
    user?: SupabaseSessionUser;
  } | null;
};

export interface AuthUser {
  displayName: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  loginWithDiscord: () => void;
  logout: () => void;
}

const DISCORD_OAUTH_URL =
  'https://discord.com/oauth2/authorize?client_id=1420518719024529479&response_type=code&redirect_uri=https%3A%2F%2Fvjrtjqnvatjfokogdhej.supabase.co%2Fauth%2Fv1%2Fcallback&scope=identify+email';
const DISCORD_OAUTH_STATE_STORAGE_KEY = 'discord-oauth-state';

const createDiscordOAuthUrl = () => {
  if (!isBrowser) {
    return DISCORD_OAUTH_URL;
  }

  const loginUrl = new URL(DISCORD_OAUTH_URL);
  const state =
    typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  try {
    window.sessionStorage.setItem(DISCORD_OAUTH_STATE_STORAGE_KEY, state);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Unable to persist Discord OAuth state to sessionStorage', error);
  }

  loginUrl.searchParams.set('state', state);

  return loginUrl.toString();
};

const SUPABASE_PROJECT_ID = 'vjrtjqnvatjfokogdhej';
const SUPABASE_STORAGE_KEY_SUFFIX = '-auth-token';
const SUPABASE_DEFAULT_STORAGE_KEY = `sb-${SUPABASE_PROJECT_ID}${SUPABASE_STORAGE_KEY_SUFFIX}`;

const isBrowser = typeof window !== 'undefined';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const resolveSupabaseStorageKey = () => {
  if (!isBrowser) {
    return null;
  }

  if (window.localStorage.getItem(SUPABASE_DEFAULT_STORAGE_KEY)) {
    return SUPABASE_DEFAULT_STORAGE_KEY;
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith('sb-') && key.endsWith(SUPABASE_STORAGE_KEY_SUFFIX)) {
      return key;
    }
  }

  return null;
};

const getDisplayName = (user: SupabaseSessionUser | undefined | null) => {
  if (!user) {
    return null;
  }

  const metadata = user.user_metadata ?? {};

  return (
    metadata.full_name ??
    metadata.name ??
    metadata.user_name ??
    metadata.preferred_username ??
    metadata.email ??
    user.email ??
    null
  );
};

const readUserFromStorage = (): AuthUser | null => {
  if (!isBrowser) {
    return null;
  }

  const storageKey = resolveSupabaseStorageKey();
  if (!storageKey) {
    return null;
  }

  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue: SupabaseStoredSession = JSON.parse(rawValue);
    const supabaseUser = parsedValue?.currentSession?.user;

    if (!supabaseUser) {
      return null;
    }

    const email = supabaseUser.email ?? supabaseUser.user_metadata?.email ?? '';
    const displayName = getDisplayName(supabaseUser);

    if (!displayName && !email) {
      return null;
    }

    return {
      displayName: displayName ?? email,
      email,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to parse Supabase session from storage', error);
    return null;
  }
};

const clearSupabaseSessions = () => {
  if (!isBrowser) {
    return;
  }

  const keysToRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && key.startsWith('sb-') && key.includes(SUPABASE_STORAGE_KEY_SUFFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    window.localStorage.removeItem(key);
  });
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(isBrowser);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const currentUrl = new URL(window.location.href);
    const error = currentUrl.searchParams.get('error');
    const errorDescription = currentUrl.searchParams.get('error_description');

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Discord login failed', { error, errorDescription });
      currentUrl.searchParams.delete('error');
      currentUrl.searchParams.delete('error_code');
      currentUrl.searchParams.delete('error_description');
      window.history.replaceState(null, document.title, currentUrl.toString());
    }

    if (currentUrl.searchParams.has('state')) {
      try {
        window.sessionStorage.removeItem(DISCORD_OAUTH_STATE_STORAGE_KEY);
      } catch (removeError) {
        // eslint-disable-next-line no-console
        console.warn('Unable to clear Discord OAuth state from sessionStorage', removeError);
      }
    }
  }, []);

  const refreshUserFromStorage = useCallback(() => {
    const nextUser = readUserFromStorage();
    setUser(nextUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUserFromStorage();
  }, [refreshUserFromStorage]);

  useEffect(() => {
    if (!isBrowser) {
      return () => undefined;
    }

    const handleStorageChange = () => {
      refreshUserFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, [refreshUserFromStorage]);

  const loginWithDiscord = useCallback(() => {
    if (!isBrowser) {
      return;
    }

    const oauthUrl = createDiscordOAuthUrl();
    window.location.href = oauthUrl;
  }, []);

  const logout = useCallback(() => {
    clearSupabaseSessions();
    setUser(null);
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      loginWithDiscord,
      logout,
    }),
    [user, loading, loginWithDiscord, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
