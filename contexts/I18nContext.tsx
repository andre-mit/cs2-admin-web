"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";

type Locale = "pt" | "en";

type Dictionary = {
  [key: string]: string | Dictionary;
};

const dictionaries: Record<Locale, Dictionary> = {
  pt: {
    sidebar: {
      dashboard: "Painel",
      lobbies: "Salas PUG",
      maps: "Mapas",
      matches: "Partidas",
      teams: "Equipes",
      seasons: "Temporadas",
      servers: "Servidores",
      theme_light: "Claro",
      theme_dark: "Escuro",
      theme_system: "Sistema",
      language: "Idioma"
    }
  },
  en: {
    sidebar: {
      dashboard: "Dashboard",
      lobbies: "PUG Lobbies",
      maps: "Maps",
      matches: "Matches",
      teams: "Teams",
      seasons: "Seasons",
      servers: "Servers",
      theme_light: "Light",
      theme_dark: "Dark",
      theme_system: "System",
      language: "Language"
    }
  }
};

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("locale-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("locale-change", callback);
  };
};

const getSnapshot = (): Locale => {
  const saved = localStorage.getItem("app-locale");
  if (saved === "pt" || saved === "en") return saved as Locale;
  return navigator.language.startsWith("pt") ? "pt" : "en";
};

const getServerSnapshot = (): Locale => "en";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem("app-locale", newLocale);
    window.dispatchEvent(new Event("locale-change"));
  };

  const t = (path: string): string => {
    const keys = path.split(".");
    let current: string | Dictionary = dictionaries[locale];

    for (const key of keys) {
      if (typeof current !== "object" || current === null || !(key in current)) {
        return path;
      }
      current = current[key as keyof typeof current];
    }

    if (typeof current === "string") {
      return current;
    }
    return path;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    // Return a dummy context during SSR/hydration to avoid errors
    return {
      locale: "en" as Locale,
      setLocale: () => { },
      t: (key: string) => key,
    };
  }
  return context;
}
