"use client";

import { Trophy, Users, Server, Shield, Activity } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Team {
  id: number;
  name: string;
}

interface CS2Server {
  id: number;
  ipString: string;
  port: number;
  displayName?: string;
  inUse: boolean;
}

interface Match {
  id: number;
  status: string;
}

export default function Home() {
  const { data: teams } = useSWR<Team[]>(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/teams`, fetcher);
  const { data: servers } = useSWR<CS2Server[]>(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/servers`, fetcher);
  const { data: matches } = useSWR<Match[]>(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/matches`, fetcher);

  const activeMatches = matches ? matches.filter(m => m.status === "Live" || m.status === "Pending").length : 0;
  const onlineServers = servers ? servers.filter(s => s.inUse).length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-slate-400">Overview of your CS2 servers, matches, and players.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Matches", value: matches === undefined ? "-" : activeMatches.toString(), icon: Activity, color: "text-emerald-500" },
          { label: "Total Servers", value: servers === undefined ? "-" : servers.length.toString(), icon: Server, color: "text-blue-500" },
          { label: "Registered Teams", value: teams === undefined ? "-" : teams.length.toString(), icon: Users, color: "text-indigo-500" },
          { label: "Ongoing Seasons", value: "1", icon: Trophy, color: "text-amber-500" },
        ].map((stat, i) => (
          <div key={i} className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-sm flex items-center gap-4">
            <div className={`p-3 bg-slate-950 rounded-lg ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-sm h-96 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Matches</h2>
          <div className="flex-1 overflow-y-auto">
            {matches === undefined ? (
              <div className="flex-1 h-full flex items-center justify-center border border-dashed border-slate-800 rounded-lg">
                <p className="text-slate-500">Loading matches...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="flex-1 h-full flex items-center justify-center border border-dashed border-slate-800 rounded-lg">
                <p className="text-slate-500">No matches found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.slice(0, 5).map(match => (
                  <div key={match.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">Match #{match.id}</p>
                      <p className="text-slate-400 text-sm">Status: {match.status}</p>
                    </div>
                    <span className="text-indigo-400 text-sm font-medium">View</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-sm h-96 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-4">Server Status</h2>
          <div className="flex-1 overflow-y-auto">
            {servers === undefined ? (
              <div className="flex-1 h-full flex items-center justify-center border border-dashed border-slate-800 rounded-lg">
                <p className="text-slate-500">Loading servers...</p>
              </div>
            ) : servers.length === 0 ? (
              <div className="flex-1 h-full flex items-center justify-center border border-dashed border-slate-800 rounded-lg">
                <p className="text-slate-500">No active servers</p>
              </div>
            ) : (
              <div className="space-y-3">
                {servers.map(server => (
                  <div key={server.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${server.inUse ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                      <p className="text-white text-sm">{server.displayName || `${server.ipString}:${server.port}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
