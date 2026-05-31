"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Users, Swords, Play } from "lucide-react";
import { lobbiesService, Lobby } from "@/services/lobbiesService";
import { GameMap } from "@/services/mapsService";
import { swrFetcher } from "@/services/apiClient";

export default function LobbiesAdminPage() {
  const { data: lobbies, mutate } = useSWR<Lobby[]>("/api/v1/lobbies", swrFetcher);
  const { data: maps } = useSWR<GameMap[]>("/api/v1/maps", swrFetcher);
  const [isCreating, setIsCreating] = useState(false);
  
  const [title, setTitle] = useState("");
  const [maxMaps, setMaxMaps] = useState("1");
  const [mapSidesMode, setMapSidesMode] = useState("knife");
  const [selectedMaps, setSelectedMaps] = useState<string[]>([]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMaps.length < 7) {
      alert("You must select at least 7 maps for standard tournament vetoes.");
      return;
    }
    await lobbiesService.create({
      title,
      maxMaps: parseInt(maxMaps),
      state: "WAITING", // Initial state
      // @ts-ignore mapSidesMode & mapPool are extended lobby props in API
      mapSidesMode,
      mapPool: selectedMaps.join(",")
    });
    setIsCreating(false);
    mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Swords className="w-8 h-8 text-indigo-500" />
            PUG Lobbies
          </h1>
          <p className="text-slate-400 mt-1">Create lobbies for players to join, randomize teams and veto maps.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Create Lobby
        </button>
      </div>

      {isCreating && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">New PUG Lobby</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Lobby Title</label>
              <input 
                required value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                placeholder="Friday Night PUG"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Series Format</label>
                <select 
                  value={maxMaps} onChange={(e) => setMaxMaps(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="1">Best of 1</option>
                  <option value="3">Best of 3</option>
                  <option value="5">Best of 5</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Side Selection</label>
                <select 
                  value={mapSidesMode} onChange={(e) => setMapSidesMode(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="knife">Knife Round (All Maps)</option>
                  <option value="team1_ct">Team 1 Starts CT</option>
                  <option value="team2_ct">Team 2 Starts CT</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Map Pool</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-2 border border-slate-800 rounded-lg bg-slate-950">
                {maps?.map(m => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-900 p-1 rounded">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600"
                      checked={selectedMaps.includes(m.isCommunity ? `ws:${m.identifier}` : m.identifier)}
                      onChange={(e) => {
                        const mapId = m.isCommunity ? `ws:${m.identifier}` : m.identifier;
                        if (e.target.checked) setSelectedMaps([...selectedMaps, mapId]);
                        else setSelectedMaps(selectedMaps.filter(id => id !== mapId));
                      }}
                    />
                    <span className="text-sm truncate" title={m.displayName}>{m.displayName}</span>
                  </label>
                ))}
                {maps?.length === 0 && <span className="text-xs text-slate-500">Nenhum mapa cadastrado.</span>}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Launch Lobby</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lobbies?.map(lobby => (
          <div key={lobby.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white">{lobby.title}</h3>
              <span className="px-2 py-1 bg-slate-800 text-xs font-medium text-slate-300 rounded uppercase">
                {lobby.state}
              </span>
            </div>
            <div className="space-y-2 mb-6 flex-1">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Users className="w-4 h-4" />
                <span>{lobby.players?.length || 0} players connected</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Swords className="w-4 h-4" />
                <span>Best of {lobby.maxMaps}</span>
              </div>
            </div>
            <a 
              href={`/lobby/${lobby.id}`}
              target="_blank"
              className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Open Lobby
              <Play className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
