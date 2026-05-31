"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/contexts/I18nContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <I18nProvider>
        <SessionProvider>
          {children}
        </SessionProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
