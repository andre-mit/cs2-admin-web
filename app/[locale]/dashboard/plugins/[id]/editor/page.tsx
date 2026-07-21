"use client";

import { useState, useEffect, use } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { FileNode, pluginsService, GamePlugin } from "@/services/pluginsService";
import { File, Folder, ChevronRight, ChevronDown, Save, FilePlus, Trash2, ArrowLeft, FileCode } from "lucide-react";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import { ConfirmModal } from "@/components/ConfirmModal";
import useSWR from "swr";
import { swrFetcher } from "@/services/apiClient";

function FileTreeNode({ 
  node, 
  onSelect, 
  selectedPath, 
  depth = 0 
}: { 
  node: FileNode; 
  onSelect: (path: string) => void; 
  selectedPath: string | null;
  depth?: number;
}) {
  const [isOpen, setIsOpen] = useState(true);

  if (!node.isDirectory) {
    const isSelected = selectedPath === node.path;
    return (
      <div 
        className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-slate-700/50 rounded-sm ${isSelected ? 'bg-slate-700/80 text-emerald-400' : 'text-slate-300'}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelect(node.path)}
      >
        <File className="w-4 h-4 shrink-0" />
        <span className="text-sm truncate select-none">{node.name}</span>
      </div>
    );
  }

  return (
    <div>
      {node.name && (
        <div 
          className="flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-slate-700/50 rounded-sm text-slate-200"
          style={{ paddingLeft: `${(depth - 1) * 12 + 8}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
          <Folder className="w-4 h-4 shrink-0 text-slate-400" />
          <span className="text-sm font-medium truncate select-none">{node.name}</span>
        </div>
      )}
      {isOpen && node.children?.map(child => (
        <FileTreeNode 
          key={child.path} 
          node={child} 
          onSelect={onSelect} 
          selectedPath={selectedPath}
          depth={node.name ? depth + 1 : depth} 
        />
      ))}
    </div>
  );
}

export default function PluginEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pluginId = parseInt(id, 10);
  const { t } = useI18n();

  const { data: plugin } = useSWR<GamePlugin>(`/api/v1/plugins/${pluginId}`, swrFetcher);

  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newFilePath, setNewFilePath] = useState("");
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [deleteConfirmPath, setDeleteConfirmPath] = useState<string | null>(null);

  const loadTree = async () => {
    try {
      const tree = await pluginsService.getFileTree(pluginId);
      setFileTree(tree);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTree();
  }, [pluginId]);

  const handleSelectFile = async (path: string) => {
    if (selectedPath === path) return;
    
    // Warn if unsaved changes
    if (fileContent !== originalContent) {
      if (!confirm(t("plugins.unsaved_changes") || "You have unsaved changes. Discard?")) {
        return;
      }
    }

    setSelectedPath(path);
    setIsLoadingFile(true);
    setFileContent("");
    setOriginalContent("");
    try {
      const result = await pluginsService.getFileContent(pluginId, path);
      setFileContent(result.content);
      setOriginalContent(result.content);
    } catch (err) {
      console.error(err);
      alert("Error loading file. It might be a binary file.");
      setSelectedPath(null);
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPath) return;
    setIsSaving(true);
    try {
      await pluginsService.saveFileContent(pluginId, selectedPath, fileContent);
      setOriginalContent(fileContent);
      alert(t("plugins.file_saved") || "File saved successfully");
    } catch (err) {
      console.error(err);
      alert("Error saving file");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath) return;
    
    try {
      await pluginsService.saveFileContent(pluginId, newFilePath, "");
      await loadTree();
      setIsCreatingFile(false);
      handleSelectFile(newFilePath);
      setNewFilePath("");
    } catch (err) {
      console.error(err);
      alert("Error creating file");
    }
  };

  const handleDeleteFile = async () => {
    if (!deleteConfirmPath) return;
    try {
      await pluginsService.deleteFile(pluginId, deleteConfirmPath);
      await loadTree();
      if (selectedPath === deleteConfirmPath) {
        setSelectedPath(null);
        setFileContent("");
        setOriginalContent("");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting file/folder");
    } finally {
      setDeleteConfirmPath(null);
    }
  };

  const getLanguage = (path: string) => {
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".cfg")) return "ini";
    if (path.endsWith(".ini")) return "ini";
    if (path.endsWith(".xml")) return "xml";
    if (path.endsWith(".html")) return "html";
    if (path.endsWith(".js") || path.endsWith(".ts")) return "javascript";
    return "plaintext";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/plugins" 
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("plugins.back") || "Back"}
          </Link>
          <div className="h-4 w-px bg-slate-700" />
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            {plugin ? plugin.name : "..."} <span className="text-sm font-normal text-slate-400">IDE</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingFile(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md text-sm transition-colors border border-slate-700"
          >
            <FilePlus className="w-4 h-4" />
            {t("plugins.new_file") || "New File"}
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedPath || isSaving || fileContent === originalContent}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "..." : t("plugins.save") || "Save"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
          <div className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700/50">
            {t("plugins.explorer") || "Explorer"}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {fileTree ? (
              <FileTreeNode node={fileTree} onSelect={handleSelectFile} selectedPath={selectedPath} />
            ) : (
              <div className="text-slate-500 text-sm p-2">Loading...</div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-[#1e1e1e] relative flex flex-col">
          {selectedPath ? (
            <>
              <div className="flex items-center justify-between bg-[#2d2d2d] border-b border-[#1e1e1e]">
                <div className="flex items-center bg-[#1e1e1e] px-4 py-2 border-t-2 border-emerald-500 text-sm text-slate-200">
                  <File className="w-4 h-4 mr-2 text-emerald-400" />
                  {selectedPath.split('/').pop()}
                  {fileContent !== originalContent && <span className="ml-2 w-2 h-2 rounded-full bg-emerald-500"></span>}
                </div>
                <button
                  onClick={() => setDeleteConfirmPath(selectedPath)}
                  className="mr-3 text-slate-400 hover:text-red-400 transition-colors"
                  title="Delete File"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 relative">
                {isLoadingFile ? (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                    Loading file...
                  </div>
                ) : (
                  <Editor
                    height="100%"
                    language={getLanguage(selectedPath)}
                    theme="vs-dark"
                    value={fileContent}
                    onChange={(val) => setFileContent(val || "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: "on",
                      padding: { top: 16 },
                      scrollBeyondLastLine: false,
                    }}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <FileCode className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a file to start editing</p>
            </div>
          )}
        </div>
      </div>

      {isCreatingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Create New File</h3>
            <form onSubmit={handleCreateFile}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  File Path
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  placeholder="addons/counterstrikesharp/plugins/MyPlugin/config.json"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Enter the relative path. Folders will be created automatically if they don't exist.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingFile(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirmPath !== null}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${deleteConfirmPath}? This cannot be undone.`}
        onConfirm={handleDeleteFile}
        onCancel={() => setDeleteConfirmPath(null)}
      />
    </div>
  );
}
