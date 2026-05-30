"use client";

import { Server, Plus, X, Wifi, WifiOff, Loader2 } from "lucide-react";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CS2Server {
  id: number;
  ipString: string;
  port: number;
  rconPassword?: string;
  displayName?: string;
  inUse: boolean;
}

interface ServerStatus {
  loading: boolean;
  online: boolean | null;
}

export default function ServersPage() {
  const { data: servers, error, isLoading, mutate } = useSWR<CS2Server[]>(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/servers`, fetcher);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ displayName: "", ipString: "", port: 27015, rconPassword: "" });
  const [statusMap, setStatusMap] = useState<Record<number, ServerStatus>>({});

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ipString.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/servers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, inUse: false })
      });

      if (res.ok) {
        setFormData({ displayName: "", ipString: "", port: 27015, rconPassword: "" });
        setIsModalOpen(false);
        mutate();
      }
    } catch (err) {
      console.error("Failed to create server:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const testRcon = async (serverId: number) => {
    setStatusMap(prev => ({ ...prev, [serverId]: { loading: true, online: null } }));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/servers/${serverId}/status`);
      const data = await res.json() as { online: boolean };
      setStatusMap(prev => ({ ...prev, [serverId]: { loading: false, online: data.online } }));
    } catch {
      setStatusMap(prev => ({ ...prev, [serverId]: { loading: false, online: false } }));
    }
  };

  const getStatusIndicator = (serverId: number) => {
    const status = statusMap[serverId];
    if (!status) return null;
    if (status.loading) return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
    if (status.online === true) return <Wifi className="w-4 h-4 text-green-400" />;
    if (status.online === false) return <WifiOff className="w-4 h-4 text-red-400" />;
    return null;
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Server className="w-8 h-8 text-blue-500" />
            Servers
          </h1>
          <p className="text-slate-400 mt-1">Manage CS2 instances and RCON credentials.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Server
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-screen">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add New Server</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateServer}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Public Scrim #1"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">IP Address</label>
                    <input
                      type="text"
                      required
                      value={formData.ipString}
                      onChange={(e) => setFormData({ ...formData, ipString: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="127.0.0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Port</label>
                    <input
                      type="number"
                      required
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">RCON Password</label>
                  <input
                    type="password"
                    value={formData.rconPassword}
                    onChange={(e) => setFormData({ ...formData, rconPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Server"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading && <div className="text-slate-400">Loading servers...</div>}
      {error && <div className="text-red-500">Error fetching servers</div>}
      {servers && servers.length === 0 && (
        <div className="p-12 border border-dashed border-slate-800 rounded-xl text-center">
          <p className="text-slate-500">No servers configured yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {servers?.map((server) => (
          <div key={server.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-800 flex justify-between items-start">
              <div className="flex items-center gap-2">
                {getStatusIndicator(server.id)}
                <div>
                  <h3 className="font-semibold text-white text-lg">{server.displayName || "CS2 Server"}</h3>
                  <p className="text-slate-400 text-sm mt-0.5">{server.ipString}:{server.port}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${server.inUse ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'}`}>
                {server.inUse ? "In Match" : "Available"}
              </span>
            </div>
            <div className="p-4 bg-slate-950/50 flex-1">
              {statusMap[server.id]?.online === true && (
                <p className="text-sm text-green-400 font-medium">RCON connection successful.</p>
              )}
              {statusMap[server.id]?.online === false && (
                <p className="text-sm text-red-400 font-medium">RCON connection failed.</p>
              )}
              {statusMap[server.id]?.online == null && (
                <p className="text-sm text-slate-500">Ready to receive commands.</p>
              )}
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
              <button className="text-sm text-slate-400 hover:text-white transition-colors">Edit</button>
              <button
                onClick={() => testRcon(server.id)}
                disabled={statusMap[server.id]?.loading}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
              >
                {statusMap[server.id]?.loading ? "Testing..." : "Test RCON"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
