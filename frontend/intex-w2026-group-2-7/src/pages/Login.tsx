import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Heart, LogIn, Shield, UserPlus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage, registerRequest, resolveApiBaseUrl } from '@/auth/auth-api';
import useAuth from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import logo from '@/assets/logo.png';

type LoginTab = 'staff' | 'donor';
type Mode = 'signin' | 'register';

const STAFF_DEMO_EMAIL = 'admin@hopeshelter.org';
const STAFF_DEMO_PASSWORD = 'HopeShelter2026!';
const DONOR_DEMO_EMAIL = 'donor@hopeshelter.org';
const DONOR_DEMO_PASSWORD = 'DonorDemo2026!';

const staffFeatures = [
  { icon: Users, label: 'Resident Management', description: 'Monitor safety scores and resident progress in real time.' },
  { icon: Heart, label: 'Donor Relations', description: 'Track churn risk and keep donors engaged.' },
  { icon: Shield, label: 'Secure & Role-Based', description: 'Admin and staff roles with scoped access controls.' },
];

const donorSignInFeatures = [
  { icon: Heart, label: 'Donation History', description: "View every contribution you've made over time." },
  { icon: Users, label: 'Your Impact', description: 'See how your generosity has helped at-risk girls.' },
  { icon: Shield, label: 'Secure Account', description: 'Your data is protected and private.' },
];

const donorRegisterFeatures = [
  { icon: Heart, label: 'Track Your Giving', description: 'Every donation you make, in one place.' },
  { icon: Users, label: 'See Your Impact', description: 'Understand how your gifts change lives.' },
  { icon: Shield, label: 'Free & Secure', description: 'Creating an account is free and your data stays private.' },
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation('login');
  const auth = useAuth();

  const initialTab = searchParams.get('tab') === 'staff' ? 'staff' : 'donor';
  const [tab, setTab] = useState<LoginTab>(initialTab);
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.isBootstrapping && auth.isAuthenticated) {
      const from =
        typeof location.state === 'object' &&
        location.state !== null &&
        'from' in location.state &&
        typeof location.state.from === 'string'
          ? location.state.from
          : null;

      navigate(from ?? (auth.isAdmin ? '/dashboard' : '/donor-portal'), { replace: true });
    }
  }, [auth.isAuthenticated, auth.isBootstrapping, auth.isAdmin, location.state, navigate]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setShowPassword(false);
    setShowConfirm(false);
  };

  const handleTabChange = (value: string) => {
    setTab(value as LoginTab);
    setMode('signin');
    resetForm();
  };

  const handleModeChange = (next: Mode) => {
    setMode(next);
    resetForm();
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await auth.login(email, password);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Sign in failed. Check your email and password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerRequest(resolveApiBaseUrl(), email, password);
      // Auto-login after successful registration
      await auth.login(email, password);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Registration failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = () => {
    setEmail(tab === 'staff' ? STAFF_DEMO_EMAIL : DONOR_DEMO_EMAIL);
    setPassword(tab === 'staff' ? STAFF_DEMO_PASSWORD : DONOR_DEMO_PASSWORD);
    setErrorMessage(null);
  };

  const isRegister = tab === 'donor' && mode === 'register';

  const features = tab === 'staff'
    ? staffFeatures
    : mode === 'register'
    ? donorRegisterFeatures
    : donorSignInFeatures;

  const panelHeading = tab === 'staff'
    ? 'Empowering staff to protect and serve at-risk girls.'
    : mode === 'register'
    ? 'Join our community of supporters.'
    : 'Thank you for making a difference.';

  const panelSub = tab === 'staff'
    ? 'Manage residents, track donor relationships, and access real-time safety insights — all from one secure dashboard.'
    : mode === 'register'
    ? 'Create a free account to track your donations, see your impact, and stay connected with Hope Shelter.'
    : 'Sign in to view your full donation history, track your impact, and manage your giving to Hope Shelter.';

  const badgeLabel = tab === 'staff' ? 'Staff & Admin Portal' : mode === 'register' ? 'Create Donor Account' : 'Donor Portal';

  return (
    <div className="h-screen overflow-hidden flex flex-col lg:flex-row">
      {/* ── Left brand panel ── */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[hsl(174,72%,28%)] via-[hsl(174,72%,35%)] to-[hsl(200,75%,38%)] p-12 text-white">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-white/5" />
        <div className="absolute -bottom-20 left-1/4 h-72 w-72 rounded-full bg-white/5" />

        <div className="relative z-10 flex items-center gap-3">
          <img src={logo} alt="Hope Shelter logo" className="h-10 w-auto object-contain" />
          <span className="text-xl font-semibold tracking-tight">Hope Shelter</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <Shield className="h-3.5 w-3.5" />
            {badgeLabel}
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">{panelHeading}</h1>
          <p className="max-w-md text-base leading-7 text-white/75">{panelSub}</p>

          <div className="grid gap-4 pt-2">
            {features.map(({ icon: Icon, label, description }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-sm text-white/65">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-white/20 pt-6">
          <p className="text-sm italic text-white/60">
            "Safety &amp; Hope for At-Risk Children in the Dominican Republic"
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-10">
        {/* Mobile logo */}
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <img src={logo} alt="Hope Shelter logo" className="h-10 w-auto object-contain" />
          <span className="text-xl font-semibold text-foreground">Hope Shelter</span>
        </div>

        <div className="w-full max-w-md space-y-4">
          {/* Tab switcher */}
          <Tabs value={tab} onValueChange={handleTabChange}>
            <TabsList className="w-full">
              <TabsTrigger value="donor" className="flex-1">Donor</TabsTrigger>
              <TabsTrigger value="staff" className="flex-1">Staff / Admin</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="border-border/60 shadow-lg">
            <CardHeader className="space-y-1 pb-3">
              <CardTitle className="text-2xl font-bold text-foreground">
                {isRegister ? t('registerTitle') : tab === 'staff' ? t('title') : t('donorTitle')}
              </CardTitle>
              <CardDescription>
                {isRegister ? t('registerDescription') : tab === 'staff' ? t('description') : t('donorDescription')}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Sign in form */}
              {!isRegister && (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{t('emailLabel')}</label>
                    <Input
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{t('passwordLabel')}</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('passwordPlaceholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="rounded-lg border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                      {errorMessage}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting || auth.isBootstrapping}
                    className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {isSubmitting ? t('signingIn') : t('submit')}
                  </Button>
                </form>
              )}

              {/* Register form — donor tab only */}
              {isRegister && (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{t('emailLabel')}</label>
                    <Input
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{t('passwordLabel')}</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('passwordPlaceholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{t('confirmPasswordLabel')}</label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder={t('confirmPasswordPlaceholder')}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="rounded-lg border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                      {errorMessage}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {isSubmitting ? t('registering') : t('registerSubmit')}
                  </Button>
                </form>
              )}

              {/* Demo credentials — sign in only */}
              {!isRegister && (
                <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">Demo Access</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fillDemo}
                      className="h-7 border-primary/30 px-3 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                    >
                      Use demo account
                    </Button>
                  </div>
                  <div className="space-y-1 font-mono text-xs text-muted-foreground">
                    <div className="flex gap-2">
                      <span className="w-16 text-foreground/50">Email</span>
                      <span className="text-foreground">{tab === 'staff' ? STAFF_DEMO_EMAIL : DONOR_DEMO_EMAIL}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-16 text-foreground/50">Password</span>
                      <span className="text-foreground">{tab === 'staff' ? STAFF_DEMO_PASSWORD : DONOR_DEMO_PASSWORD}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sign in / Register toggle — donor tab only */}
              {tab === 'donor' && mode === 'signin' && (
                <>
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 border-t border-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 border-t border-border" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10"
                    onClick={() => handleModeChange('register')}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create an Account
                  </Button>
                </>
              )}

              {tab === 'donor' && mode === 'register' && (
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('signin')}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}

              {tab === 'staff' && (
                <p className="text-center text-xs text-muted-foreground">
                  Need access?{' '}
                  <a href="mailto:info@hopeshelter.org" className="text-primary underline-offset-4 hover:underline">
                    Contact your administrator
                  </a>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
