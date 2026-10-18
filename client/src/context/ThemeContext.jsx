import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

const STORAGE_KEY = "furniva_theme";
const LEGACY_KEY = "furniva-theme";

const ThemeContext = createContext({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

/**
 * ThemeProvider provides:
 * - User preference: 'light' | 'dark' | 'system'
 * - Real resolved theme: 'light' | 'dark' (auto reacts to OS changes if system)
 * - Persisted preference in localStorage
 * - Seamless integration with design-system.css & Tailwind dark: classes
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
      if (stored === "dark" || stored === "light" || stored === "system") {
        return stored;
      }
    } catch (e) {
      // Fallback if localStorage unavailable
    }
    return "system";
  });

  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Listen to OS prefers-color-scheme changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setSystemDark(e.matches);

    setSystemDark(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Compute the active visual theme
  const resolvedTheme = useMemo(() => {
    if (theme === "system") {
      return systemDark ? "dark" : "light";
    }
    return theme;
  }, [theme, systemDark]);

  // Apply theme to document element and update meta theme-color
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolvedTheme);

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Update meta theme-color for PWA & mobile browser headers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        resolvedTheme === "dark" ? "#151311" : "#8B5E3C"
      );
    }
  }, [resolvedTheme]);

  const setTheme = (newTheme) => {
    if (newTheme !== "light" && newTheme !== "dark" && newTheme !== "system") return;
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
      localStorage.setItem(LEGACY_KEY, newTheme);
    } catch (e) {
      console.warn("Failed to persist theme preference:", e);
    }
  };

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeProvider;
