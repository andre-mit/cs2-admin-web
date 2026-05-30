"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Edit, Trash2, Map, Globe, Shield, Upload, Link } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface GameMap {
  id: number;
  displayName: string;
  identifier: string;
  isCommunity: boolean;
  imageUrl: string;
  badgeUrl: string | null;
}

type ImageMode = "url" | "upload";

async function uploadToS3(file: File, mapName: string, imageType: "background" | "badge"): Promise<string> {
  const sanitizedMap = mapName.trim() || "temp";
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/uploads/presigned-url?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}&mapName=${encodeURIComponent(sanitizedMap)}&imageType=${encodeURIComponent(imageType)}`
    );
    const data = await res.json() as { uploadUrl: string; publicUrl: string };

    await fetch(data.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type }
    });

    return data.publicUrl;
  } catch (error) {
    console.warn("Direct upload to S3 failed. Falling back to backend proxy upload:", error);
    
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/uploads?mapName=${encodeURIComponent(sanitizedMap)}&imageType=${encodeURIComponent(imageType)}`,
      {
        method: "POST",
        body: formData
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Upload failed: ${errText}`);
    }

    const data = await res.json() as { publicUrl: string };
    return data.publicUrl;
  }
}

export default function MapsPage() {
  const { data: mapsData, mutate: fetchMaps } = useSWR<GameMap[]>(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/maps`, fetcher);
  const maps = mapsData || [];

  const [isEditing, setIsEditing] = useState(false);
  const [currentMap, setCurrentMap] = useState<Partial<GameMap>>({
    displayName: "",
    identifier: "",
    isCommunity: false,
    imageUrl: "",
    badgeUrl: null
  });

  const [bgMode, setBgMode] = useState<ImageMode>("url");
  const [badgeMode, setBadgeMode] = useState<ImageMode>("url");
  const [bgUploading, setBgUploading] = useState(false);
  const [badgeUploading, setBadgeUploading] = useState(false);

  const handleBgFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgUploading(true);
    const mapName = currentMap.identifier || currentMap.displayName || file.name.split('.')[0];
    const url = await uploadToS3(file, mapName, "background");
    setCurrentMap(prev => ({ ...prev, imageUrl: url }));
    setBgUploading(false);
  };

  const handleBadgeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBadgeUploading(true);
    const mapName = currentMap.identifier || currentMap.displayName || file.name.split('.')[0];
    const url = await uploadToS3(file, mapName, "badge");
    setCurrentMap(prev => ({ ...prev, badgeUrl: url }));
    setBadgeUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = currentMap.id ? "PUT" : "POST";
    const url = currentMap.id 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/maps/${currentMap.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/maps`;

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentMap)
    });

    setIsEditing(false);
    setCurrentMap({ displayName: "", identifier: "", isCommunity: false, imageUrl: "", badgeUrl: null });
    fetchMaps();
  };

  const deleteMap = async (id: number) => {
    if (!confirm("Are you sure you want to delete this map?")) return;
    
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/maps/${id}`, { method: "DELETE" });
    fetchMaps();
  };

  const handleEdit = (map: GameMap) => {
    setCurrentMap(map);
    setBgMode(map.imageUrl ? "url" : "url");
    setBadgeMode(map.badgeUrl ? "url" : "url");
    setIsEditing(true);
  };

  const openNew = () => {
    setCurrentMap({ displayName: "", identifier: "", isCommunity: false, imageUrl: "", badgeUrl: null });
    setBgMode("url");
    setBadgeMode("url");
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Map className="text-indigo-500" />
          Maps
        </h1>
        <button 
          onClick={openNew}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Map
        </button>
      </div>

      {isEditing && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">{currentMap.id ? 'Edit Map' : 'New Map'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Display Name (e.g. Dust 2)</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  value={currentMap.displayName}
                  onChange={e => setCurrentMap({...currentMap, displayName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Identifier (e.g. de_dust2 or Workshop ID)</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  value={currentMap.identifier}
                  onChange={e => setCurrentMap({...currentMap, identifier: e.target.value})}
                />
              </div>
            </div>

            {/* Background Image */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-400">Background Image</label>
                <div className="flex gap-1 text-xs">
                  <button type="button" onClick={() => setBgMode("url")} className={`px-2 py-0.5 rounded flex items-center gap-1 ${bgMode === "url" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                    <Link className="w-3 h-3" /> URL
                  </button>
                  <button type="button" onClick={() => setBgMode("upload")} className={`px-2 py-0.5 rounded flex items-center gap-1 ${bgMode === "upload" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                    <Upload className="w-3 h-3" /> Upload
                  </button>
                </div>
              </div>
              {bgMode === "url" ? (
                <input 
                  type="url" required
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  value={currentMap.imageUrl}
                  onChange={e => setCurrentMap({...currentMap, imageUrl: e.target.value})}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 border border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors text-slate-400 text-sm">
                    <Upload className="w-4 h-4" />
                    {bgUploading ? "Uploading..." : currentMap.imageUrl ? "File uploaded ✓" : "Choose file"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleBgFile} disabled={bgUploading} />
                  </label>
                </div>
              )}
              {currentMap.imageUrl && (
                <div className="mt-2 h-20 w-full rounded-lg bg-cover bg-center border border-slate-800" style={{ backgroundImage: `url(${currentMap.imageUrl})` }} />
              )}
            </div>

            {/* Badge Image */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-400">Badge Image <span className="text-slate-600">(optional)</span></label>
                <div className="flex gap-1 text-xs">
                  <button type="button" onClick={() => setBadgeMode("url")} className={`px-2 py-0.5 rounded flex items-center gap-1 ${badgeMode === "url" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                    <Link className="w-3 h-3" /> URL
                  </button>
                  <button type="button" onClick={() => setBadgeMode("upload")} className={`px-2 py-0.5 rounded flex items-center gap-1 ${badgeMode === "upload" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                    <Upload className="w-3 h-3" /> Upload
                  </button>
                </div>
              </div>
              {badgeMode === "url" ? (
                <input 
                  type="url"
                  placeholder="https://... (optional)"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  value={currentMap.badgeUrl || ""}
                  onChange={e => setCurrentMap({...currentMap, badgeUrl: e.target.value || null})}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 border border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors text-slate-400 text-sm">
                    <Upload className="w-4 h-4" />
                    {badgeUploading ? "Uploading..." : currentMap.badgeUrl ? "File uploaded ✓" : "Choose file"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleBadgeFile} disabled={badgeUploading} />
                  </label>
                </div>
              )}
              {currentMap.badgeUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={currentMap.badgeUrl} alt="Badge preview" className="h-16 w-16 object-contain rounded-lg border border-slate-800 bg-slate-950 p-1" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input 
                type="checkbox" 
                id="isCommunity"
                checked={currentMap.isCommunity}
                onChange={e => setCurrentMap({...currentMap, isCommunity: e.target.checked})}
                className="w-4 h-4 text-indigo-600 rounded bg-slate-950 border-slate-800"
              />
              <label htmlFor="isCommunity" className="text-sm font-medium text-slate-300">Workshop / Community Map?</label>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg" disabled={bgUploading || badgeUploading}>
                {bgUploading || badgeUploading ? "Uploading..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {maps.map(map => (
          <div key={map.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg group">
            <div 
              className="h-32 bg-cover bg-center border-b border-slate-800 relative"
              style={{ backgroundImage: `url(${map.imageUrl})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded text-xs">
                {map.isCommunity ? <Globe className="w-3 h-3 text-blue-400" /> : <Shield className="w-3 h-3 text-yellow-400" />}
                {map.isCommunity ? 'Workshop' : 'Official'}
              </div>
              {map.badgeUrl && (
                <img src={map.badgeUrl} alt={`${map.displayName} badge`} className="absolute top-2 right-2 h-10 w-10 object-contain drop-shadow-lg" />
              )}
            </div>
            
            <div className="p-4 relative">
              <h3 className="font-bold text-lg">{map.displayName}</h3>
              <p className="text-slate-400 text-sm font-mono">{map.identifier}</p>
              
              <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 bottom-4">
                <button onClick={() => handleEdit(map)} className="p-2 bg-slate-800 hover:bg-indigo-600 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                <button onClick={() => deleteMap(map.id)} className="p-2 bg-slate-800 hover:bg-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {maps.length === 0 && !isEditing && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No maps registered. Add one by clicking the button above.
          </div>
        )}
      </div>
    </div>
  );
}
