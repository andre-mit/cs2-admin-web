import { X, Loader2, Play, Square, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { serversService } from "@/services/serversService";
import { getAuthToken } from "@/services/apiClient";
import { useI18n } from "@/contexts/I18nContext";

interface ServerLogsModalProps {
  serverId: number;
  serverName: string;
  onClose: () => void;
}

export function ServerLogsModal({ serverId, serverName, onClose }: ServerLogsModalProps) {
  const { t } = useI18n();
  const [logs, setLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startStreaming();
    return () => {
      stopStreaming();
    };
  }, [serverId]);

  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const startStreaming = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setError("Unauthorized to view logs");
        return;
      }
      
      setIsStreaming(true);
      setError(null);
      setLogs([]); // Clear previous logs
      
      eventSourceRef.current = serversService.getLogsStream(
        serverId, 
        token,
        (data) => {
          if (data && data.log) {
            setLogs(prev => [...prev, data.log]);
          }
        },
        (err) => {
          console.error("SSE Logs Error:", err);
          // Don't set error on normal disconnect, just stop streaming
          setIsStreaming(false);
          eventSourceRef.current?.close();
        }
      );
    } catch (err) {
      setError("Failed to start log stream.");
      setIsStreaming(false);
    }
  };

  const stopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleScroll = () => {
    if (!logsContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    // If user scrolled up by more than 20px, disable autoscroll
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 20;
    setAutoScroll(isAtBottom);
  };

  const downloadLogs = () => {
    const blob = new Blob([logs.join("")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `server-${serverId}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400">&gt;_</span>
              {serverName} Logs
            </h2>
            <div className="flex items-center gap-2 ml-4">
              {isStreaming ? (
                <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                  <Loader2 className="w-3 h-3 animate-spin" /> Live
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                  <Square className="w-3 h-3" /> Stopped
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={isStreaming ? stopStreaming : startStreaming}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 px-3 ${
                isStreaming 
                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              {isStreaming ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="text-sm font-medium">{isStreaming ? "Stop" : "Resume"}</span>
            </button>
            <button
              onClick={downloadLogs}
              title="Download Logs"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <Download className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-slate-700 mx-2"></div>
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Logs Container */}
        <div 
          ref={logsContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-black p-4 font-mono text-sm leading-relaxed custom-scrollbar"
        >
          {logs.length === 0 && !error ? (
            <div className="h-full flex items-center justify-center text-slate-500 italic">
              {isStreaming ? "Waiting for logs..." : "No logs available."}
            </div>
          ) : (
            <pre className="text-slate-300 whitespace-pre-wrap break-words m-0">
              {logs.join("")}
            </pre>
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-2 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs text-slate-500">
          <span>{logs.length} lines</span>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-300 transition-colors">
            <input 
              type="checkbox" 
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900" 
            />
            Auto-scroll
          </label>
        </div>

      </div>
    </div>
  );
}
