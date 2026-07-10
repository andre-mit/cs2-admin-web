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

  async uploadPluginZip(id: number, file: File, onProgress?: (percentage: number) => void) {
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    let result: GamePlugin | undefined;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("file", chunk, file.name);
      formData.append("chunkIndex", i.toString());
      formData.append("totalChunks", totalChunks.toString());

      result = await fetchApi<GamePlugin>(`/api/v1/plugins/${id}/upload-chunk`, {
        method: "POST",
        body: formData,
      });

      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalChunks) * 100));
      }
    }

    return result as GamePlugin;
  },

  async deletePlugin(id: number) {
    return fetchApi<void>(`/api/v1/plugins/${id}`, {
      method: "DELETE",
    });
  },
};
