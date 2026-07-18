"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { updateThemeAction } from "@/app/signup/auth";
import { DEFAULT_THEME, type ThemePrefs } from "@/app/contexts/theme.types";

type ThemeContextType = {
  theme: ThemePrefs;
  updateTheme: (patch: Partial<ThemePrefs>) => Promise<void>;
  loading: boolean;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function applyThemeToDOM(theme: ThemePrefs) {
  const root = document.documentElement;
  root.style.setProperty("--app-background", theme.background);
  root.style.setProperty("--app-accent", theme.accent);
  root.style.setProperty("--bubble-user", theme.bubbleUser);
  root.style.setProperty("--bubble-assistant", theme.bubbleAssistant);

  if (theme.mode === "light") {
    root.classList.add("light-mode");
    root.style.setProperty("--app-foreground", "#111318");
  } else {
    root.classList.remove("light-mode");
    root.style.setProperty("--app-foreground", "#ededed");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePrefs>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initTheme = async () => {
      try {
        // Use /api/me instead of server action (client components can't call server actions for reading)
        const res = await fetch('/api/me');
        const data = res.ok ? await res.json() : { user: null };
        const activeTheme = data.user?.theme ?? DEFAULT_THEME;

        if (mounted) {
          setThemeState(activeTheme);
          applyThemeToDOM(activeTheme);
        }
      } catch (err) {
        console.error("Failed to load theme:", err);
        if (mounted) applyThemeToDOM(DEFAULT_THEME);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const updateTheme = async (patch: Partial<ThemePrefs>) => {
    const next = { ...theme, ...patch };
    setThemeState(next);
    applyThemeToDOM(next);

    try {
      const res = await updateThemeAction(next);
      if ("error" in res) {
        console.error("Theme save failed:", res.error);
      }
    } catch (err) {
      console.error("Theme save request failed:", err);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}