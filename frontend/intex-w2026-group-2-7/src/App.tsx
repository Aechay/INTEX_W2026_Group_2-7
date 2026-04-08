import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth/AuthProvider';
import RequireAdmin from '@/auth/RequireAdmin';
import RequireAuth from '@/auth/RequireAuth';
import RedirectAdminFromDonorPortal from '@/auth/RedirectAdminFromDonorPortal';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { DEFAULT_LANGUAGE, isSupportedLanguage } from '@/i18n/languages';
import { getPathLanguage } from '@/i18n/routing';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import Index from './pages/Index';
import GetHelp from './pages/GetHelp';
import Dashboard from './pages/Dashboard';
import Caseload from './pages/Caseload';
import ProcessRecording from './pages/ProcessRecording';
import HomeVisitation from './pages/HomeVisitation';
import Reports from './pages/Reports';
import DonorPortal from './pages/DonorPortal';
import Impact from './pages/Impact';
import Donate from './pages/Donate';
import Login from './pages/Login';
import ExternalAuthCallback from './pages/ExternalAuthCallback';
import NotFound from './pages/NotFound';
import Resources from './pages/Resources';
import PrivacyPolicy from './pages/PrivacyPolicy';

const queryClient = new QueryClient();

const LanguageFromUrlSync = () => {
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const pathLanguage = getPathLanguage(location.pathname);

    if (pathLanguage && i18n.resolvedLanguage !== pathLanguage) {
      void i18n.changeLanguage(pathLanguage);
      return;
    }

    if (!pathLanguage && !isSupportedLanguage(i18n.resolvedLanguage)) {
      void i18n.changeLanguage(DEFAULT_LANGUAGE);
    }
  }, [i18n, location.pathname]);

  return null;
};

const App = () => (
  <AuthProvider>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <LanguageFromUrlSync />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/:lang" element={<Index />} />
              <Route path="/get-help" element={<GetHelp />} />
              <Route path="/:lang/get-help" element={<GetHelp />} />
              <Route path="/impact" element={<Impact />} />
              <Route path="/:lang/impact" element={<Impact />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/:lang/resources" element={<Resources />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/:lang/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/:lang/donate" element={<Donate />} />
              <Route path="/login" element={<Login />} />
              <Route path="/:lang/login" element={<Login />} />
              <Route path="/external-auth/callback" element={<ExternalAuthCallback />} />
              <Route path="/:lang/external-auth/callback" element={<ExternalAuthCallback />} />

              {/* Protected: donors only (admins use /dashboard) */}
              <Route element={<RequireAuth />}>
                <Route element={<RedirectAdminFromDonorPortal />}>
                  <Route path="/donor-portal" element={<DonorPortal />} />
                  <Route path="/:lang/donor-portal" element={<DonorPortal />} />
                </Route>
              </Route>

              {/* Protected: Admin only */}
              <Route element={<RequireAdmin />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/:lang/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/caseload" element={<Caseload />} />
                <Route path="/:lang/dashboard/caseload" element={<Caseload />} />
                <Route path="/dashboard/process-recordings" element={<ProcessRecording />} />
                <Route path="/:lang/dashboard/process-recordings" element={<ProcessRecording />} />
                <Route path="/dashboard/home-visitations" element={<HomeVisitation />} />
                <Route path="/:lang/dashboard/home-visitations" element={<HomeVisitation />} />
                <Route path="/dashboard/reports" element={<Reports />} />
                <Route path="/:lang/dashboard/reports" element={<Reports />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsentBanner />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </AuthProvider>
);

export default App;
