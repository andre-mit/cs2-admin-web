"use client";

import { signIn, useSession } from "next-auth/react";
import { Server, Shield, Activity, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t, locale } = useI18n();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 flex flex-col items-center max-w-3xl text-center px-4">
        <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
          <Server className="w-10 h-10 text-blue-500" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
          CS2 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">{t("landing.title_admin")}</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl leading-relaxed">
          {t("landing.description")}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 w-full max-w-2xl">
          <div className="flex flex-col items-center gap-2 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <Server className="w-6 h-6 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">{t("landing.rcon")}</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <Shield className="w-6 h-6 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">{t("landing.auth")}</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <Activity className="w-6 h-6 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">{t("landing.stats")}</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <Users className="w-6 h-6 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">{t("landing.teams")}</span>
          </div>
        </div>

        {status === "authenticated" ? (
          <button 
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white font-bold rounded-xl transition-all duration-300 flex items-center gap-4 shadow-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Activity className="w-6 h-6" />
            <span className="text-lg">{t("landing.dashboard_btn")}</span>
          </button>
        ) : (
          <button 
            onClick={() => signIn("steam", { callbackUrl: `/${locale}/dashboard` })}
            className="group relative px-8 py-4 bg-[#171a21] hover:bg-[#2a475e] border border-slate-700 hover:border-slate-500 text-white font-bold rounded-xl transition-all duration-300 flex items-center gap-4 shadow-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <svg className="w-7 h-7 fill-current" viewBox="0 0 256 259" xmlns="http://www.w3.org/2000/svg">
              <path d="M127.779 0C57.852 0 .522 55.249 0 124.336l68.567 28.336c5.827-3.991 12.856-6.329 20.427-6.329.679 0 1.351.021 2.019.058l30.565-44.285v-.662c0-25.06 20.393-45.452 45.462-45.452 25.06 0 45.456 20.393 45.456 45.476 0 25.07-20.396 45.453-45.456 45.453h-1.032l-43.56 31.101c.025.534.042 1.072.042 1.617 0 18.854-15.332 34.186-34.195 34.186-16.552 0-30.355-11.849-33.462-27.524L3.765 163.46C18.864 217.543 68.456 258.298 127.779 258.298c70.687 0 127.967-57.28 127.967-127.971C255.746 57.28 198.466 0 127.779 0zM80.232 196.594l-15.586-6.44c2.758 5.748 7.416 10.543 13.508 13.375 13.155 6.113 28.744.37 34.85-12.773 2.961-6.37 3.037-13.44.215-19.871-2.813-6.417-8.005-11.237-14.377-14.213-6.312-2.933-13.15-2.976-19.222-.509l16.104 6.66c9.709 4.517 13.94 16.164 9.433 25.883-4.511 9.72-16.16 13.952-25.873 9.44l.948-.552zM211.545 101.478c0-16.719-13.604-30.312-30.332-30.312-16.74 0-30.342 13.593-30.342 30.312 0 16.737 13.602 30.328 30.342 30.328 16.728 0 30.332-13.591 30.332-30.328zm-53.107-.107c0-12.623 10.199-22.861 22.822-22.861 12.623 0 22.824 10.238 22.824 22.861 0 12.635-10.201 22.872-22.824 22.872-12.623 0-22.822-10.237-22.822-22.872z" fill="white"/>
            </svg>
            <span className="text-lg">{t("landing.login_btn")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
