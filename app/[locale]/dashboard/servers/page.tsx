"use client";

import { Server, Plus, X, Wifi, WifiOff, Loader2, Play, Square, RotateCcw, Trash2, Copy, Zap, Monitor } from "lucide-react";
import useSWR from "swr";
import { useState } from "react";
import { serversService, CS2Server, DynamicServerResult, PluginSelectionItem } from "@/services/serversService";
import { pluginsService, GamePlugin } from "@/services/pluginsService";
import { useEffect } from "react";
import { swrFetcher } from "@/services/apiClient";
import { useI18n } from "@/contexts/I18nContext";
import { ConfirmModal } from "@/components/ConfirmModal";

interface ServerStatus {
  loading: boolean;
  online: boolean | null;
}

export default function ServersPage() {
  const { t } = useI18n();
  const { data: servers, error, isLoading, mutate } = useSWR<CS2Server[]>("/api/v1/servers", swrFetcher);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDynamicModalOpen, setIsDynamicModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ displayName: "", ipString: "", port: 27015, rconPassword: "" });
  const [dynamicFormData, setDynamicFormData] = useState<{
    name: string;
    password?: string;
    rconPassword?: string;
    maxPlayers: number;
    pluginSelections: PluginSelectionItem[];
  }>({ name: "CS2 Server", password: "", rconPassword: "", maxPlayers: 10, pluginSelections: [] });
  const [availablePlugins, setAvailablePlugins] = useState<GamePlugin[]>([]);
  const [editingPluginConfig, setEditingPluginConfig] = useState<number | null>(null);
  const [statusMap, setStatusMap] = useState<Record<number, ServerStatus>>({});
  const [actionLoading, setActionLoading] = useState<Record<number, string>>({});
  const [lastCreated, setLastCreated] = useState<DynamicServerResult | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (isDynamicModalOpen) {
      pluginsService.getAllPlugins().then(setAvailablePlugins).catch(console.error);
    }
  }, [isDynamicModalOpen]);

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ipString.trim()) return;

    setIsSubmitting(true);
    try {
      await serversService.create({ ...formData, inUse: false } as Partial<CS2Server>);
      setFormData({ displayName: "", ipString: "", port: 27015, rconPassword: "" });
      setIsModalOpen(false);
      mutate();
    } catch (err) {
      console.error("Failed to create server:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDynamic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await serversService.createDynamic(dynamicFormData);
      setLastCreated(result);
      setDynamicFormData({ name: "CS2 Server", password: "", rconPassword: "", maxPlayers: 10, pluginSelections: [] });
      setIsDynamicModalOpen(false);
      mutate();
    } catch (err) {
      console.error("Failed to create dynamic server:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServerAction = async (serverId: number, action: "start" | "stop" | "restart") => {
    setActionLoading(prev => ({ ...prev, [serverId]: action }));
    try {
      if (action === "start") await serversService.startServer(serverId);
      else if (action === "stop") await serversService.stopServer(serverId);
      else if (action === "restart") await serversService.restartServer(serverId);
      mutate();
    } catch (err) {
      console.error(`Failed to ${action} server:`, err);
    } finally {
      setActionLoading(prev => { const n = { ...prev }; delete n[serverId]; return n; });
    }
  };

  const handleDeleteDynamic = async () => {
    if (deleteConfirmId === null) return;
    const serverId = deleteConfirmId;
    setDeleteConfirmId(null);
    setActionLoading(prev => ({ ...prev, [serverId]: "delete" }));
    try {
      await serversService.deleteDynamic(serverId);
      mutate();
    } catch (err) {
      console.error("Failed to delete dynamic server:", err);
    } finally {
      setActionLoading(prev => { const n = { ...prev }; delete n[serverId]; return n; });
    }
  };

  const copyConnect = (server: CS2Server) => {
    const url = `${server.ipString}:${server.port}`;
    navigator.clipboard.writeText(url);
    setCopiedId(server.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const testRcon = async (serverId: number) => {
    setStatusMap(prev => ({ ...prev, [serverId]: { loading: true, online: null } }));
    try {
      const data = await serversService.getStatus(serverId);
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
            {t("servers.title")}
          </h1>
          <p className="text-slate-400 mt-1">{t("servers.description")}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsDynamicModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <Zap className="w-5 h-5" />
            {t("servers.create_dynamic")}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t("servers.add_server")}
          </button>
        </div>
      </div>

      {/* Last created dynamic server banner */}
      {lastCreated && (
        <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-emerald-400 font-medium">{t("servers.server_created")}</p>
            <p className="text-slate-300 text-sm mt-1">
              {t("servers.connect_url")}: <code className="bg-slate-800 px-2 py-0.5 rounded text-emerald-300">{lastCreated.connectUrl}</code>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(lastCreated.connectUrl);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              {t("servers.connect")}
            </button>
            <button onClick={() => setLastCreated(null)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Static server modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-screen">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{t("servers.new_server")}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateServer}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t("servers.display_name")}</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("servers.display_name_placeholder")}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t("servers.ip_address")}</label>
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
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t("servers.port")}</label>
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
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t("servers.rcon_password")}</label>
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
                  {t("servers.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? t("servers.saving") : t("servers.save_server")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic server modal */}
      {isDynamicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-screen">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                {t("servers.new_dynamic_server")}
              </h2>
              <button onClick={() => setIsDynamicModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDynamic}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t("servers.server_name")}</label>
                  <input
                    type="text"
                    required
                    value={dynamicFormData.name}
                    onChange={(e) => setDynamicFormData({ ...dynamicFormData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder={t("servers.server_name_placeholder")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t("servers.server_password")}</label>
                    <input
                      type="text"
                      value={dynamicFormData.password}
                      onChange={(e) => setDynamicFormData({ ...dynamicFormData, password: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t("servers.max_players")}</label>
                    <input
                      type="number"
                      required
                      min={2}
                      max={64}
                      value={dynamicFormData.maxPlayers}
                      onChange={(e) => setDynamicFormData({ ...dynamicFormData, maxPlayers: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t("servers.rcon_password")}</label>
                  <input
                    type="password"
                    value={dynamicFormData.rconPassword}
                    onChange={(e) => setDynamicFormData({ ...dynamicFormData, rconPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>

              {/* Plugins Selection */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <label className="block text-sm font-medium text-slate-300 mb-2">Plugins</label>
                {availablePlugins.length === 0 ? (
                  <p className="text-sm text-slate-500">No plugins available.</p>
                ) : (
                  <div className="space-y-3">
                    {availablePlugins.map(plugin => {
                      const isSelected = dynamicFormData.pluginSelections.some(p => p.pluginId === plugin.id);
                      const currentSelection = dynamicFormData.pluginSelections.find(p => p.pluginId === plugin.id);
                      
                      return (
                        <div key={plugin.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setDynamicFormData({
                                      ...dynamicFormData,
                                      pluginSelections: [...dynamicFormData.pluginSelections, { pluginId: plugin.id, configOverridesJson: plugin.configFilesJson }]
                                    });
                                  } else {
                                    setDynamicFormData({
                                      ...dynamicFormData,
                                      pluginSelections: dynamicFormData.pluginSelections.filter(p => p.pluginId !== plugin.id)
                                    });
                                    if (editingPluginConfig === plugin.id) setEditingPluginConfig(null);
                                  }
                                }}
                                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span className="text-sm font-medium text-white">{plugin.name}</span>
                            </label>
                            {isSelected && (
                              <button
                                type="button"
                                onClick={() => setEditingPluginConfig(editingPluginConfig === plugin.id ? null : plugin.id)}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                {editingPluginConfig === plugin.id ? "Close Config" : "Edit Config"}
                              </button>
                            )}
                          </div>
                          {isSelected && editingPluginConfig === plugin.id && (
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-slate-400 mb-1">Configuration Overrides (JSON array matching templates)</label>
                              <textarea
                                value={currentSelection?.configOverridesJson || ""}
                                onChange={(e) => {
                                  setDynamicFormData({
                                    ...dynamicFormData,
                                    pluginSelections: dynamicFormData.pluginSelections.map(p => 
                                      p.pluginId === plugin.id ? { ...p, configOverridesJson: e.target.value } : p
                                    )
                                  });
                                }}
                                className="w-full h-32 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDynamicModalOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  {t("servers.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? t("servers.creating") : t("servers.create_server")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading && <div className="text-slate-400">{t("servers.loading")}</div>}
      {error && <div className="text-red-500">{t("servers.error_fetching")}</div>}
      {servers && servers.length === 0 && (
        <div className="p-12 border border-dashed border-slate-800 rounded-xl text-center">
          <p className="text-slate-500">{t("servers.no_servers")}</p>
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
              <div className="flex items-center gap-2">
                {server.isDynamic ? (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {t("servers.dynamic")}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-700/50 text-slate-300 flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    {t("servers.static_server")}
                  </span>
                )}
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${server.inUse ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'}`}>
                  {server.inUse ? t("servers.in_match") : t("servers.available")}
                </span>
              </div>
            </div>
            <div className="p-4 bg-slate-950/50 flex-1">
              {statusMap[server.id]?.online === true && (
                <p className="text-sm text-green-400 font-medium">{t("servers.rcon_success")}</p>
              )}
              {statusMap[server.id]?.online === false && (
                <p className="text-sm text-red-400 font-medium">{t("servers.rcon_failed")}</p>
              )}
              {statusMap[server.id]?.online == null && (
                <p className="text-sm text-slate-500">{t("servers.ready")}</p>
              )}
              {server.tvPort && (
                <p className="text-xs text-slate-500 mt-1">GOTV: {server.ipString}:{server.tvPort}</p>
              )}
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-between items-center">
              <div className="flex gap-2">
                {server.isDynamic && (
                  <>
                    <button
                      onClick={() => handleServerAction(server.id, "start")}
                      disabled={!!actionLoading[server.id]}
                      className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title={t("servers.start")}
                    >
                      {actionLoading[server.id] === "start" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleServerAction(server.id, "stop")}
                      disabled={!!actionLoading[server.id]}
                      className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title={t("servers.stop")}
                    >
                      {actionLoading[server.id] === "stop" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleServerAction(server.id, "restart")}
                      disabled={!!actionLoading[server.id]}
                      className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title={t("servers.restart")}
                    >
                      {actionLoading[server.id] === "restart" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(server.id)}
                      disabled={!!actionLoading[server.id]}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title={t("servers.delete_dynamic")}
                    >
                      {actionLoading[server.id] === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => copyConnect(server)}
                  className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedId === server.id ? t("servers.copied") : t("servers.connect")}
                </button>
                {!server.isDynamic && (
                  <button className="text-sm text-slate-400 hover:text-white transition-colors">{t("servers.edit")}</button>
                )}
                <button
                  onClick={() => testRcon(server.id)}
                  disabled={statusMap[server.id]?.loading}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                >
                  {statusMap[server.id]?.loading ? t("servers.testing") : t("servers.test_rcon")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Dynamic Modal */}
      {isDynamicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                {t("servers.create_dynamic")}
              </h2>
              <button
                onClick={() => setIsDynamicModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="dynamic-form" onSubmit={handleCreateDynamic} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nome do Servidor</label>
                    <input
                      type="text"
                      value={dynamicFormData.name}
                      onChange={e => setDynamicFormData({ ...dynamicFormData, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Máximo de Jogadores</label>
                    <input
                      type="number"
                      value={dynamicFormData.maxPlayers}
                      onChange={e => setDynamicFormData({ ...dynamicFormData, maxPlayers: parseInt(e.target.value) || 10 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      required
                      min={1}
                      max={64}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Senha do Servidor (Opcional)</label>
                    <input
                      type="text"
                      value={dynamicFormData.password}
                      onChange={e => setDynamicFormData({ ...dynamicFormData, password: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Senha RCON (Opcional)</label>
                    <input
                      type="text"
                      value={dynamicFormData.rconPassword}
                      onChange={e => setDynamicFormData({ ...dynamicFormData, rconPassword: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-lg font-medium text-white mb-4">Plugins (Opcional)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {availablePlugins.map(plugin => {
                      const isSelected = dynamicFormData.pluginSelections.some(p => p.pluginId === plugin.id);
                      return (
                        <div key={plugin.id} className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDynamicFormData({
                                  ...dynamicFormData,
                                  pluginSelections: [...dynamicFormData.pluginSelections, { pluginId: plugin.id, configOverridesJson: "{}" }]
                                });
                              } else {
                                setDynamicFormData({
                                  ...dynamicFormData,
                                  pluginSelections: dynamicFormData.pluginSelections.filter(p => p.pluginId !== plugin.id)
                                });
                              }
                            }}
                            className="w-4 h-4 text-emerald-500 rounded border-slate-700 bg-slate-900 focus:ring-emerald-500"
                          />
                          <span className="text-sm font-medium text-slate-200">{plugin.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDynamicModalOpen(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {t("common.cancel") || "Cancelar"}
              </button>
              <button
                type="submit"
                form="dynamic-form"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("servers.create") || "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title={t("servers.confirm_delete_dynamic_title") || "Confirmação de Exclusão"}
        message={t("servers.confirm_delete_dynamic") || "Tem certeza que deseja excluir?"}
        onConfirm={handleDeleteDynamic}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
