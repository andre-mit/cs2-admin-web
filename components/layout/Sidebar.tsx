import Link from "next/link";
import { Users, Server, Shield, Trophy, LayoutDashboard, Swords, Map as MapIcon, Settings } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "PUG Lobbies", href: "/dashboard/lobbies", icon: Swords },
  { name: "Mapas", href: "/dashboard/maps", icon: MapIcon },
  { name: "Matches", href: "/dashboard/matches", icon: Shield },
  { name: "Teams", href: "/dashboard/teams", icon: Users },
  { name: "Seasons", href: "/dashboard/seasons", icon: Trophy },
  { name: "Servers", href: "/dashboard/servers", icon: Server },
];

export default function Sidebar() {
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
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Icon className="w-5 h-5 text-slate-400" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 text-center">
          G5API & G5V Reimagined
        </div>
      </div>
    </aside>
  );
}
