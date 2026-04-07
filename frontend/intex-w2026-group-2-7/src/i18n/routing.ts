import { DEFAULT_LANGUAGE, type Language, isSupportedLanguage } from "./languages";

export const getPathLanguage = (pathname: string): Language | null => {
  const [, maybeLanguage] = pathname.split("/");
  return isSupportedLanguage(maybeLanguage) ? maybeLanguage : null;
};

export const stripPathLanguage = (pathname: string): string => {
  const segments = pathname.split("/");
  if (isSupportedLanguage(segments[1])) {
    const stripped = `/${segments.slice(2).join("/")}`;
    return stripped === "/" ? "/" : stripped.replace(/\/+$/, "") || "/";
  }

  return pathname || "/";
};

export const withPathLanguage = (path: string, language: string | null | undefined): string => {
  const safeLanguage = isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;
  const normalizedPath = stripPathLanguage(path.startsWith("/") ? path : `/${path}`);

  if (normalizedPath === "/") {
    return `/${safeLanguage}`;
  }

  return `/${safeLanguage}${normalizedPath}`;
};
