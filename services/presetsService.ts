import { fetchApi } from "./apiClient";

export interface ServerPreset {
  id: number;
  name: string;
  description?: string;
  serverVariables: Record<string, string>;
  pluginIds: number[];
}

export const presetsService = {
  async getAllPresets() {
    return fetchApi<ServerPreset[]>("/api/v1/presets");
  },

  async getPreset(id: number) {
    return fetchApi<ServerPreset>(`/api/v1/presets/${id}`);
  },

  async createPreset(preset: Partial<ServerPreset>) {
    return fetchApi<ServerPreset>("/api/v1/presets", {
      method: "POST",
      body: JSON.stringify(preset),
    });
  },

  async updatePreset(id: number, preset: Partial<ServerPreset>) {
    return fetchApi<void>(`/api/v1/presets/${id}`, {
      method: "PUT",
      body: JSON.stringify(preset),
    });
  },

  async deletePreset(id: number) {
    return fetchApi<void>(`/api/v1/presets/${id}`, {
      method: "DELETE",
    });
  },
};
