import { fetchApi } from "./apiClient";

export interface LobbyPlayer {
  id: number;
  steamId: string;
  name: string;
  avatarUrl?: string;
  teamDesignation: number;
  isCaptain: boolean;
}

export interface Lobby {
  id: number;
  title: string;
  state: string;
  team1Id?: number;
  team2Id?: number;
  mapId?: number;
  serverId?: number;
  maxMaps: number;
  mapPool: string;
  vetoHistory: string;
  selectedMaps: string;
  players: LobbyPlayer[];
}

export const lobbiesService = {
  getAll: () => fetchApi<Lobby[]>("/api/v1/lobbies"),
  getById: (id: number) => fetchApi<Lobby>(`/api/v1/lobbies/${id}`),
  create: (data: Partial<Lobby>) => fetchApi<Lobby>("/api/v1/lobbies", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<Lobby>) => fetchApi<Lobby>(`/api/v1/lobbies/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<void>(`/api/v1/lobbies/${id}`, {
    method: "DELETE",
  }),
  join: (id: number, playerData: Partial<LobbyPlayer>) => fetchApi<Lobby>(`/api/v1/lobbies/${id}/join`, {
    method: "POST",
    body: JSON.stringify(playerData),
  }),
  randomizeTeams: (id: number) => fetchApi<void>(`/api/v1/lobbies/${id}/randomize`, {
    method: "POST",
  }),
  updateState: (id: number, state: string) => fetchApi<void>(`/api/v1/lobbies/${id}/state`, {
    method: "POST",
    body: JSON.stringify({ state }),
  }),
  generateMatch: (id: number) => fetchApi<void>(`/api/v1/lobbies/${id}/generate`, {
    method: "POST",
  }),
  vetoMap: (id: number, map: string, action: string) => fetchApi<void>(`/api/v1/lobbies/${id}/veto`, {
    method: "POST",
    body: JSON.stringify({ map, action }),
  })
};
