"use client";

import Link from "next/link";
import { Users, Server, Shield, Trophy, LayoutDashboard, Swords, Map as MapIcon, Globe } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

const navItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "lobbies", href: "/dashboard/lobbies", icon: Swords },
  { key: "maps", href: "/dashboard/maps", icon: MapIcon },
  { key: "matches", href: "/dashboard/matches", icon: Shield },
  { key: "teams", href: "/dashboard/teams", icon: Users },
  { key: "seasons", href: "/dashboard/seasons", icon: Trophy },
  { key: "servers", href: "/dashboard/servers", icon: Server },
];

export default function Sidebar() {
  const { t, locale, setLocale } = useI18n();

  return (
    <aside className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-500" />
          CS2 Admin
        </h1>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={`/${locale}${item.href}`}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Icon className="w-5 h-5 text-slate-400" />
              {t(`sidebar.${item.key}`)}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => setLocale(locale === "pt" ? "en" : "pt")}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors uppercase"
          title={t("sidebar.language")}
        >
          <Globe className="w-4 h-4" />
          {locale}
        </button>
      </div>
    </aside>
  );
}
