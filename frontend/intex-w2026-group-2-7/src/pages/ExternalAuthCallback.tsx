import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { consumePendingAuthRedirect } from "@/auth/auth-redirect";
import { getErrorMessage } from "@/auth/auth-api";
import useAuth from "@/auth/useAuth";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { withPathLanguage } from "@/i18n/routing";

const attemptedExchangeCodes = new Set<string>();

const ExternalAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const { t, i18n } = useTranslation("login");
  const provider = searchParams.get("provider") ?? t("externalProviderFallback");
  const code = searchParams.get("code");
  const remoteError = searchParams.get("error");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    remoteError ? t("externalCallbackFailed", { provider }) : null,
  );

  useEffect(() => {
    if (!auth.isAuthenticated) {
      return;
    }

    const redirectTo = consumePendingAuthRedirect();
    const fallbackPath = withPathLanguage(
      auth.isAdmin ? "/dashboard" : "/donor-portal",
      i18n.resolvedLanguage,
    );

    navigate(redirectTo ?? fallbackPath, { replace: true });
  }, [auth.isAdmin, auth.isAuthenticated, i18n.resolvedLanguage, navigate]);

  useEffect(() => {
    if (remoteError) {
      return;
    }

    if (!code) {
      setErrorMessage(t("externalCallbackMissingCode"));
      return;
    }

    if (attemptedExchangeCodes.has(code)) {
      return;
    }

    attemptedExchangeCodes.add(code);

    let isCancelled = false;

    const completeSignIn = async () => {
      try {
        const user = await auth.completeExternalLogin(code);
        if (isCancelled) {
          return;
        }

        const redirectTo = consumePendingAuthRedirect();
        const fallbackPath = withPathLanguage(
          user.roles.includes("Admin") ? "/dashboard" : "/donor-portal",
          i18n.resolvedLanguage,
        );

        navigate(redirectTo ?? fallbackPath, { replace: true });
      } catch (error) {
        attemptedExchangeCodes.delete(code);
        consumePendingAuthRedirect();
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error, t("externalCallbackError")));
        }
      }
    };

    void completeSignIn();

    return () => {
      isCancelled = true;
    };
  }, [auth, code, i18n.resolvedLanguage, navigate, remoteError, t]);

  return (
    <AuthPageLayout>
      <Card className="w-full max-w-md border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl text-foreground">
            {errorMessage ? t("externalCallbackErrorTitle") : t("externalCallbackPending")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage ? (
            <>
              <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={() => navigate(withPathLanguage("/login", i18n.resolvedLanguage), { replace: true })}
              >
                {t("backToLoginLink")}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("externalCallbackWorking", { provider })}
            </p>
          )}
        </CardContent>
      </Card>
    </AuthPageLayout>
  );
};

export default ExternalAuthCallback;
