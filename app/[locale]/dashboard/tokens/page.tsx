"use client";

import { Key, Plus, Trash2, X } from "lucide-react";
import useSWR from "swr";
import { useState } from "react";
import { swrFetcher, API_BASE_URL, getAuthToken } from "@/services/apiClient";
import { useI18n } from "@/contexts/I18nContext";
import { ConfirmModal } from "@/components/ConfirmModal";

export interface SteamServerToken {
  id: number;
  memo: string;
  token: string;
  isAvailable: boolean;
}

const tokensService = {
  async create(payload: Partial<SteamServerToken>): Promise<SteamServerToken> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/api/v1/steam-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed to create token");
    return res.json();
  },
  async delete(id: number): Promise<void> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/api/v1/steam-tokens/${id}`, {
      method: "DELETE",
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Failed to delete token");
  }
};

export default function TokensPage() {
  const { t } = useI18n();
  const { data: tokens, error, isLoading, mutate } = useSWR<SteamServerToken[]>("/api/v1/steam-tokens", swrFetcher);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form states
  const [memo, setMemo] = useState("");
  const [tokenValue, setTokenValue] = useState("");

  const openCreateModal = () => {
    setMemo("");
    setTokenValue("");
    setIsModalOpen(true);
  };

  const handleDeleteToken = async () => {
    if (deleteConfirmId === null) return;
    
    try {
      await tokensService.delete(deleteConfirmId);
      mutate();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memo.trim() || !tokenValue.trim()) return;
    
    setIsSubmitting(true);
    
    const payload = {
      memo,
      token: tokenValue,
      isAvailable: true
    };

    try {
      await tokensService.create(payload);
      setIsModalOpen(false);
      mutate();
    } catch (err) {
      console.error(err);
      alert(t("common.error") || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Key className="w-8 h-8 text-indigo-500" />
            {t("tokens.title")}
          </h1>
          <p className="text-slate-400 mt-1">{t("tokens.description")}</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t("tokens.add_token")}
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {t("tokens.new_token")}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveToken}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t("tokens.memo")}</label>
                  <input 
                    type="text" 
                    required
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={t("tokens.memo_placeholder") || "e.g. Public Scrim 01"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t("tokens.token")}</label>
                  <input 
                    type="text" 
                    required
                    value={tokenValue}
                    onChange={(e) => setTokenValue(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={t("tokens.token_placeholder") || "Token hash only"}
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  {t("common.cancel") || "Cancel"}
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (t("common.loading") || "Loading...") : (t("tokens.save_token") || "Save Token")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 text-sm border-b border-slate-800">
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">{t("tokens.memo")}</th>
                <th className="px-6 py-4 font-medium">{t("tokens.status")}</th>
                <th className="px-6 py-4 font-medium text-right">{t("tokens.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    {t("tokens.loading") || "Loading tokens..."}
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-red-500">
                    {t("tokens.error_loading") || "Error fetching tokens."}
                  </td>
                </tr>
              )}
              {tokens && tokens.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    {t("tokens.no_tokens") || "No tokens configured."}
                  </td>
                </tr>
              )}
              {tokens && tokens.map((tk) => {
                return (
                  <tr key={tk.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      #{tk.id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-200">{tk.memo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${tk.isAvailable ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"}`}>
                        {tk.isAvailable ? (t("tokens.free") || "Free") : (t("tokens.used") || "In Use")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => setDeleteConfirmId(tk.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                          title={t("common.delete") || "Delete"}
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
        title={t("tokens.confirm_delete_title") || "Delete Token"}
        message={t("tokens.confirm_delete") || "Are you sure you want to delete this token?"}
        onConfirm={handleDeleteToken}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
