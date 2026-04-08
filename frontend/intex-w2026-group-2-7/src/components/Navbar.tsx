import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "@/assets/logo.png";
import { withPathLanguage } from "@/i18n/routing";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation("common");

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/get-help", label: t("nav.getHelp") },
    { to: "/dashboard", label: t("nav.dashboard") },
  ];
  const localizedPath = (path: string) => withPathLanguage(path, i18n.resolvedLanguage);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname === localizedPath(path);

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to={localizedPath("/")} className="flex items-center gap-2">
          <img
            src={logo}
            alt={t("brand.logoAlt")}
            className="h-[35px] w-auto"
          />
          <span className="text-xl font-bold text-primary">{t("brand.name")}</span>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.to}
              to={localizedPath(link.to)}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(link.to) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher />
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
              to={localizedPath(link.to)}
              onClick={() => setIsOpen(false)}
              className={`block text-sm font-medium py-2 ${
                isActive(link.to) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher triggerClassName="w-full bg-background" />
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
