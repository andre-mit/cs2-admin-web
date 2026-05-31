import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CS2 Admin Panel",
  description: "Advanced Server and Match Management for Counter-Strike 2",
};

import { Providers } from "@/components/Providers";
import { I18nProvider } from "@/contexts/I18nContext";
import { getDictionary } from "@/lib/i18n";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
      >
        <Providers>
          <I18nProvider locale={locale} dictionary={dictionary}>
            {children}
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
