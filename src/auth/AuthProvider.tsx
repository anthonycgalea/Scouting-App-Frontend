import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ApiError } from '../api/httpClient';
import { fetchUserInfo, UserInfoResponse } from '../api/user';
import {
  TOKEN_REFRESH_BUFFER_MS,
  TOKENS_CHANGED_EVENT,
  clearStoredAuthUser,
  clearStoredTokens,
  ensureValidAccessToken,
  getStoredAuthUser,
  getStoredTokens,
  persistAuthUser,
  persistTokensFromUrl,
} from './tokenStorage';
import { SUPABASE_PROJECT_ID, SUPABASE_STORAGE_KEY_SUFFIX } from './supabaseConfig';

export interface AuthUser {
  displayName: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  loginWithDiscord: () => void;
  loginWithGoogle: () => void;
  logout: () => void;
}

const isBrowser = typeof window !== 'undefined';

const getSupabaseOAuthUrl = (provider: 'discord' | 'google') => {
  const baseUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/auth/v1/authorize?provider=${provider}`;

  if (!isBrowser) {
    return baseUrl;
  }

  const authorizeUrl = new URL(baseUrl);
  if (provider === 'discord') {
    authorizeUrl.searchParams.set('scopes', 'identify email');
  }
  authorizeUrl.searchParams.set('redirect_to', window.location.origin);

  return authorizeUrl.toString();
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getDisplayNameFromUserInfo = (user: UserInfoResponse) =>
  user.full_name ??
  user.display_name ??
  user.displayName ??
  user.name ??
  user.username ??
  user.user_name ??
  user.email ??
  'User';

const mapUserInfoToAuthUser = (userInfo: UserInfoResponse): AuthUser => ({
  displayName: getDisplayNameFromUserInfo(userInfo),
  email: userInfo.email ?? '',
});

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
  const [user, setUser] = useState<AuthUser | null>(() => (isBrowser ? getStoredAuthUser() : null));
  const [loading, setLoading] = useState<boolean>(isBrowser);
  const requestIdRef = useRef(0);
  const refreshTimeoutRef = useRef<number | null>(null);

  const refreshUserInfo = useCallback(async () => {
    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;

    if (!isBrowser) {
      setUser(null);
      setLoading(false);
      return;
    }

    const accessToken = await ensureValidAccessToken();

    if (!accessToken) {
      setUser(null);
      clearStoredAuthUser();
      setLoading(false);
      clearStoredTokens();
      clearSupabaseSessions();
      return;
    }

    setLoading(true);

    try {
      const userInfo = await fetchUserInfo();
      if (requestIdRef.current !== nextRequestId) {
        return;
      }

      const nextUser = mapUserInfoToAuthUser(userInfo);
      setUser(nextUser);
      persistAuthUser(nextUser);
    } catch (error) {
      if (requestIdRef.current !== nextRequestId) {
        return;
      }

      if (error instanceof ApiError && error.metadata.status === 401) {
        clearStoredTokens();
        clearStoredAuthUser();
        clearSupabaseSessions();
        setUser(null);
      } else {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch user info', error);
      }
    } finally {
      if (requestIdRef.current === nextRequestId) {
        setLoading(false);
      }
    }
  }, []);

  const scheduleTokenRefresh = useCallback(() => {
    if (!isBrowser) {
      return;
    }

    if (refreshTimeoutRef.current !== null) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    const tokens = getStoredTokens();

    if (!tokens?.expiresAt || !tokens.refreshToken) {
      return;
    }

    const refreshDelay = Math.max(tokens.expiresAt - TOKEN_REFRESH_BUFFER_MS - Date.now(), 0);

    refreshTimeoutRef.current = window.setTimeout(() => {
      void (async () => {
        const accessToken = await ensureValidAccessToken({ forceRefresh: true });

        if (!accessToken) {
          clearStoredTokens();
          clearStoredAuthUser();
          clearSupabaseSessions();
          setUser(null);
          setLoading(false);
          return;
        }

        scheduleTokenRefresh();
        void refreshUserInfo();
      })();
    }, refreshDelay);
  }, [refreshUserInfo]);

  useEffect(() => {
    if (isBrowser) {
      persistTokensFromUrl();
    }

    scheduleTokenRefresh();
    void refreshUserInfo();
  }, [refreshUserInfo, scheduleTokenRefresh]);

  useEffect(() => {
    if (!isBrowser) {
      return () => undefined;
    }

    const handleRefresh = () => {
      scheduleTokenRefresh();
      void refreshUserInfo();
    };

    window.addEventListener('storage', handleRefresh);
    window.addEventListener('focus', handleRefresh);
    window.addEventListener(TOKENS_CHANGED_EVENT, handleRefresh);

    return () => {
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener(TOKENS_CHANGED_EVENT, handleRefresh);
    };
  }, [refreshUserInfo, scheduleTokenRefresh]);

  useEffect(
    () => () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    },
    [],
  );

  const loginWithDiscord = useCallback(() => {
    if (!isBrowser) {
      return;
    }

    window.location.href = getSupabaseOAuthUrl('discord');
  }, []);

  const loginWithGoogle = useCallback(() => {
    if (!isBrowser) {
      return;
    }

    window.location.href = getSupabaseOAuthUrl('google');
  }, []);

  const logout = useCallback(() => {
    clearStoredTokens();
    clearStoredAuthUser();
    clearSupabaseSessions();
    if (refreshTimeoutRef.current !== null) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    setUser(null);
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      loginWithDiscord,
      loginWithGoogle,
      logout,
    }),
    [user, loading, loginWithDiscord, loginWithGoogle, logout],
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
