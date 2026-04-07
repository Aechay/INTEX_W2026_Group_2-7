import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE, isSupportedLanguage } from "./languages";
import { resources } from "./resources";

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: ["en", "es"],
      load: "languageOnly",
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ["localStorage", "navigator", "htmlTag"],
        caches: ["localStorage"],
      },
      react: {
        useSuspense: false,
      },
    });
}

if (typeof document !== "undefined") {
  document.documentElement.lang = isSupportedLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LANGUAGE;

  i18n.on("languageChanged", (language) => {
    document.documentElement.lang = isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;
  });
}

export { i18n };
