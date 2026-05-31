import Link from "next/link";
import { Ban } from "lucide-react";

export default function LobbyClosedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-lg text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-900/30 rounded-full">
            <Ban className="w-12 h-12 text-red-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Lobby Closed</h1>
        <p className="text-slate-400 mb-8">
          This lobby has been closed or deleted by an administrator.
        </p>
        <Link 
          href="/"
          className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors w-full"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
