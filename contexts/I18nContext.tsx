"use client";

import React, { createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";

type Dictionary = {
  [key: string]: string | Dictionary;
};

type I18nContextType = {
  locale: string;
  setLocale: (newLocale: string) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ 
  children, 
  locale, 
  dictionary 
}: { 
  children: React.ReactNode;
  locale: string;
  dictionary: Dictionary;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const setLocale = (newLocale: string) => {
    if (!pathname) return;
    const segments = pathname.split('/');
    // segments[0] is "", segments[1] is the current locale "en" or "pt"
    segments[1] = newLocale;
    // Push the new URL and let the server re-render with the new dictionary
    router.push(segments.join('/'));
  };

  const t = (path: string): string => {
    const keys = path.split(".");
    let current: string | Dictionary = dictionary;

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
    return {
      locale: "en",
      setLocale: () => {},
      t: (key: string) => key,
    };
  }
  return context;
}
