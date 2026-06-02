"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import * as signalR from "@microsoft/signalr";
import { Swords, Ban, CheckCircle, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/services/apiClient";
import { lobbiesService, Lobby, LobbyPlayer } from "@/services/lobbiesService";
import { mapsService, GameMap } from "@/services/mapsService";
import { useI18n } from "@/contexts/I18nContext";
import Image from "next/image";

export default function LobbyPage() {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const lobbyId = params.id as string;

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [maps, setMaps] = useState<GameMap[]>([]);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

  const steamId = session?.user?.steamId;
  const isAdmin = true; // For now, we assume user can see admin buttons if they have a session. Real app would check ADMIN_STEAM_IDS

  useEffect(() => {
    lobbiesService.getById(parseInt(lobbyId))
      .then(data => setLobby(data as unknown as Lobby))
      .catch(console.error);

    mapsService.getAll()
      .then(data => setMaps(data))
      .catch(console.error);
  }, [lobbyId]);

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/lobby`)
      .withAutomaticReconnect()
      .build();

    newConnection.start()
      .then(() => {
        newConnection.invoke("JoinLobbyGroup", lobbyId);
        newConnection.on("LobbyUpdated", (updatedLobby: Lobby) => {
          setLobby(updatedLobby);
        });
        newConnection.on("LobbyDeleted", () => {
          // Note: Needs locale prefix in real routing
          // Because router isn't aware of locale automatically here without extracting it.
          // In a real app we'd get locale from params.
          const currentLocale = window.location.pathname.split('/')[1] || 'en';
          router.push(`/${currentLocale}/lobby/closed`);
        });
        setConnection(newConnection);
      })
      .catch(e => console.error("Connection failed: ", e));

    return () => {
      newConnection.invoke("LeaveLobbyGroup", lobbyId);
      newConnection.stop();
    };
  }, [lobbyId]);

  const joinTeam = async (teamId: number) => {
    if (!session?.user) return;

    try {
      const updatedLobby = await lobbiesService.join(parseInt(lobbyId), {
        steamId,
        name: session.user.name || "Player",
        avatarUrl: session.user.image || "",
        teamDesignation: teamId
      });
      if (updatedLobby) {
        setLobby(updatedLobby);
      }
    } catch (err: unknown) {
      console.error("Error joining team:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert("Failed to join team: " + errorMessage);
    }
  };

  const randomizeTeams = async () => {
    await lobbiesService.randomizeTeams(parseInt(lobbyId));
  };

  const changeState = async (newState: string) => {
    await lobbiesService.updateState(parseInt(lobbyId), newState);
  };

  const generateMatch = async () => {
    await lobbiesService.generateMatch(parseInt(lobbyId));
  };

  const vetoMap = async (map: string, action: string) => {
    await lobbiesService.vetoMap(parseInt(lobbyId), map, action);
  };

  if (status === "loading" || !lobby) return <div className="p-10 text-white text-center">{t("lobby.loading")}</div>;

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <button onClick={() => signIn("steam")} className="px-6 py-3 bg-indigo-600 text-white rounded-lg">
          {t("lobby.login_steam")}
        </button>
      </div>
    );
  }

  const team1 = lobby.players?.filter(p => p.teamDesignation === 1) || [];
  const team2 = lobby.players?.filter(p => p.teamDesignation === 2) || [];
  const specs = lobby.players?.filter(p => p.teamDesignation === 0) || [];

  const mapPool = lobby.mapPool.split(",");
  const vetoHistory = JSON.parse(lobby.vetoHistory || "[]") as string[];
  const selectedMaps = JSON.parse(lobby.selectedMaps || "[]") as string[];

  const getVetoState = () => {
    if (!lobby || lobby.state !== "Veto") return { team: 0, action: 'none' };

    const historyCount = vetoHistory.length;

    // BO1
    if (lobby.maxMaps === 1) {
      return { team: (historyCount % 2) === 0 ? 1 : 2, action: 'ban' };
    }
    // BO3
    if (lobby.maxMaps === 3) {
      if (historyCount < 2) return { team: (historyCount % 2) === 0 ? 1 : 2, action: 'ban' };
      if (historyCount < 4) return { team: (historyCount % 2) === 0 ? 1 : 2, action: 'pick' };
      return { team: (historyCount % 2) === 0 ? 1 : 2, action: 'ban' };
    }
    // BO5
    if (lobby.maxMaps === 5) {
      if (historyCount < 2) return { team: (historyCount % 2) === 0 ? 1 : 2, action: 'ban' };
      return { team: (historyCount % 2) === 0 ? 1 : 2, action: 'pick' };
    }
    return { team: 0, action: 'none' };
  };

  const vetoState = getVetoState();
  const activeTeam = vetoState.team;
  const isMyTurn = lobby?.players.some(p => p.steamId === steamId && p.teamDesignation === activeTeam && p.isCaptain) || false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Swords className="text-indigo-500" />
              {lobby.title}
            </h1>
            <p className="text-slate-400 mt-1">{t("lobby.best_of")} {lobby.maxMaps} • {t("lobby.status")}: <span className="text-indigo-400 font-bold uppercase">{lobby.state}</span></p>
          </div>
          <div className="flex gap-3">
            {isAdmin && lobby.state?.toLowerCase() === "waiting" && (
              <>
                <button onClick={randomizeTeams} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium">{t("lobby.randomize_teams")}</button>
                <button
                  onClick={() => changeState("Veto")}
                  disabled={team1.length + team2.length < 2}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium"
                >
                  {t("lobby.start_veto")}
                </button>
              </>
            )}
            {isAdmin && lobby.state?.toLowerCase() === "veto" && (
              <>
                <button onClick={() => changeState("Waiting")} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium text-slate-300">{t("lobby.cancel_veto")}</button>
                <button onClick={generateMatch} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium">{t("lobby.finish_veto")}</button>
              </>
            )}
          </div>
        </div>

        {lobby.state?.toLowerCase() === "veto" && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Ban className="text-red-500" /> {t("lobby.veto_phase")}</h2>

            <div className="mb-6 space-y-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase">{t("lobby.veto_history")}</h3>
              <div className="flex flex-wrap gap-2">
                {vetoHistory.map((vh, idx) => {
                  const [action, map] = vh.split(":");
                  return (
                    <span key={idx} className={`px-3 py-1 rounded text-sm font-medium ${action === 'ban' ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                      {action.toUpperCase()} {map}
                    </span>
                  );
                })}
              </div>
            </div>

            {vetoHistory.length < mapPool.length && activeTeam !== 0 && (
              <div className={`p-4 rounded-lg mb-6 text-center font-bold text-xl border shadow-lg ${activeTeam === 1 ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-400' : 'bg-orange-900/30 border-orange-500/50 text-orange-400'}`}>
                {t("lobby.teams_turn").replace("{team}", activeTeam.toString()).replace("{action}", vetoState.action.toUpperCase())}
              </div>
            )}

            {vetoHistory.length >= mapPool.length && (
              <div className="p-4 rounded-lg mb-6 text-center font-bold text-xl border bg-green-900/30 border-green-500/50 text-green-400 shadow-lg">
                {t("lobby.veto_complete")}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {mapPool.map(map => {
                const isBanned = vetoHistory.some(vh => vh === `ban:${map}`);
                const isPicked = vetoHistory.some(vh => vh === `pick:${map}`);
                const isAvailable = !isBanned && !isPicked;

                const mapData = maps.find(m => (m.isCommunity ? `ws:${m.identifier}` : m.identifier) === map);
                const mapImage = mapData?.imageUrl || "https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/csgo/panorama/images/backgrounds/blacksite.png";
                const mapBadge = mapData?.badgeUrl;
                const cleanMapName = mapData?.displayName || map.replace(/^ws:\d+:/, "").replace("de_", "").toUpperCase();

                const isClickable = isAvailable && isMyTurn;

                return (
                  <div
                    key={map}
                    onClick={() => {
                      if (isClickable) {
                        vetoMap(map, vetoState.action);
                      }
                    }}
                    className={`relative overflow-hidden rounded-lg border flex flex-col items-center justify-between h-40 p-3 text-center transition-all bg-cover bg-center
                    ${isBanned ? 'border-red-900/50 opacity-30 grayscale' : isPicked ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'border-slate-700'}
                    ${isClickable ? 'cursor-pointer hover:border-indigo-400 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transform hover:scale-105' : ''}`}
                    style={{ backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%), url(${mapImage})` }}
                  >
                    {mapBadge && (
                      <Image src={mapBadge} alt={cleanMapName} width={32} height={32} className="absolute top-1.5 right-1.5 object-contain drop-shadow-lg" unoptimized />
                    )}
                    <span className="font-extrabold tracking-wider text-sm mt-2 text-white drop-shadow-md">{cleanMapName}</span>

                    {isClickable && (
                      <div className="mt-auto w-full text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded shadow-md uppercase ${vetoState.action === 'ban' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                          {t("lobby.click_to").replace("{action}", vetoState.action)}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {lobby.state?.toLowerCase() === "ready" && (
          <div className="bg-green-900/20 border border-green-900/50 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-green-400 flex items-center gap-2"><CheckCircle /> {t("lobby.match_ready")}</h2>
            <p className="mb-4 text-slate-300">{t("lobby.match_ready_desc")}</p>
            <div className="bg-slate-950 p-4 rounded-lg flex items-center justify-between border border-slate-800">
              <code className="text-indigo-300">matchzy_loadmatch_url {API_BASE_URL}/api/v1/lobbies/{lobbyId}/config.json</code>
              <button
                onClick={() => navigator.clipboard.writeText(`matchzy_loadmatch_url ${API_BASE_URL}/api/v1/lobbies/${lobbyId}/config.json`)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-sm"
              >
                {t("lobby.copy")}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-indigo-900/40 p-4 border-b border-indigo-900/50 flex justify-between items-center">
              <h2 className="font-bold text-indigo-300">{t("lobby.team_a")}</h2>
              <span className="text-sm font-medium">{team1.length}/5</span>
            </div>
            <div className="p-2 min-h-[300px]">
              {team1.map(p => (
                <div key={p.steamId} className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-lg mb-2 border border-slate-800">
                  <Image src={p.avatarUrl || `https://ui-avatars.com/api/?name=${p.name}`} width={32} height={32} className="rounded" alt="avatar" unoptimized />
                  <span className={`font-medium truncate ${p.steamId === steamId ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''}`}>
                    {p.name} {p.steamId === steamId && " (You)"}
                  </span>
                </div>
              ))}
              {team1.length < 5 && lobby.state?.toLowerCase() === "waiting" && (
                <button onClick={() => joinTeam(1)} className="w-full p-4 border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-900/20 rounded-lg text-slate-400 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> {t("lobby.join_team_a")}
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="font-bold text-slate-300">{t("lobby.spectators")}</h2>
              <span className="text-sm font-medium">{specs.length}</span>
            </div>
            <div className="p-2 min-h-[300px]">
              {specs.map(p => (
                <div key={p.steamId} className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-lg mb-2 border border-slate-800">
                  <Image src={p.avatarUrl || `https://ui-avatars.com/api/?name=${p.name}`} width={32} height={32} className="rounded" alt="avatar" unoptimized />
                  <span className={`font-medium truncate ${p.steamId === steamId ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''}`}>
                    {p.name} {p.steamId === steamId && " (You)"}
                  </span>
                </div>
              ))}
              {lobby.state?.toLowerCase() === "waiting" && (
                <button onClick={() => joinTeam(0)} className="w-full p-4 border-2 border-dashed border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 rounded-lg text-slate-400 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> {t("lobby.join_specs")}
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-orange-900/40 p-4 border-b border-orange-900/50 flex justify-between items-center">
              <h2 className="font-bold text-orange-300">{t("lobby.team_b")}</h2>
              <span className="text-sm font-medium">{team2.length}/5</span>
            </div>
            <div className="p-2 min-h-[300px]">
              {team2.map(p => (
                <div key={p.steamId} className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-lg mb-2 border border-slate-800">
                  <Image src={p.avatarUrl || `https://ui-avatars.com/api/?name=${p.name}`} width={32} height={32} className="rounded" alt="avatar" unoptimized />
                  <span className={`font-medium truncate ${p.steamId === steamId ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''}`}>
                    {p.name} {p.steamId === steamId && " (You)"}
                  </span>
                </div>
              ))}
              {team2.length < 5 && lobby.state?.toLowerCase() === "waiting" && (
                <button onClick={() => joinTeam(2)} className="w-full p-4 border-2 border-dashed border-slate-700 hover:border-orange-500 hover:bg-orange-900/20 rounded-lg text-slate-400 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> {t("lobby.join_team_b")}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
