"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

export default function Navbar() {
  const { t, locale } = useI18n();
  return (
    <header className="h-16 w-full bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
      <div className="flex-1"></div>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
          className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t("navbar.logout")}
        </button>
      </div>
    </header>
  );
}
