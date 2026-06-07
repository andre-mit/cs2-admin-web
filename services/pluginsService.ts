import { fetchApi } from "./apiClient";

export interface ConfigFileDefinition {
  key: string;
  label: string;
  relativePath: string;
  format: string; // "json" | "cfg"
  defaultContent?: unknown;
}

export interface GamePlugin {
  id: number;
  name: string;
  description?: string;
  configFilesJson: string; // JSON string of ConfigFileDefinition array
  createdAt: string;
}

export const pluginsService = {
  async getAllPlugins() {
    return fetchApi<GamePlugin[]>("/api/v1/plugins");
  },

  async createPlugin(plugin: Partial<GamePlugin>) {
    return fetchApi<GamePlugin>("/api/v1/plugins", {
      method: "POST",
      body: JSON.stringify(plugin),
    });
  },

  async uploadPluginZip(id: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return fetchApi<GamePlugin>(`/api/v1/plugins/${id}/upload`, {
      method: "POST",
      body: formData
    });
  },

  async deletePlugin(id: number) {
    return fetchApi<void>(`/api/v1/plugins/${id}`, {
      method: "DELETE",
    });
  },
};
