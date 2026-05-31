"use client";

import { signIn } from "next-auth/react";
import { Server, Shield, Activity, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 flex flex-col items-center max-w-3xl text-center px-4">
        <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
          <Server className="w-10 h-10 text-blue-500" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
          CS2 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Admin Pro</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl leading-relaxed">
          The ultimate control panel for managing CS2 instances, matches, and teams. Fully integrated with your game server in real-time.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 w-full max-w-2xl">
          <div className="flex flex-col items-center gap-2 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <Server className="w-6 h-6 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">RCON Ready</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <Shield className="w-6 h-6 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Auth Protected</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <Activity className="w-6 h-6 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Live Stats</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <Users className="w-6 h-6 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Team Mgmt</span>
          </div>
        </div>

        <button 
          onClick={() => signIn("steam", { callbackUrl: "/dashboard" })}
          className="group relative px-8 py-4 bg-[#171a21] hover:bg-[#2a475e] border border-slate-700 hover:border-slate-500 text-white font-bold rounded-xl transition-all duration-300 flex items-center gap-4 shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.979 0C5.353 0 0 5.364 0 11.979c0 4.67 2.668 8.718 6.558 10.732l3.418-4.945c-.067-.282-.103-.574-.103-.873 0-2.33 1.888-4.218 4.218-4.218 2.33 0 4.218 1.888 4.218 4.218 0 2.33-1.888 4.218-4.218 4.218-.62 0-1.205-.133-1.74-.372l-4.708 3.328A11.928 11.928 0 0011.979 24c6.625 0 11.979-5.364 11.979-11.979C23.958 5.364 18.604 0 11.979 0zm4.125 18.618a2.126 2.126 0 11-.001-4.252 2.126 2.126 0 01.001 4.252zm-3.664-2.825l1.637 1.157a3.02 3.02 0 00.038.541c0-1.666 1.35-3.016 3.016-3.016 1.665 0 3.015 1.35 3.015 3.016 0 1.665-1.35 3.015-3.015 3.015a3.013 3.013 0 00-2.583-1.442l-1.633-1.154a2.915 2.915 0 01-.475-2.117zm-1.838 4.31l1.503-1.062a4.114 4.114 0 01-2.913-4.636l-3.323-4.808c-.733-.21-1.523-.323-2.34-.323-4.418 0-8 3.582-8 8s3.582 8 8 8c.95 0 1.86-.166 2.716-.473a2.955 2.955 0 014.357-.698zM5.385 11.455c-1.543 0-2.793 1.25-2.793 2.793 0 1.543 1.25 2.793 2.793 2.793 1.543 0 2.793-1.25 2.793-2.793 0-1.543-1.25-2.793-2.793-2.793zm1.613 2.793a1.614 1.614 0 11-3.228 0 1.614 1.614 0 013.228 0z" />
          </svg>
          <span className="text-lg">Login with Steam</span>
        </button>
      </div>
    </div>
  );
}
