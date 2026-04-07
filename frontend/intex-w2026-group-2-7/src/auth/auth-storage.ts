const REFRESH_TOKEN_KEY = "hope-shelter.refresh-token";

export const loadStoredRefreshToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
};

export const storeRefreshToken = (refreshToken: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearStoredRefreshToken = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
};
