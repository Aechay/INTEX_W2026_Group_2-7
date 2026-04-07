import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
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

type LanguageSwitcherProps = {
  triggerClassName?: string;
};

const LanguageSwitcher = ({ triggerClassName }: LanguageSwitcherProps) => {
  const { t, i18n } = useTranslation("common");

  const currentLanguage = isSupportedLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LANGUAGE;

  const handleChange = (language: string) => {
    if (!isSupportedLanguage(language)) {
      return;
    }

    void i18n.changeLanguage(language as Language);
  };

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <Select onValueChange={handleChange} value={currentLanguage}>
        <SelectTrigger
          aria-label={t("language.label")}
          className={triggerClassName ?? "h-9 w-[140px] bg-background/80"}
        >
          <SelectValue placeholder={t("language.label")} />
        </SelectTrigger>
        <SelectContent>
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
