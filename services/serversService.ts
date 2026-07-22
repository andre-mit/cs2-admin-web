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

export interface ServerHealth {
  status: "online" | "starting" | "restarting" | "offline";
  isDynamic: boolean;
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
  getHealth: (id: number) => fetchApi<ServerHealth>(`/api/v1/servers/${id}/health`),

  updateBaseServer: () =>
    fetchApi<{ message: string }>("/api/v1/servers/update-base", {
      method: "POST",
    }),

  getUpdateBaseStream: (token: string, onMessage: (data: any) => void, onError: (err: any) => void) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1/servers/update-base-stream?access_token=${token}`;
    const eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        onError(err);
      }
    };
    
    eventSource.onerror = (err) => {
      onError(err);
    };
    
    return eventSource;
  },

  getLogsStream: (id: number, token: string, onMessage: (data: { log: string }) => void, onError: (err: any) => void) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1/servers/${id}/logs?access_token=${token}`;
    const eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        // Fallback for raw text
        onMessage({ log: event.data });
      }
    };
    
    eventSource.onerror = (err) => {
      onError(err);
    };
    
    return eventSource;
  },

  getGlobalEventsStream: (token: string, onMessage: (event: { type: string, data: any }) => void, onError: (err: any) => void) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1/servers/events?access_token=${token}`;
    const eventSource = new EventSource(url);
    
    // Default message handler
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage({ type: event.type, data });
      } catch (err) {
        console.error("Failed to parse SSE event data", err);
      }
    };
    
    // Custom event handlers
    const handleEvent = (event: MessageEvent) => {
        try {
            const data = JSON.parse(event.data);
            onMessage({ type: event.type, data });
        } catch (err) {}
    };

    eventSource.addEventListener("status_change", handleEvent);
    eventSource.addEventListener("server_list_changed", handleEvent);
    
    eventSource.onerror = (err) => {
      onError(err);
    };
    
    return eventSource;
  },

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
