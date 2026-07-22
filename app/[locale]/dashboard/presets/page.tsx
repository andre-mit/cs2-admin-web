"use client";

import { useState, useEffect } from "react";
import { Plus, Trash, Zap, X, Upload } from "lucide-react";
import useSWR from "swr";
import { useI18n } from "@/contexts/I18nContext";
import { ServerPreset, presetsService } from "@/services/presetsService";
import { pluginsService, GamePlugin } from "@/services/pluginsService";
import { swrFetcher } from "@/services/apiClient";
import { ConfirmModal } from "@/components/ConfirmModal";
import Editor from "@monaco-editor/react";
import { useRef } from "react";

export default function PresetsPage() {
  const { t } = useI18n();
  const { data: presets = [], isLoading, mutate } = useSWR<ServerPreset[]>("/api/v1/presets", swrFetcher);
  const [availablePlugins, setAvailablePlugins] = useState<GamePlugin[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newServerVariables, setNewServerVariables] = useState<Record<string, string>>({});
  const [newPluginIds, setNewPluginIds] = useState<number[]>([]);
  const [newCustomCfg, setNewCustomCfg] = useState("");
  const [newCustomCfgName, setNewCustomCfgName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [customVarKey, setCustomVarKey] = useState("");
  const [customVarValue, setCustomVarValue] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    pluginsService.getAllPlugins().then(setAvailablePlugins).catch(console.error);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      await presetsService.createPreset({
        name: newName,
        description: newDesc,
        customCfg: newCustomCfg,
        customCfgName: newCustomCfgName,
        serverVariables: newServerVariables,
        pluginIds: newPluginIds,
      });

      setNewName("");
      setNewDesc("");
      setNewCustomCfg("");
      setNewCustomCfgName("");
      setNewServerVariables({});
      setNewPluginIds([]);
      setIsCreating(false);
      mutate();
    } catch (error) {
      console.error(error);
      alert("Error creating preset");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await presetsService.deletePreset(deleteConfirmId);
      mutate();
    } catch (error) {
      console.error(error);
      alert("Error deleting preset");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setNewCustomCfg(content);
      // Auto fill name if empty
      if (!newCustomCfgName) {
        const nameWithoutExt = file.name.replace(/\.cfg$/i, '');
        setNewCustomCfgName(nameWithoutExt);
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getPluginNames = (ids: number[]) => {
    return ids.map(id => availablePlugins.find(p => p.id === id)?.name || `Plugin ${id}`).join(", ");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-500" />
            Server Presets
          </h1>
          <p className="text-slate-400 mt-2">Manage dynamic server presets and bundle configurations.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Preset
        </button>
      </div>

      {isCreating && (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">New Preset</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Preset Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Competitive (MatchZy)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Official settings for 5v5"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <label className="block text-sm font-medium text-slate-300 mb-2">Plugins Bundled in this Preset</label>
              {availablePlugins.length === 0 ? (
                <p className="text-sm text-slate-500">No plugins available.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availablePlugins.map(plugin => {
                    const isSelected = newPluginIds.includes(plugin.id);
                    return (
                      <label key={plugin.id} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-900 border-slate-700 hover:border-slate-600'}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setNewPluginIds([...newPluginIds, plugin.id]);
                            else setNewPluginIds(newPluginIds.filter(id => id !== plugin.id));
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm font-medium text-white">{plugin.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <label className="block text-sm font-medium text-slate-300 mb-2">Server Variables (CVARs)</label>
              
              <div className="space-y-2 mb-4">
                {Object.entries(newServerVariables).map(([k, v]) => (
                  <div key={k} className="flex gap-2 items-center">
                    <input
                      type="text"
                      disabled
                      value={k}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-slate-400 text-sm"
                    />
                    <input
                      type="text"
                      value={v}
                      onChange={(e) => setNewServerVariables({ ...newServerVariables, [k]: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newVars = { ...newServerVariables };
                        delete newVars[k];
                        setNewServerVariables(newVars);
                      }}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="CVAR Name (e.g. sv_cheats)"
                  value={customVarKey}
                  onChange={e => setCustomVarKey(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 1)"
                  value={customVarValue}
                  onChange={e => setCustomVarValue(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customVarKey.trim()) {
                      setNewServerVariables({ ...newServerVariables, [customVarKey.trim()]: customVarValue.trim() });
                      setCustomVarKey("");
                      setCustomVarValue("");
                    }
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
                >
                  Add Variable
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-300">Custom CFG</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".cfg,.txt,.ini"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Filename (defaults to 'custom')"
                  value={newCustomCfgName}
                  onChange={e => setNewCustomCfgName(e.target.value)}
                  className="w-full md:w-1/2 bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="border border-slate-700 rounded-md overflow-hidden">
                <Editor
                  height="200px"
                  defaultLanguage="ini"
                  theme="vs-dark"
                  value={newCustomCfg}
                  onChange={(val) => setNewCustomCfg(val || "")}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-md transition-colors"
              >
                Save Preset
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-slate-400">Loading presets...</div>
      ) : presets.length === 0 ? (
        <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 text-center text-slate-400">
          No presets found. Create one above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presets.map((preset) => (
            <div key={preset.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">{preset.name}</h3>
                  <button
                    onClick={() => setDeleteConfirmId(preset.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-md transition-colors"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
                {preset.description && <p className="text-sm text-slate-400 mb-4">{preset.description}</p>}

                {preset.pluginIds.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Plugins</h4>
                    <p className="text-sm text-slate-300">{getPluginNames(preset.pluginIds)}</p>
                  </div>
                )}

                {preset.customCfg && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Custom CFG</h4>
                    <p className="text-sm text-slate-300">{preset.customCfgName || "custom"}.cfg</p>
                  </div>
                )}

                {Object.keys(preset.serverVariables || {}).length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Variables</h4>
                    <div className="bg-slate-900 p-2 rounded border border-slate-700 max-h-32 overflow-y-auto custom-scrollbar">
                      {Object.entries(preset.serverVariables).map(([k, v]) => (
                        <div key={k} className="text-xs flex justify-between py-1 border-b border-slate-800 last:border-0">
                          <span className="text-amber-400">{k}</span>
                          <span className="text-slate-300">"{v}"</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Delete Preset"
        message="Are you sure you want to delete this preset?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
