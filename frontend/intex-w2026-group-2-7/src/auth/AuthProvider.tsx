import { useEffect, useState, type PropsWithChildren } from "react";
import {
  ApiError,
  getCurrentUserRequest,
  loginRequest,
  logoutRequest,
  refreshRequest,
  requestJson,
  resolveApiBaseUrl,
} from "@/auth/auth-api";
import {
  clearStoredRefreshToken,
  loadStoredRefreshToken,
  storeRefreshToken,
} from "@/auth/auth-storage";
import { AuthContext, type AuthContextValue } from "@/auth/auth-context";
import type { AuthSession, AuthTokens, CurrentUser } from "@/auth/auth-types";

const signedOutSession = (): AuthSession => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isBootstrapping: false,
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const apiBaseUrl = resolveApiBaseUrl();
  const [session, setSession] = useState<AuthSession>({
    accessToken: null,
    refreshToken: null,
    user: null,
    isBootstrapping: true,
  });

  const applySession = (tokens: AuthTokens, user: CurrentUser) => {
    storeRefreshToken(tokens.refreshToken);
    setSession({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
      isBootstrapping: false,
    });
  };

  const clearSession = () => {
    clearStoredRefreshToken();
    setSession(signedOutSession());
  };

  useEffect(() => {
    let isCancelled = false;

    const bootstrap = async () => {
      const storedRefreshToken = loadStoredRefreshToken();
      if (!storedRefreshToken) {
        if (!isCancelled) {
          setSession(signedOutSession());
        }
        return;
      }

      try {
        const tokens = await refreshRequest(apiBaseUrl, storedRefreshToken);
        const user = await getCurrentUserRequest(apiBaseUrl, tokens.accessToken);
        if (!isCancelled) {
          applySession(tokens, user);
        }
      } catch {
        clearStoredRefreshToken();
        if (!isCancelled) {
          setSession(signedOutSession());
        }
      }
    };

    void bootstrap();

    return () => {
      isCancelled = true;
    };
  }, [apiBaseUrl]);

  const refreshSession = async (): Promise<AuthTokens> => {
    const refreshToken = session.refreshToken ?? loadStoredRefreshToken();
    if (!refreshToken) {
      clearSession();
      throw new ApiError("Your session has expired. Please sign in again.", 401, null);
    }

    try {
      const tokens = await refreshRequest(apiBaseUrl, refreshToken);
      const user = await getCurrentUserRequest(apiBaseUrl, tokens.accessToken);
      applySession(tokens, user);
      return tokens;
    } catch (error) {
      clearSession();
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    const tokens = await loginRequest(apiBaseUrl, email, password);
    const user = await getCurrentUserRequest(apiBaseUrl, tokens.accessToken);
    applySession(tokens, user);
  };

  const logout = async () => {
    const accessToken = session.accessToken;
    clearSession();

    if (!accessToken) {
      return;
    }

    try {
      await logoutRequest(apiBaseUrl, accessToken);
    } catch {
      // Best effort. The local session is already cleared.
    }
  };

  const authenticatedJson = async <T,>(
    path: string,
    init: Omit<RequestInit, "body"> & { body?: BodyInit | object | null } = {},
  ): Promise<T> => {
    let accessToken = session.accessToken;

    if (!accessToken) {
      accessToken = (await refreshSession()).accessToken;
    }

    try {
      return await requestJson<T>(apiBaseUrl, path, init, accessToken);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const refreshedTokens = await refreshSession();
        return requestJson<T>(apiBaseUrl, path, init, refreshedTokens.accessToken);
      }

      throw error;
    }
  };

  const contextValue: AuthContextValue = {
    apiBaseUrl,
    user: session.user,
    isAuthenticated: !!session.user && !!session.accessToken,
    isAdmin: session.user?.roles.includes("Admin") ?? false,
    isBootstrapping: session.isBootstrapping,
    login,
    logout,
    authenticatedJson,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
