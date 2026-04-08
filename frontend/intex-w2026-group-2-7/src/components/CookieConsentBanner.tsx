import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  acknowledgeCookieConsent,
  hasAcknowledgedCookieConsent,
} from "@/lib/cookie-consent";
import { getPathLanguage, withPathLanguage } from "@/i18n/routing";

const CookieConsentBanner = () => {
  const location = useLocation();
  const { t } = useTranslation("common");
  const [isAcknowledged, setIsAcknowledged] = useState(() => hasAcknowledgedCookieConsent());

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === COOKIE_CONSENT_STORAGE_KEY) {
        setIsAcknowledged(hasAcknowledgedCookieConsent());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  if (isAcknowledged) {
    return null;
  }

  const pathLanguage = getPathLanguage(location.pathname);
  const privacyPolicyPath = pathLanguage
    ? withPathLanguage("/privacy-policy", pathLanguage)
    : "/privacy-policy";

  const handleAcknowledge = () => {
    acknowledgeCookieConsent();
    setIsAcknowledged(true);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6">
      <section
        aria-describedby="cookie-consent-description"
        aria-labelledby="cookie-consent-title"
        className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur"
        role="dialog"
      >
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:p-6">
          <div className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-[0.24em] text-accent"
              id="cookie-consent-title"
            >
              {t("cookieConsent.title")}
            </p>
            <p className="text-sm leading-6 text-card-foreground" id="cookie-consent-description">
              <Trans
                components={{
                  privacyLink: (
                    <Link
                      className="font-semibold text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                      to={privacyPolicyPath}
                    />
                  ),
                }}
                i18nKey="cookieConsent.description"
                ns="common"
              />
            </p>
          </div>

          <Button className="w-full shrink-0 sm:w-auto" onClick={handleAcknowledge} type="button">
            {t("cookieConsent.acknowledge")}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default CookieConsentBanner;
