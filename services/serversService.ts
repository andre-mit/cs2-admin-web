import { fetchApi } from "./apiClient";

export interface CS2Server {
  id: number;
  ipString: string;
  port: number;
  rconPassword?: string;
  serverPassword?: string;
  displayName?: string;
  inUse: boolean;
  containerId?: string;
  tvPort?: number;
  isDynamic: boolean;
  createdAt?: string;
}

export interface ServerStatus {
  online: boolean;
  response?: string;
}

export interface PluginSelectionItem {
  pluginId: number;
  configOverridesJson?: string;
}

export interface CreateDynamicServerRequest {
  name: string;
  password?: string;
  rconPassword?: string;
  maxPlayers: number;
  pluginSelections?: PluginSelectionItem[];
  serverVariables?: Record<string, string>;
}

export interface DynamicServerResult {
  serverId: string;
  gamePort: number;
  rconPort: number;
  connectUrl: string;
}

export const serversService = {
  getAll: () => fetchApi<CS2Server[]>("/api/v1/servers"),
  getById: (id: number) => fetchApi<CS2Server>(`/api/v1/servers/${id}`),
  create: (data: Partial<CS2Server>) => fetchApi<CS2Server>("/api/v1/servers", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<CS2Server>) => fetchApi<CS2Server>(`/api/v1/servers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<void>(`/api/v1/servers/${id}`, {
    method: "DELETE",
  }),
  getStatus: (id: number) => fetchApi<ServerStatus>(`/api/v1/servers/${id}/status`),

  // Dynamic server management
  createDynamic: (data: CreateDynamicServerRequest) =>
    fetchApi<DynamicServerResult>("/api/v1/servers/dynamic", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  startServer: (id: number) =>
    fetchApi<{ message: string }>(`/api/v1/servers/${id}/start`, { method: "POST" }),
  stopServer: (id: number) =>
    fetchApi<{ message: string }>(`/api/v1/servers/${id}/stop`, { method: "POST" }),
  restartServer: (id: number) =>
    fetchApi<{ message: string }>(`/api/v1/servers/${id}/restart`, { method: "POST" }),
  deleteDynamic: (id: number) =>
    fetchApi<void>(`/api/v1/servers/${id}/dynamic`, { method: "DELETE" }),
};
