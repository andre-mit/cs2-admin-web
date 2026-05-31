import { fetchApi } from "./apiClient";

export interface CS2Server {
  id: number;
  ipString: string;
  port: number;
  rconPassword?: string;
  displayName?: string;
  inUse: boolean;
}

export interface ServerStatus {
  online: boolean;
  response?: string;
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
};
