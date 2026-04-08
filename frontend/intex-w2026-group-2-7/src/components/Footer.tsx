import { Link } from "react-router-dom";
import { Heart, Mail, Moon, Phone, Sun, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { withPathLanguage } from "@/i18n/routing";
import { useTheme } from "@/contexts/ThemeProvider";

const Footer = () => {
  const { t, i18n } = useTranslation("common");
  const { isDark, toggleTheme } = useTheme();
  const localizedPath = (path: string) => withPathLanguage(path, i18n.resolvedLanguage);

  return (
    <footer className="bg-muted dark:bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-accent">{t("brand.name")}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("footer.description")}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-accent">
              {t("footer.quickLinks")}
            </h3>
            <div className="space-y-2">
              <Link
                to={localizedPath("/")}
                className="block text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                {t("nav.home")}
              </Link>
              <Link
                to={localizedPath("/get-help")}
                className="block text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                {t("nav.getHelp")}
              </Link>
              <Link
                to={localizedPath("/login")}
                className="block text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                {t("footer.staffLogin")}
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-accent">{t("footer.contact")}</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-secondary" />
                <span>+1 (809) 555-HOPE</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-secondary" />
                <span>info@hopeshelter.org</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-secondary" />
                <span>{t("footer.location")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t("brand.name")}. {t("footer.rights")}
          </p>
          <div className="flex items-center gap-3">
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
                <Heart className="h-4 w-4 mr-1" /> {t("footer.donateNow")}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
