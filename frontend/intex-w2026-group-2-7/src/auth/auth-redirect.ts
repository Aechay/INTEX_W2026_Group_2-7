const PENDING_AUTH_REDIRECT_KEY = "pending-auth-redirect";

export const getAuthRedirectFromState = (state: unknown): string | null => {
  if (
    typeof state === "object" &&
    state !== null &&
    "from" in state &&
    typeof (state as { from?: unknown }).from === "string"
  ) {
    return (state as { from: string }).from;
  }

  return null;
};

export const storePendingAuthRedirect = (path: string | null) => {
  if (typeof window === "undefined") {
    return;
  }

  if (path) {
    window.sessionStorage.setItem(PENDING_AUTH_REDIRECT_KEY, path);
    return;
  }

  window.sessionStorage.removeItem(PENDING_AUTH_REDIRECT_KEY);
};

export const consumePendingAuthRedirect = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const path = window.sessionStorage.getItem(PENDING_AUTH_REDIRECT_KEY);
  window.sessionStorage.removeItem(PENDING_AUTH_REDIRECT_KEY);

  return path;
};

/**
 * After sign-in, send admins to the staff dashboard instead of the donor portal
 * (e.g. when `from` was `/donor-portal` from RequireAuth).
 */
export const resolvePostAuthRedirect = (args: {
  pendingPath: string | null;
  isAdmin: boolean;
  localizedDashboard: string;
  localizedDonorPortal: string;
}): string => {
  const { pendingPath, isAdmin, localizedDashboard, localizedDonorPortal } = args;

  if (pendingPath) {
    if (isAdmin && pendingPath.includes("donor-portal")) {
      return localizedDashboard;
    }
    return pendingPath;
  }

  return isAdmin ? localizedDashboard : localizedDonorPortal;
};
