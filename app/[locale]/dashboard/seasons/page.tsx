import { Trophy, Plus } from "lucide-react";
import { getDictionary } from "@/lib/i18n";

export default async function SeasonsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = (await getDictionary(locale)).seasons;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            {t.title}
          </h1>
          <p className="text-slate-400 mt-1">{t.description}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          {t.create_season}
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm p-12 text-center">
        <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-300">{t.no_seasons}</h3>
        <p className="text-slate-500 mt-1">{t.no_seasons_desc}</p>
      </div>
    </div>
  );
}
