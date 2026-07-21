"use client";

import { useState } from "react";
import { Plus, Trash, Upload, Puzzle, FileCode, Edit } from "lucide-react";
import useSWR from "swr";
import { useI18n } from "@/contexts/I18nContext";
import { GamePlugin, pluginsService } from "@/services/pluginsService";
import { swrFetcher } from "@/services/apiClient";
import { ConfirmModal } from "@/components/ConfirmModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";

const DEFAULT_JSON = `[
  {
    "key": "matchzy_main_cfg",
    "label": "MatchZy Main Config (CFG)",
    "relativePath": "cfg/MatchZy/config.cfg",
    "format": "cfg",
    "defaultContent": {
      "matchzy_chat_prefix": "[MatchZy]",
      "matchzy_admin_chat_prefix": "[MatchZy Admin]",
      "matchzy_minimum_ready_required": "1",
      "matchzy_demo_path": "matchzy_demos",
      "matchzy_stop_command_available": "true",
      "matchzy_use_casual_commands": "false",
      "matchzy_allow_force_ready": "true"
    }
  },
  {
    "key": "matchzy_admins_json",
    "label": "MatchZy Admins (JSON)",
    "relativePath": "addons/counterstrikesharp/plugins/MatchZy/admins.json",
    "format": "json",
    "defaultContent": {
      "76561198000000000": "",
      "76561198000000001": "vip"
    }
  }
]`;

export default function PluginsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { data: plugins = [], isLoading, mutate } = useSWR<GamePlugin[]>("/api/v1/plugins", swrFetcher);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formConfigFilesJson, setFormConfigFilesJson] = useState(DEFAULT_JSON);
  const [formFile, setFormFile] = useState<File | null>(null);

  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const openCreateForm = () => {
    setEditingId(null);
    setFormName("");
    setFormDesc("");
    setFormConfigFilesJson(DEFAULT_JSON);
    setFormFile(null);
    setIsFormOpen(true);
  };

  const openEditForm = (plugin: GamePlugin) => {
    setEditingId(plugin.id);
    setFormName(plugin.name);
    setFormDesc(plugin.description || "");
    setFormConfigFilesJson(plugin.configFilesJson);
    setFormFile(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await pluginsService.updatePlugin(editingId, {
          name: formName,
          description: formDesc,
          configFilesJson: formConfigFilesJson,
        });
      } else {
        const created = await pluginsService.createPlugin({
          name: formName,
          description: formDesc,
          configFilesJson: formConfigFilesJson,
        });

        if (formFile && created.id) {
          setUploadProgress((prev) => ({ ...prev, [created.id]: 0 }));
          setUploadingId(created.id);
          await pluginsService.uploadPluginZip(created.id, formFile, (progress) => {
            setUploadProgress((prev) => ({ ...prev, [created.id]: progress }));
          });
          setUploadingId(null);
          setUploadProgress((prev) => {
            const next = { ...prev };
            delete next[created.id];
            return next;
          });
        }

        if (created.id) {
          router.push(`/dashboard/plugins/${created.id}/editor`);
        }
      }

      closeForm();
      mutate();
    } catch (error) {
      console.error(error);
      alert("Error saving plugin");
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await pluginsService.deletePlugin(deleteConfirmId);
      mutate();
    } catch (error) {
      console.error(error);
      alert("Error deleting plugin");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(id);
    setUploadProgress((prev) => ({ ...prev, [id]: 0 }));
    try {
      await pluginsService.uploadPluginZip(id, file, (progress) => {
        setUploadProgress((prev) => ({ ...prev, [id]: progress }));
      });
      alert(t("plugins.zip_uploaded") || "ZIP uploaded successfully");
    } catch (error) {
      console.error(error);
      alert("Error uploading zip");
    } finally {
      setUploadingId(null);
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      e.target.value = "";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Puzzle className="w-8 h-8 text-emerald-500" />
            {t("plugins.title")}
          </h1>
          <p className="text-slate-400 mt-2">{t("plugins.description")}</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={openCreateForm}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t("plugins.add_plugin")}
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            {editingId ? "Edit Plugin" : t("plugins.new_plugin")}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {t("plugins.plugin_name")}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder={t("plugins.plugin_name_placeholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {t("plugins.plugin_desc")}
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder={t("plugins.plugin_desc_placeholder")}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex justify-between">
                <span>{t("plugins.config_files")} (JSON Array)</span>
              </label>
              <div className="h-64 rounded-md overflow-hidden border border-slate-700 relative">
                <Editor
                  height="100%"
                  language="json"
                  theme="vs-dark"
                  value={formConfigFilesJson}
                  onChange={(val) => setFormConfigFilesJson(val || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on",
                    padding: { top: 8 },
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {`Format: [{ "key": "cfg", "label": "CFG", "relativePath": "...", "format": "cfg", "defaultContent": {} }]`}
              </p>
            </div>
            {!editingId && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Plugin ZIP File (.zip)
                </label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                {t("plugins.cancel")}
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md transition-colors"
              >
                {t("plugins.save")}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-slate-400">{t("plugins.loading")}</div>
      ) : plugins.length === 0 ? (
        <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 text-center text-slate-400">
          {t("plugins.no_plugins")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plugins.map((plugin) => (
            <div key={plugin.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">{plugin.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditForm(plugin)}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-md transition-colors"
                      title="Edit Plugin Metadata"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <Link
                      href={`/dashboard/plugins/${plugin.id}/editor`}
                      className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-md transition-colors"
                      title={t("plugins.open_editor")}
                    >
                      <FileCode className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => setDeleteConfirmId(plugin.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-md transition-colors"
                      title={t("plugins.delete")}
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-4 flex-1">{plugin.description || "No description"}</p>

                <div className="bg-slate-900 p-3 rounded-md border border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {t("plugins.config_files")}
                  </h4>
                  <div className="text-xs font-mono text-slate-300 overflow-hidden whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                    {plugin.configFilesJson}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-900 border-t border-slate-700 relative overflow-hidden mt-auto">
                {uploadProgress[plugin.id] !== undefined && (
                  <div
                    className="absolute top-0 left-0 h-full bg-emerald-600/20 transition-all duration-300 pointer-events-none"
                    style={{ width: `${uploadProgress[plugin.id]}%` }}
                  />
                )}
                <label className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-md cursor-pointer transition-colors border border-slate-700 relative z-10">
                  {uploadingId === plugin.id ? (
                    <span className="animate-pulse">{t("plugins.uploading")} {uploadProgress[plugin.id]}%</span>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {t("plugins.upload_zip")}
                    </>
                  )}
                  <input
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={(e) => handleUpload(plugin.id, e)}
                    disabled={uploadingId === plugin.id}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title={t("plugins.confirm_delete_title") || "Confirmação de Exclusão"}
        message={t("plugins.confirm_delete") || "Tem certeza que deseja excluir?"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
