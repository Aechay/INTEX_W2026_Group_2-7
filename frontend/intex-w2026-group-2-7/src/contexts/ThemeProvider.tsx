import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme");
    return stored === "light" || stored === "dark" ? stored : "system";
  });

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const effectiveDark =
      theme === "dark" || (theme === "system" && prefersDark);

    if (effectiveDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (theme !== "system") {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  function toggleTheme() {
    setTheme((prev) => {
      const currentlyDark =
        prev === "dark" ||
        (prev === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      return currentlyDark ? "light" : "dark";
    });
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
