import { fetchApi } from "./apiClient";

export interface TeamPlayer {
  id: number;
  name: string;
}

export interface Team {
  id: number;
  name: string;
  flag?: string;
  logo?: string;
  playerSteamIds?: string;
  players: TeamPlayer[];
}

export const teamsService = {
  getAll: () => fetchApi<Team[]>("/api/v1/teams"),
  getById: (id: number) => fetchApi<Team>(`/api/v1/teams/${id}`),
  create: (data: Partial<Team>) => fetchApi<Team>("/api/v1/teams", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<Team>) => fetchApi<Team>(`/api/v1/teams/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<void>(`/api/v1/teams/${id}`, {
    method: "DELETE",
  }),
};
