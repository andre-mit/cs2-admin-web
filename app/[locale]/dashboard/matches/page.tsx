import { Shield, Plus, Filter } from "lucide-react";
import { getDictionary } from "@/lib/i18n";

export default async function MatchesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = (await getDictionary(locale)).matches;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-500" />
            {t.title}
          </h1>
          <p className="text-slate-400 mt-1">{t.description}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          {t.new_match}
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">{t.history}</h2>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-md transition-colors">
            <Filter className="w-4 h-4" />
            {t.filter}
          </button>
        </div>
        
        <div className="p-12 flex flex-col items-center justify-center text-center border-b border-slate-800">
          <Shield className="w-12 h-12 text-slate-700 mb-4" />
          <h3 className="text-lg font-medium text-slate-300">{t.no_matches}</h3>
          <p className="text-slate-500 mt-1">{t.no_matches_desc}</p>
        </div>
      </div>
    </div>
  );
}
