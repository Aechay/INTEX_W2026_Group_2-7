export const COOKIE_CONSENT_STORAGE_KEY = "hope-shelter.cookie-consent";

const COOKIE_CONSENT_ACKNOWLEDGED_VALUE = "acknowledged";

export const hasAcknowledgedCookieConsent = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) ===
      COOKIE_CONSENT_ACKNOWLEDGED_VALUE
    );
  } catch {
    return false;
  }
};

export const acknowledgeCookieConsent = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      COOKIE_CONSENT_ACKNOWLEDGED_VALUE,
    );
  } catch {
    // Ignore storage failures and keep the banner visible on reload.
  }
};
