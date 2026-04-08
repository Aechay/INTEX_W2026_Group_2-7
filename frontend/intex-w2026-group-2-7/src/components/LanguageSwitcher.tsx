import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type Language,
  isSupportedLanguage,
} from "@/i18n/languages";
import { withPathLanguage } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  containerClassName?: string;
  contentClassName?: string;
  iconClassName?: string;
  triggerClassName?: string;
};

const LanguageSwitcher = ({
  containerClassName,
  contentClassName,
  iconClassName,
  triggerClassName,
}: LanguageSwitcherProps) => {
  const { t, i18n } = useTranslation("common");
  const location = useLocation();
  const navigate = useNavigate();

  const currentLanguage = isSupportedLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LANGUAGE;

  const handleChange = (language: string) => {
    if (!isSupportedLanguage(language)) {
      return;
    }

    navigate(
      `${withPathLanguage(location.pathname, language)}${location.search}${location.hash}`,
      { replace: true },
    );
    void i18n.changeLanguage(language as Language);
  };

  return (
    <div className={cn("flex items-center gap-2", containerClassName)}>
      <Languages className={cn("h-4 w-4 text-muted-foreground", iconClassName)} />
      <Select onValueChange={handleChange} value={currentLanguage}>
        <SelectTrigger
          aria-label={t("language.label")}
          className={cn("h-9 w-[100px] bg-background/80", triggerClassName)}
        >
          <SelectValue placeholder={t("language.label")} />
        </SelectTrigger>
        <SelectContent className={cn("w-[100px] min-w-0", contentClassName)}>
          {SUPPORTED_LANGUAGES.map((language) => (
            <SelectItem key={language} value={language}>
              {t(`language.options.${language}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSwitcher;
