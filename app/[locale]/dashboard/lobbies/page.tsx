"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Users, Swords, Play, Trash2 } from "lucide-react";
import { lobbiesService, Lobby } from "@/services/lobbiesService";
import { GameMap } from "@/services/mapsService";
import { swrFetcher } from "@/services/apiClient";
import { useI18n } from "@/contexts/I18nContext";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function LobbiesAdminPage() {
  const { t } = useI18n();
  const { data: lobbies, mutate } = useSWR<Lobby[]>("/api/v1/lobbies", swrFetcher);
  const { data: maps } = useSWR<GameMap[]>("/api/v1/maps", swrFetcher);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [maxMaps, setMaxMaps] = useState("1");
  const [mapSidesMode, setMapSidesMode] = useState("knife");
  const [selectedMaps, setSelectedMaps] = useState<string[]>([]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMaps.length < 7) {
      alert(t("lobbies.alert_7_maps"));
      return;
    }
    await lobbiesService.create({
      title,
      maxMaps: parseInt(maxMaps),
      state: "WAITING", // Initial state
      // @ts-expect-error mapSidesMode & mapPool are extended lobby props in API
      mapSidesMode,
      mapPool: selectedMaps.join(",")
    });
    setIsCreating(false);
    mutate();
  };

  const handleDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await lobbiesService.delete(deleteConfirmId);
      mutate();
    } finally {
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Swords className="w-8 h-8 text-indigo-500" />
            {t("lobbies.title")}
          </h1>
          <p className="text-slate-400 mt-1">{t("lobbies.description")}</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
        >
          <Plus className="w-5 h-5" />
          {t("lobbies.create_lobby")}
        </button>
      </div>

      {isCreating && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">{t("lobbies.new_lobby")}</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{t("lobbies.lobby_title")}</label>
              <input
                required value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                placeholder={t("lobbies.lobby_title_placeholder")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t("lobbies.series_format")}</label>
                <select
                  value={maxMaps} onChange={(e) => setMaxMaps(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="1">{t("lobbies.bo1")}</option>
                  <option value="3">{t("lobbies.bo3")}</option>
                  <option value="5">{t("lobbies.bo5")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t("lobbies.side_selection")}</label>
                <select
                  value={mapSidesMode} onChange={(e) => setMapSidesMode(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="knife">{t("lobbies.knife")}</option>
                  <option value="team1_ct">{t("lobbies.team1_ct")}</option>
                  <option value="team2_ct">{t("lobbies.team2_ct")}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t("lobbies.map_pool")}</label>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("maps.official_maps") || "Official Maps"}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-2 border border-slate-800 rounded-lg bg-slate-950">
                    {maps?.filter(m => !m.isCommunity).map(m => (
                      <label key={m.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-900 p-1 rounded">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600"
                          checked={selectedMaps.includes(m.identifier)}
                          onChange={(e) => {
                            const mapId = m.identifier;
                            if (e.target.checked) setSelectedMaps([...selectedMaps, mapId]);
                            else setSelectedMaps(selectedMaps.filter(id => id !== mapId));
                          }}
                        />
                        <span className="text-sm truncate" title={m.displayName}>{m.displayName}</span>
                      </label>
                    ))}
                    {maps?.filter(m => !m.isCommunity).length === 0 && <span className="text-xs text-slate-500">{t("lobbies.no_maps")}</span>}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("maps.community_maps") || "Community Maps"}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-2 border border-slate-800 rounded-lg bg-slate-950">
                    {maps?.filter(m => m.isCommunity).map(m => (
                      <label key={m.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-900 p-1 rounded">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600"
                          checked={selectedMaps.includes(`ws:${m.identifier}`)}
                          onChange={(e) => {
                            const mapId = `ws:${m.identifier}`;
                            if (e.target.checked) setSelectedMaps([...selectedMaps, mapId]);
                            else setSelectedMaps(selectedMaps.filter(id => id !== mapId));
                          }}
                        />
                        <span className="text-sm truncate" title={m.displayName}>{m.displayName}</span>
                      </label>
                    ))}
                    {maps?.filter(m => m.isCommunity).length === 0 && <span className="text-xs text-slate-500">{t("lobbies.no_maps")}</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400">{t("lobbies.cancel")}</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{t("lobbies.launch_lobby")}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lobbies?.map(lobby => (
          <div key={lobby.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white">{lobby.title}</h3>
              <span className="px-2 py-1 bg-slate-800 text-xs font-medium text-slate-300 rounded uppercase">
                {lobby.state}
              </span>
            </div>
            <div className="space-y-2 mb-6 flex-1">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Users className="w-4 h-4" />
                <span>{lobby.players?.length || 0} {t("lobbies.players_connected")}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Swords className="w-4 h-4" />
                <span>Best of {lobby.maxMaps}</span>
              </div>
            </div>
            <div className="flex gap-2 w-full mt-2">
              <a
                href={`/lobby/${lobby.id}`}
                target="_blank"
                className="flex flex-1 items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                {t("lobbies.open_lobby")}
                <Play className="w-4 h-4" />
              </a>
              <button
                onClick={() => setDeleteConfirmId(lobby.id)}
                className="p-2 bg-red-900/50 hover:bg-red-800 text-red-200 rounded-lg transition-colors"
                title={t("lobbies.delete_lobby")}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title={t("lobbies.confirm_delete_title") || "Confirmação de Exclusão"}
        message={t("lobbies.confirm_delete") || "Tem certeza que deseja excluir?"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
