import { useEffect, useMemo, useState } from "react";
import { Copy, ShieldCheck, ShieldOff } from "lucide-react";
import QRCode from "react-qr-code";
import { useTranslation } from "react-i18next";
import {
  getErrorMessage,
  type SecurityAccount,
  type TotpSetup,
} from "@/auth/auth-api";
import useAuth from "@/auth/useAuth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Security = () => {
  const auth = useAuth();
  const { t } = useTranslation("security");

  const [account, setAccount] = useState<SecurityAccount | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [totpSetup, setTotpSetup] = useState<TotpSetup | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpQrUrl, setTotpQrUrl] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaSuccess, setMfaSuccess] = useState<string | null>(null);
  const [isLoadingSetup, setIsLoadingSetup] = useState(false);
  const [isEnablingMfa, setIsEnablingMfa] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [isDisablingMfa, setIsDisablingMfa] = useState(false);

  const hasPassword = account?.hasPassword ?? false;

  const clearMfaState = () => {
    setTotpSetup(null);
    setTotpCode("");
    setTotpQrUrl(null);
    setShowSecret(false);
  };

  const loadAccount = async () => {
    setIsLoadingAccount(true);
    setAccountError(null);
    try {
      const response = await auth.authenticatedJson<SecurityAccount>("/auth/security/account");
      setAccount(response);
    } catch (error) {
      setAccountError(getErrorMessage(error, t("errors.accountLoadFailed")));
    } finally {
      setIsLoadingAccount(false);
    }
  };

  useEffect(() => {
    void loadAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maskedSecret = useMemo(() => {
    if (!totpSetup) {
      return "";
    }
    const key = totpSetup.secretKey;
    const visiblePrefix = key.slice(0, 4);
    const visibleSuffix = key.slice(-4);
    return `${visiblePrefix}${"*".repeat(Math.max(0, key.length - 8))}${visibleSuffix}`;
  }, [totpSetup]);

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError(t("errors.passwordMismatch"));
      return;
    }

    if (newPassword.trim().length === 0) {
      setPasswordError(t("errors.newPasswordRequired"));
      return;
    }

    setIsSavingPassword(true);
    try {
      const payload: { newPassword: string; currentPassword?: string } = {
        newPassword,
      };
      if (hasPassword) {
        payload.currentPassword = currentPassword;
      }

      const response = await auth.authenticatedJson<SecurityAccount>("/auth/security/password", {
        method: "POST",
        body: payload,
      });
      setAccount(response);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(hasPassword ? t("password.updated") : t("password.created"));
    } catch (error) {
      setPasswordError(getErrorMessage(error, t("errors.passwordUpdateFailed")));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleStartMfaSetup = async () => {
    setMfaError(null);
    setMfaSuccess(null);
    setIsLoadingSetup(true);
    try {
      const setup = await auth.authenticatedJson<TotpSetup>("/auth/security/mfa/setup");
      setTotpSetup(setup);
      setTotpQrUrl(setup.otpAuthUri);
    } catch (error) {
      setMfaError(getErrorMessage(error, t("errors.mfaSetupFailed")));
    } finally {
      setIsLoadingSetup(false);
    }
  };

  const handleEnableMfa = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMfaError(null);
    setMfaSuccess(null);
    setIsEnablingMfa(true);
    try {
      const response = await auth.authenticatedJson<SecurityAccount>("/auth/security/mfa/enable", {
        method: "POST",
        body: { code: totpCode },
      });
      setAccount(response);
      clearMfaState();
      setMfaSuccess(t("mfa.enabled"));
    } catch (error) {
      setMfaError(getErrorMessage(error, t("errors.mfaEnableFailed")));
    } finally {
      setIsEnablingMfa(false);
    }
  };

  const handleDisableMfa = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMfaError(null);
    setMfaSuccess(null);
    setIsDisablingMfa(true);
    try {
      const response = await auth.authenticatedJson<SecurityAccount>("/auth/security/mfa/disable", {
        method: "POST",
        body: { password: disablePassword },
      });
      setAccount(response);
      setDisablePassword("");
      clearMfaState();
      setMfaSuccess(t("mfa.disabled"));
    } catch (error) {
      setMfaError(getErrorMessage(error, t("errors.mfaDisableFailed")));
    } finally {
      setIsDisablingMfa(false);
    }
  };

  const handleCopySecret = async () => {
    if (!totpSetup) {
      return;
    }

    try {
      await navigator.clipboard.writeText(totpSetup.secretKey);
      setMfaSuccess(t("mfa.secretCopied"));
      setMfaError(null);
    } catch {
      setMfaError(t("errors.copySecretFailed"));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-3xl px-4 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("description")}</p>
        </div>

        {isLoadingAccount ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : accountError ? (
          <p className="text-sm text-destructive">{accountError}</p>
        ) : account ? (
          <>
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>{t("email.title")}</CardTitle>
                <CardDescription>{t("email.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Label htmlFor="account-email">{t("email.label")}</Label>
                <Input id="account-email" value={account.email} readOnly className="mt-2" />
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>{hasPassword ? t("password.changeTitle") : t("password.setTitle")}</CardTitle>
                <CardDescription>
                  {hasPassword ? t("password.changeDescription") : t("password.setDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                  {hasPassword ? (
                    <div>
                      <Label htmlFor="current-password">{t("password.currentPassword")}</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        className="mt-2"
                        autoComplete="current-password"
                      />
                    </div>
                  ) : null}
                  <div>
                    <Label htmlFor="new-password">{t("password.newPassword")}</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="mt-2"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">{t("password.confirmPassword")}</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="mt-2"
                      autoComplete="new-password"
                    />
                  </div>

                  {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
                  {passwordSuccess ? <p className="text-sm text-green-700">{passwordSuccess}</p> : null}

                  <Button type="submit" disabled={isSavingPassword}>
                    {isSavingPassword
                      ? t("password.saving")
                      : hasPassword
                        ? t("password.changeAction")
                        : t("password.setAction")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>{t("mfa.title")}</CardTitle>
                <CardDescription>{t("mfa.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {account.isTotpEnabled ? (
                    <>
                      <ShieldCheck className="h-4 w-4 text-green-700" />
                      <span>{t("mfa.enabledState")}</span>
                    </>
                  ) : (
                    <>
                      <ShieldOff className="h-4 w-4" />
                      <span>{t("mfa.disabledState")}</span>
                    </>
                  )}
                </div>

                {mfaError ? <p className="text-sm text-destructive">{mfaError}</p> : null}
                {mfaSuccess ? <p className="text-sm text-green-700">{mfaSuccess}</p> : null}

                {!account.isTotpEnabled ? (
                  <>
                    {!totpSetup ? (
                      <Button type="button" onClick={handleStartMfaSetup} disabled={isLoadingSetup}>
                        {isLoadingSetup ? t("mfa.loadingSetup") : t("mfa.startEnable")}
                      </Button>
                    ) : (
                      <form className="space-y-4" onSubmit={handleEnableMfa}>
                        <div className="rounded-md border border-border/60 p-4">
                          <p className="text-sm font-medium text-foreground">{t("mfa.scanQr")}</p>
                          {totpQrUrl ? (
                            <div className="mt-3 h-[220px] w-[220px] rounded border border-border/60 flex items-center justify-center">
                              <QRCode value={totpQrUrl} size={200} />
                            </div>
                          ) : null}
                        </div>

                        <div className="rounded-md border border-border/60 p-4 space-y-3">
                          <p className="text-sm font-medium text-foreground">{t("mfa.cantScan")}</p>
                          <div className="flex items-center gap-2">
                            <Input
                              value={showSecret ? totpSetup.secretKey : maskedSecret}
                              readOnly
                              className="font-mono"
                            />
                            <Button type="button" variant="outline" onClick={handleCopySecret}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSecret((current) => !current)}
                          >
                            {showSecret ? t("mfa.hideSecret") : t("mfa.showSecret")}
                          </Button>
                        </div>

                        <div>
                          <Label htmlFor="totp-code">{t("mfa.verifyCodeLabel")}</Label>
                          <Input
                            id="totp-code"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="123456"
                            value={totpCode}
                            onChange={(event) => setTotpCode(event.target.value)}
                            className="mt-2"
                          />
                          <p className="mt-2 text-xs text-muted-foreground">{t("mfa.verifyCodeHint")}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button type="submit" disabled={isEnablingMfa}>
                            {isEnablingMfa ? t("mfa.enabling") : t("mfa.finishEnable")}
                          </Button>
                          <Button type="button" variant="outline" onClick={clearMfaState}>
                            {t("mfa.cancel")}
                          </Button>
                        </div>
                      </form>
                    )}
                  </>
                ) : (
                  <form className="space-y-4" onSubmit={handleDisableMfa}>
                    <div>
                      <Label htmlFor="disable-mfa-password">{t("mfa.disablePasswordLabel")}</Label>
                      <Input
                        id="disable-mfa-password"
                        type="password"
                        value={disablePassword}
                        onChange={(event) => setDisablePassword(event.target.value)}
                        className="mt-2"
                        autoComplete="current-password"
                      />
                    </div>
                    <Button type="submit" variant="destructive" disabled={isDisablingMfa}>
                      {isDisablingMfa ? t("mfa.disabling") : t("mfa.disableAction")}
                    </Button>
                    <p className="text-xs text-muted-foreground">{t("mfa.disableHint")}</p>
                  </form>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
};

export default Security;
