import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "@/auth/auth-api";
import useAuth from "@/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { withPathLanguage } from "@/i18n/routing";

const Login = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.isBootstrapping && auth.isAuthenticated) {
      const target =
        typeof location.state === "object" &&
        location.state !== null &&
        "from" in location.state &&
        typeof location.state.from === "string"
          ? location.state.from
          : "/dashboard";

      navigate(target, { replace: true });
    }
  }, [auth.isAuthenticated, auth.isBootstrapping, location.state, navigate]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await auth.login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Sign in failed. Check your email and password."));
    } finally {
      setIsSubmitting(false);
    }
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(withPathLanguage("/dashboard", i18n.resolvedLanguage));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,1)_0%,_rgba(249,250,251,1)_100%)]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-primary/15 bg-card/85 p-8 shadow-xl backdrop-blur-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <ShieldCheck className="h-4 w-4" />
              Admin and staff access
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground">
              Model operations, nightly scoring, and live prediction demos.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Sign in with a backend account to inspect the latest donor churn and resident risk
              snapshots, then run the social-media regression model in real time through the API.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Nightly batch scoring",
                  value: "Donor churn and resident risk",
                },
                {
                  label: "Live inference",
                  value: "Social media donation estimate",
                },
                {
                  label: "Auth model",
                  value: "ASP.NET Core Identity bearer tokens",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/70 bg-background/90 p-4 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <Card className="border-primary/10 shadow-xl">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl text-foreground">{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    {t("emailLabel")}
                  </label>
                  <Input
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    {t("passwordLabel")}
                  </label>
                  <Input
                    type="password"
                    placeholder={t("passwordPlaceholder")}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                {errorMessage ? (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {errorMessage}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={isSubmitting || auth.isBootstrapping}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Signing in..." : t("submit")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
