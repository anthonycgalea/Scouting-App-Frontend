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
  clearStoredAuthUser,
  clearStoredTokens,
  getStoredAccessToken,
  getStoredAuthUser,
  persistAuthUser,
  persistTokensFromUrl,
} from './tokenStorage';
import {
  SUPABASE_CUSTOM_STORAGE_KEY,
  SUPABASE_STORAGE_KEY_SUFFIX,
  SUPABASE_URL,
} from './supabaseConfig';
import { loadSupabaseClient } from './supabaseClient';

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
  const baseUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}`;

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
  const customStoragePrefix = `sb-${SUPABASE_CUSTOM_STORAGE_KEY}`;
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (
      key &&
      key.startsWith('sb-') &&
      (key.includes(SUPABASE_STORAGE_KEY_SUFFIX) || key.startsWith(customStoragePrefix))
    ) {
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

  const refreshUserInfo = useCallback(async () => {
    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;

    if (!isBrowser) {
      setUser(null);
      setLoading(false);
      return;
    }

    const accessToken = getStoredAccessToken();

    if (!accessToken) {
      setUser(null);
      clearStoredAuthUser();
      setLoading(false);
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

  useEffect(() => {
    if (!isBrowser) {
      void refreshUserInfo();
      return;
    }

    let isMounted = true;

    const initialize = async () => {
      await loadSupabaseClient();
      if (!isMounted) {
        return;
      }

      persistTokensFromUrl();
      void refreshUserInfo();
    };

    void initialize();

    return () => {
      isMounted = false;
    };
  }, [refreshUserInfo]);

  useEffect(() => {
    if (!isBrowser) {
      return () => undefined;
    }

    const handleRefresh = () => {
      void refreshUserInfo();
    };

    window.addEventListener('storage', handleRefresh);
    window.addEventListener('focus', handleRefresh);

    return () => {
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
    };
  }, [refreshUserInfo]);

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
