import { fetchApi } from "./apiClient";

export interface GameMap {
  id: number;
  displayName: string;
  identifier: string;
  isCommunity: boolean;
  imageUrl: string;
  badgeUrl: string | null;
}

export const mapsService = {
  getAll: () => fetchApi<GameMap[]>("/api/v1/maps"),
  getById: (id: number) => fetchApi<GameMap>(`/api/v1/maps/${id}`),
  create: (data: Partial<GameMap>) => fetchApi<GameMap>("/api/v1/maps", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<GameMap>) => fetchApi<GameMap>(`/api/v1/maps/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<void>(`/api/v1/maps/${id}`, {
    method: "DELETE",
  }),
};
