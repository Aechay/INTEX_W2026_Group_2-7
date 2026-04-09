import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  getAuthRedirectFromState,
  resolvePostAuthRedirect,
  storePendingAuthRedirect,
} from "@/auth/auth-redirect";
import {
  ApiError,
  forgotPasswordRequest,
  getErrorMessage,
  getExternalAuthProvidersRequest,
  registerRequest,
  resetPasswordRequest,
  type ExternalAuthProvider,
} from "@/auth/auth-api";
import useAuth from "@/auth/useAuth";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { withPathLanguage } from "@/i18n/routing";

type Mode = "signin" | "register" | "forgot-password" | "reset-password";
type SignInStep = "credentials" | "mfa";

type PasswordFieldProps = {
  autoComplete: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  showPassword: boolean;
  togglePassword: () => void;
  value: string;
};

const PasswordField = ({
  autoComplete,
  label,
  onChange,
  placeholder,
  showPassword,
  togglePassword,
  value,
}: PasswordFieldProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          className="h-11 pr-11"
        />
        <button
          type="button"
          onClick={togglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

const resolveMode = (value: string | null): Mode => {
  if (
    value === "register" ||
    value === "forgot-password" ||
    value === "reset-password"
  ) {
    return value;
  }

  return "signin";
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation("login");
  const auth = useAuth();
  const mode = resolveMode(searchParams.get("mode"));

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signInStep, setSignInStep] = useState<SignInStep>("credentials");
  const [mfaCode, setMfaCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [externalProviders, setExternalProviders] = useState<ExternalAuthProvider[]>([]);

  useEffect(() => {
    if (isSubmitting) {
      return;
    }

    if (!auth.isBootstrapping && auth.isAuthenticated) {
      const pendingPath = getAuthRedirectFromState(location.state);
      const target = resolvePostAuthRedirect({
        pendingPath,
        isAdmin: auth.isAdmin,
        localizedDashboard: withPathLanguage("/dashboard", i18n.resolvedLanguage),
        localizedDonorPortal: withPathLanguage("/donor-portal", i18n.resolvedLanguage),
      });

      navigate(target, { replace: true });
    }
  }, [
    auth.isAdmin,
    auth.isAuthenticated,
    auth.isBootstrapping,
    isSubmitting,
    i18n.resolvedLanguage,
    location.state,
    navigate,
  ]);

  useEffect(() => {
    let isCancelled = false;

    const loadExternalProviders = async () => {
      try {
        const providers = await getExternalAuthProvidersRequest(auth.apiBaseUrl);
        if (!isCancelled) {
          setExternalProviders(providers);
        }
      } catch {
        if (!isCancelled) {
          setExternalProviders([]);
        }
      }
    };

    void loadExternalProviders();

    return () => {
      isCancelled = true;
    };
  }, [auth.apiBaseUrl]);

  const changeMode = (nextMode: Mode, preserveSuccessMessage = false) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (nextMode === "signin") {
      nextSearchParams.delete("mode");
    } else {
      nextSearchParams.set("mode", nextMode);
    }

    setSearchParams(nextSearchParams, { replace: true });
    setErrorMessage(null);

    if (!preserveSuccessMessage) {
      setSuccessMessage(null);
    }

    setName("");
    setPassword("");
    setMfaCode("");
    setConfirmPassword("");
    setResetCode("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSignInStep("credentials");
  };

  const getAuthFailureDetail = (error: unknown): string | null => {
    if (!(error instanceof ApiError) || error.status !== 401) {
      return null;
    }

    if (typeof error.details === "object" && error.details !== null && "detail" in error.details) {
      const detail = (error.details as { detail?: unknown }).detail;
      if (typeof detail === "string") {
        return detail;
      }
    }

    if (typeof error.details === "string") {
      try {
        const parsed = JSON.parse(error.details) as { detail?: unknown };
        if (typeof parsed.detail === "string") {
          return parsed.detail;
        }
      } catch {
        // Ignore parse failure and fall through.
      }
    }

    return null;
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await auth.login(username, password);
    } catch (error) {
      const authFailureDetail = getAuthFailureDetail(error);
      if (authFailureDetail === "RequiresTwoFactor") {
        setSignInStep("mfa");
        setErrorMessage(null);
      } else if (authFailureDetail === "Failed") {
        setErrorMessage(t("invalidCredentials"));
      } else {
        setErrorMessage(getErrorMessage(error, t("loginFailed")));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfaLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await auth.login(username, password, mfaCode);
    } catch (error) {
      const authFailureDetail = getAuthFailureDetail(error);
      if (authFailureDetail === "Failed") {
        setErrorMessage(t("mfaInvalidCode"));
      } else {
        setErrorMessage(getErrorMessage(error, t("loginFailed")));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage(t("nameRequired"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t("passwordMismatch"));
      return;
    }

    setIsSubmitting(true);

    try {
      await registerRequest(auth.apiBaseUrl, username, password);
      await auth.login(username, password);
      await auth.updateDisplayName(name);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("registerFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await forgotPasswordRequest(auth.apiBaseUrl, username);
      changeMode("reset-password", true);
      setSuccessMessage(t("passwordResetCodeSent"));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("forgotPasswordFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (resetCode.trim().length !== 8) {
      setErrorMessage(t("resetCodeInvalidLength"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t("passwordMismatch"));
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPasswordRequest(auth.apiBaseUrl, username, resetCode.trim(), password);
      changeMode("signin", true);
      setSuccessMessage(t("passwordResetSuccess"));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("resetPasswordFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExternalProviderClick = (provider: ExternalAuthProvider) => {
    setErrorMessage(null);
    storePendingAuthRedirect(getAuthRedirectFromState(location.state));
    window.location.assign(provider.startUrl);
  };

  const titleByMode: Record<Mode, string> = {
    signin: t("title"),
    register: t("registerTitle"),
    "forgot-password": t("forgotPasswordTitle"),
    "reset-password": t("resetPasswordTitle"),
  };

  return (
    <AuthPageLayout>
      <Card className="w-full max-w-md border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl text-foreground">{titleByMode[mode]}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {successMessage ? (
            <div className="rounded-md border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-foreground">
              {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          {mode === "signin" ? (
            <>
              {signInStep === "credentials" ? (
                <>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">{t("usernameLabel")}</label>
                      <Input
                        type="email"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        autoComplete="username"
                        placeholder={t("usernamePlaceholder")}
                        required
                        className="h-11"
                      />
                    </div>

                    <PasswordField
                      autoComplete="current-password"
                      label={t("passwordLabel")}
                      onChange={setPassword}
                      placeholder={t("passwordPlaceholder")}
                      showPassword={showPassword}
                      togglePassword={() => setShowPassword((currentValue) => !currentValue)}
                      value={password}
                    />

                    <Button type="submit" className="w-full" disabled={isSubmitting || auth.isBootstrapping}>
                      {isSubmitting ? t("signingIn") : t("submit")}
                    </Button>
                  </form>

                  {externalProviders.length > 0 ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {t("externalSignInLabel")}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>

                      <div className="space-y-2">
                        {externalProviders.map((provider) => (
                          <Button
                            key={provider.name}
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => handleExternalProviderClick(provider)}
                          >
                            {t("signInWithProvider", { provider: provider.displayName })}
                          </Button>
                        ))}
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <form onSubmit={handleMfaLogin} className="space-y-4">
                    <div className="rounded-md border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-foreground">
                      {t("mfaPrompt")}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">{t("mfaCodeLabel")}</label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={mfaCode}
                        onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder={t("mfaCodePlaceholder")}
                        required
                        className="h-11"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting || auth.isBootstrapping}>
                      {isSubmitting ? t("mfaSubmitting") : t("mfaSubmit")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSignInStep("credentials");
                        setMfaCode("");
                        setErrorMessage(null);
                      }}
                    >
                      {t("mfaBack")}
                    </Button>
                  </form>
                </>
              )}

              <div className="flex items-center justify-between gap-3 text-sm">
                <Button type="button" variant="link" className="h-auto px-0" onClick={() => changeMode("register")}>
                  {t("createAccountLink")}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0"
                  onClick={() => changeMode("forgot-password")}
                >
                  {t("forgotPasswordLink")}
                </Button>
              </div>
            </>
          ) : null}

          {mode === "register" ? (
            <>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("nameLabel")}</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    placeholder={t("namePlaceholder")}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("usernameLabel")}</label>
                  <Input
                    type="email"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="email"
                    placeholder={t("usernamePlaceholder")}
                    required
                    className="h-11"
                  />
                </div>

                <PasswordField
                  autoComplete="new-password"
                  label={t("passwordLabel")}
                  onChange={setPassword}
                  placeholder={t("passwordPlaceholder")}
                  showPassword={showPassword}
                  togglePassword={() => setShowPassword((currentValue) => !currentValue)}
                  value={password}
                />

                <PasswordField
                  autoComplete="new-password"
                  label={t("confirmPasswordLabel")}
                  onChange={setConfirmPassword}
                  placeholder={t("confirmPasswordPlaceholder")}
                  showPassword={showConfirmPassword}
                  togglePassword={() => setShowConfirmPassword((currentValue) => !currentValue)}
                  value={confirmPassword}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("registering") : t("registerSubmit")}
                </Button>
              </form>

              <Button type="button" variant="link" className="h-auto px-0" onClick={() => changeMode("signin")}>
                {t("backToLoginLink")}
              </Button>
            </>
          ) : null}

          {mode === "forgot-password" ? (
            <>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("usernameLabel")}</label>
                  <Input
                    type="email"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="email"
                    placeholder={t("usernamePlaceholder")}
                    required
                    className="h-11"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("sendingResetCode") : t("forgotPasswordSubmit")}
                </Button>
              </form>

              <Button type="button" variant="link" className="h-auto px-0" onClick={() => changeMode("signin")}>
                {t("backToLoginLink")}
              </Button>
            </>
          ) : null}

          {mode === "reset-password" ? (
            <>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("usernameLabel")}</label>
                  <Input
                    type="email"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="email"
                    placeholder={t("usernamePlaceholder")}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("resetCodeLabel")}</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={resetCode}
                    onChange={(event) => setResetCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
                    autoComplete="one-time-code"
                    placeholder={t("resetCodePlaceholder")}
                    required
                    className="h-11"
                  />
                </div>

                <PasswordField
                  autoComplete="new-password"
                  label={t("newPasswordLabel")}
                  onChange={setPassword}
                  placeholder={t("passwordPlaceholder")}
                  showPassword={showPassword}
                  togglePassword={() => setShowPassword((currentValue) => !currentValue)}
                  value={password}
                />

                <PasswordField
                  autoComplete="new-password"
                  label={t("confirmPasswordLabel")}
                  onChange={setConfirmPassword}
                  placeholder={t("confirmPasswordPlaceholder")}
                  showPassword={showConfirmPassword}
                  togglePassword={() => setShowConfirmPassword((currentValue) => !currentValue)}
                  value={confirmPassword}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("resettingPassword") : t("resetPasswordSubmit")}
                </Button>
              </form>

              <Button type="button" variant="link" className="h-auto px-0" onClick={() => changeMode("signin")}>
                {t("backToLoginLink")}
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </AuthPageLayout>
  );
};

export default Login;
