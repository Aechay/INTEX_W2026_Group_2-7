import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTheme } from "@/contexts/ThemeProvider";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation("common");
  const { isDark, toggleTheme } = useTheme();

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/get-help", label: t("nav.getHelp") },
    { to: "/dashboard", label: t("nav.dashboard") },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/HopeShelter.png"
            alt={t("brand.logoAlt")}
            className="h-10 w-10"
          />
          <span className="text-xl font-bold text-primary">{t("brand.name")}</span>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(link.to) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher />
          <button
            onClick={toggleTheme}
            aria-label={isDark ? t("nav.lightMode") : t("nav.darkMode")}
            title={isDark ? t("nav.lightMode") : t("nav.darkMode")}
            className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background/80 text-muted-foreground transition-all hover:border-2 hover:border-input"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Button
            asChild
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          >
            <a
              href="https://donate.hopeshelter.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("nav.donate")}
            </a>
          </Button>
        </div>

        <button
          aria-label={isOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          className="md:hidden p-2"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t bg-card px-4 py-4 space-y-3">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={`block text-sm font-medium py-2 ${
                isActive(link.to) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher triggerClassName="w-full bg-background" />
          <button
            onClick={toggleTheme}
            aria-label={isDark ? t("nav.lightMode") : t("nav.darkMode")}
            className="w-full h-9 flex items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-all hover:border-2"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? t("nav.lightMode") : t("nav.darkMode")}
          </button>
          <Button
            asChild
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          >
            <a
              href="https://donate.hopeshelter.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("nav.donate")}
            </a>
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
