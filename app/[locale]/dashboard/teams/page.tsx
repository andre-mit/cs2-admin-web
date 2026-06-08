"use client";

import { Users, Plus, Search, X, Edit2, Trash2 } from "lucide-react";
import useSWR from "swr";
import { useState } from "react";
import { teamsService, Team } from "@/services/teamsService";
import { swrFetcher } from "@/services/apiClient";
import { useI18n } from "@/contexts/I18nContext";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function TeamsPage() {
  const { t } = useI18n();
  const { data: teams, error, isLoading, mutate } = useSWR<Team[]>("/api/v1/teams", swrFetcher);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [flag, setFlag] = useState("");
  const [logo, setLogo] = useState("");
  const [playerSteamIds, setPlayerSteamIds] = useState("");

  const openCreateModal = () => {
    setEditingTeam(null);
    setName("");
    setFlag("");
    setLogo("");
    setPlayerSteamIds("");
    setIsModalOpen(true);
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setName(team.name);
    setFlag(team.flag || "");
    setLogo(team.logo || "");
    setPlayerSteamIds(team.playerSteamIds || "");
    setIsModalOpen(true);
  };

  const handleDeleteTeam = async () => {
    if (deleteConfirmId === null) return;
    
    try {
      await teamsService.delete(deleteConfirmId);
      mutate();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    
    const payload = {
      id: editingTeam ? editingTeam.id : 0,
      name,
      flag,
      logo,
      playerSteamIds
    };

    try {
      if (editingTeam) {
        await teamsService.update(editingTeam.id, payload);
      } else {
        await teamsService.create(payload);
      }

      setIsModalOpen(false);
      mutate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-500" />
            {t("teams.title")}
          </h1>
          <p className="text-slate-400 mt-1">{t("teams.description")}</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t("teams.create_team")}
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingTeam ? t("teams.edit_team") : t("teams.create_new_team")}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTeam}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t("teams.team_name")}</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={t("teams.team_name_placeholder")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t("teams.country_flag")}</label>
                    <input 
                      type="text" 
                      value={flag}
                      onChange={(e) => setFlag(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={t("teams.country_flag_placeholder")}
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t("teams.logo_text")}</label>
                    <input 
                      type="text" 
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={t("teams.logo_text_placeholder")}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t("teams.player_steam_ids")}</label>
                  <textarea 
                    value={playerSteamIds}
                    onChange={(e) => setPlayerSteamIds(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                    placeholder="76561198000000001, 76561198000000002..."
                  />
                  <p className="text-xs text-slate-500 mt-1">{t("teams.player_steam_ids_desc")}</p>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  {t("teams.cancel")}
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? t("teams.saving") : (editingTeam ? t("teams.update_team") : t("teams.create_team"))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder={t("teams.search_teams")} 
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 text-sm border-b border-slate-800">
                <th className="px-6 py-4 font-medium">{t("teams.team_id")}</th>
                <th className="px-6 py-4 font-medium">{t("teams.team_name")}</th>
                <th className="px-6 py-4 font-medium">{t("teams.roster_size")}</th>
                <th className="px-6 py-4 font-medium">{t("teams.flag")}</th>
                <th className="px-6 py-4 font-medium text-right">{t("teams.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {t("teams.loading_teams")}
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                    {t("teams.error_loading")}
                  </td>
                </tr>
              )}
              {teams && teams.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {t("teams.no_teams")}
                  </td>
                </tr>
              )}
              {teams && teams.map((team) => {
                const rosterCount = team.playerSteamIds ? team.playerSteamIds.split(',').filter(id => id.trim().length > 0).length : 0;
                return (
                  <tr key={team.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      #{team.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold uppercase">
                          {team.logo ? team.logo.substring(0, 2) : team.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-200">{team.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {rosterCount} {t("teams.players")}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm uppercase">
                      {team.flag || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => openEditModal(team)}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors p-1"
                          title={t("teams.edit_team")}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(team.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                          title={t("teams.confirm_delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title={t("teams.confirm_delete_title") || "Confirmação de Exclusão"}
        message={t("teams.confirm_delete") || "Tem certeza que deseja excluir?"}
        onConfirm={handleDeleteTeam}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
