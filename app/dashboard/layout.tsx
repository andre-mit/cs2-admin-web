import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { LayoutDashboard, Swords, Activity, Users, Shield } from "lucide-react";

const links = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Lobbies", href: "/dashboard/lobbies", icon: Swords },
  { name: "Matches", href: "/dashboard/matches", icon: Activity },
  { name: "Teams", href: "/dashboard/teams", icon: Users },
  { name: "Maps", href: "/dashboard/maps", icon: Shield },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/");
  }

  const admins = process.env.ADMIN_STEAM_IDS?.split(",").map(id => id.trim()) || [];
  const steamId = session.user?.steamId;

  if (admins.length > 0 && steamId && !admins.includes(steamId)) {
    // If not an admin, we could redirect to a public page. For now, back to root.
    redirect("/");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
