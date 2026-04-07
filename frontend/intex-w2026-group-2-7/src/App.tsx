import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { DEFAULT_LANGUAGE, isSupportedLanguage } from "@/i18n/languages";
import { getPathLanguage } from "@/i18n/routing";
import Index from "./pages/Index";
import GetHelp from "./pages/GetHelp";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

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
  <ThemeProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageFromUrlSync />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/:lang" element={<Index />} />
          <Route path="/get-help" element={<GetHelp />} />
          <Route path="/:lang/get-help" element={<GetHelp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/:lang/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/:lang/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
